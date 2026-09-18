import type { CSSProperties } from 'react';

type Props = {
  displayName: string;
  userPrincipalName?: string;
  inTeams: boolean;
  ssoOk: boolean;
  ssoError?: string;
  apiOk: boolean | null;
  supabaseOk: boolean | null;
  playerCount: number | null;
  supabaseError?: string;
  onOpenScoutingReports: () => void;
  onOpenWatchlist: () => void;
  onOpenSquad: () => void;
  onOpenPlayerArchive: () => void;
  onOpenAKAVision: () => void;
};

type FeatureCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  accent?: boolean;
  compact?: boolean;
  onClick: () => void;
};

export default function Dashboard({
  displayName,
  userPrincipalName,
  inTeams,
  ssoOk,
  ssoError,
  apiOk,
  supabaseOk,
  playerCount,
  supabaseError,
  onOpenScoutingReports,
  onOpenWatchlist,
  onOpenSquad,
  onOpenPlayerArchive,
  onOpenAKAVision
}: Props) {
  const hasSystemError =
    !ssoOk ||
    apiOk === false ||
    supabaseOk === false;

  return (
    <main
      className="vv-dashboard"
      style={page}
    >
      <section
        className="vv-dashboard-hero"
        style={hero}
      >
        <div>
          <div style={brandLine}>
            <span style={clubDot}>
              SVR
            </span>

            <span style={eyebrow}>
              SV Oberbank Ried
            </span>
          </div>

          <h1 style={title}>
            VikingVision
          </h1>

          <p style={subtitle}>
            Scouting, Kader und Akademie an einem Ort.
          </p>
        </div>

        <div
          className="vv-dashboard-user"
          style={userBox}
        >
          <div style={userInitial}>
            {displayName
              .trim()
              .charAt(0)
              .toUpperCase() || 'V'}
          </div>

          <div>
            <strong
              style={{
                display: 'block',
                fontSize: '14px'
              }}
            >
              {displayName}
            </strong>

            {userPrincipalName && (
              <span style={userMeta}>
                {userPrincipalName}
              </span>
            )}

            <span style={userMeta}>
              {inTeams
                ? 'Microsoft Teams'
                : 'Browser'}
            </span>
          </div>
        </div>
      </section>

      <section
        className="vv-dashboard-statusbar"
        style={statusBar}
      >
        <StatusItem
          label="Teams"
          ok={inTeams}
          pending={false}
          fallback="Browser"
        />

        <StatusItem
          label="API"
          ok={apiOk === true}
          pending={apiOk === null}
        />

        <StatusItem
          label="SSO"
          ok={ssoOk}
          pending={false}
        />

        <StatusItem
          label="Datenbank"
          ok={supabaseOk === true}
          pending={supabaseOk === null}
          suffix={
            supabaseOk &&
            playerCount !== null
              ? `${playerCount} Spieler`
              : undefined
          }
        />
      </section>

      <section
        style={quickStats}
      >
        <QuickStat
          label="Spieler"
          value={
            playerCount !== null
              ? String(playerCount)
              : '–'
          }
          hint="aktive Profile"
        />

        <QuickStat
          label="Arbeitsmodus"
          value={
            inTeams
              ? 'Teams'
              : 'Browser'
          }
          hint="aktuelle Sitzung"
        />

        <QuickStat
          label="SSO"
          value={
            ssoOk
              ? 'Aktiv'
              : 'Fehler'
          }
          hint="Microsoft Entra"
        />

        <QuickStat
          label="Datenbank"
          value={
            supabaseOk === true
              ? 'Verbunden'
              : supabaseOk === null
                ? 'Prüft…'
                : 'Fehler'
          }
          hint="Supabase"
        />
      </section>

      {hasSystemError && (
        <section
          style={warningBox}
        >
          <strong>
            Systemhinweis
          </strong>

          <div
            style={{
              marginTop: '5px',
              display: 'grid',
              gap: '3px'
            }}
          >
            {!ssoOk && ssoError && (
              <span>
                SSO: {ssoError}
              </span>
            )}

            {supabaseOk === false &&
              supabaseError && (
                <span>
                  Datenbank: {supabaseError}
                </span>
              )}

            {apiOk === false && (
              <span>
                API ist aktuell nicht erreichbar.
              </span>
            )}
          </div>
        </section>
      )}

      <section
        style={sectionHeader}
      >
        <div>
          <div style={sectionEyebrow}>
            VikingVision
          </div>
          <h2 style={sectionTitle}>
            Scouting & Kader
          </h2>
        </div>

        <span style={sectionHint}>
          Profibereich
        </span>
      </section>

      <section
        className="vv-dashboard-main-grid"
        style={mainGrid}
      >
        <FeatureCard
          eyebrow="Scouting"
          title="Spieler beobachten"
          description="Spielerprofile, Scoutingberichte und externe Kandidaten verwalten."
          onClick={
            onOpenScoutingReports
          }
        />

        <FeatureCard
          eyebrow="Watchlist"
          title="Kandidaten im Blick"
          description="Interessante Spieler priorisieren und nächste Schritte festhalten."
          onClick={onOpenWatchlist}
        />

        <FeatureCard
          eyebrow="Kader"
          title="Unser Kader"
          description="Aktuelle SV-Ried-Spieler, Verträge und interne Spielerprofile."
          accent
          onClick={onOpenSquad}
        />
      </section>

      <section
        style={{
          ...sectionHeader,
          marginTop: '30px'
        }}
      >
        <div>
          <div style={sectionEyebrow}>
            Akademie
          </div>
          <h2 style={sectionTitle}>
            AKAVision
          </h2>
        </div>

        <span style={sectionHint}>
          U15 · U16 · U18 · JWR · P12
        </span>
      </section>

      <button
        type="button"
        className="vv-dashboard-aka-card"
        onClick={onOpenAKAVision}
        style={akaCard}
      >
        <div style={akaContent}>
          <div>
            <div style={akaEyebrow}>
              Akademie-Plattform
            </div>

            <h3 style={akaTitle}>
              AKAVision öffnen
            </h3>

            <p style={akaText}>
              Stammdaten, Ideale, Sport Science,
              Skill / AC, P12 und Academy-Scouting.
            </p>
          </div>

          <span style={arrow}>
            →
          </span>
        </div>
      </button>

      <section
        style={{
          ...sectionHeader,
          marginTop: '30px'
        }}
      >
        <div>
          <div style={sectionEyebrow}>
            Plattformen
          </div>

          <h2 style={sectionTitle}>
            Externe Tools
          </h2>
        </div>

        <span style={sectionHint}>
          Öffnet separat · VikingVision bleibt offen
        </span>
      </section>

      <button
        type="button"
        onClick={() =>
          window.open(
            'https://svried.statslibuda.de/',
            '_blank',
            'noopener,noreferrer'
          )
        }
        style={statsLibudaCard}
      >
        <div>
          <div style={cardEyebrowStyle}>
            Analyse-Plattform
          </div>

          <h3 style={statsLibudaTitle}>
            StatsLibuda
          </h3>

          <p style={cardDescription}>
            Externe SV-Ried-Analyseplattform in einem neuen Browser-Tab bzw. Fenster öffnen.
          </p>
        </div>

        <div style={externalArrow}>
          ↗
        </div>
      </button>

      <section
        style={{
          ...sectionHeader,
          marginTop: '30px'
        }}
      >
        <div>
          <div style={sectionEyebrow}>
            Verwaltung
          </div>
          <h2 style={sectionTitle}>
            Datenpflege
          </h2>
        </div>
      </section>

      <section
        className="vv-dashboard-admin-grid"
        style={adminGrid}
      >
        <FeatureCard
          eyebrow="Archiv"
          title="Spielerarchiv"
          description="Archivierte Spieler ansehen und bei Bedarf wiederherstellen."
          compact
          onClick={onOpenPlayerArchive}
        />
      </section>
    </main>
  );
}

