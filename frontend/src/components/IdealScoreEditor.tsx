import {
  IDEAL_CATALOG,
  type IdealDetailRatings,
  type IdealHighlightState,
  type IdealScoreForm
} from './idealCatalog';

type Props = {
  scores: IdealScoreForm[];
  onChange: (
    scores: IdealScoreForm[]
  ) => void;
};

export default function IdealScoreEditor({
  scores,
  onChange
}: Props) {
  function updateTopLevel(
    idealCode: string,
    field:
      | 'status_quo'
      | 'potential'
      | 'notes',
    value: string
  ) {
    onChange(
      scores.map(score =>
        score.ideal_code ===
        idealCode
          ? {
              ...score,
              [field]: value
            }
          : score
      )
    );
  }

  function updateCriterion(
    idealCode: string,
    criterionId: string,
    field:
      | 'status_quo'
      | 'potential',
    value: string
  ) {
    onChange(
      scores.map(score => {
        if (
          score.ideal_code !==
          idealCode
        ) {
          return score;
        }

        const current =
          score.detail_ratings
            .criteria[
              criterionId
            ];

        return {
          ...score,
          detail_ratings: {
            ...score.detail_ratings,
            criteria: {
              ...score.detail_ratings
                .criteria,
              [criterionId]: {
                ...current,
                [field]: value
              }
            }
          }
        };
      })
    );
  }

  function updateHighlight(
    idealCode: string,
    criterionId: string,
    highlight: string,
    side:
      | 'highlights_status_quo'
      | 'highlights_potential',
    value:
      IdealHighlightState
  ) {
    onChange(
      scores.map(score => {
        if (
          score.ideal_code !==
          idealCode
        ) {
          return score;
        }

        const current =
          score.detail_ratings
            .criteria[
              criterionId
            ];

        return {
          ...score,
          detail_ratings: {
            ...score.detail_ratings,
            criteria: {
              ...score.detail_ratings
                .criteria,
              [criterionId]: {
                ...current,
                [side]: {
                  ...current[
                    side
                  ],
                  [highlight]:
                    value
                }
              }
            }
          }
        };
      })
    );
  }

  return (
    <div style={root}>
      <div style={legend}>
        <strong>
          Excel-Systematik
        </strong>
        <span>
          Skala 0–100 · Highlights:
          1 = Schwäche · 2 = Waffe ·
          leer = Neutral
        </span>
      </div>

      {IDEAL_CATALOG.map(
        ideal => {
          const score =
            scores.find(
              item =>
                item.ideal_code ===
                ideal.code
            );

          if (!score) {
            return null;
          }

          return (
            <details
              key={ideal.code}
              style={idealCard}
            >
              <summary style={summary}>
                <div style={summaryLeft}>
                  <span style={codeBadge}>
                    {ideal.code}
                  </span>

                  <div>
                    <strong>
                      {ideal.title}
                    </strong>
                    <div style={muted}>
                      {ideal.group}
                      {' · '}
                      {ideal.criteria.length}
                      {' '}
                      Kriterien
                    </div>
                  </div>
                </div>

                <div style={overallGrid}>
                  <ScoreInput
                    label="Status Quo"
                    value={
                      score.status_quo
                    }
                    onChange={value =>
                      updateTopLevel(
                        ideal.code,
                        'status_quo',
                        value
                      )
                    }
                  />
                  <ScoreInput
                    label="Potential"
                    value={
                      score.potential
                    }
                    onChange={value =>
                      updateTopLevel(
                        ideal.code,
                        'potential',
                        value
                      )
                    }
                  />
                </div>
              </summary>

              <div style={criteriaList}>
                {ideal.criteria.map(
                  (
                    criterion,
                    index
                  ) => {
                    const rating =
                      score.detail_ratings
                        .criteria[
                          criterion.id
                        ];

                    return (
                      <article
                        key={criterion.id}
                        style={criterionCard}
                      >
                        <div style={criterionHead}>
                          <span style={criterionIndex}>
                            {index + 1}
                          </span>

                          <strong>
                            {criterion.description}
                          </strong>
                        </div>

                        <div style={criterionScoreGrid}>
                          <ScoreInput
                            label="Status Quo"
                            value={
                              rating?.status_quo ??
                              ''
                            }
                            onChange={value =>
                              updateCriterion(
                                ideal.code,
                                criterion.id,
                                'status_quo',
                                value
                              )
                            }
                          />

                          <ScoreInput
                            label="Potential"
                            value={
                              rating?.potential ??
                              ''
                            }
                            onChange={value =>
                              updateCriterion(
                                ideal.code,
                                criterion.id,
                                'potential',
                                value
                              )
                            }
                          />
                        </div>

                        {criterion.highlights.length >
                          0 && (
                          <div style={highlights}>
                            <div style={highlightHeader}>
                              <strong>
                                Highlights
                              </strong>
                              <span>
                                Status Quo
                              </span>
                              <span>
                                Potential
                              </span>
                            </div>

                            {criterion.highlights.map(
                              highlight => (
                                <div
                                  key={highlight}
                                  style={highlightRow}
                                >
                                  <span style={highlightLabel}>
                                    {highlight}
                                  </span>

                                  <HighlightSelect
                                    value={
                                      rating
                                        ?.highlights_status_quo?.[
                                          highlight
                                        ] ??
                                      ''
                                    }
                                    onChange={value =>
                                      updateHighlight(
                                        ideal.code,
                                        criterion.id,
                                        highlight,
                                        'highlights_status_quo',
                                        value
                                      )
                                    }
                                  />

                                  <HighlightSelect
                                    value={
                                      rating
                                        ?.highlights_potential?.[
                                          highlight
                                        ] ??
                                      ''
                                    }
                                    onChange={value =>
                                      updateHighlight(
                                        ideal.code,
                                        criterion.id,
                                        highlight,
                                        'highlights_potential',
                                        value
                                      )
                                    }
                                  />
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </article>
                    );
                  }
                )}

                <label>
                  <div style={label}>
                    Notizen zu {ideal.code}
                  </div>
                  <textarea
                    rows={3}
                    value={score.notes}
                    onChange={event =>
                      updateTopLevel(
                        ideal.code,
                        'notes',
                        event.target.value
                      )
                    }
                    style={textarea}
                  />
                </label>
              </div>
            </details>
          );
        }
      )}
    </div>
  );
}

function ScoreInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label>
      <div style={labelStyle}>
        {label}
      </div>

      <input
        type="number"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={event =>
          onChange(
            event.target.value
          )
        }
        style={scoreInput}
      />
    </label>
  );
}

function HighlightSelect({
  value,
  onChange
}: {
  value: IdealHighlightState;
  onChange: (
    value: IdealHighlightState
  ) => void;
}) {
  return (
    <select
      value={value}
      onChange={event =>
        onChange(
          event.target.value as
            IdealHighlightState
        )
      }
      style={{
        ...highlightSelect,
        ...(value === '1'
          ? weakSelect
          : value === '2'
            ? weaponSelect
            : {})
      }}
    >
      <option value="">
        Neutral
      </option>
      <option value="1">
        1 · Schwäche
      </option>
      <option value="2">
        2 · Waffe
      </option>
    </select>
  );
}

const root:
  React.CSSProperties = {
  display: 'grid',
  gap: '10px'
};

const legend:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  gap: '10px',
  flexWrap: 'wrap',
  padding: '10px 12px',
  borderRadius: '9px',
  background: '#f3f7f4',
  color: '#445048',
  fontSize: '10px'
};

const idealCard:
  React.CSSProperties = {
  border: '1px solid #e2e7e3',
  borderRadius: '12px',
  background: '#fff',
  overflow: 'hidden'
};

const summary:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1fr) auto',
  gap: '12px',
  alignItems: 'center',
  padding: '12px',
  cursor: 'pointer',
  listStyle: 'none'
};

