'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateCommissionSchedule } from '@/lib/commission/calculate'

// ── 報價單號產生 ───────────────────────────────────────────────
// 格式：Q + YY + MM + DD + 2位流水號（每日重置）
// 範例：Q26032801

async function generateQuoteNumber(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const prefix = `Q${yy}${mm}${dd}`

  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .like('quote_number', `${prefix}%`)

  const seq = String((count ?? 0) + 1).padStart(2, '0')
  return `${prefix}${seq}`
}

// ── 分潤年份計算 ───────────────────────────────────────────────
// 計算這張訂單是客戶的第幾年（查該客戶已付款主合約數量）

async function calcCommissionYear(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerId: string,
  currentOrderId: string
): Promise<number> {
  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('is_main_contract', true)
    .eq('status', 'paid')
    .neq('id', currentOrderId)

  return (count ?? 0) + 1
}

// ── Order CRUD ────────────────────────────────────────────────

export async function createOrder(formData: FormData) {
  const supabase = await createClient()
  const quoteNumber = await generateQuoteNumber(supabase)

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_id: formData.get('customer_id') as string,
      quote_number: quoteNumber,
      quote_date: formData.get('quote_date') as string,
      invoice_date: (formData.get('invoice_date') as string) || null,
      contract_start_date: (formData.get('contract_start_date') as string) || null,
      contract_end_date: (formData.get('contract_end_date') as string) || null,
      is_main_contract: formData.get('is_main_contract') === 'true',
      is_active: formData.get('is_active') === 'true',
      quote_url: (formData.get('quote_url') as string) || null,
      contract_url: (formData.get('contract_url') as string) || null,
      invoice_url: (formData.get('invoice_url') as string) || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  // 儲存訂單項目
  await saveOrderItems(supabase, order.id, formData)

  redirect(`/orders/${order.id}`)
}

export async function updateOrder(orderId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('orders')
    .update({
      customer_id: formData.get('customer_id') as string,
      quote_date: formData.get('quote_date') as string,
      invoice_date: (formData.get('invoice_date') as string) || null,
      contract_start_date: (formData.get('contract_start_date') as string) || null,
      contract_end_date: (formData.get('contract_end_date') as string) || null,
      is_main_contract: formData.get('is_main_contract') === 'true',
      is_active: formData.get('is_active') === 'true',
      quote_url: (formData.get('quote_url') as string) || null,
      contract_url: (formData.get('contract_url') as string) || null,
      invoice_url: (formData.get('invoice_url') as string) || null,
    })
    .eq('id', orderId)
    .select('status')
    .single()

  if (error) throw new Error(error.message)

  // 已付款的訂單不重寫 items，避免 cascade delete 刪掉 commission_schedule_items
  if (updated?.status !== 'paid') {
    await saveOrderItems(supabase, orderId, formData)
  }

  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/commissions')
}

// 刪除舊 items 再重新插入（最簡單的做法）
async function saveOrderItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  formData: FormData
) {
  await supabase.from('order_items').delete().eq('order_id', orderId)

  const names = formData.getAll('item_name') as string[]
  if (!names.length) return

  const items = names.map((name, i) => ({
    order_id: orderId,
    sequence_number: i + 1,
    name,
    quantity: Number(formData.getAll('item_quantity')[i]) || 1,
    unit: (formData.getAll('item_unit')[i] as string) || null,
    unit_price: Number(formData.getAll('item_unit_price')[i]) || 0,
    is_commissionable: formData.getAll('item_commissionable')[i] === 'true',
  }))

  const { error } = await supabase.from('order_items').insert(items)
  if (error) throw new Error(error.message)

  // 更新訂單總計
  await recalcOrderTotals(supabase, orderId)
}

async function recalcOrderTotals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string
) {
  const { data: items } = await supabase
    .from('order_items')
    .select('subtotal')
    .eq('order_id', orderId)

  const subtotal = (items ?? []).reduce((sum, item) => sum + Number(item.subtotal), 0)
  const taxAmount = Math.round(subtotal * 0.05 * 100) / 100
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100

  await supabase
    .from('orders')
    .update({ subtotal, tax_amount: taxAmount, total_amount: totalAmount })
    .eq('id', orderId)
}

// ── 狀態推進 ──────────────────────────────────────────────────

const STATUS_FLOW = ['pending', 'quote_issued', 'invoice_issued', 'paid'] as const

export async function advanceOrderStatus(orderId: string, currentStatus: string) {
  const supabase = await createClient()
  const currentIndex = STATUS_FLOW.indexOf(currentStatus as typeof STATUS_FLOW[number])
  if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return

  const nextStatus = STATUS_FLOW[currentIndex + 1]
  const updates: Record<string, unknown> = { status: nextStatus }

  if (nextStatus === 'paid') {
    const today = new Date().toISOString().split('T')[0]
    updates.payment_date = today

    // 取訂單資料來計算分潤
    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (order?.is_main_contract) {
      const commissionYear = await calcCommissionYear(supabase, order.customer_id, orderId)
      updates.commission_year = commissionYear

      const schedule = generateCommissionSchedule({
        paymentDate: new Date(today),
        commissionYear,
        isMainContract: true,
        items: (order.order_items ?? []).map((item: { id: string; subtotal: number; is_commissionable: boolean }) => ({
          id: item.id,
          subtotal: Number(item.subtotal),
          isCommissionable: item.is_commissionable,
        })),
      })

      // 寫入分潤排程
      for (const entry of schedule) {
        const { data: cs } = await supabase
          .from('commission_schedules')
          .insert({
            order_id: orderId,
            period_number: entry.periodNumber,
            disbursement_date: entry.disbursementDate.toISOString().split('T')[0],
            commission_rate: entry.commissionRate,
            total_commission_amount: entry.totalCommissionAmount,
          })
          .select('id')
          .single()

        if (cs) {
          const { error: itemsError } = await supabase.from('commission_schedule_items').insert(
            entry.items.map((item) => ({
              commission_schedule_id: cs.id,
              order_item_id: item.orderItemId,
              item_subtotal: item.itemSubtotal,
              commission_amount: item.commissionAmount,
            }))
          )
          if (itemsError) throw new Error(`commission_schedule_items insert failed: ${itemsError.message}`)
        }
      }
    }
  }

  const { error } = await supabase.from('orders').update(updates).eq('id', orderId)
  if (error) throw new Error(error.message)

  revalidatePath(`/orders/${orderId}`)
}
