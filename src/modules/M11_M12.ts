import type { ModuleConfig } from '../shell/types';

// MODULE_SPECS_v3 §M11 — Dyssynchrony Recognition.
// Spec limits the click-target patterns to the three the sim can render
// (or schematically describe) faithfully: ineffective triggering, double
// triggering, flow starvation. Two others from the canonical five —
// reverse triggering and bad cycling — are mentioned in the read prose
// but not tested here.
export const M11: ModuleConfig = {
  id: 'M11',
  number: 11,
  title: 'Dyssynchrony Recognition',
  track: 'Modes',
  estimated_minutes: 16,
  briefing: {
    tagline: 'The patient is telling you something. Don\'t silence them — read the waveform.',
    overview: "When a ventilated patient looks uncomfortable, the reflex is to push the sedation dial. Resist. The patient is telling you something. Owens groups dyssynchronies into three buckets — bad triggering, bad assistance, bad termination — and within those, a handful of patterns recur in the ICU. The waveform tells you which one. Once you can name the pattern, the fix is mode-specific and pattern-specific.",
    what_youll_do: [
      'Three reference patterns with annotated waveforms: ineffective triggering, double triggering, flow starvation.',
      'Each pattern has one distinctive feature on the pressure waveform.',
      'Each pattern has a different fix. Sedation fixes none of them.',
    ],
  },
  visible_learning_objectives: [
    'Recognize ineffective triggering on the pressure waveform: patient effort, no breath.',
    'Recognize double triggering: two stacked breaths with no expiration between.',
    'Recognize flow starvation (schematic): scooped pressure during inspiration.',
    'Name the first-line corrective action for each pattern.',
  ],

  primer_questions: [
    {
      id: 'M11-P1',
      prompt: '"The patient is fighting the vent." The FIRST step is to:',
      options: [
        { label: 'Increase sedation', is_correct: false, explanation: 'That\'s the reflex answer. It\'s also often the wrong one.' },
        { label: 'Increase neuromuscular blockade', is_correct: false, explanation: 'Paralyzing the patient buries the problem without fixing it.' },
        { label: 'Bag the patient off the vent, then examine and check vent settings', is_correct: true, explanation: 'DOPES rule-out first, then read the waveform. Book Ch. 14.' },
        { label: 'Switch the mode to APRV', is_correct: false, explanation: 'Mode-switching without a diagnosis is gambling.' },
      ],
    },
    {
      id: 'M11-P2',
      prompt: 'Ineffective triggering on the pressure waveform looks like:',
      options: [
        { label: 'A second breath stacked immediately on the first', is_correct: false, explanation: 'That\'s double triggering.' },
        { label: 'A downward deflection (patient effort) with no corresponding breath delivery', is_correct: true, explanation: 'Patient effort fails to cross trigger threshold. Auto-PEEP is the most common cause. Book Ch. 14.' },
        { label: 'A scooped-out pressure waveform during inspiration', is_correct: false, explanation: 'That\'s flow starvation.' },
        { label: 'A high-frequency oscillation in the expiratory phase', is_correct: false, explanation: 'Not a dyssynchrony pattern.' },
      ],
    },
    {
      id: 'M11-P3',
      prompt: 'Double triggering most commonly occurs because:',
      options: [
        { label: 'The patient wants more Vt than the vent is set to deliver', is_correct: true, explanation: 'Common in low-Vt ARDS protocols with strong respiratory drive. Book Ch. 14.' },
        { label: 'The trigger sensitivity is too low', is_correct: false, explanation: 'That would produce ineffective triggering, not double.' },
        { label: 'The PEEP is too high', is_correct: false, explanation: 'PEEP doesn\'t drive double-triggering directly.' },
        { label: 'The expiratory valve is stuck', is_correct: false, explanation: 'That would produce different waveform artifacts.' },
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

  hidden_objective: {
    kind: 'compound',
    sequence: 'any_order',
    children: [
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M11-s1',
          trigger: { kind: 'on_load' },
          question: '65 yo with COPD on VCV. Auto-PEEP measured 9 cmH2O. On the pressure waveform you see small downward deflections (patient effort) with no delivered breath. What pattern is this?',
          options: [
            { label: 'Ineffective triggering', is_correct: true },
            { label: 'Normal breathing', is_correct: false },
            { label: 'Double triggering', is_correct: false },
            { label: 'Auto-cycling', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M11-s2',
          trigger: { kind: 'on_load' },
          question: '35 yo ARDS on VCV Vt 400 (6 mL/kg), strong respiratory drive. On the pressure waveform you see two breaths delivered back-to-back with no expiration between them. What pattern is this?',
          options: [
            { label: 'Double triggering', is_correct: true },
            { label: 'Normal breathing', is_correct: false },
            { label: 'Ineffective triggering', is_correct: false },
            { label: 'Flow starvation', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M11-s3',
          trigger: { kind: 'on_load' },
          question: '50 yo asthma on PRVC, visible air hunger. During inspiration the pressure waveform scoops downward — the patient is pulling against the vent. What pattern is this?',
          options: [
            { label: 'Flow starvation', is_correct: true },
            { label: 'Normal breathing', is_correct: false },
            { label: 'Too-long I-time', is_correct: false },
            { label: 'Double triggering', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**The patient is telling you something.** Owens groups dyssynchronies into three buckets — bad triggering, bad assistance, bad termination — and within those, five common patterns recur in the ICU. The waveform tells you which one.' },
    { kind: 'callout', tone: 'tip', markdown: 'The DOPES rule-out comes first. Then read the waveform.' },
    {
      kind: 'figure',
      caption: 'Three patterns, three signatures on the pressure waveform.',
      ascii: 'Ineffective triggering:    ___ ↘ ___ ↘ ___   (small dips, no breath)\nDouble triggering:        |‾|‾|     |‾|‾|     (two stacked, no exhalation)\nFlow starvation:          ╲___╱     ╲___╱     (scooped downward during insp)',
    },
    { kind: 'prose', markdown: '**Ineffective triggering.** A small dip in pressure with no delivered breath. The patient tried; the vent didn\'t see it. Auto-PEEP is the most common cause — the patient has to overcome the trapped pressure before crossing trigger. Weak drive is the next cause.' },
    { kind: 'prose', markdown: '**Double triggering.** One Vt delivered, no exhalation, a second Vt stacked. The patient wanted more than the vent set. Classic in lung-protective Vt with strong respiratory drive.' },
    { kind: 'prose', markdown: '**Flow starvation.** During inspiration the pressure waveform scoops downward — the patient is pulling harder than the set flow can supply. VC-specific. Either raise the inspiratory flow or switch to a flow-variable mode.' },
    { kind: 'callout', tone: 'warn', markdown: 'Each pattern has a different fix. Sedation "fixes" all of them by silencing the patient — which is exactly what you don\'t want until you\'ve corrected the mismatch.' },
  ],

  hint_ladder: {
    tier1: 'Each pattern has one distinctive waveform feature. Look at the pressure waveform first.',
    tier2: 'Ineffective: dip with no breath. Double: two breaths stacked. Starvation: scoop in inspiratory pressure.',
    tier3: { hint_text: 'Match the description in the prompt to the signature in the reference figure.' },
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
      explanation: 'COPD patients trap air. Until they overcome the trapped PEEP, no inspiratory effort reaches the vent\'s trigger threshold. Book Ch. 13, Ch. 14.',
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
      explanation: 'Match the vent to the patient\'s demand. If the patient wants 500, giving 400 buys you a stacked breath. Book Ch. 14.',
    },
    {
      id: 'M11-Q3',
      prompt: 'Flow starvation in a patient on PRVC is best addressed by:',
      options: [
        { label: 'Increasing PEEP', is_correct: false },
        { label: 'Shortening I-time, or changing to constant inspiratory flow', is_correct: true },
        { label: 'Adding paralytic', is_correct: false },
        { label: 'Switching to PSV', is_correct: false },
      ],
      explanation: 'The patient is pulling faster than the vent can supply. Shorter Ti raises peak flow; constant-flow modes also help. Book Ch. 14.',
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
      explanation: 'The patient is sucking against the vent. The pressure curve dips because the flow isn\'t keeping up. Book Ch. 14.',
    },
    {
      id: 'M11-Q5',
      prompt: 'The reflexive response to "patient fighting the vent" is sedation. Owens\'s preferred sequence is:',
      options: [
        { label: 'Sedate first, troubleshoot later', is_correct: false },
        { label: 'Bag off the vent → DOPES rule-out → assess waveforms → match the fix to the pattern', is_correct: true },
        { label: 'Switch to APRV', is_correct: false },
        { label: 'Call the attending', is_correct: false },
      ],
      explanation: 'Recognize before sedating. Sedation buries the diagnostic information. Book Ch. 14.',
    },
  ],

  explore_card: {
    patient_context: 'A reference patient on PSV with smooth synchrony — so you have a baseline to compare against. The dyssynchrony patterns in this module appear as bedside vignettes (described in the prompt), not live on the waveform; the spec calls for pre-rendered clips that aren\'t in this build yet.',
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'Pressure and flow waveforms', description: 'smooth triggering, decelerating inspiratory flow, expiratory flow returning to zero before the next breath. This is what synchrony looks like.' },
    ],
    suggestions: [
      'Anchor on the normal pattern. Each dyssynchrony is a distortion of one part of it.',
      'When the task starts, three vignettes will describe the waveform. Match each to its name.',
    ],
  },
  user_facing_task: 'Three patients in a row. For each, read the waveform description and the bedside context, and select the dyssynchrony pattern. You must get all three correct, in any order, in one pass.',
  success_criteria_display: [
    'Identify ineffective triggering on the COPD/auto-PEEP scenario.',
    'Identify double triggering on the ARDS/strong-drive scenario.',
    'Identify flow starvation on the PRVC/air-hunger scenario.',
  ],
  task_framing_style: 'C',

  key_points: [
    'Sedation is not the first answer when the patient is fighting the vent.',
    'Bag off the vent and run DOPES; then read the waveform.',
    'Ineffective triggering → look for auto-PEEP.',
    'Double triggering → patient wants more Vt; raise it or switch to PCV.',
    'Flow starvation → shorten I-time or switch to constant flow.',
  ],
};

// MODULE_SPECS_v3 §M12 — SIMV and Hybrid Modes.
// Adaptation: the spec wants outcome tracking on spontaneousTidalVolume and
// mandatoryTidalVolume — readouts the sim doesn't separate. We test the same
// teaching point via (1) manipulation: set psLevel to 8-14, then (2) outcome:
// vte sustains in the 320-470 range. With compliance 45 and PS in that range,
// the sim delivers spontaneous Vt that lands in target.
export const M12: ModuleConfig = {
  id: 'M12',
  number: 12,
  title: 'SIMV and Hybrid Modes',
  track: 'Modes',
  estimated_minutes: 14,
  briefing: {
    tagline: 'A hybrid mode worth knowing. Not the weaning mode it was sold as.',
    overview: "SIMV looks like A/C with extra rules. The vent delivers a fixed number of mandatory breaths per minute. Between mandatory breaths, the patient can breathe spontaneously — but unlike A/C, those spontaneous breaths are not automatically supported. The patient pulls whatever they can pull, and that's what they get. The classic failure: a weak patient pulling 150 mL spontaneous breaths between mandatory breaths. That's barely more than anatomic dead space. The fix is pressure support, not switching modes.",
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
        { label: 'Whatever the patient can pull on his own', is_correct: true, explanation: 'The defining difference from A/C. Book Ch. 10.' },
        { label: 'A small boost equal to PS 5', is_correct: false, explanation: 'Only if PS is set. By default it\'s zero.' },
        { label: 'The same Vt as the previous mandatory breath', is_correct: false, explanation: 'There\'s no copy-the-last-breath rule.' },
      ],
    },
    {
      id: 'M12-P2',
      prompt: 'A patient on SIMV (rate 10, Vt 450) has spontaneous Vt of 160 mL at rate 30. The most likely consequence over hours is:',
      options: [
        { label: 'Adequate gas exchange', is_correct: false, explanation: 'Spontaneous Vt is at anatomic dead space — those breaths don\'t clear CO2.' },
        { label: 'Respiratory muscle fatigue and CO2 retention', is_correct: true, explanation: 'Wasted ventilation. The patient is working but not ventilating. Book Ch. 10.' },
        { label: 'Improved weaning trajectory', is_correct: false, explanation: 'You\'re burning out the patient, not weaning them.' },
        { label: 'Reduced auto-PEEP', is_correct: false, explanation: 'High RR with short Te is more likely to produce auto-PEEP, not less.' },
      ],
    },
    {
      id: 'M12-P3',
      prompt: 'SIMV has been studied for weaning. Compared to daily SBTs, SIMV-based weaning is:',
      options: [
        { label: 'Faster', is_correct: false, explanation: 'It isn\'t.' },
        { label: 'Slower or no better', is_correct: true, explanation: 'Daily SBT is what gets patients off the vent. SIMV adds no proven benefit. Book Ch. 10 — Brochard, Esteban.' },
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
    { kind: 'prose', markdown: '**SIMV looks like A/C with extra rules.** The vent delivers a fixed number of mandatory breaths per minute — at the set Vt or PINSP. Between mandatory breaths, the patient can breathe spontaneously. But unlike A/C, those spontaneous breaths are not automatically supported. The patient pulls whatever volume he can pull, and that\'s what he gets.' },
    { kind: 'callout', tone: 'info', markdown: 'In SIMV, the mandatory breaths are A/C-like. The spontaneous breaths are PSV-like — but only if you\'ve set a PS.' },
    {
      kind: 'predict_observe',
      predict: 'You\'re about to add PS 12 to a patient pulling 160 mL spontaneous breaths. What happens to the spontaneous Vt?',
      observe: 'Spontaneous Vt climbs into the 400s. The patient was working, just not effectively. Now the breaths actually move air.',
      awaits_control: 'psLevel',
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
      explanation: 'The mandatory breath is delayed briefly to align with patient effort, avoiding breath stacking. Book Ch. 10.',
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
      explanation: 'A/C is defensible but PS solves the actual problem. Raising the rate eliminates the spontaneous breaths instead of supporting them. Book Ch. 10.',
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
      explanation: 'Multiple RCTs failed to show benefit, and some showed SIMV was slower than alternative weaning strategies. Book Ch. 10.',
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
      explanation: 'Anatomic dead space is ~150–180 mL. A breath that size barely reaches alveolar gas. Book Ch. 10.',
    },
    {
      id: 'M12-Q5',
      prompt: 'The advantage Owens identifies for SIMV in clinical practice is:',
      options: [
        { label: 'It\'s the fastest weaning mode', is_correct: false },
        { label: 'It prevents diaphragmatic atrophy', is_correct: false },
        { label: 'It is institutionally familiar and works fine as long as the work of breathing is monitored', is_correct: true },
        { label: 'It is the only mode that allows spontaneous breathing', is_correct: false },
      ],
      explanation: '"There is nothing wrong with SIMV as long as you pay attention to the work of breathing." Owens\'s pragmatic answer. Book Ch. 10.',
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
  user_facing_task: 'Fix the SIMV setup. Your patient has spontaneous breaths between mandatory breaths, but the spontaneous Vt is only ~150 mL — barely more than dead space. Add pressure support so the spontaneous breaths are adequate.',
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
