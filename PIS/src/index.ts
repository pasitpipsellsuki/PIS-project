import { Router } from 'itty-router';
import { productsRouter } from './api/products';
import { locationsRouter } from './api/locations';
import { inventoryRouter } from './api/inventory';
import { authRouter } from './api/auth';
import { usersRouter } from './api/users';
import { teamsRouter } from './api/teams';
import { plansRouter, planCustomersRouter } from './api/plans';

export interface Env {
  DB: D1Database;
}

const router = Router();

// Health check
router.get('/api/health', () => {
  return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Mount sub-routers
router.all('/api/auth/*', authRouter.handle);
router.all('/api/users/*', usersRouter.handle);
router.all('/api/teams/*', teamsRouter.handle);
router.all('/api/products/*', productsRouter.handle);
router.all('/api/locations/*', locationsRouter.handle);
router.all('/api/inventory/*', inventoryRouter.handle);
router.all('/api/plans/*', plansRouter.handle);
router.all('/api/plan-customers/*', planCustomersRouter.handle);

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
