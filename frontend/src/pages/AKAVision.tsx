import { useEffect, useMemo, useState } from 'react';

type AcademyTeam = 'U15' | 'U16' | 'U18' | 'JWR';

type AcademyPlayer = {
  id: number;
  team: string;
  name: string;
  birth_date?: string;
  primary_position?: string;
  player_role?: string;
  preferred_foot?: string;
  jersey_number?: string;
  nationality?: string;
  height?: string;
  current_club?: string;
  squad_status?: string;
  boarding_school?: boolean;
  school_type?: string;
  school_class?: string;
  bus_use?: boolean;
  bus_route?: string;
};

type AcademyFixture = {
  id: number;
  team: string;
  match_date: string;
  kickoff_time?: string;
  opponent: string;
  home_away?: string;
  stadium_name?: string;
  city?: string;
  competition?: string;
  result?: string;
  status?: string;
  notes?: string;
};

type AcademyMatch = {
  id: number;
  team: string;
  match_date: string;
  opponent: string;
  competition?: string;
  duration_minutes?: number;
  result?: string;
  notes?: string;
};

type Overview = {
  team: string;
  playerCount: number;
  upcomingFixtureCount: number;
  playedMatchCount: number;
  totalMinutes: number;
};

type Props = {
  accessToken?: string;
  apiBase: string;
  onBack: () => void;
};

type Tab = 'overview' | 'players' | 'matches';

const teams: AcademyTeam[] = [
  'U15',
  'U16',
  'U18',
  'JWR'
];

export default function AKAVision({
  accessToken,
  apiBase,
  onBack
}: Props) {
  const [team, setTeam] =
    useState<AcademyTeam>('U15');

  const [tab, setTab] =
    useState<Tab>('overview');

  const [overview, setOverview] =
    useState<Overview | null>(null);

  const [players, setPlayers] =
    useState<AcademyPlayer[]>([]);

  const [fixtures, setFixtures] =
    useState<AcademyFixture[]>([]);

  const [matches, setMatches] =
    useState<AcademyMatch[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | undefined>();

  useEffect(() => {
    loadTeamData();
  }, [team]);

  async function apiGet(path: string) {
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
        'AKAVision-Anfrage fehlgeschlagen.'
      );
    }

    return data;
  }

  async function loadTeamData() {
    setLoading(true);
    setError(undefined);

    try {
      const encodedTeam =
        encodeURIComponent(team);

      const [
        overviewData,
        playerData,
        fixtureData,
        matchData
      ] =
        await Promise.all([
          apiGet(
            `/academy/overview?team=${encodedTeam}`
          ),
          apiGet(
            `/academy/players?team=${encodedTeam}`
          ),
          apiGet(
            `/academy/fixtures?team=${encodedTeam}`
          ),
          apiGet(
            `/academy/matches?team=${encodedTeam}`
          )
        ]);

      setOverview(
        overviewData.overview ?? null
      );

      setPlayers(
        Array.isArray(
          playerData.players
        )
          ? playerData.players
          : []
      );

      setFixtures(
        Array.isArray(
          fixtureData.fixtures
        )
          ? fixtureData.fixtures
          : []
      );

      setMatches(
        Array.isArray(
          matchData.matches
        )
          ? matchData.matches
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'AKAVision konnte nicht geladen werden.'
      );
    } finally {
      setLoading(false);
    }
  }

  const activePlayers =
    useMemo(
      () =>
        players.filter(
          player =>
            !player.squad_status ||
            player.squad_status ===
              'Aktiv'
        ),
      [players]
    );

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">
            SV Oberbank Ried
          </div>

          <h1>AKAVision</h1>

          <p>
            Akademie-Dashboard für Spieler,
            Spiele und Einsatzdaten
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          style={secondaryButton}
        >
          ← VikingVision
        </button>
      </section>

      <section
        style={{
          ...panel,
          marginTop: '18px'
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          {teams.map(item => (
            <button
              key={item}
              type="button"
              onClick={() =>
                setTeam(item)
              }
              style={
                item === team
                  ? activeTeamButton
                  : teamButton
              }
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <section style={errorBox}>
          <strong>Fehler:</strong>
          <div
            style={{
              marginTop: '4px'
            }}
          >
            {error}
          </div>
        </section>
      )}

      <section
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginTop: '18px'
        }}
      >
        <TabButton
          active={
            tab === 'overview'
          }
          onClick={() =>
            setTab('overview')
          }
        >
          Übersicht
        </TabButton>

        <TabButton
          active={
            tab === 'players'
          }
          onClick={() =>
            setTab('players')
          }
        >
          Spieler
        </TabButton>

        <TabButton
          active={
            tab === 'matches'
          }
          onClick={() =>
            setTab('matches')
          }
        >
          Spiele
        </TabButton>
      </section>

      {loading ? (
        <section
          style={{
            ...panel,
            marginTop: '18px'
          }}
        >
          AKAVision wird geladen…
        </section>
      ) : (
        <>
          {tab === 'overview' && (
            <OverviewTab
              team={team}
              overview={overview}
              players={activePlayers}
              fixtures={fixtures}
              matches={matches}
            />
          )}

          {tab === 'players' && (
            <PlayersTab
              players={players}
            />
          )}

          {tab === 'matches' && (
            <MatchesTab
              fixtures={fixtures}
              matches={matches}
            />
          )}
        </>
      )}
    </main>
  );
}

