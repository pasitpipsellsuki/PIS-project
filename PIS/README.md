# PIS - Product Information System

> Centralized system for managing product information and stock levels across multiple store locations and warehouses.

---

## 📁 Project Structure

```
PIS/
├── 📂 config/                  # Configuration files
│   └── wrangler.toml.backup   # Backup of wrangler configuration
│
├── 📂 data/                   # Data files and exports
│
├── 📂 docs/                   # Documentation
│   ├── api/                   # API documentation
│   │   └── API_DOCUMENTATION.md
│   ├── deployment/            # Deployment guides
│   │   ├── AUTODEPLOY_SETUP.md
│   │   ├── DEPLOYMENT_GUIDE.md
│   │   └── ...
│   ├── project/               # Project documentation
│   │   ├── PROJECT_README.md
│   │   └── PROJECT_COMPLETION_REPORT.md
│   └── qa/                    # QA reports and bug fixes
│       ├── FINAL_QA_REPORT.md
│       └── BUG-004-FIX.md
│
├── 📂 migrations/             # Database migrations
│
├── 📂 scripts/                # Scripts and utilities
│   ├── deploy/                # Deployment scripts
│   │   ├── DEVON_DEPLOY.bat
│   │   ├── deploy-uat.sh
│   │   └── ...
│   └── utility/               # Utility scripts
│
├── 📂 src/                    # Source code
│   ├── api/                   # API routes (Cloudflare Workers)
│   ├── db/                    # Database utilities
│   ├── frontend/              # React frontend
│   └── index.ts               # Entry point
│
├── 📄 .env.local              # Environment variables
├── 📄 package.json            # Dependencies
├── 📄 tsconfig.json           # TypeScript config
├── 📄 wrangler.toml           # Wrangler configuration
└── 📄 README.md               # This file
```

---

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

### Deployment

**Option 1: Auto-deploy via GitHub Actions**
- Push to `master` branch triggers automatic deployment

**Option 2: Manual deploy**
```bash
# Windows
scripts/deploy/DEVON_DEPLOY.bat

# Linux/Mac
./scripts/deploy/deploy-uat.sh
```

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript + Vite |
| API | Cloudflare Workers (Hono) |
| Database | Cloudflare D1 (SQLite) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |

---

## 📚 Documentation

- [API Documentation](docs/api/API_DOCUMENTATION.md)
- [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)
- [Project Report](docs/project/PROJECT_COMPLETION_REPORT.md)
- [QA Report](docs/qa/FINAL_QA_REPORT.md)

---

## 📝 Login Credentials

- **Email:** admin@pis.local
- **Password:** admin123

---

*Last updated: 2026-03-23*
