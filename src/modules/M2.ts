import type { ModuleConfig, TrackerConfig } from '../shell/types';

/** Concise helper to build a single recognition tracker. */
function mcq(
  prompt_id: string,
  question: string,
  opts: [label: string, is_correct: boolean, explanation: string][],
  max_attempts = 2,
): TrackerConfig {
  return {
    kind: 'recognition',
    prompt: {
      prompt_id,
      trigger: { kind: 'on_load' },
      question,
      options: opts.map(([label, is_correct, explanation]) => ({ label, is_correct, explanation })),
      max_attempts,
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

  // Eight vocabulary recognition tasks — any order. Each prompt asks the
  // learner to pick the correct definition from a small option set.
  hidden_objective: {
    kind: 'compound',
    sequence: 'any_order',
    children: [
      mcq('M2-vt', 'Which reading shows **tidal volume (Vt)** — volume of one breath?', [
        ['Vte / Vt in mL (typical adult 350–600)', true, 'Tidal volume is per-breath volume in mL.'],
        ['VE in L/min', false, 'VE is per-minute volume, not per-breath.'],
        ['RR in breaths/min', false, 'RR is a frequency, not a volume.'],
        ['PIP in cmH2O', false, 'PIP is a pressure.'],
      ]),
      mcq('M2-ve', 'Which reading shows **minute ventilation (VE)** — total volume per minute?', [
        ['VE in L/min', true, 'VE = Vt × RR, in L/min. Typical adult 6–10.'],
        ['Vte in mL', false, 'Vte is per-breath, not per-minute.'],
        ['Actual RR', false, 'RR is a frequency.'],
        ['Total PEEP', false, 'PEEP is a pressure.'],
      ]),
      mcq('M2-peep', 'Which reading shows **PEEP** — the end-expiratory floor pressure?', [
        ['The PEEP control value (cmH2O)', true, 'PEEP sets the floor pressure at end-expiration.'],
        ['PIP', false, 'PIP is the peak, not the floor.'],
        ['Pplat', false, 'Pplat is mid-inspiratory.'],
        ['DP', false, 'Driving pressure = Pplat − PEEP.'],
      ]),
      mcq('M2-fio2', 'Which reading shows **FiO2** — the inspired oxygen fraction?', [
        ['The FiO2 control (typically 21–100%)', true, 'FiO2 is the fraction of inspired oxygen.'],
        ['SpO2', false, 'SpO2 is what the patient saturates at — a measured value, not an inspired setting.'],
        ['PEEP', false, 'PEEP is a pressure.'],
        ['VE', false, 'VE is minute ventilation.'],
      ]),
      mcq('M2-pip', 'Which reading shows **peak inspiratory pressure (PIP)** — the highest pressure during a breath?', [
        ['PIP (top of the Airway Pressure waveform)', true, 'PIP is the maximum during inspiration.'],
        ['Pplat', false, 'Pplat is lower than peak — resistive component is removed during the hold.'],
        ['PEEP', false, 'PEEP is the floor.'],
        ['DP', false, 'Driving pressure ≠ peak pressure.'],
      ]),
      mcq('M2-pplat', 'Which reading shows **plateau pressure (Pplat)** — the alveolar pressure during an inspiratory hold?', [
        ['Pplat (after an inspiratory hold)', true, 'Pplat is alveolar pressure with flow stopped, revealed by holding inspiration.'],
        ['PIP', false, 'PIP includes the resistive component; Pplat does not.'],
        ['PEEP', false, 'PEEP is the end-expiratory baseline.'],
        ['VE', false, 'VE is a volume, not a pressure.'],
      ]),
      mcq('M2-ie', 'Which reading shows the **I:E ratio** — inspiratory time vs expiratory time?', [
        ['I:E (e.g. 1:2)', true, 'I:E expresses inspiratory time relative to expiratory time within one breath cycle.'],
        ['RR', false, 'RR is a frequency, not a ratio.'],
        ['Vt/PBW', false, 'Vt/PBW is volume per kg of predicted body weight.'],
        ['DP', false, 'Driving pressure is unrelated to timing.'],
      ]),
      mcq('M2-rr', 'Which reading shows the **set respiratory rate (RR)** — what the operator dialed in?', [
        ['The Rate control in the ventilator settings', true, 'The Rate setting is operator-chosen. The Actual RR (Measured Values) may exceed it if the patient triggers.'],
        ['Actual RR (Measured Values)', false, 'Actual RR is the measured result, not the operator setting.'],
        ['Vte', false, 'Vte is a volume.'],
        ['SpO2', false, 'SpO2 is oxygen saturation.'],
      ]),
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
  user_facing_task: "Your senior runs you through a vocabulary check on the ventilator. They'll name eight values; for each, you click on the matching reading on the display.",
  success_criteria_display: [
    'Correctly match each term to its display element.',
    'You have two attempts per term before the answer is revealed.',
  ],
  task_framing_style: 'C',

  key_points: [
    'Eight core terms: Vt, VE, PEEP, FiO2, PIP, Pplat, I:E, RR.',
    'Set values = operator input. Measured values = what the system is doing.',
    'Gaps between set and measured Vt = leak. Gaps between set and measured rate = patient drive.',
    'Plateau pressure (Pplat) is the alveolar pressure during an inspiratory hold.',
  ],
};
