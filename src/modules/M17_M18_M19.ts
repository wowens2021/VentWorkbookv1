import type { ModuleConfig } from '../shell/types';

// MODULE_SPECS_v3 §M17 — Weaning Concepts (Liberation).
//
// Adaptation: spec is a decisional scenario (read bedside data → check
// pre-criteria → compute RSBI → pass/fail). The sim can't accept a
// free-form RSBI calculation, so the RSBI step is presented as a
// multiple-choice — the four options bracket the correct answer
// (RR 18 / Vt 0.38 ≈ 47). The pre-criteria step and the pass/fail
// step are each their own recognition. All three required, in order.
export const M17: ModuleConfig = {
  id: 'M17',
  number: 17,
  title: 'Weaning Concepts (Liberation)',
  track: 'Weaning',
  estimated_minutes: 18,
  briefing: {
    tagline: 'There are vent days, and there are get-off-the-vent days. Know which one this is.',
    overview: '"Weaning" implies a gradual reduction in support. Owens prefers "liberation" because most patients don\'t need a gradual reduction — they need a daily assessment. The job is to know which kind of day it is. The bedside test is the spontaneous breathing trial. The decision rule has three steps: check the pre-SBT screen, run the trial on CPAP 5 + PS 7 for 30–60 minutes, compute the RSBI, decide.',
    what_youll_do: [
      'Daily SBT replaces gradual SIMV-style weaning. Faster off the vent. Faster out of the ICU.',
      'Pre-SBT screen — five items. All required before you start.',
      'SBT setup: CPAP 5 + PS 7, 30–60 min.',
      'RSBI = RR ÷ Vt(L). Threshold <105 (T-piece) or <80 (PSV).',
    ],
  },
  visible_learning_objectives: [
    'State the daily SBT pre-screen criteria.',
    'Set up an SBT (CPAP 5 + PS 7, 30–60 minutes).',
    'Calculate and interpret RSBI.',
    'Name the SBT abort criteria.',
  ],

  primer_questions: [
    {
      id: 'M17-P1',
      prompt: 'Which is NOT a pre-SBT criterion?',
      options: [
        { label: 'FiO2 ≤50%', is_correct: false, explanation: 'A true criterion.' },
        { label: 'PEEP ≤8', is_correct: false, explanation: 'A true criterion.' },
        { label: 'P/F ratio >300', is_correct: true, explanation: 'Not on Owens\'s pre-SBT list. That\'s an ARDS-resolution criterion. Book Ch. 22.' },
        { label: 'Hemodynamically stable, off pressors or low-dose', is_correct: false, explanation: 'A true criterion.' },
      ],
    },
    {
      id: 'M17-P2',
      prompt: 'An SBT on the vent is typically done with:',
      options: [
        { label: 'T-piece, no PEEP, no PS', is_correct: false, explanation: 'A valid alternative. Not the default.' },
        { label: 'CPAP 5, PS 7, 30–60 min', is_correct: true, explanation: 'The standard SBT setup. Book Ch. 22.' },
        { label: 'A/C with low Vt', is_correct: false, explanation: 'Not an SBT — that\'s controlled ventilation.' },
        { label: 'PRVC', is_correct: false, explanation: 'Not an SBT mode.' },
      ],
    },
    {
      id: 'M17-P3',
      prompt: 'A patient with RR 24 and spontaneous Vt 300 mL has RSBI of:',
      options: [
        { label: '8', is_correct: false, explanation: 'Off by a factor of 10 — wrong units.' },
        { label: '80', is_correct: true, explanation: 'RR ÷ Vt(L) = 24 ÷ 0.30 = 80.' },
        { label: '0.8', is_correct: false, explanation: 'Inverse — that\'s seconds per breath per liter, not the index.' },
        { label: '800', is_correct: false, explanation: 'Off by a factor of 10.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'sbt_pass_candidate',
    preset: {
      mode: 'PSV',
      settings: { psLevel: 7, peep: 5, fiO2: 40 },
      patient: { compliance: 60, resistance: 12, spontaneousRate: 18, heightInches: 70, gender: 'M' },
    },
    unlocked_controls: [],
    visible_readouts: ['actualRate', 'vte', 'rsbi', 'spo2', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    children: [
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M17-precheck',
          trigger: { kind: 'on_load' },
          question: 'Pre-SBT screen. Your patient: FiO2 40%, PEEP 5, follows commands, off pressors 24 hours, not difficult airway, hemodynamically stable. Pre-SBT criteria are:',
          options: [
            { label: 'All met — proceed with SBT', is_correct: true },
            { label: 'Not met — PEEP must be ≤5', is_correct: false },
            { label: 'Not met — FiO2 must be ≤30%', is_correct: false },
            { label: 'Not met — needs P/F ratio first', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M17-rsbi-calc',
          trigger: { kind: 'on_load' },
          question: 'At 30 minutes on CPAP 5 / PS 7 / FiO2 40%: RR 18, spontaneous Vt 380 mL, SpO2 95%, HR 88, BP 124/72. RSBI is approximately:',
          options: [
            { label: '12', is_correct: false, explanation: 'Off — wrong direction.' },
            { label: '47', is_correct: true, explanation: '18 ÷ 0.38 = 47. Well under the threshold.' },
            { label: '85', is_correct: false, explanation: 'Higher than the actual RSBI here.' },
            { label: '110', is_correct: false, explanation: 'Would suggest failure — this RSBI is much lower.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M17-decision',
          trigger: { kind: 'on_load' },
          question: 'RSBI 47, comfortable, no abort criteria triggered. The next step is:',
          options: [
            { label: 'Repeat the SBT in 12 hours', is_correct: false, explanation: 'Repeating a passed SBT delays liberation without adding information.' },
            { label: 'Extubate', is_correct: true, explanation: 'SBT pre-screen passed, RSBI well below threshold, no abort criteria. The bedside test agrees. Book Ch. 22.' },
            { label: 'Reduce PS by 2 and try again', is_correct: false, explanation: 'The pressure-support ladder is the older gradual approach — not how Owens weans.' },
            { label: 'Get an ABG first', is_correct: false, explanation: 'Common practice. Not required by Owens before extubation.' },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Liberation, not weaning.** Most ventilated patients don\'t need a gradual reduction in support. They need a daily assessment: today, are they ready? The bedside test is the SBT. Run it. Compute the RSBI. Decide. The discipline of asking *every day* is what makes the algorithm work.' },
    { kind: 'callout', tone: 'info', markdown: 'Pre-SBT screen (all 5): FiO2 ≤50%, PEEP ≤8, follows commands, hemodynamically stable, not a difficult airway. Then run the trial — CPAP 5 / PS 7 / FiO2 unchanged — for 30 to 60 minutes.' },
    {
      kind: 'figure',
      caption: 'Owens\'s SBT protocol reproduced.',
      ascii:
        'Pre-screen (all 5):\n' +
        '  • FiO2 ≤ 50%\n' +
        '  • PEEP ≤ 8\n' +
        '  • Follows commands\n' +
        '  • Hemodynamically stable\n' +
        '  • Not a difficult airway\n' +
        '\n' +
        'SBT setup:    CPAP 5, PS 7, FiO2 unchanged, 30–60 min\n' +
        '\n' +
        'Pass:         RSBI < 80 on PSV (or < 105 on T-piece)\n' +
        '              No abort criteria\n' +
        '              → extubate\n' +
        '\n' +
        'Abort:        SpO2 < 88%, ΔHR ≥ 20, ΔBP, diaphoresis,\n' +
        '              accessory muscle use, paradoxical breathing',
    },
    { kind: 'callout', tone: 'warn', markdown: 'RSBI alone is not a complete answer. A patient with RSBI 75 who is gasping and paradoxical-breathing is not ready. A patient with RSBI 110 who looks calm may do fine. Numbers help. The patient is the final judge.' },
  ],

  hint_ladder: {
    tier1: 'Pre-criteria first. Then RSBI. Then look at the patient.',
    tier2: 'RSBI = RR divided by Vt in liters. 18 ÷ 0.38.',
    tier3: { hint_text: 'RSBI ≈ 47, well below 80. Extubate.' },
  },

  summative_quiz: [
    {
      id: 'M17-Q1',
      prompt: 'The Yang–Tobin RSBI threshold for predicting successful extubation is:',
      options: [
        { label: '<50', is_correct: false },
        { label: '<105', is_correct: true },
        { label: '<200', is_correct: false },
        { label: '<500', is_correct: false },
      ],
      explanation: 'The original Yang–Tobin number. Book Ch. 22.',
    },
    {
      id: 'M17-Q2',
      prompt: 'Owens uses a slightly stricter RSBI threshold of <80 because:',
      options: [
        { label: 'He prefers to be conservative for its own sake', is_correct: false },
        { label: 'He performs SBT on PSV, which gives some assistance, so the bar should be tighter', is_correct: true },
        { label: '<80 is the original Yang–Tobin threshold', is_correct: false },
        { label: '<80 is the consensus 2020 guideline', is_correct: false },
      ],
      explanation: 'The PS adds support — a stricter RSBI controls for that. Book Ch. 22.',
    },
    {
      id: 'M17-Q3',
      prompt: 'Which is an SBT abort criterion?',
      options: [
        { label: 'Spontaneous Vt of 350 mL', is_correct: false },
        { label: 'HR rise of 25 bpm with accessory muscle use', is_correct: true },
        { label: 'RR of 18', is_correct: false },
        { label: 'SpO2 of 94%', is_correct: false },
      ],
      explanation: 'Tachycardia plus accessory muscle use is the patient telling you he\'s working too hard. Book Ch. 22.',
    },
    {
      id: 'M17-Q4',
      prompt: 'Daily SBT vs gradual SIMV/PSV weaning:',
      options: [
        { label: 'Gradual weaning is faster', is_correct: false },
        { label: 'Equivalent', is_correct: false },
        { label: 'Daily SBT is faster — shorter time on the vent and shorter ICU stay', is_correct: true },
        { label: 'Gradual is associated with better long-term function', is_correct: false },
      ],
      explanation: 'Multiple RCTs. The daily check, not the slow taper, is what gets patients off the vent. Book Ch. 22.',
    },
    {
      id: 'M17-Q5',
      prompt: 'A patient passes the SBT pre-criteria, completes a 30-min SBT, with RSBI 70, comfortable, no accessory muscle use. The correct next step is:',
      options: [
        { label: 'Repeat SBT in 12 hours', is_correct: false },
        { label: 'Extubate', is_correct: true },
        { label: 'Reduce PS by 2 and try again', is_correct: false },
        { label: 'Get an ABG first', is_correct: false },
      ],
      explanation: 'Pre-screen passed, trial passed, patient looks good — extubate. Book Ch. 22.',
    },
  ],

  explore_card: {
    patient_context: 'Post-pneumonia, day 5, awake, follows commands. Yesterday on FiO2 40% / PEEP 8. Today, RT set up an SBT — CPAP 5 / PS 7 / FiO2 40%. You\'re reading the data at the 30-minute mark.',
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'RR 18, spontaneous Vt 380 mL', description: 'the inputs for RSBI.' },
      { name: 'SpO2 95%, HR 88, BP 124/72', description: 'no abort criteria triggered.' },
    ],
    suggestions: [
      'Anchor on the pre-criteria. If those aren\'t met, the SBT shouldn\'t have started.',
      'Compute RSBI in your head: 18 ÷ 0.38.',
      'Then look at the patient. Comfortable? Working hard? The number agrees with the bedside?',
    ],
  },
  user_facing_task: 'Read the bedside data and decide. Your patient finished a 30-minute SBT on CPAP 5 / PS 7 / FiO2 40%. At the 30-minute mark: RR 18, spontaneous Vt 380 mL, SpO2 95%, HR 88, BP 124/72. Check pre-criteria. Compute RSBI. Decide.',
  success_criteria_display: [
    'Verify all five pre-SBT criteria are met.',
    'Compute RSBI correctly (within ±2).',
    'Choose the correct disposition.',
  ],
  task_framing_style: 'C',

  key_points: [
    'Liberation = daily assessment, not gradual reduction.',
    'Pre-SBT screen (5 criteria), SBT setup (CPAP 5 + PS 7), RSBI <80 on PSV.',
    'RSBI alone is not the answer. The patient is the final judge.',
    'Abort criteria: desat, HR rise, BP change, diaphoresis, accessory muscle use.',
  ],
};

// MODULE_SPECS_v3 §M18 — Extubation Criteria and Failure.
// Four bedside vignettes, four different correct decisions. Compound any_order.
export const M18: ModuleConfig = {
  id: 'M18',
  number: 18,
  title: 'Extubation Criteria and Failure',
  track: 'Weaning',
  estimated_minutes: 18,
  briefing: {
    tagline: 'A passed SBT is necessary. Three pillars hold up the rest.',
    overview: 'Passing the SBT is necessary but not sufficient. Three pillars must hold. The reason for intubation has resolved. Gas exchange is adequate without high-pressure support. The cardiovascular system can handle the work of breathing once the vent is gone. Extubation failure has four mechanisms — upper airway edema, retained secretions, altered mental status, cardiogenic — and each has a different mitigation. Re-intubation within 72 hours doubles mortality. Get the call right the first time.',
    what_youll_do: [
      'Three pillars: reason resolved, gas exchange adequate, cardiovascular reserve adequate.',
      'Cuff leak test screens for upper-airway edema. <110 mL is a positive screen.',
      'NIPPV rescues post-extubation respiratory distress in some patients. It does not treat upper-airway obstruction.',
      'Re-intubation within 72 hours doubles mortality. The bar is high.',
    ],
  },
  visible_learning_objectives: [
    'State the three pillars of extubation readiness beyond the SBT.',
    'Recognize the four mechanisms of extubation failure.',
    'Interpret a cuff leak test.',
    'Distinguish post-extubation distress that responds to NIPPV from distress that mandates re-intubation.',
  ],

  primer_questions: [
    {
      id: 'M18-P1',
      prompt: 'The three pillars of extubation readiness beyond the SBT are:',
      options: [
        { label: 'Reason resolved, gas exchange adequate, cardiovascular reserve adequate', is_correct: true, explanation: 'Owens\'s framework. All three independently. Book Ch. 22.' },
        { label: 'Reason resolved, mental status normal, GCS 15', is_correct: false, explanation: 'Mental status isn\'t strictly required — see the brain-injury data.' },
        { label: 'RSBI <80, PaO2 >100, normal Hb', is_correct: false, explanation: 'Mixing isolated numbers, not the framework.' },
        { label: 'Awake, alert, oriented, ambulating', is_correct: false, explanation: 'Ambulation isn\'t a vent-liberation criterion.' },
      ],
    },
    {
      id: 'M18-P2',
      prompt: 'A cuff leak of <110 mL indicates:',
      options: [
        { label: 'The endotracheal tube cuff is overinflated', is_correct: false, explanation: 'Not the meaning of the test.' },
        { label: 'Significant upper airway edema; high risk for post-extubation stridor', is_correct: true, explanation: 'The classic positive screen. Steroids 24 hours pre-extubation. Book Ch. 23.' },
        { label: 'The endotracheal tube is the wrong size', is_correct: false, explanation: 'Not what the test is for.' },
        { label: 'A normal finding', is_correct: false, explanation: 'It\'s a positive screen — concerning, not normal.' },
      ],
    },
    {
      id: 'M18-P3',
      prompt: 'NIPPV after extubation in a high-risk patient (CHF, COPD) can:',
      options: [
        { label: 'Prevent re-intubation in the first 48 hours', is_correct: true, explanation: 'Established evidence in the high-risk subgroup. Book Ch. 22.' },
        { label: 'Substitute for a failed SBT', is_correct: false, explanation: 'A failed SBT means the patient isn\'t ready. NIPPV doesn\'t fix that.' },
        { label: 'Treat upper airway obstruction', is_correct: false, explanation: 'NIPPV pushes through obstruction; it doesn\'t open it.' },
        { label: 'Replace endotracheal intubation entirely in respiratory failure', is_correct: false, explanation: 'There are limits.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'extubation_decision_panel',
    preset: {
      mode: 'PSV',
      settings: { psLevel: 7, peep: 5, fiO2: 40 },
      patient: { compliance: 55, resistance: 12, spontaneousRate: 16 },
    },
    unlocked_controls: [],
    visible_readouts: ['rsbi', 'actualRate', 'vte', 'mve', 'spo2'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'any_order',
    children: [
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M18-s1-cuff-leak',
          trigger: { kind: 'on_load' },
          question: '62 yo male, intubated 7 days for pneumonia. SBT passed. Cuff leak test shows 80 mL. Best decision?',
          options: [
            { label: 'Extubate to NIPPV standby', is_correct: false, explanation: 'NIPPV doesn\'t treat upper-airway obstruction.' },
            { label: 'Delay extubation 24 hours, give steroids, re-check cuff leak', is_correct: true, explanation: 'Cuff leak <110 mL = positive. Steroids 24 hours before re-trial. Book Ch. 23.' },
            { label: 'Extubate now and watch', is_correct: false, explanation: 'Sets up post-extubation stridor.' },
            { label: 'Tracheostomy', is_correct: false, explanation: 'Premature.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M18-s2-cardiogenic',
          trigger: { kind: 'on_load' },
          question: '70 yo with HFrEF, EF 25%, intubated for pulmonary edema. SBT on PSV passed. Best decision?',
          options: [
            { label: 'Delay extubation', is_correct: false, explanation: 'Patient passed the SBT — the framework supports proceeding, with rescue planned.' },
            { label: 'Extubate with NIPPV standby', is_correct: true, explanation: 'Cardiogenic post-extubation risk. Prophylactic NIPPV reduces re-intubation in high-risk patients.' },
            { label: 'Tracheostomy', is_correct: false, explanation: 'Premature — patient passed.' },
            { label: 'Back to A/C', is_correct: false, explanation: 'Patient passed — back to A/C without reason.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M18-s3-mental-status',
          trigger: { kind: 'on_load' },
          question: '35 yo s/p TBI, GCS 9, no other reason to be intubated. FiO2 35%, PEEP 5, RSBI 50, manageable secretions. Best decision?',
          options: [
            { label: 'Wait for GCS ≥ 10', is_correct: false, explanation: 'GCS waiting in brain-injured patients with low O2 needs delays liberation without benefit.' },
            { label: 'Extubate per brain-injury data', is_correct: true, explanation: 'Brain-injured patients with low O2 needs and no apnea do better with early extubation. Book Ch. 22.' },
            { label: 'Tracheostomy now', is_correct: false, explanation: 'Premature.' },
            { label: 'Continue intubation indefinitely', is_correct: false, explanation: 'Indefinitely is not a plan.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M18-s4-failed-screen',
          trigger: { kind: 'on_load' },
          question: '60 yo with severe COPD, FiO2 50%, PEEP 10, RR 30, RSBI 130. Best decision?',
          options: [
            { label: 'Extubate to NIPPV', is_correct: false, explanation: 'Patient hasn\'t passed pre-screen or SBT.' },
            { label: 'Back to A/C — not ready', is_correct: true, explanation: 'Pre-criteria fail (PEEP 10), high RSBI. Not a candidate for SBT today. Book Ch. 22.' },
            { label: 'Tracheostomy immediately', is_correct: false, explanation: 'Premature — give him a chance to improve.' },
            { label: 'Extubate', is_correct: false, explanation: 'High failure risk.' },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Passing the SBT is necessary but not sufficient.** Three pillars must hold: the reason for intubation has resolved, gas exchange is adequate without high pressure support, and the cardiovascular system can handle the work of breathing.' },
    { kind: 'callout', tone: 'info', markdown: 'Cuff leak test: deflate the cuff, measure expiratory Vt over six breaths, take the average of the three lowest, subtract from the inspired Vt. Difference <110 mL is concerning.' },
    {
      kind: 'figure',
      caption: 'Four mechanisms of extubation failure — and the mitigation for each.',
      ascii:
        'Upper airway:    stridor / edema   → cuff leak test, steroids\n' +
        'Secretions:      weak cough        → toilet, delay if severe\n' +
        'Cardiogenic:     unloading the LV  → NIPPV standby, diuresis\n' +
        'Mental status:   sedation / brain  → minimize sedation\n' +
        '                                   → brain-injured + low O2:\n' +
        '                                     early extubation data',
    },
    { kind: 'callout', tone: 'warn', markdown: 'Re-intubation within 72 hours doubles mortality. It is not "just doing the SBT again." Get the extubation right the first time.' },
  ],

  hint_ladder: {
    tier1: 'For each scenario: check the three pillars, then think about which failure mode fits the patient.',
    tier2: 'Cuff leak <110 = airway risk. Severe HFrEF = cardiogenic risk. Brain injury alone with low O2 needs = extubate.',
    tier3: { hint_text: 'Match each scenario to one of the four failure mechanisms (or to "ready now").' },
  },

  summative_quiz: [
    {
      id: 'M18-Q1',
      prompt: 'Re-intubation within 72 hours is associated with:',
      options: [
        { label: 'Improved outcomes (the patient gets a rest)', is_correct: false },
        { label: 'No change in mortality', is_correct: false },
        { label: 'Approximately doubled mortality', is_correct: true },
        { label: 'Lower ICU length of stay', is_correct: false },
      ],
      explanation: 'Failed extubation is a strong independent predictor of worse outcomes. The bar is high. Book Ch. 22.',
    },
    {
      id: 'M18-Q2',
      prompt: 'A patient with prolonged intubation has a cuff leak of 60 mL. The correct next step is:',
      options: [
        { label: 'Extubate, plan for NIPPV', is_correct: false },
        { label: 'Delay extubation 24 hours; give IV steroids; recheck', is_correct: true },
        { label: 'Extubate to high-flow nasal cannula', is_correct: false },
        { label: 'Tracheostomy', is_correct: false },
      ],
      explanation: 'NIPPV doesn\'t treat upper-airway obstruction. Steroids 24 hours, then recheck. Book Ch. 23.',
    },
    {
      id: 'M18-Q3',
      prompt: 'Which patient is the strongest candidate for prophylactic post-extubation NIPPV?',
      options: [
        { label: 'A 30-year-old after asthma exacerbation, fully awake, RSBI 35', is_correct: false },
        { label: 'A 75-year-old with HFrEF EF 25%, COPD, intubated 5 days', is_correct: true },
        { label: 'A trauma patient with GCS 14', is_correct: false },
        { label: 'A young adult intubated for drug overdose', is_correct: false },
      ],
      explanation: 'CHF + COPD is the established high-risk group. Prophylactic NIPPV reduces re-intubation in that group.',
    },
    {
      id: 'M18-Q4',
      prompt: 'A brain-injured patient with GCS 8 but FiO2 35%, PEEP 5, RSBI 50, no apnea, no high secretions burden. The recommendation is:',
      options: [
        { label: 'Wait for GCS ≥10', is_correct: false },
        { label: 'Early extubation is supported by evidence — go ahead', is_correct: true },
        { label: 'Tracheostomy at day 7', is_correct: false },
        { label: 'Continue intubation indefinitely', is_correct: false },
      ],
      explanation: 'GCS waiting in this population delays liberation without benefit. Book Ch. 22.',
    },
    {
      id: 'M18-Q5',
      prompt: 'Post-extubation stridor that does not respond to nebulized racemic epinephrine should be managed with:',
      options: [
        { label: 'NIPPV', is_correct: false },
        { label: 'Re-intubation', is_correct: true },
        { label: 'Heliox alone', is_correct: false },
        { label: 'Tracheostomy without re-intubation', is_correct: false },
      ],
      explanation: 'Upper-airway edema won\'t improve in time. Re-intubate before it becomes an emergency.',
    },
  ],

  explore_card: {
    patient_context: 'Four bedside vignettes follow — each post-SBT, each with a different complication or context. Your job is to match each to the right disposition.',
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'Cuff leak threshold', description: '<110 mL is positive (high stridor risk). >130 mL is negative. 110–130 borderline.' },
      { name: 'Three pillars', description: 'reason resolved, gas exchange adequate, cardiovascular reserve adequate.' },
      { name: 'Failure modes', description: 'upper airway, secretions, cardiogenic, mental status.' },
    ],
    suggestions: [
      'Anchor each case on the three pillars first. Then ask which failure mode is in play.',
      'NIPPV rescues cardiogenic and some hypoventilation pictures. NIPPV doesn\'t treat upper airway obstruction.',
      'Brain-injured patients with low O2 needs are an exception to "wait for GCS." Early extubation data support proceeding.',
    ],
  },
  user_facing_task: 'Four patients. For each, decide: extubate now, extubate with NIPPV standby, delay and treat, or back to A/C. Get all four right.',
  success_criteria_display: [
    'Scenario 1 (cuff leak): correct decision.',
    'Scenario 2 (cardiogenic): correct decision.',
    'Scenario 3 (brain injury): correct decision.',
    'Scenario 4 (failed pre-screen): correct decision.',
  ],
  task_framing_style: 'C',

  key_points: [
    'Three pillars beyond the SBT: reason resolved, gas exchange, cardiovascular reserve.',
    'Cuff leak <110 → delay 24h, steroids.',
    'NIPPV prophylactically for HFrEF/COPD reduces re-intubation.',
    'Brain-injured patients with low O2 needs do better with early extubation.',
    'Re-intubation in 72 hours doubles mortality.',
  ],
};

// MODULE_SPECS_v3 §M19 — Troubleshooting the Vent (DOPES).
//
// Adaptation: spec calls for live perturbations with reset_between=true. The
// sim doesn't yet apply scripted perturbations between recognition prompts,
// so each DOPES scenario is presented as a verbal vignette describing the
// observable waveform / vital-sign changes, and the learner names the
// pattern. Five scenarios — D, O, P, E, S — strict order, all required.
export const M19: ModuleConfig = {
  id: 'M19',
  number: 19,
  title: 'Troubleshooting the Vent (DOPES)',
  track: 'Synthesis',
  estimated_minutes: 25,
  briefing: {
    tagline: 'Bag off first. Then read the waveform. DOPES.',
    overview: 'When a ventilated patient suddenly decompensates, the reflexes are: increase FiO2, push sedation, call for help. Resist the first two. The mnemonic is DOPES — Displacement, Obstruction, Pneumothorax, Equipment, Stacking. The first physical action is to disconnect from the vent and bag the patient. If he improves, it was the vent or the circuit. If he doesn\'t, it\'s a patient problem. Then read the waveform — the pressure pattern divides the differential.',
    what_youll_do: [
      'DOPES — Displacement, Obstruction, Pneumothorax, Equipment, Stacking.',
      'Bag off first. Distinguishes vent problem from patient problem.',
      'High PIP + high plat = lung. High PIP + normal plat = airway.',
      'Lost ETCO2 = displacement or massive obstruction. Shark-fin ETCO2 = partial obstruction.',
      'The first action — not the whole workup — is what saves the patient.',
    ],
  },
  visible_learning_objectives: [
    'Execute the DOPES mnemonic at the bedside.',
    'Read the high-PIP / high-plat vs high-PIP / normal-plat distinction.',
    'Identify each of the five DOPES patterns from the combination of waveform, ETCO2, and vital-sign changes.',
    'Choose the first action for each pattern.',
  ],

  primer_questions: [
    {
      id: 'M19-P1',
      prompt: 'The "D" in DOPES is:',
      options: [
        { label: 'Death', is_correct: false, explanation: 'Not in any textbook.' },
        { label: 'Displacement of the endotracheal tube', is_correct: true, explanation: 'Esophageal, supraglottic, or mainstem. Book Ch. 14.' },
        { label: 'Dyssynchrony', is_correct: false, explanation: 'A different bedside problem.' },
        { label: 'Diuresis', is_correct: false, explanation: 'Not in the mnemonic.' },
      ],
    },
    {
      id: 'M19-P2',
      prompt: 'High PIP, normal plateau pressure indicates:',
      options: [
        { label: 'Worsening compliance', is_correct: false, explanation: 'Compliance would push plat up too.' },
        { label: 'Increased airway resistance — mucus, kink, bronchospasm', is_correct: true, explanation: 'The PIP-plat gap is the resistance signal. Book Ch. 2.' },
        { label: 'Pneumothorax', is_correct: false, explanation: 'Pneumothorax raises plat as well.' },
        { label: 'Pulmonary edema', is_correct: false, explanation: 'Compliance issue — plat would rise.' },
      ],
    },
    {
      id: 'M19-P3',
      prompt: 'The first step when a vented patient decompensates is:',
      options: [
        { label: 'Increase FiO2 to 1.0', is_correct: false, explanation: 'A reflex, not a diagnostic step.' },
        { label: 'Bag the patient off the ventilator', is_correct: true, explanation: 'Distinguishes vent / circuit problem from patient problem in seconds. Book Ch. 14.' },
        { label: 'Order a stat CXR', is_correct: false, explanation: 'Useful eventually. Not first.' },
        { label: 'Push sedation', is_correct: false, explanation: 'Sedation buries the diagnostic information.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'dopes_baseline',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 16, peep: 8, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 40, resistance: 12, spontaneousRate: 0, heightInches: 70, gender: 'M' },
    },
    unlocked_controls: [],
    visible_readouts: ['pip', 'plat', 'vte', 'mve', 'autoPeep'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    children: [
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M19-s1-displacement',
          trigger: { kind: 'on_load' },
          question: 'Scenario 1/5. Sudden drop in returned tidal volume. ETCO2 waveform lost. No chest rise. Most likely cause?',
          options: [
            { label: 'Displacement (tube out / esophageal)', is_correct: true },
            { label: 'Obstruction (mucus plug)', is_correct: false },
            { label: 'Pneumothorax', is_correct: false },
            { label: 'Equipment leak', is_correct: false },
            { label: 'Stacking / auto-PEEP', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M19-s2-obstruction',
          trigger: { kind: 'on_load' },
          question: 'Scenario 2/5. PIP rises from 28 to 45 over a few breaths. Plateau is unchanged at 23. ETCO2 takes on a shark-fin shape. Most likely cause?',
          options: [
            { label: 'Displacement', is_correct: false },
            { label: 'Obstruction (mucus / bronchospasm)', is_correct: true },
            { label: 'Pneumothorax', is_correct: false },
            { label: 'Equipment leak', is_correct: false },
            { label: 'Stacking', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M19-s3-pneumothorax',
          trigger: { kind: 'on_load' },
          question: 'Scenario 3/5. PIP rises from 28 to 42 AND plateau rises from 22 to 36. BP drops 25 mmHg. SpO2 falls. Breath sounds asymmetric. Most likely cause?',
          options: [
            { label: 'Displacement', is_correct: false },
            { label: 'Obstruction', is_correct: false },
            { label: 'Tension pneumothorax', is_correct: true },
            { label: 'Equipment leak', is_correct: false },
            { label: 'Stacking', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M19-s4-equipment',
          trigger: { kind: 'on_load' },
          question: 'Scenario 4/5. Delivered Vt 450, returned Vt only 300. Circuit pressure drops mid-breath. Low pressure alarm. Most likely cause?',
          options: [
            { label: 'Displacement', is_correct: false },
            { label: 'Obstruction', is_correct: false },
            { label: 'Pneumothorax', is_correct: false },
            { label: 'Equipment leak (circuit / cuff)', is_correct: true },
            { label: 'Stacking', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M19-s5-stacking',
          trigger: { kind: 'on_load' },
          question: 'Scenario 5/5. Auto-PEEP rises to 8. BP drops 15 mmHg. Expiratory flow doesn\'t return to zero before the next breath. Chest looks hyperinflated. Most likely cause?',
          options: [
            { label: 'Displacement', is_correct: false },
            { label: 'Obstruction', is_correct: false },
            { label: 'Pneumothorax', is_correct: false },
            { label: 'Equipment leak', is_correct: false },
            { label: 'Stacking (auto-PEEP / dynamic hyperinflation)', is_correct: true },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**The mnemonic is DOPES.** Displacement, Obstruction, Pneumothorax, Equipment, Stacking. The very first physical action is to disconnect from the vent and bag. If the patient improves, it was the vent or the circuit. If he doesn\'t, it\'s a patient problem. Then read the waveform.' },
    { kind: 'callout', tone: 'info', markdown: 'The pressure pattern divides the differential. High PIP + high plat = lung. High PIP + normal plat = airway. Lost ETCO2 waveform = displacement (full) or massive obstruction. Shark-fin ETCO2 = partial obstruction.' },
    {
      kind: 'figure',
      caption: 'Five DOPES patterns, side by side.',
      ascii:
        'D Displacement:  lost ETCO2, no chest rise / asymmetric\n' +
        'O Obstruction:   ↑PIP, plat ~same (wide gap); shark-fin ETCO2\n' +
        'P Pneumothorax:  ↑PIP and ↑plat (parallel); ↓BP, ↓SpO2, asym\n' +
        'E Equipment:     delivered ≠ returned Vt; low circuit pressure\n' +
        'S Stacking:      ↑autoPEEP, exp flow ≠ zero, ↓BP, hyperinflated',
    },
    { kind: 'callout', tone: 'warn', markdown: 'The clinical reflex of "sedate and turn up FiO2" makes some of these worse. Stacking gets worse with sedation if the underlying rate isn\'t fixed. Tension pneumothorax gets worse with higher PIP.' },
  ],

  hint_ladder: {
    tier1: 'Bag off first. Then read the waveform — PIP up? Plat up? Both? Then read the ETCO2.',
    tier2: 'Parallel PIP+plat rise = compliance (pneumothorax). Widening PIP-plat gap = resistance (obstruction). No ETCO2 = displacement. Volume mismatch = equipment. Auto-PEEP rising = stacking.',
    tier3: { hint_text: 'Match the dominant clue in the prompt to one row of the DOPES table.' },
  },

  summative_quiz: [
    {
      id: 'M19-Q1',
      prompt: 'A vented patient suddenly has loss of the ETCO2 waveform and no chest rise. The most likely cause is:',
      options: [
        { label: 'Worsening ARDS', is_correct: false },
        { label: 'Displacement of the endotracheal tube', is_correct: true },
        { label: 'Stacked breaths', is_correct: false },
        { label: 'PEEP set too high', is_correct: false },
      ],
      explanation: 'Lost ETCO2 + no chest rise = the tube is out (or in the esophagus). Capnography is the gold standard for tracheal placement. Book Ch. 7, Ch. 14.',
    },
    {
      id: 'M19-Q2',
      prompt: 'PIP rises from 28 to 42 with plat unchanged at 22. The cause is in:',
      options: [
        { label: 'The lung', is_correct: false },
        { label: 'The airway — kinked tube, mucus plug, or bronchospasm', is_correct: true },
        { label: 'The ventilator circuit', is_correct: false },
        { label: 'The PEEP setting', is_correct: false },
      ],
      explanation: 'PIP rises with resistance; plat reflects compliance. Widening gap = resistance signal. Book Ch. 2.',
    },
    {
      id: 'M19-Q3',
      prompt: 'The shark-fin ETCO2 waveform is characteristic of:',
      options: [
        { label: 'Pulmonary embolism', is_correct: false },
        { label: 'Bronchospasm or partial airway obstruction', is_correct: true },
        { label: 'Hyperventilation', is_correct: false },
        { label: 'Pneumothorax', is_correct: false },
      ],
      explanation: 'Uneven alveolar emptying. The slope of phase III steepens. Book Ch. 7, Ch. 14.',
    },
    {
      id: 'M19-Q4',
      prompt: 'A trapped COPD patient with BP 70/40 and measured auto-PEEP of 14. The first action is:',
      options: [
        { label: 'Norepinephrine', is_correct: false },
        { label: 'Disconnect from the vent, let him exhale for 10–15 seconds', is_correct: true },
        { label: 'Raise PEEP', is_correct: false },
        { label: 'Push sedation', is_correct: false },
      ],
      explanation: 'Trapping is compressing venous return. Letting the chest fall is the immediate fix. Then sort out rate / Te. Book Ch. 14, Ch. 15.',
    },
    {
      id: 'M19-Q5',
      prompt: 'A vented patient has rising PIP, rising plat, unilaterally diminished breath sounds, falling BP. The first action is:',
      options: [
        { label: 'Stat chest X-ray', is_correct: false },
        { label: 'Needle decompression of the suspected pneumothorax', is_correct: true },
        { label: 'Increase FiO2 to 1.0', is_correct: false },
        { label: 'Push more sedation', is_correct: false },
      ],
      explanation: 'Time-critical. The X-ray confirms after. Book Ch. 14.',
    },
  ],

  explore_card: {
    patient_context: 'This is the bedside rapid-response module. You\'ll be called to five deteriorations in a row. The vent will alarm, the waveforms will change, and you\'ll be asked what\'s going on. The sim is currently showing a normal, stable patient as your baseline.',
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'Baseline pressures', description: 'PIP ~28, plat ~22 — small gap.' },
      { name: 'Vte ≈ delivered', description: 'circuit intact, no leak.' },
      { name: 'No alarms', description: 'normal — every case starts here and then diverges.' },
    ],
    suggestions: [
      'Memorize what normal looks like — every scenario diverges from this baseline.',
      'Mentally rehearse the five DOPES rows. Each has a distinct signature.',
      'The patterns are diagnostic, not subtle. If two signals point at the same row, that\'s usually your answer.',
    ],
  },
  user_facing_task: 'Five decompensations in a row. For each, identify the pattern: D / O / P / E / S. Get all five right.',
  success_criteria_display: [
    'Scenario 1: displacement identified.',
    'Scenario 2: obstruction identified.',
    'Scenario 3: tension pneumothorax identified.',
    'Scenario 4: equipment leak identified.',
    'Scenario 5: stacking / auto-PEEP identified.',
  ],
  task_framing_style: 'C',

  key_points: [
    'DOPES — Displacement, Obstruction, Pneumothorax, Equipment, Stacking.',
    'Bag off the vent first. Distinguishes vent problem from patient problem.',
    'High PIP + high plat = lung. High PIP + normal plat = airway.',
    'Lost ETCO2 = displacement or full obstruction. Shark-fin ETCO2 = partial.',
    'The first action — not the whole workup — is what saves the patient.',
  ],
};
