import type { ModuleConfig } from '../shell/types';

/**
 * MODULE M4 — Compliance and Resistance
 *
 * Track: Physiology · Archetype: concept demo (compound strict, reset_between) · 14 min
 * Anchor chapters: VB Ch. 1, Ch. 2, Ch. 8, Ch. 15
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - tidalVolume: 480 — tracker math assumes baseline PIP ~22, Pplat ~16.
 *                       Smaller Vt blurs the gap and breaks the resistance step.
 *   - compliance variants 20/40/60 — three teaching points; trackers depend on each.
 *
 * Specced verbatim against docs/MODULE_SPECS_v3.md §M4 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §1. See MODULE_SPECS_v3.md Appendix A.
 */
export const M4: ModuleConfig = {
  id: 'M4',
  number: 4,
  title: 'Compliance and Resistance',
  track: 'Physiology',
  estimated_minutes: 14,
  briefing: {
    tagline: 'Compliance lives in the lung. Resistance lives in the airway.',
    overview:
      "**Respiratory-system compliance** is how much volume the lung accepts per unit of pressure — `Vt / ΔP`, measured in mL/cmH2O. A stiff lung takes more pressure to inflate; a floppy lung takes less. **Airway resistance** is how hard it is to push gas through the airways — `ΔP / flow`, measured in cmH2O per (L/s). A narrow, plugged, or kinked airway takes more pressure to move gas; a wide-open airway takes less. Compliance and resistance are the two mechanical properties of the respiratory system, and every pressure reading on a ventilator is some combination of them.",
    what_youll_do: [
      'See how changing compliance changes the measured vent values.',
      'Understand how airway resistance can affect ventilation.',
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
        { label: 'Worsening fluid overload, evolving pneumonia, or new pneumothorax.', is_correct: true, explanation: 'Falling compliance over hours-to-days is a structural change in the lung — look for the new pathology.' },
        { label: 'The PEEP is too high.', is_correct: false, explanation: 'Excess PEEP can overdistend, but compliance is a longer-timescale signal.' },
        { label: 'The ventilator is in the wrong mode.', is_correct: false, explanation: "Mode doesn't change compliance." },
      ],
    },
    {
      id: 'M4-P3',
      prompt: 'The "baby lung" concept means:',
      options: [
        { label: "Children's lungs handle the vent differently than adults'.", is_correct: false, explanation: 'Pediatric mechanics aside; the term is about adults.' },
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
    // inspiratory_pause and expiratory_pause unlock the hold buttons that
    // the guided walkthrough teaches at the start of Try-It.
    unlocked_controls: ['compliance', 'resistance', 'peep', 'inspiratory_pause', 'expiratory_pause'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'vte', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  // Strict, one-step-at-a-time walkthrough. Before any questions or any
  // mechanic changes, the learner is taught what the INSP HOLD and EXP
  // HOLD buttons actually do — then they see how compliance and resistance
  // each change the pressure picture.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    present_one_at_a_time: true,
    observations: [
      // 1: Press INSP HOLD
      "You just performed an inspiratory hold. The vent closed both valves at end-inspiration and froze the breath inside the lung. With flow stopped, the airway and the alveoli equilibrate — the pressure reading drops from PIP (the peak you saw during flow) to **Pplat (plateau pressure)**, the pressure inside the alveoli. PIP includes the cost of pushing gas through the airway; Pplat is the lung itself. Note the two numbers and the gap between them.",
      // 2: Press EXP HOLD
      "You just performed an expiratory hold. The vent closed both valves at end-expiration, with no fresh breath delivered. With flow stopped, the airway equilibrates with the alveoli — what you see is **total PEEP**, the actual end-expiratory pressure inside the lung. If the patient is fully exhaling, total PEEP equals set PEEP. If there's air trapping, total PEEP is higher than set PEEP, and the difference is auto-PEEP. The exp hold is the only way to measure it.",
      // 3: Compliance drop
      "Both PIP and Pplat rose. They rose by *the same amount* — the gap between them didn't change. That's the signature of a lung-side problem: lower compliance means the lung accepts less volume per unit of pressure, so any given Vt now costs more pressure to deliver. The airway didn't change, so the part of the peak pressure that comes from pushing gas through the airway is unchanged.",
      // 4: Resistance spike
      "PIP jumped. Pplat barely moved. The gap between them blew open. That's the signature of an airway-side problem: higher resistance means it takes more pressure to push gas through the tube and bronchi *while gas is moving*. As soon as flow stops on the inspiratory hold, the cost of resistance disappears — that's why Pplat is unchanged. **Wide PIP–Pplat gap → airway. Both up together → lung.**",
    ],
    children: [
      // Step 1 — Press INSP HOLD (any change counts).
      {
        kind: 'manipulation',
        control: 'inspiratory_pause',
        condition: { type: 'any_change' },
      },
      // Step 2 — Press EXP HOLD.
      {
        kind: 'manipulation',
        control: 'expiratory_pause',
        condition: { type: 'any_change' },
      },
      // Step 3 — Drop compliance into ARDS range.
      {
        kind: 'manipulation',
        control: 'compliance',
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
      // Step 4 — Spike resistance (mucus-plug range).
      {
        kind: 'manipulation',
        control: 'resistance',
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
      kind: 'prose',
      markdown:
        "**The hold buttons.** Two buttons on every ventilator let you freeze flow and read static pressures.\n\n**INSP HOLD (inspiratory hold)** closes the inspiratory *and* expiratory valves at end-inspiration, trapping the breath in the lung. With flow stopped, what you see is **plateau pressure (Pplat)** — the pressure inside the alveoli once the airway and lung have equilibrated. The difference between PIP (during flow) and Pplat (no flow) is the cost of pushing gas through the airway — it's the resistance signal.\n\n**EXP HOLD (expiratory hold)** closes both valves at end-expiration. With flow stopped, what you see is **total PEEP** — the actual end-expiratory pressure inside the lung. If total PEEP > set PEEP, the patient has **auto-PEEP** (air trapping). The exp hold is the only way to measure it.\n\nThe Try-It section will walk you through both buttons before you change anything else.",
    },
    {
      kind: 'callout',
      tone: 'tip',
      markdown:
        'Compute compliance at the bedside every shift: **Vt / (Pplat − PEEP)**. Watch the trend. A patient whose compliance falls from 35 to 25 over a day is heading toward more PEEP, more sedation, and prone positioning.',
    },
    {
      kind: 'predict_mcq',
      awaits_control: 'compliance',
      predict:
        "You're about to drop this patient's compliance from 45 to 25 (an aspiration-pattern crash). PIP and Pplat both rise — by how much do they differ?",
      options: [
        { label: 'Both rise by about the same amount; the gap is unchanged.', is_correct: true },
        { label: 'PIP rises more than Pplat — the gap widens.', is_correct: false, explanation: "That's the resistance signature, not compliance. Resistance lives in the R·flow term, which only appears in the peak." },
        { label: 'Pplat rises more than PIP — the gap shrinks.', is_correct: false, explanation: 'Physically impossible — Pplat is always ≤ PIP (PIP = Pplat + the resistance contribution).' },
        { label: 'Neither moves — compliance is a property of the patient, not the vent display.', is_correct: false, explanation: "Compliance drives the V/C term in the equation of motion; falling compliance directly raises plat (and PIP carries plat's rise upward)." },
      ],
      observe:
        "Both rose by about 7. The gap (PIP − Pplat) didn't budge, because the airways didn't change. That's the lung-side signature.",
    },
    {
      kind: 'predict_mcq',
      awaits_control: 'resistance',
      predict:
        "Now you'll spike his resistance from 12 to 28 (a mucus plug). How does the pressure response differ from the compliance case above?",
      options: [
        { label: 'PIP rises more than Pplat — the gap widens.', is_correct: true },
        { label: 'Both rise equally — same as compliance.', is_correct: false, explanation: "That's the compliance signature. Resistance is asymmetric — it loads PIP but not Pplat (because resistance only matters while flow is moving)." },
        { label: 'Pplat rises more than PIP — the gap shrinks.', is_correct: false, explanation: 'Cannot happen. Pplat is always ≤ PIP.' },
        { label: 'Neither moves — the vent compensates for changing resistance.', is_correct: false, explanation: "In VCV, the vent delivers the set Vt regardless of resistance; the cost shows up as higher PIP." },
      ],
      observe:
        'PIP shot up. Pplat barely moved. The gap blew open. This is the bedside resistance signature.',
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
    tier1: 'Four steps. The TaskCard shows the active one — press the named button or move the named knob.',
    tier2: 'Step 1: INSP HOLD button (top of the controls card). Step 2: EXP HOLD. Step 3: compliance ≤ 28. Step 4: resistance ≥ 25, then answer the acknowledgments.',
    tier3: { hint_text: 'Press the INSP HOLD or EXP HOLD button at the top of the ventilator controls, then drop compliance to ~25 and raise resistance to ~28.' },
  },

  summative_quiz: [
    {
      id: 'M4-Q1',
      prompt: 'Normal compliance of the respiratory system in a ventilated adult is:',
      options: [
        { label: '40–50 mL/cmH2O', is_correct: false, explanation: "That's mildly reduced." },
        { label: '70–80 mL/cmH2O', is_correct: true, explanation: 'Healthy off the vent is closer to 100; the intubated baseline drops some because of the tube and circuit.' },
        { label: '100 mL/cmH2O', is_correct: false, explanation: "That's normal *off* the vent." },
        { label: '200 mL/cmH2O', is_correct: false, explanation: "That's lung-alone in a healthy person." },
      ],
    },
    {
      id: 'M4-Q2',
      prompt: 'A patient with measured compliance of 20 mL/cmH2O and PBW 70 kg has, by the baby-lung concept:',
      options: [
        { label: 'The lungs of a healthy adult, just with a stiff chest wall.', is_correct: false, explanation: 'In ARDS the chest wall is usually OK; the lungs are smaller, not stiffer.' },
        { label: 'The functional lung volume of a 20 kg child — the baby lung.', is_correct: true, explanation: 'Book Ch. 8. Vt scales to the baby lung, not the adult body.' },
        { label: 'Pulmonary fibrosis.', is_correct: false, explanation: 'Possible cause but the prompt is about what the *number* means.' },
        { label: 'Bronchospasm.', is_correct: false, explanation: "That's resistance, not compliance." },
      ],
    },
    // Novice-pass §4.3 — driving-pressure titration belongs in M7/M15.
    // Replace with the gap-signature interpretation M4 actually teaches.
    {
      id: 'M4-Q3',
      prompt: 'You do an inspiratory hold. PIP reads 42. Pplat reads 20. PEEP is 5. What does the gap tell you?',
      options: [
        { label: 'Resistance is high — airway problem (mucus, bronchospasm, kinked tube).', is_correct: true, explanation: 'PIP – Pplat = 22, far above the normal < 5. The flow term (R × flow) is enormous; that\'s the resistance signature. Book Ch. 2.' },
        { label: 'Compliance is low — lung problem (ARDS, edema, pneumothorax).', is_correct: false, explanation: 'A compliance problem pushes Pplat UP. Pplat here is only 20 (driving pressure 15) — the lung itself looks acceptable.' },
        { label: 'Both — the gap is wide AND the plateau is high.', is_correct: false, explanation: 'Plateau is 20, not high. If the plateau were 30+ on top of the wide gap, it would be both.' },
        { label: 'Neither — those are normal numbers.', is_correct: false, explanation: 'Normal PIP–Pplat is < 5 cmH2O. A gap of 22 is a striking abnormality.' },
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
    // Novice-pass §4.1: explicit "compliance isn't really a knob" framing.
    // Novice-pass §4.2: zone labels so a learner reading "set compliance to 28"
    // has a clinical anchor for what that means.
    patient_context:
      "65-year-old woman, intubated for pneumonia. Her lungs are mildly involved right now. Over the next two minutes you'll simulate what happens when she gets worse — first lung-wise, then airway-wise.\n\nTwo rose-labeled knobs appear in the control row just for this module: Compliance and Resistance. In real life you can't turn a knob to change a patient's mechanics — they're properties of the lungs — but here the knobs let you make her lungs stiffer or her airways narrower on demand so you can see exactly what each one does to the pressure picture.\n\nFor reference, compliance zones run roughly: normal 60–80, mild ARDS 40–60, moderate 28–40, severe at or below 28. The success criterion (compliance ≤ 28) is the severe-ARDS threshold.",
    unlocked_controls_description: [
      { name: 'Compliance · 20–80', description: "the system's overall stiffness. Normal 60–80 · Mild ARDS 40–60 · Moderate 28–40 · Severe ≤ 28." },
      { name: 'Resistance · 5–35', description: 'airway opposition to flow. Healthy intubated 5–10 · Mild bronchospasm 15–20 · Severe ≥ 25.' },
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
    "Four steps, one at a time. First you'll press the two hold buttons and read off Pplat and total PEEP. Then you'll drop the patient's compliance into the ARDS range and watch the pressure picture change. Finally you'll spike her airway resistance and see the gap blow open.",
  success_criteria_display: [
    'Press INSP HOLD — read off Pplat and the PIP–Pplat gap.',
    'Press EXP HOLD — read off total PEEP.',
    'Drop the Compliance knob to ≤ 28 — watch PIP and Pplat rise together.',
    'Raise the Resistance knob to ≥ 25 — watch the PIP–Pplat gap blow open.',
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
