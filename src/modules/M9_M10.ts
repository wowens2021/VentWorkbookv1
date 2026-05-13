import type { ModuleConfig } from '../shell/types';

/**
 * M9 — PRVC and Dual-Control Ventilation
 * Track: Modes · Archetype: outcome with sandbox exploration · 20 min
 * Anchor chapters: VB Ch. 9
 *
 * Specced verbatim against docs/MODULE_SPECS_v3.md §M9, with one adaptation
 * noted in the spec itself: the sim cannot directly verify the "PINSP swing
 * ≥ 4 cmH2O over 6 breaths" custom tracker shape. The implementable
 * proxy below preserves the teaching: drop compliance, observe that the
 * vent's adaptive PI ramps PIP up over several breaths (with the M9
 * visual cue from MASTER_SHELL_v3 §6 wired in), then answer the
 * recognition that names the algorithm's behavior.
 */
export const M9: ModuleConfig = {
  id: 'M9',
  number: 9,
  title: 'PRVC and Dual-Control Ventilation',
  track: 'Modes',
  estimated_minutes: 20,
  briefing: {
    tagline: 'Volume target. Pressure-limited. Mind the failure modes.',
    overview:
      "PRVC tries to give you the predictability of volume control with the safety of pressure control. You set a volume target, the vent picks the pressure to hit it, and adjusts breath by breath when mechanics shift. It works well in stable, passive patients. It has known failure modes in patients who are working hard or who are awake and asynchronous, because the algorithm sees their effort as the machine doing its job and quietly reduces support.",
    what_youll_do: [
      'PRVC adjusts pressure breath by breath to hit a volume target.',
      "It's pressure-limited, so peaks can't run away.",
      'A bucking or coughing patient on PRVC can fool the algorithm into giving them less support. Watch the pressure trend.',
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
    unlocked_controls: ['tidalVolume', 'respiratoryRate', 'peep', 'fiO2', 'iTime', 'compliance'],
    visible_readouts: ['pip', 'plat', 'vte', 'drivingPressure', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  // Adapted from the spec's "PINSP swing" tracker (not directly implementable
  // in this sim). The proxy: drop compliance, watch the adaptive PI ramp
  // PIP up over several breaths (the M9 visual cue from MASTER_SHELL_v3 §6
  // flashes PIP each adaptive step), then a recognition consolidates.
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
        readouts: { pip: { operator: '>=', value: 20 } },
        sustain_breaths: 4,
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M9-summary',
          trigger: { kind: 'on_load' },
          question: 'You dropped compliance. Over the next several breaths, what did the ventilator do?',
          options: [
            { label: 'Increased delivered pressure to maintain the volume target', is_correct: true, explanation: "Right. PRVC sensed that Vt was falling and ramped PINSP up breath by breath. That's the adaptive-control loop working as designed." },
            { label: 'Decreased delivered pressure', is_correct: false, explanation: "Only happens when delivered Vt exceeds the target — opposite direction." },
            { label: 'Switched modes', is_correct: false, explanation: 'No automatic mode switching in PRVC.' },
            { label: 'Nothing automatic happened', is_correct: false, explanation: 'The PIP flashes on every adaptive step. You saw the algorithm work.' },
          ],
          max_attempts: 2,
        },
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
      kind: 'predict_observe',
      awaits_control: 'compliance',
      predict:
        "Drop compliance from 30 to 18 (a sudden ARDS-like worsening). Predict: what does the vent's PINSP do over the next 4–5 breaths?",
      observe:
        "PINSP ramps up over several breaths — you'll see the PIP halo flash each step. The vent is keeping Vt at 450 by giving the lungs more pressure. The adaptive loop is working.",
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        'The fix for PRVC dyssynchrony is **not** to add sedation. The fix is to switch to a non-adaptive mode (VCV or PCV) and then address why the patient was agitated.',
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

  user_facing_task:
    "Recognize PRVC's adaptive behavior. Drop the patient's compliance into the ARDS range and watch what the ventilator does — without changing anything else. After 4–5 breaths the PIP will have visibly climbed. Answer what you saw.",
  success_criteria_display: [
    "Reduce compliance by at least 40%.",
    'Wait several breaths and watch the PIP trend (you\'ll see halos flash each adaptive step).',
    'Identify what the ventilator did in response.',
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
 * M10 — Pressure Support Ventilation
 * Track: Modes · Archetype: outcome with patient-feedback loop · 18 min
 * Anchor chapters: VB Ch. 11, Ch. 13
 *
 * Specced verbatim against docs/MODULE_SPECS_v3.md §M10, with the target
 * state slightly adapted to the sim's readout names (`actualRate` ≡ the
 * spec's `spontaneousRate` readout in PSV mode). The teaching is unchanged:
 * titrate PS by watching the patient, not by hitting a number.
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
        { label: 'A 45-year-old in septic shock on norepinephrine 0.3 mcg/kg/min, intubated 1 hour ago', is_correct: true, explanation: 'Book Ch. 11, Commandment VIII. Shocked, fresh intubation — needs A/C.' },
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
      kind: 'predict_observe',
      awaits_control: 'psLevel',
      predict:
        "Raise PS from 18 to 24. What happens to the patient's spontaneous Vt and RR?",
      observe:
        'Vt rises (each boosted breath is larger), and his rate falls (he can ride the boosted breaths longer between efforts).',
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
