import { useEffect, useMemo, useState } from 'react';

type SubjectType =
  | 'player'
  | 'academy'
  | 'p12';

type Metric = {
  code: string;
  category: string;
  label: string;
  unit?: string | null;
  sort_order: number;
};

type TestValue = {
  metric_code: string;
  value?: number | null;
  text_value?: string | null;
  notes?: string | null;
  metric_label?: string;
  unit?: string | null;
  category?: string;
  sort_order?: number;
};

type Test = {
  id: number;
  test_date: string;
  test_label?: string | null;
  season?: string | null;
  notes?: string | null;
  values?: TestValue[];
};

type Props = {
  subjectType: SubjectType;
  subjectId: number | string;
  accessToken?: string;
  apiBase: string;
  initialHeightCm?: number | string;
  title?: string;
};

function parseNumber(
  value: string | number | undefined
) {
  if (
    value === undefined ||
    value === ''
  ) {
    return undefined;
  }

  const parsed =
    Number(
      String(value)
        .replace(',', '.')
    );

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

function round(
  value: number,
  digits = 2
) {
  const factor =
    10 ** digits;

  return Math.round(
    value * factor
  ) / factor;
}

function deriveMetrics(
  source: Record<string, string>
) {
  const next = {
    ...source
  };

  const num =
    (code: string) =>
      parseNumber(next[code]);

  const set =
    (
      code: string,
      value: number | undefined
    ) => {
      if (
        value !== undefined &&
        Number.isFinite(value)
      ) {
        next[code] =
          String(
            round(value)
          );
      }
    };

  const height =
    num('height_cm');

  const weight =
    num('weight_kg');

  if (
    height &&
    weight
  ) {
    set(
      'bmi',
      weight /
        ((height / 100) ** 2)
    );
  }

  const adductorLeft =
    num('adductor_left_kg');
  const adductorRight =
    num('adductor_right_kg');

  if (
    adductorLeft !== undefined &&
    adductorRight !== undefined
  ) {
    set(
      'adductor_total_kg',
      adductorLeft +
        adductorRight
    );
  }

  const nordicLeft =
    num(
      'nordic_hamstring_left_kg'
    );
  const nordicRight =
    num(
      'nordic_hamstring_right_kg'
    );

  if (
    nordicLeft !== undefined &&
    nordicRight !== undefined
  ) {
    set(
      'nordic_hamstring_total_kg',
      nordicLeft +
        nordicRight
    );
  }

  if (weight) {
    const relatives = [
      [
        'tb_dl_1rm_kg',
        'tb_dl_relative'
      ],
      [
        'back_squat_1rm_kg',
        'back_squat_relative'
      ],
      [
        'adductor_total_kg',
        'adductor_relative'
      ],
      [
        'hamstring_total_kg',
        'hamstring_relative'
      ],
      [
        'bench_press_1rm_kg',
        'bench_press_relative'
      ]
    ] as const;

    relatives.forEach(
      ([absolute, relative]) => {
        const absoluteValue =
          num(absolute);

        if (
          absoluteValue !==
          undefined
        ) {
          set(
            relative,
            absoluteValue /
              weight
          );
        }
      }
    );
  }

  return next;
}

export default function SportSciencePanel({
  subjectType,
  subjectId,
  accessToken,
  apiBase,
  initialHeightCm,
  title = 'Sportwissenschaft'
}: Props) {
  const [metrics, setMetrics] =
    useState<Metric[]>([]);

  const [tests, setTests] =
    useState<Test[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string>();

  const [success, setSuccess] =
    useState<string>();

  const [testDate, setTestDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const [testLabel, setTestLabel] =
    useState('');

  const [season, setSeason] =
    useState('');

  const [notes, setNotes] =
    useState('');

  const [values, setValues] =
    useState<
      Record<string, string>
    >(() => {
      const height =
        parseNumber(
          initialHeightCm
        );

      return height
        ? {
            height_cm:
              String(height)
          }
        : {};
    });

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
    setError(undefined);

    try {
      const [
        catalogData,
        testData
      ] =
        await Promise.all([
          api(
            '/sport-science/catalog'
          ),
          api(
            `/sport-science/${subjectType}/${subjectId}`
          )
        ]);

      setMetrics(
        catalogData.metrics ??
        []
      );

      setTests(
        testData.tests ??
        []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Sportwissenschaft konnte nicht geladen werden.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [
    subjectType,
    subjectId,
    accessToken,
    apiBase
  ]);

  const groups =
    useMemo(() => {
      const grouped =
        new Map<
          string,
          Metric[]
        >();

      [...metrics]
        .sort(
          (a, b) =>
            a.sort_order -
            b.sort_order
        )
        .forEach(metric => {
          const current =
            grouped.get(
              metric.category
            ) ?? [];

          current.push(metric);
          grouped.set(
            metric.category,
            current
          );
        });

      return Array.from(
        grouped.entries()
      );
    }, [metrics]);

  function updateMetric(
    code: string,
    value: string
  ) {
    setValues(current =>
      deriveMetrics({
        ...current,
        [code]: value
      })
    );
  }

  function resetForm() {
    const height =
      parseNumber(
        initialHeightCm
      );

    setTestDate(
      new Date()
        .toISOString()
        .slice(0, 10)
    );
    setTestLabel('');
    setSeason('');
    setNotes('');
    setValues(
      height
        ? {
            height_cm:
              String(height)
          }
        : {}
    );
  }

  async function save() {
    if (!testDate) {
      setError(
        'Bitte ein Testdatum angeben.'
      );
      return;
    }

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const derived =
        deriveMetrics(values);

      const payloadValues =
        metrics
          .map(metric => {
            const raw =
              derived[
                metric.code
              ];

            if (
              raw === undefined ||
              raw === ''
            ) {
              return undefined;
            }

            const numeric =
              parseNumber(raw);

            return {
              metric_code:
                metric.code,
              value:
                numeric ??
                null,
              text_value:
                numeric ===
                undefined
                  ? raw
                  : null
            };
          })
          .filter(Boolean);

      await api(
        `/sport-science/${subjectType}/${subjectId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            test_date:
              testDate,
            test_label:
              testLabel ||
              null,
            season:
              season ||
              null,
            notes:
              notes ||
              null,
            values:
              payloadValues
          })
        }
      );

      setSuccess(
        'Sportwissenschaftlicher Test wurde gespeichert.'
      );

      resetForm();
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

  async function removeTest(
    id: number
  ) {
    if (
      !window.confirm(
        'Diesen Test wirklich löschen?'
      )
    ) {
      return;
    }

    setError(undefined);
    setSuccess(undefined);

    try {
      await api(
        `/sport-science/tests/${id}`,
        {
          method: 'DELETE'
        }
      );

      setSuccess(
        'Test wurde gelöscht.'
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Löschen fehlgeschlagen.'
      );
    }
  }

  return (
    <section style={panel}>
      <div style={header}>
        <div>
          <div style={eyebrow}>
            Entwicklung
          </div>

          <h3 style={titleStyle}>
            {title}
          </h3>

          <div style={subtitle}>
            Einheitliche Teststruktur für VikingVision, AKAVision und P12.
          </div>
        </div>

        <span style={countBadge}>
          {tests.length} Tests
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

      {loading ? (
        <div style={empty}>
          Lädt…
        </div>
      ) : (
        <>
          <div style={metaGrid}>
            <label>
              <div style={label}>
                Testdatum
              </div>
              <input
                type="date"
                value={testDate}
                onChange={event =>
                  setTestDate(
                    event.target.value
                  )
                }
                style={input}
              />
            </label>

            <label>
              <div style={label}>
                Test / Phase
              </div>
              <input
                value={testLabel}
                onChange={event =>
                  setTestLabel(
                    event.target.value
                  )
                }
                placeholder="z. B. Sommer 2026"
                style={input}
              />
            </label>

            <label>
              <div style={label}>
                Saison
              </div>
              <input
                value={season}
                onChange={event =>
                  setSeason(
                    event.target.value
                  )
                }
                placeholder="2026/27"
                style={input}
              />
            </label>
          </div>

          {groups.map(
            ([category, rows]) => (
              <div
                key={category}
                style={group}
              >
                <h4 style={groupTitle}>
                  {category}
                </h4>

                <div style={metricGrid}>
                  {rows.map(metric => (
                    <label
                      key={metric.code}
                      style={metricCard}
                    >
                      <div style={metricLabel}>
                        {metric.label}
                      </div>

                      <div style={metricInputRow}>
                        <input
                          type="number"
                          step="0.01"
                          value={
                            values[
                              metric.code
                            ] ?? ''
                          }
                          onChange={event =>
                            updateMetric(
                              metric.code,
                              event.target.value
                            )
                          }
                          style={metricInput}
                        />

                        {metric.unit && (
                          <span style={unit}>
                            {metric.unit}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )
          )}

          <label
            style={{
              display: 'block',
              marginTop: '16px'
            }}
          >
            <div style={label}>
              Notizen
            </div>
            <textarea
              rows={4}
              value={notes}
              onChange={event =>
                setNotes(
                  event.target.value
                )
              }
              style={{
                ...input,
                resize: 'vertical'
              }}
            />
          </label>

          <div style={actions}>
            <button
              type="button"
              onClick={resetForm}
              style={secondaryButton}
            >
              Zurücksetzen
            </button>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={primaryButton}
            >
              {saving
                ? 'Speichert…'
                : 'Test speichern'}
            </button>
          </div>

          <div style={history}>
            <h4 style={groupTitle}>
              Testverlauf
            </h4>

            {tests.length === 0 ? (
              <div style={empty}>
                Noch keine Tests in der gemeinsamen Sportwissenschaft gespeichert.
              </div>
            ) : (
              tests.map(test => (
                <article
                  key={test.id}
                  style={historyCard}
                >
                  <div style={historyHead}>
                    <div>
                      <strong>
                        {new Date(
                          `${test.test_date}T12:00:00`
                        ).toLocaleDateString(
                          'de-DE'
                        )}
                      </strong>

                      {test.test_label && (
                        <span style={muted}>
                          {' · '}
                          {test.test_label}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeTest(
                          test.id
                        )
                      }
                      style={deleteButton}
                    >
                      Löschen
                    </button>
                  </div>

                  <div style={historyMetrics}>
                    {(test.values ?? [])
                      .filter(
                        item =>
                          item.value != null ||
                          item.text_value
                      )
                      .sort(
                        (a, b) =>
                          Number(
                            a.sort_order ??
                            0
                          ) -
                          Number(
                            b.sort_order ??
                            0
                          )
                      )
                      .map(value => (
                        <div
                          key={value.metric_code}
                          style={historyMetric}
                        >
                          <span style={muted}>
                            {value.metric_label ??
                              value.metric_code}
                          </span>
                          <strong>
                            {value.value ??
                              value.text_value ??
                              '–'}
                            {value.unit
                              ? ` ${value.unit}`
                              : ''}
                          </strong>
                        </div>
                      ))}
                  </div>

                  {test.notes && (
                    <div style={testNotes}>
                      {test.notes}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
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
  letterSpacing: '.07em'
};

const titleStyle:
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

const countBadge:
  React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#edf7f1',
  color: '#0b6b35',
  fontSize: '10px',
  fontWeight: 900
};

const metaGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '10px',
  marginTop: '16px'
};

const label:
  React.CSSProperties = {
  marginBottom: '5px',
  color: '#676d69',
  fontSize: '10px',
  fontWeight: 800
};

const input:
  React.CSSProperties = {
  width: '100%',
  minHeight: '40px',
  boxSizing: 'border-box',
  border: '1px solid #d4d9d6',
  borderRadius: '8px',
  padding: '9px 10px',
  font: 'inherit',
  background: '#fff'
};

const group:
  React.CSSProperties = {
  marginTop: '18px'
};

const groupTitle:
  React.CSSProperties = {
  margin: '0 0 9px',
  color: '#152019',
  fontSize: '14px'
};

const metricGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '8px'
};

const metricCard:
  React.CSSProperties = {
  padding: '10px',
  border: '1px solid #ecefec',
  borderRadius: '10px',
  background: '#f8faf8'
};

const metricLabel:
  React.CSSProperties = {
  minHeight: '30px',
  color: '#333',
  fontSize: '11px',
  fontWeight: 800
};

const metricInputRow:
  React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
};

const metricInput:
  React.CSSProperties = {
  ...input,
  minHeight: '36px',
  padding: '7px 8px'
};

const unit:
  React.CSSProperties = {
  minWidth: '42px',
  color: '#777',
  fontSize: '10px'
};

const actions:
  React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '14px'
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
  padding: '10px 14px',
  background: '#fff',
  color: '#333',
  fontWeight: 800,
  cursor: 'pointer'
};

const deleteButton:
  React.CSSProperties = {
  ...secondaryButton,
  padding: '6px 9px',
  color: '#a00000',
  borderColor: '#e3bbbb',
  background: '#fff5f5',
  fontSize: '10px'
};

const history:
  React.CSSProperties = {
  marginTop: '22px',
  paddingTop: '18px',
  borderTop: '1px solid #ecefec'
};

const historyCard:
  React.CSSProperties = {
  marginTop: '10px',
  padding: '12px',
  border: '1px solid #e8ece9',
  borderRadius: '11px',
  background: '#fbfcfb'
};

const historyHead:
  React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
  alignItems: 'center',
  flexWrap: 'wrap'
};

const historyMetrics:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(145px, 1fr))',
  gap: '6px',
  marginTop: '10px'
};

const historyMetric:
  React.CSSProperties = {
  display: 'grid',
  gap: '2px',
  padding: '7px 8px',
  borderRadius: '8px',
  background: '#fff',
  border: '1px solid #edf0ed'
};

const muted:
  React.CSSProperties = {
  color: '#777',
  fontSize: '10px'
};

const testNotes:
  React.CSSProperties = {
  marginTop: '10px',
  color: '#555',
  fontSize: '11px',
  whiteSpace: 'pre-wrap'
};

const empty:
  React.CSSProperties = {
  marginTop: '14px',
  color: '#777',
  fontSize: '12px'
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
