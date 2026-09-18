import PageHeader from '../components/PageHeader';
import { useState } from 'react';
import PlayerImage from '../components/PlayerImage';

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
  is_own_squad?: boolean;
  jersey_number?: string;
  player_role?: string;
  archived_at?: string;
  transfermarkt_updated_at?: string;
  league?: string;
  scouting_role_1?: string;
  scouting_role_2?: string;
  scouting_role_3?: string;
};

type Props = {
  player: Player;
  accessToken?: string;
  apiBase: string;
  onBack: () => void;
  backLabel?: string;
  onPlayerUpdated: (player: Player) => void;
  onPlayerArchived?: () => Promise<void> | void;
  onPlayerDeleted?: (playerId: number | string) => Promise<void> | void;
};

export default function PlayerProfile({
  player,
  accessToken,
  apiBase,
  onBack,
  backLabel = 'Dashboard',
  onPlayerUpdated,
  onPlayerArchived,
  onPlayerDeleted
}: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] =
    useState(false);
  const [confirmDelete, setConfirmDelete] =
    useState(false);
  const [deleting, setDeleting] =
    useState(false);
  const [refreshingTransfermarkt, setRefreshingTransfermarkt] =
    useState(false);
  const [transfermarktLinkDraft, setTransfermarktLinkDraft] =
    useState(player.transfermarkt_url ?? '');
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
    video_url: player.video_url ?? '',
    league: player.league ?? '',
    scouting_role_1: player.scouting_role_1 ?? '',
    scouting_role_2: player.scouting_role_2 ?? '',
    scouting_role_3: player.scouting_role_3 ?? ''
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
      video_url: player.video_url ?? '',
      league: player.league ?? '',
      scouting_role_1: player.scouting_role_1 ?? '',
      scouting_role_2: player.scouting_role_2 ?? '',
      scouting_role_3: player.scouting_role_3 ?? ''
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
          video_url: form.video_url || null,
          league: form.league || null,
          scouting_role_1: form.scouting_role_1 || null,
          scouting_role_2: form.scouting_role_2 || null,
          scouting_role_3: form.scouting_role_3 || null
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

  async function refreshTransfermarkt(
    explicitUrl?: string
  ) {
    if (!accessToken) {
      setError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    const urlToUse =
      explicitUrl?.trim() ||
      transfermarktLinkDraft.trim() ||
      player.transfermarkt_url?.trim() ||
      '';

    setRefreshingTransfermarkt(
      true
    );
    setError(undefined);
    setSuccess(undefined);

    try {
      const response =
        await fetch(
          `${apiBase}/players/${player.id}/refresh-transfermarkt`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body:
              JSON.stringify(
                urlToUse
                  ? {
                      url:
                        urlToUse
                    }
                  : {}
              )
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Transfermarkt-Daten konnten nicht aktualisiert werden.'
        );
      }

      if (!data.player) {
        throw new Error(
          'Keine aktualisierten Spielerdaten erhalten.'
        );
      }

      onPlayerUpdated(
        data.player
      );

      setTransfermarktLinkDraft(
        data.player.transfermarkt_url ??
        ''
      );

      setForm({
        name:
          data.player.name ?? '',
        birth_date:
          data.player.birth_date ?? '',
        primary_position:
          data.player.primary_position ?? '',
        secondary_position:
          data.player.secondary_position ?? '',
        preferred_foot:
          data.player.preferred_foot ?? '',
        nationality:
          data.player.nationality ?? '',
        height_cm:
          data.player.height_cm ??
          data.player.height ??
          '',
        current_club:
          data.player.current_club ?? '',
        contract_until:
          data.player.contract_until ??
          data.player.contract_end ??
          '',
        market_value:
          data.player.market_value ?? '',
        agent_agency:
          data.player.agent_agency ?? '',
        squad_status:
          data.player.squad_status ?? '',
        priority:
          data.player.priority ?? '',
        potential:
          data.player.potential ?? '',
        notes:
          data.player.notes ?? '',
        transfermarkt_url:
          data.player.transfermarkt_url ??
          '',
        video_url:
          data.player.video_url ?? '',
        league:
          data.player.league ?? '',
        scouting_role_1:
          data.player.scouting_role_1 ??
          '',
        scouting_role_2:
          data.player.scouting_role_2 ??
          '',
        scouting_role_3:
          data.player.scouting_role_3 ??
          ''
      });

      const fields =
        Array.isArray(
          data.refreshed_fields
        )
          ? data.refreshed_fields.length
          : 0;

      const sourceText =
        data.match_source ===
          'manual_url'
          ? 'Direkter Transfermarkt-Link bestätigt.'
          : data.match_source ===
              'stored_url'
            ? 'Gespeicherter Transfermarkt-Link bestätigt.'
            : 'Transfermarkt-Profil automatisch gefunden.';

      setSuccess(
        `${sourceText} ${data.match_basis ?? ''} ${fields} Feld(er) aktualisiert.`
          .replace(
            /\s+/g,
            ' '
          )
          .trim()
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Transfermarkt-Aktualisierung fehlgeschlagen.'
      );
    } finally {
      setRefreshingTransfermarkt(
        false
      );
    }
  }

  async function archivePlayer() {
    if (!accessToken) {
      setError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    setArchiving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const response =
        await fetch(
          `${apiBase}/players/${player.id}/archive`,
          {
            method: 'PUT',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body:
              JSON.stringify({})
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Spieler konnte nicht archiviert werden.'
        );
      }

      onPlayerUpdated(
        data.player
      );

      setSuccess(
        'Spieler wurde aus dem Kader entfernt und ins Spielerarchiv verschoben.'
      );

      setConfirmArchive(false);
      await onPlayerArchived?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Archivieren fehlgeschlagen.'
      );
    } finally {
      setArchiving(false);
    }
  }

  async function deletePlayer() {
    if (!accessToken) {
      setError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    setDeleting(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const response =
        await fetch(
          `${apiBase}/players/${player.id}`,
          {
            method: 'DELETE',
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
          'Spieler konnte nicht gelöscht werden.'
        );
      }

      setConfirmDelete(false);
      await onPlayerDeleted?.(
        player.id
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Löschen fehlgeschlagen.'
      );
    } finally {
      setDeleting(false);
    }
  }


  return (
    <main className="page">
      <PageHeader
        title={player.name ?? 'Spielerprofil'}
        description="VikingVision Spielerprofil"
        onBack={onBack}
        backLabel={backLabel}
        meta={
          <>
            <span>
              {player.primary_position ?? 'Position offen'}
            </span>
            {player.current_club && (
              <>
                <span>·</span>
                <span>
                  {player.current_club}
                </span>
              </>
            )}
            <span>·</span>
            <span>
              {player.is_own_squad
                ? 'Unser Kader'
                : 'Scouting'}
            </span>
          </>
        }
        actions={
          <>
            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setError(undefined);
                  setSuccess(undefined);
                }}
                style={primaryButton}
              >
                Bearbeiten
              </button>
            )}

            {editing && (
              <>
                <button
                  type="button"
                  onClick={savePlayer}
                  disabled={saving}
                  style={primaryButton}
                >
                  {saving
                    ? 'Speichert…'
                    : 'Speichern'}
                </button>

                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  style={secondaryButton}
                >
                  Abbrechen
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() =>
                refreshTransfermarkt()
              }
              disabled={
                refreshingTransfermarkt
              }
              style={
                transfermarktButton
              }
            >
              {refreshingTransfermarkt
                ? 'Transfermarkt wird aktualisiert…'
                : player.transfermarkt_url
                  ? 'Transfermarkt-Daten aktualisieren'
                  : 'Transfermarkt-Profil suchen'}
            </button>

            {!player.archived_at && (
              <button
                type="button"
                onClick={() =>
                  setConfirmArchive(true)
                }
                disabled={archiving}
                style={archiveButton}
              >
                {archiving
                  ? 'Archiviert…'
                  : player.is_own_squad
                    ? 'Aus Kader entfernen'
                    : 'Spieler archivieren'}
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setConfirmDelete(true)
              }
              disabled={deleting}
              style={deleteButton}
            >
              {deleting
                ? 'Löscht…'
                : 'Spieler löschen'}
            </button>
          </>
        }
      />

      {error && <section style={errorBox}><strong>Fehler:</strong><div style={{ marginTop: '4px' }}>{error}</div></section>}
      {success && <section style={successBox}>{success}</section>}

      <section
        style={{
          ...transfermarktPanel,
          marginTop: '14px'
        }}
      >
        <div>
          <strong>
            Transfermarkt-Profil
          </strong>
          <div
            style={{
              marginTop: '4px',
              color: '#777',
              fontSize: '12px'
            }}
          >
            Falls die automatische Suche keinen sicheren Treffer findet, direkten Transfermarkt-Link eintragen. Der Link wird erst gespeichert, wenn Name und Geburtsdatum – und sofern vorhanden Nationalität – geprüft wurden.
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(260px, 1fr) auto',
            gap: '10px',
            marginTop: '10px',
            alignItems: 'end'
          }}
        >
          <label>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#666',
                marginBottom: '5px'
              }}
            >
              Transfermarkt-Link
            </div>
            <input
              value={
                transfermarktLinkDraft
              }
              onChange={event =>
                setTransfermarktLinkDraft(
                  event.target.value
                )
              }
              placeholder="https://www.transfermarkt.at/.../profil/spieler/..."
              style={inputStyle}
            />
          </label>

          <button
            type="button"
            onClick={() =>
              refreshTransfermarkt(
                transfermarktLinkDraft
              )
            }
            disabled={
              refreshingTransfermarkt ||
              !transfermarktLinkDraft.trim()
            }
            style={
              transfermarktButton
            }
          >
            {refreshingTransfermarkt
              ? 'Prüft…'
              : 'Link prüfen & aktualisieren'}
          </button>
        </div>
      </section>

      {confirmArchive && (
        <section style={confirmBox}>
          <div>
            <strong>
              {player.is_own_squad
                ? `${player.name ?? 'Spieler'} aus dem Kader entfernen?`
                : `${player.name ?? 'Spieler'} archivieren?`}
            </strong>

            <div
              style={{
                marginTop: '5px',
                color: '#6b5a35',
                fontSize: '13px'
              }}
            >
              Der Spieler bleibt vollständig erhalten und wird ins Spielerarchiv verschoben.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '10px'
            }}
          >
            <button
              type="button"
              onClick={() =>
                setConfirmArchive(false)
              }
              disabled={archiving}
              style={secondaryButton}
            >
              Abbrechen
            </button>

            <button
              type="button"
              onClick={archivePlayer}
              disabled={archiving}
              style={archiveButton}
            >
              {archiving
                ? 'Wird archiviert…'
                : 'Ja, ins Archiv'}
            </button>
          </div>
        </section>
      )}

      {confirmDelete && (
        <section style={deleteConfirmBox}>
          <div>
            <strong>
              {player.name ?? 'Spieler'} endgültig löschen?
            </strong>

            <div
              style={{
                marginTop: '5px',
                color: '#7a2222',
                fontSize: '13px'
              }}
            >
              Diese Aktion kann nicht rückgängig gemacht werden.
              Spielerprofil, Scoutingberichte und Watchlist-Zuordnungen werden dauerhaft gelöscht.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '10px'
            }}
          >
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
              onClick={deletePlayer}
              disabled={deleting}
              style={deleteButton}
            >
              {deleting
                ? 'Wird endgültig gelöscht…'
                : 'Ja, endgültig löschen'}
            </button>
          </div>
        </section>
      )}

      <section style={profileHero}>
        <div style={profileHeroImage}>
          <PlayerImage
            playerId={player.id}
            imagePath={player.image_path}
            accessToken={accessToken}
            apiBase={apiBase}
            alt={player.name ?? 'Spieler'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={profileHeroTop}>
            <div>
              <div style={profileHeroName}>
                {player.name ?? 'Unbekannt'}
              </div>

              <div style={profileHeroMeta}>
                {[
                  player.primary_position,
                  player.secondary_position,
                  player.current_club,
                  player.league
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Stammdaten offen'}
              </div>
            </div>

            <div style={profileBadgeRow}>
              {player.jersey_number && (
                <span style={jerseyBadge}>
                  #{player.jersey_number}
                </span>
              )}

              <span
                style={
                  player.is_own_squad
                    ? squadBadge
                    : scoutingBadge
                }
              >
                {player.is_own_squad
                  ? 'Unser Kader'
                  : 'Scouting'}
              </span>

              {player.squad_status && (
                <span style={statusBadge}>
                  {player.squad_status}
                </span>
              )}
            </div>
          </div>

          {(player.scouting_role_1 ||
            player.scouting_role_2 ||
            player.scouting_role_3) && (
              <div style={profileRoleWrap}>
                {[
                  player.scouting_role_1,
                  player.scouting_role_2,
                  player.scouting_role_3
                ]
                  .filter(Boolean)
                  .map(role => (
                    <span
                      key={String(role)}
                      style={profileRoleChip}
                    >
                      {String(role)}
                    </span>
                  ))}
              </div>
            )}

          <div style={profileQuickGrid}>
            <ProfileQuickInfo
              label="Geburtsdatum"
              value={
                form.birth_date
                  ? new Date(
                      String(form.birth_date)
                    ).toLocaleDateString(
                      'de-DE'
                    )
                  : '–'
              }
            />

            <ProfileQuickInfo
              label="Nationalität"
              value={
                String(form.nationality) ||
                '–'
              }
            />

            <ProfileQuickInfo
              label="Fuß"
              value={
                String(form.preferred_foot) ||
                '–'
              }
            />

            <ProfileQuickInfo
              label="Größe"
              value={
                form.height_cm
                  ? `${form.height_cm} cm`
                  : '–'
              }
            />

            <ProfileQuickInfo
              label="Vertrag bis"
              value={
                String(form.contract_until) ||
                '–'
              }
            />

            <ProfileQuickInfo
              label="Marktwert"
              value={
                String(form.market_value) ||
                '–'
              }
            />
          </div>
        </div>
      </section>

      <ProfileSection
        title="Spielerdaten"
        description="Stammdaten, Positionen und Vereinszuordnung."
      >
        <Field label="Name" value={String(form.name)} editing={editing} onChange={value => updateField('name', value)} />
        <Field label="Geburtsdatum" type="date" value={String(form.birth_date)} editing={editing} onChange={value => updateField('birth_date', value)} />
        <Field label="Position" value={String(form.primary_position)} editing={editing} onChange={value => updateField('primary_position', value)} />
        <Field label="Nebenposition" value={String(form.secondary_position)} editing={editing} onChange={value => updateField('secondary_position', value)} />
        <Field label="Liga" value={String(form.league)} editing={editing} onChange={value => updateField('league', value)} />
        <Field label="Aktueller Verein" value={String(form.current_club)} editing={editing} onChange={value => updateField('current_club', value)} />
        <Field label="Fuß" value={String(form.preferred_foot)} editing={editing} onChange={value => updateField('preferred_foot', value)} />
        <Field label="Nationalität" value={String(form.nationality)} editing={editing} onChange={value => updateField('nationality', value)} />
        <Field label="Größe (cm)" type="number" value={String(form.height_cm)} editing={editing} onChange={value => updateField('height_cm', value)} />
      </ProfileSection>

      <ProfileSection
        title="Scouting-Profil"
        description="Rollen, Priorität und Entwicklungspotenzial."
      >
        <Field label="Scouting-Rolle 1" value={String(form.scouting_role_1)} editing={editing} onChange={value => updateField('scouting_role_1', value)} />
        <Field label="Scouting-Rolle 2" value={String(form.scouting_role_2)} editing={editing} onChange={value => updateField('scouting_role_2', value)} />
        <Field label="Scouting-Rolle 3" value={String(form.scouting_role_3)} editing={editing} onChange={value => updateField('scouting_role_3', value)} />
        <Field label="Priorität" value={String(form.priority)} editing={editing} onChange={value => updateField('priority', value)} />
        <Field label="Potenzial" value={String(form.potential)} editing={editing} onChange={value => updateField('potential', value)} />
      </ProfileSection>

      <ProfileSection
        title="Vertrag & Markt"
        description="Vertragsstatus, Marktwert und Beraterdaten."
      >
        <Field label="Vertrag bis" type="date" value={String(form.contract_until)} editing={editing} onChange={value => updateField('contract_until', value)} />
        <Field label="Marktwert" value={String(form.market_value)} editing={editing} onChange={value => updateField('market_value', value)} />
        <Field label="Berateragentur" value={String(form.agent_agency)} editing={editing} onChange={value => updateField('agent_agency', value)} />
        <SelectField
          label="Kaderstatus"
          value={String(form.squad_status)}
          editing={editing}
          onChange={value =>
            updateField(
              'squad_status',
              value
            )
          }
          options={[
            'Unter Vertrag',
            'Ausgeliehen'
          ]}
        />
      </ProfileSection>

      <ProfileSection
        title="Links & Medien"
        description="Transfermarkt- und Video-Verknüpfungen."
      >
        <Field label="Transfermarkt" value={String(form.transfermarkt_url)} editing={editing} onChange={value => updateField('transfermarkt_url', value)} />
        <Field label="Video" value={String(form.video_url)} editing={editing} onChange={value => updateField('video_url', value)} />

        {!editing &&
          player.transfermarkt_updated_at && (
            <div style={transfermarktUpdatedInfo}>
              Transfermarkt zuletzt aktualisiert:{' '}
              {new Date(
                player.transfermarkt_updated_at
              ).toLocaleString('de-DE')}
            </div>
          )}
      </ProfileSection>

      <section style={notesCard}>
        <div style={sectionEyebrow}>
          Notizen
        </div>

        <h3 style={sectionTitle}>
          Beobachtungen & Hinweise
        </h3>

        {editing ? (
          <textarea
            value={String(form.notes)}
            onChange={event =>
              updateField(
                'notes',
                event.target.value
              )
            }
            rows={7}
            style={notesInput}
          />
        ) : (
          <div style={notesContent}>
            {form.notes || '–'}
          </div>
        )}
      </section>
    </main>
  );
}


function ProfileSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={profileSection}>
      <div style={profileSectionHeader}>
        <div>
          <div style={sectionEyebrow}>
            Spielerprofil
          </div>

          <h3 style={sectionTitle}>
            {title}
          </h3>

          <div style={sectionDescription}>
            {description}
          </div>
        </div>
      </div>

      <div style={profileFieldGrid}>
        {children}
      </div>
    </section>
  );
}

