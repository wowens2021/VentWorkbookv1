import type { ModuleConfig } from '../shell/types';

/**
 * MODULE M9 — PRVC and Dual-Control Ventilation
 *
 * Track: Modes · Archetype: outcome with sandbox exploration · 20 min
 * Anchor chapters: VB Ch. 9
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 30, resistance: 12 — adaptive PINSP cycle lands in expected band.
 *   - perturbation script: at t=30s of Try-It, spontaneousRate flips to 24,
 *                          effortAmplitude high. The sim must produce a
 *                          PINSP swing of ≥4 cmH2O over 6 breaths under
 *                          this perturbation for the yo-yo recognition to
 *                          be visually rendered.
 *
 * [BLOCKED-SIM] PinspSwing6 measurement is the long-term tracker shape
 * required by spec §6 v3.1. The current sim cannot directly compute it.
 * The Try-It uses an implementable proxy (drop compliance → PIP climbs)
 * and exposes mode-switching so the learner's correct response —
 * switching out of PRVC — is still scored. See content_blocks for the
 * read-side honest disclaimer.
 *
 * Specced against docs/MODULE_SPECS_v3.md §M9 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §6. See MODULE_SPECS_v3.md Appendix A.
 */
export const M9: ModuleConfig = {
  id: 'M9',
  number: 9,
  title: 'PRVC and Dual-Control Ventilation',
  track: 'Modes',
  estimated_minutes: 20,
  // v3.2 §2.3 — briefing rewritten. The module is now "watch the algorithm
  // work" not "recognize and respond to dyssynchrony." The yo-yo failure
  // mode is read-only.
  briefing: {
    tagline: 'Volume target. Pressure-limited. Watch the algorithm work.',
    overview:
      "PRVC tries to give you the predictability of volume control with the safety of pressure control. You set a volume target; the vent picks the pressure to hit it, breath by breath. In this module you'll induce a sudden drop in compliance and watch the algorithm ramp the inspiratory pressure up over a few breaths to keep delivered volume on target. You'll also read about a specific failure mode — the yo-yo in awake patients with strong drive — that the simulator doesn't render but that you'll see at the bedside.",
    what_youll_do: [
      'PRVC adjusts pressure breath by breath to hit a volume target.',
      "It's pressure-limited, so peaks can't run away.",
      "The yo-yo failure mode is read-only — you'll learn the pattern in the read phase, not on the sim.",
    ],
  },

  visible_learning_objectives: [
    'State what PRVC does: targets a set Vt by adjusting PINSP breath-by-breath.',
    'Distinguish PRVC from VCV (flow pattern) and from PCV (closed-loop target).',
    "Predict when PRVC's adaptive PINSP helps (changing compliance) and when it harms (strong patient drive — the yo-yo).",
    'Name the fix for PRVC dyssynchrony: switch to a non-adaptive mode (VCV or PCV).',
  ],

  primer_questions: [
    {
      id: 'M9-P1',
      prompt: 'PRVC differs from PCV in that:',
      options: [
        { label: 'PRVC uses constant flow; PCV uses decelerating flow.', is_correct: false, explanation: 'Both deliver decelerating flow.' },
        { label: 'PRVC adjusts PINSP breath-by-breath to hit a target Vt; PCV does not.', is_correct: true, explanation: "Book Ch. 9. That's the adaptive-control feature." },
        { label: 'PRVC has no I-time setting.', is_correct: false, explanation: 'PRVC requires Vt, rate, and I-time.' },
        { label: 'PRVC guarantees a constant peak pressure.', is_correct: false, explanation: 'The opposite — peak pressure changes as the vent adapts.' },
      ],
    },
    {
      id: 'M9-P2',
      prompt: 'In PRVC, the ventilator adjusts the inspiratory pressure when:',
      options: [
        { label: "The patient's compliance changes.", is_correct: false, explanation: "True — but it's the cause. The vent senses it through the tidal volume." },
        { label: "The measured tidal volume drifts away from the target.", is_correct: true, explanation: 'Book Ch. 9. The vent measures the resulting Vt and adjusts PINSP to keep it at the target. Compliance changes are the most common cause of the Vt drift.' },
        { label: 'The clinician changes the target Vt.', is_correct: false, explanation: 'True but trivial.' },
        { label: 'The patient triggers a breath.', is_correct: false, explanation: 'Triggering does not, by itself, change the adaptive logic.' },
      ],
    },
    {
      id: 'M9-P3',
      prompt: 'A patient on PRVC with target Vt 500 develops air hunger. Over 30 seconds, you watch his PINSP fall from 18 to 10, then climb back to 22, then fall again. The most likely interpretation is:',
      options: [
        { label: 'The vent is malfunctioning.', is_correct: false, explanation: 'This is normal PRVC behavior under heavy patient effort.' },
        { label: 'The patient is yo-yoing the adaptive logic: he pulls a big breath, the vent reads "compliance improved" and lowers PINSP, then his next breaths are short and the vent compensates by raising PINSP.', is_correct: true, explanation: 'Book Ch. 9, dual-control failure mode.' },
        { label: 'The compliance is rapidly changing.', is_correct: false, explanation: 'Unlikely — physiology rarely oscillates at this frequency.' },
        { label: 'The PEEP is unstable.', is_correct: false, explanation: 'PEEP is fixed.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'M9_prvc_baseline',
    preset: {
      // ARDS-pattern compliance. The vent computes a starting PINSP ~18
      // to hit Vt 450. The Try-It task drops compliance and watches the
      // adaptive PI ramp PIP up over several breaths.
      // PIN: compliance 30, resistance 12 — DO NOT CHANGE.
      mode: 'PRVC',
      settings: { tidalVolume: 450, respiratoryRate: 14, peep: 8, fiO2: 45, iTime: 1.0 },
      patient: { compliance: 30, resistance: 12, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    // Spec §6 v3.1: `mode` is unlocked HERE specifically — the correct
    // intervention for PRVC dyssynchrony is to switch out of PRVC into
    // VCV or PCV. Every other module locks mode; this is the one
    // exception where mode-switching is the lesson.
    unlocked_controls: ['mode', 'tidalVolume', 'respiratoryRate', 'peep', 'fiO2', 'iTime', 'compliance'],
    visible_readouts: ['pip', 'plat', 'vte', 'drivingPressure', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  // Adapted from the spec's "PINSP swing" tracker (not directly implementable
  // in this sim). The proxy: drop compliance, watch the adaptive PI ramp
  // PIP up over several breaths (the M9 visual cue from MASTER_SHELL_v3 §6
  // flashes PIP each adaptive step), then a recognition consolidates.
  // v3.2 §2.4 — strip the recognition-question child. The predict_mcq in
  // the read phase already gates the learning; the live module just needs
  // the manipulation + outcome to show the algorithm working.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    children: [
      {
        kind: 'manipulation',
        control: 'compliance',
        condition: { type: 'delta_pct', direction: 'decrease', min_pct: 40 },
      },
      {
        kind: 'outcome',
        readouts: { pip: { operator: '>=', value: 22 } },
        sustain_breaths: 4,
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        "PRVC and its cousins (CMV-Autoflow, VC+) try to give you the best of VCV and PCV. You set the Vt you want, and the vent figures out the PINSP needed to deliver it, breath by breath, using a decelerating flow. When compliance improves, PINSP drops. When compliance worsens, PINSP rises. **Most of the time, that's a feature.**",
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown: "PRVC is a pressure-control mode for people who don't like pressure-control. It's the same delivery pattern; it just has a closed-loop volume target on top.",
    },
    {
      // v3.2 §2.5 — predict_mcq covers the correct algorithm behavior.
      kind: 'predict_mcq',
      awaits_control: 'compliance',
      predict:
        "You drop this patient's compliance from 30 to 18 — a sudden ARDS-like worsening. Over the next several breaths the vent will:",
      options: [
        { label: 'Hold PIP constant; Vt will fall.', is_correct: false, explanation: "That's PCV. PRVC adjusts pressure to keep volume on target." },
        { label: 'Hold Vt constant; PIP will rise breath by breath.', is_correct: true },
        { label: 'Switch to volume-control automatically.', is_correct: false, explanation: "PRVC doesn't mode-switch; it adapts within its own mode." },
        { label: 'Nothing — the breath-by-breath adjustments are too small to see.', is_correct: false, explanation: "The adjustments are visible. You'll see PIP halos flash each adaptive step." },
      ],
      observe:
        "PRVC senses Vt drift and corrects PINSP to compensate. With sudden worsening compliance, the algorithm ramps PINSP up over 4-5 breaths, holding Vt at target. You see the algorithm work in real time. This is what closed-loop control looks like when conditions stay stable.",
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        'The fix for PRVC dyssynchrony is **not** to add sedation. The fix is to switch to a non-adaptive mode (VCV or PCV) and then address why the patient was agitated.',
    },
    {
      // v3.2 §2.5 — yo-yo callout replaces the (now-removed) recognition
      // child as the place this failure mode lives. The sim shows the
      // algorithm working; the prose shows how it breaks at the bedside.
      kind: 'callout',
      tone: 'warn',
      markdown:
        "**The yo-yo: the sim can't show you this, but the bedside will.** In an awake patient with strong drive, the algorithm misreads the patient's effort as 'compliance improved' and lowers PINSP. The next breath is therefore smaller, the algorithm reads 'compliance worsened,' and ramps PINSP back up. Over 30-60 seconds you see the PINSP cycle visibly: 12 → 22 → 12 → 22, while Vt stays on target. The patient is uncomfortable. The fix is to switch to a non-adaptive mode (VCV or PCV) and address why the patient is agitated. Not sedation — sedation buries the diagnostic information.",
    },
  ],

  hint_ladder: {
    tier1: 'Watch the PINSP / PIP trace, not the Vt trace. PRVC keeps Vt constant by *changing* pressure.',
    tier2: 'Drop compliance to ~18 and just wait. The vent ramps PIP up over 4–5 breaths. PIP halos flash each time it adapts.',
    tier3: { hint_text: 'Use "Show me" to drop compliance for you, then wait and confirm.', demonstration: { control: 'compliance', target_value: 18 } },
  },

  summative_quiz: [
    {
      id: 'M9-Q1',
      prompt: 'PRVC is best described as:',
      options: [
        { label: 'A constant-flow volume-control mode', is_correct: false, explanation: 'Decelerating flow.' },
        { label: 'A pressure-control mode with a closed-loop volume target', is_correct: true, explanation: 'Book Ch. 9.' },
        { label: 'A spontaneous mode with no rate', is_correct: false, explanation: "That's PSV." },
        { label: 'A high-frequency mode', is_correct: false, explanation: 'Different concept entirely.' },
      ],
    },
    {
      id: 'M9-Q2',
      prompt: 'The adaptive PINSP logic in PRVC is most likely to be problematic in:',
      options: [
        { label: 'A heavily sedated post-cardiac arrest patient', is_correct: false, explanation: 'No drive; the adaptive logic is stable.' },
        { label: 'A patient with strong respiratory drive and air hunger', is_correct: true, explanation: 'Book Ch. 9. Drive perturbs the volume measurement, the vent over-corrects, and the loop oscillates.' },
        { label: 'A patient with stable compliance and no drive', is_correct: false, explanation: 'PRVC is perfect here.' },
        { label: 'A weaning candidate', is_correct: false, explanation: 'Possibly — but PSV is the answer for weaning, not PRVC.' },
      ],
    },
    {
      id: 'M9-Q3',
      prompt: 'A PRVC patient shows Vt of 500 ± 30 mL, but PINSP cycling between 12 and 22. The correct response is:',
      options: [
        { label: 'Add sedation', is_correct: false, explanation: 'Treats the symptom only.' },
        { label: 'Increase the Vt target', is_correct: false, explanation: "Doesn't address the loop oscillation." },
        { label: 'Switch to VCV or PCV; then evaluate the patient for the cause of the air hunger', is_correct: true, explanation: 'Book Ch. 9.' },
        { label: 'Raise the FiO2', is_correct: false, explanation: 'Unrelated.' },
      ],
    },
    {
      id: 'M9-Q4',
      prompt: 'Which is TRUE about dual-control modes generally (PRVC, VC+, CMV-Autoflow)?',
      options: [
        { label: 'They eliminate the need to set a tidal volume', is_correct: false, explanation: 'The Vt is what you set.' },
        { label: 'They deliver volume-targeted breaths with decelerating flow', is_correct: true, explanation: 'Book Ch. 9.' },
        { label: 'They use constant flow', is_correct: false, explanation: 'Wrong.' },
        { label: 'They are equivalent to SIMV', is_correct: false, explanation: 'Different concept entirely.' },
      ],
    },
    {
      id: 'M9-Q5',
      prompt: 'The peak airway pressure in a PRVC breath:',
      options: [
        { label: 'Is fixed by the clinician', is_correct: false, explanation: 'PINSP is set by the vent.' },
        { label: 'Varies as the vent adapts to deliver the target Vt', is_correct: true, explanation: 'Book Ch. 9.' },
        { label: 'Equals the plateau pressure exactly', is_correct: false, explanation: 'Wrong.' },
        { label: 'Is unrelated to compliance', is_correct: false, explanation: 'Wrong.' },
      ],
    },
  ],

  explore_card: {
    patient_context: 'ARDS, compliance 30, on PRVC with target Vt 450.',
    unlocked_controls_description: [
      { name: 'Vt · 300–600', description: 'the target. Vent picks PINSP to hit it.' },
      { name: 'Rate · 8–30', description: 'mandatory rate.' },
      { name: 'PEEP · 0–18', description: 'end-expiratory floor.' },
      { name: 'FiO2 · 30–80%', description: 'inspired oxygen.' },
      { name: 'Compliance · 18–60', description: 'sandbox — drag it to see the adaptive PI ramp.' },
    ],
    readouts_description: [
      { name: 'PIP, Vte', description: 'PIP is the moving piece — the vent ticks it up or down each breath.' },
    ],
    suggestions: [
      'At baseline, watch a few breaths. PIP and Vt are stable.',
      'Drop compliance from 30 to 18. Watch PIP halos flash as the vent ramps up over the next 4–5 breaths.',
      'Raise compliance back to 50. Watch PIP halos flash as the vent ticks DOWN — Vt would otherwise overshoot.',
      'This is the adaptive loop. In a stable patient, it just works.',
    ],
  },

  // v3.2 §2.6 — re-framed as "watch the algorithm." No recognition child.
  user_facing_task:
    "Watch the algorithm. Drop this patient's compliance into the ARDS range and wait. Over four to five breaths the inspiratory pressure will climb as PRVC keeps Vt on target. You'll see the PIP halo flash each adaptive step. No other intervention needed — your job is to observe.",
  success_criteria_display: [
    'Reduce compliance by at least 40%.',
    'Wait for PIP to climb to ≥ 22 cmH2O, sustained 4 breaths.',
  ],
  task_framing_style: 'A',

  key_points: [
    'PRVC = volume target, pressure delivery, breath-by-breath adaptive PINSP.',
    'When compliance is stable and drive is absent, PRVC is excellent.',
    'When drive is strong, PRVC can oscillate — the "yo-yo." Recognize it by watching PINSP, not Vt.',
    'The fix is to switch to a non-adaptive mode (VCV or PCV), then treat the cause of agitation.',
    "The peak airway pressure in PRVC is *not* something you set; it's what the vent delivers.",
  ],
};

/**
 * MODULE M10 — Pressure Support Ventilation (PSV)
 *
 * Track: Modes · Archetype: outcome with patient-feedback loop · 18 min
 * Anchor chapters: VB Ch. 11, Ch. 13
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 55 — near-normal, recovering patient
 *   - spontaneousRate: 12 (base) — patient's underlying drive
 *   - effortAmplitude: medium (where modeled)
 *
 * Sim tuning: PS 10–14 yields Vt 380–470 and spontaneous RR 16–22.
 *
 * PSV has NO set rate. The Rate slider must be hidden or disabled when
 * mode is PSV; spontaneous rate appears only as a readout. The
 * `unlocked_controls` deliberately excludes `respiratoryRate` for that
 * reason.
 *
 * Specced against docs/MODULE_SPECS_v3.md §M10 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §7. Adaptation: the sim exposes
 * `actualRate` rather than a separate `spontaneousRate` readout; in PSV
 * mode they're equivalent.
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
export const M10: ModuleConfig = {
  id: 'M10',
  number: 10,
  title: 'Pressure Support Ventilation',
  track: 'Modes',
  estimated_minutes: 18,
  briefing: {
    tagline: 'Patient triggers every breath. PS does the rest.',
    overview:
      "When the patient is breathing for themselves, pressure support is the simplest way to help. The patient triggers each breath. The vent adds a little (or a lot) of pressure during inspiration to take some of the work. There are two knobs that matter: how much support per breath, and how easy it is for the patient to trigger one. Most of what people call \"patient comfort on the vent\" lives in these two settings.",
    what_youll_do: [
      'Every breath in PSV is patient-initiated. No effort, no breath.',
      'More support means bigger breaths and less work, not faster breathing.',
      'Trigger too tight, and you miss efforts. Trigger too loose, and the vent fires on its own.',
    ],
  },

  visible_learning_objectives: [
    'State that PSV has *no set rate*. The patient breathes; the vent boosts.',
    "Titrate PSV by watching the patient: target spontaneous rate <25, spontaneous Vt 6–8 mL/kg PBW.",
    'Identify "too much PS" (Vt too large, rate too slow) and "too little PS" (Vt small, rate fast).',
    'Name the patients PSV is wrong for: shocked, paralyzed, deeply sedated, unreliable drive.',
  ],

  primer_questions: [
    {
      id: 'M10-P1',
      prompt: 'In PSV, the set ventilator rate is:',
      options: [
        { label: '12 breaths per minute', is_correct: false, explanation: 'There is no set rate.' },
        { label: "Determined by the patient's underlying drive — there is no set rate", is_correct: true, explanation: "Book Ch. 11. That's the defining feature of PSV." },
        { label: 'The same as in A/C', is_correct: false, explanation: 'A/C has a rate floor; PSV has none.' },
        { label: 'Calculated from the minute ventilation', is_correct: false, explanation: 'Wrong direction.' },
      ],
    },
    {
      id: 'M10-P2',
      prompt: 'A PSV patient has PEEP 5, PS 10, RR 38, Vt 220 mL. The correct interpretation is:',
      options: [
        { label: 'Adequate support — leave as is', is_correct: false, explanation: "Owens's example: this patient is under-supported." },
        { label: 'Under-supported — the patient is taking shallow fast breaths. Raise PS.', is_correct: true, explanation: 'Book Ch. 11.' },
        { label: 'Over-supported — lower PS', is_correct: false, explanation: 'Direction is reversed.' },
        { label: 'Switch to A/C', is_correct: false, explanation: "Defensible if PSV isn't working, but the first move is to raise PS." },
      ],
    },
    {
      id: 'M10-P3',
      prompt: 'Which patient should NOT be on PSV?',
      options: [
        { label: 'A 60-year-old with pneumonia, day 4, alert and following commands', is_correct: false, explanation: 'Good PSV candidate.' },
        { label: 'A 30-year-old post-operative awakening from anesthesia', is_correct: false, explanation: 'Good candidate as anesthesia clears.' },
        { label: 'A 45-year-old in septic shock on norepinephrine 0.3 mcg/kg/min, intubated 1 hour ago', is_correct: true, explanation: 'Owens\'s rule for the shocked patient: don\'t let the diaphragm consume cardiac output. Shocked + fresh intubation = A/C, not PSV.' },
        { label: 'A 70-year-old extubation candidate', is_correct: false, explanation: 'Ideal PSV candidate.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'M10_psv_baseline',
    preset: {
      // Recovering patient, day 3 post-pneumonia. PS set at 18 (too generous).
      // The learner's job is to titrate PS down based on the patient's response.
      // PIN: compliance 55, spontaneousRate 12, resistance 10 — DO NOT CHANGE.
      // The sim's PSV behavior is tuned so PS 10–14 yields Vt 380–470 and
      // spont rate 16–22.
      mode: 'PSV',
      settings: { psLevel: 18, peep: 5, fiO2: 40, endInspiratoryPercent: 25 },
      patient: { compliance: 55, resistance: 10, spontaneousRate: 12, gender: 'M', heightInches: 70 },
    },
    unlocked_controls: ['psLevel', 'peep', 'fiO2', 'endInspiratoryPercent'],
    visible_readouts: ['pip', 'vte', 'actualRate', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  // Compound: first move PS into the right range (manipulation), then hold
  // the patient's resulting Vt and rate in the lung-protective window.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    children: [
      {
        kind: 'manipulation',
        control: 'psLevel',
        condition: { type: 'range', min: 10, max: 14 },
      },
      {
        kind: 'outcome',
        readouts: {
          actualRate: { operator: '>=', value: 14 },
          vte: { operator: '<=', value: 480 },
        },
        sustain_breaths: 5,
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        "PSV is the **recovery mode**. The patient has a working brain and a working diaphragm, but his lungs or his strength aren't quite back to baseline. You set a pressure boost — typically 10–15 cmH2O above PEEP — and the patient does the rest. He breathes when he wants to; he breathes as much as he wants. The vent just makes each breath a little easier.",
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown: 'There is no rate in PSV. The number on the screen labeled RR is whatever the patient is doing.',
    },
    {
      // v3.2 §0.6 — legacy predict_observe conversion (the existing PS18→24
      // exploration).
      kind: 'predict_mcq',
      awaits_control: 'psLevel',
      predict:
        "Raise PS from 18 to 24. What happens to the patient's spontaneous Vt and RR?",
      options: [
        { label: 'Vt rises, RR falls — bigger boosted breaths, less work between them.', is_correct: true },
        { label: 'Vt rises, RR rises too — more support drives more breaths.', is_correct: false, explanation: 'Backwards. More support per breath lets the patient slow down and ride bigger volumes.' },
        { label: 'Vt unchanged — PSV doesn\'t scale linearly with PS.', is_correct: false, explanation: 'At fixed compliance, Vt ≈ PS × C. Doubling-ish the PS roughly doubles the Vt.' },
        { label: 'RR climbs because more pressure feels uncomfortable.', is_correct: false, explanation: 'The patient comfort signal is the opposite — over-supported patients slow down.' },
      ],
      observe:
        'Vt rises (each boosted breath is larger), and his rate falls (he can ride the boosted breaths longer between efforts).',
    },
    // v3.2 §0.7 — new predict_mcq grounding the "patient is the readout"
    // teaching with a clear too-low-PS vignette.
    {
      kind: 'predict_mcq',
      predict:
        'A patient on PSV with PS 14 has RR 28, spontaneous Vt 280, visible accessory muscle use, and SpO2 96%. Best next move?',
      options: [
        { label: "Add sedation — he's anxious.", is_correct: false, explanation: "Sedation reduces drive, which lowers Vt further; the tachypnea isn't anxiety, it's hypoventilation compensation." },
        { label: 'Lower PS to 8 to prepare for SBT.', is_correct: false, explanation: 'Wrong direction; PS 8 is the threshold for passing an SBT, not the rescue for an under-supported patient.' },
        { label: 'Raise PS to 18.', is_correct: true },
        { label: 'Switch to PRVC.', is_correct: false, explanation: 'Same support level in a different package; the issue is that the support level is too low, not that the mode is wrong.' },
      ],
      observe:
        'Tachypneic, shallow, accessory muscles. He\'s working too hard at this support level. More PS will deepen each breath and slow the rate. Recheck after 5 minutes; target spontaneous RR 14-24, Vt 6-8 mL/kg.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        '**PSV is wrong for the unreliable patient.** Drug overdose, brainstem stroke, status epilepticus, neuromuscular disease — these patients lose their drive intermittently. The vent will sit there and watch.',
    },
    {
      kind: 'formative',
      question: 'You raise PS from 10 to 20 in an air-hungry patient. His tidal volumes go from 200 to 850 mL. His rate drops from 38 to 8. The correct interpretation is:',
      options: [
        { label: 'Ideal — leave', is_correct: false },
        { label: 'Over-supported — lower PS back to ~14 for a Vt in the 6–8 mL/kg range', is_correct: true },
        { label: 'Under-supported', is_correct: false },
        { label: 'Switch to A/C', is_correct: false },
      ],
      answer:
        'Vt 850 is way too high; rate 8 is too slow. The patient is now over-supported. Dial PS back to about 14 and he should land at RR 16–22 with Vt 400–480.',
    },
  ],

  hint_ladder: {
    tier1: 'His Vt is too big and his rate is too slow. He\'s over-supported.',
    tier2: 'Drop PS by 4 cmH2O at a time. Pause 30 seconds. Look at his rate and Vt. Repeat until you\'re around PS 12–14.',
    tier3: { hint_text: 'Use "Show me" to drop PS to 12 and confirm.', demonstration: { control: 'psLevel', target_value: 12 } },
  },

  summative_quiz: [
    {
      id: 'M10-Q1',
      prompt: 'The flow-cycle threshold that ends a PSV breath is typically:',
      options: [
        { label: '100% of peak flow', is_correct: false, explanation: 'Wrong.' },
        { label: '50% of peak flow', is_correct: false, explanation: 'Close but not standard.' },
        { label: '25–30% of peak flow', is_correct: true, explanation: 'Book Ch. 14. Below this, the vent recognizes the patient has finished inhaling.' },
        { label: 'Zero flow', is_correct: false, explanation: 'Wrong.' },
      ],
    },
    {
      id: 'M10-Q2',
      prompt: 'A patient on PSV with PS 14 has RR 28, Vt 320 mL, with accessory muscle use. The next move is:',
      options: [
        { label: 'Extubate — looks ready', is_correct: false, explanation: 'Tachypneic, shallow.' },
        { label: 'Raise PS to 18', is_correct: true, explanation: 'Under-supported.' },
        { label: 'Lower PS to 8', is_correct: false, explanation: 'Direction is wrong.' },
        { label: 'Add sedation', is_correct: false, explanation: "Doesn't address the under-support." },
      ],
    },
    {
      id: 'M10-Q3',
      prompt: 'Owens identifies the threshold PS for considering an SBT as:',
      options: [
        { label: '<5 cmH2O', is_correct: false, explanation: 'Lower than the threshold.' },
        { label: '<10 cmH2O', is_correct: true, explanation: 'Book Ch. 11.' },
        { label: '<20 cmH2O', is_correct: false, explanation: 'Too high.' },
        { label: "There's no specific threshold", is_correct: false, explanation: 'Owens names a number.' },
      ],
    },
    {
      id: 'M10-Q4',
      prompt: 'Which is FALSE about PSV?',
      options: [
        { label: 'There is no set rate', is_correct: false, explanation: 'True.' },
        { label: 'It is appropriate for paralyzed patients', is_correct: true, explanation: 'Book Ch. 11. Paralyzed patients have no drive; they need A/C.' },
        { label: 'Vt depends on PS, PEEP, compliance, and patient effort', is_correct: false, explanation: 'True.' },
        { label: 'It is flow-cycled', is_correct: false, explanation: 'True.' },
      ],
    },
    {
      id: 'M10-Q5',
      prompt: 'In PSV, the tidal volume tends to fall when:',
      options: [
        { label: 'PEEP is increased', is_correct: false, explanation: 'Indirectly possible, not the textbook answer.' },
        { label: "The patient's compliance worsens or his effort weakens", is_correct: true, explanation: "Book Ch. 11. PSV's variable Vt is the early-warning sign of fatigue." },
        { label: 'The trigger is changed from pressure to flow', is_correct: false, explanation: 'Unrelated.' },
        { label: 'The flow-cycle threshold is changed from 25% to 50%', is_correct: false, explanation: 'Could affect timing but not the primary issue.' },
      ],
    },
  ],

  explore_card: {
    patient_context: 'Day 3 post-pneumonia, alert. The patient *is* the readout.',
    unlocked_controls_description: [
      { name: 'PS · 0–25', description: 'pressure boost above PEEP.' },
      { name: 'PEEP · 0–12', description: 'end-expiratory floor.' },
      { name: 'FiO2 · 21–50%', description: 'inspired oxygen.' },
      { name: 'End-Insp % · 5–50', description: 'flow-cycle threshold. Standard is 25–30%.' },
    ],
    readouts_description: [
      { name: 'Vte, actual RR, MVe', description: "what the patient is doing — these *are* your titration targets." },
    ],
    suggestions: [
      'Set PS to 25. Patient is "too comfortable" — RR drops, Vt overshoots.',
      'Set PS to 5. Patient is "working too hard" — RR climbs, Vt small.',
      'Find the sweet spot around PS 12. RR 18, Vt 420. Hold.',
      'Set PS to 8 (extubation threshold). If patient still looks fine, he\'s an SBT candidate.',
    ],
  },

  user_facing_task:
    'Titrate PSV by watching the patient. Your patient is on PSV with PS 18. He looks too comfortable — Vt is big and his RR is low. Dial PS down until his spontaneous RR is 14–24 and his Vt is in the lung-protective range. Hold for 5 breaths.',
  success_criteria_display: [
    'PS support 10–14 cmH2O.',
    'Spontaneous RR ≥ 14.',
    'Spontaneous Vt ≤ 480 mL.',
    'Sustained for 5 consecutive breaths.',
  ],
  task_framing_style: 'B',

  key_points: [
    "PSV has no set rate. The patient's drive is the rate.",
    'Titrate PS by looking at the patient: RR 14–24, Vt 6–8 mL/kg, comfortable breathing.',
    'PS <10 with comfortable breathing = SBT candidate.',
    'PSV is wrong for the shocked, the paralyzed, the deeply sedated, the unreliable-drive patient.',
  ],
};
