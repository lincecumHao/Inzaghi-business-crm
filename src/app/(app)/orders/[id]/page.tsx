import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrderForm } from '../_components/OrderForm'
import { StatusBadge, STATUS_LABELS } from '../_components/StatusBadge'
import { AdvanceStatusButton } from './_components/AdvanceStatusButton'

const STATUS_FLOW = ['pending', 'quote_issued', 'invoice_issued', 'paid']

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: order },
    { data: customers },
    { data: commissionSchedules },
  ] = await Promise.all([
    supabase.from('orders').select('*, customer:customers(id, company_name), order_items(*)').eq('id', id).single(),
    supabase.from('customers').select('*').order('company_name'),
    supabase.from('commission_schedules')
      .select('*, commission_schedule_items(*, order_item:order_items(name, subtotal))')
      .eq('order_id', id)
      .order('period_number'),
  ])

  if (!order) notFound()

  const customer = order.customer as { id: string; company_name: string } | null
  const items = (order.order_items ?? []) as Array<{
    id: string; order_id: string; sequence_number: number; name: string; quantity: number;
    unit: string | null; unit_price: number; subtotal: number; is_commissionable: boolean;
    created_at: string; updated_at: string
  }>

  const currentStatusIndex = STATUS_FLOW.indexOf(order.status)
  const nextStatus = STATUS_FLOW[currentStatusIndex + 1] as string | undefined
  const canAdvance = !!nextStatus

  return (
    <div className="p-8 max-w-3xl mx-auto flex flex-col gap-6">

      {/* 麵包屑 */}
      <nav className="text-sm text-slate-500 flex items-center gap-1.5">
        <Link href="/orders" className="hover:text-slate-700">訂單管理</Link>
        <span>/</span>
        <span className="text-slate-800 font-mono">{order.quote_number}</span>
      </nav>

      {/* 訂單基本資料 */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-slate-800 font-mono">{order.quote_number}</h1>
              <StatusBadge status={order.status} />
              {!order.is_main_contract && (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">加購合約</span>
              )}
            </div>
            {customer && (
              <Link href={`/customers/${customer.id}`} className="text-sm text-blue-600 hover:underline">
                {customer.company_name}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canAdvance && (
              <AdvanceStatusButton orderId={id} currentStatus={order.status} nextLabel={STATUS_LABELS[nextStatus] ?? nextStatus} />
            )}
            <OrderForm mode="edit" order={order} items={items} customers={customers ?? []} />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mt-4">
          <InfoRow label="報價日期" value={order.quote_date} />
          <InfoRow label="報價有效日期" value={order.quote_valid_until} />
          <InfoRow label="合約開始日" value={order.contract_start_date} />
          <InfoRow label="合約結束日" value={order.contract_end_date} />
          {order.payment_date && <InfoRow label="收款日" value={order.payment_date} />}
        </dl>
      </section>

      {/* 項目明細 */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">項目明細</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-2.5 font-medium text-slate-500">項目名稱</th>
              <th className="text-right px-5 py-2.5 font-medium text-slate-500">數量</th>
              <th className="text-left px-5 py-2.5 font-medium text-slate-500">單位</th>
              <th className="text-right px-5 py-2.5 font-medium text-slate-500">單價</th>
              <th className="text-right px-5 py-2.5 font-medium text-slate-500">小計</th>
              <th className="text-center px-5 py-2.5 font-medium text-slate-500">分潤</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 text-slate-700">{item.name}</td>
                <td className="px-5 py-3 text-right text-slate-600">{item.quantity}</td>
                <td className="px-5 py-3 text-slate-500">{item.unit ?? '—'}</td>
                <td className="px-5 py-3 text-right text-slate-600">{Number(item.unit_price).toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-slate-700 font-medium">{Number(item.subtotal).toLocaleString()}</td>
                <td className="px-5 py-3 text-center text-slate-400">{item.is_commissionable ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td colSpan={4} className="px-5 py-3 text-right text-sm text-slate-500">未稅總計</td>
              <td className="px-5 py-3 text-right font-medium">{Number(order.subtotal).toLocaleString()}</td>
              <td></td>
            </tr>
            <tr className="bg-slate-50">
              <td colSpan={4} className="px-5 py-2 text-right text-sm text-slate-500">稅額（5%）</td>
              <td className="px-5 py-2 text-right text-slate-600">{Number(order.tax_amount).toLocaleString()}</td>
              <td></td>
            </tr>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td colSpan={4} className="px-5 py-3 text-right text-sm font-semibold text-slate-700">含稅總計</td>
              <td className="px-5 py-3 text-right font-bold text-slate-800">
                {Number(order.total_amount).toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 })}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* 分潤排程（付款後才顯示） */}
      {commissionSchedules && commissionSchedules.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-700">分潤排程</h2>
            <p className="text-xs text-slate-400 mt-0.5">第 {order.commission_year} 年 · 費率 {commissionSchedules[0]?.commission_rate * 100}%</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-2.5 font-medium text-slate-500">期數</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-500">分潤日期</th>
                <th className="text-right px-5 py-2.5 font-medium text-slate-500">分潤金額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commissionSchedules.map((cs) => (
                <tr key={cs.id}>
                  <td className="px-5 py-3 text-slate-600">第 {cs.period_number} 期</td>
                  <td className="px-5 py-3 text-slate-700">{cs.disbursement_date}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-700">
                    {Number(cs.total_commission_amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value ?? '—'}</dd>
    </>
  )
}
