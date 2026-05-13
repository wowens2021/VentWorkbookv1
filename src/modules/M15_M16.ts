import type { ModuleConfig } from '../shell/types';

// MODULE_SPECS_v3 §M15 — ARDS-Specific Ventilation.
//
// Pin list (do not change without recalibrating the recipe math):
//   compliance: 32 (moderate-severe ARDS)
//   heightInches: 70, gender: M → PBW ≈ 73 kg → 6 mL/kg ≈ 438 mL
//   At Vt 600, DP = 600/32 = 18.75 (above the Amato threshold)
//   At Vt 430, PEEP 10, compliance 32: plat = 23.4, DP = 13.4. In target.
//
// Adaptation: the spec's outcome includes Vt 410–470 (range), PEEP 8–14
// (range), and SpO2 88–96 (range). The sim's outcome tracker only takes
// one condition per readout, so each range is simplified to its
// load-bearing bound (vte ≤470 ceiling, peep ≥8 floor, spo2 ≥88 floor,
// fio2 ≤70 ceiling). The lower Vt bound and upper PEEP bound aren't
// enforced — the physics doesn't naturally drive the learner there.
export const M15: ModuleConfig = {
  id: 'M15',
  number: 15,
  title: 'ARDS-Specific Ventilation',
  track: 'Strategy',
  estimated_minutes: 25,
  briefing: {
    tagline: 'The recipe asks for numbers that look wrong. The recipe is right.',
    overview: "ARDSnet is the most studied recipe in critical care. The components are simple and have not changed since 2000: VCV with 6 mL/kg predicted body weight, plateau ≤30, PEEP/FiO2 by the table, SpO2 88–94, permissive hypercapnia. The hard part is that the recipe insists on numbers that feel wrong — tidal volumes that look small, SpO2 that look low, PaCO2 that look high. The recipe is right. ARMA 2000 showed a 9% absolute mortality reduction — one of the largest effects in ICU medicine. Amato 2015 added that driving pressure ≤15 is independently linked to survival.",
    what_youll_do: [
      'Vt 6 mL/kg PBW — predicted body weight from height, not actual weight. The lung doesn\'t grow with obesity.',
      'Plateau ≤30, driving pressure ≤15. Both, every breath.',
      'PEEP per the ARDSnet table. SpO2 88–94 is the target.',
      'Permissive hypercapnia: pH ≥7.15–7.20 is acceptable. The exception is elevated ICP.',
    ],
  },
  visible_learning_objectives: [
    'Apply the ARDSnet recipe from scratch: VCV, 6 mL/kg PBW, rate 14–18, PEEP per table, plat ≤30, DP ≤15.',
    'Titrate Vt down further if plateau exceeds 30; floor at 4 mL/kg PBW.',
    'Identify when to escalate to prone, paralytics, or rescue.',
    'State the ARMA mortality reduction and the Amato driving-pressure threshold.',
  ],

  primer_questions: [
    {
      id: 'M15-P1',
      prompt: 'The ARMA trial (NEJM 2000) compared 6 mL/kg PBW vs 12 mL/kg PBW in ARDS. The result was:',
      options: [
        { label: 'No difference in mortality', is_correct: false, explanation: 'There was a difference, and it was large.' },
        { label: 'A 9% absolute mortality reduction with low Vt', is_correct: true, explanation: 'One of the largest effects in all of ICU medicine. Book Ch. 8.' },
        { label: 'Lower Vt caused more pneumothorax', is_correct: false, explanation: 'The opposite of what you\'d expect — and what was found.' },
        { label: 'Lower Vt required more sedation but had no mortality effect', is_correct: false, explanation: 'The mortality effect was the headline.' },
      ],
    },
    {
      id: 'M15-P2',
      prompt: 'A 70-inch male in ARDS — his PBW is ~73 kg. The starting Vt is:',
      options: [
        { label: '350 mL', is_correct: false, explanation: 'That\'s 4.8 mL/kg — defensible only if plat is high.' },
        { label: '430–440 mL', is_correct: true, explanation: '6 mL/kg of PBW. Book Ch. 8.' },
        { label: '600 mL', is_correct: false, explanation: 'That\'s 8.2 mL/kg — pre-ARMA dosing.' },
        { label: '800 mL', is_correct: false, explanation: 'Reflects an older era of ventilation that increased mortality.' },
      ],
    },
    {
      id: 'M15-P3',
      prompt: 'The Amato 2015 driving pressure analysis showed that:',
      options: [
        { label: 'Plateau pressure was more important than driving pressure', is_correct: false, explanation: 'The opposite — DP outperformed plat in their model.' },
        { label: 'Driving pressure ≤15 was independently linked to survival, even at low Vt and plateau', is_correct: true, explanation: 'A separate signal of lung-protection quality. Book Ch. 8.' },
        { label: 'Driving pressure was unrelated to outcome', is_correct: false, explanation: 'Strongly related — across multiple ARDS trial datasets.' },
        { label: 'Higher driving pressure improved oxygenation', is_correct: false, explanation: 'Higher DP worsened outcomes.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'ards_v3_master',
    preset: {
      mode: 'VCV',
      // ─────────────────────────────────────────────────────────────────────
      // ⚠️  DO NOT CHANGE compliance (32), heightInches (70), or gender (M).
      // Per MODULE_SPECS_v3 §M15: PBW ≈ 73 kg, 6 mL/kg ≈ 438 mL.
      //   Vt 430, PEEP 10, compliance 32 → plat = 23.4, DP = 13.4 → passes.
      //   Vt 600 (start) → DP = 18.75 → fails the Amato threshold.
      // Other fields are free to change for other reasons; this trio is
      // load-bearing for the recipe math.
      // ─────────────────────────────────────────────────────────────────────
      settings: { tidalVolume: 600, respiratoryRate: 12, peep: 5, fiO2: 80, iTime: 1.0 },
      patient: { compliance: 32, resistance: 12, spontaneousRate: 0, heightInches: 70, gender: 'M' },
    },
    unlocked_controls: ['tidalVolume', 'respiratoryRate', 'peep', 'fiO2'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'vte', 'mve', 'spo2', 'pao2', 'fio2', 'peep'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  hidden_objective: {
    kind: 'outcome',
    readouts: {
      vte: { operator: '<=', value: 470 },
      plat: { operator: '<=', value: 30 },
      drivingPressure: { operator: '<=', value: 15 },
      peep: { operator: '>=', value: 8 },
      fio2: { operator: '<=', value: 70 },
      spo2: { operator: '>=', value: 88 },
    },
    sustain_breaths: 5,
  },

  content_blocks: [
    { kind: 'prose', markdown: '**ARDSnet is the most studied recipe in critical care.** VCV with 6 mL/kg PBW, plat ≤30, PEEP/FiO2 by the table, SpO2 88–94, permissive hypercapnia. The components have not changed since 2000.' },
    { kind: 'callout', tone: 'info', markdown: 'PBW is calculated from height and gender, not actual weight. A 70-inch man has a PBW of ~73 kg regardless of whether he weighs 60 kg or 130 kg. The lung doesn\'t grow with obesity.' },
    {
      kind: 'figure',
      caption: 'The recipe at a glance — and what the math wants for this patient.',
      ascii:
        'PBW (M, 70 in) ≈ 73 kg\n' +
        '6 mL/kg PBW    ≈ 438 mL\n' +
        'Compliance     = 32 mL/cmH2O\n' +
        '\n' +
        'At Vt 600 (start):  DP = 600/32 = 18.75  ← over Amato 15\n' +
        'At Vt 430, PEEP 10: plat = 23.4, DP = 13.4 ← in target\n' +
        '\n' +
        'ARDSnet table for FiO2 0.70: PEEP 10–14',
    },
    {
      kind: 'predict_observe',
      predict: 'You\'re going to drop Vt from 600 to 430. What happens to plateau and driving pressure?',
      observe: 'Plateau falls. Driving pressure falls. PaCO2 rises — that\'s expected. The recipe asks for it. Compensate with rate if MV gets too low; otherwise hold and let the patient autoregulate.',
      awaits_control: 'tidalVolume',
    },
    {
      kind: 'predict_observe',
      predict: 'Now raise PEEP from 5 to 10. What happens to PaO2?',
      observe: 'PaO2 climbs as the under-recruited alveoli come back online. Once PaO2 has a buffer, you can drop FiO2 toward 0.50–0.60.',
      awaits_control: 'peep',
    },
    { kind: 'callout', tone: 'warn', markdown: 'Permissive hypercapnia: pH ≥7.15–7.20 is acceptable. The exception is elevated ICP — hypercapnia causes cerebral vasodilation.' },
  ],

  hint_ladder: {
    tier1: 'Vt is at 8 mL/kg. PEEP doesn\'t match the FiO2. The ARDSnet table is in the read panel.',
    tier2: 'For this patient, 6 mL/kg ≈ 430. For FiO2 0.70, PEEP 10–14 from the lower table.',
    tier3: { hint_text: 'Set Vt 430, PEEP 10, FiO2 60.', demonstration: { control: 'tidalVolume', target_value: 430 } },
  },

  summative_quiz: [
    {
      id: 'M15-Q1',
      prompt: 'The single most important intervention shown to reduce mortality in ARDS is:',
      options: [
        { label: 'Lower tidal volume (6 mL/kg PBW)', is_correct: true },
        { label: 'Higher PEEP', is_correct: false },
        { label: 'Prone positioning', is_correct: false },
        { label: 'Neuromuscular blockade', is_correct: false },
      ],
      explanation: 'ARMA 2000 — 9% absolute mortality reduction. Prone (PROSEVA) is important but second. Book Ch. 8.',
    },
    {
      id: 'M15-Q2',
      prompt: 'A male, 5\'10", in ARDS. Compliance 25, on Vt 500 mL, PEEP 8. The plateau pressure is 28 and the driving pressure is 20. The next move is:',
      options: [
        { label: 'Increase PEEP', is_correct: false },
        { label: 'Lower Vt to ~400', is_correct: true },
        { label: 'Sedate more', is_correct: false },
        { label: 'Switch to PCV', is_correct: false },
      ],
      explanation: 'DP is over 15. Plateau is okay but DP is the better signal. Raising PEEP raises plat. Book Ch. 8.',
    },
    {
      id: 'M15-Q3',
      prompt: 'Permissive hypercapnia is contraindicated in:',
      options: [
        { label: 'ARDS', is_correct: false },
        { label: 'Elevated intracranial pressure', is_correct: true },
        { label: 'Septic shock', is_correct: false },
        { label: 'Asthma exacerbation', is_correct: false },
      ],
      explanation: 'Hypercapnia → cerebral vasodilation → worsens ICP. Book Ch. 6.',
    },
    {
      id: 'M15-Q4',
      prompt: 'Prone positioning in ARDS is indicated when:',
      options: [
        { label: 'P/F <300', is_correct: false },
        { label: 'P/F <150', is_correct: true },
        { label: 'Plat >30', is_correct: false },
        { label: 'Auto-PEEP is present', is_correct: false },
      ],
      explanation: 'PROSEVA trial criterion. 16–18 hours per day. Book Ch. 25.',
    },
    {
      id: 'M15-Q5',
      prompt: 'Owens\'s pragmatic crisis protocol uses an initial Vt of:',
      options: [
        { label: '4 mL/kg', is_correct: false },
        { label: '6 mL/kg', is_correct: true },
        { label: '8 mL/kg', is_correct: false },
        { label: '12 mL/kg', is_correct: false },
      ],
      explanation: 'The same number as the elective protocol. The simplicity is the point. Book Ch. 25.',
    },
  ],

  explore_card: {
    patient_context: 'Moderate-severe ARDS, day 2. PBW 73 kg. Currently on Vt 600 (8.2 mL/kg — too high), PEEP 5 (too low for FiO2 0.80), FiO2 0.80 (above the 0.60 ceiling for sustained exposure).',
    unlocked_controls_description: [
      { name: 'Tidal volume', description: 'range 200–800. Target 6 mL/kg PBW ≈ 430.' },
      { name: 'Respiratory rate', description: 'range 4–40. Raise as Vt drops to preserve MV.' },
      { name: 'PEEP', description: 'range 0–24. Climb the table for the current FiO2.' },
      { name: 'FiO2', description: 'range 21–100%. Drop toward 60% once PaO2 has a buffer.' },
    ],
    readouts_description: [
      { name: 'Vte', description: 'delivered tidal volume. Watch it fall as you adjust set Vt.' },
      { name: 'Plateau, driving pressure', description: 'the two lung-protection targets.' },
      { name: 'PaO2, SpO2, FiO2, PEEP', description: 'the oxygenation quartet.' },
    ],
    suggestions: [
      'Vt 800 (pre-ARMA dosing): plat climbs into the 30s, DP over 20. Bad.',
      'Vt 430, PEEP 5: lung-protective Vt but PaO2 only ~65 — under-recruited.',
      'Vt 430, PEEP 12, FiO2 60: the recipe lands. Hold.',
      'Drop Vt to 300 (4.1 mL/kg) for very stiff lungs: PaCO2 rises into the 60s, pH falls to 7.20s. Permissive hypercapnia.',
    ],
  },
  user_facing_task: 'Apply the ARDSnet recipe. Your patient is in moderate-severe ARDS — compliance 32, currently on Vt 600 (too high), PEEP 5 (too low for FiO2 0.80). Set lung-protective Vt at 6 mL/kg PBW, PEEP per the table, FiO2 down to 0.70 or less. Aim for plat ≤30, driving pressure ≤15, SpO2 ≥88. Hold for 5 breaths.',
  success_criteria_display: [
    'Delivered Vt ≤470 mL (~6 mL/kg PBW).',
    'Plateau pressure ≤30 cmH2O.',
    'Driving pressure ≤15 cmH2O.',
    'PEEP ≥8 (FiO2 0.70 row of the table).',
    'FiO2 ≤70%.',
    'SpO2 ≥88%.',
    'Sustained for 5 breaths.',
  ],
  task_framing_style: 'B',

  key_points: [
    'The ARDSnet recipe: VCV, 6 mL/kg PBW, plat ≤30, DP ≤15, PEEP per table, SpO2 88–94, permissive hypercapnia.',
    'ARMA 2000 = 9% absolute mortality reduction. Large and real.',
    'Amato 2015: DP ≤15 independently predicts survival.',
    'Prone at P/F <150.',
    'The recipe asks for numbers that look wrong. The recipe is right.',
  ],
};

// MODULE_SPECS_v3 §M16 — Obstructive Disease Ventilation.
//
// Pin list (do not change without recalibrating the auto-PEEP physics):
//   resistance: 35 (severe bronchospasm)
//   compliance: 60 (preserved)
//   Starting rate 22 with iTime 1.0 traps significant gas.
//   Rate 12, iTime 1.0 (Te ~4 sec) resolves trapping.
//
// Adaptation: spec's compound includes mode=VCV, tidalVolume 530–620, RR 10–14,
// PEEP ≤3, autoPEEP ≤2. Mode and the two control ranges are tested as
// manipulation children; PEEP and autoPEEP land in the sustained outcome
// child. tidalVolume range tested via the control (manipulation) rather than
// the delivered vte readout, since in PCV the delivered volume varies with
// mechanics and the spec intent is "set Vt to 7–8 mL/kg".
export const M16: ModuleConfig = {
  id: 'M16',
  number: 16,
  title: 'Obstructive Disease Ventilation',
  track: 'Strategy',
  estimated_minutes: 22,
  briefing: {
    tagline: 'Lungs aren\'t stiff. Airways are narrow. Give him time to exhale.',
    overview: "Obstructive disease flips the ventilation problem upside down. The lungs aren't stiff; the airways are narrow. The patient can get air in. He can't get it out. Tidal volume isn't the danger. Trapping is. Trapped gas compresses venous return, drops blood pressure, and in severe cases causes pneumothorax. Every ventilator decision here is built around giving exhalation more time. Lower rates. Shorter inspiratory times. ZEEP for asthma (modest PEEP for COPD). The CO2 will rise. Let it.",
    what_youll_do: [
      'The obstructive recipe: VCV, 7–8 mL/kg PBW, rate 10–14, I:E 1:3 to 1:5, ZEEP for asthma.',
      'Lowering the rate is the strongest lever for auto-PEEP. Shortening I-time is second.',
      'PCV silently underventilates as resistance rises. VCV is the mode of choice in severe bronchospasm.',
      'Permissive hypercapnia: pH ≥7.10 is acceptable. PaCO2 routinely climbs to 60–80.',
    ],
  },
  visible_learning_objectives: [
    'Apply the obstructive recipe: VCV, Vt 7–8 mL/kg PBW, rate 10–14, I:E 1:3 to 1:5, ZEEP for asthma.',
    'Recognize the auto-PEEP signature on the flow waveform.',
    'Set rate and I-time to relieve auto-PEEP without causing significant hemodynamic compromise.',
    'Distinguish asthma (PEEP harmful) from COPD (PEEP can splint).',
  ],

  primer_questions: [
    {
      id: 'M16-P1',
      prompt: 'The strongest single lever for relieving auto-PEEP is:',
      options: [
        { label: 'Higher PEEP', is_correct: false, explanation: 'In asthma PEEP worsens trapping. In COPD it can help marginally, but the rate lever is bigger.' },
        { label: 'Lower respiratory rate', is_correct: true, explanation: 'Longer expiratory time. The dominant variable. Book Ch. 15.' },
        { label: 'Higher Vt', is_correct: false, explanation: 'Larger breath, more gas to exhale, worse trapping.' },
        { label: 'Higher FiO2', is_correct: false, explanation: 'FiO2 doesn\'t alter time constants.' },
      ],
    },
    {
      id: 'M16-P2',
      prompt: 'In severe asthma with rising airway resistance, the mode of choice is:',
      options: [
        { label: 'PCV — decelerating flow is more comfortable', is_correct: false, explanation: 'PCV silently drops Vt as resistance rises. Dangerous in bronchospasm.' },
        { label: 'PRVC — adaptive', is_correct: false, explanation: 'Same problem — when resistance climbs, the adaptive logic pushes pressure up, which doesn\'t help with trapping.' },
        { label: 'VCV — guaranteed Vt despite resistance change', is_correct: true, explanation: 'You see the resistance problem (rising PIP, stable plat) and act on it. Book Ch. 15.' },
        { label: 'PSV — patient comfort', is_correct: false, explanation: 'Spontaneous mode in a patient who needs deep sedation.' },
      ],
    },
    {
      id: 'M16-P3',
      prompt: 'Applied PEEP in severe asthma:',
      options: [
        { label: 'Helps splint airways — analogous to COPD', is_correct: false, explanation: 'The pathology is different — asthmatic airways are inflamed, not floppy.' },
        { label: 'Makes hyperinflation worse', is_correct: true, explanation: 'Adds to total PEEP without splinting anything. Book Ch. 1, Ch. 15.' },
        { label: 'Has no effect', is_correct: false, explanation: 'It has a clear effect — and it\'s the wrong direction.' },
        { label: 'Improves V/Q matching', is_correct: false, explanation: 'Not the relevant mechanism here.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'asthma_trapped_pcv',
    preset: {
      mode: 'PCV',
      // ─────────────────────────────────────────────────────────────────────
      // ⚠️  DO NOT CHANGE resistance (35), compliance (60), respiratoryRate
      // (22), peep (8), or iTime (1.0). Per MODULE_SPECS_v3 §M16: these
      // values together produce measured auto-PEEP > 6 at the start so the
      // learner sees a clear problem. Lowering rate to 10–14 with iTime
      // 1.0 drops autoPEEP toward 2. Resistance 35 is the asthma pin —
      // if it changes, the auto-PEEP math no longer matches the spec.
      // ─────────────────────────────────────────────────────────────────────
      settings: { pInsp: 22, respiratoryRate: 22, peep: 8, fiO2: 50, iTime: 1.0 },
      patient: { compliance: 60, resistance: 35, spontaneousRate: 0, heightInches: 70, gender: 'M' },
    },
    unlocked_controls: ['mode', 'tidalVolume', 'pInsp', 'respiratoryRate', 'peep', 'fiO2', 'iTime'],
    visible_readouts: ['pip', 'plat', 'autoPeep', 'totalPeep', 'mve', 'vte'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'any_order',
    children: [
      {
        kind: 'manipulation',
        control: 'mode',
        condition: { type: 'equals', value: 'VCV' },
      },
      {
        kind: 'manipulation',
        control: 'tidalVolume',
        condition: { type: 'range', min: 530, max: 620 },
      },
      {
        kind: 'manipulation',
        control: 'respiratoryRate',
        condition: { type: 'range', min: 10, max: 14 },
      },
      {
        kind: 'outcome',
        readouts: {
          peep: { operator: '<=', value: 3 },
          autoPeep: { operator: '<=', value: 2 },
        },
        sustain_breaths: 5,
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Obstructive disease — asthma and COPD — flips the ventilation problem upside down.** The lungs aren\'t stiff; the airways are narrow. The patient can get air in. He can\'t get it out. Tidal volume isn\'t the danger. Trapping is. Trapped gas compresses venous return, drops blood pressure, and in severe cases causes pneumothorax.' },
    { kind: 'callout', tone: 'info', markdown: 'The obstructive recipe: VCV, 7–8 mL/kg PBW, rate 10–14, I:E 1:3 to 1:5, constant flow, ZEEP for asthma / modest PEEP for COPD.' },
    {
      kind: 'figure',
      caption: 'Same patient, two settings. The flow waveform is the diagnostic.',
      ascii:
        'Rate 22, PEEP 8:                          Rate 12, ZEEP:\n' +
        '              ___                                       ___\n' +
        '  flow ─╲    ╱   ╲    ╱             flow ─╲          ╱\n' +
        '        ╲  ╱     ╲  ╱                     ╲         ╱\n' +
        '         ╲╱       ╲╱                       ╲_______╱\n' +
        '   ↑ never returns to zero            ↑ returns to zero\n' +
        '   autoPEEP 8                         autoPEEP 2',
    },
    {
      kind: 'predict_observe',
      predict: 'Lower rate from 22 to 12 in a trapped patient. What happens to auto-PEEP?',
      observe: 'Auto-PEEP falls from 8 to ~2. The expiratory time doubled and the lungs finally emptied between breaths. The CO2 will rise. That\'s the price.',
      awaits_control: 'respiratoryRate',
    },
    {
      kind: 'predict_observe',
      predict: 'Drop PEEP from 8 to 0 in this asthmatic. What happens to total PEEP and BP?',
      observe: 'Total PEEP falls toward auto-PEEP only. BP stabilizes — the extra externally applied PEEP was adding insult.',
      awaits_control: 'peep',
    },
    { kind: 'callout', tone: 'warn', markdown: 'Permissive hypercapnia in asthma: pH ≥7.10 is acceptable. The PaCO2 will rise (often to 60–80). That\'s the price of letting the patient exhale. If BP crashes on a trapped patient, disconnect from the vent for 10–15 seconds — let the chest fall.' },
  ],

  hint_ladder: {
    tier1: 'Two things are wrong here: the mode and the rate.',
    tier2: 'VCV, rate 12, Vt 7–8 mL/kg, PEEP 0. The pH will be low. That\'s permitted.',
    tier3: { hint_text: 'Switch to VCV.', demonstration: { control: 'mode', target_value: 0 } },
  },

  summative_quiz: [
    {
      id: 'M16-Q1',
      prompt: 'In a ventilated asthmatic, permissive hypercapnia is acceptable down to a pH of:',
      options: [
        { label: '7.35', is_correct: false },
        { label: '7.20', is_correct: false },
        { label: '7.10–7.15', is_correct: true },
        { label: '6.90', is_correct: false },
      ],
      explanation: 'Book Ch. 6, Ch. 15. Lower than ARDS permissive (7.15–7.20) because the alternative is barotrauma and PEA arrest.',
    },
    {
      id: 'M16-Q2',
      prompt: 'The obstructive Vt target is typically:',
      options: [
        { label: '4 mL/kg', is_correct: false },
        { label: '6 mL/kg', is_correct: false },
        { label: '7–8 mL/kg', is_correct: true },
        { label: '12 mL/kg', is_correct: false },
      ],
      explanation: 'Higher than ARDS because the lungs aren\'t the problem — the airways are. Book Ch. 1, Ch. 15.',
    },
    {
      id: 'M16-Q3',
      prompt: 'An asthmatic on VCV has a rising PIP but a stable plateau pressure. The most likely cause is:',
      options: [
        { label: 'Worsening ARDS', is_correct: false },
        { label: 'Worsening bronchospasm or mucus plugging', is_correct: true },
        { label: 'Auto-PEEP', is_correct: false },
        { label: 'Pneumothorax', is_correct: false },
      ],
      explanation: 'PIP rises with resistance; plat with compliance. The gap is the resistance signal. Book Ch. 2.',
    },
    {
      id: 'M16-Q4',
      prompt: 'In severe COPD with measured auto-PEEP of 10, applied PEEP can be set at:',
      options: [
        { label: '0 (ZEEP), as in asthma', is_correct: false },
        { label: '~7–8 cmH2O (75–85% of auto-PEEP)', is_correct: true },
        { label: '15 cmH2O (above auto-PEEP)', is_correct: false },
        { label: '25 cmH2O', is_correct: false },
      ],
      explanation: 'The waterfall analogy — splints open small airways without adding to trapping. Above auto-PEEP, you trap more. Book Ch. 15.',
    },
    {
      id: 'M16-Q5',
      prompt: 'A hypotensive, ventilated severe-asthma patient with measured auto-PEEP of 16. The first move is:',
      options: [
        { label: 'Norepinephrine', is_correct: false },
        { label: 'Disconnect from vent for 10–15 seconds to let him exhale', is_correct: true },
        { label: 'Raise PEEP', is_correct: false },
        { label: 'Lower FiO2', is_correct: false },
      ],
      explanation: 'Trapping is compressing venous return. Letting the chest fall is the immediate fix. Book Ch. 15.',
    },
  ],

  explore_card: {
    patient_context: '28-year-old in status asthmaticus, intubated 2 hours ago. Previous clinician put him on PCV with PEEP 8 and rate 22. He\'s air-trapping. The fix is mode + rate + PEEP — and accepting the CO2 that follows.',
    unlocked_controls_description: [
      { name: 'Mode', description: 'currently PCV — wrong for severe bronchospasm. VCV is the mode of choice.' },
      { name: 'Respiratory rate', description: 'currently 22 — way too fast for time-constant ~2 sec. Target 10–14.' },
      { name: 'PEEP', description: 'currently 8 — drop to ZEEP for asthma.' },
      { name: 'Tidal volume / PINSP', description: 'set 7–8 mL/kg PBW.' },
      { name: 'I-time', description: 'shorter Ti gives more expiratory time.' },
    ],
    readouts_description: [
      { name: 'Flow waveform expiratory limb', description: 'does it reach zero before the next breath? That\'s the bedside auto-PEEP test.' },
      { name: 'Auto-PEEP', description: 'measured from an expiratory pause. Currently elevated.' },
      { name: 'Total PEEP', description: 'set PEEP + auto-PEEP.' },
    ],
    suggestions: [
      'Rate 22, PEEP 8: auto-PEEP 8. Trouble.',
      'Rate 12, PEEP 0: auto-PEEP 2. Resolved.',
      'Rate 12, PEEP 8: auto-PEEP rises again — applied PEEP added insult.',
      'Stay on PCV at PINSP 22, rate 12: Vt collapses as resistance climbs. Dangerous.',
    ],
  },
  user_facing_task: 'Rescue the trapped asthmatic. Your patient is in status asthmaticus and was placed on PCV with PEEP 8 and rate 22. He\'s air-trapping. Switch to VCV, set Vt 7–8 mL/kg PBW, drop rate to 10–14, drop PEEP to ZEEP. Hold the new state for 5 breaths.',
  success_criteria_display: [
    'Mode switched to VCV.',
    'Tidal volume set 530–620 mL (7–8 mL/kg PBW).',
    'Respiratory rate set 10–14.',
    'PEEP ≤3.',
    'Auto-PEEP ≤2, sustained 5 breaths.',
  ],
  task_framing_style: 'B',

  key_points: [
    'Obstructive recipe ≠ ARDS recipe. Vt is higher (7–8 mL/kg), rate is lower, PEEP is ZEEP or modest.',
    'Lowering rate is the strongest lever for auto-PEEP.',
    'VCV is the mode of choice. PCV silently underventilates as resistance rises.',
    'Asthma: PEEP harmful. COPD: PEEP at 75–85% of auto-PEEP can splint.',
    'Hypotensive trapped patient → disconnect first, then sort out the vent.',
  ],
};
