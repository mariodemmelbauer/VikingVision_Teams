type Props = {
  displayName: string;
  userPrincipalName?: string;
  inTeams: boolean;
  ssoOk: boolean;
  ssoError?: string;
  apiOk: boolean | null;
};

export default function Dashboard({
  displayName,
  userPrincipalName,
  inTeams,
  ssoOk,
  ssoError,
  apiOk
}: Props) {
  const cards = [
    'Spieler',
    'Scoutingberichte',
    'Watchlist',
    'Unser Kader',
    'AKAVision'
  ];

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">SV Oberbank Ried</div>

          <h1>VikingVision</h1>

          <p>Teams Proof of Concept</p>
        </div>

        <div className="userbox">
          <strong>{displayName}</strong>

          {userPrincipalName && (
            <span>{userPrincipalName}</span>
          )}

          <span>
            {inTeams ? 'Microsoft Teams' : 'Browser-Vorschau'}
          </span>
        </div>
      </section>

      <section className="status">
        <span>
          TeamsJS:{' '}
          {inTeams
            ? '✓ initialisiert'
            : '– Browsermodus'}
        </span>

        <span>
          API:{' '}
          {apiOk === null
            ? 'prüfe…'
            : apiOk
              ? '✓ erreichbar'
              : '✕ nicht erreichbar'}
        </span>

        <span>
          Entra SSO:{' '}
          {ssoOk
            ? '✓ Token erhalten'
            : '✕ kein Token'}
        </span>

        <span>
          Supabase: nächster Schritt
        </span>
      </section>

      {!ssoOk && ssoError && (
        <section
          style={{
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#fff3f3',
            color: '#a00000',
            fontSize: '13px',
            wordBreak: 'break-word'
          }}
        >
          <strong>SSO-Fehler:</strong>
          <div style={{ marginTop: '4px' }}>
            {ssoError}
          </div>
        </section>
      )}

      <section className="grid">
        {cards.map(c => (
          <button
            key={c}
            className="card"
          >
            {c}
          </button>
        ))}
      </section>
    </main>
  );
}
