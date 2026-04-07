import { createClient } from '@/lib/supabase/server'
import { sendReminderEmail } from '@/lib/gmail'

export interface ReminderResult {
  sent: number
  skipped: number
  errors: { orderId: string; email: string; error: string }[]
}

/**
 * 掃描所有需要提醒的合約，寄出提醒信並更新 reminder_sent_at。
 *
 * 條件：
 * - order.is_active = true
 * - customer.is_active = true
 * - order.contract_end_date IS NOT NULL
 * - order.reminder_sent_at IS NULL（每張合約只提醒一次）
 * - 今天距合約到期日 <= customer.reminder_months_before 個月
 * - 合約尚未到期（contract_end_date >= 今天）
 */
export async function processReminders(systemUrl: string, debug = false, force = false): Promise<ReminderResult & { debugLog?: unknown[] }> {
  const supabase = await createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 取未來 12 個月內到期、尚未提醒的訂單（含聯絡人）
  const maxDate = new Date(today)
  maxDate.setMonth(maxDate.getMonth() + 12)

  let query = supabase
    .from('orders')
    .select(`
      id,
      contract_end_date,
      customer:customers(
        id,
        company_name,
        reminder_months_before,
        is_active
      )
    `)
    .eq('is_active', true)
    .not('contract_end_date', 'is', null)
    .gte('contract_end_date', today.toISOString().split('T')[0])
    .lte('contract_end_date', maxDate.toISOString().split('T')[0])

  // force=true 時忽略 reminder_sent_at，否則只取尚未提醒的
  if (!force) query = query.is('reminder_sent_at', null)

  const { data: orders, error } = await query

  if (error) throw new Error(`Failed to fetch orders: ${error.message}`)

  const result: ReminderResult & { debugLog?: unknown[] } = { sent: 0, skipped: 0, errors: [] }
  if (debug) result.debugLog = []

  for (const order of orders ?? []) {
    const customer = order.customer as unknown as {
      id: string
      company_name: string
      reminder_months_before: number
      is_active: boolean
    } | null

    if (!customer?.is_active) {
      if (debug) result.debugLog!.push({ orderId: order.id, skipped: 'customer inactive' })
      result.skipped++; continue
    }

    // 檢查是否到了提醒時間
    const endDate = new Date(order.contract_end_date!)
    const threshold = new Date(today)
    threshold.setMonth(threshold.getMonth() + customer.reminder_months_before)

    if (endDate > threshold) {
      if (debug) result.debugLog!.push({
        orderId: order.id,
        customer: customer.company_name,
        contract_end_date: order.contract_end_date,
        reminder_months_before: customer.reminder_months_before,
        threshold: threshold.toISOString().split('T')[0],
        skipped: 'not in reminder window yet',
      })
      result.skipped++; continue
    }

    const internalEmail = process.env.REMINDER_RECIPIENT_EMAIL
    if (!internalEmail) throw new Error('Missing REMINDER_RECIPIENT_EMAIL env var')

    try {
      await sendReminderEmail({
        to: internalEmail,
        customerName: customer.company_name,
        contractEndDate: order.contract_end_date!,
        systemUrl,
      })
      result.sent++
    } catch (e) {
      result.errors.push({
        orderId: order.id,
        email: internalEmail,
        error: e instanceof Error ? e.message : String(e),
      })
    }

    // 更新 reminder_sent_at（force 模式下跳過，方便重複測試）
    if (!force) {
      await supabase
        .from('orders')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', order.id)
    }
  }

  return result
}
