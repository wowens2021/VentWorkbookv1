import type { ModuleConfig } from '../shell/types';

/**
 * M1 — Why We Ventilate & The Vent Display
 *
 * Combined module per the M1M2_M4a_M4b shell spec. Replaces the legacy
 * standalone M1 ("Why We Ventilate") and M2 ("Vocabulary and the Vent
 * Display") with a single ~20–25 minute Foundations module.
 *
 * Track: Foundations · Phases: Primer → Read → Explore → Try It → Debrief.
 */
export const M1: ModuleConfig = {
  id: 'M1',
  number: 1,
  title: 'Why We Ventilate & The Vent Display',
  track: 'Foundations',
  estimated_minutes: 22,
  briefing: {
    tagline: 'Name the indication. Read the display.',
    overview:
      "Two foundations layered into one module. **Why** a patient gets a tube — the four primary indications for mechanical ventilation — and **how** to read what the vent is showing you once they're on it. By the end you'll be able to look at any ventilator display and name what every number means, separate what you ordered from what the patient is doing, and tell which indication is in play.",
    what_youll_do: [
      'Match each ventilator indication to a recognizable clinical picture.',
      'Walk a live ventilator display and click each of the eight bedside terms by name.',
      'Separate set values (orders) from measured values (reports) — the gap is diagnostic.',
    ],
  },

  visible_learning_objectives: [
    'Recognize the four primary indications for mechanical ventilation.',
    'Match ventilator terminology to display elements.',
    'Distinguish set values from measured values.',
    'Read Ppeak, Pplat, PEEP, Vt, rate, MV, FiO2, and I:E ratio from a live display.',
  ],

  primer_questions: [
    {
      id: 'M1-P1',
      prompt:
        'A patient with a severe drug overdose is unconscious but breathing adequately — normal O2 sat and normal blood gas. The most appropriate indication for intubation is:',
      options: [
        { label: 'Failure of oxygenation', is_correct: false, explanation: 'Normal sat; no oxygenation failure.' },
        { label: 'Failure of ventilation', is_correct: false, explanation: 'Normal blood gas; CO2 clearance is adequate.' },
        { label: 'Airway protection', is_correct: true, explanation: 'Unconscious patient cannot protect the airway from aspiration. Intubation is prophylactic.' },
        { label: 'Decreased work of breathing', is_correct: false, explanation: 'Patient is breathing adequately and is unconscious — no WOB issue.' },
      ],
    },
    {
      id: 'M1-P2',
      prompt: "On a ventilator display, you see '450' next to 'Vt.' What does this most likely represent?",
      options: [
        { label: 'Set inspiratory pressure', is_correct: false, explanation: 'Pinsp is in cmH2O, usually 10–30. 450 is implausible.' },
        { label: 'Tidal volume in mL', is_correct: true, explanation: 'Vt = tidal volume. Typical adult 350–600 mL; 450 fits.' },
        { label: 'Minute ventilation in L', is_correct: false, explanation: 'MV is in L/min (typical 6–10). 450 is impossible.' },
        { label: 'PEEP in cmH2O', is_correct: false, explanation: 'PEEP is typically 5–15 cmH2O.' },
      ],
    },
    {
      id: 'M1-P3',
      prompt: "What is the key difference between 'set rate' and 'measured rate' on the ventilator display?",
      options: [
        { label: 'Same thing in different units', is_correct: false, explanation: 'Conceptually different values.' },
        { label: 'Set = operator input; measured = what the patient is actually doing', is_correct: true, explanation: 'Gap = spontaneous breathing activity above the mandatory rate.' },
        { label: 'Set applies only in VC; measured only in PC', is_correct: false, explanation: 'Both exist in every mode.' },
        { label: 'Measured = only mandatory breaths', is_correct: false, explanation: 'Measured rate includes all breaths.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'passive_baseline_vc',
    preset: {
      // Display-only module. The learner can't change anything; they're
      // here to name what they see.
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 14, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 55, resistance: 10, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    unlocked_controls: [],
    // Note: Vt set, set rate, PEEP, and FiO2 live in the control row.
    // They're visible (even though unlocked_controls is empty, control
    // boxes still render — they're just non-interactive). The readout
    // strip renders pip (PIP), plat (Pplat), totalPeep (tPEEP), mve (VE
    // = MV), actualRate (RR = measured), ieRatio (I:E), and vte.
    visible_readouts: [
      'pip', 'plat', 'totalPeep',
      'vte', 'mve', 'actualRate', 'ieRatio',
    ],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  // Eight click-target recognitions in STRICT sequence. The spec gives
  // each one 2 attempts; on miss, the correct element gets a highlight
  // ring and the learner clicks it to advance.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    children: [
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M1-ppeak',
          trigger: { kind: 'on_load' },
          question: 'Click the peak pressure reading on the display.',
          max_attempts: 2,
          annotation_on_correct: 'Ppeak — the top of the pressure waveform; the highest pressure each breath.',
          options: [
            { label: 'Ppeak', is_correct: true, explanation: 'Ppeak (PIP) = peak inspiratory pressure. Top of the pressure waveform.' },
            { label: 'Pplat', is_correct: false, explanation: 'Pplat is the held pressure after an inspiratory pause — always ≤ Ppeak.' },
            { label: 'PEEP', is_correct: false, explanation: 'PEEP is the floor at end-expiration, not the peak.' },
            { label: 'MV', is_correct: false, explanation: 'MV is minute ventilation — a volume per minute, not a pressure.' },
          ],
          click_targets: [
            { element: { kind: 'readout', name: 'pip' }, label: 'Ppeak', is_correct: true, explanation: 'Ppeak — top of the pressure waveform; highest pressure each breath.' },
            { element: { kind: 'readout', name: 'plat' }, label: 'Pplat', is_correct: false, explanation: 'Pplat is the held alveolar pressure — always ≤ Ppeak.' },
            { element: { kind: 'readout', name: 'totalPeep' }, label: 'PEEP', is_correct: false, explanation: 'PEEP is the floor at end-expiration, not the peak.' },
            { element: { kind: 'readout', name: 'mve' }, label: 'MV', is_correct: false, explanation: 'MV is minute ventilation in L/min — not a pressure.' },
          ],
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M1-vt_set',
          trigger: { kind: 'on_load' },
          question: 'Click the set tidal volume reading.',
          max_attempts: 2,
          annotation_on_correct: 'Vt set — the volume per breath you ordered.',
          options: [
            { label: 'Vt set', is_correct: true, explanation: 'Set Vt is the order — the volume per breath the operator dialed in.' },
            { label: 'Vte (delivered)', is_correct: false, explanation: 'Vte is the measured exhaled volume — what came back out.' },
            { label: 'MV', is_correct: false, explanation: 'MV is per minute, not per breath.' },
            { label: 'Ppeak', is_correct: false, explanation: 'Ppeak is a pressure, not a volume.' },
          ],
          click_targets: [
            { element: { kind: 'control', name: 'tidalVolume' }, label: 'Vt set', is_correct: true, explanation: 'Vt set — the volume per breath you ordered.' },
            { element: { kind: 'readout', name: 'vte' }, label: 'Vte (delivered)', is_correct: false, explanation: 'Vte is the measured exhaled volume — what came back out.' },
            { element: { kind: 'readout', name: 'mve' }, label: 'MV', is_correct: false, explanation: 'MV is per minute, not per breath.' },
            { element: { kind: 'readout', name: 'pip' }, label: 'Ppeak', is_correct: false, explanation: 'Ppeak is a pressure, not a volume.' },
          ],
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M1-peep',
          trigger: { kind: 'on_load' },
          question: 'Click the PEEP reading.',
          max_attempts: 2,
          annotation_on_correct: 'PEEP — the floor; pressure at end-expiration.',
          options: [
            { label: 'PEEP', is_correct: true, explanation: 'PEEP — end-expiratory pressure; the floor of the pressure trace.' },
            { label: 'Ppeak', is_correct: false, explanation: 'Ppeak is the top of the pressure trace, not the floor.' },
            { label: 'Pplat', is_correct: false, explanation: 'Pplat is the held inspiratory pressure, not the expiratory floor.' },
            { label: 'FiO2', is_correct: false, explanation: 'FiO2 is gas composition, not pressure.' },
          ],
          click_targets: [
            { element: { kind: 'readout', name: 'totalPeep' }, label: 'PEEP', is_correct: true, explanation: 'PEEP — end-expiratory pressure; the floor (the tPEEP card on the readout strip).' },
            { element: { kind: 'readout', name: 'pip' }, label: 'Ppeak', is_correct: false, explanation: 'Ppeak is the top of the pressure trace, not the floor.' },
            { element: { kind: 'readout', name: 'plat' }, label: 'Pplat', is_correct: false, explanation: 'Pplat is the held inspiratory pressure, not the expiratory floor.' },
            { element: { kind: 'control', name: 'fiO2' }, label: 'FiO2', is_correct: false, explanation: 'FiO2 is gas composition, not pressure.' },
          ],
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M1-rate_set',
          trigger: { kind: 'on_load' },
          question: 'Click the set respiratory rate.',
          max_attempts: 2,
          annotation_on_correct: 'Set rate — the minimum mandatory rate you ordered.',
          options: [
            { label: 'Set rate', is_correct: true, explanation: 'Set rate is the minimum mandatory rate — the order.' },
            { label: 'Measured rate', is_correct: false, explanation: 'Measured rate is what the patient is actually doing — set + triggered.' },
            { label: 'I:E ratio', is_correct: false, explanation: 'I:E is a derived ratio, not a rate.' },
            { label: 'MV', is_correct: false, explanation: 'MV is volume per minute, not a rate alone.' },
          ],
          click_targets: [
            { element: { kind: 'control', name: 'respiratoryRate' }, label: 'Set rate', is_correct: true, explanation: 'Set rate — the minimum mandatory rate you ordered.' },
            { element: { kind: 'readout', name: 'actualRate' }, label: 'Measured rate', is_correct: false, explanation: 'Measured rate is what the patient is actually doing — set + triggered.' },
            { element: { kind: 'readout', name: 'ieRatio' }, label: 'I:E ratio', is_correct: false, explanation: 'I:E is a derived ratio, not a rate.' },
            { element: { kind: 'readout', name: 'mve' }, label: 'MV', is_correct: false, explanation: 'MV is volume per minute, not a rate alone.' },
          ],
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M1-fio2',
          trigger: { kind: 'on_load' },
          question: 'Click the FiO2 reading.',
          max_attempts: 2,
          annotation_on_correct: 'FiO2 — inspired oxygen fraction; 0.21 = room air.',
          options: [
            { label: 'FiO2', is_correct: true, explanation: 'FiO2 — inspired oxygen fraction (0.21 room air, 1.0 = 100%).' },
            { label: 'PEEP', is_correct: false, explanation: 'PEEP is a pressure, not a gas fraction.' },
            { label: 'MV', is_correct: false, explanation: 'MV is volume per minute, not a gas fraction.' },
            { label: 'Ppeak', is_correct: false, explanation: 'Ppeak is a pressure, not a gas fraction.' },
          ],
          click_targets: [
            { element: { kind: 'control', name: 'fiO2' }, label: 'FiO2', is_correct: true, explanation: 'FiO2 — inspired oxygen fraction (the FiO2 control box).' },
            { element: { kind: 'readout', name: 'totalPeep' }, label: 'PEEP', is_correct: false, explanation: 'PEEP is pressure, not gas fraction.' },
            { element: { kind: 'readout', name: 'mve' }, label: 'MV', is_correct: false, explanation: 'MV is volume per minute, not gas fraction.' },
            { element: { kind: 'readout', name: 'pip' }, label: 'Ppeak', is_correct: false, explanation: 'Ppeak is pressure, not gas fraction.' },
          ],
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M1-mv',
          trigger: { kind: 'on_load' },
          question: 'Click the minute ventilation reading.',
          max_attempts: 2,
          annotation_on_correct: 'MV — total volume per minute; rate × Vt.',
          options: [
            { label: 'MV', is_correct: true, explanation: 'MV = rate × Vt; total volume per minute, in L/min.' },
            { label: 'Vt set', is_correct: false, explanation: 'Vt is per breath, not per minute.' },
            { label: 'Measured rate', is_correct: false, explanation: 'Measured rate is a frequency, not a volume.' },
            { label: 'I:E', is_correct: false, explanation: 'I:E is a ratio, not a volume.' },
          ],
          click_targets: [
            { element: { kind: 'readout', name: 'mve' }, label: 'MV', is_correct: true, explanation: 'MV — total volume per minute; rate × Vt.' },
            { element: { kind: 'control', name: 'tidalVolume' }, label: 'Vt set', is_correct: false, explanation: 'Vt is per breath, not per minute.' },
            { element: { kind: 'readout', name: 'actualRate' }, label: 'Measured rate', is_correct: false, explanation: 'Measured rate is a frequency, not a volume.' },
            { element: { kind: 'readout', name: 'ieRatio' }, label: 'I:E', is_correct: false, explanation: 'I:E is a ratio, not a volume.' },
          ],
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M1-ie',
          trigger: { kind: 'on_load' },
          question: 'Click the I:E ratio reading.',
          max_attempts: 2,
          annotation_on_correct: 'I:E — inspiratory to expiratory time; normal 1:2 or 1:3.',
          options: [
            { label: 'I:E', is_correct: true, explanation: 'I:E — ratio of inspiratory to expiratory time. Normal 1:2 or 1:3.' },
            { label: 'Measured rate', is_correct: false, explanation: 'Rate is a frequency; I:E is a ratio.' },
            { label: 'PEEP', is_correct: false, explanation: 'PEEP is a pressure, not a ratio.' },
            { label: 'MV', is_correct: false, explanation: 'MV is a volume per minute, not a ratio.' },
          ],
          click_targets: [
            { element: { kind: 'readout', name: 'ieRatio' }, label: 'I:E', is_correct: true, explanation: 'I:E — inspiratory to expiratory time; normal 1:2 or 1:3.' },
            { element: { kind: 'readout', name: 'actualRate' }, label: 'Measured rate', is_correct: false, explanation: 'Rate is a frequency; I:E is a ratio.' },
            { element: { kind: 'readout', name: 'totalPeep' }, label: 'PEEP', is_correct: false, explanation: 'PEEP is a pressure, not a ratio.' },
            { element: { kind: 'readout', name: 'mve' }, label: 'MV', is_correct: false, explanation: 'MV is volume per minute, not a ratio.' },
          ],
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M1-rate_meas',
          trigger: { kind: 'on_load' },
          question: 'Click the measured respiratory rate.',
          max_attempts: 2,
          annotation_on_correct: 'Measured rate — what the patient is actually doing (set + triggered).',
          options: [
            { label: 'Measured rate', is_correct: true, explanation: 'Measured rate counts every breath — mandatory + triggered.' },
            { label: 'Set rate', is_correct: false, explanation: 'Set rate is the order; measured is what the patient is doing.' },
            { label: 'I:E', is_correct: false, explanation: 'I:E is a ratio, not a count.' },
            { label: 'MV', is_correct: false, explanation: 'MV is volume per minute, not a count.' },
          ],
          click_targets: [
            { element: { kind: 'readout', name: 'actualRate' }, label: 'Measured rate', is_correct: true, explanation: 'Measured rate — every breath (mandatory + triggered).' },
            { element: { kind: 'control', name: 'respiratoryRate' }, label: 'Set rate', is_correct: false, explanation: 'Set rate is the order; measured is what the patient is doing.' },
            { element: { kind: 'readout', name: 'ieRatio' }, label: 'I:E', is_correct: false, explanation: 'I:E is a ratio, not a count.' },
            { element: { kind: 'readout', name: 'mve' }, label: 'MV', is_correct: false, explanation: 'MV is volume per minute, not a count.' },
          ],
        },
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        '**The four indications for mechanical ventilation.**\n\n' +
        '1. **Failure of oxygenation (Type I)**: PaO2 < 60 mmHg despite supplemental O2. Caused by shunt (ARDS, pneumonia, pulmonary edema) and V/Q mismatch. Fix: FiO2 and PEEP.\n\n' +
        '2. **Failure of ventilation (Type II)**: PaCO2 > 50 mmHg with pH < 7.30. CO2 is not being cleared. Causes include COPD exacerbation, severe asthma, neuromuscular disease. Fix: minute ventilation (rate × tidal volume).\n\n' +
        '3. **Airway protection**: Patient cannot protect the airway from aspiration or obstruction. Classic cases: unconscious overdose, GCS ≤ 8, severe angioedema. Gas exchange may be normal — the tube goes in anyway.\n\n' +
        '4. **Decreased work of breathing / impending fatigue**: In shock or severe metabolic acidosis, WOB can account for 40–50% of total O2 consumption. Intubation takes that burden off while the underlying problem is treated.',
    },
    {
      kind: 'callout',
      tone: 'tip',
      markdown:
        '**Key distinction.** Oxygenation failure responds to FiO2 and PEEP. Ventilation failure responds to minute ventilation. A patient with normal PaO2 but PaCO2 75 and pH 7.18 needs more minute ventilation, not more oxygen.',
    },
    {
      kind: 'prose',
      markdown:
        '**Set values vs measured values.**\n\n' +
        '**Set values (operator inputs):** set Vt, set rate, PEEP, FiO2, set inspiratory pressure.\n\n' +
        '**Measured values (what the system reports):** delivered Vt, measured rate, Ppeak, Pplat, MV.\n\n' +
        'Gaps between set and measured values are diagnostic. Set Vt 500 / delivered Vt 340 = circuit or cuff leak. Set rate 14 / measured rate 22 = patient triggering 8 extra breaths per minute.',
    },
    {
      kind: 'prose',
      markdown:
        '**The eight terms.**\n\n' +
        '- **Ppeak**: highest pressure during each breath. Includes elastic + resistive components. Typical 15–35 cmH2O.\n' +
        '- **Pplat**: pressure after an end-inspiratory pause. Reflects alveolar pressure only. Always ≤ Ppeak. ARDS target < 30 cmH2O.\n' +
        '- **PEEP**: pressure at end-expiration. The floor. Typical 5–15 cmH2O.\n' +
        '- **Vt**: volume per breath in mL. Set Vt and delivered Vt. Target 6 mL/kg PBW.\n' +
        '- **Set rate / measured rate**: set = what you ordered; measured = all breaths. Gap = spontaneous activity.\n' +
        '- **MV**: rate × Vt. Total air per minute. Target 6–10 L/min.\n' +
        '- **FiO2**: inspired O2 fraction. 0.21 = room air; 1.0 = 100% O2.\n' +
        '- **I:E ratio**: inspiratory to expiratory time. Normal 1:2 or 1:3.\n\n' +
        '**Pressure hierarchy: Ppeak ≥ Pplat ≥ PEEP. Always.**',
    },
  ],

  hint_ladder: {
    tier1: 'Look at the labels on the vent display. Find the one being asked about.',
    tier2: 'Each term has a unique abbreviation. Ppeak is at the top of the pressure column; Pplat is next to or below it.',
    tier3: { hint_text: 'Show me — highlights the correct region with an animated ring. You still click it to satisfy the objective.' },
  },

  summative_quiz: [
    {
      id: 'M1-Q1',
      prompt: 'A 22-year-old with severe asthma has PaCO2 68, pH 7.22, clear mental status. Indication for intubation:',
      options: [
        { label: 'Failure of oxygenation', is_correct: false, explanation: 'The problem is elevated PaCO2, not low PaO2.' },
        { label: 'Failure of ventilation', is_correct: true, explanation: 'Elevated PaCO2 + respiratory acidosis = ventilatory failure. Asthma limits CO2 removal via resistive obstruction.' },
        { label: 'Airway protection', is_correct: false, explanation: 'Patient is conscious with intact mental status.' },
        { label: 'Decreased WOB', is_correct: false, explanation: 'Primary driver here is ventilation failure.' },
      ],
    },
    {
      id: 'M1-Q2',
      prompt: 'Set Vt 450, delivered Vt 310, set rate 16, measured rate 16. Most likely explanation:',
      options: [
        { label: 'Spontaneous breaths', is_correct: false, explanation: 'Measured rate would exceed set rate.' },
        { label: 'Circuit leak', is_correct: true, explanation: 'Gap between set and delivered Vt with equal rates = gas escaping. Check cuff and circuit.' },
        { label: 'Ventilator malfunction', is_correct: false, explanation: 'Circuit/cuff problem first; machine failure is a diagnosis of exclusion.' },
        { label: 'High compliance in pressure mode', is_correct: false, explanation: 'High compliance would increase volume, not decrease it.' },
      ],
    },
    {
      id: 'M1-Q3',
      prompt: 'Tidal volume 500 mL, respiratory rate 14. Minute ventilation:',
      options: [
        { label: '3.5 L/min', is_correct: false, explanation: 'Math error.' },
        { label: '7 L/min', is_correct: true, explanation: 'MV = 0.5 L × 14 = 7 L/min.' },
        { label: '14 L/min', is_correct: false, explanation: 'Math error.' },
        { label: '35 L/min', is_correct: false, explanation: 'Normal MV is 6–10 L/min.' },
      ],
    },
    {
      id: 'M1-Q4',
      prompt: 'Ppeak 34, Pplat 22. Which statement is true?',
      options: [
        { label: 'Peak-plateau gap of 12 suggests compliance problem', is_correct: false, explanation: 'Compliance moves peak and plateau together.' },
        { label: 'Peak-plateau gap of 12 suggests resistance problem', is_correct: true, explanation: 'The gap IS the resistive component. Widening gap = rising resistance.' },
        { label: 'Pplat > 20 means barotrauma', is_correct: false, explanation: 'ARDS target is Pplat ≤ 30. A Pplat of 22 is safe.' },
        { label: 'Peak and plateau should be equal in healthy lung', is_correct: false, explanation: 'Normal airways always add some resistive pressure.' },
      ],
    },
    {
      id: 'M1-Q5',
      prompt: 'Patient intubated for oxygenation failure from pneumonia. Initial strategy should prioritize:',
      options: [
        { label: 'Raising MV to lower CO2', is_correct: false, explanation: 'CO2 was not the indication.' },
        { label: 'Optimizing FiO2 and PEEP', is_correct: true, explanation: 'Indication drives strategy. Oxygenation failure requires FiO2 and PEEP optimization first.' },
        { label: 'Reducing WOB only', is_correct: false, explanation: 'Not the primary goal here.' },
        { label: 'Airway protection is sufficient', is_correct: false, explanation: 'Placing the tube addressed airway, not oxygenation.' },
      ],
    },
  ],

  explore_card: {
    patient_context:
      'A stable, passively ventilated patient on routine volume-control settings. No controls are unlocked — you are learning to read the display before changing anything.',
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'Ppeak', description: 'top of pressure waveform; highest pressure each breath.' },
      { name: 'Pplat', description: 'after an inspiratory pause; reflects alveolar pressure; always ≤ Ppeak.' },
      { name: 'PEEP', description: 'floor; pressure at end-expiration.' },
      { name: 'Vt set and Vt delivered', description: 'gap signals a leak.' },
      { name: 'Set rate vs measured rate', description: 'gap = spontaneous breaths above the mandatory rate.' },
      { name: 'MV', description: 'rate × Vt; target 6–10 L/min for most adults.' },
      { name: 'FiO2', description: 'inspired oxygen fraction.' },
      { name: 'I:E ratio', description: 'inspiratory to expiratory time.' },
    ],
    suggestions: [
      'Notice that Ppeak is always > Pplat > PEEP.',
      'If measured rate > set rate, the patient is breathing above the mandatory rate.',
      'If set Vt = delivered Vt, there is no circuit leak.',
    ],
  },

  user_facing_task:
    'Your senior names eight values from the display one at a time. Click the matching readout panel for each one.',
  success_criteria_display: [
    'Click the correct readout panel for each of the eight terms.',
    'Two attempts per term before the answer is revealed with a highlight ring.',
    'Complete all eight to unlock the debrief.',
  ],
  task_framing_style: 'C',

  key_points: [
    'Four indications: failure of oxygenation, failure of ventilation, airway protection, decreased work of breathing.',
    'Oxygenation failure (Type I) responds to FiO2 and PEEP. Ventilation failure (Type II) responds to minute ventilation.',
    'Set values = what you ordered. Measured values = what actually happened. Gaps are diagnostic.',
    'Eight terms: Ppeak, Pplat, PEEP, Vt (set and delivered), rate (set and measured), MV, FiO2, I:E ratio.',
    'Ppeak ≥ Pplat ≥ PEEP. The Ppeak–Pplat gap = airway resistance.',
    'MV = rate × Vt. Target 6–10 L/min for most adults.',
  ],
};
