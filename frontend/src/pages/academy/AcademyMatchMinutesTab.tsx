import * as XLSX from 'xlsx';
import { useEffect, useMemo, useState } from 'react';

type Player = {
  id: number;
  name: string;
  jersey_number?: string;
  primary_position?: string;
  squad_status?: string;
};

type Match = {
  id: number;
  team: string;
  match_date: string;
  opponent: string;
  competition?: string | null;
  result?: string | null;
  duration_minutes: number;
};

type MatchPlayer = {
  id: number;
  name: string;
  jersey_number?: string;
  primary_position?: string;
  minutes: number;
  in_squad: boolean;
  started: boolean;
  comment?: string;
};

type OverviewRow = {
  academy_player_id: number;
  name: string;
  jersey_number?: string | null;
  primary_position?: string | null;
  minutes: number;
  possible_minutes: number;
  percentage: number;
};

type Props = {
  team: string;
  players: Player[];
  accessToken?: string;
  apiBase: string;
};

export default function AcademyMatchMinutesTab({
  team,
  players,
  accessToken,
  apiBase
}: Props) {
  const [matches, setMatches] =
    useState<Match[]>([]);

  const [selectedMatchId, setSelectedMatchId] =
    useState<number | null>(null);

  const [matchPlayers, setMatchPlayers] =
    useState<MatchPlayer[]>([]);

  const [overview, setOverview] =
    useState<OverviewRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string>();

  const [success, setSuccess] =
    useState<string>();

  const [form, setForm] =
    useState({
      match_date:
        new Date()
          .toISOString()
          .slice(0, 10),
      opponent: '',
      competition: '',
      result: '',
      duration_minutes:
        team === 'U15'
          ? '80'
          : '90'
    });

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
            'Content-Type':
              'application/json',
            ...(init?.headers ?? {})
          }
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ??
        'Anfrage fehlgeschlagen.'
      );
    }

    return data;
  }

  async function loadBase() {
    setLoading(true);
    setError(undefined);

    try {
      const [
        matchData,
        overviewData
      ] =
        await Promise.all([
          api(
            `/academy/matches?team=${encodeURIComponent(
              team
            )}`
          ),
          api(
            `/academy/minutes/overview?team=${encodeURIComponent(
              team
            )}`
          )
        ]);

      const nextMatches =
        Array.isArray(
          matchData.matches
        )
          ? matchData.matches
          : [];

      setMatches(
        nextMatches
      );

      setOverview(
        Array.isArray(
          overviewData.players
        )
          ? overviewData.players
          : []
      );

      const nextSelected =
        selectedMatchId &&
        nextMatches.some(
          (match: Match) =>
            match.id ===
            selectedMatchId
        )
          ? selectedMatchId
          : nextMatches[0]?.id ??
            null;

      setSelectedMatchId(
        nextSelected
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Spielminuten konnten nicht geladen werden.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMatch(
    matchId: number
  ) {
    try {
      const data =
        await api(
          `/academy/match/${matchId}/minutes`
        );

      setMatchPlayers(
        Array.isArray(
          data.players
        )
          ? data.players
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Spiel konnte nicht geladen werden.'
      );
    }
  }

  useEffect(() => {
    setForm(current => ({
      ...current,
      duration_minutes:
        team === 'U15'
          ? '80'
          : '90'
    }));

    setSelectedMatchId(null);

    void loadBase();
  }, [
    team,
    accessToken,
    apiBase
  ]);

  useEffect(() => {
    if (
      selectedMatchId != null
    ) {
      void loadMatch(
        selectedMatchId
      );
    } else {
      setMatchPlayers([]);
    }
  }, [selectedMatchId]);

  const selectedMatch =
    matches.find(
      match =>
        match.id ===
        selectedMatchId
    );

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

  async function createMatch() {
    if (
      !form.match_date ||
      !form.opponent.trim()
    ) {
      setError(
        'Bitte Datum und Gegner angeben.'
      );
      return;
    }

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const data =
        await api(
          '/academy/matches',
          {
            method: 'POST',
            body: JSON.stringify({
              team,
              match_date:
                form.match_date,
              opponent:
                form.opponent.trim(),
              competition:
                form.competition ||
                null,
              result:
                form.result ||
                null,
              duration_minutes:
                Number(
                  form.duration_minutes
                ) ||
                (
                  team === 'U15'
                    ? 80
                    : 90
                )
            })
          }
        );

      setForm(current => ({
        ...current,
        opponent: '',
        competition: '',
        result: ''
      }));

      setSuccess(
        'Spiel wurde angelegt.'
      );

      await loadBase();

      if (
        data.match?.id
      ) {
        setSelectedMatchId(
          data.match.id
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Spiel konnte nicht angelegt werden.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveMinutes() {
    if (
      selectedMatchId == null
    ) {
      return;
    }

    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      await api(
        `/academy/match/${selectedMatchId}/minutes`,
        {
          method: 'POST',
          body: JSON.stringify({
            rows:
              matchPlayers.map(
                player => ({
                  academy_player_id:
                    player.id,
                  minutes:
                    Number(
                      player.minutes
                    ) || 0,
                  in_squad:
                    Boolean(
                      player.in_squad
                    ),
                  started:
                    Boolean(
                      player.started
                    ),
                  comment:
                    player.comment ||
                    null
                })
              )
          })
        }
      );

      setSuccess(
        'Spielminuten wurden gespeichert.'
      );

      await loadBase();
      await loadMatch(
        selectedMatchId
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Spielminuten konnten nicht gespeichert werden.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteMatch() {
    if (
      selectedMatchId == null ||
      !window.confirm(
        'Dieses Spiel inklusive aller eingetragenen Minuten löschen?'
      )
    ) {
      return;
    }

    try {
      await api(
        `/academy/matches/${selectedMatchId}`,
        {
          method: 'DELETE'
        }
      );

      setSelectedMatchId(
        null
      );
      setSuccess(
        'Spiel wurde gelöscht.'
      );

      await loadBase();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Spiel konnte nicht gelöscht werden.'
      );
    }
  }

  function updatePlayer(
    playerId: number,
    field:
      | 'minutes'
      | 'in_squad'
      | 'started'
      | 'comment',
    value:
      | number
      | boolean
      | string
  ) {
    setMatchPlayers(current =>
      current.map(player =>
        player.id ===
        playerId
          ? {
              ...player,
              [field]: value
            }
          : player
      )
    );
  }

  async function importMinutesFile(
    file: File
  ) {
    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      let rows:
        Array<Record<string, unknown>> =
        [];

      const lowerName =
        file.name
          .toLowerCase();

      if (
        lowerName.endsWith(
          '.xlsx'
        ) ||
        lowerName.endsWith(
          '.xls'
        )
      ) {
        const buffer =
          await file.arrayBuffer();

        const workbook =
          XLSX.read(
            buffer,
            {
              type: 'array',
              cellDates: true
            }
          );

        const sheetName =
          workbook.SheetNames.find(
            name =>
              normalizeHeader(name) ===
              'spielminutenimport'
          ) ??
          workbook.SheetNames[0];

        if (!sheetName) {
          throw new Error(
            'Die Excel-Datei enthält kein Tabellenblatt.'
          );
        }

        const worksheet =
          workbook.Sheets[
            sheetName
          ];

        const raw =
          XLSX.utils.sheet_to_json<
            Record<string, unknown>
          >(
            worksheet,
            {
              defval: ''
            }
          );

        rows =
          raw
            .map(
              row =>
                mapImportRow(
                  row
                )
            )
            .filter(
              row =>
                Boolean(
                  row.team &&
                  row.match_date &&
                  row.opponent &&
                  row.player_name
                )
            );
      } else {
        const text =
          await file.text();

        rows =
          parseCsv(text);
      }

      if (!rows.length) {
        throw new Error(
          'Die Importdatei enthält keine verwertbaren Spielminuten-Zeilen.'
        );
      }

      const data =
        await api(
          '/academy/minutes/import',
          {
            method: 'POST',
            body: JSON.stringify({
              rows
            })
          }
        );

      setSuccess(
        `${data.imported ?? 0} Spielminuten-Zeilen importiert.`
      );

      await loadBase();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Import fehlgeschlagen.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section style={panel}>
        <div style={head}>
          <div>
            <div style={eyebrow}>
              {team}
            </div>

            <h2 style={title}>
              Spiele & Spielminuten
            </h2>

            <div style={subtitle}>
              U15 standardmäßig 80 Minuten · U16/U18/JWR standardmäßig 90 Minuten.
            </div>
          </div>

          <label style={importLabel}>
            Excel / CSV importieren
            <input
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              style={{ display: 'none' }}
              onChange={event => {
                const file =
                  event.target.files?.[0];

                if (file) {
                  void importMinutesFile(
                    file
                  );
                }

                event.currentTarget.value =
                  '';
              }}
            />
          </label>
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

        <div style={createGrid}>
          <Field
            label="Spieldatum"
            type="date"
            value={
              form.match_date
            }
            onChange={value =>
              setForm(current => ({
                ...current,
                match_date:
                  value
              }))
            }
          />

          <Field
            label="Gegner"
            value={form.opponent}
            onChange={value =>
              setForm(current => ({
                ...current,
                opponent: value
              }))
            }
          />

          <Field
            label="Bewerb"
            value={
              form.competition
            }
            onChange={value =>
              setForm(current => ({
                ...current,
                competition:
                  value
              }))
            }
          />

          <Field
            label="Ergebnis"
            value={form.result}
            onChange={value =>
              setForm(current => ({
                ...current,
                result: value
              }))
            }
          />

          <Field
            label="Spieldauer"
            type="number"
            value={
              form.duration_minutes
            }
            onChange={value =>
              setForm(current => ({
                ...current,
                duration_minutes:
                  value
              }))
            }
          />
        </div>

        <div style={actions}>
          <button
            type="button"
            onClick={createMatch}
            disabled={saving}
            style={primaryButton}
          >
            Spiel anlegen
          </button>
        </div>
      </section>

      <section style={panel}>
        <div style={matchSelector}>
          <label style={selectorField}>
            <span style={label}>
              Spiel auswählen
            </span>

            <select
              value={
                selectedMatchId ??
                ''
              }
              onChange={event =>
                setSelectedMatchId(
                  event.target.value
                    ? Number(
                        event.target.value
                      )
                    : null
                )
              }
              style={input}
            >
              <option value="">
                Spiel auswählen
              </option>

              {matches.map(
                match => (
                  <option
                    key={match.id}
                    value={match.id}
                  >
                    {formatDate(
                      match.match_date
                    )}
                    {' · '}
                    {match.opponent}
                    {' · '}
                    {match.duration_minutes}
                    {' Min.'}
                  </option>
                )
              )}
            </select>
          </label>

          {selectedMatch && (
            <div style={selectedMeta}>
              <strong>
                {selectedMatch.opponent}
              </strong>
              <span>
                {selectedMatch.competition ||
                  'ohne Bewerb'}
              </span>
              <span>
                {selectedMatch.result ||
                  'Ergebnis offen'}
              </span>
            </div>
          )}
        </div>

        {selectedMatchId != null &&
          !loading && (
          <>
            <div style={tableWrap}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>
                      Spieler
                    </th>
                    <th style={th}>
                      Pos.
                    </th>
                    <th style={th}>
                      Kader
                    </th>
                    <th style={th}>
                      Start
                    </th>
                    <th style={th}>
                      Minuten
                    </th>
                    <th style={th}>
                      Kommentar
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {matchPlayers.map(
                    player => (
                      <tr
                        key={player.id}
                      >
                        <td style={tdStrong}>
                          {player.jersey_number
                            ? `${player.jersey_number} · `
                            : ''}
                          {player.name}
                        </td>

                        <td style={td}>
                          {player.primary_position ||
                            '–'}
                        </td>

                        <td style={td}>
                          <input
                            type="checkbox"
                            checked={
                              player.in_squad
                            }
                            onChange={event =>
                              updatePlayer(
                                player.id,
                                'in_squad',
                                event.target.checked
                              )
                            }
                          />
                        </td>

                        <td style={td}>
                          <input
                            type="checkbox"
                            checked={
                              player.started
                            }
                            onChange={event =>
                              updatePlayer(
                                player.id,
                                'started',
                                event.target.checked
                              )
                            }
                          />
                        </td>

                        <td style={td}>
                          <input
                            type="number"
                            min="0"
                            max={
                              selectedMatch
                                ?.duration_minutes ??
                              90
                            }
                            value={
                              player.minutes
                            }
                            onChange={event =>
                              updatePlayer(
                                player.id,
                                'minutes',
                                Math.min(
                                  Number(
                                    event.target.value
                                  ) || 0,
                                  selectedMatch
                                    ?.duration_minutes ??
                                  90
                                )
                              )
                            }
                            style={minuteInput}
                          />
                        </td>

                        <td style={td}>
                          <input
                            value={
                              player.comment ??
                              ''
                            }
                            onChange={event =>
                              updatePlayer(
                                player.id,
                                'comment',
                                event.target.value
                              )
                            }
                            style={commentInput}
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div style={actionsBetween}>
              <button
                type="button"
                onClick={deleteMatch}
                style={dangerButton}
              >
                Spiel löschen
              </button>

              <button
                type="button"
                onClick={saveMinutes}
                disabled={saving}
                style={primaryButton}
              >
                Minuten speichern
              </button>
            </div>
          </>
        )}
      </section>

      <section style={panel}>
        <div style={head}>
          <div>
            <div style={eyebrow}>
              {team}
            </div>
            <h2 style={title}>
              Spielzeitübersicht
            </h2>
            <div style={subtitle}>
              Anteil an den maximal möglichen Minuten der bereits absolvierten Spiele. Zielwert: mindestens 60 %.
            </div>
          </div>
        </div>

        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>
                  Spieler
                </th>
                <th style={th}>
                  Position
                </th>
                <th style={th}>
                  Minuten
                </th>
                <th style={th}>
                  Möglich
                </th>
                <th style={th}>
                  Spielzeit %
                </th>
              </tr>
            </thead>

            <tbody>
              {overview.map(
                row => (
                  <tr
                    key={
                      row.academy_player_id
                    }
                  >
                    <td style={tdStrong}>
                      {row.jersey_number
                        ? `${row.jersey_number} · `
                        : ''}
                      {row.name}
                    </td>

                    <td style={td}>
                      {row.primary_position ||
                        '–'}
                    </td>

                    <td style={td}>
                      {row.minutes}
                    </td>

                    <td style={td}>
                      {row.possible_minutes}
                    </td>

                    <td style={td}>
                      <span
                        style={
                          row.percentage <
                          60
                            ? percentageRed
                            : percentageGreen
                        }
                      >
                        {row.percentage.toFixed(
                          1
                        )}
                        %
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function mapImportRow(
  row: Record<string, unknown>
) {
  const normalized =
    Object.fromEntries(
      Object.entries(row)
        .map(
          ([key, value]) => [
            normalizeHeader(key),
            value
          ]
        )
    );

  const get =
    (key: string) =>
      normalized[key];

  return {
    team:
      stringValue(
        get('team')
      ),
    match_date:
      normalizeImportedDate(
        get('spieldatum')
      ),
    opponent:
      stringValue(
        get('gegner')
      ),
    competition:
      stringValue(
        get('bewerb')
      ),
    result:
      stringValue(
        get('ergebnis')
      ),
    duration_minutes:
      numericValue(
        get('spieldauer')
      ),
    player_name:
      stringValue(
        get('spieler')
      ),
    jersey_number:
      stringValue(
        get('trikotnummer')
      ),
    in_squad:
      yesNo(
        stringValue(
          get('imkader')
        )
      ),
    started:
      yesNo(
        stringValue(
          get('startelf')
        )
      ),
    minutes:
      numericValue(
        get('minuten')
      ),
    comment:
      stringValue(
        get('kommentar')
      )
  };
}

function stringValue(
  value: unknown
) {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(value)
    .trim();
}

function numericValue(
  value: unknown
) {
  if (
    typeof value ===
      'number' &&
    Number.isFinite(value)
  ) {
    return value;
  }

  const parsed =
    Number(
      stringValue(value)
        .replace(',', '.')
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : undefined;
}

function normalizeImportedDate(
  value: unknown
) {
  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {
    return [
      value.getFullYear(),
      String(
        value.getMonth() + 1
      ).padStart(2, '0'),
      String(
        value.getDate()
      ).padStart(2, '0')
    ].join('-');
  }

  if (
    typeof value ===
      'number' &&
    Number.isFinite(value)
  ) {
    const parsed =
      XLSX.SSF.parse_date_code(
        value
      );

    if (parsed) {
      return [
        parsed.y,
        String(
          parsed.m
        ).padStart(2, '0'),
        String(
          parsed.d
        ).padStart(2, '0')
      ].join('-');
    }
  }

  return normalizeDate(
    stringValue(value)
  );
}

function parseCsv(
  text: string
) {
  const normalized =
    text.replace(
      /^\uFEFF/,
      ''
    );

  const lines =
    normalized
      .split(/\r?\n/)
      .filter(
        line =>
          line.trim()
      );

  if (lines.length < 2) {
    return [];
  }

  const delimiter =
    lines[0].includes(';')
      ? ';'
      : ',';

  const header =
    splitCsvLine(
      lines[0],
      delimiter
    );

  const index =
    Object.fromEntries(
      header.map(
        (name, i) => [
          normalizeHeader(name),
          i
        ]
      )
    );

  function value(
    cells: string[],
    key: string
  ) {
    const i =
      index[key];

    return i == null
      ? ''
      : (
          cells[i] ??
          ''
        ).trim();
  }

  return lines
    .slice(1)
    .map(line => {
      const cells =
        splitCsvLine(
          line,
          delimiter
        );

      return {
        team:
          value(
            cells,
            'team'
          ),
        match_date:
          normalizeDate(
            value(
              cells,
              'spieldatum'
            )
          ),
        opponent:
          value(
            cells,
            'gegner'
          ),
        competition:
          value(
            cells,
            'bewerb'
          ),
        result:
          value(
            cells,
            'ergebnis'
          ),
        duration_minutes:
          toNumber(
            value(
              cells,
              'spieldauer'
            )
          ),
        player_name:
          value(
            cells,
            'spieler'
          ),
        jersey_number:
          value(
            cells,
            'trikotnummer'
          ),
        in_squad:
          yesNo(
            value(
              cells,
              'imkader'
            )
          ),
        started:
          yesNo(
            value(
              cells,
              'startelf'
            )
          ),
        minutes:
          toNumber(
            value(
              cells,
              'minuten'
            )
          ),
        comment:
          value(
            cells,
            'kommentar'
          )
      };
    })
    .filter(
      row =>
        row.team &&
        row.match_date &&
        row.opponent &&
        row.player_name
    );
}

function splitCsvLine(
  line: string,
  delimiter: string
) {
  const result: string[] =
    [];

  let current = '';
  let quoted = false;

  for (
    let i = 0;
    i < line.length;
    i += 1
  ) {
    const char =
      line[i];

    if (char === '"') {
      if (
        quoted &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (
      char === delimiter &&
      !quoted
    ) {
      result.push(
        current
      );
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function normalizeHeader(
  value: string
) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9]/g,
      ''
    );
}

function normalizeDate(
  value: string
) {
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return value;
  }

  const match =
    value.match(
      /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/
    );

  if (!match) {
    return value;
  }

  return `${match[3]}-${match[2].padStart(
    2,
    '0'
  )}-${match[1].padStart(
    2,
    '0'
  )}`;
}

function yesNo(
  value: string
) {
  return [
    'ja',
    'yes',
    '1',
    'true',
    'x'
  ].includes(
    value
      .trim()
      .toLowerCase()
  );
}

function toNumber(
  value: string
) {
  const number =
    Number(
      value.replace(
        ',',
        '.'
      )
    );

  return Number.isFinite(number)
    ? number
    : undefined;
}

function formatDate(
  value?: string
) {
  if (!value) {
    return '–';
  }

  return new Date(
    `${value.slice(0, 10)}T12:00:00`
  ).toLocaleDateString(
    'de-DE'
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
}) {
  return (
    <label style={selectorField}>
      <span style={labelStyle}>
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={event =>
          onChange(
            event.target.value
          )
        }
        style={input}
      />
    </label>
  );
}

const panel:
  React.CSSProperties = {
  marginTop: '18px',
  padding: '18px',
  border:
    '1px solid #e5e9e6',
  borderRadius: '15px',
  background: '#fff'
};

const head:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  gap: '12px',
  alignItems: 'flex-start',
  flexWrap: 'wrap'
};

const eyebrow:
  React.CSSProperties = {
  color: '#0b7a3b',
  fontSize: '9px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.08em'
};

const title:
  React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '22px'
};

const subtitle:
  React.CSSProperties = {
  marginTop: '4px',
  color: '#737873',
  fontSize: '11px'
};

const importLabel:
  React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '38px',
  padding: '0 12px',
  border: '1px solid #0b7a3b',
  borderRadius: '9px',
  color: '#0b7a3b',
  fontWeight: 800,
  cursor: 'pointer'
};

const createGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(145px, 1fr))',
  gap: '9px',
  marginTop: '16px'
};

const selectorField:
  React.CSSProperties = {
  display: 'grid',
  gap: '5px'
};

const labelStyle:
  React.CSSProperties = {
  color: '#666',
  fontSize: '9px',
  fontWeight: 800,
  textTransform: 'uppercase'
};

const label = labelStyle;

const input:
  React.CSSProperties = {
  width: '100%',
  minHeight: '38px',
  boxSizing: 'border-box',
  border: '1px solid #d4d9d6',
  borderRadius: '8px',
  padding: '7px 9px',
  background: '#fff',
  font: 'inherit'
};

const actions:
  React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '12px'
};

const actionsBetween:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  gap: '8px',
  marginTop: '12px'
};

const primaryButton:
  React.CSSProperties = {
  border: 'none',
  borderRadius: '9px',
  padding: '10px 14px',
  background: '#0b7a3b',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer'
};

const dangerButton:
  React.CSSProperties = {
  border: '1px solid #e3bbbb',
  borderRadius: '9px',
  padding: '10px 14px',
  background: '#fff5f5',
  color: '#9b1c1c',
  fontWeight: 800,
  cursor: 'pointer'
};

const matchSelector:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(240px, .7fr) minmax(0, 1.3fr)',
  gap: '12px',
  alignItems: 'end'
};

const selectedMeta:
  React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  color: '#666',
  fontSize: '10px'
};

const tableWrap:
  React.CSSProperties = {
  marginTop: '14px',
  overflowX: 'auto'
};

const table:
  React.CSSProperties = {
  width: '100%',
  minWidth: '760px',
  borderCollapse: 'collapse'
};

const th:
  React.CSSProperties = {
  padding: '8px',
  textAlign: 'left',
  borderBottom:
    '2px solid #0b7a3b',
  color: '#555',
  fontSize: '9px',
  textTransform: 'uppercase'
};

const td:
  React.CSSProperties = {
  padding: '8px',
  borderBottom:
    '1px solid #ecefec',
  fontSize: '11px'
};

const tdStrong:
  React.CSSProperties = {
  ...td,
  fontWeight: 800
};

const minuteInput:
  React.CSSProperties = {
  width: '74px',
  border: '1px solid #d4d9d6',
  borderRadius: '7px',
  padding: '6px'
};

const commentInput:
  React.CSSProperties = {
  minWidth: '180px',
  width: '100%',
  border: '1px solid #d4d9d6',
  borderRadius: '7px',
  padding: '6px',
  boxSizing: 'border-box'
};

const percentageGreen:
  React.CSSProperties = {
  display: 'inline-flex',
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#eaf7ef',
  color: '#0b6b35',
  fontWeight: 900
};

const percentageRed:
  React.CSSProperties = {
  ...percentageGreen,
  background: '#fff0f0',
  color: '#b42318'
};

const errorBox:
  React.CSSProperties = {
  marginTop: '12px',
  padding: '9px 11px',
  borderRadius: '9px',
  background: '#fff2f2',
  color: '#9d0000',
  fontSize: '11px'
};

const successBox:
  React.CSSProperties = {
  marginTop: '12px',
  padding: '9px 11px',
  borderRadius: '9px',
  background: '#eef9f2',
  color: '#0b6b35',
  fontSize: '11px'
};
