import { useEffect, useMemo, useState } from 'react';

type Score = {
  category: string;
  detail: string;
  rating?: number | null;
};

type Assessment = {
  id: number;
  academy_player_id: number;
  period_label: string;
  assessment_date?: string | null;
  strengths?: string | null;
  development_areas?: string | null;
  personal_goals?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  scores?: Score[];
};

type Props = {
  playerId: number | string;
  playerName: string;
  accessToken?: string;
  apiBase: string;
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

const ALL_DETAILS =
  CATEGORIES.flatMap(
    group =>
      group.details.map(
        detail => ({
          category:
            group.category,
          detail
        })
      )
  );

const NEW_ID = 'new';

export default function AcademySelfAssessmentPanel({
  playerId,
  playerName,
  accessToken,
  apiBase
}: Props) {
  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [selectedId, setSelectedId] =
    useState<string>(NEW_ID);

  const [periodLabel, setPeriodLabel] =
    useState('Herbst 26');

  const [assessmentDate, setAssessmentDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const [strengths, setStrengths] =
    useState('');

  const [
    developmentAreas,
    setDevelopmentAreas
  ] = useState('');

  const [
    personalGoals,
    setPersonalGoals
  ] = useState('');

  const [notes, setNotes] =
    useState('');

  const [ratings, setRatings] =
    useState<
      Record<string, number>
    >({});

  const [trendMetric, setTrendMetric] =
    useState('overall');

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

  function scoreKey(
    category: string,
    detail: string
  ) {
    return `${category}|||${detail}`;
  }

  function resetForm() {
    setSelectedId(NEW_ID);
    setPeriodLabel('Herbst 26');
    setAssessmentDate(
      new Date()
        .toISOString()
        .slice(0, 10)
    );
    setStrengths('');
    setDevelopmentAreas('');
    setPersonalGoals('');
    setNotes('');
    setRatings({});
  }

  function chooseAssessment(
    value: string
  ) {
    setSelectedId(value);
    setError(undefined);
    setSuccess(undefined);

    if (value === NEW_ID) {
      resetForm();
      return;
    }

    const selected =
      assessments.find(
        assessment =>
          String(
            assessment.id
          ) === value
      );

    if (!selected) {
      return;
    }

    setPeriodLabel(
      selected.period_label ??
      ''
    );
    setAssessmentDate(
      selected.assessment_date ??
      ''
    );
    setStrengths(
      selected.strengths ??
      ''
    );
    setDevelopmentAreas(
      selected.development_areas ??
      ''
    );
    setPersonalGoals(
      selected.personal_goals ??
      ''
    );
    setNotes(
      selected.notes ??
      ''
    );

    const nextRatings:
      Record<string, number> =
      {};

    (selected.scores ?? [])
      .forEach(score => {
        nextRatings[
          scoreKey(
            score.category,
            score.detail
          )
        ] =
          Number(
            score.rating ??
            0
          );
      });

    setRatings(nextRatings);
  }

  async function load() {
    setLoading(true);
    setError(undefined);

    try {
      const data =
        await api(
          `/academy/player/${playerId}/self-assessments`
        );

      const next =
        Array.isArray(
          data.assessments
        )
          ? data.assessments
          : [];

      setAssessments(next);

      if (
        selectedId !== NEW_ID
      ) {
        const stillExists =
          next.some(
            (assessment: Assessment) =>
              String(
                assessment.id
              ) ===
              selectedId
          );

        if (!stillExists) {
          resetForm();
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Spielerbewertungen konnten nicht geladen werden.'
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

  async function save() {
    if (
      !periodLabel.trim()
    ) {
      setError(
        'Bitte eine Bewertungsphase angeben.'
      );
      return;
    }

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const scores =
        ALL_DETAILS.map(
          item => ({
            category:
              item.category,
            detail:
              item.detail,
            rating:
              ratings[
                scoreKey(
                  item.category,
                  item.detail
                )
              ] ?? 0
          })
        );

      const data =
        await api(
          `/academy/player/${playerId}/self-assessments`,
          {
            method: 'POST',
            body: JSON.stringify({
              assessment_id:
                selectedId === NEW_ID
                  ? null
                  : Number(
                      selectedId
                    ),
              period_label:
                periodLabel.trim(),
              assessment_date:
                assessmentDate ||
                null,
              strengths:
                strengths ||
                null,
              development_areas:
                developmentAreas ||
                null,
              personal_goals:
                personalGoals ||
                null,
              notes:
                notes ||
                null,
              scores
            })
          }
        );

      setSuccess(
        selectedId === NEW_ID
          ? 'Spielerbewertung wurde gespeichert.'
          : 'Spielerbewertung wurde aktualisiert.'
      );

      await load();

      if (
        data.assessment?.id
      ) {
        setSelectedId(
          String(
            data.assessment.id
          )
        );
      }
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

  async function remove() {
    if (
      selectedId === NEW_ID
    ) {
      return;
    }

    const selected =
      assessments.find(
        assessment =>
          String(
            assessment.id
          ) ===
          selectedId
      );

    if (
      !selected ||
      !window.confirm(
        `Spielerbewertung "${selected.period_label}" wirklich löschen?`
      )
    ) {
      return;
    }

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await api(
        `/academy/self-assessments/${selected.id}`,
        {
          method: 'DELETE'
        }
      );

      setSuccess(
        'Spielerbewertung wurde gelöscht.'
      );

      resetForm();
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Löschen fehlgeschlagen.'
      );
    } finally {
      setSaving(false);
    }
  }

  const history =
    useMemo(() => {
      return [...assessments]
        .sort(
          (a, b) =>
            String(
              a.assessment_date ??
              a.created_at ??
              ''
            ).localeCompare(
              String(
                b.assessment_date ??
                b.created_at ??
                ''
              )
            )
        )
        .map(assessment => {
          const scores =
            assessment.scores ??
            [];

          let values:
            number[] = [];

          if (
            trendMetric ===
            'overall'
          ) {
            values =
              scores
                .map(
                  score =>
                    Number(
                      score.rating
                    )
                )
                .filter(
                  value =>
                    Number.isFinite(
                      value
                    )
                );
          } else if (
            trendMetric.startsWith(
              'category:'
            )
          ) {
            const category =
              trendMetric.slice(
                'category:'.length
              );

            values =
              scores
                .filter(
                  score =>
                    score.category ===
                    category
                )
                .map(
                  score =>
                    Number(
                      score.rating
                    )
                )
                .filter(
                  value =>
                    Number.isFinite(
                      value
                    )
                );
          } else if (
            trendMetric.startsWith(
              'detail:'
            )
          ) {
            const detail =
              trendMetric.slice(
                'detail:'.length
              );

            values =
              scores
                .filter(
                  score =>
                    score.detail ===
                    detail
                )
                .map(
                  score =>
                    Number(
                      score.rating
                    )
                )
                .filter(
                  value =>
                    Number.isFinite(
                      value
                    )
                );
          }

          const average =
            values.length
              ? values.reduce(
                  (sum, value) =>
                    sum +
                    value,
                  0
                ) /
                values.length
              : null;

          return {
            id:
              assessment.id,
            label:
              assessment.period_label,
            date:
              assessment.assessment_date ??
              '',
            value:
              average == null
                ? null
                : Number(
                    average.toFixed(
                      2
                    )
                  )
          };
        })
        .filter(
          item =>
            item.value != null
        ) as Array<{
          id: number;
          label: string;
          date: string;
          value: number;
        }>;
    }, [
      assessments,
      trendMetric
    ]);

  const trendLabel =
    trendMetric === 'overall'
      ? 'Gesamtschnitt'
      : trendMetric.startsWith(
          'category:'
        )
        ? trendMetric.slice(
            'category:'.length
          )
        : trendMetric.slice(
            'detail:'.length
          );

  function exportCsv() {
    if (!history.length) {
      return;
    }

    const lines = [
      [
        'Spieler',
        'Messwert',
        'Phase',
        'Datum',
        'Wert'
      ].join(';'),
      ...history.map(
        item =>
          [
            csvCell(
              playerName
            ),
            csvCell(
              trendLabel
            ),
            csvCell(
              item.label
            ),
            csvCell(
              formatDate(
                item.date
              )
            ),
            String(
              item.value
            ).replace(
              '.',
              ','
            )
          ].join(';')
      )
    ];

    downloadBlob(
      '\ufeff' +
        lines.join('\n'),
      `Spielerbewertung_${safeFileName(
        playerName
      )}_${safeFileName(
        trendLabel
      )}.csv`,
      'text/csv;charset=utf-8'
    );
  }

  function exportSvg() {
    if (!history.length) {
      return;
    }

    const svg =
      buildTrendSvg(
        history,
        `${playerName} · ${trendLabel}`
      );

    downloadBlob(
      svg,
      `Spielerbewertung_${safeFileName(
        playerName
      )}_${safeFileName(
        trendLabel
      )}.svg`,
      'image/svg+xml;charset=utf-8'
    );
  }

  function printTrend() {
    if (!history.length) {
      return;
    }

    const frame =
      document.createElement(
        'iframe'
      );

    frame.style.position =
      'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';

    document.body.appendChild(
      frame
    );

    const doc =
      frame.contentDocument;

    if (!doc) {
      frame.remove();
      return;
    }

    doc.open();
    doc.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(
            playerName
          )} · Spielerbewertung</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 14mm;
            }
            body {
              font-family: Arial, sans-serif;
              color: #1f1f1f;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h1 {
              margin: 0 0 4px;
              font-size: 26px;
            }
            .sub {
              color: #666;
              margin-bottom: 24px;
            }
            svg {
              width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(
            playerName
          )}</h1>
          <div class="sub">
            Spielerbewertung · ${escapeHtml(
              trendLabel
            )}
          </div>
          ${buildTrendSvg(
            history,
            `${playerName} · ${trendLabel}`
          )}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(
      () => {
        frame.contentWindow
          ?.focus();
        frame.contentWindow
          ?.print();

        setTimeout(
          () =>
            frame.remove(),
          1000
        );
      },
      150
    );
  }

  return (
    <section style={panel}>
      <div style={head}>
        <div>
          <div style={eyebrow}>
            AKAVision · Spielerprofil
          </div>

          <h3 style={title}>
            Spielerbewertung
          </h3>

          <div style={subtitle}>
            Selbsteinschätzung 0–10 analog P12.
          </div>
        </div>

        <span style={countBadge}>
          {assessments.length}
          {' '}
          Bewertungen
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

      <div style={selectorGrid}>
        <label>
          <div style={label}>
            Bewertung auswählen
          </div>

          <select
            value={selectedId}
            onChange={event =>
              chooseAssessment(
                event.target.value
              )
            }
            style={input}
          >
            <option value={NEW_ID}>
              Neue Bewertung
            </option>

            {assessments.map(
              assessment => (
                <option
                  key={
                    assessment.id
                  }
                  value={
                    assessment.id
                  }
                >
                  {assessment.period_label}
                  {assessment.assessment_date
                    ? ` · ${formatDate(
                        assessment.assessment_date
                      )}`
                    : ''}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          <div style={label}>
            Bewertungsphase
          </div>

          <input
            value={periodLabel}
            onChange={event =>
              setPeriodLabel(
                event.target.value
              )
            }
            style={input}
          />
        </label>

        <label>
          <div style={label}>
            Datum
          </div>

          <input
            type="date"
            value={assessmentDate}
            onChange={event =>
              setAssessmentDate(
                event.target.value
              )
            }
            style={input}
          />
        </label>
      </div>

      <div style={textGrid}>
        <TextArea
          label="Stärken"
          value={strengths}
          onChange={setStrengths}
        />
        <TextArea
          label="Entwicklungsfelder"
          value={
            developmentAreas
          }
          onChange={
            setDevelopmentAreas
          }
        />
        <TextArea
          label="Persönliche Ziele"
          value={
            personalGoals
          }
          onChange={
            setPersonalGoals
          }
        />
        <TextArea
          label="Weitere Notizen"
          value={notes}
          onChange={setNotes}
        />
      </div>

      {CATEGORIES.map(
        group => (
          <div
            key={group.category}
            style={ratingGroup}
          >
            <h4 style={groupTitle}>
              {group.category}
            </h4>

            <div style={ratingList}>
              {group.details.map(
                detail => {
                  const key =
                    scoreKey(
                      group.category,
                      detail
                    );

                  return (
                    <div
                      key={detail}
                      style={ratingRow}
                    >
                      <span>
                        {detail}
                      </span>

                      <select
                        value={
                          ratings[
                            key
                          ] ??
                          0
                        }
                        onChange={event =>
                          setRatings(
                            current => ({
                              ...current,
                              [key]:
                                Number(
                                  event.target.value
                                )
                            })
                          )
                        }
                        style={ratingSelect}
                      >
                        {Array.from(
                          {
                            length: 11
                          },
                          (_, index) =>
                            index
                        ).map(
                          value => (
                            <option
                              key={
                                value
                              }
                              value={
                                value
                              }
                            >
                              {value}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )
      )}

      <div style={actions}>
        {selectedId !==
          NEW_ID && (
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            style={dangerButton}
          >
            Bewertung löschen
          </button>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={primaryButton}
        >
          {saving
            ? 'Speichert…'
            : selectedId ===
              NEW_ID
              ? 'Bewertung speichern'
              : 'Bewertung aktualisieren'}
        </button>
      </div>

      <section style={historyPanel}>
        <div style={historyHead}>
          <div>
            <h3 style={historyTitle}>
              Verlauf
            </h3>

            <div style={subtitle}>
              Entwicklung der Spielerbewertung über die gespeicherten Phasen.
            </div>
          </div>

          <div style={historyControls}>
            <label style={historySelectWrap}>
              <div style={label}>
                Verlauf auswählen
              </div>

              <select
                value={trendMetric}
                onChange={event =>
                  setTrendMetric(
                    event.target.value
                  )
                }
                style={input}
              >
                <option value="overall">
                  Gesamtschnitt
                </option>

                {CATEGORIES.map(
                  group => (
                    <option
                      key={
                        group.category
                      }
                      value={
                        `category:${group.category}`
                      }
                    >
                      Kategorie · {group.category}
                    </option>
                  )
                )}

                {ALL_DETAILS.map(
                  item => (
                    <option
                      key={
                        item.detail
                      }
                      value={
                        `detail:${item.detail}`
                      }
                    >
                      Detail · {item.detail}
                    </option>
                  )
                )}
              </select>
            </label>

            <div style={exportButtons}>
              <button
                type="button"
                onClick={exportCsv}
                disabled={
                  history.length ===
                  0
                }
                style={secondaryButton}
              >
                CSV
              </button>

              <button
                type="button"
                onClick={exportSvg}
                disabled={
                  history.length ===
                  0
                }
                style={secondaryButton}
              >
                Diagramm
              </button>

              <button
                type="button"
                onClick={printTrend}
                disabled={
                  history.length ===
                  0
                }
                style={secondaryButton}
              >
                PDF / Drucken
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={empty}>
            Bewertungen werden geladen…
          </div>
        ) : history.length ===
          0 ? (
          <div style={empty}>
            Für den ausgewählten Verlauf sind noch keine Daten vorhanden.
          </div>
        ) : (
          <div
            style={{
              marginTop: '16px'
            }}
            dangerouslySetInnerHTML={{
              __html:
                buildTrendSvg(
                  history,
                  trendLabel
                )
            }}
          />
        )}
      </section>
    </section>
  );
}

function TextArea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange:
    (value: string) => void;
}) {
  return (
    <label>
      <div style={labelStyle}>
        {label}
      </div>

      <textarea
        rows={4}
        value={value}
        onChange={event =>
          onChange(
            event.target.value
          )
        }
        style={{
          ...input,
          resize: 'vertical'
        }}
      />
    </label>
  );
}

function buildTrendSvg(
  rows: Array<{
    label: string;
    date: string;
    value: number;
  }>,
  titleText: string
) {
  const width = 900;
  const height = 360;
  const left = 70;
  const right = 25;
  const top = 55;
  const bottom = 65;
  const chartWidth =
    width -
    left -
    right;
  const chartHeight =
    height -
    top -
    bottom;

  const yMin = 0;
  const yMax = 10;

  const x =
    (index: number) =>
      rows.length <= 1
        ? left +
          chartWidth / 2
        : left +
          (
            index /
            (rows.length - 1)
          ) *
          chartWidth;

  const y =
    (value: number) =>
      top +
      (
        1 -
        (
          value -
          yMin
        ) /
        (
          yMax -
          yMin
        )
      ) *
      chartHeight;

  const grid =
    [0, 2, 4, 6, 8, 10]
      .map(value => {
        const yy =
          y(value);

        return `
          <line
            x1="${left}"
            x2="${width - right}"
            y1="${yy}"
            y2="${yy}"
            stroke="#e4e9e5"
            stroke-width="1"
          />
          <text
            x="${left - 12}"
            y="${yy + 4}"
            text-anchor="end"
            font-size="11"
            fill="#67706a"
          >${value}</text>
        `;
      })
      .join('');

  const points =
    rows
      .map(
        (row, index) =>
          `${x(index)},${y(
            row.value
          )}`
      )
      .join(' ');

  const dots =
    rows
      .map(
        (row, index) => {
          const xx =
            x(index);
          const yy =
            y(row.value);

          return `
            <circle
              cx="${xx}"
              cy="${yy}"
              r="5"
              fill="#0b7a3b"
            />
            <text
              x="${xx}"
              y="${yy - 12}"
              text-anchor="middle"
              font-size="11"
              font-weight="700"
              fill="#1d2a22"
            >${row.value.toFixed(
              1
            )}</text>
            <text
              x="${xx}"
              y="${height - 38}"
              text-anchor="middle"
              font-size="10"
              fill="#4f5752"
            >${escapeHtml(
              shorten(
                row.label,
                18
              )
            )}</text>
            <text
              x="${xx}"
              y="${height - 22}"
              text-anchor="middle"
              font-size="9"
              fill="#8a918d"
            >${escapeHtml(
              formatDate(
                row.date
              )
            )}</text>
          `;
        }
      )
      .join('');

  return `
    <svg
      viewBox="0 0 ${width} ${height}"
      role="img"
      aria-label="${escapeHtml(
        titleText
      )}"
      style="display:block;width:100%;height:auto;background:#fff;border:1px solid #e5e9e6;border-radius:12px"
    >
      <text
        x="${left}"
        y="28"
        font-size="16"
        font-weight="800"
        fill="#1f2a23"
      >${escapeHtml(
        titleText
      )}</text>

      ${grid}

      <line
        x1="${left}"
        x2="${left}"
        y1="${top}"
        y2="${height - bottom}"
        stroke="#9ba39e"
        stroke-width="1"
      />

      <polyline
        points="${points}"
        fill="none"
        stroke="#0b7a3b"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      ${dots}
    </svg>
  `;
}

function shorten(
  value: string,
  max: number
) {
  return value.length <= max
    ? value
    : `${value.slice(
        0,
        max - 1
      )}…`;
}

function formatDate(
  value?: string
) {
  if (!value) {
    return '';
  }

  return new Date(
    `${value.slice(
      0,
      10
    )}T12:00:00`
  ).toLocaleDateString(
    'de-DE'
  );
}

function csvCell(
  value: string
) {
  return `"${String(value)
    .replace(/"/g, '""')}"`;
}

function downloadBlob(
  content: string,
  filename: string,
  type: string
) {
  const blob =
    new Blob(
      [content],
      { type }
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
    filename;
  anchor.click();

  URL.revokeObjectURL(
    url
  );
}

function safeFileName(
  value: string
) {
  return value
    .replace(
      /[^a-zA-Z0-9äöüÄÖÜß_-]+/g,
      '_'
    )
    .replace(
      /^_+|_+$/g,
      ''
    );
}

function escapeHtml(
  value: string
) {
  return String(value)
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
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
  flexWrap: 'wrap',
  alignItems: 'flex-start'
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
  color: '#737873',
  fontSize: '11px'
};

const countBadge:
  React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#edf7f1',
  color: '#0b6b35',
  fontWeight: 900,
  fontSize: '10px'
};

const selectorGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '9px',
  marginTop: '16px'
};

const textGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '9px',
  marginTop: '14px'
};

const label =
  {
    marginBottom: '5px',
    color: '#666',
    fontSize: '9px',
    fontWeight: 800,
    textTransform: 'uppercase'
  } satisfies
    React.CSSProperties;

const labelStyle = label;

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

const ratingGroup:
  React.CSSProperties = {
  marginTop: '18px'
};

const groupTitle:
  React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: '14px'
};

const ratingList:
  React.CSSProperties = {
  display: 'grid',
  gap: '5px'
};

const ratingRow:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1fr) 88px',
  gap: '10px',
  alignItems: 'center',
  padding: '7px 8px',
  borderRadius: '8px',
  background: '#f8faf8',
  border: '1px solid #edf0ed',
  fontSize: '11px'
};

const ratingSelect:
  React.CSSProperties = {
  ...input,
  minHeight: '34px',
  padding: '5px 7px'
};

const actions:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  gap: '8px',
  marginTop: '16px'
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

const secondaryButton:
  React.CSSProperties = {
  border: '1px solid #d3d8d5',
  borderRadius: '9px',
  padding: '8px 10px',
  background: '#fff',
  color: '#333',
  fontWeight: 800,
  cursor: 'pointer'
};

const dangerButton:
  React.CSSProperties = {
  ...secondaryButton,
  color: '#a00000',
  borderColor: '#e3bbbb',
  background: '#fff5f5'
};

const historyPanel:
  React.CSSProperties = {
  marginTop: '24px',
  paddingTop: '18px',
  borderTop: '1px solid #e5e9e6'
};

const historyHead:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1fr) minmax(360px, .9fr)',
  gap: '14px',
  alignItems: 'end'
};

const historyTitle:
  React.CSSProperties = {
  margin: 0,
  fontSize: '18px'
};

const historyControls:
  React.CSSProperties = {
  display: 'grid',
  gap: '8px'
};

const historySelectWrap:
  React.CSSProperties = {
  display: 'grid'
};

const exportButtons:
  React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '6px',
  flexWrap: 'wrap'
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
