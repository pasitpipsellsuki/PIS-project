import { Router } from 'itty-router';
import type { Env } from '../index';
import { verifyAuthToken } from './auth';

export const teamsRouter = Router({ base: '/api/teams' });

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

async function requireAuth(request: Request): Promise<Response | any> {
  const user = await verifyAuthToken(request);
  if (!user) {
    return errorResponse('Authentication required', 401);
  }
  return user;
}

// GET /api/teams — list all teams (any authenticated user)
teamsRouter.get('/', async (request: Request, env: Env) => {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  try {
    const teams = await env.DB.prepare(`
      SELECT t.id, t.name, t.description, t.lead_user_id, t.created_at, t.updated_at,
             u.name as lead_name, u.email as lead_email,
             COUNT(m.id) as member_count
      FROM teams t
      LEFT JOIN users u ON t.lead_user_id = u.id
      LEFT JOIN users m ON m.team_id = t.id
      GROUP BY t.id
      ORDER BY t.name ASC
    `).all();

    return jsonResponse({ teams: teams.results });
  } catch (error) {
    return errorResponse('Failed to fetch teams: ' + (error as Error).message, 500);
  }
});

// GET /api/teams/:id — get single team with members
teamsRouter.get('/:id', async (request: Request, env: Env) => {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { id } = request.params as { id: string };

  try {
    const team = await env.DB.prepare(`
      SELECT t.id, t.name, t.description, t.lead_user_id, t.created_at, t.updated_at,
             u.name as lead_name, u.email as lead_email
      FROM teams t
      LEFT JOIN users u ON t.lead_user_id = u.id
      WHERE t.id = ?
    `).bind(id).first();

    if (!team) return errorResponse('Team not found', 404);

    const members = await env.DB.prepare(`
      SELECT id, name, email, rbac_role as role
      FROM users
      WHERE team_id = ? AND is_active = 1
      ORDER BY name ASC
    `).bind(id).all();

    return jsonResponse({ team: { ...team, members: members.results } });
  } catch (error) {
    return errorResponse('Failed to fetch team: ' + (error as Error).message, 500);
  }
});

// POST /api/teams — create team (admin/manager)
teamsRouter.post('/', async (request: Request, env: Env) => {
  const auth = await requireRole(request, 'admin', 'manager');
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as {
      name: string;
      description?: string;
      lead_user_id?: string;
    };

    if (!body.name || body.name.trim() === '') {
      return errorResponse('Team name is required');
    }

    const existing = await env.DB.prepare('SELECT id FROM teams WHERE name = ?').bind(body.name.trim()).first();
    if (existing) {
      return errorResponse('A team with this name already exists', 409);
    }

    if (body.lead_user_id) {
      const leadUser = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(body.lead_user_id).first();
      if (!leadUser) return errorResponse('Lead user not found', 404);
    }

    const result = await env.DB.prepare(`
      INSERT INTO teams (name, description, lead_user_id, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).bind(body.name.trim(), body.description || null, body.lead_user_id || null).run();

    return jsonResponse({
      team: { id: result.meta.last_row_id, name: body.name.trim(), description: body.description },
      message: 'Team created successfully',
    }, 201);
  } catch (error) {
    return errorResponse('Failed to create team: ' + (error as Error).message, 500);
  }
});

// PUT /api/teams/:id — update team (admin/manager)
teamsRouter.put('/:id', async (request: Request, env: Env) => {
  const auth = await requireRole(request, 'admin', 'manager');
  if (auth instanceof Response) return auth;

  const { id } = request.params as { id: string };

  try {
    const body = await request.json() as {
      name?: string;
      description?: string;
      lead_user_id?: string | null;
    };

    const team = await env.DB.prepare('SELECT id FROM teams WHERE id = ?').bind(id).first();
    if (!team) return errorResponse('Team not found', 404);

    if (body.name !== undefined && body.name.trim() === '') {
      return errorResponse('Team name cannot be empty');
    }

    if (body.lead_user_id) {
      const leadUser = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(body.lead_user_id).first();
      if (!leadUser) return errorResponse('Lead user not found', 404);
    }

    await env.DB.prepare(`
      UPDATE teams SET
        name = COALESCE(?, name),
        description = CASE WHEN ? IS NOT NULL THEN ? ELSE description END,
        lead_user_id = CASE WHEN ? IS NOT NULL THEN ? ELSE lead_user_id END,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.name?.trim() || null,
      body.description !== undefined ? 1 : null,
      body.description !== undefined ? body.description : null,
      body.lead_user_id !== undefined ? 1 : null,
      body.lead_user_id !== undefined ? body.lead_user_id : null,
      id
    ).run();

    return jsonResponse({ message: 'Team updated successfully' });
  } catch (error) {
    return errorResponse('Failed to update team: ' + (error as Error).message, 500);
  }
});

// DELETE /api/teams/:id — delete team (admin only)
teamsRouter.delete('/:id', async (request: Request, env: Env) => {
  const auth = await requireRole(request, 'admin');
  if (auth instanceof Response) return auth;

  const { id } = request.params as { id: string };

  try {
    const team = await env.DB.prepare('SELECT id FROM teams WHERE id = ?').bind(id).first();
    if (!team) return errorResponse('Team not found', 404);

    // Remove team assignment from users
    await env.DB.prepare('UPDATE users SET team_id = NULL WHERE team_id = ?').bind(id).run();

    // Delete the team
    await env.DB.prepare('DELETE FROM teams WHERE id = ?').bind(id).run();

    return jsonResponse({ message: 'Team deleted successfully' });
  } catch (error) {
    return errorResponse('Failed to delete team: ' + (error as Error).message, 500);
  }
});

// POST /api/teams/:id/members — add member to team (admin/manager)
teamsRouter.post('/:id/members', async (request: Request, env: Env) => {
  const auth = await requireRole(request, 'admin', 'manager');
  if (auth instanceof Response) return auth;

  const { id } = request.params as { id: string };

  try {
    const body = await request.json() as { user_id: string };

    if (!body.user_id) return errorResponse('user_id is required');

    const team = await env.DB.prepare('SELECT id FROM teams WHERE id = ?').bind(id).first();
    if (!team) return errorResponse('Team not found', 404);

    const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(body.user_id).first();
    if (!user) return errorResponse('User not found', 404);

    await env.DB.prepare('UPDATE users SET team_id = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(id, body.user_id).run();

    return jsonResponse({ message: 'Member added to team successfully' });
  } catch (error) {
    return errorResponse('Failed to add member: ' + (error as Error).message, 500);
  }
});

// DELETE /api/teams/:id/members/:userId — remove member from team (admin/manager)
teamsRouter.delete('/:id/members/:userId', async (request: Request, env: Env) => {
  const auth = await requireRole(request, 'admin', 'manager');
  if (auth instanceof Response) return auth;

  const { id, userId } = request.params as { id: string; userId: string };

  try {
    const team = await env.DB.prepare('SELECT id FROM teams WHERE id = ?').bind(id).first();
    if (!team) return errorResponse('Team not found', 404);

    const user = await env.DB.prepare('SELECT id FROM users WHERE id = ? AND team_id = ?').bind(userId, id).first();
    if (!user) return errorResponse('User not found in this team', 404);

    await env.DB.prepare('UPDATE users SET team_id = NULL, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(userId).run();

    return jsonResponse({ message: 'Member removed from team successfully' });
  } catch (error) {
    return errorResponse('Failed to remove member: ' + (error as Error).message, 500);
  }
});
