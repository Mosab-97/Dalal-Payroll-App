/*
  # Sample Data for Dalal Financial System
  
  Insert sample data for testing and demonstration:
  - 2 sample projects with role rates
  - 4 sample employees
  - Sample expenses and advances
  - Sample payroll records
*/

-- Insert sample projects
INSERT INTO public.projects (id, name, budget, status, role_rates) VALUES 
(
  '123e4567-e89b-12d3-a456-426614174000',
  'Downtown Office Complex',
  500000,
  'Active',
  '{"Carpenter": 13, "Labor": 10, "Plumber": 12, "Electrician": 14, "Supervisor": 18}'::jsonb
),
(
  '223e4567-e89b-12d3-a456-426614174000',
  'Residential Villa Project',
  250000,
  'Active',
  '{"Carpenter": 13, "Labor": 10, "Mason": 11, "Painter": 9}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert sample employees
INSERT INTO public.employees (id, name, employee_id, iqama_number, role, date_of_join, project_id) VALUES 
(
  '323e4567-e89b-12d3-a456-426614174000',
  'Ali Al-Rashid',
  'EMP001',
  '2234567890',
  'Carpenter',
  '2024-01-15',
  '123e4567-e89b-12d3-a456-426614174000'
),
(
  '423e4567-e89b-12d3-a456-426614174000',
  'Ahmed Al-Zahrani',
  'EMP002',
  '2234567891',
  'Labor',
  '2024-01-20',
  '123e4567-e89b-12d3-a456-426614174000'
),
(
  '523e4567-e89b-12d3-a456-426614174000',
  'Omar Al-Ghamdi',
  'EMP003',
  '2234567892',
  'Electrician',
  '2024-02-01',
  '123e4567-e89b-12d3-a456-426614174000'
),
(
  '623e4567-e89b-12d3-a456-426614174000',
  'Khalid Al-Mutairi',
  'EMP004',
  '2234567893',
  'Mason',
  '2024-02-10',
  '223e4567-e89b-12d3-a456-426614174000'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample advances
INSERT INTO public.advances (employee_id, amount, date, description, auto_deduct) VALUES
('323e4567-e89b-12d3-a456-426614174000', 500, '2024-12-01', 'Emergency advance for family expense', true),
('423e4567-e89b-12d3-a456-426614174000', 300, '2024-12-05', 'Transport allowance advance', true),
('523e4567-e89b-12d3-a456-426614174000', 750, '2024-12-10', 'Medical expense advance', true);

-- Insert sample expenses
INSERT INTO public.expenses (project_id, category, amount, date, payment_method, paid_by, notes) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'Transportation', 450, '2024-12-01', 'Card', 'Project Manager', 'Worker transportation to site'),
('123e4567-e89b-12d3-a456-426614174000', 'Food', 280, '2024-12-02', 'Cash', 'Site Supervisor', 'Daily meals for workers'),
('123e4567-e89b-12d3-a456-426614174000', 'Fuel', 320, '2024-12-03', 'Card', 'Project Manager', 'Generator fuel'),
('223e4567-e89b-12d3-a456-426614174000', 'Accommodation', 1200, '2024-12-01', 'Transfer', 'HR Department', 'Monthly accommodation for workers');

-- Insert sample payroll (current month)
INSERT INTO public.payroll (employee_id, project_id, month, hours_worked, status) VALUES
('323e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000', '2024-12-01', 176, 'Pending'),
('423e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000', '2024-12-01', 180, 'Pending'),
('523e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000', '2024-12-01', 168, 'Pending'),
('623e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174000', '2024-12-01', 172, 'Pending');