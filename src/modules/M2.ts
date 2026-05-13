import type { ModuleConfig, TrackerConfig, ControlName, ReadoutName } from '../shell/types';

/**
 * Click-target recognition helper. Per MASTER_SHELL_v3 §6 M2 + Pattern B,
 * vocabulary modules where the learning is "read the display" must use
 * click-target mode — the learner clicks the actual reading or control,
 * not a multiple-choice text option.
 *
 * The `options` array is kept as the canonical record (drives telemetry +
 * "Show me" fallback) but is not shown to the learner when `click_targets`
 * is non-empty; the question banner appears above the Measured Values
 * strip and the matching tiles become clickable.
 */
function clickTargetRecognition(
  prompt_id: string,
  question: string,
  targets: Array<{
    kind: 'readout' | 'control';
    name: ReadoutName | ControlName;
    label: string;
    is_correct: boolean;
    explanation: string;
  }>,
): TrackerConfig {
  return {
    kind: 'recognition',
    prompt: {
      prompt_id,
      trigger: { kind: 'on_load' },
      question,
      options: targets.map(t => ({
        label: t.label,
        is_correct: t.is_correct,
        explanation: t.explanation,
      })),
      click_targets: targets.map(t => ({
        element:
          t.kind === 'readout'
            ? { kind: 'readout', name: t.name as ReadoutName }
            : { kind: 'control', name: t.name as ControlName },
        label: t.label,
        is_correct: t.is_correct,
        explanation: t.explanation,
      })),
    },
  };
}

