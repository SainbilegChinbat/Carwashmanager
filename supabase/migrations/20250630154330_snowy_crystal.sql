/*
  # Initial Database Schema for Car Wash Manager

  1. New Tables
    - `users` - Stores user account information
    - `services` - Stores available car wash services
    - `employees` - Stores employee information
    - `transactions` - Stores completed transactions
    - `transaction_services` - Junction table for transaction-service relationships
    - `transaction_employees` - Junction table for transaction-employee relationships
    - `commissions` - Stores employee commission information
    - `pending_services` - Stores pending services
    - `appointments` - Stores customer appointments
    - `appointment_reminders` - Stores appointment reminders

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  commission_rate INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  default_commission_rate INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'card')),
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'pending')),
  notes TEXT,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Transaction services junction table
CREATE TABLE IF NOT EXISTS transaction_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  price INTEGER NOT NULL,
  commission_rate INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Transaction employees junction table
CREATE TABLE IF NOT EXISTS transaction_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  commission_rate INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT false NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Pending services table
CREATE TABLE IF NOT EXISTS pending_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  notes TEXT,
  date TIMESTAMPTZ NOT NULL,
  estimated_completion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Pending service details (services, employees, commissions)
CREATE TABLE IF NOT EXISTS pending_service_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pending_service_id UUID NOT NULL REFERENCES pending_services(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  commission_rate INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_service_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pending_service_id UUID NOT NULL REFERENCES pending_services(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_service_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pending_service_id UUID NOT NULL REFERENCES pending_services(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  commission_rate INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  appointment_time TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Appointment details (services, employees, commissions)
CREATE TABLE IF NOT EXISTS appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  commission_rate INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS appointment_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS appointment_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  commission_rate INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Appointment reminders table
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  appointment_time TEXT NOT NULL,
  reminder_time TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_service_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_service_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_service_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "Users can view their own data" 
  ON users FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
  ON users FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- Create RLS policies for services
CREATE POLICY "Users can view their own services" 
  ON services FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services" 
  ON services FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" 
  ON services FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" 
  ON services FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create RLS policies for employees
CREATE POLICY "Users can view their own employees" 
  ON employees FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own employees" 
  ON employees FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees" 
  ON employees FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employees" 
  ON employees FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" 
  ON transactions FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
  ON transactions FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
  ON transactions FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
  ON transactions FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create RLS policies for transaction_services
CREATE POLICY "Users can view their own transaction services" 
  ON transaction_services FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own transaction services" 
  ON transaction_services FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own transaction services" 
  ON transaction_services FOR UPDATE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own transaction services" 
  ON transaction_services FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

-- Create RLS policies for transaction_employees
CREATE POLICY "Users can view their own transaction employees" 
  ON transaction_employees FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own transaction employees" 
  ON transaction_employees FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own transaction employees" 
  ON transaction_employees FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

-- Create RLS policies for commissions
CREATE POLICY "Users can view their own commissions" 
  ON commissions FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own commissions" 
  ON commissions FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own commissions" 
  ON commissions FOR UPDATE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own commissions" 
  ON commissions FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

-- Create RLS policies for pending_services
CREATE POLICY "Users can view their own pending services" 
  ON pending_services FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pending services" 
  ON pending_services FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending services" 
  ON pending_services FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending services" 
  ON pending_services FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create RLS policies for pending_service_details
CREATE POLICY "Users can view their own pending service details" 
  ON pending_service_details FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM pending_services ps 
    WHERE ps.id = pending_service_id AND ps.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own pending service details" 
  ON pending_service_details FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM pending_services ps 
    WHERE ps.id = pending_service_id AND ps.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own pending service details" 
  ON pending_service_details FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM pending_services ps 
    WHERE ps.id = pending_service_id AND ps.user_id = auth.uid()
  ));

-- Create RLS policies for pending_service_employees
CREATE POLICY "Users can view their own pending service employees" 
  ON pending_service_employees FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM pending_services ps 
    WHERE ps.id = pending_service_id AND ps.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own pending service employees" 
  ON pending_service_employees FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM pending_services ps 
    WHERE ps.id = pending_service_id AND ps.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own pending service employees" 
  ON pending_service_employees FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM pending_services ps 
    WHERE ps.id = pending_service_id AND ps.user_id = auth.uid()
  ));

-- Create RLS policies for pending_service_commissions
CREATE POLICY "Users can view their own pending service commissions" 
  ON pending_service_commissions FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM pending_services ps 
    WHERE ps.id = pending_service_id AND ps.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own pending service commissions" 
  ON pending_service_commissions FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM pending_services ps 
    WHERE ps.id = pending_service_id AND ps.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own pending service commissions" 
  ON pending_service_commissions FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM pending_services ps 
    WHERE ps.id = pending_service_id AND ps.user_id = auth.uid()
  ));

-- Create RLS policies for appointments
CREATE POLICY "Users can view their own appointments" 
  ON appointments FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments" 
  ON appointments FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" 
  ON appointments FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments" 
  ON appointments FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create RLS policies for appointment_services
CREATE POLICY "Users can view their own appointment services" 
  ON appointment_services FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.id = appointment_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own appointment services" 
  ON appointment_services FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.id = appointment_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own appointment services" 
  ON appointment_services FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.id = appointment_id AND a.user_id = auth.uid()
  ));

-- Create RLS policies for appointment_employees
CREATE POLICY "Users can view their own appointment employees" 
  ON appointment_employees FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.id = appointment_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own appointment employees" 
  ON appointment_employees FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.id = appointment_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own appointment employees" 
  ON appointment_employees FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.id = appointment_id AND a.user_id = auth.uid()
  ));

-- Create RLS policies for appointment_commissions
CREATE POLICY "Users can view their own appointment commissions" 
  ON appointment_commissions FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.id = appointment_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own appointment commissions" 
  ON appointment_commissions FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.id = appointment_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own appointment commissions" 
  ON appointment_commissions FOR DELETE 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.id = appointment_id AND a.user_id = auth.uid()
  ));

-- Create RLS policies for appointment_reminders
CREATE POLICY "Users can view their own appointment reminders" 
  ON appointment_reminders FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointment reminders" 
  ON appointment_reminders FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointment reminders" 
  ON appointment_reminders FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointment reminders" 
  ON appointment_reminders FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_services_modtime
BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_employees_modtime
BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_transactions_modtime
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_commissions_modtime
BEFORE UPDATE ON commissions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_pending_services_modtime
BEFORE UPDATE ON pending_services
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_appointments_modtime
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_modified_column();