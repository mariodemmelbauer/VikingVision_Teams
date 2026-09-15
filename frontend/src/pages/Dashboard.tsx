type Props = { displayName: string; inTeams: boolean; apiOk: boolean | null };

export default function Dashboard({ displayName, inTeams, apiOk }: Props) {
  const cards = ['Spieler','Scoutingberichte','Watchlist','Unser Kader','AKAVision'];
  return <main className="page">
    <section className="hero">
      <div>
        <div className="eyebrow">SV Oberbank Ried</div>
        <h1>VikingVision</h1>
        <p>Teams Proof of Concept</p>
      </div>
      <div className="userbox"><strong>{displayName}</strong><span>{inTeams ? 'Microsoft Teams' : 'Browser-Vorschau'}</span></div>
    </section>
    <section className="status">
      <span>TeamsJS: {inTeams ? '✓ initialisiert' : '– Browsermodus'}</span>
      <span>API: {apiOk === null ? 'prüfe…' : apiOk ? '✓ erreichbar' : '✕ nicht erreichbar'}</span>
      <span>Entra SSO: vorbereitet</span>
      <span>Supabase: nächster Schritt</span>
    </section>
    <section className="grid">{cards.map(c => <button key={c} className="card">{c}</button>)}</section>
  </main>
}
