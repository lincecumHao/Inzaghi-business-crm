export interface Customer {
  id: string
  company_name: string
  tax_id: string | null
  address: string | null
  reminder_months_before: number
  parent_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  customer_id: string
  name: string
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  quote_number: string
  quote_date: string
  invoice_date: string | null
  contract_start_date: string | null
  contract_end_date: string | null
  is_main_contract: boolean
  is_active: boolean
  quote_url: string | null
  contract_url: string | null
  invoice_url: string | null
  status: 'pending' | 'quote_issued' | 'invoice_issued' | 'paid'
  payment_date: string | null
  commission_year: number | null
  reminder_sent_at: string | null
  subtotal: number
  tax_amount: number
  total_amount: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  sequence_number: number
  name: string
  quantity: number
  unit: string | null
  unit_price: number
  subtotal: number
  is_commissionable: boolean
  created_at: string
  updated_at: string
}

export interface CustomerWithContacts extends Customer {
  contacts: Contact[]
}
