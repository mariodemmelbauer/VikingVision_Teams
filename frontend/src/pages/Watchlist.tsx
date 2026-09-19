import PageHeader from '../components/PageHeader';
import { useEffect, useMemo, useState } from 'react';
import type { Player } from './PlayerProfile';
import PlayerImage from '../components/PlayerImage';

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
  const [movingId, setMovingId] =
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

  const [search, setSearch] =
    useState('');
  const [statusFilter, setStatusFilter] =
    useState('Alle');
  const [priorityFilter, setPriorityFilter] =
    useState('Alle');
  const [sortMode, setSortMode] =
    useState('Priorität');

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

  const statuses = useMemo(
    () => [
      'Alle',
      ...Array.from(
        new Set(
          entries
            .map(entry => entry.status)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b, 'de'))
    ],
    [entries]
  );

  const priorities = useMemo(
    () => [
      'Alle',
      ...Array.from(
        new Set(
          entries
            .map(entry => entry.priority)
            .filter((value): value is string => Boolean(value))
        )
      )
    ],
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const query =
      search.trim().toLocaleLowerCase('de');

    const priorityRank = (
      value?: string
    ) => {
      const normalized =
        String(value ?? '')
          .toLocaleLowerCase('de')
          .trim();

      if (
        normalized === 'hoch' ||
        normalized === 'high' ||
        normalized === 'a'
      ) {
        return 0;
      }

      if (
        normalized === 'mittel' ||
        normalized === 'medium' ||
        normalized === 'b'
      ) {
        return 1;
      }

      if (
        normalized === 'niedrig' ||
        normalized === 'low' ||
        normalized === 'c'
      ) {
        return 2;
      }

      return 3;
    };

    const result =
      entries.filter(entry => {
        const player =
          players.find(
            item =>
              String(item.id) ===
              String(entry.player_id)
          );

        const matchesSearch =
          !query ||
          [
            entry.player_name,
            player?.name,
            player?.current_club,
            player?.primary_position,
            player?.league,
            entry.reason
          ]
            .filter(Boolean)
            .some(value =>
              String(value)
                .toLocaleLowerCase('de')
                .includes(query)
            );

        const matchesStatus =
          statusFilter === 'Alle' ||
          entry.status === statusFilter;

        const matchesPriority =
          priorityFilter === 'Alle' ||
          entry.priority === priorityFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority
        );
      });

    return result.sort(
      (a, b) => {
        if (
          sortMode ===
          'Priorität'
        ) {
          const rankDiff =
            priorityRank(
              a.priority
            ) -
            priorityRank(
              b.priority
            );

          if (rankDiff !== 0) {
            return rankDiff;
          }
        }

        if (
          sortMode ===
          'Neueste'
        ) {
          return String(
            b.added_at ?? ''
          ).localeCompare(
            String(
              a.added_at ?? ''
            )
          );
        }

        if (
          sortMode ===
          'Name'
        ) {
          return String(
            a.player_name ??
            findPlayerName(
              players,
              a.player_id
            )
          ).localeCompare(
            String(
              b.player_name ??
              findPlayerName(
                players,
                b.player_id
              )
            ),
            'de'
          );
        }

        return String(
          b.added_at ?? ''
        ).localeCompare(
          String(
            a.added_at ?? ''
          )
        );
      }
    );
  }, [
    entries,
    players,
    search,
    statusFilter,
    priorityFilter,
    sortMode
  ]);

  const highPriorityCount =
    entries.filter(
      entry =>
        ['hoch', 'high', 'a']
          .includes(
            String(
              entry.priority ?? ''
            )
              .toLocaleLowerCase(
                'de'
              )
              .trim()
          )
    ).length;

  const newThirtyDaysCount =
    entries.filter(
      entry => {
        if (!entry.added_at) {
          return false;
        }

        const added =
          new Date(
            entry.added_at
          );

        if (
          Number.isNaN(
            added.getTime()
          )
        ) {
          return false;
        }

        const limit =
          new Date();

        limit.setDate(
          limit.getDate() -
          30
        );

        return added >= limit;
      }
    ).length;

  const activeStatusCount =
    statuses.length > 0
      ? Math.max(
          statuses.length - 1,
          0
        )
      : 0;

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

  async function moveToSquad(
    entry: WatchlistEntry
  ) {
    if (!accessToken) {
      setError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    const player =
      findPlayer(
        entry.player_id
      );

    if (!player) {
      setError(
        'Der Spieler konnte nicht geladen werden.'
      );
      return;
    }

    setMovingId(entry.id);
    setError(undefined);
    setSuccess(undefined);

    try {
      const squadResponse =
        await fetch(
          `${apiBase}/scouting/${player.id}/to-squad`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              squad_status:
                'Unter Vertrag'
            })
          }
        );

      const squadData =
        await squadResponse.json();

      if (!squadResponse.ok) {
        throw new Error(
          squadData?.error ??
          'Spieler konnte nicht in den Kader aufgenommen werden.'
        );
      }

      const watchlistResponse =
        await fetch(
          `${apiBase}/watchlist/${entry.id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization:
                `Bearer ${accessToken}`
            }
          }
        );

      const watchlistData =
        await watchlistResponse.json();

      if (!watchlistResponse.ok) {
        throw new Error(
          watchlistData?.error ??
          'Spieler wurde in den Kader aufgenommen, konnte aber nicht aus der Watchlist entfernt werden.'
        );
      }

      // Der zentrale Player-State liegt im App-Parent.
      // Die Objekt-Referenz bleibt dort identisch und ist beim
      // nächsten Seitenwechsel bereits als Kaderspieler markiert.
      player.is_own_squad = true;
      player.archived_at = undefined;
      player.squad_status =
        'Unter Vertrag';

      setEntries(current =>
        current.filter(
          item =>
            String(item.id) !==
            String(entry.id)
        )
      );

      setSuccess(
        `${player.name ?? 'Spieler'} wurde in den Kader aufgenommen und aus der Watchlist entfernt.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Aufnahme in den Kader fehlgeschlagen.'
      );
    } finally {
      setMovingId(null);
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
      <PageHeader
        title="Watchlist"
        description="Kandidaten priorisieren und nächste Scouting-Schritte organisieren."
        onBack={onBack}
        meta={
          <span>
            {loading
              ? 'Wird geladen…'
              : `${filteredEntries.length} Einträge`}
          </span>
        }
        actions={
          <button
            type="button"
            onClick={startNew}
            style={primaryButton}
          >
            + Spieler hinzufügen
          </button>
        }
      />

      <section style={watchOverviewGrid}>
        <WatchOverviewCard
          label="Watchlist"
          value={entries.length}
          hint="Spieler gesamt"
        />

        <WatchOverviewCard
          label="Hohe Priorität"
          value={highPriorityCount}
          hint="sofort im Fokus"
          accent
        />

        <WatchOverviewCard
          label="Neu"
          value={newThirtyDaysCount}
          hint="letzte 30 Tage"
        />

        <WatchOverviewCard
          label="Status"
          value={activeStatusCount}
          hint="aktive Kategorien"
        />
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

      <section
        style={{
          ...panel,
          marginTop: '18px'
        }}
      >
        <div style={watchFilterGrid}>
          <label>
            <div style={labelStyle}>Suche</div>
            <input
              value={search}
              onChange={event =>
                setSearch(event.target.value)
              }
              placeholder="Spieler, Verein, Position, Grund …"
              style={inputStyle}
            />
          </label>

          <label>
            <div style={labelStyle}>Status</div>
            <select
              value={statusFilter}
              onChange={event =>
                setStatusFilter(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              {statuses.map(status => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={labelStyle}>Priorität</div>
            <select
              value={priorityFilter}
              onChange={event =>
                setPriorityFilter(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              {priorities.map(priority => (
                <option
                  key={priority}
                  value={priority}
                >
                  {priority}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={labelStyle}>Sortierung</div>
            <select
              value={sortMode}
              onChange={event =>
                setSortMode(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="Priorität">
                Priorität
              </option>
              <option value="Neueste">
                Neueste
              </option>
              <option value="Name">
                Name
              </option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('Alle');
              setPriorityFilter('Alle');
              setSortMode('Priorität');
            }}
            style={secondaryButton}
          >
            Zurücksetzen
          </button>
        </div>
      </section>

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

        {!loading && filteredEntries.length === 0 && (
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
          {filteredEntries.map(entry => {
            const player =
              findPlayer(entry.player_id);

            return (
              <article
                key={entry.id}
                style={watchCard}
              >
                <div style={watchCardHeader}>
                  <div style={watchImage}>
                    {player ? (
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
                    ) : (
                      <span style={watchFallback}>
                        {(entry.player_name ?? '?')
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={watchName}>
                      {entry.player_name ??
                        player?.name ??
                        `Spieler ${entry.player_id}`}
                    </div>

                    <div style={watchMeta}>
                      {[
                        player?.current_club,
                        player?.primary_position
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Spielerdaten offen'}
                    </div>

                    <div style={watchBadgeRow}>
                      {entry.status && (
                        <span style={statusChip}>
                          {entry.status}
                        </span>
                      )}
                      {entry.priority && (
                        <span style={priorityChip}>
                          {entry.priority}
                        </span>
                      )}
                    </div>

                    {entry.added_at && (
                      <div style={watchDate}>
                        Seit{' '}
                        {new Date(
                          entry.added_at
                        ).toLocaleDateString(
                          'de-DE'
                        )}
                        {' '}auf der Watchlist
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end'
                    }}
                  >
                    {player &&
                      !player.is_own_squad && (
                        <button
                          type="button"
                          disabled={
                            movingId ===
                            entry.id
                          }
                          onClick={() =>
                            moveToSquad(
                              entry
                            )
                          }
                          style={
                            moveToSquadButton
                          }
                        >
                          {movingId ===
                          entry.id
                            ? 'Wird aufgenommen…'
                            : 'In Kader aufnehmen'}
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={() =>
                        startEdit(entry)
                      }
                      disabled={
                        movingId ===
                        entry.id
                      }
                      style={smallButton}
                    >
                      Bearbeiten
                    </button>

                    <button
                      type="button"
                      disabled={
                        deletingId === entry.id ||
                        movingId === entry.id
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


function findPlayerName(
  players: Player[],
  playerId:
    number |
    string
) {
  return (
    players.find(
      player =>
        String(player.id) ===
        String(playerId)
    )?.name ??
    ''
  );
}

function WatchOverviewCard({
  label,
  value,
  hint,
  accent = false
}: {
  label: string;
  value: number;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        ...watchOverviewCard,
        ...(accent
          ? watchOverviewCardAccent
          : {})
      }}
    >
      <span
        style={{
          ...watchOverviewLabel,
          ...(accent
            ? watchOverviewLabelAccent
            : {})
        }}
      >
        {label}
      </span>

      <strong
        style={{
          ...watchOverviewValue,
          ...(accent
            ? watchOverviewValueAccent
            : {})
        }}
      >
        {value}
      </strong>

      <span
        style={{
          ...watchOverviewHint,
          ...(accent
            ? watchOverviewHintAccent
            : {})
        }}
      >
        {hint}
      </span>
    </div>
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

const watchOverviewGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '10px',
  marginTop: '14px'
};

const watchOverviewCard: React.CSSProperties = {
  border: '1px solid #e4e7e4',
  borderRadius: '12px',
  background: '#fff',
  padding: '12px 14px'
};

const watchOverviewCardAccent: React.CSSProperties = {
  background: '#0b7a3b',
  borderColor: '#0b7a3b'
};

const watchOverviewLabel: React.CSSProperties = {
  display: 'block',
  color: '#777d77',
  fontSize: '9px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.05em'
};

const watchOverviewLabelAccent: React.CSSProperties = {
  color: 'rgba(255,255,255,.76)'
};

const watchOverviewValue: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  color: '#161616',
  fontSize: '22px',
  lineHeight: 1
};

const watchOverviewValueAccent: React.CSSProperties = {
  color: '#fff'
};

const watchOverviewHint: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  color: '#999',
  fontSize: '10px'
};

const watchOverviewHintAccent: React.CSSProperties = {
  color: 'rgba(255,255,255,.72)'
};

const watchDate: React.CSSProperties = {
  marginTop: '7px',
  color: '#8b8f8b',
  fontSize: '10px'
};

const watchFilterGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '10px',
  alignItems: 'end'
};

const watchCard: React.CSSProperties = {
  background: '#fff',
  borderRadius: '16px',
  padding: '16px',
  border: '1px solid #e7e9e7',
  boxShadow: '0 3px 12px rgba(0,0,0,.035)'
};

const watchCardHeader: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
};

const watchImage: React.CSSProperties = {
  width: '58px',
  height: '72px',
  flex: '0 0 auto',
  borderRadius: '10px',
  overflow: 'hidden',
  background: '#f0f2f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const watchFallback: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 900,
  color: '#0b7a3b'
};

const watchName: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  lineHeight: 1.2
};

const watchMeta: React.CSSProperties = {
  marginTop: '5px',
  color: '#666',
  fontSize: '12px'
};

const watchBadgeRow: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  marginTop: '8px'
};

const statusChip: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#edf7f1',
  color: '#0b6b35',
  fontSize: '11px',
  fontWeight: 800
};

const priorityChip: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#f4f4f4',
  color: '#333',
  fontSize: '11px',
  fontWeight: 800
};

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

const moveToSquadButton:
  React.CSSProperties = {
  border:
    '1px solid #0b7a3b',
  background: '#0b7a3b',
  color: '#fff',
  borderRadius: '8px',
  padding: '7px 10px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: '11px'
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