export const M2: ModuleConfig = {
  id: 'M2',
  number: 2,
  title: 'Vocabulary and the Vent Display',
  track: 'Foundations',
  estimated_minutes: 12,
  briefing: {
    tagline: 'Read any vent display in under a minute.',
    overview: "Every ventilator says the same things in slightly different ways. Vt, Pplat, PEEP, MV, RR. Once you know what each label means and where it lives on the screen, you can walk up to any ventilator and orient yourself in under a minute. The other thing worth knowing right now: every value on the display is either something you set, or something the patient and machine are doing as a result. Confusing the two is one of the most common bedside mistakes.",
    what_youll_do: [
      'Set values and measured values are different categories, even when they share a name.',
      'Plateau pressure is what the alveoli actually feel. Peak pressure includes the cost of pushing gas through tubes.',
      'Minute ventilation is just rate times tidal volume. Most "where did the CO2 go" questions start here.',
    ],
  },
  visible_learning_objectives: [
    'Match ventilator terminology to display elements.',
    'Distinguish set values from measured values.',
  ],

  primer_questions: [
    {
      id: 'M2-P1',
      prompt: "What is the difference between 'set rate' and 'measured rate'?",
      options: [
        { label: 'They are the same thing displayed in different units', is_correct: false, explanation: 'These are conceptually different values. They may be equal in a fully passive patient, but their meanings are not interchangeable.' },
        { label: "Set rate is the operator's input; measured rate is what the patient is actually doing", is_correct: true, explanation: 'Every ventilator distinguishes what you tell it (set) from what the system actually does (measured). When a patient triggers breaths above the set rate, measured exceeds set — and that gap is clinically meaningful.' },
        { label: 'Set rate is shown only in volume modes; measured rate only in pressure modes', is_correct: false, explanation: 'Both set and measured values exist in every mode.' },
        { label: 'Measured rate is during inspiration; set rate during expiration', is_correct: false, explanation: 'Rate is per-minute, not per-phase.' },
      ],
    },
    {
      id: 'M2-P2',
      prompt: 'Plateau pressure is best understood as:',
      options: [
        { label: 'The highest pressure the ventilator produces during a breath', is_correct: false, explanation: 'That describes peak pressure, not plateau. Peak includes the resistive component of pushing gas through tubes; plateau strips that away.' },
        { label: 'The pressure measured during a brief inspiratory hold, reflecting alveolar pressure', is_correct: true, explanation: 'When you pause flow at end-inspiration, pressure equilibrates with the alveoli. This is the gateway to thinking about compliance vs. resistance.' },
        { label: 'The pressure remaining at end-expiration', is_correct: false, explanation: "That's PEEP." },
        { label: 'The average pressure across the entire breath', is_correct: false, explanation: "That's mean airway pressure, which matters for oxygenation but is not plateau." },
      ],
    },
    {
      id: 'M2-P3',
      prompt: 'Minute ventilation is calculated as:',
      options: [
        { label: 'Respiratory rate × tidal volume', is_correct: true, explanation: 'Minute ventilation is how much air moves per minute — breaths per minute times volume per breath. The foundational equation.' },
        { label: 'Respiratory rate ÷ tidal volume', is_correct: false, explanation: 'That ratio is the rapid shallow breathing index (RSBI), a weaning predictor — not minute ventilation.' },
        { label: 'Tidal volume × peak pressure', is_correct: false, explanation: 'Pressure and volume are not multiplied to get a flow-per-time quantity.' },
        { label: 'PEEP × respiratory rate', is_correct: false, explanation: 'PEEP is a pressure, not a volume; this combination has no physiologic meaning.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'passive_baseline_vc',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 14, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 70, resistance: 10, spontaneousRate: 0 },
    },
    unlocked_controls: [],
    visible_readouts: ['pip', 'plat', 'vte', 'peep', 'fio2', 'actualRate', 'mve', 'ieRatio'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  // Eight vocabulary recognitions in click-target mode. Per MASTER_SHELL_v3
  // §6 M2 + Pattern B: vocabulary modules where the learning is "read the
  // display" must let the learner click the actual reading or control on
  // the sim. The strict-order sequence ensures the learner sees each
  // question in deliberate succession; click feedback (wrong tile →
  // popup with explanation; correct tile → popup + Continue) advances.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    children: [
      clickTargetRecognition(
        'M2-vt',
        'Click the reading that shows **tidal volume (Vt)** — the volume of one breath.',
        [
          { kind: 'readout', name: 'vte', label: 'Vte', is_correct: true, explanation: 'Vte is the volume of one breath (mL). Typical adult 350–600. Vt or Vte is the standard label.' },
          { kind: 'readout', name: 'mve', label: 'VE', is_correct: false, explanation: 'VE is per-minute volume (Vt × RR), not per-breath.' },
          { kind: 'readout', name: 'actualRate', label: 'RR', is_correct: false, explanation: 'RR is a frequency (breaths/min), not a volume.' },
          { kind: 'readout', name: 'pip', label: 'PIP', is_correct: false, explanation: 'PIP is a pressure, not a volume.' },
        ],
      ),
      clickTargetRecognition(
        'M2-ve',
        'Click the reading that shows **minute ventilation (VE)** — total volume per minute.',
        [
          { kind: 'readout', name: 'mve', label: 'VE', is_correct: true, explanation: 'VE = Vt × RR, in L/min. Typical adult 6–10.' },
          { kind: 'readout', name: 'vte', label: 'Vte', is_correct: false, explanation: 'Vte is per-breath, not per-minute.' },
          { kind: 'readout', name: 'actualRate', label: 'RR', is_correct: false, explanation: 'RR is a frequency.' },
          { kind: 'readout', name: 'totalPeep', label: 'tPEEP', is_correct: false, explanation: 'PEEP is a pressure.' },
        ],
      ),
      clickTargetRecognition(
        'M2-peep',
        'Click the **PEEP** control — the end-expiratory floor pressure the operator dialed in.',
        [
          { kind: 'control', name: 'peep', label: 'PEEP control', is_correct: true, explanation: 'PEEP sets the floor pressure at end-expiration. Typical adult 5–15 cmH2O.' },
          { kind: 'readout', name: 'pip', label: 'PIP', is_correct: false, explanation: 'PIP is the peak pressure, not the floor.' },
          { kind: 'readout', name: 'plat', label: 'Pplat', is_correct: false, explanation: 'Pplat is mid-inspiratory plateau pressure.' },
          { kind: 'readout', name: 'drivingPressure', label: 'DP', is_correct: false, explanation: 'Driving pressure = Pplat − PEEP. It uses PEEP but is not PEEP.' },
        ],
      ),
      clickTargetRecognition(
        'M2-fio2',
        'Click the **FiO2** control — the inspired oxygen fraction.',
        [
          { kind: 'control', name: 'fiO2', label: 'FiO2 control', is_correct: true, explanation: 'FiO2 is the fraction of inspired oxygen (21–100%). Operator-set.' },
          { kind: 'control', name: 'peep', label: 'PEEP control', is_correct: false, explanation: 'PEEP is a pressure setting, not gas concentration.' },
          { kind: 'readout', name: 'mve', label: 'VE', is_correct: false, explanation: 'VE is minute ventilation — a volume per time.' },
          { kind: 'control', name: 'respiratoryRate', label: 'Rate control', is_correct: false, explanation: 'Rate sets breaths per minute, not oxygen fraction.' },
        ],
      ),
      clickTargetRecognition(
        'M2-pip',
        'Click the reading that shows **peak inspiratory pressure (PIP)** — the highest pressure during a breath.',
        [
          { kind: 'readout', name: 'pip', label: 'PIP', is_correct: true, explanation: 'PIP is the maximum pressure during inspiration — the top of the Airway Pressure waveform.' },
          { kind: 'readout', name: 'plat', label: 'Pplat', is_correct: false, explanation: 'Pplat is lower than peak — the resistive component is removed during the inspiratory hold.' },
          { kind: 'readout', name: 'totalPeep', label: 'tPEEP', is_correct: false, explanation: 'PEEP is the floor pressure, not the peak.' },
          { kind: 'readout', name: 'drivingPressure', label: 'DP', is_correct: false, explanation: 'Driving pressure ≠ peak pressure.' },
        ],
      ),
      clickTargetRecognition(
        'M2-pplat',
        'Click the reading that shows **plateau pressure (Pplat)** — the alveolar pressure during an inspiratory hold.',
        [
          { kind: 'readout', name: 'plat', label: 'Pplat', is_correct: true, explanation: 'Pplat is alveolar pressure with flow stopped, revealed by holding inspiration. The number that matters for compliance.' },
          { kind: 'readout', name: 'pip', label: 'PIP', is_correct: false, explanation: 'PIP includes the resistive component; Pplat does not.' },
          { kind: 'readout', name: 'totalPeep', label: 'tPEEP', is_correct: false, explanation: 'PEEP is the end-expiratory baseline, not the plateau.' },
          { kind: 'readout', name: 'mve', label: 'VE', is_correct: false, explanation: 'VE is a volume, not a pressure.' },
        ],
      ),
      clickTargetRecognition(
        'M2-ie',
        'Click the reading that shows the **I:E ratio** — inspiratory time vs expiratory time.',
        [
          { kind: 'readout', name: 'ieRatio', label: 'I:E', is_correct: true, explanation: 'I:E expresses inspiratory time relative to expiratory time within one breath cycle (e.g. 1:2).' },
          { kind: 'readout', name: 'actualRate', label: 'RR', is_correct: false, explanation: 'RR is a frequency, not a ratio.' },
          { kind: 'readout', name: 'rsbi', label: 'RSBI', is_correct: false, explanation: 'RSBI is the rapid shallow breathing index (RR / Vt), used for weaning prediction.' },
          { kind: 'readout', name: 'drivingPressure', label: 'DP', is_correct: false, explanation: 'Driving pressure is unrelated to timing.' },
        ],
      ),
      clickTargetRecognition(
        'M2-rr',
        'Last one — click the **Rate** control that shows the **set respiratory rate** chosen by the operator.',
        [
          { kind: 'control', name: 'respiratoryRate', label: 'Rate control', is_correct: true, explanation: 'The Rate setting is operator-chosen. The measured RR (in the Measured Values strip) may exceed it if the patient triggers extra breaths.' },
          { kind: 'readout', name: 'actualRate', label: 'Actual RR', is_correct: false, explanation: 'Actual RR is the measured result, not the operator setting. They can differ.' },
          { kind: 'readout', name: 'vte', label: 'Vte', is_correct: false, explanation: 'Vte is a volume, not a rate.' },
          { kind: 'control', name: 'fiO2', label: 'FiO2 control', is_correct: false, explanation: 'FiO2 is the oxygen fraction, not the rate.' },
        ],
      ),
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Set vs. measured.** Every value on the ventilator display is one of two things: a setting you (or the previous clinician) chose, or a measurement of what the system is actually doing. Confusing them is the most common bedside error.' },
    { kind: 'callout', tone: 'info', markdown: 'A gap between **set Vt** and **delivered Vt** usually means a leak. A gap between **set rate** and **measured rate** usually means patient effort.' },
    { kind: 'prose', markdown: 'Eight terms to know cold: tidal volume (Vt), minute ventilation (VE or MV), PEEP, FiO2, peak pressure (PIP), plateau pressure (Pplat), I:E ratio, and respiratory rate (RR — both set and measured).' },
  ],

  hint_ladder: {
    tier1: 'Look at the Measured Values strip on the right. Each label corresponds to a specific term.',
    tier2: 'Vte is the volume of one breath. VE is the volume per minute (Vt × RR).',
    tier3: { hint_text: 'Use "Show me" to highlight each readout.' },
  },

  summative_quiz: [
    {
      id: 'M2-Q1',
      prompt: "On a ventilator display, you see 'Pplat 22' next to a button labeled 'inspiratory hold.' What does 22 represent?",
      options: [
        { label: 'The peak inspiratory pressure', is_correct: false },
        { label: 'The pressure during a brief end-inspiratory pause, reflecting alveolar pressure', is_correct: true },
        { label: 'The pressure at end-expiration', is_correct: false },
        { label: 'The driving pressure', is_correct: false },
      ],
      explanation: 'Pplat is plateau pressure, measured by pausing flow at end-inspiration so the system equilibrates with alveolar pressure. This strips out the resistive component and is the key measurement for assessing compliance.',
    },
    {
      id: 'M2-Q2',
      prompt: 'A ventilator display shows: set Vt 450, delivered Vt 380, set rate 16, measured rate 16. The most likely explanation is:',
      options: [
        { label: 'The patient is taking spontaneous breaths', is_correct: false },
        { label: 'There is a leak in the circuit', is_correct: true },
        { label: 'The ventilator is malfunctioning', is_correct: false },
        { label: 'The settings are misconfigured', is_correct: false },
      ],
      explanation: 'Set values are operator inputs; delivered values are measured outputs. A gap between set and delivered tidal volume — with the same rate — strongly suggests gas is escaping (cuff leak or circuit leak).',
    },
    {
      id: 'M2-Q3',
      prompt: 'A patient has tidal volume 500 mL and respiratory rate 14. Minute ventilation is approximately:',
      options: [
        { label: '3.5 L/min', is_correct: false },
        { label: '7 L/min', is_correct: true },
        { label: '14 L/min', is_correct: false },
        { label: '35 L/min', is_correct: false },
      ],
      explanation: 'MV = Vt × RR = 0.5 L × 14 = 7 L/min. Typical adult minute ventilation.',
    },
    {
      id: 'M2-Q4',
      prompt: 'A patient on volume control has set rate 12, measured rate 22. This tells you:',
      options: [
        { label: 'The ventilator is malfunctioning', is_correct: false },
        { label: 'The patient is taking many spontaneous breaths above the set rate', is_correct: true },
        { label: 'The patient is over-sedated', is_correct: false },
        { label: 'There is a leak doubling the breath count', is_correct: false },
      ],
      explanation: 'Measured rate exceeding set rate by a large margin means active patient triggering. A gap of 10 breaths/min suggests significant patient drive — possibly pain, agitation, hypercapnia, or acidosis. Flag to assess the patient.',
    },
    {
      id: 'M2-Q5',
      prompt: 'Which set-versus-measured pair would most likely indicate a problem?',
      options: [
        { label: 'Set rate 14, measured rate 14', is_correct: false },
        { label: 'Set PEEP 5, measured PEEP 5', is_correct: false },
        { label: 'Set Vt 500, delivered Vt 320', is_correct: true },
        { label: 'Set FiO2 0.4, measured FiO2 0.4', is_correct: false },
      ],
      explanation: 'Significant gap between set and delivered tidal volume is abnormal and warrants investigation — most commonly a leak.',
    },
  ],

  explore_card: {
    patient_context: 'Same passive patient as M1. This is a vocabulary module — you\'re still in "learn to read" mode.',
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'Set values (operator inputs)', description: 'set Vt, set rate, PEEP, FiO2, I:E ratio.' },
      { name: 'Measured values (what the patient is doing)', description: 'delivered Vt, measured rate, minute ventilation, peak pressure, plateau pressure.' },
    ],
    suggestions: [
      'Find the eight terms from the reading on the actual display. They\'re arranged differently than the table.',
      'Notice which values are "set" (operator-controlled) and which are "measured" (consequences). Some look almost the same name.',
      'Make a mental note of where each lives on the display before the task starts.',
    ],
  },
  user_facing_task: "Your senior runs you through a vocabulary check on the ventilator. They'll name eight values; for each, you click on the matching reading or control on the display.",
  success_criteria_display: [
    'Eight values, in order. Click the matching tile or control for each.',
    "Wrong clicks aren't punished — the popup explains why it's wrong; correct clicks advance to the next.",
  ],
  task_framing_style: 'C',

  key_points: [
    'Eight core terms: Vt, VE, PEEP, FiO2, PIP, Pplat, I:E, RR.',
    'Set values = operator input. Measured values = what the system is doing.',
    'Gaps between set and measured Vt = leak. Gaps between set and measured rate = patient drive.',
    'Plateau pressure (Pplat) is the alveolar pressure during an inspiratory hold.',
  ],
};
