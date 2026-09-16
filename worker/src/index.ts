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

const FRONTEND_URL =
  'https://vikingvision-teams.pages.dev';

const corsHeaders = {
  'Access-Control-Allow-Origin':
    FRONTEND_URL,
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type',
  'Access-Control-Allow-Methods':
    'GET, POST, PUT, DELETE, OPTIONS'
};

function json(
  data: unknown,
  status = 200
): Response {
  return Response.json(
    data,
    {
      status,
      headers: corsHeaders
    }
  );
}

function createSupabase(env: Env) {
  if (!env.SUPABASE_URL) {
    throw new Error(
      'SUPABASE_URL is missing'
    );
  }

  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error(
      'SUPABASE_SECRET_KEY is missing'
    );
  }

  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

async function verifyTeamsToken(
  token: string
) {
  const unverified =
    decodeJwt(token);

  const isV2 =
    unverified.ver === '2.0';

  const issuer =
    isV2
      ? `https://login.microsoftonline.com/${TENANT_ID}/v2.0`
      : `https://sts.windows.net/${TENANT_ID}/`;

  const jwksUrl =
    isV2
      ? `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`
      : `https://login.microsoftonline.com/${TENANT_ID}/discovery/keys`;

  const JWKS =
    createRemoteJWKSet(
      new URL(jwksUrl)
    );

  const { payload } =
    await jwtVerify(
      token,
      JWKS,
      {
        issuer,
        audience: [
          CLIENT_ID,
          APPLICATION_ID_URI
        ]
      }
    );

  if (payload.tid !== TENANT_ID) {
    throw new Error(
      'Invalid tenant'
    );
  }

  const scopes =
    typeof payload.scp === 'string'
      ? payload.scp.split(' ')
      : [];

  if (
    !scopes.includes(
      'access_as_user'
    )
  ) {
    throw new Error(
      'Required scope access_as_user missing'
    );
  }

  return payload;
}

async function authenticate(
  request: Request
) {
  const auth =
    request.headers.get(
      'Authorization'
    );

  if (
    !auth ||
    !auth.startsWith(
      'Bearer '
    )
  ) {
    throw new Error(
      'Missing bearer token'
    );
  }

  return verifyTeamsToken(
    auth.substring(
      'Bearer '.length
    )
  );
}

function pickFields(
  body: Record<string, unknown>,
  allowedFields: string[]
) {
  const result:
    Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (
      Object.prototype
        .hasOwnProperty
        .call(body, field)
    ) {
      result[field] =
        body[field];
    }
  }

  return result;
}

const scoutingFields = [
  'player_id',
  'scout_name',
  'observation_date',
  'competition',
  'match_name',
  'opponent',
  'observed_position',
  'minutes_played',
  'technical_rating',
  'tactical_rating',
  'athletic_rating',
  'mentality_rating',
  'potential_rating',
  'strengths',
  'development_areas',
  'overall_impression',
  'recommendation',
  'next_action'
];

