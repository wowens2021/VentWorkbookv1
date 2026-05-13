import type { ModuleConfig } from '../shell/types';

/**
 * M1 — Why We Ventilate
 * Track: Foundations · Archetype: vocabulary (click-target) · 12 min
 * Anchor chapters: VB Ch. 1, Ch. 4, Ch. 7
 *
 * Specced verbatim against docs/MODULE_SPECS_v3.md §M1.
 */
export const M1: ModuleConfig = {
  id: 'M1',
  number: 1,
  title: 'Why We Ventilate',
  track: 'Foundations',
  estimated_minutes: 12,
  briefing: {
    tagline: 'Name the deficit before you change a setting.',
    overview:
      "People get put on ventilators for four reasons, and only four. Failure to oxygenate. Failure to ventilate. Failure to protect the airway. Excessive work of breathing. Everything you'll do later (the modes, the dials, the troubleshooting) gets easier if you can name which of these problems you're solving for the patient in front of you. Before you can change a ventilator, you have to read one.",
    what_youll_do: [
      'Oxygenation failure and ventilation failure are different problems with different blood gas signatures.',
      "An unconscious patient with normal lungs still needs a tube. That's an airway problem, not a lung problem.",
      'The ventilator display has a vocabulary. Learn the abbreviations first. The physiology comes next.',
    ],
  },

  visible_learning_objectives: [
    'Name the four bedside indications for mechanical ventilation.',
    'Distinguish set settings (the clinician\'s order) from measured readouts (what the patient is doing).',
    'Identify PIP, Vte, set PEEP, and set rate on the live display.',
    'State plainly: the ventilator supports — it does not cure.',
  ],

  primer_questions: [
    {
      id: 'M1-P1',
      prompt: 'Why does a patient get put on a mechanical ventilator?',
      options: [
        {
          label: 'Because the ventilator cures pneumonia, ARDS, and most respiratory illness.',
          is_correct: false,
          explanation:
            "The vent supports gas exchange while the patient (and the treatment) does the actual healing. Owens, Commandment III: the ventilator offers no curative properties in itself.",
        },
        {
          label: "Because the patient cannot meet the body's oxygenation, ventilation, or work-of-breathing demands without help.",
          is_correct: true,
          explanation:
            "Parrillo's definition of acute respiratory failure, restated in clinical terms (book Ch. 4). The four bedside indications all reduce to this.",
        },
        {
          label: 'Because the blood gas is abnormal.',
          is_correct: false,
          explanation:
            'A patient with a "bad" gas may not need a tube, and a patient with a "good" gas sometimes does. The history and exam come first.',
        },
        {
          label: 'Because the patient has a respiratory rate above 24.',
          is_correct: false,
          explanation: 'Tachypnea is a sign, not an indication. Many patients are tachypneic and improving.',
        },
      ],
    },
    {
      id: 'M1-P2',
      prompt: 'Which of these is a measured value, not a set value?',
      options: [
        {
          label: 'Set rate.',
          is_correct: false,
          explanation: "You ordered it. The patient may breathe over it — that's a different number, the actual rate.",
        },
        {
          label: 'PEEP knob.',
          is_correct: false,
          explanation: "That's the order — the floor of expiratory pressure you set.",
        },
        {
          label: 'Peak inspiratory pressure (PIP).',
          is_correct: true,
          explanation:
            "PIP is what the system actually generates every breath. It depends on the patient's compliance, resistance, and the volume you ordered. You read it; you don't set it.",
        },
        {
          label: 'FiO2.',
          is_correct: false,
          explanation: 'You set FiO2; the patient receives it.',
        },
      ],
    },
    {
      id: 'M1-P3',
      prompt: 'A medical student says, "The ventilator is treating his ARDS." What\'s the cleanest correction?',
      options: [
        {
          label: "The vent reduces shunt and provides oxygen and rest. It doesn't reverse the disease — that's the antibiotic, the proning, the resolution of inflammation.",
          is_correct: true,
          explanation: 'Owens, Commandment III: three benefits — O2 delivery, shunt reduction, taking over WoB — none of them curative.',
        },
        {
          label: 'The vent treats ARDS through PEEP and high tidal volumes.',
          is_correct: false,
          explanation: "High Vt is harmful in ARDS — that's the whole point of ARMA.",
        },
        {
          label: 'The vent has no benefit at all.',
          is_correct: false,
          explanation: 'The three real benefits — O2 delivery, shunt reduction, taking over WoB — are real.',
        },
        {
          label: "Once you're on a vent, you stay on a vent.",
          is_correct: false,
          explanation: 'Liberation is the goal of every vented patient (book Ch. 22).',
        },
      ],
    },
  ],

  scenario: {
    preset_id: 'M1_healthy_baseline_vcv',
    preset: {
      // Healthy-ish patient on safe defaults. The learner is here to read the
      // display, not fix anything yet. PBW = 73 kg (M, 70 in) → Vt 450 = 6.2 mL/kg.
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 14, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 55, resistance: 10, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    // M1 unlocks the four core order knobs — Vt, rate, PEEP, FiO2 — so the
    // learner can confirm the *display* responds to each. Compliance,
    // resistance, and I-time stay locked so the physiology doesn't drift.
    unlocked_controls: ['tidalVolume', 'respiratoryRate', 'peep', 'fiO2'],
    visible_readouts: ['pip', 'plat', 'vte', 'mve', 'totalPeep', 'autoPeep', 'actualRate', 'ieRatio'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  // Four click-target recognitions, ANY ORDER. The four prompts are
  // independent — there's no pedagogical reason to enforce a sequence.
  // Click-target mode is mandatory here because the entire learning
  // objective is "read the display."
  hidden_objective: {
    kind: 'compound',
    sequence: 'any_order',
    reset_between: false,
    children: [
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M1-pip',
          trigger: { kind: 'on_load' },
          question: 'Click the reading that shows peak airway pressure.',
          options: [
            { label: 'PIP', is_correct: true, explanation: 'Right. PIP is the highest pressure during inspiration — the vent reports it every breath.' },
            { label: 'Pplat', is_correct: false, explanation: 'Pplat is alveolar pressure at end-inspiration — only visible during an inspiratory hold. It is not peak.' },
            { label: 'Vte', is_correct: false, explanation: 'Vte is the exhaled tidal volume, in mL. Not pressure.' },
            { label: 'Total PEEP', is_correct: false, explanation: 'Total PEEP is end-expiratory pressure, the floor — not the ceiling.' },
          ],
          click_targets: [
            { element: { kind: 'readout', name: 'pip' }, label: 'PIP', is_correct: true, explanation: 'Right. PIP is the highest pressure during inspiration — the vent reports it every breath.' },
            { element: { kind: 'readout', name: 'plat' }, label: 'Pplat', is_correct: false, explanation: 'Pplat is alveolar pressure at end-inspiration — only visible during an inspiratory hold. It is not peak.' },
            { element: { kind: 'readout', name: 'vte' }, label: 'Vte', is_correct: false, explanation: 'Vte is the exhaled tidal volume, in mL. Not pressure.' },
            { element: { kind: 'readout', name: 'totalPeep' }, label: 'Total PEEP', is_correct: false, explanation: 'Total PEEP is end-expiratory pressure, the floor — not the ceiling.' },
          ],
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M1-vte',
          trigger: { kind: 'on_load' },
          question: 'Click the reading that shows what the patient actually exhaled this breath.',
          options: [
            { label: 'Vte', is_correct: true, explanation: 'Vte = expired tidal volume. The order says "set Vt 450"; Vte tells you what came back out.' },
            { label: 'Set Vt', is_correct: false, explanation: 'That is the *set* tidal volume — what you ordered. Vte is what the patient delivered.' },
            { label: 'MVe', is_correct: false, explanation: 'MVe is minute ventilation in L/min — Vte × rate. Not a single breath.' },
            { label: 'Actual rate', is_correct: false, explanation: 'Actual rate is breaths/min, not volume.' },
          ],
          click_targets: [
            { element: { kind: 'readout', name: 'vte' }, label: 'Vte', is_correct: true, explanation: 'Vte = expired tidal volume. The order says "set Vt 450"; Vte tells you what came back out.' },
            { element: { kind: 'control', name: 'tidalVolume' }, label: 'Set Vt', is_correct: false, explanation: 'That is the *set* tidal volume — what you ordered. Vte is what the patient delivered.' },
            { element: { kind: 'readout', name: 'mve' }, label: 'MVe', is_correct: false, explanation: 'MVe is minute ventilation in L/min — Vte × rate. Not a single breath.' },
            { element: { kind: 'readout', name: 'actualRate' }, label: 'Actual rate', is_correct: false, explanation: 'Actual rate is breaths/min, not volume.' },
          ],
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M1-setpeep',
          trigger: { kind: 'on_load' },
          question: 'Click the control where you set the PEEP order.',
          options: [
            { label: 'PEEP (control)', is_correct: true, explanation: 'The PEEP knob is the order. The Total PEEP readout reports what the patient is actually generating, which can be higher if there is auto-PEEP.' },
            { label: 'Total PEEP (readout)', is_correct: false, explanation: 'Total PEEP is the measurement, not the setting. You set the floor; the patient can add to it.' },
            { label: 'Auto-PEEP', is_correct: false, explanation: 'Auto-PEEP is the difference between Total PEEP and your set PEEP. It is a problem to find, not a setting.' },
            { label: 'FiO2', is_correct: false, explanation: 'FiO2 is oxygen, not pressure.' },
          ],
          click_targets: [
            { element: { kind: 'control', name: 'peep' }, label: 'PEEP (control)', is_correct: true, explanation: 'The PEEP knob is the order. The Total PEEP readout reports what the patient is actually generating, which can be higher if there is auto-PEEP.' },
            { element: { kind: 'readout', name: 'totalPeep' }, label: 'Total PEEP (readout)', is_correct: false, explanation: 'Total PEEP is the measurement, not the setting. You set the floor; the patient can add to it.' },
            { element: { kind: 'readout', name: 'autoPeep' }, label: 'Auto-PEEP', is_correct: false, explanation: 'Auto-PEEP is the difference between Total PEEP and your set PEEP. It is a problem to find, not a setting.' },
            { element: { kind: 'control', name: 'fiO2' }, label: 'FiO2', is_correct: false, explanation: 'FiO2 is oxygen, not pressure.' },
          ],
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M1-setrate',
          trigger: { kind: 'on_load' },
          question: 'Click the control where you set the respiratory rate.',
          options: [
            { label: 'Rate (control)', is_correct: true, explanation: 'Set rate is the order — the floor. The patient can trigger above it in A/C; he cannot go below it.' },
            { label: 'Actual rate (readout)', is_correct: false, explanation: 'Actual rate is what the patient is doing — set + triggered. Not the setting.' },
            { label: 'MVe', is_correct: false, explanation: 'MVe is minute ventilation, not rate. Calculated as Vte × actual rate.' },
            { label: 'I:E', is_correct: false, explanation: 'I:E is the ratio of inspiration to expiration time. Not the rate.' },
          ],
          click_targets: [
            { element: { kind: 'control', name: 'respiratoryRate' }, label: 'Rate (control)', is_correct: true, explanation: 'Set rate is the order — the floor. The patient can trigger above it in A/C; he cannot go below it.' },
            { element: { kind: 'readout', name: 'actualRate' }, label: 'Actual rate (readout)', is_correct: false, explanation: 'Actual rate is what the patient is doing — set + triggered. Not the setting.' },
            { element: { kind: 'readout', name: 'mve' }, label: 'MVe', is_correct: false, explanation: 'MVe is minute ventilation, not rate. Calculated as Vte × actual rate.' },
            { element: { kind: 'readout', name: 'ieRatio' }, label: 'I:E', is_correct: false, explanation: 'I:E is the ratio of inspiration to expiration time. Not the rate.' },
          ],
        },
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        "There are exactly four reasons a patient gets a tube. **Hypoxemia** you can't fix with a mask. **Hypercapnia** that's dropping the pH. **An airway** you can't trust. **A patient in shock** who can't afford to spend 40% of his energy on breathing. Everything else — the agitation, the bad gas, the bad chest X-ray — is a sign, not a reason.",
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown:
        'The vent is **support, not cure**. It buys time. The illness is treated by everything else you\'re doing — antibiotics, fluids, source control, time.',
    },
    {
      kind: 'predict_observe',
      awaits_control: 'tidalVolume',
      predict:
        'If you raise the set tidal volume from 450 to 600, will the PIP go up or down — and how do you know it\'ll change at all?',
      observe:
        'PIP rose because the system has to push more air through a finite compliance every breath. The Vte readout now reads about 600 too — that\'s how you check the order got delivered.',
    },
    {
      kind: 'formative',
      question: 'You see set PEEP = 5 and Total PEEP = 9 on the display. What does that tell you?',
      options: [
        { label: 'The vent is malfunctioning.', is_correct: false },
        { label: 'There is 4 cmH2O of auto-PEEP. The patient isn\'t fully exhaling.', is_correct: true },
        { label: 'The patient is over-sedated.', is_correct: false },
        { label: 'PEEP needs to be lowered.', is_correct: false },
      ],
      answer:
        'Total PEEP − set PEEP = auto-PEEP. A 4 cmH2O gap means the patient is generating 4 cmH2O of trapped end-expiratory pressure on top of what you ordered — incomplete exhalation. Most often seen in obstructive disease or when the rate is too high. Lowering PEEP might be part of the fix, but the *finding* is just the gap.',
    },
  ],

  hint_ladder: {
    tier1:
      "You're looking for four readings. Each one matches a clinical phrase. Try clicking what feels right — wrong clicks just explain.",
    tier2:
      "Peak airway pressure is a measurement. Vte ends in 'e' for *exhaled*. The set knobs and the readouts live in different rows on the display.",
    tier3: {
      hint_text: 'Use "Show me" to auto-fill the next correct answer with an explanation popup.',
    },
  },

  summative_quiz: [
    {
      id: 'M1-Q1',
      prompt: 'Type I respiratory failure is defined as:',
      options: [
        { label: 'PaO2 <60 mm Hg.', is_correct: true, explanation: 'Book Ch. 4 — the canonical definition of hypoxemic (Type I) respiratory failure.' },
        { label: 'PaCO2 >50 with pH <7.30.', is_correct: false, explanation: "That's Type II — hypercapnic respiratory failure." },
        { label: 'SpO2 <88%.', is_correct: false, explanation: 'SpO2 is the bedside surrogate; the definition uses PaO2.' },
        { label: 'Respiratory rate >30.', is_correct: false, explanation: 'Sign, not definition.' },
      ],
    },
    {
      id: 'M1-Q2',
      prompt: 'Owens lists three therapeutic benefits a ventilator can provide. Which one is NOT on the list?',
      options: [
        { label: 'Guaranteed delivery of high levels of oxygen.', is_correct: false, explanation: 'On the list.' },
        { label: 'Positive pressure to reduce intrapulmonary shunt.', is_correct: false, explanation: 'On the list.' },
        { label: 'Providing the work of breathing until the patient can do it himself.', is_correct: false, explanation: 'On the list.' },
        { label: 'Reversal of the underlying pulmonary disease.', is_correct: true, explanation: 'The vent does none of this. It buys time. Commandment III.' },
      ],
    },
    {
      id: 'M1-Q3',
      prompt: 'You see "set Vt: 450, Vte: 360" on a volume-control vent. The most useful first thought is:',
      options: [
        { label: "There's a leak in the circuit — that's where 90 mL went.", is_correct: true, explanation: 'In VCV the vent guarantees the inspiratory volume; if exhaled is short, the difference is leak (or a cuff problem or a bronchopleural fistula).' },
        { label: 'The patient is improving.', is_correct: false, explanation: "You can't conclude improvement from one breath's Vte gap." },
        { label: 'The compliance is getting better.', is_correct: false, explanation: 'That changes PIP, not Vte.' },
        { label: 'The vent is broken.', is_correct: false, explanation: 'Equipment failure is a diagnosis of exclusion (book Ch. 7).' },
      ],
    },
    {
      id: 'M1-Q4',
      prompt: 'A normal PaCO2-to-ETCO2 gradient is about:',
      options: [
        { label: '3–5 mm Hg.', is_correct: true, explanation: 'Book Ch. 7. A widening gradient suggests dead space.' },
        { label: '0 mm Hg.', is_correct: false, explanation: 'ETCO2 is always slightly below PaCO2 (mixing of alveolar with dead-space gas).' },
        { label: '15 mm Hg.', is_correct: false, explanation: "That's a wide gradient — pathologic in most cases." },
        { label: 'ETCO2 always exceeds PaCO2.', is_correct: false, explanation: 'It never does. That is the rule. Book Ch. 7.' },
      ],
    },
    {
      id: 'M1-Q5',
      prompt: 'Which is the strongest argument for putting a hypotensive septic patient on the vent, even if his SpO2 is acceptable?',
      options: [
        { label: 'To improve the SpO2 to 100%.', is_correct: false, explanation: "SpO2 is already fine — that's not the reason." },
        { label: "To take over the work of breathing so he isn't spending 40% of his cardiac output on his diaphragm.", is_correct: true, explanation: 'Owens, Commandment VIII. The septic diaphragm is a luxury organ when the heart is failing.' },
        { label: 'To prevent aspiration.', is_correct: false, explanation: 'Sometimes true, but the bigger reason here is energy balance.' },
        { label: 'To allow administration of bronchodilators.', is_correct: false, explanation: "Doesn't require intubation." },
      ],
    },
  ],

  explore_card: {
    patient_context:
      "58-year-old man, intubated for pneumonia an hour ago. He's stable now: SpO2 96%, BP fine, no agitation. The vent is doing exactly what was ordered. Your job for the next two minutes is just to read the display.",
    unlocked_controls_description: [
      { name: 'Tidal volume (set Vt) · 350–600 mL', description: "the volume of air you're ordering per breath. Lung-protective range is 6–8 mL/kg PBW." },
      { name: 'Rate · 8–24 breaths/min', description: 'the minimum rate. The patient can trigger above this.' },
      { name: 'PEEP · 0–18 cmH2O', description: 'the end-expiratory floor.' },
      { name: 'FiO2 · 21–100%', description: 'fraction of inspired oxygen.' },
    ],
    readouts_description: [
      { name: 'PIP', description: 'the peak pressure each breath. Rises with higher Vt, lower compliance, or higher resistance.' },
      { name: 'Vte', description: 'exhaled volume, in mL. Should be close to your set Vt in volume modes.' },
      { name: 'Total PEEP', description: 'what the patient is actually generating at end-expiration. Equals set PEEP unless auto-PEEP is present.' },
    ],
    suggestions: [
      'Set Vt up to 600. Watch PIP rise. Watch Vte rise to match.',
      "Drop FiO2 to 30%. Nothing about the *display* changes — FiO2 is its own number. (That's the point.)",
      "Raise PEEP from 5 to 10. Watch PIP rise too — they're additive.",
      'Look at MVe (the minute ventilation readout). Compare it to (set Vt × set rate) ÷ 1000. They should match.',
    ],
  },

  user_facing_task: 'Find four readings on this display. Each prompt names a clinical concept. Click the reading or control that matches. Wrong clicks don\'t penalize you — they explain what you just clicked.',
  success_criteria_display: [
    'Find peak airway pressure.',
    "Find this breath's exhaled tidal volume.",
    'Find the PEEP order.',
    'Find the rate order.',
  ],
  task_framing_style: 'C',

  key_points: [
    'Four indications: refractory hypoxemia, hypercapnia with acidosis, jeopardized airway, shock.',
    'The vent supports. It does not cure.',
    'Set values are orders. Measured values (PIP, Vte, Total PEEP) are what the patient is generating.',
    'The three real benefits are O2 delivery, shunt reduction, and taking over WoB.',
    'Read the display every time you change a setting. The numbers tell you whether the order got delivered.',
  ],
};
