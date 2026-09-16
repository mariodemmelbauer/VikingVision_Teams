import PageHeader from '../components/PageHeader';
import { useEffect, useState } from 'react';
import type { Player } from './PlayerProfile';

type Props = {
  accessToken?: string;
  apiBase: string;
  onBack: () => void;
  onRestored?: () => Promise<Player[] | void>;
  onOpenPlayer?: (player: Player) => void;
};

export default function PlayerArchive({
  accessToken,
  apiBase,
  onBack,
  onRestored,
  onOpenPlayer
}: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [workingId, setWorkingId] = useState<string | number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Alle');

  const filteredPlayers =
    players.filter(player => {
      const query =
        search.trim().toLocaleLowerCase('de');

      const matchesSearch =
        !query ||
        [
          player.name,
          player.current_club,
          player.primary_position,
          player.nationality
        ]
          .filter(Boolean)
          .some(value =>
            String(value)
              .toLocaleLowerCase('de')
              .includes(query)
          );

      const matchesStatus =
        statusFilter === 'Alle' ||
        player.squad_status === statusFilter;

      return matchesSearch && matchesStatus;
    });

  useEffect(() => {
    loadArchive();
  }, []);

  async function loadArchive() {
    if (!accessToken) {
      setError('Kein Teams-SSO-Token vorhanden.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch(`${apiBase}/player-archive`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? 'Archiv konnte nicht geladen werden.');
      }

      setPlayers(Array.isArray(data.players) ? data.players : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archiv konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  async function restore(player: Player) {
    if (!accessToken) return;

    setWorkingId(player.id);
    setError(undefined);

    try {
      const response = await fetch(
        `${apiBase}/player-archive/${player.id}/restore`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? 'Spieler konnte nicht wiederhergestellt werden.');
      }

      await loadArchive();
      await onRestored?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wiederherstellen fehlgeschlagen.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="page">
      <PageHeader
        title="Spielerarchiv"
        description="Archivierte Spieler bleiben mit Profil und Historie vollständig erhalten."
        onBack={onBack}
        meta={
          <span>
            {players.length} archivierte Spieler
          </span>
        }
      />

      {error && <section style={errorBox}>{error}</section>}

      <section
        style={{
          ...panel,
          marginTop: '14px',
          display: 'grid',
          gridTemplateColumns:
            'minmax(220px, 1fr) minmax(180px, 260px)',
          gap: '10px'
        }}
      >
        <label>
          <div style={labelStyle}>Suche</div>
          <input
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
            placeholder="Name, Verein, Position …"
            style={inputStyle}
          />
        </label>

        <label>
          <div style={labelStyle}>Kaderstatus</div>
          <select
            value={statusFilter}
            onChange={event =>
              setStatusFilter(event.target.value)
            }
            style={inputStyle}
          >
            <option value="Alle">Alle</option>
            <option value="Unter Vertrag">Unter Vertrag</option>
            <option value="Ausgeliehen">Ausgeliehen</option>
          </select>
        </label>
      </section>

      {loading ? (
        <section style={{ ...panel, marginTop: '18px' }}>
          Archiv wird geladen…
        </section>
      ) : filteredPlayers.length === 0 ? (
        <section style={{ ...panel, marginTop: '18px' }}>
          Keine archivierten Spieler für die gewählten Filter gefunden.
        </section>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '14px',
            marginTop: '18px'
          }}
        >
          {filteredPlayers.map(player => (
            <article key={player.id} style={panel}>
              <strong style={{ fontSize: '18px' }}>{player.name}</strong>
              <div style={subtle}>
                {[player.primary_position, player.current_club]
                  .filter(Boolean)
                  .join(' · ') || '–'}
              </div>

              <div style={buttonRow}>
                {onOpenPlayer && (
                  <button
                    type="button"
                    onClick={() => onOpenPlayer(player)}
                    style={secondaryButton}
                  >
                    Profil öffnen
                  </button>
                )}

                <button
                  type="button"
                  disabled={String(workingId) === String(player.id)}
                  onClick={() => restore(player)}
                  style={primaryButton}
                >
                  {String(workingId) === String(player.id)
                    ? 'Stellt wieder her…'
                    : 'In Kader zurückholen'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

const panel: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ececec',
  borderRadius: '14px',
  padding: '18px',
  boxShadow: '0 3px 14px rgba(0,0,0,0.04)'
};
const primaryButton: React.CSSProperties = {
  border: 'none',
  background: '#0b7a3b',
  color: '#fff',
  padding: '10px 14px',
  borderRadius: '9px',
  cursor: 'pointer',
  fontWeight: 700
};
const secondaryButton: React.CSSProperties = {
  border: '1px solid #d0d0d0',
  background: '#fff',
  color: '#222',
  padding: '10px 14px',
  borderRadius: '9px',
  cursor: 'pointer',
  fontWeight: 700
};
const buttonRow: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  marginTop: '14px'
};
const subtle: React.CSSProperties = {
  marginTop: '5px',
  color: '#777',
  fontSize: '13px'
};
const errorBox: React.CSSProperties = {
  marginTop: '14px',
  padding: '12px 16px',
  background: '#fff3f3',
  color: '#a00000',
  borderRadius: '10px'
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  fontWeight: 700,
  marginBottom: '5px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '42px',
  boxSizing: 'border-box',
  border: '1px solid #d5d5d5',
  borderRadius: '8px',
  padding: '10px',
  background: '#fff',
  font: 'inherit'
};
