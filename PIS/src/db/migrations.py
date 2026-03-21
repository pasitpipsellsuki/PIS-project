"""
Database Migration Utility
Product Information System

Usage:
    # Apply migrations
    python -m src.db.migrations apply
    
    # Reset database (careful - drops all data)
    python -m src.db.migrations reset
"""

from __future__ import annotations

import sqlite3
import os
from pathlib import Path
from typing import Optional


MIGRATIONS_DIR = Path(__file__).parent.parent.parent / 'migrations'


def get_db_connection(db_path: str | None = None) -> sqlite3.Connection:
    """Create database connection."""
    if db_path is None:
        # Use in-memory database for testing, or create local file
        db_path = os.getenv('DB_PATH', 'data/pis.db')
    
    # Ensure directory exists
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def apply_migrations(db_path: str | None = None) -> list[str]:
    """
    Apply all migration files in order.
    
    Returns:
        List of applied migration filenames
    """
    conn = get_db_connection(db_path)
    applied = []
    
    try:
        # Create migrations tracking table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS _migrations (
                filename TEXT PRIMARY KEY,
                applied_at TEXT DEFAULT (datetime('now'))
            )
        ''')
        conn.commit()
        
        # Get list of already applied migrations
        cursor = conn.execute('SELECT filename FROM _migrations')
        applied_files = {row['filename'] for row in cursor.fetchall()}
        
        # Get all migration files
        migration_files = sorted(MIGRATIONS_DIR.glob('*.sql'))
        
        for migration_file in migration_files:
            filename = migration_file.name
            
            if filename in applied_files:
                print(f"Skipping {filename} (already applied)")
                continue
            
            print(f"Applying {filename}...")
            
            # Read and execute migration
            sql = migration_file.read_text()
            conn.executescript(sql)
            conn.commit()
            
            # Record migration
            conn.execute(
                'INSERT INTO _migrations (filename) VALUES (?)',
                (filename,)
            )
            conn.commit()
            
            applied.append(filename)
            print(f"Applied {filename} [OK]")
        
        print(f"\nTotal migrations applied: {len(applied)}")
        
    except Exception as e:
        conn.rollback()
        raise RuntimeError(f"Migration failed: {e}")
    
    finally:
        conn.close()
    
    return applied


def reset_database(db_path: str | None = None) -> None:
    """
    Drop all tables and reapply migrations.
    WARNING: This deletes all data!
    """
    conn = get_db_connection(db_path)
    
    try:
        # Get all tables
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )
        tables = [row['name'] for row in cursor.fetchall()]
        
        # Drop all tables except sqlite_sequence
        for table in tables:
            if table != 'sqlite_sequence':
                print(f"Dropping table: {table}")
                conn.execute(f'DROP TABLE IF EXISTS {table}')
        
        conn.commit()
        print("All tables dropped.")
        
        # Clear migrations tracking
        conn.execute('DELETE FROM _migrations')
        conn.commit()
        
        print("Reapplying migrations...")
        apply_migrations(db_path)
        
    except Exception as e:
        conn.rollback()
        raise RuntimeError(f"Reset failed: {e}")
    
    finally:
        conn.close()


def get_migration_status(db_path: str | None = None) -> dict:
    """Get current migration status."""
    conn = get_db_connection(db_path)
    
    try:
        # Get applied migrations
        cursor = conn.execute(
            'SELECT filename, applied_at FROM _migrations ORDER BY filename'
        )
        applied = {row['filename']: row['applied_at'] for row in cursor.fetchall()}
        
        # Get all migration files
        all_files = sorted([f.name for f in MIGRATIONS_DIR.glob('*.sql')])
        
        return {
            'all_migrations': all_files,
            'applied': applied,
            'pending': [f for f in all_files if f not in applied]
        }
    
    except sqlite3.OperationalError:
        # _migrations table doesn't exist yet
        all_files = sorted([f.name for f in MIGRATIONS_DIR.glob('*.sql')])
        return {
            'all_migrations': all_files,
            'applied': {},
            'pending': all_files
        }
    
    finally:
        conn.close()


def verify_schema(db_path: str | None = None) -> dict:
    """Verify database schema matches expected structure."""
    conn = get_db_connection(db_path)
    
    expected_tables = ['products', 'locations', 'inventory']
    errors = []
    
    try:
        for table in expected_tables:
            cursor = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                (table,)
            )
            if not cursor.fetchone():
                errors.append(f"Missing table: {table}")
        
        return {
            'valid': len(errors) == 0,
            'tables_found': len(expected_tables) - len(errors),
            'tables_expected': len(expected_tables),
            'errors': errors
        }
    
    except Exception as e:
        return {
            'valid': False,
            'error': str(e)
        }
    
    finally:
        conn.close()


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python -m src.db.migrations [apply|reset|status|verify]")
        sys.exit(1)
    
    command = sys.argv[1]
    db_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    if command == 'apply':
        apply_migrations(db_path)
    
    elif command == 'reset':
        confirm = input(
            "WARNING: This will delete all data. Type 'yes' to confirm: "
        )
        if confirm == 'yes':
            reset_database(db_path)
        else:
            print("Cancelled.")
    
    elif command == 'status':
        status = get_migration_status(db_path)
        print(f"\nAll migrations: {status['all_migrations']}")
        print(f"Applied: {list(status['applied'].keys())}")
        print(f"Pending: {status['pending']}")
    
    elif command == 'verify':
        result = verify_schema(db_path)
        print(f"\nSchema valid: {result['valid']}")
        print(f"Tables: {result['tables_found']}/{result['tables_expected']}")
        if result.get('errors'):
            print(f"Errors: {result['errors']}")
    
    else:
        print(f"Unknown command: {command}")
        print("Usage: python -m src.db.migrations [apply|reset|status|verify]")
