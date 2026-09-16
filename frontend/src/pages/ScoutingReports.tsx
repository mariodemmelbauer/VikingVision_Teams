import { useEffect, useMemo, useState } from 'react';
import type { Player } from './PlayerProfile';

export type ScoutingReport = {
  id: number | string;
  player_id: number | string;
  player_name?: string;
  scout_name?: string;
  observation_date?: string;
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

type Props = {
  accessToken?: string;
  apiBase: string;
  players: Player[];
  currentScoutName?: string;
  onBack: () => void;
  onPlayersChanged?: () => Promise<Player[] | void>;
};

type FormState = {
  player_id: string;
  scout_name: string;
  observation_date: string;
  competition: string;
  match_name: string;
  opponent: string;
  observed_position: string;
  minutes_played: string;
  technical_rating: string;
  tactical_rating: string;
  athletic_rating: string;
  mentality_rating: string;
  potential_rating: string;
  strengths: string;
  development_areas: string;
  overall_impression: string;
  recommendation: string;
  next_action: string;
};

type PlayerForm = {
  name: string;
  birth_date: string;
  current_club: string;
  primary_position: string;
  secondary_position: string;
  preferred_foot: string;
  nationality: string;
  height_cm: string;
  transfermarkt_url: string;
  notes: string;
};

const emptyReportForm: FormState = {
  player_id: '',
  scout_name: '',
  observation_date: '',
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
};

const emptyPlayerForm: PlayerForm = {
  name: '',
  birth_date: '',
  current_club: '',
  primary_position: '',
  secondary_position: '',
  preferred_foot: '',
  nationality: '',
  height_cm: '',
  transfermarkt_url: '',
  notes: ''
};

export default function ScoutingReports({
  accessToken,
  apiBase,
  players,
  currentScoutName,
  onBack,
  onPlayersChanged
}: Props) {
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPlayer, setSavingPlayer] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showTransfermarktForm, setShowTransfermarktForm] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);

  const [search, setSearch] = useState('');
  const [playerFilter, setPlayerFilter] = useState('Alle');
  const [positionFilter, setPositionFilter] = useState('Alle');

  const [transfermarktUrl, setTransfermarktUrl] = useState('');
  const [playerForm, setPlayerForm] = useState<PlayerForm>(emptyPlayerForm);

  const [form, setForm] = useState<FormState>({
    ...emptyReportForm,
    scout_name: currentScoutName ?? ''
  });

  useEffect(() => {
    loadReports();
  }, []);

  const sortedPlayers = useMemo(
    () =>
      [...players].sort((a, b) =>
        String(a.name ?? '').localeCompare(
          String(b.name ?? ''),
          'de'
        )
      ),
    [players]
  );

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

  const playerReportInfo = useMemo(
    () =>
      sortedPlayers.map(player => {
        const playerReports = reports
          .filter(report => String(report.player_id) === String(player.id))
          .sort((a, b) =>
            String(b.observation_date ?? '').localeCompare(
              String(a.observation_date ?? '')
            )
          );

        return {
          player,
          count: playerReports.length,
          latest: playerReports[0]
        };
      }),
    [sortedPlayers, reports]
  );

  const filteredReports = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('de');

    return [...reports]
      .filter(report => {
        const matchesSearch =
          !query ||
          [
            report.player_name,
            report.scout_name,
            report.competition,
            report.match_name,
            report.opponent,
            report.observed_position,
            report.strengths,
            report.development_areas,
            report.recommendation,
            report.next_action
          ]
            .filter(Boolean)
            .some(value =>
              String(value)
                .toLocaleLowerCase('de')
                .includes(query)
            );

        const matchesPlayer =
          playerFilter === 'Alle' ||
          String(report.player_id) === playerFilter;

        const reportPlayer = players.find(
          player => String(player.id) === String(report.player_id)
        );

        const matchesPosition =
          positionFilter === 'Alle' ||
          report.observed_position === positionFilter ||
          reportPlayer?.primary_position === positionFilter;

        return matchesSearch && matchesPlayer && matchesPosition;
      })
      .sort((a, b) =>
        String(b.observation_date ?? '').localeCompare(
          String(a.observation_date ?? '')
        )
      );
  }, [reports, search, playerFilter, positionFilter, players]);

  async function authFetch(path: string, init?: RequestInit) {
    if (!accessToken) {
      throw new Error('Kein Teams-SSO-Token vorhanden.');
    }

    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {})
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error ?? 'Anfrage fehlgeschlagen.');
    }

    return data;
  }

  async function reloadPlayers() {
    if (onPlayersChanged) {
      await onPlayersChanged();
    }
  }

  async function loadReports() {
    setLoading(true);
    setError(undefined);

    try {
      const data = await authFetch('/scouting-reports');
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Scoutingberichte konnten nicht geladen werden.'
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function updatePlayerField(field: keyof PlayerForm, value: string) {
    setPlayerForm(current => ({ ...current, [field]: value }));
  }

  function startNewReport(playerId?: string) {
    setEditingId(null);
    setForm({
      ...emptyReportForm,
      player_id: playerId ?? '',
      scout_name: currentScoutName ?? ''
    });
    setError(undefined);
    setSuccess(undefined);
    setShowReportForm(true);
  }

  function startEdit(report: ScoutingReport) {
    setEditingId(report.id);
    setForm({
      player_id: String(report.player_id ?? ''),
      scout_name: report.scout_name ?? '',
      observation_date: report.observation_date ?? '',
      competition: report.competition ?? '',
      match_name: report.match_name ?? '',
      opponent: report.opponent ?? '',
      observed_position: report.observed_position ?? '',
      minutes_played:
        report.minutes_played == null ? '' : String(report.minutes_played),
      technical_rating:
        report.technical_rating == null ? '' : String(report.technical_rating),
      tactical_rating:
        report.tactical_rating == null ? '' : String(report.tactical_rating),
      athletic_rating:
        report.athletic_rating == null ? '' : String(report.athletic_rating),
      mentality_rating:
        report.mentality_rating == null ? '' : String(report.mentality_rating),
      potential_rating:
        report.potential_rating == null ? '' : String(report.potential_rating),
      strengths: report.strengths ?? '',
      development_areas: report.development_areas ?? '',
      overall_impression: report.overall_impression ?? '',
      recommendation: report.recommendation ?? '',
      next_action: report.next_action ?? ''
    });
    setShowReportForm(true);
    setError(undefined);
    setSuccess(undefined);
  }

  function nullableInt(value: string) {
    if (value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async function saveReport() {
    if (!form.player_id) {
      setError('Bitte einen Spieler auswählen.');
      return;
    }

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    const body = {
      player_id: Number(form.player_id),
      scout_name: form.scout_name || null,
      observation_date: form.observation_date || null,
      competition: form.competition || null,
      match_name: form.match_name || null,
      opponent: form.opponent || null,
      observed_position: form.observed_position || null,
      minutes_played: nullableInt(form.minutes_played),
      technical_rating: nullableInt(form.technical_rating),
      tactical_rating: nullableInt(form.tactical_rating),
      athletic_rating: nullableInt(form.athletic_rating),
      mentality_rating: nullableInt(form.mentality_rating),
      potential_rating: nullableInt(form.potential_rating),
      strengths: form.strengths || null,
      development_areas: form.development_areas || null,
      overall_impression: form.overall_impression || null,
      recommendation: form.recommendation || null,
      next_action: form.next_action || null
    };

    try {
      const isEdit = editingId !== null;
      await authFetch(
        isEdit ? `/scouting-reports/${editingId}` : '/scouting-reports',
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(body)
        }
      );

      setSuccess(
        isEdit
          ? 'Scoutingbericht wurde aktualisiert.'
          : 'Scoutingbericht wurde angelegt.'
      );

      setShowReportForm(false);
      setEditingId(null);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  }

  async function savePlayer() {
    if (!playerForm.name.trim()) {
      setError('Name ist ein Pflichtfeld.');
      return;
    }

    setSavingPlayer(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const data = await authFetch('/players', {
        method: 'POST',
        body: JSON.stringify({
          name: playerForm.name.trim(),
          birth_date: playerForm.birth_date || null,
          current_club: playerForm.current_club || null,
          primary_position: playerForm.primary_position || null,
          secondary_position: playerForm.secondary_position || null,
          preferred_foot: playerForm.preferred_foot || null,
          nationality: playerForm.nationality || null,
          height_cm:
            playerForm.height_cm === ''
              ? null
              : Number(playerForm.height_cm),
          transfermarkt_url: playerForm.transfermarkt_url || null,
          notes: playerForm.notes || null,
          is_own_squad: false
        })
      });

      setSuccess('Spieler wurde angelegt.');
      setPlayerForm(emptyPlayerForm);
      setShowPlayerForm(false);
      await reloadPlayers();

      if (data?.player?.id != null) {
        setPlayerFilter(String(data.player.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Spieler konnte nicht angelegt werden.');
    } finally {
      setSavingPlayer(false);
    }
  }

  async function importTransfermarkt() {
    if (!transfermarktUrl.trim()) {
      setError('Bitte einen Transfermarkt-Link eingeben.');
      return;
    }

    setImporting(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const data = await authFetch('/players/import-transfermarkt', {
        method: 'POST',
        body: JSON.stringify({
          url: transfermarktUrl.trim(),
          is_own_squad: false
        })
      });

      setSuccess(
        data?.scraped
          ? 'Spieler wurde über Transfermarkt angelegt.'
          : 'Spieler wurde aus dem Transfermarkt-Link angelegt. Nicht alle Profildaten konnten automatisch gelesen werden.'
      );
      setTransfermarktUrl('');
      setShowTransfermarktForm(false);
      await reloadPlayers();

      if (data?.player?.id != null) {
        setPlayerFilter(String(data.player.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfermarkt-Import fehlgeschlagen.');
    } finally {
      setImporting(false);
    }
  }

  async function importExcel(file: File) {
    setImporting(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const rows = await readSpreadsheet(file);

      if (rows.length === 0) {
        throw new Error('Die Datei enthält keine importierbaren Spieler.');
      }

      const playersToImport = rows
        .map(row => normalizePlayerRow(row))
        .filter(row => Boolean(row.name));

      if (playersToImport.length === 0) {
        throw new Error('Keine Zeile mit dem Pflichtfeld "Name" gefunden.');
      }

      const data = await authFetch('/players/import-bulk', {
        method: 'POST',
        body: JSON.stringify({
          players: playersToImport
        })
      });

      setSuccess(
        `${data?.count ?? playersToImport.length} Spieler wurden importiert.`
      );
      setShowExcelImport(false);
      await reloadPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Excel-Import fehlgeschlagen.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">SV Oberbank Ried</div>
          <h1>Scouting</h1>
          <p>
            Externe Spieler und Scoutingberichte verwalten.
            Spieler aus „Unser Kader“ werden hier bewusst nicht angezeigt.
          </p>
        </div>

        <button type="button" onClick={onBack} style={secondaryButton}>
          ← Dashboard
        </button>
      </section>

      {error && (
        <section style={errorBox}>
          <strong>Fehler:</strong>
          <div style={{ marginTop: '4px' }}>{error}</div>
        </section>
      )}

      {success && <section style={successBox}>{success}</section>}

      <section className="vv-scouting-kpis" style={kpiGrid}>
        <Kpi label="Spieler" value={players.length} />
        <Kpi label="Berichte" value={reports.length} />
        <Kpi
          label="Beobachtet"
          value={new Set(reports.map(report => report.player_id)).size}
        />
      </section>

      <section style={{ ...panel, marginTop: '14px' }}>
        <div style={toolbar}>
          <div>
            <strong>Scouting-Cockpit</strong>
            <div style={subtle}>Spieler anlegen, importieren und beobachten</div>
          </div>

          <div style={buttonRow}>
            <button
              type="button"
              onClick={() => {
                setPlayerForm(emptyPlayerForm);
                setShowPlayerForm(value => !value);
              }}
              style={secondaryButton}
            >
              + Spieler anlegen
            </button>

            <button
              type="button"
              onClick={() => setShowTransfermarktForm(value => !value)}
              style={secondaryButton}
            >
              Transfermarkt-Import
            </button>

            <button
              type="button"
              onClick={() => setShowExcelImport(value => !value)}
              style={secondaryButton}
            >
              Excel-Import
            </button>

            <button type="button" onClick={() => startNewReport()} style={primaryButton}>
              + Neuer Bericht
            </button>
          </div>
        </div>

        <div className="vv-scouting-filters" style={filterGrid}>
          <Field label="Suche">
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Spieler, Scout, Gegner, Empfehlung …"
              style={inputStyle}
            />
          </Field>

          <Field label="Spieler">
            <select
              value={playerFilter}
              onChange={event => setPlayerFilter(event.target.value)}
              style={inputStyle}
            >
              <option value="Alle">Alle</option>
              {sortedPlayers.map(player => (
                <option key={player.id} value={String(player.id)}>
                  {player.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Position">
            <select
              value={positionFilter}
              onChange={event => setPositionFilter(event.target.value)}
              style={inputStyle}
            >
              {positions.map(position => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </Field>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setPlayerFilter('Alle');
              setPositionFilter('Alle');
            }}
            style={secondaryButton}
          >
            Zurücksetzen
          </button>
        </div>
      </section>

      {showTransfermarktForm && (
        <section style={{ ...panel, marginTop: '14px' }}>
          <h2 style={{ marginTop: 0 }}>Spieler über Transfermarkt anlegen</h2>
          <p style={subtle}>
            Transfermarkt-Profil verlinken. VikingVision übernimmt den Namen und – soweit technisch verfügbar – weitere Profildaten.
          </p>

          <div style={inlineForm}>
            <input
              value={transfermarktUrl}
              onChange={event => setTransfermarktUrl(event.target.value)}
              placeholder="https://www.transfermarkt.../profil/spieler/..."
              style={inputStyle}
            />
            <button
              type="button"
              onClick={importTransfermarkt}
              disabled={importing}
              style={primaryButton}
            >
              {importing ? 'Importiert…' : 'Importieren'}
            </button>
          </div>
        </section>
      )}

      {showExcelImport && (
        <section style={{ ...panel, marginTop: '14px' }}>
          <h2 style={{ marginTop: 0 }}>Spieler aus Excel importieren</h2>
          <p style={subtle}>
            Unterstützt .xlsx und .csv. Die erste Zeile muss Spaltenüberschriften enthalten. Pflichtfeld: Name.
          </p>
          <p style={subtle}>
            Erkannte Spalten: Name, Geburtsdatum, Position, Nebenposition, Fuß, Nationalität, Größe, Verein, Vertrag bis, Marktwert, Berateragentur, Transfermarkt, Video, Priorität, Potenzial, Kaderstatus, Im Kader.
          </p>

          <input
            type="file"
            accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={importing}
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) importExcel(file);
              event.currentTarget.value = '';
            }}
          />
        </section>
      )}

      {showPlayerForm && (
        <section style={{ ...panel, marginTop: '14px' }}>
          <h2 style={{ marginTop: 0 }}>Scouting-Spieler anlegen</h2>

          <div className="vv-player-form" style={twoColumnGrid}>
            <TextInput label="Name *" value={playerForm.name} onChange={value => updatePlayerField('name', value)} />
            <TextInput label="Geburtsdatum" type="date" value={playerForm.birth_date} onChange={value => updatePlayerField('birth_date', value)} />
            <TextInput label="Aktueller Verein" value={playerForm.current_club} onChange={value => updatePlayerField('current_club', value)} />
            <TextInput label="Nationalität" value={playerForm.nationality} onChange={value => updatePlayerField('nationality', value)} />
            <TextInput label="Hauptposition" value={playerForm.primary_position} onChange={value => updatePlayerField('primary_position', value)} />
            <TextInput label="Nebenposition" value={playerForm.secondary_position} onChange={value => updatePlayerField('secondary_position', value)} />
            <TextInput label="Starker Fuß" value={playerForm.preferred_foot} onChange={value => updatePlayerField('preferred_foot', value)} />
            <TextInput label="Größe (cm)" type="number" value={playerForm.height_cm} onChange={value => updatePlayerField('height_cm', value)} />
            <TextInput label="Transfermarkt" value={playerForm.transfermarkt_url} onChange={value => updatePlayerField('transfermarkt_url', value)} />
            <Field label="Notizen">
              <textarea
                rows={4}
                value={playerForm.notes}
                onChange={event => updatePlayerField('notes', event.target.value)}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>
          </div>

          <div style={{ ...buttonRow, marginTop: '14px' }}>
            <button
              type="button"
              onClick={() => setShowPlayerForm(false)}
              style={secondaryButton}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={savePlayer}
              disabled={savingPlayer}
              style={primaryButton}
            >
              {savingPlayer ? 'Speichert…' : 'Spieler anlegen'}
            </button>
          </div>
        </section>
      )}

      {showReportForm && (
        <section style={{ ...panel, marginTop: '14px' }}>
          <div style={toolbar}>
            <h2 style={{ margin: 0 }}>
              {editingId === null ? 'Neuer Scoutingbericht' : 'Scoutingbericht bearbeiten'}
            </h2>
            <div style={buttonRow}>
              <button type="button" onClick={saveReport} disabled={saving} style={primaryButton}>
                {saving ? 'Speichert…' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                style={secondaryButton}
              >
                Abbrechen
              </button>
            </div>
          </div>

          <div style={twoColumnGrid}>
            <Field label="Spieler">
              <select
                value={form.player_id}
                onChange={event => updateField('player_id', event.target.value)}
                style={inputStyle}
              >
                <option value="">Spieler auswählen…</option>
                {sortedPlayers.map(player => (
                  <option key={player.id} value={String(player.id)}>
                    {player.name}
                  </option>
                ))}
              </select>
            </Field>

            <TextInput label="Scout" value={form.scout_name} onChange={value => updateField('scout_name', value)} />
            <TextInput label="Beobachtungsdatum" type="date" value={form.observation_date} onChange={value => updateField('observation_date', value)} />
            <TextInput label="Wettbewerb" value={form.competition} onChange={value => updateField('competition', value)} />
            <TextInput label="Spiel" value={form.match_name} onChange={value => updateField('match_name', value)} />
            <TextInput label="Gegner" value={form.opponent} onChange={value => updateField('opponent', value)} />
            <TextInput label="Beobachtete Position" value={form.observed_position} onChange={value => updateField('observed_position', value)} />
            <TextInput label="Minuten gespielt" type="number" value={form.minutes_played} onChange={value => updateField('minutes_played', value)} />
          </div>

          <h3>Bewertungen (1–5)</h3>
          <div className="vv-rating-grid" style={ratingGrid}>
            <Rating label="Technik" value={form.technical_rating} onChange={value => updateField('technical_rating', value)} />
            <Rating label="Taktik" value={form.tactical_rating} onChange={value => updateField('tactical_rating', value)} />
            <Rating label="Athletik" value={form.athletic_rating} onChange={value => updateField('athletic_rating', value)} />
            <Rating label="Mentalität" value={form.mentality_rating} onChange={value => updateField('mentality_rating', value)} />
            <Rating label="Potenzial" value={form.potential_rating} onChange={value => updateField('potential_rating', value)} />
          </div>

          <div className="vv-report-text-grid" style={twoColumnGrid}>
            <TextArea label="Stärken" value={form.strengths} onChange={value => updateField('strengths', value)} />
            <TextArea label="Entwicklungsfelder" value={form.development_areas} onChange={value => updateField('development_areas', value)} />
            <TextArea label="Gesamteindruck" value={form.overall_impression} onChange={value => updateField('overall_impression', value)} />
            <TextArea label="Empfehlung" value={form.recommendation} onChange={value => updateField('recommendation', value)} />
          </div>

          <TextArea label="Nächste Aktion" value={form.next_action} onChange={value => updateField('next_action', value)} />
        </section>
      )}

      <section style={{ marginTop: '18px' }}>
        <div style={toolbar}>
          <strong>Scouting-Spieler</strong>
          <span style={subtle}>Klick auf einen Spieler filtert dessen Berichte</span>
        </div>

        <div className="vv-scouting-player-grid" style={playerGrid}>
          {playerReportInfo.map(({ player, count, latest }) => (
            <button
              key={player.id}
              type="button"
              onClick={() => setPlayerFilter(String(player.id))}
              style={{
                ...playerCard,
                borderColor:
                  playerFilter === String(player.id) ? '#0b7a3b' : '#ececec'
              }}
            >
              <div style={toolbar}>
                <div>
                  <strong>{player.name}</strong>
                  <div style={subtle}>
                    {[player.primary_position, player.current_club]
                      .filter(Boolean)
                      .join(' · ') || 'Keine Stammdaten'}
                  </div>
                </div>
                <span style={pill}>{count}</span>
              </div>

              <div style={{ ...subtle, marginTop: '10px' }}>
                {latest?.observation_date
                  ? `Letzte Beobachtung: ${latest.observation_date}`
                  : 'Noch kein Bericht'}
              </div>

              <div style={buttonRow}>
                <span
                  onClick={event => {
                    event.stopPropagation();
                    startNewReport(String(player.id));
                  }}
                  style={textAction}
                >
                  Bericht anlegen
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '20px' }}>
        <div style={toolbar}>
          <strong>Berichte</strong>
          <span style={subtle}>
            {loading ? 'lädt…' : `${filteredReports.length} von ${reports.length}`}
          </span>
        </div>

        {!loading && filteredReports.length === 0 && (
          <div style={{ ...panel, marginTop: '10px' }}>
            Keine Scoutingberichte für die gewählten Filter gefunden.
          </div>
        )}

        <div className="vv-report-grid" style={reportGrid}>
          {filteredReports.map(report => (
            <article key={report.id} style={panel}>
              <div style={toolbar}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>
                    {report.player_name ?? `Spieler ${report.player_id}`}
                  </div>
                  <div style={subtle}>
                    {report.observation_date ?? '–'} · {report.observed_position ?? 'Position –'}
                  </div>
                </div>
                <button type="button" onClick={() => startEdit(report)} style={smallButton}>
                  Bearbeiten
                </button>
              </div>

              <div style={ratingRow}>
                <MiniRating label="TECH" value={report.technical_rating} />
                <MiniRating label="TAKT" value={report.tactical_rating} />
                <MiniRating label="ATHL" value={report.athletic_rating} />
                <MiniRating label="MENT" value={report.mentality_rating} />
                <MiniRating label="POT" value={report.potential_rating} />
              </div>

              <Info label="Scout" value={report.scout_name} />
              <Info label="Wettbewerb" value={report.competition} />
              <Info label="Spiel" value={report.match_name} />
              <Info label="Gegner" value={report.opponent} />

              {report.strengths && <TextBlock label="Stärken" value={report.strengths} />}
              {report.development_areas && <TextBlock label="Entwicklungsfelder" value={report.development_areas} />}
              {report.recommendation && <TextBlock label="Empfehlung" value={report.recommendation} />}
              {report.next_action && <TextBlock label="Nächste Aktion" value={report.next_action} />}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <div style={labelStyle}>{label}</div>
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
        onChange={event => onChange(event.target.value)}
        style={inputStyle}
      />
    </Field>
  );
}

function TextArea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ marginTop: '12px' }}>
      <Field label={label}>
        <textarea
          rows={4}
          value={value}
          onChange={event => onChange(event.target.value)}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </Field>
    </div>
  );
}

function Rating({
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
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        style={inputStyle}
      >
        <option value="">–</option>
        {[1, 2, 3, 4, 5].map(item => (
          <option key={item} value={String(item)}>
            {item}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div style={panel}>
      <div style={labelStyle}>{label}</div>
      <div style={{ marginTop: '6px', fontSize: '28px', fontWeight: 900 }}>
        {value}
      </div>
    </div>
  );
}

function MiniRating({ label, value }: { label: string; value?: number }) {
  return (
    <div style={miniRating}>
      <div style={{ fontSize: '10px', color: '#777' }}>{label}</div>
      <strong>{value ?? '–'}</strong>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ marginTop: '7px', fontSize: '13px' }}>
      <span style={{ color: '#777' }}>{label}: </span>
      <strong>{value}</strong>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginTop: '12px' }}>
      <strong>{label}</strong>
      <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{value}</div>
    </div>
  );
}

// Lightweight .xlsx reader for the first worksheet.
// It avoids an extra npm dependency and also accepts CSV files.
async function readSpreadsheet(file: File): Promise<Record<string, string>[]> {
  if (file.name.toLowerCase().endsWith('.csv')) {
    return csvToRows(await file.text());
  }

  const buffer = await file.arrayBuffer();
  const files = await unzipXlsx(buffer);

  const sharedStrings = parseSharedStrings(
    files.get('xl/sharedStrings.xml') ?? ''
  );

  const sheetXml =
    files.get('xl/worksheets/sheet1.xml');

  if (!sheetXml) {
    throw new Error('Die erste Excel-Tabelle konnte nicht gelesen werden.');
  }

  const doc = new DOMParser().parseFromString(sheetXml, 'application/xml');
  const xmlRows = Array.from(doc.querySelectorAll('sheetData > row'));

  if (xmlRows.length === 0) return [];

  const matrix = xmlRows.map(row => {
    const values: string[] = [];

    for (const cell of Array.from(row.querySelectorAll('c'))) {
      const ref = cell.getAttribute('r') ?? 'A1';
      const columnIndex = excelColumnIndex(ref.replace(/\d+/g, ''));
      const type = cell.getAttribute('t');

      let value = '';
      if (type === 'inlineStr') {
        value = cell.querySelector('is > t')?.textContent ?? '';
      } else {
        const raw = cell.querySelector('v')?.textContent ?? '';
        value = type === 's'
          ? sharedStrings[Number(raw)] ?? ''
          : raw;
      }

      values[columnIndex] = value;
    }

    return values;
  });

  return matrixToObjects(matrix);
}

function csvToRows(text: string) {
  const delimiter =
    (text.split('\n')[0]?.match(/;/g)?.length ?? 0) >
    (text.split('\n')[0]?.match(/,/g)?.length ?? 0)
      ? ';'
      : ',';

  const rows = text
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => parseCsvLine(line, delimiter));

  return matrixToObjects(rows);
}

function parseCsvLine(line: string, delimiter: string) {
  const result: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function matrixToObjects(matrix: string[][]) {
  const headers = (matrix[0] ?? []).map(value => value.trim());

  return matrix.slice(1).map(row => {
    const result: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) result[header] = String(row[index] ?? '').trim();
    });
    return result;
  });
}

function parseSharedStrings(xml: string) {
  if (!xml) return [];

  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return Array.from(doc.querySelectorAll('si')).map(item =>
    Array.from(item.querySelectorAll('t'))
      .map(node => node.textContent ?? '')
      .join('')
  );
}

function excelColumnIndex(column: string) {
  let result = 0;
  for (const char of column.toUpperCase()) {
    result = result * 26 + char.charCodeAt(0) - 64;
  }
  return Math.max(0, result - 1);
}

async function unzipXlsx(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocd = -1;

  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }

  if (eocd < 0) throw new Error('Ungültige XLSX-Datei.');

  const entries = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const result = new Map<string, string>();

  for (let entry = 0; entry < entries; entry += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;

    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const fileName = decoder.decode(
      bytes.slice(offset + 46, offset + 46 + fileNameLength)
    );

    if (
      fileName === 'xl/sharedStrings.xml' ||
      fileName === 'xl/worksheets/sheet1.xml'
    ) {
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);

      let content: Uint8Array;

      if (method === 0) {
        content = compressed;
      } else if (method === 8) {
        const stream = new Blob([compressed])
          .stream()
          .pipeThrough(new DecompressionStream('deflate-raw'));
        content = new Uint8Array(await new Response(stream).arrayBuffer());
      } else {
        throw new Error(`Nicht unterstützte XLSX-Kompression: ${method}`);
      }

      result.set(fileName, decoder.decode(content));
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return result;
}

function normalizePlayerRow(row: Record<string, string>) {
  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [
      key.toLocaleLowerCase('de').replace(/[\s_\-/.]/g, ''),
      value
    ])
  );

  const get = (...names: string[]) => {
    for (const name of names) {
      const value = normalized.get(
        name.toLocaleLowerCase('de').replace(/[\s_\-/.]/g, '')
      );
      if (value) return value;
    }
    return '';
  };

  const bool = (value: string) =>
    ['1', 'ja', 'yes', 'true', 'x'].includes(
      value.trim().toLocaleLowerCase('de')
    );

  return {
    name: get('Name', 'Spieler'),
    birth_date: normalizeDate(get('Geburtsdatum', 'BirthDate')),
    primary_position: get('Position', 'Hauptposition', 'PrimaryPosition') || null,
    secondary_position: get('Nebenposition', 'SecondaryPosition') || null,
    preferred_foot: get('Fuß', 'Fuss', 'PreferredFoot') || null,
    nationality: get('Nationalität', 'Nationalitaet', 'Nationality') || null,
    height_cm: nullableNumber(get('Größe', 'Groesse', 'Height', 'HeightCm')),
    current_club: get('Verein', 'AktuellerVerein', 'Club', 'CurrentClub') || null,
    contract_until: normalizeDate(get('Vertragbis', 'ContractUntil')),
    market_value: get('Marktwert', 'MarketValue') || null,
    agent_agency: get('Berateragentur', 'Agentur', 'Agency') || null,
    transfermarkt_url: get('Transfermarkt', 'TransfermarktURL') || null,
    video_url: get('Video', 'VideoURL') || null,
    priority: nullableNumber(get('Priorität', 'Prioritaet', 'Priority')),
    potential: nullableNumber(get('Potenzial', 'Potential')),
    squad_status: get('Kaderstatus', 'Status') || null,
    is_own_squad: bool(get('ImKader', 'OwnSquad', 'IsOwnSquad'))
  };
}

function normalizeDate(value: string) {
  if (!value) return null;

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return value;

  const de = value.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/);
  if (de) {
    return `${de[3]}-${de[2].padStart(2, '0')}-${de[1].padStart(2, '0')}`;
  }

  const excelSerial = Number(value);
  if (Number.isFinite(excelSerial) && excelSerial > 20000 && excelSerial < 80000) {
    const date = new Date(Date.UTC(1899, 11, 30 + excelSerial));
    return date.toISOString().slice(0, 10);
  }

  return null;
}

function nullableNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value.replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

const panel: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ececec',
  borderRadius: '14px',
  padding: '18px',
  boxShadow: '0 3px 14px rgba(0,0,0,0.04)'
};
const primaryButton: React.CSSProperties = {
  border: 'none',
  background: '#0b7a3b',
  color: '#fff',
  padding: '11px 16px',
  borderRadius: '9px',
  cursor: 'pointer',
  fontWeight: 700
};
const secondaryButton: React.CSSProperties = {
  border: '1px solid #d0d0d0',
  background: '#fff',
  color: '#222',
  padding: '11px 15px',
  borderRadius: '9px',
  cursor: 'pointer',
  fontWeight: 700
};
const smallButton: React.CSSProperties = {
  ...secondaryButton,
  padding: '7px 10px',
  fontSize: '12px'
};
const errorBox: React.CSSProperties = {
  marginTop: '14px',
  padding: '12px 16px',
  background: '#fff3f3',
  color: '#a00000',
  borderRadius: '10px'
};
const successBox: React.CSSProperties = {
  marginTop: '14px',
  padding: '12px 16px',
  background: '#eef9f2',
  color: '#0b6b35',
  borderRadius: '10px'
};
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
const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  fontWeight: 700,
  marginBottom: '5px'
};
const subtle: React.CSSProperties = {
  color: '#777',
  fontSize: '12px',
  marginTop: '4px'
};
const toolbar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  flexWrap: 'wrap',
  alignItems: 'center'
};
const buttonRow: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap'
};
const twoColumnGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '12px',
  marginTop: '14px'
};
const filterGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 2fr) repeat(2, minmax(160px, 1fr)) auto',
  gap: '10px',
  alignItems: 'end',
  marginTop: '14px'
};
const kpiGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '10px',
  marginTop: '18px'
};
const playerGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
  gap: '10px',
  marginTop: '10px'
};
const playerCard: React.CSSProperties = {
  ...panel,
  textAlign: 'left',
  cursor: 'pointer',
  color: 'inherit',
  font: 'inherit'
};
const pill: React.CSSProperties = {
  background: '#eef5f1',
  color: '#0b6b35',
  borderRadius: '999px',
  padding: '5px 9px',
  fontSize: '11px',
  fontWeight: 800
};
const textAction: React.CSSProperties = {
  color: '#0b7a3b',
  fontWeight: 700,
  fontSize: '12px',
  marginTop: '10px'
};
const ratingGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: '8px'
};
const ratingRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '6px',
  marginTop: '14px'
};
const miniRating: React.CSSProperties = {
  background: '#f6f8f7',
  borderRadius: '8px',
  padding: '8px',
  textAlign: 'center'
};
const reportGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '14px',
  marginTop: '10px'
};
const inlineForm: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: '10px',
  alignItems: 'end'
};
