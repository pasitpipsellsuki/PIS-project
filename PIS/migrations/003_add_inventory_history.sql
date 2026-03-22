-- Migration: 003_add_inventory_history.sql
-- Track inventory changes for audit trail
-- Created: 2026-03-22

-- ============================================
-- INVENTORY_HISTORY TABLE
-- Tracks all inventory adjustments
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_history (
    id TEXT PRIMARY KEY,                                    -- UUID v4
    inventory_id TEXT NOT NULL,                           -- Reference to inventory.id
    product_id TEXT NOT NULL,                             -- Reference to products.id
    location_id TEXT NOT NULL,                            -- Reference to locations.id
    previous_quantity INTEGER NOT NULL,                   -- Quantity before change
    new_quantity INTEGER NOT NULL,                        -- Quantity after change
    adjustment INTEGER NOT NULL,                          -- Change amount (positive/negative)
    reason TEXT,                                          -- Optional reason for change
    user_id TEXT,                                         -- User who made the change
    created_at TEXT NOT NULL DEFAULT (datetime('now'))    -- When the change occurred
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_history_inventory ON inventory_history(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_product ON inventory_history(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_location ON inventory_history(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created ON inventory_history(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_history_user ON inventory_history(user_id);

-- View: Inventory history with product and location names
CREATE VIEW IF NOT EXISTS v_inventory_history AS
SELECT 
    h.id,
    h.inventory_id,
    h.product_id,
    p.sku as product_sku,
    p.name as product_name,
    h.location_id,
    l.name as location_name,
    h.previous_quantity,
    h.new_quantity,
    h.adjustment,
    h.reason,
    h.user_id,
    u.name as user_name,
    h.created_at
FROM inventory_history h
JOIN products p ON h.product_id = p.id
JOIN locations l ON h.location_id = l.id
LEFT JOIN users u ON h.user_id = u.id
ORDER BY h.created_at DESC;
