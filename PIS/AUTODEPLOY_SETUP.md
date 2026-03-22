# 🚀 AUTOMATIC DEPLOYMENT SETUP

**Created by:** Devon 🚀 (DevOps)  
**Date:** 2026-03-22  
**Status:** ✅ CONFIGURED - Secrets Setup Required

---

## 🎯 What This Does

**Automatic deployment on every push to GitHub!**

No more manual commands. Just:
1. Push code to GitHub
2. GitHub Actions automatically deploys to Cloudflare
3. Site updates in ~2 minutes

---

## 📋 ONE-TIME SETUP (5 minutes)

### Step 1: Add Secrets to GitHub

Go to your GitHub repository:
```
https://github.com/pasitpipsellsuki/PIS-project/settings/secrets/actions
```

Add these 2 secrets:

| Secret Name | Value |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | `cfat_DMFvkTB8Z0Bh5KpxES6YJAjW3TC44rSP0ZFV6kCGfdede876` |
| `CLOUDFLARE_ACCOUNT_ID` | `167a8480e678d107ba817afbe6b0a202` |

### Step 2: How to Add

1. Click **"New repository secret"**
2. Enter name: `CLOUDFLARE_API_TOKEN`
3. Enter value: (your token)
4. Click **Add secret**
5. Repeat for `CLOUDFLARE_ACCOUNT_ID`

---

## ✅ THAT'S IT!

Now on every push to `master` branch:
- ✅ API deploys automatically
- ✅ Frontend builds & deploys automatically
- ✅ No commands needed!

---

## 🧪 Test It

After adding secrets, push any change:

```bash
cd D:\Team_Agents\PIS
git add .
git commit -m "test: auto-deployment"
git push origin master
```

Watch deployment at:
```
https://github.com/pasitpipsellsuki/PIS-project/actions
```

---

## 📊 Workflow Details

**File:** `.github/workflows/deploy.yml`

**Jobs:**
1. **deploy-api** - Deploys Worker to Cloudflare
2. **deploy-frontend** - Builds & deploys Pages site

**Triggers:**
- Push to `master` or `main`
- Manual trigger (button in GitHub Actions tab)

---

## 🔒 Security

- Secrets are encrypted by GitHub
- Never exposed in logs
- Only used during deployment

---

**Status:** ⚙️ Waiting for secrets configuration  
**Next:** Push to test auto-deployment
