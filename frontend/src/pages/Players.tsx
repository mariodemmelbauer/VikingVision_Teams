type Player = {
  id: number | string;
  name?: string;
  birth_date?: string;
  birth_year?: number;
  primary_position?: string;
  secondary_position?: string;
  preferred_foot?: string;
  nationality?: string;
  height_cm?: number;
  height?: number;
  current_club?: string;
  market_value?: string | number;
  image_path?: string;
  contract_until?: string;
  contract_end?: string;
  agent_agency?: string;
  squad_status?: string;
  priority?: string | number;
  potential?: string | number;
  notes?: string;
  transfermarkt_url?: string;
  video_url?: string;
};

type Props = {
  players: Player[];
  loading: boolean;
  error?: string;
  onBack: () => void;
  onOpenPlayer: (player: Player) => void;
};

export default function Players({
  players,
  loading,
  error,
  onBack,
  onOpenPlayer
}: Props) {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">
            SV Oberbank Ried
          </div>

          <h1>Spieler</h1>

          <p>VikingVision Spieler-Datenbank</p>
        </div>

        <button
          type="button"
          onClick={onBack}
          style={{
            border: 'none',
            background: '#0b7a3b',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          ← Dashboard
        </button>
      </section>

      {loading && (
        <section
          style={{
            marginTop: '20px',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '18px',
            border: '1px solid #ececec'
          }}
        >
          Spieler werden geladen…
        </section>
      )}

      {error && (
        <section
          style={{
            marginTop: '20px',
            padding: '14px 16px',
            background: '#fff3f3',
            color: '#a00000',
            borderRadius: '10px',
            border: '1px solid #f2cccc'
          }}
        >
          <strong>Fehler:</strong>

          <div style={{ marginTop: '4px' }}>
            {error}
          </div>
        </section>
      )}

      {!loading && !error && (
        <>
          <div
            style={{
              marginTop: '22px',
              marginBottom: '12px',
              fontWeight: 700,
              fontSize: '16px'
            }}
          >
            {players.length} Spieler
          </div>

          {players.length === 0 ? (
            <section
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '18px',
                border: '1px solid #ececec'
              }}
            >
              Keine Spieler gefunden.
            </section>
          ) : (
            <section
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '14px'
              }}
            >
              {players.map(player => {
                const contractUntil =
                  player.contract_until ??
                  player.contract_end;

                const height =
                  player.height_cm ??
                  player.height;

                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() =>
                      onOpenPlayer(player)
                    }
                    style={{
                      appearance: 'none',
                      width: '100%',
                      textAlign: 'left',
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '18px',
                      boxShadow:
                        '0 3px 14px rgba(0,0,0,0.06)',
                      border:
                        '1px solid #ececec',
                      cursor: 'pointer',
                      color: 'inherit',
                      font: 'inherit'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'center'
                      }}
                    >
                      <div
                        style={{
                          width: '64px',
                          height: '80px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: '#f1f1f1',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {player.image_path ? (
                          <img
                            src={player.image_path}
                            alt={
                              player.name ??
                              'Spieler'
                            }
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: '24px'
                            }}
                          >
                            👤
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          minWidth: 0,
                          flex: 1
                        }}
                      >
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            marginBottom: '6px',
                            overflow: 'hidden',
                            textOverflow:
                              'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {player.name ??
                            `Spieler ${player.id}`}
                        </div>

                        {player.primary_position && (
                          <div
                            style={{
                              fontSize: '14px',
                              color: '#555',
                              marginBottom: '3px'
                            }}
                          >
                            {
                              player.primary_position
                            }
                          </div>
                        )}

                        {player.current_club && (
                          <div
                            style={{
                              fontSize: '13px',
                              color: '#777',
                              overflow: 'hidden',
                              textOverflow:
                                'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {player.current_club}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '14px',
                        paddingTop: '12px',
                        borderTop:
                          '1px solid #eeeeee',
                        display: 'grid',
                        gridTemplateColumns:
                          '1fr 1fr',
                        gap: '8px',
                        fontSize: '13px'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: '#888',
                            fontSize: '11px',
                            textTransform:
                              'uppercase'
                          }}
                        >
                          Nationalität
                        </div>

                        <div
                          style={{
                            marginTop: '2px',
                            fontWeight: 600
                          }}
                        >
                          {player.nationality ??
                            '–'}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: '#888',
                            fontSize: '11px',
                            textTransform:
                              'uppercase'
                          }}
                        >
                          Fuß
                        </div>

                        <div
                          style={{
                            marginTop: '2px',
                            fontWeight: 600
                          }}
                        >
                          {player.preferred_foot ??
                            '–'}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: '#888',
                            fontSize: '11px',
                            textTransform:
                              'uppercase'
                          }}
                        >
                          Größe
                        </div>

                        <div
                          style={{
                            marginTop: '2px',
                            fontWeight: 600
                          }}
                        >
                          {height
                            ? `${height} cm`
                            : '–'}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: '#888',
                            fontSize: '11px',
                            textTransform:
                              'uppercase'
                          }}
                        >
                          Vertrag
                        </div>

                        <div
                          style={{
                            marginTop: '2px',
                            fontWeight: 600
                          }}
                        >
                          {contractUntil ??
                            '–'}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '14px',
                        color: '#0b7a3b',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}
                    >
                      Spielerprofil öffnen →
                    </div>
                  </button>
                );
              })}
            </section>
          )}
        </>
      )}
    </main>
  );
}
