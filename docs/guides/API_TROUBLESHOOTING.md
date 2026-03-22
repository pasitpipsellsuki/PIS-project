# 🔍 API Troubleshooting Guide
## Why API URL Might Not Be Reachable

**Reported by:** User  
**Date:** 2026-03-21  
**Issue:** API deployed but URL not reachable

---

## 🔎 Investigation Results

### Current Status
- ✅ Worker deployed successfully (commit 518d110)
- ✅ Build completed without errors
- ✅ D1 database binding configured
- ❓ API endpoint not responding

### Most Likely Causes

#### Cause #1: Database Tables Not Created ⭐ HIGHEST PROBABILITY
**Problem:** Worker is deployed but database has no tables.

**Evidence:**
- Worker code deployed successfully
- But `/api/health` might fail if database query errors
- `/api/products` will fail if tables don't exist

**Fix:** Run database migrations

```bash
# Option A: Using Wrangler CLI
npx wrangler d1 execute pis-project-db --file=PIS/migrations/001_initial_schema.sql

# Option B: Using Cloudflare Dashboard
# 1. Go to D1 database in dashboard
# 2. Click "Query" tab
# 3. Copy contents of PIS/migrations/001_initial_schema.sql
# 4. Paste and execute
```

---

#### Cause #2: Missing CORS Headers
**Problem:** Worker deployed but frontend can't connect.

**Evidence:**
- API works from browser directly
- But frontend shows CORS errors

**Status:** ✅ Already fixed in code - CORS is configured in `PIS/src/index.ts`

---

#### Cause #3: Database Not Seeded
**Problem:** Tables exist but empty, causing errors.

**Evidence:**
- API might crash on empty queries
- Endpoints expecting data fail

**Fix:** Seed database with test data

```bash
# Run seed script locally with production database
npx wrangler d1 execute pis-project-db --command="INSERT INTO products..."

# Or use Python with D1 binding
python PIS/scripts/seed_data.py
```

---

#### Cause #4: Worker Binding Issues
**Problem:** Worker can't connect to D1 database.

**Evidence:**
- Deployment successful
- But API calls timeout or error

**Check in Cloudflare Dashboard:**
1. Go to: Workers & Pages → pis-project
2. Click: "Settings" tab
3. Click: "Variables" → "D1 Database Bindings"
4. Verify `DB` binding points to `pis-project-db`

---

#### Cause #5: Wrong URL
**Problem:** Testing wrong URL.

**Correct URLs:**
- ❌ Old: `https://pis-project.pasitpipsellsuki.workers.dev` (might be wrong subdomain)
- ✅ Actual: Check Cloudflare dashboard for exact URL

**To find actual URL:**
1. Go to: https://dash.cloudflare.com/167a8480e678d107ba817afbe6b0a202
2. Click: Workers & Pages
3. Find "pis-project"
4. Look for "Preview URL" or "Production URL"

---

## 🎯 Recommended Fix Order

### Step 1: Verify URL ⭐ FIRST
**Check actual Worker URL in Cloudflare dashboard:**
1. Go to Workers & Pages
2. Click on "pis-project"
3. Look for the URL (might be different than expected)

### Step 2: Run Migrations ⭐ MOST IMPORTANT
**Database tables must exist:**
```bash
npx wrangler d1 execute pis-project-db --file=PIS/migrations/001_initial_schema.sql
```

### Step 3: Seed Data
**Add test data:**
```bash
# This requires local setup with database credentials
python PIS/scripts/seed_data.py
```

### Step 4: Test API
**Test these endpoints:**
```
GET https://[actual-url]/api/health
GET https://[actual-url]/api/products
```

---

## 🚨 Most Likely Issue

**Database migrations haven't been run!**

The Worker code is deployed but the database tables don't exist. When you try to access the API, it fails because it can't query non-existent tables.

**Solution:** Run the migration SQL against your D1 database.

---

## ✅ Quick Test

**Check if database has tables:**
```bash
npx wrangler d1 execute pis-project-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**Expected output:**
```
products
locations
inventory
```

**If no tables listed → Run migrations!**

---

## 📝 Next Steps

1. **Check actual Worker URL** in Cloudflare dashboard
2. **Run database migrations** (highest priority)
3. **Test `/api/health` endpoint**
4. **Report back** what you find

**Devon 🚀 - Troubleshooting Guide Complete**
