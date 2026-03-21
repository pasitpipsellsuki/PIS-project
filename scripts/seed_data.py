"""
Data Seeding Script
Product Information System

Usage:
    python -m scripts.seed_data
    python -m scripts.seed_data --reset
"""

from __future__ import annotations

import sqlite3
import uuid
import random
from pathlib import Path
from datetime import datetime


def seed_data(db_path: str = 'data/pis.db', reset: bool = False) -> None:
    """
    Seed the database with sample data.
    
    Args:
        db_path: Path to SQLite database
        reset: If True, clear existing data first
    """
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    try:
        if reset:
            print("Clearing existing data...")
            conn.execute('DELETE FROM inventory')
            conn.execute('DELETE FROM products')
            conn.execute('DELETE FROM locations')
            conn.commit()
            print("Existing data cleared.")
        
        # Check if data already exists
        cursor = conn.execute('SELECT COUNT(*) FROM products')
        count = cursor.fetchone()[0]
        
        if count > 0 and not reset:
            print(f"Database already has {count} products. Use --reset to clear.")
            return
        
        print("Seeding products...")
        products = [
            ('PROD-ELEC-001', 'Laptop Pro X1', '15.6" business laptop, Intel i7, 16GB RAM', 'Electronics', 1299.99),
            ('PROD-ELEC-002', 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 'Electronics', 29.99),
            ('PROD-ELEC-003', 'USB-C Hub', '7-in-1 USB-C hub with HDMI and card reader', 'Electronics', 49.99),
            ('PROD-FURN-001', 'Standing Desk', 'Electric adjustable standing desk, 48x30"', 'Furniture', 399.99),
            ('PROD-FURN-002', 'Ergonomic Chair', 'Mesh back office chair with lumbar support', 'Furniture', 299.99),
            ('PROD-FURN-003', 'Bookshelf', '5-tier industrial style bookshelf', 'Furniture', 89.99),
            ('PROD-OFFICE-001', 'A4 Paper (500 sheets)', 'Premium quality printer paper', 'Office Supplies', 6.99),
            ('PROD-OFFICE-002', 'Stapler', 'Heavy duty stapler, 40 sheet capacity', 'Office Supplies', 12.99),
            ('PROD-OFFICE-003', 'Sticky Notes', '3x3 inch assorted color sticky notes, 12 pack', 'Office Supplies', 8.99),
            ('PROD-STORAGE-001', 'Storage Cabinet', '2-door metal storage cabinet, lockable', 'Storage', 199.99),
            ('PROD-STORAGE-002', 'File Box', 'Portable plastic file box with lid', 'Storage', 14.99),
            ('PROD-SAFE-001', 'Surge Protector', '8-outlet surge protector, 6ft cord', 'Safety', 24.99),
        ]
        
        product_ids = []
        for sku, name, desc, category, price in products:
            prod_id = str(uuid.uuid4())
            product_ids.append(prod_id)
            conn.execute('''
                INSERT INTO products (id, sku, name, description, category, price, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
            ''', (prod_id, sku, name, desc, category, price))
        
        conn.commit()
        print(f"Seeded {len(products)} products.")
        
        print("Seeding locations...")
        locations = [
            ('Main Distribution Center', 'warehouse', '1200 Industrial Blvd, Distribution District'),
            ('Westside Warehouse', 'warehouse', '800 West Road, Industrial Park'),
            ('Downtown Flagship Store', 'store', '500 Main Street, Downtown'),
            ('Mall Location', 'store', '1000 Shopping Center Drive, West Mall'),
            ('Eastside Store', 'store', '2000 East Avenue, Eastside'),
        ]
        
        location_ids = []
        for name, loc_type, address in locations:
            loc_id = str(uuid.uuid4())
            location_ids.append(loc_id)
            conn.execute('''
                INSERT INTO locations (id, name, type, address, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            ''', (loc_id, name, loc_type, address))
        
        conn.commit()
        print(f"Seeded {len(locations)} locations.")
        
        print("Seeding inventory...")
        inventory_count = 0
        
        for prod_id in product_ids:
            for loc_id in location_ids:
                # Skip some combinations for realistic data
                if random.random() < 0.15:  # 15% chance of no inventory
                    continue
                
                inv_id = str(uuid.uuid4())
                quantity = random.randint(0, 200)
                min_stock = random.randint(5, 25)
                
                conn.execute('''
                    INSERT INTO inventory (id, product_id, location_id, quantity, min_stock_level, last_updated)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                ''', (inv_id, prod_id, loc_id, quantity, min_stock))
                inventory_count += 1
        
        conn.commit()
        print(f"Seeded {inventory_count} inventory records.")
        
        # Show summary
        print("\n" + "="*50)
        print("SEED DATA SUMMARY")
        print("="*50)
        
        cursor = conn.execute('SELECT COUNT(*) FROM products')
        print(f"Products: {cursor.fetchone()[0]}")
        
        cursor = conn.execute('SELECT COUNT(*) FROM locations')
        print(f"Locations: {cursor.fetchone()[0]}")
        
        cursor = conn.execute('SELECT COUNT(*) FROM inventory')
        print(f"Inventory records: {cursor.fetchone()[0]}")
        
        cursor = conn.execute('''
            SELECT COUNT(*) FROM inventory WHERE quantity <= min_stock_level
        ''')
        print(f"Low stock items: {cursor.fetchone()[0]}")
        
        print("="*50)
        print("\nSeed data loaded successfully!")
        print("\nSample data:")
        
        # Show sample products
        print("\n--- Products ---")
        cursor = conn.execute('SELECT sku, name, category, price FROM products LIMIT 5')
        for row in cursor.fetchall():
            print(f"  {row['sku']}: {row['name']} ({row['category']}) - ${row['price']}")
        
        # Show sample locations
        print("\n--- Locations ---")
        cursor = conn.execute('SELECT name, type FROM locations LIMIT 5')
        for row in cursor.fetchall():
            print(f"  {row['name']} ({row['type']})")
        
        # Show low stock alerts
        print("\n--- Low Stock Alerts ---")
        cursor = conn.execute('''
            SELECT p.name, l.name as location_name, i.quantity, i.min_stock_level
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            JOIN locations l ON i.location_id = l.id
            WHERE i.quantity <= i.min_stock_level
            LIMIT 5
        ''')
        alerts = cursor.fetchall()
        if alerts:
            for row in alerts:
                print(f"  {row['name']} at {row['location_name']}: {row['quantity']}/{row['min_stock_level']}")
        else:
            print("  No low stock items")
        
    except Exception as e:
        conn.rollback()
        print(f"Error seeding data: {e}")
        raise
    
    finally:
        conn.close()


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Seed database with sample data')
    parser.add_argument('--reset', action='store_true', help='Clear existing data first')
    parser.add_argument('--db', default='data/pis.db', help='Database path')
    
    args = parser.parse_args()
    
    seed_data(args.db, args.reset)