function ProfileQuickInfo({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={profileQuickItem}>
      <span style={profileQuickLabel}>
        {label}
      </span>

      <strong style={profileQuickValue}>
        {value}
      </strong>
    </div>
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


function SelectField({
  label,
  value,
  editing,
  onChange,
  options
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div style={profileCard}>
      <div
        style={{
          fontSize: '12px',
          textTransform: 'uppercase',
          color: '#777',
          marginBottom: '6px'
        }}
      >
        {label}
      </div>

      {editing ? (
        <select
          value={value}
          onChange={event =>
            onChange(
              event.target.value
            )
          }
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            font: 'inherit',
            background: '#fff'
          }}
        >
          <option value="">
            –
          </option>

          {options.map(option => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>
      ) : (
        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            wordBreak: 'break-word'
          }}
        >
          {value || '–'}
        </div>
      )}
    </div>
  );
}

const profileHero: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  alignItems: 'stretch',
  marginTop: '20px',
  padding: '18px',
  border: '1px solid #e7e9e7',
  borderRadius: '16px',
  background: '#fff',
  boxShadow: '0 3px 14px rgba(0,0,0,.035)'
};

const profileHeroImage: React.CSSProperties = {
  width: '150px',
  minWidth: '150px',
  height: '188px',
  overflow: 'hidden',
  borderRadius: '12px',
  background: '#f1f1f1'
};

