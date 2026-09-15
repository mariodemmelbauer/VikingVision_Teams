import { app, authentication } from '@microsoft/teams-js';

export type TeamsUser = {
  displayName?: string;
  userPrincipalName?: string;
  tenantId?: string;
  objectId?: string;

  accessToken?: string;

  tokenOk?: boolean;
  tokenError?: string;
};

function decodeJwtPayload(token: string): Record<string, any> {
  const part = token.split('.')[1];

  if (!part) {
    return {};
  }

  const base64 = part
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padded = base64.padEnd(
    Math.ceil(base64.length / 4) * 4,
    '='
  );

  return JSON.parse(atob(padded));
}

export async function initTeams(): Promise<{
  inTeams: boolean;
  user: TeamsUser;
}> {
  try {
    await app.initialize();

    const context = await app.getContext();

    const user: TeamsUser = {
      displayName: context.user?.displayName,
      userPrincipalName: context.user?.userPrincipalName,
      tenantId: context.user?.tenant?.id
    };

    try {
      const token = await authentication.getAuthToken();

      const claims = decodeJwtPayload(token);

      user.accessToken = token;

      user.displayName =
        claims.name ??
        user.displayName;

      user.userPrincipalName =
        claims.preferred_username ??
        claims.upn ??
        user.userPrincipalName;

      user.objectId =
        claims.oid;

      user.tenantId =
        claims.tid ??
        user.tenantId;

      user.tokenOk = true;
    } catch (authError: any) {
      user.tokenOk = false;

      user.tokenError =
        authError?.message ??
        String(authError);
    }

    return {
      inTeams: true,
      user
    };
  } catch {
    return {
      inTeams: false,
      user: {
        displayName: 'VikingVision User',
        tokenOk: false
      }
    };
  }
}
