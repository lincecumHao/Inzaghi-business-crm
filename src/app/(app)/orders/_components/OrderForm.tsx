'use client'

import { useState } from 'react'
import { createOrder, updateOrder } from '../actions'
import type { Customer, Order, OrderItem } from '@/types/database'

type Props =
  | { mode: 'create'; order?: never; items?: never; customers: Customer[] }
  | { mode: 'edit'; order: Order; items: OrderItem[]; customers: Customer[] }

export function OrderForm({ mode, order, items, customers }: Props) {
  const [open, setOpen] = useState(false)
  const isPaid = mode === 'edit' && order.status === 'paid'
  const [rows, setRows] = useState<ItemRow[]>(
    mode === 'edit' && items?.length
      ? items.map((item) => ({
          name: item.name,
          quantity: String(item.quantity),
          unit: item.unit ?? '',
          unit_price: String(item.unit_price),
          commissionable: item.is_commissionable,
        }))
      : [{ name: '', quantity: '1', unit: '式', unit_price: '', commissionable: false }]
  )

  const action = mode === 'create' ? createOrder : updateOrder.bind(null, order!.id)

  function addRow() {
    setRows((r) => [...r, { name: '', quantity: '1', unit: '式', unit_price: '', commissionable: false }])
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, field: keyof ItemRow, value: string | boolean) {
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

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
        {mode === 'create' ? '+ 新增訂單' : '編輯'}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl mx-4">
            <h2 className="text-lg font-semibold mb-5">{mode === 'create' ? '新增訂單' : '編輯訂單'}</h2>
            <form action={action} onSubmit={() => setOpen(false)}>

              {/* 基本資料 */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">客戶 <span className="text-red-500">*</span></label>
                  <select
                    name="customer_id"
                    required
                    defaultValue={order?.customer_id ?? ''}
                    className="border rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">選擇客戶</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>

                <DateField label="報價日期" name="quote_date" required defaultValue={order?.quote_date} />
                <DateField label="發票日期" name="invoice_date" defaultValue={order?.invoice_date ?? ''} />
                <DateField label="合約開始日" name="contract_start_date" defaultValue={order?.contract_start_date ?? ''} />
                <DateField label="合約結束日" name="contract_end_date" defaultValue={order?.contract_end_date ?? ''} />

                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_main_contract"
                    name="is_main_contract"
                    value="true"
                    defaultChecked={order?.is_main_contract ?? true}
                    className="rounded"
                  />
                  <label htmlFor="is_main_contract" className="text-sm text-slate-700">
                    主合約（勾選才有分潤）
                  </label>
                </div>

                <div className="col-span-2">
                  <UrlField label="報價單連結" name="quote_url" defaultValue={order?.quote_url ?? ''} />
                </div>
                <div className="col-span-2">
                  <UrlField label="合約連結" name="contract_url" defaultValue={order?.contract_url ?? ''} />
                </div>
                <div className="col-span-2">
                  <UrlField label="發票連結" name="invoice_url" defaultValue={order?.invoice_url ?? ''} />
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    value="true"
                    defaultChecked={order ? order.is_active : true}
                    className="rounded"
                  />
                  <label htmlFor="is_active" className="text-sm text-slate-700">
                    啟用中（取消勾選代表停用）
                  </label>
                </div>
              </div>

              {/* 項目明細 */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-700">項目明細</h3>
                  {!isPaid && (
                    <button type="button" onClick={addRow} className="text-xs text-blue-600 hover:underline">
                      + 新增項目
                    </button>
                  )}
                  {isPaid && (
                    <span className="text-xs text-slate-400">已付款，項目不可修改</span>
                  )}
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="text-left px-3 py-2 font-medium text-slate-500 w-[35%]">項目名稱</th>
                        <th className="text-left px-3 py-2 font-medium text-slate-500 w-[12%]">數量</th>
                        <th className="text-left px-3 py-2 font-medium text-slate-500 w-[12%]">單位</th>
                        <th className="text-left px-3 py-2 font-medium text-slate-500 w-[18%]">單價</th>
                        <th className="text-center px-3 py-2 font-medium text-slate-500 w-[13%]">分潤</th>
                        <th className="w-[10%]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1.5">
                            {isPaid
                              ? <span className="text-xs text-slate-700">{row.name}</span>
                              : <input name="item_name" value={row.name} onChange={(e) => updateRow(i, 'name', e.target.value)} required className="w-full border rounded px-2 py-1 text-xs" />}
                          </td>
                          <td className="px-2 py-1.5">
                            {isPaid
                              ? <span className="text-xs text-slate-700">{row.quantity}</span>
                              : <input name="item_quantity" value={row.quantity} onChange={(e) => updateRow(i, 'quantity', e.target.value)} type="number" min="0.01" step="0.01" className="w-full border rounded px-2 py-1 text-xs" />}
                          </td>
                          <td className="px-2 py-1.5">
                            {isPaid
                              ? <span className="text-xs text-slate-500">{row.unit}</span>
                              : <input name="item_unit" value={row.unit} onChange={(e) => updateRow(i, 'unit', e.target.value)} className="w-full border rounded px-2 py-1 text-xs" />}
                          </td>
                          <td className="px-2 py-1.5">
                            {isPaid
                              ? <span className="text-xs text-slate-700">{Number(row.unit_price).toLocaleString()}</span>
                              : <input name="item_unit_price" value={row.unit_price} onChange={(e) => updateRow(i, 'unit_price', e.target.value)} type="number" min="0" step="1" className="w-full border rounded px-2 py-1 text-xs" />}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <input name="item_commissionable" type="checkbox" value="true"
                              checked={row.commissionable}
                              disabled={isPaid}
                              onChange={(e) => !isPaid && updateRow(i, 'commissionable', e.target.checked)}
                              className="rounded" />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {!isPaid && rows.length > 1 && (
                              <button type="button" onClick={() => removeRow(i)}
                                className="text-slate-300 hover:text-red-500 text-base leading-none">×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

interface ItemRow {
  name: string
  quantity: string
  unit: string
  unit_price: string
  commissionable: boolean
}

function DateField({ label, name, required, defaultValue }: {
  label: string; name: string; required?: boolean; defaultValue?: string | null
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type="date" name={name} required={required} defaultValue={defaultValue ?? ''}
        className="border rounded-lg px-3 py-2 text-sm" />
    </div>
  )
}

function UrlField({ label, name, defaultValue }: {
  label: string; name: string; defaultValue?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input type="url" name={name} defaultValue={defaultValue ?? ''}
        placeholder="https://drive.google.com/..."
        className="border rounded-lg px-3 py-2 text-sm" />
    </div>
  )
}