const profileHeroTop: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px'
};

const profileHeroName: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 900,
  lineHeight: 1.05,
  letterSpacing: '-.025em'
};

const profileHeroMeta: React.CSSProperties = {
  marginTop: '7px',
  color: '#666',
  fontSize: '13px',
  lineHeight: 1.4
};

const profileBadgeRow: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end'
};

const jerseyBadge: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#0b7a3b',
  color: '#fff',
  fontSize: '11px',
  fontWeight: 900
};

const squadBadge: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#111',
  color: '#fff',
  fontSize: '11px',
  fontWeight: 800
};

const scoutingBadge: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#edf7f1',
  color: '#0b6b35',
  fontSize: '11px',
  fontWeight: 800
};

const statusBadge: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#f4f4f4',
  color: '#444',
  fontSize: '11px',
  fontWeight: 800
};

const profileRoleWrap: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  marginTop: '13px'
};

const profileRoleChip: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#edf7f1',
  color: '#0b6b35',
  fontSize: '11px',
  fontWeight: 800
};

const profileQuickGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '8px',
  marginTop: '16px'
};

const profileQuickItem: React.CSSProperties = {
  padding: '9px 10px',
  borderRadius: '10px',
  background: '#f7f8f7',
  minWidth: 0
};

const profileQuickLabel: React.CSSProperties = {
  display: 'block',
  color: '#888',
  fontSize: '9px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '.04em'
};

