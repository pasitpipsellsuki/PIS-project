# API Documentation

## Product Information System (PIS) - API Endpoints

### Base URL
```
Production: https://your-worker.your-subdomain.workers.dev
Local: http://localhost:8787
```

---

## Products API

### GET /api/products
List all products with optional filtering.

**Query Parameters:**
- `category` (optional) - Filter by category
- `search` (optional) - Search in name, SKU, description
- `is_active` (optional) - Filter by active status (0 or 1)

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "sku": "PROD-001",
      "name": "Product Name",
      "description": "Description",
      "category": "Electronics",
      "price": 99.99,
      "is_active": true,
      "created_at": "2026-03-21T10:00:00Z",
      "updated_at": "2026-03-21T10:00:00Z",
      "total_stock": 150,
      "location_count": 3
    }
  ]
}
```

### GET /api/products/:id
Get single product with inventory details.

**Response:**
```json
{
  "product": {
    "id": "uuid",
    "sku": "PROD-001",
    "name": "Product Name",
    ...
  },
  "inventory": [
    {
      "inventory_id": "uuid",
      "quantity": 50,
      "min_stock_level": 10,
      "location_name": "Main Warehouse",
      "location_type": "warehouse"
    }
  ]
}
```

### POST /api/products
Create a new product.

**Request Body:**
```json
{
  "sku": "PROD-001",
  "name": "Product Name",
  "description": "Optional description",
  "category": "Electronics",
  "price": 99.99
}
```

### PUT /api/products/:id
Update an existing product.

**Request Body:**
```json
{
  "name": "Updated Name",
  "price": 89.99
}
```

### DELETE /api/products/:id
Soft delete a product (sets is_active = 0).

---

## Locations API

### GET /api/locations
List all locations.

**Query Parameters:**
- `type` (optional) - Filter by 'store' or 'warehouse'

### GET /api/locations/:id
Get location with inventory details.

### POST /api/locations
Create a new location.

**Request Body:**
```json
{
  "name": "Store Name",
  "type": "store",
  "address": "123 Main St"
}
```

### PUT /api/locations/:id
Update a location.

### DELETE /api/locations/:id
Delete a location (fails if inventory exists).

---

## Inventory API

### GET /api/inventory
List all inventory records.

**Query Parameters:**
- `product_id` (optional) - Filter by product
- `location_id` (optional) - Filter by location
- `low_stock` (optional) - Set to 'true' to show only low stock items

### GET /api/inventory/low-stock
Get all items at or below minimum stock level.

### GET /api/inventory/summary
Get inventory summary.

**Query Parameters:**
- `type` (optional) - 'product' or 'location' summary

### POST /api/inventory
Create an inventory record.

**Request Body:**
```json
{
  "product_id": "uuid",
  "location_id": "uuid",
  "quantity": 100,
  "min_stock_level": 20
}
```

### PUT /api/inventory/:id
Update inventory quantity or min_stock_level.

**Request Body:**
```json
{
  "quantity": 150,
  "min_stock_level": 25
}
```

Or adjust by delta:
```json
{
  "adjustment": -10
}
```

### DELETE /api/inventory/:id
Delete an inventory record.

---

## Health Check

### GET /api/health
Check API status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-21T10:00:00Z"
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message"
}
```

**Status Codes:**
- 200 - Success
- 201 - Created
- 400 - Bad Request
- 404 - Not Found
- 409 - Conflict
- 500 - Internal Server Error
