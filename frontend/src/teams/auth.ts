import { authentication } from '@microsoft/teams-js';

export async function getTeamsSsoToken(): Promise<string | null> {
  try {
    return await authentication.getAuthToken();
  } catch {
    return null;
  }
}
