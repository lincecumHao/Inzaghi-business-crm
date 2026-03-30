import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { OrderForm } from './_components/OrderForm'
import { StatusBadge } from './_components/StatusBadge'

const STATUS_FILTERS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待處理' },
  { value: 'quote_issued', label: '已開報價單' },
  { value: 'invoice_issued', label: '已開發票' },
  { value: 'paid', label: '已付款' },
]

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('*, customer:customers(company_name)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const [{ data: orders }, { data: customers }] = await Promise.all([
    query,
    supabase.from('customers').select('*').order('company_name'),
  ])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">訂單管理</h1>
        <OrderForm mode="create" customers={customers ?? []} />
      </div>

      {/* 狀態篩選 */}
      <div className="flex gap-2 mb-5">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/orders?status=${f.value}` : '/orders'}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              (status ?? '') === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {!orders?.length ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">尚無訂單資料</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-medium text-slate-500">報價單號</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">客戶</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">狀態</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">合約期間</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">含稅總計</th>
                <th className="text-center px-5 py-3 font-medium text-slate-500">主合約</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => {
                const customer = o.customer as { company_name: string } | null
                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/orders/${o.id}`}
                        className="font-medium text-blue-600 hover:underline font-mono text-xs">
                        {o.quote_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{customer?.company_name ?? '—'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {o.contract_start_date && o.contract_end_date
                        ? `${o.contract_start_date} ～ ${o.contract_end_date}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700">
                      {Number(o.total_amount).toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-500">
                      {o.is_main_contract ? '✓' : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
