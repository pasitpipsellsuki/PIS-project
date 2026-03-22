import { Router } from 'itty-router';
import type { Env } from '../index';

export const productsRouter = Router();

// Helper to generate UUID
function generateUUID(): string {
  return crypto.randomUUID();
}

// Helper to handle errors
function errorResponse(message: string, status: number = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/products - List all products
productsRouter.get('/', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const isActive = url.searchParams.get('is_active');
    
    let sql = `
      SELECT 
        p.id, p.sku, p.name, p.description, p.category, p.price, 
        p.is_active, p.created_at, p.updated_at,
        COALESCE(SUM(i.quantity), 0) as total_stock,
        COUNT(DISTINCT i.location_id) as location_count
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = 1
    `;
    const params: string[] = [];
    
    if (category) {
      sql += ' AND p.category = ?';
      params.push(category);
    }
    
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (isActive !== null && isActive !== undefined) {
      sql = sql.replace('WHERE p.is_active = 1', 'WHERE p.is_active = ?');
      params[0] = isActive;
    }
    
    sql += ' GROUP BY p.id ORDER BY p.name';
    
    const { results } = await env.DB.prepare(sql).bind(...params).all();
    
    return new Response(JSON.stringify({ products: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return errorResponse('Failed to fetch products', 500);
  }
});

// GET /api/products/:id - Get single product
productsRouter.get('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return errorResponse('Product ID is required');
    }
    
    // Get product details
    const product = await env.DB.prepare(`
      SELECT * FROM products WHERE id = ?
    `).bind(id).first();
    
    if (!product) {
      return errorResponse('Product not found', 404);
    }
    
    // Get inventory across all locations
    const { results: inventory } = await env.DB.prepare(`
      SELECT 
        i.id as inventory_id,
        i.quantity,
        i.min_stock_level,
        i.last_updated,
        l.id as location_id,
        l.name as location_name,
        l.type as location_type
      FROM inventory i
      JOIN locations l ON i.location_id = l.id
      WHERE i.product_id = ?
      ORDER BY l.name
    `).bind(id).all();
    
    return new Response(JSON.stringify({
      product: {
        ...product,
        is_active: Boolean(product.is_active),
      },
      inventory: inventory,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return errorResponse('Failed to fetch product', 500);
  }
});

// POST /api/products - Create product
productsRouter.post('/', async (request: Request, env: Env) => {
  try {
    const body = await request.json() as {
      sku: string;
      name: string;
      description?: string;
      category?: string;
      price?: number;
    };
    
    // Validation
    if (!body.sku || !body.name) {
      return errorResponse('SKU and name are required');
    }
    
    if (body.sku.length > 50) {
      return errorResponse('SKU must be 50 characters or less');
    }
    
    if (body.name.length > 255) {
      return errorResponse('Name must be 255 characters or less');
    }
    
    // Check for duplicate SKU
    const existing = await env.DB.prepare(`
      SELECT id FROM products WHERE sku = ? AND is_active = 1
    `).bind(body.sku).first();
    
    if (existing) {
      return errorResponse('SKU already exists');
    }
    
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await env.DB.prepare(`
      INSERT INTO products (id, sku, name, description, category, price, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      id,
      body.sku,
      body.name,
      body.description || null,
      body.category || null,
      body.price || null,
      now,
      now
    ).run();
    
    // Fetch created product
    const product = await env.DB.prepare(`
      SELECT * FROM products WHERE id = ?
    `).bind(id).first();
    
    return new Response(JSON.stringify({
      product: { ...product, is_active: Boolean(product?.is_active) },
      message: 'Product created successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return errorResponse('Failed to create product', 500);
  }
});

// PUT /api/products/:id - Update product
productsRouter.put('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return errorResponse('Product ID is required');
    }
    
    // Check if product exists
    const existing = await env.DB.prepare(`
      SELECT * FROM products WHERE id = ? AND is_active = 1
    `).bind(id).first();
    
    if (!existing) {
      return errorResponse('Product not found', 404);
    }
    
    const body = await request.json() as {
      name?: string;
      description?: string;
      category?: string;
      price?: number;
    };
    
    // Build update SQL dynamically
    const updates: string[] = [];
    const params: (string | number | null)[] = [];
    
    if (body.name !== undefined) {
      if (body.name.length > 255) {
        return errorResponse('Name must be 255 characters or less');
      }
      updates.push('name = ?');
      params.push(body.name);
    }
    
    if (body.description !== undefined) {
      updates.push('description = ?');
      params.push(body.description);
    }
    
    if (body.category !== undefined) {
      updates.push('category = ?');
      params.push(body.category);
    }
    
    if (body.price !== undefined) {
      if (body.price < 0) {
        return errorResponse('Price cannot be negative');
      }
      updates.push('price = ?');
      params.push(body.price);
    }
    
    if (updates.length === 0) {
      return errorResponse('No fields to update');
    }
    
    params.push(id);
    
    await env.DB.prepare(`
      UPDATE products SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();
    
    // Fetch updated product
    const product = await env.DB.prepare(`
      SELECT * FROM products WHERE id = ?
    `).bind(id).first();
    
    return new Response(JSON.stringify({
      product: { ...product, is_active: Boolean(product?.is_active) },
      message: 'Product updated successfully',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return errorResponse('Failed to update product', 500);
  }
});

// DELETE /api/products/:id - Soft delete product
productsRouter.delete('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return errorResponse('Product ID is required');
    }
    
    // Check if product exists
    const existing = await env.DB.prepare(`
      SELECT * FROM products WHERE id = ? AND is_active = 1
    `).bind(id).first();
    
    if (!existing) {
      return errorResponse('Product not found', 404);
    }
    
    // Soft delete
    await env.DB.prepare(`
      UPDATE products SET is_active = 0 WHERE id = ?
    `).bind(id).run();
    
    return new Response(JSON.stringify({
      message: 'Product deleted successfully',
      product_id: id,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return errorResponse('Failed to delete product', 500);
  }
});