function OverviewTab({
  team,
  overview,
  players,
  fixtures,
  matches
}: {
  team: AcademyTeam;
  overview: Overview | null;
  players: AcademyPlayer[];
  fixtures: AcademyFixture[];
  matches: AcademyMatch[];
}) {
  const upcoming =
    fixtures.slice(0, 5);

  const recent =
    matches.slice(0, 5);

  return (
    <>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginTop: '18px'
        }}
      >
        <Kpi
          label="Spieler"
          value={
            overview?.playerCount ??
            players.length
          }
        />

        <Kpi
          label="Kommende Spiele"
          value={
            overview
              ?.upcomingFixtureCount ??
            fixtures.length
          }
        />

        <Kpi
          label="Erfasste Spiele"
          value={
            overview
              ?.playedMatchCount ??
            matches.length
          }
        />

        <Kpi
          label="Einsatzminuten"
          value={
            overview
              ?.totalMinutes ??
            0
          }
        />
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          marginTop: '18px'
        }}
      >
        <div style={panel}>
          <h2
            style={{
              marginTop: 0
            }}
          >
            Nächste Spiele {team}
          </h2>

          {upcoming.length === 0 ? (
            <div
              style={{
                color: '#666'
              }}
            >
              Keine kommenden Spiele
              vorhanden.
            </div>
          ) : (
            upcoming.map(
              fixture => (
                <FixtureRow
                  key={fixture.id}
                  fixture={fixture}
                />
              )
            )
          )}
        </div>

        <div style={panel}>
          <h2
            style={{
              marginTop: 0
            }}
          >
            Letzte Spiele {team}
          </h2>

          {recent.length === 0 ? (
            <div
              style={{
                color: '#666'
              }}
            >
              Noch keine Spiele
              vorhanden.
            </div>
          ) : (
            recent.map(match => (
              <MatchRow
                key={match.id}
                match={match}
              />
            ))
          )}
        </div>
      </section>

      <section
        style={{
          ...panel,
          marginTop: '18px'
        }}
      >
        <h2
          style={{
            marginTop: 0
          }}
        >
          Kader {team}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '10px'
          }}
        >
          {players.slice(0, 12).map(
            player => (
              <div
                key={player.id}
                style={miniPlayerCard}
              >
                <strong>
                  {player.jersey_number
                    ? `${player.jersey_number} · `
                    : ''}
                  {player.name}
                </strong>

                <div
                  style={{
                    marginTop:
                      '4px',
                    color: '#666',
                    fontSize:
                      '13px'
                  }}
                >
                  {player.primary_position ??
                    'Position offen'}
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </>
  );
}

function PlayersTab({
  players
}: {
  players: AcademyPlayer[];
}) {
  const sorted =
    [...players].sort(
      (a, b) => {
        const numberA =
          Number(
            a.jersey_number
          );
        const numberB =
          Number(
            b.jersey_number
          );

        if (
          Number.isFinite(
            numberA
          ) &&
          Number.isFinite(
            numberB
          )
        ) {
          return (
            numberA -
            numberB
          );
        }

        return a.name.localeCompare(
          b.name,
          'de'
        );
      }
    );

  return (
    <section
      style={{
        marginTop: '18px'
      }}
    >
      <div
        style={{
          marginBottom: '12px',
          fontWeight: 700
        }}
      >
        {sorted.length} Spieler
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '14px'
        }}
      >
        {sorted.map(player => (
          <article
            key={player.id}
            style={panel}
          >
            <div
              style={{
                display: 'flex',
                alignItems:
                  'baseline',
                gap: '8px'
              }}
            >
              {player.jersey_number && (
                <span
                  style={numberBadge}
                >
                  {
                    player.jersey_number
                  }
                </span>
              )}

              <strong
                style={{
                  fontSize: '18px'
                }}
              >
                {player.name}
              </strong>
            </div>

            <InfoLine
              label="Position"
              value={
                player.primary_position
              }
            />

            <InfoLine
              label="Rolle"
              value={
                player.player_role
              }
            />

            <InfoLine
              label="Fuß"
              value={
                player.preferred_foot
              }
            />

            <InfoLine
              label="Status"
              value={
                player.squad_status
              }
            />

            {player.birth_date && (
              <InfoLine
                label="Geburtsdatum"
                value={
                  formatDate(
                    player.birth_date
                  )
                }
              />
            )}

            {player.school_type && (
              <InfoLine
                label="Schule"
                value={[
                  player.school_type,
                  player.school_class
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function MatchesTab({
  fixtures,
  matches
}: {
  fixtures: AcademyFixture[];
  matches: AcademyMatch[];
}) {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(330px, 1fr))',
        gap: '16px',
        marginTop: '18px'
      }}
    >
      <div style={panel}>
        <h2
          style={{
            marginTop: 0
          }}
        >
          Spielplan
        </h2>

        {fixtures.length === 0 ? (
          <div>
            Keine Spielplan-Daten.
          </div>
        ) : (
          fixtures.map(
            fixture => (
              <FixtureRow
                key={fixture.id}
                fixture={fixture}
              />
            )
          )
        )}
      </div>

      <div style={panel}>
        <h2
          style={{
            marginTop: 0
          }}
        >
          Gespielte Matches
        </h2>

        {matches.length === 0 ? (
          <div>
            Keine Match-Daten.
          </div>
        ) : (
          matches.map(match => (
            <MatchRow
              key={match.id}
              match={match}
            />
          ))
        )}
      </div>
    </section>
  );
}

function FixtureRow({
  fixture
}: {
  fixture: AcademyFixture;
}) {
  return (
    <div style={rowStyle}>
      <div>
        <strong>
          {formatDate(
            fixture.match_date
          )}
          {fixture.kickoff_time
            ? ` · ${fixture.kickoff_time.slice(0, 5)}`
            : ''}
        </strong>

        <div
          style={{
            marginTop: '3px'
          }}
        >
          {fixture.home_away ===
          'Auswärts'
            ? `${fixture.opponent} – SV Ried`
            : `SV Ried – ${fixture.opponent}`}
        </div>

        <div
          style={{
            marginTop: '3px',
            color: '#777',
            fontSize: '12px'
          }}
        >
          {[
            fixture.competition,
            fixture.stadium_name,
            fixture.city
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>

      {fixture.result && (
        <strong
          style={{
            fontSize: '18px'
          }}
        >
          {fixture.result}
        </strong>
      )}
    </div>
  );
}

function MatchRow({
  match
}: {
  match: AcademyMatch;
}) {
  return (
    <div style={rowStyle}>
      <div>
        <strong>
          {formatDate(
            match.match_date
          )}
        </strong>

        <div
          style={{
            marginTop: '3px'
          }}
        >
          {match.opponent}
        </div>

        <div
          style={{
            marginTop: '3px',
            color: '#777',
            fontSize: '12px'
          }}
        >
          {match.competition ??
            '–'}
        </div>
      </div>

      <strong
        style={{
          fontSize: '18px'
        }}
      >
        {match.result ?? '–'}
      </strong>
    </div>
  );
}

function Kpi({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div style={kpiCard}>
      <div
        style={{
          color: '#666',
          fontSize: '12px',
          textTransform:
            'uppercase'
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: '6px',
          fontSize: '28px',
          fontWeight: 800
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InfoLine({
  label,
  value
}: {
  label: string;
  value?: string;
}) {
  if (!value) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          'space-between',
        gap: '12px',
        marginTop: '9px',
        paddingTop: '9px',
        borderTop:
          '1px solid #f0f0f0',
        fontSize: '13px'
      }}
    >
      <span
        style={{
          color: '#777'
        }}
      >
        {label}
      </span>

      <strong
        style={{
          textAlign: 'right'
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={
        active
          ? activeTabButton
          : tabButton
      }
    >
      {children}
    </button>
  );
}

function formatDate(
  value: string
) {
  const date =
    new Date(
      `${value}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    'de-DE'
  );
}

const panel:
  React.CSSProperties = {
  background: '#fff',
  border:
    '1px solid #ececec',
  borderRadius: '14px',
  padding: '18px',
  boxShadow:
    '0 3px 14px rgba(0,0,0,0.04)'
};

const kpiCard:
  React.CSSProperties = {
  ...panel,
  padding: '16px'
};

const miniPlayerCard:
  React.CSSProperties = {
  background: '#f6f8f7',
  borderRadius: '10px',
  padding: '12px'
};

const rowStyle:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  gap: '14px',
  padding: '12px 0',
  borderBottom:
    '1px solid #eeeeee'
};

const numberBadge:
  React.CSSProperties = {
  background: '#0b7a3b',
  color: '#fff',
  borderRadius: '7px',
  padding: '3px 7px',
  fontSize: '12px',
  fontWeight: 800
};

const teamButton:
  React.CSSProperties = {
  border:
    '1px solid #d6d6d6',
  background: '#fff',
  padding: '10px 18px',
  borderRadius: '9px',
  cursor: 'pointer',
  fontWeight: 700
};

const activeTeamButton:
  React.CSSProperties = {
  ...teamButton,
  background: '#0b7a3b',
  borderColor: '#0b7a3b',
  color: '#fff'
};

const tabButton:
  React.CSSProperties = {
  border:
    '1px solid #d6d6d6',
  background: '#fff',
  padding: '9px 15px',
  borderRadius: '999px',
  cursor: 'pointer',
  fontWeight: 700
};

const activeTabButton:
  React.CSSProperties = {
  ...tabButton,
  background: '#111',
  borderColor: '#111',
  color: '#fff'
};

const secondaryButton:
  React.CSSProperties = {
  border:
    '1px solid #d0d0d0',
  background: '#fff',
  color: '#222',
  padding: '12px 18px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 700
};

const errorBox:
  React.CSSProperties = {
  marginTop: '14px',
  padding: '12px 16px',
  background: '#fff3f3',
  color: '#a00000',
  borderRadius: '10px'
};
