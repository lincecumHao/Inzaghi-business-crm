import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CustomerForm } from '../_components/CustomerForm'
import { ContactSection } from './_components/ContactSection'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: customer }, { data: allCustomers }, { data: contacts }, { data: subsidiaries }] =
    await Promise.all([
      supabase.from('customers').select('*').eq('id', id).single(),
      supabase.from('customers').select('*').order('company_name'),
      supabase.from('contacts').select('*').eq('customer_id', id).order('created_at'),
      supabase.from('customers').select('*').eq('parent_id', id).order('company_name'),
    ])

  if (!customer) notFound()

  // 分開查母公司，避免 Supabase 關聯查詢回傳 [] 而非 null 的問題
  const { data: parent } = customer.parent_id
    ? await supabase.from('customers').select('id, company_name').eq('id', customer.parent_id).single()
    : { data: null }

  return (
    <div className="p-8 max-w-3xl mx-auto flex flex-col gap-8">

      {/* 麵包屑 */}
      <nav className="text-sm text-slate-500 flex items-center gap-1.5">
        <Link href="/customers" className="hover:text-slate-700">客戶管理</Link>
        <span>/</span>
        {parent && (
          <>
            <Link href={`/customers/${parent.id}`} className="hover:text-slate-700">{parent.company_name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-800">{customer.company_name}</span>
      </nav>

      {/* 客戶資料 */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{customer.company_name}</h1>
            {parent && (
              <p className="text-sm text-slate-400 mt-0.5">
                隸屬於{' '}
                <Link href={`/customers/${parent.id}`} className="text-blue-600 hover:underline">
                  {parent.company_name}
                </Link>
              </p>
            )}
          </div>
          <CustomerForm mode="edit" customer={customer} allCustomers={allCustomers ?? []} />
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mt-4">
          <InfoRow label="統一編號" value={customer.tax_id} />
          <InfoRow label="地址" value={customer.address} />
          <InfoRow label="到期提醒" value={`到期前 ${customer.reminder_months_before} 個月`} />
        </dl>
      </section>

      {/* 子公司 */}
      {subsidiaries && subsidiaries.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-3">子公司</h2>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {subsidiaries.map((s) => (
              <Link
                key={s.id}
                href={`/customers/${s.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-medium text-blue-600">{s.company_name}</span>
                <span className="text-xs text-slate-400">{s.tax_id ?? ''}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 聯絡人 */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <ContactSection customerId={id} contacts={contacts ?? []} />
      </section>

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
