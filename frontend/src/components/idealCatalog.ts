export type IdealHighlightState =
  | ''
  | '1'
  | '2';

export type IdealCriterionRating = {
  status_quo: string;
  potential: string;
  highlights_status_quo:
    Record<string, IdealHighlightState>;
  highlights_potential:
    Record<string, IdealHighlightState>;
};

export type IdealDetailRatings = {
  criteria: Record<
    string,
    IdealCriterionRating
  >;
};

export type IdealScoreForm = {
  ideal_code: string;
  status_quo: string;
  potential: string;
  rating: string;
  measured_value: string;
  notes: string;
  detail_ratings:
    IdealDetailRatings;
};

export type IdealCriterion = {
  id: string;
  description: string;
  highlights: string[];
};

export type IdealDefinition = {
  code: string;
  title: string;
  group:
    | 'Offensive'
    | 'Defensive'
    | 'Haltung'
    | 'Körper';
  criteria: IdealCriterion[];
};

export const IDEAL_CATALOG:
  IdealDefinition[] = [
  {
    code: 'OFF1',
    title: 'Rücken finden',
    group: 'Offensive',
    criteria: [
      {
        id: 'passes',
        description:
          'Der Spieler findet oft und erfolgsstabil den Rücken des Gegners über Pässe',
        highlights: [
          'Pässe gegen die Schieberichtung (Ballferner Rücken)',
          'Flache Diagonalpässe',
          'Diagonaler Chipball',
          'Flache Vertikalpässe',
          'Vertikale Chipbälle',
          'Flache Ablage'
        ]
      },
      {
        id: 'dribblings',
        description:
          'Der Spieler findet oft und erfolgsstabil den Rücken des Gegners über Dribblings',
        highlights: [
          'Dribblings gegen die Schieberichtung (Ballferner Rücken)',
          'Eindribbeln',
          'Überdribbeln (1vX)'
        ]
      },
      {
        id: 'behind_defence',
        description:
          'Der Spieler bietet sich häufig und unter gutem Verhalten in den Parametern Ti-Te-Ri in den Rücken der gegnerischen Abwehr an',
        highlights: [
          'Moment',
          'Explosivität',
          'Schnelligkeit'
        ]
      },
      {
        id: 'between_backs',
        description:
          'Der Spieler bietet sich häufig und mit gutem Verhalten in den Parametern Po-Ti-Ri-Te zwischen den Rücken des Gegners an',
        highlights: [
          'Immer Rücken anspielbar',
          'Blindside',
          'Moment'
        ]
      },
      {
        id: 'box_finish',
        description:
          'Im Strafraum: Der Spieler hat oft die Möglichkeit den Rücken des Torhüters zu finden und schafft dies erfolgsstabil',
        highlights: [
          'Abschluss aus goldener Zone',
          'Abschlüsse außerhalb der goldenen Zone',
          '1-Kontakt-Schuss',
          'Mehr-Kontakt-Schuss',
          'Volley',
          'Kopfball'
        ]
      },
      {
        id: 'chance_creation',
        description:
          'Der Spieler kommt oft zur Möglichkeit seinen Mitspielern Torchancen aufzulegen',
        highlights: [
          'Pässe zum Torschuss (Assistzone/Steckpass)',
          'Dribblings zum Torschuss (Selbst/Mitspieler)',
          'Flanke',
          'Parallelball',
          'Cutback',
          'Steckpass'
        ]
      }
    ]
  },
  {
    code: 'OFF2',
    title: 'Manipulieren',
    group: 'Offensive',
    criteria: [
      {
        id: 'with_ball',
        description:
          'Der Spieler kann den Gegner mit dem Ball am Fuß auf individueller Basis manipulieren',
        highlights: [
          'Andribbeln',
          'Finte',
          '1. Kontakt',
          'Körperposition',
          'Blickrichtung',
          'Deuten'
        ]
      },
      {
        id: 'without_ball',
        description:
          'Der Spieler kann den Gegner ohne Ball am Fuß auf individueller Basis manipulieren',
        highlights: [
          'Lauffinte',
          'Positionierung',
          'Körperposition',
          'Doppelbewegung'
        ]
      },
      {
        id: 'with_teammates',
        description:
          'Der Spieler erkennt Situationen mit oder ohne Ball am Fuß, wo er mit Hilfe seiner Mitspieler den Gegner manipulieren kann',
        highlights: [
          'Lockpässe',
          'Nächste Aktion mitdenken'
        ]
      }
    ]
  },
  {
    code: 'OFF3',
    title: 'Ball als Verbündeter',
    group: 'Offensive',
    criteria: [
      {
        id: 'passing',
        description:
          'Der Spieler kann den Ball gut auf verschiedene Art & Weise passen und ist dabei technisch sauber',
        highlights: [
          'Flachpass',
          'Chipball',
          'Englischer',
          'Beidbeinigkeit',
          'Flanken'
        ]
      },
      {
        id: 'control',
        description:
          'Der Spieler kann den Ball stets kontrollieren und verliert selten die Kontrolle über das Spielgerät',
        highlights: [
          'Mitnahme/1. Kontakt',
          'Ballsicherung',
          'Ballsicherung zum Tor'
        ]
      },
      {
        id: 'tempo_dribbling',
        description:
          'Der Spieler kann gut mit Tempo dribbeln, dabei die Richtung wechseln und Raum sowie Gegner überspielen',
        highlights: [
          'Fintieren',
          'Andribbeln',
          'Richtungswechsel'
        ]
      },
      {
        id: 'finishing',
        description:
          'Der Spieler kann auf verschiedene Arten abschließen',
        highlights: [
          'Nahdistanz',
          'Langdistanz',
          'Volley',
          'Kopfball',
          'Beidbeinigkeit'
        ]
      },
      {
        id: 'execution',
        description:
          'Der Spieler hat einen hohen Anspruch an seine Ausführung und will den Ball stets nicht nur haben sondern technisch sauber spielen',
        highlights: [
          'Ballforderung',
          'Lösungen sind anspruchsvoll'
        ]
      }
    ]
  },
  {
    code: 'OFF4',
    title: 'Standards',
    group: 'Offensive',
    criteria: [
      {
        id: 'taking_set_pieces',
        description:
          'Der Spieler kann Standards aller Art schießen',
        highlights: [
          'Ecken',
          'Freistöße direkt',
          'Freistöße seitlich',
          'Einwürfe'
        ]
      },
      {
        id: 'target_player',
        description:
          'Der Spieler kann bei Standards als Zielspieler eingesetzt werden und entwickelt dabei konstant Torgefahr',
        highlights: [
          'Kopfball',
          '2. Phase'
        ]
      },
      {
        id: 'extra_tasks',
        description:
          'Der Spieler kann Zusatzaufgaben wie Fake Runs oder das Absichern übernehmen',
        highlights: [
          'Manipulieren',
          'Absichern'
        ]
      }
    ]
  },
  {
    code: 'DEF1',
    title:
      'Rücken sichern und Bälle erobern',
    group: 'Defensive',
    criteria: [
      {
        id: 'loss_reaction',
        description:
          'Der Spieler kommt bei Ballverlusten schnell in seine Startposition und steht dabei im Mannschaftskontext auch taktisch richtig',
        highlights: [
          'Aufmerksamkeit',
          'Angebot geben',
          'Startposition halb-halb',
          'Mentalität'
        ]
      },
      {
        id: 'ball_pressure',
        description:
          'Der Spieler schafft es häufig und erfolgsstabil Druck auf den Ball herzustellen und kommt dabei häufig in den Zweikampf',
        highlights: [
          'Am Sprung sein / Springen',
          '1. Sprint / 2. Sprint',
          'Vordecken',
          'Explosivität'
        ]
      },
      {
        id: 'cover_back',
        description:
          'Der Spieler kann den Rücken seiner Mitspieler absichern',
        highlights: [
          'Durchschieben',
          'Tiefensicherung'
        ]
      },
      {
        id: 'compactness',
        description:
          'Der Spieler stellt konstant die Kompaktheit seiner Mannschaft von vorne (Schließen) oder von hinten (Nachrücken) her',
        highlights: [
          'Nachrücken',
          'Schließen',
          'Durchdecken'
        ]
      },
      {
        id: 'win_ball',
        description:
          'Der Spieler schafft es konstant Bälle selbst zu erobern',
        highlights: [
          'Stempeln',
          'Dazukommen'
        ]
      }
    ]
  },
  {
    code: 'DEF2',
    title: 'Manipulieren ohne Ball',
    group: 'Defensive',
    criteria: [
      {
        id: 'predictability',
        description:
          'Der Spieler schafft es das Spiel für seine Mitspieler vorhersehbar zu machen, damit sie in die Balleroberung kommen',
        highlights: [
          'Deckungschatten aufbauen',
          'Tempo & Richtung variieren'
        ]
      },
      {
        id: 'duel',
        description:
          'Der Spieler kommt ins Duell, indem er auf Basis der Parameter Po-Ti-Ri-Te richtig agiert',
        highlights: [
          'Offenen Ball provozieren',
          'Timing Stempeln',
          'Balldieb sein',
          'Blindside attackieren'
        ]
      }
    ]
  },
  {
    code: 'DEF3',
    title:
      'Ball gehört uns und Tor verteidigen',
    group: 'Defensive',
    criteria: [
      {
        id: 'ball_hunter',
        description:
          'Der Spieler hat den Drang den Ball in der Mannschaft zu haben und ist Balljäger',
        highlights: [
          'Drin bleiben',
          'Stempeln',
          'Dazukommen'
        ]
      },
      {
        id: 'defend_goal',
        description:
          'Der Spieler hat einen hohen Drang das eigene Tor zu verteidigen',
        highlights: [
          'Blocken',
          'Klärung',
          'Schließen'
        ]
      }
    ]
  },
  {
    code: 'DEF4',
    title: 'Standards verteidigen',
    group: 'Defensive',
    criteria: [
      {
        id: 'clear_set_piece',
        description:
          'Der Spieler schafft es den Ball zu attackieren und Standards des Gegners zu klären',
        highlights: [
          'Kopfball',
          'Klärung',
          '2. Phase'
        ]
      },
      {
        id: 'block_runs',
        description:
          'Der Spieler kann Gegner in ihren Laufwegen blocken',
        highlights: [
          'Blocken',
          'Stören'
        ]
      },
      {
        id: 'extra_tasks',
        description:
          'Der Spieler kann Zusatzaufgaben wie eine Konterrolle oder Strafraumsicherung übernehmen',
        highlights: [
          'Kontern',
          'Absichern'
        ]
      }
    ]
  },
  {
    code: 'H1',
    title: 'Kampf',
    group: 'Haltung',
    criteria: [
      {
        id: 'team',
        description:
          'Der Spieler hat das Team im Kopf und ordnet sich dem Team unter',
        highlights: [
          'Verantwortung für das Team',
          'Hilfsbereitschaft',
          'Zuverlässigkeit',
          'Disziplin',
          'Identifikation mit der SV Ried'
        ]
      },
      {
        id: 'self_demand',
        description:
          'Der Spieler hat den höchsten Anspruch an sich selbst und will sich ständig verbessern',
        highlights: [
          'Anspruch',
          'Mehr als nötig tun',
          'Coachability'
        ]
      },
      {
        id: 'challenge',
        description:
          'Der Spieler sieht den Mehrwert und das Glück in persönlichen Herausforderungen und will Hindernisse überwinden',
        highlights: [
          'Leidenschaft',
          'Kampfbereitschaft',
          'Resilienz'
        ]
      }
    ]
  },
  {
    code: 'H2',
    title: 'Kunst',
    group: 'Haltung',
    criteria: [
      {
        id: 'individuality',
        description:
          'Der Spieler ist mutig genug seine Persönlichkeit/Individualität auf verschiedene Arten auszuleben',
        highlights: [
          'Verhalten auf dem Platz',
          'Verhalten abseits des Platzes',
          'Äußerlichkeit'
        ]
      },
      {
        id: 'opinion',
        description:
          'Der Spieler ist meinungsstark',
        highlights: [
          'Meinungen haben und äußern',
          'Auf Meinungen bestehen',
          'Konflikte führen & aushalten'
        ]
      },
      {
        id: 'creativity',
        description:
          'Der Spieler hat kreative Lösungen auf und neben dem Platz und ist unkonventionell',
        highlights: [
          'Kreativität auf dem Platz',
          'Kreative Ideen für die Gruppe'
        ]
      }
    ]
  },
  {
    code: 'K1',
    title: 'Fix',
    group: 'Körper',
    criteria: [
      {
        id: 'age',
        description: 'Alter',
        highlights: []
      },
      {
        id: 'height',
        description: 'Größe',
        highlights: []
      },
      {
        id: 'injury_history',
        description:
          'Verletzungsgeschichte',
        highlights: []
      }
    ]
  },
  {
    code: 'K2',
    title: 'Variabel',
    group: 'Körper',
    criteria: [
      {
        id: 'bmi',
        description: 'BMI',
        highlights: []
      },
      {
        id: 'body_fat',
        description: '% Körperfett',
        highlights: []
      },
      {
        id: 'deadlift',
        description:
          'Maximalkraft Kreuzheben',
        highlights: []
      },
      {
        id: 'bench_press',
        description:
          'Maximalkraft Bankdrücken',
        highlights: []
      },
      {
        id: 'nordic',
        description:
          'Maximalkraft Nordic Hamstring',
        highlights: []
      },
      {
        id: 'max_speed',
        description: 'Max Speed',
        highlights: []
      },
      {
        id: 'sprint_10m',
        description: '10m Sprintzeit',
        highlights: []
      },
      {
        id: 'cmj',
        description:
          'Sprunghöhe Counter Movement Jump ohne Arme',
        highlights: []
      },
      {
        id: 'endurance',
        description: 'Ausdauer',
        highlights: []
      }
    ]
  }
];

