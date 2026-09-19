import PageHeader from '../components/PageHeader';
import React from 'react';
import PlayerImage from '../components/PlayerImage';
import type { Player } from './PlayerProfile';

type Props = {
  players: Player[];
  accessToken?: string;
  apiBase: string;
  onBack: () => void;
  onOpenPlayer: (player: Player) => void;
  onArchived?: () => Promise<Player[] | void>;
};

type PositionGroup =
  | 'Torwart'
  | 'Abwehr'
  | 'Mittelfeld'
  | 'Angriff'
  | 'Sonstige';

function positionGroup(
  position?: string
): PositionGroup {
  const value =
    (position ?? '')
      .toLowerCase()
      .trim();

  if (
    value.includes('torwart') ||
    value.includes('goalkeeper') ||
    value === 'tw' ||
    value === 'gk'
  ) {
    return 'Torwart';
  }

  if (
    value.includes('innenverteid') ||
    value.includes('außenverteid') ||
    value.includes('aussenverteid') ||
    value.includes('verteid') ||
    value.includes('abwehr') ||
    value === 'iv' ||
    value === 'rv' ||
    value === 'lv' ||
    value === 'cb' ||
    value === 'rb' ||
    value === 'lb'
  ) {
    return 'Abwehr';
  }

  if (
    value.includes('mittelfeld') ||
    value.includes('sechser') ||
    value.includes('achter') ||
    value.includes('zehner') ||
    value.includes('zentral') ||
    value.includes('flügel') ||
    value.includes('fluegel') ||
    value === 'dm' ||
    value === 'zm' ||
    value === 'om' ||
    value === 'lm' ||
    value === 'rm' ||
    value === 'cm' ||
    value === 'am'
  ) {
    return 'Mittelfeld';
  }

  if (
    value.includes('stürmer') ||
    value.includes('stuermer') ||
    value.includes('sturm') ||
    value.includes('angriff') ||
    value.includes('offensiv') ||
    value.includes('winger') ||
    value.includes('forward') ||
    value.includes('linksaußen') ||
    value.includes('linksaussen') ||
    value.includes('rechtsaußen') ||
    value.includes('rechtsaussen') ||
    value.includes('außenstürmer') ||
    value.includes('aussenstuermer') ||
    value === 'st' ||
    value === 'cf' ||
    value === 'lf' ||
    value === 'rf'
  ) {
    return 'Angriff';
  }

  return 'Sonstige';
}

function displayContract(
  player: Player
) {
  return (
    player.contract_until ??
    player.contract_end ??
    '–'
  );
}

