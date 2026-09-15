import { createClient } from '@supabase/supabase-js';
import {
  createRemoteJWKSet,
  decodeJwt,
  jwtVerify
} from 'jose';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
}

const TENANT_ID =
  '1fcb46af-c475-4867-8c22-1ada8dd7cfdf';

const CLIENT_ID =
  'dd10d321-ec5e-425f-897f-1634fcf3c309';

const APPLICATION_ID_URI =
  `api://vikingvision-teams.pages.dev/${CLIENT_ID}`;

const corsHeaders = {
  'Access-Control-Allow-Origin':
    'https://vikingvision-teams.pages.dev',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type',
  'Access-Control-Allow-Methods':
    'GET, OPTIONS'
};

function json(
  data: unknown,
  status = 200
): Response {
  return Response.json(data, {
    status,
    headers: corsHeaders
  });
}

async function verifyTeamsToken(token: string) {
  const unverified = decodeJwt(token);

  const version = unverified.ver;
  const isV2 = version === '2.0';

  const issuer = isV2
    ? `https://login.microsoftonline.com/${TENANT_ID}/v2.0`
    : `https://sts.windows.net/${TENANT_ID}/`;

  const jwksUrl = isV2
    ? `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`
    : `https://login.microsoftonline.com/${TENANT_ID}/discovery/keys`;

  const JWKS = createRemoteJWKSet(
    new URL(jwksUrl)
  );

  const allowedAudiences = [
    CLIENT_ID,
    APPLICATION_ID_URI
  ];

  const { payload } = await jwtVerify(
    token,
    JWKS,
    {
      issuer,
      audience: allowedAudiences
    }
  );

  if (payload.tid !== TENANT_ID) {
    throw new Error('Invalid tenant');
  }

  const scopes =
    typeof payload.scp === 'string'
      ? payload.scp.split(' ')
      : [];

  if (!scopes.includes('access_as_user')) {
    throw new Error(
      'Required scope access_as_user missing'
    );
  }

  return payload;
}

async function authenticate(request: Request) {
  const auth =
    request.headers.get('Authorization');

  if (!auth || !auth.startsWith('Bearer ')) {
    throw new Error('Missing bearer token');
  }

  const token =
    auth.substring('Bearer '.length);

  return verifyTeamsToken(token);
}

export default {
  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    // -------------------------
    // HEALTH
    // -------------------------

    if (url.pathname === '/health') {
      try {
        const payload =
          await authenticate(request);

        return json({
          ok: true,
          authenticated: true,
          service: 'VikingVision API',

          supabaseDebug: {
            hasUrl:
              Boolean(env.SUPABASE_URL),
            hasSecret:
              Boolean(env.SUPABASE_SECRET_KEY)
          },

          user: {
            name:
              payload.name ?? null,

            username:
              payload.preferred_username ??
              payload.upn ??
              null,

            objectId:
              payload.oid ?? null,

            tenantId:
              payload.tid ?? null
          }
        });

      } catch (error) {
        return json(
          {
            ok: false,
            authenticated: false,
            error:
              error instanceof Error
                ? error.message
                : 'Authentication failed'
          },
          401
        );
      }
    }

    // -------------------------
    // PLAYERS
    // -------------------------

    if (url.pathname === '/players') {
      try {
        const payload =
          await authenticate(request);

        if (!env.SUPABASE_URL) {
          return json(
            {
              ok: false,
              authenticated: true,
              supabase: false,
              error:
                'SUPABASE_URL is missing'
            },
            500
          );
        }

        if (!env.SUPABASE_SECRET_KEY) {
          return json(
            {
              ok: false,
              authenticated: true,
              supabase: false,
              error:
                'SUPABASE_SECRET_KEY is missing'
            },
            500
          );
        }

        const supabase = createClient(
          env.SUPABASE_URL,
          env.SUPABASE_SECRET_KEY,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false
            }
          }
        );

        const { data, error } =
          await supabase
            .from('players')
            .select('*')
            .order('name', {
              ascending: true
            })
            .limit(100);

        if (error) {
          console.error(
            'Supabase error:',
            error
          );

          return json(
            {
              ok: false,
              authenticated: true,
              supabase: false,
              error: error.message
            },
            500
          );
        }

        return json({
          ok: true,
          authenticated: true,
          supabase: true,

          user: {
            name:
              payload.name ?? null,

            username:
              payload.preferred_username ??
              payload.upn ??
              null
          },

          count:
            data?.length ?? 0,

          players:
            data ?? []
        });

      } catch (error) {
        return json(
          {
            ok: false,
            authenticated: false,
            supabase: false,
            error:
              error instanceof Error
                ? error.message
                : 'Request failed'
          },
          401
        );
      }
    }

    // -------------------------
    // NOT FOUND
    // -------------------------

    return json(
      {
        ok: false,
        error: 'Not found'
      },
      404
    );
  }
};
