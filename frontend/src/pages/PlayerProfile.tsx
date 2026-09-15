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
  player: Player;
  onBack: () => void;
};

function valueOrDash(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '–';
  }

  return String(value);
}

export default function PlayerProfile({
  player,
  onBack
}: Props) {
  const contractUntil =
    player.contract_until ??
    player.contract_end;

  const height =
    player.height_cm ??
    player.height;

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">
            SV Oberbank Ried
          </div>

          <h1>
            {player.name ?? 'Spielerprofil'}
          </h1>

          <p>VikingVision Spielerprofil</p>
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
          ← Spieler
        </button>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(220px, 320px) 1fr',
          gap: '20px',
          marginTop: '20px'
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid #ececec',
            boxShadow:
              '0 3px 14px rgba(0,0,0,0.06)'
          }}
        >
          {player.image_path ? (
            <img
              src={player.image_path}
              alt={player.name ?? 'Spieler'}
              style={{
                width: '100%',
                aspectRatio: '4 / 5',
                objectFit: 'cover',
                borderRadius: '10px'
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                aspectRatio: '4 / 5',
                borderRadius: '10px',
                background: '#f1f1f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#777'
              }}
            >
              Kein Bild
            </div>
          )}

          <div
            style={{
              marginTop: '16px',
              fontSize: '22px',
              fontWeight: 700
            }}
          >
            {player.name ?? 'Unbekannt'}
          </div>

          <div
            style={{
              marginTop: '5px',
              color: '#666'
            }}
          >
            {valueOrDash(
              player.primary_position
            )}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))',
            gap: '14px'
          }}
        >
          <InfoCard
            label="Geburtsdatum"
            value={valueOrDash(
              player.birth_date ??
              player.birth_year
            )}
          />

          <InfoCard
            label="Position"
            value={valueOrDash(
              player.primary_position
            )}
          />

          <InfoCard
            label="Nebenposition"
            value={valueOrDash(
              player.secondary_position
            )}
          />

          <InfoCard
            label="Fuß"
            value={valueOrDash(
              player.preferred_foot
            )}
          />

          <InfoCard
            label="Nationalität"
            value={valueOrDash(
              player.nationality
            )}
          />

          <InfoCard
            label="Größe"
            value={
              height
                ? `${height} cm`
                : '–'
            }
          />

          <InfoCard
            label="Aktueller Verein"
            value={valueOrDash(
              player.current_club
            )}
          />

          <InfoCard
            label="Vertrag bis"
            value={valueOrDash(
              contractUntil
            )}
          />

          <InfoCard
            label="Marktwert"
            value={valueOrDash(
              player.market_value
            )}
          />

          <InfoCard
            label="Berateragentur"
            value={valueOrDash(
              player.agent_agency
            )}
          />

          <InfoCard
            label="Kaderstatus"
            value={valueOrDash(
              player.squad_status
            )}
          />

          <InfoCard
            label="Priorität"
            value={valueOrDash(
              player.priority
            )}
          />
        </div>
      </section>

      {player.notes && (
        <section
          style={{
            marginTop: '20px',
            background: '#ffffff',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid #ececec'
          }}
        >
          <strong>Notizen</strong>

          <div
            style={{
              marginTop: '10px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {player.notes}
          </div>
        </section>
      )}
    </main>
  );
}

function InfoCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '16px',
        border: '1px solid #ececec',
        boxShadow:
          '0 3px 14px rgba(0,0,0,0.04)'
      }}
    >
      <div
        style={{
          fontSize: '12px',
          textTransform: 'uppercase',
          color: '#777',
          marginBottom: '5px'
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: '16px',
          fontWeight: 700
        }}
      >
        {value}
      </div>
    </div>
  );
}
