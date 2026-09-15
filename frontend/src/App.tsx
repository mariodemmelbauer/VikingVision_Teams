import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import { initTeams, TeamsUser } from './teams/context';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ??
  'https://vikingvision-teams.mario-demmelbauer.workers.dev';

type Page =
  | 'dashboard'
  | 'players';

export default function App() {
  const [page, setPage] =
    useState<Page>('dashboard');

  const [user, setUser] =
    useState<TeamsUser>({
      displayName: 'VikingVision User'
    });

  const [inTeams, setInTeams] =
    useState(false);

  const [apiOk, setApiOk] =
    useState<boolean | null>(null);

  const [supabaseOk, setSupabaseOk] =
    useState<boolean | null>(null);

  const [playerCount, setPlayerCount] =
    useState<number | null>(null);

  const [supabaseError, setSupabaseError] =
    useState<string | undefined>();

  const [players, setPlayers] =
    useState<any[]>([]);

  const [playersLoading, setPlayersLoading] =
    useState(false);

  const [playersError, setPlayersError] =
    useState<string | undefined>();

  useEffect(() => {
    async function start() {
      const result = await initTeams();

      setInTeams(result.inTeams);
      setUser(result.user);

      const token =
        result.user.accessToken;

      if (!token) {
        setApiOk(false);
        setSupabaseOk(false);

        setSupabaseError(
          'Kein Teams-SSO-Token vorhanden'
        );

        return;
      }

      const headers = {
        Authorization:
          `Bearer ${token}`
      };

      // -------------------------
      // API HEALTH
      // -------------------------

      try {
        const healthResponse =
          await fetch(
            `${API_BASE}/health`,
            {
              method: 'GET',
              headers
            }
          );

        setApiOk(
          healthResponse.ok
        );

        const healthData =
          await healthResponse.json();

        console.log(
          'VikingVision API health:',
          healthData
        );

      } catch (error) {
        console.error(
          'Health API error:',
          error
        );

        setApiOk(false);
      }

      // -------------------------
      // SUPABASE / PLAYERS TEST
      // -------------------------

      try {
        const playersResponse =
          await fetch(
            `${API_BASE}/players`,
            {
              method: 'GET',
              headers
            }
          );

        const playersData =
          await playersResponse.json();

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
          typeof playersData.count ===
          'number'
            ? playersData.count
            : 0
        );

        setPlayers(
          Array.isArray(
            playersData.players
          )
            ? playersData.players
            : []
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

  async function openPlayers() {
    const token =
      user.accessToken;

    setPage('players');

    if (!token) {
      setPlayersError(
        'Kein Teams-SSO-Token vorhanden'
      );

      return;
    }

    setPlayersLoading(true);
    setPlayersError(undefined);

    try {
      const response =
        await fetch(
          `${API_BASE}/players`,
          {
            method: 'GET',
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setPlayersError(
          data?.error ??
          'Spieler konnten nicht geladen werden'
        );

        return;
      }

      const loadedPlayers =
        Array.isArray(
          data.players
        )
          ? data.players
          : [];

      setPlayers(
        loadedPlayers
      );

      setPlayerCount(
        typeof data.count ===
        'number'
          ? data.count
          : loadedPlayers.length
      );

      setSupabaseOk(
        data.supabase === true
      );

      setSupabaseError(undefined);

    } catch (error) {
      console.error(
        'Open players error:',
        error
      );

      setPlayersError(
        'Verbindung zur Spieler-Datenbank fehlgeschlagen'
      );
    } finally {
      setPlayersLoading(false);
    }
  }

  function backToDashboard() {
    setPage('dashboard');
  }

  // -------------------------
  // PLAYERS PAGE
  // -------------------------

  if (page === 'players') {
    return (
      <Players
        players={players}
        loading={playersLoading}
        error={playersError}
        onBack={backToDashboard}
      />
    );
  }

  // -------------------------
  // DASHBOARD
  // -------------------------

  return (
    <Dashboard
      displayName={
        user.displayName ??
        'VikingVision User'
      }
      userPrincipalName={
        user.userPrincipalName
      }
      inTeams={
        inTeams
      }
      ssoOk={
        user.tokenOk ??
        false
      }
      ssoError={
        user.tokenError
      }
      apiOk={
        apiOk
      }
      supabaseOk={
        supabaseOk
      }
      playerCount={
        playerCount
      }
      supabaseError={
        supabaseError
      }
      onOpenPlayers={
        openPlayers
      }
    />
  );
}
