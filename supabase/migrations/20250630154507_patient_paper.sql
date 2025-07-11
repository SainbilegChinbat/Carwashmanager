/*
  # Database Triggers for Car Wash Manager

  1. Triggers
    - `create_user_profile_after_auth_signup` - Create user profile after auth signup
    - `handle_appointment_completion` - Handle appointment completion
    - `handle_pending_service_completion` - Handle pending service completion
    - `create_appointment_reminder` - Create appointment reminders
*/

-- Create a trigger to automatically create a user profile after signup
CREATE OR REPLACE FUNCTION create_user_profile_after_auth_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, business_name, phone, address)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'businessName', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_user_profile_after_auth_signup();

-- Create a trigger to handle appointment completion
CREATE OR REPLACE FUNCTION handle_appointment_completion()
RETURNS TRIGGER AS $$
DECLARE
  new_transaction_id UUID;
BEGIN
  -- Only proceed if status is changing to 'completed'
  IF NEW.status = 'completed' AND (OLD.status != 'completed' OR OLD.status IS NULL) THEN
    -- Create a new transaction
    INSERT INTO transactions (
      user_id,
      license_plate,
      payment_method,
      total_amount,
      status,
      notes,
      date
    ) VALUES (
      NEW.user_id,
      NEW.license_plate,
      'cash', -- Default payment method, should be updated by application
      NEW.total_amount,
      'completed',
      NEW.notes,
      CURRENT_TIMESTAMP
    ) RETURNING id INTO new_transaction_id;
    
    -- Copy services to transaction_services
    INSERT INTO transaction_services (
      transaction_id,
      service_id,
      service_name,
      price,
      commission_rate
    )
    SELECT
      new_transaction_id,
      service_id,
      service_name,
      price,
      commission_rate
    FROM appointment_services
    WHERE appointment_id = NEW.id;
    
    -- Copy employees to transaction_employees
    INSERT INTO transaction_employees (
      transaction_id,
      employee_id
    )
    SELECT
      new_transaction_id,
      employee_id
    FROM appointment_employees
    WHERE appointment_id = NEW.id;
    
    -- Copy commissions to transaction commissions
    INSERT INTO commissions (
      transaction_id,
      employee_id,
      employee_name,
      service_id,
      amount,
      commission_rate,
      is_paid,
      notes
    )
    SELECT
      new_transaction_id,
      employee_id,
      employee_name,
      service_id,
      amount,
      commission_rate,
      false, -- Default to unpaid
      '' -- Default to empty notes
    FROM appointment_commissions
    WHERE appointment_id = NEW.id;
    
    -- Mark any reminders as read
    UPDATE appointment_reminders
    SET is_read = true
    WHERE appointment_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_appointment_completed
AFTER UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION handle_appointment_completion();

-- Create a trigger to handle pending service completion
CREATE OR REPLACE FUNCTION handle_pending_service_completion()
RETURNS TRIGGER AS $$
DECLARE
  new_transaction_id UUID;
BEGIN
  -- Only proceed if the row is being deleted (assuming completion)
  -- Create a new transaction
  INSERT INTO transactions (
    user_id,
    license_plate,
    payment_method,
    total_amount,
    status,
    notes,
    date
  ) VALUES (
    OLD.user_id,
    OLD.license_plate,
    'cash', -- Default payment method, should be updated by application
    OLD.total_amount,
    'completed',
    OLD.notes,
    CURRENT_TIMESTAMP
  ) RETURNING id INTO new_transaction_id;
  
  -- Copy services to transaction_services
  INSERT INTO transaction_services (
    transaction_id,
    service_id,
    service_name,
    price,
    commission_rate
  )
  SELECT
    new_transaction_id,
    service_id,
    service_name,
    price,
    commission_rate
  FROM pending_service_details
  WHERE pending_service_id = OLD.id;
  
  -- Copy employees to transaction_employees
  INSERT INTO transaction_employees (
    transaction_id,
    employee_id
  )
  SELECT
    new_transaction_id,
    employee_id
  FROM pending_service_employees
  WHERE pending_service_id = OLD.id;
  
  -- Copy commissions to transaction commissions
  INSERT INTO commissions (
    transaction_id,
    employee_id,
    employee_name,
    service_id,
    amount,
    commission_rate,
    is_paid,
    notes
  )
  SELECT
    new_transaction_id,
    employee_id,
    employee_name,
    service_id,
    amount,
    commission_rate,
    false, -- Default to unpaid
    '' -- Default to empty notes
  FROM pending_service_commissions
  WHERE pending_service_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_pending_service_completed
BEFORE DELETE ON pending_services
FOR EACH ROW EXECUTE FUNCTION handle_pending_service_completion();

-- Create a trigger to create appointment reminders
CREATE OR REPLACE FUNCTION create_appointment_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a reminder for 1 hour before the appointment
  INSERT INTO appointment_reminders (
    user_id,
    appointment_id,
    customer_name,
    customer_phone,
    license_plate,
    appointment_date,
    appointment_time,
    reminder_time,
    is_read
  ) VALUES (
    NEW.user_id,
    NEW.id,
    NEW.customer_name,
    NEW.customer_phone,
    NEW.license_plate,
    NEW.appointment_date,
    NEW.appointment_time,
    NEW.appointment_date - INTERVAL '1 hour',
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_appointment_created
AFTER INSERT ON appointments
FOR EACH ROW EXECUTE FUNCTION create_appointment_reminder();

-- Update appointment reminder when appointment is updated
CREATE OR REPLACE FUNCTION update_appointment_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if date or time changed
  IF NEW.appointment_date != OLD.appointment_date OR NEW.appointment_time != OLD.appointment_time THEN
    -- Delete old reminders
    DELETE FROM appointment_reminders
    WHERE appointment_id = NEW.id;
    
    -- Create a new reminder
    INSERT INTO appointment_reminders (
      user_id,
      appointment_id,
      customer_name,
      customer_phone,
      license_plate,
      appointment_date,
      appointment_time,
      reminder_time,
      is_read
    ) VALUES (
      NEW.user_id,
      NEW.id,
      NEW.customer_name,
      NEW.customer_phone,
      NEW.license_plate,
      NEW.appointment_date,
      NEW.appointment_time,
      NEW.appointment_date - INTERVAL '1 hour',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_appointment_updated
AFTER UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_appointment_reminder();