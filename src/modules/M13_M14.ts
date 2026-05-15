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
 * [BLOCKED-SIM]: resolved in v3.2 §4 — see docs/BLOCKED_SIM.md §6
 * (history). SBP is now a live readout; tracker gates on sbp ≥ 95.
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
      // v3.2 §4 — marginal baseline SBP 105: enough headroom for PEEP 10–12
      // (the sweet-spot recruit), but PEEP 18+ drops CO enough to break the
      // SBP ≥ 95 guardrail. Teaches "PEEP titration is bounded by hemodynamics."
      patient: { compliance: 32, resistance: 11, spontaneousRate: 0, heightInches: 70, gender: 'M', bpSys: 105 },
    },
    unlocked_controls: ['peep', 'fiO2'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'spo2', 'pao2', 'fio2', 'peep', 'sbp'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  // v3.2 §4 — PEEP must lift PaO2 ≥ 65 AND keep SBP ≥ 95. Overshoot PEEP
  // tanks venous return on a marginal patient (baseline SBP 105 here),
  // so the success criterion is a hemodynamic-respecting recruitment,
  // not just an oxygenation hit. The SBP card flashes rose under 95 to
  // make the trade-off visible while exploring.
  hidden_objective: {
    kind: 'outcome',
    readouts: {
      peep: { operator: '>=', value: 10 },
      pao2: { operator: '>=', value: 65 },
      sbp: { operator: '>=', value: 95 },
    },
    sustain_breaths: 5,
  },

  content_blocks: [
    { kind: 'prose', markdown: '**PEEP is the splint.** The lung has a functional residual capacity — a reservoir of air that maintains gas exchange even when you\'re not actively breathing. ARDS and pulmonary edema collapse that reservoir. PEEP rebuilds it. Three jobs: recruit collapsed alveoli, hold FRC against the next breath\'s exhalation, and (in failing LV) reduce afterload by lifting pleural pressure.' },
    { kind: 'callout', tone: 'info', markdown: 'Initial PEEP by CXR: clear → 5; scattered infiltrates → 10; diffuse dense → 15; whiteout → 20.' },
    // Novice-pass §13.1 — replace ASCII with a real graphic.
    {
      kind: 'figure',
      caption: 'ARDSnet Lower PEEP/FiO2 table — the standard starting ladder. As FiO2 climbs, PEEP climbs with it. The bottom rows (olive) signal "watch the SBP."',
      src: '/figures/ardsnet_lower_peep.svg',
    },
    // Novice-pass §13.2 — explicit SBP-guardrail teaching block so the
    // learner connects the flashing SBP card to "PEEP overshot."
    {
      kind: 'prose',
      markdown:
        "**Watch the SBP card as you climb PEEP.** Below 95, the card flashes red. That's the floor — PEEP is helping the lungs but starting to hurt circulation. When you see that flash, you've gone one click too far. Back PEEP off until the flash stops, then accept the slightly lower PaO2 as the trade.",
    },
    {
      // v3.2 §4.6 — overshoot-BP predict_mcq replaces the simple PEEP→PaO2
      // demo. The SBP guardrail now appears in the live tracker so this
      // teaching has consequence.
      kind: 'predict_mcq',
      predict:
        "You're going to raise PEEP from 5 to 18 in this patient. What's the most likely BP response?",
      options: [
        { label: 'BP rises — PEEP improves cardiac output by reducing LV afterload.', is_correct: false, explanation: 'That\'s true at modest PEEP in failing LVs. At PEEP 18 in a euvolemic patient, the dominant effect is reduced venous return.' },
        { label: 'BP unchanged.', is_correct: false, explanation: 'At this magnitude, intrathoracic pressure changes start to matter.' },
        { label: 'BP falls.', is_correct: true },
        { label: 'Depends on the FiO2.', is_correct: false, explanation: 'FiO2 doesn\'t drive hemodynamics here.' },
      ],
      observe:
        'At PEEP 18, intrathoracic pressure crowds the right atrium, venous return falls, cardiac output falls, and SBP drops. The recruitment benefit (PaO2 climbs to 92) is real, but you\'ve overshot the safe ceiling. The SBP readout above is the live signal — watch it as you titrate.',
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
    // Novice-pass §13.3 — SBP is in the tracker but was missing from
    // the user-visible criteria list, so a learner who tanked BP saw
    // the chip stall without knowing why.
    'PEEP raised to ≥10 cmH2O.',
    'PaO2 sustained ≥65 mmHg for five breaths.',
    'SBP held ≥95 mmHg throughout — don\'t overshoot.',
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
 * [BLOCKED-SIM]: see docs/BLOCKED_SIM.md §5 for the prone-toggle
 * limitation.
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

  // Novice-pass §14.1 — extend the outcome with a recognition step that
  // forces the learner to make the escalation decision once. The four-
  // lever ladder is taught as a list but never practiced as a decision
  // without this.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    children: [
      {
        kind: 'outcome',
        readouts: {
          fio2: { operator: '<=', value: 60 },
          peep: { operator: '>=', value: 12 },
          spo2: { operator: '>=', value: 88 },
        },
        sustain_breaths: 5,
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M14-escalation',
          trigger: { kind: 'on_load' },
          question:
            "Imagine a sicker version of this patient: FiO2 0.8, PEEP 12, mean Paw 22, PaO2 stuck at 55. You've climbed the first two rungs of the ladder. What's the next evidence-based move?",
          options: [
            { label: 'Push PEEP from 12 to 18.', is_correct: false, explanation: 'You\'re hitting the PEEP ceiling — going higher mostly buys overdistension and a falling SBP, not recruitment.' },
            { label: 'Prone position the patient.', is_correct: true, explanation: 'PROSEVA: for moderate-to-severe ARDS (P/F < 150 on FiO2 ≥ 0.6, PEEP ≥ 5), prone positioning for ≥ 16 h/day cuts mortality. This is the next rung after FiO2 and PEEP.' },
            { label: 'Add inhaled nitric oxide.', is_correct: false, explanation: 'iNO transiently improves oxygenation but has no mortality benefit. Reserve for refractory shunt or RV failure after prone has been tried.' },
            { label: 'Stay the course and recheck in 4 hours.', is_correct: false, explanation: 'P/F < 70 doesn\'t reward patience. Escalate.' },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Two mechanisms matter.** Shunt: blood flows past alveoli that aren\'t ventilated. No amount of FiO2 in the rest of the lung helps the blood that bypassed it. The fix is *recruitment* — open those alveoli. V/Q mismatch: alveoli are ventilated, just poorly matched. FiO2 fixes this.' },
    { kind: 'callout', tone: 'info', markdown: 'The clue for shunt: high FiO2, low PaO2. The clue for V/Q mismatch: PaO2 rises smoothly with FiO2.' },
    // v3.2 §5.3 — new predict_mcq covering the four-lever escalation ladder
    // (FiO2 → PEEP → mean airway pressure → prone). Lives before the existing
    // PEEP recruitment block so the learner has the ladder framing before
    // the PEEP demo.
    {
      kind: 'predict_mcq',
      predict:
        'A patient has refractory hypoxemia despite FiO2 0.8 and PEEP 12. Which is the next step on Owens\'s escalation ladder?',
      options: [
        { label: 'Switch from VCV to PCV.', is_correct: false, explanation: 'Mode change doesn\'t move the ladder; same lungs, same compliance, same shunt.' },
        { label: 'Increase mean airway pressure — longer inspiratory time, or APRV.', is_correct: true },
        { label: 'Add a paralytic.', is_correct: false, explanation: 'Paralysis helps if dyssynchrony is the issue, but it\'s not a primary oxygenation lever in Owens\'s ladder.' },
        { label: 'Add inhaled nitric oxide.', is_correct: false, explanation: 'INO is a rescue therapy below the four-lever ladder, not part of it.' },
      ],
      observe:
        'The four levers in order: FiO2 → PEEP → mean airway pressure → prone. Each has a ceiling. You\'re hitting the PEEP ceiling here (PaO2 still inadequate, hemodynamics getting marginal). The next move is mean airway pressure — longer Ti, IRV, or APRV — which raises alveolar recruitment time without raising PEEP further. Prone comes after that.',
    },
    {
      // v3.2 §5.5 — legacy predict_observe converted.
      kind: 'predict_mcq',
      predict: 'This patient has a P/F of 65 (PaO2 65 on FiO2 1.0) — refractory hypoxemia. You raise PEEP from 8 to 14 with FiO2 unchanged. What happens to PaO2?',
      options: [
        { label: 'Unchanged — the patient is already on max O2.', is_correct: false, explanation: "That's the FiO2-resistance fingerprint of shunt, which doesn't predict the PEEP response." },
        { label: 'Climbs as alveoli recruit.', is_correct: true },
        { label: 'Falls — PEEP overdistends.', is_correct: false, explanation: 'Overdistension is a real risk above ~18 in this patient, but at 14 you\'re still in the recruitment zone.' },
        { label: 'Hard to predict.', is_correct: false, explanation: 'The lung is recruitable; the prediction is straightforward.' },
      ],
      observe: 'PaO2 climbs from 65 to over 100 as PEEP recruits the previously collapsed alveoli. The shunt fraction falls. Now you can drop FiO2 to 0.50–0.60 and PaO2 settles in the 70s — back to non-toxic O2 with a safe buffer.',
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
      // v3.2 §5 — Q4 replaced with a ladder-of-escalation question. The
      // learner has already maxed FiO2 and seated PEEP at the ARDSnet
      // upper-PEEP row; mean Paw is high. The remaining rung on the
      // oxygenation ladder before ECMO is prone positioning (PROSEVA).
      id: 'M14-Q4',
      prompt: 'Day 2 of severe ARDS. FiO2 1.0, PEEP 14, mean Paw 22 cmH2O, PaO2 55, plateau 28. You\'ve already optimized FiO2 and PEEP. Driving pressure is 14. What is the next intervention?',
      options: [
        { label: 'Push PEEP to 18–20 cmH2O', is_correct: false, explanation: 'You\'re already on the upper end of the ARDSnet table; pushing higher mostly buys overdistension and driving pressure, not recruitment. The ladder calls for prone first.' },
        { label: 'Prone position', is_correct: true, explanation: 'PROSEVA: prone positioning for ≥16 h/day in moderate-to-severe ARDS (P/F < 150 on FiO2 ≥ 0.6, PEEP ≥ 5) cuts mortality. This is the next rung on the ladder before ECMO.' },
        { label: 'Switch to APRV', is_correct: false, explanation: 'APRV can recruit, but the trial data is weaker than prone and the dyssynchrony risk is high. Prone is the better-evidenced next move.' },
        { label: 'Start inhaled nitric oxide', is_correct: false, explanation: 'iNO improves oxygenation transiently but has no mortality benefit and is expensive. Reserve for refractory shunt or RV failure; not the next standard rung.' },
      ],
      explanation: 'The oxygenation ladder: FiO2 → PEEP → mean airway pressure → prone → NMBA → ECMO. With FiO2 1.0 and high PEEP already, prone is the next evidence-based step (PROSEVA). Book Ch. 17.',
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
