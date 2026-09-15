import { createClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
}

const TENANT_ID = '1fcb46af-c475-4867-8c22-1ada8dd7cfdf';
const CLIENT_ID = 'dd10d321-ec5e-425f-897f-1634fcf3c309';
const APPLICATION_ID_URI = `api://vikingvision-teams.pages.dev/${CLIENT_ID}`;
const FRONTEND_URL = 'https://vikingvision-teams.pages.dev';

const corsHeaders = {
  'Access-Control-Allow-Origin': FRONTEND_URL,
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: corsHeaders });
}

function createSupabase(env: Env) {
  if (!env.SUPABASE_URL) throw new Error('SUPABASE_URL is missing');
  if (!env.SUPABASE_SECRET_KEY) throw new Error('SUPABASE_SECRET_KEY is missing');
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function verifyTeamsToken(token: string) {
  const unverified = decodeJwt(token);
  const isV2 = unverified.ver === '2.0';
  const issuer = isV2
    ? `https://login.microsoftonline.com/${TENANT_ID}/v2.0`
    : `https://sts.windows.net/${TENANT_ID}/`;
  const jwksUrl = isV2
    ? `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`
    : `https://login.microsoftonline.com/${TENANT_ID}/discovery/keys`;
  const JWKS = createRemoteJWKSet(new URL(jwksUrl));
  const { payload } = await jwtVerify(token, JWKS, {
    issuer,
    audience: [CLIENT_ID, APPLICATION_ID_URI]
  });
  if (payload.tid !== TENANT_ID) throw new Error('Invalid tenant');
  const scopes = typeof payload.scp === 'string' ? payload.scp.split(' ') : [];
  if (!scopes.includes('access_as_user')) throw new Error('Required scope access_as_user missing');
  return payload;
}

async function authenticate(request: Request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) throw new Error('Missing bearer token');
  return verifyTeamsToken(auth.substring('Bearer '.length));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      try {
        const payload = await authenticate(request);
        return json({
          ok: true,
          authenticated: true,
          service: 'VikingVision API',
          supabaseConfigured: Boolean(env.SUPABASE_URL) && Boolean(env.SUPABASE_SECRET_KEY),
          user: {
            name: payload.name ?? null,
            username: payload.preferred_username ?? payload.upn ?? null,
            objectId: payload.oid ?? null,
            tenantId: payload.tid ?? null
          }
        });
      } catch (error) {
        return json({ ok: false, authenticated: false, error: error instanceof Error ? error.message : 'Authentication failed' }, 401);
      }
    }

    if (request.method === 'GET' && url.pathname === '/players') {
      try {
        const payload = await authenticate(request);
        const supabase = createSupabase(env);
        const { data, error } = await supabase.from('players').select('*').order('name', { ascending: true }).limit(500);
        if (error) return json({ ok: false, authenticated: true, supabase: false, error: error.message }, 500);
        return json({
          ok: true,
          authenticated: true,
          supabase: true,
          user: { name: payload.name ?? null, username: payload.preferred_username ?? payload.upn ?? null },
          count: data?.length ?? 0,
          players: data ?? []
        });
      } catch (error) {
        return json({ ok: false, authenticated: false, supabase: false, error: error instanceof Error ? error.message : 'Request failed' }, 401);
      }
    }

    if (request.method === 'PUT' && url.pathname.startsWith('/players/')) {
      try {
        const payload = await authenticate(request);
        const playerId = url.pathname.substring('/players/'.length).trim();
        if (!playerId) return json({ ok: false, error: 'Player ID missing' }, 400);

        let body: Record<string, unknown>;
        try {
          body = await request.json<Record<string, unknown>>();
        } catch {
          return json({ ok: false, error: 'Invalid JSON body' }, 400);
        }

        const allowedFields = [
          'name', 'birth_date', 'primary_position', 'secondary_position',
          'preferred_foot', 'nationality', 'height_cm', 'current_club',
          'contract_until', 'market_value', 'agent_agency', 'squad_status',
          'priority', 'potential', 'notes', 'transfermarkt_url', 'video_url'
        ];

        const updateData: Record<string, unknown> = {};
        for (const field of allowedFields) {
          if (Object.prototype.hasOwnProperty.call(body, field)) updateData[field] = body[field];
        }
        if (Object.keys(updateData).length === 0) return json({ ok: false, error: 'No valid fields supplied' }, 400);

        updateData.updated_at = new Date().toISOString();

        const supabase = createSupabase(env);
        const { data, error } = await supabase.from('players').update(updateData).eq('id', playerId).select('*').single();
        if (error) return json({ ok: false, authenticated: true, supabase: false, error: error.message }, 500);
        if (!data) return json({ ok: false, authenticated: true, error: 'Player not found' }, 404);

        return json({
          ok: true,
          authenticated: true,
          supabase: true,
          user: { name: payload.name ?? null, username: payload.preferred_username ?? payload.upn ?? null },
          player: data
        });
      } catch (error) {
        return json({ ok: false, authenticated: false, error: error instanceof Error ? error.message : 'Player update failed' }, 401);
      }
    }

    return json({ ok: false, error: 'Not found' }, 404);
  }
};
