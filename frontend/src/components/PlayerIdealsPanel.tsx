import { useEffect, useMemo, useState } from 'react';

type IdealScore = {
  ideal_code: string;
  status_quo?: number | null;
  potential?: number | null;
  rating?: number | null;
  measured_value?: string | null;
  notes?: string | null;
};

type IdealAssessment = {
  id: number;
  player_id: number;
  period_label: string;
  assessment_date?: string | null;
  player_role?: string | null;
  scores?: IdealScore[];
};

type Props = {
  playerId: number | string;
  playerRole?: string;
  accessToken?: string;
  apiBase: string;
};

const IDEALS = [
  ['OFF1', 'Rücken finden', 'Mit Ball'],
  ['OFF2', 'Manipulieren', 'Mit Ball'],
  ['OFF3', 'Ball als Verbündeter', 'Mit Ball'],
  ['DEF1', 'Rücken sichern & Ball erobern', 'Gegen den Ball'],
  ['DEF3', 'Ball gehört uns & Tor verteidigen', 'Gegen den Ball']
] as const;

type DraftScore = {
  ideal_code: string;
  status_quo: string;
  potential: string;
  rating: string;
  measured_value: string;
  notes: string;
};

function emptyScores():
  DraftScore[] {
  return IDEALS.map(
    ([code]) => ({
      ideal_code: code,
      status_quo: '',
      potential: '',
      rating: '',
      measured_value: '',
      notes: ''
    })
  );
}

