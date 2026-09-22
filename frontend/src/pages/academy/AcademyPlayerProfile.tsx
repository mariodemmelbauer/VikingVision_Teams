import { useState } from 'react';
import SportSciencePanel from '../../components/SportSciencePanel';

type AcademyPlayer = {
  id: number;
  team: string;
  name: string;
  birth_date?: string;
  primary_position?: string;
  player_role?: string;
  preferred_foot?: string;
  jersey_number?: string;
  nationality?: string;
  height?: string;
  current_club?: string;
  squad_status?: string;
  notes?: string;
  boarding_school?: boolean;
  school_type?: string;
  school_class?: string;
  bus_use?: boolean;
  bus_route?: string;
  is_p12?: boolean;
};

type IdealScore = {
  assessment_id: number;
  ideal_code: string;
  status_quo?: number;
  potential?: number;
  notes?: string;
  measured_value?: string;
  rating?: number;
  detail_ratings?: Record<string, unknown>;
};

type IdealAssessment = {
  id: number;
  academy_player_id: number;
  period_label: string;
  assessment_date?: string;
  player_role?: string;
  player_name?: string;
  scores: IdealScore[];
};

type SportScienceTest = {
  id: number;
  academy_player_id?: number;
  p12_player_id?: number;
  player_name?: string;
  test_date: string;
  body_weight_kg?: number;
  body_fat_percent?: number;
  sprint_10m_seconds?: number;
  sprint_30m_seconds?: number;
  cmj_cm?: number;
  aerobic_value?: number;
  readiness?: string;
  notes?: string;
};

type SkillAcForm = {
  id: number;
  academy_player_id: number;
  player_name?: string;
  period_old?: string;
  period_new?: string;
  team_old?: string;
  team_new?: string;
  author_old?: string;
  author_new?: string;
  skill_old?: string;
  ac_old?: string;
  consequence_general?: string;
  skill_new?: string;
  ac_new?: string;
  reflection?: string;
  biggest_changes?: string;
};

type IdealScoreForm = {
  ideal_code: string;
  status_quo: string;
  potential: string;
  rating: string;
  measured_value: string;
  notes: string;
};

type ProfileTab =
  | 'stammdaten'
  | 'ideale'
  | 'sportScience'
  | 'skillAc';


const IDEAL_META = {
  OFF1: {
    label: 'Rücken finden',
    group: 'Mit Ball'
  },
  OFF2: {
    label: 'Manipulieren',
    group: 'Mit Ball'
  },
  OFF3: {
    label: 'Ball als Verbündeter',
    group: 'Mit Ball'
  },
  DEF1: {
    label: 'Rücken sichern & Ball erobern',
    group: 'Gegen den Ball'
  },
  DEF3: {
    label: 'Ball gehört uns & Tor verteidigen',
    group: 'Gegen den Ball'
  }
} as const;

const IDEAL_CODES = [
  'OFF1',
  'OFF2',
  'OFF3',
  'DEF1',
  'DEF3'
] as const;

