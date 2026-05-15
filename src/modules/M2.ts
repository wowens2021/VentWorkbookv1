import type { ModuleConfig, TrackerConfig, ControlName, ReadoutName } from '../shell/types';

/**
 * M2 — Vocabulary and the Vent Display
 * Track: Foundations · Archetype: vocabulary (click-target) · 13 min
 * Anchor chapters: VB Ch. 1, Ch. 3, Ch. 7
 *
 * Specced verbatim against docs/MODULE_SPECS_v3.md §M2.
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
      options: targets.map(t => ({ label: t.label, is_correct: t.is_correct, explanation: t.explanation })),
      click_targets: targets.map(t => ({
        element: t.kind === 'readout'
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
  estimated_minutes: 13,
  briefing: {
    tagline: 'Read any vent display in under a minute.',
    overview:
      "Every ventilator says the same things in slightly different ways. Vt, Pplat, PEEP, MV, RR. Once you know what each label means and where it lives on the screen, you can walk up to any ventilator and orient yourself in under a minute. The other thing worth knowing right now: every value on the display is either something you set, or something the patient and machine are doing as a result. Confusing the two is one of the most common bedside mistakes.",
    what_youll_do: [
      'Set values and measured values are different categories, even when they share a name.',
      'Plateau pressure is what the alveoli actually feel. Peak pressure includes the cost of pushing gas through tubes.',
      'Minute ventilation is just rate times tidal volume. Most "where did the CO2 go" questions start here.',
    ],
  },

  visible_learning_objectives: [
    'Define eight bedside terms: Vt, MVe, PEEP, FiO2, PIP, Pplat, I:E, set rate.',
    'For each term, point to it on a live display.',
    'State which terms are set vs measured.',
    'Predict which readouts change when each control moves.',
  ],

  primer_questions: [
    {
      id: 'M2-P1',
      prompt: 'Compliance, in the simplest form, is:',
      options: [
        { label: 'Change in volume divided by change in pressure.', is_correct: true, explanation: 'Owens, Commandment I. Normal respiratory-system compliance is ~100 mL/cmH2O off the vent and 70–80 on it.' },
        { label: 'Change in pressure divided by change in volume.', is_correct: false, explanation: "That's elastance — the reciprocal." },
        { label: 'The same as airway resistance.', is_correct: false, explanation: 'Compliance is a property of the lung-and-chest-wall system; resistance is a property of the airways.' },
        { label: 'A reading on the vent display labeled "C".', is_correct: false, explanation: 'Most vents don\'t display compliance directly. You compute it: Vt / (Pplat − PEEP).' },
      ],
    },
    {
      id: 'M2-P2',
      prompt: 'In VCV, Vte and set Vt should be nearly equal. If Vte is consistently 90 mL less than set Vt, the most common reason is:',
      options: [
        { label: 'A leak — cuff, circuit, or bronchopleural fistula.', is_correct: true, explanation: 'Volume in ≠ volume out → something escaped.' },
        { label: "The patient's lungs absorbed it.", is_correct: false, explanation: "Lungs don't absorb air; gas exchange is at the alveolar level and is a tiny fraction of Vt." },
        { label: 'PEEP is too low.', is_correct: false, explanation: "PEEP doesn't change Vte directly in VCV." },
        { label: 'The flow trigger is too sensitive.', is_correct: false, explanation: 'Affects triggering, not delivered volume.' },
      ],
    },
    {
      id: 'M2-P3',
      prompt: 'I:E ratio of 1:2 on the display means:',
      options: [
        { label: 'Inspiration takes twice as long as expiration.', is_correct: false, explanation: "That's 2:1 (inverse ratio)." },
        { label: 'Expiration takes twice as long as inspiration.', is_correct: true, explanation: 'Normal-ish for adults at rest. Book Ch. 9.' },
        { label: 'The set rate is 1, and the actual is 2.', is_correct: false, explanation: "I:E isn't about rate." },
        { label: "There's two seconds for inspiration and one for expiration.", is_correct: false, explanation: "That describes a 2:1 ratio — the inverse pattern. Obstructive patients especially would suffer from it. The display shows 1:2, which is the normal direction." },
      ],
    },
  ],

  scenario: {
    preset_id: 'M2_healthy_baseline_vcv',
    preset: {
      // Same patient as M1. Vocabulary doesn't require sickness.
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 14, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 55, resistance: 10, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    // Adds iTime to M1's unlocks — last term in the vocabulary is I:E,
    // and the only way to see I:E move on the display is to move iTime.
    unlocked_controls: ['tidalVolume', 'respiratoryRate', 'peep', 'fiO2', 'iTime'],
    visible_readouts: ['pip', 'plat', 'vte', 'mve', 'totalPeep', 'autoPeep', 'actualRate', 'ieRatio'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  // Eight click-target recognitions in any order. These eight terms
  // collectively define the rest of the curriculum — a learner who
  // confuses Vt with Vte at M3 will be lost by M7.
  hidden_objective: {
    kind: 'compound',
    sequence: 'any_order',
    reset_between: false,
    children: [
      clickTargetRecognition('M2-vt', 'Click the set tidal volume control — the order you ordered.', [
        { kind: 'control', name: 'tidalVolume', label: 'Set Vt', is_correct: true, explanation: 'Set Vt is the order. The vent delivers it (in VCV) and you read Vte to confirm.' },
        { kind: 'readout', name: 'vte', label: 'Vte', is_correct: false, explanation: 'Vte is the *exhaled* tidal volume — the measured report, not the order.' },
        { kind: 'readout', name: 'mve', label: 'MVe', is_correct: false, explanation: 'MVe is per-minute volume (Vte × actual rate). Not per breath.' },
        { kind: 'readout', name: 'pip', label: 'PIP', is_correct: false, explanation: 'PIP is a pressure measurement, not a volume.' },
      ]),
      clickTargetRecognition('M2-vte', 'Click the exhaled tidal volume readout — what the patient actually exhaled.', [
        { kind: 'readout', name: 'vte', label: 'Vte', is_correct: true, explanation: 'Vte ends in *e* for exhaled. The flow sensor measures it on the way out.' },
        { kind: 'control', name: 'tidalVolume', label: 'Set Vt', is_correct: false, explanation: 'That is the order. Vte is the report.' },
        { kind: 'readout', name: 'mve', label: 'MVe', is_correct: false, explanation: 'MVe is per minute; Vte is per breath.' },
        { kind: 'readout', name: 'plat', label: 'Pplat', is_correct: false, explanation: 'Pplat is a pressure measurement, not a volume.' },
      ]),
      clickTargetRecognition('M2-mve', 'Click the minute ventilation readout — how much air this patient moves per minute.', [
        { kind: 'readout', name: 'mve', label: 'MVe', is_correct: true, explanation: 'MVe = Vte × actual rate. L/min, not mL.' },
        { kind: 'readout', name: 'vte', label: 'Vte', is_correct: false, explanation: 'Vte is one breath; MVe is per minute.' },
        { kind: 'control', name: 'tidalVolume', label: 'Set Vt', is_correct: false, explanation: 'Set Vt × set rate is *set* MVe — close, but the measured number on the display is MVe.' },
        { kind: 'readout', name: 'actualRate', label: 'Actual rate', is_correct: false, explanation: 'Actual rate is a frequency, not a volume.' },
      ]),
      clickTargetRecognition('M2-peep', "Click the PEEP control — the end-expiratory floor you're ordering.", [
        { kind: 'control', name: 'peep', label: 'PEEP (control)', is_correct: true, explanation: 'Set PEEP is the order. Total PEEP is the report — they should match unless auto-PEEP is present.' },
        { kind: 'readout', name: 'totalPeep', label: 'Total PEEP (readout)', is_correct: false, explanation: "Total PEEP is what's *measured* — it can be higher than set if auto-PEEP is present." },
        { kind: 'readout', name: 'autoPeep', label: 'Auto-PEEP', is_correct: false, explanation: 'Auto-PEEP is the gap (Total − set). A problem to find, not a setting.' },
        { kind: 'control', name: 'fiO2', label: 'FiO2', is_correct: false, explanation: 'FiO2 is oxygen, not pressure.' },
      ]),
      clickTargetRecognition('M2-fio2', 'Click the FiO2 control.', [
        { kind: 'control', name: 'fiO2', label: 'FiO2', is_correct: true, explanation: 'FiO2 is the fraction of inspired oxygen, 21–100%. Operator-set.' },
        { kind: 'control', name: 'peep', label: 'PEEP', is_correct: false, explanation: 'PEEP is pressure, not gas composition.' },
        { kind: 'readout', name: 'mve', label: 'MVe', is_correct: false, explanation: 'MVe is a volume, not a gas fraction.' },
        { kind: 'control', name: 'respiratoryRate', label: 'Rate', is_correct: false, explanation: 'Rate sets breaths per minute, not oxygen.' },
      ]),
      clickTargetRecognition('M2-pip', 'Click the peak airway pressure readout.', [
        { kind: 'readout', name: 'pip', label: 'PIP', is_correct: true, explanation: 'PIP = peak inspiratory pressure. The highest point of each inspiration.' },
        { kind: 'readout', name: 'plat', label: 'Pplat', is_correct: false, explanation: 'Pplat is the alveolar pressure during an inspiratory hold — lower than PIP.' },
        { kind: 'readout', name: 'totalPeep', label: 'Total PEEP', is_correct: false, explanation: 'Total PEEP is the floor pressure, not the peak.' },
        { kind: 'readout', name: 'drivingPressure', label: 'DP', is_correct: false, explanation: 'Driving pressure = Pplat − PEEP. Not the same as peak.' },
      ]),
      clickTargetRecognition('M2-plat', 'Click the alveolar (plateau) pressure readout.', [
        { kind: 'readout', name: 'plat', label: 'Pplat', is_correct: true, explanation: 'Pplat is alveolar pressure with flow stopped — the number that matters for compliance.' },
        { kind: 'readout', name: 'pip', label: 'PIP', is_correct: false, explanation: 'PIP includes airway resistance; Pplat is alveolar pressure with flow stopped.' },
        { kind: 'readout', name: 'totalPeep', label: 'Total PEEP', is_correct: false, explanation: 'Total PEEP is the end-expiratory floor, not the inspiratory plateau.' },
        { kind: 'readout', name: 'drivingPressure', label: 'DP', is_correct: false, explanation: 'Driving pressure uses Pplat but is Pplat − PEEP.' },
      ]),
      clickTargetRecognition('M2-ie', 'Click the I:E ratio readout.', [
        { kind: 'readout', name: 'ieRatio', label: 'I:E', is_correct: true, explanation: 'I:E is the ratio of inspiration to expiration time. Derived from rate and I-time.' },
        { kind: 'control', name: 'iTime', label: 'I-time (control)', is_correct: false, explanation: 'I-time sets it; I:E is the derived ratio.' },
        { kind: 'readout', name: 'actualRate', label: 'Actual rate', is_correct: false, explanation: 'Rate is a frequency; I:E is a ratio.' },
        { kind: 'readout', name: 'rsbi', label: 'RSBI', is_correct: false, explanation: 'RSBI is rate ÷ tidal volume — a weaning index, not I:E.' },
      ]),
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        "Eight terms, and that's most of the bedside language. **Four are set by you**: Vt, rate, PEEP, FiO2. **Three are measured**: PIP, Vte, Pplat. **One is derived**: I:E. Confuse Vt with Vte, or PIP with Pplat, and the next 17 modules won't make sense.",
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown:
        "Set values are **orders**. Measured values are **reports**. The vent doesn't decide; it executes. If the report doesn't match the order — leak, fight, or broken sensor.",
    },
    {
      // v3.2 §0.6 — legacy predict_observe converted.
      kind: 'predict_mcq',
      awaits_control: 'iTime',
      predict:
        'You shorten the I-time from 1.0 s to 0.6 s at a rate of 14. What happens to the I:E ratio readout?',
      options: [
        { label: 'I:E lengthens — more expiratory time per breath.', is_correct: true },
        { label: 'I:E shortens — less expiratory time per breath.', is_correct: false, explanation: 'Backwards — shorter Ti gives MORE expiratory time within each breath cycle, so I:E lengthens (e.g. 1:3 → 1:6).' },
        { label: 'I:E is unchanged — only the rate changes I:E.', is_correct: false, explanation: 'Rate AND I-time both move I:E. Drop Ti at constant rate, and expiratory time within each breath grows.' },
        { label: 'I:E inverts (1:E becomes E:1).', is_correct: false, explanation: 'Inverse I:E (I > E) happens at very long Ti relative to rate, not the opposite.' },
      ],
      observe:
        'I:E lengthens — from about 1:3 to about 1:6. Less time inhaling, more time exhaling per breath. Obstructive patients would thank you.',
    },
    // v3.2 §0.7 — new predict_mcq grounding set-vs-measured terminology.
    {
      kind: 'predict_mcq',
      predict:
        'You see "set Vt 450, Vte 360" on a VCV vent. Other settings are unchanged. Most likely:',
      options: [
        { label: "The patient's lungs absorbed 90 mL.", is_correct: false, explanation: "Gas exchange across the alveolar membrane is a tiny fraction of tidal volume and the flow sensor doesn't see it." },
        { label: 'A leak — circuit, cuff, or fistula.', is_correct: true },
        { label: 'The patient is breathing harder than the vent.', is_correct: false, explanation: "In VCV the vent guarantees the inspiratory volume; patient effort doesn't change Vte downward." },
        { label: 'The display is malfunctioning.', is_correct: false, explanation: 'Display malfunction is a diagnosis of exclusion.' },
      ],
      observe:
        'In VCV, set Vt is delivered into the circuit. If the exhaled volume is short, the gas escaped somewhere — cuff leak, circuit disconnect, bronchopleural fistula. The set/measured gap is the first place to look.',
    },
    {
      kind: 'figure',
      caption: 'PIP is the peak; Pplat is the alveolar reading you only see when flow stops.',
      ascii:
        'Pressure ↑\n' +
        '         |        ┌─── PIP\n' +
        '         |       ╱│\n' +
        '         |      ╱ │  ┌── Pplat (after inspiratory hold)\n' +
        '         |     ╱  └──┤\n' +
        '         |    ╱      │\n' +
        '         |   ╱       │\n' +
        '         |__/        └─── PEEP\n' +
        '         +─── insp ─────── hold ── exp ─→ time',
    },
    {
      kind: 'formative',
      question: 'Which of these is **not** a derived value?',
      options: [
        { label: 'I:E ratio', is_correct: false },
        { label: 'Compliance', is_correct: false },
        { label: 'MVe (minute ventilation)', is_correct: false },
        { label: 'Vte', is_correct: true },
      ],
      answer:
        'Vte is measured — what the flow sensor saw on the way out. I:E is derived from rate and I-time. Compliance is derived from Vt, Pplat, and PEEP. MVe is derived from Vte and actual rate.',
    },
  ],

  hint_ladder: {
    tier1: "Eight prompts, in any order. Wrong clicks just explain — don't worry about getting one wrong.",
    tier2: 'Set values live in the controls column (left side of the sim). Measured values live in the readouts strip (top of the sim).',
    tier3: { hint_text: 'Use "Show me" to auto-fill the next correct click with its explanation.' },
  },

  // C3: M2 summative refocused on terminology — "what is each term?" —
  // not physiology. The two compliance questions belong in M4/M5
  // (Physiology track) and have been pulled. New Q1/Q2/Q5 cover minute
  // ventilation, PEEP, and PIP as definitions. Q3 (set vs actual rate)
  // and Q4 (MVe formula) survive — they're on-topic for vocabulary.
  summative_quiz: [
    {
      id: 'M2-Q1',
      prompt: 'Minute ventilation (MVe) is best defined as:',
      options: [
        { label: 'The total volume of air moved in and out of the lungs per minute.', is_correct: true, explanation: 'Specifically: Vte × measured rate. The "amount of air per minute" — what determines CO2 clearance. Book Ch. 1.' },
        { label: 'The pressure required to deliver one breath.', is_correct: false, explanation: "That's driving pressure, not a volume." },
        { label: 'The volume of one tidal breath.', is_correct: false, explanation: "That's tidal volume (Vt). MVe is volume PER MINUTE, not per breath." },
        { label: 'The oxygen concentration delivered to the patient.', is_correct: false, explanation: "That's FiO2 — gas composition, not air volume." },
      ],
    },
    {
      id: 'M2-Q2',
      prompt: 'PEEP refers to:',
      options: [
        { label: 'The peak pressure measured during inspiration.', is_correct: false, explanation: "That's PIP — peak inspiratory pressure. PEEP is end-EXPIRATORY pressure." },
        { label: 'The pressure floor held at end-expiration — set by the clinician.', is_correct: true, explanation: 'Positive end-expiratory pressure. Keeps alveoli open between breaths. Book Ch. 1, Ch. 12.' },
        { label: 'The patient\'s own respiratory effort.', is_correct: false, explanation: "Patient effort is captured by trigger and spontaneous rate, not PEEP." },
        { label: 'The volume delivered each breath.', is_correct: false, explanation: "That's tidal volume." },
      ],
    },
    {
      id: 'M2-Q3',
      prompt: 'Set rate vs actual rate. The vent shows set 14, actual 22. Most likely:',
      options: [
        { label: 'The vent is auto-cycling on a circuit leak.', is_correct: false, explanation: 'Possible but less common as a first thought; the simpler reading is that the patient is triggering.' },
        { label: 'The patient is triggering 8 breaths above the set rate.', is_correct: true, explanation: 'In A/C, anything above the set rate is the patient.' },
        { label: 'The vent is broken.', is_correct: false, explanation: 'Diagnosis of exclusion.' },
        { label: 'The PEEP is too high.', is_correct: false, explanation: "PEEP doesn't directly drive triggering rate." },
      ],
    },
    {
      id: 'M2-Q4',
      prompt: 'MVe is best understood as:',
      options: [
        { label: 'Set Vt × set rate', is_correct: false, explanation: 'That\'s "set minute ventilation." MVe is the *measured* version.' },
        { label: 'Vte × actual rate', is_correct: true, explanation: 'What the patient is actually moving per minute.' },
        { label: 'PIP × rate', is_correct: false, explanation: 'Pressure, not volume.' },
        { label: 'Set Vt only', is_correct: false, explanation: 'Per-breath, not per-minute.' },
      ],
    },
    {
      id: 'M2-Q5',
      prompt: 'PIP (peak inspiratory pressure) is best described as:',
      options: [
        { label: 'The highest pressure measured in the airway during a delivered breath.', is_correct: true, explanation: 'You read PIP; you do not set it. It rises with higher Vt, lower compliance, or higher resistance. Book Ch. 1, Ch. 2.' },
        { label: 'The pressure ordered by the clinician.', is_correct: false, explanation: 'You order Vt or PINSP — not PIP. PIP is a measurement the vent reports each breath.' },
        { label: 'The pressure at the end of inspiration once flow has stopped.', is_correct: false, explanation: "That's PLATEAU pressure (Pplat) — measured during an inspiratory hold, no flow." },
        { label: 'The end-expiratory baseline pressure.', is_correct: false, explanation: "That's PEEP — the bottom of the breath, not the top." },
      ],
    },
  ],

  explore_card: {
    patient_context:
      "Same patient as M1 — stable, post-intubation hour 1. You're here to map your eight terms onto the live display.",
    unlocked_controls_description: [
      { name: 'Tidal volume · 350–600 mL', description: 'volume per breath you order.' },
      { name: 'Rate · 8–24 / min', description: 'minimum rate.' },
      { name: 'PEEP · 0–18', description: 'end-expiratory floor.' },
      { name: 'FiO2 · 21–100%', description: 'inspired oxygen fraction.' },
      { name: 'I-time · 0.5–1.5 s', description: 'newly unlocked. Affects I:E ratio.' },
    ],
    readouts_description: [
      { name: 'PIP, Pplat, Vte, MVe, Total PEEP, I:E', description: 'the six measured / derived values you\'re about to find by name.' },
    ],
    suggestions: [
      'Raise Vt from 450 to 550. Watch PIP and Pplat both rise.',
      'Raise rate from 14 to 20. Watch MVe climb. The I:E ratio also tightens (less expiratory time per breath).',
      'Drop I-time from 1.0 to 0.6. Watch I:E lengthen. Imagine the patient with COPD breathing on this — better.',
      'Raise PEEP from 5 to 10. Watch PIP and Pplat both rise by ~5. Total PEEP follows.',
    ],
  },

  user_facing_task: 'Eight prompts. For each, click the matching tile on the sim — readings live up top, controls at the bottom. Wrong clicks don\'t penalize; they explain what you just clicked.',
  // success_criteria_display omitted — shell auto-derives the checklist from
  // the 8 recognition prompt questions so the criteria match the banner.
  task_framing_style: 'C',

  key_points: [
    'Eight terms. Four set, three measured, one derived.',
    'Vte ≈ set Vt in VCV unless something is leaking.',
    'MVe = Vte × *actual* rate, not set rate.',
    'Pplat tells you about the alveoli; PIP tells you about the airways and the alveoli together.',
    'I:E shrinks when you raise rate; lengthens when you shorten I-time.',
  ],
};
