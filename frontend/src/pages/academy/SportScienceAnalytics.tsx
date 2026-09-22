import { useEffect, useMemo, useState } from 'react';

type Metric = {
  code: string;
  category: string;
  label: string;
  unit?: string | null;
  sort_order: number;
  better_direction?: 'higher' | 'lower' | 'neutral' | null;
};

type Row = {
  subject_type: 'academy' | 'player';
  subject_id: number;
  name: string;
  team: string;
  position?: string | null;
  metric_code: string;
  metric_label: string;
  unit?: string | null;
  value?: number | null;
  text_value?: string | null;
  test_date: string;
};

type Props = {
  accessToken?: string;
  apiBase: string;
};

const TEAM_ORDER = [
  'U15',
  'U16',
  'U18',
  'JWR',
  'Profis'
];

export default function SportScienceAnalytics({
  accessToken,
  apiBase
}: Props) {
  const [metrics, setMetrics] =
    useState<Metric[]>([]);

  const [metricCode, setMetricCode] =
    useState('sprint_10m_sec');

  const [rows, setRows] =
    useState<Row[]>([]);

  const [selectedTeams, setSelectedTeams] =
    useState<string[]>(TEAM_ORDER);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string>();

  async function apiGet(
    path: string
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
          headers: {
            Authorization:
              `Bearer ${accessToken}`
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

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const data =
          await apiGet(
            '/sport-science/catalog'
          );

        if (cancelled) {
          return;
        }

        const next =
          Array.isArray(data.metrics)
            ? data.metrics
            : [];

        setMetrics(next);

        if (
          next.length &&
          !next.some(
            (metric: Metric) =>
              metric.code ===
              metricCode
          )
        ) {
          setMetricCode(
            next[0].code
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Metriken konnten nicht geladen werden.'
          );
        }
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [accessToken, apiBase]);

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      if (!metricCode) {
        return;
      }

      setLoading(true);
      setError(undefined);

      try {
        const data =
          await apiGet(
            `/sport-science/analytics?metric_code=${encodeURIComponent(
              metricCode
            )}`
          );

        if (!cancelled) {
          setRows(
            Array.isArray(data.rows)
              ? data.rows
              : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Auswertung konnte nicht geladen werden.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRows();

    return () => {
      cancelled = true;
    };
  }, [
    metricCode,
    accessToken,
    apiBase
  ]);

  const selectedMetric =
    metrics.find(
      metric =>
        metric.code ===
        metricCode
    );

  const filteredRows =
    useMemo(() => {
      const next =
        rows.filter(
          row =>
            selectedTeams.includes(
              row.team
            ) &&
            row.value != null
        );

      const lowerIsBetter =
        selectedMetric
          ?.better_direction ===
        'lower';

      return [...next].sort(
        (a, b) => {
          const av =
            Number(
              a.value ?? 0
            );
          const bv =
            Number(
              b.value ?? 0
            );

          return lowerIsBetter
            ? av - bv
            : bv - av;
        }
      );
    }, [
      rows,
      selectedTeams,
      selectedMetric
    ]);

  const teamStats =
    useMemo(() => {
      return TEAM_ORDER
        .map(team => {
          const teamRows =
            filteredRows.filter(
              row =>
                row.team === team
            );

          if (!teamRows.length) {
            return undefined;
          }

          const average =
            teamRows.reduce(
              (sum, row) =>
                sum +
                Number(
                  row.value ??
                  0
                ),
              0
            ) /
            teamRows.length;

          return {
            team,
            count:
              teamRows.length,
            average
          };
        })
        .filter(Boolean) as Array<{
          team: string;
          count: number;
          average: number;
        }>;
    }, [filteredRows]);

  function toggleTeam(
    team: string
  ) {
    setSelectedTeams(current =>
      current.includes(team)
        ? current.filter(
            item =>
              item !== team
          )
        : [
            ...current,
            team
          ]
    );
  }

  function exportCsv() {
    const separator = ';';

    const lines = [
      [
        'Rang',
        'Spieler',
        'Team',
        'Position',
        'Messwert',
        'Einheit',
        'Testdatum'
      ].join(separator),
      ...filteredRows.map(
        (row, index) =>
          [
            index + 1,
            csvCell(row.name),
            csvCell(row.team),
            csvCell(
              row.position ?? ''
            ),
            String(
              row.value ??
              ''
            ).replace('.', ','),
            csvCell(
              row.unit ?? ''
            ),
            csvCell(
              formatDate(
                row.test_date
              )
            )
          ].join(separator)
      )
    ];

    const blob =
      new Blob(
        [
          '\ufeff' +
          lines.join('\n')
        ],
        {
          type:
            'text/csv;charset=utf-8'
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        'a'
      );

    anchor.href = url;
    anchor.download =
      `Sportwissenschaft_${metricCode}.csv`;
    anchor.click();

    URL.revokeObjectURL(
      url
    );
  }

  return (
    <section style={panel}>
      <div style={head}>
        <div>
          <div style={eyebrow}>
            Sportwissenschaft
          </div>

          <h2 style={title}>
            Spieler vergleichen
          </h2>

          <div style={subtitle}>
            Letzter vorhandener Messwert pro Spieler · Vergleich zwischen Akademie und Profis.
          </div>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={
            filteredRows.length === 0
          }
          style={exportButton}
        >
          Excel / CSV Export
        </button>
      </div>

      {error && (
        <div style={errorBox}>
          {error}
        </div>
      )}

      <div style={controls}>
        <label style={field}>
          <span style={label}>
            Messwert
          </span>

          <select
            value={metricCode}
            onChange={event =>
              setMetricCode(
                event.target.value
              )
            }
            style={input}
          >
            {metrics.map(
              metric => (
                <option
                  key={metric.code}
                  value={metric.code}
                >
                  {metric.category}
                  {' · '}
                  {metric.label}
                  {metric.unit
                    ? ` (${metric.unit})`
                    : ''}
                </option>
              )
            )}
          </select>
        </label>

        <div style={teamFilter}>
          {TEAM_ORDER.map(
            team => (
              <button
                type="button"
                key={team}
                onClick={() =>
                  toggleTeam(team)
                }
                style={
                  selectedTeams.includes(
                    team
                  )
                    ? activeTeam
                    : teamButton
                }
              >
                {team}
              </button>
            )
          )}
        </div>
      </div>

      <div style={statsGrid}>
        {teamStats.map(
          stat => (
            <div
              key={stat.team}
              style={statCard}
            >
              <span style={statLabel}>
                {stat.team}
              </span>

              <strong style={statValue}>
                {formatNumber(
                  stat.average
                )}
                {selectedMetric?.unit
                  ? ` ${selectedMetric.unit}`
                  : ''}
              </strong>

              <span style={statHint}>
                Ø · {stat.count} Spieler
              </span>
            </div>
          )
        )}
      </div>

      {loading ? (
        <div style={empty}>
          Auswertung wird geladen…
        </div>
      ) : filteredRows.length ===
        0 ? (
        <div style={empty}>
          Für die Auswahl sind noch keine Messwerte vorhanden.
        </div>
      ) : (
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>
                  Rang
                </th>
                <th style={th}>
                  Spieler
                </th>
                <th style={th}>
                  Team
                </th>
                <th style={th}>
                  Position
                </th>
                <th style={th}>
                  Messwert
                </th>
                <th style={th}>
                  Testdatum
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map(
                (
                  row,
                  index
                ) => (
                  <tr
                    key={
                      `${row.subject_type}-${row.subject_id}`
                    }
                  >
                    <td style={td}>
                      {index + 1}
                    </td>

                    <td style={tdStrong}>
                      {row.name}
                    </td>

                    <td style={td}>
                      <span style={teamBadge}>
                        {row.team}
                      </span>
                    </td>

                    <td style={td}>
                      {row.position ||
                        '–'}
                    </td>

                    <td style={tdValue}>
                      {formatNumber(
                        Number(
                          row.value
                        )
                      )}
                      {row.unit
                        ? ` ${row.unit}`
                        : ''}
                    </td>

                    <td style={td}>
                      {formatDate(
                        row.test_date
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function csvCell(
  value: string
) {
  return `"${String(value)
    .replace(/"/g, '""')}"`;
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    'de-DE',
    {
      maximumFractionDigits: 2
    }
  ).format(value);
}

function formatDate(
  value?: string
) {
  if (!value) {
    return '';
  }

  return new Date(
    `${value.slice(0, 10)}T12:00:00`
  ).toLocaleDateString(
    'de-DE'
  );
}

const panel:
  React.CSSProperties = {
  marginTop: '18px',
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
  flexWrap: 'wrap',
  alignItems: 'flex-start'
};

const eyebrow:
  React.CSSProperties = {
  color: '#0b7a3b',
  fontSize: '9px',
  fontWeight: 900,
  letterSpacing: '.08em',
  textTransform: 'uppercase'
};

const title:
  React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '22px'
};

const subtitle:
  React.CSSProperties = {
  marginTop: '5px',
  color: '#737873',
  fontSize: '11px'
};

const exportButton:
  React.CSSProperties = {
  border: 'none',
  borderRadius: '9px',
  padding: '10px 13px',
  background: '#0b7a3b',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer'
};

const controls:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(260px, .8fr) minmax(0, 1.2fr)',
  gap: '12px',
  marginTop: '18px',
  alignItems: 'end'
};

const field:
  React.CSSProperties = {
  display: 'grid',
  gap: '5px'
};

const label:
  React.CSSProperties = {
  fontSize: '9px',
  color: '#666',
  fontWeight: 800,
  textTransform: 'uppercase'
};

const input:
  React.CSSProperties = {
  minHeight: '40px',
  border: '1px solid #d4d9d6',
  borderRadius: '8px',
  padding: '8px 10px',
  background: '#fff'
};

const teamFilter:
  React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '7px'
};

const teamButton:
  React.CSSProperties = {
  border: '1px solid #d2d7d4',
  borderRadius: '999px',
  background: '#fff',
  padding: '8px 11px',
  cursor: 'pointer',
  fontWeight: 800
};

const activeTeam:
  React.CSSProperties = {
  ...teamButton,
  borderColor: '#0b7a3b',
  background: '#0b7a3b',
  color: '#fff'
};

const statsGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(135px, 1fr))',
  gap: '8px',
  marginTop: '14px'
};

const statCard:
  React.CSSProperties = {
  display: 'grid',
  gap: '4px',
  padding: '11px',
  borderRadius: '10px',
  background: '#f7faf8',
  border: '1px solid #e5eae6'
};

const statLabel:
  React.CSSProperties = {
  color: '#0b7a3b',
  fontSize: '10px',
  fontWeight: 900
};

const statValue:
  React.CSSProperties = {
  fontSize: '19px'
};

const statHint:
  React.CSSProperties = {
  color: '#777',
  fontSize: '9px'
};

const tableWrap:
  React.CSSProperties = {
  marginTop: '16px',
  overflowX: 'auto'
};

const table:
  React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '720px'
};

const th:
  React.CSSProperties = {
  padding: '8px',
  textAlign: 'left',
  borderBottom:
    '2px solid #0b7a3b',
  fontSize: '9px',
  textTransform: 'uppercase',
  color: '#555'
};

const td:
  React.CSSProperties = {
  padding: '9px 8px',
  borderBottom:
    '1px solid #ecefec',
  fontSize: '11px'
};

const tdStrong:
  React.CSSProperties = {
  ...td,
  fontWeight: 800
};

const tdValue:
  React.CSSProperties = {
  ...td,
  fontWeight: 900,
  fontSize: '12px'
};

const teamBadge:
  React.CSSProperties = {
  padding: '4px 7px',
  borderRadius: '999px',
  background: '#edf7f1',
  color: '#0b6b35',
  fontSize: '9px',
  fontWeight: 900
};

const empty:
  React.CSSProperties = {
  marginTop: '16px',
  padding: '18px',
  borderRadius: '10px',
  background: '#fafbfa',
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
