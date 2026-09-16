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
    value.includes('angriff') ||
    value.includes('offensiv') ||
    value.includes('winger') ||
    value.includes('forward') ||
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

  async function archivePlayer(
    player: Player
  ) {
    if (!accessToken) {
      setArchiveError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    const confirmed =
      window.confirm(
        `${player.name ?? 'Spieler'} aus dem Kader entfernen und ins Spielerarchiv verschieben?`
      );

    if (!confirmed) {
      return;
    }

    setArchivingId(player.id);
    setArchiveError(undefined);

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
  const ownSquad =
    players.filter(
      player =>
        Boolean(
          (player as Player & {
            is_own_squad?: boolean;
          }).is_own_squad
        )
    );

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
      <section className="hero">
        <div>
          <div className="eyebrow">
            SV Oberbank Ried
          </div>

          <h1>Unser Kader</h1>

          <p>
            Aktueller SV-Ried-Kader in VikingVision
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          style={secondaryButton}
        >
          ← Dashboard
        </button>
      </section>

      <section
        className="status"
        style={{
          marginTop: '18px'
        }}
      >
        <span>
          Kaderspieler:{' '}
          <strong>
            {ownSquad.length}
          </strong>
        </span>

        <span>
          Datenquelle:{' '}
          <strong>
            players.is_own_squad
          </strong>
        </span>
      </section>

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
                  'repeat(auto-fill, minmax(260px, 1fr))',
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
                          imagePath={
                            player.image_path
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
                          archivePlayer(player)
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
