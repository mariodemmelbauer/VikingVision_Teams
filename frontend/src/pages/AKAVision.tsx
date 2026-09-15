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

type TrainingSession = {
  id: number;
  team: string;
  session_date: string;
  title?: string;
  session_type?: string;
  duration_minutes: number;
  notes?: string;
};

type TrainingAttendance = {
  session_id: number;
  academy_player_id: number;
  present: boolean;
  minutes: number;
  comment?: string;
  player_name?: string;
  session_date?: string;
  session_title?: string;
  session_type?: string;
};

type IdealScore = {
  assessment_id: number;
  ideal_code: string;
  status_quo?: number;
  potential?: number;
  notes?: string;
  measured_value?: string;
  rating?: number;
  detail_ratings?: Record<string, unknown>;
};

type IdealAssessment = {
  id: number;
  academy_player_id: number;
  period_label: string;
  assessment_date?: string;
  player_role?: string;
  player_name?: string;
  scores: IdealScore[];
};


type AcademyScoutingPlayer = {
  id: number;
  name: string;
  birth_date?: string;
  birth_year?: number;
  current_club?: string;
  primary_position?: string;
  secondary_position?: string;
  preferred_foot?: string;
  nationality?: string;
  height_cm?: number;
  notes?: string;
};

type AcademyScoutingReport = {
  id: number;
  player_id: number;
  player_name?: string;
  scout_name?: string;
  observation_date: string;
  competition?: string;
  match_name?: string;
  opponent?: string;
  observed_position?: string;
  minutes_played?: number;
  technical_rating?: number;
  tactical_rating?: number;
  athletic_rating?: number;
  mentality_rating?: number;
  potential_rating?: number;
  strengths?: string;
  development_areas?: string;
  overall_impression?: string;
  recommendation?: string;
  next_action?: string;
};

type Overview = {
  team: string;
  playerCount: number;
  upcomingFixtureCount: number;
  playedMatchCount: number;
  totalMinutes: number;
  trainingSessionCount?: number;
  trainingMinutes?: number;
};

type Props = {
  accessToken?: string;
  apiBase: string;
  onBack: () => void;
};

