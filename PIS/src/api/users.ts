import { Router } from 'itty-router';
import type { Env } from '../index';
import { verifyAuthToken } from './auth';

export const usersRouter = Router({ base: '/api/users' });

function errorResponse(message: string, status: number = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonResponse(data: object, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function requireRole(request: Request, ...roles: string[]): Promise<Response | any> {
  const user = await verifyAuthToken(request);
  if (!user) {
    return errorResponse('Authentication required', 401);
  }
  if (!roles.includes(user.role)) {
    return errorResponse('Insufficient permissions', 403);
  }
  return user;
}

// Password hashing (same as auth.ts)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

function generateUUID(): string {
  return crypto.randomUUID();
}

// GET /api/users — list all users (admin only)
usersRouter.get('/', async (request: Request, env: Env) => {
  const auth = await requireRole(request, 'admin');
  if (auth instanceof Response) return auth;

  try {
    const users = await env.DB.prepare(`
      SELECT u.id, u.email, u.name, u.rbac_role as role, u.is_active, u.last_login, u.created_at,
             t.name as team_name, t.id as team_id
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      ORDER BY u.created_at DESC
    `).all();

    return jsonResponse({ users: users.results });
  } catch (error) {
    return errorResponse('Failed to fetch users: ' + (error as Error).message, 500);
  }
});

// GET /api/users/me — get current user profile
usersRouter.get('/me', async (request: Request, env: Env) => {
  const user = await verifyAuthToken(request);
  if (!user) return errorResponse('Authentication required', 401);

  try {
    const userData = await env.DB.prepare(`
      SELECT u.id, u.email, u.name, u.rbac_role as role, u.is_active, u.last_login, u.created_at,
             t.name as team_name, t.id as team_id
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE u.id = ? AND u.is_active = 1
    `).bind(user.userId).first();

    if (!userData) return errorResponse('User not found', 404);

    return jsonResponse({ user: userData });
  } catch (error) {
    return errorResponse('Failed to fetch user: ' + (error as Error).message, 500);
  }
});

// POST /api/users — create user (admin only)
usersRouter.post('/', async (request: Request, env: Env) => {
  const auth = await requireRole(request, 'admin');
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as {
      email: string;
      password: string;
      name: string;
      role: string;
    };

    if (!body.email || !body.password || !body.name || !body.role) {
      return errorResponse('Email, password, name, and role are required');
    }

    const validRoles = ['admin', 'manager', 'staff', 'viewer'];
    if (!validRoles.includes(body.role)) {
      return errorResponse('Invalid role. Must be one of: admin, manager, staff, viewer');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return errorResponse('Invalid email format');
    }

    if (body.password.length < 6) {
      return errorResponse('Password must be at least 6 characters');
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(body.email).first();
    if (existing) {
      return errorResponse('Email already registered', 409);
    }

    const passwordHash = await hashPassword(body.password);
    const id = generateUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, rbac_role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'user', ?, 1, ?, ?)
    `).bind(id, body.email, passwordHash, body.name, body.role, now, now).run();

    return jsonResponse({
      user: { id, email: body.email, name: body.name, role: body.role, is_active: 1 },
      message: 'User created successfully',
    }, 201);
  } catch (error) {
    return errorResponse('Failed to create user: ' + (error as Error).message, 500);
  }
});

// PUT /api/users/:id/role — change user role (admin only)
usersRouter.put('/:id/role', async (request: Request, env: Env) => {
  const auth = await requireRole(request, 'admin');
  if (auth instanceof Response) return auth;

  const { id } = request.params as { id: string };

  try {
    const body = await request.json() as { role: string };

    const validRoles = ['admin', 'manager', 'staff', 'viewer'];
    if (!body.role || !validRoles.includes(body.role)) {
      return errorResponse('Invalid role. Must be one of: admin, manager, staff, viewer');
    }

    const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
    if (!user) return errorResponse('User not found', 404);

    await env.DB.prepare('UPDATE users SET rbac_role = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(body.role, id).run();

    return jsonResponse({ message: 'Role updated successfully' });
  } catch (error) {
    return errorResponse('Failed to update role: ' + (error as Error).message, 500);
  }
});

// PUT /api/users/:id/status — activate/deactivate user (admin only)
usersRouter.put('/:id/status', async (request: Request, env: Env) => {
  const auth = await requireRole(request, 'admin');
  if (auth instanceof Response) return auth;

  const { id } = request.params as { id: string };

  // Prevent self-deactivation
  if (id === auth.userId) {
    return errorResponse('Cannot change your own account status', 400);
  }

  try {
    const body = await request.json() as { is_active: boolean };

    const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
    if (!user) return errorResponse('User not found', 404);

    const isActive = body.is_active ? 1 : 0;
    await env.DB.prepare('UPDATE users SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(isActive, id).run();

    return jsonResponse({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    return errorResponse('Failed to update status: ' + (error as Error).message, 500);
  }
});
