'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Customer ──────────────────────────────────────────────────

export async function createCustomer(formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .insert({
      company_name: formData.get('company_name') as string,
      tax_id: (formData.get('tax_id') as string) || null,
      address: (formData.get('address') as string) || null,
      parent_id: (formData.get('parent_id') as string) || null,
      reminder_months_before: Number(formData.get('reminder_months_before')) || 1,
      is_active: formData.get('is_active') === 'true',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  redirect(`/customers/${data.id}`)
}

export async function updateCustomer(id: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .update({
      company_name: formData.get('company_name') as string,
      tax_id: (formData.get('tax_id') as string) || null,
      address: (formData.get('address') as string) || null,
      parent_id: (formData.get('parent_id') as string) || null,
      reminder_months_before: Number(formData.get('reminder_months_before')) || 1,
      is_active: formData.get('is_active') === 'true',
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/customers')
  revalidatePath(`/customers/${id}`)
}

// ── Contact ───────────────────────────────────────────────────

export async function createContact(customerId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from('contacts').insert({
    customer_id: customerId,
    name: formData.get('name') as string,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/customers/${customerId}`)
}

export async function deleteContact(contactId: string, customerId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('contacts').delete().eq('id', contactId)

  if (error) throw new Error(error.message)

  revalidatePath(`/customers/${customerId}`)
}
