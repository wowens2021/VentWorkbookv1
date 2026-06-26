import type { ModuleConfig } from '../shell/types';

/**
 * MODULE M11 — Dyssynchrony Recognition
 *
 * Track: Modes · Archetype: recognition (live waveform) · 16 min
 *
 * v3.3 UPGRADE — Live waveform rendering replaces static SVG clips.
 * The three scored recognition prompts now embed <DyssynchronyWaveform>
 * inline (via clip_component / pattern prop) rather than referencing
 * static /public/clips/*.svg paths. The component runs the same
 * equation-of-motion engine as PlaygroundSim so the waveforms are
 * physiologically continuous, scale to any display, and animate with
 * the same sweep cursor the learner already knows from the playground.
 *
 * Implementation:
 *   src/components/DyssynchronyWaveform.tsx   ← physics + rendering
 *   The RecognitionPrompt shell reads clip_component + pattern and
 *   renders <DyssynchronyWaveform pattern={...} /> above the MCQ.
 *
 * Three scored scenarios (per spec §8 v3.1):
 *   ineffective triggering, double triggering, flow starvation.
 * Reverse triggering and premature cycling appear in the read-phase
 * atlas as labeled live waveforms (not scored).
 *
 * Specced against docs/MODULE_SPECS_v3.md §M11 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §8. See MODULE_SPECS_v3.md Appendix A.
 */
