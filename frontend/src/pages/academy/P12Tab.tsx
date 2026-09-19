import { useEffect, useMemo, useState } from 'react';

type P12Player = {
  id: number;
  player_id?: number | null;
  name?: string;
  birth_date?: string;
  primary_position?: string;
  player_role?: string;
  preferred_foot?: string;
  current_club?: string;
  image_path?: string;
  height?: string;
  nationality?: string;
  p12_status?: string;
  start_date?: string;
  lead_coach?: string;
  season?: string;
  focus_basics?: string;
  focus_when_good?: string;
  expectations?: string;
  pyramid_basics_title?: string;
  pyramid_control_title?: string;
  pyramid_focus_title?: string;
  pyramid_basics_items?: string[];
  pyramid_control_items?: string[];
  pyramid_output_items?: string[];
};

type TrainerScore = {
  category: string;
  detail: string;
  coach_rating?: number;
  p12_rating?: number;
  notes?: string;
};

type TrainerAssessment = {
  id: number;
  p12_player_id: number;
  period_label: string;
  assessment_date?: string;
  coach_name?: string;
  team_label?: string;
  notes?: string;
  scores?: TrainerScore[];
};

type SelfAssessment = {
  id: number;
  p12_player_id: number;
  period_label: string;
  assessment_date?: string;
  strengths?: string;
  development_areas?: string;
  personal_goals?: string;
  notes?: string;
  submitted_at?: string;
  scores?: Array<{
    category: string;
    detail: string;
    rating?: number;
  }>;
};

type SportsValue = {
  metric: string;
  value?: number | null;
  unit?: string;
};

type SportsTest = {
  id: number;
  p12_player_id: number;
  test_label: string;
  test_date?: string;
  scientist_name?: string;
  notes?: string;
  values?: SportsValue[];
};

type PlayerDetail = {
  player: P12Player;
  trainerAssessments: TrainerAssessment[];
  selfAssessments: SelfAssessment[];
  sportsScienceTests: SportsTest[];
};

type Props = {
  accessToken?: string;
  apiBase: string;
};

type ProfileTab =
  | 'data'
  | 'focus'
  | 'pyramid'
  | 'trainer'
  | 'self'
  | 'development'
  | 'sports';

