import PageHeader from '../components/PageHeader';
import { useEffect, useState } from 'react';
import type { Player } from './PlayerProfile';
import PlayerImage from '../components/PlayerImage';

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
  const [success, setSuccess] = useState<string | undefined>();
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
          player.nationality,
          player.league,
          player.scouting_role_1,
          player.scouting_role_2,
          player.scouting_role_3,
          player.notes
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

  async function restore(
    player: Player,
    target:
      'scouting' |
      'squad'
  ) {
    if (!accessToken) return;

    setWorkingId(player.id);
    setError(undefined);
    setSuccess(undefined);

    try {
      const response = await fetch(
        `${apiBase}/player-archive/${player.id}/restore`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            target,
            squad_status:
              'Unter Vertrag'
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? 'Spieler konnte nicht wiederhergestellt werden.');
      }

      setSuccess(
        target === 'squad'
          ? `${player.name ?? 'Spieler'} wurde in Unser Kader zurückgeholt.`
          : `${player.name ?? 'Spieler'} wurde ins Scouting zurückgeholt.`
      );

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
            {filteredPlayers.length} von {players.length} archivierten Spielern
          </span>
        }
      />

      {error && <section style={errorBox}>{error}</section>}
      {success && <section style={successBox}>{success}</section>}

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
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '14px',
            marginTop: '18px'
          }}
        >
          {filteredPlayers.map(player => (
            <article
              key={player.id}
              style={archiveCard}
            >
              <div style={archiveCardTop}>
                <div style={archiveImage}>
                  <PlayerImage
                    playerId={player.id}
                    imagePath={player.image_path}
                    accessToken={accessToken}
                    apiBase={apiBase}
                    alt={player.name ?? 'Spieler'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={archiveName}>
                    {player.name}
                  </div>

                  <div style={archiveMeta}>
                    {[
                      player.current_club,
                      player.league
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Verein / Liga offen'}
                  </div>

                  <div style={archiveMeta}>
                    {[
                      player.primary_position,
                      player.nationality
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
              </div>

              {(player.scouting_role_1 ||
                player.scouting_role_2 ||
                player.scouting_role_3) && (
                <div style={roleWrap}>
                  {[
                    player.scouting_role_1,
                    player.scouting_role_2,
                    player.scouting_role_3
                  ]
                    .filter(Boolean)
                    .map(role => (
                      <span
                        key={String(role)}
                        style={roleChip}
                      >
                        {String(role)}
                      </span>
                    ))}
                </div>
              )}

              <div style={archiveInfoGrid}>
                <ArchiveInfo
                  label="Kaderstatus"
                  value={
                    player.squad_status ??
                    '–'
                  }
                />

                <ArchiveInfo
                  label="Vertrag bis"
                  value={
                    player.contract_until ??
                    player.contract_end ??
                    '–'
                  }
                />

                <ArchiveInfo
                  label="Marktwert"
                  value={
                    player.market_value
                      ? String(player.market_value)
                      : '–'
                  }
                />

                <ArchiveInfo
                  label="Archiviert"
                  value={
                    player.archived_at
                      ? new Date(
                          player.archived_at
                        ).toLocaleDateString(
                          'de-DE'
                        )
                      : '–'
                  }
                />
              </div>

              {player.notes && (
                <div style={archiveNotes}>
                  {player.notes}
                </div>
              )}

              <div style={buttonRow}>
                {onOpenPlayer && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenPlayer(player)
                    }
                    style={secondaryButton}
                  >
                    Profil
                  </button>
                )}

                <button
                  type="button"
                  disabled={
                    String(workingId) ===
                    String(player.id)
                  }
                  onClick={() =>
                    restore(
                      player,
                      'scouting'
                    )
                  }
                  style={scoutingButton}
                >
                  {String(workingId) ===
                  String(player.id)
                    ? 'Wird wiederhergestellt…'
                    : 'Ins Scouting zurück'}
                </button>

                <button
                  type="button"
                  disabled={
                    String(workingId) ===
                    String(player.id)
                  }
                  onClick={() =>
                    restore(
                      player,
                      'squad'
                    )
                  }
                  style={primaryButton}
                >
                  {String(workingId) ===
                  String(player.id)
                    ? 'Wird wiederhergestellt…'
                    : 'In Kader zurück'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}


function ArchiveInfo({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={archiveInfo}>
      <span style={archiveInfoLabel}>
        {label}
      </span>
      <strong style={archiveInfoValue}>
        {value}
      </strong>
    </div>
  );
}


const archiveCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e7e9e7',
  borderRadius: '16px',
  padding: '16px',
  boxShadow: '0 3px 12px rgba(0,0,0,.035)'
};

const archiveCardTop: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start'
};

const archiveImage: React.CSSProperties = {
  width: '58px',
  height: '72px',
  flex: '0 0 auto',
  overflow: 'hidden',
  borderRadius: '10px',
  background: '#f0f2f0'
};

const archiveName: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  lineHeight: 1.2
};

const archiveMeta: React.CSSProperties = {
  marginTop: '5px',
  color: '#707570',
  fontSize: '12px',
  lineHeight: 1.35
};

const roleWrap: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  marginTop: '12px'
};

const roleChip: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#edf7f1',
  color: '#0b6b35',
  fontSize: '11px',
  fontWeight: 800
};

const archiveInfoGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '8px',
  marginTop: '14px'
};

const archiveInfo: React.CSSProperties = {
  padding: '9px 10px',
  borderRadius: '10px',
  background: '#f7f8f7',
  minWidth: 0
};

const archiveInfoLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '9px',
  color: '#888',
  textTransform: 'uppercase',
  fontWeight: 800,
  letterSpacing: '.04em'
};

const archiveInfoValue: React.CSSProperties = {
  display: 'block',
  marginTop: '3px',
  fontSize: '12px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const archiveNotes: React.CSSProperties = {
  marginTop: '10px',
  color: '#666',
  fontSize: '11px',
  lineHeight: 1.4,
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical'
};

const scoutingButton: React.CSSProperties = {
  border: '1px solid #9cc8ad',
  background: '#f4faf6',
  color: '#0b6b35',
  padding: '10px 14px',
  borderRadius: '9px',
  cursor: 'pointer',
  fontWeight: 700
};

const successBox: React.CSSProperties = {
  marginTop: '14px',
  padding: '12px 16px',
  background: '#eef9f2',
  color: '#0b6b35',
  borderRadius: '10px'
};

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
