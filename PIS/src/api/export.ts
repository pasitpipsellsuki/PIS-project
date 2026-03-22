import { Router } from 'itty-router';
import type { Env } from '../index';
import { verifyAuthToken } from './auth';

export const exportRouter = Router();

function errorResponse(message: string, status: number = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper to convert array to CSV
function toCSV(data: any[], headers: string[]): string {
  const escape = (str: any) => {
    const string = String(str ?? '');
    if (string.includes(',') || string.includes('"') || string.includes('\n')) {
      return `"${string.replace(/"/g, '""')}"`;
    }
    return string;
  };
  
  const rows = data.map(row => headers.map(h => escape(row[h])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

// GET /api/export/products - Export products to CSV
exportRouter.get('/products', async (request: Request, env: Env) => {
  try {
    // Verify authentication
    const user = await verifyAuthToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }
    
    const { results } = await env.DB.prepare(`
      SELECT 
        p.sku,
        p.name,
        p.description,
        p.category,
        p.price,
        p.is_active,
        p.created_at,
        COALESCE(SUM(i.quantity), 0) as total_stock,
        COUNT(DISTINCT i.location_id) as location_count
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY p.name
    `).all();
    
    const csv = toCSV(results, ['sku', 'name', 'description', 'category', 'price', 'total_stock', 'location_count', 'created_at']);
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="products.csv"',
      },
    });
  } catch (error) {
    console.error('Export products error:', error);
    return errorResponse('Export failed', 500);
  }
});

// GET /api/export/inventory - Export inventory to CSV
exportRouter.get('/inventory', async (request: Request, env: Env) => {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }
    
    const { results } = await env.DB.prepare(`
      SELECT 
        p.sku,
        p.name as product_name,
        l.name as location_name,
        l.type as location_type,
        i.quantity,
        i.min_stock_level,
        i.last_updated
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN locations l ON i.location_id = l.id
      WHERE p.is_active = 1
      ORDER BY p.name, l.name
    `).all();
    
    const csv = toCSV(results, ['sku', 'product_name', 'location_name', 'location_type', 'quantity', 'min_stock_level', 'last_updated']);
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="inventory.csv"',
      },
    });
  } catch (error) {
    console.error('Export inventory error:', error);
    return errorResponse('Export failed', 500);
  }
});