const profileQuickValue: React.CSSProperties = {
  display: 'block',
  marginTop: '3px',
  fontSize: '12px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const profileSection: React.CSSProperties = {
  marginTop: '18px',
  padding: '18px',
  border: '1px solid #e7e9e7',
  borderRadius: '16px',
  background: '#fff',
  boxShadow: '0 3px 12px rgba(0,0,0,.025)'
};

const profileSectionHeader: React.CSSProperties = {
  marginBottom: '14px'
};

const sectionEyebrow: React.CSSProperties = {
  color: '#0b7a3b',
  fontSize: '9px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.08em'
};

const sectionTitle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '18px',
  letterSpacing: '-.015em'
};

const sectionDescription: React.CSSProperties = {
  marginTop: '4px',
  color: '#777',
  fontSize: '11px'
};

const profileFieldGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '10px'
};

const transfermarktUpdatedInfo: React.CSSProperties = {
  gridColumn: '1 / -1',
  color: '#777',
  fontSize: '11px',
  paddingTop: '3px'
};

const notesCard: React.CSSProperties = {
  marginTop: '18px',
  padding: '18px',
  border: '1px solid #e7e9e7',
  borderRadius: '16px',
  background: '#fff',
  boxShadow: '0 3px 12px rgba(0,0,0,.025)'
};

const notesInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  marginTop: '12px',
  padding: '12px',
  borderRadius: '9px',
  border: '1px solid #ccc',
  font: 'inherit',
  resize: 'vertical'
};

const notesContent: React.CSSProperties = {
  marginTop: '12px',
  whiteSpace: 'pre-wrap',
  lineHeight: 1.55,
  color: '#333'
};

const profileCard: React.CSSProperties = {
  background: '#f8f9f8',
  borderRadius: '11px',
  padding: '12px',
  border: '1px solid #eef0ee'
};
const primaryButton: React.CSSProperties = { border: 'none', background: '#0b7a3b', color: '#ffffff', padding: '12px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 };
const secondaryButton: React.CSSProperties = { border: '1px solid #d0d0d0', background: '#ffffff', color: '#222222', padding: '12px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 };
const archiveButton: React.CSSProperties = { ...secondaryButton, color: '#8a5500', borderColor: '#e2c98d', background: '#fffaf0' };
const transfermarktButton: React.CSSProperties = {
  ...secondaryButton,
  color: '#0b6b35',
  borderColor: '#9cc8ad',
  background: '#f4faf6'
};
const deleteButton: React.CSSProperties = { ...secondaryButton, color: '#a00000', borderColor: '#e5b8b8', background: '#fff4f4' };
const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '42px',
  boxSizing: 'border-box',
  border: '1px solid #d5d5d5',
  borderRadius: '8px',
  padding: '10px',
  background: '#fff',
  font: 'inherit'
};

const transfermarktPanel: React.CSSProperties = {
  background: '#f4faf6',
  border: '1px solid #b9d9c7',
  borderRadius: '12px',
  padding: '14px'
};

const errorBox: React.CSSProperties = { marginTop: '14px', padding: '12px 16px', background: '#fff3f3', color: '#a00000', borderRadius: '10px' };
const successBox: React.CSSProperties = { marginTop: '14px', padding: '12px 16px', background: '#eef9f2', color: '#0b6b35', borderRadius: '10px' };

const confirmBox: React.CSSProperties = {
  marginTop: '14px',
  background: '#fffaf0',
  border: '1px solid #e2c98d',
  borderRadius: '12px',
  padding: '14px'
};


const deleteConfirmBox: React.CSSProperties = {
  marginTop: '14px',
  background: '#fff4f4',
  border: '1px solid #e5b8b8',
  borderRadius: '12px',
  padding: '14px'
};
