import { Router } from 'itty-router';
import type { Env } from '../index';

export const inventoryRouter = Router();

// Helper functions
function generateUUID(): string {
  return crypto.randomUUID();
}

function errorResponse(message: string, status: number = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/inventory - List all inventory
inventoryRouter.get('/', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('product_id');
    const locationId = url.searchParams.get('location_id');
    const lowStock = url.searchParams.get('low_stock');
    
    let sql = `
      SELECT 
        i.id,
        i.product_id,
        i.location_id,
        i.quantity,
        i.min_stock_level,
        i.last_updated,
        p.sku as product_sku,
        p.name as product_name,
        p.category,
        l.name as location_name,
        l.type as location_type,
        CASE WHEN i.quantity <= i.min_stock_level THEN 1 ELSE 0 END as is_low_stock
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN locations l ON i.location_id = l.id
      WHERE p.is_active = 1
    `;
    const params: string[] = [];
    
    if (productId) {
      sql += ' AND i.product_id = ?';
      params.push(productId);
    }
    
    if (locationId) {
      sql += ' AND i.location_id = ?';
      params.push(locationId);
    }
    
    if (lowStock === 'true') {
      sql += ' AND i.quantity <= i.min_stock_level';
    }
    
    sql += ' ORDER BY l.name, p.name';
    
    const { results } = await env.DB.prepare(sql).bind(...params).all();
    
    return new Response(JSON.stringify({ inventory: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return errorResponse('Failed to fetch inventory', 500);
  }
});

// GET /api/inventory/low-stock - Get low stock alerts
inventoryRouter.get('/low-stock', async (request: Request, env: Env) => {
  try {
    const { results } = await env.DB.prepare(`
      SELECT 
        p.id as product_id,
        p.sku,
        p.name,
        l.id as location_id,
        l.name as location_name,
        l.type as location_type,
        i.quantity,
        i.min_stock_level,
        (i.min_stock_level - i.quantity) as shortage
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN locations l ON i.location_id = l.id
      WHERE i.quantity <= i.min_stock_level
        AND p.is_active = 1
      ORDER BY shortage DESC
    `).all();
    
    return new Response(JSON.stringify({ 
      alerts: results,
      count: results.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    return errorResponse('Failed to fetch low stock alerts', 500);
  }
});

// GET /api/inventory/summary - Get inventory summary
inventoryRouter.get('/summary', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'product' or 'location'
    
    if (type === 'product') {
      // Summary by product
      const { results } = await env.DB.prepare(`
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.category,
          COUNT(DISTINCT i.location_id) as location_count,
          COALESCE(SUM(i.quantity), 0) as total_stock,
          SUM(CASE WHEN i.quantity <= i.min_stock_level THEN 1 ELSE 0 END) as low_stock_locations
        FROM products p
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.is_active = 1
        GROUP BY p.id
        ORDER BY p.name
      `).all();
      
      return new Response(JSON.stringify({ product_summary: results }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Summary by location (default)
      const { results } = await env.DB.prepare(`
        SELECT 
          l.id,
          l.name,
          l.type,
          COUNT(DISTINCT i.product_id) as product_count,
          COALESCE(SUM(i.quantity), 0) as total_units,
          SUM(CASE WHEN i.quantity <= i.min_stock_level THEN 1 ELSE 0 END) as low_stock_items
        FROM locations l
        LEFT JOIN inventory i ON l.id = i.location_id
        LEFT JOIN products p ON i.product_id = p.id AND p.is_active = 1
        GROUP BY l.id
        ORDER BY l.name
      `).all();
      
      return new Response(JSON.stringify({ location_summary: results }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    return errorResponse('Failed to fetch inventory summary', 500);
  }
});

// POST /api/inventory - Create inventory record
inventoryRouter.post('/', async (request: Request, env: Env) => {
  try {
    const body = await request.json() as {
      product_id: string;
      location_id: string;
      quantity?: number;
      min_stock_level?: number;
    };
    
    if (!body.product_id || !body.location_id) {
      return errorResponse('Product ID and Location ID are required');
    }
    
    // Check if product exists
    const product = await env.DB.prepare(`
      SELECT id FROM products WHERE id = ? AND is_active = 1
    `).bind(body.product_id).first();
    
    if (!product) {
      return errorResponse('Product not found', 404);
    }
    
    // Check if location exists
    const location = await env.DB.prepare(`
      SELECT id FROM locations WHERE id = ?
    `).bind(body.location_id).first();
    
    if (!location) {
      return errorResponse('Location not found', 404);
    }
    
    // Check if inventory record already exists
    const existing = await env.DB.prepare(`
      SELECT id FROM inventory WHERE product_id = ? AND location_id = ?
    `).bind(body.product_id, body.location_id).first();
    
    if (existing) {
      return errorResponse(
        'Inventory record already exists for this product at this location. Use PUT to update.',
        409
      );
    }
    
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await env.DB.prepare(`
      INSERT INTO inventory (id, product_id, location_id, quantity, min_stock_level, last_updated)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.product_id,
      body.location_id,
      body.quantity || 0,
      body.min_stock_level || 0,
      now
    ).run();
    
    // Fetch created record
    const inventory = await env.DB.prepare(`
      SELECT 
        i.*,
        p.sku as product_sku,
        p.name as product_name,
        l.name as location_name,
        l.type as location_type
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN locations l ON i.location_id = l.id
      WHERE i.id = ?
    `).bind(id).first();
    
    return new Response(JSON.stringify({
      inventory,
      message: 'Inventory record created successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating inventory:', error);
    return errorResponse('Failed to create inventory record', 500);
  }
});

// PUT /api/inventory/:id - Update inventory (quantity or min_stock_level)
inventoryRouter.put('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return errorResponse('Inventory ID is required');
    }
    
    const existing = await env.DB.prepare(`
      SELECT * FROM inventory WHERE id = ?
    `).bind(id).first();
    
    if (!existing) {
      return errorResponse('Inventory record not found', 404);
    }
    
    const body = await request.json() as {
      quantity?: number;
      min_stock_level?: number;
      adjustment?: number; // For stock in/out
    };
    
    const updates: string[] = [];
    const params: (string | number)[] = [];
    
    if (body.adjustment !== undefined) {
      // Adjust quantity by delta (positive = stock in, negative = stock out)
      const newQuantity = (existing.quantity as number) + body.adjustment;
      if (newQuantity < 0) {
        return errorResponse('Insufficient stock for this adjustment');
      }
      updates.push('quantity = ?');
      params.push(newQuantity);
    } else if (body.quantity !== undefined) {
      if (body.quantity < 0) {
        return errorResponse('Quantity cannot be negative');
      }
      updates.push('quantity = ?');
      params.push(body.quantity);
    }
    
    if (body.min_stock_level !== undefined) {
      if (body.min_stock_level < 0) {
        return errorResponse('Minimum stock level cannot be negative');
      }
      updates.push('min_stock_level = ?');
      params.push(body.min_stock_level);
    }
    
    if (updates.length === 0) {
      return errorResponse('No fields to update');
    }
    
    updates.push('last_updated = ?');
    params.push(new Date().toISOString());
    params.push(id);
    
    await env.DB.prepare(`
      UPDATE inventory SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();
    
    // Fetch updated record
    const inventory = await env.DB.prepare(`
      SELECT 
        i.*,
        p.sku as product_sku,
        p.name as product_name,
        l.name as location_name,
        l.type as location_type
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN locations l ON i.location_id = l.id
      WHERE i.id = ?
    `).bind(id).first();
    
    return new Response(JSON.stringify({
      inventory,
      message: 'Inventory updated successfully',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return errorResponse('Failed to update inventory', 500);
  }
});

// DELETE /api/inventory/:id - Delete inventory record
inventoryRouter.delete('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return errorResponse('Inventory ID is required');
    }
    
    const existing = await env.DB.prepare(`
      SELECT * FROM inventory WHERE id = ?
    `).bind(id).first();
    
    if (!existing) {
      return errorResponse('Inventory record not found', 404);
    }
    
    await env.DB.prepare(`
      DELETE FROM inventory WHERE id = ?
    `).bind(id).run();
    
    return new Response(JSON.stringify({
      message: 'Inventory record deleted successfully',
      inventory_id: id,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    return errorResponse('Failed to delete inventory record', 500);
  }
});
