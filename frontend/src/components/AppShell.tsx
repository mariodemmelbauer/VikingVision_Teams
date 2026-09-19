import type { CSSProperties, ReactNode } from 'react';

type NavKey =
  | 'dashboard'
  | 'scoutingReports'
  | 'watchlist'
  | 'squad'
  | 'akavision'
  | 'playerArchive'
  | 'playerProfile';

type Props = {
  currentPage: NavKey;
  displayName: string;
  inTeams: boolean;
  children: ReactNode;
  onDashboard: () => void;
  onScouting: () => void;
  onWatchlist: () => void;
  onSquad: () => void;
  onAKAVision: () => void;
  onArchive: () => void;
};

type NavItemProps = {
  active: boolean;
  label: string;
  short: string;
  onClick: () => void;
};

export default function AppShell({
  currentPage,
  displayName,
  inTeams,
  children,
  onDashboard,
  onScouting,
  onWatchlist,
  onSquad,
  onAKAVision,
  onArchive
}: Props) {
  return (
    <div className="vv-app-shell" style={shell}>
      <aside className="vv-side-nav" style={sideNav}>
        <div>
          <button type="button" onClick={onDashboard} style={brandButton}>
            <span style={brandMark}>
              <img
                src="https://cdn.api.everysport.com/logos/fotboll/sv_ried_127898/1705061099525.png"
                alt="SV Ried"
                style={clubLogo}
              />
            </span>
            <span className="vv-side-nav-label" style={brandCopy}>
              <strong>VikingVision</strong>
              <small>SV Oberbank Ried</small>
            </span>
          </button>

          <nav className="vv-side-nav-items" style={navItems}>
            <NavItem active={currentPage === 'dashboard'} label="Dashboard" short="D" onClick={onDashboard} />
            <div className="vv-side-nav-section-label" style={sectionLabel}>Profibereich</div>
            <NavItem active={currentPage === 'scoutingReports' || currentPage === 'playerProfile'} label="Scouting" short="S" onClick={onScouting} />
            <NavItem active={currentPage === 'watchlist'} label="Watchlist" short="W" onClick={onWatchlist} />
            <NavItem active={currentPage === 'squad'} label="Unser Kader" short="K" onClick={onSquad} />
            <div className="vv-side-nav-section-label" style={sectionLabel}>Akademie</div>
            <NavItem active={currentPage === 'akavision'} label="AKAVision" short="A" onClick={onAKAVision} />
            <div className="vv-side-nav-section-label" style={sectionLabel}>Verwaltung</div>
            <NavItem active={currentPage === 'playerArchive'} label="Spielerarchiv" short="R" onClick={onArchive} />

            <div className="vv-side-nav-section-label" style={sectionLabel}>Plattformen</div>
            <ExternalNavItem label="StatsLibuda" short="SL" url="https://svried.statslibuda.de/" />
            <ExternalNavItem label="Transfermarkt" short="TM" url="https://www.transfermarkt.at/" />
            <ExternalNavItem label="Wyscout" short="WY" url="https://platform.wyscout.com/" />
            <ExternalNavItem label="Hudl" short="HU" url="https://www.hudl.com/" />
            <ExternalNavItem label="Impect" short="IM" url="https://www.impect.com/" />
            <ExternalNavItem label="Bundesliga" short="BL" url="https://www.bundesliga.at/" />
            <ExternalNavItem label="SAP SportsOne" short="SO" url="https://oefb1904.eu11.sportsone.cloud.sap/home" />
            <ExternalNavItem label="DieLigen" short="DL" url="https://coaches.ligen.football/contest-overview" />
            <ExternalNavItem label="SkillCorner" short="SC" url="https://skillcorner.com/app/login?hsLang=en" />
          </nav>
        </div>

        <div className="vv-side-nav-user" style={userBlock}>
          <span style={userInitial}>{displayName.trim().charAt(0).toUpperCase() || 'V'}</span>
          <span className="vv-side-nav-label" style={userText}>
            <strong>{displayName}</strong>
            <small>{inTeams ? 'Microsoft Teams' : 'Browser'}</small>
          </span>
        </div>
      </aside>

      <div className="vv-app-content" style={content}>{children}</div>
    </div>
  );
}


