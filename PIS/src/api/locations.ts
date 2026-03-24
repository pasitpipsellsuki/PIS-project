import { Router } from 'itty-router';
import type { Env } from '../index';

export const locationsRouter = Router({ base: '/api/locations' });

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

// GET /api/locations - List all locations
locationsRouter.get('/', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    let sql = 'SELECT * FROM locations WHERE 1=1';
    const params: string[] = [];
    
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    
    sql += ' ORDER BY name';
    
    const { results } = await env.DB.prepare(sql).bind(...params).all();
    
    return new Response(JSON.stringify({ locations: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return errorResponse('Failed to fetch locations', 500);
  }
});

// GET /api/locations/:id - Get single location
locationsRouter.get('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return errorResponse('Location ID is required');
    }
    
    const location = await env.DB.prepare(`
      SELECT * FROM locations WHERE id = ?
    `).bind(id).first();
    
    if (!location) {
      return errorResponse('Location not found', 404);
    }
    
    // Get inventory at this location
    const { results: inventory } = await env.DB.prepare(`
      SELECT 
        i.id as inventory_id,
        i.quantity,
        i.min_stock_level,
        i.last_updated,
        p.id as product_id,
        p.sku,
        p.name as product_name,
        p.category
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.location_id = ? AND p.is_active = 1
      ORDER BY p.name
    `).bind(id).all();
    
    return new Response(JSON.stringify({
      location,
      inventory: inventory,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return errorResponse('Failed to fetch location', 500);
  }
});

// POST /api/locations - Create location
locationsRouter.post('/', async (request: Request, env: Env) => {
  try {
    const body = await request.json() as {
      name: string;
      type: 'store' | 'warehouse';
      address?: string;
    };
    
    if (!body.name || !body.type) {
      return errorResponse('Name and type are required');
    }
    
    if (!['store', 'warehouse'].includes(body.type)) {
      return errorResponse('Type must be store or warehouse');
    }
    
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await env.DB.prepare(`
      INSERT INTO locations (id, name, type, address, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      id,
      body.name,
      body.type,
      body.address || null,
      now
    ).run();
    
    const location = await env.DB.prepare(`
      SELECT * FROM locations WHERE id = ?
    `).bind(id).first();
    
    return new Response(JSON.stringify({
      location,
      message: 'Location created successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating location:', error);
    return errorResponse('Failed to create location', 500);
  }
});

// PUT /api/locations/:id - Update location
locationsRouter.put('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return errorResponse('Location ID is required');
    }
    
    const existing = await env.DB.prepare(`
      SELECT * FROM locations WHERE id = ?
    `).bind(id).first();
    
    if (!existing) {
      return errorResponse('Location not found', 404);
    }
    
    const body = await request.json() as {
      name?: string;
      address?: string;
    };
    
    const updates: string[] = [];
    const params: (string | null)[] = [];
    
    if (body.name !== undefined) {
      updates.push('name = ?');
      params.push(body.name);
    }
    
    if (body.address !== undefined) {
      updates.push('address = ?');
      params.push(body.address);
    }
    
    if (updates.length === 0) {
      return errorResponse('No fields to update');
    }
    
    params.push(id);
    
    await env.DB.prepare(`
      UPDATE locations SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();
    
    const location = await env.DB.prepare(`
      SELECT * FROM locations WHERE id = ?
    `).bind(id).first();
    
    return new Response(JSON.stringify({
      location,
      message: 'Location updated successfully',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return errorResponse('Failed to update location', 500);
  }
});

// DELETE /api/locations/:id - Delete location
locationsRouter.delete('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return errorResponse('Location ID is required');
    }
    
    const existing = await env.DB.prepare(`
      SELECT * FROM locations WHERE id = ?
    `).bind(id).first();
    
    if (!existing) {
      return errorResponse('Location not found', 404);
    }
    
    // Check if location has inventory
    const inventoryCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM inventory WHERE location_id = ?
    `).bind(id).first();
    
    if (inventoryCount && (inventoryCount.count as number) > 0) {
      return errorResponse(
        'Cannot delete location with existing inventory. Remove inventory first.',
        409
      );
    }
    
    await env.DB.prepare(`
      DELETE FROM locations WHERE id = ?
    `).bind(id).run();
    
    return new Response(JSON.stringify({
      message: 'Location deleted successfully',
      location_id: id,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return errorResponse('Failed to delete location', 500);
  }
});
