-- ============================================================
-- Business System — Initial Schema
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

CREATE TYPE order_status AS ENUM (
  'pending',          -- Pending
  'quote_issued',     -- 已開報價單
  'invoice_issued',   -- 已開發票
  'paid'              -- 已付款
);

CREATE TYPE document_type AS ENUM (
  'quote',     -- 報價單
  'contract',  -- 合約
  'invoice'    -- 發票
);

-- ── Customers ────────────────────────────────────────────────

CREATE TABLE customers (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name            TEXT        NOT NULL,
  tax_id                  TEXT,                          -- 統一編號
  address                 TEXT,
  reminder_months_before  INTEGER     NOT NULL DEFAULT 1, -- 到期前幾個月提醒
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Contacts (multiple per customer) ─────────────────────────

CREATE TABLE contacts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  email       TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Orders (contracts) ───────────────────────────────────────

CREATE TABLE orders (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id        UUID         NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  quote_number       TEXT         NOT NULL UNIQUE,  -- e.g. Q26032801
  quote_date         DATE         NOT NULL,
  quote_valid_until  DATE,
  contract_start_date DATE,
  contract_end_date   DATE,
  is_main_contract   BOOLEAN      NOT NULL DEFAULT TRUE,  -- 加購合約為 FALSE，無分潤
  status             order_status NOT NULL DEFAULT 'pending',
  payment_date       DATE,                                -- 收款日，付款後填入
  commission_year    INTEGER,                             -- 第幾年（以收款日起算），付款時計算
  reminder_sent_at   TIMESTAMPTZ,                        -- 提醒信寄出時間（每合約至多一次）
  -- Totals (maintained by application on item changes)
  subtotal           NUMERIC(12, 2) NOT NULL DEFAULT 0,  -- 未稅總計
  tax_amount         NUMERIC(12, 2) NOT NULL DEFAULT 0,  -- 稅額 5%
  total_amount       NUMERIC(12, 2) NOT NULL DEFAULT 0,  -- 含稅總計
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Order Items ──────────────────────────────────────────────

CREATE TABLE order_items (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sequence_number  INTEGER NOT NULL,                -- 項次
  name             TEXT    NOT NULL,                -- 項目名稱
  quantity         NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit             TEXT,                            -- 單位
  unit_price       NUMERIC(12, 2) NOT NULL,         -- 單價
  subtotal         NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  is_commissionable BOOLEAN NOT NULL DEFAULT FALSE, -- 是否分潤（設定後不更改）
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, sequence_number)
);

-- ── Commission Schedules ─────────────────────────────────────
-- Auto-generated when order status → paid (main contracts only).
-- Always 4 entries per order (quarterly disbursements over 1 year).

CREATE TABLE commission_schedules (
  id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                UUID           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  period_number           INTEGER        NOT NULL CHECK (period_number BETWEEN 1 AND 4),
  disbursement_date       DATE           NOT NULL,     -- 季首日
  commission_rate         NUMERIC(4, 3)  NOT NULL,     -- 0.500 (年1-2) or 0.300 (年3+)
  total_commission_amount NUMERIC(12, 2) NOT NULL,     -- 該期所有項目分潤合計
  created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, period_number)
);

-- ── Commission Schedule Items ────────────────────────────────
-- One row per (commissionable order_item × period).
-- Enables the commission report: customer / item / amount by date range.

CREATE TABLE commission_schedule_items (
  id                     UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_schedule_id UUID           NOT NULL REFERENCES commission_schedules(id) ON DELETE CASCADE,
  order_item_id          UUID           NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  item_subtotal          NUMERIC(12, 2) NOT NULL,   -- snapshot of order_item.subtotal at generation time
  commission_amount      NUMERIC(12, 2) NOT NULL,   -- item_subtotal * rate / 4
  created_at             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE (commission_schedule_id, order_item_id)
);

-- ── Documents (Google Drive links) ───────────────────────────

CREATE TABLE documents (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type                  document_type NOT NULL,
  google_drive_file_id  TEXT          NOT NULL,
  google_drive_url      TEXT          NOT NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────

CREATE INDEX idx_contacts_customer_id                ON contacts(customer_id);
CREATE INDEX idx_orders_customer_id                  ON orders(customer_id);
CREATE INDEX idx_orders_status                       ON orders(status);
CREATE INDEX idx_orders_contract_end_date            ON orders(contract_end_date);
CREATE INDEX idx_orders_payment_date                 ON orders(payment_date);
CREATE INDEX idx_order_items_order_id                ON order_items(order_id);
CREATE INDEX idx_commission_schedules_order_id       ON commission_schedules(order_id);
CREATE INDEX idx_commission_schedules_disbursement   ON commission_schedules(disbursement_date);
CREATE INDEX idx_commission_schedule_items_schedule  ON commission_schedule_items(commission_schedule_id);
CREATE INDEX idx_commission_schedule_items_item      ON commission_schedule_items(order_item_id);
CREATE INDEX idx_documents_order_id                  ON documents(order_id);

-- ── updated_at trigger ───────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
