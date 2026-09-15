import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import { initTeams, TeamsUser } from './teams/context';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ??
  'https://vikingvision-teams.mario-demmelbauer.workers.dev';

export default function App() {
  const [user, setUser] = useState<TeamsUser>({
    displayName: 'VikingVision User'
  });

  const [inTeams, setInTeams] = useState(false);

  const [apiOk, setApiOk] =
    useState<boolean | null>(null);

  useEffect(() => {
    async function start() {
      const result = await initTeams();

      setInTeams(result.inTeams);
      setUser(result.user);

      try {
        const headers: Record<string, string> = {};

        if (result.user.accessToken) {
          headers.Authorization =
            `Bearer ${result.user.accessToken}`;
        }

        const response = await fetch(
          `${API_BASE}/health`,
          {
            method: 'GET',
            headers
          }
        );

        setApiOk(response.ok);

        const data = await response.json();

        console.log(
          'VikingVision API health:',
          data
        );
      } catch (error) {
        console.error(
          'VikingVision API error:',
          error
        );

        setApiOk(false);
      }
    }

    start();
  }, []);

  return (
    <Dashboard
      displayName={
        user.displayName ??
        'VikingVision User'
      }
      userPrincipalName={
        user.userPrincipalName
      }
      inTeams={inTeams}
      ssoOk={user.tokenOk ?? false}
      ssoError={user.tokenError}
      apiOk={apiOk}
    />
  );
}
