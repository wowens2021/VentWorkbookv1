import type { ModuleConfig } from '../shell/types';

/**
 * M4 — Compliance and Resistance
 * Track: Physiology · Archetype: concept demo (compound strict, reset_between) · 14 min
 * Anchor chapters: VB Ch. 1, Ch. 2, Ch. 8, Ch. 15
 *
 * Specced verbatim against docs/MODULE_SPECS_v3.md §M4.
 */
export const M4: ModuleConfig = {
  id: 'M4',
  number: 4,
  title: 'Compliance and Resistance',
  track: 'Physiology',
  estimated_minutes: 14,
  briefing: {
    tagline: 'Peak-plateau gap separates airway from lung.',
    overview:
      "This is the bedside skill the rest of the book builds on. When peak pressure rises, you have to know whether the lungs got stiffer or the airways got narrower, and the ventilator already tells you. The gap between peak and plateau is the answer. A small gap means the problem is in the lung itself. A big gap means the problem is in the airway. That single observation drives most of what you do for sudden pressure changes.",
    what_youll_do: [
      'Compliance problems raise peak and plateau together.',
      'Resistance problems raise peak alone, widening the gap.',
      'Plateau pressure is the most important number on the screen for evaluating lung mechanics.',
    ],
  },

  visible_learning_objectives: [
    'Compute static compliance at the bedside: Vt / (Pplat − PEEP).',
    'Recognize the parallel-rise pattern as a restrictive / compliance problem.',
    'Recognize the wide-gap pattern as a resistance problem.',
    'Name one differential cause for each pattern.',
  ],

  primer_questions: [
    {
      id: 'M4-P1',
      prompt: "A patient's PIP suddenly jumps from 25 to 42, but the Pplat goes from 18 to 22. The most useful first move is:",
      options: [
        { label: 'Increase PEEP.', is_correct: false, explanation: "Doesn't address the airway resistance problem." },
        { label: 'Suction the patient and check the tube.', is_correct: true, explanation: 'Book Ch. 2. Wide gap = airway problem; mucus plug or kinked tube is the most common cause.' },
        { label: 'Lower the tidal volume.', is_correct: false, explanation: 'That treats Pplat — and Pplat barely moved.' },
        { label: 'Switch to pressure control.', is_correct: false, explanation: 'In severe airway resistance, PCV is *risky* — Pplat can crash silently (book Ch. 15).' },
      ],
    },
    {
      id: 'M4-P2',
      prompt: 'Falling compliance over hours-to-days usually means:',
      options: [
        { label: 'The patient is getting better.', is_correct: false, explanation: "That's *rising* compliance." },
        { label: 'Worsening fluid overload, evolving pneumonia, or new pneumothorax.', is_correct: true, explanation: 'Owens, Commandment I.' },
        { label: 'The PEEP is too high.', is_correct: false, explanation: 'Excess PEEP can overdistend, but compliance is a longer-timescale signal.' },
        { label: 'The ventilator is in the wrong mode.', is_correct: false, explanation: "Mode doesn't change compliance." },
      ],
    },
    {
      id: 'M4-P3',
      prompt: "Owens's \"baby lung\" concept means:",
      options: [
        { label: "Children's lungs handle the vent differently than adults'.", is_correct: false, explanation: "The term is about *adults* with ARDS." },
        { label: "In ARDS, the lungs aren't uniformly stiff — there are fewer healthy alveoli doing all the work, like a child's lungs in an adult's chest.", is_correct: true, explanation: 'Book Ch. 8. This is why Vt scales to *healthy* volume, not total.' },
        { label: 'ARDS patients always need a smaller tube.', is_correct: false, explanation: 'Not what the concept means.' },
        { label: 'Compliance in ARDS is calculated differently.', is_correct: false, explanation: 'Same equation, just a much smaller number.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'M4_compliance_resistance_baseline',
    preset: {
      // Slightly sicker baseline than M3 — mildly reduced compliance (45)
      // and just-above-normal resistance (12) — so the changes the learner
      // produces land in clinically realistic ranges. Baseline PIP ~22,
      // Pplat ~16, gap ~6.
      // PIN: tidalVolume 480 — DO NOT CHANGE. Tracker math assumes this
      // baseline; smaller Vt blurs the gap.
      mode: 'VCV',
      settings: { tidalVolume: 480, respiratoryRate: 14, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 45, resistance: 12, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    // PEEP unlocked too — so the learner can confirm in Explore that PEEP
    // raises both pressures by the same amount (a "third term" demo).
    unlocked_controls: ['compliance', 'resistance', 'peep'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'vte', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  // Strict (not any-order): the clinical reasoning M4 teaches requires
  // anchoring to an unchanged baseline. Compliance change first (lung
  // pattern), then resistance change (airway pattern), with a sim reset
  // between so each is a clean experiment.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: true,
    children: [
      {
        kind: 'manipulation',
        control: 'compliance',
        // ARDS-range — a clinically meaningful threshold, not an arbitrary delta.
        condition: { type: 'absolute', operator: '<=', value: 28 },
        require_acknowledgment: {
          question: "You just dropped this patient's compliance to the ARDS range. The pressures rose. The gap between PIP and Pplat:",
          options: [
            { label: 'Stayed about the same — the gap is set by resistance, not compliance', is_correct: true, explanation: "The gap is the R·flow term in the equation of motion. Resistance didn't change, so the gap didn't change." },
            { label: 'Widened — because both pressures rose', is_correct: false, explanation: 'The gap is PIP − Pplat, not their sum. Both rose by similar amounts.' },
            { label: 'Closed completely', is_correct: false, explanation: 'A closed gap means zero airway resistance — very rare even in healthy people on the vent.' },
          ],
        },
      },
      {
        kind: 'manipulation',
        control: 'resistance',
        // Mucus-plug / bronchospasm range.
        condition: { type: 'absolute', operator: '>=', value: 25 },
        require_acknowledgment: {
          question: 'You just spiked resistance — think mucus plug or bronchospasm. Which pressure moved more?',
          options: [
            { label: 'PIP moved much more than Pplat — the gap is now wide', is_correct: true, explanation: "Mucus, bronchospasm, kinked tube — all raise resistance, which lives only in the R·flow term. PIP gets the whole hit; Pplat doesn't." },
            { label: 'Both rose equally', is_correct: false, explanation: "That's the compliance signature. Resistance is asymmetric." },
            { label: "Pplat rose, PIP didn't", is_correct: false, explanation: 'Physically impossible. PIP ≥ Pplat always.' },
          ],
        },
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        'There are two reasons the peak pressure on a vent gets ugly. **Either the lung is the problem, or the airway is the problem.** The bedside test is one button — the inspiratory hold. It tells you which conversation to have.',
    },
    {
      kind: 'callout',
      tone: 'tip',
      markdown:
        'Compute compliance at the bedside every shift: **Vt / (Pplat − PEEP)**. Watch the trend. A patient whose compliance falls from 35 to 25 over a day is heading toward more PEEP, more sedation, and prone positioning.',
    },
    {
      kind: 'predict_observe',
      awaits_control: 'compliance',
      predict:
        "You'll drop this man's compliance from 45 to 25 (the kind of crash you'd see if he aspirated). What rises more — PIP or Pplat?",
      observe:
        "Both rose by about 7. The gap (PIP − Pplat) didn't budge, because the airways didn't change. That's the lung-side signature.",
    },
    {
      kind: 'predict_observe',
      awaits_control: 'resistance',
      predict:
        "Now you'll spike his resistance from 12 to 28 (a mucus plug). What's different this time?",
      observe:
        'PIP shot up. Pplat barely moved. The gap blew open. This is the bedside resistance signature.',
    },
    {
      kind: 'figure',
      caption: 'Compliance pattern vs resistance pattern, with the clinical differentials labeled.',
      ascii:
        'LUNG PROBLEM (compliance ↓)           AIRWAY PROBLEM (resistance ↑)\n' +
        '──────────────────────────            ──────────────────────────\n' +
        '   PIP ┤  ╱‾‾‾┐  ← hold                  PIP ┤  ╱‾‾‾┐  ← hold\n' +
        '         ╱    │                                ╱    │\n' +
        '   Pplat╲    └──                          Pplat╲    └─────\n' +
        '         │                                      │\n' +
        '         │   GAP normal                         │    GAP wide\n' +
        '\n' +
        ' Differential:                          Differential:\n' +
        '  ARDS, pneumonia,                       kinked tube, mucus plug,\n' +
        '  pulm. edema, pneumo,                   bronchospasm, biting,\n' +
        '  mainstem intubation                    secretions',
    },
    {
      kind: 'formative',
      question: 'A patient: Vt 500, PIP 38, Pplat 30, PEEP 8. His static compliance is:',
      options: [
        { label: '13', is_correct: false },
        { label: '23', is_correct: true },
        { label: '16', is_correct: false },
        { label: 'Cannot calculate', is_correct: false },
      ],
      answer:
        'Static compliance = Vt / (Pplat − PEEP) = 500 / (30 − 8) = 500 / 22 ≈ 23. ARDS range. 13 would use PIP (= dynamic compliance). 16 would ignore PEEP.',
    },
  ],

  hint_ladder: {
    tier1: 'Two steps. First, drop the compliance into the ARDS range. The tracker shows you when you\'re there.',
    tier2: 'Step 1: compliance ≤ 28. Step 2 (after the reset): resistance ≥ 25. Then answer the acknowledgment correctly.',
    tier3: { hint_text: 'Use "Show me" to run the active step\'s manipulation, then reset.', demonstration: { control: 'compliance', target_value: 25 } },
  },

  summative_quiz: [
    {
      id: 'M4-Q1',
      prompt: 'Normal compliance of the respiratory system in a ventilated adult is:',
      options: [
        { label: '40–50 mL/cmH2O', is_correct: false, explanation: "That's mildly reduced." },
        { label: '70–80 mL/cmH2O', is_correct: true, explanation: 'Book Ch. 3, Commandment I.' },
        { label: '100 mL/cmH2O', is_correct: false, explanation: "That's normal *off* the vent." },
        { label: '200 mL/cmH2O', is_correct: false, explanation: "That's lung-alone in a healthy person." },
      ],
    },
    {
      id: 'M4-Q2',
      prompt: "A patient with measured compliance of 20 mL/cmH2O and PBW 70 kg has, in Owens's framework:",
      options: [
        { label: 'The lungs of a healthy adult, just with a stiff chest wall.', is_correct: false, explanation: 'In ARDS the chest wall is usually OK; the lungs are smaller, not stiffer.' },
        { label: 'The functional lung volume of a 20 kg child — the baby lung.', is_correct: true, explanation: 'Book Ch. 8. Vt scales to the baby lung, not the adult body.' },
        { label: 'Pulmonary fibrosis.', is_correct: false, explanation: 'Possible cause but the prompt is about what the *number* means.' },
        { label: 'Bronchospasm.', is_correct: false, explanation: "That's resistance, not compliance." },
      ],
    },
    {
      id: 'M4-Q3',
      prompt: 'A 70 kg PBW patient is on Vt 420 (6 mL/kg), Pplat 30, PEEP 10. Driving pressure is 20. The next move:',
      options: [
        { label: "Leave it — Pplat is 30, that's the safe limit.", is_correct: false, explanation: 'DP of 20 is over the lung-protective ceiling (15) even when Pplat is at the limit (Amato 2015).' },
        { label: 'Lower Vt to bring driving pressure down to ≤ 15.', is_correct: true, explanation: 'Vt is the lever; the lungs are small. Book Ch. 8.' },
        { label: 'Raise PEEP — that lowers driving pressure.', is_correct: false, explanation: 'DP = Pplat − PEEP; raising PEEP without lowering Pplat just raises Pplat too.' },
        { label: 'Add a paralytic.', is_correct: false, explanation: "Doesn't change mechanics directly." },
      ],
    },
    {
      id: 'M4-Q4',
      prompt: "You're called for a sudden PIP alarm. PIP 22 → 45. Pplat is 23. First move:",
      options: [
        { label: 'Increase PEEP.', is_correct: false, explanation: "Doesn't address airway resistance." },
        { label: 'Disconnect, bag, suction. The gap is wide — airway problem.', is_correct: true, explanation: 'Book Ch. 2.' },
        { label: 'Get an arterial blood gas.', is_correct: false, explanation: 'Comes later — first fix the airway.' },
        { label: 'Lower Vt.', is_correct: false, explanation: "Pplat is fine; Vt isn't the issue." },
      ],
    },
    {
      id: 'M4-Q5',
      prompt: 'The bedside reading that distinguishes a pure compliance change from a pure resistance change is:',
      options: [
        { label: 'The PEEP setting', is_correct: false, explanation: 'Not affected by either in isolation.' },
        { label: 'The peak-to-plateau gap on an inspiratory hold', is_correct: true, explanation: 'Wide gap → resistance. Unchanged gap → compliance.' },
        { label: 'The Vte', is_correct: false, explanation: 'Unchanged in VCV regardless of which mechanic moved.' },
        { label: 'The FiO2', is_correct: false, explanation: 'Not a mechanical reading.' },
      ],
    },
  ],

  explore_card: {
    patient_context:
      '65-year-old woman, intubated for pneumonia. Right now her lungs are mildly involved. The next two minutes simulate what happens when she gets worse — either lung-wise or airway-wise.',
    unlocked_controls_description: [
      { name: 'Compliance · 20–80', description: "the system's overall stiffness." },
      { name: 'Resistance · 5–35', description: 'airway opposition to flow.' },
      { name: 'PEEP · 0–18', description: 'useful to confirm PEEP raises both pressures additively (third-term demo).' },
    ],
    readouts_description: [
      { name: 'PIP, Pplat, the gap, MVe', description: 'the four numbers to watch as you perturb each term.' },
    ],
    suggestions: [
      'Drop compliance to 25. Both pressures jump. Read your new gap — same as before.',
      'Reset, then raise resistance to 28. PIP jumps; Pplat almost steady. The gap is now the resistance signature.',
      'Try both at once: compliance 25 AND resistance 25. Both pressures up AND a wide gap. ARDS + mucus plug — treat them differently.',
      'Raise PEEP from 5 to 12 (no other changes). Watch PIP and Pplat both rise by 7. PEEP is additive.',
    ],
  },

  user_facing_task:
    "This patient just got sicker. First, his compliance is going to crash — drop the slider into the ARDS range (≤ 28) and explain what the gap does. Then his airway is going to plug up — push resistance into the mucus-plug range (≥ 25) and explain what the gap does.",
  success_criteria_display: [
    'Drop compliance to ≤ 28 — explain the gap.',
    'Raise resistance to ≥ 25 — explain the gap.',
  ],
  task_framing_style: 'A',

  key_points: [
    'Static compliance = Vt / (Pplat − PEEP). Compute it every shift.',
    'Parallel rise (both pressures up, gap unchanged) → lung problem. Differential: ARDS, pneumonia, edema, pneumothorax, mainstem.',
    'Wide gap (PIP up, Pplat near-normal) → airway problem. Differential: kink, plug, bronchospasm.',
    'In ARDS, the lungs aren\'t stiff — they\'re small. Vt scales to the baby lung.',
    'Falling compliance over time is one of the most reliable bad-news signals in the ICU.',
  ],
};
