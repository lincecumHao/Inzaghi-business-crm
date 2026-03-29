'use client'

import { useState } from 'react'
import { createContact, deleteContact } from '../../actions'
import type { Contact } from '@/types/database'

export function ContactSection({
  customerId,
  contacts,
}: {
  customerId: string
  contacts: Contact[]
}) {
  const [adding, setAdding] = useState(false)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">聯絡人</h2>
        <button
          onClick={() => setAdding(true)}
          className="text-sm text-blue-600 hover:underline"
        >
          + 新增
        </button>
      </div>

      {contacts.length === 0 && !adding && (
        <p className="text-sm text-gray-500">尚無聯絡人</p>
      )}

      <div className="flex flex-col gap-3">
        {contacts.map((contact) => (
          <ContactRow
            key={contact.id}
            contact={contact}
            customerId={customerId}
          />
        ))}

        {adding && (
          <ContactAddForm
            customerId={customerId}
            onClose={() => setAdding(false)}
          />
        )}
      </div>
    </section>
  )
}

function ContactRow({
  contact,
  customerId,
}: {
  contact: Contact
  customerId: string
}) {
  return (
    <div className="flex items-center justify-between border rounded-lg px-4 py-3 text-sm">
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{contact.name}</span>
        <span className="text-gray-500">
          {[contact.email, contact.phone].filter(Boolean).join('　')}
        </span>
      </div>
      <form
        action={deleteContact.bind(null, contact.id, customerId)}
      >
        <button
          type="submit"
          className="text-gray-400 hover:text-red-500 text-xs"
        >
          刪除
        </button>
      </form>
    </div>
  )
}

function ContactAddForm({
  customerId,
  onClose,
}: {
  customerId: string
  onClose: () => void
}) {
  return (
    <form
      action={createContact.bind(null, customerId)}
      onSubmit={onClose}
      className="border rounded-lg px-4 py-3 flex flex-col gap-3"
    >
      <div className="grid grid-cols-3 gap-3">
        <input
          type="text"
          name="name"
          placeholder="姓名 *"
          required
          className="border rounded-lg px-3 py-1.5 text-sm"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="border rounded-lg px-3 py-1.5 text-sm"
        />
        <input
          type="text"
          name="phone"
          placeholder="電話"
          className="border rounded-lg px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          新增
        </button>
      </div>
    </form>
  )
}