const summaryLeft:
  React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center'
};

const codeBadge:
  React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#0b7a3b',
  color: '#fff',
  fontSize: '9px',
  fontWeight: 900
};

const muted:
  React.CSSProperties = {
  marginTop: '2px',
  color: '#777',
  fontSize: '9px'
};

const overallGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, 90px)',
  gap: '7px'
};

const criteriaList:
  React.CSSProperties = {
  display: 'grid',
  gap: '10px',
  padding: '0 12px 12px',
  borderTop: '1px solid #eef0ee'
};

const criterionCard:
  React.CSSProperties = {
  marginTop: '10px',
  padding: '11px',
  borderRadius: '10px',
  background: '#fafbfa',
  border: '1px solid #e9ecea'
};

const criterionHead:
  React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'flex-start',
  lineHeight: 1.4,
  fontSize: '11px'
};

const criterionIndex:
  React.CSSProperties = {
  flex: '0 0 auto',
  width: '21px',
  height: '21px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: '#edf7f1',
  color: '#0b6b35',
  fontSize: '9px',
  fontWeight: 900
};

const criterionScoreGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(120px, 180px))',
  gap: '8px',
  marginTop: '10px'
};

const labelStyle:
  React.CSSProperties = {
  marginBottom: '4px',
  color: '#777',
  fontSize: '8px',
  fontWeight: 800,
  textTransform: 'uppercase'
};

const scoreInput:
  React.CSSProperties = {
  width: '100%',
  minHeight: '34px',
  boxSizing: 'border-box',
  border: '1px solid #d5dad7',
  borderRadius: '7px',
  padding: '6px 7px',
  background: '#fff'
};

const highlights:
  React.CSSProperties = {
  display: 'grid',
  marginTop: '11px',
  border: '1px solid #e6eae7',
  borderRadius: '8px',
  overflow: 'hidden'
};

const highlightHeader:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1fr) 118px 118px',
  gap: '6px',
  padding: '7px 8px',
  background: '#f0f4f1',
  color: '#555',
  fontSize: '8px',
  textTransform: 'uppercase',
  alignItems: 'center'
};

const highlightRow:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1fr) 118px 118px',
  gap: '6px',
  padding: '6px 8px',
  borderTop: '1px solid #eef0ee',
  alignItems: 'center'
};

const highlightLabel:
  React.CSSProperties = {
  fontSize: '10px',
  lineHeight: 1.3
};

const highlightSelect:
  React.CSSProperties = {
  width: '100%',
  minHeight: '31px',
  border: '1px solid #d7dcd9',
  borderRadius: '7px',
  padding: '4px 5px',
  background: '#fff',
  fontSize: '9px'
};

const weakSelect:
  React.CSSProperties = {
  background: '#fff2f2',
  color: '#9b1c1c',
  borderColor: '#efcaca'
};

const weaponSelect:
  React.CSSProperties = {
  background: '#eef9f2',
  color: '#0b6b35',
  borderColor: '#c7e4d1'
};

const label:
  React.CSSProperties = {
  margin: '4px 0',
  color: '#666',
  fontSize: '9px',
  fontWeight: 800
};

const textarea:
  React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #d5dad7',
  borderRadius: '8px',
  padding: '8px',
  resize: 'vertical',
  font: 'inherit'
};
