import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import { CustomerForm } from './_components/CustomerForm'
import { CustomerSearch } from './_components/CustomerSearch'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('customers')
    .select('*, contacts(id), subsidiaries:customers!parent_id(id)')
    .order('company_name')

  if (q) {
    query = query.or(`company_name.ilike.%${q}%,tax_id.ilike.%${q}%`)
  }

  const { data: allCustomers } = await query

  // 無搜尋時只顯示頂層（parent_id = null）
  const displayed = q
    ? (allCustomers ?? [])
    : (allCustomers ?? []).filter((c) => c.parent_id === null)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">客戶管理</h1>
        <CustomerForm mode="create" allCustomers={allCustomers ?? []} />
      </div>

      <div className="flex items-center gap-3 mb-5">
        <Suspense>
          <CustomerSearch />
        </Suspense>
        {q && (
          <span className="text-sm text-slate-500">
            找到 {displayed.length} 筆結果
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {displayed.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">
            {q ? '找不到符合的客戶' : '尚無客戶資料'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-medium text-slate-500">公司名稱</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">統一編號</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">聯絡人</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">子公司</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">到期提醒</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((c) => {
                const contactCount = (c.contacts as { id: string }[]).length
                const subsidiaryCount = (c.subsidiaries as { id: string }[]).length
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/customers/${c.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {c.company_name}
                        </Link>
                        {q && c.parent_id && (
                          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            子公司
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{c.tax_id ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500">{contactCount} 人</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {subsidiaryCount > 0 ? `${subsidiaryCount} 家` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      到期前 {c.reminder_months_before} 個月
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
