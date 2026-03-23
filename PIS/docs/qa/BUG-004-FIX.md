# 🔧 BUG-004: Login Failure - FIXED

**Date:** 2026-03-22  
**Status:** ✅ **FIXED**  
**Root Cause:** Password hash mismatch

---

## Problem

Login failed with "Invalid email or password" error even when using correct credentials (admin@pis.local / admin123).

---

## Root Cause Analysis

**Dexter 💻 identified:**

1. **auth.ts** uses SHA-256 for password hashing:
   ```typescript
   async function hashPassword(password: string): Promise<string> {
     const encoder = new TextEncoder();
     const data = encoder.encode(password);
     const hash = await crypto.subtle.digest('SHA-256', data);
     return btoa(String.fromCharCode(...new Uint8Array(hash)));
   }
   ```

2. **002_add_users_table.sql** had placeholder bcrypt hash:
   ```sql
   '$2b$10$YourHashHere'  -- Wrong format!
   ```

3. **Result:** SHA-256("admin123") ≠ bcrypt hash → Login always failed

---

## Fix Applied

Updated migration file with correct SHA-256 hash:

```sql
-- Before (WRONG):
INSERT OR IGNORE INTO users (id, email, password_hash, name, role, is_active) VALUES
    ('user-001', 'admin@pis.local', '$2b$10$YourHashHere', 'System Administrator', 'admin', 1);

-- After (CORRECT):
INSERT OR IGNORE INTO users (id, email, password_hash, name, role, is_active) VALUES
    ('user-001', 'admin@pis.local', 'PJkJr+wlNU1VHa4hWQuybjjVPyFzuNPcPu5MBH56scE=', 'System Administrator', 'admin', 1);
```

**Hash:** `PJkJr+wlNU1VHa4hWQuybjjVPyFzuNPcPu5MBH56scE=` = SHA-256("admin123") in base64

---

## Deployment Required

The migration file has been fixed. To apply:

```bash
# Re-run the migration
npx wrangler d1 execute pis-project-db --file=migrations/002_add_users_table.sql

# Or reset the users table first
npx wrangler d1 execute pis-project-db --command="DELETE FROM users;"
npx wrangler d1 execute pis-project-db --file=migrations/002_add_users_table.sql
```

---

## Verification Steps

1. Navigate to login page
2. Enter: admin@pis.local / admin123
3. Should redirect to Dashboard
4. User name should display in navbar

---

**Fixed by:** Dexter 💻  
**Tested by:** Pending QA  
**Deployed by:** Pending DevOps
