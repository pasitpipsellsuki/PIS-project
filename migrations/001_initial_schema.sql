-- Migration: 001_initial_schema.sql
-- Product Information System - Database Schema
-- Created: 2026-03-21

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- ============================================
-- PRODUCTS TABLE
-- Stores product information (catalog)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,                                    -- UUID v4
    sku TEXT NOT NULL UNIQUE,                               -- Stock Keeping Unit (unique identifier)
    name TEXT NOT NULL,                                     -- Product name
    description TEXT,                                       -- Product description (optional)
    category TEXT,                                        -- Product category
    price REAL CHECK (price >= 0),                        -- Unit price (non-negative)
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)), -- Soft delete flag (0=deleted, 1=active)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),     -- Creation timestamp (ISO8601)
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))      -- Last update timestamp (ISO8601)
);

-- Index for SKU lookups (frequent searches)
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Index for active products (common query pattern)
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- ============================================
-- LOCATIONS TABLE
-- Stores store and warehouse information
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,                                    -- UUID v4
    name TEXT NOT NULL,                                     -- Location name (e.g., "Main Warehouse", "Store #1")
    type TEXT NOT NULL CHECK (type IN ('store', 'warehouse')), -- Location type
    address TEXT,                                           -- Physical address
    created_at TEXT NOT NULL DEFAULT (datetime('now'))    -- Creation timestamp
);

-- Index for location type filtering
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

-- ============================================
-- INVENTORY TABLE
-- Tracks stock levels per product per location
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,                                    -- UUID v4
    product_id TEXT NOT NULL,                             -- Reference to products.id
    location_id TEXT NOT NULL,                            -- Reference to locations.id
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0), -- Current stock level (non-negative)
    min_stock_level INTEGER NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0), -- Minimum threshold for low stock alerts
    last_updated TEXT NOT NULL DEFAULT (datetime('now')),   -- Last stock update timestamp
    
    -- Foreign key constraints with cascade on delete for inventory cleanup
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    
    -- Unique constraint: one inventory record per product-location pair
    UNIQUE(product_id, location_id)
);

-- Index for product lookups in inventory
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

-- Index for location lookups in inventory
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);

-- Index for low stock queries
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(quantity, min_stock_level) 
    WHERE quantity <= min_stock_level;

-- ============================================
-- TRIGGERS
-- Automatic updated_at timestamp for products
-- ============================================
CREATE TRIGGER IF NOT EXISTS trg_products_updated_at 
AFTER UPDATE ON products
BEGIN
    UPDATE products 
    SET updated_at = datetime('now') 
    WHERE id = NEW.id;
END;

-- ============================================
-- SAMPLE DATA
-- For development and testing
-- ============================================

-- Sample products
INSERT INTO products (id, sku, name, description, category, price, is_active) VALUES
    ('prod-001', 'LAPTOP-001', 'ProBook 450', '15.6" business laptop', 'Electronics', 899.99, 1),
    ('prod-002', 'PHONE-001', 'SmartPhone X12', '6.1" flagship smartphone', 'Electronics', 699.99, 1),
    ('prod-003', 'DESK-001', 'Ergonomic Office Desk', 'Adjustable height desk', 'Furniture', 349.99, 1),
    ('prod-004', 'CHAIR-001', 'Executive Office Chair', 'Leather ergonomic chair', 'Furniture', 249.99, 1),
    ('prod-005', 'PAPER-001', 'A4 Copy Paper (500 sheets)', 'Premium quality paper', 'Office Supplies', 5.99, 1);

-- Sample locations
INSERT INTO locations (id, name, type, address) VALUES
    ('loc-001', 'Main Warehouse', 'warehouse', '100 Industrial Blvd, Warehouse District'),
    ('loc-002', 'Downtown Store', 'store', '500 Main Street, Downtown'),
    ('loc-003', 'Westside Store', 'store', '1200 West Avenue, Westside'),
    ('loc-004', 'North Distribution Center', 'warehouse', '800 North Road, Industrial Park');

-- Sample inventory data
INSERT INTO inventory (id, product_id, location_id, quantity, min_stock_level) VALUES
    -- Laptop inventory
    ('inv-001', 'prod-001', 'loc-001', 150, 20),
    ('inv-002', 'prod-001', 'loc-002', 25, 5),
    ('inv-003', 'prod-001', 'loc-003', 18, 5),
    
    -- Phone inventory
    ('inv-004', 'prod-002', 'loc-001', 300, 50),
    ('inv-005', 'prod-002', 'loc-002', 45, 10),
    ('inv-006', 'prod-002', 'loc-003', 32, 10),
    
    -- Furniture inventory
    ('inv-007', 'prod-003', 'loc-001', 75, 10),
    ('inv-008', 'prod-003', 'loc-004', 40, 5),
    ('inv-009', 'prod-004', 'loc-001', 60, 8),
    ('inv-010', 'prod-004', 'loc-004', 25, 5),
    
    -- Office supplies
    ('inv-011', 'prod-005', 'loc-001', 1000, 200),
    ('inv-012', 'prod-005', 'loc-002', 500, 100),
    ('inv-013', 'prod-005', 'loc-003', 400, 100),
    ('inv-014', 'prod-005', 'loc-004', 800, 150);

-- ============================================
-- VIEWS
-- Useful views for common queries
-- ============================================

-- View: Product inventory summary across all locations
CREATE VIEW IF NOT EXISTS v_product_inventory_summary AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    p.category,
    p.price,
    p.is_active,
    COUNT(DISTINCT i.location_id) AS location_count,
    COALESCE(SUM(i.quantity), 0) AS total_stock,
    MIN(i.quantity) AS min_stock_at_location,
    MAX(i.quantity) AS max_stock_at_location
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
GROUP BY p.id, p.sku, p.name, p.category, p.price, p.is_active;

-- View: Low stock alerts
CREATE VIEW IF NOT EXISTS v_low_stock_alerts AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    l.id AS location_id,
    l.name AS location_name,
    l.type AS location_type,
    i.quantity,
    i.min_stock_level,
    (i.min_stock_level - i.quantity) AS shortage
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN locations l ON i.location_id = l.id
WHERE i.quantity <= i.min_stock_level
ORDER BY shortage DESC;

-- View: Location inventory summary
CREATE VIEW IF NOT EXISTS v_location_inventory_summary AS
SELECT 
    l.id AS location_id,
    l.name AS location_name,
    l.type AS location_type,
    COUNT(DISTINCT i.product_id) AS product_count,
    COALESCE(SUM(i.quantity), 0) AS total_units,
    COUNT(CASE WHEN i.quantity <= i.min_stock_level THEN 1 END) AS low_stock_items
FROM locations l
LEFT JOIN inventory i ON l.id = i.location_id
GROUP BY l.id, l.name, l.type;
