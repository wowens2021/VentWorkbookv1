import type { ModuleConfig } from '../shell/types';

/**
 * M4a — Compliance
 * Track: Physiology · Phases: Primer → Read → Explore → Try It → Debrief.
 *
 * Per the M1M2_M4a_M4b shell spec, the legacy combined M4 ("Compliance
 * and Resistance") splits into two focused modules. M4a teaches
 * respiratory-system compliance as a property of the lung — what it is,
 * how it shows up on the pressure waveform in volume control, and how to
 * measure it from Pplat and PEEP. Resistance lives in M4b.
 */
export const Compliance: ModuleConfig = {
  id: 'compliance',
  number: 4,
  title: 'Compliance',
  track: 'Physiology',
  estimated_minutes: 17,
  briefing: {
    tagline: 'Compliance = ΔV / ΔP.',
    overview:
      'Compliance is how much volume the lung accepts per unit of pressure — `C = ΔV / ΔP`, measured in mL/cmH2O. A stiff lung needs more pressure for the same volume; a floppy lung needs less. This module focuses on compliance alone — what it is, how it changes the pressure waveform in volume control, and how to compute it at the bedside from plateau pressure and PEEP.',
    what_youll_do: [
      'See how lowering compliance moves Ppeak and Pplat together — the parallel-rise signature.',
      'Compute static compliance from Vt, Pplat, and PEEP.',
      'Recognize the clinical conditions that reduce compliance and why Pplat is the safety limit.',
    ],
  },

  visible_learning_objectives: [
    'Define respiratory-system compliance and explain how it is calculated from plateau pressure and PEEP.',
    'Predict how a compliance change affects the pressure waveform in volume control (peak and plateau move together).',
    'Recognize clinical conditions that reduce compliance and understand why plateau pressure is the relevant safety limit.',
  ],

  primer_questions: [
    {
      id: 'M4a-P1',
      prompt: 'Compliance of the respiratory system is defined as:',
      options: [
        { label: 'The pressure required to overcome airway resistance', is_correct: false, explanation: 'That is the resistive pressure component, not compliance.' },
        { label: 'The change in volume per unit change in pressure (ΔV / ΔP)', is_correct: true, explanation: 'C = ΔV / ΔP. High compliance = lungs distend easily. Low compliance = stiff lungs needing more pressure per unit volume.' },
        { label: 'The peak inspiratory pressure during a breath', is_correct: false, explanation: 'Ppeak is a measurement influenced by both compliance and resistance.' },
        { label: 'The ratio of inspiratory to expiratory time', is_correct: false, explanation: 'That is the I:E ratio, an unrelated setting.' },
      ],
    },
    {
      id: 'M4a-P2',
      prompt: 'A passive patient on volume control has a compliance change. Which finding best distinguishes a compliance problem from a resistance problem?',
      options: [
        { label: 'Peak pressure rises while plateau pressure is unchanged', is_correct: false, explanation: 'That is the resistance pattern, not compliance.' },
        { label: 'Both peak pressure and plateau pressure rise together', is_correct: true, explanation: 'In VC with fixed Vt and flow, a compliance change moves both peak and plateau in the same direction. The gap (Ppeak − Pplat) stays roughly the same.' },
        { label: 'Plateau pressure falls while peak pressure is unchanged', is_correct: false, explanation: 'Plateau cannot fall while peak is unchanged in volume control; they move together with compliance changes.' },
        { label: 'Neither peak nor plateau changes', is_correct: false, explanation: 'A real compliance change must affect alveolar pressure, which is what plateau reflects.' },
      ],
    },
    {
      id: 'M4a-P3',
      prompt: 'Static compliance on the ventilator is calculated as:',
      options: [
        { label: 'Tidal volume / (Ppeak − PEEP)', is_correct: false, explanation: 'That uses peak pressure (includes resistance) giving dynamic compliance, not static.' },
        { label: 'Tidal volume / (Pplat − PEEP)', is_correct: true, explanation: 'Static compliance = Vt / (Pplat − PEEP). Pplat − PEEP is the driving pressure, reflecting the elastic load alone.' },
        { label: 'Ppeak / tidal volume', is_correct: false, explanation: 'This inverts the formula and mixes up pressure and volume relationships.' },
        { label: 'Respiratory rate × tidal volume', is_correct: false, explanation: 'That is minute ventilation.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'passive_baseline_vc',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 12, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 50, resistance: 10, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    unlocked_controls: ['compliance', 'inspiratory_pause'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'staticCompliance'],
    visible_waveforms: ['pressure_time', 'flow_time'],
    // The whole point of this module is that dropping compliance raises
    // the plateau. The general "Pplat > 30" safety alarm is correct
    // elsewhere but actively confusing here, so suppress it.
    suppress_pplat_alarm: true,
  },

  // Step-by-step flow so the learner SEES the change before any
  // question. Previously the question fired the instant compliance
  // crossed the threshold — before the waveform could be read. Now:
  // (1) drop compliance and watch both pressures rise, (2) press INSP
  // HOLD to freeze the breath and read the plateau, and only then does
  // the question appear (riding on the hold step, so the plateau is on
  // screen). present_one_at_a_time gives the "Next →" beat between the
  // knob change and the hold.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    present_one_at_a_time: true,
    observations: [
      "Compliance is down, and **both** pressures climbed — PIP and the plateau rose together. Watch the trace settle, then continue. Next you'll freeze the breath with an inspiratory hold to confirm the plateau.",
      "There's the held plateau. Notice the gap between PIP and Pplat barely changed — both numbers moved up by about the same amount. That parallel rise with a stable gap is the compliance signature.",
    ],
    children: [
      // Step 1 — drop compliance into the ARDS range. No question yet.
      {
        kind: 'manipulation',
        control: 'compliance',
        condition: { type: 'delta_pct', direction: 'decrease', min_pct: 30 },
      },
      // Step 2 — press INSP HOLD; the question rides on the hold so the
      // plateau is already on screen when it appears.
      {
        kind: 'manipulation',
        control: 'inspiratory_pause',
        // The INSP HOLD button emits new_value: 1 on every press.
        // `any_change` can't fire here because compareCondition needs a
        // defined baseline, and inspiratory_pause has none (it's not a
        // persistent setting). An absolute >= 1 fires reliably.
        condition: { type: 'absolute', operator: '>=', value: 1 },
        // Per-step Show Me: on this step the learner needs to press
        // INSP HOLD, so the demonstration performs the hold rather than
        // re-dropping compliance (the module-level demo).
        tier3_demonstration: { control: 'inspiratory_pause', target_value: 1, hint_text: 'Show me — performs the inspiratory hold so you can read the plateau.' },
        require_acknowledgment: {
          question: 'With the breath held, you can read both PIP and the plateau. What happened to the peak-plateau gap when compliance dropped?',
          options: [
            { label: 'It stayed about the same — PIP and plateau rose together', is_correct: true, explanation: 'Right. Compliance changes the elastic term (Vt / C), which lifts the plateau — and PIP rides up with it by the same amount. The gap (PIP − Pplat) is the resistive term, which compliance does not touch. Parallel rise, stable gap = the compliance signature.' },
            { label: 'It widened significantly', is_correct: false, explanation: 'A widening gap means the resistive term grew — that is the resistance signature, not compliance. Resistance was unchanged here, so the gap held steady.' },
            { label: 'It narrowed significantly', is_correct: false, explanation: 'Compliance does not change the resistive contribution, so the gap cannot narrow. Both pressures rose together and the gap was preserved.' },
          ],
        },
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        '**What compliance is.** Compliance is the change in volume per unit change in pressure: `C = ΔV / ΔP`. The respiratory system\'s compliance depends on the lungs and the chest wall working together in series. Normal respiratory-system compliance is about 100 mL/cmH2O in a healthy adult.\n\nAny disease that stiffens the lungs reduces compliance: pneumonia, atelectasis, pulmonary fibrosis, pulmonary edema, ARDS, pneumothorax. Any disease that stiffens the chest wall also reduces compliance: morbid obesity, abdominal compartment syndrome, circumferential burns.\n\nIn pressure control, compliance determines the tidal volume: the stiffer the lung, the less volume you get for a given pressure. In volume control, compliance determines the plateau pressure: the stiffer the lung, the more pressure is required to deliver the set tidal volume.',
    },
    {
      kind: 'prose',
      markdown:
        '**Compliance on the pressure waveform.** In volume control with a fixed tidal volume and inspiratory flow, a compliance change moves BOTH peak pressure and plateau pressure in the same direction by roughly equal amounts. The peak-plateau gap (which reflects airway resistance) stays about the same.\n\nWhy does plateau move? Because plateau pressure = driving pressure + PEEP, and driving pressure = Vt / compliance. If compliance halves, driving pressure doubles, and plateau rises.\n\nWhy does peak move too? Because peak = plateau + resistive pressure. If plateau rises and resistance is unchanged, peak rises by the same amount.\n\nThis is the compliance signature: parallel movement of peak and plateau with a stable gap.',
    },
    {
      kind: 'prose',
      markdown:
        '**Measuring compliance at the bedside.** Static compliance = `Vt / (Pplat − PEEP)`. You need an end-inspiratory pause to measure Pplat. On most ventilators there is a dedicated button for this (0.5–1 second hold).\n\nDriving pressure (`Pplat − PEEP`) is the clinically important result of this calculation. Driving pressure indexes the tidal volume to the available lung (the "baby lung" concept). A driving pressure above 15 cmH2O is independently associated with worse outcomes in ARDS, even when plateau pressure is below 30.\n\nPlateau pressure safety limit: keep Pplat ≤ 30 cmH2O. This is the alveolar pressure at end-inspiration. Above 30, the risk of alveolar overdistension and ventilator-induced lung injury rises sharply.\n\nIf Pplat is too high in volume control: lower the tidal volume. If this causes CO2 retention, accept permissive hypercapnia rather than injure the lung. Target Vt 4–6 mL/kg PBW in ARDS; 6–8 mL/kg in most other patients.',
    },
    {
      kind: 'prose',
      markdown:
        '**The "baby lung" concept.** ARDS does not make the lungs globally stiffer like fibrosis. It makes them smaller — pockets of healthy alveoli exist alongside flooded, collapsed alveoli. The healthy alveoli have normal individual compliance, but there are fewer of them. A 70 kg man with severe ARDS may have the effective lung of a 30 kg child.\n\nThis is why a tidal volume of 6 mL/kg PBW may still overdistend the healthy portions of an ARDS lung. The driving pressure bridges this gap: a high driving pressure signals that the delivered tidal volume is large relative to the functional lung, regardless of what the absolute PBW calculation says.',
    },
  ],

  hint_ladder: {
    tier1: 'Step 1: lower the compliance knob into the ARDS range (≤ 28). Watch both pressures rise. Then click Next.',
    tier2: 'Step 2: press the INSP HOLD button at the top of the controls. That freezes the breath and shows the plateau — then the question appears.',
    tier3: { hint_text: 'Show me — drops compliance to 25 so you can watch both pressures climb. You still press INSP HOLD to read the plateau.', demonstration: { control: 'compliance', target_value: 25 } },
  },

  summative_quiz: [
    {
      id: 'M4a-Q1',
      prompt: 'A passive patient on volume control (Vt 450 mL, PEEP 5) has Ppeak rise from 24 to 38 and Pplat rise from 20 to 34. The most likely cause is:',
      options: [
        { label: 'Bronchospasm', is_correct: false, explanation: 'Bronchospasm is a resistance problem; Ppeak would rise while Pplat is unchanged.' },
        { label: 'Worsening lung compliance (e.g., developing pulmonary edema)', is_correct: true, explanation: 'Both peak and plateau rose together by similar amounts — the compliance signature. Compliance change = parallel movement of Ppeak and Pplat.' },
        { label: 'Kinked endotracheal tube', is_correct: false, explanation: 'Tube kinking is a resistance problem; gap would widen.' },
        { label: 'Mucus plug', is_correct: false, explanation: 'Mucus plug is a resistance problem.' },
      ],
    },
    {
      id: 'M4a-Q2',
      prompt: 'A patient has Pplat 28, PEEP 8, and Vt 480 mL. Static compliance is approximately:',
      options: [
        { label: '18 mL/cmH2O', is_correct: false, explanation: 'Math error.' },
        { label: '24 mL/cmH2O', is_correct: true, explanation: 'Static compliance = 480 / (28 − 8) = 480 / 20 = 24 mL/cmH2O.' },
        { label: '60 mL/cmH2O', is_correct: false, explanation: 'Math error.' },
        { label: 'Cannot be calculated without Ppeak', is_correct: false, explanation: 'Static compliance uses Pplat, not Ppeak.' },
      ],
    },
    {
      id: 'M4a-Q3',
      prompt: 'Which of the following does NOT reduce respiratory-system compliance?',
      options: [
        { label: 'ARDS', is_correct: false, explanation: 'ARDS reduces the number of functional alveoli, effectively reducing compliance.' },
        { label: 'Pneumothorax', is_correct: false, explanation: 'A pneumothorax collapses lung tissue, reducing compliance.' },
        { label: 'Bronchospasm', is_correct: true, explanation: 'Bronchospasm increases airway resistance, not reduces lung compliance. Peak pressure rises but plateau is largely unchanged.' },
        { label: 'Morbid obesity', is_correct: false, explanation: 'Obesity reduces chest wall compliance, reducing total respiratory-system compliance.' },
      ],
    },
    {
      id: 'M4a-Q4',
      prompt: 'A patient on volume control has Pplat 32 cmH2O. Tidal volume is 6 mL/kg PBW. The most appropriate next step:',
      options: [
        { label: 'Increase PEEP to reduce plateau', is_correct: false, explanation: 'Increasing PEEP raises plateau further.' },
        { label: 'Reduce tidal volume toward 5 or 4 mL/kg PBW to bring Pplat below 30', is_correct: true, explanation: 'Pplat 32 exceeds the 30 cmH2O safety limit. Lower Vt. Accept permissive hypercapnia if needed.' },
        { label: 'Switch to pressure control', is_correct: false, explanation: 'Mode switch alone does not fix the underlying stiff lung. PC will simply deliver less volume at the same pressure.' },
        { label: 'Do nothing; 32 is within normal limits', is_correct: false, explanation: '32 exceeds the 30 cmH2O target.' },
      ],
    },
    {
      id: 'M4a-Q5',
      prompt: 'Driving pressure is most useful clinically because it:',
      options: [
        { label: 'Equals peak pressure minus PEEP', is_correct: false, explanation: 'That is not the definition. Driving pressure = Pplat − PEEP.' },
        { label: 'Indexes tidal volume to functional lung size, capturing the risk of overdistension even when absolute Pplat appears acceptable', is_correct: true, explanation: 'A high driving pressure (> 15 cmH2O) identifies patients at risk for VILI even if Pplat < 30, because the tidal volume is large relative to the available compliant lung.' },
        { label: 'Measures airway resistance', is_correct: false, explanation: 'Airway resistance is reflected in the Ppeak − Pplat gap, not driving pressure.' },
        { label: 'Is only useful in pressure-control mode', is_correct: false, explanation: 'Driving pressure is measured the same way in any mode via an end-inspiratory pause.' },
      ],
    },
  ],

  explore_card: {
    patient_context:
      'Passive patient on volume control. Normal compliance (50) and resistance (10). You are going to manipulate compliance and watch what happens to the pressure waveform.',
    unlocked_controls_description: [
      { name: 'Compliance · 15–80 mL/cmH2O', description: 'how easily the lungs stretch. Lower = stiffer lungs (ARDS, pneumonia, pulmonary edema, pneumothorax, obesity).' },
    ],
    readouts_description: [
      { name: 'Ppeak', description: 'the total pressure the vent had to produce.' },
      { name: 'Pplat', description: 'the alveolar pressure after flow stops (end-inspiratory pause). The elastic price.' },
      { name: 'Driving pressure (Pplat − PEEP)', description: 'the pressure needed to inflate the lung above PEEP.' },
      { name: 'Static compliance (live)', description: 'computed as Vt / (Pplat − PEEP).' },
    ],
    suggestions: [
      'Lower compliance from 50 to 25 (simulate ARDS or pulmonary edema). What do Ppeak and Pplat do?',
      'Notice that both rise together. The gap (Ppeak − Pplat) stays similar. That is the compliance signature.',
      'Restore to 50. Then raise compliance to 70 (simulate improvement). Both fall together.',
      'Try to predict: if compliance halves, what should driving pressure do?',
    ],
  },

  user_facing_task:
    'Show the compliance signature on the pressure waveform, one step at a time. First drop the compliance knob into the ARDS range and watch both pressures rise. Then press INSP HOLD to read the plateau. The question appears once the plateau is on screen.',
  success_criteria_display: [
    'Drop compliance into the ARDS range (≥ 30% reduction) and watch both pressures rise.',
    'Press INSP HOLD to freeze the breath and read the plateau.',
    'Answer: what happened to the peak-plateau gap?',
  ],
  task_framing_style: 'A',

  key_points: [
    'Compliance = ΔV / ΔP. Static compliance = Vt / (Pplat − PEEP).',
    'In volume control, compliance changes move both Ppeak and Pplat together — the parallel-rise pattern.',
    'The peak-plateau gap stays roughly stable with a pure compliance change (gap = resistance, not compliance).',
    'Plateau pressure safety limit: ≤ 30 cmH2O. Above 30, the risk of VILI rises.',
    'Driving pressure (Pplat − PEEP) ≤ 15 cmH2O. High driving pressure signals tidal volume is large relative to functional lung.',
    'Conditions that reduce compliance: ARDS, pneumonia, pulmonary edema, pneumothorax, pulmonary fibrosis, morbid obesity, abdominal compartment syndrome.',
    'ARDS makes lungs small (baby-lung concept), not globally stiff. Target Vt 4–6 mL/kg PBW.',
  ],
};