function QuickStat({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div style={quickStatCard}>
      <div style={quickStatLabel}>
        {label}
      </div>

      <div style={quickStatValue}>
        {value}
      </div>

      <div style={quickStatHint}>
        {hint}
      </div>
    </div>
  );
}

function StatusItem({
  label,
  ok,
  pending,
  suffix,
  fallback
}: {
  label: string;
  ok: boolean;
  pending: boolean;
  suffix?: string;
  fallback?: string;
}) {
  const statusText =
    pending
      ? 'prüfe…'
      : ok
        ? 'verbunden'
        : fallback ??
          'nicht verbunden';

  return (
    <div style={statusItem}>
      <span
        style={{
          ...statusDot,
          background:
            pending
              ? '#b8b8b8'
              : ok
                ? '#0b7a3b'
                : '#b23a3a'
        }}
      />

      <span style={statusLabel}>
        {label}
      </span>

      <span style={statusValue}>
        {statusText}
        {suffix
          ? ` · ${suffix}`
          : ''}
      </span>
    </div>
  );
}

function FeatureCard({
  eyebrow: cardEyebrow,
  title: cardTitle,
  description,
  accent = false,
  compact = false,
  onClick
}: FeatureCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...featureCard,
        ...(accent
          ? featureCardAccent
          : {}),
        ...(compact
          ? compactCard
          : {})
      }}
    >
      <div>
        <div
          style={{
            ...cardEyebrowStyle,
            ...(accent
              ? {
                  color:
                    'rgba(255,255,255,.75)'
                }
              : {})
          }}
        >
          {cardEyebrow}
        </div>

        <h3
          style={{
            ...cardTitleStyle,
            ...(accent
              ? {
                  color: '#fff'
                }
              : {})
          }}
        >
          {cardTitle}
        </h3>

        <p
          style={{
            ...cardDescription,
            ...(accent
              ? {
                  color:
                    'rgba(255,255,255,.78)'
                }
              : {})
          }}
        >
          {description}
        </p>
      </div>

      <div
        style={{
          ...cardArrow,
          ...(accent
            ? {
                borderColor:
                  'rgba(255,255,255,.3)',
                color: '#fff'
              }
            : {})
        }}
      >
        →
      </div>
    </button>
  );
}

