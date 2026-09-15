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

  onOpenPlayers: () => void;
  onOpenScoutingReports: () => void;
  onOpenWatchlist: () => void;
  onOpenSquad: () => void;
  onOpenAKAVision: () => void;
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
  onOpenPlayers,
  onOpenScoutingReports,
  onOpenWatchlist,
  onOpenSquad,
  onOpenAKAVision
}: Props) {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">
            SV Oberbank Ried
          </div>

          <h1>VikingVision</h1>

          <p>Teams Proof of Concept</p>
        </div>

        <div className="userbox">
          <strong>{displayName}</strong>

          {userPrincipalName && (
            <span>{userPrincipalName}</span>
          )}

          <span>
            {inTeams
              ? 'Microsoft Teams'
              : 'Browser-Vorschau'}
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
          Supabase:{' '}
          {supabaseOk === null
            ? 'prüfe…'
            : supabaseOk
              ? `✓ verbunden${
                  playerCount !== null
                    ? ` · ${playerCount} Spieler`
                    : ''
                }`
              : '✕ nicht verbunden'}
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

      {supabaseOk === false &&
        supabaseError && (
          <section
            style={{
              marginTop: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#fff8e6',
              color: '#8a5500',
              fontSize: '13px',
              wordBreak: 'break-word'
            }}
          >
            <strong>Supabase-Fehler:</strong>

            <div style={{ marginTop: '4px' }}>
              {supabaseError}
            </div>
          </section>
        )}

      <section className="grid">
        <button
          className="card"
          type="button"
          onClick={onOpenPlayers}
        >
          Spieler
        </button>

        <button
          className="card"
          type="button"
          onClick={onOpenScoutingReports}
        >
          Scoutingberichte
        </button>

        <button
          className="card"
          type="button"
          onClick={onOpenWatchlist}
        >
          Watchlist
        </button>

        <button
          className="card"
          type="button"
          onClick={onOpenSquad}
        >
          Unser Kader
        </button>

        <button
          className="card"
          type="button"
          onClick={onOpenAKAVision}
        >
          AKAVision
        </button>
      </section>
    </main>
  );
}
