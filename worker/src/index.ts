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


function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function transfermarktNameFromUrl(url: URL) {
  const first =
    url.pathname
      .split('/')
      .filter(Boolean)[0] ?? '';

  return first
    .split('-')
    .filter(Boolean)
    .map(part =>
      part.charAt(0).toUpperCase() +
      part.slice(1)
    )
    .join(' ');
}

function metaContent(
  html: string,
  property: string
) {
  const escaped =
    property.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

  const patternA =
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      'i'
    );

  const patternB =
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      'i'
    );

  return decodeHtml(
    patternA.exec(html)?.[1] ??
    patternB.exec(html)?.[1] ??
    ''
  ).trim();
}

function cleanTransfermarktTitle(
  value: string
) {
  return value
    .replace(
      /\s*-\s*(spielerprofil|player profile).*$/i,
      ''
    )
    .replace(
      /\s*\|\s*Transfermarkt.*$/i,
      ''
    )
    .trim();
}


function stripHtml(
  value: string
) {
  return decodeHtml(
    value
      .replace(
        /<br\s*\/?>/gi,
        ' '
      )
      .replace(
        /<[^>]+>/g,
        ' '
      )
      .replace(
        /\s+/g,
        ' '
      )
  ).trim();
}

function transfermarktInfoValue(
  html: string,
  labels: string[]
) {
  for (
    const label
    of labels
  ) {
    const escaped =
      label.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );

    const patterns = [
      new RegExp(
        `<span[^>]*class=["'][^"']*info-table__content[^"']*["'][^>]*>\\s*${escaped}\\s*<\\/span>[\\s\\S]{0,500}?<span[^>]*class=["'][^"']*info-table__content--bold[^"']*["'][^>]*>([\\s\\S]*?)<\\/span>`,
        'i'
      ),
      new RegExp(
        `${escaped}[\\s\\S]{0,450}?<span[^>]*class=["'][^"']*info-table__content--bold[^"']*["'][^>]*>([\\s\\S]*?)<\\/span>`,
        'i'
      ),
      new RegExp(
        `${escaped}[\\s\\S]{0,300}?<[^>]+>([^<>]{1,120})<\\/[^>]+>`,
        'i'
      )
    ];

    for (
      const pattern
      of patterns
    ) {
      const match =
        pattern.exec(html);

      if (
        match?.[1]
      ) {
        const value =
          stripHtml(
            match[1]
          );

        if (value) {
          return value;
        }
      }
    }
  }

  return '';
}

function transfermarktNationality(
  html: string
) {
  const value =
    transfermarktInfoValue(
      html,
      [
        'Nationalität:',
        'Citizenship:'
      ]
    );

  if (value) {
    return value
      .replace(
        /\s+/g,
        ' '
      )
      .trim();
  }

  const labelIndex =
    html.search(
      /Nationalität:|Citizenship:/i
    );

  if (
    labelIndex >= 0
  ) {
    const segment =
      html.slice(
        labelIndex,
        labelIndex + 1200
      );

    const flag =
      /(?:title|alt)=["']([^"']+)["']/i
        .exec(
          segment
        )?.[1];

    if (flag) {
      return decodeHtml(
        flag
      ).trim();
    }
  }

  return '';
}

function transfermarktHeightCm(
  value: string
) {
  const normalized =
    value
      .replace(',', '.')
      .replace(/\s+/g, ' ')
      .trim();

  const meter =
    normalized.match(
      /(\d(?:\.\d{1,2})?)\s*m\b/i
    );

  if (meter) {
    const cm =
      Math.round(
        Number(
          meter[1]
        ) *
        100
      );

    return Number.isFinite(cm)
      ? cm
      : null;
  }

  const cm =
    normalized.match(
      /(\d{3})\s*cm\b/i
    );

  if (cm) {
    return Number(
      cm[1]
    );
  }

  return null;
}

