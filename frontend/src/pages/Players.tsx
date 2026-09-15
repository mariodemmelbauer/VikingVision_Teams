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
  current_club?: string;
  market_value?: string | number;
  image_path?: string;
  contract_until?: string;
  contract_end?: string;
};

type Props = {
  players: Player[];
  loading: boolean;
  error?: string;
  onBack: () => void;
};

export default function Players({
  players,
  loading,
  error,
  onBack
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
          onClick={onBack}
          style={{
            border: 'none',
            background: '#0b7a3b',
            color: '#fff',
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
            marginTop: '20px'
          }}
        >
          Spieler werden geladen…
        </section>
      )}

      {error && (
        <section
          style={{
            marginTop: '20px',
            padding: '14px',
            background: '#fff3f3',
            color: '#a00000',
            borderRadius: '10px'
          }}
        >
          {error}
        </section>
      )}

      {!loading && !error && (
        <>
          <div
            style={{
              marginTop: '22px',
              marginBottom: '12px',
              fontWeight: 700
            }}
          >
            {players.length} Spieler
          </div>

          <section
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '14px'
            }}
          >
            {players.map(player => (
              <div
                key={player.id}
                style={{
                  background: '#fff',
                  borderRadius: '14px',
                  padding: '18px',
                  boxShadow:
                    '0 3px 14px rgba(0,0,0,0.06)',
                  border:
                    '1px solid #ececec'
                }}
              >
                <div
                  style={{
                    fontSize: '19px',
                    fontWeight: 700,
                    marginBottom: '8px'
                  }}
                >
                  {player.name ??
                    `Spieler ${player.id}`}
                </div>

                <div
                  style={{
                    fontSize: '14px',
                    color: '#555',
                    lineHeight: 1.6
                  }}
                >
                  {player.primary_position && (
                    <div>
                      Position:{' '}
                      {player.primary_position}
                    </div>
                  )}

                  {player.current_club && (
                    <div>
                      Verein:{' '}
                      {player.current_club}
                    </div>
                  )}

                  {player.nationality && (
                    <div>
                      Nationalität:{' '}
                      {player.nationality}
                    </div>
                  )}

                  {player.birth_date && (
                    <div>
                      Geburtsdatum:{' '}
                      {player.birth_date}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
