import { Router } from 'itty-router';
import type { Env } from '../index';

export const plansRouter = Router({ base: '/api/plans' });
export const planCustomersRouter = Router({ base: '/api/plan-customers' });

// Helper to handle errors
function errorResponse(message: string, status: number = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/plans - List all plans with item count and customer count
plansRouter.get('/', async (request: Request, env: Env) => {
  try {
    const { results } = await env.DB.prepare(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.purchase_type,
        p.is_active,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT pi.id) as item_count,
        COUNT(DISTINCT pc.id) as customer_count
      FROM plans p
      LEFT JOIN plan_items pi ON p.id = pi.plan_id
      LEFT JOIN plan_customers pc ON p.id = pc.plan_id
      GROUP BY p.id
      ORDER BY p.name
    `).all();

    return new Response(JSON.stringify({ plans: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return errorResponse('Failed to fetch plans', 500);
  }
});

// GET /api/plans/:id - Get plan detail
plansRouter.get('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return errorResponse('Plan ID is required');
    }

    const plan = await env.DB.prepare(`
      SELECT * FROM plans WHERE id = ?
    `).bind(id).first();

    if (!plan) {
      return errorResponse('Plan not found', 404);
    }

    // Get plan items with product details
    const { results: items } = await env.DB.prepare(`
      SELECT
        pi.id,
        pi.plan_id,
        pi.product_id,
        pi.created_at,
        pr.sku,
        pr.name as product_name,
        pr.category,
        pr.price,
        pr.product_type
      FROM plan_items pi
      JOIN products pr ON pi.product_id = pr.id
      WHERE pi.plan_id = ?
      ORDER BY pr.name
    `).bind(id).all();

    // Get quota rule
    const quotaRule = await env.DB.prepare(`
      SELECT * FROM quota_rules WHERE plan_id = ? LIMIT 1
    `).bind(id).first();

    // Get customer count
    const customerCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM plan_customers WHERE plan_id = ?
    `).bind(id).first();

    return new Response(JSON.stringify({
      plan: {
        ...plan,
        is_active: Boolean(plan.is_active),
      },
      items,
      quota_rule: quotaRule || null,
      customer_count: (customerCount as any)?.count || 0,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return errorResponse('Failed to fetch plan', 500);
  }
});

// POST /api/plans - Create plan
plansRouter.post('/', async (request: Request, env: Env) => {
  try {
    const body = await request.json() as {
      name: string;
      description?: string;
      purchase_type?: string;
    };

    if (!body.name) {
      return errorResponse('Plan name is required');
    }

    const validPurchaseTypes = ['one_time', 'subscription'];
    const purchaseType = body.purchase_type || 'one_time';
    if (!validPurchaseTypes.includes(purchaseType)) {
      return errorResponse('purchase_type must be one of: one_time, subscription');
    }

    const now = new Date().toISOString();

    const result = await env.DB.prepare(`
      INSERT INTO plans (name, description, purchase_type, is_active, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?)
    `).bind(
      body.name,
      body.description || null,
      purchaseType,
      now,
      now
    ).run();

    const plan = await env.DB.prepare(`
      SELECT * FROM plans WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify({
      plan: { ...plan, is_active: Boolean(plan?.is_active) },
      message: 'Plan created successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return errorResponse('Failed to create plan', 500);
  }
});

// PUT /api/plans/:id - Update plan
plansRouter.put('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return errorResponse('Plan ID is required');
    }

    const existing = await env.DB.prepare(`
      SELECT * FROM plans WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return errorResponse('Plan not found', 404);
    }

    const body = await request.json() as {
      name?: string;
      description?: string;
      purchase_type?: string;
      is_active?: boolean;
    };

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      params.push(body.name);
    }

    if (body.description !== undefined) {
      updates.push('description = ?');
      params.push(body.description);
    }

    if (body.purchase_type !== undefined) {
      const validPurchaseTypes = ['one_time', 'subscription'];
      if (!validPurchaseTypes.includes(body.purchase_type)) {
        return errorResponse('purchase_type must be one of: one_time, subscription');
      }
      updates.push('purchase_type = ?');
      params.push(body.purchase_type);
    }

    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(body.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update');
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await env.DB.prepare(`
      UPDATE plans SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    const plan = await env.DB.prepare(`
      SELECT * FROM plans WHERE id = ?
    `).bind(id).first();

    return new Response(JSON.stringify({
      plan: { ...plan, is_active: Boolean(plan?.is_active) },
      message: 'Plan updated successfully',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return errorResponse('Failed to update plan', 500);
  }
});

// DELETE /api/plans/:id - Delete plan
plansRouter.delete('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return errorResponse('Plan ID is required');
    }

    const existing = await env.DB.prepare(`
      SELECT * FROM plans WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return errorResponse('Plan not found', 404);
    }

    // Explicitly delete child records first since D1 does not persist
    // PRAGMA foreign_keys = ON across requests, making ON DELETE CASCADE unreliable.
    await env.DB.prepare('DELETE FROM plan_customers WHERE plan_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM quota_rules WHERE plan_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM plan_items WHERE plan_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM plans WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({
      message: 'Plan deleted successfully',
      plan_id: id,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return errorResponse('Failed to delete plan', 500);
  }
});

// POST /api/plans/:id/items - Add product to plan
plansRouter.post('/:id/items', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    const plan = await env.DB.prepare(`
      SELECT * FROM plans WHERE id = ?
    `).bind(id).first();

    if (!plan) {
      return errorResponse('Plan not found', 404);
    }

    const body = await request.json() as { product_id: string | number };

    if (!body.product_id) {
      return errorResponse('product_id is required');
    }

    // Validate product exists and is digital
    const product = await env.DB.prepare(`
      SELECT * FROM products WHERE id = ? AND is_active = 1
    `).bind(body.product_id).first();

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    if ((product as any).product_type !== 'digital') {
      return errorResponse('Only digital products can be added to plans');
    }

    // Check for duplicate
    const existing = await env.DB.prepare(`
      SELECT id FROM plan_items WHERE plan_id = ? AND product_id = ?
    `).bind(id, body.product_id).first();

    if (existing) {
      return errorResponse('Product is already in this plan');
    }

    const now = new Date().toISOString();
    const result = await env.DB.prepare(`
      INSERT INTO plan_items (plan_id, product_id, created_at)
      VALUES (?, ?, ?)
    `).bind(id, body.product_id, now).run();

    const item = await env.DB.prepare(`
      SELECT
        pi.id,
        pi.plan_id,
        pi.product_id,
        pi.created_at,
        pr.sku,
        pr.name as product_name,
        pr.category,
        pr.price,
        pr.product_type
      FROM plan_items pi
      JOIN products pr ON pi.product_id = pr.id
      WHERE pi.id = ?
    `).bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify({
      item,
      message: 'Product added to plan successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error adding plan item:', error);
    return errorResponse('Failed to add product to plan', 500);
  }
});

// DELETE /api/plans/:id/items/:item_id - Remove product from plan
plansRouter.delete('/:id/items/:item_id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const itemId = pathParts[pathParts.length - 1];
    const planId = pathParts[pathParts.length - 3];

    const item = await env.DB.prepare(`
      SELECT * FROM plan_items WHERE id = ? AND plan_id = ?
    `).bind(itemId, planId).first();

    if (!item) {
      return errorResponse('Plan item not found', 404);
    }

    await env.DB.prepare(`
      DELETE FROM plan_items WHERE id = ?
    `).bind(itemId).run();

    return new Response(JSON.stringify({
      message: 'Product removed from plan successfully',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error removing plan item:', error);
    return errorResponse('Failed to remove product from plan', 500);
  }
});

// POST /api/plans/:id/quota-rules - Set quota rule (replace existing)
plansRouter.post('/:id/quota-rules', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    const plan = await env.DB.prepare(`
      SELECT * FROM plans WHERE id = ?
    `).bind(id).first();

    if (!plan) {
      return errorResponse('Plan not found', 404);
    }

    const body = await request.json() as {
      rule_type: string;
      value: number;
      unit?: string;
    };

    if (!body.rule_type || body.value === undefined) {
      return errorResponse('rule_type and value are required');
    }

    const validRuleTypes = ['download_limit', 'access_duration'];
    if (!validRuleTypes.includes(body.rule_type)) {
      return errorResponse('rule_type must be one of: download_limit, access_duration');
    }

    if (body.unit !== undefined) {
      const validUnits = ['days', 'months'];
      if (!validUnits.includes(body.unit)) {
        return errorResponse('unit must be one of: days, months');
      }
    }

    // Remove existing rule for this plan (one rule per plan)
    await env.DB.prepare(`
      DELETE FROM quota_rules WHERE plan_id = ?
    `).bind(id).run();

    const now = new Date().toISOString();
    const result = await env.DB.prepare(`
      INSERT INTO quota_rules (plan_id, rule_type, value, unit, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, body.rule_type, body.value, body.unit || null, now).run();

    const rule = await env.DB.prepare(`
      SELECT * FROM quota_rules WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify({
      quota_rule: rule,
      message: 'Quota rule set successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error setting quota rule:', error);
    return errorResponse('Failed to set quota rule', 500);
  }
});

// DELETE /api/plans/:id/quota-rules - Remove quota rule
plansRouter.delete('/:id/quota-rules', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    const plan = await env.DB.prepare(`
      SELECT * FROM plans WHERE id = ?
    `).bind(id).first();

    if (!plan) {
      return errorResponse('Plan not found', 404);
    }

    await env.DB.prepare(`
      DELETE FROM quota_rules WHERE plan_id = ?
    `).bind(id).run();

    return new Response(JSON.stringify({
      message: 'Quota rule removed successfully',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error removing quota rule:', error);
    return errorResponse('Failed to remove quota rule', 500);
  }
});

// GET /api/plans/:id/customers - List customers for a plan
plansRouter.get('/:id/customers', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    const plan = await env.DB.prepare(`
      SELECT * FROM plans WHERE id = ?
    `).bind(id).first();

    if (!plan) {
      return errorResponse('Plan not found', 404);
    }

    const { results } = await env.DB.prepare(`
      SELECT * FROM plan_customers WHERE plan_id = ? ORDER BY created_at DESC
    `).bind(id).all();

    return new Response(JSON.stringify({ customers: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching plan customers:', error);
    return errorResponse('Failed to fetch plan customers', 500);
  }
});

// POST /api/plans/:id/customers - Add customer to plan
plansRouter.post('/:id/customers', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    const plan = await env.DB.prepare(`
      SELECT * FROM plans WHERE id = ?
    `).bind(id).first();

    if (!plan) {
      return errorResponse('Plan not found', 404);
    }

    const body = await request.json() as {
      customer_name: string;
      customer_email?: string;
      start_date?: string;
      end_date?: string;
    };

    if (!body.customer_name) {
      return errorResponse('customer_name is required');
    }

    const now = new Date().toISOString();
    const result = await env.DB.prepare(`
      INSERT INTO plan_customers (plan_id, customer_name, customer_email, quota_used, start_date, end_date, status, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?, 'active', ?, ?)
    `).bind(
      id,
      body.customer_name,
      body.customer_email || null,
      body.start_date || null,
      body.end_date || null,
      now,
      now
    ).run();

    const customer = await env.DB.prepare(`
      SELECT * FROM plan_customers WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify({
      customer,
      message: 'Customer added to plan successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error adding plan customer:', error);
    return errorResponse('Failed to add customer to plan', 500);
  }
});

// GET /api/plans/:id/stats - Plan statistics
plansRouter.get('/:id/stats', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    const plan = await env.DB.prepare(`
      SELECT * FROM plans WHERE id = ?
    `).bind(id).first();

    if (!plan) {
      return errorResponse('Plan not found', 404);
    }

    const stats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_customers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_customers,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_customers,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_customers,
        AVG(quota_used) as avg_quota_used
      FROM plan_customers
      WHERE plan_id = ?
    `).bind(id).first();

    return new Response(JSON.stringify({ stats }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching plan stats:', error);
    return errorResponse('Failed to fetch plan stats', 500);
  }
});

// PUT /api/plan-customers/:id - Update customer
planCustomersRouter.put('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return errorResponse('Customer ID is required');
    }

    const existing = await env.DB.prepare(`
      SELECT * FROM plan_customers WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return errorResponse('Plan customer not found', 404);
    }

    const body = await request.json() as {
      quota_used?: number;
      status?: string;
      end_date?: string;
      start_date?: string;
      customer_name?: string;
      customer_email?: string;
    };

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (body.customer_name !== undefined) {
      updates.push('customer_name = ?');
      params.push(body.customer_name);
    }

    if (body.customer_email !== undefined) {
      updates.push('customer_email = ?');
      params.push(body.customer_email);
    }

    if (body.quota_used !== undefined) {
      updates.push('quota_used = ?');
      params.push(body.quota_used);
    }

    if (body.status !== undefined) {
      const validStatuses = ['active', 'expired', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        return errorResponse('status must be one of: active, expired, cancelled');
      }
      updates.push('status = ?');
      params.push(body.status);
    }

    if (body.start_date !== undefined) {
      updates.push('start_date = ?');
      params.push(body.start_date);
    }

    if (body.end_date !== undefined) {
      updates.push('end_date = ?');
      params.push(body.end_date);
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update');
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await env.DB.prepare(`
      UPDATE plan_customers SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    const customer = await env.DB.prepare(`
      SELECT * FROM plan_customers WHERE id = ?
    `).bind(id).first();

    return new Response(JSON.stringify({
      customer,
      message: 'Customer updated successfully',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating plan customer:', error);
    return errorResponse('Failed to update plan customer', 500);
  }
});

// DELETE /api/plan-customers/:id - Remove customer from plan
planCustomersRouter.delete('/:id', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return errorResponse('Customer ID is required');
    }

    const existing = await env.DB.prepare(`
      SELECT * FROM plan_customers WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return errorResponse('Plan customer not found', 404);
    }

    await env.DB.prepare(`
      DELETE FROM plan_customers WHERE id = ?
    `).bind(id).run();

    return new Response(JSON.stringify({
      message: 'Customer removed from plan successfully',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting plan customer:', error);
    return errorResponse('Failed to delete plan customer', 500);
  }
});
