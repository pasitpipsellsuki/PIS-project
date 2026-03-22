import { Router } from 'itty-router';
import { productsRouter } from './api/products';
import { locationsRouter } from './api/locations';
import { inventoryRouter } from './api/inventory';
import { authRouter, verifyAuthToken } from './api/auth';
import { exportRouter } from './api/export';

export interface Env {
  DB: D1Database;
}

const router = Router();

// Health check (public)
router.get('/api/health', () => {
  return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Mount auth router (public - no auth required)
router.all('/api/auth/*', authRouter.handle);

// Protected routes middleware
async function requireAuth(request: Request): Promise<Response | null> {
  const user = await verifyAuthToken(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  (request as any).user = user;
  return null;
}

// Mount protected sub-routers
router.all('/api/products/*', async (request, env) => {
  const authError = await requireAuth(request);
  if (authError) return authError;
  return productsRouter.handle(request, env);
});

router.all('/api/locations/*', async (request, env) => {
  const authError = await requireAuth(request);
  if (authError) return authError;
  return locationsRouter.handle(request, env);
});

router.all('/api/inventory/*', async (request, env) => {
  const authError = await requireAuth(request);
  if (authError) return authError;
  return inventoryRouter.handle(request, env);
});

router.all('/api/export/*', async (request, env) => {
  const authError = await requireAuth(request);
  if (authError) return authError;
  return exportRouter.handle(request, env);
});

// 404 handler
router.all('*', () => {
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const response = await router.handle(request, env);
    
    // Add CORS headers to all responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  },
};
