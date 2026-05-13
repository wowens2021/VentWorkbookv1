import type { ModuleConfig } from '../shell/types';

/**
 * M3 — The Equation of Motion
 * Track: Foundations · Archetype: concept demo (compound, reset_between) · 15 min
 * Anchor chapters: VB Ch. 3 (Commandments I, V, VI), Ch. 8, Ch. 13
 *
 * Specced verbatim against docs/MODULE_SPECS_v3.md §M3.
 */
export const M3: ModuleConfig = {
  id: 'M3',
  number: 3,
  title: 'The Equation of Motion',
  track: 'Foundations',
  estimated_minutes: 15,
  briefing: {
    tagline: 'P = V/C + R·flow + PEEP. The spine of every breath.',
    overview:
      "The equation of motion is the one piece of physiology that ties everything together. Pressure equals (volume divided by compliance) plus (flow times resistance) plus PEEP. That's it. Stretching the lungs costs pressure. Pushing gas through airways costs pressure. PEEP is the baseline. If you understand which term is doing the work in any given breath, you can predict what every ventilator change will do before you make it.",
    what_youll_do: [
      'The elastic component depends on lung stiffness. The resistive component depends on airway narrowness.',
      "Faster inspiratory flow raises peak pressure but doesn't change plateau.",
      'Every alarm, every waveform shape, every mode decision routes back to this equation eventually.',
    ],
  },

  visible_learning_objectives: [
    'State the equation of motion: P = V/C + R·flow + PEEP.',
    'Predict the effect of compliance, resistance, and flow in isolation on PIP and Pplat.',
    'Use the peak-plateau gap as the bedside test for resistance vs compliance.',
  ],

  primer_questions: [
    {
      id: 'M3-P1',
      prompt: 'The equation of motion in its bedside form is:',
      options: [
        { label: 'P = V/C + R·flow + PEEP', is_correct: true, explanation: 'The three independent contributions to airway pressure.' },
        { label: 'P = V·C + R/flow + PEEP', is_correct: false, explanation: "Compliance is in the denominator; you'd never see this combination." },
        { label: 'PIP = Pplat = R·flow', is_correct: false, explanation: 'PIP and Pplat are not the same except under zero flow.' },
        { label: 'PIP = Pplat + PEEP', is_correct: false, explanation: 'PIP − Pplat is the resistance contribution, not PEEP.' },
      ],
    },
    {
      id: 'M3-P2',
      prompt: 'You see PIP 38, Pplat 22, PEEP 5. The driving pressure is:',
      options: [
        { label: '16', is_correct: false, explanation: "That's PIP − Pplat — the resistance contribution, not the driving pressure." },
        { label: '17', is_correct: true, explanation: 'Driving pressure = Pplat − PEEP = 22 − 5 = 17. Book Ch. 8.' },
        { label: '22', is_correct: false, explanation: "That's Pplat alone." },
        { label: '38', is_correct: false, explanation: "That's PIP alone." },
      ],
    },
    {
      id: 'M3-P3',
      prompt: 'A high PIP with a normal Pplat tells you:',
      options: [
        { label: 'Compliance is low — the lungs are stiff.', is_correct: false, explanation: 'That raises both pressures together.' },
        { label: 'Resistance is high — something in the airways is the problem.', is_correct: true, explanation: 'Book Ch. 2: kinked tube, mucus, bronchospasm. Look upstream.' },
        { label: 'PEEP is too high.', is_correct: false, explanation: 'PEEP raises both pressures.' },
        { label: 'The vent is broken.', is_correct: false, explanation: "You haven't ruled out the patient yet." },
      ],
    },
  ],

  scenario: {
    preset_id: 'M3_eom_baseline_vcv',
    preset: {
      // Slightly higher Vt (500) than M1/M2 so baseline PIP/Pplat are big
      // enough to make changes obvious. Compliance 50 (mildly reduced),
      // resistance 10 (normal) so the baseline gap is small.
      // PIN: tidalVolume 500 — DO NOT CHANGE. Smaller Vt makes the parallel
      // rise too subtle. iTime 1.0 baseline gives the flow-term step room
      // to move.
      mode: 'VCV',
      settings: { tidalVolume: 500, respiratoryRate: 14, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 50, resistance: 10, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    // The three terms of the equation, exactly. Mode/Vt/rate/PEEP/FiO2
    // stay locked — this module isolates physiology, not titration.
    unlocked_controls: ['compliance', 'resistance', 'iTime'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'vte', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'any_order',
    reset_between: true,
    children: [
      // Step 1 — compliance ↓ → parallel rise (gap unchanged)
      {
        kind: 'manipulation',
        control: 'compliance',
        condition: { type: 'delta_pct', direction: 'decrease', min_pct: 30 },
        require_acknowledgment: {
          question: 'You decreased compliance. What happened to the peak-to-plateau gap?',
          options: [
            { label: 'Unchanged — both PIP and Pplat rose by roughly the same amount', is_correct: true, explanation: "Right. Compliance is in the V/C term — it raises *alveolar* pressure. Resistance didn't change, so the gap (which reflects resistance) didn't change." },
            { label: 'Widened — PIP rose more than Pplat', is_correct: false, explanation: "That's the resistance signature. Compliance changes affect both pressures equally." },
            { label: 'Narrowed — Pplat rose more than PIP', is_correct: false, explanation: 'Physically impossible — Pplat is always ≤ PIP (since PIP = Pplat + resistance term).' },
          ],
        },
      },
      // Step 2 — resistance ↑ → gap widens
      {
        kind: 'manipulation',
        control: 'resistance',
        // Baseline resistance 10 → need ≥18 to make the gap obvious on the
        // waveform (book Ch. 15: gap > 5 = resistance is elevated).
        condition: { type: 'delta_pct', direction: 'increase', min_pct: 80 },
        require_acknowledgment: {
          question: 'You raised resistance. Which pressure moved more?',
          options: [
            { label: 'PIP rose more than Pplat — the gap widened', is_correct: true, explanation: 'Right. Resistance lives only in the R·flow term. That adds to PIP but disappears when flow stops, so Pplat barely moves.' },
            { label: 'Both rose equally', is_correct: false, explanation: "That's what compliance does. Resistance is asymmetric." },
            { label: 'Pplat rose more than PIP', is_correct: false, explanation: 'Cannot happen. Pplat is always ≤ PIP.' },
          ],
        },
      },
      // Step 3 — shorter Ti → higher flow → peak rises only
      {
        kind: 'manipulation',
        control: 'iTime',
        // At baseline iTime 1.0 and rate 14, flow ~30 L/min. At iTime 0.7,
        // flow rises to ~43 L/min — gap should grow ~3 cmH2O, visible.
        condition: { type: 'absolute', operator: '<=', value: 0.7 },
        require_acknowledgment: {
          question: 'You shortened I-time. Same Vt delivered faster (higher flow). What happens to PIP vs Pplat?',
          options: [
            { label: "PIP rises; Pplat doesn't change much", is_correct: true, explanation: 'Right. Flow only shows up in the R·flow term. Squeeze the same volume through the same airways faster, and the airway resistance contribution is larger. Pplat is alveolar pressure after flow stops — same Vt, same compliance → same Pplat.' },
            { label: 'Both rise', is_correct: false, explanation: 'Pplat depends on compliance and Vt, neither of which changed.' },
            { label: 'Both fall', is_correct: false, explanation: 'Faster flow raises peak pressure, not lowers it.' },
          ],
        },
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        "Three numbers shape every peak airway pressure on every ventilator in the world. **Volume divided by compliance** — what the alveoli demand. **Resistance times flow** — what the airways extract. **PEEP** — what you started above zero. The vent doesn't care which one moved. The peak-plateau gap is how you tell them apart.",
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        "If you don't perform inspiratory holds, you don't have Pplat. Without Pplat, you can't tell compliance from resistance — and you don't know what you're fixing.",
    },
    {
      kind: 'predict_observe',
      awaits_control: 'compliance',
      predict:
        'If you halve the compliance (50 → 25), what happens to PIP, Pplat, and the gap between them?',
      observe:
        "Both PIP and Pplat rise by roughly the same amount. The gap stays the same — because the resistance term didn't change.",
    },
    {
      kind: 'predict_observe',
      awaits_control: 'resistance',
      predict:
        'If you double the resistance (10 → 20), what happens to PIP, Pplat, and the gap?',
      observe:
        'PIP rises; Pplat barely moves. The gap widens. That gap *is* the resistance contribution — the R·flow term made visible.',
    },
    {
      kind: 'figure',
      caption: 'Compliance ↓ versus Resistance ↑ — the two waveforms side by side.',
      ascii:
        'compliance ↓                          resistance ↑\n' +
        '\n' +
        '   PIP ┤ ╱‾‾‾‾┐   ← hold              PIP ┤ ╱‾‾‾‾┐  ← hold\n' +
        '   Pplat╲    │                            │      ╲\n' +
        '       │    └──                       Pplat╲╲    └────\n' +
        '       │                                  ─┴──\n' +
        '       │                                   │\n' +
        '       └──── time ───→                     └──── time ───→\n' +
        '  PIP↑, Pplat↑, GAP UNCHANGED        PIP↑↑, Pplat ≈ same, GAP WIDE',
    },
    {
      kind: 'formative',
      question: 'PIP 42, Pplat 28, PEEP 5. The peak-plateau gap is 14 cmH2O. Most likely:',
      options: [
        { label: 'Severe ARDS', is_correct: false },
        { label: 'High airway resistance — kinked tube, mucus plug, bronchospasm. The gap is the giveaway.', is_correct: true },
        { label: 'Auto-PEEP', is_correct: false },
        { label: 'Normal physiology', is_correct: false },
      ],
      answer:
        'Gap >5 is high. PIP − Pplat = 14 means the airway resistance contribution is huge. Pplat 28 with PEEP 5 gives driving pressure 23 — also elevated, but the *signature* finding is the wide gap. Look upstream: tube, secretions, bronchospasm. Severe ARDS would raise both pressures with a normal gap.',
    },
  ],

  hint_ladder: {
    tier1: 'Three independent experiments. Move one knob at a time and then answer the question about the gap.',
    tier2: 'Compliance moves both pressures equally. Resistance moves only the peak. Flow (I-time) moves only the peak.',
    tier3: { hint_text: 'Use "Show me" to run the current step\'s manipulation, then reset.', demonstration: { control: 'compliance', target_value: 30 } },
  },

  summative_quiz: [
    {
      id: 'M3-Q1',
      prompt: 'PIP 35, Pplat 32, PEEP 5. The bedside problem most likely is:',
      options: [
        { label: 'High airway resistance', is_correct: false, explanation: 'Gap is only 3 — normal.' },
        { label: 'Low compliance (high alveolar pressure, narrow gap)', is_correct: true, explanation: 'The plateau is high; the gap is normal. The alveoli are stiff.' },
        { label: 'Auto-PEEP', is_correct: false, explanation: "Doesn't show on the PIP-Pplat gap." },
        { label: 'Volume undershoot', is_correct: false, explanation: "That's a Vte finding, not a pressure finding." },
      ],
    },
    {
      id: 'M3-Q2',
      prompt: 'You raise the inspiratory flow rate (or shorten I-time — same thing). Which pressure changes the most?',
      options: [
        { label: 'PIP', is_correct: true, explanation: 'Flow lives in the resistance term — peak only.' },
        { label: 'Pplat', is_correct: false, explanation: 'Pplat is set by Vt and compliance, neither of which changed.' },
        { label: 'PEEP', is_correct: false, explanation: 'PEEP is your setting.' },
        { label: "None — flow doesn't affect any pressure", is_correct: false, explanation: 'Flow is half of the resistance term.' },
      ],
    },
    {
      id: 'M3-Q3',
      prompt: 'The driving pressure (Pplat − PEEP) is most directly an index of:',
      options: [
        { label: 'Resistance', is_correct: false, explanation: 'Resistance is PIP − Pplat.' },
        { label: "Compliance — specifically, the cost of getting your Vt into the patient's lungs", is_correct: true, explanation: 'Amato 2015; book Ch. 8. It "indexes" Vt to the patient\'s actual compliance.' },
        { label: 'The set rate', is_correct: false, explanation: "Rate doesn't appear." },
        { label: 'FiO2', is_correct: false, explanation: "Doesn't appear either." },
      ],
    },
    {
      id: 'M3-Q4',
      prompt: 'Static compliance for a patient on Vt 500, Pplat 25, PEEP 5 is:',
      options: [
        { label: '20 mL/cmH2O', is_correct: false, explanation: "That's 500/25 — used PIP, not (Pplat − PEEP)." },
        { label: '25 mL/cmH2O', is_correct: true, explanation: 'Vt / (Pplat − PEEP) = 500 / (25 − 5) = 500/20 = 25.' },
        { label: '100 mL/cmH2O', is_correct: false, explanation: 'Normal off the vent, not this patient.' },
        { label: 'Cannot calculate without PIP', is_correct: false, explanation: 'Static compliance uses Pplat by design — PIP is for *dynamic* compliance.' },
      ],
    },
    {
      id: 'M3-Q5',
      prompt: 'Owens\'s bedside test for "is this a resistance problem or a lung problem?" is:',
      options: [
        { label: 'Get an arterial blood gas', is_correct: false, explanation: "Doesn't distinguish these." },
        { label: 'Perform an inspiratory hold and look at the peak-plateau gap', is_correct: true, explanation: 'Book Ch. 2. Gap > 5 → resistance. Gap normal → lung.' },
        { label: 'Disconnect the patient from the vent', is_correct: false, explanation: "That's a different test (DOPE)." },
        { label: 'Raise the PEEP', is_correct: false, explanation: "Doesn't help diagnostically." },
      ],
    },
  ],

  explore_card: {
    patient_context:
      "Same stable patient. You're going to perturb him three ways and watch the equation work. None of these are dangerous in the sim; the point is the *shape* of the response.",
    unlocked_controls_description: [
      { name: 'Compliance · 20–80', description: 'how stiff or compliant the respiratory system is.' },
      { name: 'Resistance · 5–35', description: 'how much the airways and tube oppose flow.' },
      { name: 'I-time · 0.5–1.5', description: 'how long inspiration takes. Shorter Ti = higher peak flow.' },
    ],
    readouts_description: [
      { name: 'PIP, Pplat, gap (PIP − Pplat)', description: 'the three numbers you need to read the equation.' },
    ],
    suggestions: [
      'Drop compliance from 50 to 25. PIP and Pplat both rise about the same amount. Gap unchanged.',
      'Raise resistance from 10 to 25. PIP shoots up; Pplat barely moves. Gap widens.',
      'Shorten I-time from 1.0 to 0.5. PIP rises, Pplat unchanged. Gap widens — because faster flow means more resistance contribution.',
      'Combine: drop compliance AND raise resistance. Both pressures rise, AND the gap widens. Two stories — treat them differently.',
    ],
  },

  user_facing_task:
    "Make three changes to this patient — one to compliance, one to resistance, one to I-time. After each, you'll be asked what happened to the peak-plateau gap. The sim resets between changes so each is a clean experiment.",
  success_criteria_display: [
    'Drop compliance by 30% — explain the effect on the gap.',
    'Raise resistance by 80% — explain the effect on the gap.',
    'Shorten I-time to ≤ 0.7 s — explain the effect on the gap.',
  ],
  task_framing_style: 'A',

  key_points: [
    'P = V/C + R·flow + PEEP. Three independent terms.',
    'Compliance ↓ → PIP and Pplat both rise. Gap unchanged.',
    'Resistance ↑ → PIP rises *more than* Pplat. Gap widens.',
    'Flow ↑ (shorter Ti) → PIP rises; Pplat doesn\'t. Gap widens.',
    'Driving pressure = Pplat − PEEP. The lung-protective ceiling is 15.',
  ],
};
