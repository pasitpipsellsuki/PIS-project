# 🚀 UAT Deployment Guide - Devon 🚀

**Cloudflare Account:** https://dash.cloudflare.com/167a8480e678d107ba817afbe6b0a202  
**Worker:** pis-project  
**Status:** Ready to deploy

---

## ⚡ Quick Deploy (Copy & Paste These Commands)

### Step 1: Open Terminal in Project Folder
```bash
cd D:\Team_Agents\PIS
```

### Step 2: Verify Cloudflare Login
```bash
npx wrangler whoami
```
If not logged in, run:
```bash
npx wrangler login
```

### Step 3: Create D1 Database (One-time setup)
```bash
npx wrangler d1 create pis-uat-db
```

**Important:** Copy the `database_id` from the output! It looks like:
```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Step 4: Update wrangler.toml
Open `PIS/wrangler.toml` and replace:
```toml
database_id = ""  # Empty
```

With your actual database ID:
```toml
database_id = "your-copied-database-id-here"
```

### Step 5: Deploy API
```bash
npx wrangler deploy
```

This will output your **actual API URL**, for example:
```
✨ Successfully deployed to:
pis-project.pasitpipsellsuki.workers.dev
```

### Step 6: Run Database Migrations
```bash
npx wrangler d1 execute pis-uat-db --file=migrations/001_initial_schema.sql
```

### Step 7: Seed Test Data
```bash
cd ..
python -m PIS.scripts.seed_data
```

### Step 8: Build & Deploy Frontend
```bash
cd PIS/src/frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name=pis-uat
```

This will output your **actual Frontend URL**.

---

## ✅ Verify Deployment

Test these URLs in your browser:

1. **API Health Check:**
   ```
   https://pis-project.pasitpipsellsuki.workers.dev/api/health
   ```
   Should return: `{"status": "ok"}`

2. **Products API:**
   ```
   https://pis-project.pasitpipsellsuki.workers.dev/api/products
   ```
   Should return: JSON with products

3. **Frontend:**
   URL will be shown after pages deployment (usually `https://pis-uat.pages.dev`)

---

## 🎯 After Deployment

Once you have the real URLs, update:
1. `PIS/src/frontend/src/api.ts` with the real API URL
2. Rebuild and redeploy frontend

Then the user can access the live system!

---

## 🆘 If Something Goes Wrong

**Check Cloudflare Dashboard:**
1. Go to: https://dash.cloudflare.com/167a8480e678d107ba817afbe6b0a202
2. Check Workers & Pages section
3. Check D1 Databases section

**Common Issues:**
- ❌ "Not authenticated" → Run `npx wrangler login`
- ❌ "Database not found" → Create it first with `npx wrangler d1 create`
- ❌ "Build failed" → Run `npm install` first

---

**Devon 🚀 - Ready to assist with deployment!**
