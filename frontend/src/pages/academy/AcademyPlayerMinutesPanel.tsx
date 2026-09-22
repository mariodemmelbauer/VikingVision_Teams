import { useEffect, useState } from 'react';

type MatchRow = {
  match_id: number;
  match_date: string;
  opponent: string;
  competition?: string | null;
  result?: string | null;
  duration_minutes: number;
  minutes: number;
  in_squad: boolean;
  started: boolean;
  comment?: string | null;
};

type Summary = {
  minutes: number;
  possible_minutes: number;
  percentage: number;
};

type Props = {
  playerId: number | string;
  team: string;
  accessToken?: string;
  apiBase: string;
};

export default function AcademyPlayerMinutesPanel({
  playerId,
  team,
  accessToken,
  apiBase
}: Props) {
  const [rows, setRows] =
    useState<MatchRow[]>([]);

  const [summary, setSummary] =
    useState<Summary>({
      minutes: 0,
      possible_minutes: 0,
      percentage: 0
    });

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
    setLoading(true);
    setError(undefined);

    try {
      const data =
        await api(
          `/academy/player/${playerId}/minutes`
        );

      setRows(
        Array.isArray(
          data.matches
        )
          ? data.matches
          : []
      );

      setSummary(
        data.summary ?? {
          minutes: 0,
          possible_minutes: 0,
          percentage: 0
        }
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Spielminuten konnten nicht geladen werden.'
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

  function update(
    matchId: number,
    field:
      | 'minutes'
      | 'in_squad'
      | 'started'
      | 'comment',
    value:
      | number
      | boolean
      | string
  ) {
    setRows(current =>
      current.map(row =>
        row.match_id ===
        matchId
          ? {
              ...row,
              [field]: value
            }
          : row
      )
    );
  }

  async function save() {
    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await api(
        `/academy/player/${playerId}/minutes`,
        {
          method: 'POST',
          body: JSON.stringify({
            rows:
              rows.map(row => ({
                match_id:
                  row.match_id,
                minutes:
                  Math.min(
                    Number(
                      row.minutes
                    ) || 0,
                    row.duration_minutes
                  ),
                in_squad:
                  Boolean(
                    row.in_squad
                  ),
                started:
                  Boolean(
                    row.started
                  ),
                comment:
                  row.comment ||
                  null
              }))
          })
        }
      );

      setSuccess(
        'Spielminuten wurden gespeichert.'
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

  const belowTarget =
    summary.percentage < 60;

  return (
    <section style={panel}>
      <div style={head}>
        <div>
          <div style={eyebrow}>
            {team}
          </div>

          <h3 style={title}>
            Spielminuten
          </h3>

          <div style={subtitle}>
            Anteil der maximal möglichen Minuten der bereits absolvierten Spiele.
          </div>
        </div>

        <div
          style={
            belowTarget
              ? percentageRed
              : percentageGreen
          }
        >
          {summary.percentage.toFixed(
            1
          )}
          %
        </div>
      </div>

      <div style={summaryGrid}>
        <SummaryCard
          label="Gespielt"
          value={`${summary.minutes} Min.`}
        />
        <SummaryCard
          label="Möglich"
          value={`${summary.possible_minutes} Min.`}
        />
        <SummaryCard
          label="Ziel"
          value="≥ 60 %"
        />
      </div>

      {belowTarget && (
        <div style={warning}>
          Aktuell unter 60 % Spielzeit.
        </div>
      )}

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

      {loading ? (
        <div style={empty}>
          Lädt…
        </div>
      ) : rows.length === 0 ? (
        <div style={empty}>
          Für {team} wurden noch keine Spiele angelegt.
        </div>
      ) : (
        <>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>
                    Datum
                  </th>
                  <th style={th}>
                    Gegner
                  </th>
                  <th style={th}>
                    Dauer
                  </th>
                  <th style={th}>
                    Kader
                  </th>
                  <th style={th}>
                    Start
                  </th>
                  <th style={th}>
                    Minuten
                  </th>
                  <th style={th}>
                    Kommentar
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map(row => (
                  <tr
                    key={row.match_id}
                  >
                    <td style={td}>
                      {formatDate(
                        row.match_date
                      )}
                    </td>

                    <td style={tdStrong}>
                      {row.opponent}
                    </td>

                    <td style={td}>
                      {row.duration_minutes}
                    </td>

                    <td style={td}>
                      <input
                        type="checkbox"
                        checked={
                          row.in_squad
                        }
                        onChange={event =>
                          update(
                            row.match_id,
                            'in_squad',
                            event.target.checked
                          )
                        }
                      />
                    </td>

                    <td style={td}>
                      <input
                        type="checkbox"
                        checked={
                          row.started
                        }
                        onChange={event =>
                          update(
                            row.match_id,
                            'started',
                            event.target.checked
                          )
                        }
                      />
                    </td>

                    <td style={td}>
                      <input
                        type="number"
                        min="0"
                        max={
                          row.duration_minutes
                        }
                        value={
                          row.minutes
                        }
                        onChange={event =>
                          update(
                            row.match_id,
                            'minutes',
                            Number(
                              event.target.value
                            ) || 0
                          )
                        }
                        style={minuteInput}
                      />
                    </td>

                    <td style={td}>
                      <input
                        value={
                          row.comment ??
                          ''
                        }
                        onChange={event =>
                          update(
                            row.match_id,
                            'comment',
                            event.target.value
                          )
                        }
                        style={commentInput}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                : 'Spielminuten speichern'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={summaryCard}>
      <span style={summaryLabel}>
        {label}
      </span>
      <strong style={summaryValue}>
        {value}
      </strong>
    </div>
  );
}

function formatDate(
  value?: string
) {
  if (!value) {
    return '–';
  }

  return new Date(
    `${value.slice(0, 10)}T12:00:00`
  ).toLocaleDateString(
    'de-DE'
  );
}

const panel:
  React.CSSProperties = {
  marginTop: '14px',
  padding: '18px',
  border:
    '1px solid #e5e9e6',
  borderRadius: '15px',
  background: '#fff'
};

const head:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  gap: '12px',
  alignItems: 'flex-start',
  flexWrap: 'wrap'
};

const eyebrow:
  React.CSSProperties = {
  color: '#0b7a3b',
  fontSize: '9px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.08em'
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

const percentageGreen:
  React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '999px',
  background: '#eaf7ef',
  color: '#0b6b35',
  fontSize: '18px',
  fontWeight: 900
};

const percentageRed:
  React.CSSProperties = {
  ...percentageGreen,
  background: '#fff0f0',
  color: '#b42318'
};

const summaryGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(3, minmax(0, 1fr))',
  gap: '8px',
  marginTop: '14px'
};

const summaryCard:
  React.CSSProperties = {
  display: 'grid',
  gap: '3px',
  padding: '10px',
  borderRadius: '9px',
  background: '#f8faf8',
  border: '1px solid #e9ece9'
};

const summaryLabel:
  React.CSSProperties = {
  color: '#777',
  fontSize: '9px',
  textTransform: 'uppercase',
  fontWeight: 800
};

const summaryValue:
  React.CSSProperties = {
  fontSize: '16px'
};

const warning:
  React.CSSProperties = {
  marginTop: '10px',
  padding: '8px 10px',
  borderRadius: '8px',
  background: '#fff3f2',
  color: '#b42318',
  fontSize: '10px',
  fontWeight: 800
};

const tableWrap:
  React.CSSProperties = {
  marginTop: '14px',
  overflowX: 'auto'
};

const table:
  React.CSSProperties = {
  width: '100%',
  minWidth: '760px',
  borderCollapse: 'collapse'
};

const th:
  React.CSSProperties = {
  padding: '7px',
  textAlign: 'left',
  borderBottom:
    '2px solid #0b7a3b',
  fontSize: '9px',
  color: '#555',
  textTransform: 'uppercase'
};

const td:
  React.CSSProperties = {
  padding: '7px',
  borderBottom:
    '1px solid #ecefec',
  fontSize: '10px'
};

const tdStrong:
  React.CSSProperties = {
  ...td,
  fontWeight: 800
};

const minuteInput:
  React.CSSProperties = {
  width: '70px',
  padding: '5px',
  border: '1px solid #d5dad7',
  borderRadius: '7px'
};

const commentInput:
  React.CSSProperties = {
  minWidth: '170px',
  width: '100%',
  boxSizing: 'border-box',
  padding: '5px',
  border: '1px solid #d5dad7',
  borderRadius: '7px'
};

const actions:
  React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '12px'
};

const primaryButton:
  React.CSSProperties = {
  border: 'none',
  borderRadius: '9px',
  padding: '10px 14px',
  background: '#0b7a3b',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer'
};

const empty:
  React.CSSProperties = {
  marginTop: '14px',
  color: '#777',
  fontSize: '11px'
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
