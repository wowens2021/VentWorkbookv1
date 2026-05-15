import type { ModuleConfig } from '../shell/types';

/**
 * MODULE M13 — PEEP
 *
 * Track: Strategy · Archetype: outcome (Style B with secondary risk display) · 22 min
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 32, resistance: 11
 *   - PEEP-PaO2-BP response curve (calibrated):
 *       PEEP 5  → PaO2 58, BP baseline
 *       PEEP 10 → PaO2 75
 *       PEEP 14 → PaO2 88
 *       PEEP 18 → PaO2 92, SBP drops 15 mmHg
 *       PEEP 22 → PaO2 84 (overdistension), SBP drops 30 mmHg
 *
 * [BLOCKED-SIM] The spec adds an SBP guardrail to the tracker (SBP ≥95)
 * to teach "don't overshoot PEEP into hypotension." The sim doesn't
 * currently expose SBP as a readout. The hemodynamic ceiling is taught
 * in the explore-card prose and summative until the sim is extended.
 *
 * Specced against docs/MODULE_SPECS_v3.md §M13 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §10. See MODULE_SPECS_v3.md Appendix A.
 */
export const M13: ModuleConfig = {
  id: 'M13',
  number: 13,
  title: 'PEEP',
  track: 'Strategy',
  estimated_minutes: 22,
  briefing: {
    tagline: 'Open the lungs and keep them open. Then read the table.',
    overview: "PEEP is the splint that keeps alveoli open at end-expiration. The lung has a functional residual capacity — a reservoir of air that maintains gas exchange when you aren't actively breathing. ARDS and pulmonary edema collapse that reservoir. PEEP rebuilds it. Three jobs: recruit, splint, and (in heart failure) reduce LV afterload. The complications of too much PEEP are hypotension and dead space. VILI is volutrauma-driven, not PEEP-driven — PEEP is not the villain.",
    what_youll_do: [
      'Set initial PEEP by CXR — clear 5, scattered 10, diffuse 15, whiteout 20.',
      'Titrate PEEP/FiO2 along the ARDSnet Lower table.',
      'Recognize PEEP-induced overdistension: rising dead space, falling PaO2.',
      'PEEP-induced hypotension below 10–12 in a "stable" patient usually means hypovolemia first.',
    ],
  },
  visible_learning_objectives: [
    'State three goals of PEEP: alveolar recruitment, FRC maintenance, LV afterload reduction.',
    'Set initial PEEP by chest X-ray pattern.',
    'Use the ARDSnet Lower PEEP table to titrate PEEP/FiO2.',
    'Recognize PEEP-induced overdistension and PEEP-induced hypotension.',
  ],

  primer_questions: [
    {
      id: 'M13-P1',
      prompt: 'Three physiologic effects of PEEP include:',
      options: [
        { label: 'Alveolar recruitment, FRC maintenance, and left ventricular afterload reduction', is_correct: true, explanation: 'The three intended benefits. Book Ch. 12.' },
        { label: 'Alveolar recruitment, increased venous return, and improved cardiac output', is_correct: false, explanation: 'PEEP reduces venous return — not increases it.' },
        { label: 'Lung deflation, bronchodilation, and reduced shunt', is_correct: false, explanation: 'PEEP inflates, not deflates; doesn\'t bronchodilate.' },
        { label: 'Increased PaCO2, decreased PaO2, and decreased work of breathing', is_correct: false, explanation: 'PEEP improves PaO2 in shunt physiology, not decreases it.' },
      ],
    },
    {
      id: 'M13-P2',
      prompt: 'On the ARDSnet Lower PEEP/FiO2 table, FiO2 0.70 corresponds to PEEP:',
      options: [
        { label: '5', is_correct: false, explanation: 'That\'s FiO2 0.30–0.40.' },
        { label: '10–12', is_correct: true, explanation: 'The table lists 70% → 10, 12, or 14 depending on response. Book Ch. 12.' },
        { label: '18–20', is_correct: false, explanation: 'That\'s FiO2 0.90–1.0.' },
        { label: 'There\'s no specific mapping — use clinical judgment alone', is_correct: false, explanation: 'The table exists and is the starting point.' },
      ],
    },
    {
      id: 'M13-P3',
      prompt: 'The major complication of excessive PEEP is:',
      options: [
        { label: 'Volutrauma', is_correct: false, explanation: 'Volutrauma is a tidal volume issue, not a PEEP issue.' },
        { label: 'Alveolar overdistension causing hypotension and/or increased dead space', is_correct: true, explanation: 'Above the recruitment ceiling, PEEP overinflates healthy alveoli. Book Ch. 12.' },
        { label: 'Bronchospasm', is_correct: false, explanation: 'Not a PEEP effect.' },
        { label: 'Pulmonary embolism', is_correct: false, explanation: 'Not a PEEP effect.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'ards_under_recruited',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 430, respiratoryRate: 18, peep: 5, fiO2: 70, iTime: 1.0 },
      patient: { compliance: 32, resistance: 11, spontaneousRate: 0, heightInches: 70, gender: 'M' },
    },
    unlocked_controls: ['peep', 'fiO2'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'spo2', 'pao2', 'fio2', 'peep'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'outcome',
    readouts: {
      peep: { operator: '>=', value: 10 },
      pao2: { operator: '>=', value: 65 },
    },
    sustain_breaths: 5,
  },

  content_blocks: [
    { kind: 'prose', markdown: '**PEEP is the splint.** The lung has a functional residual capacity — a reservoir of air that maintains gas exchange even when you\'re not actively breathing. ARDS and pulmonary edema collapse that reservoir. PEEP rebuilds it. Three jobs: recruit collapsed alveoli, hold FRC against the next breath\'s exhalation, and (in failing LV) reduce afterload by lifting pleural pressure.' },
    { kind: 'callout', tone: 'info', markdown: 'Initial PEEP by CXR: clear → 5; scattered infiltrates → 10; diffuse dense → 15; whiteout → 20.' },
    {
      kind: 'figure',
      caption: 'ARDSnet Lower PEEP/FiO2 table — the standard starting ladder.',
      ascii:
        ' FiO2 |  PEEP\n' +
        ' 0.30 |   5\n' +
        ' 0.40 |   5–8\n' +
        ' 0.50 |   8–10\n' +
        ' 0.60 |  10\n' +
        ' 0.70 |  10–14   ← you are here\n' +
        ' 0.80 |  14\n' +
        ' 0.90 |  14–18\n' +
        ' 1.00 |  18–24',
    },
    {
      kind: 'predict_observe',
      predict: 'You\'re going to raise PEEP from 5 to 12 at FiO2 0.70. What happens to PaO2?',
      observe: 'PaO2 climbs as alveoli recruit and shunt fraction falls. The lung was under-recruited at PEEP 5 — the LIP on its compliance curve hadn\'t been crossed yet.',
      awaits_control: 'peep',
    },
    { kind: 'callout', tone: 'warn', markdown: 'PEEP-induced hypotension is real but rare below 10–12. If BP drops at PEEP 8 in a previously stable patient, suspect hypovolemia — fluid bolus first.' },
    { kind: 'prose', markdown: '**Owens\'s "good enough PEEP" by ARDS severity.** Mild ARDS (P/F 201–300): 5–10. Moderate (101–200): 10–15. Severe (≤100): 15–20. The ARDSnet table is more granular; this rule covers most of the work.' },
  ],

  hint_ladder: {
    tier1: 'At FiO2 0.70, the ARDSnet Lower PEEP table recommends 10–14. You\'re at 5.',
    tier2: 'Raise PEEP one step at a time — 5 to 8 to 10 to 12. Pause at each level. Watch PaO2 climb.',
    tier3: { hint_text: 'Bring PEEP to 12.', demonstration: { control: 'peep', target_value: 12 } },
  },

  summative_quiz: [
    {
      id: 'M13-Q1',
      prompt: 'Owens\'s "good enough PEEP" for moderate ARDS (P/F 101–200) is:',
      options: [
        { label: '0–5', is_correct: false },
        { label: '5–10', is_correct: false },
        { label: '10–15', is_correct: true },
        { label: '15–20', is_correct: false },
      ],
      explanation: 'Mild 5–10, moderate 10–15, severe 15–20. Book Ch. 12.',
    },
    {
      id: 'M13-Q2',
      prompt: 'The ALVEOLI trial compared higher and lower PEEP tables and found:',
      options: [
        { label: 'Higher PEEP improved mortality', is_correct: false },
        { label: 'Lower PEEP improved mortality', is_correct: false },
        { label: 'No difference in mortality, as long as 4–6 mL/kg PBW was used', is_correct: true },
        { label: 'Higher PEEP improved oxygenation but caused more pneumothorax', is_correct: false },
      ],
      explanation: 'The table chosen matters less than keeping Vt protective. Book Ch. 12.',
    },
    {
      id: 'M13-Q3',
      prompt: 'PEEP-induced hypotension at PEEP 8 in a previously stable ARDS patient most likely indicates:',
      options: [
        { label: 'The patient is overdistending', is_correct: false },
        { label: 'The patient is hypovolemic', is_correct: true },
        { label: 'A pneumothorax', is_correct: false },
        { label: 'The PEEP is too low', is_correct: false },
      ],
      explanation: 'Below 10–12, PEEP doesn\'t routinely impair venous return in euvolemic patients. Fluid bolus first. Book Ch. 12.',
    },
    {
      id: 'M13-Q4',
      prompt: 'PEEP causes left ventricular afterload reduction via:',
      options: [
        { label: 'Reduced venous return', is_correct: false },
        { label: 'Increased intrathoracic pressure reducing the transmural pressure across the LV', is_correct: true },
        { label: 'Reduced systemic vascular resistance', is_correct: false },
        { label: 'Direct myocardial depression', is_correct: false },
      ],
      explanation: 'Afterload = LV systolic pressure minus pleural pressure. Raising pleural pressure reduces transmural load. Book Ch. 12.',
    },
    {
      id: 'M13-Q5',
      prompt: 'Volutrauma occurs when:',
      options: [
        { label: 'The tidal volume is excessive — even at modest plateau pressure', is_correct: true },
        { label: 'The plateau pressure is high regardless of Vt', is_correct: false },
        { label: 'The PEEP is high', is_correct: false },
        { label: 'Compliance is normal', is_correct: false },
      ],
      explanation: 'Webb & Tierney rats, Dreyfuss — volume excursion is what injures, not pressure per se. Book Ch. 8.',
    },
  ],

  explore_card: {
    patient_context: 'Moderate ARDS, day 2. Currently PEEP 5, FiO2 0.70, PaO2 58. CXR shows scattered bilateral infiltrates. Lung is recruitable but you\'re below the threshold.',
    unlocked_controls_description: [
      { name: 'PEEP', description: 'range 0–24 cmH2O. Take one step at a time.' },
      { name: 'FiO2', description: 'range 21–100%. Currently 70%.' },
    ],
    readouts_description: [
      { name: 'PaO2', description: 'should climb as PEEP recruits alveoli.' },
      { name: 'SpO2', description: 'the bedside oxygenation signal.' },
      { name: 'Plateau, driving pressure', description: 'keep an eye on the elastic load as PEEP changes.' },
    ],
    suggestions: [
      'PEEP 0, FiO2 1.0: PaO2 stays low. Pure FiO2 strategy fails — shunt isn\'t corrected by oxygen alone.',
      'PEEP 10, FiO2 0.50: PaO2 climbs to the 70s. The right titration zone.',
      'PEEP 20, FiO2 0.40: oxygenation looks great but you\'ve crossed into overdistension territory.',
      'Drop PEEP from 20 to 14: the lung settles into a more compliant working range.',
    ],
  },
  user_facing_task: 'Set PEEP/FiO2 from the ARDSnet table. Your patient is on PEEP 5, FiO2 0.70, and PaO2 is 58. CXR shows scattered bilateral infiltrates. Use the ARDSnet Lower PEEP/FiO2 table to climb the ladder until PaO2 is in the 65–90 range.',
  success_criteria_display: [
    'PEEP raised to ≥10 cmH2O.',
    'PaO2 sustained ≥65 mmHg for five breaths.',
  ],
  task_framing_style: 'B',

  key_points: [
    'PEEP\'s three jobs: recruit alveoli, stabilize FRC, reduce LV afterload.',
    'Set initial PEEP by CXR; titrate by ARDSnet table or "good enough PEEP" by severity.',
    'Excessive PEEP overdistends — hypotension or rising dead space.',
    'VILI is volutrauma-driven, not PEEP-driven.',
  ],
};

/**
 * MODULE M14 — Oxygenation Strategies
 *
 * Track: Strategy · Archetype: outcome with multi-axis trade-off · 18 min
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - shuntFraction: 0.30 (initial preset)
 *   - PEEP-FiO2-PaO2 response curve (calibrated at shuntFraction 0.30):
 *       PEEP 8,  FiO2 1.0 → PaO2 65, SpO2 92  (shunt-limited — the FiO2 clue)
 *       PEEP 14, FiO2 1.0 → PaO2 102, SpO2 99
 *       PEEP 14, FiO2 0.6 → PaO2 78, SpO2 95
 *       PEEP 14, FiO2 0.5 → PaO2 64, SpO2 92
 *   - Prone toggle: when modeled, drops effective shuntFraction from 0.30 → ~0.18.
 *
 * [BLOCKED-SIM] The spec asks for a `prone: boolean` sandbox toggle in the
 * Explore card that drops effective shuntFraction. The sim does not yet
 * model a separate prone state independently from shuntFraction. The
 * teaching is preserved in the read prose (FiO2 → PEEP → mean airway
 * pressure → prone is the escalation ladder); a future sim extension
 * can add the toggle without altering the rest of the module.
 *
 * Specced against docs/MODULE_SPECS_v3.md §M14 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §11. See MODULE_SPECS_v3.md Appendix A.
 */
export const M14: ModuleConfig = {
  id: 'M14',
  number: 14,
  title: 'Oxygenation Strategies',
  track: 'Strategy',
  estimated_minutes: 18,
  briefing: {
    tagline: 'Shunt doesn\'t fix with FiO2. Recruitment fixes shunt.',
    overview: "Hypoxemia has five mechanisms; only two matter for the ventilated patient. Shunt: blood flows past alveoli that aren't ventilated. No amount of FiO2 in the rest of the lung helps the blood that bypassed it. The fix is recruitment — open those alveoli. V/Q mismatch: alveoli are ventilated, just poorly matched. FiO2 fixes this. The clue for shunt: high FiO2, low PaO2. The clue for V/Q mismatch: PaO2 rises smoothly with FiO2.",
    what_youll_do: [
      'Distinguish shunt (FiO2-resistant) from V/Q mismatch (FiO2-responsive).',
      'ARDSnet targets: PaO2 55–80, SpO2 88–94. SaO2 88% is enough.',
      'FiO2 >0.6 sustained: absorption atelectasis and reactive oxygen species.',
      'Oxygenation levers in order: FiO2, PEEP, mean airway pressure, prone.',
    ],
  },
  visible_learning_objectives: [
    'Distinguish shunt from V/Q mismatch by the FiO2 response.',
    'State the ARDSnet oxygenation targets: PaO2 55–80, SpO2 88–94.',
    'Recognize the permissive-hypoxia rationale: SaO2 88% is OK if DO2 is adequate.',
    'Name the four oxygenation levers in order of escalation.',
  ],

  primer_questions: [
    {
      id: 'M14-P1',
      prompt: 'A patient on FiO2 1.0 has PaO2 of 65. Increasing FiO2 to 1.0 from 0.8 had minimal effect. The most likely cause is:',
      options: [
        { label: 'V/Q mismatch — needs more oxygen', is_correct: false, explanation: 'V/Q mismatch responds to FiO2. This doesn\'t.' },
        { label: 'Shunt — perfused but unventilated alveoli', is_correct: true, explanation: 'FiO2-resistant by definition. The fix is recruitment, not more O2. Book Ch. 4.' },
        { label: 'Diffusion limit', is_correct: false, explanation: 'Possible but rare; FiO2 would still help to some degree.' },
        { label: 'Hypoventilation', is_correct: false, explanation: 'Would also raise PaCO2 — would respond to FiO2.' },
      ],
    },
    {
      id: 'M14-P2',
      prompt: 'The ARDSnet target SpO2 range is:',
      options: [
        { label: '95–100%', is_correct: false, explanation: 'Liberal oxygen — associated with worse outcomes.' },
        { label: '88–94%', is_correct: true, explanation: 'The ARDSnet target. Book Ch. 12.' },
        { label: '80–85%', is_correct: false, explanation: 'Too low for routine targeting.' },
        { label: 'SpO2 doesn\'t matter — use PaO2 only', is_correct: false, explanation: 'SpO2 is the moment-to-moment bedside signal.' },
      ],
    },
    {
      id: 'M14-P3',
      prompt: 'Owens\'s argument against FiO2 >0.6 sustained is:',
      options: [
        { label: 'It causes ARDS', is_correct: false, explanation: 'Doesn\'t cause it; can worsen it.' },
        { label: 'It causes absorption atelectasis and generates reactive oxygen species', is_correct: true, explanation: 'Alveolar nitrogen is what stabilizes alveoli; replacing it with 100% O2 collapses them once absorbed. Book Ch. 25.' },
        { label: 'It\'s expensive', is_correct: false, explanation: 'Not the clinical concern.' },
        { label: 'It can cause oxygen ignition', is_correct: false, explanation: 'That\'s a flammability issue, not the physiologic one.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'shunt_fio2_resistant',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 430, respiratoryRate: 18, peep: 8, fiO2: 100, iTime: 1.0 },
      patient: { compliance: 30, resistance: 11, spontaneousRate: 0, heightInches: 70, gender: 'M' },
    },
    unlocked_controls: ['fiO2', 'peep'],
    visible_readouts: ['pip', 'plat', 'spo2', 'pao2', 'fio2', 'peep'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'outcome',
    readouts: {
      fio2: { operator: '<=', value: 60 },
      peep: { operator: '>=', value: 12 },
      spo2: { operator: '>=', value: 88 },
    },
    sustain_breaths: 5,
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Two mechanisms matter.** Shunt: blood flows past alveoli that aren\'t ventilated. No amount of FiO2 in the rest of the lung helps the blood that bypassed it. The fix is *recruitment* — open those alveoli. V/Q mismatch: alveoli are ventilated, just poorly matched. FiO2 fixes this.' },
    { kind: 'callout', tone: 'info', markdown: 'The clue for shunt: high FiO2, low PaO2. The clue for V/Q mismatch: PaO2 rises smoothly with FiO2.' },
    {
      kind: 'predict_observe',
      predict: 'You\'re going to raise PEEP from 8 to 14 at FiO2 1.0. The patient has a P/F of 65 — pure shunt. What happens to PaO2?',
      observe: 'PaO2 climbs from 65 to over 100. The lung was recruitable; PEEP did what FiO2 couldn\'t. Now lower FiO2 to 0.60 — PaO2 settles in the 70s and you\'re back to a non-toxic O2 dose.',
      awaits_control: 'peep',
    },
    { kind: 'callout', tone: 'warn', markdown: 'SaO2 88% is acceptable if cardiac output and Hb are OK. The shape of the oxyhemoglobin curve means PaO2 only has to be ~56 to give SaO2 88. Don\'t chase a PaO2 of 100 with FiO2 1.0 when 60 on 0.6 will do.' },
    { kind: 'prose', markdown: '**Four levers, escalating order.** FiO2 → PEEP → mean airway pressure (longer Ti, IRV, APRV) → prone positioning. Each lever has a ceiling. When you\'re hitting it, move to the next.' },
  ],

  hint_ladder: {
    tier1: 'Your FiO2 is at the ceiling but the PaO2 hasn\'t budged. What does that tell you about the mechanism?',
    tier2: 'Raise PEEP to recruit. Once PaO2 is above 90, start lowering FiO2 in steps to 0.60 or less.',
    tier3: { hint_text: 'Set PEEP 14, then drop FiO2 to 60%.', demonstration: { control: 'peep', target_value: 14 } },
  },

  summative_quiz: [
    {
      id: 'M14-Q1',
      prompt: 'A patient on FiO2 0.60 has SpO2 92%, PaO2 78. The clinical interpretation is:',
      options: [
        { label: 'Under-oxygenated — raise FiO2', is_correct: false },
        { label: 'Within ARDSnet target — leave alone', is_correct: true },
        { label: 'Over-oxygenated — lower FiO2 to 0.21', is_correct: false },
        { label: 'Indicates shunt', is_correct: false },
      ],
      explanation: 'PaO2 55–80 and SpO2 88–94 is the ARDSnet target. Don\'t chase higher numbers. Book Ch. 12.',
    },
    {
      id: 'M14-Q2',
      // Fix 5: rewrote to reflect the actual state of the literature.
      // ICU-ROX, HOT-ICU, LOCO2, and OXYGEN-ICU produced mixed signals.
      // The defensible answer is "mixed results with a harm signal from
      // liberal O2," not "conservative reduces mortality."
      prompt: 'Conservative oxygen therapy (PaO2 70–100, SpO2 94–98) compared to liberal (PaO2 up to 150, SpO2 97–100) in ICU patients:',
      options: [
        { label: 'Reduced mortality across every major trial', is_correct: false },
        { label: 'Showed mixed results across RCTs, with signals of harm from liberal oxygen but no consistent mortality benefit', is_correct: true },
        { label: 'Increased mortality consistently', is_correct: false },
        { label: 'Was not studied in critically ill patients', is_correct: false },
      ],
      explanation: 'ICU-ROX, HOT-ICU, and LOCO2 produced mixed signals. The consistent finding is that liberal oxygen (PaO2 >150 sustained) appears harmful; the case for tight conservative targets is less settled. Book Ch. 8 and current trial literature.',
    },
    {
      id: 'M14-Q3',
      prompt: 'DO2 (oxygen delivery) is:',
      options: [
        { label: 'PaO2 × Hb', is_correct: false },
        { label: 'SaO2 × Hb', is_correct: false },
        { label: 'CaO2 × CO × 10', is_correct: true },
        { label: 'PaO2 ÷ FiO2', is_correct: false },
      ],
      explanation: 'The full equation. SaO2 matters more than PaO2 because dissolved O2 is a small fraction of total content. Book Ch. 5.',
    },
    {
      id: 'M14-Q4',
      prompt: 'In a patient with 30% shunt, increasing FiO2 from 0.60 to 1.0 will:',
      options: [
        { label: 'Substantially improve PaO2', is_correct: false },
        { label: 'Have minimal effect on PaO2', is_correct: true },
        { label: 'Lower PaCO2', is_correct: false },
        { label: 'Improve V/Q matching', is_correct: false },
      ],
      explanation: 'Shunt is FiO2-resistant. The shunted blood never sees the alveolar gas. Book Ch. 4.',
    },
    {
      id: 'M14-Q5',
      prompt: 'The four levers for improving oxygenation, roughly in order of escalation, are:',
      options: [
        { label: 'PEEP, FiO2, prone, ECMO', is_correct: false },
        { label: 'FiO2, PEEP, mean airway pressure (longer Ti, IRV, APRV), prone positioning', is_correct: true },
        { label: 'Bronchodilators, FiO2, PEEP, paralytics', is_correct: false },
        { label: 'Sedation, FiO2, PEEP, diuresis', is_correct: false },
      ],
      explanation: 'FiO2 first because it\'s easy. PEEP next because shunt doesn\'t respond to FiO2. Mean Paw next via Ti or APRV. Prone when you\'ve maxed the rest. Book Ch. 4, Ch. 12, Ch. 17.',
    },
  ],

  explore_card: {
    patient_context: 'Severe ARDS, P/F ratio ~65. Already on FiO2 1.0 and the PaO2 is only 65. That mismatch is the clue: this is shunt, not V/Q.',
    unlocked_controls_description: [
      { name: 'PEEP', description: 'range 0–24 cmH2O. Recruit before chasing FiO2.' },
      { name: 'FiO2', description: 'range 21–100%. Wean once PaO2 has a buffer.' },
    ],
    readouts_description: [
      { name: 'PaO2 and SpO2', description: 'climb together once recruitment works.' },
      { name: 'PIP, plateau', description: 'watch as PEEP rises.' },
    ],
    suggestions: [
      'FiO2 1.0, PEEP 8: PaO2 stays in the 60s. Shunt-limited.',
      'FiO2 1.0, PEEP 14: PaO2 jumps to over 100. Recruitment worked.',
      'FiO2 0.50, PEEP 14: PaO2 around 64, SpO2 around 92. Right in the ARDSnet band.',
    ],
  },
  user_facing_task: 'De-escalate FiO2 by recruiting. Your patient is on FiO2 1.0 with PaO2 only 65 — this is shunt, not V/Q mismatch. Climbing FiO2 won\'t fix it. Raise PEEP to recruit alveoli, then lower FiO2 to 60% or less while keeping SpO2 in the ARDSnet target band.',
  success_criteria_display: [
    'PEEP raised to ≥12 cmH2O.',
    'FiO2 dropped to ≤60%.',
    'SpO2 sustained ≥88% for five breaths.',
  ],
  task_framing_style: 'B',

  key_points: [
    'Shunt and V/Q mismatch — distinguish by the FiO2 response.',
    'ARDSnet target: PaO2 55–80, SpO2 88–94.',
    'FiO2 >0.6 sustained: absorption atelectasis, reactive oxygen species.',
    'Levers in order: FiO2 → PEEP → mean airway pressure → prone.',
  ],
};
