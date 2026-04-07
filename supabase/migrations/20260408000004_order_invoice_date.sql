ALTER TABLE orders
  DROP COLUMN quote_valid_until,
  ADD COLUMN invoice_date DATE;
