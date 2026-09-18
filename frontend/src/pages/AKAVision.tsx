import { useEffect, useMemo, useState } from 'react';
import '../akavision-responsive.css';
import AcademyPlayerProfile from './academy/AcademyPlayerProfile';
import AcademyScoutingTab from './academy/AcademyScoutingTab';
import P12Tab from './academy/P12Tab';
import PageHeader from '../components/PageHeader';

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
  is_p12?: boolean;
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
};

type Props = {
  accessToken?: string;
  apiBase: string;
  onBack: () => void;
};

type Tab =
  | 'overview'
  | 'players'
  | 'ideals'
  | 'scouting'
  | 'sportScience'
  | 'skillAc'
  | 'p12';

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
      <PageHeader
        section="SV Oberbank Ried · Akademie"
        title="AKAVision"
        description="Spielerentwicklung, Ideale, Sport Science, Skill / AC, P12 und Academy-Scouting."
        onBack={onBack}
        backLabel="VikingVision"
        meta={
          <>
            <span>{team}</span>
            <span>·</span>
            <span>
              {players.length} Spieler
            </span>
          </>
        }
      />

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

        <TabButton
          active={tab === 'p12'}
          onClick={() => setTab('p12')}
        >
          P12
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

          {tab === 'ideals' && (
            <IdealsTab
              players={players}
              assessments={idealAssessments}
            />
          )}

          {tab === 'scouting' && (
            <AcademyScoutingTab
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

          {tab === 'p12' && (
            <P12Tab
              accessToken={accessToken}
              apiBase={apiBase}
            />
          )}
        </>
      )}

      {selectedAcademyPlayer && (
        <AcademyPlayerProfile
          player={selectedAcademyPlayer}
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
  players
}: {
  team: AcademyTeam;
  overview: Overview | null;
  players: AcademyPlayer[];
}) {


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
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('Alle');
  const [statusFilter, setStatusFilter] = useState('Alle');

  const positions = useMemo(
    () => [
      'Alle',
      ...Array.from(
        new Set(
          players
            .map(player => player.primary_position)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b, 'de'))
    ],
    [players]
  );

  const statuses = useMemo(
    () => [
      'Alle',
      ...Array.from(
        new Set(
          players
            .map(player => player.squad_status)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b, 'de'))
    ],
    [players]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('de');

    return [...players]
      .filter(player => {
        const matchesSearch =
          !query ||
          [
            player.name,
            player.primary_position,
            player.player_role,
            player.nationality,
            player.school_type,
            player.school_class
          ]
            .filter(Boolean)
            .some(value =>
              String(value)
                .toLocaleLowerCase('de')
                .includes(query)
            );

        const matchesPosition =
          positionFilter === 'Alle' ||
          player.primary_position === positionFilter;

        const matchesStatus =
          statusFilter === 'Alle' ||
          player.squad_status === statusFilter;

        return (
          matchesSearch &&
          matchesPosition &&
          matchesStatus
        );
      })
      .sort((a, b) => {
        const numberA = Number(a.jersey_number);
        const numberB = Number(b.jersey_number);

        if (
          Number.isFinite(numberA) &&
          Number.isFinite(numberB)
        ) {
          return numberA - numberB;
        }

        return a.name.localeCompare(b.name, 'de');
      });
  }, [
    players,
    search,
    positionFilter,
    statusFilter
  ]);

  const resetFilters = () => {
    setSearch('');
    setPositionFilter('Alle');
    setStatusFilter('Alle');
  };

  return (
    <section style={{ marginTop: '18px' }}>
      <div
        style={{
          ...panel,
          marginBottom: '14px'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(220px, 2fr) repeat(2, minmax(160px, 1fr)) auto',
            gap: '10px',
            alignItems: 'end'
          }}
          className="academy-player-filters"
        >
          <label>
            <div style={filterLabel}>Spieler suchen</div>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Name, Rolle, Schule …"
              style={filterControl}
            />
          </label>

          <label>
            <div style={filterLabel}>Position</div>
            <select
              value={positionFilter}
              onChange={event => setPositionFilter(event.target.value)}
              style={filterControl}
            >
              {positions.map(position => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={filterLabel}>Status</div>
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              style={filterControl}
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            style={secondaryButton}
          >
            Zurücksetzen
          </button>
        </div>
      </div>

      <div
        style={{
          marginBottom: '12px',
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <span>{filtered.length} Spieler</span>
        {filtered.length !== players.length && (
          <span style={{ color: '#666', fontWeight: 500 }}>
            von {players.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={panel}>
          Keine Spieler für die gewählten Filter gefunden.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '14px'
          }}
        >
          {filtered.map(player => (
            <button
              key={player.id}
              type="button"
              onClick={() => onOpenPlayer(player)}
              style={academyPlayerCard}
            >
              <div style={academyCardTop}>
                <div style={academyAvatar}>
                  {player.jersey_number ? (
                    <span style={academyJersey}>
                      {player.jersey_number}
                    </span>
                  ) : (
                    <span style={academyInitials}>
                      {player.name
                        .split(' ')
                        .slice(0, 2)
                        .map(part => part.charAt(0))
                        .join('')
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={academyNameRow}>
                    <strong style={academyName}>
                      {player.name}
                    </strong>

                    <div style={academyBadgeRow}>
                      {player.is_p12 && (
                        <span style={p12Badge}>
                          P12
                        </span>
                      )}

                      {player.squad_status && (
                        <span
                          style={{
                            ...statusBadge,
                            ...(player.squad_status === 'Aktiv'
                              ? statusBadgeActive
                              : {})
                          }}
                        >
                          {player.squad_status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={academyMetaPrimary}>
                    {[
                      player.primary_position,
                      player.player_role
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Position / Rolle offen'}
                  </div>

                  <div style={academyMetaSecondary}>
                    {[
                      player.preferred_foot
                        ? `Fuß ${player.preferred_foot}`
                        : null,
                      player.nationality,
                      player.height
                        ? `${player.height} cm`
                        : null
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
              </div>

              <div style={academyInfoGrid}>
                <AcademyMiniInfo
                  label="Geburtsdatum"
                  value={
                    player.birth_date
                      ? formatDate(player.birth_date)
                      : '–'
                  }
                />

                <AcademyMiniInfo
                  label="Schule"
                  value={
                    [
                      player.school_type,
                      player.school_class
                    ]
                      .filter(Boolean)
                      .join(' · ') || '–'
                  }
                />

                <AcademyMiniInfo
                  label="Internat"
                  value={
                    player.boarding_school
                      ? 'Ja'
                      : 'Nein'
                  }
                />

                <AcademyMiniInfo
                  label="Bus"
                  value={
                    player.bus_use
                      ? player.bus_route || 'Ja'
                      : 'Nein'
                  }
                />
              </div>

              {player.notes && (
                <div style={academyNotes}>
                  {player.notes}
                </div>
              )}

              <div style={academyOpenRow}>
                Spielerprofil öffnen
                <span aria-hidden="true">→</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function AcademyMiniInfo({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={academyMiniInfo}>
      <span style={academyMiniLabel}>
        {label}
      </span>
      <strong style={academyMiniValue}>
        {value}
      </strong>
    </div>
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

const academyPlayerCard:
  React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  border: '1px solid #e7e9e7',
  borderRadius: '16px',
  background: '#fff',
  padding: '16px',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  boxShadow:
    '0 3px 12px rgba(0,0,0,.035)'
};

const academyCardTop:
  React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start'
};

const academyAvatar:
  React.CSSProperties = {
  width: '54px',
  height: '54px',
  flex: '0 0 auto',
  borderRadius: '14px',
  background: '#0b7a3b',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow:
    'inset 0 0 0 1px rgba(255,255,255,.15)'
};

const academyJersey:
  React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 900,
  lineHeight: 1
};

const academyInitials:
  React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 900,
  letterSpacing: '.03em'
};

const academyNameRow:
  React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '10px'
};

const academyName:
  React.CSSProperties = {
  fontSize: '18px',
  lineHeight: 1.2
};

const academyBadgeRow:
  React.CSSProperties = {
  display: 'flex',
  gap: '5px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end'
};

const p12Badge:
  React.CSSProperties = {
  borderRadius: '999px',
  padding: '4px 7px',
  background: '#111',
  color: '#fff',
  fontSize: '10px',
  fontWeight: 900
};

const statusBadge:
  React.CSSProperties = {
  borderRadius: '999px',
  padding: '4px 7px',
  background: '#f1f2f1',
  color: '#666',
  fontSize: '10px',
  fontWeight: 800
};

const statusBadgeActive:
  React.CSSProperties = {
  background: '#edf7f1',
  color: '#0b6b35'
};

const academyMetaPrimary:
  React.CSSProperties = {
  marginTop: '5px',
  color: '#333',
  fontSize: '12px',
  fontWeight: 700,
  lineHeight: 1.4
};

const academyMetaSecondary:
  React.CSSProperties = {
  marginTop: '4px',
  color: '#777',
  fontSize: '11px',
  lineHeight: 1.4
};

const academyInfoGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '8px',
  marginTop: '14px'
};

const academyMiniInfo:
  React.CSSProperties = {
  minWidth: 0,
  padding: '9px 10px',
  borderRadius: '10px',
  background: '#f7f8f7'
};

const academyMiniLabel:
  React.CSSProperties = {
  display: 'block',
  color: '#8a8f8a',
  fontSize: '9px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '.05em'
};

const academyMiniValue:
  React.CSSProperties = {
  display: 'block',
  marginTop: '3px',
  color: '#222',
  fontSize: '12px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const academyNotes:
  React.CSSProperties = {
  marginTop: '10px',
  color: '#666',
  fontSize: '11px',
  lineHeight: 1.4,
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical'
};

const academyOpenRow:
  React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '13px',
  paddingTop: '11px',
  borderTop: '1px solid #eef0ee',
  color: '#0b7a3b',
  fontWeight: 800,
  fontSize: '12px'
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

const filterLabel: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#555',
  marginBottom: '5px'
};

const filterControl: React.CSSProperties = {
  width: '100%',
  minHeight: '42px',
  boxSizing: 'border-box',
  border: '1px solid #d8d8d8',
  borderRadius: '8px',
  padding: '8px 10px',
  background: '#fff',
  color: '#111'
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
