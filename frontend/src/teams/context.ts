import { app } from '@microsoft/teams-js';

export type TeamsUserInfo = {
  displayName?: string;
  userPrincipalName?: string;
  tenantId?: string;
  userId?: string;
};

export async function initTeams(): Promise<{ inTeams: boolean; user: TeamsUserInfo }> {
  try {
    await app.initialize();
    const ctx = await app.getContext();
    return {
      inTeams: true,
      user: {
        displayName: ctx.user?.userPrincipalName ?? ctx.user?.loginHint,
        userPrincipalName: ctx.user?.userPrincipalName ?? ctx.user?.loginHint,
        tenantId: ctx.user?.tenant?.id,
        userId: ctx.user?.id,
      },
    };
  } catch {
    return { inTeams: false, user: {} };
  }
}
