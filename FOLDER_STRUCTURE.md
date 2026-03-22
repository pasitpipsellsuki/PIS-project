# 📁 Project Structure

**Last Updated:** 2026-03-21  
**Project:** Product Information System (PIS)

---

## 🗂️ Folder Organization

```
Team_Agents/
│
├── 📁 PIS/                          ← Main Project Code
│   ├── src/
│   │   ├── api/                    # API endpoints (Workers)
│   │   ├── db/                     # Database types & migrations
│   │   └── frontend/               # React application
│   ├── migrations/                 # Database schema
│   ├── scripts/                    # Data seeding
│   ├── API_DOCUMENTATION.md        # API reference
│   ├── PROJECT_README.md           # Project overview
│   └── PROJECT_STATUS_REPORT.md    # Completion status
│
├── 📁 docs/                         ← Documentation
│   ├── 📁 deployment/              # Deployment guides & logs
│   │   ├── DEPLOYMENT_LOG.md
│   │   ├── DEPLOYMENT_COMPLETE.md
│   │   └── CLOUDFLARE_API_TOKEN_GUIDE.md
│   │
│   ├── 📁 guides/                  # How-to guides
│   │   ├── API_TROUBLESHOOTING.md
│   │   ├── FRONTEND_DEPLOYMENT_GUIDE.md
│   │   └── DEPLOYMENT_GUIDE.md
│   │
│   ├── 📁 incidents/               # Issue tracking & lessons learned
│   │   ├── INCIDENT_REPORT.md
│   │   ├── INCIDENT_ACKNOWLEDGMENT_DEVON.md
│   │   ├── PRIYA_ACKNOWLEDGMENT.md
│   │   ├── HONEST_CLARIFICATION.md
│   │   ├── HONEST_LIMITATIONS.md
│   │   └── PAGES_ERROR_ANALYSIS.md
│   │
│   └── 📁 qa/                      # QA documentation
│       ├── QA_TEST_PLAN.md
│       └── QA_TEST_RESULTS.md
│
├── 📁 skills/                       # Team knowledge base
│   └── skills-po-updated.md        # Workflow improvements
│
├── 📁 backlog/                      ← LOCAL ONLY (not in repo)
│   └── backlog.md                  # Project tracking
│
├── .opencode/                       ← LOCAL ONLY (not in repo)
│   └── agent configurations
│
├── AGENTS.md                        ← LOCAL ONLY
├── README.md                        # Project overview
└── .gitignore                       # Git exclusions
```

---

## 📋 Quick Reference

| Need to find... | Look in... |
|-----------------|------------|
| API documentation | `PIS/API_DOCUMENTATION.md` |
| How to deploy | `docs/guides/` |
| Why deployment failed | `docs/incidents/` |
| Test results | `docs/qa/QA_TEST_RESULTS.md` |
| Project status | `PIS/PROJECT_STATUS_REPORT.md` |
| Source code | `PIS/src/` |
| Database schema | `PIS/migrations/` |

---

## 🔒 Local Only Files (Not in Repository)

These files stay on your local machine:
- `.opencode/` - Agent configurations
- `backlog/` - Project backlog
- `AGENTS.md` - Team coding standards

**Protected by `.gitignore`**

---

## ✅ What's Complete

- ✅ Database Schema (PIS-001)
- ✅ API Endpoints (PIS-002, 003, 004)
- ✅ Frontend UI (PIS-005, 006, 007, 008, 009)
- ✅ QA Testing Complete
- ⚠️ Cloud Deployment (Encountered issues - documented in incidents/)

---

## 🚀 How to Run Locally

```bash
# Backend
cd PIS
npx wrangler dev

# Frontend (new terminal)
cd PIS/src/frontend
npm install
npm run dev
```

**Access:**
- API: http://localhost:8787
- Frontend: http://localhost:5173

---

**Organized by Priya 🧭 - March 21, 2026**