const page: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '32px 24px 56px'
};

const hero: CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  alignItems: 'center',
  gap: '24px',
  background: '#fff',
  border:
    '1px solid #ececec',
  borderRadius: '18px',
  padding: '28px 30px',
  boxShadow:
    '0 8px 28px rgba(0,0,0,.055)'
};

const brandLine: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px'
};

const clubDot: CSSProperties = {
  display: 'inline-flex',
  height: '26px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  background: '#0b7a3b',
  color: '#fff',
  padding: '0 9px',
  fontSize: '10px',
  fontWeight: 900,
  letterSpacing: '.06em'
};

const eyebrow: CSSProperties = {
  color: '#0b6b35',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '.1em',
  fontWeight: 900
};

const title: CSSProperties = {
  margin: '14px 0 5px',
  fontSize:
    'clamp(32px, 4vw, 46px)',
  lineHeight: 1,
  letterSpacing: '-.035em'
};

const subtitle: CSSProperties = {
  margin: 0,
  color: '#686868',
  fontSize: '15px'
};

const userBox: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '11px',
  minWidth: '220px',
  padding: '10px 12px',
  borderRadius: '12px',
  background: '#f7f8f7',
  border:
    '1px solid #ecefec'
};

const userInitial: CSSProperties = {
  flex: '0 0 auto',
  display: 'flex',
  width: '38px',
  height: '38px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: '#111',
  color: '#fff',
  fontWeight: 900
};

const userMeta: CSSProperties = {
  display: 'block',
  color: '#737373',
  fontSize: '11px',
  marginTop: '2px',
  maxWidth: '210px',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const statusBar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  flexWrap: 'wrap',
  marginTop: '12px',
  padding: '9px 12px',
  background:
    'rgba(255,255,255,.72)',
  border:
    '1px solid #ececec',
  borderRadius: '11px',
  fontSize: '11px'
};

const statusItem: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px'
};

const statusDot: CSSProperties = {
  width: '7px',
  height: '7px',
  borderRadius: '50%'
};

const statusLabel: CSSProperties = {
  fontWeight: 800,
  color: '#404040'
};

const statusValue: CSSProperties = {
  color: '#777'
};

const quickStats: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(4, minmax(0, 1fr))',
  gap: '10px',
  marginTop: '12px'
};

const quickStatCard: CSSProperties = {
  background: '#fff',
  border: '1px solid #ececec',
  borderRadius: '13px',
  padding: '13px 14px',
  boxShadow:
    '0 3px 12px rgba(0,0,0,.025)'
};

const quickStatLabel: CSSProperties = {
  color: '#7c827c',
  fontSize: '9px',
  textTransform: 'uppercase',
  letterSpacing: '.07em',
  fontWeight: 900
};

const quickStatValue: CSSProperties = {
  marginTop: '5px',
  color: '#151515',
  fontSize: '20px',
  fontWeight: 900,
  letterSpacing: '-.02em'
};

const quickStatHint: CSSProperties = {
  marginTop: '2px',
  color: '#999',
  fontSize: '10px'
};

