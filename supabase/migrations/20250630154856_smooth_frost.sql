-- Function to begin a transaction
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void AS $$
BEGIN
  EXECUTE 'BEGIN';
END;
$$ LANGUAGE plpgsql;

-- Function to commit a transaction
CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void AS $$
BEGIN
  EXECUTE 'COMMIT';
END;
$$ LANGUAGE plpgsql;

-- Function to rollback a transaction
CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void AS $$
BEGIN
  EXECUTE 'ROLLBACK';
END;
$$ LANGUAGE plpgsql;