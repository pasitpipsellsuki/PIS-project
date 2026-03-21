# Product Information System (PIS)

A full-stack inventory management system for tracking products and stock levels across multiple store locations and warehouses.

## Features

- **Product Management**: Create, read, update, and delete products with SKU, name, description, category, and price
- **Location Management**: Manage stores and warehouses
- **Inventory Tracking**: Track stock levels per product per location
- **Low Stock Alerts**: Identify products below minimum threshold
- **Dashboard**: Overview of inventory statistics and alerts

## Tech Stack

- **Backend**: Cloudflare Workers (TypeScript) + D1 Database
- **Frontend**: React + TypeScript + Vite
- **API**: RESTful endpoints with CORS support

## Project Structure

```
PIS/
├── migrations/          # Database schema
├── scripts/            # Data seeding utilities
├── src/
│   ├── api/           # API endpoints (products, locations, inventory)
│   ├── db/            # Database schema types and migrations
│   ├── frontend/      # React application
│   └── index.ts       # Main worker entry
├── API_DOCUMENTATION.md
├── PROJECT_README.md
└── PROJECT_STATUS_REPORT.md
```

## Quick Start

### Setup Database
```bash
cd PIS
python -m src.db.migrations apply
python -m scripts.seed_data
```

### Run Backend
```bash
cd PIS
npm install
npm run dev
```

### Run Frontend
```bash
cd PIS/src/frontend
npm install
npm run dev
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/locations` - List locations
- `GET /api/inventory` - List inventory
- `GET /api/inventory/low-stock` - Low stock alerts

See `PIS/API_DOCUMENTATION.md` for full API documentation.

## Status

**Version**: 0.1.0  
**Completed**: 9 of 12 features (75%)  
**Repository**: https://github.com/pasitpipsellsuki/PIS-project

## License

Private - Internal Use Only
