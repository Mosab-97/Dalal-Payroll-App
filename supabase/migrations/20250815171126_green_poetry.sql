/*
  # Dalal Financial Management System Database Schema
  
  1. New Tables
    - `projects` - Project management with budgets and role rates
    - `employees` - Employee records with project assignments
    - `payroll` - Monthly payroll calculations
    - `advances` - Employee advances tracking
    - `expenses` - Project expenses tracking
    - `statements` - Monthly project statements
    - `activity_logs` - System activity tracking
    
  2. Security
    - Enable RLS on all tables
    - Open policies for internal use (no authentication required)
    
  3. Triggers & Functions
    - Automatic payroll calculations
    - Advance settlement on payroll payment
    - Activity logging
*/

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  budget numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active',
  role_rates jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- EMPLOYEES
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  employee_id text UNIQUE,
  iqama_number text UNIQUE,
  role text NOT NULL,
  date_of_join date NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- PAYROLL
CREATE TABLE IF NOT EXISTS public.payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  month date NOT NULL,
  hours_worked numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  gross_pay numeric NOT NULL DEFAULT 0,
  advances_deducted numeric NOT NULL DEFAULT 0,
  final_pay numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (employee_id, month)
);

-- ADVANCES
CREATE TABLE IF NOT EXISTS public.advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  date date NOT NULL,
  description text,
  auto_deduct boolean NOT NULL DEFAULT true,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  date date NOT NULL,
  payment_method text NOT NULL,
  paid_by text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- STATEMENTS
CREATE TABLE IF NOT EXISTS public.statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  month date NOT NULL,
  total_payroll numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  total_advances numeric NOT NULL DEFAULT 0,
  remaining_budget numeric NOT NULL DEFAULT 0,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (project_id, month)
);

-- ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text,
  action text,
  row_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Helper function: get project rate by role
CREATE OR REPLACE FUNCTION public.get_project_rate(p_project uuid, p_role text)
RETURNS numeric LANGUAGE sql STABLE AS $$
  SELECT coalesce((role_rates ->> p_role)::numeric, 0)
  FROM public.projects
  WHERE id = p_project
$$;

-- Payroll computation trigger
CREATE OR REPLACE FUNCTION public.payroll_compute()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_rate numeric := NEW.rate;
  v_adv_total numeric;
BEGIN
  IF NEW.project_id IS NULL THEN
    SELECT project_id INTO NEW.project_id FROM public.employees WHERE id = NEW.employee_id;
  END IF;

  IF (v_rate IS NULL OR v_rate = 0) AND NEW.project_id IS NOT NULL THEN
    SELECT public.get_project_rate(NEW.project_id, e.role)
    INTO v_rate
    FROM public.employees e WHERE e.id = NEW.employee_id;
  END IF;

  NEW.rate := coalesce(v_rate, 0);
  NEW.gross_pay := round(coalesce(NEW.hours_worked, 0) * coalesce(NEW.rate, 0), 2);

  IF NEW.advances_deducted IS NULL OR NEW.advances_deducted = 0 THEN
    SELECT coalesce(sum(amount), 0) INTO v_adv_total
    FROM public.advances
    WHERE employee_id = NEW.employee_id 
      AND paid = false 
      AND date <= NEW.month + interval '1 month' - interval '1 day';
    NEW.advances_deducted := round(coalesce(v_adv_total, 0), 2);
  END IF;

  NEW.final_pay := round(NEW.gross_pay - coalesce(NEW.advances_deducted, 0), 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payroll_compute ON public.payroll;
CREATE TRIGGER trg_payroll_compute
BEFORE INSERT OR UPDATE ON public.payroll
FOR EACH ROW EXECUTE FUNCTION public.payroll_compute();

-- Settle advances when payroll is marked as paid
CREATE OR REPLACE FUNCTION public.settle_advances_on_pay()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'Paid' AND (OLD.status IS DISTINCT FROM 'Paid') THEN
    UPDATE public.advances
    SET paid = true
    WHERE employee_id = NEW.employee_id
      AND auto_deduct = true
      AND paid = false
      AND date <= NEW.month + interval '1 month' - interval '1 day';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_settle_advances_on_pay ON public.payroll;
CREATE TRIGGER trg_settle_advances_on_pay
AFTER UPDATE ON public.payroll
FOR EACH ROW EXECUTE FUNCTION public.settle_advances_on_pay();

-- Activity logging
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.activity_logs(table_name, action, row_id, details)
  VALUES (tg_table_name, tg_op, NEW.id, to_jsonb(NEW));
  RETURN NEW;
END;
$$;

-- Activity log triggers
DROP TRIGGER IF EXISTS trg_log_projects ON public.projects;
CREATE TRIGGER trg_log_projects AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS trg_log_employees ON public.employees;
CREATE TRIGGER trg_log_employees AFTER INSERT ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS trg_log_payroll ON public.payroll;
CREATE TRIGGER trg_log_payroll AFTER INSERT ON public.payroll
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS trg_log_advances ON public.advances;
CREATE TRIGGER trg_log_advances AFTER INSERT ON public.advances
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS trg_log_expenses ON public.expenses;
CREATE TRIGGER trg_log_expenses AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS trg_log_statements ON public.statements;
CREATE TRIGGER trg_log_statements AFTER INSERT ON public.statements
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Open policies for internal use
CREATE POLICY "open_all_projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_payroll" ON public.payroll FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_advances" ON public.advances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_statements" ON public.statements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);