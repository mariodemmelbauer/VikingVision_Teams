import { useEffect, useMemo, useState } from 'react';

type Props = {
  token: string;
  apiBase: string;
};

type PublicInvite = {
  player_name: string;
  period_label: string;
  expires_at?: string;
};

const CATEGORIES = [
  {
    category: 'Technisch-individualtaktische Fertigkeiten',
    details: [
      'Ballan- und mitnahme (Vororientierung, 1. Kontakt)',
      'Passqualität (Präzision und Schärfe)',
      'Beidfüßigkeit',
      'Kopfballspiel (offensiv, defensiv)'
    ]
  },
  {
    category: 'AgB (Attackieren gegen den Ball)',
    details: [
      '1./2. Sprint (Detail, Intensität, etc.)',
      'Balleroberungsqualität (letzter Schritt, intensiv, aggressiv)',
      'Druck verstärken wenn überspielt (Dazukommen)'
    ]
  },
  {
    category: 'AnBE (Attackieren nach Balleroberung)',
    details: [
      'Erster Blick tief',
      'Qualität im Wegspielen'
    ]
  },
  {
    category: 'AmB (Attackieren mit Ball)',
    details: [
      'Positionierung und allgemeine Laufwege (Breit/Schnittstelle)',
      'Ballsicherheit in engen Räumen',
      'Tiefgang (Timing, Movements, etc.)',
      'Boxverhalten (Positionierung, Räume erkennen/belaufen)',
      'Torabschluss (Links, Rechts, Kopf)'
    ]
  },
  {
    category: 'AnBV (Attackieren nach Ballverlust)',
    details: [
      'Gegenpressing (1. Impuls)',
      'Balldieb sein'
    ]
  },
  {
    category: 'Psychische (mentale) Eigenschaften',
    details: [
      'Kognitiv (z. B. Konzentration, Entscheidungshandeln)',
      'Kommunikation (non-/verbale Kommunikation, Coaching)',
      'Motivational (z. B. Ziele, Eigenmotivation)'
    ]
  }
] as const;

