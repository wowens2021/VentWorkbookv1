import type { ModuleConfig } from '../shell/types';

/**
 * MODULE M17 — Weaning Concepts (Liberation)
 *
 * Track: Weaning · Archetype: decisional (read strip, decide) · 18 min
 *
 * PINNED PARAMETERS:
 *   - SBT scenario state is presented as STATIC DATA, not a live sim.
 *   - The learner reads the strip and decides; this is a decisional module.
 *
 * Adaptation: the spec wants free-form RSBI entry; the engine only supports
 * recognition multiple-choice, so RSBI is presented as a 4-option pick
 * whose options bracket the correct value (RR 22 / Vt 0.32 ≈ 69 per v3.2 §7). The
 * pre-criteria step and the pass/fail decision are each their own
 * recognition. All three required, in order.
 *
 * Specced against docs/MODULE_SPECS_v3.md §M17 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §14. See MODULE_SPECS_v3.md Appendix A.
 */
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
      // v3.2 §7 — bedside numbers now force a real division: RR 22, Vt 320,
      // RSBI 22 ÷ 0.32 = 68.75 ≈ 69. Distractors 55, 62, 76 are all within
      // plausible RSBI range so the learner can't pick by magnitude alone.
      patient: { compliance: 60, resistance: 12, spontaneousRate: 22, heightInches: 70, gender: 'M' },
    },
    unlocked_controls: [],
    visible_readouts: ['actualRate', 'vte', 'rsbi', 'spo2', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    children: [
      // Novice-pass §17.3 — pre-criteria question reworded so the learner
      // has to scan the patient state rather than trust the stem. The
      // distractors are now realistic missing-criterion picks.
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M17-precheck',
          trigger: { kind: 'on_load' },
          question:
            "Bedside: FiO2 40%, PEEP 5, RR 16, BP 118/72 (off pressors 24 hours), GCS 15 follows commands, no upper-airway concerns. Which of the pre-SBT criteria is MISSING?",
          options: [
            { label: 'None — all pre-SBT criteria are met. Proceed.', is_correct: true, explanation: 'FiO2 ≤ 50 ✓, PEEP ≤ 8 ✓, follows commands ✓, hemodynamically stable ✓, not a difficult airway ✓. Run the SBT.' },
            { label: 'Off-pressor duration — needs to be off ≥ 48 hours.', is_correct: false, explanation: '24 hours off pressors clears the standard hemodynamic-stability bar.' },
            { label: 'FiO2 too high — must be ≤ 30%.', is_correct: false, explanation: 'The pre-SBT FiO2 threshold is ≤ 50%. 40% is fine.' },
            { label: 'Mental status — needs to be wake and oriented x3.', is_correct: false, explanation: '"Follows commands" is the standard bar — full orientation isn\'t required.' },
          ],
          max_attempts: 2,
        },
      },
      // Novice-pass §17.1 — replace the RSBI computation step with an
      // interpretation step. Arithmetic isn't the bottleneck; clinical
      // judgment is.
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M17-rsbi-calc',
          trigger: { kind: 'on_load' },
          question:
            "At 30 minutes on CPAP 5 / PS 7 / FiO2 40%: RR 22, spontaneous Vt 320 mL, SpO2 95%, HR 88, BP 124/72. The RSBI is 69. Where does that fall?",
          options: [
            { label: 'Below 80 — passes the conventional threshold; consider extubating.', is_correct: true, explanation: 'Yang–Tobin\'s original threshold is < 105 on T-piece. Owens uses < 80 on PSV because the pressure support is already doing some work. 69 is comfortably below either threshold.' },
            { label: '80–105 — borderline; weigh other factors.', is_correct: false, explanation: '69 is below the lower bound of the borderline band.' },
            { label: 'Above 105 — high risk of failure; not ready.', is_correct: false, explanation: '69 is well below the 105 failure threshold.' },
            { label: "RSBI doesn't matter if other criteria are met.", is_correct: false, explanation: 'RSBI is a real signal — it just isn\'t the only one. It does matter; it isn\'t the verdict.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          // v3.2 §7.7 — RSBI value updated from 47 to 69 to match the new
          // bedside numbers. Options unchanged.
          prompt_id: 'M17-decision',
          trigger: { kind: 'on_load' },
          question: 'RSBI 69, comfortable, no abort criteria triggered. The next step is:',
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
    // v3.2 §0.7 — predict_mcq grounding the RSBI math before the live
    // decision in the Try-It. Per v3.2 §7 the bedside numbers are
    // RR 22, Vt 320, RSBI 69.
    {
      kind: 'predict_mcq',
      predict:
        'A patient on PSV with PS 7 has RR 22, spontaneous Vt 320 mL. Approximately what is the RSBI?',
      options: [
        { label: '52', is_correct: false, explanation: 'That would be RR/Vt with Vt in mL, not L.' },
        { label: '69', is_correct: true },
        { label: '7', is_correct: false, explanation: 'Vt(L) / RR, inverse.' },
        { label: '110', is_correct: false, explanation: 'Close to the Yang–Tobin failure threshold; would suggest not ready.' },
      ],
      observe:
        'RSBI = RR ÷ Vt(L) = 22 ÷ 0.32 = 68.75 ≈ 69. Below 80 on PSV — passes Owens\'s threshold. Now look at the patient (accessory muscle use, diaphoresis, mental status) before extubating. The number alone is never the answer.',
    },
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
    // Novice-pass §17.2 — promoted from callout to a dedicated closing
    // read block. This meta-lesson IS the climax of the module.
    {
      kind: 'prose',
      markdown:
        "**RSBI is a number. The patient is the final judge.** A patient with an RSBI of 60 who looks terrible — diaphoresis, accessory muscle use, paradoxical chest motion, watching the door — should not be extubated. A patient with an RSBI of 90 who looks great — calm, conversational, normal work of breathing — might be ready. The number is a hint, not a verdict. The number you read at the bedside is *every other number you can see at the same time*: heart rate, blood pressure, the patient's face. Build the habit of reading the patient before reading the chip.",
    },
    { kind: 'callout', tone: 'warn', markdown: 'RSBI alone is not a complete answer. A patient with RSBI 75 who is gasping and paradoxical-breathing is not ready. A patient with RSBI 110 who looks calm may do fine. Numbers help. The patient is the final judge.' },
  ],

  hint_ladder: {
    tier1: 'Pre-criteria first. Then RSBI. Then look at the patient.',
    tier2: 'RSBI = RR divided by Vt in liters. 22 ÷ 0.32.',
    tier3: { hint_text: 'RSBI ≈ 69, below 80. Extubate.' },
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
        { label: 'Repeat SBT in 12 hours', is_correct: false, explanation: 'No reason to delay — the SBT result is in front of you.' },
        { label: 'Extubate', is_correct: true, explanation: 'Pre-screen passed, trial passed, patient looks good. Extubate. Book Ch. 22.' },
        { label: 'Reduce PS by 2 and try again', is_correct: false, explanation: 'Trial just passed — there is no second trial to run.' },
        { label: 'Get an ABG first', is_correct: false, explanation: 'Common practice but not required by Owens. The decision is primarily clinical; ABG is supportive, not gating.' },
      ],
      explanation: 'Pre-screen passed, trial passed, patient looks good — extubate. Book Ch. 22.',
    },
  ],

  explore_card: {
    patient_context: 'Post-pneumonia, day 5, awake, follows commands. Yesterday on FiO2 40% / PEEP 8. Today, RT set up an SBT — CPAP 5 / PS 7 / FiO2 40%. You\'re reading the data at the 30-minute mark.',
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'RR 22, spontaneous Vt 320 mL', description: 'the inputs for RSBI — divide them, in your head, before you commit.' },
      { name: 'SpO2 95%, HR 88, BP 124/72', description: 'no abort criteria triggered.' },
    ],
    suggestions: [
      'Anchor on the pre-criteria. If those aren\'t met, the SBT shouldn\'t have started.',
      'Compute RSBI in your head: 22 ÷ 0.32.',
      'Then look at the patient. Comfortable? Working hard? The number agrees with the bedside?',
    ],
  },
  user_facing_task: 'Read the bedside data and decide. Your patient finished a 30-minute SBT on CPAP 5 / PS 7 / FiO2 40%. At the 30-minute mark: RR 22, spontaneous Vt 320 mL, SpO2 95%, HR 88, BP 124/72. Check pre-criteria. Compute RSBI in your head. Decide.',
  // success_criteria_display omitted — shell auto-derives from the three
  // recognition prompts so the checklist matches the questions verbatim.
  task_framing_style: 'C',

  key_points: [
    'Liberation = daily assessment, not gradual reduction.',
    'Pre-SBT screen (5 criteria), SBT setup (CPAP 5 + PS 7), RSBI <80 on PSV.',
    'RSBI alone is not the answer. The patient is the final judge.',
    'Abort criteria: desat, HR rise, BP change, diaphoresis, accessory muscle use.',
  ],
};

