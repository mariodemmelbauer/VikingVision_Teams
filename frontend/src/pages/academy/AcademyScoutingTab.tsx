import { useState } from 'react';

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

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState<string | undefined>();

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
    [...players].sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          'de'
        )
    );

  return (
    <section style={{ marginTop: '18px' }}>
      <section
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
            {players.length} Scouting-Spieler
          </strong>
          <span
            style={{
              marginLeft: '12px',
              color: '#666'
            }}
          >
            {reports.length} Berichte
          </span>
        </div>

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
      </section>

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
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '14px',
          marginTop: '18px'
        }}
      >
        {reports.map(report => (
          <article
            key={report.id}
            style={panel}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                gap: '12px'
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

              {report.potential_rating != null && (
                <span style={roleBadge}>
                  Potenzial{' '}
                  {report.potential_rating}/5
                </span>
              )}
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
      </section>
    </section>
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

const panel: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ececec',
  borderRadius: '14px',
  padding: '18px',
  boxShadow: '0 3px 14px rgba(0,0,0,0.04)'
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
