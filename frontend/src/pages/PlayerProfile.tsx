import { useState } from 'react';

export type Player = {
  id: number | string;
  name?: string;
  birth_date?: string;
  birth_year?: number;
  primary_position?: string;
  secondary_position?: string;
  preferred_foot?: string;
  nationality?: string;
  height_cm?: number;
  height?: number;
  current_club?: string;
  market_value?: string | number;
  image_path?: string;
  contract_until?: string;
  contract_end?: string;
  agent_agency?: string;
  squad_status?: string;
  priority?: string | number;
  potential?: string | number;
  notes?: string;
  transfermarkt_url?: string;
  video_url?: string;
};

type Props = {
  player: Player;
  accessToken?: string;
  apiBase: string;
  onBack: () => void;
  onPlayerUpdated: (player: Player) => void;
};

export default function PlayerProfile({ player, accessToken, apiBase, onBack, onPlayerUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [form, setForm] = useState({
    name: player.name ?? '',
    birth_date: player.birth_date ?? '',
    primary_position: player.primary_position ?? '',
    secondary_position: player.secondary_position ?? '',
    preferred_foot: player.preferred_foot ?? '',
    nationality: player.nationality ?? '',
    height_cm: player.height_cm ?? player.height ?? '',
    current_club: player.current_club ?? '',
    contract_until: player.contract_until ?? player.contract_end ?? '',
    market_value: player.market_value ?? '',
    agent_agency: player.agent_agency ?? '',
    squad_status: player.squad_status ?? '',
    priority: player.priority ?? '',
    potential: player.potential ?? '',
    notes: player.notes ?? '',
    transfermarkt_url: player.transfermarkt_url ?? '',
    video_url: player.video_url ?? ''
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm({
      name: player.name ?? '',
      birth_date: player.birth_date ?? '',
      primary_position: player.primary_position ?? '',
      secondary_position: player.secondary_position ?? '',
      preferred_foot: player.preferred_foot ?? '',
      nationality: player.nationality ?? '',
      height_cm: player.height_cm ?? player.height ?? '',
      current_club: player.current_club ?? '',
      contract_until: player.contract_until ?? player.contract_end ?? '',
      market_value: player.market_value ?? '',
      agent_agency: player.agent_agency ?? '',
      squad_status: player.squad_status ?? '',
      priority: player.priority ?? '',
      potential: player.potential ?? '',
      notes: player.notes ?? '',
      transfermarkt_url: player.transfermarkt_url ?? '',
      video_url: player.video_url ?? ''
    });
  }

  function cancelEdit() {
    resetForm();
    setEditing(false);
    setError(undefined);
    setSuccess(undefined);
  }

  async function savePlayer() {
    if (!accessToken) {
      setError('Kein Teams-SSO-Token vorhanden.');
      return;
    }

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const response = await fetch(`${apiBase}/players/${player.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name || null,
          birth_date: form.birth_date || null,
          primary_position: form.primary_position || null,
          secondary_position: form.secondary_position || null,
          preferred_foot: form.preferred_foot || null,
          nationality: form.nationality || null,
          height_cm: form.height_cm === '' ? null : Number(form.height_cm),
          current_club: form.current_club || null,
          contract_until: form.contract_until || null,
          market_value: form.market_value === '' ? null : form.market_value,
          agent_agency: form.agent_agency || null,
          squad_status: form.squad_status || null,
          priority: form.priority === '' ? null : form.priority,
          potential: form.potential === '' ? null : form.potential,
          notes: form.notes || null,
          transfermarkt_url: form.transfermarkt_url || null,
          video_url: form.video_url || null
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? 'Spieler konnte nicht gespeichert werden.');
      if (!data.player) throw new Error('Keine aktualisierten Spielerdaten erhalten.');

      onPlayerUpdated(data.player);
      setEditing(false);
      setSuccess('Spieler wurde gespeichert.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">SV Oberbank Ried</div>
          <h1>{player.name ?? 'Spielerprofil'}</h1>
          <p>VikingVision Spielerprofil</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!editing && <button type="button" onClick={() => { setEditing(true); setError(undefined); setSuccess(undefined); }} style={primaryButton}>Bearbeiten</button>}
          {editing && <>
            <button type="button" onClick={savePlayer} disabled={saving} style={primaryButton}>{saving ? 'Speichert…' : 'Speichern'}</button>
            <button type="button" onClick={cancelEdit} disabled={saving} style={secondaryButton}>Abbrechen</button>
          </>}
          <button type="button" onClick={onBack} style={secondaryButton}>← Spieler</button>
        </div>
      </section>

      {error && <section style={errorBox}><strong>Fehler:</strong><div style={{ marginTop: '4px' }}>{error}</div></section>}
      {success && <section style={successBox}>{success}</section>}

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 320px) 1fr', gap: '20px', marginTop: '20px' }}>
        <div style={profileCard}>
          {player.image_path ? <img src={player.image_path} alt={player.name ?? 'Spieler'} style={{ width: '100%', aspectRatio: '4 / 5', objectFit: 'cover', borderRadius: '10px' }} /> : <div style={{ width: '100%', aspectRatio: '4 / 5', borderRadius: '10px', background: '#f1f1f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777', fontSize: '16px' }}>Kein Bild</div>}
          <div style={{ marginTop: '16px', fontSize: '22px', fontWeight: 700 }}>{player.name ?? 'Unbekannt'}</div>
          <div style={{ marginTop: '5px', color: '#666' }}>{player.primary_position ?? '–'}</div>
          {player.current_club && <div style={{ marginTop: '4px', fontSize: '14px', color: '#777' }}>{player.current_club}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <Field label="Name" value={String(form.name)} editing={editing} onChange={value => updateField('name', value)} />
          <Field label="Geburtsdatum" type="date" value={String(form.birth_date)} editing={editing} onChange={value => updateField('birth_date', value)} />
          <Field label="Position" value={String(form.primary_position)} editing={editing} onChange={value => updateField('primary_position', value)} />
          <Field label="Nebenposition" value={String(form.secondary_position)} editing={editing} onChange={value => updateField('secondary_position', value)} />
          <Field label="Fuß" value={String(form.preferred_foot)} editing={editing} onChange={value => updateField('preferred_foot', value)} />
          <Field label="Nationalität" value={String(form.nationality)} editing={editing} onChange={value => updateField('nationality', value)} />
          <Field label="Größe (cm)" type="number" value={String(form.height_cm)} editing={editing} onChange={value => updateField('height_cm', value)} />
          <Field label="Aktueller Verein" value={String(form.current_club)} editing={editing} onChange={value => updateField('current_club', value)} />
          <Field label="Vertrag bis" type="date" value={String(form.contract_until)} editing={editing} onChange={value => updateField('contract_until', value)} />
          <Field label="Marktwert" value={String(form.market_value)} editing={editing} onChange={value => updateField('market_value', value)} />
          <Field label="Berateragentur" value={String(form.agent_agency)} editing={editing} onChange={value => updateField('agent_agency', value)} />
          <Field label="Kaderstatus" value={String(form.squad_status)} editing={editing} onChange={value => updateField('squad_status', value)} />
          <Field label="Priorität" value={String(form.priority)} editing={editing} onChange={value => updateField('priority', value)} />
          <Field label="Potenzial" value={String(form.potential)} editing={editing} onChange={value => updateField('potential', value)} />
          <Field label="Transfermarkt" value={String(form.transfermarkt_url)} editing={editing} onChange={value => updateField('transfermarkt_url', value)} />
          <Field label="Video" value={String(form.video_url)} editing={editing} onChange={value => updateField('video_url', value)} />
        </div>
      </section>

      <section style={{ ...profileCard, marginTop: '20px' }}>
        <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#777', marginBottom: '8px' }}>Notizen</div>
        {editing ? <textarea value={String(form.notes)} onChange={event => updateField('notes', event.target.value)} rows={7} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', font: 'inherit', resize: 'vertical' }} /> : <div style={{ whiteSpace: 'pre-wrap' }}>{form.notes || '–'}</div>}
      </section>
    </main>
  );
}

function Field({ label, value, editing, onChange, type = 'text' }: { label: string; value: string; editing: boolean; onChange: (value: string) => void; type?: string; }) {
  return (
    <div style={profileCard}>
      <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#777', marginBottom: '6px' }}>{label}</div>
      {editing ? <input type={type} value={value} onChange={event => onChange(event.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', font: 'inherit' }} /> : <div style={{ fontSize: '16px', fontWeight: 700, wordBreak: 'break-word' }}>{value || '–'}</div>}
    </div>
  );
}

const profileCard: React.CSSProperties = { background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #ececec', boxShadow: '0 3px 14px rgba(0,0,0,0.04)' };
const primaryButton: React.CSSProperties = { border: 'none', background: '#0b7a3b', color: '#ffffff', padding: '12px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 };
const secondaryButton: React.CSSProperties = { border: '1px solid #d0d0d0', background: '#ffffff', color: '#222222', padding: '12px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 };
const errorBox: React.CSSProperties = { marginTop: '14px', padding: '12px 16px', background: '#fff3f3', color: '#a00000', borderRadius: '10px' };
const successBox: React.CSSProperties = { marginTop: '14px', padding: '12px 16px', background: '#eef9f2', color: '#0b6b35', borderRadius: '10px' };
