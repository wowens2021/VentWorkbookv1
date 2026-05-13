import type { ModuleConfig } from '../shell/types';

export const M5: ModuleConfig = {
  id: 'M5',
  number: 5,
  title: 'Gas Exchange Basics',
  track: 'Physiology',
  estimated_minutes: 15,
  briefing: {
    overview: 'The ventilator and the alveolus are two different machines coupled through the blood. To set the vent rationally you need to know which knob fixes oxygenation and which knob fixes ventilation — and why FiO2 and PEEP aren\'t the same lever.',
    what_youll_do: [
      'Identify the four causes of hypoxemia and which respond to FiO2.',
      'Recognize when raising FiO2 alone fails — and PEEP is the better lever.',
      'Read the P/F ratio and the A-a gradient at a glance.',
    ],
  },
  visible_learning_objectives: [
    'Distinguish shunt from dead space by their characteristic gas exchange signatures.',
    'Recognize that shunt affects oxygenation primarily; dead space affects ventilation primarily.',
  ],

  primer_questions: [
    {
      id: 'M5-P1',
      prompt: 'Shunt is best defined as:',
      options: [
        { label: 'Alveoli that are ventilated but not perfused', is_correct: false, explanation: "That's dead space — the opposite." },
        { label: 'Alveoli that are perfused but not ventilated', is_correct: true, explanation: 'Shunt = perfusion without ventilation. Blood passes through unventilated lung and returns without picking up O2. Pneumonia, atelectasis, and ARDS all create shunt physiology.' },
        { label: 'Areas with both ventilation and perfusion', is_correct: false, explanation: "That's normal V/Q matching." },
        { label: 'Areas with neither', is_correct: false, explanation: 'Describes destroyed lung, not the standard shunt/dead-space definitions.' },
      ],
    },
    {
      id: 'M5-P2',
      prompt: 'Increasing FiO2 to 100% will substantially improve oxygenation in a patient with:',
      options: [
        { label: 'Pure shunt physiology', is_correct: false, explanation: "Pure shunt is FiO2-resistant — blood never contacts the O2 no matter how high the FiO2." },
        { label: 'V/Q mismatch (without true shunt)', is_correct: true, explanation: 'V/Q mismatch (low but nonzero ventilation) responds well to higher FiO2 — the O2 reaches alveoli inefficiently, and raising the concentration overcomes the inefficiency.' },
        { label: 'Anatomic shunt from a cardiac defect', is_correct: false, explanation: 'Anatomic shunt behaves like pure shunt — blood bypasses lungs.' },
        { label: 'None of the above', is_correct: false, explanation: 'B is correct.' },
      ],
    },
    {
      id: 'M5-P3',
      prompt: 'A patient develops a large pulmonary embolus. End-tidal CO2 will:',
      options: [
        { label: 'Rise abruptly', is_correct: false, explanation: 'Expected change is downward, not upward.' },
        { label: 'Fall abruptly because of increased dead space', is_correct: true, explanation: 'PE blocks pulmonary blood flow to ventilated alveoli — by definition dead space. Air moves in/out but no CO2 reaches them. ETCO2 drops sharply while arterial CO2 may stay normal or rise. The widening ETCO2-PaCO2 gradient is the dead-space signature.' },
        { label: "Be unchanged because PE doesn't affect ventilation", is_correct: false, explanation: 'PE has major effect on dead space and ETCO2.' },
        { label: 'Fall because of decreased oxygen delivery', is_correct: false, explanation: 'O2 delivery and ETCO2 are different physiologies.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'gas_exchange_demo',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 14, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 35, resistance: 10, spontaneousRate: 0, deadSpaceFraction: 0.45 },
    },
    unlocked_controls: ['compliance', 'fiO2', 'peep'],
    visible_readouts: ['pip', 'plat', 'spo2', 'pao2', 'paco2'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  // Two complementary tasks demonstrating shunt-vs-dead-space signatures with
  // the controls we actually have. Strict sequence so each is a clean
  // experiment; reset between so prior changes don't carry over.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: true,
    children: [
      {
        // Part A: shunt signature — drop compliance (proxy for collapsed alveoli).
        // SpO2 should fall. ETCO2/PaCO2 should be largely unchanged.
        kind: 'manipulation',
        control: 'compliance',
        condition: { type: 'delta_pct', direction: 'decrease', min_pct: 40 },
        require_acknowledgment: {
          question: 'You worsened the patient\'s lung disease (lower compliance — a shunt-like state). Which readout changed most?',
          options: [
            { label: 'SpO2 fell — oxygenation suffered', is_correct: true, explanation: 'Shunt = blood passing through unventilated alveoli. SpO2 falls; CO2 elimination is largely preserved. That\'s the oxygenation signature of shunt.' },
            { label: 'End-tidal CO2 fell', is_correct: false, explanation: 'A falling end-tidal CO2 with a widening ETCO2-PaCO2 gradient is the dead-space pattern, not shunt.' },
            { label: 'Both changed equally', is_correct: false, explanation: 'Shunt and dead space have distinct signatures. Shunt → SpO2 falls. Dead space → ETCO2 gradient widens.' },
            { label: 'Nothing changed', is_correct: false, explanation: 'Look at the SpO2 readout — it tracks oxygenation.' },
          ],
        },
      },
      {
        // Part B: V/Q-mismatch responsiveness — raise FiO2 high. SpO2 climbs back.
        kind: 'manipulation',
        control: 'fiO2',
        condition: { type: 'absolute', operator: '>=', value: 80 },
        require_acknowledgment: {
          question: 'You pushed FiO2 to ≥80% on the same struggling patient. What does the SpO2 response tell you?',
          options: [
            { label: 'It improved substantially — V/Q mismatch is FiO2-responsive', is_correct: true, explanation: 'V/Q mismatch (low but nonzero ventilation to alveoli) responds well to higher FiO2 — the gas reaches the alveoli, just inefficiently, and raising the concentration overcomes it.' },
            { label: 'It barely moved — this must be pure anatomic shunt', is_correct: false, explanation: 'In this preset compliance loss creates V/Q mismatch rather than absolute shunt, so FiO2 should help. Pure anatomic shunt would be unresponsive.' },
            { label: 'PaCO2 changed instead', is_correct: false, explanation: 'PaCO2 reflects ventilation, not oxygenation. FiO2 is an oxygenation lever.' },
            { label: 'Nothing changed', is_correct: false, explanation: 'Watch the SpO2 number as you push FiO2 up.' },
          ],
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Shunt = perfusion without ventilation** (low SpO2 resistant to FiO2). **Dead space = ventilation without perfusion** (rising PaCO2 with falling ETCO2). The two failures look superficially similar but require opposite reasoning.' },
    { kind: 'callout', tone: 'info', markdown: 'The ETCO2-to-PaCO2 gradient is normally < 5 mmHg. A widening gradient is the dead-space signature — even when the absolute numbers look normal.' },
  ],

  hint_ladder: {
    tier1: 'Try changing FiO2. Watch SpO2 and PaO2.',
    tier2: 'V/Q mismatch responds to FiO2. Shunt does not.',
    tier3: { hint_text: 'Use "Show me".' },
  },

  summative_quiz: [
    {
      id: 'M5-Q1',
      prompt: 'Severe ARDS, PaO2 55 on FiO2 100%. Most likely mechanism:',
      options: [
        { label: 'Pure dead space', is_correct: false },
        { label: 'Shunt', is_correct: true },
        { label: 'Diffusion limitation', is_correct: false },
        { label: 'Hypoventilation', is_correct: false },
      ],
      explanation: 'Hypoxemia unresponsive to 100% FiO2 = shunt. ARDS produces extensive shunt from collapsed/consolidated alveoli.',
    },
    {
      id: 'M5-Q2',
      prompt: 'You suspect PE. Most supportive gas-exchange finding:',
      options: [
        { label: 'Falling SpO2 with normal ETCO2', is_correct: false },
        { label: 'Falling ETCO2 with rising arterial CO2', is_correct: true },
        { label: 'Falling SpO2 with rising ETCO2', is_correct: false },
        { label: 'Rising ETCO2 with normal arterial CO2', is_correct: false },
      ],
      explanation: 'PE creates dead space. ETCO2 falls (unperfused alveoli have no CO2 to exhale); arterial CO2 may rise. Widening gradient is the classic signature.',
    },
    {
      id: 'M5-Q3',
      prompt: 'Which responds well to increasing FiO2?',
      options: [
        { label: 'Massive shunt from lobar pneumonia', is_correct: false },
        { label: 'V/Q mismatch from basilar atelectasis', is_correct: true },
        { label: 'Right-to-left intracardiac shunt', is_correct: false },
        { label: 'PE', is_correct: false },
      ],
      explanation: 'V/Q mismatch is FiO2-responsive. True shunt and intracardiac shunt are not. PE is dead space, not shunt.',
    },
    {
      id: 'M5-Q4',
      prompt: 'Dead space is best categorized as:',
      options: [
        { label: 'A problem of oxygenation', is_correct: false },
        { label: 'A problem of ventilation', is_correct: true },
        { label: 'A problem of perfusion', is_correct: false },
        { label: 'A problem of diffusion', is_correct: false },
      ],
      explanation: 'Dead space = wasted ventilation. The patient must breathe more to clear the same CO2.',
    },
    {
      id: 'M5-Q5',
      prompt: 'SpO2 89% on room air → 98% on FiO2 0.40. Most likely:',
      options: [
        { label: 'Pure shunt', is_correct: false },
        { label: 'V/Q mismatch', is_correct: true },
        { label: 'Right-to-left cardiac shunt', is_correct: false },
        { label: 'Hypoventilation alone', is_correct: false },
      ],
      explanation: 'Easy correction with modest FiO2 = V/Q mismatch signature.',
    },
  ],

  explore_card: {
    patient_context: 'A model patient whose shunt fraction and dead-space fraction you can dial independently. The point is to see *different* gas-exchange signatures for each.',
    unlocked_controls_description: [
      { name: 'Compliance (proxy for shunt severity)', description: 'lower compliance approximates ARDS-style shunt physiology in this sim.' },
      { name: 'FiO2', description: 'inspired oxygen concentration. 21–100%.' },
      { name: 'PEEP', description: 'end-expiratory pressure. Recruits collapsed alveoli (reduces shunt).' },
    ],
    readouts_description: [
      { name: 'SpO2', description: 'the oxygenation signal.' },
      { name: 'ETCO2 vs PaCO2', description: 'how much the end-tidal underestimates the arterial PaCO2. A widening gradient is the dead-space fingerprint.' },
      { name: 'PaO2', description: 'arterial oxygen tension.' },
    ],
    suggestions: [
      'Drop compliance into the ARDS range. Notice SpO2 fall.',
      'Push FiO2 up and watch how much (or how little) SpO2 recovers — that\'s the difference between V/Q mismatch and true shunt.',
      'The point: shunt and dead space have *different gas-exchange signatures*. One affects oxygenation. The other affects CO2 elimination.',
    ],
  },
  user_facing_task: "You'll demonstrate the gas-exchange signature of shunt vs dead space. Raise FiO2 substantially and observe whether oxygenation improves — that's the V/Q vs shunt distinction.",
  success_criteria_display: [
    'Push FiO2 to 80% or higher.',
    'Identify whether the response indicates V/Q mismatch (FiO2-responsive) or pure shunt (resistant).',
  ],
  task_framing_style: 'A',

  key_points: [
    'Shunt → oxygenation problem (FiO2-resistant in pure form).',
    'Dead space → ventilation problem (ETCO2 falls, PaCO2 rises).',
    'Widening ETCO2-PaCO2 gradient is the dead-space signature.',
    'V/Q mismatch is FiO2-responsive; pure shunt is not.',
  ],
};

export const M6: ModuleConfig = {
  id: 'M6',
  number: 6,
  title: 'Auto-PEEP and Air Trapping',
  track: 'Physiology',
  estimated_minutes: 15,
  briefing: {
    overview: 'When expiration runs out of time, air gets stuck in the lung. The trapped pressure (auto-PEEP) drives hypotension, dyssynchrony, and barotrauma — and it doesn\'t show up on the regular pressure readout. This module makes the invisible visible.',
    what_youll_do: [
      'Spot auto-PEEP on the expiratory flow waveform without doing a hold.',
      'Measure auto-PEEP with an end-expiratory hold maneuver.',
      'Apply the three levers (rate, I:E, bronchodilator) to resolve trapping.',
    ],
  },
  visible_learning_objectives: [
    'Recognize auto-PEEP on the flow-time waveform.',
    'Resolve auto-PEEP by adjusting respiratory rate or expiratory time.',
  ],

  primer_questions: [
    {
      id: 'M6-P1',
      prompt: 'Auto-PEEP refers to:',
      options: [
        { label: 'PEEP that the ventilator sets automatically', is_correct: false, explanation: '"Auto" refers to the patient, not the machine.' },
        { label: 'End-expiratory alveolar pressure exceeding set PEEP, from incomplete exhalation', is_correct: true, explanation: 'When expiratory time is too short relative to airway resistance, air doesn\'t fully exit before the next breath. Trapped volume creates pressure above set PEEP.' },
        { label: 'Transient early-inspiratory pressure', is_correct: false, explanation: 'Not auto-PEEP.' },
        { label: 'A safety feature preventing barotrauma', is_correct: false, explanation: 'Auto-PEEP is a pathology — it raises intrathoracic pressure, impairs venous return, increases work of breathing.' },
      ],
    },
    {
      id: 'M6-P2',
      prompt: 'Which patient is at highest risk for auto-PEEP?',
      options: [
        { label: 'Young trauma patient with normal lungs on VC', is_correct: false, explanation: 'Normal lungs have normal resistance — exhalation is fast.' },
        { label: 'Post-op patient with normal lungs on PSV', is_correct: false, explanation: 'Normal mechanics = normal exhalation times.' },
        { label: 'COPD patient on VC with rate 24', is_correct: true, explanation: 'COPD = high resistance + prolonged expiratory time. Rate 24 = ~1.5 s expiratory time. Classic auto-PEEP setup.' },
        { label: 'ARDS patient on low Vt with rate 18', is_correct: false, explanation: 'ARDS is compliance problem — exhalation is fast.' },
      ],
    },
    {
      id: 'M6-P3',
      prompt: 'On the flow-time waveform, the hallmark of auto-PEEP is:',
      options: [
        { label: 'Inspiratory flow is taller than normal', is_correct: false, explanation: 'Inspiratory flow height depends on set flow/pressure target.' },
        { label: 'Expiratory flow does not return to zero before the next breath', is_correct: true, explanation: 'Diagnostic sign. Gas is still flowing out when the next breath is delivered — the expiratory limb is cut off before baseline.' },
        { label: 'Square flow pattern', is_correct: false, explanation: 'Determined by mode (VC vs PC), not auto-PEEP.' },
        { label: 'Multiple peaks during a single breath', is_correct: false, explanation: 'Suggests dyssynchrony, not auto-PEEP.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'obstructive_baseline',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 12, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 50, resistance: 25, spontaneousRate: 0 },
    },
    unlocked_controls: ['respiratoryRate', 'iTime'],
    visible_readouts: ['pip', 'plat', 'totalPeep', 'autoPeep'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  // Stage 1: induce auto-PEEP by raising rate (autoPeep > 2). Stage 2: resolve it.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    children: [
      {
        kind: 'outcome',
        readouts: { autoPeep: { operator: '>', value: 2 } },
        sustain_breaths: 3,
      },
      {
        kind: 'outcome',
        readouts: { autoPeep: { operator: '<', value: 1 } },
        sustain_breaths: 5,
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Dynamic hyperinflation.** When expiratory time is shorter than the patient\'s expiratory time constant (R × C), gas stays trapped. The trapped volume produces a pressure called auto-PEEP — also intrinsic PEEP, also PEEPi.' },
    { kind: 'callout', tone: 'warn', markdown: 'Severe auto-PEEP causes hypotension by raising intrathoracic pressure and reducing venous return. In extremis, **disconnect the patient from the vent** to let the lungs deflate.' },
    { kind: 'predict_observe', predict: 'Predict: when you raise the rate, the expiratory flow trace will...', observe: 'The expiratory flow doesn\'t return to baseline before the next breath cuts it off. That truncated expiratory limb IS the diagnostic sign.' },
  ],

  hint_ladder: {
    tier1: 'Try increasing the respiratory rate. Watch the flow waveform.',
    tier2: 'Once you see flow not returning to zero, resolve it by lowering rate or shortening I-time.',
    tier3: { hint_text: 'Use "Show me".', demonstration: { control: 'respiratoryRate', target_value: 25 } },
  },

  summative_quiz: [
    {
      id: 'M6-Q1',
      prompt: 'Most reliable way to confirm auto-PEEP:',
      options: [
        { label: 'Pressure-time slow upslope', is_correct: false },
        { label: 'Flow-time: expiratory flow not returning to zero', is_correct: true },
        { label: 'Chest X-ray', is_correct: false },
        { label: 'Check set PEEP value', is_correct: false },
      ],
      explanation: 'Flow waveform is the diagnostic display. Set PEEP tells you nothing about auto-PEEP, which is intrinsic.',
    },
    {
      id: 'M6-Q2',
      prompt: 'COPD on VC, auto-PEEP at rate 24. Most direct intervention:',
      options: [
        { label: 'Increase PEEP', is_correct: false },
        { label: 'Increase Vt', is_correct: false },
        { label: 'Reduce respiratory rate', is_correct: true },
        { label: 'Increase FiO2', is_correct: false },
      ],
      explanation: 'Auto-PEEP from inadequate expiratory time. Reducing rate lengthens each cycle, giving more time for expiration.',
    },
    {
      id: 'M6-Q3',
      prompt: 'Auto-PEEP is hemodynamically dangerous because it:',
      options: [
        { label: 'Causes bradycardia', is_correct: false },
        { label: 'Increases intrathoracic pressure, reducing venous return', is_correct: true },
        { label: 'Directly raises BP', is_correct: false },
        { label: 'Increases tissue O2 extraction', is_correct: false },
      ],
      explanation: 'Trapped gas under pressure compresses great veins, reduces preload, drops CO. Severe auto-PEEP can cause arrest.',
    },
    {
      id: 'M6-Q4',
      prompt: 'Least likely to develop auto-PEEP:',
      options: [
        { label: 'Severe asthma on VC', is_correct: false },
        { label: 'COPD on PSV with high rate', is_correct: false },
        { label: 'ARDS on lung-protective VC with high rate', is_correct: true },
        { label: 'Bronchiolitis with prolonged expiratory phase', is_correct: false },
      ],
      explanation: 'ARDS is low compliance, not high resistance. Stiff lung empties quickly. High rates in ARDS don\'t trap.',
    },
    {
      id: 'M6-Q5',
      prompt: 'Asthma + auto-PEEP → sudden hypotension. First emergency maneuver:',
      options: [
        { label: 'Push bolus epinephrine', is_correct: false },
        { label: 'Disconnect briefly from vent to allow full exhalation', is_correct: true },
        { label: 'Increase PEEP', is_correct: false },
        { label: 'Increase FiO2', is_correct: false },
      ],
      explanation: 'Disconnect, watch chest deflate, reconnect with reduced rate and longer expiratory time. Known emergency maneuver in severe asthma.',
    },
  ],

  explore_card: {
    patient_context: 'This patient has narrowed airways (COPD-like). Compliance is normal; resistance is elevated. Exhalation takes longer than normal.',
    unlocked_controls_description: [
      { name: 'Respiratory rate', description: 'breaths per minute. Range 8–32. Higher rate = less expiratory time per breath.' },
      { name: 'I-time', description: 'ratio of inspiratory to expiratory time is implicit. A shorter I-time gives the lungs more time to empty.' },
    ],
    readouts_description: [
      { name: 'Flow waveform — expiratory limb', description: 'does it return to zero before the next breath starts?' },
      { name: 'Auto-PEEP', description: 'the trapped pressure in the alveoli at end-expiration.' },
      { name: 'Total PEEP', description: 'set PEEP + auto-PEEP.' },
    ],
    suggestions: [
      'Crank the rate up to 24. Watch the flow waveform — does expiration finish?',
      'At a high rate, try shortening I-time vs lengthening it. What changes?',
      'The goal of exploration: get a feel for *creating* and *resolving* the trapping pattern.',
    ],
  },
  user_facing_task: "Your task has two parts. First, push the ventilator settings until this patient is trapping air, then identify what you're seeing. Second, resolve the trapping by adjusting the settings until exhalation completes between breaths again.",
  success_criteria_display: [
    "Stage 1: get the patient into a trapping pattern (auto-PEEP rises above 2 cmH2O).",
    "Stage 2: bring the patient back to a normal pattern (auto-PEEP < 1, sustained for several breaths).",
  ],
  task_framing_style: 'A',

  key_points: [
    'Auto-PEEP = trapped end-expiratory pressure from incomplete exhalation.',
    'Flow waveform diagnostic: expiratory flow does not reach zero before next breath.',
    'Primary levers: lower respiratory rate, extend expiratory time.',
    'Obstructive patients are highest risk.',
    'Severe auto-PEEP → hypotension → disconnect to relieve.',
  ],
};