type Tab =
  | 'overview'
  | 'players'
  | 'matches'
  | 'training'
  | 'ideals'
  | 'scouting';

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

  const [trainingSessions, setTrainingSessions] =
    useState<TrainingSession[]>([]);

  const [trainingAttendance, setTrainingAttendance] =
    useState<TrainingAttendance[]>([]);

  const [idealAssessments, setIdealAssessments] =
    useState<IdealAssessment[]>([]);

  const [scoutingPlayers, setScoutingPlayers] =
    useState<AcademyScoutingPlayer[]>([]);

  const [scoutingReports, setScoutingReports] =
    useState<AcademyScoutingReport[]>([]);

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
        matchData,
        trainingData,
        idealsData,
        scoutingData
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
          ),
          apiGet(
            `/academy/training?team=${encodedTeam}`
          ),
          apiGet(
            `/academy/ideals?team=${encodedTeam}`
          ),
          apiGet(
            `/academy/scouting`
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

      setTrainingSessions(
        Array.isArray(
          trainingData.sessions
        )
          ? trainingData.sessions
          : []
      );

      setTrainingAttendance(
        Array.isArray(
          trainingData.attendance
        )
          ? trainingData.attendance
          : []
      );

      setIdealAssessments(
        Array.isArray(
          idealsData.assessments
        )
          ? idealsData.assessments
          : []
      );

      setScoutingPlayers(
        Array.isArray(
          scoutingData.players
        )
          ? scoutingData.players
          : []
      );

      setScoutingReports(
        Array.isArray(
          scoutingData.reports
        )
          ? scoutingData.reports
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
            Spiele, Training und Ideale
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
          <div style={{ marginTop: '4px' }}>
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
          active={tab === 'overview'}
          onClick={() => setTab('overview')}
        >
          Übersicht
        </TabButton>

        <TabButton
          active={tab === 'players'}
          onClick={() => setTab('players')}
        >
          Spieler
        </TabButton>

        <TabButton
          active={tab === 'matches'}
          onClick={() => setTab('matches')}
        >
          Spiele
        </TabButton>

        <TabButton
          active={tab === 'training'}
          onClick={() => setTab('training')}
        >
          Training
        </TabButton>

        <TabButton
          active={tab === 'ideals'}
          onClick={() => setTab('ideals')}
        >
          Ideale
        </TabButton>

        <TabButton
          active={tab === 'scouting'}
          onClick={() => setTab('scouting')}
        >
          Scouting
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
              trainingSessions={trainingSessions}
              trainingAttendance={trainingAttendance}
            />
          )}

          {tab === 'players' && (
            <PlayersTab players={players} />
          )}

          {tab === 'matches' && (
            <MatchesTab
              fixtures={fixtures}
              matches={matches}
            />
          )}

          {tab === 'training' && (
            <TrainingTab
              players={players}
              sessions={trainingSessions}
              attendance={trainingAttendance}
            />
          )}

          {tab === 'ideals' && (
            <IdealsTab
              players={players}
              assessments={idealAssessments}
            />
          )}

          {tab === 'scouting' && (
            <ScoutingTab
              accessToken={accessToken}
              apiBase={apiBase}
              players={scoutingPlayers}
              reports={scoutingReports}
              onReload={loadTeamData}
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
  matches,
  trainingSessions,
  trainingAttendance
}: {
  team: AcademyTeam;
  overview: Overview | null;
  players: AcademyPlayer[];
  fixtures: AcademyFixture[];
  matches: AcademyMatch[];
  trainingSessions: TrainingSession[];
  trainingAttendance: TrainingAttendance[];
}) {
  const upcoming =
    fixtures.slice(0, 5);

  const recent =
    matches.slice(0, 5);

  const trainingMinutes =
    trainingAttendance.reduce(
      (sum, item) =>
        sum + Number(item.minutes ?? 0),
      0
    );

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
            overview?.upcomingFixtureCount ??
            fixtures.length
          }
        />

        <Kpi
          label="Erfasste Spiele"
          value={
            overview?.playedMatchCount ??
            matches.length
          }
        />

        <Kpi
          label="Einsatzminuten"
          value={
            overview?.totalMinutes ??
            0
          }
        />

        <Kpi
          label="Trainingseinheiten"
          value={
            overview?.trainingSessionCount ??
            trainingSessions.length
          }
        />

        <Kpi
          label="Trainingsminuten"
          value={
            overview?.trainingMinutes ??
            trainingMinutes
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
          <h2 style={{ marginTop: 0 }}>
            Nächste Spiele {team}
          </h2>

          {upcoming.length === 0 ? (
            <div style={{ color: '#666' }}>
              Keine kommenden Spiele vorhanden.
            </div>
          ) : (
            upcoming.map(fixture => (
              <FixtureRow
                key={fixture.id}
                fixture={fixture}
              />
            ))
          )}
        </div>

        <div style={panel}>
          <h2 style={{ marginTop: 0 }}>
            Letzte Spiele {team}
          </h2>

          {recent.length === 0 ? (
            <div style={{ color: '#666' }}>
              Noch keine Spiele vorhanden.
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
        <h2 style={{ marginTop: 0 }}>
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
                    marginTop: '4px',
                    color: '#666',
                    fontSize: '13px'
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
          Number(a.jersey_number);
        const numberB =
          Number(b.jersey_number);

        if (
          Number.isFinite(numberA) &&
          Number.isFinite(numberB)
        ) {
          return numberA - numberB;
        }

        return a.name.localeCompare(
          b.name,
          'de'
        );
      }
    );

  return (
    <section style={{ marginTop: '18px' }}>
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
                alignItems: 'baseline',
                gap: '8px'
              }}
            >
              {player.jersey_number && (
                <span style={numberBadge}>
                  {player.jersey_number}
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
              value={player.primary_position}
            />

            <InfoLine
              label="Rolle"
              value={player.player_role}
            />

            <InfoLine
              label="Fuß"
              value={player.preferred_foot}
            />

            <InfoLine
              label="Status"
              value={player.squad_status}
            />

            {player.birth_date && (
              <InfoLine
                label="Geburtsdatum"
                value={formatDate(
                  player.birth_date
                )}
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
        <h2 style={{ marginTop: 0 }}>
          Spielplan
        </h2>

        {fixtures.length === 0 ? (
          <div>Keine Spielplan-Daten.</div>
        ) : (
          fixtures.map(fixture => (
            <FixtureRow
              key={fixture.id}
              fixture={fixture}
            />
          ))
        )}
      </div>

      <div style={panel}>
        <h2 style={{ marginTop: 0 }}>
          Gespielte Matches
        </h2>

        {matches.length === 0 ? (
          <div>Keine Match-Daten.</div>
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

function TrainingTab({
  players,
  sessions,
  attendance
}: {
  players: AcademyPlayer[];
  sessions: TrainingSession[];
  attendance: TrainingAttendance[];
}) {
  const playerById =
    new Map(
      players.map(player => [
        String(player.id),
        player
      ])
    );

  const stats =
    players
      .map(player => {
        const rows =
          attendance.filter(
            item =>
              String(
                item.academy_player_id
              ) === String(player.id)
          );

        const present =
          rows.filter(
            row => row.present
          ).length;

        const minutes =
          rows.reduce(
            (sum, row) =>
              sum +
              Number(row.minutes ?? 0),
            0
          );

        const rate =
          sessions.length > 0
            ? Math.round(
                (present /
                  sessions.length) *
                  100
              )
            : 0;

        return {
          player,
          present,
          minutes,
          rate
        };
      })
      .sort(
        (a, b) =>
          b.minutes - a.minutes
      );

  return (
    <section style={{ marginTop: '18px' }}>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}
      >
        <Kpi
          label="Einheiten"
          value={sessions.length}
        />

        <Kpi
          label="Anwesenheitseinträge"
          value={attendance.length}
        />

        <Kpi
          label="Gesamtminuten"
          value={attendance.reduce(
            (sum, row) =>
              sum +
              Number(row.minutes ?? 0),
            0
          )}
        />
      </section>

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
          <h2 style={{ marginTop: 0 }}>
            Trainingseinheiten
          </h2>

          {sessions.length === 0 ? (
            <div>
              Noch keine Trainingseinheiten vorhanden.
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                style={rowStyle}
              >
                <div>
                  <strong>
                    {formatDate(
                      session.session_date
                    )}
                  </strong>

                  <div
                    style={{
                      marginTop: '3px'
                    }}
                  >
                    {session.title ??
                      session.session_type ??
                      'Training'}
                  </div>

                  <div
                    style={{
                      marginTop: '3px',
                      color: '#777',
                      fontSize: '12px'
                    }}
                  >
                    {[
                      session.session_type,
                      `${session.duration_minutes} Min.`
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={panel}>
          <h2 style={{ marginTop: 0 }}>
            Trainingsbeteiligung
          </h2>

          {stats.length === 0 ? (
            <div>Keine Daten vorhanden.</div>
          ) : (
            stats.map(item => (
              <div
                key={item.player.id}
                style={rowStyle}
              >
                <div>
                  <strong>
                    {item.player.name}
                  </strong>
                  <div
                    style={{
                      marginTop: '3px',
                      color: '#777',
                      fontSize: '12px'
                    }}
                  >
                    {item.present} Einheiten · {item.minutes} Min.
                  </div>
                </div>

                <strong>
                  {item.rate} %
                </strong>
              </div>
            ))
          )}
        </div>
      </section>

      {attendance.some(
        item => item.comment
      ) && (
        <section
          style={{
            ...panel,
            marginTop: '18px'
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Kommentare
          </h2>

          {attendance
            .filter(item => item.comment)
            .map((item, index) => (
              <div
                key={`${item.session_id}-${item.academy_player_id}-${index}`}
                style={rowStyle}
              >
                <div>
                  <strong>
                    {item.player_name ??
                      playerById.get(
                        String(
                          item.academy_player_id
                        )
                      )?.name ??
                      `Spieler ${item.academy_player_id}`}
                  </strong>

                  <div
                    style={{
                      marginTop: '3px',
                      color: '#777',
                      fontSize: '12px'
                    }}
                  >
                    {item.session_date
                      ? formatDate(
                          item.session_date
                        )
                      : ''}
                  </div>

                  <div
                    style={{
                      marginTop: '5px'
                    }}
                  >
                    {item.comment}
                  </div>
                </div>
              </div>
            ))}
        </section>
      )}
    </section>
  );
}

function IdealsTab({
  players,
  assessments
}: {
  players: AcademyPlayer[];
  assessments: IdealAssessment[];
}) {
  const playerById =
    new Map(
      players.map(player => [
        String(player.id),
        player
      ])
    );

  const sorted =
    [...assessments].sort(
      (a, b) => {
        const dateA =
          a.assessment_date ?? '';
        const dateB =
          b.assessment_date ?? '';
        return dateB.localeCompare(
          dateA
        );
      }
    );

  return (
    <section style={{ marginTop: '18px' }}>
      <div
        style={{
          marginBottom: '12px',
          fontWeight: 700
        }}
      >
        {sorted.length} Bewertungen
      </div>

      {sorted.length === 0 ? (
        <section style={panel}>
          Noch keine Ideale-Bewertungen vorhanden.
        </section>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '14px'
          }}
        >
          {sorted.map(
            assessment => {
              const player =
                playerById.get(
                  String(
                    assessment.academy_player_id
                  )
                );

              return (
                <article
                  key={assessment.id}
                  style={panel}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      gap: '12px',
                      alignItems:
                        'flex-start'
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          fontSize: '18px'
                        }}
                      >
                        {assessment.player_name ??
                          player?.name ??
                          `Spieler ${assessment.academy_player_id}`}
                      </strong>

                      <div
                        style={{
                          marginTop: '4px',
                          color: '#777',
                          fontSize: '13px'
                        }}
                      >
                        {assessment.period_label}
                        {assessment.assessment_date
                          ? ` · ${formatDate(
                              assessment.assessment_date
                            )}`
                          : ''}
                      </div>
                    </div>

                    {assessment.player_role && (
                      <span style={roleBadge}>
                        {assessment.player_role}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gap: '8px',
                      marginTop: '14px'
                    }}
                  >
                    {assessment.scores.length === 0 ? (
                      <div
                        style={{
                          color: '#777'
                        }}
                      >
                        Keine Detailwerte vorhanden.
                      </div>
                    ) : (
                      assessment.scores.map(
                        score => (
                          <div
                            key={`${assessment.id}-${score.ideal_code}`}
                            style={scoreRow}
                          >
                            <div>
                              <strong>
                                {score.ideal_code}
                              </strong>

                              {score.notes && (
                                <div
                                  style={{
                                    marginTop:
                                      '3px',
                                    color:
                                      '#777',
                                    fontSize:
                                      '12px'
                                  }}
                                >
                                  {score.notes}
                                </div>
                              )}
                            </div>

                            <div
                              style={{
                                textAlign:
                                  'right',
                                fontSize:
                                  '12px'
                              }}
                            >
                              {score.rating != null && (
                                <div>
                                  Rating:{' '}
                                  <strong>
                                    {score.rating}
                                  </strong>
                                </div>
                              )}

                              {score.status_quo != null && (
                                <div>
                                  Status:{' '}
                                  <strong>
                                    {score.status_quo}
                                  </strong>
                                </div>
                              )}

                              {score.potential != null && (
                                <div>
                                  Potenzial:{' '}
                                  <strong>
                                    {score.potential}
                                  </strong>
                                </div>
                              )}

                              {score.measured_value && (
                                <div>
                                  Wert:{' '}
                                  <strong>
                                    {score.measured_value}
                                  </strong>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}


function ScoutingTab({
  accessToken,
  apiBase,
  players,
  reports,
  onReload
}: {
  accessToken?: string;
  apiBase: string;
  players: AcademyScoutingPlayer[];
  reports: AcademyScoutingReport[];
  onReload: () => Promise<void>;
}) {
  const [showForm, setShowForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState<string | undefined>();

  const [form, setForm] =
    useState({
      player_id: '',
      scout_name: '',
      observation_date:
        new Date()
          .toISOString()
          .slice(0, 10),
      competition: '',
      match_name: '',
      opponent: '',
      observed_position: '',
      minutes_played: '',
      technical_rating: '',
      tactical_rating: '',
      athletic_rating: '',
      mentality_rating: '',
      potential_rating: '',
      strengths: '',
      development_areas: '',
      overall_impression: '',
      recommendation: '',
      next_action: ''
    });

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  }

  async function saveReport() {
    if (!accessToken) {
      setFormError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    if (
      !form.player_id ||
      !form.observation_date
    ) {
      setFormError(
        'Spieler und Beobachtungsdatum sind Pflichtfelder.'
      );
      return;
    }

    setSaving(true);
    setFormError(undefined);

    const numberOrNull =
      (value: string) =>
        value === ''
          ? null
          : Number(value);

    try {
      const response =
        await fetch(
          `${apiBase}/academy/scouting/reports`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              player_id:
                Number(form.player_id),
              scout_name:
                form.scout_name || null,
              observation_date:
                form.observation_date,
              competition:
                form.competition || null,
              match_name:
                form.match_name || null,
              opponent:
                form.opponent || null,
              observed_position:
                form.observed_position || null,
              minutes_played:
                numberOrNull(
                  form.minutes_played
                ),
              technical_rating:
                numberOrNull(
                  form.technical_rating
                ),
              tactical_rating:
                numberOrNull(
                  form.tactical_rating
                ),
              athletic_rating:
                numberOrNull(
                  form.athletic_rating
                ),
              mentality_rating:
                numberOrNull(
                  form.mentality_rating
                ),
              potential_rating:
                numberOrNull(
                  form.potential_rating
                ),
              strengths:
                form.strengths || null,
              development_areas:
                form.development_areas || null,
              overall_impression:
                form.overall_impression || null,
              recommendation:
                form.recommendation || null,
              next_action:
                form.next_action || null
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Scoutingbericht konnte nicht gespeichert werden.'
        );
      }

      setShowForm(false);
      setForm({
        player_id: '',
        scout_name: '',
        observation_date:
          new Date()
            .toISOString()
            .slice(0, 10),
        competition: '',
        match_name: '',
        opponent: '',
        observed_position: '',
        minutes_played: '',
        technical_rating: '',
        tactical_rating: '',
        athletic_rating: '',
        mentality_rating: '',
        potential_rating: '',
        strengths: '',
        development_areas: '',
        overall_impression: '',
        recommendation: '',
        next_action: ''
      });

      await onReload();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Speichern fehlgeschlagen.'
      );
    } finally {
      setSaving(false);
    }
  }

  const sortedPlayers =
    [...players].sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          'de'
        )
    );

  return (
    <section style={{ marginTop: '18px' }}>
      <section
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div>
          <strong>
            {players.length} Scouting-Spieler
          </strong>
          <span
            style={{
              marginLeft: '12px',
              color: '#666'
            }}
          >
            {reports.length} Berichte
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowForm(
              value => !value
            )
          }
          style={primaryButton}
        >
          + Neuer Bericht
        </button>
      </section>

      {showForm && (
        <section
          style={{
            ...panel,
            marginTop: '16px'
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Academy-Scoutingbericht
          </h2>

          {formError && (
            <div style={errorBox}>
              {formError}
            </div>
          )}

          <div style={scoutingFormGrid}>
            <Field label="Spieler">
              <select
                value={form.player_id}
                onChange={event =>
                  updateField(
                    'player_id',
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  Spieler auswählen…
                </option>

                {sortedPlayers.map(
                  player => (
                    <option
                      key={player.id}
                      value={player.id}
                    >
                      {player.name}
                      {player.current_club
                        ? ` · ${player.current_club}`
                        : ''}
                    </option>
                  )
                )}
              </select>
            </Field>

            <TextInput
              label="Scout"
              value={form.scout_name}
              onChange={value =>
                updateField(
                  'scout_name',
                  value
                )
              }
            />

            <Field label="Datum">
              <input
                type="date"
                value={
                  form.observation_date
                }
                onChange={event =>
                  updateField(
                    'observation_date',
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </Field>

            <TextInput
              label="Bewerb"
              value={form.competition}
              onChange={value =>
                updateField(
                  'competition',
                  value
                )
              }
            />

            <TextInput
              label="Spiel"
              value={form.match_name}
              onChange={value =>
                updateField(
                  'match_name',
                  value
                )
              }
            />

            <TextInput
              label="Gegner"
              value={form.opponent}
              onChange={value =>
                updateField(
                  'opponent',
                  value
                )
              }
            />

            <TextInput
              label="Beobachtete Position"
              value={
                form.observed_position
              }
              onChange={value =>
                updateField(
                  'observed_position',
                  value
                )
              }
            />

            <TextInput
              label="Minuten"
              value={
                form.minutes_played
              }
              type="number"
              onChange={value =>
                updateField(
                  'minutes_played',
                  value
                )
              }
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '10px',
              marginTop: '14px'
            }}
          >
            {[
              ['technical_rating', 'Technik'],
              ['tactical_rating', 'Taktik'],
              ['athletic_rating', 'Athletik'],
              ['mentality_rating', 'Mentalität'],
              ['potential_rating', 'Potenzial']
            ].map(([key, label]) => (
              <Field
                key={key}
                label={`${label} (1–5)`}
              >
                <select
                  value={
                    form[
                      key as keyof typeof form
                    ]
                  }
                  onChange={event =>
                    updateField(
                      key as keyof typeof form,
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">–</option>
                  {[1,2,3,4,5].map(
                    value => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    )
                  )}
                </select>
              </Field>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gap: '12px',
              marginTop: '14px'
            }}
          >
            <Area
              label="Stärken"
              value={form.strengths}
              onChange={value =>
                updateField(
                  'strengths',
                  value
                )
              }
            />

            <Area
              label="Entwicklungsfelder"
              value={
                form.development_areas
              }
              onChange={value =>
                updateField(
                  'development_areas',
                  value
                )
              }
            />

            <Area
              label="Gesamteindruck"
              value={
                form.overall_impression
              }
              onChange={value =>
                updateField(
                  'overall_impression',
                  value
                )
              }
            />

            <Area
              label="Empfehlung"
              value={
                form.recommendation
              }
              onChange={value =>
                updateField(
                  'recommendation',
                  value
                )
              }
            />

            <Area
              label="Nächster Schritt"
              value={
                form.next_action
              }
              onChange={value =>
                updateField(
                  'next_action',
                  value
                )
              }
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px'
            }}
          >
            <button
              type="button"
              onClick={saveReport}
              disabled={saving}
              style={primaryButton}
            >
              {saving
                ? 'Speichert…'
                : 'Bericht speichern'}
            </button>

            <button
              type="button"
              onClick={() =>
                setShowForm(false)
              }
              style={secondaryButton}
            >
              Abbrechen
            </button>
          </div>
        </section>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '14px',
          marginTop: '18px'
        }}
      >
        {reports.map(report => (
          <article
            key={report.id}
            style={panel}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                gap: '12px'
              }}
            >
              <div>
                <strong
                  style={{
                    fontSize: '18px'
                  }}
                >
                  {report.player_name ??
                    `Spieler ${report.player_id}`}
                </strong>

                <div
                  style={{
                    marginTop: '4px',
                    color: '#777',
                    fontSize: '12px'
                  }}
                >
                  {formatDate(
                    report.observation_date
                  )}
                  {report.scout_name
                    ? ` · ${report.scout_name}`
                    : ''}
                </div>
              </div>

              {report.potential_rating != null && (
                <span style={roleBadge}>
                  Potenzial{' '}
                  {report.potential_rating}/5
                </span>
              )}
            </div>

            <InfoLine
              label="Position"
              value={
                report.observed_position
              }
            />

            <InfoLine
              label="Bewerb"
              value={
                report.competition
              }
            />

            <InfoLine
              label="Spiel"
              value={
                report.match_name ??
                report.opponent
              }
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2, 1fr)',
                gap: '8px',
                marginTop: '12px'
              }}
            >
              <RatingBox
                label="Technik"
                value={
                  report.technical_rating
                }
              />
              <RatingBox
                label="Taktik"
                value={
                  report.tactical_rating
                }
              />
              <RatingBox
                label="Athletik"
                value={
                  report.athletic_rating
                }
              />
              <RatingBox
                label="Mentalität"
                value={
                  report.mentality_rating
                }
              />
            </div>

            {report.strengths && (
              <TextBlock
                label="Stärken"
                value={report.strengths}
              />
            )}

            {report.development_areas && (
              <TextBlock
                label="Entwicklungsfelder"
                value={
                  report.development_areas
                }
              />
            )}

            {report.recommendation && (
              <TextBlock
                label="Empfehlung"
                value={
                  report.recommendation
                }
              />
            )}

            {report.next_action && (
              <TextBlock
                label="Nächster Schritt"
                value={
                  report.next_action
                }
              />
            )}
          </article>
        ))}
      </section>
    </section>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <div style={fieldLabel}>
        {label}
      </div>
      {children}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        value={value}
        onChange={event =>
          onChange(
            event.target.value
          )
        }
        style={inputStyle}
      />
    </Field>
  );
}

function Area({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        rows={3}
        value={value}
        onChange={event =>
          onChange(
            event.target.value
          )
        }
        style={{
          ...inputStyle,
          resize: 'vertical'
        }}
      />
    </Field>
  );
}

function RatingBox({
  label,
  value
}: {
  label: string;
  value?: number;
}) {
  return (
    <div
      style={{
        background: '#f6f8f7',
        borderRadius: '8px',
        padding: '9px'
      }}
    >
      <div
        style={{
          color: '#777',
          fontSize: '11px',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>

      <strong>
        {value ?? '–'}
        {value != null ? '/5' : ''}
      </strong>
    </div>
  );
}

function TextBlock({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        marginTop: '12px'
      }}
    >
      <strong>{label}</strong>
      <div
        style={{
          marginTop: '4px',
          whiteSpace: 'pre-wrap'
        }}
      >
        {value}
      </div>
    </div>
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

        <div style={{ marginTop: '3px' }}>
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

        <div style={{ marginTop: '3px' }}>
          {match.opponent}
        </div>

        <div
          style={{
            marginTop: '3px',
            color: '#777',
            fontSize: '12px'
          }}
        >
          {match.competition ?? '–'}
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
          textTransform: 'uppercase'
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
      <span style={{ color: '#777' }}>
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


const scoutingFormGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '12px'
};

const fieldLabel:
  React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  textTransform: 'uppercase',
  fontWeight: 700,
  marginBottom: '5px'
};

const inputStyle:
  React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #d5d5d5',
  borderRadius: '8px',
  padding: '10px',
  background: '#fff',
  font: 'inherit'
};

const primaryButton:
  React.CSSProperties = {
  border: 'none',
  background: '#0b7a3b',
  color: '#fff',
  padding: '11px 16px',
  borderRadius: '9px',
  cursor: 'pointer',
  fontWeight: 700
};

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

const roleBadge:
  React.CSSProperties = {
  background: '#f0f4f2',
  borderRadius: '999px',
  padding: '5px 9px',
  fontSize: '11px',
  fontWeight: 700
};

const scoreRow:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  gap: '14px',
  background: '#f7f8f7',
  borderRadius: '9px',
  padding: '10px'
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
