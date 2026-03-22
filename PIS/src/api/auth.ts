import { Router } from 'itty-router';
import type { Env } from '../index';

// No base path - we're already mounted at /api/auth/* in main router
export const authRouter = Router();

// JWT Secret - in production, use environment variable
const JWT_SECRET = 'pis-secret-key-2024';

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

// Simple JWT implementation for Cloudflare Workers
async function signJWT(payload: object, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 }));
  
  const data = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${data}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    
    const data = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
    
    if (!isValid) return null;
    
    const payload = JSON.parse(atob(encodedPayload));
    
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

// Password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

// POST /login - Login user (path is relative to /api/auth/)
authRouter.post('/login', async (request: Request, env: Env) => {
  try {
    const body = await request.json() as {
      email: string;
      password: string;
    };
    
    // Validation
    if (!body.email || !body.password) {
      return errorResponse('Email and password are required');
    }
    
    // Find user by email
    const user = await env.DB.prepare(`
      SELECT id, email, password_hash, name, role, is_active
      FROM users
      WHERE email = ? AND is_active = 1
    `).bind(body.email).first();
    
    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(body.password, user.password_hash as string);
    
    if (!isValidPassword) {
      return errorResponse('Invalid email or password', 401);
    }
    
    // Generate JWT token
    const token = await signJWT(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      },
      JWT_SECRET
    );
    
    // Update last login
    await env.DB.prepare(`
      UPDATE users SET last_login = datetime('now') WHERE id = ?
    `).bind(user.id).run();
    
    return new Response(JSON.stringify({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: 'Login successful',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Login failed: ' + (error as Error).message, 500);
  }
});

// POST /register - Register new user
authRouter.post('/register', async (request: Request, env: Env) => {
  try {
    const body = await request.json() as {
      email: string;
      password: string;
      name: string;
      role?: 'admin' | 'user';
    };
    
    if (!body.email || !body.password || !body.name) {
      return errorResponse('Email, password, and name are required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return errorResponse('Invalid email format');
    }
    
    if (body.password.length < 6) {
      return errorResponse('Password must be at least 6 characters');
    }
    
    const existing = await env.DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(body.email).first();
    
    if (existing) {
      return errorResponse('Email already registered');
    }
    
    const passwordHash = await hashPassword(body.password);
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      id,
      body.email,
      passwordHash,
      body.name,
      body.role || 'user',
      now,
      now
    ).run();
    
    return new Response(JSON.stringify({
      user: {
        id,
        email: body.email,
        name: body.name,
        role: body.role || 'user',
      },
      message: 'User registered successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Registration failed: ' + (error as Error).message, 500);
  }
});

// GET /me - Get current user info
authRouter.get('/me', async (request: Request, env: Env) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Authentication required', 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, JWT_SECRET);
    
    if (!payload) {
      return errorResponse('Invalid or expired token', 401);
    }
    
    const user = await env.DB.prepare(`
      SELECT id, email, name, role, is_active, last_login, created_at
      FROM users
      WHERE id = ? AND is_active = 1
    `).bind(payload.userId).first();
    
    if (!user) {
      return errorResponse('User not found', 404);
    }
    
    return new Response(JSON.stringify({ user }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse('Failed to get user info', 500);
  }
});

// Export verification function for use in other routes
export async function verifyAuthToken(request: Request): Promise<any | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return await verifyJWT(token, JWT_SECRET);
}

export async function requireAuth(request: Request): Promise<Response | any> {
  const user = await verifyAuthToken(request);
  
  if (!user) {
    return errorResponse('Authentication required', 401);
  }
  
  return user;
}