function transfermarktMarketValue(
  html: string
) {
  const direct =
    transfermarktInfoValue(
      html,
      [
        'Marktwert:',
        'Current market value:'
      ]
    );

  if (direct) {
    return direct;
  }

  const patterns = [
    /class=["'][^"']*data-header__market-value-wrapper[^"']*["'][^>]*>([\s\S]{0,400}?)<\/div>/i,
    /class=["'][^"']*data-header__market-value-wrapper[^"']*["'][^>]*>([\s\S]{0,400}?)<\/a>/i,
    /(?:Marktwert|market value)[\s\S]{0,120}?((?:€|EUR)\s*[\d.,]+\s*(?:Mio\.|M|Tsd\.|k)?)/i
  ];

  for (
    const pattern
    of patterns
  ) {
    const match =
      pattern.exec(html);

    if (
      match?.[1]
    ) {
      const value =
        stripHtml(
          match[1]
        );

      if (value) {
        return value;
      }
    }
  }

  return '';
}

function transfermarktBirthDate(
  value: string
) {
  const date =
    value.match(
      /(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/
    );

  if (!date) {
    return null;
  }

  return `${date[3]}-${date[2].padStart(2, '0')}-${date[1].padStart(2, '0')}`;
}

function transfermarktContractDate(
  value: string
) {
  return transfermarktBirthDate(
    value
  );
}

function transfermarktFullName(
  html: string,
  url: URL
) {
  const firstName =
    transfermarktInfoValue(
      html,
      [
        'Vorname:',
        'First name:'
      ]
    );

  const lastName =
    transfermarktInfoValue(
      html,
      [
        'Nachname:',
        'Last name:'
      ]
    );

  if (
    firstName &&
    lastName
  ) {
    return `${firstName} ${lastName}`
      .replace(
        /\s+/g,
        ' '
      )
      .trim();
  }

  const headline =
    /<h1[^>]*class=["'][^"']*data-header__headline-wrapper[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i
      .exec(
        html
      )?.[1];

  if (headline) {
    const clean =
      stripHtml(
        headline
      )
        .replace(
          /^\s*#?\d+\s*/,
          ''
        )
        .trim();

    if (clean) {
      return clean;
    }
  }

  const ogTitle =
    metaContent(
      html,
      'og:title'
    );

  const title =
    /<title[^>]*>([\s\S]*?)<\/title>/i
      .exec(
        html
      )?.[1] ??
    '';

  return cleanTransfermarktTitle(
    ogTitle ||
    decodeHtml(
      title
    ) ||
    transfermarktNameFromUrl(
      url
    )
  );
}


function transfermarktProfileData(
  html: string,
  url: URL
) {
  const name =
    transfermarktFullName(
      html,
      url
    );

  const birthRaw =
    transfermarktInfoValue(
      html,
      [
        'Geburtsdatum/Alter:',
        'Date of birth/Age:'
      ]
    );

  const position =
    transfermarktInfoValue(
      html,
      [
        'Position:',
        'Position:'
      ]
    );

  const foot =
    transfermarktInfoValue(
      html,
      [
        'Fuß:',
        'Foot:'
      ]
    );

  const heightRaw =
    transfermarktInfoValue(
      html,
      [
        'Größe:',
        'Height:'
      ]
    );

  const contractRaw =
    transfermarktInfoValue(
      html,
      [
        'Vertrag bis:',
        'Contract expires:'
      ]
    );

  const agent =
    transfermarktInfoValue(
      html,
      [
        'Berater:',
        'Player agent:'
      ]
    );

  const club =
    transfermarktInfoValue(
      html,
      [
        'Aktueller Verein:',
        'Current club:'
      ]
    );

  const image =
    metaContent(
      html,
      'og:image'
    );

  return {
    name:
      name || null,
    birth_date:
      transfermarktBirthDate(
        birthRaw
      ),
    primary_position:
      position || null,
    preferred_foot:
      foot || null,
    nationality:
      transfermarktNationality(
        html
      ) || null,
    height_cm:
      transfermarktHeightCm(
        heightRaw
      ),
    current_club:
      club || null,
    contract_until:
      transfermarktContractDate(
        contractRaw
      ),
    agent_agency:
      agent || null,
    market_value:
      transfermarktMarketValue(
        html
      ) || null,
    image_path:
      image || null
  };
}


function transfermarktCandidateUrls(
  html: string,
  baseUrl: URL
) {
  const urls:
    string[] = [];

  const seen =
    new Set<string>();

  const patterns = [
    /href=["']([^"']*\/profil\/spieler\/\d+[^"']*)["']/gi,
    /href=["']([^"']*\/spieler\/\d+[^"']*)["']/gi
  ];

  for (
    const pattern
    of patterns
  ) {
    let match:
      RegExpExecArray |
      null;

    while (
      (
        match =
          pattern.exec(
            html
          )
      )
    ) {
      try {
        const raw =
          decodeHtml(
            match[1]
          );

        const candidate =
          new URL(
            raw,
            baseUrl
          );

        if (
          !/(^|\.)transfermarkt\./i.test(
            candidate.hostname
          )
        ) {
          continue;
        }

        const playerId =
          transfermarktPlayerId(
            candidate.toString()
          );

        if (
          !playerId ||
          seen.has(
            playerId
          )
        ) {
          continue;
        }

        seen.add(
          playerId
        );

        urls.push(
          candidate.toString()
        );

        if (
          urls.length >= 8
        ) {
          return urls;
        }
      } catch {
        // Ignore malformed search result links.
      }
    }
  }

  return urls;
}

function normalizeIdentityText(
  value: unknown
) {
  return String(
    value ?? ''
  )
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLocaleLowerCase(
      'de'
    )
    .replace(
      /[^a-z0-9]+/g,
      ' '
    )
    .trim()
    .replace(
      /\s+/g,
      ' '
    );
}

function nationalityTokens(
  value: unknown
) {
  const normalized =
    normalizeIdentityText(
      value
    );

  if (!normalized) {
    return [];
  }

  return Array.from(
    new Set(
      normalized
        .split(
          /\s*(?:,|\/|\||;|\+| und | and )\s*/i
        )
        .map(
          item =>
            item.trim()
        )
        .filter(Boolean)
    )
  );
}

function nationalitiesCompatible(
  left: unknown,
  right: unknown
) {
  const a =
    nationalityTokens(
      left
    );

  const b =
    nationalityTokens(
      right
    );

  if (
    a.length === 0 ||
    b.length === 0
  ) {
    return true;
  }

  return a.some(
    leftValue =>
      b.some(
        rightValue =>
          leftValue ===
            rightValue ||
          leftValue.includes(
            rightValue
          ) ||
          rightValue.includes(
            leftValue
          )
      )
  );
}


function transfermarktIdentityMatch(
  player:
    Record<
      string,
      unknown
    >,
  candidate:
    Record<
      string,
      unknown
    >
) {
  const playerName =
    normalizePlayerName(
      player.name
    );

  const candidateName =
    normalizePlayerName(
      candidate.name
    );

  const playerBirthDate =
    normalizeNullableDate(
      player.birth_date
    );

  const candidateBirthDate =
    normalizeNullableDate(
      candidate.birth_date
    );

  if (
    !playerName ||
    !candidateName ||
    playerName !==
      candidateName
  ) {
    return {
      ok: false,
      reason:
        'Name stimmt nicht überein.'
    };
  }

  if (
    !playerBirthDate
  ) {
    return {
      ok: false,
      reason:
        'Im VikingVision-Spieler fehlt das Geburtsdatum.'
    };
  }

  if (
    !candidateBirthDate ||
    playerBirthDate !==
      candidateBirthDate
  ) {
    return {
      ok: false,
      reason:
        'Geburtsdatum stimmt nicht überein.'
    };
  }

  const playerNationality =
    player.nationality;

  const candidateNationality =
    candidate.nationality;

  if (
    playerNationality &&
    candidateNationality &&
    !nationalitiesCompatible(
      playerNationality,
      candidateNationality
    )
  ) {
    return {
      ok: false,
      reason:
        'Nationalität stimmt nicht überein.'
    };
  }

  return {
    ok: true,
    reason:
      playerNationality &&
      candidateNationality
        ? 'Name, Geburtsdatum und Nationalität stimmen überein.'
        : 'Name und Geburtsdatum stimmen überein.'
  };
}

async function fetchTransfermarktProfile(
  profileUrl: string
) {
  const tmUrl =
    new URL(
      profileUrl
    );

  const response =
    await fetch(
      tmUrl.toString(),
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36',
          'Accept-Language':
            'de-DE,de;q=0.9,en;q=0.8',
          Accept:
            'text/html,application/xhtml+xml'
        },
        redirect:
          'follow'
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Transfermarkt konnte nicht geladen werden (${response.status}).`
    );
  }

  const html =
    await response.text();

  if (
    html.length < 1000
  ) {
    throw new Error(
      'Transfermarkt hat keine verwertbare Profilseite geliefert.'
    );
  }

  return {
    url:
      tmUrl,
    html,
    data:
      transfermarktProfileData(
        html,
        tmUrl
      )
  };
}

function normalizeNullableDate(
  value: unknown
) {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return null;
  }

  const text =
    value.trim();

  const iso =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (iso) {
    return text;
  }

  const de =
    text.match(
      /^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/
    );

  if (de) {
    return `${de[3]}-${de[2].padStart(2, '0')}-${de[1].padStart(2, '0')}`;
  }

  return null;
}


function normalizeStoragePath(
  imagePath: string
) {
  const raw =
    imagePath
      .trim()
      .replace(/\\/g, '/');

  const storageMatch =
    raw.match(
      /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?#]+)\/([^?#]+)/
    );

  if (storageMatch) {
    return {
      bucket:
        decodeURIComponent(
          storageMatch[1]
        ),
      path:
        decodeURIComponent(
          storageMatch[2]
        )
    };
  }

  const stripped =
    raw
      .replace(/^\/+/, '')
      .replace(
        /^uploads\/spielerbilder\//i,
        ''
      )
      .replace(
        /^spielerbilder\//i,
        ''
      );

  return {
    bucket: null,
    path: stripped
  };
}

function imageContentType(
  path: string
) {
  const lower =
    path.toLowerCase();

  if (
    lower.endsWith('.png')
  ) {
    return 'image/png';
  }

  if (
    lower.endsWith('.webp')
  ) {
    return 'image/webp';
  }

  if (
    lower.endsWith('.gif')
  ) {
    return 'image/gif';
  }

  if (
    lower.endsWith('.svg')
  ) {
    return 'image/svg+xml';
  }

  return 'image/jpeg';
}


function normalizePlayerName(
  value: unknown
) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('de')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function transfermarktPlayerId(
  value: unknown
) {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return null;
  }

  try {
    const parsed =
      new URL(value.trim());

    const match =
      parsed.pathname.match(
        /\/spieler\/(\d+)(?:\/|$)/i
      );

    return match?.[1] ?? null;
  } catch {
    const match =
      value.match(
        /\/spieler\/(\d+)(?:\/|$)/i
      );

    return match?.[1] ?? null;
  }
}

function duplicateReason(
  candidate: Record<string, unknown>,
  existing:
    Array<Record<string, unknown>>
) {
  const tmId =
    transfermarktPlayerId(
      candidate.transfermarkt_url
    );

  if (tmId) {
    const duplicate =
      existing.find(
        player =>
          transfermarktPlayerId(
            player.transfermarkt_url
          ) === tmId
      );

    if (duplicate) {
      return {
        player: duplicate,
        reason:
          'Transfermarkt-Profil bereits vorhanden'
      };
    }
  }

  const name =
    normalizePlayerName(
      candidate.name
    );

  const birthDate =
    normalizeNullableDate(
      candidate.birth_date
    );

  if (
    name &&
    birthDate
  ) {
    const duplicate =
      existing.find(
        player =>
          normalizePlayerName(
            player.name
          ) === name &&
          normalizeNullableDate(
            player.birth_date
          ) === birthDate
      );

    if (duplicate) {
      return {
        player: duplicate,
        reason:
          'Name und Geburtsdatum bereits vorhanden'
      };
    }
  }

  return null;
}


function academyDuplicateReason(
  candidate: Record<string, unknown>,
  academyPlayers:
    Array<Record<string, unknown>>
) {
  const name =
    normalizePlayerName(
      candidate.name
    );

  if (!name) {
    return null;
  }

  const birthDate =
    normalizeNullableDate(
      candidate.birth_date
    );

  if (birthDate) {
    const duplicate =
      academyPlayers.find(
        player =>
          normalizePlayerName(
            player.name
          ) === name &&
          normalizeNullableDate(
            player.birth_date
          ) === birthDate
      );

    if (duplicate) {
      return {
        player: duplicate,
        reason:
          'Name und Geburtsdatum bereits in AKAVision vorhanden'
      };
    }
  }

  const currentClub =
    normalizePlayerName(
      candidate.current_club
    );

  if (currentClub) {
    const duplicate =
      academyPlayers.find(
        player =>
          normalizePlayerName(
            player.name
          ) === name &&
          normalizePlayerName(
            player.current_club
          ) === currentClub
      );

    if (duplicate) {
      return {
        player: duplicate,
        reason:
          'Name und Verein bereits in AKAVision vorhanden'
      };
    }
  }

  return null;
}

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
      /^\/public\/p12\/self\/[^/]+$/.test(
        url.pathname
      )
    ) {
      try {
        const token =
          decodeURIComponent(
            url.pathname
              .split('/')
              .pop() ??
            ''
          );

        const supabase =
          createSupabase(env);

        const {
          data: invite,
          error
        } =
          await supabase
            .from(
              'p12_self_assessment_invites'
            )
            .select(
              'id,token,p12_player_id,period_label,expires_at,used_at,active,player:p12_players(name)'
            )
            .eq(
              'token',
              token
            )
            .eq(
              'active',
              true
            )
            .maybeSingle();

        if (
          error ||
          !invite
        ) {
          return json(
            {
              ok: false,
              error:
                'Dieser P12-Link ist nicht gültig.'
            },
            404
          );
        }

        if (
          invite.used_at
        ) {
          return json(
            {
              ok: false,
              error:
                'Diese Selbsteinschätzung wurde bereits abgegeben.'
            },
            410
          );
        }

        if (
          invite.expires_at &&
          new Date(
            invite.expires_at
          ).getTime() <
            Date.now()
        ) {
          return json(
            {
              ok: false,
              error:
                'Dieser P12-Link ist abgelaufen.'
            },
            410
          );
        }

        const playerName =
          Array.isArray(
            invite.player
          )
            ? invite.player[0]?.name
            : (
                invite.player as
                  | {
                      name?: string;
                    }
                  | null
              )?.name;

        return json({
          ok: true,
          invite: {
            player_name:
              playerName ??
              'P12-Spieler',
            period_label:
              invite.period_label,
            expires_at:
              invite.expires_at
          }
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'P12 invite failed'
          },
          500
        );
      }
    }

    if (
      request.method === 'POST' &&
      /^\/public\/p12\/self\/[^/]+$/.test(
        url.pathname
      )
    ) {
      try {
        const token =
          decodeURIComponent(
            url.pathname
              .split('/')
              .pop() ??
            ''
          );

        const body =
          await request.json<{
            strengths?: string;
            development_areas?: string;
            personal_goals?: string;
            notes?: string;
            scores?: Array<{
              category?: string;
              detail?: string;
              rating?: number;
            }>;
          }>();

        const supabase =
          createSupabase(env);

        const {
          data: invite,
          error: inviteError
        } =
          await supabase
            .from(
              'p12_self_assessment_invites'
            )
            .select('*')
            .eq(
              'token',
              token
            )
            .eq(
              'active',
              true
            )
            .maybeSingle();

        if (
          inviteError ||
          !invite
        ) {
          return json(
            {
              ok: false,
              error:
                'Dieser P12-Link ist nicht gültig.'
            },
            404
          );
        }

        if (
          invite.used_at
        ) {
          return json(
            {
              ok: false,
              error:
                'Diese Selbsteinschätzung wurde bereits abgegeben.'
            },
            410
          );
        }

        if (
          invite.expires_at &&
          new Date(
            invite.expires_at
          ).getTime() <
            Date.now()
        ) {
          return json(
            {
              ok: false,
              error:
                'Dieser P12-Link ist abgelaufen.'
            },
            410
          );
        }

        const {
          data: assessment,
          error: assessmentError
        } =
          await supabase
            .from(
              'p12_self_assessments'
            )
            .insert({
              p12_player_id:
                invite.p12_player_id,
              period_label:
                invite.period_label,
              assessment_date:
                new Date()
                  .toISOString()
                  .slice(0, 10),
              strengths:
                body.strengths ??
                null,
              development_areas:
                body.development_areas ??
                null,
              personal_goals:
                body.personal_goals ??
                null,
              notes:
                body.notes ??
                null,
              submitted_at:
                new Date()
                  .toISOString()
            })
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
          (body.scores ?? [])
            .filter(
              score =>
                score.category &&
                score.detail
            )
            .map(
              score => ({
                assessment_id:
                  assessment.id,
                category:
                  score.category,
                detail:
                  score.detail,
                rating:
                  typeof score.rating ===
                    'number'
                    ? score.rating
                    : 0
              })
            );

        if (
          scoreRows.length > 0
        ) {
          const {
            error: scoreError
          } =
            await supabase
              .from(
                'p12_self_scores'
              )
              .insert(
                scoreRows
              );

          if (scoreError) {
            return json(
              {
                ok: false,
                error:
                  scoreError.message
              },
              500
            );
          }
        }

        const {
          error: usedError
        } =
          await supabase
            .from(
              'p12_self_assessment_invites'
            )
            .update({
              used_at:
                new Date()
                  .toISOString(),
              active: false
            })
            .eq(
              'id',
              invite.id
            );

        if (usedError) {
          return json(
            {
              ok: false,
              error:
                usedError.message
            },
            500
          );
        }

        return json({
          ok: true,
          assessment_id:
            assessment.id
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'P12 self assessment failed'
          },
          500
        );
      }
    }

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
            .is(
              'archived_at',
              null
            )
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
      request.method === 'GET' &&
      /^\/players\/[^/]+\/image$/.test(
        url.pathname
      )
    ) {
      try {
        await authenticate(request);

        const playerId =
          url.pathname
            .split('/')[2];

        const supabase =
          createSupabase(env);

        const {
          data: player,
          error: playerError
        } =
          await supabase
            .from('players')
            .select(
              'id,image_path'
            )
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
            404
          );
        }

        const imagePath =
          typeof player?.image_path ===
            'string'
            ? player.image_path.trim()
            : '';

        if (!imagePath) {
          return json(
            {
              ok: false,
              error:
                'Player has no image_path'
            },
            404
          );
        }

        // For external URLs, proxy the image through the Worker.
        if (
          /^https?:\/\//i.test(
            imagePath
          ) &&
          !imagePath.includes(
            '/storage/v1/object/'
          )
        ) {
          const remote =
            await fetch(
              imagePath,
              {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0'
                }
              }
            );

          if (remote.ok) {
            const headers =
              new Headers(
                corsHeaders
              );

            headers.set(
              'Content-Type',
              remote.headers.get(
                'Content-Type'
              ) ??
              imageContentType(
                imagePath
              )
            );

            headers.set(
              'Cache-Control',
              'private, max-age=3600'
            );

            return new Response(
              remote.body,
              {
                status: 200,
                headers
              }
            );
          }
        }

        const normalized =
          normalizeStoragePath(
            imagePath
          );

        const fileName =
          normalized.path
            .split('/')
            .filter(Boolean)
            .pop() ??
          normalized.path;

        const buckets =
          normalized.bucket
            ? [
                normalized.bucket
              ]
            : [
                'spielerbilder',
                'player-images',
                'uploads'
              ];

        const paths =
          Array.from(
            new Set(
              [
                normalized.path,
                fileName,
                `spielerbilder/${fileName}`
              ].filter(Boolean)
            )
          );

        const attempts:
          string[] = [];

        for (
          const bucket
          of buckets
        ) {
          for (
            const path
            of paths
          ) {
            attempts.push(
              `${bucket}/${path}`
            );

            const {
              data,
              error
            } =
              await supabase
                .storage
                .from(bucket)
                .download(path);

            if (
              !error &&
              data
            ) {
              const headers =
                new Headers(
                  corsHeaders
                );

              headers.set(
                'Content-Type',
                data.type ||
                imageContentType(
                  path
                )
              );

              headers.set(
                'Cache-Control',
                'private, max-age=3600'
              );

              return new Response(
                data,
                {
                  status: 200,
                  headers
                }
              );
            }
          }
        }

        return json(
          {
            ok: false,
            error:
              'Player image not found in Supabase Storage.',
            image_path:
              imagePath,
            attempts
          },
          404
        );
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Player image request failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/players'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<
            Record<string, unknown>
          >();

        if (
          typeof body.name !== 'string' ||
          !body.name.trim()
        ) {
          return json(
            {
              ok: false,
              error: 'name is required'
            },
            400
          );
        }

        const payload =
          pickFields(
            body,
            [
              'name',
              'birth_date',
              'birth_year',
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
              'video_url',
              'is_own_squad',
              'jersey_number',
              'player_role',
              'league',
              'scouting_role_1',
              'scouting_role_2',
              'scouting_role_3'
            ]
          );

        payload.name =
          String(payload.name).trim();

        payload.birth_date =
          normalizeNullableDate(
            payload.birth_date
          );

        if (
          payload.birth_date &&
          !payload.birth_year
        ) {
          const year =
            Number(
              String(
                payload.birth_date
              ).slice(0, 4)
            );

          if (
            Number.isFinite(year)
          ) {
            payload.birth_year =
              year;
          }
        }

        const supabase =
          createSupabase(env);

        const {
          data: existingPlayers,
          error: existingError
        } =
          await supabase
            .from('players')
            .select(
              'id,name,birth_date,transfermarkt_url,is_own_squad,archived_at'
            );

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

        const duplicate =
          duplicateReason(
            payload,
            (existingPlayers ??
              []) as Array<
                Record<
                  string,
                  unknown
                >
              >
          );

        if (duplicate) {
          return json(
            {
              ok: false,
              duplicate: true,
              reason:
                duplicate.reason,
              player:
                duplicate.player,
              error:
                `Dublettenverdacht: ${duplicate.reason}`
            },
            409
          );
        }

        const {
          data,
          error
        } =
          await supabase
            .from('players')
            .insert(payload)
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error: error.message
            },
            500
          );
        }

        return json(
          {
            ok: true,
            player: data
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
                : 'Player creation failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'POST' &&
      url.pathname ===
        '/players/import-transfermarkt'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<
            Record<string, unknown>
          >();

        if (
          typeof body.url !== 'string' ||
          !body.url.trim()
        ) {
          return json(
            {
              ok: false,
              error:
                'Transfermarkt URL is required'
            },
            400
          );
        }

        const tmUrl =
          new URL(body.url.trim());

        if (
          !/(^|\.)transfermarkt\./i.test(
            tmUrl.hostname
          )
        ) {
          return json(
            {
              ok: false,
              error:
                'Bitte einen gültigen Transfermarkt-Link verwenden.'
            },
            400
          );
        }

        let html = '';
        let scraped = false;

        try {
          const tmResponse =
            await fetch(
              tmUrl.toString(),
              {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36',
                  'Accept-Language':
                    'de-DE,de;q=0.9,en;q=0.8'
                },
                redirect: 'follow'
              }
            );

          if (tmResponse.ok) {
            html =
              await tmResponse.text();
            scraped = true;
          }
        } catch {
          scraped = false;
        }

        const ogTitle =
          metaContent(
            html,
            'og:title'
          );

        const title =
          /<title[^>]*>([\s\S]*?)<\/title>/i
            .exec(html)?.[1] ?? '';

        const name =
          cleanTransfermarktTitle(
            ogTitle ||
            decodeHtml(title) ||
            transfermarktNameFromUrl(
              tmUrl
            )
          );

        if (!name) {
          return json(
            {
              ok: false,
              error:
                'Spielername konnte aus dem Transfermarkt-Link nicht ermittelt werden.'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          data: existingPlayers,
          error: existingError
        } =
          await supabase
            .from('players')
            .select(
              'id,name,birth_date,transfermarkt_url,is_own_squad,archived_at'
            );

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

        const duplicate =
          duplicateReason(
            {
              name,
              transfermarkt_url:
                tmUrl.toString()
            },
            (existingPlayers ??
              []) as Array<
                Record<
                  string,
                  unknown
                >
              >
          );

        if (duplicate) {
          return json({
            ok: true,
            player:
              duplicate.player,
            duplicate: true,
            existing: true,
            reason:
              duplicate.reason,
            scraped
          });
        }

        const payload = {
          name,
          transfermarkt_url:
            tmUrl.toString(),
          is_own_squad:
            body.is_own_squad === true,
          current_club:
            null as string | null,
          primary_position:
            null as string | null
        };

        const {
          data,
          error
        } =
          await supabase
            .from('players')
            .insert(payload)
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error: error.message
            },
            500
          );
        }

        return json(
          {
            ok: true,
            player: data,
            scraped
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
                : 'Transfermarkt import failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'POST' &&
      url.pathname ===
        '/players/import-bulk'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<{
            players?: Array<
              Record<string, unknown>
            >;
          }>();

        if (
          !Array.isArray(
            body.players
          ) ||
          body.players.length === 0
        ) {
          return json(
            {
              ok: false,
              error:
                'players array is required'
            },
            400
          );
        }

        if (
          body.players.length > 2000
        ) {
          return json(
            {
              ok: false,
              error:
                'Maximal 2000 Spieler pro Import.'
            },
            400
          );
        }

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
          'video_url',
          'is_own_squad',
          'jersey_number',
          'player_role',
          'league',
          'scouting_role_1',
          'scouting_role_2',
          'scouting_role_3'
        ];

        const supabase =
          createSupabase(env);

        const [
          currentPlayersResult,
          academyPlayersResult
        ] =
          await Promise.all([
            supabase
              .from('players')
              .select(
                'id,name,birth_date,current_club,transfermarkt_url,is_own_squad,archived_at'
              ),
            supabase
              .from(
                'academy_players'
              )
              .select(
                'id,name,birth_date,current_club,team,squad_status'
              )
          ]);

        if (
          currentPlayersResult.error
        ) {
          return json(
            {
              ok: false,
              error:
                currentPlayersResult.error.message
            },
            500
          );
        }

        if (
          academyPlayersResult.error
        ) {
          return json(
            {
              ok: false,
              error:
                academyPlayersResult.error.message
            },
            500
          );
        }

        const currentPlayers =
          currentPlayersResult.data ??
          [];

        const academyPlayers =
          academyPlayersResult.data ??
          [];

        const knownPlayers =
          [
            ...(currentPlayers ??
              [])
          ] as Array<
            Record<
              string,
              unknown
            >
          >;

        const insertRows:
          Array<
            Record<
              string,
              unknown
            >
          > = [];

        const duplicates:
          Array<
            Record<
              string,
              unknown
            >
          > = [];

        const skipped:
          Array<
            Record<
              string,
              unknown
            >
          > = [];

        const academyConflicts:
          Array<
            Record<
              string,
              unknown
            >
          > = [];

        for (
          let index = 0;
          index <
          body.players.length;
          index += 1
        ) {
          const raw =
            body.players[index];

          const payload =
            pickFields(
              raw,
              allowedFields
            );

          if (
            typeof payload.name !==
              'string' ||
            !payload.name.trim()
          ) {
            skipped.push({
              row: index + 2,
              reason:
                'Name fehlt'
            });
            continue;
          }

          payload.name =
            payload.name.trim();

          payload.birth_date =
            normalizeNullableDate(
              payload.birth_date
            );

          if (
            typeof payload.birth_date ===
              'string'
          ) {
            const year =
              Number(
                payload.birth_date.slice(
                  0,
                  4
                )
              );

            if (
              Number.isFinite(year)
            ) {
              payload.birth_year =
                year;
            }
          }

          const duplicate =
            duplicateReason(
              payload,
              knownPlayers
            );

          if (duplicate) {
            duplicates.push({
              row: index + 2,
              name:
                payload.name,
              reason:
                duplicate.reason,
              source:
                duplicate.player
                  ?.is_own_squad
                  ? 'Unser Kader'
                  : 'VikingVision',
              existing_player:
                duplicate.player
            });
            continue;
          }

          const academyDuplicate =
            academyDuplicateReason(
              payload,
              academyPlayers as Array<
                Record<
                  string,
                  unknown
                >
              >
            );

          if (
            academyDuplicate
          ) {
            academyConflicts.push({
              row: index + 2,
              name:
                payload.name,
              reason:
                academyDuplicate.reason,
              source:
                'AKAVision',
              academy_player:
                academyDuplicate.player,
              candidate:
                payload
            });
            continue;
          }

          insertRows.push(
            payload
          );

          knownPlayers.push(
            payload
          );
        }

        let inserted:
          Array<
            Record<
              string,
              unknown
            >
          > = [];

        if (
          insertRows.length > 0
        ) {
          const chunkSize =
            250;

          for (
            let offset = 0;
            offset <
            insertRows.length;
            offset += chunkSize
          ) {
            const chunk =
              insertRows.slice(
                offset,
                offset + chunkSize
              );

            const {
              data,
              error
            } =
              await supabase
                .from('players')
                .insert(chunk)
                .select('*');

            if (error) {
              return json(
                {
                  ok: false,
                  error:
                    `Import ab Zeile ${offset + 2} fehlgeschlagen: ${error.message}`,
                  inserted_count:
                    inserted.length
                },
                500
              );
            }

            inserted.push(
              ...(
                (data ?? []) as Array<
                  Record<
                    string,
                    unknown
                  >
                >
              )
            );
          }
        }

        return json(
          {
            ok: true,
            count:
              inserted.length,
            new_count:
              inserted.length,
            duplicate_count:
              duplicates.length,
            academy_conflict_count:
              academyConflicts.length,
            skipped_count:
              skipped.length,
            players:
              inserted,
            duplicates,
            academy_conflicts:
              academyConflicts,
            skipped
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
                : 'Bulk import failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'POST' &&
      /^\/players\/[^/]+\/refresh-transfermarkt$/.test(
        url.pathname
      )
    ) {
      try {
        await authenticate(request);

        const playerId =
          url.pathname
            .split('/')[2];

        let requestedUrl = '';

        try {
          const body =
            await request.json<{
              url?: string;
            }>();

          requestedUrl =
            typeof body?.url ===
              'string'
              ? body.url.trim()
              : '';
        } catch {
          // Empty body is valid for the normal refresh flow.
        }

        const supabase =
          createSupabase(env);

        const {
          data: player,
          error: playerError
        } =
          await supabase
            .from('players')
            .select(
              'id,name,birth_date,nationality,transfermarkt_url'
            )
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
            404
          );
        }

        if (
          !player.name ||
          !player.birth_date
        ) {
          return json(
            {
              ok: false,
              error:
                'Für die sichere Transfermarkt-Zuordnung werden Name und Geburtsdatum benötigt.'
            },
            400
          );
        }

        let matchedProfile:
          Awaited<
            ReturnType<
              typeof fetchTransfermarktProfile
            >
          > |
          null = null;

        let matchBasis = '';
        let matchSource =
          'search';

        const directUrl =
          requestedUrl ||
          (
            typeof player.transfermarkt_url ===
              'string'
              ? player.transfermarkt_url.trim()
              : ''
          );

        if (directUrl) {
          let directProfileUrl:
            URL;

          try {
            directProfileUrl =
              new URL(
                directUrl
              );
          } catch {
            return json(
              {
                ok: false,
                error:
                  'Der Transfermarkt-Link ist ungültig.'
              },
              400
            );
          }

          if (
            !/(^|\.)transfermarkt\./i.test(
              directProfileUrl.hostname
            )
          ) {
            return json(
              {
                ok: false,
                error:
                  'Der Link muss auf ein Transfermarkt-Profil verweisen.'
              },
              400
            );
          }

          const directProfile =
            await fetchTransfermarktProfile(
              directProfileUrl.toString()
            );

          const identity =
            transfermarktIdentityMatch(
              player as Record<
                string,
                unknown
              >,
              directProfile.data as Record<
                string,
                unknown
              >
            );

          if (
            !identity.ok
          ) {
            return json(
              {
                ok: false,
                error:
                  `Der Transfermarkt-Link konnte nicht sicher zugeordnet werden: ${identity.reason}`,
                match_error:
                  true
              },
              409
            );
          }

          matchedProfile =
            directProfile;

          matchBasis =
            identity.reason;

          matchSource =
            requestedUrl
              ? 'manual_url'
              : 'stored_url';
        } else {
          const searchUrl =
            new URL(
              'https://www.transfermarkt.de/schnellsuche/ergebnis/schnellsuche'
            );

          searchUrl.searchParams.set(
            'query',
            String(
              player.name
            )
          );

          const searchResponse =
            await fetch(
              searchUrl.toString(),
              {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36',
                  'Accept-Language':
                    'de-DE,de;q=0.9,en;q=0.8',
                  Accept:
                    'text/html,application/xhtml+xml'
                },
                redirect:
                  'follow'
              }
            );

          if (
            !searchResponse.ok
          ) {
            return json(
              {
                ok: false,
                error:
                  `Transfermarkt-Suche konnte nicht geladen werden (${searchResponse.status}).`
              },
              502
            );
          }

          const searchHtml =
            await searchResponse.text();

          const candidateUrls =
            transfermarktCandidateUrls(
              searchHtml,
              searchUrl
            );

          if (
            candidateUrls.length === 0
          ) {
            return json(
              {
                ok: false,
                error:
                  'Kein Transfermarkt-Kandidat für diesen Namen gefunden. Bitte den direkten Transfermarkt-Link im Spielerprofil eintragen.'
              },
              404
            );
          }

          const candidateErrors:
            string[] = [];

          for (
            const candidateUrl
            of candidateUrls
          ) {
            try {
              const candidateProfile =
                await fetchTransfermarktProfile(
                  candidateUrl
                );

              const identity =
                transfermarktIdentityMatch(
                  player as Record<
                    string,
                    unknown
                  >,
                  candidateProfile.data as Record<
                    string,
                    unknown
                  >
                );

              if (
                identity.ok
              ) {
                matchedProfile =
                  candidateProfile;
                matchBasis =
                  identity.reason;
                break;
              }

              candidateErrors.push(
                identity.reason
              );
            } catch (
              candidateError
            ) {
              candidateErrors.push(
                candidateError instanceof
                  Error
                  ? candidateError.message
                  : 'Kandidat konnte nicht geprüft werden.'
              );
            }
          }

          if (
            !matchedProfile
          ) {
            return json(
              {
                ok: false,
                error:
                  'Kein sicher passendes Transfermarkt-Profil gefunden. Bitte den direkten Transfermarkt-Link im Spielerprofil eintragen.',
                checked_candidates:
                  candidateUrls.length,
                candidate_errors:
                  candidateErrors.slice(
                    0,
                    5
                  )
              },
              404
            );
          }
        }

        const updateData:
          Record<
            string,
            unknown
          > = {};

        for (
          const [
            field,
            value
          ]
          of Object.entries(
            matchedProfile.data
          )
        ) {
          if (
            value !== null &&
            value !== '' &&
            value !== undefined
          ) {
            updateData[field] =
              value;
          }
        }

        updateData.transfermarkt_url =
          matchedProfile.url.toString();

        updateData.transfermarkt_updated_at =
          new Date()
            .toISOString();

        updateData.updated_at =
          new Date()
            .toISOString();

        const {
          data,
          error
        } =
          await supabase
            .from('players')
            .update(
              updateData
            )
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
          player: data,
          match_basis:
            matchBasis,
          match_source:
            matchSource,
          discovered:
            matchSource ===
              'search',
          refreshed_fields:
            Object.keys(
              updateData
            ).filter(
              field =>
                ![
                  'updated_at',
                  'transfermarkt_updated_at',
                  'transfermarkt_url'
                ].includes(
                  field
                )
            )
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Transfermarkt refresh failed'
          },
          401
        );
      }
    }


    if (
      request.method === 'PUT' &&
      /^\/players\/[^/]+$/.test(
        url.pathname
      )
    ) {
      try {
        await authenticate(
          request
        );

        const playerId =
          url.pathname
            .split('/')[2];

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
          'video_url',
          'league',
          'scouting_role_1',
          'scouting_role_2',
          'scouting_role_3'
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
      request.method === 'DELETE' &&
      /^\/players\/[^/]+$/.test(
        url.pathname
      )
    ) {
      try {
        await authenticate(request);

        const playerId =
          url.pathname
            .split('/')[2];

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

        const supabase =
          createSupabase(env);

        const {
          data: player,
          error: playerError
        } =
          await supabase
            .from('players')
            .select(
              'id,name,image_path'
            )
            .eq(
              'id',
              playerId
            )
            .maybeSingle();

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

        if (!player) {
          return json(
            {
              ok: false,
              error:
                'Spieler wurde nicht gefunden.'
            },
            404
          );
        }

        const {
          error: deleteError
        } =
          await supabase
            .from('players')
            .delete()
            .eq(
              'id',
              playerId
            );

        if (deleteError) {
          return json(
            {
              ok: false,
              error:
                deleteError.message
            },
            500
          );
        }

        // Best effort: remove the player's image from Supabase Storage.
        // A failed image cleanup must not undo an otherwise successful
        // permanent player deletion.
        const imagePath =
          typeof player.image_path ===
            'string'
            ? player.image_path.trim()
            : '';

        if (imagePath) {
          try {
            const normalized =
              normalizeStoragePath(
                imagePath
              );

            const fileName =
              normalized.path
                .split('/')
                .filter(Boolean)
                .pop() ??
              normalized.path;

            const buckets =
              normalized.bucket
                ? [
                    normalized.bucket
                  ]
                : [
                    'spielerbilder',
                    'player-images',
                    'uploads'
                  ];

            const paths =
              Array.from(
                new Set(
                  [
                    normalized.path,
                    fileName,
                    `spielerbilder/${fileName}`
                  ].filter(Boolean)
                )
              );

            for (
              const bucket
              of buckets
            ) {
              for (
                const path
                of paths
              ) {
                const {
                  error
                } =
                  await supabase
                    .storage
                    .from(bucket)
                    .remove([path]);

                if (!error) {
                  break;
                }
              }
            }
          } catch {
            // Ignore storage cleanup errors after a successful DB delete.
          }
        }

        return json({
          ok: true,
          deleted: true,
          player_id:
            playerId,
          player_name:
            player.name ??
            null
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Player delete failed'
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
      request.method === 'PUT' &&
      /^\/players\/[^/]+\/archive$/.test(
        url.pathname
      )
    ) {
      try {
        await authenticate(request);

        const playerId =
          url.pathname
            .split('/')[2];

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from('players')
            .update({
              is_own_squad: false,
              archived_at:
                new Date()
                  .toISOString(),
              updated_at:
                new Date()
                  .toISOString()
            })
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
                : 'Archive failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'PUT' &&
      url.pathname.startsWith(
        '/squad/'
      ) &&
      url.pathname.endsWith(
        '/archive'
      )
    ) {
      try {
        await authenticate(request);

        const playerId =
          url.pathname
            .slice(
              '/squad/'.length,
              -'/archive'.length
            )
            .replace(
              /^\/|\/$/g,
              ''
            );

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

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from('players')
            .update({
              is_own_squad: false,
              archived_at:
                new Date()
                  .toISOString(),
              updated_at:
                new Date()
                  .toISOString()
            })
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
              error: error.message
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
                : 'Archive failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'GET' &&
      url.pathname ===
        '/player-archive'
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
            .not(
              'archived_at',
              'is',
              null
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
              error: error.message
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
                : 'Archive request failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'PUT' &&
      url.pathname.startsWith(
        '/player-archive/'
      ) &&
      url.pathname.endsWith(
        '/restore'
      )
    ) {
      try {
        await authenticate(request);

        const playerId =
          url.pathname
            .slice(
              '/player-archive/'.length,
              -'/restore'.length
            )
            .replace(
              /^\/|\/$/g,
              ''
            );

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

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from('players')
            .update({
              is_own_squad: true,
              archived_at: null,
              updated_at:
                new Date()
                  .toISOString()
            })
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
              error: error.message
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
                : 'Restore failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'PUT' &&
      url.pathname.startsWith(
        '/scouting/'
      ) &&
      url.pathname.endsWith(
        '/to-squad'
      )
    ) {
      try {
        await authenticate(request);

        const playerId =
          url.pathname
            .slice(
              '/scouting/'.length,
              -'/to-squad'.length
            )
            .replace(
              /^\/|\/$/g,
              ''
            );

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

        const allowedStatus =
          body.squad_status ===
            'Ausgeliehen'
            ? 'Ausgeliehen'
            : 'Unter Vertrag';

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from('players')
            .update({
              is_own_squad: true,
              archived_at: null,
              squad_status:
                allowedStatus,
              updated_at:
                new Date()
                  .toISOString()
            })
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
              error: error.message
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
                : 'Move to squad failed'
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
      request.method === 'POST' &&
      url.pathname ===
        '/academy/p12/self-invites'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<{
            p12_player_id?: number;
            period_label?: string;
            expires_in_days?: number;
          }>();

        if (
          !body.p12_player_id ||
          !body.period_label?.trim()
        ) {
          return json(
            {
              ok: false,
              error:
                'P12-Spieler und Bewertungsphase sind erforderlich.'
            },
            400
          );
        }

        const days =
          Math.min(
            60,
            Math.max(
              1,
              Number(
                body.expires_in_days ??
                14
              )
            )
          );

        const expiresAt =
          new Date(
            Date.now() +
            days *
              24 *
              60 *
              60 *
              1000
          ).toISOString();

        const supabase =
          createSupabase(env);

        const token =
          crypto.randomUUID();

        const {
          data,
          error
        } =
          await supabase
            .from(
              'p12_self_assessment_invites'
            )
            .insert({
              p12_player_id:
                body.p12_player_id,
              period_label:
                body.period_label.trim(),
              token,
              expires_at:
                expiresAt,
              active: true
            })
            .select(
              'id,token,p12_player_id,period_label,expires_at,used_at,active'
            )
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error: error.message
            },
            500
          );
        }

        return json(
          {
            ok: true,
            invite: data
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
                : 'P12 invite creation failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'GET' &&
      url.pathname === '/academy/p12'
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
            .from('p12_players')
            .select('*')
            .neq(
              'p12_status',
              'Nicht im P12'
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
              error: error.message
            },
            500
          );
        }

        return json({
          ok: true,
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
                : 'P12 request failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'GET' &&
      /^\/academy\/p12\/\d+$/.test(
        url.pathname
      )
    ) {
      try {
        await authenticate(request);

        const playerId =
          Number(
            url.pathname
              .split('/')
              .pop()
          );

        const supabase =
          createSupabase(env);

        const [
          playerResult,
          trainerResult,
          selfResult,
          sportsResult
        ] =
          await Promise.all([
            supabase
              .from('p12_players')
              .select('*')
              .eq(
                'id',
                playerId
              )
              .single(),
            supabase
              .from(
                'p12_trainer_assessments'
              )
              .select(
                '*, scores:p12_trainer_scores(*)'
              )
              .eq(
                'p12_player_id',
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
                'p12_self_assessments'
              )
              .select(
                '*, scores:p12_self_scores(*)'
              )
              .eq(
                'p12_player_id',
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
                'p12_sports_science_tests'
              )
              .select(
                '*, values:p12_sports_science_values(*)'
              )
              .eq(
                'p12_player_id',
                playerId
              )
              .order(
                'test_date',
                {
                  ascending: true
                }
              )
          ]);

        if (
          playerResult.error
        ) {
          return json(
            {
              ok: false,
              error:
                playerResult.error.message
            },
            404
          );
        }

        const firstError =
          trainerResult.error ??
          selfResult.error ??
          sportsResult.error;

        if (firstError) {
          return json(
            {
              ok: false,
              error:
                firstError.message
            },
            500
          );
        }

        return json({
          ok: true,
          player:
            playerResult.data,
          trainerAssessments:
            trainerResult.data ??
            [],
          selfAssessments:
            selfResult.data ??
            [],
          sportsScienceTests:
            sportsResult.data ??
            []
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'P12 player request failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'POST' &&
      url.pathname ===
        '/academy/p12/players'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<
            Record<string, unknown>
          >();

        if (
          typeof body.name !==
            'string' ||
          !body.name.trim()
        ) {
          return json(
            {
              ok: false,
              error:
                'Name ist erforderlich.'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const payload =
          pickFields(
            body,
            [
              'name',
              'birth_date',
              'primary_position',
              'player_role',
              'preferred_foot',
              'current_club',
              'height',
              'nationality',
              'start_date',
              'lead_coach',
              'season'
            ]
          );

        payload.name =
          String(
            payload.name
          ).trim();

        payload.p12_status =
          'Aktiv';

        const {
          data,
          error
        } =
          await supabase
            .from('p12_players')
            .insert(payload)
            .select('*')
            .single();

        if (error) {
          return json(
            {
              ok: false,
              error: error.message
            },
            500
          );
        }

        return json(
          {
            ok: true,
            player: data
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
                : 'P12 player creation failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'PUT' &&
      /^\/academy\/p12\/players\/\d+$/.test(
        url.pathname
      )
    ) {
      try {
        await authenticate(request);

        const playerId =
          Number(
            url.pathname
              .split('/')
              .pop()
          );

        const body =
          await request.json<
            Record<string, unknown>
          >();

        const payload =
          pickFields(
            body,
            [
              'name',
              'birth_date',
              'primary_position',
              'player_role',
              'preferred_foot',
              'current_club',
              'height',
              'nationality',
              'p12_status',
              'start_date',
              'lead_coach',
              'season',
              'focus_basics',
              'focus_when_good',
              'expectations'
            ]
          );

        payload.updated_at =
          new Date()
            .toISOString();

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from('p12_players')
            .update(payload)
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
              error: error.message
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
                : 'P12 player update failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'PUT' &&
      /^\/academy\/p12\/players\/\d+\/pyramid$/.test(
        url.pathname
      )
    ) {
      try {
        await authenticate(request);

        const parts =
          url.pathname
            .split('/');

        const playerId =
          Number(
            parts[
              parts.length - 2
            ]
          );

        const body =
          await request.json<
            Record<string, unknown>
          >();

        const payload =
          pickFields(
            body,
            [
              'pyramid_basics_title',
              'pyramid_control_title',
              'pyramid_focus_title',
              'pyramid_basics_items',
              'pyramid_control_items',
              'pyramid_output_items'
            ]
          );

        payload.updated_at =
          new Date()
            .toISOString();

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from('p12_players')
            .update(payload)
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
              error: error.message
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
                : 'P12 pyramid update failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'POST' &&
      url.pathname ===
        '/academy/p12/trainer-assessments'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<{
            p12_player_id?: number;
            period_label?: string;
            assessment_date?: string | null;
            coach_name?: string | null;
            team_label?: string | null;
            notes?: string | null;
            scores?: Array<
              Record<
                string,
                unknown
              >
            >;
          }>();

        if (
          !body.p12_player_id ||
          !body.period_label?.trim()
        ) {
          return json(
            {
              ok: false,
              error:
                'P12-Spieler und Bewertungsphase sind erforderlich.'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          data: assessment,
          error: assessmentError
        } =
          await supabase
            .from(
              'p12_trainer_assessments'
            )
            .upsert(
              {
                p12_player_id:
                  body.p12_player_id,
                period_label:
                  body.period_label.trim(),
                assessment_date:
                  body.assessment_date ??
                  null,
                coach_name:
                  body.coach_name ??
                  null,
                team_label:
                  body.team_label ??
                  null,
                notes:
                  body.notes ?? null,
                updated_at:
                  new Date()
                    .toISOString()
              },
              {
                onConflict:
                  'p12_player_id,period_label'
              }
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

        const assessmentId =
          assessment.id;

        const {
          error: deleteError
        } =
          await supabase
            .from(
              'p12_trainer_scores'
            )
            .delete()
            .eq(
              'assessment_id',
              assessmentId
            );

        if (deleteError) {
          return json(
            {
              ok: false,
              error:
                deleteError.message
            },
            500
          );
        }

        const scoreRows =
          (body.scores ?? [])
            .filter(
              score =>
                score.category &&
                score.detail
            )
            .map(
              score => ({
                assessment_id:
                  assessmentId,
                category:
                  score.category,
                detail:
                  score.detail,
                p12_rating:
                  score.p12_rating ??
                  null,
                coach_rating:
                  score.coach_rating ??
                  0,
                notes:
                  score.notes ??
                  null,
                updated_at:
                  new Date()
                    .toISOString()
              })
            );

        if (
          scoreRows.length > 0
        ) {
          const {
            error: scoreError
          } =
            await supabase
              .from(
                'p12_trainer_scores'
              )
              .insert(
                scoreRows
              );

          if (scoreError) {
            return json(
              {
                ok: false,
                error:
                  scoreError.message
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
                : 'P12 trainer assessment failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'POST' &&
      url.pathname ===
        '/academy/p12/sport-science'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<{
            p12_player_id?: number;
            test_label?: string;
            test_date?: string | null;
            scientist_name?: string | null;
            notes?: string | null;
            values?: Array<
              Record<
                string,
                unknown
              >
            >;
          }>();

        if (
          !body.p12_player_id ||
          !body.test_label?.trim()
        ) {
          return json(
            {
              ok: false,
              error:
                'P12-Spieler und Testphase sind erforderlich.'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          data: test,
          error: testError
        } =
          await supabase
            .from(
              'p12_sports_science_tests'
            )
            .upsert(
              {
                p12_player_id:
                  body.p12_player_id,
                test_label:
                  body.test_label.trim(),
                test_date:
                  body.test_date ??
                  null,
                scientist_name:
                  body.scientist_name ??
                  null,
                notes:
                  body.notes ??
                  null,
                updated_at:
                  new Date()
                    .toISOString()
              },
              {
                onConflict:
                  'p12_player_id,test_label'
              }
            )
            .select('*')
            .single();

        if (testError) {
          return json(
            {
              ok: false,
              error:
                testError.message
            },
            500
          );
        }

        const testId =
          test.id;

        const {
          error: deleteError
        } =
          await supabase
            .from(
              'p12_sports_science_values'
            )
            .delete()
            .eq(
              'test_id',
              testId
            );

        if (deleteError) {
          return json(
            {
              ok: false,
              error:
                deleteError.message
            },
            500
          );
        }

        const valueRows =
          (body.values ?? [])
            .filter(
              item =>
                item.metric
            )
            .map(
              item => ({
                test_id:
                  testId,
                metric:
                  item.metric,
                value:
                  item.value ??
                  null,
                unit:
                  item.unit ??
                  null,
                normalized_score:
                  item.normalized_score ??
                  null,
                updated_at:
                  new Date()
                    .toISOString()
              })
            );

        if (
          valueRows.length > 0
        ) {
          const {
            error: valueError
          } =
            await supabase
              .from(
                'p12_sports_science_values'
              )
              .insert(
                valueRows
              );

          if (valueError) {
            return json(
              {
                ok: false,
                error:
                  valueError.message
              },
              500
            );
          }
        }

        return json({
          ok: true,
          test
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'P12 sport science failed'
          },
          401
        );
      }
    }

    if (
      request.method === 'DELETE' &&
      /^\/academy\/p12\/sport-science\/\d+$/.test(
        url.pathname
      )
    ) {
      try {
        await authenticate(request);

        const testId =
          Number(
            url.pathname
              .split('/')
              .pop()
          );

        const supabase =
          createSupabase(env);

        const {
          error
        } =
          await supabase
            .from(
              'p12_sports_science_tests'
            )
            .delete()
            .eq(
              'id',
              testId
            );

        if (error) {
          return json(
            {
              ok: false,
              error: error.message
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
                : 'P12 sport science delete failed'
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
              error: 'team is required'
            },
            400
          );
        }

        const supabase =
          createSupabase(env);

        const {
          count,
          error
        } =
          await supabase
            .from('academy_players')
            .select(
              'id',
              {
                count: 'exact',
                head: true
              }
            )
            .eq('team', team);

        if (error) {
          return json(
            {
              ok: false,
              error: error.message
            },
            500
          );
        }

        return json({
          ok: true,
          overview: {
            team,
            playerCount: count ?? 0
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
        '/academy/scouting/players'
    ) {
      try {
        await authenticate(request);

        const body =
          await request.json<
            Record<string, unknown>
          >();

        if (
          typeof body.name !== 'string' ||
          !body.name.trim()
        ) {
          return json(
            {
              ok: false,
              error:
                'name is required'
            },
            400
          );
        }

        const payload =
          pickFields(
            body,
            [
              'name',
              'birth_date',
              'birth_year',
              'current_club',
              'primary_position',
              'secondary_position',
              'preferred_foot',
              'nationality',
              'height_cm',
              'notes'
            ]
          );

        payload.name =
          String(
            payload.name
          ).trim();

        const supabase =
          createSupabase(env);

        const {
          data,
          error
        } =
          await supabase
            .from(
              'academy_scouting_players'
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
            player: data
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
                : 'Academy scouting player creation failed'
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
              'bus_route',
              'is_p12'
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

        if (
          Object.prototype
            .hasOwnProperty
            .call(
              updateData,
              'is_p12'
            )
        ) {
          if (data.is_p12) {
            const {
              data: existingP12,
              error: existingP12Error
            } =
              await supabase
                .from(
                  'p12_players'
                )
                .select(
                  'id,academy_player_id'
                )
                .eq(
                  'academy_player_id',
                  data.id
                )
                .maybeSingle();

            if (existingP12Error) {
              return json(
                {
                  ok: false,
                  error:
                    existingP12Error.message
                },
                500
              );
            }

            const p12Payload = {
              academy_player_id:
                data.id,
              name:
                data.name,
              birth_date:
                data.birth_date,
              primary_position:
                data.primary_position,
              player_role:
                data.player_role,
              preferred_foot:
                data.preferred_foot,
              current_club:
                data.current_club ??
                'SV Ried',
              height:
                data.height,
              nationality:
                data.nationality,
              p12_status:
                'Aktiv',
              updated_at:
                new Date()
                  .toISOString()
            };

            const p12Result =
              existingP12
                ? await supabase
                    .from(
                      'p12_players'
                    )
                    .update(
                      p12Payload
                    )
                    .eq(
                      'id',
                      existingP12.id
                    )
                : await supabase
                    .from(
                      'p12_players'
                    )
                    .insert(
                      p12Payload
                    );

            if (
              p12Result.error
            ) {
              return json(
                {
                  ok: false,
                  error:
                    p12Result.error.message
                },
                500
              );
            }
          } else {
            const {
              error: p12PauseError
            } =
              await supabase
                .from(
                  'p12_players'
                )
                .update({
                  p12_status:
                    'Nicht im P12',
                  updated_at:
                    new Date()
                      .toISOString()
                })
                .eq(
                  'academy_player_id',
                  data.id
                );

            if (p12PauseError) {
              return json(
                {
                  ok: false,
                  error:
                    p12PauseError.message
                },
                500
              );
            }
          }
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
