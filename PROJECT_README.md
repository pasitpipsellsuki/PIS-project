# Product Information System (PIS)

A centralized system to manage product information and stock levels across multiple store locations and warehouses.

## Overview

The Product Information System provides:
- **Product Management**: Store and manage product catalogs with SKUs, descriptions, categories, and pricing
- **Location Tracking**: Support multiple stores and warehouses
- **Inventory Management**: Track stock levels per product per location
- **Low Stock Alerts**: Identify products below minimum thresholds
- **Reporting**: View inventory summaries across all locations

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Cloudflare Pages (React + TypeScript) |
| API | Cloudflare Workers (TypeScript) |
| Database | Cloudflare D1 (SQLite) |

## Database Schema

### Products Table
- `id` (UUID): Primary key
- `sku` (TEXT): Unique stock keeping unit
- `name` (TEXT): Product name
- `description` (TEXT): Product description
- `category` (TEXT): Product category
- `price` (REAL): Unit price
- `is_active` (INTEGER): Soft delete flag
- `created_at`, `updated_at` (TEXT): Timestamps

### Locations Table
- `id` (UUID): Primary key
- `name` (TEXT): Location name
- `type` (TEXT): 'store' or 'warehouse'
- `address` (TEXT): Physical address
- `created_at` (TEXT): Creation timestamp

### Inventory Table
- `id` (UUID): Primary key
- `product_id` (UUID): Foreign key to products
- `location_id` (UUID): Foreign key to locations
- `quantity` (INTEGER): Current stock level
- `min_stock_level` (INTEGER): Threshold for low stock alerts
- `last_updated` (TEXT): Last update timestamp

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.9+
- Cloudflare account
- Wrangler CLI

### 1. Run Migrations

```bash
python -m src.db.migrations apply
```

### 2. Seed Sample Data

```bash
python -m scripts.seed_data
```

### 3. Verify Schema

```bash
python -m src.db.migrations verify
```

## Project Files Created

- `migrations/001_initial_schema.sql` - Database schema
- `src/db/schema.py` - Type definitions
- `src/db/migrations.py` - Migration utilities
- `scripts/seed_data.py` - Data seeding
- `package.json` - Project configuration
- `wrangler.toml` - Cloudflare Workers config

## Status

**Current Phase:** Sprint 1 - Foundation  
**Completed:** PIS-001 Database Schema Design  
**Next:** PIS-002 Product API Endpoints
