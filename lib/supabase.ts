import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Project {
  id: string
  name: string
  budget: number
  status: 'Active' | 'On Hold' | 'Completed'
  role_rates: Record<string, number>
  created_at: string
}

export interface Employee {
  id: string
  name: string
  employee_id: string
  iqama_number: string
  role: string
  date_of_join: string
  project_id: string | null
  created_at: string
}

export interface Payroll {
  id: string
  employee_id: string
  project_id: string | null
  month: string
  hours_worked: number
  rate: number
  gross_pay: number
  advances_deducted: number
  final_pay: number
  status: 'Pending' | 'Paid'
  created_at: string
}

export interface Advance {
  id: string
  employee_id: string
  amount: number
  date: string
  description: string
  auto_deduct: boolean
  paid: boolean
  created_at: string
}

export interface Expense {
  id: string
  project_id: string
  category: string
  amount: number
  date: string
  payment_method: 'Cash' | 'Card' | 'Transfer'
  paid_by: string
  notes: string
  created_at: string
}

export interface Statement {
  id: string
  project_id: string
  month: string
  total_payroll: number
  total_expenses: number
  total_advances: number
  remaining_budget: number
  attachments: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
  created_at: string
}

export interface ActivityLog {
  id: string
  table_name: string
  action: string
  row_id: string
  details: any
  created_at: string
}