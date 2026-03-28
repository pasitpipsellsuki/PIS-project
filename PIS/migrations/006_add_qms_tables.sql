-- Plans: grouping of digital product SKUs with purchase rules
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  purchase_type TEXT NOT NULL DEFAULT 'one_time' CHECK(purchase_type IN ('one_time', 'subscription')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Plan Items: which digital products are in each plan
CREATE TABLE IF NOT EXISTS plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(plan_id, product_id)
);

-- Quota Rules: how quota is measured for a plan
CREATE TABLE IF NOT EXISTS quota_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK(rule_type IN ('download_limit', 'access_duration')),
  value INTEGER NOT NULL,
  unit TEXT CHECK(unit IN ('days', 'months', NULL)),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Plan Customers: track who holds each plan and their usage
CREATE TABLE IF NOT EXISTS plan_customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  quota_used INTEGER NOT NULL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expired', 'cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