/**
 * MODULE M18 — Extubation Criteria and Failure
 *
 * Track: Weaning · Archetype: recognition (pattern triage) · 18 min
 *
 * PINNED PARAMETERS:
 *   - Cuff leak thresholds:
 *       <110 mL:  positive (high stridor risk)
 *       110-130:  borderline
 *       >130 mL:  negative
 *
 * Four bedside vignettes, four different correct decisions. The spec
 * requires the same four options to appear on every scenario; the
 * recognition prompt UI renders each prompt's options independently,
 * so we author the same option set across all four prompts so the
 * pedagogical claim ("the learner is genuinely choosing among the same
 * four options each time") holds. Order randomization is left to the
 * engine.
 *
 * Specced against docs/MODULE_SPECS_v3.md §M18 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §15. See MODULE_SPECS_v3.md Appendix A.
 */
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

  // Spec §15 v3.1: every scenario presents the same four options so the
  // learner is genuinely picking among the same decisions each time. The
  // correct answer rotates by scenario. Explanations are scenario-specific.
  hidden_objective: {
    kind: 'compound',
    sequence: 'any_order',
    children: [
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M18-s1-cuff-leak',
          trigger: { kind: 'on_load' },
          // v3.2 §8.4 — explicitly frame as Owens's recommendation so the
          // learner trained on a different default knows what's being asked.
          question: '62 yo male, intubated 7 days for pneumonia. SBT passed. Cuff leak test shows 80 mL. Per Owens\'s framework, the best decision is:',
          options: [
            { label: 'Delay 24h; IV steroids; recheck cuff leak', is_correct: true, explanation: 'Cuff leak <110 mL is a positive screen for upper-airway edema. Steroids 24 hours, then recheck. Book Ch. 23.' },
            { label: 'Extubate with NIPPV standby', is_correct: false, explanation: 'NIPPV doesn\'t treat upper-airway obstruction — it pushes air past obstruction, not through it.' },
            { label: 'Extubate per brain-injury data', is_correct: false, explanation: 'Wrong patient context — this is an upper-airway scenario, not a brain-injury one.' },
            { label: 'Back to A/C — not ready', is_correct: false, explanation: 'Wrong — the patient passed the SBT. The problem isn\'t readiness; it\'s post-extubation stridor risk.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M18-s2-cardiogenic',
          trigger: { kind: 'on_load' },
          question: '70 yo with HFrEF, EF 25%, intubated for pulmonary edema. SBT on PSV passed. Per Owens\'s framework, the best decision is:',
          options: [
            { label: 'Delay 24h; IV steroids; recheck cuff leak', is_correct: false, explanation: 'No airway-edema risk in this scenario — the failure mode is cardiogenic, not upper-airway.' },
            { label: 'Extubate with NIPPV standby', is_correct: true, explanation: 'Cardiogenic post-extubation risk. Prophylactic NIPPV reduces re-intubation in high-risk patients (HFrEF, COPD).' },
            { label: 'Extubate per brain-injury data', is_correct: false, explanation: 'Wrong patient context — this is a cardiogenic scenario, not a brain-injury one.' },
            { label: 'Back to A/C — not ready', is_correct: false, explanation: 'Patient passed the SBT — back to A/C without reason.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          // v3.2 §8 — full reframe. The question now asks what Owens
          // recommends (a defensible answerable question), names the
          // recommendation as Owens-specific in the correct-option
          // explanation, and acknowledges the "GCS ≥ 10" rule as the
          // conventional teaching rather than wrong. Citations: Coplin et
          // al. 2000 (Neurology) and Manno et al. 2008 (Mayo Clinic Proc).
          prompt_id: 'M18-s3-mental-status',
          trigger: { kind: 'on_load' },
          question:
            '35 yo s/p TBI, GCS 9, no other reason to be intubated. FiO2 35%, PEEP 5, RSBI 50, manageable secretions. Per Owens\'s framework, the recommended decision is:',
          options: [
            {
              label: 'Delay 24h; IV steroids; recheck cuff leak.',
              is_correct: false,
              explanation: "No airway-edema indication — the cuff leak isn't the issue here.",
            },
            {
              label: 'Extubate with NIPPV standby.',
              is_correct: false,
              explanation: "No cardiogenic indication. Brain-injured patients with low O2 needs don't have a clear NIPPV indication.",
            },
            {
              label: 'Extubate — Owens recommends early extubation in brain-injured patients with low oxygen requirement, despite GCS.',
              is_correct: true,
              explanation:
                "This is the counter-intuitive call. Owens cites data (Coplin et al., 2000; Manno et al., 2008) showing brain-injured patients with low O2 needs (FiO2 ≤ 40, PEEP ≤ 5) and no high secretion burden do better extubated than held for GCS to improve. The standard 'wait for GCS ≥ 10' rule delays liberation without benefit in this subgroup. This recommendation is Owens-specific; check your institution's protocol — some still require GCS ≥ 10.",
            },
            {
              label: 'Back to A/C — not ready, GCS too low.',
              is_correct: false,
              explanation:
                "The conventional answer — and what many institutions still teach. Owens's reading of the data is that this delays liberation unnecessarily for brain-injured patients with low O2 needs.",
            },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M18-s4-failed-screen',
          trigger: { kind: 'on_load' },
          question: '60 yo with severe COPD, FiO2 0.50, PEEP 10, RR 30, RSBI 130. Per Owens\'s framework, the best decision is:',
          options: [
            { label: 'Delay 24h; IV steroids; recheck cuff leak', is_correct: false, explanation: 'Cuff leak isn\'t the problem — pre-screen and SBT both fail.' },
            { label: 'Extubate with NIPPV standby', is_correct: false, explanation: 'Patient hasn\'t passed pre-screen or SBT. NIPPV after a failed SBT is rescue, not standby.' },
            { label: 'Extubate per brain-injury data', is_correct: false, explanation: 'Wrong patient context — this is a respiratory pre-screen failure.' },
            { label: 'Back to A/C — not ready', is_correct: true, explanation: 'Pre-criteria fail (PEEP 10, FiO2 0.50), high RSBI 130. Not a candidate for an SBT today. Book Ch. 22.' },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Passing the SBT is necessary but not sufficient.** Three pillars must hold: the reason for intubation has resolved, gas exchange is adequate without high pressure support, and the cardiovascular system can handle the work of breathing.' },
    // Novice-pass §18.2 — NIPPV-vs-upper-airway distinction promoted from
    // distractor footnote to dedicated read block.
    {
      kind: 'prose',
      markdown:
        "**NIPPV is the right tool for some post-extubation problems and the wrong tool for others.** NIPPV pushes air *past* an obstruction; it doesn't *open* the obstruction. If the upper airway is swollen, NIPPV is the wrong tool — you need to address the swelling (steroids, time, or reintubation). NIPPV IS the right tool for tired diaphragms and excess work of breathing — the cardiogenic post-extubation patient who needs the LV unloaded, the COPDer who needs help blowing off CO2. Match the tool to the failure mode.",
    },
    { kind: 'callout', tone: 'info', markdown: 'Cuff leak test: deflate the cuff, measure expiratory Vt over six breaths, take the average of the three lowest, subtract from the inspired Vt. Difference <110 mL is concerning.' },
    // Novice-pass §18.3 — cuff-leak mechanism so the number isn't a
    // memorize-this-threshold.
    {
      kind: 'prose',
      markdown:
        "**Why does cuff leak matter?** When you deflate the cuff, air should leak around the tube during inspiration — the more it leaks, the more patent the airway around the tube. If the leak is small (< 110 mL), the airway is tight against the tube — usually from swelling. **That swelling will obstruct the airway after extubation** when the tube is no longer holding the path open. A small cuff leak = a swollen airway = a risk of post-extubation stridor and reintubation. Treat with 24 hours of IV steroids and recheck.",
    },
    // v3.2 §0.7 — predict_mcq grounding the cuff-leak gate before the live
    // four-scenario triage.
    {
      kind: 'predict_mcq',
      predict:
        'A patient passes the SBT pre-screen, RSBI 60, no abort criteria, but the cuff leak is 70 mL. Best decision?',
      options: [
        { label: 'Extubate — SBT criteria met.', is_correct: false, explanation: 'Cuff leak <110 mL is a positive screen for upper-airway edema; the SBT doesn\'t measure that.' },
        { label: 'Extubate with NIPPV standby.', is_correct: false, explanation: 'NIPPV pushes air past obstruction, it doesn\'t open the obstruction. Upper-airway edema is the wrong indication.' },
        { label: 'Delay 24 hours, give IV steroids, recheck cuff leak.', is_correct: true },
        { label: 'Re-intubate now to a smaller tube.', is_correct: false, explanation: 'He\'s still intubated; the question is about the post-extubation period, not the current tube.' },
      ],
      observe:
        'SBT pre-criteria are necessary, not sufficient. Cuff leak is a separate gate testing for upper-airway edema. Steroids 24 hours, then recheck. Re-intubation within 72 hours of failure doubles mortality — the bar to extubate is high.',
    },
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
  user_facing_task: 'Four patients. Four decisions. For each, choose the disposition that matches the failure mode in play — delay and treat (cuff leak), extubate with NIPPV standby (cardiogenic), extubate per brain-injury data (TBI with low O2 needs), or back to A/C (failed pre-screen). Same four options every time; the right answer rotates.',
  // success_criteria_display omitted — shell auto-derives from the four
  // recognition prompt questions so each ticks off as the learner answers.
  task_framing_style: 'C',

  key_points: [
    'Three pillars beyond the SBT: reason resolved, gas exchange, cardiovascular reserve.',
    'Cuff leak <110 → delay 24h, steroids.',
    'NIPPV prophylactically for HFrEF/COPD reduces re-intubation.',
    'Brain-injured patients with low O2 needs do better with early extubation.',
    'Re-intubation in 72 hours doubles mortality.',
  ],
};

/**
 * MODULE M19 — Troubleshooting the Vent (DOPES)
 *
 * Track: Synthesis · Archetype: recognition + intervention chain · 25 min
 *
 * PINNED PARAMETERS:
 *   - reset_between: TRUE on the compound tracker is mandatory. Without
 *     reset, the second scenario inherits the first's chaos and the
 *     tracker is uninterpretable.
 *   - Perturbation scripts for the five DOPES scenarios live in the prompt
 *     bodies (descriptive text) until the sim renders live perturbations.
 *
 * [BLOCKED-SIM] Sim limitation: the spec calls for live perturbations
 * that physically alter the waveform (displacement → lost ETCO2; pneumo →
 * unilateral chest rise loss + parallel pressure rise). The current sim
 * doesn't apply scripted perturbations between recognition prompts, so
 * each scenario is presented as a vignette describing the observable
 * waveform / vital-sign changes; the learner names the pattern. Future
 * work: scripted perturbation overlay + ETCO2 waveform trace + chest-rise
 * indicator. The vignette text is written so it transfers to live
 * rendering without rewriting.
 *
 * Specced against docs/MODULE_SPECS_v3.md §M19 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §16. See MODULE_SPECS_v3.md Appendix A.
 */
export const M19: ModuleConfig = {
  id: 'M19',
  number: 19,
  title: 'Troubleshooting the Vent (DOPES)',
  track: 'Synthesis',
  estimated_minutes: 25,
  // Novice-pass §19.2 — define DOPES in the briefing so the primer
  // doesn't test something untaught.
  briefing: {
    tagline: 'Bag off first. Then read the waveform.',
    overview:
      "When a ventilated patient suddenly decompensates, the reflexes are: increase FiO2, push sedation, call for help. Resist the first two. The mnemonic is **DOPES**:\n\n**D — Displacement** of the endotracheal tube (out, esophageal, or mainstem)\n**O — Obstruction** of the tube (mucus plug, kink, biting)\n**P — Pneumothorax** (especially tension)\n**E — Equipment** failure (circuit leak, cuff leak, vent fault)\n**S — Stacking** of breaths (dynamic hyperinflation, auto-PEEP)\n\nThe first physical action is to disconnect from the vent and bag the patient. If he improves, it was the vent or the circuit. If he doesn't, it's a patient problem. Then read the waveform — the pressure pattern divides the differential.",
    what_youll_do: [
      'Recognize each of the five DOPES patterns from the live sim.',
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
    // v3.2 §9 — etco2 and sbp surfaced so the scripted perturbations have
    // visible signals (displacement → ETCO2 0; pneumothorax → SBP drop).
    visible_readouts: ['pip', 'plat', 'vte', 'mve', 'autoPeep', 'etco2', 'sbp'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  // v3.2 §9 — DOPES now drives off live scripted sim perturbations rather
  // than verbal vignettes. Each child applies a one-shot patient/settings
  // override via the perturbation API before its prompt presents; the
  // compound's `reset_between: true` clears the perturbation and resets
  // baseline between scenarios. Same five options on every prompt so the
  // learner picks among the actual diagnostic set each time.
  //
  // Novice-pass §19.3 — five recognitions in a row IS fatiguing. The
  // structural midpoint (after S3) deserves a "take a breath" moment.
  // The current compound primitive doesn't support a non-tracker pause
  // child; surfaced as a content note in the read phase and as a code
  // TODO so a future shell pass can add an `interlude` child type.
  // Novice-pass §19.4 — `reset_between: true` clears each perturbation
  // before the next prompt loads. VERIFIED via the perturbation API path
  // in v3.2 §9; the harness clearPerturbations is called from
  // resetToPreset which fires between strict-sequence children.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: true,
    children: [
      {
        kind: 'recognition',
        // Displacement: full Vt loss + ETCO2 → 0. The disconnect signature.
        perturbation: {
          id: 'displacement',
          patient: { leak_mL_per_breath: 9999, etco2_loss_fraction: 1.0 },
        },
        prompt: {
          prompt_id: 'M19-s1-displacement',
          trigger: { kind: 'on_load' },
          question:
            'The sim has just been perturbed. Read the readouts and waveforms. What pattern is this?',
          options: [
            { label: 'Displacement (tube out or esophageal)', is_correct: true, explanation: 'Vte → 0 and ETCO2 → 0 is the disconnect signature. Confirm with capnography and direct laryngoscopy.' },
            { label: 'Obstruction', is_correct: false, explanation: 'Obstruction would push PIP up against a steady plateau, and ETCO2 would shark-fin rather than disappear.' },
            { label: 'Pneumothorax', is_correct: false, explanation: 'Pneumothorax would raise PIP AND plateau and drop SBP, not zero out the ETCO2.' },
            { label: 'Equipment leak', is_correct: false, explanation: 'A leak shows a Vt gap (delivered > returned) but not a flat ETCO2 — gas is still moving past the sensor.' },
            { label: 'Stacking', is_correct: false, explanation: 'Stacking pushes autoPEEP up and keeps ETCO2 visible — there\'s still gas exchange, just trapped.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        // Obstruction: resistance spike. PIP rises, plateau unchanged.
        perturbation: { id: 'obstruction', patient: { resistance: 40 } },
        prompt: {
          prompt_id: 'M19-s2-obstruction',
          trigger: { kind: 'on_load' },
          question:
            'The sim has just been perturbed. Read the readouts and waveforms. What pattern is this?',
          options: [
            { label: 'Displacement', is_correct: false, explanation: 'Displacement zeros out Vte and ETCO2. The Vt here is unchanged — the gap to the plateau is the clue.' },
            { label: 'Obstruction (mucus, bronchospasm, kink)', is_correct: true, explanation: 'PIP rises because R·flow rose. Plateau is unchanged because compliance is fine. The widening PIP–plateau gap is the resistance signature.' },
            { label: 'Pneumothorax', is_correct: false, explanation: 'Pneumothorax raises plateau in parallel with PIP. Plateau is unchanged here.' },
            { label: 'Equipment leak', is_correct: false, explanation: 'A leak doesn\'t raise PIP — it lowers Vte.' },
            { label: 'Stacking', is_correct: false, explanation: 'Stacking shows as autoPEEP rising, not a discrete PIP jump on the breath cycle.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        // Pneumothorax: compliance drop AND SBP fall.
        perturbation: { id: 'pneumothorax', patient: { compliance: 12, bpSys: 75 } },
        prompt: {
          prompt_id: 'M19-s3-pneumothorax',
          trigger: { kind: 'on_load' },
          question:
            'The sim has just been perturbed. Read the readouts and waveforms. What pattern is this?',
          options: [
            { label: 'Displacement', is_correct: false, explanation: 'Displacement would zero out ETCO2. Here gas is still moving.' },
            { label: 'Obstruction', is_correct: false, explanation: 'Obstruction leaves plateau alone. Both PIP and plateau rose here — that\'s compliance.' },
            { label: 'Tension pneumothorax', is_correct: true, explanation: 'PIP and plateau rose in parallel (compliance crashed) AND SBP fell (venous return compressed). Asymmetric breath sounds at the bedside seal it.' },
            { label: 'Equipment leak', is_correct: false, explanation: 'A leak doesn\'t raise plateau or drop BP.' },
            { label: 'Stacking', is_correct: false, explanation: 'Stacking is auto-PEEP-driven; plateau wouldn\'t jump like this on a single breath.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        // Equipment leak: 150 mL/breath of returned-Vt loss without affecting other signals.
        perturbation: { id: 'equipment', patient: { leak_mL_per_breath: 150 } },
        prompt: {
          prompt_id: 'M19-s4-equipment',
          trigger: { kind: 'on_load' },
          question:
            'The sim has just been perturbed. Read the readouts and waveforms. What pattern is this?',
          options: [
            { label: 'Displacement', is_correct: false, explanation: 'Displacement zeros out Vte. Here Vte is reduced but not zero, and ETCO2 is preserved — gas is moving past the sensor.' },
            { label: 'Obstruction', is_correct: false, explanation: 'Obstruction raises PIP. PIP is unchanged here.' },
            { label: 'Pneumothorax', is_correct: false, explanation: 'Pneumothorax raises plateau and drops BP. Neither happened.' },
            { label: 'Equipment leak (circuit or cuff)', is_correct: true, explanation: 'Delivered Vt is set; returned Vt is short by a persistent gap. The cuff or the circuit is leaking. Check the pilot balloon and the connections.' },
            { label: 'Stacking', is_correct: false, explanation: 'Stacking drives autoPEEP up, not Vte down.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        // Stacking: rate pushed up to 28 → expiratory time too short for R=12.
        perturbation: { id: 'stacking', settings: { respiratoryRate: 28 } },
        prompt: {
          prompt_id: 'M19-s5-stacking',
          trigger: { kind: 'on_load' },
          question:
            'The sim has just been perturbed. Read the readouts and waveforms. What pattern is this?',
          options: [
            { label: 'Displacement', is_correct: false, explanation: 'Displacement zeros out ETCO2. ETCO2 is preserved here.' },
            { label: 'Obstruction', is_correct: false, explanation: 'Obstruction is a discrete resistance jump. Here the rate is too fast for full exhalation — the trapping is rate-driven.' },
            { label: 'Pneumothorax', is_correct: false, explanation: 'No parallel PIP+plateau rise; no sudden BP fall from compression.' },
            { label: 'Equipment leak', is_correct: false, explanation: 'A leak doesn\'t cause auto-PEEP — it loses gas.' },
            { label: 'Stacking (auto-PEEP / dynamic hyperinflation)', is_correct: true, explanation: 'Expiratory flow doesn\'t return to zero before the next breath because the rate is too fast for the patient\'s expiratory time. Slow the rate, lengthen Te, or disconnect briefly to let the chest fall.' },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**The mnemonic is DOPES.** Displacement, Obstruction, Pneumothorax, Equipment, Stacking. The very first physical action is to disconnect from the vent and bag. If the patient improves, it was the vent or the circuit. If he doesn\'t, it\'s a patient problem. Then read the waveform.' },
    { kind: 'callout', tone: 'info', markdown: 'The pressure pattern divides the differential. High PIP + high plat = lung. High PIP + normal plat = airway. Lost ETCO2 waveform = displacement (full) or massive obstruction. Shark-fin ETCO2 = partial obstruction.' },
    // v3.2 §0.7 — predict_mcq anchoring the first-move before the recognition
    // chain runs.
    {
      kind: 'predict_mcq',
      predict:
        'A vented patient suddenly decompensates. Before you read the waveform, the single most useful action is:',
      options: [
        { label: 'Increase FiO2 to 1.0.', is_correct: false, explanation: 'Reflex, not diagnostic. Helps with one type of problem and obscures the rest.' },
        { label: 'Push more sedation.', is_correct: false, explanation: 'Buries the diagnostic information you need.' },
        { label: 'Disconnect from the vent and bag.', is_correct: true },
        { label: 'Get a stat chest X-ray.', is_correct: false, explanation: 'Useful eventually, not first. The X-ray takes minutes; the bag tells you in seconds whether the problem is the vent or the patient.' },
      ],
      observe:
        'Disconnecting separates vent problems from patient problems in seconds. If the patient improves on the bag, the problem is in the circuit or the vent settings. If he doesn\'t, you have a patient problem and now you read the waveform to localize it.',
    },
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
    // Novice-pass §19.3 — flag the structural midpoint so a learner who
    // hits five-in-a-row knows it's expected to be fatiguing. The
    // formal interlude card requires shell work scheduled separately.
    {
      kind: 'callout',
      tone: 'tip',
      markdown:
        "**On the try-it: five scenarios in a row.** That's tiring on purpose — the real bedside is busy. After scenario 3, take a breath; the next two build on the same pattern.",
    },
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
    // v3.2 §9.9 — bedside rapid-response with live sim perturbations.
    patient_context: "This is the bedside rapid-response module. You'll be called to five decompensations in a row — the sim will perturb itself between scenarios. The sim is currently showing a normal, stable patient as your baseline.",
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'Baseline pressures', description: 'PIP ~28, plat ~22 — small gap.' },
      { name: 'Vte ≈ delivered', description: 'circuit intact, no leak.' },
      { name: 'ETCO2, SBP', description: 'wired so disconnect (ETCO2 → 0) and pneumothorax (SBP drop) are visible signatures.' },
    ],
    suggestions: [
      'Memorize what normal looks like — every scenario diverges from this baseline.',
      'Mentally rehearse the five DOPES rows. Each has a distinct signature.',
      'The patterns are diagnostic, not subtle. If two signals point at the same row, that\'s usually your answer.',
    ],
  },
  // v3.2 §9.10 — explicit live-perturbation framing.
  user_facing_task: 'Five decompensations in a row. The sim perturbs itself between scenarios — read the readouts and the waveforms each time, then pick the pattern from the same five options. Get all five right to complete the module.',
  // success_criteria_display omitted — shell auto-derives from the five
  // recognition prompts so each scenario ticks off in order as it's solved.
  task_framing_style: 'C',

  key_points: [
    'DOPES — Displacement, Obstruction, Pneumothorax, Equipment, Stacking.',
    'Bag off the vent first. Distinguishes vent problem from patient problem.',
    'High PIP + high plat = lung. High PIP + normal plat = airway.',
    'Lost ETCO2 = displacement or full obstruction. Shark-fin ETCO2 = partial.',
    'The first action — not the whole workup — is what saves the patient.',
  ],
};
