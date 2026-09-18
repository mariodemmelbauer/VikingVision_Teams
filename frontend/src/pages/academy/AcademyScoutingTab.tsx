import { useMemo, useState } from 'react';

type AcademyScoutingPlayer = {
  id: number;
  name: string;
  birth_date?: string;
  birth_year?: number;
  current_club?: string;
  primary_position?: string;
  secondary_position?: string;
  preferred_foot?: string;
  nationality?: string;
  height_cm?: number;
  notes?: string;
};

type AcademyScoutingReport = {
  id: number;
  player_id: number;
  player_name?: string;
  scout_name?: string;
  observation_date: string;
  competition?: string;
  match_name?: string;
  opponent?: string;
  observed_position?: string;
  minutes_played?: number;
  technical_rating?: number;
  tactical_rating?: number;
  athletic_rating?: number;
  mentality_rating?: number;
  potential_rating?: number;
  strengths?: string;
  development_areas?: string;
  overall_impression?: string;
  recommendation?: string;
  next_action?: string;
};

export default function AcademyScoutingTab({
  accessToken,
  apiBase,
  players,
  reports,
  onReload
}: {
  accessToken?: string;
  apiBase: string;
  players: AcademyScoutingPlayer[];
  reports: AcademyScoutingReport[];
  onReload: () => Promise<void>;
}) {
  const [showForm, setShowForm] =
    useState(false);


  const [showPlayerForm, setShowPlayerForm] =
    useState(false);

  const [savingPlayer, setSavingPlayer] =
    useState(false);

  const [playerFormError, setPlayerFormError] =
    useState<string | undefined>();

  const [playerForm, setPlayerForm] =
    useState({
      name: '',
      birth_date: '',
      current_club: '',
      primary_position: '',
      secondary_position: '',
      preferred_foot: '',
      nationality: '',
      height_cm: '',
      notes: ''
    });

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState<string | undefined>();


  const [search, setSearch] =
    useState('');

  const [playerFilter, setPlayerFilter] =
    useState('Alle');

  const [positionFilter, setPositionFilter] =
    useState('Alle');

  const [sortMode, setSortMode] =
    useState('Neueste');

  const [form, setForm] =
    useState({
      player_id: '',
      scout_name: '',
      observation_date:
        new Date()
          .toISOString()
          .slice(0, 10),
      competition: '',
      match_name: '',
      opponent: '',
      observed_position: '',
      minutes_played: '',
      technical_rating: '',
      tactical_rating: '',
      athletic_rating: '',
      mentality_rating: '',
      potential_rating: '',
      strengths: '',
      development_areas: '',
      overall_impression: '',
      recommendation: '',
      next_action: ''
    });

  function updatePlayerField(
    field: keyof typeof playerForm,
    value: string
  ) {
    setPlayerForm(current => ({
      ...current,
      [field]: value
    }));
  }

  function resetPlayerForm() {
    setPlayerForm({
      name: '',
      birth_date: '',
      current_club: '',
      primary_position: '',
      secondary_position: '',
      preferred_foot: '',
      nationality: '',
      height_cm: '',
      notes: ''
    });

    setPlayerFormError(undefined);
  }

  async function saveScoutingPlayer() {
    if (!accessToken) {
      setPlayerFormError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    if (!playerForm.name.trim()) {
      setPlayerFormError(
        'Name ist ein Pflichtfeld.'
      );
      return;
    }

    setSavingPlayer(true);
    setPlayerFormError(undefined);

    const birthYear =
      playerForm.birth_date
        ? Number(
            playerForm.birth_date
              .slice(0, 4)
          )
        : null;

    const height =
      playerForm.height_cm === ''
        ? null
        : Number(
            playerForm.height_cm
          );

    try {
      const response =
        await fetch(
          `${apiBase}/academy/scouting/players`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              name:
                playerForm.name.trim(),
              birth_date:
                playerForm.birth_date ||
                null,
              birth_year:
                Number.isFinite(
                  birthYear
                )
                  ? birthYear
                  : null,
              current_club:
                playerForm.current_club ||
                null,
              primary_position:
                playerForm.primary_position ||
                null,
              secondary_position:
                playerForm.secondary_position ||
                null,
              preferred_foot:
                playerForm.preferred_foot ||
                null,
              nationality:
                playerForm.nationality ||
                null,
              height_cm:
                Number.isFinite(height)
                  ? height
                  : null,
              notes:
                playerForm.notes ||
                null
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Scouting-Spieler konnte nicht angelegt werden.'
        );
      }

      setShowPlayerForm(false);
      resetPlayerForm();

      await onReload();

      if (data?.player?.id != null) {
        setPlayerFilter(
          String(data.player.id)
        );
      }
    } catch (err) {
      setPlayerFormError(
        err instanceof Error
          ? err.message
          : 'Spieler konnte nicht gespeichert werden.'
      );
    } finally {
      setSavingPlayer(false);
    }
  }

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  }

  async function saveReport() {
    if (!accessToken) {
      setFormError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    if (
      !form.player_id ||
      !form.observation_date
    ) {
      setFormError(
        'Spieler und Beobachtungsdatum sind Pflichtfelder.'
      );
      return;
    }

    setSaving(true);
    setFormError(undefined);

    const numberOrNull =
      (value: string) =>
        value === ''
          ? null
          : Number(value);

    try {
      const response =
        await fetch(
          `${apiBase}/academy/scouting/reports`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              player_id:
                Number(form.player_id),
              scout_name:
                form.scout_name || null,
              observation_date:
                form.observation_date,
              competition:
                form.competition || null,
              match_name:
                form.match_name || null,
              opponent:
                form.opponent || null,
              observed_position:
                form.observed_position || null,
              minutes_played:
                numberOrNull(
                  form.minutes_played
                ),
              technical_rating:
                numberOrNull(
                  form.technical_rating
                ),
              tactical_rating:
                numberOrNull(
                  form.tactical_rating
                ),
              athletic_rating:
                numberOrNull(
                  form.athletic_rating
                ),
              mentality_rating:
                numberOrNull(
                  form.mentality_rating
                ),
              potential_rating:
                numberOrNull(
                  form.potential_rating
                ),
              strengths:
                form.strengths || null,
              development_areas:
                form.development_areas || null,
              overall_impression:
                form.overall_impression || null,
              recommendation:
                form.recommendation || null,
              next_action:
                form.next_action || null
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Scoutingbericht konnte nicht gespeichert werden.'
        );
      }

      setShowForm(false);
      setForm({
        player_id: '',
        scout_name: '',
        observation_date:
          new Date()
            .toISOString()
            .slice(0, 10),
        competition: '',
        match_name: '',
        opponent: '',
        observed_position: '',
        minutes_played: '',
        technical_rating: '',
        tactical_rating: '',
        athletic_rating: '',
        mentality_rating: '',
        potential_rating: '',
        strengths: '',
        development_areas: '',
        overall_impression: '',
        recommendation: '',
        next_action: ''
      });

      await onReload();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Speichern fehlgeschlagen.'
      );
    } finally {
      setSaving(false);
    }
  }

  const sortedPlayers =
    useMemo(
      () =>
        [...players].sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              'de'
            )
        ),
      [players]
    );

  const sortedReports =
    useMemo(
      () =>
        [...reports].sort(
          (a, b) =>
            String(
              b.observation_date ?? ''
            ).localeCompare(
              String(
                a.observation_date ?? ''
              )
            )
        ),
      [reports]
    );

  const positions =
    useMemo(
      () => [
        'Alle',
        ...Array.from(
          new Set(
            [
              ...players.map(
                player =>
                  player.primary_position
              ),
              ...reports.map(
                report =>
                  report.observed_position
              )
            ].filter(
              (value): value is string =>
                Boolean(value)
            )
          )
        ).sort(
          (a, b) =>
            a.localeCompare(
              b,
              'de'
            )
        )
      ],
      [players, reports]
    );

  const playerReportInfo =
    useMemo(
      () =>
        sortedPlayers.map(player => {
          const playerReports =
            sortedReports.filter(
              report =>
                report.player_id ===
                player.id
            );

          return {
            player,
            reportCount:
              playerReports.length,
            latestReport:
              playerReports[0]
          };
        }),
      [sortedPlayers, sortedReports]
    );

  const playersWithReports =
    playerReportInfo.filter(
      item => item.reportCount > 0
    ).length;

  const playersWithoutReports =
    Math.max(
      players.length -
      playersWithReports,
      0
    );

  const recommendedReports =
    reports.filter(
      report =>
        Boolean(
          report.recommendation?.trim()
        )
    ).length;

  const nextActionReports =
    reports.filter(
      report =>
        Boolean(
          report.next_action?.trim()
        )
    ).length;

  const filteredReports =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLocaleLowerCase(
              'de'
            );

        const result =
          sortedReports.filter(
            report => {
              const reportPlayer =
                players.find(
                  player =>
                    String(player.id) ===
                    String(report.player_id)
                );

              const matchesSearch =
                !query ||
                [
                  report.player_name,
                  report.scout_name,
                  report.competition,
                  report.match_name,
                  report.opponent,
                  report.observed_position,
                  report.strengths,
                  report.development_areas,
                  report.overall_impression,
                  report.recommendation,
                  report.next_action,
                  reportPlayer?.name,
                  reportPlayer?.current_club,
                  reportPlayer?.primary_position
                ]
                  .filter(Boolean)
                  .some(value =>
                    String(value)
                      .toLocaleLowerCase('de')
                      .includes(query)
                  );

              const matchesPlayer =
                playerFilter === 'Alle' ||
                String(report.player_id) ===
                  playerFilter;

              const matchesPosition =
                positionFilter === 'Alle' ||
                report.observed_position ===
                  positionFilter ||
                reportPlayer?.primary_position ===
                  positionFilter;

              return (
                matchesSearch &&
                matchesPlayer &&
                matchesPosition
              );
            }
          );

        return result.sort(
          (a, b) => {
            if (
              sortMode ===
              'Potenzial'
            ) {
              return (
                Number(
                  b.potential_rating ??
                  -1
                ) -
                Number(
                  a.potential_rating ??
                  -1
                )
              );
            }

            if (
              sortMode ===
              'Name'
            ) {
              return String(
                a.player_name ??
                ''
              ).localeCompare(
                String(
                  b.player_name ??
                  ''
                ),
                'de'
              );
            }

            return String(
              b.observation_date ??
              ''
            ).localeCompare(
              String(
                a.observation_date ??
                ''
              )
            );
          }
        );
      },
      [
        sortedReports,
        search,
        playerFilter,
        positionFilter,
        players,
        sortMode
      ]
    );

  function resetFilters() {
    setSearch('');
    setPlayerFilter('Alle');
    setPositionFilter('Alle');
    setSortMode('Neueste');
  }

  return (
    <section style={{ marginTop: '18px' }}>
      <section style={scoutingOverviewGrid}>
        <ScoutingOverviewCard
          label="Spieler"
          value={players.length}
          hint="im Academy-Scouting"
          accent
        />

        <ScoutingOverviewCard
          label="Mit Bericht"
          value={playersWithReports}
          hint="bereits beobachtet"
        />

        <ScoutingOverviewCard
          label="Ohne Bericht"
          value={playersWithoutReports}
          hint="noch offen"
        />

        <ScoutingOverviewCard
          label="Empfehlung"
          value={recommendedReports}
          hint="Berichte"
        />

        <ScoutingOverviewCard
          label="Nächste Aktion"
          value={nextActionReports}
          hint="definiert"
        />
      </section>

      <section
        style={{
          ...panel,
          marginTop: '14px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <div>
            <strong>
              Academy-Scouting
            </strong>

            <div
              style={{
                marginTop: '4px',
                color: '#777',
                fontSize: '13px'
              }}
            >
              Spielerübersicht und Beobachtungsberichte
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowPlayerForm(
                  value => !value
                );

                if (!showPlayerForm) {
                  resetPlayerForm();
                }
              }}
              style={secondaryButton}
            >
              + Spieler anlegen
            </button>

            <button
              type="button"
              onClick={() =>
                setShowForm(
                  value => !value
                )
              }
              style={primaryButton}
            >
              + Neuer Bericht
            </button>
          </div>
        </div>

        <div
          className="academy-scouting-filters"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(220px, 2fr) repeat(3, minmax(150px, 1fr)) auto',
            gap: '10px',
            alignItems: 'end',
            marginTop: '14px'
          }}
        >
          <Field label="Suche">
            <input
              value={search}
              onChange={event =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Spieler, Scout, Gegner, Empfehlung …"
              style={inputStyle}
            />
          </Field>

          <Field label="Spieler">
            <select
              value={playerFilter}
              onChange={event =>
                setPlayerFilter(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="Alle">
                Alle
              </option>

              {sortedPlayers.map(
                player => (
                  <option
                    key={player.id}
                    value={String(player.id)}
                  >
                    {player.name}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field label="Position">
            <select
              value={positionFilter}
              onChange={event =>
                setPositionFilter(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              {positions.map(
                position => (
                  <option
                    key={position}
                    value={position}
                  >
                    {position}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field label="Sortierung">
            <select
              value={sortMode}
              onChange={event =>
                setSortMode(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="Neueste">
                Neueste
              </option>
              <option value="Potenzial">
                Potenzial
              </option>
              <option value="Name">
                Name
              </option>
            </select>
          </Field>

          <button
            type="button"
            onClick={resetFilters}
            style={secondaryButton}
          >
            Zurücksetzen
          </button>
        </div>
      </section>

      <section
        style={{
          marginTop: '16px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px',
            alignItems: 'baseline',
            flexWrap: 'wrap'
          }}
        >
          <strong>
            Scouting-Spieler
          </strong>

          <span
            style={{
              color: '#777',
              fontSize: '12px'
            }}
          >
            Klick auf einen Spieler filtert die Berichte
          </span>
        </div>

        <div
          className="academy-scouting-player-grid"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '10px',
            marginTop: '9px'
          }}
        >
          {playerReportInfo.map(
            ({
              player,
              reportCount,
              latestReport
            }) => (
              <button
                key={player.id}
                type="button"
                onClick={() =>
                  setPlayerFilter(
                    String(player.id)
                  )
                }
                style={{
                  ...scoutingPlayerCard,
                  borderColor:
                    playerFilter ===
                    String(player.id)
                      ? '#0b7a3b'
                      : '#ececec',
                  boxShadow:
                    playerFilter ===
                    String(player.id)
                      ? '0 0 0 1px #0b7a3b'
                      : '0 3px 10px rgba(0,0,0,.025)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    gap: '8px',
                    alignItems:
                      'flex-start'
                  }}
                >
                  <div>
                    <strong>
                      {player.name}
                    </strong>

                    <div
                      style={{
                        marginTop: '3px',
                        color: '#777',
                        fontSize: '12px'
                      }}
                    >
                      {[
                        player.primary_position,
                        player.current_club
                      ]
                        .filter(Boolean)
                        .join(' · ') ||
                        'Keine Stammdaten'}
                    </div>
                  </div>

                  <span style={roleBadge}>
                    {reportCount}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: '10px',
                    color: '#666',
                    fontSize: '12px'
                  }}
                >
                  {latestReport
                    ? `Letzte Beobachtung: ${formatDate(
                        latestReport.observation_date
                      )}`
                    : 'Noch kein Bericht'}
                </div>
              </button>
            )
          )}
        </div>
      </section>

      {showPlayerForm && (
        <section
          style={{
            ...panel,
            marginTop: '14px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>
                Scouting-Spieler anlegen
              </h3>

              <div
                style={{
                  marginTop: '4px',
                  color: '#777',
                  fontSize: '13px'
                }}
              >
                Der Spieler wird in der Academy-Scouting-Datenbank gespeichert und steht danach direkt für Berichte zur Verfügung.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPlayerForm(false);
                resetPlayerForm();
              }}
              style={secondaryButton}
            >
              Schließen
            </button>
          </div>

          {playerFormError && (
            <div style={errorBox}>
              {playerFormError}
            </div>
          )}

          <div
            className="academy-scouting-player-form"
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, minmax(0, 1fr))',
              gap: '12px',
              marginTop: '16px'
            }}
          >
            <Field label="Name *">
              <input
                value={playerForm.name}
                onChange={event =>
                  updatePlayerField(
                    'name',
                    event.target.value
                  )
                }
                placeholder="Vorname Nachname"
                style={inputStyle}
              />
            </Field>

            <Field label="Geburtsdatum">
              <input
                type="date"
                value={playerForm.birth_date}
                onChange={event =>
                  updatePlayerField(
                    'birth_date',
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Aktueller Verein">
              <input
                value={playerForm.current_club}
                onChange={event =>
                  updatePlayerField(
                    'current_club',
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Nationalität">
              <input
                value={playerForm.nationality}
                onChange={event =>
                  updatePlayerField(
                    'nationality',
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Hauptposition">
              <input
                value={playerForm.primary_position}
                onChange={event =>
                  updatePlayerField(
                    'primary_position',
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Nebenposition">
              <input
                value={playerForm.secondary_position}
                onChange={event =>
                  updatePlayerField(
                    'secondary_position',
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Starker Fuß">
              <select
                value={playerForm.preferred_foot}
                onChange={event =>
                  updatePlayerField(
                    'preferred_foot',
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  –
                </option>
                <option value="Rechts">
                  Rechts
                </option>
                <option value="Links">
                  Links
                </option>
                <option value="Beidfüßig">
                  Beidfüßig
                </option>
              </select>
            </Field>

            <Field label="Größe (cm)">
              <input
                type="number"
                min="120"
                max="230"
                value={playerForm.height_cm}
                onChange={event =>
                  updatePlayerField(
                    'height_cm',
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </Field>

            <div
              style={{
                gridColumn: '1 / -1'
              }}
            >
              <Field label="Notizen">
                <textarea
                  rows={4}
                  value={playerForm.notes}
                  onChange={event =>
                    updatePlayerField(
                      'notes',
                      event.target.value
                    )
                  }
                  style={{
                    ...inputStyle,
                    resize: 'vertical'
                  }}
                />
              </Field>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '16px'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowPlayerForm(false);
                resetPlayerForm();
              }}
              style={secondaryButton}
            >
              Abbrechen
            </button>

            <button
              type="button"
              onClick={saveScoutingPlayer}
              disabled={savingPlayer}
              style={primaryButton}
            >
              {savingPlayer
                ? 'Speichert…'
                : 'Spieler anlegen'}
            </button>
          </div>
        </section>
      )}

      {showForm && (
        <section
          style={{
            ...panel,
            marginTop: '16px'
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Academy-Scoutingbericht
          </h2>

          {formError && (
            <div style={errorBox}>
              {formError}
            </div>
          )}

          <div style={scoutingFormGrid}>
            <Field label="Spieler">
              <select
                value={form.player_id}
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

                {sortedPlayers.map(
                  player => (
                    <option
                      key={player.id}
                      value={player.id}
                    >
                      {player.name}
                      {player.current_club
                        ? ` · ${player.current_club}`
                        : ''}
                    </option>
                  )
                )}
              </select>
            </Field>

            <TextInput
              label="Scout"
              value={form.scout_name}
              onChange={value =>
                updateField(
                  'scout_name',
                  value
                )
              }
            />

            <Field label="Datum">
              <input
                type="date"
                value={
                  form.observation_date
                }
                onChange={event =>
                  updateField(
                    'observation_date',
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </Field>

            <TextInput
              label="Bewerb"
              value={form.competition}
              onChange={value =>
                updateField(
                  'competition',
                  value
                )
              }
            />

            <TextInput
              label="Spiel"
              value={form.match_name}
              onChange={value =>
                updateField(
                  'match_name',
                  value
                )
              }
            />

            <TextInput
              label="Gegner"
              value={form.opponent}
              onChange={value =>
                updateField(
                  'opponent',
                  value
                )
              }
            />

            <TextInput
              label="Beobachtete Position"
              value={
                form.observed_position
              }
              onChange={value =>
                updateField(
                  'observed_position',
                  value
                )
              }
            />

            <TextInput
              label="Minuten"
              value={
                form.minutes_played
              }
              type="number"
              onChange={value =>
                updateField(
                  'minutes_played',
                  value
                )
              }
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '10px',
              marginTop: '14px'
            }}
          >
            {[
              ['technical_rating', 'Technik'],
              ['tactical_rating', 'Taktik'],
              ['athletic_rating', 'Athletik'],
              ['mentality_rating', 'Mentalität'],
              ['potential_rating', 'Potenzial']
            ].map(([key, label]) => (
              <Field
                key={key}
                label={`${label} (1–5)`}
              >
                <select
                  value={
                    form[
                      key as keyof typeof form
                    ]
                  }
                  onChange={event =>
                    updateField(
                      key as keyof typeof form,
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">–</option>
                  {[1,2,3,4,5].map(
                    value => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    )
                  )}
                </select>
              </Field>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gap: '12px',
              marginTop: '14px'
            }}
          >
            <Area
              label="Stärken"
              value={form.strengths}
              onChange={value =>
                updateField(
                  'strengths',
                  value
                )
              }
            />

            <Area
              label="Entwicklungsfelder"
              value={
                form.development_areas
              }
              onChange={value =>
                updateField(
                  'development_areas',
                  value
                )
              }
            />

            <Area
              label="Gesamteindruck"
              value={
                form.overall_impression
              }
              onChange={value =>
                updateField(
                  'overall_impression',
                  value
                )
              }
            />

            <Area
              label="Empfehlung"
              value={
                form.recommendation
              }
              onChange={value =>
                updateField(
                  'recommendation',
                  value
                )
              }
            />

            <Area
              label="Nächster Schritt"
              value={
                form.next_action
              }
              onChange={value =>
                updateField(
                  'next_action',
                  value
                )
              }
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px'
            }}
          >
            <button
              type="button"
              onClick={saveReport}
              disabled={saving}
              style={primaryButton}
            >
              {saving
                ? 'Speichert…'
                : 'Bericht speichern'}
            </button>

            <button
              type="button"
              onClick={() =>
                setShowForm(false)
              }
              style={secondaryButton}
            >
              Abbrechen
            </button>
          </div>
        </section>
      )}

      <section
        style={{
          marginTop: '20px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            gap: '10px',
            flexWrap: 'wrap',
            alignItems: 'baseline'
          }}
        >
          <strong>
            Berichte
          </strong>

          <span
            style={{
              color: '#777',
              fontSize: '12px'
            }}
          >
            {filteredReports.length} von {reports.length}
          </span>
        </div>

        {filteredReports.length === 0 ? (
          <div
            style={{
              ...panel,
              marginTop: '10px',
              color: '#777'
            }}
          >
            Keine Scoutingberichte für die gewählten Filter gefunden.
          </div>
        ) : (
          <div
            className="academy-scouting-report-grid"
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '14px',
              marginTop: '10px'
            }}
          >
            {filteredReports.map(report => (

          <article
            key={report.id}
            style={panel}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                gap: '12px',
                alignItems:
                  'flex-start'
              }}
            >
              <div>
                <strong
                  style={{
                    fontSize: '18px'
                  }}
                >
                  {report.player_name ??
                    `Spieler ${report.player_id}`}
                </strong>

                <div
                  style={{
                    marginTop: '4px',
                    color: '#777',
                    fontSize: '12px'
                  }}
                >
                  {formatDate(
                    report.observation_date
                  )}
                  {report.scout_name
                    ? ` · ${report.scout_name}`
                    : ''}
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
                <span style={academyAverageBadge}>
                  Ø{' '}
                  {(() => {
                    const values = [
                      report.technical_rating,
                      report.tactical_rating,
                      report.athletic_rating,
                      report.mentality_rating,
                      report.potential_rating
                    ].filter(
                      (value): value is number =>
                        typeof value === 'number'
                    );

                    return values.length > 0
                      ? (
                          values.reduce(
                            (sum, value) =>
                              sum + value,
                            0
                          ) /
                          values.length
                        ).toFixed(1)
                      : '–';
                  })()}
                </span>

                {report.potential_rating != null && (
                  <span style={roleBadge}>
                    Potenzial{' '}
                    {report.potential_rating}/5
                  </span>
                )}
              </div>
            </div>

            <InfoLine
              label="Position"
              value={
                report.observed_position
              }
            />

            <InfoLine
              label="Bewerb"
              value={
                report.competition
              }
            />

            <InfoLine
              label="Spiel"
              value={
                report.match_name ??
                report.opponent
              }
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2, 1fr)',
                gap: '8px',
                marginTop: '12px'
              }}
            >
              <RatingBox
                label="Technik"
                value={
                  report.technical_rating
                }
              />
              <RatingBox
                label="Taktik"
                value={
                  report.tactical_rating
                }
              />
              <RatingBox
                label="Athletik"
                value={
                  report.athletic_rating
                }
              />
              <RatingBox
                label="Mentalität"
                value={
                  report.mentality_rating
                }
              />
            </div>

            {report.strengths && (
              <TextBlock
                label="Stärken"
                value={report.strengths}
              />
            )}

            {report.development_areas && (
              <TextBlock
                label="Entwicklungsfelder"
                value={
                  report.development_areas
                }
              />
            )}

            {report.overall_impression && (
              <TextBlock
                label="Gesamteindruck"
                value={
                  report.overall_impression
                }
              />
            )}

            {report.recommendation && (
              <TextBlock
                label="Empfehlung"
                value={
                  report.recommendation
                }
              />
            )}

            {report.next_action && (
              <TextBlock
                label="Nächster Schritt"
                value={
                  report.next_action
                }
              />
            )}
          </article>
        
            ))}
          </div>
        )}
      </section>
    </section>
  );
}


function ScoutingOverviewCard({
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
        ...scoutingOverviewCard,
        ...(accent
          ? scoutingOverviewCardAccent
          : {})
      }}
    >
      <span
        style={{
          ...scoutingOverviewLabel,
          ...(accent
            ? scoutingOverviewLabelAccent
            : {})
        }}
      >
        {label}
      </span>

      <strong
        style={{
          ...scoutingOverviewValue,
          ...(accent
            ? scoutingOverviewValueAccent
            : {})
        }}
      >
        {value}
      </strong>

      <span
        style={{
          ...scoutingOverviewHint,
          ...(accent
            ? scoutingOverviewHintAccent
            : {})
        }}
      >
        {hint}
      </span>
    </div>
  );
}


function ScoutingKpi({
  label,
  value
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={scoutingKpiCard}>
      <div
        style={{
          color: '#777',
          fontSize: '11px',
          textTransform: 'uppercase',
          fontWeight: 700
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: '5px',
          fontSize: '26px',
          fontWeight: 900
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <div style={fieldLabel}>
        {label}
      </div>
      {children}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        style={inputStyle}
      />
    </Field>
  );
}

function Area({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        rows={3}
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        style={{
          ...inputStyle,
          resize: 'vertical'
        }}
      />
    </Field>
  );
}

function RatingBox({
  label,
  value
}: {
  label: string;
  value?: number;
}) {
  return (
    <div
      style={{
        background: '#f6f8f7',
        borderRadius: '8px',
        padding: '9px'
      }}
    >
      <div
        style={{
          color: '#777',
          fontSize: '11px',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>
      <strong>
        {value ?? '–'}
        {value != null ? '/5' : ''}
      </strong>
    </div>
  );
}

function TextBlock({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={{ marginTop: '12px' }}>
      <strong>{label}</strong>
      <div
        style={{
          marginTop: '4px',
          whiteSpace: 'pre-wrap'
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InfoLine({
  label,
  value
}: {
  label: string;
  value?: string;
}) {
  if (!value) return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        marginTop: '9px',
        paddingTop: '9px',
        borderTop: '1px solid #f0f0f0',
        fontSize: '13px'
      }}
    >
      <span style={{ color: '#777' }}>
        {label}
      </span>
      <strong style={{ textAlign: 'right' }}>
        {value}
      </strong>
    </div>
  );
}

function formatDate(value: string) {
  const date =
    new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('de-DE');
}

const scoutingOverviewGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(5, minmax(0, 1fr))',
  gap: '10px'
};

const scoutingOverviewCard: React.CSSProperties = {
  border: '1px solid #e4e7e4',
  borderRadius: '12px',
  background: '#fff',
  padding: '12px 14px'
};

const scoutingOverviewCardAccent: React.CSSProperties = {
  background: '#0b7a3b',
  borderColor: '#0b7a3b'
};

const scoutingOverviewLabel: React.CSSProperties = {
  display: 'block',
  color: '#7c827c',
  fontSize: '9px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.05em'
};

const scoutingOverviewLabelAccent: React.CSSProperties = {
  color: 'rgba(255,255,255,.76)'
};

const scoutingOverviewValue: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  color: '#161616',
  fontSize: '22px',
  lineHeight: 1
};

const scoutingOverviewValueAccent: React.CSSProperties = {
  color: '#fff'
};

const scoutingOverviewHint: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  color: '#999',
  fontSize: '10px'
};

const scoutingOverviewHintAccent: React.CSSProperties = {
  color: 'rgba(255,255,255,.7)'
};

const academyAverageBadge: React.CSSProperties = {
  borderRadius: '999px',
  padding: '5px 9px',
  background: '#0b7a3b',
  color: '#fff',
  fontSize: '11px',
  fontWeight: 900
};

const panel: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ececec',
  borderRadius: '14px',
  padding: '18px',
  boxShadow: '0 3px 14px rgba(0,0,0,0.04)'
};


const scoutingKpiCard: React.CSSProperties = {
  ...panel,
  padding: '15px'
};

const scoutingPlayerCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ececec',
  borderRadius: '12px',
  padding: '13px',
  textAlign: 'left',
  cursor: 'pointer',
  color: 'inherit',
  font: 'inherit'
};

const fieldLabel: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  textTransform: 'uppercase',
  fontWeight: 700,
  marginBottom: '5px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #d5d5d5',
  borderRadius: '8px',
  padding: '10px',
  background: '#fff',
  font: 'inherit'
};

const primaryButton: React.CSSProperties = {
  border: 'none',
  background: '#0b7a3b',
  color: '#fff',
  padding: '11px 16px',
  borderRadius: '9px',
  cursor: 'pointer',
  fontWeight: 700
};

const secondaryButton: React.CSSProperties = {
  border: '1px solid #d0d0d0',
  background: '#fff',
  color: '#222',
  padding: '12px 18px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 700
};

const errorBox: React.CSSProperties = {
  marginTop: '14px',
  padding: '12px 16px',
  background: '#fff3f3',
  color: '#a00000',
  borderRadius: '10px'
};

const roleBadge: React.CSSProperties = {
  background: '#f0f4f2',
  borderRadius: '999px',
  padding: '5px 9px',
  fontSize: '11px',
  fontWeight: 700
};

const scoutingFormGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '12px'
};
