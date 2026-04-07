'use client'

import { useState } from 'react'
import { createCustomer, updateCustomer } from '../actions'
import type { Customer } from '@/types/database'

type Props =
  | { mode: 'create'; customer?: never; allCustomers: Customer[] }
  | { mode: 'edit'; customer: Customer; allCustomers: Customer[] }

export function CustomerForm({ mode, customer, allCustomers }: Props) {
  const [open, setOpen] = useState(false)

  const action = mode === 'create'
    ? createCustomer
    : updateCustomer.bind(null, customer!.id)

  // 只顯示頂層公司作為母公司選項，排除自己
  const parentOptions = allCustomers.filter((c) => c.id !== customer?.id && !c.parent_id)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          mode === 'create'
            ? 'px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors'
            : 'text-sm text-blue-600 hover:underline'
        }
      >
        {mode === 'create' ? '+ 新增客戶' : '編輯'}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">
              {mode === 'create' ? '新增客戶' : '編輯客戶'}
            </h2>
            <form action={action} onSubmit={() => setOpen(false)}>
              <div className="flex flex-col gap-4">
                <Field label="公司名稱" name="company_name" required defaultValue={customer?.company_name} />
                <Field label="統一編號" name="tax_id" defaultValue={customer?.tax_id ?? ''} />
                <Field label="地址" name="address" defaultValue={customer?.address ?? ''} />

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">母公司（選填）</label>
                  <select
                    name="parent_id"
                    defaultValue={customer?.parent_id ?? ''}
                    className="border rounded-lg px-3 py-2 text-sm text-slate-700 bg-white"
                  >
                    <option value="">— 無（獨立客戶）</option>
                    {parentOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">到期前幾個月提醒</label>
                  <input
                    type="number"
                    name="reminder_months_before"
                    min={1}
                    max={12}
                    defaultValue={customer?.reminder_months_before ?? 1}
                    className="border rounded-lg px-3 py-2 text-sm w-24"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="true"
                    defaultChecked={customer ? customer.is_active : true}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">啟用中（取消勾選代表停用）</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, name, required, defaultValue }: {
  label: string; name: string; required?: boolean; defaultValue?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="border rounded-lg px-3 py-2 text-sm"
      />
    </div>
  )
}
