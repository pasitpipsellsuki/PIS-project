# QA Test Plan - Product Information System

**Tester:** Quinn 🔍 (QA Engineer)  
**Date:** 2026-03-21  
**Status:** Ready for Testing

---

## 🎯 Test Overview

**System:** Product Information System (PIS)  
**Version:** 0.1.0  
**Environment:** Local Development (Pre-UAT)  
**Code Location:** `PIS/` folder

---

## ✅ Test Scope

### Sprint 1: Backend API Testing

#### PIS-001: Database Schema
**Test Cases:**
- [ ] Database migrations run successfully
- [ ] All 3 tables created (products, locations, inventory)
- [ ] Foreign key constraints enforced
- [ ] Indexes created on key columns
- [ ] Sample data inserts without errors

#### PIS-002: Product API
**Test Cases:**
- [ ] `GET /api/products` returns list of products
- [ ] `GET /api/products?search=test` filters correctly
- [ ] `GET /api/products?category=Electronics` filters by category
- [ ] `GET /api/products/:id` returns single product
- [ ] `POST /api/products` creates new product
- [ ] `POST /api/products` rejects duplicate SKU
- [ ] `PUT /api/products/:id` updates product
- [ ] `DELETE /api/products/:id` soft deletes product
- [ ] Invalid product ID returns 404

#### PIS-003: Location API
**Test Cases:**
- [ ] `GET /api/locations` returns all locations
- [ ] `GET /api/locations?type=store` filters by type
- [ ] `POST /api/locations` creates new location
- [ ] `PUT /api/locations/:id` updates location
- [ ] `DELETE /api/locations/:id` deletes location
- [ ] Cannot delete location with inventory (409 error)

#### PIS-004: Inventory API
**Test Cases:**
- [ ] `GET /api/inventory` returns inventory records
- [ ] `GET /api/inventory?low_stock=true` shows low stock items
- [ ] `GET /api/inventory/low-stock` returns alerts
- [ ] `POST /api/inventory` creates inventory record
- [ ] `PUT /api/inventory/:id` updates quantity
- [ ] `PUT /api/inventory/:id` with adjustment delta works
- [ ] Cannot set negative quantity
- [ ] `DELETE /api/inventory/:id` deletes record

---

### Sprint 2: Frontend Testing

#### PIS-005: Product List View
**Test Cases:**
- [ ] Page loads and displays products
- [ ] Search box filters products
- [ ] Category dropdown filters products
- [ ] "Add Product" button opens modal
- [ ] Edit button opens modal with data
- [ ] Delete button removes product
- [ ] Table shows all columns (SKU, Name, Category, Price, Stock)
- [ ] Empty state shows "No products found"

#### PIS-006: Product Detail
**Test Cases:**
- [ ] Clicking product shows details
- [ ] Inventory across locations displayed
- [ ] Stock levels accurate

#### PIS-007: Dashboard
**Test Cases:**
- [ ] Dashboard loads with 4 stat cards
- [ ] Total products count accurate
- [ ] Total locations count accurate
- [ ] Total inventory units accurate
- [ ] Low stock alerts count accurate
- [ ] Low stock table displays correctly
- [ ] Inventory by location table works

#### PIS-008: Add/Edit Product Form
**Test Cases:**
- [ ] Modal opens with empty form (add)
- [ ] Modal opens with pre-filled data (edit)
- [ ] Required fields validated (SKU, Name)
- [ ] Optional fields work (Description, Category, Price)
- [ ] Submit creates/updates product
- [ ] Cancel closes modal without saving
- [ ] Form validation shows errors

#### PIS-009: Stock Adjustment Form
**Test Cases:**
- [ ] "Adjust" button opens adjustment modal
- [ ] Current quantity displayed
- [ ] Positive adjustment adds stock
- [ ] Negative adjustment removes stock
- [ ] Cannot go below zero stock
- [ ] Update reflects immediately

---

## 🔧 Test Setup Instructions

### Step 1: Setup Local Environment
```bash
# 1. Navigate to project
cd PIS

# 2. Setup database
python -m src.db.migrations apply
python -m scripts.seed_data

# 3. Install backend dependencies
npm install

# 4. Start backend (Terminal 1)
npm run dev

# 5. Install frontend dependencies (Terminal 2)
cd src/frontend
npm install

# 6. Start frontend
npm run dev
```

### Step 2: Access Application
- Frontend: http://localhost:5173
- API: http://localhost:8787

---

## 🐛 Bug Report Template

If issues found, document as:

```
**Bug ID:** BUG-XXX
**Story:** PIS-00X
**Severity:** High/Medium/Low
**Title:** Brief description

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:**
What should happen

**Actual Result:**
What actually happens

**Screenshots:**
[Attach if applicable]

**Environment:**
- Browser: Chrome/Firefox/Safari
- OS: Windows/Mac/Linux
```

---

## 📝 Test Execution Log

| Story | Test Date | Tester | Status | Notes |
|-------|-----------|--------|--------|-------|
| PIS-001 | | Quinn | | |
| PIS-002 | | Quinn | | |
| PIS-003 | | Quinn | | |
| PIS-004 | | Quinn | | |
| PIS-005 | | Quinn | | |
| PIS-006 | | Quinn | | |
| PIS-007 | | Quinn | | |
| PIS-008 | | Quinn | | |
| PIS-009 | | Quinn | | |

---

## ✅ QA Sign-Off

**Quinn 🔍 QA Sign-Off:**

I certify that:
- [ ] All test cases executed
- [ ] All critical bugs resolved
- [ ] System ready for UAT

**Sign-Off Date:** ___________  
**QA Engineer:** Quinn 🔍

---

## 🚨 Critical Issues Found

*Document any critical issues that block UAT*

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| | | | |

---

## 📊 Test Summary

**Total Test Cases:** 50+  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___  
**Not Run:** ___

**Overall Status:** ⬜ PASS / ⬜ FAIL / ⬜ CONDITIONAL PASS

**Recommendation for UAT:** ⬜ READY / ⬜ NOT READY

---

**Next Step After QA:** Once Quinn signs off, Devon 🚀 will deploy to UAT environment for user testing.
