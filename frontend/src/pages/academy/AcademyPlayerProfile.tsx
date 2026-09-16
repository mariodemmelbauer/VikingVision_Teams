import { useState } from 'react';

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
};

type AcademyMatch = {
  id: number;
  team: string;
  match_date: string;
  opponent: string;
  competition?: string;
  duration_minutes?: number;
  result?: string;
  notes?: string;
};

type TrainingAttendance = {
  session_id: number;
  academy_player_id: number;
  present: boolean;
  minutes: number;
  comment?: string;
  player_name?: string;
  session_date?: string;
  session_title?: string;
  session_type?: string;
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

export default function AcademyPlayerProfile({
  player,
  matches,
  trainingAttendance,
  idealAssessments,
  sportScienceTests,
  skillAcForms,
  accessToken,
  apiBase,
  onSaved,
  onClose
}: {
  player: AcademyPlayer;
  matches: AcademyMatch[];
  trainingAttendance: TrainingAttendance[];
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

  const playerTraining =
    trainingAttendance.filter(
      row =>
        String(
          row.academy_player_id
        ) === String(player.id)
    );

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

  const totalTrainingMinutes =
    playerTraining.reduce(
      (sum, row) =>
        sum +
        Number(row.minutes ?? 0),
      0
    );

  const attendanceCount =
    playerTraining.filter(
      row => row.present
    ).length;

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
    const knownCodes = [
      'OFF1',
      'OFF2',
      'OFF3',
      'DEF1',
      'DEF3'
    ];

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
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            gap: '12px',
            alignItems:
              'flex-start',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div className="eyebrow">
              AKAVision Spielerprofil
            </div>

            <h2
              style={{
                margin:
                  '4px 0 0 0'
              }}
            >
              {player.jersey_number
                ? `${player.jersey_number} · `
                : ''}
              {player.name}
            </h2>

            <div
              style={{
                marginTop: '5px',
                color: '#666'
              }}
            >
              {[
                player.team,
                player.primary_position,
                player.player_role
              ]
                .filter(Boolean)
                .join(' · ')}
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
                setEditing(
                  value => !value
                )
              }
              style={primaryButton}
            >
              {editing
                ? 'Bearbeiten schließen'
                : 'Spieler bearbeiten'}
            </button>

            <button
              type="button"
              onClick={() =>
                setShowSportScienceForm(
                  value => !value
                )
              }
              style={primaryButton}
            >
              + Sport-Science-Test
            </button>

            <button
              type="button"
              onClick={() => {
                resetIdealForm();
                setShowIdealForm(
                  value => !value
                );
              }}
              style={primaryButton}
            >
              + Ideale-Bewertung
            </button>

            <button
              type="button"
              onClick={() => {
                resetSkillAcForm();
                setShowSkillAcForm(
                  value => !value
                );
              }}
              style={primaryButton}
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
        </div>

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
              <h3 style={{ margin: 0 }}>
                {editingSkillAcId != null
                  ? 'Skill / AC bearbeiten'
                  : 'Neues Skill-/AC-Formular'}
              </h3>

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

            <div
              style={{
                ...profileFormGrid,
                marginTop: '14px'
              }}
            >
              <TextInput
                label="Periode alt"
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
                label="Team alt"
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
                label="Autor alt"
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',
                gap: '12px',
                marginTop: '14px'
              }}
            >
              <Area
                label="Skill alt"
                value={skillAcForm.skill_old}
                onChange={value =>
                  updateSkillAcField(
                    'skill_old',
                    value
                  )
                }
              />

              <Area
                label="Skill neu"
                value={skillAcForm.skill_new}
                onChange={value =>
                  updateSkillAcField(
                    'skill_new',
                    value
                  )
                }
              />

              <Area
                label="AC alt"
                value={skillAcForm.ac_old}
                onChange={value =>
                  updateSkillAcField(
                    'ac_old',
                    value
                  )
                }
              />

              <Area
                label="AC neu"
                value={skillAcForm.ac_new}
                onChange={value =>
                  updateSkillAcField(
                    'ac_new',
                    value
                  )
                }
              />

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

              <Area
                label="Reflexion"
                value={skillAcForm.reflection}
                onChange={value =>
                  updateSkillAcField(
                    'reflection',
                    value
                  )
                }
              />
            </div>

            <button
              type="button"
              onClick={saveSkillAcForm}
              disabled={savingSkillAc}
              style={{
                ...primaryButton,
                marginTop: '16px'
              }}
            >
              {savingSkillAc
                ? 'Speichert…'
                : editingSkillAcId != null
                  ? 'Skill / AC aktualisieren'
                  : 'Skill / AC speichern'}
            </button>
          </section>
        )}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '10px',
            marginTop: '18px'
          }}
        >
          <Kpi
            label="Trainingsminuten"
            value={totalTrainingMinutes}
          />
          <Kpi
            label="Anwesenheiten"
            value={attendanceCount}
          />
          <Kpi
            label="Ideale-Bewertungen"
            value={playerIdeals.length}
          />
          <Kpi
            label="Sport-Science-Tests"
            value={playerTests.length}
          />
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '14px',
            marginTop: '18px'
          }}
        >
          <div style={panel}>
            <h3 style={{ marginTop: 0 }}>
              Stammdaten
            </h3>

            <InfoLine
              label="Geburtsdatum"
              value={
                player.birth_date
                  ? formatDate(
                      player.birth_date
                    )
                  : undefined
              }
            />
            <InfoLine
              label="Position"
              value={
                player.primary_position
              }
            />
            <InfoLine
              label="Rolle"
              value={
                player.player_role
              }
            />
            <InfoLine
              label="Fuß"
              value={
                player.preferred_foot
              }
            />
            <InfoLine
              label="Nationalität"
              value={
                player.nationality
              }
            />
            <InfoLine
              label="Größe"
              value={player.height}
            />
            <InfoLine
              label="Status"
              value={
                player.squad_status
              }
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

          <div style={panel}>
            <h3 style={{ marginTop: 0 }}>
              Sport Science
            </h3>

            {!latestTest ? (
              <div style={{ color: '#777' }}>
                Noch keine Testdaten vorhanden.
              </div>
            ) : (
              <>
                <InfoLine
                  label="Letzter Test"
                  value={formatDate(
                    latestTest.test_date
                  )}
                />
                <InfoLine
                  label="Gewicht"
                  value={
                    latestTest.body_weight_kg != null
                      ? `${latestTest.body_weight_kg} kg`
                      : undefined
                  }
                />
                <InfoLine
                  label="Körperfett"
                  value={
                    latestTest.body_fat_percent != null
                      ? `${latestTest.body_fat_percent} %`
                      : undefined
                  }
                />
                <InfoLine
                  label="10 m"
                  value={
                    latestTest.sprint_10m_seconds != null
                      ? `${latestTest.sprint_10m_seconds} s`
                      : undefined
                  }
                />
                <InfoLine
                  label="30 m"
                  value={
                    latestTest.sprint_30m_seconds != null
                      ? `${latestTest.sprint_30m_seconds} s`
                      : undefined
                  }
                />
                <InfoLine
                  label="CMJ"
                  value={
                    latestTest.cmj_cm != null
                      ? `${latestTest.cmj_cm} cm`
                      : undefined
                  }
                />
                <InfoLine
                  label="Readiness"
                  value={
                    latestTest.readiness
                  }
                />
              </>
            )}
          </div>

          <div style={panel}>
            <h3 style={{ marginTop: 0 }}>
              Letzte Ideale-Bewertung
            </h3>

            {!latestIdeal ? (
              <div style={{ color: '#777' }}>
                Noch keine Ideale-Bewertung vorhanden.
              </div>
            ) : (
              <>
                <InfoLine
                  label="Periode"
                  value={
                    latestIdeal.period_label
                  }
                />
                <InfoLine
                  label="Datum"
                  value={
                    latestIdeal.assessment_date
                      ? formatDate(
                          latestIdeal.assessment_date
                        )
                      : undefined
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    editIdealAssessment(
                      latestIdeal
                    )
                  }
                  style={{
                    ...secondaryButton,
                    marginTop: '12px',
                    padding: '8px 12px'
                  }}
                >
                  Bewertung bearbeiten
                </button>

                <div
                  style={{
                    display: 'grid',
                    gap: '8px',
                    marginTop: '12px'
                  }}
                >
                  {latestIdeal.scores.map(
                    score => (
                      <div
                        key={`${latestIdeal.id}-${score.ideal_code}`}
                        style={scoreRow}
                      >
                        <strong>
                          {score.ideal_code}
                        </strong>

                        <span>
                          {score.rating != null
                            ? `Rating ${score.rating}`
                            : score.status_quo != null
                              ? `Status ${score.status_quo}`
                              : '–'}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>

          <div style={panel}>
            <h3 style={{ marginTop: 0 }}>
              Skill / AC
            </h3>

            {playerSkillAc.length === 0 ? (
              <div style={{ color: '#777' }}>
                Noch keine Skill-/AC-Daten vorhanden.
              </div>
            ) : (
              playerSkillAc
                .slice(0, 2)
                .map(form => (
                  <div
                    key={form.id}
                    style={{
                      marginBottom: '12px'
                    }}
                  >
                    <strong>
                      {[
                        form.period_old,
                        form.period_new
                      ]
                        .filter(Boolean)
                        .join(' → ') ||
                        'Skill / AC'}
                    </strong>

                    {form.biggest_changes && (
                      <div
                        style={{
                          marginTop: '5px'
                        }}
                      >
                        {
                          form.biggest_changes
                        }
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        editSkillAcForm(form)
                      }
                      style={{
                        ...secondaryButton,
                        marginTop: '8px',
                        padding: '7px 10px'
                      }}
                    >
                      Bearbeiten
                    </button>
                  </div>
                ))
            )}
          </div>
        </section>

        <section
          style={{
            ...panel,
            marginTop: '14px'
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Trainingshistorie
          </h3>

          {playerTraining.length === 0 ? (
            <div style={{ color: '#777' }}>
              Noch keine Trainingsdaten vorhanden.
            </div>
          ) : (
            playerTraining
              .slice(0, 10)
              .map(
                (
                  row,
                  index
                ) => (
                  <div
                    key={`${row.session_id}-${index}`}
                    style={rowStyle}
                  >
                    <div>
                      <strong>
                        {row.session_date
                          ? formatDate(
                              row.session_date
                            )
                          : 'Training'}
                      </strong>

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
                        {[
                          row.session_title,
                          row.session_type
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign:
                          'right'
                      }}
                    >
                      <strong>
                        {row.minutes} Min.
                      </strong>
                      <div
                        style={{
                          color:
                            row.present
                              ? '#0b7a3b'
                              : '#a00000',
                          fontSize:
                            '12px'
                        }}
                      >
                        {row.present
                          ? 'Anwesend'
                          : 'Abwesend'}
                      </div>
                    </div>
                  </div>
                )
              )
          )}
        </section>
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

