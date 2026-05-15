import type { ModuleConfig } from '../shell/types';

/**
 * M3 — Basic Vent Adjustments  (D2)
 *
 * Replaces the old M3 (Equation of Motion), which moved to Physiology
 * as M-EOM after M4/M5. The Foundations track now closes with this
 * knob-tour module: four basic adjustments, each made in isolation,
 * each with its own "what just happened" prose. The learner doesn't
 * have to interpret the equation of motion — they just have to feel
 * which knob moves which number on the display.
 *
 * Implementation uses the new `present_one_at_a_time` compound flag
 * (A6): step → observation → "Next →" → next step.
 *
 * Track: Foundations · Archetype: guided knob walk-through · 14 min
 * Anchor chapters: VB Ch. 1, Ch. 11
 */
export const M3: ModuleConfig = {
  id: 'M3',
  number: 3,
  title: 'Basic Vent Adjustments',
  track: 'Foundations',
  estimated_minutes: 14,
  briefing: {
    tagline: 'Move the knobs. Watch the screen change.',
    overview:
      "Once you can read the ventilator (M1, M2), the next thing to learn is what each knob actually does to the screen. Four basic adjustments — tidal volume, respiratory rate, PEEP, and FiO2 — cover most of what you'll do at the bedside. You'll make each change one at a time and watch how the measured values respond. No physiology theory yet — just the basic cause-and-effect between every control and every readout.",
    what_youll_do: [
      'Raise the tidal volume. Watch PIP rise. Watch Vte rise to match.',
      'Raise the rate. Watch minute ventilation rise.',
      "Raise PEEP. Watch PIP rise in parallel with it — they're additive.",
      'Raise FiO2. Watch the waveform NOT change. FiO2 is its own lever.',
    ],
  },

  visible_learning_objectives: [
    'Identify which readout responds to each of the four basic controls.',
    'Predict the effect of changing tidal volume, rate, PEEP, or FiO2 in isolation.',
    'Recognize that FiO2 affects gas concentration, not pressure/volume readings.',
  ],

  primer_questions: [
    {
      id: 'M3-P1',
      prompt: 'Which of these is a SET value (something the clinician orders), not a measured value?',
      options: [
        { label: 'PIP (peak inspiratory pressure)', is_correct: false, explanation: 'PIP is measured — what the system actually generates each breath. Depends on compliance and resistance.' },
        { label: 'Set tidal volume (Vt)', is_correct: true, explanation: 'You order it; the vent delivers it (in volume-control modes). Distinct from Vte, which is the measured volume coming back out.' },
        { label: 'Vte (exhaled tidal volume)', is_correct: false, explanation: 'Vte is measured. It should match your set Vt closely in VCV, but it\'s a separate readout.' },
        { label: 'Total PEEP', is_correct: false, explanation: 'Total PEEP is measured. Equals set PEEP plus any auto-PEEP.' },
      ],
    },
    {
      id: 'M3-P2',
      prompt: 'You raise the set tidal volume from 400 to 500 mL. At constant compliance and resistance, what happens to PIP?',
      options: [
        { label: 'PIP falls — bigger Vt is easier to deliver.', is_correct: false, explanation: 'Backwards. More volume means more pressure needed to deliver it.' },
        { label: 'PIP rises.', is_correct: true, explanation: 'More volume into the same compliance means a higher alveolar pressure, and a higher peak. Book Ch. 1.' },
        { label: 'PIP is unchanged.', is_correct: false, explanation: 'PIP scales with Vt. Same compliance + bigger Vt = higher PIP.' },
        { label: 'PIP becomes unstable.', is_correct: false, explanation: 'Not unstable — predictably higher.' },
      ],
    },
    {
      id: 'M3-P3',
      prompt: 'You raise the set respiratory rate from 12 to 18. What happens to minute ventilation (MVe)?',
      options: [
        { label: 'MVe falls.', is_correct: false, explanation: 'More breaths per minute moves more air per minute.' },
        { label: 'MVe rises.', is_correct: true, explanation: 'MVe = Vte × measured rate. More breaths = more total air per minute. Often used to clear extra CO2.' },
        { label: 'MVe is unchanged because Vt is the same.', is_correct: false, explanation: 'MVe depends on BOTH rate and Vt. Holding Vt and raising rate raises MVe.' },
        { label: 'MVe drops because each breath is smaller.', is_correct: false, explanation: 'Set Vt is unchanged. Rate is going up. MVe rises.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'M3_basic_knobs_vcv',
    preset: {
      // Healthy-ish patient, mid-range starting values so every adjustment
      // in either direction is comfortable. Compliance + resistance LOCKED
      // (this is a knob tour, not physiology).
      mode: 'VCV',
      settings: { tidalVolume: 400, respiratoryRate: 12, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 60, resistance: 10, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    unlocked_controls: ['tidalVolume', 'respiratoryRate', 'peep', 'fiO2'],
    visible_readouts: ['pip', 'plat', 'vte', 'mve', 'totalPeep', 'actualRate', 'ieRatio'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  /**
   * A6 sequential walk-through. Each step:
   *  - reveals one direction at a time on the TaskCard,
   *  - waits for the learner to make the change,
   *  - shows an "observation" prose block + "Next →" button,
   *  - then advances. The final "Finish →" satisfies the objective.
   *
   * Per-step manipulation thresholds are intentionally modest so any
   * sensible adjustment in the right direction counts (the lesson is
   * cause-and-effect, not hitting a precise target).
   */
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    present_one_at_a_time: true,
    observations: [
      "PIP rose. So did Vte (the measured exhaled volume). The vent had to push harder to deliver the bigger breath, and the same volume came back out. The peak pressure is a measurement — you didn't change it directly, but it followed your tidal-volume order.",
      "Minute ventilation (MVe) climbed. The set respiratory rate is the *minimum* the vent will deliver, so raising it pushes more breaths per minute through the lungs. The I:E ratio also tightened because each breath now has less time before the next one.",
      "PIP rose by about the same amount you raised PEEP. They're additive: every cmH2O you add to the floor shows up at the peak too. Total PEEP equals what you set — there's no auto-PEEP in this stable patient.",
      // Novice-pass §3.3 — closing synthesis appended to the FiO2-step
      // observation so the module doesn't end abruptly.
      "Nothing on the waveform changed. FiO2 is the fraction of oxygen in the gas the vent delivers — it changes the inspired gas mixture, not the pressure or volume profile.\n\n**You just learned:** three of these four knobs change the pressure or volume waveform. FiO2 is the odd one out — it changes what the lungs *receive* without changing how the breath is *delivered*. The next module digs into the lung itself — compliance and resistance — and shows why those same four knobs feel different in a sick lung than a healthy one.",
    ],
    children: [
      // Novice-pass §3.1 — relaxed thresholds. The old 20/30/50% gates
      // were invisible: a learner who nudged Vt 400→460 (15%) saw
      // nothing and assumed the sim was broken. 10% bypasses tiny
      // accidental movements but still fires on a deliberate adjustment.
      // Step 1 — raise Vt by ≥ 10% → watch PIP + Vte rise.
      {
        kind: 'manipulation',
        control: 'tidalVolume',
        condition: { type: 'delta_pct', direction: 'increase', min_pct: 10 },
      },
      // Step 2 — raise rate by ≥ 10% → watch MVe rise.
      {
        kind: 'manipulation',
        control: 'respiratoryRate',
        condition: { type: 'delta_pct', direction: 'increase', min_pct: 10 },
      },
      // Step 3 — raise PEEP by ≥ 10% → watch PIP rise in parallel.
      {
        kind: 'manipulation',
        control: 'peep',
        condition: { type: 'delta_pct', direction: 'increase', min_pct: 10 },
      },
      // Step 4 — change FiO2 → watch nothing happen on the waveform.
      {
        kind: 'manipulation',
        control: 'fiO2',
        condition: { type: 'any_change' },
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        "Every ventilator has four basic knobs. **Tidal volume** sets how big each breath is. **Rate** sets how many breaths per minute. **PEEP** sets the floor of pressure at end-expiration. **FiO2** sets how much oxygen is in the gas. That's most of the bedside dial-turning in plain volume-control ventilation.",
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown:
        "Three of these knobs change something you can see on the pressure or flow waveform. One of them — FiO2 — doesn't change the waveform at all; it changes the gas concentration. That's a useful early instinct: not every knob talks to every readout.",
    },
    {
      kind: 'prose',
      markdown:
        "**Vt and PIP travel together.** Bigger Vt at the same compliance means a higher peak pressure. The vent has to push harder. Measured Vte should match your set Vt closely (unless there's a leak).",
    },
    {
      kind: 'prose',
      markdown:
        "**Rate and minute ventilation travel together.** More breaths per minute = more total air per minute = more CO2 cleared. The I:E ratio tightens (less expiratory time per breath) as you raise rate at a fixed I-time.",
    },
    {
      kind: 'prose',
      markdown:
        "**PEEP raises the floor — and the peak.** Every cmH2O you add to PEEP shows up at the peak as well. They're additive because PEEP is the third term in the equation of motion (you'll see that explicitly in the Physiology track).",
    },
    {
      kind: 'prose',
      markdown:
        "**FiO2 is independent.** Changing it doesn't move PIP, Pplat, MVe, or any pressure readout. It changes what the patient is breathing, not how. Treat it as its own lever.",
    },
    // v3.2 §0.6 — M3 currently uses sequential observations in the Try-It;
    // this gated MCQ anchors the four-knob mental model before the
    // walk-through.
    {
      kind: 'predict_mcq',
      predict:
        "Of these four basic ventilator knobs, which one's adjustment does NOT directly change anything on the pressure or flow waveform?",
      options: [
        { label: 'Tidal volume.', is_correct: false, explanation: 'Vt drives PIP and Vte directly — that\'s a visible waveform change every breath.' },
        { label: 'Rate.', is_correct: false, explanation: 'Rate changes the spacing of breaths on the time axis and shrinks the I:E ratio — visible immediately.' },
        { label: 'PEEP.', is_correct: false, explanation: 'PEEP raises the floor and the peak of the pressure trace together — a parallel shift.' },
        { label: 'FiO2.', is_correct: true },
      ],
      observe:
        "FiO2 changes the gas mixture the vent delivers — it doesn't move the pressure or volume profile. The waveform is identical whether FiO2 is 30% or 100%. Treat it as its own independent lever.",
    },
  ],

  hint_ladder: {
    tier1: 'Read the current step. It tells you exactly which control to change.',
    tier2: 'Use the +/− buttons on the named control. The change can be small — the sim just wants to see motion in the right direction.',
    tier3: { hint_text: 'For step 1, raise tidal volume from 400 to about 500.', demonstration: { control: 'tidalVolume', target_value: 500 } },
  },

  summative_quiz: [
    {
      id: 'M3-Q1',
      prompt: 'You raise tidal volume from 400 to 500 mL at constant compliance. The expected change in PIP is:',
      options: [
        { label: 'PIP falls', is_correct: false, explanation: 'More volume requires more pressure to deliver, not less.' },
        { label: 'PIP rises', is_correct: true, explanation: 'Same compliance, bigger Vt → higher peak pressure. You can predict this without measuring.' },
        { label: 'PIP is unchanged', is_correct: false, explanation: 'PIP scales with Vt.' },
        { label: 'PIP becomes negative', is_correct: false, explanation: 'Peak airway pressure is always positive during a delivered breath.' },
      ],
    },
    {
      id: 'M3-Q2',
      prompt: 'You raise the respiratory rate from 12 to 20 at constant Vt. The expected change in MVe is:',
      options: [
        { label: 'MVe falls because each breath is smaller', is_correct: false, explanation: 'Set Vt is unchanged. Rate went up. MVe must rise.' },
        { label: 'MVe rises', is_correct: true, explanation: 'MVe = Vte × measured rate. Roughly +66% more breaths per minute → roughly +66% MVe.' },
        { label: 'MVe is unchanged', is_correct: false, explanation: 'Only true if Vt were dropping in compensation; it isn\'t.' },
        { label: 'MVe oscillates', is_correct: false, explanation: 'Not unstable — predictably higher.' },
      ],
    },
    {
      id: 'M3-Q3',
      prompt: 'You raise PEEP from 5 to 10. PIP was 22. The expected new PIP is approximately:',
      options: [
        { label: 'About 27', is_correct: true, explanation: 'PEEP raises the floor; PIP rises by roughly the same amount. They\'re additive. Book Ch. 1.' },
        { label: 'About 17', is_correct: false, explanation: 'PEEP doesn\'t lower PIP — it raises it.' },
        { label: 'Unchanged at 22', is_correct: false, explanation: 'PEEP and PIP both share the baseline. Raise the baseline; the peak follows.' },
        { label: 'About 44 (double)', is_correct: false, explanation: 'PEEP is additive, not multiplicative.' },
      ],
    },
    {
      id: 'M3-Q4',
      prompt: 'You change FiO2 from 40% to 60%. The pressure and flow waveforms are:',
      options: [
        { label: 'Unchanged', is_correct: true, explanation: 'FiO2 changes the gas mixture the vent delivers — not the volume or pressure profile of each breath. The waveform is identical.' },
        { label: 'Higher in amplitude', is_correct: false, explanation: 'Waveform amplitude is set by Vt and compliance, not FiO2.' },
        { label: 'Lower in amplitude', is_correct: false, explanation: 'Same reason — FiO2 is independent of the pressure curve.' },
        { label: 'Inverted', is_correct: false, explanation: 'Nothing about FiO2 inverts the waveform.' },
      ],
    },
    {
      id: 'M3-Q5',
      prompt: 'PIP just jumped from 22 to 32 while everything else stayed the same. Of the four basic controls, the most likely one you just changed is:',
      options: [
        { label: 'FiO2 (you raised it)', is_correct: false, explanation: 'FiO2 doesn\'t move PIP at all.' },
        { label: 'Vt (you raised it) — or PEEP (you raised it)', is_correct: true, explanation: 'Both move PIP in the same direction. Vt scales it; PEEP adds to it. Look at Vte and total PEEP to tell which one.' },
        { label: 'Rate (you lowered it)', is_correct: false, explanation: 'Rate changes MVe and I:E — not PIP per breath at a fixed Vt.' },
        { label: 'None of the above could do this', is_correct: false, explanation: 'Vt or PEEP could do it cleanly.' },
      ],
    },
  ],

  explore_card: {
    patient_context:
      "Stable patient, healthy lungs, on routine volume-control settings. There's no clinical fire here — your job is just to explore which knob talks to which readout. The compliance and resistance are locked; everything else is yours to move.",
    unlocked_controls_description: [
      { name: 'Tidal volume (set Vt) · 350–600 mL', description: 'volume per breath. Move it; watch PIP and Vte respond.' },
      { name: 'Rate · 8–24 breaths/min', description: 'breaths per minute. Move it; watch MVe and I:E respond.' },
      { name: 'PEEP · 0–18 cmH2O', description: 'end-expiratory floor. Move it; watch PIP rise in parallel.' },
      { name: 'FiO2 · 21–100%', description: 'fraction of inspired oxygen. Move it; watch nothing else change.' },
    ],
    readouts_description: [
      { name: 'PIP, Pplat, Vte', description: 'the per-breath pressure and volume readings.' },
      { name: 'MVe, actual rate, I:E', description: 'the per-minute and breath-timing readings.' },
      { name: 'Total PEEP', description: 'the measured floor — should equal set PEEP unless there\'s auto-PEEP.' },
    ],
    suggestions: [
      'Try raising Vt from 400 to 550 in two clicks. Watch PIP. Watch Vte.',
      "Try cutting the rate from 12 to 8. Minute ventilation drops. The I:E ratio loosens because there's more time between breaths.",
      'Try raising PEEP from 5 to 12. PIP rises by about 7. Total PEEP rises with it.',
      "Try changing FiO2. Nothing on the waveform moves. That's the point.",
    ],
  },

  user_facing_task:
    "Four basic adjustments, one at a time. After each change, you'll see exactly what happened on the screen and click Next to go to the next adjustment.",
  // success_criteria_display intentionally omitted — the sequential UI
  // surfaces ONE step at a time. The full list isn't shown.
  task_framing_style: 'A',

  key_points: [
    'Vt and PIP travel together — bigger breath, higher peak.',
    'Rate and MVe travel together — more breaths, more minute ventilation.',
    'PEEP raises the floor AND the peak — they\'re additive.',
    'FiO2 is an independent lever — it changes gas concentration, not pressure or volume.',
    'Read every change you make. The readout that changes is the one your knob talks to.',
  ],
};
