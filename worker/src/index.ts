interface Env {}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://vikingvision-teams.pages.dev',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (url.pathname === '/health') {
      const authHeader = request.headers.get('Authorization');

      return Response.json(
        {
          ok: true,
          service: 'VikingVision API',
          tokenReceived: Boolean(authHeader?.startsWith('Bearer '))
        },
        {
          headers: corsHeaders
        }
      );
    }

    return Response.json(
      {
        ok: false,
        error: 'Not found'
      },
      {
        status: 404,
        headers: corsHeaders
      }
    );
  }
};