export default function AcademyPlayerProfile({
  player,
  idealAssessments,
  sportScienceTests,
  skillAcForms,
  accessToken,
  apiBase,
  onSaved,
  onClose
}: {
  player: AcademyPlayer;
  idealAssessments: IdealAssessment[];
  sportScienceTests: SportScienceTest[];
  skillAcForms: SkillAcForm[];
  accessToken?: string;
  apiBase: string;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const [editing, setEditing] =
    useState(false);

  const [profileTab, setProfileTab] =
    useState<ProfileTab>('stammdaten');

  const [savingPlayer, setSavingPlayer] =
    useState(false);

  const [showSportScienceForm, setShowSportScienceForm] =
    useState(false);

  const [savingSportScience, setSavingSportScience] =
    useState(false);

  const [profileError, setProfileError] =
    useState<string | undefined>();

  const [profileSuccess, setProfileSuccess] =
    useState<string | undefined>();

  const [showIdealForm, setShowIdealForm] =
    useState(false);

  const [savingIdeal, setSavingIdeal] =
    useState(false);

  const [showSkillAcForm, setShowSkillAcForm] =
    useState(false);

  const [savingSkillAc, setSavingSkillAc] =
    useState(false);

  const [editingSkillAcId, setEditingSkillAcId] =
    useState<number | null>(null);

  const [skillAcForm, setSkillAcForm] =
    useState({
      period_old: '',
      period_new: '',
      team_old: player.team ?? '',
      team_new: player.team ?? '',
      author_old: '',
      author_new: '',
      skill_old: '',
      ac_old: '',
      consequence_general: '',
      skill_new: '',
      ac_new: '',
      reflection: '',
      biggest_changes: ''
    });

  const [editingIdealId, setEditingIdealId] =
    useState<number | null>(null);

  const [idealForm, setIdealForm] =
    useState({
      period_label: '',
      assessment_date:
        new Date()
          .toISOString()
          .slice(0, 10),
      player_role:
        player.player_role ?? '',
      scores: [
        {
          ideal_code: 'OFF1',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'OFF2',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'OFF3',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'DEF1',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'DEF3',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        }
      ] as IdealScoreForm[]
    });

  const [playerForm, setPlayerForm] =
    useState({
      name: player.name ?? '',
      birth_date: player.birth_date ?? '',
      primary_position:
        player.primary_position ?? '',
      player_role:
        player.player_role ?? '',
      preferred_foot:
        player.preferred_foot ?? '',
      jersey_number:
        player.jersey_number ?? '',
      nationality:
        player.nationality ?? '',
      height:
        player.height ?? '',
      current_club:
        player.current_club ?? '',
      squad_status:
        player.squad_status ?? '',
      school_type:
        player.school_type ?? '',
      school_class:
        player.school_class ?? '',
      boarding_school:
        Boolean(player.boarding_school),
      bus_use:
        Boolean(player.bus_use),
      bus_route:
        player.bus_route ?? 'KEINE',
      is_p12:
        Boolean(player.is_p12),
      notes:
        player.notes ?? ''
    });

  const [sportScienceForm, setSportScienceForm] =
    useState({
      test_date:
        new Date()
          .toISOString()
          .slice(0, 10),
      body_weight_kg: '',
      body_fat_percent: '',
      sprint_10m_seconds: '',
      sprint_30m_seconds: '',
      cmj_cm: '',
      aerobic_value: '',
      readiness: '',
      notes: ''
    });


  const playerIdeals =
    idealAssessments.filter(
      assessment =>
        String(
          assessment.academy_player_id
        ) === String(player.id)
    );

  const playerTests =
    sportScienceTests.filter(
      test =>
        String(
          test.academy_player_id
        ) === String(player.id)
    );

  const playerSkillAc =
    skillAcForms.filter(
      form =>
        String(
          form.academy_player_id
        ) === String(player.id)
    );



  const latestTest =
    [...playerTests].sort(
      (a, b) =>
        b.test_date.localeCompare(
          a.test_date
        )
    )[0];

  const latestIdeal =
    [...playerIdeals].sort(
      (a, b) =>
        String(
          b.assessment_date ?? ''
        ).localeCompare(
          String(
            a.assessment_date ?? ''
          )
        )
    )[0];


  const sortedIdeals =
    [...playerIdeals].sort(
      (a, b) =>
        String(
          b.assessment_date ?? ''
        ).localeCompare(
          String(
            a.assessment_date ?? ''
          )
        )
    );

  const previousIdeal =
    sortedIdeals[1];

  function getScoreValue(
    score?: IdealScore
  ) {
    if (!score) {
      return undefined;
    }

    return score.rating ??
      score.status_quo ??
      score.potential;
  }

  function getScoreByCode(
    assessment: IdealAssessment | undefined,
    code: string
  ) {
    return assessment?.scores.find(
      score =>
        score.ideal_code === code
    );
  }

  function getTrendForCode(
    code: string
  ) {
    const current =
      getScoreValue(
        getScoreByCode(
          latestIdeal,
          code
        )
      );

    const previous =
      getScoreValue(
        getScoreByCode(
          previousIdeal,
          code
        )
      );

    if (
      current == null ||
      previous == null
    ) {
      return null;
    }

    return current - previous;
  }


  const sortedTests =
    [...playerTests].sort(
      (a, b) =>
        b.test_date.localeCompare(
          a.test_date
        )
    );

  const latestSportTest =
    sortedTests[0];

  const previousSportTest =
    sortedTests[1];

  function getMetricTrend(
    current?: number,
    previous?: number,
    lowerIsBetter = false
  ) {
    if (
      current == null ||
      previous == null
    ) {
      return null;
    }

    const difference =
      Number(
        (current - previous)
          .toFixed(2)
      );

    if (difference === 0) {
      return {
        difference,
        improved: null
      };
    }

    return {
      difference,
      improved:
        lowerIsBetter
          ? current < previous
          : current > previous
    };
  }

  function updatePlayerField(
    field: keyof typeof playerForm,
    value: string | boolean
  ) {
    setPlayerForm(current => ({
      ...current,
      [field]: value
    }));
  }

  function updateSportScienceField(
    field: keyof typeof sportScienceForm,
    value: string
  ) {
    setSportScienceForm(current => ({
      ...current,
      [field]: value
    }));
  }

  async function savePlayer() {
    if (!accessToken) {
      setProfileError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    setSavingPlayer(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);

    try {
      const response =
        await fetch(
          `${apiBase}/academy/player/${player.id}`,
          {
            method: 'PUT',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              name:
                playerForm.name || null,
              birth_date:
                playerForm.birth_date || null,
              primary_position:
                playerForm.primary_position || null,
              player_role:
                playerForm.player_role || null,
              preferred_foot:
                playerForm.preferred_foot || null,
              jersey_number:
                playerForm.jersey_number || null,
              nationality:
                playerForm.nationality || null,
              height:
                playerForm.height || null,
              current_club:
                playerForm.current_club || 'SV Ried',
              squad_status:
                playerForm.squad_status || 'Aktiv',
              school_type:
                playerForm.school_type || null,
              school_class:
                playerForm.school_class || null,
              boarding_school:
                playerForm.boarding_school,
              bus_use:
                playerForm.bus_use,
              bus_route:
                playerForm.bus_use
                  ? playerForm.bus_route || 'KEINE'
                  : 'KEINE',
              is_p12:
                playerForm.is_p12,
              notes:
                playerForm.notes || null
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Spielerprofil konnte nicht gespeichert werden.'
        );
      }

      setEditing(false);
      setProfileSuccess(
        'Spielerprofil wurde gespeichert.'
      );

      await onSaved();
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : 'Speichern fehlgeschlagen.'
      );
    } finally {
      setSavingPlayer(false);
    }
  }

  async function saveSportScienceTest() {
    if (!accessToken) {
      setProfileError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    if (!sportScienceForm.test_date) {
      setProfileError(
        'Bitte ein Testdatum angeben.'
      );
      return;
    }

    const numberOrNull =
      (value: string) =>
        value === ''
          ? null
          : Number(value.replace(',', '.'));

    setSavingSportScience(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);

    try {
      const response =
        await fetch(
          `${apiBase}/academy/sport-science`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              academy_player_id:
                player.id,
              test_date:
                sportScienceForm.test_date,
              body_weight_kg:
                numberOrNull(
                  sportScienceForm.body_weight_kg
                ),
              body_fat_percent:
                numberOrNull(
                  sportScienceForm.body_fat_percent
                ),
              sprint_10m_seconds:
                numberOrNull(
                  sportScienceForm.sprint_10m_seconds
                ),
              sprint_30m_seconds:
                numberOrNull(
                  sportScienceForm.sprint_30m_seconds
                ),
              cmj_cm:
                numberOrNull(
                  sportScienceForm.cmj_cm
                ),
              aerobic_value:
                numberOrNull(
                  sportScienceForm.aerobic_value
                ),
              readiness:
                sportScienceForm.readiness || null,
              notes:
                sportScienceForm.notes || null
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Sport-Science-Test konnte nicht gespeichert werden.'
        );
      }

      setSportScienceForm({
        test_date:
          new Date()
            .toISOString()
            .slice(0, 10),
        body_weight_kg: '',
        body_fat_percent: '',
        sprint_10m_seconds: '',
        sprint_30m_seconds: '',
        cmj_cm: '',
        aerobic_value: '',
        readiness: '',
        notes: ''
      });

      setShowSportScienceForm(false);
      setProfileSuccess(
        'Sport-Science-Test wurde gespeichert.'
      );

      await onSaved();
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : 'Speichern fehlgeschlagen.'
      );
    } finally {
      setSavingSportScience(false);
    }
  }

  function resetIdealForm() {
    setEditingIdealId(null);
    setIdealForm({
      period_label: '',
      assessment_date:
        new Date()
          .toISOString()
          .slice(0, 10),
      player_role:
        player.player_role ?? '',
      scores: [
        {
          ideal_code: 'OFF1',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'OFF2',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'OFF3',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'DEF1',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        },
        {
          ideal_code: 'DEF3',
          status_quo: '',
          potential: '',
          rating: '',
          measured_value: '',
          notes: ''
        }
      ]
    });
  }

  function updateIdealScore(
    index: number,
    field: keyof IdealScoreForm,
    value: string
  ) {
    setIdealForm(current => ({
      ...current,
      scores: current.scores.map(
        (score, scoreIndex) =>
          scoreIndex === index
            ? {
                ...score,
                [field]: value
              }
            : score
      )
    }));
  }

  function editIdealAssessment(
    assessment: IdealAssessment
  ) {
    const knownCodes = [...IDEAL_CODES];

    const byCode =
      new Map(
        assessment.scores.map(
          score => [
            score.ideal_code,
            score
          ]
        )
      );

    setEditingIdealId(
      assessment.id
    );

    setIdealForm({
      period_label:
        assessment.period_label ?? '',
      assessment_date:
        assessment.assessment_date ?? '',
      player_role:
        assessment.player_role ??
        player.player_role ??
        '',
      scores: knownCodes.map(code => {
        const existing =
          byCode.get(code);

        return {
          ideal_code: code,
          status_quo:
            existing?.status_quo != null
              ? String(
                  existing.status_quo
                )
              : '',
          potential:
            existing?.potential != null
              ? String(
                  existing.potential
                )
              : '',
          rating:
            existing?.rating != null
              ? String(
                  existing.rating
                )
              : '',
          measured_value:
            existing?.measured_value ??
            '',
          notes:
            existing?.notes ?? ''
        };
      })
    });

    setShowIdealForm(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);
  }

  async function saveIdealAssessment() {
    if (!accessToken) {
      setProfileError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    if (
      !idealForm.period_label.trim()
    ) {
      setProfileError(
        'Bitte eine Bewertungsperiode angeben.'
      );
      return;
    }

    const numberOrNull =
      (value: string) =>
        value === ''
          ? null
          : Number(value);

    const payload = {
      academy_player_id:
        player.id,
      period_label:
        idealForm.period_label.trim(),
      assessment_date:
        idealForm.assessment_date || null,
      player_role:
        idealForm.player_role || null,
      scores:
        idealForm.scores.map(
          score => ({
            ideal_code:
              score.ideal_code,
            status_quo:
              numberOrNull(
                score.status_quo
              ),
            potential:
              numberOrNull(
                score.potential
              ),
            rating:
              numberOrNull(
                score.rating
              ),
            measured_value:
              score.measured_value ||
              null,
            notes:
              score.notes || null
          })
        )
    };

    setSavingIdeal(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);

    try {
      const isEdit =
        editingIdealId != null;

      const response =
        await fetch(
          isEdit
            ? `${apiBase}/academy/ideals/${editingIdealId}`
            : `${apiBase}/academy/ideals`,
          {
            method:
              isEdit ? 'PUT' : 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify(
              payload
            )
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Ideale-Bewertung konnte nicht gespeichert werden.'
        );
      }

      setShowIdealForm(false);
      resetIdealForm();

      setProfileSuccess(
        isEdit
          ? 'Ideale-Bewertung wurde aktualisiert.'
          : 'Ideale-Bewertung wurde gespeichert.'
      );

      await onSaved();
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : 'Speichern fehlgeschlagen.'
      );
    } finally {
      setSavingIdeal(false);
    }
  }


  function resetSkillAcForm() {
    setEditingSkillAcId(null);
    setSkillAcForm({
      period_old: '',
      period_new: '',
      team_old: player.team ?? '',
      team_new: player.team ?? '',
      author_old: '',
      author_new: '',
      skill_old: '',
      ac_old: '',
      consequence_general: '',
      skill_new: '',
      ac_new: '',
      reflection: '',
      biggest_changes: ''
    });
  }

  function updateSkillAcField(
    field: keyof typeof skillAcForm,
    value: string
  ) {
    setSkillAcForm(current => ({
      ...current,
      [field]: value
    }));
  }

  function editSkillAcForm(
    form: SkillAcForm
  ) {
    setEditingSkillAcId(form.id);

    setSkillAcForm({
      period_old:
        form.period_old ?? '',
      period_new:
        form.period_new ?? '',
      team_old:
        form.team_old ?? '',
      team_new:
        form.team_new ?? '',
      author_old:
        form.author_old ?? '',
      author_new:
        form.author_new ?? '',
      skill_old:
        form.skill_old ?? '',
      ac_old:
        form.ac_old ?? '',
      consequence_general:
        form.consequence_general ?? '',
      skill_new:
        form.skill_new ?? '',
      ac_new:
        form.ac_new ?? '',
      reflection:
        form.reflection ?? '',
      biggest_changes:
        form.biggest_changes ?? ''
    });

    setShowSkillAcForm(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);
  }

  const sortedSkillAc =
    [...playerSkillAc].sort(
      (a, b) =>
        Number(b.id) - Number(a.id)
    );

  const latestSkillAc =
    sortedSkillAc[0];

  function useLatestSkillAcAsBase() {
    if (!latestSkillAc) {
      return;
    }

    setEditingSkillAcId(null);

    setSkillAcForm(current => ({
      ...current,
      period_old:
        latestSkillAc.period_new ??
        latestSkillAc.period_old ??
        '',
      period_new: '',
      team_old:
        latestSkillAc.team_new ??
        latestSkillAc.team_old ??
        player.team ??
        '',
      team_new:
        player.team ??
        latestSkillAc.team_new ??
        '',
      author_old:
        latestSkillAc.author_new ??
        latestSkillAc.author_old ??
        '',
      author_new: '',
      skill_old:
        latestSkillAc.skill_new ??
        latestSkillAc.skill_old ??
        '',
      ac_old:
        latestSkillAc.ac_new ??
        latestSkillAc.ac_old ??
        '',
      consequence_general: '',
      skill_new: '',
      ac_new: '',
      reflection: '',
      biggest_changes: ''
    }));

    setShowSkillAcForm(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);
  }

  async function saveSkillAcForm() {
    if (!accessToken) {
      setProfileError(
        'Kein Teams-SSO-Token vorhanden.'
      );
      return;
    }

    setSavingSkillAc(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);

    try {
      const isEdit =
        editingSkillAcId != null;

      const response =
        await fetch(
          isEdit
            ? `${apiBase}/academy/skill-ac/${editingSkillAcId}`
            : `${apiBase}/academy/skill-ac`,
          {
            method:
              isEdit ? 'PUT' : 'POST',
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              academy_player_id:
                player.id,
              period_old:
                skillAcForm.period_old || null,
              period_new:
                skillAcForm.period_new || null,
              team_old:
                skillAcForm.team_old || null,
              team_new:
                skillAcForm.team_new || null,
              author_old:
                skillAcForm.author_old || null,
              author_new:
                skillAcForm.author_new || null,
              skill_old:
                skillAcForm.skill_old || null,
              ac_old:
                skillAcForm.ac_old || null,
              consequence_general:
                skillAcForm.consequence_general || null,
              skill_new:
                skillAcForm.skill_new || null,
              ac_new:
                skillAcForm.ac_new || null,
              reflection:
                skillAcForm.reflection || null,
              biggest_changes:
                skillAcForm.biggest_changes || null
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
          'Skill-/AC-Formular konnte nicht gespeichert werden.'
        );
      }

      setShowSkillAcForm(false);
      resetSkillAcForm();

      setProfileSuccess(
        isEdit
          ? 'Skill-/AC-Formular wurde aktualisiert.'
          : 'Skill-/AC-Formular wurde gespeichert.'
      );

      await onSaved();
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : 'Speichern fehlgeschlagen.'
      );
    } finally {
      setSavingSkillAc(false);
    }
  }


  return (
    <div style={modalBackdrop}>
      <div style={modalPanel}>
        <section style={academyProfileHero}>
          <div style={academyProfileIdentity}>
            <div style={academyProfileAvatar}>
              {player.jersey_number ? (
                <span style={academyProfileJersey}>
                  {player.jersey_number}
                </span>
              ) : (
                <span style={academyProfileInitials}>
                  {player.name
                    .split(' ')
                    .slice(0, 2)
                    .map(part =>
                      part
                        .charAt(0)
                        .toUpperCase()
                    )
                    .join('')}
                </span>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={academyProfileEyebrow}>
                AKAVision Spielerprofil
              </div>

              <h2 style={academyProfileName}>
                {player.name}
              </h2>

              <div style={academyProfileMeta}>
                {[
                  player.team,
                  player.primary_position,
                  player.player_role,
                  player.current_club
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>

              <div style={academyProfileBadges}>
                {player.squad_status && (
                  <span style={academyProfileStatusBadge}>
                    {player.squad_status}
                  </span>
                )}

                {player.is_p12 && (
                  <span style={academyProfileP12Badge}>
                    P12
                  </span>
                )}

                {player.boarding_school && (
                  <span style={academyProfileSoftBadge}>
                    Internat
                  </span>
                )}

                {player.bus_use && (
                  <span style={academyProfileSoftBadge}>
                    Bus
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={academyProfileActions}>
            <button
              type="button"
              onClick={() =>
                setEditing(
                  value => !value
                )
              }
              style={secondaryButton}
            >
              {editing
                ? 'Bearbeiten schließen'
                : 'Stammdaten bearbeiten'}
            </button>

            <button
              type="button"
              onClick={() =>
                setShowSportScienceForm(
                  value => !value
                )
              }
              style={academyProfileActionButton}
            >
              + Sport Science
            </button>

            <button
              type="button"
              onClick={() => {
                resetIdealForm();
                setShowIdealForm(
                  value => !value
                );
              }}
              style={academyProfileActionButton}
            >
              + Ideale
            </button>

            <button
              type="button"
              onClick={() => {
                resetSkillAcForm();
                setShowSkillAcForm(
                  value => !value
                );
              }}
              style={academyProfileActionButton}
            >
              + Skill / AC
            </button>

            <button
              type="button"
              onClick={onClose}
              style={secondaryButton}
            >
              ✕ Schließen
            </button>
          </div>
        </section>

        <section style={academyProfileStats}>
          <AcademyProfileStat
            label="Ideale"
            value={playerIdeals.length}
            hint={
              latestIdeal?.assessment_date
                ? `zuletzt ${formatDate(
                    latestIdeal.assessment_date
                  )}`
                : 'noch offen'
            }
          />

          <AcademyProfileStat
            label="Sport Science"
            value={playerTests.length}
            hint={
              latestSportTest?.test_date
                ? `zuletzt ${formatDate(
                    latestSportTest.test_date
                  )}`
                : 'noch offen'
            }
          />

          <AcademyProfileStat
            label="Skill / AC"
            value={playerSkillAc.length}
            hint={
              latestSkillAc?.period_new ??
              latestSkillAc?.period_old ??
              'noch offen'
            }
          />

          <AcademyProfileStat
            label="Schule"
            value={
              player.school_class ||
              '–'
            }
            hint={
              player.school_type ||
              'keine Angabe'
            }
          />
        </section>

        {profileError && (
          <div style={errorBox}>
            {profileError}
          </div>
        )}

        {profileSuccess && (
          <div style={successBox}>
            {profileSuccess}
          </div>
        )}

        {editing && (
          <section
            style={{
              ...panel,
              marginTop: '18px'
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Spielerprofil bearbeiten
            </h3>

            <div style={profileFormGrid}>
              <TextInput
                label="Name"
                value={playerForm.name}
                onChange={value =>
                  updatePlayerField(
                    'name',
                    value
                  )
                }
              />

              <Field label="Geburtsdatum">
                <input
                  type="date"
                  value={
                    playerForm.birth_date
                  }
                  onChange={event =>
                    updatePlayerField(
                      'birth_date',
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <TextInput
                label="Position"
                value={
                  playerForm.primary_position
                }
                onChange={value =>
                  updatePlayerField(
                    'primary_position',
                    value
                  )
                }
              />

              <TextInput
                label="Rolle"
                value={
                  playerForm.player_role
                }
                onChange={value =>
                  updatePlayerField(
                    'player_role',
                    value
                  )
                }
              />

              <TextInput
                label="Fuß"
                value={
                  playerForm.preferred_foot
                }
                onChange={value =>
                  updatePlayerField(
                    'preferred_foot',
                    value
                  )
                }
              />

              <TextInput
                label="Trikotnummer"
                value={
                  playerForm.jersey_number
                }
                onChange={value =>
                  updatePlayerField(
                    'jersey_number',
                    value
                  )
                }
              />

              <TextInput
                label="Nationalität"
                value={
                  playerForm.nationality
                }
                onChange={value =>
                  updatePlayerField(
                    'nationality',
                    value
                  )
                }
              />

              <TextInput
                label="Größe"
                value={
                  playerForm.height
                }
                onChange={value =>
                  updatePlayerField(
                    'height',
                    value
                  )
                }
              />

              <TextInput
                label="Verein"
                value={
                  playerForm.current_club
                }
                onChange={value =>
                  updatePlayerField(
                    'current_club',
                    value
                  )
                }
              />

              <TextInput
                label="Status"
                value={
                  playerForm.squad_status
                }
                onChange={value =>
                  updatePlayerField(
                    'squad_status',
                    value
                  )
                }
              />

              <TextInput
                label="Schultyp"
                value={
                  playerForm.school_type
                }
                onChange={value =>
                  updatePlayerField(
                    'school_type',
                    value
                  )
                }
              />

              <TextInput
                label="Schulklasse"
                value={
                  playerForm.school_class
                }
                onChange={value =>
                  updatePlayerField(
                    'school_class',
                    value
                  )
                }
              />

              <Field label="P12-Projekt">
                <select
                  value={
                    playerForm.is_p12
                      ? 'ja'
                      : 'nein'
                  }
                  onChange={event =>
                    updatePlayerField(
                      'is_p12',
                      event.target.value === 'ja'
                    )
                  }
                  style={inputStyle}
                >
                  <option value="nein">
                    Nein
                  </option>
                  <option value="ja">
                    Ja
                  </option>
                </select>
              </Field>

              <Field label="Internat">
                <select
                  value={
                    playerForm.boarding_school
                      ? 'ja'
                      : 'nein'
                  }
                  onChange={event =>
                    updatePlayerField(
                      'boarding_school',
                      event.target.value === 'ja'
                    )
                  }
                  style={inputStyle}
                >
                  <option value="nein">
                    Nein
                  </option>
                  <option value="ja">
                    Ja
                  </option>
                </select>
              </Field>

              <Field label="Busnutzung">
                <select
                  value={
                    playerForm.bus_use
                      ? 'ja'
                      : 'nein'
                  }
                  onChange={event =>
                    updatePlayerField(
                      'bus_use',
                      event.target.value === 'ja'
                    )
                  }
                  style={inputStyle}
                >
                  <option value="nein">
                    Nein
                  </option>
                  <option value="ja">
                    Ja
                  </option>
                </select>
              </Field>

              <TextInput
                label="Busroute"
                value={
                  playerForm.bus_route
                }
                onChange={value =>
                  updatePlayerField(
                    'bus_route',
                    value
                  )
                }
              />
            </div>

            <div style={{ marginTop: '12px' }}>
              <Area
                label="Notizen"
                value={
                  playerForm.notes
                }
                onChange={value =>
                  updatePlayerField(
                    'notes',
                    value
                  )
                }
              />
            </div>

            <button
              type="button"
              onClick={savePlayer}
              disabled={savingPlayer}
              style={{
                ...primaryButton,
                marginTop: '14px'
              }}
            >
              {savingPlayer
                ? 'Speichert…'
                : 'Spielerprofil speichern'}
            </button>
          </section>
        )}

        {showSportScienceForm && (
          <section
            style={{
              ...panel,
              marginTop: '18px'
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Neuer Sport-Science-Test
            </h3>

            <div style={profileFormGrid}>
              <Field label="Testdatum">
                <input
                  type="date"
                  value={
                    sportScienceForm.test_date
                  }
                  onChange={event =>
                    updateSportScienceField(
                      'test_date',
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <TextInput
                label="Gewicht (kg)"
                value={
                  sportScienceForm.body_weight_kg
                }
                onChange={value =>
                  updateSportScienceField(
                    'body_weight_kg',
                    value
                  )
                }
              />

              <TextInput
                label="Körperfett (%)"
                value={
                  sportScienceForm.body_fat_percent
                }
                onChange={value =>
                  updateSportScienceField(
                    'body_fat_percent',
                    value
                  )
                }
              />

              <TextInput
                label="10 m Sprint (s)"
                value={
                  sportScienceForm.sprint_10m_seconds
                }
                onChange={value =>
                  updateSportScienceField(
                    'sprint_10m_seconds',
                    value
                  )
                }
              />

              <TextInput
                label="30 m Sprint (s)"
                value={
                  sportScienceForm.sprint_30m_seconds
                }
                onChange={value =>
                  updateSportScienceField(
                    'sprint_30m_seconds',
                    value
                  )
                }
              />

              <TextInput
                label="CMJ (cm)"
                value={
                  sportScienceForm.cmj_cm
                }
                onChange={value =>
                  updateSportScienceField(
                    'cmj_cm',
                    value
                  )
                }
              />

              <TextInput
                label="Aerobic Value"
                value={
                  sportScienceForm.aerobic_value
                }
                onChange={value =>
                  updateSportScienceField(
                    'aerobic_value',
                    value
                  )
                }
              />

              <TextInput
                label="Readiness"
                value={
                  sportScienceForm.readiness
                }
                onChange={value =>
                  updateSportScienceField(
                    'readiness',
                    value
                  )
                }
              />
            </div>

            <div style={{ marginTop: '12px' }}>
              <Area
                label="Notizen"
                value={
                  sportScienceForm.notes
                }
                onChange={value =>
                  updateSportScienceField(
                    'notes',
                    value
                  )
                }
              />
            </div>

            <button
              type="button"
              onClick={
                saveSportScienceTest
              }
              disabled={
                savingSportScience
              }
              style={{
                ...primaryButton,
                marginTop: '14px'
              }}
            >
              {savingSportScience
                ? 'Speichert…'
                : 'Test speichern'}
            </button>
          </section>
        )}


        {showIdealForm && (
          <section
            style={{
              ...panel,
              marginTop: '18px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              <h3
                style={{
                  margin: 0
                }}
              >
                {editingIdealId != null
                  ? 'Ideale-Bewertung bearbeiten'
                  : 'Neue Ideale-Bewertung'}
              </h3>

              <button
                type="button"
                onClick={() => {
                  setShowIdealForm(false);
                  resetIdealForm();
                }}
                style={secondaryButton}
              >
                Abbrechen
              </button>
            </div>

            <div
              style={{
                ...profileFormGrid,
                marginTop: '14px'
              }}
            >
              <TextInput
                label="Periode"
                value={
                  idealForm.period_label
                }
                onChange={value =>
                  setIdealForm(
                    current => ({
                      ...current,
                      period_label: value
                    })
                  )
                }
              />

              <Field label="Bewertungsdatum">
                <input
                  type="date"
                  value={
                    idealForm.assessment_date
                  }
                  onChange={event =>
                    setIdealForm(
                      current => ({
                        ...current,
                        assessment_date:
                          event.target.value
                      })
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <TextInput
                label="Spielerrolle"
                value={
                  idealForm.player_role
                }
                onChange={value =>
                  setIdealForm(
                    current => ({
                      ...current,
                      player_role: value
                    })
                  )
                }
              />
            </div>

            <div
              style={{
                display: 'grid',
                gap: '10px',
                marginTop: '16px'
              }}
            >
              {idealForm.scores.map(
                (score, index) => (
                  <div
                    key={score.ideal_code}
                    style={idealEditRow}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '16px'
                      }}
                    >
                      {score.ideal_code}
                    </div>

                    <Field label="Status quo">
                      <input
                        type="number"
                        value={
                          score.status_quo
                        }
                        onChange={event =>
                          updateIdealScore(
                            index,
                            'status_quo',
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Potenzial">
                      <input
                        type="number"
                        value={
                          score.potential
                        }
                        onChange={event =>
                          updateIdealScore(
                            index,
                            'potential',
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Rating">
                      <input
                        type="number"
                        value={score.rating}
                        onChange={event =>
                          updateIdealScore(
                            index,
                            'rating',
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </Field>

                    <TextInput
                      label="Messwert"
                      value={
                        score.measured_value
                      }
                      onChange={value =>
                        updateIdealScore(
                          index,
                          'measured_value',
                          value
                        )
                      }
                    />

                    <TextInput
                      label="Notiz"
                      value={score.notes}
                      onChange={value =>
                        updateIdealScore(
                          index,
                          'notes',
                          value
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              onClick={
                saveIdealAssessment
              }
              disabled={savingIdeal}
              style={{
                ...primaryButton,
                marginTop: '16px'
              }}
            >
              {savingIdeal
                ? 'Speichert…'
                : editingIdealId != null
                  ? 'Bewertung aktualisieren'
                  : 'Bewertung speichern'}
            </button>
          </section>
        )}


        {showSkillAcForm && (
          <section
            style={{
              ...panel,
              marginTop: '18px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  {editingSkillAcId != null
                    ? 'Skill / AC Entwicklungsbogen bearbeiten'
                    : 'Skill / AC Entwicklungsbogen'}
                </h3>

                <div
                  style={{
                    marginTop: '4px',
                    color: '#777',
                    fontSize: '13px'
                  }}
                >
                  Entwicklung vom bisherigen Stand zum nächsten Entwicklungsschritt dokumentieren.
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
              >
                {editingSkillAcId == null && latestSkillAc && (
                  <button
                    type="button"
                    onClick={useLatestSkillAcAsBase}
                    style={secondaryButton}
                  >
                    Letzten Stand übernehmen
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowSkillAcForm(false);
                    resetSkillAcForm();
                  }}
                  style={secondaryButton}
                >
                  Abbrechen
                </button>
              </div>
            </div>

            <div
              style={{
                ...skillAcSection,
                marginTop: '16px'
              }}
            >
              <div style={skillAcSectionHeader}>
                1 · Rahmen
              </div>

              <div
                className="academy-skillac-form-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(0, 1fr))',
                  gap: '12px',
                  marginTop: '10px'
                }}
              >
                <TextInput
                  label="Periode bisher"
                  value={skillAcForm.period_old}
                  onChange={value =>
                    updateSkillAcField(
                      'period_old',
                      value
                    )
                  }
                />

                <TextInput
                  label="Periode neu"
                  value={skillAcForm.period_new}
                  onChange={value =>
                    updateSkillAcField(
                      'period_new',
                      value
                    )
                  }
                />

                <TextInput
                  label="Team bisher"
                  value={skillAcForm.team_old}
                  onChange={value =>
                    updateSkillAcField(
                      'team_old',
                      value
                    )
                  }
                />

                <TextInput
                  label="Team neu"
                  value={skillAcForm.team_new}
                  onChange={value =>
                    updateSkillAcField(
                      'team_new',
                      value
                    )
                  }
                />

                <TextInput
                  label="Autor bisher"
                  value={skillAcForm.author_old}
                  onChange={value =>
                    updateSkillAcField(
                      'author_old',
                      value
                    )
                  }
                />

                <TextInput
                  label="Autor neu"
                  value={skillAcForm.author_new}
                  onChange={value =>
                    updateSkillAcField(
                      'author_new',
                      value
                    )
                  }
                />
              </div>
            </div>

            <div style={skillAcSection}>
              <div style={skillAcSectionHeader}>
                2 · Skill
              </div>

              <div
                className="academy-skillac-compare-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(0, 1fr))',
                  gap: '12px',
                  marginTop: '10px'
                }}
              >
                <Area
                  label="Bisheriger Skill-Fokus"
                  value={skillAcForm.skill_old}
                  onChange={value =>
                    updateSkillAcField(
                      'skill_old',
                      value
                    )
                  }
                />

                <Area
                  label="Neuer Skill-Fokus"
                  value={skillAcForm.skill_new}
                  onChange={value =>
                    updateSkillAcField(
                      'skill_new',
                      value
                    )
                  }
                />
              </div>
            </div>

            <div style={skillAcSection}>
              <div style={skillAcSectionHeader}>
                3 · AC
              </div>

              <div
                className="academy-skillac-compare-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(0, 1fr))',
                  gap: '12px',
                  marginTop: '10px'
                }}
              >
                <Area
                  label="Bisheriger AC-Fokus"
                  value={skillAcForm.ac_old}
                  onChange={value =>
                    updateSkillAcField(
                      'ac_old',
                      value
                    )
                  }
                />

                <Area
                  label="Neuer AC-Fokus"
                  value={skillAcForm.ac_new}
                  onChange={value =>
                    updateSkillAcField(
                      'ac_new',
                      value
                    )
                  }
                />
              </div>
            </div>

            <div style={skillAcSection}>
              <div style={skillAcSectionHeader}>
                4 · Veränderung & Konsequenz
              </div>

              <div
                className="academy-skillac-form-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(0, 1fr))',
                  gap: '12px',
                  marginTop: '10px'
                }}
              >
                <Area
                  label="Größte Veränderungen"
                  value={skillAcForm.biggest_changes}
                  onChange={value =>
                    updateSkillAcField(
                      'biggest_changes',
                      value
                    )
                  }
                />

                <Area
                  label="Konsequenz allgemein"
                  value={skillAcForm.consequence_general}
                  onChange={value =>
                    updateSkillAcField(
                      'consequence_general',
                      value
                    )
                  }
                />
              </div>
            </div>

            <div style={skillAcSection}>
              <div style={skillAcSectionHeader}>
                5 · Reflexion
              </div>

              <div style={{ marginTop: '10px' }}>
                <Area
                  label="Reflexion / nächster Schritt"
                  value={skillAcForm.reflection}
                  onChange={value =>
                    updateSkillAcField(
                      'reflection',
                      value
                    )
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '16px'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowSkillAcForm(false);
                  resetSkillAcForm();
                }}
                style={secondaryButton}
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={saveSkillAcForm}
                disabled={savingSkillAc}
                style={primaryButton}
              >
                {savingSkillAc
                  ? 'Speichert…'
                  : editingSkillAcId != null
                    ? 'Skill / AC Bogen aktualisieren'
                    : 'Skill / AC Bogen speichern'}
              </button>
            </div>
          </section>
        )}

        <section
          className="academy-profile-tabs"
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '18px'
          }}
        >
          <ProfileTabButton
            active={profileTab === 'stammdaten'}
            onClick={() => setProfileTab('stammdaten')}
          >
            Stammdaten
          </ProfileTabButton>

          <ProfileTabButton
            active={profileTab === 'ideale'}
            onClick={() => setProfileTab('ideale')}
          >
            Ideale · {playerIdeals.length}
          </ProfileTabButton>

          <ProfileTabButton
            active={profileTab === 'sportScience'}
            onClick={() => setProfileTab('sportScience')}
          >
            Sport Science · {playerTests.length}
          </ProfileTabButton>

          <ProfileTabButton
            active={profileTab === 'skillAc'}
            onClick={() => setProfileTab('skillAc')}
          >
            Skill / AC · {playerSkillAc.length}
          </ProfileTabButton>
        </section>

        {profileTab === 'stammdaten' && (
          <section
            style={{
              ...panel,
              marginTop: '14px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <h3 style={{ margin: 0 }}>
                Stammdaten
              </h3>

              <button
                type="button"
                onClick={() => setEditing(true)}
                style={secondaryButton}
              >
                Stammdaten bearbeiten
              </button>
            </div>

            <div
              className="academy-profile-data-grid"
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',
                gap: '0 24px',
                marginTop: '10px'
              }}
            >
              <div>
                <InfoLine
                  label="Geburtsdatum"
                  value={
                    player.birth_date
                      ? formatDate(player.birth_date)
                      : undefined
                  }
                />
                <InfoLine
                  label="Position"
                  value={player.primary_position}
                />
                <InfoLine
                  label="Rolle"
                  value={player.player_role}
                />
                <InfoLine
                  label="Fuß"
                  value={player.preferred_foot}
                />
                <InfoLine
                  label="Trikotnummer"
                  value={player.jersey_number}
                />
                <InfoLine
                  label="Nationalität"
                  value={player.nationality}
                />
              </div>

              <div>
                <InfoLine
                  label="Größe"
                  value={player.height}
                />
                <InfoLine
                  label="Verein"
                  value={player.current_club}
                />
                <InfoLine
                  label="Status"
                  value={player.squad_status}
                />
                <InfoLine
                  label="Schule"
                  value={[
                    player.school_type,
                    player.school_class
                  ]
                    .filter(Boolean)
                    .join(' · ') || undefined}
                />
                <InfoLine
                  label="P12-Projekt"
                  value={
                    player.is_p12
                      ? 'Ja'
                      : 'Nein'
                  }
                />
                <InfoLine
                  label="Internat"
                  value={
                    player.boarding_school
                      ? 'Ja'
                      : 'Nein'
                  }
                />
                <InfoLine
                  label="Bus"
                  value={
                    player.bus_use
                      ? player.bus_route || 'Ja'
                      : 'Nein'
                  }
                />
              </div>
            </div>

            {player.notes && (
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid #eeeeee'
                }}
              >
                <strong>Notizen</strong>
                <div
                  style={{
                    marginTop: '6px',
                    whiteSpace: 'pre-wrap',
                    color: '#444'
                  }}
                >
                  {player.notes}
                </div>
              </div>
            )}
          </section>
        )}

        {profileTab === 'ideale' && (
          <section
            style={{
              ...panel,
              marginTop: '14px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  Ideale
                </h3>
                <div
                  style={{
                    marginTop: '4px',
                    color: '#777',
                    fontSize: '13px'
                  }}
                >
                  {playerIdeals.length} Bewertungen
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetIdealForm();
                  setShowIdealForm(true);
                }}
                style={primaryButton}
              >
                + Ideale-Bewertung
              </button>
            </div>

            {!latestIdeal ? (
              <div
                style={{
                  color: '#777',
                  marginTop: '16px'
                }}
              >
                Noch keine Ideale-Bewertung vorhanden.
              </div>
            ) : (
              <>
                <div
                  style={{
                    marginTop: '18px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      alignItems: 'baseline',
                      flexWrap: 'wrap'
                    }}
                  >
                    <strong>
                      Aktueller Stand
                    </strong>

                    <span
                      style={{
                        color: '#777',
                        fontSize: '12px'
                      }}
                    >
                      {latestIdeal.period_label}
                      {latestIdeal.assessment_date
                        ? ` · ${formatDate(
                            latestIdeal.assessment_date
                          )}`
                        : ''}
                    </span>
                  </div>

                  <div
                    className="academy-ideal-groups"
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(2, minmax(0, 1fr))',
                      gap: '14px',
                      marginTop: '10px'
                    }}
                  >
                    {['Mit Ball', 'Gegen den Ball'].map(group => (
                      <div
                        key={group}
                        style={idealGroupCard}
                      >
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: '#555',
                            marginBottom: '9px'
                          }}
                        >
                          {group}
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gap: '8px'
                          }}
                        >
                          {IDEAL_CODES
                            .filter(code =>
                              IDEAL_META[code].group === group
                            )
                            .map(code => {
                              const score =
                                getScoreByCode(
                                  latestIdeal,
                                  code
                                );

                              const value =
                                getScoreValue(score);

                              const trend =
                                getTrendForCode(code);

                              return (
                                <div
                                  key={code}
                                  style={idealSummaryRow}
                                >
                                  <div>
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                      }}
                                    >
                                      <span
                                        style={idealCodeBadge}
                                      >
                                        {code}
                                      </span>

                                      <strong>
                                        {IDEAL_META[code].label}
                                      </strong>
                                    </div>

                                    {score?.notes && (
                                      <div
                                        style={{
                                          marginTop: '5px',
                                          color: '#777',
                                          fontSize: '12px'
                                        }}
                                      >
                                        {score.notes}
                                      </div>
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      textAlign: 'right',
                                      minWidth: '62px'
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: '20px',
                                        fontWeight: 800
                                      }}
                                    >
                                      {value ?? '–'}
                                    </div>

                                    {trend != null && trend !== 0 && (
                                      <div
                                        style={{
                                          marginTop: '2px',
                                          fontSize: '11px',
                                          fontWeight: 800,
                                          color:
                                            trend > 0
                                              ? '#0b7a3b'
                                              : '#a05a00'
                                        }}
                                      >
                                        {trend > 0 ? '↑' : '↓'}{' '}
                                        {Math.abs(trend)}
                                      </div>
                                    )}

                                    {trend === 0 && (
                                      <div
                                        style={{
                                          marginTop: '2px',
                                          fontSize: '11px',
                                          color: '#777'
                                        }}
                                      >
                                        =
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {previousIdeal && (
                  <div
                    style={{
                      marginTop: '18px'
                    }}
                  >
                    <strong>
                      Entwicklung zur vorherigen Bewertung
                    </strong>

                    <div
                      className="academy-ideal-trend-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(5, minmax(0, 1fr))',
                        gap: '8px',
                        marginTop: '9px'
                      }}
                    >
                      {IDEAL_CODES.map(code => {
                        const trend =
                          getTrendForCode(code);

                        return (
                          <div
                            key={code}
                            style={metricCard}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '8px'
                              }}
                            >
                              <strong>
                                {code}
                              </strong>

                              <span
                                style={{
                                  fontWeight: 800,
                                  color:
                                    trend == null
                                      ? '#777'
                                      : trend > 0
                                        ? '#0b7a3b'
                                        : trend < 0
                                          ? '#a05a00'
                                          : '#555'
                                }}
                              >
                                {trend == null
                                  ? '–'
                                  : trend > 0
                                    ? `+${trend}`
                                    : String(trend)}
                              </span>
                            </div>

                            <div
                              style={{
                                marginTop: '4px',
                                color: '#777',
                                fontSize: '11px'
                              }}
                            >
                              {IDEAL_META[code].label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    marginTop: '20px',
                    paddingTop: '18px',
                    borderTop: '1px solid #eeeeee'
                  }}
                >
                  <strong>
                    Verlauf
                  </strong>

                  <div
                    style={{
                      display: 'grid',
                      gap: '12px',
                      marginTop: '10px'
                    }}
                  >
                    {sortedIdeals.map(assessment => (
                      <article
                        key={assessment.id}
                        style={subPanel}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div>
                            <strong>
                              {assessment.period_label}
                            </strong>

                            <div
                              style={{
                                marginTop: '3px',
                                color: '#777',
                                fontSize: '12px'
                              }}
                            >
                              {assessment.assessment_date
                                ? formatDate(
                                    assessment.assessment_date
                                  )
                                : 'Kein Datum'}
                              {assessment.player_role
                                ? ` · ${assessment.player_role}`
                                : ''}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              editIdealAssessment(assessment)
                            }
                            style={smallButton}
                          >
                            Bearbeiten
                          </button>
                        </div>

                        <div
                          className="academy-ideal-score-grid"
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(5, minmax(0, 1fr))',
                            gap: '8px',
                            marginTop: '12px'
                          }}
                        >
                          {IDEAL_CODES.map(code => {
                            const score =
                              assessment.scores.find(
                                item =>
                                  item.ideal_code === code
                              );

                            const value =
                              getScoreValue(score);

                            return (
                              <div
                                key={`${assessment.id}-${code}`}
                                style={metricCard}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '6px',
                                    alignItems: 'center'
                                  }}
                                >
                                  <span
                                    style={idealCodeBadgeSmall}
                                  >
                                    {code}
                                  </span>
                                  <strong>
                                    {value ?? '–'}
                                  </strong>
                                </div>

                                <div
                                  style={{
                                    marginTop: '5px',
                                    color: '#777',
                                    fontSize: '11px'
                                  }}
                                >
                                  {IDEAL_META[code].label}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {profileTab === 'sportScience' && (
          <section
            style={{
              ...panel,
              marginTop: '14px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  Sport Science
                </h3>
                <div
                  style={{
                    marginTop: '4px',
                    color: '#777',
                    fontSize: '13px'
                  }}
                >
                  {playerTests.length} Testdatensätze
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSportScienceForm(true)
                }
                style={primaryButton}
              >
                + Sport-Science-Test
              </button>
            </div>

            {!latestSportTest ? (
              <div
                style={{
                  color: '#777',
                  marginTop: '16px'
                }}
              >
                Noch keine Testdaten vorhanden.
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                    marginTop: '18px'
                  }}
                >
                  <strong>
                    Aktueller Test
                  </strong>

                  <span
                    style={{
                      color: '#777',
                      fontSize: '12px'
                    }}
                  >
                    {formatDate(
                      latestSportTest.test_date
                    )}
                    {previousSportTest
                      ? ` · Vergleich zu ${formatDate(
                          previousSportTest.test_date
                        )}`
                      : ''}
                  </span>
                </div>

                <div
                  className="academy-sportscience-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(4, minmax(0, 1fr))',
                    gap: '10px',
                    marginTop: '10px'
                  }}
                >
                  <SportMetricCard
                    label="Gewicht"
                    value={latestSportTest.body_weight_kg}
                    unit="kg"
                    trend={getMetricTrend(
                      latestSportTest.body_weight_kg,
                      previousSportTest?.body_weight_kg
                    )}
                  />

                  <SportMetricCard
                    label="Körperfett"
                    value={latestSportTest.body_fat_percent}
                    unit="%"
                    trend={getMetricTrend(
                      latestSportTest.body_fat_percent,
                      previousSportTest?.body_fat_percent,
                      true
                    )}
                  />

                  <SportMetricCard
                    label="10 m Sprint"
                    value={latestSportTest.sprint_10m_seconds}
                    unit="s"
                    trend={getMetricTrend(
                      latestSportTest.sprint_10m_seconds,
                      previousSportTest?.sprint_10m_seconds,
                      true
                    )}
                  />

                  <SportMetricCard
                    label="30 m Sprint"
                    value={latestSportTest.sprint_30m_seconds}
                    unit="s"
                    trend={getMetricTrend(
                      latestSportTest.sprint_30m_seconds,
                      previousSportTest?.sprint_30m_seconds,
                      true
                    )}
                  />

                  <SportMetricCard
                    label="CMJ"
                    value={latestSportTest.cmj_cm}
                    unit="cm"
                    trend={getMetricTrend(
                      latestSportTest.cmj_cm,
                      previousSportTest?.cmj_cm
                    )}
                  />

                  <SportMetricCard
                    label="Aerob"
                    value={latestSportTest.aerobic_value}
                    unit=""
                    trend={getMetricTrend(
                      latestSportTest.aerobic_value,
                      previousSportTest?.aerobic_value
                    )}
                  />

                  <div style={sportMetricCard}>
                    <div style={sportMetricLabel}>
                      Readiness
                    </div>
                    <div style={sportMetricValue}>
                      {latestSportTest.readiness || '–'}
                    </div>
                  </div>

                  <div style={sportMetricCard}>
                    <div style={sportMetricLabel}>
                      Tests gesamt
                    </div>
                    <div style={sportMetricValue}>
                      {playerTests.length}
                    </div>
                  </div>
                </div>

                {latestSportTest.notes && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '12px',
                      background: '#f8faf9',
                      borderRadius: '10px',
                      border: '1px solid #e8ede9'
                    }}
                  >
                    <div style={sportMetricLabel}>
                      Notiz letzter Test
                    </div>
                    <div
                      style={{
                        marginTop: '5px',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {latestSportTest.notes}
                    </div>
                  </div>
                )}

                {sortedTests.length > 1 && (
                  <div
                    style={{
                      marginTop: '20px',
                      paddingTop: '18px',
                      borderTop: '1px solid #eeeeee'
                    }}
                  >
                    <strong>
                      Testverlauf
                    </strong>

                    <div
                      className="academy-sportscience-history"
                      style={{
                        display: 'grid',
                        gap: '9px',
                        marginTop: '10px'
                      }}
                    >
                      {sortedTests.map((test, index) => {
                        const previous =
                          sortedTests[index + 1];

                        return (
                          <article
                            key={test.id}
                            style={subPanel}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '12px',
                                flexWrap: 'wrap',
                                alignItems: 'baseline'
                              }}
                            >
                              <strong>
                                {formatDate(test.test_date)}
                              </strong>

                              {test.readiness && (
                                <span style={profilePill}>
                                  {test.readiness}
                                </span>
                              )}
                            </div>

                            <div
                              className="academy-sportscience-history-grid"
                              style={{
                                display: 'grid',
                                gridTemplateColumns:
                                  'repeat(6, minmax(0, 1fr))',
                                gap: '8px',
                                marginTop: '10px'
                              }}
                            >
                              <CompactMetric
                                label="Gewicht"
                                value={test.body_weight_kg}
                                unit="kg"
                                trend={getMetricTrend(
                                  test.body_weight_kg,
                                  previous?.body_weight_kg
                                )}
                              />
                              <CompactMetric
                                label="KFA"
                                value={test.body_fat_percent}
                                unit="%"
                                trend={getMetricTrend(
                                  test.body_fat_percent,
                                  previous?.body_fat_percent,
                                  true
                                )}
                              />
                              <CompactMetric
                                label="10 m"
                                value={test.sprint_10m_seconds}
                                unit="s"
                                trend={getMetricTrend(
                                  test.sprint_10m_seconds,
                                  previous?.sprint_10m_seconds,
                                  true
                                )}
                              />
                              <CompactMetric
                                label="30 m"
                                value={test.sprint_30m_seconds}
                                unit="s"
                                trend={getMetricTrend(
                                  test.sprint_30m_seconds,
                                  previous?.sprint_30m_seconds,
                                  true
                                )}
                              />
                              <CompactMetric
                                label="CMJ"
                                value={test.cmj_cm}
                                unit="cm"
                                trend={getMetricTrend(
                                  test.cmj_cm,
                                  previous?.cmj_cm
                                )}
                              />
                              <CompactMetric
                                label="Aerob"
                                value={test.aerobic_value}
                                unit=""
                                trend={getMetricTrend(
                                  test.aerobic_value,
                                  previous?.aerobic_value
                                )}
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {profileTab === 'sportScience' && (
          <SportSciencePanel
            subjectType="academy"
            subjectId={player.id}
            accessToken={accessToken}
            apiBase={apiBase}
            initialHeightCm={
              player.height
            }
            title="Sportwissenschaft · vollständiges Profil"
          />
        )}

        {profileTab === 'skillAc' && (
          <section
            style={{
              ...panel,
              marginTop: '14px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  Skill / AC
                </h3>
                <div
                  style={{
                    marginTop: '4px',
                    color: '#777',
                    fontSize: '13px'
                  }}
                >
                  {playerSkillAc.length} Entwicklungsbögen
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
              >
                {latestSkillAc && (
                  <button
                    type="button"
                    onClick={useLatestSkillAcAsBase}
                    style={secondaryButton}
                  >
                    Neuen Bogen aus letztem Stand
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    resetSkillAcForm();
                    setShowSkillAcForm(true);
                  }}
                  style={primaryButton}
                >
                  + Skill / AC Bogen
                </button>
              </div>
            </div>

            {!latestSkillAc ? (
              <div
                style={{
                  color: '#777',
                  marginTop: '16px'
                }}
              >
                Noch kein Skill-/AC-Entwicklungsbogen vorhanden.
              </div>
            ) : (
              <>
                <div
                  style={{
                    marginTop: '18px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      alignItems: 'baseline',
                      flexWrap: 'wrap'
                    }}
                  >
                    <strong>
                      Aktueller Entwicklungsbogen
                    </strong>

                    <span
                      style={{
                        color: '#777',
                        fontSize: '12px'
                      }}
                    >
                      {[
                        latestSkillAc.period_old,
                        latestSkillAc.period_new
                      ]
                        .filter(Boolean)
                        .join(' → ') || 'Ohne Periodenangabe'}
                    </span>
                  </div>

                  <div
                    className="academy-skillac-current-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(2, minmax(0, 1fr))',
                      gap: '12px',
                      marginTop: '10px'
                    }}
                  >
                    <SkillAcCompareCard
                      title="Skill"
                      oldValue={latestSkillAc.skill_old}
                      newValue={latestSkillAc.skill_new}
                    />

                    <SkillAcCompareCard
                      title="AC"
                      oldValue={latestSkillAc.ac_old}
                      newValue={latestSkillAc.ac_new}
                    />
                  </div>

                  <div
                    className="academy-skillac-detail-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(3, minmax(0, 1fr))',
                      gap: '10px',
                      marginTop: '12px'
                    }}
                  >
                    <SkillAcTextCard
                      label="Größte Veränderungen"
                      value={latestSkillAc.biggest_changes}
                    />

                    <SkillAcTextCard
                      label="Konsequenz"
                      value={latestSkillAc.consequence_general}
                    />

                    <SkillAcTextCard
                      label="Reflexion"
                      value={latestSkillAc.reflection}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #eeeeee',
                      color: '#777',
                      fontSize: '12px'
                    }}
                  >
                    <span>
                      Team:{' '}
                      {[latestSkillAc.team_old, latestSkillAc.team_new]
                        .filter(Boolean)
                        .join(' → ') || '–'}
                    </span>

                    <span>
                      Autor:{' '}
                      {[latestSkillAc.author_old, latestSkillAc.author_new]
                        .filter(Boolean)
                        .join(' → ') || '–'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '10px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        editSkillAcForm(latestSkillAc)
                      }
                      style={secondaryButton}
                    >
                      Aktuellen Bogen bearbeiten
                    </button>
                  </div>
                </div>

                {sortedSkillAc.length > 1 && (
                  <div
                    style={{
                      marginTop: '20px',
                      paddingTop: '18px',
                      borderTop: '1px solid #eeeeee'
                    }}
                  >
                    <strong>
                      Verlauf
                    </strong>

                    <div
                      style={{
                        display: 'grid',
                        gap: '10px',
                        marginTop: '10px'
                      }}
                    >
                      {sortedSkillAc.map(form => (
                        <article
                          key={form.id}
                          style={subPanel}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '12px',
                              alignItems: 'flex-start',
                              flexWrap: 'wrap'
                            }}
                          >
                            <div>
                              <strong>
                                {[
                                  form.period_old,
                                  form.period_new
                                ]
                                  .filter(Boolean)
                                  .join(' → ') || 'Skill / AC'}
                              </strong>

                              {(form.team_old || form.team_new) && (
                                <div
                                  style={{
                                    marginTop: '3px',
                                    color: '#777',
                                    fontSize: '12px'
                                  }}
                                >
                                  {[form.team_old, form.team_new]
                                    .filter(Boolean)
                                    .join(' → ')}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                editSkillAcForm(form)
                              }
                              style={smallButton}
                            >
                              Bearbeiten
                            </button>
                          </div>

                          <div
                            className="academy-skillac-history-grid"
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                'repeat(2, minmax(0, 1fr))',
                              gap: '10px',
                              marginTop: '10px'
                            }}
                          >
                            <SkillAcCompareCard
                              title="Skill"
                              oldValue={form.skill_old}
                              newValue={form.skill_new}
                              compact
                            />

                            <SkillAcCompareCard
                              title="AC"
                              oldValue={form.ac_old}
                              newValue={form.ac_new}
                              compact
                            />
                          </div>

                          {form.biggest_changes && (
                            <ProfileTextBlock
                              label="Größte Veränderungen"
                              value={form.biggest_changes}
                            />
                          )}

                          {form.reflection && (
                            <ProfileTextBlock
                              label="Reflexion"
                              value={form.reflection}
                            />
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

      </div>
    </div>
  );
}

function SkillAcCompareCard({
  title,
  oldValue,
  newValue,
  compact = false
}: {
  title: string;
  oldValue?: string;
  newValue?: string;
  compact?: boolean;
}) {
  return (
    <div style={skillAcCompareCard}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '8px',
          alignItems: 'center'
        }}
      >
        <strong>{title}</strong>
        <span style={profilePill}>
          Entwicklung
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1fr) auto minmax(0, 1fr)',
          gap: compact ? '7px' : '10px',
          alignItems: 'stretch',
          marginTop: '10px'
        }}
      >
        <div style={skillAcOldCard}>
          <div style={skillAcMiniLabel}>
            Bisher
          </div>
          <div
            style={{
              marginTop: '5px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {oldValue || '–'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 900,
            color: '#0b7a3b'
          }}
        >
          →
        </div>

        <div style={skillAcNewCard}>
          <div style={skillAcMiniLabel}>
            Neu
          </div>
          <div
            style={{
              marginTop: '5px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {newValue || '–'}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillAcTextCard({
  label,
  value
}: {
  label: string;
  value?: string;
}) {
  return (
    <div style={skillAcTextCard}>
      <div style={skillAcMiniLabel}>
        {label}
      </div>
      <div
        style={{
          marginTop: '5px',
          whiteSpace: 'pre-wrap'
        }}
      >
        {value || '–'}
      </div>
    </div>
  );
}

function SportMetricCard({
  label,
  value,
  unit,
  trend
}: {
  label: string;
  value?: number;
  unit: string;
  trend:
    | {
        difference: number;
        improved: boolean | null;
      }
    | null;
}) {
  return (
    <div style={sportMetricCard}>
      <div style={sportMetricLabel}>
        {label}
      </div>

      <div style={sportMetricValue}>
        {value ?? '–'}
        {value != null && unit
          ? ` ${unit}`
          : ''}
      </div>

      <TrendDisplay trend={trend} />
    </div>
  );
}

function CompactMetric({
  label,
  value,
  unit,
  trend
}: {
  label: string;
  value?: number;
  unit: string;
  trend:
    | {
        difference: number;
        improved: boolean | null;
      }
    | null;
}) {
  return (
    <div style={compactMetricCard}>
      <div style={sportMetricLabel}>
        {label}
      </div>

      <strong>
        {value ?? '–'}
        {value != null && unit
          ? ` ${unit}`
          : ''}
      </strong>

      <TrendDisplay
        trend={trend}
        compact
      />
    </div>
  );
}

function TrendDisplay({
  trend,
  compact = false
}: {
  trend:
    | {
        difference: number;
        improved: boolean | null;
      }
    | null;
  compact?: boolean;
}) {
  if (!trend) {
    return null;
  }

  const sign =
    trend.difference > 0
      ? '+'
      : '';

  return (
    <div
      style={{
        marginTop: compact ? '3px' : '5px',
        fontSize: compact ? '10px' : '11px',
        fontWeight: 800,
        color:
          trend.improved == null
            ? '#777'
            : trend.improved
              ? '#0b7a3b'
              : '#a05a00'
      }}
    >
      {trend.difference === 0
        ? '='
        : `${trend.improved ? '↑' : '↓'} ${sign}${trend.difference}`}
    </div>
  );
}


function AcademyProfileStat({
  label,
  value,
  hint
}: {
  label: string;
  value:
    string |
    number;
  hint: string;
}) {
  return (
    <div style={academyProfileStatCard}>
      <span style={academyProfileStatLabel}>
        {label}
      </span>

      <strong style={academyProfileStatValue}>
        {value}
      </strong>

      <span style={academyProfileStatHint}>
        {hint}
      </span>
    </div>
  );
}


function ProfileTabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={
        active
          ? activeProfileTabButton
          : profileTabButton
      }
    >
      {children}
    </button>
  );
}

function MetricCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={metricCard}>
      <div
        style={{
          color: '#777',
          fontSize: '11px',
          textTransform: 'uppercase',
          fontWeight: 700
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: '5px',
          fontWeight: 800,
          fontSize: '16px'
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ProfileTextBlock({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={{ marginTop: '12px' }}>
      <div
        style={{
          color: '#777',
          fontSize: '11px',
          textTransform: 'uppercase',
          fontWeight: 700
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: '4px',
          whiteSpace: 'pre-wrap'
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <div style={fieldLabel}>
        {label}
      </div>
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
        onChange={event =>
          onChange(event.target.value)
        }
        style={inputStyle}
      />
    </Field>
  );
}

function Area({
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
      <textarea
        rows={3}
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        style={{
          ...inputStyle,
          resize: 'vertical'
        }}
      />
    </Field>
  );
}

function Kpi({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div style={kpiCard}>
      <div
        style={{
          color: '#666',
          fontSize: '12px',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: '6px',
          fontSize: '28px',
          fontWeight: 800
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InfoLine({
  label,
  value
}: {
  label: string;
  value?: string;
}) {
  if (!value) return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        marginTop: '9px',
        paddingTop: '9px',
        borderTop: '1px solid #f0f0f0',
        fontSize: '13px'
      }}
    >
      <span style={{ color: '#777' }}>
        {label}
      </span>
      <strong style={{ textAlign: 'right' }}>
        {value}
      </strong>
    </div>
  );
}

function formatDate(value: string) {
  const date =
    new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('de-DE');
}

const panel: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ececec',
  borderRadius: '14px',
  padding: '18px',
  boxShadow: '0 3px 14px rgba(0,0,0,0.04)'
};

const kpiCard: React.CSSProperties = {
  ...panel,
  padding: '16px'
};

const fieldLabel: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  textTransform: 'uppercase',
  fontWeight: 700,
  marginBottom: '5px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #d5d5d5',
  borderRadius: '8px',
  padding: '10px',
  background: '#fff',
  font: 'inherit'
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
  padding: '12px 18px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 700
};


const profileTabButton: React.CSSProperties = {
  border: '1px solid #d6d6d6',
  background: '#fff',
  color: '#222',
  padding: '9px 14px',
  borderRadius: '999px',
  cursor: 'pointer',
  fontWeight: 700
};

const activeProfileTabButton: React.CSSProperties = {
  ...profileTabButton,
  background: '#0b7a3b',
  borderColor: '#0b7a3b',
  color: '#fff'
};

const smallButton: React.CSSProperties = {
  ...secondaryButton,
  padding: '7px 10px',
  fontSize: '12px'
};

const subPanel: React.CSSProperties = {
  background: '#f8faf9',
  border: '1px solid #e9eeeb',
  borderRadius: '11px',
  padding: '14px'
};

const metricCard: React.CSSProperties = {
  background: '#f6f8f7',
  borderRadius: '9px',
  padding: '11px'
};


const idealGroupCard: React.CSSProperties = {
  background: '#f8faf9',
  border: '1px solid #e8ede9',
  borderRadius: '12px',
  padding: '12px'
};

const idealSummaryRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  padding: '10px',
  background: '#fff',
  borderRadius: '9px',
  border: '1px solid #eeeeee'
};

const idealCodeBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '42px',
  height: '28px',
  padding: '0 8px',
  borderRadius: '999px',
  background: '#0b7a3b',
  color: '#fff',
  fontSize: '11px',
  fontWeight: 900
};

const idealCodeBadgeSmall: React.CSSProperties = {
  ...idealCodeBadge,
  minWidth: '34px',
  height: '23px',
  fontSize: '10px'
};


const sportMetricCard: React.CSSProperties = {
  background: '#f8faf9',
  border: '1px solid #e8ede9',
  borderRadius: '11px',
  padding: '12px'
};

const compactMetricCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #eeeeee',
  borderRadius: '8px',
  padding: '9px'
};

const sportMetricLabel: React.CSSProperties = {
  color: '#777',
  fontSize: '11px',
  textTransform: 'uppercase',
  fontWeight: 700
};

const sportMetricValue: React.CSSProperties = {
  marginTop: '5px',
  fontSize: '20px',
  fontWeight: 800
};

const profilePill: React.CSSProperties = {
  background: '#eef5f1',
  color: '#0b6b35',
  borderRadius: '999px',
  padding: '5px 9px',
  fontSize: '11px',
  fontWeight: 800
};


const skillAcSection: React.CSSProperties = {
  marginTop: '14px',
  padding: '14px',
  border: '1px solid #e8ede9',
  borderRadius: '12px',
  background: '#f9fbfa'
};

const skillAcSectionHeader: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 900,
  textTransform: 'uppercase',
  color: '#0b6b35'
};

const skillAcCompareCard: React.CSSProperties = {
  border: '1px solid #e8ede9',
  borderRadius: '12px',
  padding: '12px',
  background: '#f9fbfa'
};

const skillAcOldCard: React.CSSProperties = {
  background: '#f4f4f4',
  borderRadius: '9px',
  padding: '10px',
  minWidth: 0
};

const skillAcNewCard: React.CSSProperties = {
  background: '#eef8f2',
  borderRadius: '9px',
  padding: '10px',
  minWidth: 0
};

const skillAcTextCard: React.CSSProperties = {
  border: '1px solid #eeeeee',
  borderRadius: '10px',
  padding: '11px',
  background: '#fff'
};

const skillAcMiniLabel: React.CSSProperties = {
  color: '#777',
  fontSize: '10px',
  fontWeight: 800,
  textTransform: 'uppercase'
};

const historyRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  flexWrap: 'wrap',
  padding: '9px 0',
  borderBottom: '1px solid #eeeeee',
  fontSize: '13px'
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

const profileFormGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '12px'
};

const academyProfileHero:
  React.CSSProperties = {
  display: 'flex',
  justifyContent:
    'space-between',
  gap: '18px',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  padding: '18px',
  borderRadius: '16px',
  background: '#fff',
  border:
    '1px solid #e7e9e7'
};

const academyProfileIdentity:
  React.CSSProperties = {
  display: 'flex',
  gap: '14px',
  alignItems: 'center',
  minWidth: 0
};

const academyProfileAvatar:
  React.CSSProperties = {
  width: '64px',
  height: '64px',
  flex: '0 0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '16px',
  background: '#0b7a3b',
  color: '#fff'
};

const academyProfileJersey:
  React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 900
};

const academyProfileInitials:
  React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 900,
  letterSpacing: '.03em'
};

const academyProfileEyebrow:
  React.CSSProperties = {
  color: '#0b7a3b',
  fontSize: '9px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.07em'
};

const academyProfileName:
  React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '26px',
  lineHeight: 1.05,
  letterSpacing: '-.025em'
};

const academyProfileMeta:
  React.CSSProperties = {
  marginTop: '5px',
  color: '#666',
  fontSize: '12px',
  lineHeight: 1.4
};

const academyProfileBadges:
  React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  marginTop: '9px'
};

const academyProfileStatusBadge:
  React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#edf7f1',
  color: '#0b6b35',
  fontSize: '10px',
  fontWeight: 900
};

const academyProfileP12Badge:
  React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#111',
  color: '#fff',
  fontSize: '10px',
  fontWeight: 900
};

const academyProfileSoftBadge:
  React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '999px',
  background: '#f2f3f2',
  color: '#555',
  fontSize: '10px',
  fontWeight: 800
};

const academyProfileActions:
  React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end'
};

const academyProfileActionButton:
  React.CSSProperties = {
  border: '1px solid #a7ccb6',
  background: '#f3faf5',
  color: '#0b6b35',
  padding: '10px 13px',
  borderRadius: '9px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: '11px'
};

const academyProfileStats:
  React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '10px',
  marginTop: '12px'
};

const academyProfileStatCard:
  React.CSSProperties = {
  padding: '11px 12px',
  borderRadius: '11px',
  background: '#fff',
  border: '1px solid #e7e9e7'
};

const academyProfileStatLabel:
  React.CSSProperties = {
  display: 'block',
  color: '#858a85',
  fontSize: '8px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.05em'
};

const academyProfileStatValue:
  React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  color: '#161616',
  fontSize: '20px',
  lineHeight: 1
};

const academyProfileStatHint:
  React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  color: '#999',
  fontSize: '9px'
};

const modalBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '28px',
  zIndex: 9999,
  overflowY: 'auto'
};

const modalPanel: React.CSSProperties = {
  width: 'min(1100px, 100%)',
  background: '#f7f8f7',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.22)'
};

const scoreRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '14px',
  background: '#f7f8f7',
  borderRadius: '9px',
  padding: '10px'
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '14px',
  padding: '12px 0',
  borderBottom: '1px solid #eeeeee'
};

const idealEditRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    '100px repeat(5, minmax(0, 1fr))',
  gap: '10px',
  alignItems: 'end',
  background: '#f7f8f7',
  padding: '12px',
  borderRadius: '10px'
};
