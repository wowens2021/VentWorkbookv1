import type { ModuleConfig } from '../shell/types';

export const M1: ModuleConfig = {
  id: 'M1',
  number: 1,
  title: 'Why We Ventilate',
  track: 'Foundations',
  estimated_minutes: 12,
  visible_learning_objectives: [
    'Recognize the four primary indications for mechanical ventilation.',
    'Read the basic values from a ventilator display.',
  ],

  primer_questions: [
    {
      id: 'M1-P1',
      prompt: 'A patient with a severe drug overdose is unconscious but breathing adequately, with normal oxygen saturation and a normal blood gas. Which of the following is the most appropriate reason to intubate this patient?',
      options: [
        { label: 'Failure of oxygenation', is_correct: false, explanation: 'The patient has normal oxygen saturation. There is no oxygenation failure to address. The temptation is to assume "unconscious patient = needs everything" — but the indication has to match the actual deficit.' },
        { label: 'Failure of ventilation', is_correct: false, explanation: 'The blood gas is normal, meaning CO2 clearance is adequate. Ventilation is not failing.' },
        { label: 'Airway protection', is_correct: true, explanation: 'An unconscious patient cannot protect their own airway from aspiration or obstruction. Intubation here is prophylactic — the lungs and gas exchange are fine, but the airway itself is at risk.' },
        { label: 'To decrease work of breathing', is_correct: false, explanation: 'The patient is breathing adequately and is unconscious, not visibly struggling. Work of breathing is not the issue.' },
      ],
    },
    {
      id: 'M1-P2',
      prompt: 'Which of the following blood gas findings most strongly suggests failure of ventilation (rather than failure of oxygenation)?',
      options: [
        { label: 'PaO2 of 55 mmHg on room air', is_correct: false, explanation: 'Low PaO2 is the hallmark of oxygenation failure, not ventilation failure. The two failures are distinct and the distinction will matter throughout this workbook.' },
        { label: 'PaCO2 of 75 mmHg with pH 7.18', is_correct: true, explanation: 'A markedly elevated PaCO2 with respiratory acidosis means CO2 is not being cleared — that\'s the definition of ventilatory failure. Ventilation moves gas; oxygenation moves oxygen across the alveolar-capillary membrane.' },
        { label: 'SpO2 of 88% on a nasal cannula', is_correct: false, explanation: 'Low SpO2 reflects oxygenation, not ventilation.' },
        { label: 'Lactate of 6.0 mmol/L', is_correct: false, explanation: 'Lactate reflects tissue perfusion and metabolism, not directly the respiratory system. Distractor by association.' },
      ],
    },
    {
      id: 'M1-P3',
      prompt: "On a ventilator display, you see the number '450' next to 'Vt.' What does this most likely represent?",
      options: [
        { label: 'The set inspiratory pressure', is_correct: false, explanation: 'Inspiratory pressure is typically labeled Pinsp or Pi, and values are in cmH2O (usually 10–30). 450 is far too high.' },
        { label: 'The tidal volume in mL', is_correct: true, explanation: 'Vt = tidal volume. Typical adult tidal volumes are 350–600 mL, so 450 fits cleanly. Reading the display fluently starts with knowing the abbreviations.' },
        { label: 'The minute ventilation in L', is_correct: false, explanation: 'Minute ventilation is labeled MV or Ve and given in liters per minute (typical 6–10). 450 would be implausibly high.' },
        { label: 'The PEEP in cmH2O', is_correct: false, explanation: 'PEEP values are in cmH2O and typical values are 5–15. 450 is not a plausible PEEP.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'passive_baseline_vc',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 12, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 70, resistance: 10, spontaneousRate: 0 },
    },
    unlocked_controls: [], // display-only module
    visible_readouts: ['pip', 'plat', 'vte', 'peep', 'fio2', 'actualRate'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  // Observation module — recognition is folded into the primer (which must be
  // answered correctly to unlock the sim). The hidden objective satisfies on
  // the first completed breath so the learner can free-explore and advance
  // when ready.
  hidden_objective: {
    kind: 'outcome',
    readouts: { vte: { operator: '>', value: 0 } },
    sustain_breaths: 1,
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Four indications for mechanical ventilation.** Every intubation answers one of four questions: Is oxygenation failing? Is ventilation (CO2 clearance) failing? Is the airway unprotected? Is the work of breathing too high to sustain? Match the indication to the deficit — don\'t intubate to "fix" what isn\'t broken.' },
    { kind: 'callout', tone: 'tip', markdown: 'Before manipulating the ventilator, learn to **read** it. Every number on the display answers one of three questions: what was set, what was measured, or what was calculated.' },
    { kind: 'prose', markdown: 'On the right, you\'re looking at a stable patient on volume control. Find the **peak pressure** (PIP) on the Airway Pressure waveform — it\'s the top of each breath. Find the **tidal volume** (Vte) in the measured values strip. Find the **PEEP** — the floor of the pressure waveform between breaths. Find the **set rate** — the number that controls how many breaths per minute the ventilator delivers.' },
    { kind: 'formative', question: 'A ventilator display shows PIP 24, Pplat 18, PEEP 5. What is the peak-plateau gap?', answer: '24 − 18 = 6 cmH2O. This gap reflects the resistive component of pressure. Normal-ish; we\'ll explore wider gaps in M4.' },
  ],

  hint_ladder: {
    tier1: 'Look at the numbers on the ventilator display. The peak pressure is the highest point on the Airway Pressure trace.',
    tier2: 'The Measured Values strip shows PIP, Pplat, Vte, RR, and more. Each label maps to a specific reading.',
    tier3: { hint_text: 'Use "Show me" to highlight the peak pressure region.' },
  },

  summative_quiz: [
    {
      id: 'M1-Q1',
      prompt: 'A 22-year-old with a severe asthma exacerbation presents with PaCO2 of 68 mmHg, pH 7.22, and clear mental status. The most appropriate indication category for intubation is:',
      options: [
        { label: 'Failure of oxygenation', is_correct: false },
        { label: 'Failure of ventilation', is_correct: true },
        { label: 'Airway protection', is_correct: false },
        { label: 'Hemodynamic instability', is_correct: false },
      ],
      explanation: 'Elevated PaCO2 with respiratory acidosis defines ventilatory failure — CO2 is not being cleared. Asthma classically produces this picture. Mental status is intact, so airway protection isn\'t the driver.',
    },
    {
      id: 'M1-Q2',
      prompt: 'Which set of indications is correctly paired with its physiologic problem?',
      options: [
        { label: 'Hypoxemic respiratory failure → failure of ventilation', is_correct: false },
        { label: 'GCS of 6 from traumatic brain injury → airway protection', is_correct: true },
        { label: 'PaCO2 of 80 → failure of oxygenation', is_correct: false },
        { label: 'Increased work of breathing → airway protection', is_correct: false },
      ],
      explanation: 'A low GCS is the canonical airway-protection indication — the patient cannot maintain their own airway regardless of gas exchange. Mixing the indication categories is the most common conceptual error in early ventilator training.',
    },
    {
      id: 'M1-Q3',
      prompt: 'On the ventilator display, you see Vt = 480, MV = 7.2, set rate = 14, measured rate = 15. The patient is most likely:',
      options: [
        { label: 'Fully passive on the ventilator', is_correct: false },
        { label: 'Taking one spontaneous breath above the set rate', is_correct: true },
        { label: 'Having a leak in the circuit', is_correct: false },
        { label: 'Auto-triggering from cardiac oscillations', is_correct: false },
      ],
      explanation: 'Measured rate slightly above set rate means the patient is contributing breaths beyond mandated. One extra breath per minute is a normal sign of partial spontaneous activity.',
    },
    {
      id: 'M1-Q4',
      prompt: 'Which display value would you expect to find at the highest absolute number in a typical adult patient?',
      options: [
        { label: 'PEEP', is_correct: false },
        { label: 'Plateau pressure', is_correct: false },
        { label: 'Peak pressure', is_correct: true },
        { label: 'Mean airway pressure', is_correct: false },
      ],
      explanation: 'Peak pressure includes both elastic and resistive components — it is always the highest of these four during inspiration. Plateau is lower (resistive component removed). Mean is an average. PEEP is the floor.',
    },
    {
      id: 'M1-Q5',
      prompt: 'A patient is intubated for failure of oxygenation from severe pneumonia. After intubation, the team should expect ventilator settings to target which physiologic goal first?',
      options: [
        { label: 'Lowering CO2', is_correct: false },
        { label: 'Raising arterial oxygenation through FiO2 and PEEP', is_correct: true },
        { label: 'Reducing work of breathing only', is_correct: false },
        { label: 'Protecting the airway from aspiration', is_correct: false },
      ],
      explanation: 'The indication drives initial strategy. A patient intubated for oxygenation failure needs FiO2 and PEEP optimized first — those are the levers for oxygenation.',
    },
  ],

  explore_card: {
    patient_context: 'You\'re being introduced to a passive patient on volume control. Your job in this module is to learn to *read* the ventilator before you learn to change it.',
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'Peak pressure', description: 'the highest pressure during each breath. Labeled Ppeak or PIP.' },
      { name: 'Plateau pressure', description: 'the pressure after a brief inspiratory hold. Labeled Pplat.' },
      { name: 'Tidal volume', description: 'volume of each breath in mL. Labeled Vt or Vte.' },
      { name: 'PEEP', description: 'the pressure remaining at end-expiration.' },
      { name: 'Set rate', description: 'the rate the operator chose.' },
    ],
    suggestions: [
      'Look at where each number sits on the display. Notice that peak is always higher than plateau, which is always higher than PEEP.',
      'Watch the Airway Pressure waveform on the right. Identify which line corresponds to peak, plateau, and PEEP.',
      'Hover over any number to see its full label.',
    ],
  },
  user_facing_task: "You're being introduced to a new ventilator display. Your senior asks you to point out four key values on the screen as a check of your orientation.",
  success_criteria_display: [
    'Click the peak pressure reading when asked.',
    'Click the tidal volume reading when asked.',
    'Click the PEEP reading when asked.',
    'Click the set rate reading when asked.',
  ],
  task_framing_style: 'C',

  key_points: [
    'The four indications: oxygenation failure, ventilation failure, airway protection, work of breathing.',
    'Match the indication to the deficit — don\'t intubate "to be safe" without a specific reason.',
    'The four core display readings: peak pressure, plateau pressure, tidal volume, PEEP.',
    'Set values are operator inputs; measured values are what the system actually does.',
  ],
};