export default function Squad({
  players,
  accessToken,
  apiBase,
  onBack,
  onOpenPlayer,
  onArchived
}: Props) {
  const [archivingId, setArchivingId] =
    React.useState<number | string | null>(null);

  const [archiveError, setArchiveError] =
    React.useState<string | undefined>();


  const [archiveSuccess, setArchiveSuccess] =
    React.useState<string | undefined>();


  const [pendingArchivePlayer, setPendingArchivePlayer] =
    React.useState<Player | null>(null);

  const [syncingSquad, setSyncingSquad] =
    React.useState(false);

  const [syncResult, setSyncResult] =
    React.useState<{
      sourceCount: number;
      createdCount: number;
      updatedCount: number;
      failedCount: number;
    } | null>(null);

  const [search, setSearch] =
    React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState('Alle');
  const [positionFilter, setPositionFilter] =
    React.useState<PositionGroup | 'Alle'>('Alle');

  async function syncSquadFromTransfermarkt() {
    if (!accessToken) {
      setArchiveError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    setSyncingSquad(true);
    setArchiveError(undefined);
    setArchiveSuccess(undefined);
    setSyncResult(null);

    try {
      const response =
        await fetch(
          `${apiBase}/squad/sync-transfermarkt`,
          {
            method: 'POST',
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
          'Kader konnte nicht synchronisiert werden.'
        );
      }

      setSyncResult({
        sourceCount:
          data.source_count ?? 0,
        createdCount:
          data.created_count ?? 0,
        updatedCount:
          data.updated_count ?? 0,
        failedCount:
          data.failed_count ?? 0
      });

      setArchiveSuccess(
        `Transfermarkt-Kader synchronisiert: ${data.created_count ?? 0} neu, ${data.updated_count ?? 0} aktualisiert.`
      );

      await onArchived?.();
    } catch (error) {
      setArchiveError(
        error instanceof Error
          ? error.message
          : 'Kader-Synchronisierung fehlgeschlagen.'
      );
    } finally {
      setSyncingSquad(false);
    }
  }

  async function archivePlayer(
    player: Player
  ) {
    if (!accessToken) {
      setArchiveError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    setArchivingId(player.id);
    setArchiveError(undefined);
    setArchiveSuccess(undefined);

    try {
      const response =
        await fetch(
          `${apiBase}/squad/${player.id}/archive`,
          {
            method: 'PUT',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({})
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

      setPendingArchivePlayer(null);
      setArchiveSuccess(
        `${player.name ?? 'Spieler'} wurde ins Spielerarchiv verschoben.`
      );
      await onArchived?.();
    } catch (error) {
      setArchiveError(
        error instanceof Error
          ? error.message
          : 'Archivieren fehlgeschlagen.'
      );
    } finally {
      setArchivingId(null);
    }
  }

  const allOwnSquad =
    players.filter(
      player =>
        Boolean(
          (player as Player & {
            is_own_squad?: boolean;
          }).is_own_squad
        )
    );

  const squadStatuses =
    [
      'Alle',
      ...Array.from(
        new Set(
          allOwnSquad
            .map(player => player.squad_status)
            .filter((value): value is string => Boolean(value))
        )
      )
    ];

  const ownSquad =
    allOwnSquad.filter(player => {
      const query =
        search.trim().toLocaleLowerCase('de');

      const matchesSearch =
        !query ||
        [
          player.name,
          player.primary_position,
          player.current_club,
          player.nationality,
          player.player_role
        ]
          .filter(Boolean)
          .some(value =>
            String(value)
              .toLocaleLowerCase('de')
              .includes(query)
          );

      const matchesStatus =
        statusFilter === 'Alle' ||
        player.squad_status === statusFilter;

      const matchesPosition =
        positionFilter === 'Alle' ||
        positionGroup(
          player.primary_position
        ) === positionFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPosition
      );
    });

  const groupCounts:
    Record<PositionGroup, number> = {
    Torwart: 0,
    Abwehr: 0,
    Mittelfeld: 0,
    Angriff: 0,
    Sonstige: 0
  };

  for (
    const player
    of allOwnSquad
  ) {
    groupCounts[
      positionGroup(
        player.primary_position
      )
    ] += 1;
  }

  const loanedCount =
    allOwnSquad.filter(
      player =>
        player.squad_status ===
        'Ausgeliehen'
    ).length;

  const expiringSoonCount =
    allOwnSquad.filter(
      player => {
        const raw =
          player.contract_until ??
          player.contract_end;

        if (!raw) {
          return false;
        }

        const end =
          new Date(raw);

        if (
          Number.isNaN(
            end.getTime()
          )
        ) {
          return false;
        }

        const now =
          new Date();

        const withinTwelveMonths =
          new Date(now);

        withinTwelveMonths.setFullYear(
          withinTwelveMonths.getFullYear() +
          1
        );

        return (
          end >= now &&
          end <= withinTwelveMonths
        );
      }
    ).length;

  const groups:
    Record<PositionGroup, Player[]> = {
    Torwart: [],
    Abwehr: [],
    Mittelfeld: [],
    Angriff: [],
    Sonstige: []
  };

  for (const player of ownSquad) {
    groups[
      positionGroup(
        player.primary_position
      )
    ].push(player);
  }

  for (const key of Object.keys(groups) as PositionGroup[]) {
    groups[key].sort((a, b) => {
      const jerseyA = Number(
        (a as Player & {
          jersey_number?: string;
        }).jersey_number
      );

      const jerseyB = Number(
        (b as Player & {
          jersey_number?: string;
        }).jersey_number
      );

      if (
        Number.isFinite(jerseyA) &&
        Number.isFinite(jerseyB)
      ) {
        return jerseyA - jerseyB;
      }

      return String(
        a.name ?? ''
      ).localeCompare(
        String(
          b.name ?? ''
        ),
        'de'
      );
    });
  }

  const order:
    PositionGroup[] = [
      'Torwart',
      'Abwehr',
      'Mittelfeld',
      'Angriff',
      'Sonstige'
    ];

  return (
    <main className="page">
      <PageHeader
        title="Unser Kader"
        description="Aktueller SV-Ried-Kader mit internen Spielerprofilen."
        onBack={onBack}
        meta={
          <>
            <span>
              {allOwnSquad.length} Kaderspieler
            </span>
            <span>·</span>
            <span>
              Torwart · Abwehr · Mittelfeld · Angriff
            </span>
          </>
        }
        actions={
          <button
            type="button"
            onClick={
              syncSquadFromTransfermarkt
            }
            disabled={
              syncingSquad
            }
            style={syncButton}
          >
            {syncingSquad
              ? 'Kader wird synchronisiert…'
              : 'Kader mit Transfermarkt synchronisieren'}
          </button>
        }
      />

      <section style={overviewGrid}>
        <SquadOverviewCard
          label="Gesamt"
          value={allOwnSquad.length}
          active={
            positionFilter ===
            'Alle'
          }
          onClick={() =>
            setPositionFilter(
              'Alle'
            )
          }
        />

        <SquadOverviewCard
          label="Torwart"
          value={
            groupCounts.Torwart
          }
          active={
            positionFilter ===
            'Torwart'
          }
          onClick={() =>
            setPositionFilter(
              'Torwart'
            )
          }
        />

        <SquadOverviewCard
          label="Abwehr"
          value={
            groupCounts.Abwehr
          }
          active={
            positionFilter ===
            'Abwehr'
          }
          onClick={() =>
            setPositionFilter(
              'Abwehr'
            )
          }
        />

        <SquadOverviewCard
          label="Mittelfeld"
          value={
            groupCounts.Mittelfeld
          }
          active={
            positionFilter ===
            'Mittelfeld'
          }
          onClick={() =>
            setPositionFilter(
              'Mittelfeld'
            )
          }
        />

        <SquadOverviewCard
          label="Angriff"
          value={
            groupCounts.Angriff
          }
          active={
            positionFilter ===
            'Angriff'
          }
          onClick={() =>
            setPositionFilter(
              'Angriff'
            )
          }
        />

        <SquadInfoCard
          label="Ausgeliehen"
          value={loanedCount}
        />

        <SquadInfoCard
          label="Vertrag ≤ 12 Mon."
          value={
            expiringSoonCount
          }
        />
      </section>

      {syncResult && (
        <section
          style={{
            ...syncBox,
            marginTop: '14px'
          }}
        >
          <strong>
            Transfermarkt-Synchronisierung
          </strong>

          <div
            style={{
              marginTop: '6px',
              fontSize: '13px'
            }}
          >
            Transfermarkt: {syncResult.sourceCount} Spieler ·
            {' '}Neu: {syncResult.createdCount} ·
            {' '}Aktualisiert: {syncResult.updatedCount} ·
            {' '}Fehler: {syncResult.failedCount}
          </div>

          <div
            style={{
              marginTop: '5px',
              color: '#5f665f',
              fontSize: '12px'
            }}
          >
            Nicht gelistete Spieler werden nicht automatisch aus dem Kader entfernt.
          </div>
        </section>
      )}

      <section
        style={{
          ...panel,
          marginTop: '14px'
        }}
      >
        <div style={squadFilterGrid}>
          <label>
            <div style={filterLabel}>Suche</div>
            <input
              value={search}
              onChange={event =>
                setSearch(event.target.value)
              }
              placeholder="Name, Position, Rolle, Verein …"
              style={filterControl}
            />
          </label>

          <label>
            <div style={filterLabel}>Status</div>
            <select
              value={statusFilter}
              onChange={event =>
                setStatusFilter(
                  event.target.value
                )
              }
              style={filterControl}
            >
              {squadStatuses.map(status => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={filterLabel}>Bereich</div>
            <select
              value={positionFilter}
              onChange={event =>
                setPositionFilter(
                  event.target.value as
                    PositionGroup |
                    'Alle'
                )
              }
              style={filterControl}
            >
              <option value="Alle">Alle</option>
              <option value="Torwart">Torwart</option>
              <option value="Abwehr">Abwehr</option>
              <option value="Mittelfeld">Mittelfeld</option>
              <option value="Angriff">Angriff</option>
              <option value="Sonstige">Sonstige</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('Alle');
              setPositionFilter('Alle');
            }}
            style={secondaryButton}
          >
            Zurücksetzen
          </button>
        </div>
      </section>

      {pendingArchivePlayer && (
        <section
          style={{
            ...confirmBox,
            marginTop: '14px'
          }}
        >
          <div>
            <strong>
              {pendingArchivePlayer.name}
              {' '}aus dem Kader entfernen?
            </strong>

            <div
              style={{
                marginTop: '5px',
                color: '#6b5a35',
                fontSize: '13px'
              }}
            >
              Der Spieler wird nicht gelöscht, sondern ins Spielerarchiv verschoben.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={() =>
                setPendingArchivePlayer(
                  null
                )
              }
              disabled={archivingId != null}
              style={secondaryButton}
            >
              Abbrechen
            </button>

            <button
              type="button"
              onClick={() =>
                archivePlayer(
                  pendingArchivePlayer
                )
              }
              disabled={archivingId != null}
              style={archiveButton}
            >
              {archivingId != null
                ? 'Wird archiviert…'
                : 'Ja, ins Archiv'}
            </button>
          </div>
        </section>
      )}

      {archiveSuccess && (
        <section style={successBox}>
          {archiveSuccess}
        </section>
      )}

      {archiveError && (
        <section style={errorBox}>
          {archiveError}
        </section>
      )}

      {ownSquad.length === 0 && (
        <section
          style={{
            ...panel,
            marginTop: '20px'
          }}
        >
          Aktuell sind keine Spieler mit
          <strong> is_own_squad = true </strong>
          gespeichert.
        </section>
      )}

      {order.map(group => {
        const items =
          groups[group];

        if (
          items.length === 0
        ) {
          return null;
        }

        return (
          <section
            key={group}
            style={{
              marginTop: '24px'
            }}
          >
            <h2
              style={{
                marginBottom:
                  '12px'
              }}
            >
              {group}
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(310px, 1fr))',
                gap: '14px'
              }}
            >
              {items.map(player => {
                const extended =
                  player as Player & {
                    jersey_number?: string;
                    player_role?: string;
                  };

                return (
                  <article
                    key={player.id}
                    style={playerCard}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '14px',
                        alignItems:
                          'center'
                      }}
                    >
                      <div
                        style={{
                          width: '72px',
                          height: '90px',
                          borderRadius:
                            '10px',
                          overflow:
                            'hidden',
                          background:
                            '#f1f1f1',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center'
                        }}
                      >
                        <PlayerImage
                          playerId={
                            player.id
                          }
                          imagePath={
                            player.image_path
                          }
                          accessToken={
                            accessToken
                          }
                          apiBase={
                            apiBase
                          }
                          alt={
                            player.name ??
                            'Spieler'
                          }
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          fallback={
                            <span
                              style={{
                                fontSize: '26px'
                              }}
                            >
                              👤
                            </span>
                          }
                        />
                      </div>

                      <div
                        style={{
                          minWidth: 0,
                          flex: 1
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            gap: '8px',
                            alignItems:
                              'center'
                          }}
                        >
                          {extended
                            .jersey_number && (
                            <span
                              style={{
                                background:
                                  '#0b7a3b',
                                color:
                                  '#fff',
                                borderRadius:
                                  '7px',
                                padding:
                                  '3px 7px',
                                fontWeight:
                                  700,
                                fontSize:
                                  '12px'
                              }}
                            >
                              {
                                extended
                                  .jersey_number
                              }
                            </span>
                          )}

                          <strong
                            style={{
                              fontSize:
                                '18px',
                              overflow:
                                'hidden',
                              textOverflow:
                                'ellipsis',
                              whiteSpace:
                                'nowrap'
                            }}
                          >
                            {player.name ??
                              `Spieler ${player.id}`}
                          </strong>
                        </div>

                        <div
                          style={{
                            marginTop:
                              '6px',
                            color:
                              '#555',
                            fontSize:
                              '14px'
                          }}
                        >
                          {player.primary_position ??
                            '–'}
                        </div>

                        {extended
                          .player_role && (
                          <div
                            style={{
                              marginTop:
                                '3px',
                              color:
                                '#777',
                              fontSize:
                                '12px'
                            }}
                          >
                            {
                              extended
                                .player_role
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop:
                          '14px',
                        paddingTop:
                          '12px',
                        borderTop:
                          '1px solid #eee',
                        fontSize:
                          '13px'
                      }}
                    >
                      <div>
                        <span
                          style={{
                            color:
                              '#777'
                          }}
                        >
                          Vertrag bis:{' '}
                        </span>

                        <strong>
                          {displayContract(
                            player
                          )}
                        </strong>
                      </div>

                      {player.squad_status && (
                        <div
                          style={{
                            marginTop:
                              '4px'
                          }}
                        >
                          <span
                            style={{
                              color:
                                '#777'
                            }}
                          >
                            Status:{' '}
                          </span>

                          <strong>
                            {
                              player.squad_status
                            }
                          </strong>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginTop: '14px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onOpenPlayer(player)
                        }
                        style={secondaryButton}
                      >
                        Profil öffnen
                      </button>

                      <button
                        type="button"
                        disabled={
                          String(archivingId) ===
                          String(player.id)
                        }
                        onClick={() =>
                          setPendingArchivePlayer(
                            player
                          )
                        }
                        style={archiveButton}
                      >
                        {String(archivingId) ===
                        String(player.id)
                          ? 'Archiviert…'
                          : 'Aus Kader entfernen'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}


function SquadOverviewCard({
  label,
  value,
  active,
  onClick
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...overviewCard,
        ...(active
          ? overviewCardActive
          : {})
      }}
    >
      <span
        style={{
          ...overviewLabel,
          ...(active
            ? overviewLabelActive
            : {})
        }}
      >
        {label}
      </span>

      <strong
        style={{
          ...overviewValue,
          ...(active
            ? overviewValueActive
            : {})
        }}
      >
        {value}
      </strong>
    </button>
  );
}

function SquadInfoCard({
  label,
  value
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={overviewInfoCard}>
      <span style={overviewLabel}>
        {label}
      </span>

      <strong style={overviewValue}>
        {value}
      </strong>
    </div>
  );
}


const overviewGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '10px',
  marginTop: '14px'
};

const overviewCard: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid #e2e6e2',
  borderRadius: '12px',
  background: '#fff',
  padding: '12px 14px',
  textAlign: 'left',
  cursor: 'pointer',
  font: 'inherit'
};

const overviewCardActive: React.CSSProperties = {
  background: '#0b7a3b',
  borderColor: '#0b7a3b'
};

const overviewInfoCard: React.CSSProperties = {
  border: '1px solid #e2e6e2',
  borderRadius: '12px',
  background: '#f8f9f8',
  padding: '12px 14px'
};

const overviewLabel: React.CSSProperties = {
  display: 'block',
  color: '#7c827c',
  fontSize: '9px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.05em'
};

const overviewLabelActive: React.CSSProperties = {
  color: 'rgba(255,255,255,.78)'
};

const overviewValue: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  color: '#161616',
  fontSize: '22px',
  lineHeight: 1
};

const overviewValueActive: React.CSSProperties = {
  color: '#fff'
};

const squadFilterGrid:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(170px, 1fr))',
  gap: '10px',
  alignItems: 'end'
};

const filterLabel:
  React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 800,
  color: '#666',
  marginBottom: '6px',
  textTransform: 'uppercase'
};

const filterControl:
  React.CSSProperties = {
  width: '100%',
  minHeight: '42px',
  boxSizing: 'border-box',
  border: '1px solid #d3d6d3',
  borderRadius: '9px',
  padding: '10px',
  background: '#fff',
  font: 'inherit'
};

const panel:
  React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '14px',
  padding: '18px',
  border:
    '1px solid #ececec',
  boxShadow:
    '0 3px 14px rgba(0,0,0,0.04)'
};

const syncButton:
  React.CSSProperties = {
  border:
    '1px solid #9cc8ad',
  background:
    '#f4faf6',
  color:
    '#0b6b35',
  padding:
    '10px 14px',
  borderRadius:
    '9px',
  cursor:
    'pointer',
  fontWeight:
    800,
  fontSize:
    '12px'
};

const syncBox:
  React.CSSProperties = {
  background:
    '#f4faf6',
  border:
    '1px solid #b9d9c7',
  color:
    '#174f31',
  borderRadius:
    '12px',
  padding:
    '14px'
};

const secondaryButton:
  React.CSSProperties = {
  border:
    '1px solid #d0d0d0',
  background:
    '#ffffff',
  color:
    '#222222',
  padding:
    '12px 18px',
  borderRadius:
    '10px',
  cursor:
    'pointer',
  fontWeight:
    700
};

const playerCard:
  React.CSSProperties = {
  appearance: 'none',
  width: '100%',
  textAlign: 'left',
  background: '#ffffff',
  borderRadius: '14px',
  padding: '18px',
  boxShadow:
    '0 3px 14px rgba(0,0,0,0.06)',
  border:
    '1px solid #ececec',
  cursor: 'pointer',
  color: 'inherit',
  font: 'inherit'
};

const archiveButton: React.CSSProperties = {
  ...secondaryButton,
  color: '#8a5500',
  borderColor: '#e2c98d'
};

const errorBox: React.CSSProperties = {
  marginTop: '14px',
  padding: '12px 16px',
  background: '#fff3f3',
  color: '#a00000',
  borderRadius: '10px'
};

const confirmBox: React.CSSProperties = {
  background: '#fffaf0',
  border: '1px solid #e2c98d',
  borderRadius: '12px',
  padding: '14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap'
};

const successBox: React.CSSProperties = {
  marginTop: '14px',
  padding: '12px 16px',
  background: '#eef9f2',
  color: '#0b6b35',
  borderRadius: '10px'
};
