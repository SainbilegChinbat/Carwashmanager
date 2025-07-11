/*
  # Database Functions and Views for Car Wash Manager

  1. Functions
    - `get_user_dashboard_stats` - Get dashboard statistics for a user
    - `get_user_transactions_by_date_range` - Get transactions for a user by date range
    - `get_user_employee_stats` - Get employee statistics for a user
    - `get_user_service_stats` - Get service statistics for a user

  2. Views
    - `transaction_details_view` - View with transaction details including services and employees
    - `employee_commissions_view` - View with employee commission details
    - `appointment_details_view` - View with appointment details
*/

-- Function to get dashboard statistics for a user
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(user_uuid UUID, target_date DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH today_transactions AS (
    SELECT *
    FROM transactions
    WHERE user_id = user_uuid
    AND date::DATE = target_date
    AND status = 'completed'
  ),
  today_commissions AS (
    SELECT c.*
    FROM commissions c
    JOIN today_transactions t ON c.transaction_id = t.id
  ),
  payment_methods AS (
    SELECT
      COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) AS cash,
      COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total_amount ELSE 0 END), 0) AS transfer,
      COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END), 0) AS card
    FROM today_transactions
  ),
  pending_count AS (
    SELECT COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS amount
    FROM pending_services
    WHERE user_id = user_uuid
  ),
  appointment_count AS (
    SELECT COUNT(*) AS count
    FROM appointments
    WHERE user_id = user_uuid
    AND appointment_date::DATE >= target_date
    AND status NOT IN ('completed', 'cancelled')
  ),
  service_count AS (
    SELECT COUNT(*) AS count
    FROM transaction_services ts
    JOIN today_transactions t ON ts.transaction_id = t.id
  )
  
  SELECT json_build_object(
    'totalIncome', COALESCE((SELECT SUM(total_amount) FROM today_transactions), 0),
    'totalServices', COALESCE((SELECT count FROM service_count), 0),
    'totalCommissions', COALESCE((SELECT SUM(amount) FROM today_commissions), 0),
    'pendingServices', COALESCE((SELECT count FROM pending_count), 0),
    'pendingAmount', COALESCE((SELECT amount FROM pending_count), 0),
    'appointmentCount', COALESCE((SELECT count FROM appointment_count), 0),
    'paymentMethods', (SELECT row_to_json(payment_methods) FROM payment_methods)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get transactions for a user by date range
CREATE OR REPLACE FUNCTION get_user_transactions_by_date_range(
  user_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS SETOF transactions AS $$
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM transactions t
  WHERE t.user_id = user_uuid
  AND t.date::DATE BETWEEN start_date AND end_date
  ORDER BY t.date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get employee statistics for a user
CREATE OR REPLACE FUNCTION get_user_employee_stats(
  user_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  total_commission BIGINT,
  service_count BIGINT,
  revenue_share BIGINT,
  paid_commissions BIGINT,
  unpaid_commissions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH employee_transactions AS (
    SELECT
      e.id AS employee_id,
      e.name AS employee_name,
      t.id AS transaction_id,
      t.total_amount,
      COUNT(te.id) OVER (PARTITION BY t.id) AS employee_count
    FROM employees e
    JOIN transaction_employees te ON e.id = te.employee_id
    JOIN transactions t ON te.transaction_id = t.id
    WHERE e.user_id = user_uuid
    AND t.date::DATE BETWEEN start_date AND end_date
    AND t.status = 'completed'
  ),
  employee_commissions AS (
    SELECT
      c.employee_id,
      c.amount,
      c.is_paid
    FROM commissions c
    JOIN transactions t ON c.transaction_id = t.id
    WHERE t.user_id = user_uuid
    AND t.date::DATE BETWEEN start_date AND end_date
    AND t.status = 'completed'
  )
  SELECT
    e.id AS employee_id,
    e.name AS employee_name,
    COALESCE(SUM(ec.amount), 0)::BIGINT AS total_commission,
    COUNT(DISTINCT ec.employee_id)::BIGINT AS service_count,
    COALESCE(SUM(et.total_amount / et.employee_count), 0)::BIGINT AS revenue_share,
    COUNT(CASE WHEN ec.is_paid THEN 1 END)::BIGINT AS paid_commissions,
    COUNT(CASE WHEN NOT ec.is_paid THEN 1 END)::BIGINT AS unpaid_commissions
  FROM employees e
  LEFT JOIN employee_transactions et ON e.id = et.employee_id
  LEFT JOIN employee_commissions ec ON e.id = ec.employee_id
  WHERE e.user_id = user_uuid
  GROUP BY e.id, e.name
  ORDER BY total_commission DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get service statistics for a user
CREATE OR REPLACE FUNCTION get_user_service_stats(
  user_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  service_id UUID,
  service_name TEXT,
  total_revenue BIGINT,
  service_count BIGINT,
  average_price FLOAT,
  total_commission BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.service_id,
    ts.service_name,
    SUM(ts.price)::BIGINT AS total_revenue,
    COUNT(*)::BIGINT AS service_count,
    (SUM(ts.price) / COUNT(*))::FLOAT AS average_price,
    SUM((ts.price * ts.commission_rate / 100))::BIGINT AS total_commission
  FROM transaction_services ts
  JOIN transactions t ON ts.transaction_id = t.id
  WHERE t.user_id = user_uuid
  AND t.date::DATE BETWEEN start_date AND end_date
  AND t.status = 'completed'
  GROUP BY ts.service_id, ts.service_name
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- View with transaction details including services and employees
CREATE OR REPLACE VIEW transaction_details_view AS
SELECT
  t.id,
  t.user_id,
  t.license_plate,
  t.payment_method,
  t.total_amount,
  t.status,
  t.notes,
  t.date,
  t.created_at,
  t.updated_at,
  (
    SELECT json_agg(json_build_object(
      'id', ts.id,
      'serviceId', ts.service_id,
      'serviceName', ts.service_name,
      'price', ts.price,
      'commissionRate', ts.commission_rate
    ))
    FROM transaction_services ts
    WHERE ts.transaction_id = t.id
  ) AS services,
  (
    SELECT json_agg(te.employee_id)
    FROM transaction_employees te
    WHERE te.transaction_id = t.id
  ) AS employees,
  (
    SELECT json_agg(json_build_object(
      'id', c.id,
      'employeeId', c.employee_id,
      'employeeName', c.employee_name,
      'amount', c.amount,
      'serviceId', c.service_id,
      'commissionRate', c.commission_rate,
      'isPaid', c.is_paid,
      'notes', c.notes
    ))
    FROM commissions c
    WHERE c.transaction_id = t.id
  ) AS commissions
FROM transactions t;

-- View with employee commission details
CREATE OR REPLACE VIEW employee_commissions_view AS
SELECT
  c.id,
  c.employee_id,
  c.employee_name,
  c.transaction_id,
  c.service_id,
  c.amount,
  c.commission_rate,
  c.is_paid,
  c.notes,
  t.user_id,
  t.license_plate,
  t.payment_method,
  t.date,
  t.status,
  t.notes AS transaction_notes
FROM commissions c
JOIN transactions t ON c.transaction_id = t.id;

-- View with appointment details
CREATE OR REPLACE VIEW appointment_details_view AS
SELECT
  a.id,
  a.user_id,
  a.license_plate,
  a.customer_name,
  a.customer_phone,
  a.appointment_date,
  a.appointment_time,
  a.total_amount,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at,
  (
    SELECT json_agg(json_build_object(
      'id', aps.id,
      'serviceId', aps.service_id,
      'serviceName', aps.service_name,
      'price', aps.price,
      'commissionRate', aps.commission_rate
    ))
    FROM appointment_services aps
    WHERE aps.appointment_id = a.id
  ) AS services,
  (
    SELECT json_agg(ape.employee_id)
    FROM appointment_employees ape
    WHERE ape.appointment_id = a.id
  ) AS employees,
  (
    SELECT json_agg(json_build_object(
      'id', apc.id,
      'employeeId', apc.employee_id,
      'employeeName', apc.employee_name,
      'amount', apc.amount,
      'serviceId', apc.service_id,
      'commissionRate', apc.commission_rate
    ))
    FROM appointment_commissions apc
    WHERE apc.appointment_id = a.id
  ) AS commissions
FROM appointments a;

-- View with pending service details
CREATE OR REPLACE VIEW pending_service_details_view AS
SELECT
  ps.id,
  ps.user_id,
  ps.license_plate,
  ps.total_amount,
  ps.notes,
  ps.date,
  ps.estimated_completion,
  ps.created_at,
  ps.updated_at,
  (
    SELECT json_agg(json_build_object(
      'id', psd.id,
      'serviceId', psd.service_id,
      'serviceName', psd.service_name,
      'price', psd.price,
      'commissionRate', psd.commission_rate
    ))
    FROM pending_service_details psd
    WHERE psd.pending_service_id = ps.id
  ) AS services,
  (
    SELECT json_agg(pse.employee_id)
    FROM pending_service_employees pse
    WHERE pse.pending_service_id = ps.id
  ) AS employees,
  (
    SELECT json_agg(json_build_object(
      'id', psc.id,
      'employeeId', psc.employee_id,
      'employeeName', psc.employee_name,
      'amount', psc.amount,
      'serviceId', psc.service_id,
      'commissionRate', psc.commission_rate
    ))
    FROM pending_service_commissions psc
    WHERE psc.pending_service_id = ps.id
  ) AS commissions
FROM pending_services ps;