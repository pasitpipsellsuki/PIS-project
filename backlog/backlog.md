# 📋 Backlog

> This file is managed by Priya. The user never edits it directly.
> Priya updates it automatically after every conversation and reads it at the start of every session.

---

## Project Context

**Project name:** Product Information System (PIS)  
**What it does:** A centralized system to manage product information and stock levels across multiple store locations and warehouses.  
**Tech stack:** Cloudflare Pages (frontend) + Cloudflare Workers (API) + Cloudflare D1 (database)  
**Domain:** Inventory Management / Retail Operations  
**Repo:** https://github.com/pasitpipsellsuki/PIS-project

---

## Current Request

**Date:** 2026-03-21  
**Requestor:** User  
**Description:** Build a Product Information System to store product info and stock information from every store location or warehouse.

**Key Requirements Identified:**
1. Store and manage product information (name, SKU, description, price, category, etc.)
2. Track stock/inventory levels at multiple locations (stores, warehouses)
3. View inventory across all locations
4. Support multiple locations with different stock levels per product
5. Easy to use interface for data entry and queries

---

## In Progress

| Story | Owner | Status |
|-------|-------|--------|
| **PIS-002:** Product API Endpoints | Dexter 💻 | `ready-for-dev` |

---

## Backlog (Prioritized)

### Sprint 1: Foundation

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| PIS-001 | **Database Schema Design** - Design D1 tables for products, locations, inventory | High | `qa-approved` |
| PIS-002 | **Product API Endpoints** - Create REST API for product CRUD operations | High | `ready-for-dev` |
| PIS-003 | **Location API Endpoints** - Create REST API for store/warehouse CRUD | High | pending |
| PIS-004 | **Inventory API Endpoints** - Create REST API to track stock levels per location | High | pending |

### Sprint 2: Frontend & Views

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| PIS-005 | **Product List View** - Display all products with filtering and search | Medium | pending |
| PIS-006 | **Product Detail View** - Show product info + stock across all locations | Medium | pending |
| PIS-007 | **Inventory Dashboard** - Overview of stock levels by location | Medium | pending |
| PIS-008 | **Add/Edit Product Form** - UI for creating and updating products | Medium | pending |
| PIS-009 | **Stock Adjustment Form** - UI for updating inventory levels | Medium | pending |

### Sprint 3: Advanced Features

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| PIS-010 | **Low Stock Alerts** - Highlight products below minimum threshold | Low | pending |
| PIS-011 | **Inventory Movement Tracking** - Track stock in/out movements | Low | pending |
| PIS-012 | **Reports Export** - Export inventory data to CSV | Low | pending |

---

## Story: PIS-001 - Database Schema Design

### User Story
As a system administrator, I need a proper database schema so that product information and inventory data can be stored reliably across multiple locations.

### Acceptance Criteria
- [ ] D1 database tables created for:
  - `products` (id, sku, name, description, category, price, created_at, updated_at)
  - `locations` (id, name, type [store/warehouse], address, created_at)
  - `inventory` (id, product_id, location_id, quantity, min_stock_level, last_updated)
- [ ] Proper foreign key relationships defined
- [ ] Indexes on frequently queried columns (sku, product_id, location_id)
- [ ] Migration scripts created for schema setup
- [ ] Schema documented in the project

### Technical Notes
- Use Cloudflare D1 (SQLite-compatible)
- Consider soft deletes for products (is_active flag)
- Inventory table should have unique constraint on (product_id, location_id)

### Definition of Done
- Schema SQL file created
- Migration can be run successfully
- Sample data inserted for testing

---

## Blocked

| Blocker | Raised by | Waiting for |
|---------|-----------|-------------|
| — | — | — |

---

## Done

| Feature | Deployed | Date |
|---------|----------|------|
| PIS-001 Database Schema Design | Local | 2026-03-21 |

---

## Decisions Log

| Date | Decision | Made by |
|------|----------|---------|
| 2026-03-21 | Use Cloudflare D1 for database (SQLite-based, fits Cloudflare stack) | Priya |
| 2026-03-21 | Start with Sprint 1: Foundation - Database + API first | Priya |
| 2026-03-21 | Initial schema: products, locations, inventory tables | Priya |

---

## 🚀 Next Action

**Status:** `PIS-002` is **READY FOR DEV**

Dexter 💻 should:
1. **PUSH PIS-001 to Repository** — Commit and push all completed work to https://github.com/pasitpipsellsuki/PIS-project
2. **Implement PIS-002** — Build Product API Endpoints (REST API for product CRUD operations)
3. **Update Priya** — Report progress and mark PIS-002 as `ready-for-qa` when done

### ✅ Files Ready to Push (PIS-001 Complete)
- `migrations/001_initial_schema.sql` - Complete database schema with indexes and views
- `src/db/schema.py` - Python type definitions for all tables
- `src/db/migrations.py` - Migration runner and utilities
- `scripts/seed_data.py` - Sample data seeding script
- `package.json` - Project configuration
- `wrangler.toml` - Cloudflare Workers configuration
- `PROJECT_README.md` - Project documentation