export default function PlayerIdealsPanel({
  playerId,
  playerRole,
  accessToken,
  apiBase
}: Props) {
  const [assessments, setAssessments] =
    useState<IdealAssessment[]>([]);

  const [period, setPeriod] =
    useState('');

  const [date, setDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const [role, setRole] =
    useState(
      playerRole ?? ''
    );

  const [scores, setScores] =
    useState<DraftScore[]>(
      emptyScores()
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string>();

  const [success, setSuccess] =
    useState<string>();

  async function api(
    path: string,
    init?: RequestInit
  ) {
    if (!accessToken) {
      throw new Error(
        'Kein Teams-SSO-Token vorhanden.'
      );
    }

    const response =
      await fetch(
        `${apiBase}${path}`,
        {
          ...init,
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            'Content-Type':
              'application/json',
            ...(init?.headers ?? {})
          }
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ??
        'Anfrage fehlgeschlagen.'
      );
    }

    return data;
  }

  async function load() {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data =
        await api(
          `/players/${playerId}/ideals`
        );

      setAssessments(
        data.assessments ??
        []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ideale konnten nicht geladen werden.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [
    playerId,
    accessToken,
    apiBase
  ]);

  const latest =
    assessments[0];

  const scoreMap =
    useMemo(
      () =>
        new Map(
          (latest?.scores ?? [])
            .map(score => [
              score.ideal_code,
              score
            ])
        ),
      [latest]
    );

  function updateScore(
    code: string,
    field:
      | 'status_quo'
      | 'potential'
      | 'rating'
      | 'measured_value'
      | 'notes',
    value: string
  ) {
    setScores(current =>
      current.map(score =>
        score.ideal_code === code
          ? {
              ...score,
              [field]: value
            }
          : score
      )
    );
  }

  function numberOrNull(
    value: string
  ) {
    if (!value.trim()) {
      return null;
    }

    const parsed =
      Number(
        value.replace(',', '.')
      );

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  async function save() {
    if (!period.trim()) {
      setError(
        'Bitte eine Bewertungsperiode angeben.'
      );
      return;
    }

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await api(
        `/players/${playerId}/ideals`,
        {
          method: 'POST',
          body: JSON.stringify({
            period_label:
              period.trim(),
            assessment_date:
              date || null,
            player_role:
              role || null,
            scores:
              scores.map(
                score => ({
                  ideal_code:
                    score.ideal_code,
                  status_quo:
                    numberOrNull(
                      score.status_quo
                    ),
                  potential:
                    numberOrNull(
                      score.potential
                    ),
                  rating:
                    numberOrNull(
                      score.rating
                    ),
                  measured_value:
                    score.measured_value ||
                    null,
                  notes:
                    score.notes ||
                    null
                })
              )
          })
        }
      );

      setPeriod('');
      setScores(
        emptyScores()
      );
      setSuccess(
        'Ideale-Bewertung wurde gespeichert.'
      );

      await load();
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
    <section style={panel}>
      <div style={header}>
        <div>
          <div style={eyebrow}>
            Spielerentwicklung
          </div>
          <h3 style={title}>
            Ideale
          </h3>
          <div style={subtitle}>
            Analog AKAVision · OFF1 / OFF2 / OFF3 / DEF1 / DEF3
          </div>
        </div>

        <span style={badge}>
          {assessments.length} Bewertungen
        </span>
      </div>

      {error && (
        <div style={errorBox}>
          {error}
        </div>
      )}

      {success && (
        <div style={successBox}>
          {success}
        </div>
      )}

      {latest && (
        <div style={latestBox}>
          <div style={latestHead}>
            <strong>
              Aktueller Stand
            </strong>
            <span style={muted}>
              {latest.period_label}
              {latest.assessment_date
                ? ` · ${new Date(
                    `${latest.assessment_date}T12:00:00`
                  ).toLocaleDateString(
                    'de-DE'
                  )}`
                : ''}
            </span>
          </div>

          <div style={summaryGrid}>
            {IDEALS.map(
              ([code, label]) => {
                const score =
                  scoreMap.get(code);

                const value =
                  score?.rating ??
                  score?.status_quo ??
                  '–';

                return (
                  <div
                    key={code}
                    style={summaryCard}
                  >
                    <span style={codeBadge}>
                      {code}
                    </span>
                    <strong>
                      {label}
                    </strong>
                    <span style={summaryValue}>
                      {value}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      <div style={formMeta}>
        <label>
          <div style={labelStyle}>
            Bewertungsperiode
          </div>
          <input
            value={period}
            onChange={event =>
              setPeriod(
                event.target.value
              )
            }
            placeholder="z. B. Herbst 2026"
            style={input}
          />
        </label>

        <label>
          <div style={labelStyle}>
            Datum
          </div>
          <input
            type="date"
            value={date}
            onChange={event =>
              setDate(
                event.target.value
              )
            }
            style={input}
          />
        </label>

        <label>
          <div style={labelStyle}>
            Spielerrolle
          </div>
          <input
            value={role}
            onChange={event =>
              setRole(
                event.target.value
              )
            }
            style={input}
          />
        </label>
      </div>

      <div style={idealGrid}>
        {IDEALS.map(
          ([code, label, group]) => {
            const score =
              scores.find(
                item =>
                  item.ideal_code ===
                  code
              )!;

            return (
              <article
                key={code}
                style={idealCard}
              >
                <div style={idealTitle}>
                  <span style={codeBadge}>
                    {code}
                  </span>
                  <div>
                    <strong>
                      {label}
                    </strong>
                    <div style={muted}>
                      {group}
                    </div>
                  </div>
                </div>

                <div style={scoreGrid}>
                  <SmallInput
                    label="Status quo"
                    value={
                      score.status_quo
                    }
                    onChange={value =>
                      updateScore(
                        code,
                        'status_quo',
                        value
                      )
                    }
                  />
                  <SmallInput
                    label="Potenzial"
                    value={
                      score.potential
                    }
                    onChange={value =>
                      updateScore(
                        code,
                        'potential',
                        value
                      )
                    }
                  />
                  <SmallInput
                    label="Rating"
                    value={
                      score.rating
                    }
                    onChange={value =>
                      updateScore(
                        code,
                        'rating',
                        value
                      )
                    }
                  />
                  <SmallInput
                    label="Messwert"
                    value={
                      score.measured_value
                    }
                    numeric={false}
                    onChange={value =>
                      updateScore(
                        code,
                        'measured_value',
                        value
                      )
                    }
                  />
                </div>

                <textarea
                  rows={3}
                  value={score.notes}
                  onChange={event =>
                    updateScore(
                      code,
                      'notes',
                      event.target.value
                    )
                  }
                  placeholder="Notizen"
                  style={{
                    ...input,
                    marginTop: '8px',
                    resize: 'vertical'
                  }}
                />
              </article>
            );
          }
        )}
      </div>

      <div style={actions}>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={primaryButton}
        >
          {saving
            ? 'Speichert…'
            : 'Ideale-Bewertung speichern'}
        </button>
      </div>

      {loading && (
        <div style={muted}>
          Bewertungen werden geladen…
        </div>
      )}
    </section>
  );
}

function SmallInput({
  label,
  value,
  onChange,
  numeric = true
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  numeric?: boolean;
}) {
  return (
    <label>
      <div style={labelStyle}>
        {label}
      </div>
      <input
        type={
          numeric
            ? 'number'
            : 'text'
        }
        step={
          numeric
            ? '0.1'
            : undefined
        }
        value={value}
        onChange={event =>
          onChange(
            event.target.value
          )
        }
        style={input}
      />
    </label>
  );
}

const panel:
  React.CSSProperties = {
  marginTop: '18px',
  padding: '18px',
  border:
    '1px solid #e4e8e5',
  borderRadius: '15px',
  background: '#fff'
};

const header:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  alignItems: 'flex-start',
  gap: '12px',
  flexWrap: 'wrap'
};

const eyebrow:
  React.CSSProperties = {
  color: '#0b7a3b',
  fontSize: '9px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.07em'
};

const title:
  React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '20px'
};

const subtitle:
  React.CSSProperties = {
  marginTop: '4px',
  color: '#777',
  fontSize: '11px'
};

const badge:
  React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#edf7f1',
  color: '#0b6b35',
  fontSize: '10px',
  fontWeight: 900
};

const latestBox:
  React.CSSProperties = {
  marginTop: '16px',
  padding: '13px',
  borderRadius: '11px',
  background: '#f7faf8',
  border: '1px solid #e4ebe6'
};

const latestHead:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  gap: '10px',
  flexWrap: 'wrap'
};

const summaryGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(170px, 1fr))',
  gap: '7px',
  marginTop: '10px'
};

const summaryCard:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'auto 1fr auto',
  alignItems: 'center',
  gap: '7px',
  padding: '8px',
  borderRadius: '9px',
  background: '#fff',
  border: '1px solid #e7ebe8'
};

const summaryValue:
  React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 900
};

const formMeta:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '10px',
  marginTop: '18px'
};

const idealGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '10px',
  marginTop: '14px'
};

const idealCard:
  React.CSSProperties = {
  padding: '12px',
  borderRadius: '11px',
  background: '#fbfcfb',
  border: '1px solid #e6eae7'
};

const idealTitle:
  React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const codeBadge:
  React.CSSProperties = {
  padding: '4px 7px',
  borderRadius: '999px',
  background: '#0b7a3b',
  color: '#fff',
  fontSize: '9px',
  fontWeight: 900
};

const scoreGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '7px',
  marginTop: '10px'
};

const labelStyle:
  React.CSSProperties = {
  marginBottom: '4px',
  color: '#707671',
  fontSize: '9px',
  fontWeight: 800
};

const input:
  React.CSSProperties = {
  width: '100%',
  minHeight: '38px',
  boxSizing: 'border-box',
  border: '1px solid #d5dad7',
  borderRadius: '8px',
  padding: '8px 9px',
  background: '#fff',
  font: 'inherit'
};

const actions:
  React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '14px'
};

const primaryButton:
  React.CSSProperties = {
  border: 'none',
  borderRadius: '9px',
  padding: '10px 14px',
  background: '#0b7a3b',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 800
};

const muted:
  React.CSSProperties = {
  color: '#777',
  fontSize: '10px'
};

const errorBox:
  React.CSSProperties = {
  marginTop: '12px',
  padding: '9px 11px',
  borderRadius: '9px',
  background: '#fff2f2',
  color: '#9d0000',
  fontSize: '11px'
};

const successBox:
  React.CSSProperties = {
  marginTop: '12px',
  padding: '9px 11px',
  borderRadius: '9px',
  background: '#eef9f2',
  color: '#0b6b35',
  fontSize: '11px'
};