export default function P12SelfAssessmentPublic({
  token,
  apiBase
}: Props) {
  const [invite, setInvite] =
    useState<PublicInvite | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [submitted, setSubmitted] =
    useState(false);
  const [error, setError] =
    useState<string | undefined>();

  const [strengths, setStrengths] =
    useState('');
  const [developmentAreas, setDevelopmentAreas] =
    useState('');
  const [personalGoals, setPersonalGoals] =
    useState('');
  const [notes, setNotes] =
    useState('');
  const [ratings, setRatings] =
    useState<Record<string, number>>({});

  const totalRatings =
    useMemo(
      () =>
        Object.keys(ratings).length,
      [ratings]
    );

  useEffect(() => {
    loadInvite();
  }, [token]);

  async function loadInvite() {
    setLoading(true);
    setError(undefined);

    try {
      const response =
        await fetch(
          `${apiBase}/public/p12/self/${encodeURIComponent(token)}`
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Dieser P12-Link ist nicht gültig.'
        );
      }

      setInvite(data.invite);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'P12-Link konnte nicht geladen werden.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!invite) return;

    setSaving(true);
    setError(undefined);

    try {
      const scores =
        CATEGORIES.flatMap(group =>
          group.details.map(detail => {
            const key =
              `${group.category}|||${detail}`;

            return {
              category:
                group.category,
              detail,
              rating:
                ratings[key] ?? 0
            };
          })
        );

      const response =
        await fetch(
          `${apiBase}/public/p12/self/${encodeURIComponent(token)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              strengths,
              development_areas:
                developmentAreas,
              personal_goals:
                personalGoals,
              notes,
              scores
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Bewertung konnte nicht gespeichert werden.'
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Bewertung konnte nicht gespeichert werden.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={page}>
        <section style={panel}>
          P12-Spielerbewertung wird geladen…
        </section>
      </main>
    );
  }

  if (submitted) {
    return (
      <main style={page}>
        <section style={panel}>
          <div style={eyebrow}>
            SV Oberbank Ried · P12
          </div>
          <h1>
            Danke für deine Bewertung
          </h1>
          <p style={muted}>
            Deine Selbsteinschätzung wurde gespeichert.
            Der Link kann nicht erneut verwendet werden.
          </p>
        </section>
      </main>
    );
  }

  if (error || !invite) {
    return (
      <main style={page}>
        <section style={panel}>
          <div style={eyebrow}>
            SV Oberbank Ried · P12
          </div>
          <h1>
            Link nicht verfügbar
          </h1>
          <div style={errorBox}>
            {error ??
              'Dieser Link ist nicht gültig.'}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={page}>
      <section style={panel}>
        <div style={eyebrow}>
          SV Oberbank Ried · P12
        </div>
        <h1 style={{ marginBottom: 6 }}>
          Spieler-Selbsteinschätzung
        </h1>
        <div style={muted}>
          {invite.player_name} · {invite.period_label}
        </div>
      </section>

      <section
        style={{
          ...panel,
          marginTop: 14
        }}
      >
        <h2>
          Bewertung 0–10
        </h2>
        <p style={muted}>
          0 bedeutet „noch kaum vorhanden“, 10 bedeutet
          „sehr stark ausgeprägt“.
        </p>

        {CATEGORIES.map(group => (
          <div
            key={group.category}
            style={{ marginTop: 18 }}
          >
            <h3>
              {group.category}
            </h3>

            <div
              style={{
                display: 'grid',
                gap: 10
              }}
            >
              {group.details.map(detail => {
                const key =
                  `${group.category}|||${detail}`;

                return (
                  <div
                    key={detail}
                    style={ratingRow}
                  >
                    <div>{detail}</div>

                    <select
                      value={
                        ratings[key] ?? 0
                      }
                      onChange={event =>
                        setRatings(current => ({
                          ...current,
                          [key]:
                            Number(
                              event.target.value
                            )
                        }))
                      }
                      style={inputStyle}
                    >
                      {Array.from(
                        { length: 11 },
                        (_, index) => index
                      ).map(value => (
                        <option
                          key={value}
                          value={value}
                        >
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div
          style={{
            marginTop: 18,
            ...muted
          }}
        >
          Bewertete Detailpunkte: {totalRatings}
        </div>
      </section>

      <section
        style={{
          ...panel,
          marginTop: 14
        }}
      >
        <TextArea
          label="Meine Stärken"
          value={strengths}
          onChange={setStrengths}
        />
        <TextArea
          label="Meine Entwicklungsfelder"
          value={developmentAreas}
          onChange={setDevelopmentAreas}
        />
        <TextArea
          label="Meine persönlichen Ziele"
          value={personalGoals}
          onChange={setPersonalGoals}
        />
        <TextArea
          label="Weitere Notizen"
          value={notes}
          onChange={setNotes}
        />

        {error && (
          <div style={errorBox}>
            {error}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 18
          }}
        >
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            style={primaryButton}
          >
            {saving
              ? 'Wird gespeichert…'
              : 'Bewertung absenden'}
          </button>
        </div>
      </section>
    </main>
  );
}

function TextArea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label
      style={{
        display: 'block',
        marginTop: 14
      }}
    >
      <div style={fieldLabelStyle}>
        {label}
      </div>
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
    </label>
  );
}

const page: React.CSSProperties = {
  maxWidth: 980,
  margin: '0 auto',
  padding: '24px 16px 48px',
  fontFamily:
    'Inter, system-ui, Arial, sans-serif',
  color: '#1f1f1f'
};

const panel: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ececec',
  borderRadius: 14,
  padding: 20,
  boxShadow:
    '0 3px 14px rgba(0,0,0,.04)'
};

const eyebrow: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: '#0b6b35',
  textTransform: 'uppercase',
  letterSpacing: '.08em'
};

const muted: React.CSSProperties = {
  color: '#707070',
  fontSize: 13
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: '#555',
  marginBottom: 5
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 42,
  boxSizing: 'border-box',
  border: '1px solid #d5d5d5',
  borderRadius: 8,
  padding: 10,
  background: '#fff',
  font: 'inherit'
};

const ratingRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0,1fr) 90px',
  gap: 12,
  alignItems: 'center',
  borderBottom:
    '1px solid #f0f0f0',
  paddingBottom: 8
};

const primaryButton: React.CSSProperties = {
  border: 'none',
  background: '#0b7a3b',
  color: '#fff',
  padding: '12px 18px',
  borderRadius: 9,
  cursor: 'pointer',
  fontWeight: 800
};

const errorBox: React.CSSProperties = {
  marginTop: 14,
  padding: '12px 14px',
  background: '#fff3f3',
  color: '#a00000',
  borderRadius: 10
};