const statsLibudaCard: CSSProperties = {
  width: '100%',
  minHeight: '120px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '20px',
  textAlign: 'left',
  border: '1px solid #cde0d4',
  borderRadius: '16px',
  padding: '20px',
  background:
    'linear-gradient(135deg, #f7fbf8 0%, #edf7f1 100%)',
  color: '#171717',
  font: 'inherit',
  cursor: 'pointer'
};

const statsLibudaTitle: CSSProperties = {
  margin: '6px 0 7px',
  color: '#0b6b35',
  fontSize: '21px',
  letterSpacing: '-.02em'
};

const externalArrow: CSSProperties = {
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: '1px solid #a8cbb6',
  color: '#0b6b35',
  fontSize: '18px',
  flex: '0 0 auto'
};

const warningBox: CSSProperties = {
  marginTop: '12px',
  padding: '11px 14px',
  borderRadius: '10px',
  background: '#fff8e8',
  color: '#805000',
  fontSize: '12px',
  border:
    '1px solid #f0dfb2'
};

const sectionHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'end',
  justifyContent:
    'space-between',
  gap: '16px',
  marginTop: '28px',
  marginBottom: '12px'
};

const sectionEyebrow: CSSProperties = {
  color: '#0b7a3b',
  fontSize: '10px',
  fontWeight: 900,
  letterSpacing: '.11em',
  textTransform: 'uppercase'
};

const sectionTitle: CSSProperties = {
  margin: '3px 0 0',
  fontSize: '21px',
  letterSpacing: '-.02em'
};

const sectionHint: CSSProperties = {
  color: '#8a8a8a',
  fontSize: '11px',
  paddingBottom: '2px'
};

const mainGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(3, minmax(0, 1fr))',
  gap: '12px'
};

const featureCard: CSSProperties = {
  minHeight: '178px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent:
    'space-between',
  alignItems: 'stretch',
  textAlign: 'left',
  border:
    '1px solid #e7e7e7',
  borderRadius: '16px',
  padding: '20px',
  background: '#fff',
  color: '#171717',
  font: 'inherit',
  cursor: 'pointer',
  boxShadow:
    '0 4px 16px rgba(0,0,0,.035)'
};

const featureCardAccent: CSSProperties = {
  background: '#0b7a3b',
  borderColor: '#0b7a3b',
  color: '#fff'
};

const compactCard: CSSProperties = {
  minHeight: '132px'
};

const cardEyebrowStyle: CSSProperties = {
  color: '#0b7a3b',
  fontSize: '10px',
  fontWeight: 900,
  letterSpacing: '.09em',
  textTransform: 'uppercase'
};

const cardTitleStyle: CSSProperties = {
  margin: '7px 0 7px',
  fontSize: '20px',
  lineHeight: 1.15,
  letterSpacing: '-.02em'
};

const cardDescription: CSSProperties = {
  margin: 0,
  color: '#6f6f6f',
  fontSize: '12px',
  lineHeight: 1.5
};

const cardArrow: CSSProperties = {
  width: '31px',
  height: '31px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-end',
  marginTop: '14px',
  border:
    '1px solid #e1e1e1',
  borderRadius: '50%',
  color: '#222',
  fontSize: '17px'
};

const akaCard: CSSProperties = {
  width: '100%',
  border: 'none',
  borderRadius: '18px',
  background:
    'linear-gradient(120deg, #0b7a3b 0%, #075b2d 100%)',
  color: '#fff',
  padding: '24px 26px',
  textAlign: 'left',
  cursor: 'pointer',
  font: 'inherit',
  boxShadow:
    '0 8px 24px rgba(5,88,43,.16)'
};

const akaContent: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent:
    'space-between',
  gap: '24px'
};

const akaEyebrow: CSSProperties = {
  color:
    'rgba(255,255,255,.7)',
  fontSize: '10px',
  fontWeight: 900,
  letterSpacing: '.1em',
  textTransform: 'uppercase'
};

const akaTitle: CSSProperties = {
  margin: '6px 0 6px',
  color: '#fff',
  fontSize: '24px',
  letterSpacing: '-.025em'
};

const akaText: CSSProperties = {
  margin: 0,
  maxWidth: '650px',
  color:
    'rgba(255,255,255,.78)',
  fontSize: '13px',
  lineHeight: 1.5
};

const arrow: CSSProperties = {
  fontSize: '30px',
  fontWeight: 300
};

const adminGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 390px)',
  gap: '12px'
};