const TRAINER_CATEGORIES = [
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

const SPORTS_CATEGORIES = [
  {
    name: 'Körperdaten',
    metrics: [
      { metric: 'Größe', unit: 'cm' },
      { metric: 'Gewicht', unit: 'kg' }
    ]
  },
  {
    name: 'Fmax – Unterkörper',
    metrics: [
      { metric: 'TB-DL', unit: 'kg', target: '>130 kg' },
      { metric: 'TB-DL relativ', unit: 'kg/BW' },
      { metric: 'Back Squat', unit: 'kg' },
      { metric: 'Back Squat relativ', unit: 'kg/BW' },
      { metric: 'Adduktoren', unit: 'kg' },
      { metric: 'Adduktoren relativ', unit: 'kg/BW', target: '>0,8 kg/BW' },
      { metric: 'Hamstrings', unit: 'kg' },
      { metric: 'Hamstrings relativ', unit: 'kg/BW', target: '>1,0 kg/BW' }
    ]
  },
  {
    name: 'Fmax – Oberkörper',
    metrics: [
      { metric: 'Bankdrücken', unit: 'kg', target: '>80 kg' },
      { metric: 'Bankdrücken relativ', unit: 'kg/BW' }
    ]
  },
  {
    name: 'Schnellkraft',
    metrics: [
      { metric: 'CMJ', unit: 'cm', target: '>35 cm' },
      { metric: 'Drop Jump RSI', unit: '', target: '>1,8' }
    ]
  },
  {
    name: 'Ausdauer',
    metrics: [
      { metric: 'IFT 30-15 Test', unit: 'km/h', target: '>20 km/h' }
    ]
  },
  {
    name: 'Schnelligkeit',
    metrics: [
      { metric: '10-m-Sprint', unit: 'sek', target: '<1,8 sek' },
      { metric: '20-m-Sprint', unit: 'sek' },
      { metric: '30-m-Sprint', unit: 'sek' },
      { metric: 'Top Speed', unit: 'km/h', target: '>32 km/h' }
    ]
  },
  {
    name: 'Spielintensität',
    metrics: [
      { metric: 'Gesamt Distanz', unit: 'm', target: '11.500 m' },
      { metric: 'HML Distanz', unit: 'm', target: '2.000 m' },
      { metric: 'HSR Distanz', unit: 'm', target: '900 m' },
      { metric: 'Sprintmeter', unit: 'm' },
      { metric: "Stop & Go's", unit: 'Anzahl', target: '70' }
    ]
  }
] as const;

const POSITIONS = [
  'Torwart',
  'Innenverteidiger',
  'Rechtsverteidiger',
  'Linksverteidiger',
  'Defensives Mittelfeld',
  'Zentrales Mittelfeld',
  'Offensives Mittelfeld',
  'Rechter Flügel',
  'Linker Flügel',
  'Stürmer'
];

const P12_STATUSES = [
  'Aktiv',
  'Beobachtung',
  'Übergang',
  'Pausiert',
  'Abgeschlossen'
];

export default function P12Tab({
  accessToken,
  apiBase
}: Props) {
  const [players, setPlayers] =
    useState<P12Player[]>([]);
  const [selectedId, setSelectedId] =
    useState<number | null>(null);
  const [detail, setDetail] =
    useState<PlayerDetail | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState<string | undefined>();
  const [success, setSuccess] =
    useState<string | undefined>();
  const [showCreate, setShowCreate] =
    useState(false);
  const [profileTab, setProfileTab] =
    useState<ProfileTab>('data');
  const [search, setSearch] =
    useState('');
  const [statusFilter, setStatusFilter] =
    useState('Alle');

  const [createForm, setCreateForm] =
    useState({
      name: '',
      birth_date: '',
      primary_position: 'Zentrales Mittelfeld',
      player_role: '',
      preferred_foot: 'Nicht angegeben',
      current_club: 'SV Ried',
      height: '',
      nationality: '',
      start_date: new Date().toISOString().slice(0, 10),
      lead_coach: '',
      season: '2026/27'
    });

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (selectedId != null) {
      loadPlayer(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId]);

  const filteredPlayers =
    useMemo(() => {
      const query =
        search.trim().toLocaleLowerCase('de');

      return [...players]
        .filter(player => {
          const matchesSearch =
            !query ||
            [
              player.name,
              player.primary_position,
              player.player_role,
              player.p12_status,
              player.lead_coach,
              player.season,
              player.nationality
            ]
              .filter(Boolean)
              .some(value =>
                String(value)
                  .toLocaleLowerCase('de')
                  .includes(query)
              );

          const matchesStatus =
            statusFilter === 'Alle' ||
            player.p12_status === statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        })
        .sort((a, b) =>
          String(a.name ?? '')
            .localeCompare(
              String(b.name ?? ''),
              'de'
            )
        );
    }, [
      players,
      search,
      statusFilter
    ]);

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
            ...(init?.body
              ? {
                  'Content-Type':
                    'application/json'
                }
              : {}),
            ...(init?.headers ?? {})
          }
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ??
        'P12-Anfrage fehlgeschlagen.'
      );
    }

    return data;
  }

  async function loadPlayers() {
    setLoading(true);
    setError(undefined);

    try {
      const data =
        await api('/academy/p12');

      setPlayers(
        Array.isArray(data.players)
          ? data.players
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'P12 konnte nicht geladen werden.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPlayer(
    playerId: number
  ) {
    setLoading(true);
    setError(undefined);

    try {
      const data =
        await api(
          `/academy/p12/${playerId}`
        );

      setDetail({
        player: data.player,
        trainerAssessments:
          Array.isArray(
            data.trainerAssessments
          )
            ? data.trainerAssessments
            : [],
        selfAssessments:
          Array.isArray(
            data.selfAssessments
          )
            ? data.selfAssessments
            : [],
        sportsScienceTests:
          Array.isArray(
            data.sportsScienceTests
          )
            ? data.sportsScienceTests
            : []
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'P12-Spieler konnte nicht geladen werden.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function reloadCurrent() {
    await loadPlayers();

    if (selectedId != null) {
      await loadPlayer(selectedId);
    }
  }

  async function createPlayer() {
    if (!createForm.name.trim()) {
      setError('Name ist ein Pflichtfeld.');
      return;
    }

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const data =
        await api(
          '/academy/p12/players',
          {
            method: 'POST',
            body: JSON.stringify(
              createForm
            )
          }
        );

      setSuccess(
        'P12-Spieler wurde angelegt.'
      );
      setShowCreate(false);
      await loadPlayers();

      if (data?.player?.id != null) {
        setSelectedId(
          Number(data.player.id)
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'P12-Spieler konnte nicht angelegt werden.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (selectedId && detail) {
    return (
      <P12PlayerProfile
        detail={detail}
        loading={loading}
        saving={saving}
        setSaving={setSaving}
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
        profileTab={profileTab}
        setProfileTab={setProfileTab}
        api={api}
        onReload={reloadCurrent}
        onBack={() => {
          setSelectedId(null);
          setDetail(null);
          setProfileTab('data');
          setSuccess(undefined);
          setError(undefined);
        }}
      />
    );
  }

  const activeCount =
    players.filter(
      player =>
        player.p12_status === 'Aktiv'
    ).length;

  const transitionCount =
    players.filter(
      player =>
        player.p12_status === 'Übergang'
    ).length;

  const observationCount =
    players.filter(
      player =>
        player.p12_status === 'Beobachtung'
    ).length;

  const pausedCount =
    players.filter(
      player =>
        player.p12_status === 'Pausiert'
    ).length;

  const leadCoachCount =
    new Set(
      players
        .map(
          player =>
            player.lead_coach
        )
        .filter(Boolean)
    ).size;

  return (
    <section style={{ marginTop: '18px' }}>
      <div style={toolbar}>
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#0b6b35',
              textTransform: 'uppercase',
              letterSpacing: '.08em'
            }}
          >
            P12 · SV Oberbank Ried
          </div>
          <h2 style={{ margin: '4px 0 0' }}>
            P12Vision
          </h2>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowCreate(
              value => !value
            )
          }
          style={primaryButton}
        >
          + P12-Spieler
        </button>
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

      <div
        className="academy-p12-kpis"
        style={p12OverviewGrid}
      >
        <P12OverviewCard
          label="Spieler"
          value={players.length}
          hint="im P12-Pool"
          active={
            statusFilter === 'Alle'
          }
          onClick={() =>
            setStatusFilter('Alle')
          }
        />

        <P12OverviewCard
          label="Aktiv"
          value={activeCount}
          hint="aktive Profile"
          active={
            statusFilter === 'Aktiv'
          }
          onClick={() =>
            setStatusFilter('Aktiv')
          }
        />

        <P12OverviewCard
          label="Beobachtung"
          value={observationCount}
          hint="im Blick"
          active={
            statusFilter ===
            'Beobachtung'
          }
          onClick={() =>
            setStatusFilter(
              'Beobachtung'
            )
          }
        />

        <P12OverviewCard
          label="Übergang"
          value={transitionCount}
          hint="nächster Schritt"
          active={
            statusFilter ===
            'Übergang'
          }
          onClick={() =>
            setStatusFilter(
              'Übergang'
            )
          }
        />

        <P12OverviewCard
          label="Pausiert"
          value={pausedCount}
          hint="aktuell pausiert"
          active={
            statusFilter ===
            'Pausiert'
          }
          onClick={() =>
            setStatusFilter(
              'Pausiert'
            )
          }
        />

        <div style={p12InfoCard}>
          <span style={p12OverviewLabel}>
            Lead Coaches
          </span>
          <strong style={p12OverviewValue}>
            {leadCoachCount}
          </strong>
          <span style={p12OverviewHint}>
            im Pool
          </span>
        </div>
      </div>

      {showCreate && (
        <section
          style={{
            ...panel,
            marginTop: '14px'
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            P12-Spieler anlegen
          </h3>

          <div
            className="academy-p12-form-grid"
            style={formGrid}
          >
            <TextField
              label="Name *"
              value={createForm.name}
              onChange={value =>
                setCreateForm(current => ({
                  ...current,
                  name: value
                }))
              }
            />
            <TextField
              label="Geburtsdatum"
              type="date"
              value={createForm.birth_date}
              onChange={value =>
                setCreateForm(current => ({
                  ...current,
                  birth_date: value
                }))
              }
            />
            <SelectField
              label="Grundposition"
              value={createForm.primary_position}
              options={POSITIONS}
              onChange={value =>
                setCreateForm(current => ({
                  ...current,
                  primary_position: value
                }))
              }
            />
            <TextField
              label="SVR-Spielerrolle"
              value={createForm.player_role}
              onChange={value =>
                setCreateForm(current => ({
                  ...current,
                  player_role: value
                }))
              }
            />
            <SelectField
              label="Starker Fuß"
              value={createForm.preferred_foot}
              options={[
                'Nicht angegeben',
                'Rechts',
                'Links',
                'Beidfüßig'
              ]}
              onChange={value =>
                setCreateForm(current => ({
                  ...current,
                  preferred_foot: value
                }))
              }
            />
            <TextField
              label="Aktueller Verein"
              value={createForm.current_club}
              onChange={value =>
                setCreateForm(current => ({
                  ...current,
                  current_club: value
                }))
              }
            />
            <TextField
              label="Größe"
              value={createForm.height}
              onChange={value =>
                setCreateForm(current => ({
                  ...current,
                  height: value
                }))
              }
            />
            <TextField
              label="Nationalität"
              value={createForm.nationality}
              onChange={value =>
                setCreateForm(current => ({
                  ...current,
                  nationality: value
                }))
              }
            />
            <TextField
              label="P12 seit"
              type="date"
              value={createForm.start_date}
              onChange={value =>
                setCreateForm(current => ({
                  ...current,
                  start_date: value
                }))
              }
            />
            <TextField
              label="Saison"
              value={createForm.season}
              onChange={value =>
                setCreateForm(current => ({
                  ...current,
                  season: value
                }))
              }
            />
            <TextField
              label="Lead Coach"
              value={createForm.lead_coach}
              onChange={value =>
                setCreateForm(current => ({
                  ...current,
                  lead_coach: value
                }))
              }
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              marginTop: '14px'
            }}
          >
            <button
              type="button"
              onClick={() =>
                setShowCreate(false)
              }
              style={secondaryButton}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={createPlayer}
              disabled={saving}
              style={primaryButton}
            >
              {saving
                ? 'Speichert…'
                : 'P12-Spieler anlegen'}
            </button>
          </div>
        </section>
      )}

      <section
        style={{
          ...panel,
          marginTop: '14px'
        }}
      >
        <div style={p12FilterGrid}>
          <TextField
            label="Suche"
            value={search}
            onChange={setSearch}
          />

          <SelectField
            label="Status"
            value={statusFilter}
            options={[
              'Alle',
              ...P12_STATUSES
            ]}
            onChange={setStatusFilter}
          />

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('Alle');
            }}
            style={secondaryButton}
          >
            Zurücksetzen
          </button>
        </div>
      </section>

      {loading ? (
        <section
          style={{
            ...panel,
            marginTop: '14px'
          }}
        >
          P12 wird geladen…
        </section>
      ) : (
        <div
          className="academy-p12-player-grid"
          style={playerGrid}
        >
          {filteredPlayers.map(
            player => (
              <button
                key={player.id}
                type="button"
                onClick={() =>
                  setSelectedId(
                    player.id
                  )
                }
                style={playerCard}
              >
                <div style={toolbar}>
                  <div>
                    <strong
                      style={{
                        fontSize: '17px'
                      }}
                    >
                      {player.name ??
                        'P12-Spieler'}
                    </strong>
                    <div style={subtle}>
                      {player.player_role ||
                        player.primary_position ||
                        '–'}
                    </div>
                  </div>

                  <span style={pill}>
                    {player.p12_status ??
                      'Aktiv'}
                  </span>
                </div>

                <div style={p12PlayerFacts}>
                  <SmallInfo
                    label="Position"
                    value={player.primary_position}
                  />
                  <SmallInfo
                    label="Saison"
                    value={player.season}
                  />
                  <SmallInfo
                    label="Lead Coach"
                    value={player.lead_coach}
                  />
                  <SmallInfo
                    label="P12 seit"
                    value={
                      player.start_date
                        ? formatDate(
                            player.start_date
                          )
                        : undefined
                    }
                  />
                </div>

                <div style={p12PlayerFooter}>
                  <span>
                    {player.current_club ??
                      'SV Ried'}
                  </span>

                  <span style={p12OpenHint}>
                    P12-Profil öffnen →
                  </span>
                </div>
              </button>
            )
          )}
        </div>
      )}
    </section>
  );
}

function P12PlayerProfile({
  detail,
  loading,
  saving,
  setSaving,
  error,
  setError,
  success,
  setSuccess,
  profileTab,
  setProfileTab,
  api,
  onReload,
  onBack
}: {
  detail: PlayerDetail;
  loading: boolean;
  saving: boolean;
  setSaving: (value: boolean) => void;
  error?: string;
  setError: (value?: string) => void;
  success?: string;
  setSuccess: (value?: string) => void;
  profileTab: ProfileTab;
  setProfileTab: (value: ProfileTab) => void;
  api: (path: string, init?: RequestInit) => Promise<any>;
  onReload: () => Promise<void>;
  onBack: () => void;
}) {
  const player =
    detail.player;

  return (
    <section style={{ marginTop: '18px' }}>
      <section style={p12ProfileHero}>
        <div style={p12ProfileIdentity}>
          <div style={p12ProfileAvatar}>
            {player.name
              ?.split(' ')
              .slice(0, 2)
              .map(part =>
                part
                  .charAt(0)
                  .toUpperCase()
              )
              .join('') ||
              'P12'}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={p12ProfileEyebrow}>
              P12Vision · Spielerprofil
            </div>

            <h2 style={p12ProfileName}>
              {player.name ??
                'P12-Spieler'}
            </h2>

            <div style={p12ProfileMeta}>
              {[
                player.primary_position,
                player.player_role,
                player.current_club
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>

            <div style={p12ProfileBadges}>
              <span style={p12ProfileStatusBadge}>
                {player.p12_status ??
                  'Aktiv'}
              </span>

              {player.season && (
                <span style={p12ProfileSoftBadge}>
                  {player.season}
                </span>
              )}

              {player.lead_coach && (
                <span style={p12ProfileSoftBadge}>
                  Lead Coach: {player.lead_coach}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={p12ProfileActions}>
          <button
            type="button"
            onClick={onBack}
            style={secondaryButton}
          >
            ← P12-Übersicht
          </button>

          <button
            type="button"
            onClick={() =>
              printP12Profile(detail)
            }
            style={secondaryButton}
          >
            PDF / Drucken
          </button>
        </div>
      </section>

      <section style={p12ProfileStats}>
        <P12ProfileStat
          label="Trainerbewertungen"
          value={
            detail.trainerAssessments.length
          }
          hint={
            detail.trainerAssessments[0]
              ?.assessment_date
              ? `zuletzt ${formatDate(
                  detail.trainerAssessments[0]
                    .assessment_date!
                )}`
              : 'noch offen'
          }
        />

        <P12ProfileStat
          label="Selbstbewertungen"
          value={
            detail.selfAssessments.length
          }
          hint={
            detail.selfAssessments[0]
              ?.assessment_date
              ? `zuletzt ${formatDate(
                  detail.selfAssessments[0]
                    .assessment_date!
                )}`
              : 'noch offen'
          }
        />

        <P12ProfileStat
          label="Sport Science"
          value={
            detail.sportsScienceTests.length
          }
          hint={
            detail.sportsScienceTests.length >
            0
              ? `zuletzt ${formatDate(
                  [...detail.sportsScienceTests]
                    .sort(
                      (a, b) =>
                        String(
                          b.test_date ??
                          ''
                        ).localeCompare(
                          String(
                            a.test_date ??
                            ''
                          )
                        )
                    )[0]
                    ?.test_date ??
                    ''
                )}`
              : 'noch offen'
          }
        />

        <P12ProfileStat
          label="P12 seit"
          value={
            player.start_date
              ? formatDate(
                  player.start_date
                )
              : '–'
          }
          hint={
            player.season ??
            'Saison offen'
          }
        />
      </section>

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

      <div
        className="academy-p12-tabs"
        style={tabBar}
      >
        <ProfileTabButton
          active={profileTab === 'data'}
          onClick={() =>
            setProfileTab('data')
          }
        >
          Spielerdaten
        </ProfileTabButton>
        <ProfileTabButton
          active={profileTab === 'focus'}
          onClick={() =>
            setProfileTab('focus')
          }
        >
          Fokus & Erwartungen
        </ProfileTabButton>
        <ProfileTabButton
          active={profileTab === 'pyramid'}
          onClick={() =>
            setProfileTab('pyramid')
          }
        >
          Pyramide
        </ProfileTabButton>
        <ProfileTabButton
          active={profileTab === 'trainer'}
          onClick={() =>
            setProfileTab('trainer')
          }
        >
          Trainerbewertung
        </ProfileTabButton>
        <ProfileTabButton
          active={profileTab === 'self'}
          onClick={() =>
            setProfileTab('self')
          }
        >
          Spielerbewertung
        </ProfileTabButton>

        <ProfileTabButton
          active={profileTab === 'development'}
          onClick={() =>
            setProfileTab('development')
          }
        >
          Vergleich & Verlauf
        </ProfileTabButton>
        <ProfileTabButton
          active={profileTab === 'sports'}
          onClick={() =>
            setProfileTab('sports')
          }
        >
          Sportwissenschaft
        </ProfileTabButton>
      </div>

      {loading ? (
        <div
          style={{
            ...panel,
            marginTop: '14px'
          }}
        >
          P12-Spieler wird geladen…
        </div>
      ) : (
        <>
          {profileTab === 'data' && (
            <PlayerDataForm
              player={player}
              saving={saving}
              setSaving={setSaving}
              setError={setError}
              setSuccess={setSuccess}
              api={api}
              onReload={onReload}
            />
          )}

          {profileTab === 'focus' && (
            <FocusForm
              player={player}
              saving={saving}
              setSaving={setSaving}
              setError={setError}
              setSuccess={setSuccess}
              api={api}
              onReload={onReload}
            />
          )}

          {profileTab === 'pyramid' && (
            <PyramidForm
              player={player}
              saving={saving}
              setSaving={setSaving}
              setError={setError}
              setSuccess={setSuccess}
              api={api}
              onReload={onReload}
            />
          )}

          {profileTab === 'trainer' && (
            <TrainerAssessmentSection
              player={player}
              assessments={
                detail.trainerAssessments
              }
              saving={saving}
              setSaving={setSaving}
              setError={setError}
              setSuccess={setSuccess}
              api={api}
              onReload={onReload}
            />
          )}

          {profileTab === 'self' && (
            <SelfAssessmentSection
              player={player}
              assessments={
                detail.selfAssessments
              }
              api={api}
              onReload={onReload}
            />
          )}

          {profileTab === 'development' && (
            <ComparisonHistorySection
              trainerAssessments={
                detail.trainerAssessments
              }
              selfAssessments={
                detail.selfAssessments
              }
              sportsScienceTests={
                detail.sportsScienceTests
              }
            />
          )}

          {profileTab === 'sports' && (
            <SportsScienceSection
              player={player}
              tests={
                detail.sportsScienceTests
              }
              saving={saving}
              setSaving={setSaving}
              setError={setError}
              setSuccess={setSuccess}
              api={api}
              onReload={onReload}
            />
          )}
        </>
      )}
    </section>
  );
}

function PlayerDataForm({
  player,
  saving,
  setSaving,
  setError,
  setSuccess,
  api,
  onReload
}: {
  player: P12Player;
  saving: boolean;
  setSaving: (value: boolean) => void;
  setError: (value?: string) => void;
  setSuccess: (value?: string) => void;
  api: (path: string, init?: RequestInit) => Promise<any>;
  onReload: () => Promise<void>;
}) {
  const [form, setForm] =
    useState({
      name: player.name ?? '',
      birth_date:
        player.birth_date ?? '',
      primary_position:
        player.primary_position ??
        'Zentrales Mittelfeld',
      player_role:
        player.player_role ?? '',
      preferred_foot:
        player.preferred_foot ??
        'Nicht angegeben',
      current_club:
        player.current_club ??
        'SV Ried',
      height:
        player.height ?? '',
      nationality:
        player.nationality ?? '',
      p12_status:
        player.p12_status ??
        'Aktiv',
      start_date:
        player.start_date ?? '',
      lead_coach:
        player.lead_coach ?? '',
      season:
        player.season ?? '2026/27'
    });

  async function save() {
    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await api(
        `/academy/p12/players/${player.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...form,
            focus_basics:
              player.focus_basics,
            focus_when_good:
              player.focus_when_good,
            expectations:
              player.expectations
          })
        }
      );

      setSuccess(
        'P12-Spielerdaten wurden gespeichert.'
      );
      await onReload();
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

  return (
    <section
      style={{
        ...panel,
        marginTop: '14px'
      }}
    >
      <div
        className="academy-p12-form-grid"
        style={formGrid}
      >
        <TextField
          label="Name"
          value={form.name}
          onChange={value =>
            setForm(current => ({
              ...current,
              name: value
            }))
          }
        />
        <TextField
          label="Geburtsdatum"
          type="date"
          value={form.birth_date}
          onChange={value =>
            setForm(current => ({
              ...current,
              birth_date: value
            }))
          }
        />
        <SelectField
          label="Grundposition"
          value={form.primary_position}
          options={POSITIONS}
          onChange={value =>
            setForm(current => ({
              ...current,
              primary_position: value
            }))
          }
        />
        <TextField
          label="SVR-Spielerrolle"
          value={form.player_role}
          onChange={value =>
            setForm(current => ({
              ...current,
              player_role: value
            }))
          }
        />
        <SelectField
          label="Starker Fuß"
          value={form.preferred_foot}
          options={[
            'Nicht angegeben',
            'Rechts',
            'Links',
            'Beidfüßig'
          ]}
          onChange={value =>
            setForm(current => ({
              ...current,
              preferred_foot: value
            }))
          }
        />
        <TextField
          label="Aktueller Verein"
          value={form.current_club}
          onChange={value =>
            setForm(current => ({
              ...current,
              current_club: value
            }))
          }
        />
        <TextField
          label="Größe"
          value={form.height}
          onChange={value =>
            setForm(current => ({
              ...current,
              height: value
            }))
          }
        />
        <TextField
          label="Nationalität"
          value={form.nationality}
          onChange={value =>
            setForm(current => ({
              ...current,
              nationality: value
            }))
          }
        />
        <SelectField
          label="P12-Status"
          value={form.p12_status}
          options={P12_STATUSES}
          onChange={value =>
            setForm(current => ({
              ...current,
              p12_status: value
            }))
          }
        />
        <TextField
          label="P12 seit"
          type="date"
          value={form.start_date}
          onChange={value =>
            setForm(current => ({
              ...current,
              start_date: value
            }))
          }
        />
        <TextField
          label="Saison"
          value={form.season}
          onChange={value =>
            setForm(current => ({
              ...current,
              season: value
            }))
          }
        />
        <TextField
          label="Lead Coach"
          value={form.lead_coach}
          onChange={value =>
            setForm(current => ({
              ...current,
              lead_coach: value
            }))
          }
        />
      </div>

      <SaveRow
        saving={saving}
        label="Spielerdaten speichern"
        onSave={save}
      />
    </section>
  );
}

function FocusForm({
  player,
  saving,
  setSaving,
  setError,
  setSuccess,
  api,
  onReload
}: {
  player: P12Player;
  saving: boolean;
  setSaving: (value: boolean) => void;
  setError: (value?: string) => void;
  setSuccess: (value?: string) => void;
  api: (path: string, init?: RequestInit) => Promise<any>;
  onReload: () => Promise<void>;
}) {
  const [focusBasics, setFocusBasics] =
    useState(
      player.focus_basics ?? ''
    );
  const [
    focusWhenGood,
    setFocusWhenGood
  ] =
    useState(
      player.focus_when_good ?? ''
    );
  const [
    expectations,
    setExpectations
  ] =
    useState(
      player.expectations ?? ''
    );

  async function save() {
    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await api(
        `/academy/p12/players/${player.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            p12_status:
              player.p12_status,
            start_date:
              player.start_date,
            lead_coach:
              player.lead_coach,
            season:
              player.season,
            focus_basics:
              focusBasics,
            focus_when_good:
              focusWhenGood,
            expectations
          })
        }
      );

      setSuccess(
        'Fokus und Erwartungen wurden gespeichert.'
      );
      await onReload();
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

  return (
    <section
      style={{
        ...panel,
        marginTop: '14px'
      }}
    >
      <TextArea
        label="BASICS – 100 % Kontrolle"
        value={focusBasics}
        onChange={setFocusBasics}
      />
      <TextArea
        label="Wenn ich gut im Spiel bin – 70 % Kontrolle"
        value={focusWhenGood}
        onChange={setFocusWhenGood}
      />
      <TextArea
        label="Fokusziele und Erwartungen"
        value={expectations}
        onChange={setExpectations}
        rows={7}
      />

      <SaveRow
        saving={saving}
        label="Fokus speichern"
        onSave={save}
      />
    </section>
  );
}

function PyramidForm({
  player,
  saving,
  setSaving,
  setError,
  setSuccess,
  api,
  onReload
}: {
  player: P12Player;
  saving: boolean;
  setSaving: (value: boolean) => void;
  setError: (value?: string) => void;
  setSuccess: (value?: string) => void;
  api: (path: string, init?: RequestInit) => Promise<any>;
  onReload: () => Promise<void>;
}) {
  const [basicsTitle, setBasicsTitle] =
    useState(
      player.pyramid_basics_title ??
      'BASICS – 100% KONTROLLE'
    );
  const [controlTitle, setControlTitle] =
    useState(
      player.pyramid_control_title ??
      'WENN ICH GUT IM SPIEL BIN – 70% KONTROLLE'
    );
  const [focusTitle, setFocusTitle] =
    useState(
      player.pyramid_focus_title ??
      'FOKUS & ERWARTUNGEN'
    );

  const [basicsItems, setBasicsItems] =
    useState(
      (player.pyramid_basics_items ?? [])
        .join('\n')
    );
  const [controlItems, setControlItems] =
    useState(
      (player.pyramid_control_items ?? [])
        .join('\n')
    );
  const [outputItems, setOutputItems] =
    useState(
      (player.pyramid_output_items ?? [])
        .join('\n')
    );

  function lines(value: string) {
    return value
      .split(/\r?\n/)
      .map(item =>
        item.replace(
          /^[\s•\-]+/,
          ''
        ).trim()
      )
      .filter(Boolean);
  }

  async function save() {
    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await api(
        `/academy/p12/players/${player.id}/pyramid`,
        {
          method: 'PUT',
          body: JSON.stringify({
            pyramid_basics_title:
              basicsTitle,
            pyramid_control_title:
              controlTitle,
            pyramid_focus_title:
              focusTitle,
            pyramid_basics_items:
              lines(basicsItems),
            pyramid_control_items:
              lines(controlItems),
            pyramid_output_items:
              lines(outputItems)
          })
        }
      );

      setSuccess(
        'P12-Pyramide wurde gespeichert.'
      );
      await onReload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Pyramide konnte nicht gespeichert werden.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className="academy-p12-pyramid"
        style={pyramidGrid}
      >
        <div style={pyramidBottom}>
          <strong>{basicsTitle}</strong>
          {lines(basicsItems).map(
            item => (
              <span key={item}>
                {item}
              </span>
            )
          )}
        </div>

        <div style={pyramidMiddle}>
          <strong>{controlTitle}</strong>
          {lines(controlItems).map(
            item => (
              <span key={item}>
                {item}
              </span>
            )
          )}
        </div>

        <div style={pyramidTop}>
          <strong>{focusTitle}</strong>
          {lines(outputItems).map(
            item => (
              <span key={item}>
                {item}
              </span>
            )
          )}
        </div>
      </div>

      <section
        style={{
          ...panel,
          marginTop: '14px'
        }}
      >
        <div
          className="academy-p12-form-grid"
          style={formGrid}
        >
          <TextField
            label="Titel untere Ebene"
            value={basicsTitle}
            onChange={setBasicsTitle}
          />
          <TextField
            label="Titel mittlere Ebene"
            value={controlTitle}
            onChange={setControlTitle}
          />
          <TextField
            label="Titel obere Ebene"
            value={focusTitle}
            onChange={setFocusTitle}
          />
        </div>

        <div
          className="academy-p12-form-grid"
          style={{
            ...formGrid,
            marginTop: '12px'
          }}
        >
          <TextArea
            label="Untere Ebene · ein Punkt pro Zeile"
            value={basicsItems}
            onChange={setBasicsItems}
            rows={8}
          />
          <TextArea
            label="Mittlere Ebene · ein Punkt pro Zeile"
            value={controlItems}
            onChange={setControlItems}
            rows={8}
          />
          <TextArea
            label="Obere Ebene · ein Punkt pro Zeile"
            value={outputItems}
            onChange={setOutputItems}
            rows={8}
          />
        </div>

        <SaveRow
          saving={saving}
          label="Pyramide speichern"
          onSave={save}
        />
      </section>
    </>
  );
}

function TrainerAssessmentSection({
  player,
  assessments,
  saving,
  setSaving,
  setError,
  setSuccess,
  api,
  onReload
}: {
  player: P12Player;
  assessments: TrainerAssessment[];
  saving: boolean;
  setSaving: (value: boolean) => void;
  setError: (value?: string) => void;
  setSuccess: (value?: string) => void;
  api: (path: string, init?: RequestInit) => Promise<any>;
  onReload: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] =
    useState<string>(
      assessments[0]?.id
        ? String(assessments[0].id)
        : 'new'
    );

  const [confirmDelete, setConfirmDelete] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const selected =
    assessments.find(
      item =>
        String(item.id) ===
        selectedId
    );

  const [periodLabel, setPeriodLabel] =
    useState(
      selected?.period_label ??
      'Herbst 26'
    );
  const [
    assessmentDate,
    setAssessmentDate
  ] =
    useState(
      selected?.assessment_date ??
      new Date().toISOString().slice(0, 10)
    );
  const [coachName, setCoachName] =
    useState(
      selected?.coach_name ?? ''
    );
  const [teamLabel, setTeamLabel] =
    useState(
      selected?.team_label ??
      'P12'
    );
  const [notes, setNotes] =
    useState(
      selected?.notes ?? ''
    );
  const [scores, setScores] =
    useState<Record<string, {
      rating: number;
      notes: string;
    }>>(() =>
      scoreMap(
        selected?.scores ?? []
      )
    );

  function choose(value: string) {
    setSelectedId(value);
    setConfirmDelete(false);

    const item =
      assessments.find(
        assessment =>
          String(
            assessment.id
          ) === value
      );

    if (!item) {
      setPeriodLabel('Herbst 26');
      setAssessmentDate(
        new Date()
          .toISOString()
          .slice(0, 10)
      );
      setCoachName('');
      setTeamLabel('P12');
      setNotes('');
      setScores({});
      return;
    }

    setPeriodLabel(
      item.period_label
    );
    setAssessmentDate(
      item.assessment_date ??
      ''
    );
    setCoachName(
      item.coach_name ?? ''
    );
    setTeamLabel(
      item.team_label ?? 'P12'
    );
    setNotes(
      item.notes ?? ''
    );
    setScores(
      scoreMap(
        item.scores ?? []
      )
    );
  }

  async function save() {
    if (!periodLabel.trim()) {
      setError(
        'Bitte eine Bewertungsphase angeben.'
      );
      return;
    }

    const payloadScores =
      TRAINER_CATEGORIES.flatMap(
        group =>
          group.details.map(
            detail => {
              const key =
                `${group.category}|||${detail}`;
              const row =
                scores[key] ?? {
                  rating: 0,
                  notes: ''
                };

              return {
                category:
                  group.category,
                detail,
                coach_rating:
                  row.rating,
                p12_rating: null,
                notes:
                  row.notes
              };
            }
          )
      );

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await api(
        '/academy/p12/trainer-assessments',
        {
          method: 'POST',
          body: JSON.stringify({
            p12_player_id:
              player.id,
            period_label:
              periodLabel,
            assessment_date:
              assessmentDate ||
              null,
            coach_name:
              coachName || null,
            team_label:
              teamLabel || null,
            notes:
              notes || null,
            scores:
              payloadScores
          })
        }
      );

      setSuccess(
        'Trainerbewertung wurde gespeichert.'
      );
      await onReload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Trainerbewertung konnte nicht gespeichert werden.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssessment() {
    if (
      selectedId === 'new' ||
      !selected
    ) {
      return;
    }

    setDeleting(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await api(
        `/academy/p12/trainer-assessments/${selected.id}`,
        {
          method: 'DELETE'
        }
      );

      setConfirmDelete(false);
      setSelectedId('new');
      setPeriodLabel('Herbst 26');
      setAssessmentDate(
        new Date()
          .toISOString()
          .slice(0, 10)
      );
      setCoachName('');
      setTeamLabel('P12');
      setNotes('');
      setScores({});

      setSuccess(
        'Trainerbewertung wurde gelöscht.'
      );

      await onReload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Trainerbewertung konnte nicht gelöscht werden.'
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section
      style={{
        ...panel,
        marginTop: '14px'
      }}
    >
      <div
        className="academy-p12-form-grid"
        style={formGrid}
      >
        <SelectField
          label="Bewertungsphase"
          value={selectedId}
          options={[
            'new',
            ...assessments.map(
              item =>
                String(item.id)
            )
          ]}
          optionLabel={value => {
            if (value === 'new') {
              return 'Neue Bewertungsphase';
            }

            return (
              assessments.find(
                item =>
                  String(item.id) ===
                  value
              )?.period_label ??
              value
            );
          }}
          onChange={choose}
        />
        <TextField
          label="Phase"
          value={periodLabel}
          onChange={setPeriodLabel}
        />
        <TextField
          label="Bewertungsdatum"
          type="date"
          value={assessmentDate}
          onChange={
            setAssessmentDate
          }
        />
        <TextField
          label="Trainer"
          value={coachName}
          onChange={setCoachName}
        />
        <TextField
          label="Mannschaft"
          value={teamLabel}
          onChange={setTeamLabel}
        />
      </div>

      {TRAINER_CATEGORIES.map(
        group => (
          <div
            key={group.category}
            style={{
              marginTop: '18px'
            }}
          >
            <h4
              style={{
                marginBottom: '8px'
              }}
            >
              {group.category}
            </h4>

            <div
              style={{
                display: 'grid',
                gap: '8px'
              }}
            >
              {group.details.map(
                detail => {
                  const key =
                    `${group.category}|||${detail}`;
                  const row =
                    scores[key] ?? {
                      rating: 0,
                      notes: ''
                    };

                  return (
                    <div
                      key={detail}
                      className="academy-p12-rating-row"
                      style={ratingRow}
                    >
                      <div>
                        {detail}
                      </div>

                      <select
                        value={row.rating}
                        onChange={event =>
                          setScores(
                            current => ({
                              ...current,
                              [key]: {
                                ...row,
                                rating:
                                  Number(
                                    event.target.value
                                  )
                              }
                            })
                          )
                        }
                        style={inputStyle}
                      >
                        {Array.from(
                          {
                            length: 11
                          },
                          (_, index) =>
                            index
                        ).map(
                          rating => (
                            <option
                              key={rating}
                              value={rating}
                            >
                              {rating}
                            </option>
                          )
                        )}
                      </select>

                      <input
                        value={row.notes}
                        onChange={event =>
                          setScores(
                            current => ({
                              ...current,
                              [key]: {
                                ...row,
                                notes:
                                  event.target.value
                              }
                            })
                          )
                        }
                        placeholder="Notiz"
                        style={inputStyle}
                      />
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )
      )}

      <TextArea
        label="Gesamtnotiz"
        value={notes}
        onChange={setNotes}
      />

      <SaveRow
        saving={saving}
        label="Trainerbewertung speichern"
        onSave={save}
      />

      {selectedId !== 'new' && (
        <div style={assessmentDeleteArea}>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() =>
                setConfirmDelete(true)
              }
              disabled={
                saving ||
                deleting
              }
              style={assessmentDeleteButton}
            >
              Bewertung löschen
            </button>
          ) : (
            <div style={assessmentDeleteConfirm}>
              <div>
                <strong>
                  Diese Spielerbewertung wirklich löschen?
                </strong>

                <div style={assessmentDeleteHint}>
                  Bewertungsphase und alle zugehörigen Detailbewertungen werden dauerhaft gelöscht.
                </div>
              </div>

              <div style={assessmentDeleteActions}>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDelete(false)
                  }
                  disabled={deleting}
                  style={secondaryButton}
                >
                  Abbrechen
                </button>

                <button
                  type="button"
                  onClick={deleteAssessment}
                  disabled={deleting}
                  style={assessmentDeleteButton}
                >
                  {deleting
                    ? 'Wird gelöscht…'
                    : 'Ja, Bewertung löschen'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SelfAssessmentSection({
  player,
  assessments,
  api,
  onReload
}: {
  player: P12Player;
  assessments: SelfAssessment[];
  api: (path: string, init?: RequestInit) => Promise<any>;
  onReload: () => Promise<void>;
}) {
  const [periodLabel, setPeriodLabel] =
    useState('Herbst 26');
  const [expiresInDays, setExpiresInDays] =
    useState('14');
  const [inviteLink, setInviteLink] =
    useState('');
  const [working, setWorking] =
    useState(false);
  const [inviteError, setInviteError] =
    useState<string | undefined>();
  const [copied, setCopied] =
    useState(false);
  const [pendingDeleteId, setPendingDeleteId] =
    useState<number | null>(null);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);
  const [deleteError, setDeleteError] =
    useState<string | undefined>();
  const [deleteSuccess, setDeleteSuccess] =
    useState<string | undefined>();

  async function createInvite() {
    setWorking(true);
    setInviteError(undefined);
    setInviteLink('');
    setCopied(false);

    try {
      const data =
        await api(
          '/academy/p12/self-invites',
          {
            method: 'POST',
            body: JSON.stringify({
              p12_player_id:
                player.id,
              period_label:
                periodLabel,
              expires_in_days:
                Number(
                  expiresInDays
                ) || 14
            })
          }
        );

      const token =
        String(
          data?.invite?.token ??
          ''
        );

      if (!token) {
        throw new Error(
          'Einladungslink konnte nicht erstellt werden.'
        );
      }

      setInviteLink(
        `${window.location.origin}/?p12invite=${encodeURIComponent(token)}`
      );
    } catch (err) {
      setInviteError(
        err instanceof Error
          ? err.message
          : 'Einladung konnte nicht erstellt werden.'
      );
    } finally {
      setWorking(false);
    }
  }

  async function copyInvite() {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(
        inviteLink
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function deleteSelfAssessment(
    assessment: SelfAssessment
  ) {
    setDeletingId(
      assessment.id
    );
    setDeleteError(undefined);
    setDeleteSuccess(undefined);

    try {
      await api(
        `/academy/p12/self-assessments/${assessment.id}`,
        {
          method: 'DELETE'
        }
      );

      setPendingDeleteId(null);
      setDeleteSuccess(
        `Spielerselbstbewertung "${assessment.period_label}" wurde gelöscht.`
      );

      await onReload();
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : 'Spielerselbstbewertung konnte nicht gelöscht werden.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <section
        style={{
          ...panel,
          marginTop: '14px'
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          Spieler zur Selbsteinschätzung einladen
        </h3>

        <p style={subtle}>
          Der Link funktioniert außerhalb von Teams und kann einmalig verwendet werden.
        </p>

        <div
          className="academy-p12-form-grid"
          style={formGrid}
        >
          <TextField
            label="Bewertungsphase"
            value={periodLabel}
            onChange={setPeriodLabel}
          />

          <SelectField
            label="Link gültig"
            value={expiresInDays}
            options={[
              '7',
              '14',
              '30'
            ]}
            optionLabel={value =>
              `${value} Tage`
            }
            onChange={
              setExpiresInDays
            }
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: '14px'
          }}
        >
          <button
            type="button"
            onClick={createInvite}
            disabled={working}
            style={primaryButton}
          >
            {working
              ? 'Link wird erstellt…'
              : 'Einladungslink erstellen'}
          </button>

          {inviteLink && (
            <button
              type="button"
              onClick={copyInvite}
              style={secondaryButton}
            >
              {copied
                ? 'Link kopiert'
                : 'Link kopieren'}
            </button>
          )}
        </div>

        {inviteLink && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px',
              borderRadius: '8px',
              background: '#f7f8f8',
              wordBreak: 'break-all',
              fontSize: '13px'
            }}
          >
            {inviteLink}
          </div>
        )}

        {inviteError && (
          <div style={errorBox}>
            {inviteError}
          </div>
        )}

        {deleteSuccess && (
          <div style={successBox}>
            {deleteSuccess}
          </div>
        )}

        {deleteError && (
          <div style={errorBox}>
            {deleteError}
          </div>
        )}
      </section>

      {assessments.length === 0 ? (
        <section
          style={{
            ...panel,
            marginTop: '14px'
          }}
        >
          Noch keine Spielerbewertung vorhanden.
        </section>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '12px',
            marginTop: '14px'
          }}
        >
          {assessments.map(
            assessment => (
              <section
                key={assessment.id}
                style={panel}
              >
                <div style={toolbar}>
                  <div>
                    <strong>
                      {assessment.period_label}
                    </strong>
                    <div style={subtle}>
                      {assessment.assessment_date ??
                        '–'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingDeleteId(
                        assessment.id
                      );
                      setDeleteError(undefined);
                      setDeleteSuccess(undefined);
                    }}
                    disabled={
                      deletingId ===
                      assessment.id
                    }
                    style={assessmentDeleteButton}
                  >
                    {deletingId ===
                    assessment.id
                      ? 'Wird gelöscht…'
                      : 'Selbstbewertung löschen'}
                  </button>
                </div>

                {pendingDeleteId ===
                  assessment.id && (
                  <div
                    style={{
                      ...assessmentDeleteConfirm,
                      marginTop: '12px'
                    }}
                  >
                    <div>
                      <strong>
                        Diese Spielerselbstbewertung wirklich löschen?
                      </strong>

                      <div style={assessmentDeleteHint}>
                        Die Bewertungsphase und alle dazugehörigen Einzelbewertungen werden dauerhaft gelöscht. Ein bereits verwendeter Einladungslink bleibt verbraucht; für eine neue Selbsteinschätzung kann anschließend ein neuer Link erstellt werden.
                      </div>
                    </div>

                    <div style={assessmentDeleteActions}>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingDeleteId(
                            null
                          )
                        }
                        disabled={
                          deletingId ===
                          assessment.id
                        }
                        style={secondaryButton}
                      >
                        Abbrechen
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteSelfAssessment(
                            assessment
                          )
                        }
                        disabled={
                          deletingId ===
                          assessment.id
                        }
                        style={assessmentDeleteButton}
                      >
                        {deletingId ===
                        assessment.id
                          ? 'Wird gelöscht…'
                          : 'Ja, Selbstbewertung löschen'}
                      </button>
                    </div>
                  </div>
                )}

                <div
                  className="academy-p12-form-grid"
                  style={{
                    ...formGrid,
                    marginTop: '12px'
                  }}
                >
                  <InfoBlock
                    label="Stärken"
                    value={
                      assessment.strengths
                    }
                  />
                  <InfoBlock
                    label="Entwicklungsfelder"
                    value={
                      assessment.development_areas
                    }
                  />
                  <InfoBlock
                    label="Persönliche Ziele"
                    value={
                      assessment.personal_goals
                    }
                  />
                  <InfoBlock
                    label="Weitere Notizen"
                    value={
                      assessment.notes
                    }
                  />
                </div>

                {(assessment.scores ?? []).length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      display: 'grid',
                      gap: '6px'
                    }}
                  >
                    {(assessment.scores ?? [])
                      .filter(
                        score =>
                          score.rating != null
                      )
                      .map(
                        score => (
                          <div
                            key={`${score.category}-${score.detail}`}
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                'minmax(0,1fr) 60px',
                              gap: '10px',
                              padding:
                                '7px 0',
                              borderBottom:
                                '1px solid #f0f0f0'
                            }}
                          >
                            <span>
                              {score.detail}
                            </span>
                            <strong>
                              {score.rating}/10
                            </strong>
                          </div>
                        )
                      )}
                  </div>
                )}
              </section>
            )
          )}
        </div>
      )}
    </>
  );
}

function printP12Profile(
  detail: PlayerDetail
) {
  const player =
    detail.player;

  const escape =
    (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

  const lines =
    (value?: string[]) =>
      (value ?? [])
        .map(
          item =>
            `<li>${escape(item)}</li>`
        )
        .join('');

  const trainerHtml =
    detail.trainerAssessments
      .map(
        assessment => `
          <section>
            <h3>Trainerbewertung · ${escape(assessment.period_label)}</h3>
            <div class="muted">${escape(assessment.assessment_date ?? '')} ${assessment.coach_name ? `· ${escape(assessment.coach_name)}` : ''}</div>
            ${(assessment.scores ?? [])
              .map(
                score =>
                  `<div class="row"><span>${escape(score.detail)}</span><strong>${escape(score.coach_rating ?? score.p12_rating ?? '–')}/10</strong></div>`
              )
              .join('')}
          </section>
        `
      )
      .join('');

  const selfHtml =
    detail.selfAssessments
      .map(
        assessment => `
          <section>
            <h3>Spielerbewertung · ${escape(assessment.period_label)}</h3>
            <p><strong>Stärken:</strong> ${escape(assessment.strengths ?? '–')}</p>
            <p><strong>Entwicklungsfelder:</strong> ${escape(assessment.development_areas ?? '–')}</p>
            <p><strong>Ziele:</strong> ${escape(assessment.personal_goals ?? '–')}</p>
          </section>
        `
      )
      .join('');

  const sportsHtml =
    detail.sportsScienceTests
      .map(
        test => `
          <section>
            <h3>Sportwissenschaft · ${escape(test.test_label)}</h3>
            <div class="muted">${escape(test.test_date ?? '')}</div>
            ${(test.values ?? [])
              .filter(
                value =>
                  value.value != null
              )
              .map(
                value =>
                  `<div class="row"><span>${escape(value.metric)}</span><strong>${escape(value.value)} ${escape(value.unit ?? '')}</strong></div>`
              )
              .join('')}
          </section>
        `
      )
      .join('');

  const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>P12 · ${escape(player.name ?? 'Spieler')}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #222; }
        h1 { margin-bottom: 4px; }
        h2 { border-bottom: 2px solid #0b7a3b; padding-bottom: 5px; margin-top: 28px; }
        h3 { margin-bottom: 6px; }
        section { break-inside: avoid; margin-top: 22px; }
        .muted { color: #666; font-size: 12px; }
        .row { display: flex; justify-content: space-between; gap: 20px; border-bottom: 1px solid #eee; padding: 6px 0; }
        .pyramid { text-align: center; margin: 18px 0; }
        .level { border: 1px solid #ccc; padding: 12px; margin: 6px auto; background: #f5f8f6; }
        .top { width: 55%; }
        .middle { width: 75%; }
        .bottom { width: 95%; }
        @media print {
          body { margin: 18mm; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="muted">SV Oberbank Ried · P12</div>
      <h1>${escape(player.name ?? 'P12-Spieler')}</h1>
      <div>${escape(player.primary_position ?? '')} ${player.player_role ? `· ${escape(player.player_role)}` : ''} ${player.season ? `· ${escape(player.season)}` : ''}</div>

      <h2>Fokus & Erwartungen</h2>
      <p><strong>BASICS – 100 % Kontrolle:</strong><br/>${escape(player.focus_basics ?? '–')}</p>
      <p><strong>Wenn ich gut im Spiel bin – 70 % Kontrolle:</strong><br/>${escape(player.focus_when_good ?? '–')}</p>
      <p><strong>Fokus & Erwartungen:</strong><br/>${escape(player.expectations ?? '–')}</p>

      <h2>P12-Pyramide</h2>
      <div class="pyramid">
        <div class="level top"><strong>${escape(player.pyramid_focus_title ?? 'FOKUS & ERWARTUNGEN')}</strong><ul>${lines(player.pyramid_output_items)}</ul></div>
        <div class="level middle"><strong>${escape(player.pyramid_control_title ?? 'WENN ICH GUT IM SPIEL BIN – 70% KONTROLLE')}</strong><ul>${lines(player.pyramid_control_items)}</ul></div>
        <div class="level bottom"><strong>${escape(player.pyramid_basics_title ?? 'BASICS – 100% KONTROLLE')}</strong><ul>${lines(player.pyramid_basics_items)}</ul></div>
      </div>

      ${trainerHtml}
      ${selfHtml}
      ${sportsHtml}

    </body>
    </html>
  `;

  const oldFrame =
    document.getElementById(
      'p12-print-frame'
    );

  if (oldFrame) {
    oldFrame.remove();
  }

  const frame =
    document.createElement(
      'iframe'
    );

  frame.id =
    'p12-print-frame';

  frame.setAttribute(
    'title',
    'P12 Druckansicht'
  );

  frame.style.position =
    'fixed';
  frame.style.right =
    '0';
  frame.style.bottom =
    '0';
  frame.style.width =
    '1px';
  frame.style.height =
    '1px';
  frame.style.border =
    '0';
  frame.style.opacity =
    '0';
  frame.style.pointerEvents =
    'none';

  document.body.appendChild(
    frame
  );

  const printDocument =
    frame.contentDocument ??
    frame.contentWindow
      ?.document;

  if (!printDocument) {
    frame.remove();
    return;
  }

  printDocument.open();
  printDocument.write(html);
  printDocument.close();

  const runPrint = () => {
    const printWindow =
      frame.contentWindow;

    if (!printWindow) {
      frame.remove();
      return;
    }

    try {
      printWindow.focus();
      printWindow.print();
    } finally {
      window.setTimeout(
        () => {
          frame.remove();
        },
        1500
      );
    }
  };

  if (
    printDocument.readyState ===
    'complete'
  ) {
    window.setTimeout(
      runPrint,
      150
    );
  } else {
    frame.onload = () => {
      window.setTimeout(
        runPrint,
        150
      );
    };
  }
}


function ComparisonHistorySection({
  trainerAssessments,
  selfAssessments,
  sportsScienceTests
}: {
  trainerAssessments: TrainerAssessment[];
  selfAssessments: SelfAssessment[];
  sportsScienceTests: SportsTest[];
}) {
  const periods =
    Array.from(
      new Set(
        [
          ...trainerAssessments.map(
            item =>
              item.period_label
          ),
          ...selfAssessments.map(
            item =>
              item.period_label
          )
        ].filter(Boolean)
      )
    );

  const [period, setPeriod] =
    useState(
      periods[0] ?? ''
    );

  const allSportsMetrics =
    Array.from(
      new Set(
        sportsScienceTests.flatMap(
          test =>
            (test.values ?? [])
              .map(
                value =>
                  value.metric
              )
              .filter(Boolean)
        )
      )
    );

  const [sportsMetric, setSportsMetric] =
    useState(
      allSportsMetrics.includes(
        'CMJ'
      )
        ? 'CMJ'
        : allSportsMetrics[0] ??
          ''
    );

  const trainer =
    trainerAssessments.find(
      item =>
        item.period_label ===
        period
    );

  const self =
    selfAssessments.find(
      item =>
        item.period_label ===
        period
    );

  const trainerScores =
    new Map<
      string,
      number
    >();

  (trainer?.scores ?? [])
    .forEach(score => {
      const value =
        score.coach_rating ??
        score.p12_rating;

      if (
        typeof value ===
          'number'
      ) {
        trainerScores.set(
          `${score.category}|||${score.detail}`,
          value
        );
      }
    });

  const selfScores =
    new Map<
      string,
      number
    >();

  (self?.scores ?? [])
    .forEach(score => {
      if (
        typeof score.rating ===
          'number'
      ) {
        selfScores.set(
          `${score.category}|||${score.detail}`,
          score.rating
        );
      }
    });

  const categoryRows =
    TRAINER_CATEGORIES.map(
      group => {
        const trainerValues =
          group.details
            .map(
              detail =>
                trainerScores.get(
                  `${group.category}|||${detail}`
                )
            )
            .filter(
              (
                value
              ): value is number =>
                typeof value ===
                'number'
            );

        const selfValues =
          group.details
            .map(
              detail =>
                selfScores.get(
                  `${group.category}|||${detail}`
                )
            )
            .filter(
              (
                value
              ): value is number =>
                typeof value ===
                'number'
            );

        return {
          category:
            group.category,
          trainer:
            averageNumbers(
              trainerValues
            ),
          self:
            averageNumbers(
              selfValues
            )
        };
      }
    );

  const trainerOverall =
    averageNumbers(
      Array.from(
        trainerScores.values()
      )
    );

  const selfOverall =
    averageNumbers(
      Array.from(
        selfScores.values()
      )
    );

  const detailRows =
    TRAINER_CATEGORIES.flatMap(
      group =>
        group.details.map(
          detail => {
            const key =
              `${group.category}|||${detail}`;
            const coach =
              trainerScores.get(
                key
              );
            const player =
              selfScores.get(
                key
              );

            return {
              category:
                group.category,
              detail,
              coach,
              player,
              delta:
                typeof coach ===
                  'number' &&
                typeof player ===
                  'number'
                  ? Number(
                      (
                        player -
                        coach
                      ).toFixed(
                        1
                      )
                    )
                  : null
            };
          }
        )
    );

  const trainerHistory =
    trainerAssessments
      .map(
        assessment => {
          const values =
            (
              assessment.scores ??
              []
            )
              .map(
                score =>
                  score.coach_rating ??
                  score.p12_rating
              )
              .filter(
                (
                  value
                ): value is number =>
                  typeof value ===
                  'number'
              );

          return {
            id:
              assessment.id,
            period:
              assessment.period_label,
            date:
              assessment.assessment_date ??
              '',
            average:
              averageNumbers(
                values
              )
          };
        }
      )
      .filter(
        item =>
          item.average != null
      )
      .sort(
        (a, b) =>
          String(a.date)
            .localeCompare(
              String(b.date)
            )
      );

  const sportsHistory =
    sportsScienceTests
      .map(test => {
        const value =
          (test.values ?? [])
            .find(
              item =>
                item.metric ===
                sportsMetric
            );

        return {
          id:
            test.id,
          label:
            test.test_label,
          date:
            test.test_date ??
            '',
          value:
            typeof value?.value ===
              'number'
              ? value.value
              : null,
          unit:
            value?.unit ??
            ''
        };
      })
      .filter(
        item =>
          item.value != null
      )
      .sort(
        (a, b) =>
          String(a.date)
            .localeCompare(
              String(b.date)
            )
      );

  return (
    <>
      <section
        style={{
          ...panel,
          marginTop: '14px'
        }}
      >
        <div style={toolbar}>
          <div>
            <h3
              style={{
                margin:
                  '0 0 4px'
              }}
            >
              Trainer ↔ Spieler
            </h3>
            <div style={subtle}>
              Vergleich der Wahrnehmung innerhalb derselben Bewertungsphase.
            </div>
          </div>

          {periods.length > 0 && (
            <label
              style={{
                minWidth:
                  '220px'
              }}
            >
              <div
                style={
                  labelStyle
                }
              >
                Bewertungsphase
              </div>
              <select
                value={period}
                onChange={
                  event =>
                    setPeriod(
                      event.target.value
                    )
                }
                style={
                  inputStyle
                }
              >
                {periods.map(
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
            </label>
          )}
        </div>

        {periods.length === 0 ? (
          <div
            style={{
              marginTop:
                '14px'
            }}
          >
            Noch keine Trainer- oder Spielerbewertungen vorhanden.
          </div>
        ) : (
          <>
            <div
              className="academy-p12-kpis"
              style={{
                ...kpiGrid,
                marginTop:
                  '14px'
              }}
            >
              <ComparisonKpi
                label="Trainer"
                value={
                  trainerOverall
                }
              />
              <ComparisonKpi
                label="Spieler"
                value={
                  selfOverall
                }
              />
              <ComparisonKpi
                label="Differenz"
                value={
                  trainerOverall !=
                    null &&
                  selfOverall !=
                    null
                    ? Number(
                        (
                          selfOverall -
                          trainerOverall
                        ).toFixed(
                          1
                        )
                      )
                    : null
                }
                suffix=""
                signed
              />
            </div>

            <div
              style={{
                display:
                  'grid',
                gap: '10px',
                marginTop:
                  '16px'
              }}
            >
              {categoryRows.map(
                row => (
                  <div
                    key={
                      row.category
                    }
                    className="academy-p12-comparison-row"
                    style={
                      comparisonRow
                    }
                  >
                    <strong>
                      {row.category}
                    </strong>

                    <RatingValue
                      label="Trainer"
                      value={
                        row.trainer
                      }
                    />

                    <RatingValue
                      label="Spieler"
                      value={
                        row.self
                      }
                    />

                    <RatingValue
                      label="Δ"
                      value={
                        row.trainer !=
                          null &&
                        row.self !=
                          null
                          ? Number(
                              (
                                row.self -
                                row.trainer
                              ).toFixed(
                                1
                              )
                            )
                          : null
                      }
                      signed
                    />
                  </div>
                )
              )}
            </div>
          </>
        )}
      </section>

      {trainer &&
        self && (
          <section
            style={{
              ...panel,
              marginTop:
                '14px'
            }}
          >
            <h3
              style={{
                marginTop: 0
              }}
            >
              Detailvergleich
            </h3>

            <div
              style={{
                display:
                  'grid',
                gap: '4px'
              }}
            >
              {detailRows.map(
                row => (
                  <div
                    key={`${row.category}-${row.detail}`}
                    className="academy-p12-detail-comparison-row"
                    style={
                      detailComparisonRow
                    }
                  >
                    <span>
                      {row.detail}
                    </span>
                    <strong>
                      {row.coach ??
                        '–'}
                    </strong>
                    <strong>
                      {row.player ??
                        '–'}
                    </strong>
                    <strong>
                      {row.delta ==
                      null
                        ? '–'
                        : row.delta >
                          0
                          ? `+${row.delta}`
                          : String(
                              row.delta
                            )}
                    </strong>
                  </div>
                )
              )}
            </div>
          </section>
        )}

      <section
        style={{
          ...panel,
          marginTop: '14px'
        }}
      >
        <h3
          style={{
            marginTop: 0
          }}
        >
          Trainerbewertung im Verlauf
        </h3>

        {trainerHistory.length ===
        0 ? (
          <div style={subtle}>
            Noch kein Verlauf verfügbar.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '8px'
            }}
          >
            {trainerHistory.map(
              (
                item,
                index
              ) => {
                const previous =
                  index > 0
                    ? trainerHistory[
                        index - 1
                      ]
                    : null;

                const delta =
                  previous?.average !=
                    null &&
                  item.average !=
                    null
                    ? Number(
                        (
                          item.average -
                          previous.average
                        ).toFixed(
                          1
                        )
                      )
                    : null;

                return (
                  <div
                    key={item.id}
                    style={
                      historyRow
                    }
                  >
                    <div>
                      <strong>
                        {
                          item.period
                        }
                      </strong>
                      <div
                        style={
                          subtle
                        }
                      >
                        {item.date ||
                          '–'}
                      </div>
                    </div>

                    <strong>
                      {item.average?.toFixed(
                        1
                      )}
                      /10
                    </strong>

                    <span
                      style={{
                        fontWeight:
                          700
                      }}
                    >
                      {delta ==
                      null
                        ? '–'
                        : delta >
                          0
                          ? `+${delta}`
                          : String(
                              delta
                            )}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      <section
        style={{
          ...panel,
          marginTop: '14px'
        }}
      >
        <div style={toolbar}>
          <div>
            <h3
              style={{
                margin:
                  '0 0 4px'
              }}
            >
              Sportwissenschaftlicher Verlauf
            </h3>
            <div style={subtle}>
              Entwicklung eines Messwerts über die gespeicherten Testtermine.
            </div>
          </div>

          {allSportsMetrics.length >
            0 && (
            <label
              style={{
                minWidth:
                  '220px'
              }}
            >
              <div
                style={
                  labelStyle
                }
              >
                Messwert
              </div>
              <select
                value={
                  sportsMetric
                }
                onChange={
                  event =>
                    setSportsMetric(
                      event.target.value
                    )
                }
                style={
                  inputStyle
                }
              >
                {allSportsMetrics.map(
                  metric => (
                    <option
                      key={metric}
                      value={metric}
                    >
                      {metric}
                    </option>
                  )
                )}
              </select>
            </label>
          )}
        </div>

        {sportsHistory.length ===
        0 ? (
          <div
            style={{
              ...subtle,
              marginTop:
                '12px'
            }}
          >
            Für diesen Messwert ist noch kein Verlauf verfügbar.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '8px',
              marginTop:
                '14px'
            }}
          >
            {sportsHistory.map(
              (
                item,
                index
              ) => {
                const previous =
                  index > 0
                    ? sportsHistory[
                        index - 1
                      ]
                    : null;

                const delta =
                  previous?.value !=
                    null &&
                  item.value !=
                    null
                    ? Number(
                        (
                          item.value -
                          previous.value
                        ).toFixed(
                          2
                        )
                      )
                    : null;

                return (
                  <div
                    key={item.id}
                    style={
                      historyRow
                    }
                  >
                    <div>
                      <strong>
                        {
                          item.label
                        }
                      </strong>
                      <div
                        style={
                          subtle
                        }
                      >
                        {item.date ||
                          '–'}
                      </div>
                    </div>

                    <strong>
                      {item.value}
                      {item.unit
                        ? ` ${item.unit}`
                        : ''}
                    </strong>

                    <span
                      style={{
                        fontWeight:
                          700
                      }}
                    >
                      {delta ==
                      null
                        ? '–'
                        : delta >
                          0
                          ? `+${delta}`
                          : String(
                              delta
                            )}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    </>
  );
}

function averageNumbers(
  values: number[]
) {
  if (
    values.length === 0
  ) {
    return null;
  }

  return Number(
    (
      values.reduce(
        (
          sum,
          value
        ) =>
          sum + value,
        0
      ) /
      values.length
    ).toFixed(1)
  );
}

function ComparisonKpi({
  label,
  value,
  suffix = '/10',
  signed = false
}: {
  label: string;
  value: number | null;
  suffix?: string;
  signed?: boolean;
}) {
  const display =
    value == null
      ? '–'
      : signed &&
        value > 0
        ? `+${value}${suffix}`
        : `${value}${suffix}`;

  return (
    <div style={panel}>
      <div style={labelStyle}>
        {label}
      </div>
      <div
        style={{
          fontSize: '30px',
          fontWeight: 900,
          marginTop: '6px'
        }}
      >
        {display}
      </div>
    </div>
  );
}

function RatingValue({
  label,
  value,
  signed = false
}: {
  label: string;
  value: number | null;
  signed?: boolean;
}) {
  return (
    <div
      style={{
        textAlign:
          'right'
      }}
    >
      <div
        style={
          labelStyle
        }
      >
        {label}
      </div>
      <strong>
        {value == null
          ? '–'
          : signed &&
            value > 0
            ? `+${value}`
            : value}
      </strong>
    </div>
  );
}

function SportsScienceSection({
  player,
  tests,
  saving,
  setSaving,
  setError,
  setSuccess,
  api,
  onReload
}: {
  player: P12Player;
  tests: SportsTest[];
  saving: boolean;
  setSaving: (value: boolean) => void;
  setError: (value?: string) => void;
  setSuccess: (value?: string) => void;
  api: (path: string, init?: RequestInit) => Promise<any>;
  onReload: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] =
    useState(
      tests[0]?.id
        ? String(tests[0].id)
        : 'new'
    );

  const selected =
    tests.find(
      test =>
        String(test.id) ===
        selectedId
    );

  const [testLabel, setTestLabel] =
    useState(
      selected?.test_label ??
      'Sommer 2026'
    );
  const [testDate, setTestDate] =
    useState(
      selected?.test_date ??
      new Date().toISOString().slice(0, 10)
    );
  const [
    scientistName,
    setScientistName
  ] =
    useState(
      selected?.scientist_name ??
      ''
    );
  const [notes, setNotes] =
    useState(
      selected?.notes ?? ''
    );
  const [values, setValues] =
    useState<Record<string, string>>(
      () =>
        valuesMap(
          selected?.values ?? []
        )
    );

  function choose(value: string) {
    setSelectedId(value);

    const test =
      tests.find(
        item =>
          String(item.id) ===
          value
      );

    if (!test) {
      setTestLabel(
        'Sommer 2026'
      );
      setTestDate(
        new Date()
          .toISOString()
          .slice(0, 10)
      );
      setScientistName('');
      setNotes('');
      setValues({});
      return;
    }

    setTestLabel(
      test.test_label
    );
    setTestDate(
      test.test_date ?? ''
    );
    setScientistName(
      test.scientist_name ??
      ''
    );
    setNotes(
      test.notes ?? ''
    );
    setValues(
      valuesMap(
        test.values ?? []
      )
    );
  }

  async function save() {
    if (!testLabel.trim()) {
      setError(
        'Bitte eine Testphase angeben.'
      );
      return;
    }

    const payloadValues =
      SPORTS_CATEGORIES.flatMap(
        category =>
          category.metrics.map(
            metric => ({
              metric:
                metric.metric,
              value:
                values[
                  metric.metric
                ] === '' ||
                values[
                  metric.metric
                ] == null
                  ? null
                  : Number(
                      String(
                        values[
                          metric.metric
                        ]
                      ).replace(
                        ',',
                        '.'
                      )
                    ),
              unit:
                metric.unit,
              normalized_score:
                null
            })
          )
      );

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await api(
        '/academy/p12/sport-science',
        {
          method: 'POST',
          body: JSON.stringify({
            p12_player_id:
              player.id,
            test_label:
              testLabel,
            test_date:
              testDate || null,
            scientist_name:
              scientistName ||
              null,
            notes:
              notes || null,
            values:
              payloadValues
          })
        }
      );

      setSuccess(
        selected
          ? 'Sportwissenschaftlicher Test wurde aktualisiert.'
          : 'Sportwissenschaftlicher Test wurde gespeichert.'
      );
      await onReload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Test konnte nicht gespeichert werden.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selected) {
      return;
    }

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await api(
        `/academy/p12/sport-science/${selected.id}`,
        {
          method: 'DELETE'
        }
      );

      setSuccess(
        'Sportwissenschaftlicher Test wurde gelöscht.'
      );
      setSelectedId('new');
      choose('new');
      await onReload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Test konnte nicht gelöscht werden.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section
        style={{
          ...panel,
          marginTop: '14px'
        }}
      >
        <div
          className="academy-p12-form-grid"
          style={formGrid}
        >
          <SelectField
            label="Test auswählen"
            value={selectedId}
            options={[
              'new',
              ...tests.map(
                test =>
                  String(test.id)
              )
            ]}
            optionLabel={value => {
              if (value === 'new') {
                return 'Neuen Test anlegen';
              }

              const test =
                tests.find(
                  item =>
                    String(
                      item.id
                    ) === value
                );

              return test
                ? `${test.test_label}${test.test_date ? ` · ${test.test_date}` : ''}`
                : value;
            }}
            onChange={choose}
          />
          <TextField
            label="Testphase"
            value={testLabel}
            onChange={setTestLabel}
          />
          <TextField
            label="Testdatum"
            type="date"
            value={testDate}
            onChange={setTestDate}
          />
          <TextField
            label="Sportwissenschaftler/in"
            value={scientistName}
            onChange={setScientistName}
          />
        </div>

        <TextArea
          label="Notizen"
          value={notes}
          onChange={setNotes}
        />

        {SPORTS_CATEGORIES.map(
          category => (
            <div
              key={category.name}
              style={{
                marginTop: '18px'
              }}
            >
              <h4>
                {category.name}
              </h4>

              <div
                style={{
                  display: 'grid',
                  gap: '8px'
                }}
              >
                {category.metrics.map(
                  metric => (
                    <div
                      key={metric.metric}
                      className="academy-p12-metric-row"
                      style={metricRow}
                    >
                      <div>
                        <strong>
                          {metric.metric}
                        </strong>
                        {metric.unit && (
                          <span style={subtle}>
                            {' '}
                            ({metric.unit})
                          </span>
                        )}
                      </div>

                      <input
                        type="number"
                        step="0.01"
                        value={
                          values[
                            metric.metric
                          ] ?? ''
                        }
                        onChange={event =>
                          setValues(
                            current => ({
                              ...current,
                              [metric.metric]:
                                event.target.value
                            })
                          )
                        }
                        style={inputStyle}
                      />

                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight:
                            'target' in metric &&
                            metric.target
                              ? 700
                              : 400,
                          color:
                            'target' in metric &&
                            metric.target
                              ? '#0b6b35'
                              : '#999'
                        }}
                      >
                        {'target' in metric &&
                        metric.target
                          ? `Sollwert Profis: ${metric.target}`
                          : '–'}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '18px'
          }}
        >
          {selected ? (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              style={dangerButton}
            >
              Test löschen
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={primaryButton}
          >
            {saving
              ? 'Speichert…'
              : selected
                ? 'Teständerungen speichern'
                : 'Sportwissenschaftlichen Test speichern'}
          </button>
        </div>
      </section>

      {tests.length > 0 && (
        <section
          style={{
            ...panel,
            marginTop: '14px'
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Gespeicherte Tests
          </h3>

          <div
            style={{
              display: 'grid',
              gap: '12px'
            }}
          >
            {[...tests]
              .reverse()
              .map(test => (
                <div
                  key={test.id}
                  style={{
                    borderTop:
                      '1px solid #eee',
                    paddingTop:
                      '12px'
                  }}
                >
                  <strong>
                    {test.test_label}
                  </strong>
                  <span style={subtle}>
                    {' '}
                    · {test.test_date ?? '–'}
                  </span>

                  <div
                    className="academy-p12-history-grid"
                    style={historyGrid}
                  >
                    {(test.values ?? [])
                      .filter(
                        value =>
                          value.value != null
                      )
                      .map(value => (
                        <div
                          key={value.metric}
                          style={historyCard}
                        >
                          <div style={labelStyle}>
                            {value.metric}
                          </div>
                          <strong>
                            {value.value}
                            {value.unit
                              ? ` ${value.unit}`
                              : ''}
                          </strong>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </>
  );
}

function scoreMap(
  rows: TrainerScore[]
) {
  const result:
    Record<string, {
      rating: number;
      notes: string;
    }> = {};

  rows.forEach(row => {
    result[
      `${row.category}|||${row.detail}`
    ] = {
      rating:
        Number(
          row.coach_rating ??
          row.p12_rating ??
          0
        ),
      notes:
        row.notes ?? ''
    };
  });

  return result;
}

function valuesMap(
  rows: SportsValue[]
) {
  const result:
    Record<string, string> = {};

  rows.forEach(row => {
    result[row.metric] =
      row.value == null
        ? ''
        : String(row.value);
  });

  return result;
}


function P12ProfileStat({
  label,
  value,
  hint
}: {
  label: string;
  value:
    string |
    number;
  hint: string;
}) {
  return (
    <div style={p12ProfileStatCard}>
      <span style={p12ProfileStatLabel}>
        {label}
      </span>

      <strong style={p12ProfileStatValue}>
        {value}
      </strong>

      <span style={p12ProfileStatHint}>
        {hint}
      </span>
    </div>
  );
}


function ProfileTabButton({
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
      style={{
        ...tabButton,
        ...(active
          ? tabButtonActive
          : {})
      }}
    >
      {children}
    </button>
  );
}

function TextField({
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
    <label>
      <div style={labelStyle}>
        {label}
      </div>
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
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  optionLabel
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  optionLabel?: (value: string) => string;
}) {
  return (
    <label>
      <div style={labelStyle}>
        {label}
      </div>
      <select
        value={value}
        onChange={event =>
          onChange(
            event.target.value
          )
        }
        style={inputStyle}
      >
        {options.map(option => (
          <option
            key={option}
            value={option}
          >
            {optionLabel
              ? optionLabel(option)
              : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label
      style={{
        display: 'block',
        marginTop: '12px'
      }}
    >
      <div style={labelStyle}>
        {label}
      </div>
      <textarea
        rows={rows}
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
    </label>
  );
}

function SaveRow({
  saving,
  label,
  onSave
}: {
  saving: boolean;
  label: string;
  onSave: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '16px'
      }}
    >
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        style={primaryButton}
      >
        {saving
          ? 'Speichert…'
          : label}
      </button>
    </div>
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


function P12OverviewCard({
  label,
  value,
  hint,
  active,
  onClick
}: {
  label: string;
  value: number;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...p12OverviewCard,
        ...(active
          ? p12OverviewCardActive
          : {})
      }}
    >
      <span
        style={{
          ...p12OverviewLabel,
          ...(active
            ? p12OverviewLabelActive
            : {})
        }}
      >
        {label}
      </span>

      <strong
        style={{
          ...p12OverviewValue,
          ...(active
            ? p12OverviewValueActive
            : {})
        }}
      >
        {value}
      </strong>

      <span
        style={{
          ...p12OverviewHint,
          ...(active
            ? p12OverviewHintActive
            : {})
        }}
      >
        {hint}
      </span>
    </button>
  );
}


function Kpi({
  label,
  value,
  hint
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div style={panel}>
      <div style={labelStyle}>
        {label}
      </div>
      <div
        style={{
          fontSize: '30px',
          fontWeight: 900,
          marginTop: '6px'
        }}
      >
        {value}
      </div>
      <div style={subtle}>
        {hint}
      </div>
    </div>
  );
}

function SmallInfo({
  label,
  value
}: {
  label: string;
  value?: string;
}) {
  return (
    <div
      style={{
        fontSize: '13px'
      }}
    >
      <span style={{ color: '#777' }}>
        {label}:{' '}
      </span>
      <strong>
        {value || '–'}
      </strong>
    </div>
  );
}

function InfoBlock({
  label,
  value
}: {
  label: string;
  value?: string;
}) {
  return (
    <div style={historyCard}>
      <div style={labelStyle}>
        {label}
      </div>
      <div
        style={{
          marginTop: '6px',
          whiteSpace: 'pre-wrap'
        }}
      >
        {value || '–'}
      </div>
    </div>
  );
}

const assessmentDeleteArea:
  React.CSSProperties = {
  marginTop: '10px',
  paddingTop: '12px',
  borderTop:
    '1px solid #f0e1e1'
};

const assessmentDeleteButton:
  React.CSSProperties = {
  border:
    '1px solid #e2b8b8',
  background:
    '#fff5f5',
  color:
    '#9b1c1c',
  padding:
    '10px 14px',
  borderRadius:
    '9px',
  cursor:
    'pointer',
  fontWeight:
    800
};

const assessmentDeleteConfirm:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  alignItems:
    'center',
  gap: '14px',
  flexWrap: 'wrap',
  padding: '12px',
  borderRadius: '10px',
  background: '#fff5f5',
  border:
    '1px solid #e6c1c1'
};

const assessmentDeleteHint:
  React.CSSProperties = {
  marginTop: '4px',
  color: '#7a3a3a',
  fontSize: '11px',
  lineHeight: 1.4
};

const assessmentDeleteActions:
  React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap'
};

const p12ProfileHero:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  gap: '18px',
  alignItems:
    'flex-start',
  flexWrap: 'wrap',
  padding: '18px',
  borderRadius: '16px',
  background: '#fff',
  border:
    '1px solid #e7e9e7'
};

const p12ProfileIdentity:
  React.CSSProperties = {
  display: 'flex',
  gap: '14px',
  alignItems: 'center',
  minWidth: 0
};

const p12ProfileAvatar:
  React.CSSProperties = {
  width: '64px',
  height: '64px',
  flex: '0 0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '16px',
  background: '#0b7a3b',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 900,
  letterSpacing: '.03em'
};

const p12ProfileEyebrow:
  React.CSSProperties = {
  color: '#0b7a3b',
  fontSize: '9px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.07em'
};

const p12ProfileName:
  React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '26px',
  lineHeight: 1.05,
  letterSpacing: '-.025em'
};

const p12ProfileMeta:
  React.CSSProperties = {
  marginTop: '5px',
  color: '#666',
  fontSize: '12px',
  lineHeight: 1.4
};

const p12ProfileBadges:
  React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  marginTop: '9px'
};

const p12ProfileStatusBadge:
  React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#edf7f1',
  color: '#0b6b35',
  fontSize: '10px',
  fontWeight: 900
};

const p12ProfileSoftBadge:
  React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#f2f3f2',
  color: '#555',
  fontSize: '10px',
  fontWeight: 800
};

const p12ProfileActions:
  React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end'
};

const p12ProfileStats:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '10px',
  marginTop: '12px'
};

const p12ProfileStatCard:
  React.CSSProperties = {
  padding: '11px 12px',
  borderRadius: '11px',
  background: '#fff',
  border:
    '1px solid #e7e9e7'
};

const p12ProfileStatLabel:
  React.CSSProperties = {
  display: 'block',
  color: '#858a85',
  fontSize: '8px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.05em'
};

const p12ProfileStatValue:
  React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  color: '#161616',
  fontSize: '20px',
  lineHeight: 1
};

const p12ProfileStatHint:
  React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  color: '#999',
  fontSize: '9px'
};

const p12OverviewGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(125px, 1fr))',
  gap: '10px',
  marginTop: '14px'
};

const p12OverviewCard:
  React.CSSProperties = {
  appearance: 'none',
  border:
    '1px solid #e4e7e4',
  borderRadius: '12px',
  background: '#fff',
  padding: '12px 14px',
  textAlign: 'left',
  font: 'inherit',
  cursor: 'pointer'
};

const p12OverviewCardActive:
  React.CSSProperties = {
  background: '#0b7a3b',
  borderColor: '#0b7a3b'
};

const p12InfoCard:
  React.CSSProperties = {
  border:
    '1px solid #e4e7e4',
  borderRadius: '12px',
  background: '#f8f9f8',
  padding: '12px 14px'
};

const p12OverviewLabel:
  React.CSSProperties = {
  display: 'block',
  color: '#7c827c',
  fontSize: '9px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.05em'
};

const p12OverviewLabelActive:
  React.CSSProperties = {
  color:
    'rgba(255,255,255,.78)'
};

const p12OverviewValue:
  React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  color: '#161616',
  fontSize: '22px',
  lineHeight: 1
};

const p12OverviewValueActive:
  React.CSSProperties = {
  color: '#fff'
};

const p12OverviewHint:
  React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  color: '#999',
  fontSize: '10px'
};

const p12OverviewHintActive:
  React.CSSProperties = {
  color:
    'rgba(255,255,255,.7)'
};

const p12FilterGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '10px',
  alignItems: 'end'
};

const p12PlayerFacts:
  React.CSSProperties = {
  marginTop: '12px',
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '6px 12px'
};

const p12PlayerFooter:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  gap: '10px',
  alignItems: 'center',
  marginTop: '14px',
  paddingTop: '10px',
  borderTop:
    '1px solid #eef0ee',
  color: '#777',
  fontSize: '11px'
};

const p12OpenHint:
  React.CSSProperties = {
  color: '#0b6b35',
  fontWeight: 800
};

const panel: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ececec',
  borderRadius: '14px',
  padding: '18px',
  boxShadow:
    '0 3px 14px rgba(0,0,0,0.04)'
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

const secondaryButton:
  React.CSSProperties = {
    border:
      '1px solid #d0d0d0',
    background: '#fff',
    color: '#222',
    padding: '10px 14px',
    borderRadius: '9px',
    cursor: 'pointer',
    fontWeight: 700
  };

const dangerButton:
  React.CSSProperties = {
    ...secondaryButton,
    color: '#a00000',
    borderColor: '#e6bcbc',
    background: '#fff7f7'
  };

const toolbar:
  React.CSSProperties = {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  };

const kpiGrid:
  React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(0, 1fr))',
    gap: '10px',
    marginTop: '14px'
  };

const formGrid:
  React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(0, 1fr))',
    gap: '12px'
  };

const playerGrid:
  React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '12px',
    marginTop: '14px'
  };

const playerCard:
  React.CSSProperties = {
    ...panel,
    textAlign: 'left',
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer'
  };

const labelStyle:
  React.CSSProperties = {
    fontSize: '12px',
    color: '#666',
    fontWeight: 700,
    marginBottom: '5px'
  };

const subtle:
  React.CSSProperties = {
    color: '#777',
    fontSize: '12px'
  };

const inputStyle:
  React.CSSProperties = {
    width: '100%',
    minHeight: '42px',
    boxSizing: 'border-box',
    border:
      '1px solid #d5d5d5',
    borderRadius: '8px',
    padding: '10px',
    background: '#fff',
    font: 'inherit'
  };

const pill:
  React.CSSProperties = {
    background: '#eef5f1',
    color: '#0b6b35',
    borderRadius: '999px',
    padding: '5px 9px',
    fontSize: '11px',
    fontWeight: 800
  };

const errorBox:
  React.CSSProperties = {
    marginTop: '12px',
    padding: '12px 14px',
    background: '#fff3f3',
    color: '#a00000',
    borderRadius: '10px'
  };

const successBox:
  React.CSSProperties = {
    marginTop: '12px',
    padding: '12px 14px',
    background: '#eef9f2',
    color: '#0b6b35',
    borderRadius: '10px'
  };

const tabBar:
  React.CSSProperties = {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '16px'
  };

const tabButton:
  React.CSSProperties = {
    border:
      '1px solid #d8d8d8',
    background: '#fff',
    color: '#333',
    padding: '9px 12px',
    borderRadius: '9px',
    cursor: 'pointer',
    fontWeight: 700
  };

const tabButtonActive:
  React.CSSProperties = {
    background: '#0b7a3b',
    color: '#fff',
    borderColor: '#0b7a3b'
  };

const ratingRow:
  React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns:
      'minmax(280px, 2fr) 90px minmax(180px, 1fr)',
    gap: '8px',
    alignItems: 'center'
  };

const metricRow:
  React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns:
      'minmax(200px, 1.7fr) minmax(110px, .8fr) minmax(180px, 1fr)',
    gap: '10px',
    alignItems: 'center'
  };

const historyGrid:
  React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '8px',
    marginTop: '10px'
  };

const historyCard:
  React.CSSProperties = {
    background: '#f7f8f8',
    borderRadius: '9px',
    padding: '10px'
  };

const comparisonRow:
  React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns:
      'minmax(260px, 1fr) 90px 90px 70px',
    gap: '10px',
    alignItems: 'center',
    padding:
      '10px 0',
    borderBottom:
      '1px solid #f0f0f0'
  };

const detailComparisonRow:
  React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns:
      'minmax(280px, 1fr) 70px 70px 70px',
    gap: '10px',
    alignItems: 'center',
    padding:
      '8px 0',
    borderBottom:
      '1px solid #f0f0f0'
  };

const historyRow:
  React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns:
      'minmax(180px, 1fr) 120px 80px',
    gap: '12px',
    alignItems: 'center',
    padding:
      '10px 0',
    borderBottom:
      '1px solid #f0f0f0'
  };

const pyramidGrid:
  React.CSSProperties = {
    display: 'grid',
    gap: '8px',
    maxWidth: '900px',
    margin:
      '18px auto 0'
  };

const pyramidBottom:
  React.CSSProperties = {
    ...panel,
    background: '#eef5f1',
    textAlign: 'center',
    display: 'grid',
    gap: '5px'
  };

const pyramidMiddle:
  React.CSSProperties = {
    ...panel,
    background: '#dcece3',
    textAlign: 'center',
    display: 'grid',
    gap: '5px',
    width: '78%',
    justifySelf: 'center'
  };

const pyramidTop:
  React.CSSProperties = {
    ...panel,
    background: '#c9e3d4',
    textAlign: 'center',
    display: 'grid',
    gap: '5px',
    width: '56%',
    justifySelf: 'center'
  };
