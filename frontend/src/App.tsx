import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import { initTeams, TeamsUser } from './teams/context';
import Players from './pages/Players';

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

  const [supabaseOk, setSupabaseOk] =
    useState<boolean | null>(null);

  const [playerCount, setPlayerCount] =
    useState<number | null>(null);

  const [supabaseError, setSupabaseError] =
    useState<string | undefined>();

  useEffect(() => {
    async function start() {
      const result = await initTeams();

      setInTeams(result.inTeams);
      setUser(result.user);

      const token = result.user.accessToken;

      if (!token) {
        setApiOk(false);
        setSupabaseOk(false);
        setSupabaseError('Kein Teams-SSO-Token vorhanden');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`
      };

      try {
        const healthResponse = await fetch(
          `${API_BASE}/health`,
          {
            method: 'GET',
            headers
          }
        );

        setApiOk(healthResponse.ok);
      } catch (error) {
        console.error('Health API error:', error);
        setApiOk(false);
      }

      try {
        const playersResponse = await fetch(
          `${API_BASE}/players`,
          {
            method: 'GET',
            headers
          }
        );

        const playersData = await playersResponse.json();

        if (!playersResponse.ok) {
          setSupabaseOk(false);
          setPlayerCount(null);
          setSupabaseError(
            playersData?.error ??
            'Supabase-Anfrage fehlgeschlagen'
          );

          console.error(
            'Players API error:',
            playersData
          );

          return;
        }

        setSupabaseOk(
          playersData.supabase === true
        );

        setPlayerCount(
          typeof playersData.count === 'number'
            ? playersData.count
            : 0
        );

        setSupabaseError(undefined);

        console.log(
          'VikingVision players:',
          playersData.players
        );
      } catch (error) {
        console.error(
          'Players API request failed:',
          error
        );

        setSupabaseOk(false);
        setPlayerCount(null);
        setSupabaseError(
          'Verbindung zu Supabase fehlgeschlagen'
        );
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
      supabaseOk={supabaseOk}
      playerCount={playerCount}
      supabaseError={supabaseError}
    />
  );
}
