import { useEffect, useMemo, useState } from 'react';
import type { Player } from './PlayerProfile';

export type ScoutingReport = {
  id: number | string;
  player_id: number | string;
  player_name?: string;
  scout_name?: string;
  observation_date?: string;
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
  created_at?: string;
  updated_at?: string;
};

type Props = {
  accessToken?: string;
  apiBase: string;
  players: Player[];
  currentScoutName?: string;
  onBack: () => void;
};

type FormState = {
  player_id: string;
  scout_name: string;
  observation_date: string;
  competition: string;
  match_name: string;
  opponent: string;
  observed_position: string;
  minutes_played: string;
  technical_rating: string;
  tactical_rating: string;
  athletic_rating: string;
  mentality_rating: string;
  potential_rating: string;
  strengths: string;
  development_areas: string;
  overall_impression: string;
  recommendation: string;
  next_action: string;
};

const emptyForm: FormState = {
  player_id: '',
  scout_name: '',
  observation_date: '',
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
};

export default function ScoutingReports({
  accessToken,
  apiBase,
  players,
  currentScoutName,
  onBack
}: Props) {
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<FormState>({
    ...emptyForm,
    scout_name: currentScoutName ?? ''
  });

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
    loadReports();
  }, []);

  async function loadReports() {
    if (!accessToken) {
      setError('Kein Teams-SSO-Token vorhanden.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch(
        `${apiBase}/scouting-reports`,
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
            'Scoutingberichte konnten nicht geladen werden.'
        );
      }

      setReports(
        Array.isArray(data.reports)
          ? data.reports
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Scoutingberichte konnten nicht geladen werden.'
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

  function startNewReport() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      scout_name: currentScoutName ?? ''
    });
    setError(undefined);
    setSuccess(undefined);
    setShowForm(true);
  }

  function startEdit(report: ScoutingReport) {
    setEditingId(report.id);
    setForm({
      player_id: String(report.player_id ?? ''),
      scout_name: report.scout_name ?? '',
      observation_date: report.observation_date ?? '',
      competition: report.competition ?? '',
      match_name: report.match_name ?? '',
      opponent: report.opponent ?? '',
      observed_position: report.observed_position ?? '',
      minutes_played:
        report.minutes_played == null
          ? ''
          : String(report.minutes_played),
      technical_rating:
        report.technical_rating == null
          ? ''
          : String(report.technical_rating),
      tactical_rating:
        report.tactical_rating == null
          ? ''
          : String(report.tactical_rating),
      athletic_rating:
        report.athletic_rating == null
          ? ''
          : String(report.athletic_rating),
      mentality_rating:
        report.mentality_rating == null
          ? ''
          : String(report.mentality_rating),
      potential_rating:
        report.potential_rating == null
          ? ''
          : String(report.potential_rating),
      strengths: report.strengths ?? '',
      development_areas: report.development_areas ?? '',
      overall_impression: report.overall_impression ?? '',
      recommendation: report.recommendation ?? '',
      next_action: report.next_action ?? ''
    });
    setError(undefined);
    setSuccess(undefined);
    setShowForm(true);
  }

  function cancelForm() {
    setEditingId(null);
    setShowForm(false);
    setError(undefined);
    setSuccess(undefined);
  }

  function nullableInt(value: string) {
    if (value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async function saveReport() {
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

    const body = {
      player_id: Number(form.player_id),
      scout_name: form.scout_name || null,
      observation_date: form.observation_date || null,
      competition: form.competition || null,
      match_name: form.match_name || null,
      opponent: form.opponent || null,
      observed_position: form.observed_position || null,
      minutes_played: nullableInt(form.minutes_played),
      technical_rating: nullableInt(form.technical_rating),
      tactical_rating: nullableInt(form.tactical_rating),
      athletic_rating: nullableInt(form.athletic_rating),
      mentality_rating: nullableInt(form.mentality_rating),
      potential_rating: nullableInt(form.potential_rating),
      strengths: form.strengths || null,
      development_areas: form.development_areas || null,
      overall_impression: form.overall_impression || null,
      recommendation: form.recommendation || null,
      next_action: form.next_action || null
    };

    try {
      const isEdit = editingId !== null;
      const url = isEdit
        ? `${apiBase}/scouting-reports/${editingId}`
        : `${apiBase}/scouting-reports`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            'Scoutingbericht konnte nicht gespeichert werden.'
        );
      }

      setSuccess(
        isEdit
          ? 'Scoutingbericht wurde aktualisiert.'
          : 'Scoutingbericht wurde angelegt.'
      );

      setShowForm(false);
      setEditingId(null);
      await loadReports();
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

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">
            SV Oberbank Ried
          </div>

          <h1>Scoutingberichte</h1>

          <p>
            Beobachtungen und Bewertungen dokumentieren
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
            onClick={startNewReport}
            style={primaryButton}
          >
            + Neuer Bericht
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
                ? 'Neuer Scoutingbericht'
                : 'Scoutingbericht bearbeiten'}
            </h2>

            <div
              style={{
                display: 'flex',
                gap: '8px'
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
              label="Scout"
              value={form.scout_name}
              onChange={value =>
                updateField('scout_name', value)
              }
            />

            <TextField
              label="Beobachtungsdatum"
              type="date"
              value={form.observation_date}
              onChange={value =>
                updateField(
                  'observation_date',
                  value
                )
              }
            />

            <TextField
              label="Wettbewerb"
              value={form.competition}
              onChange={value =>
                updateField('competition', value)
              }
            />

            <TextField
              label="Spiel"
              value={form.match_name}
              onChange={value =>
                updateField('match_name', value)
              }
            />

            <TextField
              label="Gegner"
              value={form.opponent}
              onChange={value =>
                updateField('opponent', value)
              }
            />

            <TextField
              label="Beobachtete Position"
              value={form.observed_position}
              onChange={value =>
                updateField(
                  'observed_position',
                  value
                )
              }
            />

            <TextField
              label="Minuten gespielt"
              type="number"
              value={form.minutes_played}
              onChange={value =>
                updateField(
                  'minutes_played',
                  value
                )
              }
            />
          </div>

          <h3 style={{ marginTop: '24px' }}>
            Bewertungen (1–5)
          </h3>

          <div style={ratingsGrid}>
            <RatingField
              label="Technik"
              value={form.technical_rating}
              onChange={value =>
                updateField(
                  'technical_rating',
                  value
                )
              }
            />

            <RatingField
              label="Taktik"
              value={form.tactical_rating}
              onChange={value =>
                updateField(
                  'tactical_rating',
                  value
                )
              }
            />

            <RatingField
              label="Athletik"
              value={form.athletic_rating}
              onChange={value =>
                updateField(
                  'athletic_rating',
                  value
                )
              }
            />

            <RatingField
              label="Mentalität"
              value={form.mentality_rating}
              onChange={value =>
                updateField(
                  'mentality_rating',
                  value
                )
              }
            />

            <RatingField
              label="Potenzial"
              value={form.potential_rating}
              onChange={value =>
                updateField(
                  'potential_rating',
                  value
                )
              }
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, minmax(0, 1fr))',
              gap: '14px',
              marginTop: '20px'
            }}
          >
            <TextAreaField
              label="Stärken"
              value={form.strengths}
              onChange={value =>
                updateField('strengths', value)
              }
            />

            <TextAreaField
              label="Entwicklungsfelder"
              value={form.development_areas}
              onChange={value =>
                updateField(
                  'development_areas',
                  value
                )
              }
            />

            <TextAreaField
              label="Gesamteindruck"
              value={form.overall_impression}
              onChange={value =>
                updateField(
                  'overall_impression',
                  value
                )
              }
            />

            <TextAreaField
              label="Empfehlung"
              value={form.recommendation}
              onChange={value =>
                updateField(
                  'recommendation',
                  value
                )
              }
            />
          </div>

          <div style={{ marginTop: '14px' }}>
            <TextAreaField
              label="Nächste Aktion"
              value={form.next_action}
              onChange={value =>
                updateField('next_action', value)
              }
            />
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
            ? 'Berichte werden geladen…'
            : `${reports.length} Berichte`}
        </div>

        {!loading && reports.length === 0 && (
          <div style={panel}>
            Noch keine Scoutingberichte vorhanden.
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '14px'
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
                  justifyContent: 'space-between',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '19px',
                      fontWeight: 700
                    }}
                  >
                    {report.player_name ??
                      `Spieler ${report.player_id}`}
                  </div>

                  <div
                    style={{
                      marginTop: '4px',
                      color: '#666',
                      fontSize: '13px'
                    }}
                  >
                    {report.observation_date ?? '–'}
                    {' · '}
                    {report.observed_position ?? 'Position –'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    startEdit(report)
                  }
                  style={smallButton}
                >
                  Bearbeiten
                </button>
              </div>

              <div
                style={{
                  marginTop: '14px',
                  fontSize: '14px',
                  lineHeight: 1.6
                }}
              >
                <div>
                  <strong>Scout:</strong>{' '}
                  {report.scout_name ?? '–'}
                </div>

                <div>
                  <strong>Wettbewerb:</strong>{' '}
                  {report.competition ?? '–'}
                </div>

                <div>
                  <strong>Spiel:</strong>{' '}
                  {report.match_name ?? '–'}
                </div>

                <div>
                  <strong>Gegner:</strong>{' '}
                  {report.opponent ?? '–'}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(5, 1fr)',
                  gap: '6px',
                  marginTop: '14px'
                }}
              >
                <RatingBox
                  label="TECH"
                  value={report.technical_rating}
                />
                <RatingBox
                  label="TAKT"
                  value={report.tactical_rating}
                />
                <RatingBox
                  label="ATHL"
                  value={report.athletic_rating}
                />
                <RatingBox
                  label="MENT"
                  value={report.mentality_rating}
                />
                <RatingBox
                  label="POT"
                  value={report.potential_rating}
                />
              </div>

              {report.overall_impression && (
                <div
                  style={{
                    marginTop: '14px',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  <strong>Gesamteindruck</strong>
                  <div style={{ marginTop: '5px' }}>
                    {report.overall_impression}
                  </div>
                </div>
              )}

              {report.next_action && (
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #eee'
                  }}
                >
                  <strong>Nächste Aktion:</strong>{' '}
                  {report.next_action}
                </div>
              )}
            </article>
          ))}
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
  onChange,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <FormField label={label}>
      <input
        type={type}
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        style={inputStyle}
      />
    </FormField>
  );
}

function RatingField({
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
      <select
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        style={inputStyle}
      >
        <option value="">–</option>
        {[1, 2, 3, 4, 5].map(value => (
          <option
            key={value}
            value={String(value)}
          >
            {value}
          </option>
        ))}
      </select>
    </FormField>
  );
}

function TextAreaField({
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
      <textarea
        rows={5}
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        style={{
          ...inputStyle,
          resize: 'vertical'
        }}
      />
    </FormField>
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
        background: '#f4f6f5',
        borderRadius: '8px',
        padding: '8px 5px',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color: '#777'
        }}
      >
        {label}
      </div>

      <strong>
        {value ?? '–'}
      </strong>
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

const ratingsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(5, minmax(0, 1fr))',
  gap: '10px'
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
