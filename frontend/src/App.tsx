import { useEffect, useState } from 'react';

import Dashboard from './pages/Dashboard';
import PlayerProfile, {
  Player
} from './pages/PlayerProfile';
import ScoutingReports from './pages/ScoutingReports';
import Watchlist from './pages/Watchlist';
import Squad from './pages/Squad';
import AKAVision from './pages/AKAVision';
import PlayerArchive from './pages/PlayerArchive';
import P12SelfAssessmentPublic from './pages/academy/P12SelfAssessmentPublic';
import AppShell from './components/AppShell';

import {
  initTeams,
  TeamsUser
} from './teams/context';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ??
  'https://vikingvision-teams.mario-demmelbauer.workers.dev';

type Page =
  | 'dashboard'
  | 'playerProfile'
  | 'scoutingReports'
  | 'watchlist'
  | 'squad'
  | 'playerArchive'
  | 'akavision';

export default function App() {
  const publicP12InviteToken =
    new URLSearchParams(
      window.location.search
    ).get('p12invite');

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


  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

  const [playerReturnPage, setPlayerReturnPage] =
    useState<Page>('dashboard');

  useEffect(() => {
    if (publicP12InviteToken) {
      return;
    }

    async function start() {
      const result =
        await initTeams();

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

      try {
        const response =
          await fetch(
            `${API_BASE}/health`,
            {
              method: 'GET',
              headers
            }
          );

        setApiOk(response.ok);
      } catch (error) {
        console.error(
          'Health API error:',
          error
        );
        setApiOk(false);
      }

      try {
        const response =
          await fetch(
            `${API_BASE}/players`,
            {
              method: 'GET',
              headers
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setSupabaseOk(false);
          setPlayerCount(null);
          setSupabaseError(
            data?.error ??
            'Supabase-Anfrage fehlgeschlagen'
          );
          return;
        }

        const loadedPlayers =
          Array.isArray(data.players)
            ? data.players
            : [];

        setPlayers(loadedPlayers);
        setSupabaseOk(
          data.supabase === true
        );
        setPlayerCount(
          typeof data.count === 'number'
            ? data.count
            : loadedPlayers.length
        );
        setSupabaseError(undefined);

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
  }, [publicP12InviteToken]);

  async function loadPlayers() {
    const token = user.accessToken;

    if (!token) {
      throw new Error(
        'Kein Teams-SSO-Token vorhanden'
      );
    }

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
      throw new Error(
        data?.error ??
        'Spieler konnten nicht geladen werden'
      );
    }

    const loadedPlayers =
      Array.isArray(data.players)
        ? data.players
        : [];

    setPlayers(loadedPlayers);
    setPlayerCount(
      typeof data.count === 'number'
        ? data.count
        : loadedPlayers.length
    );
    setSupabaseOk(
      data.supabase === true
    );
    setSupabaseError(undefined);

    return loadedPlayers;
  }

  async function ensurePlayersLoaded() {
    if (players.length === 0) {
      return await loadPlayers();
    }

    return players;
  }

  async function openScoutingReports() {
    try {
      await ensurePlayersLoaded();
      setPage('scoutingReports');
    } catch (error) {
      setSupabaseError(
        error instanceof Error
          ? error.message
          : 'Spieler konnten nicht geladen werden'
      );
    }
  }

  async function openWatchlist() {
    try {
      await ensurePlayersLoaded();
      setPage('watchlist');
    } catch (error) {
      setSupabaseError(
        error instanceof Error
          ? error.message
          : 'Spieler konnten nicht geladen werden'
      );
    }
  }

  async function openSquad() {
    try {
      await ensurePlayersLoaded();
      setPage('squad');
    } catch (error) {
      setSupabaseError(
        error instanceof Error
          ? error.message
          : 'Kader konnte nicht geladen werden'
      );
    }
  }

  function openPlayerArchive() {
    setPage('playerArchive');
  }

  function openAKAVision() {
    setPage('akavision');
  }

  function openPlayer(
    player: Player,
    returnPage: Page = 'dashboard'
  ) {
    setSelectedPlayer(player);
    setPlayerReturnPage(returnPage);
    setPage('playerProfile');
  }

  function backFromPlayer() {
    setPage(playerReturnPage);
  }

  function playerBackLabel() {
    switch (playerReturnPage) {
      case 'squad':
        return 'Unser Kader';
      case 'scoutingReports':
        return 'Scouting';
      case 'watchlist':
        return 'Watchlist';
      case 'playerArchive':
        return 'Spielerarchiv';
      default:
        return 'Dashboard';
    }
  }

  function handlePlayerUpdated(
    updatedPlayer: Player
  ) {
    setSelectedPlayer(updatedPlayer);

    setPlayers(currentPlayers =>
      currentPlayers.map(player =>
        String(player.id) ===
        String(updatedPlayer.id)
          ? updatedPlayer
          : player
      )
    );
  }

  async function handlePlayerDeleted(
    playerId: number | string
  ) {
    setPlayers(current =>
      current.filter(
        player =>
          String(player.id) !==
          String(playerId)
      )
    );

    setSelectedPlayer(null);

    try {
      await loadPlayers();
    } catch {
      // The local list is already updated.
    }

    setPage(playerReturnPage);
  }

  function backToDashboard() {
    setPage('dashboard');
  }


  function shell(
    content: React.ReactNode
  ) {
    return (
      <AppShell
        currentPage={
          page === 'playerProfile'
            ? playerReturnPage
            : page
        }
        displayName={
          user.displayName ??
          'VikingVision User'
        }
        inTeams={inTeams}
        onDashboard={backToDashboard}
        onScouting={openScoutingReports}
        onWatchlist={openWatchlist}
        onSquad={openSquad}
        onAKAVision={openAKAVision}
        onArchive={openPlayerArchive}
      >
        {content}
      </AppShell>
    );
  }

  if (publicP12InviteToken) {
    return (
      <P12SelfAssessmentPublic
        token={publicP12InviteToken}
        apiBase={API_BASE}
      />
    );
  }

  const scoutingPlayers =
    players.filter(
      player =>
        !player.is_own_squad &&
        !player.archived_at
    );

  if (
    page === 'playerProfile' &&
    selectedPlayer
  ) {
    return shell(
      <PlayerProfile
        player={selectedPlayer}
        accessToken={user.accessToken}
        apiBase={API_BASE}
        onBack={backFromPlayer}
        backLabel={playerBackLabel()}
        onPlayerUpdated={
          handlePlayerUpdated
        }
        onPlayerArchived={
          async () => {
            await loadPlayers();
          }
        }
        onPlayerDeleted={
          handlePlayerDeleted
        }
      />
    );
  }


  if (page === 'scoutingReports') {
    return shell(
      <ScoutingReports
        accessToken={user.accessToken}
        apiBase={API_BASE}
        players={scoutingPlayers}
        currentScoutName={
          user.displayName
        }
        onBack={backToDashboard}
        onPlayersChanged={loadPlayers}
        onOpenPlayer={player =>
          openPlayer(
            player,
            'scoutingReports'
          )
        }
      />
    );
  }

  if (page === 'watchlist') {
    return shell(
      <Watchlist
        accessToken={user.accessToken}
        apiBase={API_BASE}
        players={players}
        onBack={backToDashboard}
        onOpenPlayer={player =>
          openPlayer(
            player,
            'watchlist'
          )
        }
      />
    );
  }

  if (page === 'squad') {
    return shell(
      <Squad
        players={players}
        accessToken={user.accessToken}
        apiBase={API_BASE}
        onBack={backToDashboard}
        onOpenPlayer={player =>
          openPlayer(
            player,
            'squad'
          )
        }
        onArchived={loadPlayers}
      />
    );
  }

  if (page === 'playerArchive') {
    return shell(
      <PlayerArchive
        accessToken={user.accessToken}
        apiBase={API_BASE}
        onBack={backToDashboard}
        onRestored={loadPlayers}
        onOpenPlayer={player =>
          openPlayer(
            player,
            'playerArchive'
          )
        }
      />
    );
  }

  if (page === 'akavision') {
    return shell(
      <AKAVision
        accessToken={user.accessToken}
        apiBase={API_BASE}
        onBack={backToDashboard}
      />
    );
  }

  return shell(
    <Dashboard
      displayName={
        user.displayName ??
        'VikingVision User'
      }
      userPrincipalName={
        user.userPrincipalName
      }
      inTeams={inTeams}
      ssoOk={
        user.tokenOk ??
        false
      }
      ssoError={
        user.tokenError
      }
      apiOk={apiOk}
      supabaseOk={supabaseOk}
      playerCount={playerCount}
      supabaseError={
        supabaseError
      }
      onOpenScoutingReports={
        openScoutingReports
      }
      onOpenWatchlist={
        openWatchlist
      }
      onOpenSquad={
        openSquad
      }
      onOpenPlayerArchive={
        openPlayerArchive
      }
      onOpenAKAVision={
        openAKAVision
      }
    />
  );
}
