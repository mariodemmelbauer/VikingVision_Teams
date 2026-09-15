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
  notes?: string;
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


type SportScienceTest = {
  id: number;
  academy_player_id?: number;
  p12_player_id?: number;
  player_name?: string;
  test_date: string;
  body_weight_kg?: number;
  body_fat_percent?: number;
  sprint_10m_seconds?: number;
  sprint_30m_seconds?: number;
  cmj_cm?: number;
  aerobic_value?: number;
  readiness?: string;
  notes?: string;
};

type SkillAcForm = {
  id: number;
  academy_player_id: number;
  player_name?: string;
  period_old?: string;
  period_new?: string;
  team_old?: string;
  team_new?: string;
  author_old?: string;
  author_new?: string;
  skill_old?: string;
  ac_old?: string;
  consequence_general?: string;
  skill_new?: string;
  ac_new?: string;
  reflection?: string;
  biggest_changes?: string;
};


type IdealScoreForm = {
  ideal_code: string;
  status_quo: string;
  potential: string;
  rating: string;
  measured_value: string;
  notes: string;
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
  | 'scouting'
  | 'sportScience'
  | 'skillAc';

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

  const [sportScienceTests, setSportScienceTests] =
    useState<SportScienceTest[]>([]);

  const [skillAcForms, setSkillAcForms] =
    useState<SkillAcForm[]>([]);

  const [selectedAcademyPlayerId, setSelectedAcademyPlayerId] =
    useState<number | null>(null);

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
        scoutingData,
        sportScienceData,
        skillAcData
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
          ),
          apiGet(
            `/academy/sport-science?team=${encodedTeam}`
          ),
          apiGet(
            `/academy/skill-ac?team=${encodedTeam}`
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

      setSportScienceTests(
        Array.isArray(
          sportScienceData.tests
        )
          ? sportScienceData.tests
          : []
      );

      setSkillAcForms(
        Array.isArray(
          skillAcData.forms
        )
          ? skillAcData.forms
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

  const selectedAcademyPlayer =
    selectedAcademyPlayerId == null
      ? null
      : players.find(
          player =>
            player.id === selectedAcademyPlayerId
        ) ?? null;

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

        <TabButton
          active={tab === 'sportScience'}
          onClick={() => setTab('sportScience')}
        >
          Sport Science
        </TabButton>

        <TabButton
          active={tab === 'skillAc'}
          onClick={() => setTab('skillAc')}
        >
          Skill / AC
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
            <PlayersTab
              players={players}
              onOpenPlayer={player =>
                setSelectedAcademyPlayerId(
                  player.id
                )
              }
            />
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

          {tab === 'sportScience' && (
            <SportScienceTab
              tests={sportScienceTests}
            />
          )}

          {tab === 'skillAc' && (
            <SkillAcTab
              forms={skillAcForms}
            />
          )}
        </>
      )}

      {selectedAcademyPlayer && (
        <AcademyPlayerProfile
          player={selectedAcademyPlayer}
          matches={matches}
          trainingAttendance={trainingAttendance}
          idealAssessments={idealAssessments}
          sportScienceTests={sportScienceTests}
          skillAcForms={skillAcForms}
          accessToken={accessToken}
          apiBase={apiBase}
          onSaved={loadTeamData}
          onClose={() =>
            setSelectedAcademyPlayerId(
              null
            )
          }
        />
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
  players,
  onOpenPlayer
}: {
  players: AcademyPlayer[];
  onOpenPlayer: (
    player: AcademyPlayer
  ) => void;
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
          <button
            key={player.id}
            type="button"
            onClick={() =>
              onOpenPlayer(player)
            }
            style={{
              ...panel,
              textAlign: 'left',
              width: '100%',
              cursor: 'pointer',
              color: 'inherit',
              font: 'inherit'
            }}
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
            <div
              style={{
                marginTop: '12px',
                color: '#0b7a3b',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              Spielerprofil öffnen →
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}


function AcademyPlayerProfile({
  player,
  matches,
  trainingAttendance,
  idealAssessments,
  sportScienceTests,
  skillAcForms,
  accessToken,
  apiBase,
  onSaved,
  onClose
}: {
  player: AcademyPlayer;
  matches: AcademyMatch[];
  trainingAttendance: TrainingAttendance[];
  idealAssessments: IdealAssessment[];
  sportScienceTests: SportScienceTest[];
  skillAcForms: SkillAcForm[];
  accessToken?: string;
  apiBase: string;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const [editing, setEditing] =
    useState(false);

  const [savingPlayer, setSavingPlayer] =
    useState(false);

  const [showSportScienceForm, setShowSportScienceForm] =
    useState(false);

  const [savingSportScience, setSavingSportScience] =
    useState(false);

  const [profileError, setProfileError] =
    useState<string | undefined>();

  const [profileSuccess, setProfileSuccess] =
    useState<string | undefined>();

  const [showIdealForm, setShowIdealForm] =
    useState(false);

  const [savingIdeal, setSavingIdeal] =
    useState(false);

  const [showSkillAcForm, setShowSkillAcForm] =
    useState(false);

  const [savingSkillAc, setSavingSkillAc] =
    useState(false);

  const [editingSkillAcId, setEditingSkillAcId] =
    useState<number | null>(null);

  const [skillAcForm, setSkillAcForm] =
    useState({
      period_old: '',
      period_new: '',
      team_old: player.team ?? '',
      team_new: player.team ?? '',
      author_old: '',
      author_new: '',
      skill_old: '',
      ac_old: '',
      consequence_general: '',
      skill_new: '',
      ac_new: '',
      reflection: '',
      biggest_changes: ''
    });

  const [editingIdealId, setEditingIdealId] =
    useState<number | null>(null);

  const [idealForm, setIdealForm] =
    useState({
      period_label: '',
      assessment_date:
        new Date()
          .toISOString()
          .slice(0, 10),
      player_role:
        player.player_role ?? '',
      scores: [
        {
          ideal_code: 'OFF1',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'OFF2',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'OFF3',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'DEF1',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'DEF3',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        }
      ] as IdealScoreForm[]
    });

  const [playerForm, setPlayerForm] =
    useState({
      name: player.name ?? '',
      birth_date: player.birth_date ?? '',
      primary_position:
        player.primary_position ?? '',
      player_role:
        player.player_role ?? '',
      preferred_foot:
        player.preferred_foot ?? '',
      jersey_number:
        player.jersey_number ?? '',
      nationality:
        player.nationality ?? '',
      height:
        player.height ?? '',
      current_club:
        player.current_club ?? '',
      squad_status:
        player.squad_status ?? '',
      school_type:
        player.school_type ?? '',
      school_class:
        player.school_class ?? '',
      boarding_school:
        Boolean(player.boarding_school),
      bus_use:
        Boolean(player.bus_use),
      bus_route:
        player.bus_route ?? 'KEINE',
      notes:
        player.notes ?? ''
    });

  const [sportScienceForm, setSportScienceForm] =
    useState({
      test_date:
        new Date()
          .toISOString()
          .slice(0, 10),
      body_weight_kg: '',
      body_fat_percent: '',
      sprint_10m_seconds: '',
      sprint_30m_seconds: '',
      cmj_cm: '',
      aerobic_value: '',
      readiness: '',
      notes: ''
    });

  const playerTraining =
    trainingAttendance.filter(
      row =>
        String(
          row.academy_player_id
        ) === String(player.id)
    );

  const playerIdeals =
    idealAssessments.filter(
      assessment =>
        String(
          assessment.academy_player_id
        ) === String(player.id)
    );

  const playerTests =
    sportScienceTests.filter(
      test =>
        String(
          test.academy_player_id
        ) === String(player.id)
    );

  const playerSkillAc =
    skillAcForms.filter(
      form =>
        String(
          form.academy_player_id
        ) === String(player.id)
    );

  const totalTrainingMinutes =
    playerTraining.reduce(
      (sum, row) =>
        sum +
        Number(row.minutes ?? 0),
      0
    );

  const attendanceCount =
    playerTraining.filter(
      row => row.present
    ).length;

  const latestTest =
    [...playerTests].sort(
      (a, b) =>
        b.test_date.localeCompare(
          a.test_date
        )
    )[0];

  const latestIdeal =
    [...playerIdeals].sort(
      (a, b) =>
        String(
          b.assessment_date ?? ''
        ).localeCompare(
          String(
            a.assessment_date ?? ''
          )
        )
    )[0];

  function updatePlayerField(
    field: keyof typeof playerForm,
    value: string | boolean
  ) {
    setPlayerForm(current => ({
      ...current,
      [field]: value
    }));
  }

  function updateSportScienceField(
    field: keyof typeof sportScienceForm,
    value: string
  ) {
    setSportScienceForm(current => ({
      ...current,
      [field]: value
    }));
  }

  async function savePlayer() {
    if (!accessToken) {
      setProfileError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    setSavingPlayer(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);

    try {
      const response =
        await fetch(
          `${apiBase}/academy/player/${player.id}`,
          {
            method: 'PUT',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              name:
                playerForm.name || null,
              birth_date:
                playerForm.birth_date || null,
              primary_position:
                playerForm.primary_position || null,
              player_role:
                playerForm.player_role || null,
              preferred_foot:
                playerForm.preferred_foot || null,
              jersey_number:
                playerForm.jersey_number || null,
              nationality:
                playerForm.nationality || null,
              height:
                playerForm.height || null,
              current_club:
                playerForm.current_club || 'SV Ried',
              squad_status:
                playerForm.squad_status || 'Aktiv',
              school_type:
                playerForm.school_type || null,
              school_class:
                playerForm.school_class || null,
              boarding_school:
                playerForm.boarding_school,
              bus_use:
                playerForm.bus_use,
              bus_route:
                playerForm.bus_use
                  ? playerForm.bus_route || 'KEINE'
                  : 'KEINE',
              notes:
                playerForm.notes || null
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Spielerprofil konnte nicht gespeichert werden.'
        );
      }

      setEditing(false);
      setProfileSuccess(
        'Spielerprofil wurde gespeichert.'
      );

      await onSaved();
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : 'Speichern fehlgeschlagen.'
      );
    } finally {
      setSavingPlayer(false);
    }
  }

  async function saveSportScienceTest() {
    if (!accessToken) {
      setProfileError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    if (!sportScienceForm.test_date) {
      setProfileError(
        'Bitte ein Testdatum angeben.'
      );
      return;
    }

    const numberOrNull =
      (value: string) =>
        value === ''
          ? null
          : Number(value.replace(',', '.'));

    setSavingSportScience(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);

    try {
      const response =
        await fetch(
          `${apiBase}/academy/sport-science`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              academy_player_id:
                player.id,
              test_date:
                sportScienceForm.test_date,
              body_weight_kg:
                numberOrNull(
                  sportScienceForm.body_weight_kg
                ),
              body_fat_percent:
                numberOrNull(
                  sportScienceForm.body_fat_percent
                ),
              sprint_10m_seconds:
                numberOrNull(
                  sportScienceForm.sprint_10m_seconds
                ),
              sprint_30m_seconds:
                numberOrNull(
                  sportScienceForm.sprint_30m_seconds
                ),
              cmj_cm:
                numberOrNull(
                  sportScienceForm.cmj_cm
                ),
              aerobic_value:
                numberOrNull(
                  sportScienceForm.aerobic_value
                ),
              readiness:
                sportScienceForm.readiness || null,
              notes:
                sportScienceForm.notes || null
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Sport-Science-Test konnte nicht gespeichert werden.'
        );
      }

      setSportScienceForm({
        test_date:
          new Date()
            .toISOString()
            .slice(0, 10),
        body_weight_kg: '',
        body_fat_percent: '',
        sprint_10m_seconds: '',
        sprint_30m_seconds: '',
        cmj_cm: '',
        aerobic_value: '',
        readiness: '',
        notes: ''
      });

      setShowSportScienceForm(false);
      setProfileSuccess(
        'Sport-Science-Test wurde gespeichert.'
      );

      await onSaved();
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : 'Speichern fehlgeschlagen.'
      );
    } finally {
      setSavingSportScience(false);
    }
  }

  function resetIdealForm() {
    setEditingIdealId(null);
    setIdealForm({
      period_label: '',
      assessment_date:
        new Date()
          .toISOString()
          .slice(0, 10),
      player_role:
        player.player_role ?? '',
      scores: [
        {
          ideal_code: 'OFF1',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'OFF2',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'OFF3',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'DEF1',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'DEF3',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        }
      ]
    });
  }

  function updateIdealScore(
    index: number,
    field: keyof IdealScoreForm,
    value: string
  ) {
    setIdealForm(current => ({
      ...current,
      scores: current.scores.map(
        (score, scoreIndex) =>
          scoreIndex === index
            ? {
                ...score,
                [field]: value
              }
            : score
      )
    }));
  }

  function editIdealAssessment(
    assessment: IdealAssessment
  ) {
    const knownCodes = [
      'OFF1',
      'OFF2',
      'OFF3',
      'DEF1',
      'DEF3'
    ];

    const byCode =
      new Map(
        assessment.scores.map(
          score => [
            score.ideal_code,
            score
          ]
        )
      );

    setEditingIdealId(
      assessment.id
    );

    setIdealForm({
      period_label:
        assessment.period_label ?? '',
      assessment_date:
        assessment.assessment_date ?? '',
      player_role:
        assessment.player_role ??
        player.player_role ??
        '',
      scores: knownCodes.map(code => {
        const existing =
          byCode.get(code);

        return {
          ideal_code: code,
          status_quo:
            existing?.status_quo != null
              ? String(
                  existing.status_quo
                )
              : '',
          potential:
            existing?.potential != null
              ? String(
                  existing.potential
                )
              : '',
          rating:
            existing?.rating != null
              ? String(
                  existing.rating
                )
              : '',
          measured_value:
            existing?.measured_value ??
            '',
          notes:
            existing?.notes ?? ''
        };
      })
    });

    setShowIdealForm(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);
  }

  async function saveIdealAssessment() {
    if (!accessToken) {
      setProfileError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    if (
      !idealForm.period_label.trim()
    ) {
      setProfileError(
        'Bitte eine Bewertungsperiode angeben.'
      );
      return;
    }

    const numberOrNull =
      (value: string) =>
        value === ''
          ? null
          : Number(value);

    const payload = {
      academy_player_id:
        player.id,
      period_label:
        idealForm.period_label.trim(),
      assessment_date:
        idealForm.assessment_date || null,
      player_role:
        idealForm.player_role || null,
      scores:
        idealForm.scores.map(
          score => ({
            ideal_code:
              score.ideal_code,
            status_quo:
              numberOrNull(
                score.status_quo
              ),
            potential:
              numberOrNull(
                score.potential
              ),
            rating:
              numberOrNull(
                score.rating
              ),
            measured_value:
              score.measured_value ||
              null,
            notes:
              score.notes || null
          })
        )
    };

    setSavingIdeal(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);

    try {
      const isEdit =
        editingIdealId != null;

      const response =
        await fetch(
          isEdit
            ? `${apiBase}/academy/ideals/${editingIdealId}`
            : `${apiBase}/academy/ideals`,
          {
            method:
              isEdit ? 'PUT' : 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify(
              payload
            )
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Ideale-Bewertung konnte nicht gespeichert werden.'
        );
      }

      setShowIdealForm(false);
      resetIdealForm();

      setProfileSuccess(
        isEdit
          ? 'Ideale-Bewertung wurde aktualisiert.'
          : 'Ideale-Bewertung wurde gespeichert.'
      );

      await onSaved();
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : 'Speichern fehlgeschlagen.'
      );
    } finally {
      setSavingIdeal(false);
    }
  }


  function resetSkillAcForm() {
    setEditingSkillAcId(null);
    setSkillAcForm({
      period_old: '',
      period_new: '',
      team_old: player.team ?? '',
      team_new: player.team ?? '',
      author_old: '',
      author_new: '',
      skill_old: '',
      ac_old: '',
      consequence_general: '',
      skill_new: '',
      ac_new: '',
      reflection: '',
      biggest_changes: ''
    });
  }

  function updateSkillAcField(
    field: keyof typeof skillAcForm,
    value: string
  ) {
    setSkillAcForm(current => ({
      ...current,
      [field]: value
    }));
  }

  function editSkillAcForm(
    form: SkillAcForm
  ) {
    setEditingSkillAcId(form.id);

    setSkillAcForm({
      period_old:
        form.period_old ?? '',
      period_new:
        form.period_new ?? '',
      team_old:
        form.team_old ?? '',
      team_new:
        form.team_new ?? '',
      author_old:
        form.author_old ?? '',
      author_new:
        form.author_new ?? '',
      skill_old:
        form.skill_old ?? '',
      ac_old:
        form.ac_old ?? '',
      consequence_general:
        form.consequence_general ?? '',
      skill_new:
        form.skill_new ?? '',
      ac_new:
        form.ac_new ?? '',
      reflection:
        form.reflection ?? '',
      biggest_changes:
        form.biggest_changes ?? ''
    });

    setShowSkillAcForm(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);
  }

  async function saveSkillAcForm() {
    if (!accessToken) {
      setProfileError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    setSavingSkillAc(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);

    try {
      const isEdit =
        editingSkillAcId != null;

      const response =
        await fetch(
          isEdit
            ? `${apiBase}/academy/skill-ac/${editingSkillAcId}`
            : `${apiBase}/academy/skill-ac`,
          {
            method:
              isEdit ? 'PUT' : 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              academy_player_id:
                player.id,
              period_old:
                skillAcForm.period_old || null,
              period_new:
                skillAcForm.period_new || null,
              team_old:
                skillAcForm.team_old || null,
              team_new:
                skillAcForm.team_new || null,
              author_old:
                skillAcForm.author_old || null,
              author_new:
                skillAcForm.author_new || null,
              skill_old:
                skillAcForm.skill_old || null,
              ac_old:
                skillAcForm.ac_old || null,
              consequence_general:
                skillAcForm.consequence_general || null,
              skill_new:
                skillAcForm.skill_new || null,
              ac_new:
                skillAcForm.ac_new || null,
              reflection:
                skillAcForm.reflection || null,
              biggest_changes:
                skillAcForm.biggest_changes || null
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Skill-/AC-Formular konnte nicht gespeichert werden.'
        );
      }

      setShowSkillAcForm(false);
      resetSkillAcForm();

      setProfileSuccess(
        isEdit
          ? 'Skill-/AC-Formular wurde aktualisiert.'
          : 'Skill-/AC-Formular wurde gespeichert.'
      );

      await onSaved();
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : 'Speichern fehlgeschlagen.'
      );
    } finally {
      setSavingSkillAc(false);
    }
  }


  return (
    <div style={modalBackdrop}>
      <div style={modalPanel}>
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            gap: '12px',
            alignItems:
              'flex-start',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div className="eyebrow">
              AKAVision Spielerprofil
            </div>

            <h2
              style={{
                margin:
                  '4px 0 0 0'
              }}
            >
              {player.jersey_number
                ? `${player.jersey_number} · `
                : ''}
              {player.name}
            </h2>

            <div
              style={{
                marginTop: '5px',
                color: '#666'
              }}
            >
              {[
                player.team,
                player.primary_position,
                player.player_role
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={() =>
                setEditing(
                  value => !value
                )
              }
              style={primaryButton}
            >
              {editing
                ? 'Bearbeiten schließen'
                : 'Spieler bearbeiten'}
            </button>

            <button
              type="button"
              onClick={() =>
                setShowSportScienceForm(
                  value => !value
                )
              }
              style={primaryButton}
            >
              + Sport-Science-Test
            </button>

            <button
              type="button"
              onClick={() => {
                resetIdealForm();
                setShowIdealForm(
                  value => !value
                );
              }}
              style={primaryButton}
            >
              + Ideale-Bewertung
            </button>

            <button
              type="button"
              onClick={() => {
                resetSkillAcForm();
                setShowSkillAcForm(
                  value => !value
                );
              }}
              style={primaryButton}
            >
              + Skill / AC
            </button>

            <button
              type="button"
              onClick={onClose}
              style={secondaryButton}
            >
              ✕ Schließen
            </button>
          </div>
        </div>

        {profileError && (
          <div style={errorBox}>
            {profileError}
          </div>
        )}

        {profileSuccess && (
          <div style={successBox}>
            {profileSuccess}
          </div>
        )}

        {editing && (
          <section
            style={{
              ...panel,
              marginTop: '18px'
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Spielerprofil bearbeiten
            </h3>

            <div style={profileFormGrid}>
              <TextInput
                label="Name"
                value={playerForm.name}
                onChange={value =>
                  updatePlayerField(
                    'name',
                    value
                  )
                }
              />

              <Field label="Geburtsdatum">
                <input
                  type="date"
                  value={
                    playerForm.birth_date
                  }
                  onChange={event =>
                    updatePlayerField(
                      'birth_date',
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <TextInput
                label="Position"
                value={
                  playerForm.primary_position
                }
                onChange={value =>
                  updatePlayerField(
                    'primary_position',
                    value
                  )
                }
              />

              <TextInput
                label="Rolle"
                value={
                  playerForm.player_role
                }
                onChange={value =>
                  updatePlayerField(
                    'player_role',
                    value
                  )
                }
              />

              <TextInput
                label="Fuß"
                value={
                  playerForm.preferred_foot
                }
                onChange={value =>
                  updatePlayerField(
                    'preferred_foot',
                    value
                  )
                }
              />

              <TextInput
                label="Trikotnummer"
                value={
                  playerForm.jersey_number
                }
                onChange={value =>
                  updatePlayerField(
                    'jersey_number',
                    value
                  )
                }
              />

              <TextInput
                label="Nationalität"
                value={
                  playerForm.nationality
                }
                onChange={value =>
                  updatePlayerField(
                    'nationality',
                    value
                  )
                }
              />

              <TextInput
                label="Größe"
                value={
                  playerForm.height
                }
                onChange={value =>
                  updatePlayerField(
                    'height',
                    value
                  )
                }
              />

              <TextInput
                label="Verein"
                value={
                  playerForm.current_club
                }
                onChange={value =>
                  updatePlayerField(
                    'current_club',
                    value
                  )
                }
              />

              <TextInput
                label="Status"
                value={
                  playerForm.squad_status
                }
                onChange={value =>
                  updatePlayerField(
                    'squad_status',
                    value
                  )
                }
              />

              <TextInput
                label="Schultyp"
                value={
                  playerForm.school_type
                }
                onChange={value =>
                  updatePlayerField(
                    'school_type',
                    value
                  )
                }
              />

              <TextInput
                label="Schulklasse"
                value={
                  playerForm.school_class
                }
                onChange={value =>
                  updatePlayerField(
                    'school_class',
                    value
                  )
                }
              />

              <Field label="Internat">
                <select
                  value={
                    playerForm.boarding_school
                      ? 'ja'
                      : 'nein'
                  }
                  onChange={event =>
                    updatePlayerField(
                      'boarding_school',
                      event.target.value === 'ja'
                    )
                  }
                  style={inputStyle}
                >
                  <option value="nein">
                    Nein
                  </option>
                  <option value="ja">
                    Ja
                  </option>
                </select>
              </Field>

              <Field label="Busnutzung">
                <select
                  value={
                    playerForm.bus_use
                      ? 'ja'
                      : 'nein'
                  }
                  onChange={event =>
                    updatePlayerField(
                      'bus_use',
                      event.target.value === 'ja'
                    )
                  }
                  style={inputStyle}
                >
                  <option value="nein">
                    Nein
                  </option>
                  <option value="ja">
                    Ja
                  </option>
                </select>
              </Field>

              <TextInput
                label="Busroute"
                value={
                  playerForm.bus_route
                }
                onChange={value =>
                  updatePlayerField(
                    'bus_route',
                    value
                  )
                }
              />
            </div>

            <div style={{ marginTop: '12px' }}>
              <Area
                label="Notizen"
                value={
                  playerForm.notes
                }
                onChange={value =>
                  updatePlayerField(
                    'notes',
                    value
                  )
                }
              />
            </div>

            <button
              type="button"
              onClick={savePlayer}
              disabled={savingPlayer}
              style={{
                ...primaryButton,
                marginTop: '14px'
              }}
            >
              {savingPlayer
                ? 'Speichert…'
                : 'Spielerprofil speichern'}
            </button>
          </section>
        )}

        {showSportScienceForm && (
          <section
            style={{
              ...panel,
              marginTop: '18px'
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Neuer Sport-Science-Test
            </h3>

            <div style={profileFormGrid}>
              <Field label="Testdatum">
                <input
                  type="date"
                  value={
                    sportScienceForm.test_date
                  }
                  onChange={event =>
                    updateSportScienceField(
                      'test_date',
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <TextInput
                label="Gewicht (kg)"
                value={
                  sportScienceForm.body_weight_kg
                }
                onChange={value =>
                  updateSportScienceField(
                    'body_weight_kg',
                    value
                  )
                }
              />

              <TextInput
                label="Körperfett (%)"
                value={
                  sportScienceForm.body_fat_percent
                }
                onChange={value =>
                  updateSportScienceField(
                    'body_fat_percent',
                    value
                  )
                }
              />

              <TextInput
                label="10 m Sprint (s)"
                value={
                  sportScienceForm.sprint_10m_seconds
                }
                onChange={value =>
                  updateSportScienceField(
                    'sprint_10m_seconds',
                    value
                  )
                }
              />

              <TextInput
                label="30 m Sprint (s)"
                value={
                  sportScienceForm.sprint_30m_seconds
                }
                onChange={value =>
                  updateSportScienceField(
                    'sprint_30m_seconds',
                    value
                  )
                }
              />

              <TextInput
                label="CMJ (cm)"
                value={
                  sportScienceForm.cmj_cm
                }
                onChange={value =>
                  updateSportScienceField(
                    'cmj_cm',
                    value
                  )
                }
              />

              <TextInput
                label="Aerobic Value"
                value={
                  sportScienceForm.aerobic_value
                }
                onChange={value =>
                  updateSportScienceField(
                    'aerobic_value',
                    value
                  )
                }
              />

              <TextInput
                label="Readiness"
                value={
                  sportScienceForm.readiness
                }
                onChange={value =>
                  updateSportScienceField(
                    'readiness',
                    value
                  )
                }
              />
            </div>

            <div style={{ marginTop: '12px' }}>
              <Area
                label="Notizen"
                value={
                  sportScienceForm.notes
                }
                onChange={value =>
                  updateSportScienceField(
                    'notes',
                    value
                  )
                }
              />
            </div>

            <button
              type="button"
              onClick={
                saveSportScienceTest
              }
              disabled={
                savingSportScience
              }
              style={{
                ...primaryButton,
                marginTop: '14px'
              }}
            >
              {savingSportScience
                ? 'Speichert…'
                : 'Test speichern'}
            </button>
          </section>
        )}


        {showIdealForm && (
          <section
            style={{
              ...panel,
              marginTop: '18px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              <h3
                style={{
                  margin: 0
                }}
              >
                {editingIdealId != null
                  ? 'Ideale-Bewertung bearbeiten'
                  : 'Neue Ideale-Bewertung'}
              </h3>

              <button
                type="button"
                onClick={() => {
                  setShowIdealForm(false);
                  resetIdealForm();
                }}
                style={secondaryButton}
              >
                Abbrechen
              </button>
            </div>

            <div
              style={{
                ...profileFormGrid,
                marginTop: '14px'
              }}
            >
              <TextInput
                label="Periode"
                value={
                  idealForm.period_label
                }
                onChange={value =>
                  setIdealForm(
                    current => ({
                      ...current,
                      period_label: value
                    })
                  )
                }
              />

              <Field label="Bewertungsdatum">
                <input
                  type="date"
                  value={
                    idealForm.assessment_date
                  }
                  onChange={event =>
                    setIdealForm(
                      current => ({
                        ...current,
                        assessment_date:
                          event.target.value
                      })
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <TextInput
                label="Spielerrolle"
                value={
                  idealForm.player_role
                }
                onChange={value =>
                  setIdealForm(
                    current => ({
                      ...current,
                      player_role: value
                    })
                  )
                }
              />
            </div>

            <div
              style={{
                display: 'grid',
                gap: '10px',
                marginTop: '16px'
              }}
            >
              {idealForm.scores.map(
                (score, index) => (
                  <div
                    key={score.ideal_code}
                    style={idealEditRow}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '16px'
                      }}
                    >
                      {score.ideal_code}
                    </div>

                    <Field label="Status quo">
                      <input
                        type="number"
                        value={
                          score.status_quo
                        }
                        onChange={event =>
                          updateIdealScore(
                            index,
                            'status_quo',
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Potenzial">
                      <input
                        type="number"
                        value={
                          score.potential
                        }
                        onChange={event =>
                          updateIdealScore(
                            index,
                            'potential',
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Rating">
                      <input
                        type="number"
                        value={score.rating}
                        onChange={event =>
                          updateIdealScore(
                            index,
                            'rating',
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </Field>

                    <TextInput
                      label="Messwert"
                      value={
                        score.measured_value
                      }
                      onChange={value =>
                        updateIdealScore(
                          index,
                          'measured_value',
                          value
                        )
                      }
                    />

                    <TextInput
                      label="Notiz"
                      value={score.notes}
                      onChange={value =>
                        updateIdealScore(
                          index,
                          'notes',
                          value
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              onClick={
                saveIdealAssessment
              }
              disabled={savingIdeal}
              style={{
                ...primaryButton,
                marginTop: '16px'
              }}
            >
              {savingIdeal
                ? 'Speichert…'
                : editingIdealId != null
                  ? 'Bewertung aktualisieren'
                  : 'Bewertung speichern'}
            </button>
          </section>
        )}


        {showSkillAcForm && (
          <section
            style={{
              ...panel,
              marginTop: '18px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              <h3 style={{ margin: 0 }}>
                {editingSkillAcId != null
                  ? 'Skill / AC bearbeiten'
                  : 'Neues Skill-/AC-Formular'}
              </h3>

              <button
                type="button"
                onClick={() => {
                  setShowSkillAcForm(false);
                  resetSkillAcForm();
                }}
                style={secondaryButton}
              >
                Abbrechen
              </button>
            </div>

            <div
              style={{
                ...profileFormGrid,
                marginTop: '14px'
              }}
            >
              <TextInput
                label="Periode alt"
                value={skillAcForm.period_old}
                onChange={value =>
                  updateSkillAcField(
                    'period_old',
                    value
                  )
                }
              />

              <TextInput
                label="Periode neu"
                value={skillAcForm.period_new}
                onChange={value =>
                  updateSkillAcField(
                    'period_new',
                    value
                  )
                }
              />

              <TextInput
                label="Team alt"
                value={skillAcForm.team_old}
                onChange={value =>
                  updateSkillAcField(
                    'team_old',
                    value
                  )
                }
              />

              <TextInput
                label="Team neu"
                value={skillAcForm.team_new}
                onChange={value =>
                  updateSkillAcField(
                    'team_new',
                    value
                  )
                }
              />

              <TextInput
                label="Autor alt"
                value={skillAcForm.author_old}
                onChange={value =>
                  updateSkillAcField(
                    'author_old',
                    value
                  )
                }
              />

              <TextInput
                label="Autor neu"
                value={skillAcForm.author_new}
                onChange={value =>
                  updateSkillAcField(
                    'author_new',
                    value
                  )
                }
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',
                gap: '12px',
                marginTop: '14px'
              }}
            >
              <Area
                label="Skill alt"
                value={skillAcForm.skill_old}
                onChange={value =>
                  updateSkillAcField(
                    'skill_old',
                    value
                  )
                }
              />

              <Area
                label="Skill neu"
                value={skillAcForm.skill_new}
                onChange={value =>
                  updateSkillAcField(
                    'skill_new',
                    value
                  )
                }
              />

              <Area
                label="AC alt"
                value={skillAcForm.ac_old}
                onChange={value =>
                  updateSkillAcField(
                    'ac_old',
                    value
                  )
                }
              />

              <Area
                label="AC neu"
                value={skillAcForm.ac_new}
                onChange={value =>
                  updateSkillAcField(
                    'ac_new',
                    value
                  )
                }
              />

              <Area
                label="Größte Veränderungen"
                value={skillAcForm.biggest_changes}
                onChange={value =>
                  updateSkillAcField(
                    'biggest_changes',
                    value
                  )
                }
              />

              <Area
                label="Konsequenz allgemein"
                value={skillAcForm.consequence_general}
                onChange={value =>
                  updateSkillAcField(
                    'consequence_general',
                    value
                  )
                }
              />

              <Area
                label="Reflexion"
                value={skillAcForm.reflection}
                onChange={value =>
                  updateSkillAcField(
                    'reflection',
                    value
                  )
                }
              />
            </div>

            <button
              type="button"
              onClick={saveSkillAcForm}
              disabled={savingSkillAc}
              style={{
                ...primaryButton,
                marginTop: '16px'
              }}
            >
              {savingSkillAc
                ? 'Speichert…'
                : editingSkillAcId != null
                  ? 'Skill / AC aktualisieren'
                  : 'Skill / AC speichern'}
            </button>
          </section>
        )}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '10px',
            marginTop: '18px'
          }}
        >
          <Kpi
            label="Trainingsminuten"
            value={totalTrainingMinutes}
          />
          <Kpi
            label="Anwesenheiten"
            value={attendanceCount}
          />
          <Kpi
            label="Ideale-Bewertungen"
            value={playerIdeals.length}
          />
          <Kpi
            label="Sport-Science-Tests"
            value={playerTests.length}
          />
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '14px',
            marginTop: '18px'
          }}
        >
          <div style={panel}>
            <h3 style={{ marginTop: 0 }}>
              Stammdaten
            </h3>

            <InfoLine
              label="Geburtsdatum"
              value={
                player.birth_date
                  ? formatDate(
                      player.birth_date
                    )
                  : undefined
              }
            />
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
              label="Nationalität"
              value={
                player.nationality
              }
            />
            <InfoLine
              label="Größe"
              value={player.height}
            />
            <InfoLine
              label="Status"
              value={
                player.squad_status
              }
            />
            <InfoLine
              label="Schule"
              value={[
                player.school_type,
                player.school_class
              ]
                .filter(Boolean)
                .join(' · ') || undefined}
            />
            <InfoLine
              label="Internat"
              value={
                player.boarding_school
                  ? 'Ja'
                  : 'Nein'
              }
            />
            <InfoLine
              label="Bus"
              value={
                player.bus_use
                  ? player.bus_route || 'Ja'
                  : 'Nein'
              }
            />
          </div>

          <div style={panel}>
            <h3 style={{ marginTop: 0 }}>
              Sport Science
            </h3>

            {!latestTest ? (
              <div style={{ color: '#777' }}>
                Noch keine Testdaten vorhanden.
              </div>
            ) : (
              <>
                <InfoLine
                  label="Letzter Test"
                  value={formatDate(
                    latestTest.test_date
                  )}
                />
                <InfoLine
                  label="Gewicht"
                  value={
                    latestTest.body_weight_kg != null
                      ? `${latestTest.body_weight_kg} kg`
                      : undefined
                  }
                />
                <InfoLine
                  label="Körperfett"
                  value={
                    latestTest.body_fat_percent != null
                      ? `${latestTest.body_fat_percent} %`
                      : undefined
                  }
                />
                <InfoLine
                  label="10 m"
                  value={
                    latestTest.sprint_10m_seconds != null
                      ? `${latestTest.sprint_10m_seconds} s`
                      : undefined
                  }
                />
                <InfoLine
                  label="30 m"
                  value={
                    latestTest.sprint_30m_seconds != null
                      ? `${latestTest.sprint_30m_seconds} s`
                      : undefined
                  }
                />
                <InfoLine
                  label="CMJ"
                  value={
                    latestTest.cmj_cm != null
                      ? `${latestTest.cmj_cm} cm`
                      : undefined
                  }
                />
                <InfoLine
                  label="Readiness"
                  value={
                    latestTest.readiness
                  }
                />
              </>
            )}
          </div>

          <div style={panel}>
            <h3 style={{ marginTop: 0 }}>
              Letzte Ideale-Bewertung
            </h3>

            {!latestIdeal ? (
              <div style={{ color: '#777' }}>
                Noch keine Ideale-Bewertung vorhanden.
              </div>
            ) : (
              <>
                <InfoLine
                  label="Periode"
                  value={
                    latestIdeal.period_label
                  }
                />
                <InfoLine
                  label="Datum"
                  value={
                    latestIdeal.assessment_date
                      ? formatDate(
                          latestIdeal.assessment_date
                        )
                      : undefined
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    editIdealAssessment(
                      latestIdeal
                    )
                  }
                  style={{
                    ...secondaryButton,
                    marginTop: '12px',
                    padding: '8px 12px'
                  }}
                >
                  Bewertung bearbeiten
                </button>

                <div
                  style={{
                    display: 'grid',
                    gap: '8px',
                    marginTop: '12px'
                  }}
                >
                  {latestIdeal.scores.map(
                    score => (
                      <div
                        key={`${latestIdeal.id}-${score.ideal_code}`}
                        style={scoreRow}
                      >
                        <strong>
                          {score.ideal_code}
                        </strong>

                        <span>
                          {score.rating != null
                            ? `Rating ${score.rating}`
                            : score.status_quo != null
                              ? `Status ${score.status_quo}`
                              : '–'}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>

          <div style={panel}>
            <h3 style={{ marginTop: 0 }}>
              Skill / AC
            </h3>

            {playerSkillAc.length === 0 ? (
              <div style={{ color: '#777' }}>
                Noch keine Skill-/AC-Daten vorhanden.
              </div>
            ) : (
              playerSkillAc
                .slice(0, 2)
                .map(form => (
                  <div
                    key={form.id}
                    style={{
                      marginBottom: '12px'
                    }}
                  >
                    <strong>
                      {[
                        form.period_old,
                        form.period_new
                      ]
                        .filter(Boolean)
                        .join(' → ') ||
                        'Skill / AC'}
                    </strong>

                    {form.biggest_changes && (
                      <div
                        style={{
                          marginTop: '5px'
                        }}
                      >
                        {
                          form.biggest_changes
                        }
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        editSkillAcForm(form)
                      }
                      style={{
                        ...secondaryButton,
                        marginTop: '8px',
                        padding: '7px 10px'
                      }}
                    >
                      Bearbeiten
                    </button>
                  </div>
                ))
            )}
          </div>
        </section>

        <section
          style={{
            ...panel,
            marginTop: '14px'
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Trainingshistorie
          </h3>

          {playerTraining.length === 0 ? (
            <div style={{ color: '#777' }}>
              Noch keine Trainingsdaten vorhanden.
            </div>
          ) : (
            playerTraining
              .slice(0, 10)
              .map(
                (
                  row,
                  index
                ) => (
                  <div
                    key={`${row.session_id}-${index}`}
                    style={rowStyle}
                  >
                    <div>
                      <strong>
                        {row.session_date
                          ? formatDate(
                              row.session_date
                            )
                          : 'Training'}
                      </strong>

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
                        {[
                          row.session_title,
                          row.session_type
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign:
                          'right'
                      }}
                    >
                      <strong>
                        {row.minutes} Min.
                      </strong>
                      <div
                        style={{
                          color:
                            row.present
                              ? '#0b7a3b'
                              : '#a00000',
                          fontSize:
                            '12px'
                        }}
                      >
                        {row.present
                          ? 'Anwesend'
                          : 'Abwesend'}
                      </div>
                    </div>
                  </div>
                )
              )
          )}
        </section>
      </div>
    </div>
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



function SportScienceTab({
  tests
}: {
  tests: SportScienceTest[];
}) {
  const byPlayer =
    new Map<string, SportScienceTest[]>();

  for (const test of tests) {
    const key =
      test.player_name ??
      `Spieler ${test.academy_player_id ?? test.p12_player_id ?? '–'}`;

    if (!byPlayer.has(key)) {
      byPlayer.set(key, []);
    }

    byPlayer.get(key)?.push(test);
  }

  const playerGroups =
    Array.from(byPlayer.entries())
      .map(([name, rows]) => ({
        name,
        rows: [...rows].sort(
          (a, b) =>
            b.test_date.localeCompare(
              a.test_date
            )
        )
      }))
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            'de'
          )
      );

  return (
    <section style={{ marginTop: '18px' }}>
      <div
        style={{
          marginBottom: '12px',
          fontWeight: 700
        }}
      >
        {tests.length} Testdatensätze
      </div>

      {playerGroups.length === 0 ? (
        <section style={panel}>
          Noch keine Sport-Science-Daten vorhanden.
        </section>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '14px'
          }}
        >
          {playerGroups.map(group => {
            const latest = group.rows[0];
            const previous = group.rows[1];

            return (
              <article
                key={group.name}
                style={panel}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <strong
                      style={{
                        fontSize: '18px'
                      }}
                    >
                      {group.name}
                    </strong>

                    <div
                      style={{
                        marginTop: '4px',
                        color: '#777',
                        fontSize: '12px'
                      }}
                    >
                      Letzter Test:{' '}
                      {formatDate(
                        latest.test_date
                      )}
                    </div>
                  </div>

                  {latest.readiness && (
                    <span style={roleBadge}>
                      {latest.readiness}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(2, 1fr)',
                    gap: '8px',
                    marginTop: '14px'
                  }}
                >
                  <MetricBox
                    label="Gewicht"
                    value={latest.body_weight_kg}
                    unit="kg"
                    previous={previous?.body_weight_kg}
                    lowerIsBetter={false}
                  />

                  <MetricBox
                    label="Körperfett"
                    value={latest.body_fat_percent}
                    unit="%"
                    previous={previous?.body_fat_percent}
                    lowerIsBetter
                  />

                  <MetricBox
                    label="10 m Sprint"
                    value={latest.sprint_10m_seconds}
                    unit="s"
                    previous={previous?.sprint_10m_seconds}
                    lowerIsBetter
                  />

                  <MetricBox
                    label="30 m Sprint"
                    value={latest.sprint_30m_seconds}
                    unit="s"
                    previous={previous?.sprint_30m_seconds}
                    lowerIsBetter
                  />

                  <MetricBox
                    label="CMJ"
                    value={latest.cmj_cm}
                    unit="cm"
                    previous={previous?.cmj_cm}
                  />

                  <MetricBox
                    label="Aerob"
                    value={latest.aerobic_value}
                    unit=""
                    previous={previous?.aerobic_value}
                  />
                </div>

                {latest.notes && (
                  <TextBlock
                    label="Notiz"
                    value={latest.notes}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MetricBox({
  label,
  value,
  unit,
  previous,
  lowerIsBetter = false
}: {
  label: string;
  value?: number;
  unit: string;
  previous?: number;
  lowerIsBetter?: boolean;
}) {
  let trend = '';

  if (
    value != null &&
    previous != null &&
    value !== previous
  ) {
    const improved =
      lowerIsBetter
        ? value < previous
        : value > previous;

    trend =
      improved ? ' ↑' : ' ↓';
  }

  return (
    <div
      style={{
        background: '#f6f8f7',
        borderRadius: '8px',
        padding: '10px'
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: '#777',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>

      <strong>
        {value ?? '–'}
        {value != null && unit
          ? ` ${unit}`
          : ''}
        {trend}
      </strong>
    </div>
  );
}

function SkillAcTab({
  forms
}: {
  forms: SkillAcForm[];
}) {
  const sorted =
    [...forms].sort(
      (a, b) =>
        String(
          a.player_name ?? ''
        ).localeCompare(
          String(
            b.player_name ?? ''
          ),
          'de'
        )
    );

  return (
    <section style={{ marginTop: '18px' }}>
      <div
        style={{
          marginBottom: '12px',
          fontWeight: 700
        }}
      >
        {sorted.length} Skill-/AC-Formulare
      </div>

      {sorted.length === 0 ? (
        <section style={panel}>
          Noch keine Skill-/AC-Daten vorhanden.
        </section>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '14px'
          }}
        >
          {sorted.map(form => (
            <article
              key={form.id}
              style={panel}
            >
              <strong
                style={{
                  fontSize: '18px'
                }}
              >
                {form.player_name ??
                  `Spieler ${form.academy_player_id}`}
              </strong>

              <div
                style={{
                  marginTop: '4px',
                  color: '#777',
                  fontSize: '12px'
                }}
              >
                {[
                  form.period_old,
                  form.period_new
                ]
                  .filter(Boolean)
                  .join(' → ')}
              </div>

              {(form.team_old || form.team_new) && (
                <InfoLine
                  label="Team"
                  value={[
                    form.team_old,
                    form.team_new
                  ]
                    .filter(Boolean)
                    .join(' → ')}
                />
              )}

              {(form.skill_old || form.skill_new) && (
                <TextCompare
                  title="Skill"
                  oldValue={form.skill_old}
                  newValue={form.skill_new}
                />
              )}

              {(form.ac_old || form.ac_new) && (
                <TextCompare
                  title="AC"
                  oldValue={form.ac_old}
                  newValue={form.ac_new}
                />
              )}

              {form.biggest_changes && (
                <TextBlock
                  label="Größte Veränderungen"
                  value={form.biggest_changes}
                />
              )}

              {form.consequence_general && (
                <TextBlock
                  label="Konsequenz allgemein"
                  value={form.consequence_general}
                />
              )}

              {form.reflection && (
                <TextBlock
                  label="Reflexion"
                  value={form.reflection}
                />
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TextCompare({
  title,
  oldValue,
  newValue
}: {
  title: string;
  oldValue?: string;
  newValue?: string;
}) {
  return (
    <div
      style={{
        marginTop: '14px'
      }}
    >
      <strong>{title}</strong>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 1fr',
          gap: '8px',
          marginTop: '7px'
        }}
      >
        <div
          style={{
            background: '#f7f7f7',
            borderRadius: '8px',
            padding: '10px'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#777',
              textTransform: 'uppercase'
            }}
          >
            Alt
          </div>
          <div style={{ marginTop: '4px' }}>
            {oldValue || '–'}
          </div>
        </div>

        <div
          style={{
            background: '#f1f7f3',
            borderRadius: '8px',
            padding: '10px'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#777',
              textTransform: 'uppercase'
            }}
          >
            Neu
          </div>
          <div style={{ marginTop: '4px' }}>
            {newValue || '–'}
          </div>
        </div>
      </div>
    </div>
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



const idealEditRow:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    '100px repeat(5, minmax(0, 1fr))',
  gap: '10px',
  alignItems: 'end',
  background: '#f7f8f7',
  padding: '12px',
  borderRadius: '10px'
};

const modalBackdrop:
  React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '28px',
  zIndex: 9999,
  overflowY: 'auto'
};

const modalPanel:
  React.CSSProperties = {
  width: 'min(1100px, 100%)',
  background: '#f7f8f7',
  borderRadius: '16px',
  padding: '20px',
  boxShadow:
    '0 20px 60px rgba(0,0,0,0.22)'
};

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

const successBox:
  React.CSSProperties = {
  marginTop: '14px',
  padding: '12px 16px',
  background: '#eef9f2',
  color: '#0b6b35',
  borderRadius: '10px'
};

const profileFormGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '12px'
};

const errorBox:
  React.CSSProperties = {
  marginTop: '14px',
  padding: '12px 16px',
  background: '#fff3f3',
  color: '#a00000',
  borderRadius: '10px'
};
