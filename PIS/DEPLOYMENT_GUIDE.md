# 🚀 PIS Manual Deployment Guide

**Use this guide if automatic deployment fails**

## Prerequisites

- Node.js 18+ installed
- npm (comes with Node.js)
- Your Cloudflare credentials configured

---

## Option 1: Using Deployment Scripts

### Windows
```powershell
# Open PowerShell or Command Prompt as Administrator
cd D:\Team_Agents\PIS
.\deploy-uat.bat
```

### Mac/Linux
```bash
# Open Terminal
cd /path/to/PIS
chmod +x deploy-uat.sh
./deploy-uat.sh
```

---

## Option 2: Step-by-Step Manual Deployment

### Step 1: Install Dependencies
```bash
cd D:\Team_Agents\PIS
npm install
```

### Step 2: Configure Wrangler
```bash
# Login to Cloudflare (one-time setup)
npx wrangler login

# Or use your token directly
export CLOUDFLARE_API_TOKEN="cfat_DMFvkTB8Z0Bh5KpxES6YJAjW3TC44rSP0ZFV6kCGfdede876"
export CLOUDFLARE_ACCOUNT_ID="167a8480e678d107ba817afbe6b0a202"
```

### Step 3: Create D1 Database (if not exists)
```bash
npx wrangler d1 create pis-project-db
# Note the database_id and update wrangler.toml
```

### Step 4: Run Database Migrations
```bash
npx wrangler d1 execute pis-project-db --file=migrations/001_initial_schema.sql
```

### Step 5: Seed Database
```bash
# Install Python dependencies if needed
pip install requests

# Run seed script (modify for Cloudflare D1)
python scripts/seed_data.py
```

### Step 6: Deploy API (Cloudflare Workers)
```bash
npx wrangler deploy --env uat
```

**Expected Output:**
```
✨ Successfully deployed
  URL: https://pis-project-uat.YOUR_SUBDOMAIN.workers.dev
```

### Step 7: Deploy Frontend (Cloudflare Pages)
```bash
cd src/frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name=pis-project-uat
```

**Expected Output:**
```
✨ Successfully deployed
  URL: https://pis-project-uat.pages.dev
```

---

## Step 8: Update Frontend API URL

Edit `src/frontend/src/api.ts`:
```typescript
// Replace with your actual Worker URL
const API_BASE_URL = 'https://pis-project-uat.YOUR_SUBDOMAIN.workers.dev';
```

Then rebuild and redeploy:
```bash
cd src/frontend
npm run build
npx wrangler pages deploy dist --project-name=pis-project-uat
```

---

## Verification Checklist

- [ ] API health check: `GET https://pis-project-uat.YOUR_SUBDOMAIN.workers.dev/api/health`
- [ ] Frontend loads: `https://pis-project-uat.pages.dev`
- [ ] Database connected
- [ ] Products list loads
- [ ] Can add/edit/delete products
- [ ] Locations management works
- [ ] Inventory adjustments work
- [ ] Low stock alerts display

---

## Troubleshooting

### Issue: "wrangler not found"
```bash
npm install -g wrangler
```

### Issue: "Authentication error"
- Verify your API token has Workers and Pages permissions
- Check that Account ID is correct

### Issue: "Database binding not found"
- Update `wrangler.toml` with correct `database_id`

### Issue: "Build fails"
```bash
cd src/frontend
rm -rf node_modules
npm install
npm run build
```

---

## Quick Reference URLs

After successful deployment:

| Component | URL Format |
|-----------|-----------|
| API | `https://pis-project-uat.YOUR_SUBDOMAIN.workers.dev` |
| Frontend | `https://pis-project-uat.pages.dev` |
| Health Check | `https://pis-project-uat.YOUR_SUBDOMAIN.workers.dev/api/health` |

---

## Need Help?

Contact Priya 🧭 for assistance or escalate to user.

**DO NOT COMMIT CREDENTIALS TO GITHUB**
