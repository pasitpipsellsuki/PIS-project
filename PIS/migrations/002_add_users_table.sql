-- Migration: 002_add_users_table.sql
-- Authentication system - Users table
-- Created: 2026-03-22

-- ============================================
-- USERS TABLE
-- Stores user accounts for authentication
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                                    -- UUID v4
    email TEXT NOT NULL UNIQUE,                             -- User email (login identifier)
    password_hash TEXT NOT NULL,                            -- Bcrypt hashed password
    name TEXT NOT NULL,                                     -- User's full name
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')), -- User role
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)), -- Account status
    last_login TEXT,                                        -- Last successful login timestamp
    created_at TEXT NOT NULL DEFAULT (datetime('now')),     -- Creation timestamp
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))      -- Last update timestamp
);

-- Index for email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ============================================
-- TRIGGERS
-- Automatic updated_at timestamp for users
-- ============================================
CREATE TRIGGER IF NOT EXISTS trg_users_updated_at 
AFTER UPDATE ON users
BEGIN
    UPDATE users 
    SET updated_at = datetime('now') 
    WHERE id = NEW.id;
END;

-- ============================================
-- DEFAULT ADMIN USER
-- Email: admin@pis.local
-- Password: admin123
-- ============================================
-- First delete existing admin to ensure fresh record
DELETE FROM users WHERE email = 'admin@pis.local';

-- SHA-256 hash of "admin123" encoded as base64
INSERT INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at) VALUES
    ('user-001', 'admin@pis.local', 'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=', 'System Administrator', 'admin', 1, datetime('now'), datetime('now'));
