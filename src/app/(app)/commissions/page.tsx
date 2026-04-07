import { Fragment } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DateRangeFilter } from './_components/DateRangeFilter'

const DEFAULT_START = `${new Date().getFullYear()}-01-01`
const DEFAULT_END = `${new Date().getFullYear()}-12-31`

function formatCurrency(amount: number) {
  return amount.toLocaleString('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  })
}

function formatDate(dateStr: string) {
  return dateStr.replace(/-/g, '/')
}

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>
}) {
  const { start, end } = await searchParams
  const startDate = start ?? DEFAULT_START
  const endDate = end ?? DEFAULT_END

  const supabase = await createClient()

  const { data: schedules } = await supabase
    .from('commission_schedules')
    .select(`
      id,
      period_number,
      disbursement_date,
      commission_rate,
      total_commission_amount,
      order:orders(
        quote_number,
        is_active,
        customer:customers(company_name)
      ),
      items:commission_schedule_items(
        commission_amount,
        item_subtotal,
        order_item:order_items(name)
      )
    `)
    .gte('disbursement_date', startDate)
    .lte('disbursement_date', endDate)
    .order('disbursement_date')

  type Schedule = NonNullable<typeof schedules>[number]

  // 過濾掉停用的訂單
  const activeSchedules = (schedules ?? []).filter((s) => {
    const order = s.order as { is_active: boolean } | null
    return order?.is_active !== false
  })

  const grandTotal = activeSchedules.reduce(
    (sum, s) => sum + Number(s.total_commission_amount),
    0
  )

  // Group by disbursement_date
  const grouped = activeSchedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    const date = s.disbursement_date
    if (!acc[date]) acc[date] = []
    acc[date].push(s)
    return acc
  }, {})

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">分潤報表</h1>
        <DateRangeFilter startDate={startDate} endDate={endDate} />
      </div>

      {!activeSchedules.length ? (
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-10 text-center text-slate-400 text-sm">
          此區間無分潤資料
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">
              {formatDate(startDate)} ～ {formatDate(endDate)}，共 {activeSchedules.length} 筆分潤期
            </span>
            <span className="text-lg font-semibold text-blue-800">
              合計 {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-medium text-slate-500">分潤日期</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500">客戶</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500">報價單號</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500">項目名稱</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500">項目金額</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500">費率</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500">分潤金額</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([date, dateSchedules]) => {
                  const dateTotal = dateSchedules.reduce(
                    (sum, s) => sum + Number(s.total_commission_amount),
                    0
                  )
                  return (
                    <Fragment key={date}>
                      {dateSchedules.map((s) => {
                        const order = s.order as { quote_number: string; customer: { company_name: string } | null } | null
                        const items = s.items as Array<{
                          commission_amount: number
                          item_subtotal: number
                          order_item: { name: string } | null
                        }>
                        return items.map((item, itemIdx) => (
                          <tr
                            key={`${s.id}-${itemIdx}`}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">
                              {itemIdx === 0 ? formatDate(date) : ''}
                            </td>
                            <td className="px-5 py-3.5 text-slate-700">
                              {order?.customer?.company_name ?? '—'}
                            </td>
                            <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">
                              {order?.quote_number ?? '—'}
                            </td>
                            <td className="px-5 py-3.5 text-slate-700">
                              {item.order_item?.name ?? '—'}
                            </td>
                            <td className="px-5 py-3.5 text-right text-slate-600">
                              {formatCurrency(Number(item.item_subtotal))}
                            </td>
                            <td className="px-5 py-3.5 text-right text-slate-500">
                              {(Number(s.commission_rate) * 100).toFixed(0)}%
                            </td>
                            <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                              {formatCurrency(Number(item.commission_amount))}
                            </td>
                          </tr>
                        ))
                      })}
                      {/* Date subtotal */}
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <td colSpan={6} className="px-5 py-2.5 text-right text-xs text-slate-500">
                          {formatDate(date)} 小計
                        </td>
                        <td className="px-5 py-2.5 text-right text-sm font-semibold text-slate-700">
                          {formatCurrency(dateTotal)}
                        </td>
                      </tr>
                    </Fragment>
                  )
                })}

                {/* Grand total */}
                <tr className="bg-blue-50">
                  <td colSpan={6} className="px-5 py-3 text-right text-sm font-semibold text-blue-700">
                    總計
                  </td>
                  <td className="px-5 py-3 text-right text-base font-bold text-blue-800">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
