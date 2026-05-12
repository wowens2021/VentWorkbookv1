import type { ModuleConfig } from '../shell/types';

export const M3: ModuleConfig = {
  id: 'M3',
  number: 3,
  title: 'The Equation of Motion',
  track: 'Foundations',
  estimated_minutes: 18,
  visible_learning_objectives: [
    'State the equation of motion.',
    'Predict which waveform component changes when compliance, resistance, or flow rate is altered.',
  ],

  primer_questions: [
    {
      id: 'M3-P1',
      prompt: 'The equation of motion describes the pressure required to deliver a breath. Which are its three main components?',
      options: [
        { label: 'Volume, flow, and PEEP', is_correct: false, explanation: 'Volume and flow are inputs to the equation, but the equation is organized around what opposes movement of gas — elastance and resistance, plus baseline PEEP.' },
        { label: 'An elastic component, a resistive component, and PEEP', is_correct: true, explanation: 'Pressure = (volume / compliance) + (flow × resistance) + PEEP. Elastic = stretching the lungs. Resistive = pushing gas through airways. PEEP = the floor.' },
        { label: 'Peak pressure, plateau pressure, and mean pressure', is_correct: false, explanation: 'These are derived measurements, not components of the equation.' },
        { label: 'Compliance, resistance, and oxygenation', is_correct: false, explanation: 'Oxygenation is a separate physiology problem (gas exchange), not part of the mechanical equation.' },
      ],
    },
    {
      id: 'M3-P2',
      prompt: 'In a passive patient on volume control, if you suddenly increase airway resistance (e.g., mucus plug), what happens to peak and plateau?',
      options: [
        { label: 'Both rise equally', is_correct: false, explanation: 'That\'s the pattern for a compliance change, not a resistance change.' },
        { label: 'Peak rises, plateau is unchanged', is_correct: true, explanation: 'Resistance is the price of pushing gas through airways during flow. Once flow stops at end-inspiration (plateau hold), resistive pressure disappears. A pure resistance change widens the peak-plateau gap.' },
        { label: 'Plateau rises, peak is unchanged', is_correct: false, explanation: 'Impossible — peak occurs during flow and includes the resistive component on top of elastic.' },
        { label: 'Both fall', is_correct: false, explanation: 'Increasing resistance can only raise pressure, not lower it.' },
      ],
    },
    {
      id: 'M3-P3',
      prompt: 'If you increase the inspiratory flow rate in volume control with everything else the same, what happens to peak pressure?',
      options: [
        { label: 'It falls because the breath is delivered faster', is_correct: false, explanation: 'Faster delivery doesn\'t reduce pressure — quite the opposite.' },
        { label: 'It rises because the resistive component scales with flow', is_correct: true, explanation: 'From the equation: pressure = elastic + (flow × resistance) + PEEP. Doubling flow doubles the resistive component, raising peak. Plateau (after flow stops) is unchanged.' },
        { label: 'It stays the same because the tidal volume is unchanged', is_correct: false, explanation: 'Tidal volume determines elastic; flow determines resistive. Peak includes both.' },
        { label: 'It depends entirely on compliance', is_correct: false, explanation: 'Compliance affects elastic, but the resistive contribution is set by resistance × flow.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'passive_baseline_vc',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 12, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 50, resistance: 10, spontaneousRate: 0 },
    },
    unlocked_controls: ['compliance', 'resistance', 'iTime'],
    visible_readouts: ['pip', 'plat', 'drivingPressure'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'any_order',
    reset_between: true,
    children: [
      {
        kind: 'manipulation',
        control: 'resistance',
        condition: { type: 'delta_pct', direction: 'increase', min_pct: 50 },
        require_acknowledgment: {
          question: 'You raised resistance. What happened to the peak-to-plateau gap?',
          options: [
            { label: 'Widened', is_correct: true, explanation: 'Resistance only contributes pressure while gas is flowing. Peak (during flow) rises; plateau (after the pause, with flow = 0) is unchanged. The gap widens by exactly the resistive contribution.' },
            { label: 'Narrowed', is_correct: false, explanation: 'Narrowing would mean plateau caught up to peak — that\'s a compliance pattern, not resistance.' },
            { label: 'Unchanged', is_correct: false, explanation: 'The resistive pressure only shows during flow, so increasing resistance must change peak relative to plateau.' },
          ],
        },
      },
      {
        kind: 'manipulation',
        control: 'compliance',
        condition: { type: 'delta_pct', direction: 'decrease', min_pct: 30 },
        require_acknowledgment: {
          question: 'You decreased compliance. What happened to peak and plateau?',
          options: [
            { label: 'Both rose together', is_correct: true, explanation: 'Reducing compliance raises the elastic component (V/C), which lifts both peak and plateau by the same amount. The gap stays constant because resistance didn\'t change.' },
            { label: 'Only peak rose', is_correct: false, explanation: 'That\'s the resistance pattern. A pure compliance change carries both peak and plateau upward together.' },
            { label: 'Only plateau rose', is_correct: false, explanation: 'Impossible — peak always includes everything that builds plateau, plus the resistive component on top.' },
            { label: 'Both fell', is_correct: false, explanation: 'Stiffer lungs need more pressure for the same volume, not less.' },
          ],
        },
      },
      {
        // Third piece: inspiratory flow. Our sim exposes I-time (inverse of flow).
        // Decreasing I-time at fixed Vt raises peak flow → larger resistive component.
        kind: 'manipulation',
        control: 'iTime',
        condition: { type: 'delta_pct', direction: 'decrease', min_pct: 30 },
        require_acknowledgment: {
          question: 'You shortened I-time (which raises inspiratory flow). What happened to the peak pressure?',
          options: [
            { label: 'Rose — the resistive component scales with flow', is_correct: true, explanation: 'P = (V/C) + (F × R) + PEEP. Higher flow at the same resistance means a larger resistive contribution, lifting peak. Plateau is unaffected because it\'s measured after flow stops.' },
            { label: 'Fell because the breath was delivered faster', is_correct: false, explanation: '"Faster = easier" intuition fails for resistive airways. Faster delivery raises peak.' },
            { label: 'Unchanged', is_correct: false, explanation: 'Watch the peak number when you change I-time — it moves.' },
          ],
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Pressure = (volume / compliance) + (flow × resistance) + PEEP.** Every waveform pattern in the rest of the workbook is an expression of this equation. The two components above PEEP — elastic and resistive — separate on the waveform: elastic determines plateau; resistive determines the peak-plateau gap.' },
    { kind: 'callout', tone: 'tip', markdown: '**Elastic** = the price of stretching the lungs. **Resistive** = the price of pushing gas through airways while flow is happening. Stop the flow (inspiratory pause), and resistive pressure vanishes.' },
    { kind: 'predict_observe', predict: 'You\'re about to decrease compliance (stiffen the lungs). Predict: will peak rise, will plateau rise, will the peak-plateau gap change?', observe: 'Both peak and plateau rose — by approximately the same amount. The gap stayed the same because resistance didn\'t change. The elastic component carried both upward together.' },
    { kind: 'predict_observe', predict: 'Now you\'ll increase resistance. What changes — peak only? Plateau only? Both?', observe: 'Peak rose sharply; plateau stayed about where it was. The gap widened. That gap is the resistive component.' },
  ],

  hint_ladder: {
    tier1: 'Try changing one of the three unlocked controls (compliance, resistance, I-time).',
    tier2: 'Adjust compliance and resistance separately. Watch what happens to the gap between peak and plateau pressure.',
    tier3: { hint_text: 'Use "Show me" to demonstrate.', demonstration: { control: 'compliance', target_value: 30 } },
  },

  summative_quiz: [
    {
      id: 'M3-Q1',
      prompt: 'Write the equation of motion. Which of the following is correct?',
      options: [
        { label: 'Pressure = (volume × compliance) + (flow / resistance) + PEEP', is_correct: false },
        { label: 'Pressure = (volume / compliance) + (flow × resistance) + PEEP', is_correct: true },
        { label: 'Pressure = volume × flow + resistance + PEEP', is_correct: false },
        { label: 'Pressure = compliance + resistance + PEEP', is_correct: false },
      ],
      explanation: 'Elastic = volume / compliance (more volume in stiff lung = more pressure). Resistive = flow × resistance. PEEP is the baseline. Operators (multiplication vs. division) flip relationships.',
    },
    {
      id: 'M3-Q2',
      prompt: 'You increase the set tidal volume by 50% on VC. What happens to peak and the peak-plateau gap?',
      options: [
        { label: 'Peak rises; gap unchanged', is_correct: true },
        { label: 'Peak rises; gap widens', is_correct: false },
        { label: 'Peak rises; gap narrows', is_correct: false },
        { label: 'Peak unchanged; gap unchanged', is_correct: false },
      ],
      explanation: 'More volume raises elastic (both peak and plateau rise together). Resistive depends on flow, not volume — gap unchanged at constant flow.',
    },
    {
      id: 'M3-Q3',
      prompt: 'A patient on VC develops bronchospasm. Peak rises from 24 to 38. What do you expect plateau to do?',
      options: [
        { label: 'Rise from 18 to 32 (parallel)', is_correct: false },
        { label: 'Rise from 18 to 20 (small or no change)', is_correct: true },
        { label: 'Fall as the airways constrict', is_correct: false },
        { label: 'Stay exactly the same; bronchospasm doesn\'t affect plateau', is_correct: false },
      ],
      explanation: 'Bronchospasm raises resistance — it raises peak but not plateau. Expect a widening peak-plateau gap.',
    },
    {
      id: 'M3-Q4',
      prompt: 'C = 50 mL/cmH2O, R = 10. Deliver 500 mL at 60 L/min flow with PEEP 5. Peak pressure ≈',
      options: [
        { label: '10', is_correct: false },
        { label: '20', is_correct: false },
        { label: '25', is_correct: true },
        { label: '50', is_correct: false },
      ],
      explanation: 'Elastic = 500/50 = 10. Resistive = 1 L/s × 10 = 10. PEEP = 5. Total = 25 cmH2O.',
    },
    {
      id: 'M3-Q5',
      prompt: 'The clinical value of the equation of motion is that it tells you:',
      options: [
        { label: 'The exact pressure to set on the ventilator', is_correct: false },
        { label: 'Which waveform component will change when a specific physiologic variable changes', is_correct: true },
        { label: 'The minute ventilation', is_correct: false },
        { label: 'Whether the patient is hypoxic', is_correct: false },
      ],
      explanation: 'The equation isn\'t a calculator you run at the bedside — it\'s a mental model. Every diagnostic move in later modules comes back to this framework.',
    },
  ],

  explore_card: {
    patient_context: 'Passive patient on volume control. Three sliders are unlocked; each maps to one term in the equation of motion.',
    unlocked_controls_description: [
      { name: 'Compliance', description: 'how easily the lungs stretch. Lower = stiffer lungs. Range 15–80 mL/cmH2O.' },
      { name: 'Resistance', description: 'how hard it is to push gas through airways. Higher = more obstruction. Range 5–40 cmH2O/L/s.' },
      { name: 'I-time / inspiratory flow', description: 'shorter I-time = faster flow. Range 0.3–3.0 sec.' },
    ],
    readouts_description: [
      { name: 'Peak pressure and plateau pressure', description: 'the difference between these (the "gap") is the heart of the equation.' },
      { name: 'Peak − Plateau', description: 'shown live as Driving Pressure for convenience.' },
    ],
    suggestions: [
      'Cut compliance in half. Watch both peak and plateau move together.',
      'Restore compliance, then double resistance. Watch peak rise while plateau stays the same.',
      'Restore resistance, then shorten I-time (= raise flow). Watch what happens to peak.',
      'You can use "Reset to start" between experiments to keep your bearings.',
    ],
  },
  user_facing_task: "You're going to show your senior that you understand the three pieces of the equation of motion. Make three separate changes to the simulator — one to compliance, one to resistance, and one to inspiratory flow — and answer a short question after each.",
  success_criteria_display: [
    'Change resistance and identify what happens to the peak-plateau gap.',
    'Change compliance and identify what happens to peak and plateau.',
    'Change inspiratory flow and identify what happens to peak pressure.',
    "You can do them in any order. Use 'Reset to start' between changes if it helps.",
  ],
  task_framing_style: 'A',

  key_points: [
    'P = (V/C) + (F × R) + PEEP.',
    'Elastic component = volume / compliance → drives plateau pressure.',
    'Resistive component = flow × resistance → drives the peak-plateau gap.',
    'Pure compliance change: peak and plateau rise together (gap unchanged).',
    'Pure resistance change: peak rises, plateau is unchanged (gap widens).',
  ],
};
