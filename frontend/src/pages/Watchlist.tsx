import { useEffect, useMemo, useState } from 'react';
import type { Player } from './PlayerProfile';

export type WatchlistEntry = {
  id: number | string;
  player_id: number | string;
  player_name?: string;
  status?: string;
  priority?: string;
  reason?: string;
  added_at?: string;
};

type Props = {
  accessToken?: string;
  apiBase: string;
  players: Player[];
  onBack: () => void;
  onOpenPlayer: (player: Player) => void;
};

type FormState = {
  player_id: string;
  status: string;
  priority: string;
  reason: string;
};

const emptyForm: FormState = {
  player_id: '',
  status: 'Beobachtung',
  priority: 'Mittel',
  reason: ''
};

export default function Watchlist({
  accessToken,
  apiBase,
  players,
  onBack,
  onOpenPlayer
}: Props) {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<number | string | null>(null);
  const [error, setError] =
    useState<string | undefined>();
  const [success, setSuccess] =
    useState<string | undefined>();
  const [showForm, setShowForm] =
    useState(false);
  const [editingId, setEditingId] =
    useState<number | string | null>(null);
  const [form, setForm] =
    useState<FormState>(emptyForm);

  const sortedPlayers = useMemo(
    () =>
      [...players].sort((a, b) =>
        String(a.name ?? '').localeCompare(
          String(b.name ?? ''),
          'de'
        )
      ),
    [players]
  );

  useEffect(() => {
    loadWatchlist();
  }, []);

  async function loadWatchlist() {
    if (!accessToken) {
      setError('Kein Teams-SSO-Token vorhanden.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch(
        `${apiBase}/watchlist`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            'Watchlist konnte nicht geladen werden.'
        );
      }

      setEntries(
        Array.isArray(data.entries)
          ? data.entries
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Watchlist konnte nicht geladen werden.'
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setError(undefined);
    setSuccess(undefined);
    setShowForm(true);
  }

  function startEdit(entry: WatchlistEntry) {
    setEditingId(entry.id);
    setForm({
      player_id: String(entry.player_id ?? ''),
      status: entry.status ?? '',
      priority: entry.priority ?? '',
      reason: entry.reason ?? ''
    });
    setError(undefined);
    setSuccess(undefined);
    setShowForm(true);
  }

  function cancelForm() {
    setEditingId(null);
    setShowForm(false);
    setError(undefined);
  }

  async function saveEntry() {
    if (!accessToken) {
      setError('Kein Teams-SSO-Token vorhanden.');
      return;
    }

    if (!form.player_id) {
      setError('Bitte einen Spieler auswählen.');
      return;
    }

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const isEdit = editingId !== null;

      const response = await fetch(
        isEdit
          ? `${apiBase}/watchlist/${editingId}`
          : `${apiBase}/watchlist`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            player_id: Number(form.player_id),
            status: form.status || null,
            priority: form.priority || null,
            reason: form.reason || null
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            'Watchlist-Eintrag konnte nicht gespeichert werden.'
        );
      }

      setSuccess(
        isEdit
          ? 'Watchlist-Eintrag wurde aktualisiert.'
          : 'Spieler wurde zur Watchlist hinzugefügt.'
      );

      setShowForm(false);
      setEditingId(null);
      await loadWatchlist();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Speichern fehlgeschlagen.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(entry: WatchlistEntry) {
    if (!accessToken) {
      setError('Kein Teams-SSO-Token vorhanden.');
      return;
    }

    setDeletingId(entry.id);
    setError(undefined);
    setSuccess(undefined);

    try {
      const response = await fetch(
        `${apiBase}/watchlist/${entry.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            'Watchlist-Eintrag konnte nicht entfernt werden.'
        );
      }

      setEntries(current =>
        current.filter(
          item => String(item.id) !== String(entry.id)
        )
      );
      setSuccess('Watchlist-Eintrag wurde entfernt.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Löschen fehlgeschlagen.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  function findPlayer(
    playerId: number | string
  ) {
    return players.find(
      player =>
        String(player.id) === String(playerId)
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">
            SV Oberbank Ried
          </div>
          <h1>Watchlist</h1>
          <p>
            Spieler priorisieren und den Scoutingprozess organisieren
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            onClick={startNew}
            style={primaryButton}
          >
            + Spieler hinzufügen
          </button>

          <button
            type="button"
            onClick={onBack}
            style={secondaryButton}
          >
            ← Dashboard
          </button>
        </div>
      </section>

      {error && (
        <section style={errorBox}>
          <strong>Fehler:</strong>
          <div style={{ marginTop: '4px' }}>
            {error}
          </div>
        </section>
      )}

      {success && (
        <section style={successBox}>
          {success}
        </section>
      )}

      {showForm && (
        <section
          style={{
            ...panel,
            marginTop: '18px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '18px'
            }}
          >
            <h2 style={{ margin: 0 }}>
              {editingId === null
                ? 'Spieler zur Watchlist'
                : 'Watchlist-Eintrag bearbeiten'}
            </h2>

            <div
              style={{
                display: 'flex',
                gap: '8px'
              }}
            >
              <button
                type="button"
                onClick={saveEntry}
                disabled={saving}
                style={primaryButton}
              >
                {saving
                  ? 'Speichert…'
                  : 'Speichern'}
              </button>

              <button
                type="button"
                onClick={cancelForm}
                disabled={saving}
                style={secondaryButton}
              >
                Abbrechen
              </button>
            </div>
          </div>

          <div style={formGrid}>
            <FormField label="Spieler">
              <select
                value={form.player_id}
                disabled={editingId !== null}
                onChange={event =>
                  updateField(
                    'player_id',
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  Spieler auswählen…
                </option>

                {sortedPlayers.map(player => (
                  <option
                    key={player.id}
                    value={String(player.id)}
                  >
                    {player.name ??
                      `Spieler ${player.id}`}
                  </option>
                ))}
              </select>
            </FormField>

            <TextField
              label="Status"
              value={form.status}
              onChange={value =>
                updateField('status', value)
              }
            />

            <TextField
              label="Priorität"
              value={form.priority}
              onChange={value =>
                updateField('priority', value)
              }
            />

            <FormField label="Grund / Notiz">
              <textarea
                rows={4}
                value={form.reason}
                onChange={event =>
                  updateField(
                    'reason',
                    event.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  resize: 'vertical'
                }}
              />
            </FormField>
          </div>
        </section>
      )}

      <section style={{ marginTop: '20px' }}>
        <div
          style={{
            fontWeight: 700,
            marginBottom: '12px'
          }}
        >
          {loading
            ? 'Watchlist wird geladen…'
            : `${entries.length} Einträge`}
        </div>

        {!loading && entries.length === 0 && (
          <div style={panel}>
            Aktuell sind keine Spieler auf der Watchlist.
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '14px'
          }}
        >
          {entries.map(entry => {
            const player =
              findPlayer(entry.player_id);

            return (
              <article
                key={entry.id}
                style={panel}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '19px',
                        fontWeight: 700
                      }}
                    >
                      {entry.player_name ??
                        player?.name ??
                        `Spieler ${entry.player_id}`}
                    </div>

                    <div
                      style={{
                        marginTop: '5px',
                        color: '#666',
                        fontSize: '13px'
                      }}
                    >
                      Hinzugefügt:{' '}
                      {entry.added_at
                        ? new Date(
                            entry.added_at
                          ).toLocaleDateString(
                            'de-DE'
                          )
                        : '–'}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(entry)
                      }
                      style={smallButton}
                    >
                      Bearbeiten
                    </button>

                    <button
                      type="button"
                      disabled={
                        deletingId === entry.id
                      }
                      onClick={() =>
                        deleteEntry(entry)
                      }
                      style={dangerButton}
                    >
                      {deletingId === entry.id
                        ? 'Entfernt…'
                        : 'Entfernen'}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '10px',
                    marginTop: '16px'
                  }}
                >
                  <InfoBox
                    label="Status"
                    value={entry.status ?? '–'}
                  />

                  <InfoBox
                    label="Priorität"
                    value={entry.priority ?? '–'}
                  />
                </div>

                {entry.reason && (
                  <div
                    style={{
                      marginTop: '14px',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    <strong>Grund</strong>
                    <div style={{ marginTop: '5px' }}>
                      {entry.reason}
                    </div>
                  </div>
                )}

                {player && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenPlayer(player)
                    }
                    style={{
                      ...primaryButton,
                      width: '100%',
                      marginTop: '16px'
                    }}
                  >
                    Spielerprofil öffnen
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function FormField({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <div style={labelStyle}>
        {label}
      </div>
      {children}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label}>
      <input
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        style={inputStyle}
      />
    </FormField>
  );
}

function InfoBox({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: '#f4f6f5',
        borderRadius: '8px',
        padding: '10px'
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color: '#777',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>
      <strong>{value}</strong>
    </div>
  );
}

const panel: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '14px',
  padding: '18px',
  border: '1px solid #ececec',
  boxShadow: '0 3px 14px rgba(0,0,0,0.04)'
};

const formGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '14px'
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  textTransform: 'uppercase',
  marginBottom: '6px',
  fontWeight: 700
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  font: 'inherit',
  background: '#fff'
};

const primaryButton: React.CSSProperties = {
  border: 'none',
  background: '#0b7a3b',
  color: '#ffffff',
  padding: '12px 18px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 700
};

const secondaryButton: React.CSSProperties = {
  border: '1px solid #d0d0d0',
  background: '#ffffff',
  color: '#222222',
  padding: '12px 18px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 700
};

const smallButton: React.CSSProperties = {
  ...secondaryButton,
  padding: '8px 12px',
  fontSize: '12px'
};

const dangerButton: React.CSSProperties = {
  border: '1px solid #e3b4b4',
  background: '#fff6f6',
  color: '#a00000',
  padding: '8px 12px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '12px'
};

const errorBox: React.CSSProperties = {
  marginTop: '14px',
  padding: '12px 16px',
  background: '#fff3f3',
  color: '#a00000',
  borderRadius: '10px'
};

const successBox: React.CSSProperties = {
  marginTop: '14px',
  padding: '12px 16px',
  background: '#eef9f2',
  color: '#0b6b35',
  borderRadius: '10px'
};