function ExternalNavItem({
  label,
  short,
  url
}: {
  label: string;
  short: string;
  url: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        window.open(
          url,
          '_blank',
          'noopener,noreferrer'
        )
      }
      title={`${label} öffnen`}
      style={externalNavButton}
    >
      <span style={externalNavIcon}>
        {short}
      </span>

      <span className="vv-side-nav-label">
        {label}
      </span>

      <span
        className="vv-side-nav-label"
        style={externalArrow}
      >
        ↗
      </span>
    </button>
  );
}


function NavItem({ active, label, short, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-current={active ? 'page' : undefined}
      style={{ ...navButton, ...(active ? navButtonActive : {}) }}
    >
      <span style={{ ...navIcon, ...(active ? navIconActive : {}) }}>{short}</span>
      <span className="vv-side-nav-label">{label}</span>
    </button>
  );
}

const shell: CSSProperties = { minHeight:'100vh', display:'grid', gridTemplateColumns:'230px minmax(0, 1fr)', background:'#f5f6f5' };
const sideNav: CSSProperties = { position:'sticky', top:0, height:'100vh', boxSizing:'border-box', padding:'18px 14px', background:'#101512', color:'#fff', display:'flex', flexDirection:'column', justifyContent:'space-between', borderRight:'1px solid rgba(255,255,255,.06)', overflowY:'auto', overflowX:'hidden' };
const brandButton: CSSProperties = { width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'7px', border:'none', background:'transparent', color:'#fff', textAlign:'left', cursor:'pointer', font:'inherit' };
const brandMark: CSSProperties = { flex:'0 0 auto', width:'34px', height:'34px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', color:'#fff', fontWeight:900, fontSize:'11px', letterSpacing:'.04em', padding:'1px' };
const clubLogo: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block'
};

const brandCopy: CSSProperties = { display:'grid', gap:'1px' };
const navItems: CSSProperties = { display:'grid', gap:'4px', marginTop:'24px' };
const sectionLabel: CSSProperties = { padding:'14px 10px 5px', color:'rgba(255,255,255,.42)', fontSize:'9px', fontWeight:900, textTransform:'uppercase', letterSpacing:'.1em' };
const externalNavButton: CSSProperties = {
  width: '100%',
  minHeight: '36px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '5px 9px',
  border: '1px solid transparent',
  borderRadius: '9px',
  background: 'transparent',
  color: 'rgba(255,255,255,.69)',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: '11px',
  fontWeight: 700,
  textAlign: 'left'
};

const externalNavIcon: CSSProperties = {
  flex: '0 0 auto',
  display: 'flex',
  width: '27px',
  height: '27px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  background: 'rgba(255,255,255,.06)',
  color: 'rgba(255,255,255,.68)',
  fontSize: '8px',
  fontWeight: 900
};

const externalArrow: CSSProperties = {
  marginLeft: 'auto',
  color: 'rgba(255,255,255,.34)',
  fontSize: '10px'
};

const navButton: CSSProperties = { width:'100%', minHeight:'42px', display:'flex', alignItems:'center', gap:'9px', padding:'7px 9px', border:'1px solid transparent', borderRadius:'10px', background:'transparent', color:'rgba(255,255,255,.76)', cursor:'pointer', font:'inherit', fontSize:'13px', fontWeight:700, textAlign:'left' };
const navButtonActive: CSSProperties = { background:'rgba(11,122,59,.19)', borderColor:'rgba(60,190,112,.18)', color:'#fff' };
const navIcon: CSSProperties = { flex:'0 0 auto', display:'flex', width:'27px', height:'27px', alignItems:'center', justifyContent:'center', borderRadius:'8px', background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.72)', fontSize:'10px', fontWeight:900 };
const navIconActive: CSSProperties = { background:'#0b7a3b', color:'#fff' };
const userBlock: CSSProperties = { display:'flex', alignItems:'center', gap:'9px', padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,.08)' };
const userInitial: CSSProperties = { flex:'0 0 auto', width:'30px', height:'30px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', background:'rgba(255,255,255,.1)', color:'#fff', fontSize:'11px', fontWeight:900 };
const userText: CSSProperties = { minWidth:0, display:'grid', gap:'2px' };
const content: CSSProperties = { minWidth:0, width:'100%' };
