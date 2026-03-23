# 📝 Dexter Assignment: AUTH-004

**Date:** 2026-03-23  
**Assigned by:** Priya 🧭  
**Story:** AUTH-004 — Real Authentication System  
**Priority:** Critical 🔴

---

## 🎯 Mission

Fix the login failure AND implement Google OAuth alongside existing email/password auth.

**Decision made:** Option B — Support BOTH Google OAuth AND email/password

---

## Phase 1: Fix Login Failure (Do This First)

### Problem
User reports login with admin@pis.local / admin123 still fails on https://pis-project.pages.dev

### Your Investigation Checklist

**Step 1: Verify the SHA-256 Hash**
The migration has this hash: `PJkJr+wlNU1VHa4hWQuybjjVPyFzuNPcPu5MBH56scE=`

Test it:
```typescript
// Run this in Node.js or browser console
async function testHash() {
  const encoder = new TextEncoder();
  const data = encoder.encode("admin123");
  const hash = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  console.log(base64);
  // Should match: PJkJr+wlNU1VHa4hWQuybjjVPyFzuNPcPu5MBH56scE=
}
testHash();
```

**Step 2: Test API Directly**
```bash
curl -X POST https://pis-project-prod.pasitpipsellsuki.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pis.local","password":"admin123"}' \
  -v
```

**Step 3: Check Database**
```bash
cd D:\Team_Agents\PIS
npx wrangler d1 execute pis-project-db --command="SELECT email, password_hash FROM users WHERE email='admin@pis.local';"
```

**Step 4: Check Live Site**
- Open https://pis-project.pages.dev
- DevTools → Console → Try login → Capture errors
- Network tab → Check /api/auth/login request/response

### Common Issues to Check
- [ ] CORS headers on auth endpoints
- [ ] Database record exists for admin@pis.local
- [ ] Password hash matches
- [ ] API endpoint is reachable
- [ ] Frontend is sending correct request format

### Phase 1 Deliverable
Report to Priya within 2 hours:
- Root cause found
- Fix applied (if quick)
- Or detailed report if complex issue

---

## Phase 2: Implement Google OAuth

### Architecture Decision
Support BOTH:
1. **Email/Password** (existing) — for users without Google accounts
2. **Google OAuth** (new) — for convenience

### Implementation Steps

**Step 1: Google Cloud Console Setup**
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add redirect URIs:
   - `https://pis-project.pages.dev/auth/callback`
   - `http://localhost:5173/auth/callback` (dev)
4. Copy Client ID and Client Secret

**Step 2: Database Migration**
Create `PIS/migrations/004_update_users_for_oauth.sql`:
```sql
-- Add OAuth fields to users table
ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'email' CHECK (auth_provider IN ('email', 'google'));

-- Index for Google ID lookups
CREATE INDEX idx_users_google_id ON users(google_id);
```

**Step 3: Backend Updates**
Update `PIS/src/api/auth.ts`:
- Add `/api/auth/google` endpoint for OAuth callback
- Verify Google ID token (use Google's public keys)
- Create user if doesn't exist
- Link to existing user if email matches
- Return same JWT format as email auth

**Step 4: Frontend Updates**
Update `PIS/src/frontend/src/components/Login.tsx`:
- Add "Sign in with Google" button
- Style it properly (Google's brand guidelines)

Update `PIS/src/frontend/src/context/AuthContext.tsx`:
- Add `loginWithGoogle()` function
- Handle OAuth callback
- Store token same way

Install dependency:
```bash
cd PIS/src/frontend
npm install @react-oauth/google
```

**Step 5: Environment Variables**
Add to `PIS/src/frontend/.env`:
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Add to `PIS/.env.local`:
```
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Update `PIS/wrangler.toml`:
```toml
[env.production]
name = "pis-project-prod"
vars = { GOOGLE_CLIENT_ID = "your_client_id" }
# GOOGLE_CLIENT_SECRET added via wrangler secret
```

---

## Phase 2 Deliverables

- [ ] Database migration file created and tested
- [ ] Backend OAuth endpoints working
- [ ] Frontend Google Sign-In button working
- [ ] Both auth methods tested locally
- [ ] Environment variables documented
- [ ] Code committed: `git add . && git commit -m "feat(auth): Add Google OAuth support - AUTH-004"`
- [ ] Code pushed: `git push origin master`

---

## OAuth Flow Reference

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│    Google   │────▶│   Backend   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                                         │
      │  1. Click "Sign in with Google"        │
      │────────────────────────────────────────▶│
      │                                         │
      │  2. Redirect to Google OAuth           │
      │◀────────────────────────────────────────│
      │                                         │
      │  3. User consents, Google redirects    │
      │    to /auth/callback with code         │
      │────────────────────────────────────────▶│
      │                                         │
      │  4. Backend exchanges code for tokens  │
      │                                         │
      │  5. Backend verifies ID token          │
      │    creates/updates user                │
      │                                         │
      │  6. Backend returns JWT                │
      │◀────────────────────────────────────────│
      │                                         │
      │  7. Frontend stores JWT                │
      │    redirects to dashboard              │
```

---

## Testing Checklist

- [ ] Email login still works (admin@pis.local / admin123)
- [ ] Google OAuth login works
- [ ] New user can register via Google
- [ ] Existing user can login via Google (same email)
- [ ] Logout works for both methods
- [ ] Session persists after refresh
- [ ] Mobile responsive login page
- [ ] No console errors

---

## Questions?

If blocked for more than 2 hours, report to Priya with:
- What you tried
- What error you're seeing
- What you need help with

---

**Start Phase 1 immediately. Good luck!** 🚀
