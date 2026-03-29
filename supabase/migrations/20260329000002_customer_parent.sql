-- 支援子公司：客戶可以有上層母公司
ALTER TABLE customers
  ADD COLUMN parent_id UUID REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX idx_customers_parent_id ON customers(parent_id);
