import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import { initTeams, TeamsUser } from './teams/context';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ??
  'https://vikingvision-teams.mario-demmelbauer.workers.dev';

type Page =
  | 'dashboard'
  | 'players'
  | 'playerProfile';

type Player = {
  id: number | string;
  name?: string;
  birth_date?: string;
  birth_year?: number;
  primary_position?: string;
  secondary_position?: string;
  preferred_foot?: string;
  nationality?: string;
  height_cm?: number;
  height?: number;
  current_club?: string;
  market_value?: string | number;
  image_path?: string;
  contract_until?: string;
  contract_end?: string;
  agent_agency?: string;
  squad_status?: string;
  priority?: string | number;
  potential?: string | number;
  notes?: string;
  transfermarkt_url?: string;
  video_url?: string;
};

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
    useState<Player[]>([]);

  const [playersLoading, setPlayersLoading] =
    useState(false);

  const [playersError, setPlayersError] =
    useState<string | undefined>();

  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

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

        const loadedPlayers =
          Array.isArray(playersData.players)
            ? playersData.players
            : [];

        setSupabaseOk(
          playersData.supabase === true
        );

        setPlayerCount(
          typeof playersData.count === 'number'
            ? playersData.count
            : loadedPlayers.length
        );

        setPlayers(
          loadedPlayers
        );

        setSupabaseError(undefined);

        console.log(
          'VikingVision players:',
          loadedPlayers
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
        Array.isArray(data.players)
          ? data.players
          : [];

      setPlayers(
        loadedPlayers
      );

      setPlayerCount(
        typeof data.count === 'number'
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

  function openPlayer(player: Player) {
    setSelectedPlayer(player);
    setPage('playerProfile');
  }

  function backToDashboard() {
    setPage('dashboard');
  }

  function backToPlayers() {
    setPage('players');
  }

  // -------------------------
  // PLAYER PROFILE
  // -------------------------

  if (
    page === 'playerProfile' &&
    selectedPlayer
  ) {
    return (
      <PlayerProfile
        player={selectedPlayer}
        onBack={backToPlayers}
      />
    );
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
        onOpenPlayer={openPlayer}
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
