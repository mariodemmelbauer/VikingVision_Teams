import {
  createRemoteJWKSet,
  decodeJwt,
  jwtVerify
} from 'jose';

interface Env {}

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
  /*
   * Teams/Entra can issue either v1 or v2 access tokens
   * depending on the Entra configuration.
   *
   * We inspect only the "ver" claim here to select the
   * correct Microsoft metadata/JWKS endpoint.
   * Security validation happens afterwards in jwtVerify().
   */
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

  /*
   * For v2 tokens the aud is normally the API Client ID.
   * For some v1 configurations Entra can use the
   * Application ID URI instead.
   *
   * We allow only our two known resource identifiers.
   */
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

  /*
   * Tenant check in addition to issuer validation.
   */
  if (payload.tid !== TENANT_ID) {
    throw new Error('Invalid tenant');
  }

  /*
   * The token must contain our delegated API scope.
   */
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

    if (url.pathname === '/health') {
      const auth =
        request.headers.get('Authorization');

      if (
        !auth ||
        !auth.startsWith('Bearer ')
      ) {
        return json(
          {
            ok: false,
            authenticated: false,
            error: 'Missing bearer token'
          },
          401
        );
      }

      const token =
        auth.substring('Bearer '.length);

      try {
        const payload =
          await verifyTeamsToken(token);

        return json({
          ok: true,
          authenticated: true,

          service:
            'VikingVision API',

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
        console.error(
          'Token validation failed:',
          error
        );

        return json(
          {
            ok: false,
            authenticated: false,
            error:
              error instanceof Error
                ? error.message
                : 'Token validation failed'
          },
          401
        );
      }
    }

    return json(
      {
        ok: false,
        error: 'Not found'
      },
      404
    );
  }
};
