import { useEffect, useState } from 'react';

import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import PlayerProfile, { Player } from './pages/PlayerProfile';
import { initTeams, TeamsUser } from './teams/context';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ??
  'https://vikingvision-teams.mario-demmelbauer.workers.dev';

type Page = 'dashboard' | 'players' | 'playerProfile';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [user, setUser] = useState<TeamsUser>({ displayName: 'VikingVision User' });
  const [inTeams, setInTeams] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | undefined>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState<string | undefined>();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

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

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const response = await fetch(`${API_BASE}/health`, { method: 'GET', headers });
        setApiOk(response.ok);
        const data = await response.json();
        console.log('VikingVision API health:', data);
      } catch (error) {
        console.error('Health API error:', error);
        setApiOk(false);
      }

      try {
        const response = await fetch(`${API_BASE}/players`, { method: 'GET', headers });
        const data = await response.json();

        if (!response.ok) {
          setSupabaseOk(false);
          setPlayerCount(null);
          setSupabaseError(data?.error ?? 'Supabase-Anfrage fehlgeschlagen');
          console.error('Players API error:', data);
          return;
        }

        const loadedPlayers = Array.isArray(data.players) ? data.players : [];
        setPlayers(loadedPlayers);
        setSupabaseOk(data.supabase === true);
        setPlayerCount(typeof data.count === 'number' ? data.count : loadedPlayers.length);
        setSupabaseError(undefined);
      } catch (error) {
        console.error('Players API request failed:', error);
        setSupabaseOk(false);
        setPlayerCount(null);
        setSupabaseError('Verbindung zu Supabase fehlgeschlagen');
      }
    }

    start();
  }, []);

  async function openPlayers() {
    setPage('players');
    const token = user.accessToken;

    if (!token) {
      setPlayersError('Kein Teams-SSO-Token vorhanden');
      return;
    }

    setPlayersLoading(true);
    setPlayersError(undefined);

    try {
      const response = await fetch(`${API_BASE}/players`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        setPlayersError(data?.error ?? 'Spieler konnten nicht geladen werden');
        return;
      }

      const loadedPlayers = Array.isArray(data.players) ? data.players : [];
      setPlayers(loadedPlayers);
      setPlayerCount(typeof data.count === 'number' ? data.count : loadedPlayers.length);
      setSupabaseOk(data.supabase === true);
      setSupabaseError(undefined);
    } catch (error) {
      console.error('Open players error:', error);
      setPlayersError('Verbindung zur Spieler-Datenbank fehlgeschlagen');
    } finally {
      setPlayersLoading(false);
    }
  }

  function openPlayer(player: Player) {
    setSelectedPlayer(player);
    setPage('playerProfile');
  }

  function handlePlayerUpdated(updatedPlayer: Player) {
    setSelectedPlayer(updatedPlayer);
    setPlayers(currentPlayers =>
      currentPlayers.map(player =>
        String(player.id) === String(updatedPlayer.id) ? updatedPlayer : player
      )
    );
  }

  function backToDashboard() { setPage('dashboard'); }
  function backToPlayers() { setPage('players'); }

  if (page === 'playerProfile' && selectedPlayer) {
    return (
      <PlayerProfile
        player={selectedPlayer}
        accessToken={user.accessToken}
        apiBase={API_BASE}
        onBack={backToPlayers}
        onPlayerUpdated={handlePlayerUpdated}
      />
    );
  }

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

  return (
    <Dashboard
      displayName={user.displayName ?? 'VikingVision User'}
      userPrincipalName={user.userPrincipalName}
      inTeams={inTeams}
      ssoOk={user.tokenOk ?? false}
      ssoError={user.tokenError}
      apiOk={apiOk}
      supabaseOk={supabaseOk}
      playerCount={playerCount}
      supabaseError={supabaseError}
      onOpenPlayers={openPlayers}
    />
  );
}
