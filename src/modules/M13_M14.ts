import type { ModuleConfig } from '../shell/types';

export const M13: ModuleConfig = {
  id: 'M13',
  number: 13,
  title: 'PEEP — What It Does and How to Set It',
  track: 'Strategy',
  estimated_minutes: 16,
  visible_learning_objectives: [
    'Perform a stepwise PEEP titration and identify the PEEP at which compliance peaks.',
    'Distinguish appropriate from inappropriate uses of PEEP.',
  ],

  primer_questions: [
    {
      id: 'M13-P1',
      prompt: 'PEEP primarily helps oxygenation by:',
      options: [
        { label: 'Increasing FiO2 delivered to alveoli', is_correct: false, explanation: 'FiO2 and PEEP are independent. PEEP changes alveolar geometry, not gas concentration.' },
        { label: 'Keeping alveoli open at end-expiration that would otherwise collapse', is_correct: true, explanation: 'Holds alveolar pressure above atmospheric at end-expiration, preventing collapse of unstable alveoli. Recruited alveoli participate in gas exchange.' },
        { label: 'Increasing spontaneous RR', is_correct: false, explanation: 'PEEP doesn\'t drive RR.' },
        { label: 'Lowering WOB in spontaneous patients', is_correct: false, explanation: 'Can incidentally do this with auto-PEEP matching, but primary mechanism is recruitment.' },
      ],
    },
    {
      id: 'M13-P2',
      prompt: 'Too much PEEP can:',
      options: [
        { label: 'Cause overdistension and impair venous return', is_correct: true, explanation: 'Raises mean intrathoracic pressure → impedes VR → drops CO. Also overdistends open alveoli, increases dead space, reduces compliance. Sweet spot for every patient.' },
        { label: 'Only cause harm above 30 cmH2O', is_correct: false, explanation: 'Significant harm at much lower PEEP in hypovolemic, hyperinflated, RV-compromised patients.' },
        { label: 'Improve oxygenation in any patient regardless of physiology', is_correct: false, explanation: 'In hyperinflated patients (COPD, asthma), PEEP can worsen ventilation.' },
        { label: 'Eliminate FiO2 supplementation', is_correct: false, explanation: 'They work together.' },
      ],
    },
    {
      id: 'M13-P3',
      prompt: 'A decremental PEEP trial is a method for:',
      options: [
        { label: 'Finding the lowest PEEP maintaining adequate oxygenation', is_correct: false, explanation: 'Conflates two ideas. Best PEEP = highest compliance, often NOT the lowest PEEP.' },
        { label: 'Finding the PEEP at which lung compliance is highest', is_correct: true, explanation: 'Walk PEEP down step-by-step after recruitment, measure compliance at each step. PEEP just above where compliance falls is "best PEEP."' },
        { label: 'Weaning toward extubation', is_correct: false, explanation: 'Weaning is separate.' },
        { label: 'Testing for auto-PEEP', is_correct: false, explanation: 'Auto-PEEP detected on flow waveform.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'ards_baseline_vc',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 400, respiratoryRate: 18, peep: 5, fiO2: 60, iTime: 1.0 },
      patient: { compliance: 25, resistance: 12, spontaneousRate: 0 },
    },
    unlocked_controls: ['peep'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'spo2', 'pao2'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  // Approximation: track that the learner has experienced multiple PEEP values
  // (delta_pct increases over baseline). A richer implementation would record
  // compliance per PEEP and ask which was highest.
  hidden_objective: {
    kind: 'manipulation',
    control: 'peep',
    condition: { type: 'absolute', operator: '>=', value: 12 },
    require_acknowledgment: {
      question: 'You explored higher PEEP. As PEEP rises in ARDS, compliance typically:',
      options: [
        { label: 'Rises to a peak, then falls as alveoli overdistend', is_correct: true },
        { label: 'Always rises with PEEP', is_correct: false },
        { label: 'Always falls', is_correct: false },
        { label: 'Stays constant', is_correct: false },
      ],
    },
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Decremental PEEP titration.** Recruit, then walk PEEP down. Record compliance at each step. The PEEP just above where compliance starts to fall is "best PEEP." Above it: overdistension. Below it: derecruitment.' },
    { kind: 'callout', tone: 'tip', markdown: 'Driving pressure = Pplat − PEEP. Tracks the elastic load on the alveoli. Driving pressures > 15 are associated with worse outcomes in ARDS (M15).' },
    { kind: 'predict_observe', predict: 'Walk PEEP from 5 → 11 → 17. Predict where compliance is highest.', observe: 'Compliance rises with PEEP up to a point (alveolar recruitment), then falls (overdistension). The peak is "best PEEP."' },
  ],

  hint_ladder: {
    tier1: 'Walk PEEP up in steps. Wait several breaths between adjustments. Watch the compliance behavior.',
    tier2: 'Try PEEP 5, 8, 11, 14. The lowest driving pressure marks the best compliance.',
    tier3: { hint_text: 'Use "Show me" to step through.', demonstration: { control: 'peep', target_value: 12 } },
  },

  summative_quiz: [
    {
      id: 'M13-Q1',
      prompt: 'Decremental PEEP trial: PEEP 5 → C 24; PEEP 8 → 28; PEEP 11 → 33; PEEP 14 → 30; PEEP 17 → 26. Best PEEP:',
      options: [
        { label: '5', is_correct: false },
        { label: '8', is_correct: false },
        { label: '11', is_correct: true },
        { label: '17', is_correct: false },
      ],
      explanation: 'Best PEEP = highest static compliance. PEEP 11 → 33. Below: collapsing. Above: overdistending.',
    },
    {
      id: 'M13-Q2',
      prompt: 'ARDS on PEEP 14, FiO2 0.6, SpO2 92%. Acute hypotension after PEEP increase from 10. Most likely cause:',
      options: [
        { label: 'Sepsis worsening', is_correct: false },
        { label: 'PEEP-induced reduction in venous return', is_correct: true },
        { label: 'Pneumothorax', is_correct: false },
        { label: 'Inadequate sedation', is_correct: false },
      ],
      explanation: 'Timing immediately after PEEP increase points at PEEP\'s hemodynamic effect.',
    },
    {
      id: 'M13-Q3',
      prompt: 'PEEP provides LEAST oxygenation benefit in:',
      options: [
        { label: 'Diffuse atelectasis', is_correct: false },
        { label: 'Pulmonary edema', is_correct: false },
        { label: 'Pure shunt from intracardiac defect', is_correct: true },
        { label: 'Early ARDS with recruitable alveoli', is_correct: false },
      ],
      explanation: 'Anatomic shunt: blood bypasses lungs entirely. PEEP works by recruiting alveoli; can\'t help blood that bypasses.',
    },
    {
      id: 'M13-Q4',
      prompt: 'Severe COPD with dynamic hyperinflation. Extrinsic PEEP can:',
      options: [
        { label: 'Always worsen auto-PEEP', is_correct: false },
        { label: 'Match intrinsic PEEP and improve trigger work', is_correct: true },
        { label: 'Replace bronchodilators', is_correct: false },
        { label: 'Cure obstruction', is_correct: false },
      ],
      explanation: 'Extrinsic PEEP at ~80% of intrinsic reduces trigger work without worsening trapping. Above that, problem worsens.',
    },
    {
      id: 'M13-Q5',
      prompt: 'Driving pressure is:',
      options: [
        { label: 'Peak − PEEP', is_correct: false },
        { label: 'Plateau − PEEP', is_correct: true },
        { label: 'Peak − plateau', is_correct: false },
        { label: 'Mean − PEEP', is_correct: false },
      ],
      explanation: 'Plateau − PEEP. Represents the pressure to deliver Vt across compliance. > 15 → worse outcomes in ARDS.',
    },
  ],

  key_points: [
    'PEEP recruits collapsed alveoli.',
    'Decremental titration finds the compliance peak.',
    'Too much PEEP overdistends and impairs hemodynamics.',
    'Anatomic shunt is not PEEP-responsive.',
    'Driving pressure = Pplat − PEEP. < 15 in ARDS.',
  ],
};

export const M14: ModuleConfig = {
  id: 'M14',
  number: 14,
  title: 'Oxygenation Strategies',
  track: 'Strategy',
  estimated_minutes: 14,
  visible_learning_objectives: [
    'Recognize that mean airway pressure is the primary determinant of oxygenation.',
    'Identify the multiple levers (FiO2, PEEP, inspiratory time) that affect oxygenation.',
  ],

  primer_questions: [
    {
      id: 'M14-P1',
      prompt: 'Oxygenation correlates most strongly with:',
      options: [
        { label: 'Peak inspiratory pressure', is_correct: false, explanation: 'Peak is max, not average. Brief excursions don\'t recruit for the rest of the cycle.' },
        { label: 'Mean airway pressure', is_correct: true, explanation: 'Time-weighted average. Reflects total time alveoli spend at higher pressure — when gas exchange happens. PEEP, longer Ti, recruitment all work by raising mean Paw.' },
        { label: 'Tidal volume', is_correct: false, explanation: 'Affects CO2 more than oxygenation.' },
        { label: 'Respiratory rate', is_correct: false, explanation: 'A MV lever, affects CO2.' },
      ],
    },
    {
      id: 'M14-P2',
      prompt: 'What raises mean airway pressure WITHOUT raising peak?',
      options: [
        { label: 'Increasing Ti at same pressure target', is_correct: true, explanation: 'Longer Ti = more cycle time at elevated pressure. Mean rises, peak doesn\'t.' },
        { label: 'Increasing peak Pinsp', is_correct: false, explanation: 'Raises both.' },
        { label: 'Decreasing rate', is_correct: false, explanation: 'Generally lowers mean.' },
        { label: 'Decreasing PEEP', is_correct: false, explanation: 'Lowers mean.' },
      ],
    },
    {
      id: 'M14-P3',
      prompt: 'FiO2 and PEEP are titrated together (ARDSnet-style) because:',
      options: [
        { label: 'They have identical effects', is_correct: false, explanation: 'Different mechanisms.' },
        { label: 'Both contribute to oxygenation; balancing avoids prolonged toxic FiO2', is_correct: true, explanation: 'High FiO2 > 60% for many days → oxidative lung injury. PEEP can let FiO2 come down. ARDSnet table guides escalation.' },
        { label: 'Ventilator enforces a fixed ratio', is_correct: false, explanation: 'Independently adjustable.' },
        { label: 'PEEP can\'t work without high FiO2', is_correct: false, explanation: 'PEEP works at any FiO2.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'passive_pc_baseline',
    preset: {
      mode: 'PCV',
      settings: { pInsp: 15, respiratoryRate: 14, peep: 5, fiO2: 50, iTime: 1.0 },
      patient: { compliance: 50, resistance: 10, spontaneousRate: 0 },
    },
    unlocked_controls: ['iTime', 'peep', 'fiO2'],
    visible_readouts: ['pip', 'spo2', 'pao2'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'manipulation',
    control: 'iTime',
    condition: { type: 'delta_pct', direction: 'increase', min_pct: 50 },
    require_acknowledgment: {
      question: 'You lengthened Ti. What happened to peak and mean airway pressure?',
      options: [
        { label: 'Peak unchanged, mean rose', is_correct: true },
        { label: 'Both rose', is_correct: false },
        { label: 'Both fell', is_correct: false },
        { label: 'Only peak rose', is_correct: false },
      ],
    },
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Four oxygenation levers**: FiO2, PEEP, inspiratory time, and the pressure target itself. The first three raise mean airway pressure; FiO2 raises the inspired O2 concentration directly.' },
    { kind: 'callout', tone: 'info', markdown: 'When FiO2 is already > 0.60, the next step is usually PEEP — not pushing FiO2 to 1.0. Long high FiO2 is oxidatively injurious.' },
  ],

  hint_ladder: {
    tier1: 'Try changing Ti. Watch the PIP value.',
    tier2: 'Ti controls how long each breath holds its pressure. Lengthening it raises the time-averaged pressure.',
    tier3: { hint_text: 'Use "Show me".', demonstration: { control: 'iTime', target_value: 1.6 } },
  },

  summative_quiz: [
    {
      id: 'M14-Q1',
      prompt: 'Improve oxygenation on PC without raising peak:',
      options: [
        { label: 'Increase rate', is_correct: false },
        { label: 'Increase Ti', is_correct: true },
        { label: 'Decrease PEEP', is_correct: false },
        { label: 'Decrease FiO2', is_correct: false },
      ],
      explanation: 'Longer Ti keeps alveoli pressurized for more of each cycle → higher mean without higher peak.',
    },
    {
      id: 'M14-Q2',
      prompt: 'FiO2 0.90, PEEP 8, SpO2 88%. Next step (ARDSnet-style):',
      options: [
        { label: 'Reduce FiO2', is_correct: false },
        { label: 'Increase PEEP before further FiO2', is_correct: true },
        { label: 'Both to max', is_correct: false },
        { label: 'Add iNO', is_correct: false },
      ],
      explanation: 'FiO2 very high; next is PEEP. NO is rescue, not first-line.',
    },
    {
      id: 'M14-Q3',
      prompt: 'Mean airway pressure depends on all EXCEPT:',
      options: [
        { label: 'PEEP', is_correct: false },
        { label: 'Ti', is_correct: false },
        { label: 'Peak Pinsp', is_correct: false },
        { label: 'FiO2', is_correct: true },
      ],
      explanation: 'FiO2 = gas composition, not pressure profile.',
    },
    {
      id: 'M14-Q4',
      prompt: 'ARDS improved. Settings FiO2 0.5, PEEP 12, SpO2 96%. Next step:',
      options: [
        { label: 'Reduce FiO2 toward 0.4', is_correct: true },
        { label: 'Reduce PEEP toward 5', is_correct: false },
        { label: 'Reduce both simultaneously', is_correct: false },
        { label: 'Maintain', is_correct: false },
      ],
      explanation: 'FiO2 down first (toxic exposure). PEEP held until oxygenation reliably stable, then weaned cautiously.',
    },
    {
      id: 'M14-Q5',
      prompt: 'Very long Ti (inverse I:E) main risk:',
      options: [
        { label: 'Hypocarbia', is_correct: false },
        { label: 'Insufficient expiratory time → auto-PEEP', is_correct: true },
        { label: 'Reduced FiO2 delivery', is_correct: false },
        { label: 'Hyperoxia', is_correct: false },
      ],
      explanation: 'Long Ti at expense of expiratory time → gas trapping.',
    },
  ],

  key_points: [
    'Mean airway pressure drives oxygenation.',
    'Levers: FiO2, PEEP, Ti, peak pressure target.',
    'FiO2 is independent of pressure profile (no effect on mean Paw).',
    'Wean FiO2 before PEEP; avoid prolonged FiO2 > 0.60.',
    'Inverse I:E risks auto-PEEP.',
  ],
};