export default {
  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {
    if (
      request.method === 'OPTIONS'
    ) {
      return new Response(
        null,
        {
          status: 204,
          headers: corsHeaders
        }
      );
    }

    const url =
      new URL(request.url);

    if (
      request.method === 'GET' &&
      url.pathname === '/health'
    ) {
      try {
        const payload =
          await authenticate(
            request
          );

        return json({
          ok: true,
          authenticated: true,
          service:
            'VikingVision API',
          supabaseConfigured:
            Boolean(
              env.SUPABASE_URL
            ) &&
            Boolean(
              env.SUPABASE_SECRET_KEY
            ),
          user: {
            name:
              payload.name ??
              null,
            username:
              payload
                .preferred_username ??
              payload.upn ??
              null,
            objectId:
              payload.oid ??
              null,
            tenantId:
              payload.tid ??
              null
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

    if (
      request.method === 'GET' &&
      url.pathname === '/players'
    ) {
      try {
        await authenticate(
          request
        );

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from('players')
            .select('*')
            .order(
              'name',
              {
                ascending: true
              }
            )
            .limit(500);

        if (error) {
          return json(
            {
              ok: false,
              supabase: false,
              error:
                error.message
            },
            500
          );
        }

        return json({
          ok: true,
          supabase: true,
          count:
            data?.length ?? 0,
          players:
            data ?? []
        });
      } catch (error) {
        return json(
          {
            ok: false,
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

    if (
      request.method === 'PUT' &&
      url.pathname.startsWith(
        '/players/'
      )
    ) {
      try {
        await authenticate(
          request
        );

        const playerId =
          url.pathname
            .substring(
              '/players/'.length
            )
            .trim();

        if (!playerId) {
          return json(
            {
              ok: false,
              error:
                'Player ID missing'
            },
            400
          );
        }

        const body =
          await request.json<
            Record<string, unknown>
          >();

        const allowedFields = [
          'name',
          'birth_date',
          'primary_position',
          'secondary_position',
          'preferred_foot',
          'nationality',
          'height_cm',
          'current_club',
          'contract_until',
          'market_value',
          'agent_agency',
          'squad_status',
          'priority',
          'potential',
          'notes',
          'transfermarkt_url',
          'video_url'
        ];

        const updateData =
          pickFields(
            body,
            allowedFields
          );

        if (
          Object.keys(
            updateData
          ).length === 0
        ) {
          return json(
            {
              ok: false,
              error:
                'No valid fields supplied'
            },
            400
          );
        }

        updateData.updated_at =
          new Date()
            .toISOString();

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from('players')
            .update(updateData)
            .eq(
              'id',
              playerId
            )
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json({
          ok: true,
          player:
            data
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Player update failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'GET' &&
      url.pathname ===
        '/scouting-reports'
    ) {
      try {
        await authenticate(
          request
        );

        const supabase =
          createSupabase(env);

        const {
          data: reports,
          error: reportsError
        } =
          await supabase
            .from(
              'scouting_reports'
            )
            .select('*')
            .order(
              'observation_date',
              {
                ascending: false,
                nullsFirst: false
              }
            )
            .order(
              'created_at',
              {
                ascending: false
              }
            )
            .limit(500);

        if (reportsError) {
          return json(
            {
              ok: false,
              error:
                reportsError.message
            },
            500
          );
        }

        const playerIds =
          Array.from(
            new Set(
              (reports ?? [])
                .map(report =>
                  report.player_id
                )
                .filter(Boolean)
            )
          );

        const nameMap =
          new Map<
            string,
            string
          >();

        if (
          playerIds.length > 0
        ) {
          const {
            data: playerRows,
            error: playersError
          } =
            await supabase
              .from('players')
              .select(
                'id,name'
              )
              .in(
                'id',
                playerIds
              );

          if (playersError) {
            return json(
              {
                ok: false,
                error:
                  playersError.message
              },
              500
            );
          }

          for (
            const player of
            playerRows ?? []
          ) {
            nameMap.set(
              String(player.id),
              player.name ??
                `Spieler ${player.id}`
            );
          }
        }

        const enrichedReports =
          (reports ?? []).map(
            report => ({
              ...report,
              player_name:
                nameMap.get(
                  String(
                    report.player_id
                  )
                ) ??
                `Spieler ${report.player_id}`
            })
          );

        return json({
          ok: true,
          count:
            enrichedReports.length,
          reports:
            enrichedReports
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Request failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'POST' &&
      url.pathname ===
        '/scouting-reports'
    ) {
      try {
        await authenticate(
          request
        );

        const body =
          await request.json<
            Record<string, unknown>
          >();

        const insertData =
          pickFields(
            body,
            scoutingFields
          );

        if (
          !insertData.player_id
        ) {
          return json(
            {
              ok: false,
              error:
                'player_id is required'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from(
              'scouting_reports'
            )
            .insert(
              insertData
            )
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json(
          {
            ok: true,
            report:
              data
          },
          201
        );
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Report creation failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'PUT' &&
      url.pathname.startsWith(
        '/scouting-reports/'
      )
    ) {
      try {
        await authenticate(
          request
        );

        const reportId =
          url.pathname
            .substring(
              '/scouting-reports/'
                .length
            )
            .trim();

        if (!reportId) {
          return json(
            {
              ok: false,
              error:
                'Report ID missing'
            },
            400
          );
        }

        const body =
          await request.json<
            Record<string, unknown>
          >();

        const updateData =
          pickFields(
            body,
            scoutingFields
          );

        if (
          Object.keys(
            updateData
          ).length === 0
        ) {
          return json(
            {
              ok: false,
              error:
                'No valid fields supplied'
            },
            400
          );
        }

        updateData.updated_at =
          new Date()
            .toISOString();

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from(
              'scouting_reports'
            )
            .update(
              updateData
            )
            .eq(
              'id',
              reportId
            )
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json({
          ok: true,
          report:
            data
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Report update failed'
          },
          401
        );
      }
    }


    if (
      request.method === 'GET' &&
      url.pathname === '/watchlist'
    ) {
      try {
        await authenticate(request);

        const supabase =
          createSupabase(env);

        const {
          data: entries,
          error: entriesError
        } =
          await supabase
            .from('watchlist')
            .select('*')
            .order(
              'added_at',
              {
                ascending: false
              }
            )
            .limit(500);

        if (entriesError) {
          return json(
            {
              ok: false,
              error:
                entriesError.message
            },
            500
          );
        }

        const playerIds =
          Array.from(
            new Set(
              (entries ?? [])
                .map(entry =>
                  entry.player_id
                )
                .filter(Boolean)
            )
          );

        const nameMap =
          new Map<
            string,
            string
          >();

        if (
          playerIds.length > 0
        ) {
          const {
            data: playerRows,
            error: playersError
          } =
            await supabase
              .from('players')
              .select('id,name')
              .in(
                'id',
                playerIds
              );

          if (playersError) {
            return json(
              {
                ok: false,
                error:
                  playersError.message
              },
              500
            );
          }

          for (
            const player of
            playerRows ?? []
          ) {
            nameMap.set(
              String(player.id),
              player.name ??
                `Spieler ${player.id}`
            );
          }
        }

        const enriched =
          (entries ?? []).map(
            entry => ({
              ...entry,
              player_name:
                nameMap.get(
                  String(
                    entry.player_id
                  )
                ) ??
                `Spieler ${entry.player_id}`
            })
          );

        return json({
          ok: true,
          count:
            enriched.length,
          entries:
            enriched
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Request failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/watchlist'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<
            Record<string, unknown>
          >();

        if (!body.player_id) {
          return json(
            {
              ok: false,
              error:
                'player_id is required'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          data: existing,
          error: existingError
        } =
          await supabase
            .from('watchlist')
            .select('id')
            .eq(
              'player_id',
              body.player_id
            )
            .maybeSingle();

        if (existingError) {
          return json(
            {
              ok: false,
              error:
                existingError.message
            },
            500
          );
        }

        if (existing) {
          return json(
            {
              ok: false,
              error:
                'Spieler ist bereits auf der Watchlist'
            },
            409
          );
        }

        const insertData =
          pickFields(
            body,
            [
              'player_id',
              'status',
              'priority',
              'reason'
            ]
          );

        const {
          data,
          error
        } =
          await supabase
            .from('watchlist')
            .insert(insertData)
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json(
          {
            ok: true,
            entry: data
          },
          201
        );
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Watchlist creation failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'PUT' &&
      url.pathname.startsWith(
        '/watchlist/'
      )
    ) {
      try {
        await authenticate(request);

        const entryId =
          url.pathname
            .substring(
              '/watchlist/'.length
            )
            .trim();

        if (!entryId) {
          return json(
            {
              ok: false,
              error:
                'Watchlist ID missing'
            },
            400
          );
        }

        const body =
          await request.json<
            Record<string, unknown>
          >();

        const updateData =
          pickFields(
            body,
            [
              'status',
              'priority',
              'reason'
            ]
          );

        if (
          Object.keys(
            updateData
          ).length === 0
        ) {
          return json(
            {
              ok: false,
              error:
                'No valid fields supplied'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from('watchlist')
            .update(updateData)
            .eq(
              'id',
              entryId
            )
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json({
          ok: true,
          entry: data
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Watchlist update failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'DELETE' &&
      url.pathname.startsWith(
        '/watchlist/'
      )
    ) {
      try {
        await authenticate(request);

        const entryId =
          url.pathname
            .substring(
              '/watchlist/'.length
            )
            .trim();

        if (!entryId) {
          return json(
            {
              ok: false,
              error:
                'Watchlist ID missing'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          error
        } =
          await supabase
            .from('watchlist')
            .delete()
            .eq(
              'id',
              entryId
            );

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json({
          ok: true
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Watchlist delete failed'
          },
          401
        );
      }
    }


    if (
      request.method === 'GET' &&
      url.pathname === '/squad'
    ) {
      try {
        await authenticate(request);

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from('players')
            .select('*')
            .eq(
              'is_own_squad',
              true
            )
            .order(
              'name',
              {
                ascending: true
              }
            );

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json({
          ok: true,
          count:
            data?.length ?? 0,
          players:
            data ?? []
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Squad request failed'
          },
          401
        );
      }
    }


    if (
      request.method === 'GET' &&
      url.pathname === '/academy/players'
    ) {
      try {
        await authenticate(request);

        const team =
          url.searchParams.get('team');

        if (!team) {
          return json(
            {
              ok: false,
              error:
                'team is required'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from(
              'academy_players'
            )
            .select('*')
            .eq(
              'team',
              team
            )
            .order(
              'name',
              {
                ascending: true
              }
            );

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json({
          ok: true,
          count:
            data?.length ?? 0,
          players:
            data ?? []
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Academy players request failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'GET' &&
      url.pathname === '/academy/fixtures'
    ) {
      try {
        await authenticate(request);

        const team =
          url.searchParams.get('team');

        if (!team) {
          return json(
            {
              ok: false,
              error:
                'team is required'
            },
            400
          );
        }

        const today =
          new Date()
            .toISOString()
            .slice(0, 10);

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from(
              'academy_fixtures'
            )
            .select('*')
            .eq(
              'team',
              team
            )
            .gte(
              'match_date',
              today
            )
            .order(
              'match_date',
              {
                ascending: true
              }
            )
            .limit(30);

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json({
          ok: true,
          fixtures:
            data ?? []
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Academy fixtures request failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'GET' &&
      url.pathname === '/academy/matches'
    ) {
      try {
        await authenticate(request);

        const team =
          url.searchParams.get('team');

        if (!team) {
          return json(
            {
              ok: false,
              error:
                'team is required'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from(
              'academy_matches'
            )
            .select('*')
            .eq(
              'team',
              team
            )
            .order(
              'match_date',
              {
                ascending: false
              }
            )
            .limit(30);

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json({
          ok: true,
          matches:
            data ?? []
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Academy matches request failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'GET' &&
      url.pathname === '/academy/overview'
    ) {
      try {
        await authenticate(request);

        const team =
          url.searchParams.get('team');

        if (!team) {
          return json(
            {
              ok: false,
              error:
                'team is required'
            },
            400
          );
        }

        const today =
          new Date()
            .toISOString()
            .slice(0, 10);

        const supabase =
          createSupabase(env);

        const [
          playersResult,
          fixturesResult,
          matchesResult
        ] =
          await Promise.all([
            supabase
              .from(
                'academy_players'
              )
              .select(
                'id',
                {
                  count: 'exact',
                  head: true
                }
              )
              .eq(
                'team',
                team
              ),

            supabase
              .from(
                'academy_fixtures'
              )
              .select(
                'id',
                {
                  count: 'exact',
                  head: true
                }
              )
              .eq(
                'team',
                team
              )
              .gte(
                'match_date',
                today
              ),

            supabase
              .from(
                'academy_matches'
              )
              .select(
                'id'
              )
              .eq(
                'team',
                team
              )
          ]);

        if (
          playersResult.error ||
          fixturesResult.error ||
          matchesResult.error
        ) {
          const firstError =
            playersResult.error ??
            fixturesResult.error ??
            matchesResult.error;

          return json(
            {
              ok: false,
              error:
                firstError?.message ??
                'Academy overview failed'
            },
            500
          );
        }

        const matchIds =
          (matchesResult.data ?? [])
            .map(row => row.id);

        let totalMinutes = 0;

        if (
          matchIds.length > 0
        ) {
          const {
            data: minuteRows,
            error: minutesError
          } =
            await supabase
              .from(
                'academy_match_minutes'
              )
              .select(
                'minutes'
              )
              .in(
                'match_id',
                matchIds
              );

          if (minutesError) {
            return json(
              {
                ok: false,
                error:
                  minutesError.message
              },
              500
            );
          }

          totalMinutes =
            (minuteRows ?? [])
              .reduce(
                (
                  total,
                  row
                ) =>
                  total +
                  Number(
                    row.minutes ??
                    0
                  ),
                0
              );
        }

        return json({
          ok: true,
          overview: {
            team,
            playerCount:
              playersResult.count ??
              0,
            upcomingFixtureCount:
              fixturesResult.count ??
              0,
            playedMatchCount:
              matchesResult.data
                ?.length ?? 0,
            totalMinutes
          }
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Academy overview request failed'
          },
          401
        );
      }
    }


    if (
      request.method === 'GET' &&
      url.pathname === '/academy/ideals'
    ) {
      try {
        await authenticate(request);

        const team =
          url.searchParams.get('team');

        if (!team) {
          return json(
            {
              ok: false,
              error:
                'team is required'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          data: players,
          error: playersError
        } =
          await supabase
            .from(
              'academy_players'
            )
            .select('id,name')
            .eq(
              'team',
              team
            );

        if (playersError) {
          return json(
            {
              ok: false,
              error:
                playersError.message
            },
            500
          );
        }

        const playerIds =
          (players ?? [])
            .map(player => player.id);

        if (playerIds.length === 0) {
          return json({
            ok: true,
            assessments: []
          });
        }

        const {
          data: assessments,
          error: assessmentsError
        } =
          await supabase
            .from(
              'academy_ideal_assessments'
            )
            .select('*')
            .in(
              'academy_player_id',
              playerIds
            )
            .order(
              'assessment_date',
              {
                ascending: false,
                nullsFirst: false
              }
            )
            .limit(500);

        if (assessmentsError) {
          return json(
            {
              ok: false,
              error:
                assessmentsError.message
            },
            500
          );
        }

        const assessmentIds =
          (assessments ?? [])
            .map(row => row.id);

        let scores:
          Array<Record<string, unknown>> = [];

        if (
          assessmentIds.length > 0
        ) {
          const {
            data: scoreRows,
            error: scoresError
          } =
            await supabase
              .from(
                'academy_ideal_scores'
              )
              .select('*')
              .in(
                'assessment_id',
                assessmentIds
              );

          if (scoresError) {
            return json(
              {
                ok: false,
                error:
                  scoresError.message
              },
              500
            );
          }

          scores =
            scoreRows ?? [];
        }

        const playerMap =
          new Map<
            string,
            string
          >(
            (players ?? [])
              .map(player => [
                String(player.id),
                player.name
              ])
          );

        const groupedScores =
          new Map<
            string,
            Array<Record<string, unknown>>
          >();

        for (
          const score of
          scores
        ) {
          const key =
            String(
              score.assessment_id
            );

          if (
            !groupedScores.has(
              key
            )
          ) {
            groupedScores.set(
              key,
              []
            );
          }

          groupedScores
            .get(key)
            ?.push(score);
        }

        const enriched =
          (assessments ?? [])
            .map(
              assessment => ({
                ...assessment,
                player_name:
                  playerMap.get(
                    String(
                      assessment.academy_player_id
                    )
                  ),
                scores:
                  groupedScores.get(
                    String(
                      assessment.id
                    )
                  ) ?? []
              })
            );

        return json({
          ok: true,
          assessments:
            enriched
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Academy ideals request failed'
          },
          401
        );
      }
    }


    if (
      request.method === 'GET' &&
      url.pathname === '/academy/scouting'
    ) {
      try {
        await authenticate(request);

        const supabase =
          createSupabase(env);

        const [
          playersResult,
          reportsResult
        ] =
          await Promise.all([
            supabase
              .from(
                'academy_scouting_players'
              )
              .select('*')
              .order(
                'name',
                {
                  ascending: true
                }
              ),

            supabase
              .from(
                'academy_scouting_reports'
              )
              .select('*')
              .order(
                'observation_date',
                {
                  ascending: false
                }
              )
              .limit(500)
          ]);

        if (
          playersResult.error ||
          reportsResult.error
        ) {
          const firstError =
            playersResult.error ??
            reportsResult.error;

          return json(
            {
              ok: false,
              error:
                firstError?.message ??
                'Academy scouting request failed'
            },
            500
          );
        }

        const playerMap =
          new Map<
            string,
            string
          >(
            (playersResult.data ?? [])
              .map(player => [
                String(player.id),
                player.name
              ])
          );

        const reports =
          (reportsResult.data ?? [])
            .map(report => ({
              ...report,
              player_name:
                playerMap.get(
                  String(
                    report.player_id
                  )
                )
            }));

        return json({
          ok: true,
          players:
            playersResult.data ?? [],
          reports
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Academy scouting request failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'POST' &&
      url.pathname ===
        '/academy/scouting/reports'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<
            Record<string, unknown>
          >();

        if (
          !body.player_id ||
          !body.observation_date
        ) {
          return json(
            {
              ok: false,
              error:
                'player_id and observation_date are required'
            },
            400
          );
        }

        const payload =
          pickFields(
            body,
            [
              'player_id',
              'scout_name',
              'observation_date',
              'competition',
              'match_name',
              'opponent',
              'observed_position',
              'minutes_played',
              'technical_rating',
              'tactical_rating',
              'athletic_rating',
              'mentality_rating',
              'potential_rating',
              'strengths',
              'development_areas',
              'overall_impression',
              'recommendation',
              'next_action'
            ]
          );

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from(
              'academy_scouting_reports'
            )
            .insert(payload)
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json(
          {
            ok: true,
            report: data
          },
          201
        );
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Academy scouting report creation failed'
          },
          401
        );
      }
    }


    if (
      request.method === 'GET' &&
      url.pathname === '/academy/sport-science'
    ) {
      try {
        await authenticate(request);

        const team =
          url.searchParams.get('team');

        if (!team) {
          return json(
            {
              ok: false,
              error: 'team is required'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          data: players,
          error: playersError
        } =
          await supabase
            .from('academy_players')
            .select('id,name')
            .eq('team', team);

        if (playersError) {
          return json(
            {
              ok: false,
              error: playersError.message
            },
            500
          );
        }

        const playerIds =
          (players ?? [])
            .map(player => player.id);

        if (playerIds.length === 0) {
          return json({
            ok: true,
            tests: []
          });
        }

        const {
          data: tests,
          error: testsError
        } =
          await supabase
            .from(
              'academy_sport_science_tests'
            )
            .select('*')
            .in(
              'academy_player_id',
              playerIds
            )
            .order(
              'test_date',
              {
                ascending: false
              }
            )
            .limit(1000);

        if (testsError) {
          return json(
            {
              ok: false,
              error: testsError.message
            },
            500
          );
        }

        const playerMap =
          new Map(
            (players ?? []).map(
              player => [
                String(player.id),
                player.name
              ]
            )
          );

        const enriched =
          (tests ?? []).map(test => ({
            ...test,
            player_name:
              test.academy_player_id
                ? playerMap.get(
                    String(
                      test.academy_player_id
                    )
                  )
                : undefined
          }));

        return json({
          ok: true,
          tests: enriched
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Sport science request failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'GET' &&
      url.pathname === '/academy/skill-ac'
    ) {
      try {
        await authenticate(request);

        const team =
          url.searchParams.get('team');

        if (!team) {
          return json(
            {
              ok: false,
              error: 'team is required'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          data: players,
          error: playersError
        } =
          await supabase
            .from('academy_players')
            .select('id,name')
            .eq('team', team);

        if (playersError) {
          return json(
            {
              ok: false,
              error: playersError.message
            },
            500
          );
        }

        const playerIds =
          (players ?? [])
            .map(player => player.id);

        if (playerIds.length === 0) {
          return json({
            ok: true,
            forms: []
          });
        }

        const {
          data: forms,
          error: formsError
        } =
          await supabase
            .from(
              'academy_skill_ac_forms'
            )
            .select('*')
            .in(
              'academy_player_id',
              playerIds
            )
            .order(
              'updated_at',
              {
                ascending: false
              }
            )
            .limit(500);

        if (formsError) {
          return json(
            {
              ok: false,
              error: formsError.message
            },
            500
          );
        }

        const playerMap =
          new Map(
            (players ?? []).map(
              player => [
                String(player.id),
                player.name
              ]
            )
          );

        const enriched =
          (forms ?? []).map(form => ({
            ...form,
            player_name:
              playerMap.get(
                String(
                  form.academy_player_id
                )
              )
          }));

        return json({
          ok: true,
          forms: enriched
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Skill/AC request failed'
          },
          401
        );
      }
    }


    if (
      request.method === 'GET' &&
      url.pathname.startsWith(
        '/academy/player/'
      )
    ) {
      try {
        await authenticate(request);

        const playerId =
          url.pathname
            .substring(
              '/academy/player/'.length
            )
            .trim();

        if (!playerId) {
          return json(
            {
              ok: false,
              error:
                'academy player id is required'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          data: player,
          error: playerError
        } =
          await supabase
            .from(
              'academy_players'
            )
            .select('*')
            .eq(
              'id',
              playerId
            )
            .single();

        if (playerError) {
          return json(
            {
              ok: false,
              error:
                playerError.message
            },
            500
          );
        }

        const [
          assessmentsResult,
          sportScienceResult,
          skillAcResult
        ] =
          await Promise.all([
            supabase
              .from(
                'academy_ideal_assessments'
              )
              .select('*')
              .eq(
                'academy_player_id',
                playerId
              )
              .order(
                'assessment_date',
                {
                  ascending: false
                }
              ),

            supabase
              .from(
                'academy_sport_science_tests'
              )
              .select('*')
              .eq(
                'academy_player_id',
                playerId
              )
              .order(
                'test_date',
                {
                  ascending: false
                }
              ),

            supabase
              .from(
                'academy_skill_ac_forms'
              )
              .select('*')
              .eq(
                'academy_player_id',
                playerId
              )
              .order(
                'updated_at',
                {
                  ascending: false
                }
              )
          ]);

        const assessmentIds =
          (
            assessmentsResult.data ??
            []
          ).map(
            row => row.id
          );

        let idealScores:
          Array<Record<string, unknown>> =
          [];

        if (
          assessmentIds.length > 0
        ) {
          const {
            data,
            error
          } =
            await supabase
              .from(
                'academy_ideal_scores'
              )
              .select('*')
              .in(
                'assessment_id',
                assessmentIds
              );

          if (error) {
            return json(
              {
                ok: false,
                error:
                  error.message
              },
              500
            );
          }

          idealScores =
            data ?? [];
        }

        return json({
          ok: true,
          player,
          idealAssessments:
            assessmentsResult.data ??
            [],
          idealScores,
          sportScienceTests:
            sportScienceResult.data ??
            [],
          skillAcForms:
            skillAcResult.data ??
            []
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Academy player profile request failed'
          },
          401
        );
      }
    }


    if (
      request.method === 'PUT' &&
      url.pathname.startsWith(
        '/academy/player/'
      )
    ) {
      try {
        await authenticate(request);

        const playerId =
          url.pathname
            .substring(
              '/academy/player/'.length
            )
            .trim();

        if (!playerId) {
          return json(
            {
              ok: false,
              error:
                'academy player id is required'
            },
            400
          );
        }

        const body =
          await request.json<
            Record<string, unknown>
          >();

        const updateData =
          pickFields(
            body,
            [
              'name',
              'birth_date',
              'primary_position',
              'player_role',
              'preferred_foot',
              'jersey_number',
              'nationality',
              'height',
              'current_club',
              'squad_status',
              'notes',
              'boarding_school',
              'school_type',
              'school_class',
              'bus_use',
              'bus_route'
            ]
          );

        if (
          Object.keys(
            updateData
          ).length === 0
        ) {
          return json(
            {
              ok: false,
              error:
                'No valid fields supplied'
            },
            400
          );
        }

        updateData.updated_at =
          new Date().toISOString();

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from(
              'academy_players'
            )
            .update(updateData)
            .eq(
              'id',
              playerId
            )
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json({
          ok: true,
          player: data
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Academy player update failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'POST' &&
      url.pathname ===
        '/academy/sport-science'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<
            Record<string, unknown>
          >();

        if (
          !body.academy_player_id ||
          !body.test_date
        ) {
          return json(
            {
              ok: false,
              error:
                'academy_player_id and test_date are required'
            },
            400
          );
        }

        const payload =
          pickFields(
            body,
            [
              'academy_player_id',
              'test_date',
              'body_weight_kg',
              'body_fat_percent',
              'sprint_10m_seconds',
              'sprint_30m_seconds',
              'cmj_cm',
              'aerobic_value',
              'readiness',
              'notes'
            ]
          );

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from(
              'academy_sport_science_tests'
            )
            .insert(payload)
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json(
          {
            ok: true,
            test: data
          },
          201
        );
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Sport science test creation failed'
          },
          401
        );
      }
    }


    if (
      request.method === 'POST' &&
      url.pathname ===
        '/academy/ideals'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<
            Record<string, unknown>
          >();

        if (
          !body.academy_player_id ||
          !body.period_label
        ) {
          return json(
            {
              ok: false,
              error:
                'academy_player_id and period_label are required'
            },
            400
          );
        }

        const scores =
          Array.isArray(body.scores)
            ? body.scores as Array<
                Record<string, unknown>
              >
            : [];

        const supabase =
          createSupabase(env);

        const assessmentPayload =
          pickFields(
            body,
            [
              'academy_player_id',
              'period_label',
              'assessment_date',
              'player_role'
            ]
          );

        const {
          data: assessment,
          error: assessmentError
        } =
          await supabase
            .from(
              'academy_ideal_assessments'
            )
            .insert(
              assessmentPayload
            )
            .select('*')
            .single();

        if (assessmentError) {
          return json(
            {
              ok: false,
              error:
                assessmentError.message
            },
            500
          );
        }

        const scoreRows =
          scores
            .filter(
              score =>
                typeof score.ideal_code ===
                  'string' &&
                String(
                  score.ideal_code
                ).trim()
            )
            .map(score => ({
              assessment_id:
                assessment.id,
              ideal_code:
                String(
                  score.ideal_code
                ).trim(),
              status_quo:
                score.status_quo ?? null,
              potential:
                score.potential ?? null,
              notes:
                score.notes ?? null,
              measured_value:
                score.measured_value ??
                null,
              rating:
                score.rating ?? null,
              detail_ratings:
                score.detail_ratings ??
                {}
            }));

        if (
          scoreRows.length > 0
        ) {
          const {
            error: scoresError
          } =
            await supabase
              .from(
                'academy_ideal_scores'
              )
              .insert(scoreRows);

          if (scoresError) {
            await supabase
              .from(
                'academy_ideal_assessments'
              )
              .delete()
              .eq(
                'id',
                assessment.id
              );

            return json(
              {
                ok: false,
                error:
                  scoresError.message
              },
              500
            );
          }
        }

        return json(
          {
            ok: true,
            assessment
          },
          201
        );
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Ideal assessment creation failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'PUT' &&
      url.pathname.startsWith(
        '/academy/ideals/'
      )
    ) {
      try {
        await authenticate(request);

        const assessmentId =
          url.pathname
            .substring(
              '/academy/ideals/'.length
            )
            .trim();

        if (!assessmentId) {
          return json(
            {
              ok: false,
              error:
                'assessment id is required'
            },
            400
          );
        }

        const body =
          await request.json<
            Record<string, unknown>
          >();

        const scores =
          Array.isArray(body.scores)
            ? body.scores as Array<
                Record<string, unknown>
              >
            : [];

        const supabase =
          createSupabase(env);

        const assessmentUpdate =
          pickFields(
            body,
            [
              'period_label',
              'assessment_date',
              'player_role'
            ]
          );

        assessmentUpdate.updated_at =
          new Date().toISOString();

        const {
          data: assessment,
          error: updateError
        } =
          await supabase
            .from(
              'academy_ideal_assessments'
            )
            .update(
              assessmentUpdate
            )
            .eq(
              'id',
              assessmentId
            )
            .select('*')
            .single();

        if (updateError) {
          return json(
            {
              ok: false,
              error:
                updateError.message
            },
            500
          );
        }

        const {
          error: deleteScoresError
        } =
          await supabase
            .from(
              'academy_ideal_scores'
            )
            .delete()
            .eq(
              'assessment_id',
              assessmentId
            );

        if (deleteScoresError) {
          return json(
            {
              ok: false,
              error:
                deleteScoresError.message
            },
            500
          );
        }

        const scoreRows =
          scores
            .filter(
              score =>
                typeof score.ideal_code ===
                  'string' &&
                String(
                  score.ideal_code
                ).trim()
            )
            .map(score => ({
              assessment_id:
                Number(assessmentId),
              ideal_code:
                String(
                  score.ideal_code
                ).trim(),
              status_quo:
                score.status_quo ?? null,
              potential:
                score.potential ?? null,
              notes:
                score.notes ?? null,
              measured_value:
                score.measured_value ??
                null,
              rating:
                score.rating ?? null,
              detail_ratings:
                score.detail_ratings ??
                {}
            }));

        if (
          scoreRows.length > 0
        ) {
          const {
            error: scoresError
          } =
            await supabase
              .from(
                'academy_ideal_scores'
              )
              .insert(scoreRows);

          if (scoresError) {
            return json(
              {
                ok: false,
                error:
                  scoresError.message
              },
              500
            );
          }
        }

        return json({
          ok: true,
          assessment
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Ideal assessment update failed'
          },
          401
        );
      }
    }


    if (
      request.method === 'POST' &&
      url.pathname ===
        '/academy/skill-ac'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<
            Record<string, unknown>
          >();

        if (!body.academy_player_id) {
          return json(
            {
              ok: false,
              error:
                'academy_player_id is required'
            },
            400
          );
        }

        const payload =
          pickFields(
            body,
            [
              'academy_player_id',
              'period_old',
              'period_new',
              'team_old',
              'team_new',
              'author_old',
              'author_new',
              'skill_old',
              'ac_old',
              'consequence_general',
              'skill_new',
              'ac_new',
              'reflection',
              'biggest_changes'
            ]
          );

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from(
              'academy_skill_ac_forms'
            )
            .insert(payload)
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json(
          {
            ok: true,
            form: data
          },
          201
        );
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Skill/AC creation failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'PUT' &&
      url.pathname.startsWith(
        '/academy/skill-ac/'
      )
    ) {
      try {
        await authenticate(request);

        const formId =
          url.pathname
            .substring(
              '/academy/skill-ac/'.length
            )
            .trim();

        if (!formId) {
          return json(
            {
              ok: false,
              error:
                'Skill/AC form id is required'
            },
            400
          );
        }

        const body =
          await request.json<
            Record<string, unknown>
          >();

        const updateData =
          pickFields(
            body,
            [
              'period_old',
              'period_new',
              'team_old',
              'team_new',
              'author_old',
              'author_new',
              'skill_old',
              'ac_old',
              'consequence_general',
              'skill_new',
              'ac_new',
              'reflection',
              'biggest_changes'
            ]
          );

        updateData.updated_at =
          new Date().toISOString();

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from(
              'academy_skill_ac_forms'
            )
            .update(updateData)
            .eq(
              'id',
              formId
            )
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error:
                error.message
            },
            500
          );
        }

        return json({
          ok: true,
          form: data
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Skill/AC update failed'
          },
          401
        );
      }
    }

    return json(
      {
        ok: false,
        error:
          'Not found'
      },
      404
    );
  }
};
