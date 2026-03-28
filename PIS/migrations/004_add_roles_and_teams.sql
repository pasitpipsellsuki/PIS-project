-- Migration: 004_add_roles_and_teams.sql
-- Sprint 5: Back Office & Access Control
-- Created: 2026-03-26

-- ============================================
-- NOTE: The existing 'role' column has a CHECK constraint of ('admin', 'user')
-- We need to work around SQLite's inability to DROP/MODIFY columns
-- Strategy: Add new columns, populate them, and update the old role column
-- by dropping the constraint is not possible in SQLite.
-- Instead we'll create a new 'rbac_role' column to hold the new roles,
-- then update the API to use 'rbac_role' going forward.
-- ============================================

-- Add rbac_role column (new RBAC role without constraint)
ALTER TABLE users ADD COLUMN rbac_role TEXT NOT NULL DEFAULT 'staff';

-- Map existing roles to new RBAC roles
-- 'admin' -> 'admin', 'user' -> 'staff'
UPDATE users SET rbac_role = 'admin' WHERE role = 'admin';
UPDATE users SET rbac_role = 'staff' WHERE role = 'user';
UPDATE users SET rbac_role = 'admin' WHERE email = 'admin@pis.local';

-- Add team_id column to users
ALTER TABLE users ADD COLUMN team_id INTEGER;

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  lead_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for team lookups
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);

-- Trigger for teams updated_at
CREATE TRIGGER IF NOT EXISTS trg_teams_updated_at
AFTER UPDATE ON teams
BEGIN
  UPDATE teams SET updated_at = datetime('now') WHERE id = NEW.id;
END;