export const M11: ModuleConfig = {
  id: 'M11',
  number: 11,
  title: 'Dyssynchrony Recognition',
  track: 'Modes',
  estimated_minutes: 16,
  briefing: {
    tagline: 'The patient is telling you something. Don\'t silence them — read the waveform.',
    overview: "When a ventilated patient looks uncomfortable, the reflex is to push the sedation dial. Resist. The patient is telling you something. Dyssynchronies fall into three buckets — ineffective or inappropriate triggering, inadequate inspiratory assistance, and inappropriate termination of the breath — and within those, a handful of patterns recur in the ICU. The waveform tells you which one. Once you can name the pattern, the fix is mode-specific and pattern-specific.",
    what_youll_do: [
      'Three live waveform patterns: ineffective triggering, double triggering, flow starvation.',
      'Each pattern has one distinctive feature on the pressure waveform.',
      'Each pattern has a different fix. Sedation fixes none of them.',
    ],
  },
  visible_learning_objectives: [
    'Recognize ineffective triggering on the pressure waveform: patient effort, no breath.',
    'Recognize double triggering: two stacked breaths with no expiration between.',
    'Recognize flow starvation: scooped pressure during inspiration in VCV.',
    'Name the first-line corrective action for each pattern.',
  ],

  primer_questions: [
    {
      id: 'M11-P1',
      prompt: '"The patient is fighting the vent." The FIRST step is to:',
      options: [
        { label: 'Increase sedation', is_correct: false, explanation: 'That\'s the reflex answer. It\'s also often the wrong one — sedation buries the diagnostic information you need.' },
        { label: 'Increase neuromuscular blockade', is_correct: false, explanation: 'Paralyzing the patient buries the problem without fixing it.' },
        { label: 'Bag the patient off the vent, then examine and check vent settings', is_correct: true, explanation: 'Bag off → run DOPES (Displacement, Obstruction, Pneumothorax, Equipment, Stacking) → then read the waveform. TVB Ch. 14.' },
        { label: 'Switch the mode to APRV', is_correct: false, explanation: 'Mode-switching without a diagnosis is gambling.' },
      ],
    },
    {
      id: 'M11-P2',
      // Tests genuine prerequisite knowledge (auto-PEEP from M6), not this module's content.
      prompt: 'A COPD patient on VCV has auto-PEEP of 10 cmH2O and a flow trigger set at −2 cmH2O. To trigger the vent, the patient must generate a negative airway pressure of at least:',
      options: [
        { label: '−2 cmH2O — the trigger threshold is what matters', is_correct: false, explanation: 'The trigger threshold is measured from airway opening pressure, not from alveolar pressure. With 10 cmH2O trapped, the patient starts from +10 and must first unload that before any negative swing reaches the trigger.' },
        { label: '−12 cmH2O — the patient must overcome auto-PEEP first, then cross the trigger threshold', is_correct: true, explanation: 'Auto-PEEP raises the baseline the patient works against. 10 cmH2O auto-PEEP + 2 cmH2O trigger = 12 cmH2O of effort before the vent registers anything. TVB Ch. 13.' },
        { label: '−10 cmH2O — auto-PEEP is the only barrier', is_correct: false, explanation: 'Auto-PEEP is the larger barrier, but the trigger threshold adds on top of it.' },
        { label: '−5 cmH2O — the vent compensates for auto-PEEP automatically', is_correct: false, explanation: 'Standard triggers do not auto-compensate for air trapping. That\'s what extrinsic PEEP titration is for.' },
      ],
    },
    {
      id: 'M11-P3',
      // Tests prerequisite bedside observation (what "fighting the vent" looks like before pattern naming).
      prompt: 'A nurse calls: "The patient looks like he\'s working hard to breathe but I\'m not seeing extra breaths on the vent display." Before you look at the waveform, what are you thinking?',
      options: [
        { label: 'The patient is anxious — push more sedation', is_correct: false, explanation: 'Visible work without counted breaths could mean the vent isn\'t seeing the efforts at all. Sedation before diagnosis buries the finding.' },
        { label: 'The patient\'s efforts may not be crossing the trigger threshold — they work but nothing fires', is_correct: true, explanation: 'When you see effort but no delivered breath, the vent isn\'t detecting it. The waveform will show pressure deflections between mandatory breaths with no corresponding flow. TVB Ch. 14.' },
        { label: 'The rate is set too high — the patient can\'t exhale fully', is_correct: false, explanation: 'A rate too high produces air trapping, not visible effort without breath delivery.' },
        { label: 'The flow sensor is broken', is_correct: false, explanation: 'Equipment failure is possible but comes after you\'ve ruled out patient-vent mismatch.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'dyssynchrony_reference',
    preset: {
      mode: 'PSV',
      settings: { psLevel: 10, peep: 5, fiO2: 40 },
      patient: { compliance: 50, resistance: 10, spontaneousRate: 18 },
    },
    unlocked_controls: [],
    visible_readouts: ['pip', 'vte', 'actualRate'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  // v3.3 — recognition prompts now use clip_component + pattern instead of
  // clip_src. RecognitionPrompt renders <DyssynchronyWaveform pattern={...} />
  // above the MCQ question text. The pattern string matches a key in the
  // PATTERNS object exported from DyssynchronyWaveform.tsx.
  hidden_objective: {
    kind: 'compound',
    sequence: 'any_order',
    // Fix #4: Explicit sequencing contract for the shell.
    // display_mode: 'sequential' — show one prompt at a time; learner must answer (or exhaust
    //   max_attempts) before the next waveform appears. The shell randomly selects the ORDER
    //   from the children array on each try-it load (achieving true any_order with no look-ahead).
    // retry_flow: 'stay' — on a wrong answer within max_attempts, stay on the same prompt and
    //   show the wrong-answer explanation. Only advance after correct answer or max_attempts.
    display_mode: 'sequential',
    retry_flow: 'stay',
    children: [
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M11-ineffective',
          trigger: { kind: 'on_load' },
          clip_component: 'DyssynchronyWaveform',
          pattern: 'ineffective',
          question:
            '65 yo on VCV. Auto-PEEP measured 9 cmH2O. The waveform above is recorded over 6 seconds. What pattern is this?',
          options: [
            { label: 'Ineffective triggering', is_correct: true, explanation: 'Two small pressure dips between mandatory breaths with no delivered tidal volume — the patient is pulling but can\'t overcome auto-PEEP plus the trigger threshold.' },
            { label: 'Double triggering', is_correct: false, explanation: 'Double triggering shows two breaths stacked back-to-back with no expiration between them — not present here.' },
            { label: 'Flow starvation', is_correct: false, explanation: 'Flow starvation scoops the inspiratory pressure DOWN during a delivered breath. Here the dips are between mandatory breaths, with no inspiratory flow.' },
            { label: 'Normal breathing with sigh breaths', is_correct: false, explanation: 'Sigh breaths are larger volumes intentionally delivered by the vent, not failed trigger attempts.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M11-double',
          trigger: { kind: 'on_load' },
          clip_component: 'DyssynchronyWaveform',
          pattern: 'double',
          question:
            '35 yo ARDS on VCV Vt 400 (6 mL/kg), strong respiratory drive. The waveform above is recorded over 6 seconds. What pattern is this?',
          options: [
            { label: 'Double triggering', is_correct: true, explanation: 'A run of breaths stacked back-to-back: each is triggered before the lung has finished exhaling, so end-expiratory volume ratchets upward breath after breath. Common in low-Vt ARDS with strong drive.' },
            { label: 'Ineffective triggering', is_correct: false, explanation: 'Ineffective triggering would show patient pressure dips with NO delivered breath. Here breaths are clearly delivered — back-to-back.' },
            { label: 'Flow starvation', is_correct: false, explanation: 'Flow starvation scoops the pressure DOWN during a single breath. Here the issue is two breaths fused together, not a pulled-down profile.' },
            { label: 'Auto-cycling from a circuit leak', is_correct: false, explanation: 'Auto-cycling produces many machine breaths from circuit noise without patient effort. Here the stacked pair follows visible spontaneous drive.' },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M11-starvation',
          trigger: { kind: 'on_load' },
          clip_component: 'DyssynchronyWaveform',
          pattern: 'starvation',
          question:
            '50 yo asthma on VCV with visible air hunger. The waveform above is recorded over 6 seconds. What pattern is this?',
          options: [
            { label: 'Flow starvation', is_correct: true, explanation: 'The pressure trace scoops downward early in inspiration on breaths 2 and 3 — the patient is pulling harder than the set flow can supply. The flow stays constant (no compensation in VCV); that contrast is the diagnostic.' },
            { label: 'Bronchospasm raising resistance', is_correct: false, explanation: 'Bronchospasm would push PIP UP, not scoop it down. The PIP-plateau gap would widen on every breath.' },
            { label: 'Ineffective triggering', is_correct: false, explanation: 'Ineffective triggering happens between mandatory breaths, not during them. This is happening WITHIN delivered breaths.' },
            { label: 'Too-long I-time', is_correct: false, explanation: 'A too-long I-time would extend the inspiratory plateau but not scoop the pressure down.' },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown: '**The patient is telling you something.** Dyssynchronies fall into three buckets — *ineffective or inappropriate triggering*, *inadequate inspiratory assistance*, and *inappropriate termination of the breath* — and within those, five common patterns recur in the ICU. The waveform tells you which one.',
    },
    { kind: 'callout', tone: 'tip', markdown: 'The DOPES rule-out comes first. Then read the waveform.' },
    {
      kind: 'predict_mcq',
      predict:
        "You're at the bedside. The patient has a respiratory rate of 28 on the vent display, but the nurse says the patient looks like they're working harder than that — she counts 35 visible efforts per minute. Before you look at the waveform, what best explains the discrepancy?",
      options: [
        { label: 'The rate display is broken.', is_correct: false, explanation: 'Rate display errors are rare. Check the patient before blaming the equipment.' },
        { label: 'The patient is making efforts the vent is not delivering breaths for — 7 efforts per minute are failing to trigger.', is_correct: true },
        { label: 'The patient is moving artifactually — the nurse is miscounting.', is_correct: false, explanation: 'Dismiss the clinical observation last, not first.' },
        { label: 'The patient is breathing too fast for the vent to keep up — rate limiting.', is_correct: false, explanation: 'Modern ICU vents don\'t rate-limit like this. Every trigger attempt either fires a breath or doesn\'t — one-for-one.' },
      ],
      observe:
        'Seven efforts per minute disappearing without a breath. That\'s ineffective triggering at an asynchrony index of 7/35 = 20% — clinically significant. The waveform will show small pressure dips between delivered breaths with no corresponding rise in flow. Now you know what to look for.',
    },

    // Pattern descriptions come BEFORE the labeled atlas so the learner builds
    // a mental model from text first, then confirms it on the waveform.
    // This prevents the atlas from short-circuiting the try-it recognition task.
    {
      kind: 'prose',
      markdown: '**Ineffective triggering.** A small dip in pressure with no delivered breath. The patient tried; the vent didn\'t see it. Auto-PEEP is the most common cause — the patient has to overcome the trapped pressure before crossing the trigger threshold. Weak drive is the next cause.',
    },
    {
      kind: 'prose',
      markdown: '**Double triggering.** A breath is triggered before the previous one has exhaled — and then another. Breaths stack two, three, or more in a row with no full exhalation between them, so end-expiratory volume ratchets upward with each one. The root cause: the patient\'s neural inspiratory time is longer than the ventilator\'s set Ti — the drive continues into what the vent calls expiration, and that ongoing effort triggers the next breath before the last has fully exited. Classic in lung-protective Vt with strong respiratory drive. The fix addresses the mismatch: raise Vt to satisfy demand, or switch to PCV so the patient\'s own neural Ti sets when the breath cycles off.',
    },
    {
      kind: 'prose',
      markdown: '**Flow starvation.** During inspiration the pressure waveform scoops downward while flow stays constant and square. The patient is pulling harder than the set flow can supply. VC-specific. Either raise the inspiratory flow or switch to a flow-variable mode.',
    },
    {
      kind: 'callout',
      tone: 'tip',
      markdown:
        "**Further reading (not on the try-it).** Two more patterns exist that you may see at the bedside: **reverse triggering** (a mandatory breath provokes a delayed diaphragm contraction — pressure dip mid-expiration; common in deeply sedated ARDS) and **premature cycling** (PSV terminates inspiration while the patient is still pulling — pressure drops while flow is still positive). The three above are the ones to recognize first; come back to these once those are solid.",
    },
    { kind: 'callout', tone: 'warn', markdown: 'Each pattern has a different fix. Sedation "fixes" all of them by silencing the patient — which is exactly what you don\'t want until you\'ve corrected the mismatch.' },

    // v3.3 — labeled waveform atlas appears AFTER the text descriptions.
    // Learner builds mental model from prose → confirms on live waveform →
    // then faces the try-it with unlabeled waveforms.
    // The try-it prompts show waveforms WITHOUT description/fix text (compact mode)
    // and with neutral annotation labels (no diagnostic conclusions).
    {
      kind: 'live_component',
      component: 'DyssynchronyWaveform',
      props: { defaultPattern: 'ineffective', mode: 'atlas' },
      caption: 'Reference atlas — labeled live waveforms. Compare each against the text descriptions above. The try-it will show these waveforms without labels.',
    },
  ],

  hint_ladder: {
    tier1: 'Each pattern has one distinctive waveform feature. Look at the pressure waveform first — ignore the flow trace until you have a hypothesis.',
    tier2: 'Three questions: (1) Is there a pressure deflection with NO delivered breath? → ineffective triggering. (2) Do two full breaths stack back-to-back with expiratory flow never hitting zero? → double triggering. (3) Does the inspiratory pressure scoop downward while flow stays constant and square? → flow starvation.',
    tier3: {
      hint_text: 'For the waveform on screen: count the distinct inspiration events. If you see three pressure rises but the patient clearly made four efforts, an effort went undelivered — that\'s ineffective triggering. If two breaths arrive before any expiration, that\'s double triggering. If the pressure dips during a delivered breath while flow is flat, that\'s flow starvation. Pause the waveform (play/pause button) to freeze it on the diagnostic moment.',
    },
  },

  summative_quiz: [
    {
      id: 'M11-Q1',
      prompt: 'Ineffective triggering in a COPD patient is most likely due to:',
      options: [
        { label: 'The pressure trigger is set too high', is_correct: false },
        { label: 'Auto-PEEP — the alveolar pressure exceeds the airway pressure, so the patient must generate a larger negative pressure to trigger', is_correct: true },
        { label: 'Excessive sedation', is_correct: false },
        { label: 'The endotracheal tube is too small', is_correct: false },
      ],
      explanation: 'COPD patients trap air. Until they overcome the trapped PEEP, no inspiratory effort reaches the vent\'s trigger threshold. TVB Ch. 13, Ch. 14.',
    },
    {
      id: 'M11-Q2',
      prompt: 'Double triggering during low-Vt ARDS ventilation is best addressed by:',
      options: [
        { label: 'Increasing sedation', is_correct: false },
        { label: 'Raising Vt or switching to PCV', is_correct: true },
        { label: 'Decreasing PEEP', is_correct: false },
        { label: 'Lowering the rate', is_correct: false },
      ],
      explanation: 'Match the vent to the patient\'s demand. If the patient wants 500, giving 400 buys you a stacked breath. TVB Ch. 14.',
    },
    {
      id: 'M11-Q3',
      prompt: 'Flow starvation in a patient on VCV is best addressed by:',
      options: [
        { label: 'Increasing PEEP', is_correct: false, explanation: 'PEEP affects oxygenation and end-expiratory volume, not inspiratory flow delivery. It won\'t resolve the flow-demand mismatch.' },
        { label: 'Increasing peak inspiratory flow or switching to a pressure-based mode', is_correct: true, explanation: 'The patient is pulling faster than the set flow can supply. Higher peak flow closes the gap in VCV. A pressure-based mode (PCV, PSV, PRVC) lets flow vary to match demand — the scooping disappears. TVB Ch. 14.' },
        { label: 'Adding paralytic', is_correct: false, explanation: 'Paralytics eliminate the patient\'s drive — silencing the problem rather than fixing it. The mismatch is between flow supply and demand; address the supply.' },
        { label: 'Increasing the set respiratory rate', is_correct: false, explanation: 'Rate doesn\'t affect peak flow or how quickly gas is delivered during inspiration. The scoop happens within each breath, not because of breath frequency.' },
      ],
      explanation: 'The patient is pulling faster than the vent can supply. Higher peak flow or a mode that lets flow vary (PCV, PRVC, PSV) fixes the mismatch. TVB Ch. 14.',
    },
    {
      id: 'M11-Q4',
      prompt: 'A scooped-out, downward deflection in the inspiratory pressure waveform represents:',
      options: [
        { label: 'Ineffective triggering', is_correct: false },
        { label: 'Flow starvation', is_correct: true },
        { label: 'Auto-cycling', is_correct: false },
        { label: 'Expiratory dyssynchrony', is_correct: false },
      ],
      explanation: 'The patient is sucking against the vent. The pressure curve dips because the flow isn\'t keeping up. TVB Ch. 14.',
    },
    {
      id: 'M11-Q5',
      prompt: 'The reflexive response to "patient fighting the vent" is sedation. The preferred sequence is:',
      options: [
        { label: 'Sedate first, troubleshoot later', is_correct: false },
        { label: 'Bag off the vent → DOPES rule-out → assess waveforms → match the fix to the pattern', is_correct: true },
        { label: 'Switch to APRV', is_correct: false },
        { label: 'Call the attending', is_correct: false },
      ],
      explanation: 'Recognize before sedating. Sedation buries the diagnostic information. TVB Ch. 14.',
    },
  ],

  explore_card: {
    patient_context: 'The live sim on the left is your synchrony reference — a calm patient on PSV with smooth triggering, decelerating inspiratory flow, and expiratory flow returning to zero before the next breath. This is what synchrony looks like. The try-it waveforms include PSV and VCV patients; the mode is given in each vignette. Two of the three patterns (ineffective triggering, double triggering) are shown in PSV; one (flow starvation) is in VCV — note how the pressure and flow shapes differ by mode before you try to identify the dyssynchrony.',
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'Pressure and flow waveforms', description: 'smooth triggering, decelerating inspiratory flow, expiratory flow returning to zero before the next breath. This is synchrony.' },
    ],
    suggestions: [
      'Anchor on the normal pattern. Each dyssynchrony is a distortion of one part of it.',
      'When the task starts, three live waveform prompts will appear. Match each to its pattern name.',
    ],
  },

  user_facing_task: 'Recognize the dyssynchrony pattern. Three live waveforms, one patient context per waveform. For each, watch the waveform and read the bedside vignette, then pick the pattern. You must get all three correct — wrong answers explain what that pattern would have shown instead. Note: the playground sim to the left shows a synchronised PSV patient as your reference for normal. Two of the three try-it waveforms are VCV patients — the mode is given in the vignette and changes what the waveforms look like.',
  task_framing_style: 'C',

  key_points: [
    'Sedation is not the first answer when the patient is fighting the vent.',
    'Bag off the vent and run DOPES; then read the waveform.',
    'Ineffective triggering → look for auto-PEEP.',
    'Double triggering → patient wants more Vt; raise it or switch to PCV.',
    'Flow starvation → increase peak flow or switch to pressure mode.',
  ],
};


/**
 * MODULE M12 — SIMV and Hybrid Modes
 *
 * Track: Modes · Archetype: outcome with combined-effect titration · 14 min
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 45
 *   - effortAmplitude: low (weak — central to the failure-mode demonstration)
 *   - mandatory rate floor: 10 (must be allowed)
 *
 * Sim tuning: spontaneous Vt is ~140-180 mL with no PS; ~380-450 mL with PS 12.
 *
 * [BLOCKED-SIM]: see docs/BLOCKED_SIM.md §4 for the mandatory-vs-
 * spontaneous Vte separation limitation.
 */
export const M12: ModuleConfig = {
  id: 'M12',
  number: 12,
  title: 'SIMV and Hybrid Modes',
  track: 'Modes',
  estimated_minutes: 14,
  // Novice-pass §12.3 — promote the "SIMV doesn't wean faster than SBT"
  // finding to the headline. Otherwise novices file it as trivia.
  briefing: {
    tagline: "SIMV doesn't wean patients faster than a daily SBT. That's the headline.",
    overview: "SIMV looks like A/C with extra rules. The vent delivers a fixed number of mandatory breaths per minute. Between mandatory breaths, the patient can breathe spontaneously — but unlike A/C, those spontaneous breaths are not automatically supported. The classic failure: a weak patient pulling 150 mL spontaneous breaths between mandatory breaths — barely more than anatomic dead space. The fix is pressure support. The historical reason SIMV exists is that people once thought it accelerated weaning. It doesn't. The rest of this module is about *why* you'd ever still see it.",
    what_youll_do: [
      'In SIMV, mandatory breaths are A/C-like. Spontaneous breaths are PSV-like — but only if you set a PS.',
      'A weak patient with no PS pulls sub-dead-space spontaneous Vt. Wasted ventilation and fatigue.',
      'The right SIMV setup includes both a mandatory Vt and a PS for spontaneous breaths.',
      'SIMV was sold as a weaning mode. It isn\'t. The daily SBT is.',
    ],
  },
  visible_learning_objectives: [
    'Distinguish SIMV from A/C: spontaneous breaths get no machine support unless PS is added.',
    'Identify the SIMV failure mode: a weak patient pulling sub-dead-space spontaneous Vt.',
    'Set SIMV with appropriate PS so spontaneous Vt is adequate.',
  ],

  primer_questions: [
    {
      id: 'M12-P1',
      prompt: 'In SIMV with no pressure support, a spontaneous breath delivers:',
      options: [
        { label: 'The set mandatory Vt', is_correct: false, explanation: 'That\'s A/C behavior.' },
        { label: 'Whatever the patient can pull on his own', is_correct: true, explanation: 'The defining difference from A/C. TVB Ch. 10.' },
        { label: 'A small boost equal to PS 5', is_correct: false, explanation: 'Only if PS is set. By default it\'s zero.' },
        { label: 'The same Vt as the previous mandatory breath', is_correct: false, explanation: 'There\'s no copy-the-last-breath rule.' },
      ],
    },
    {
      id: 'M12-P2',
      prompt: 'A patient on SIMV (rate 10, Vt 450) has spontaneous Vt of 160 mL at rate 30. The most likely consequence over hours is:',
      options: [
        { label: 'Adequate gas exchange', is_correct: false, explanation: 'Spontaneous Vt is at anatomic dead space — those breaths don\'t clear CO2.' },
        { label: 'Respiratory muscle fatigue and CO2 retention', is_correct: true, explanation: 'Wasted ventilation. The patient is working but not ventilating. TVB Ch. 10.' },
        { label: 'Improved weaning trajectory', is_correct: false, explanation: 'You\'re burning out the patient, not weaning them.' },
        { label: 'Reduced auto-PEEP', is_correct: false, explanation: 'High RR with short Te is more likely to produce auto-PEEP, not less.' },
      ],
    },
    {
      id: 'M12-P3',
      prompt: 'SIMV has been studied for weaning. Compared to daily SBTs, SIMV-based weaning is:',
      options: [
        { label: 'Faster', is_correct: false, explanation: 'It isn\'t.' },
        { label: 'Slower or no better', is_correct: true, explanation: 'Daily SBT is what gets patients off the vent. SIMV adds no proven benefit. TVB Ch. 10 — Brochard, Esteban.' },
        { label: 'Equivalent', is_correct: false, explanation: 'Studies actually showed SIMV was slower in several trials.' },
        { label: 'Superior in COPD', is_correct: false, explanation: 'Not supported.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'simv_weak_no_ps',
    preset: {
      mode: 'SIMV/PS',
      settings: { tidalVolume: 450, respiratoryRate: 10, psLevel: 0, peep: 5, fiO2: 40 },
      patient: { compliance: 45, resistance: 12, spontaneousRate: 18, heightInches: 70, gender: 'M' },
    },
    unlocked_controls: ['tidalVolume', 'respiratoryRate', 'psLevel', 'peep', 'fiO2'],
    visible_readouts: ['actualRate', 'vte', 'mve', 'pip'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    children: [
      {
        kind: 'manipulation',
        control: 'psLevel',
        condition: { type: 'range', min: 8, max: 14 },
      },
      {
        kind: 'outcome',
        readouts: {
          vte: { operator: '>=', value: 320 },
        },
        sustain_breaths: 5,
      },
    ],
  },

  content_blocks: [
    // Novice-pass §12.1 — opening "why are we still teaching this" callout
    // so a novice knows the educational intent up front.
    {
      kind: 'callout',
      tone: 'tip',
      markdown:
        "**Why this module exists.** You'll see SIMV less and less in modern ICUs — many training hospitals have moved away from it entirely. But understanding *why* SIMV can fail teaches a deep principle about how to support spontaneous breaths. That's the educational point. Read the module for the principle, even if you never set the mode.",
    },
    { kind: 'prose', markdown: '**SIMV looks like A/C with extra rules.** The vent delivers a fixed number of mandatory breaths per minute — at the set Vt or PINSP. Between mandatory breaths, the patient can breathe spontaneously. But unlike A/C, those spontaneous breaths are not automatically supported. The patient pulls whatever volume he can pull, and that\'s what he gets.' },
    { kind: 'callout', tone: 'info', markdown: 'In SIMV, the mandatory breaths are A/C-like. The spontaneous breaths are PSV-like — but only if you\'ve set a PS.' },
    {
      // M12 #1 — decoupled from the control: the learner answers by
      // choosing, and moving the PS slider no longer auto-satisfies the
      // prompt (no `awaits_control`), so the answer cannot pre-populate
      // on a vent change. The learner predicts first, then performs the
      // titration in the try-it.
      kind: 'predict_mcq',
      predict: 'You\'re about to add PS 12 to a patient pulling 160 mL spontaneous breaths between mandatory breaths. First predict: what happens to the spontaneous Vt?',
      options: [
        { label: 'Climbs into the 400s — PS makes the spontaneous breaths effective.', is_correct: true },
        { label: 'Unchanged — PS only affects mandatory breaths in SIMV.', is_correct: false, explanation: 'Backwards. In SIMV, the MANDATORY breaths are fully set (Vt and rate); PS is added to the SPONTANEOUS ones.' },
        { label: 'Drops — PS confuses the patient\'s drive.', is_correct: false, explanation: 'PS doesn\'t suppress drive; it augments the breath the patient is already triggering.' },
        { label: 'Falls because mandatory breaths now dominate.', is_correct: false, explanation: 'Mandatory rate is unchanged. The spontaneous breaths get bigger; the mandatory breaths stay the same size.' },
      ],
      observe: 'Spontaneous Vt climbs into the 400s. The patient was working, just not effectively. Now the breaths actually move air.',
    },
    // v3.2 §0.7 — new predict_mcq grounding the SIMV failure mode.
    {
      kind: 'predict_mcq',
      predict:
        'A patient on SIMV (rate 10, Vt 450, PS 0) has actual rate 28, spontaneous Vt 160. Over the next few hours, the most likely outcome without intervention is:',
      options: [
        { label: 'The patient self-weans and gets extubated.', is_correct: false, explanation: "Sub-dead-space breaths don't ventilate; he's working without effect." },
        { label: 'Respiratory muscle fatigue and rising PaCO2.', is_correct: true },
        { label: 'Adequate gas exchange because MVe looks acceptable.', is_correct: false, explanation: 'MVe = total volume per minute, not alveolar ventilation. Spontaneous breaths at 160 mL are mostly dead space.' },
        { label: 'Reduced auto-PEEP from the high spontaneous rate.', is_correct: false, explanation: 'High RR with short Te tends to cause trapping, not relieve it.' },
      ],
      observe:
        'The mandatory breaths are doing the alveolar work. The spontaneous breaths are wasted effort — sub-dead-space, all of it work, none of it ventilation. Over hours this fatigues the diaphragm and the PaCO2 climbs. The fix is PS, not mode change.',
    },
    { kind: 'callout', tone: 'warn', markdown: 'SIMV was sold as a weaning mode. It isn\'t. The daily SBT is. SIMV is fine — pay attention to the work of breathing.' },
  ],

  hint_ladder: {
    tier1: 'His mandatory breaths look fine. His spontaneous breaths are too small. What can you add to support them?',
    tier2: 'Add pressure support — 10 to 14 cmH2O is a usual range. Watch the spontaneous Vt rise.',
    tier3: { hint_text: 'Set psLevel to 12.', demonstration: { control: 'psLevel', target_value: 12 } },
  },

  summative_quiz: [
    {
      id: 'M12-Q1',
      prompt: 'The "S" in SIMV stands for:',
      options: [
        { label: 'Spontaneous', is_correct: false },
        { label: 'Synchronized', is_correct: true },
        { label: 'Supported', is_correct: false },
        { label: 'Static', is_correct: false },
      ],
      explanation: 'The mandatory breath is delayed briefly to align with patient effort, avoiding breath stacking. TVB Ch. 10.',
    },
    {
      id: 'M12-Q2',
      prompt: 'On SIMV with rate 10 and no PS, a weak patient\'s spontaneous Vt is 180 mL at rate 28. The correct response is:',
      options: [
        { label: 'Switch to A/C', is_correct: false },
        { label: 'Add pressure support 10–12 cmH2O', is_correct: true },
        { label: 'Increase the mandatory rate to 20', is_correct: false },
        { label: 'Add sedation', is_correct: false },
      ],
      explanation: 'A/C is defensible but PS solves the actual problem. Raising the rate eliminates the spontaneous breaths instead of supporting them. TVB Ch. 10.',
    },
    {
      id: 'M12-Q3',
      prompt: 'SIMV\'s claimed advantage over A/C for weaning has been demonstrated to be:',
      options: [
        { label: 'Faster time to extubation', is_correct: false },
        { label: 'Less diaphragmatic atrophy', is_correct: false },
        { label: 'No proven advantage; daily SBT is what works', is_correct: true },
        { label: 'Lower ICU mortality', is_correct: false },
      ],
      explanation: 'Multiple trials including Brochard and Esteban show SIMV-based weaning is not faster than daily SBTs. TVB Ch. 10.',
    },
    {
      id: 'M12-Q4',
      prompt: 'A spontaneous Vt of 150 mL on SIMV represents:',
      options: [
        { label: 'Adequate ventilation', is_correct: false },
        { label: 'Near-dead-space ventilation — wasted', is_correct: true },
        { label: 'Volume volutrauma risk', is_correct: false },
        { label: 'Auto-PEEP', is_correct: false },
      ],
      explanation: 'Anatomic dead space is ~150–180 mL. A breath that size barely reaches alveolar gas. TVB Ch. 10.',
    },
    {
      id: 'M12-Q5',
      prompt: 'The pragmatic advantage of SIMV in clinical practice is:',
      options: [
        { label: 'It\'s the fastest weaning mode', is_correct: false },
        { label: 'It prevents diaphragmatic atrophy', is_correct: false },
        { label: 'It is institutionally familiar and works fine as long as the work of breathing is monitored', is_correct: true },
        { label: 'It is the only mode that allows spontaneous breathing', is_correct: false },
      ],
      explanation: '"There is nothing wrong with SIMV as long as you pay attention to the work of breathing" — the pragmatic answer. TVB Ch. 10.',
    },
  ],

  explore_card: {
    patient_context: 'Sepsis-recovery patient, weak drive. Currently on SIMV mandatory rate 10, mandatory Vt 450, PS zero. Patient is triggering 18 breaths/min — 10 mandatory, 8 spontaneous, and the spontaneous breaths are tiny.',
    unlocked_controls_description: [
      { name: 'Pressure support (psLevel)', description: 'the boost added to spontaneous breaths. Default zero — that\'s the problem. Try 10–14.' },
      { name: 'Tidal volume', description: 'sets the mandatory breath size. Keep around 6 mL/kg PBW.' },
      { name: 'Mandatory rate', description: 'how many guaranteed breaths per minute. Currently 10.' },
    ],
    readouts_description: [
      { name: 'Measured rate (actualRate)', description: 'mandatory + spontaneous combined. Mandatory rate 10 + spontaneous 8 = 18.' },
      { name: 'Vte', description: 'reflects the most recent delivered breath. Watch it shift as PS is added.' },
      { name: 'Minute ventilation (mve)', description: 'total air-per-minute. With spontaneous breaths at dead-space size, MVe doesn\'t reflect alveolar ventilation.' },
    ],
    suggestions: [
      'Add PS 12. The spontaneous breaths grow.',
      'Drop the mandatory rate to 6 with no PS. Spontaneous Vt collapses, patient tachypneic.',
      'Raise PS to 18. Spontaneous Vt may overshoot — too much support has its own costs.',
    ],
  },
  // Novice-pass §12.2 — honest framing of the Vte-chip limitation. The
  // chip can't distinguish mandatory vs spontaneous Vt in mixed-mode
  // SIMV, so the framing turns the ambiguity into the teaching point:
  // "when the chip holds ≥ 320, BOTH are in target."
  user_facing_task:
    "Fix the SIMV setup. Your patient has spontaneous breaths between mandatory breaths, but the spontaneous Vt is only ~150 mL — barely more than dead space. As you add PS, watch the Vte chip rise. When it holds steady at or above 320, both the mandatory AND the spontaneous breaths are in target.",
  success_criteria_display: [
    'Pressure support set between 8 and 14 cmH2O.',
    'Delivered Vt sustained at ≥320 mL (~4.5 mL/kg PBW) for five breaths.',
  ],
  task_framing_style: 'A',

  key_points: [
    'SIMV: mandatory breaths fully supported, spontaneous breaths unsupported unless PS is added.',
    'The classic SIMV failure: weak patient pulling sub-dead-space spontaneous Vt.',
    'The fix is PS, not switching modes.',
    'SIMV does not wean faster than A/C with daily SBTs. No proven benefit.',
  ],
};
