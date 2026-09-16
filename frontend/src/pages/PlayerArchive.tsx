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
      <section className="hero">
        <div>
          <div className="eyebrow">SV Oberbank Ried</div>
          <h1>Spielerarchiv</h1>
          <p>Aus dem Kader entfernte Spieler bleiben in VikingVision erhalten</p>
        </div>

        <button type="button" onClick={onBack} style={secondaryButton}>
          ← Dashboard
        </button>
      </section>

      {error && <section style={errorBox}>{error}</section>}

      <section className="status" style={{ marginTop: '18px' }}>
        <span>
          Archivierte Spieler: <strong>{players.length}</strong>
        </span>
      </section>

      {loading ? (
        <section style={{ ...panel, marginTop: '18px' }}>
          Archiv wird geladen…
        </section>
      ) : players.length === 0 ? (
        <section style={{ ...panel, marginTop: '18px' }}>
          Das Spielerarchiv ist aktuell leer.
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
          {players.map(player => (
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
