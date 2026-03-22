# 🔐 Where to Add Secrets in GitHub

## ✅ Answer: Repository Secrets

Add them here:
```
https://github.com/pasitpipsellsuki/PIS-project/settings/secrets/actions
```

Then click: **"New repository secret"** (NOT "New environment secret")

---

## 📍 Screenshot of Where to Click:

GitHub Repo → Settings → Secrets and variables → Actions

You'll see two tabs:
- **Repository secrets** ← ✅ CLICK THIS ONE
- Environment secrets

---

## 🔧 Steps:

1. Go to: https://github.com/pasitpipsellsuki/PIS-project/settings/secrets/actions

2. Click the **green button: "New repository secret"**

3. Add Secret 1:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: `cfat_DMFvkTB8Z0Bh5KpxES6YJAjW3TC44rSP0ZFV6kCGfdede876`

4. Click **"Add secret"**

5. Click **"New repository secret"** again

6. Add Secret 2:
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: `167a8480e678d107ba817afbe6b0a202`

7. Click **"Add secret"**

---

## ✅ That's It!

Both secrets should now show in the **Repository secrets** list.

**Why repository secrets?** Because the deployment workflow runs on every push to master and needs these credentials to deploy to Cloudflare.

---

**Next:** Run the database migration:
```powershell
cd D:\Team_Agents\PIS
npx wrangler d1 execute pis-project-db --file=migrations/002_add_users_table.sql
```