export const IDEAL_CODES =
  IDEAL_CATALOG.map(
    ideal => ideal.code
  );

function emptyCriterion(
  highlights: string[]
): IdealCriterionRating {
  return {
    status_quo: '',
    potential: '',
    highlights_status_quo:
      Object.fromEntries(
        highlights.map(item => [
          item,
          ''
        ])
      ),
    highlights_potential:
      Object.fromEntries(
        highlights.map(item => [
          item,
          ''
        ])
      )
  };
}

export function createIdealDetailRatings(
  idealCode: string
): IdealDetailRatings {
  const definition =
    IDEAL_CATALOG.find(
      item =>
        item.code ===
        idealCode
    );

  return {
    criteria:
      Object.fromEntries(
        (definition?.criteria ?? [])
          .map(criterion => [
            criterion.id,
            emptyCriterion(
              criterion.highlights
            )
          ])
      )
  };
}

export function createIdealScoreForms():
  IdealScoreForm[] {
  return IDEAL_CATALOG.map(
    ideal => ({
      ideal_code:
        ideal.code,
      status_quo: '50',
      potential: '70',
      rating: '',
      measured_value: '',
      notes: '',
      detail_ratings:
        createIdealDetailRatings(
          ideal.code
        )
    })
  );
}

export function normalizeDetailRatings(
  idealCode: string,
  source: unknown
): IdealDetailRatings {
  const base =
    createIdealDetailRatings(
      idealCode
    );

  if (
    !source ||
    typeof source !== 'object'
  ) {
    return base;
  }

  const incoming =
    source as {
      criteria?: Record<
        string,
        Partial<IdealCriterionRating>
      >;
    };

  Object.entries(
    base.criteria
  ).forEach(
    ([criterionId, target]) => {
      const current =
        incoming.criteria?.[
          criterionId
        ];

      if (!current) {
        return;
      }

      target.status_quo =
        current.status_quo != null
          ? String(
              current.status_quo
            )
          : '';

      target.potential =
        current.potential != null
          ? String(
              current.potential
            )
          : '';

      if (
        current.highlights_status_quo &&
        typeof current.highlights_status_quo ===
          'object'
      ) {
        Object.keys(
          target.highlights_status_quo
        ).forEach(label => {
          const value =
            current.highlights_status_quo?.[
              label
            ];

          target.highlights_status_quo[
            label
          ] =
            value === '1' ||
            value === '2'
              ? value
              : '';
        });
      }

      if (
        current.highlights_potential &&
        typeof current.highlights_potential ===
          'object'
      ) {
        Object.keys(
          target.highlights_potential
        ).forEach(label => {
          const value =
            current.highlights_potential?.[
              label
            ];

          target.highlights_potential[
            label
          ] =
            value === '1' ||
            value === '2'
              ? value
              : '';
        });
      }
    }
  );

  return base;
}
