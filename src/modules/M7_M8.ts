import type { ModuleConfig } from '../shell/types';

/**
 * MODULE M7 — Volume Control Ventilation (VCV A/C)
 *
 * Track: Modes · Archetype: outcome (Style B, target-state) · 18 min
 * Anchor chapters: VB Ch. 9, Ch. 8
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 40 — at Vt 500 baseline this yields plat ~17.5
 *   - heightInches: 70, gender: male — PBW = 73 kg; 6 mL/kg = 438 mL
 *
 * Task target Vt is 410-470 (6 mL/kg PBW ±5%).
 *
 * Specced against docs/MODULE_SPECS_v3.md §M7 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §4. See MODULE_SPECS_v3.md Appendix A.
 */
export const M7: ModuleConfig = {
  id: 'M7',
  number: 7,
  title: 'Volume Control Ventilation',
  track: 'Modes',
  estimated_minutes: 18,
  briefing: {
    tagline: 'Volume is fixed. Pressure is the message about the patient.',
    overview:
      "Volume control is the mode you set when you want to know exactly what the patient is getting per breath. You pick the tidal volume, you pick the flow, the machine delivers it no matter what. The trade-off is that pressure becomes the dependent variable. If the lungs get stiffer or the airways narrower, the pressure will climb to make the volume happen anyway. That's a feature, not a bug, but it's why high-pressure alarms in VC need a real look.",
    what_youll_do: [
      'In VC, you control volume and flow. The vent controls pressure to make it work.',
      'The flow waveform is square. The pressure waveform ramps up.',
      'A high-pressure alarm in VC is a message about the patient, not a setting to override.',
    ],
  },

  visible_learning_objectives: [
    'Distinguish what VCV guarantees (Vt, MVe) from what it does not (PIP, Pplat).',
    'Predict the direction of change in PIP when compliance falls at a fixed Vt.',
    'Set lung-protective VCV from scratch: Vt 6 mL/kg PBW, plat ≤30, driving pressure ≤15.',
    'State why VCV is the default mode for the shocked or unreliable-drive patient.',
  ],

  primer_questions: [
    {
      id: 'M7-P1',
      prompt: 'On VCV, what does the ventilator guarantee?',
      options: [
        { label: 'The peak airway pressure.', is_correct: false, explanation: 'PIP is determined by flow, resistance, compliance, and Vt; the vent makes whatever pressure it needs.' },
        { label: 'The plateau pressure.', is_correct: false, explanation: "Plat is determined by Vt/compliance + PEEP; the vent doesn't set it." },
        { label: 'The tidal volume.', is_correct: true, explanation: 'Book Ch. 9. The vent opens its valve at a set flow until the set Vt has been delivered. The pressure is whatever it takes.' },
        { label: 'The respiratory rate, but not the volume.', is_correct: false, explanation: "It guarantees both rate and Vt; that's the whole point of A/C." },
      ],
    },
    {
      id: 'M7-P2',
      prompt: 'A VCV patient has compliance fall from 40 to 25 overnight at a fixed Vt of 500. The most likely change in plateau pressure is:',
      options: [
        { label: 'Plat falls — the lungs got softer.', is_correct: false, explanation: 'Lower compliance is stiffer, not softer.' },
        { label: 'Plat rises — to deliver the same Vt into stiffer lungs takes more alveolar pressure.', is_correct: true, explanation: 'Plat = Vt/C + PEEP, so plat goes from 17.5 to 25. The warning sign of evolving ARDS in a VCV patient.' },
        { label: 'Plat is unchanged — only PIP rises.', is_correct: false, explanation: 'That would be true only if the resistance changed. Compliance change directly drives plat.' },
        { label: 'The vent will reduce Vt to compensate.', is_correct: false, explanation: 'VCV does no such thing — dual-control modes do.' },
      ],
    },
    // Novice-pass §7.2 — original Q3 was a multi-option mode-selection
    // case the novice hasn't been taught. Replaced with a vocabulary
    // check that builds directly on M2.
    {
      id: 'M7-P3',
      prompt: 'In VCV (volume A/C), which two things does the *clinician* set on each breath?',
      options: [
        { label: 'Tidal volume and respiratory rate.', is_correct: true, explanation: 'In VCV you order the breath size (Vt) and the minimum rate. The vent delivers exactly that Vt and lets the airway pressure end up wherever it ends up.' },
        { label: 'Peak pressure and respiratory rate.', is_correct: false, explanation: 'Peak pressure is *measured* in VCV — it floats with compliance and resistance. The clinician sets volume.' },
        { label: 'Tidal volume and peak pressure.', is_correct: false, explanation: "In VCV you can't set both — one drives the other. Volume is the order; pressure is the consequence." },
        { label: 'Peak pressure and plateau pressure.', is_correct: false, explanation: 'Both of those are measured. Plateau requires an inspiratory hold to even see.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'M7_vcv_baseline',
    preset: {
      // Sepsis-pattern patient. Vt 500 = 7 mL/kg for 73-kg PBW —
      // deliberately a touch high so the learner has an obvious lever
      // to move (down to 6 mL/kg ≈ 430 mL).
      // PIN: compliance 40, heightInches 70, gender M — DO NOT CHANGE.
      // 6 mL/kg = 438 mL; tracker accepts 410–450. Compliance 40 puts
      // plat ~16 at Vt 430.
      mode: 'VCV',
      settings: { tidalVolume: 500, respiratoryRate: 14, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 40, resistance: 12, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    unlocked_controls: ['tidalVolume', 'respiratoryRate', 'peep', 'fiO2', 'iTime'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'vte', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  // Target-state outcome: Vt 410–450 (6 mL/kg PBW ±5%), plat ≤30,
  // driving pressure ≤15, sustained 5 breaths. The learner should
  // *land* there and *hold* it, not flick the dial through 430 on the
  // way to 350.
  // Spec §4 (v3.1): the range 410-470 is a 6 mL/kg PBW ±5% band. The
  // engine's ReadoutCondition is single-bound per readout, so we express
  // the range by combining `tidalVolumeSet >= 410` (the lower bound,
  // measured against the SET value) with `vte <= 470` (the upper bound,
  // measured against the DELIVERED value). In VCV the two track each
  // other; a learner who sets Vt = 350 fails the lower bound; a learner
  // who sets Vt = 520 fails the upper.
  hidden_objective: {
    kind: 'outcome',
    readouts: {
      tidalVolumeSet: { operator: '>=', value: 410 },
      vte: { operator: '<=', value: 470 },
      plat: { operator: '<=', value: 30 },
      drivingPressure: { operator: '<=', value: 15 },
    },
    sustain_breaths: 5,
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        "**A/C is the workhorse.** The vent delivers a preset number of breaths per minute; if the patient triggers above the set rate, he gets a *full* breath, not a partial one. That's what \"assist-control\" means — the patient can assist, but the control is the floor. VCV is the simpler flavor: you set rate and Vt, the vent gives the Vt at a constant flow until it's delivered, and then exhalation begins.",
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown: "In VCV, the tidal volume is your variable. The pressure is whatever it needs to be. That's the deal.",
    },
    // Novice-pass §7.1 — interactive PBW worked example. Lets the
    // novice see the Devine formula step-by-step and the 4/6/8 mL/kg
    // target table for any height/sex.
    {
      kind: 'prose',
      markdown:
        "**Tidal volume scales to *predicted* body weight (PBW)**, not actual weight. Two patients of identical height — one obese, one cachectic — have the same target Vt because they have the same lung size.",
    },
    {
      kind: 'pbw_widget',
      label: 'PBW worked example',
      default_height_inches: 70,
      default_sex: 'M',
    },
    {
      kind: 'callout',
      tone: 'tip',
      markdown: "For this scenario's patient (70 inches, male), PBW = 73 kg, so the lung-protective target is **438 mL** (6 mL/kg). The task chip's 410–470 range bakes in ±5%.",
    },
    {
      kind: 'predict_mcq',
      awaits_control: 'tidalVolume',
      predict:
        "You're at Vt 500. You move it to 430 (6 mL/kg PBW for this patient). What happens to plat and driving pressure?",
      options: [
        { label: 'Both fall by the same amount.', is_correct: true },
        { label: 'Plat falls, but driving pressure stays the same.', is_correct: false, explanation: 'Driving pressure = Pplat − PEEP. PEEP didn\'t change, so DP moves by the same amount as Pplat.' },
        { label: 'PIP falls but Pplat is unchanged.', is_correct: false, explanation: 'Pplat is the alveolar pressure that responds directly to Vt at fixed compliance.' },
        { label: 'Both rise — smaller breaths need more pressure.', is_correct: false, explanation: 'Backwards — smaller volume through the same compliance generates less pressure.' },
      ],
      observe:
        "Plat falls by about 2; driving pressure falls by the same amount. Vt is the lever — for this patient's compliance, the lung-protective range comes free once you lower the order.",
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        '**Plat ≤30 and driving pressure ≤15** are not soft suggestions. ARMA 2000 showed 6 mL/kg PBW reduced ARDS mortality by 9%. Amato 2015 showed driving pressure was independently linked to survival.',
    },
  ],

  hint_ladder: {
    tier1: "You're at 7 mL/kg. The book asks for 6.",
    tier2: 'For this patient, 6 mL/kg PBW is ~430 mL. Move Vt down toward 430 and watch the plat and driving pressure update.',
    tier3: { hint_text: 'Use "Show me" to move Vt to 430 and confirm the chip locks green.', demonstration: { control: 'tidalVolume', target_value: 430 } },
  },

  summative_quiz: [
    {
      id: 'M7-Q1',
      prompt: 'A 65-year-old male, 175 cm tall, is intubated for ARDS. The first Vt you should select is approximately:',
      options: [
        { label: '350 mL', is_correct: false, explanation: "That's below 5 mL/kg; defensible only if plat is high, but not the first choice." },
        { label: '430 mL', is_correct: true, explanation: 'PBW ~72 kg, 6 mL/kg = 432. ARDSnet starting target.' },
        { label: '600 mL', is_correct: false, explanation: "That's 8.3 mL/kg — too high for ARDS." },
        { label: '800 mL', is_correct: false, explanation: 'Pre-ARMA dosing, abandoned 25 years ago.' },
      ],
    },
    {
      id: 'M7-Q2',
      prompt: 'On VCV, peak pressure (PIP) rises sharply while plateau pressure is unchanged. The most likely cause is:',
      options: [
        { label: 'Worsening ARDS', is_correct: false, explanation: 'That raises plat too.' },
        { label: 'Increased airway resistance — mucus plug, kinked tube, bronchospasm', is_correct: true, explanation: 'Book Ch. 2. The PIP-plat gap *is* the resistance signal.' },
        { label: 'A pneumothorax', is_correct: false, explanation: 'Pneumo raises both.' },
        { label: 'Pulmonary edema', is_correct: false, explanation: 'Raises both.' },
      ],
    },
    {
      id: 'M7-Q3',
      prompt: 'A patient on VCV with Vt 500 mL has a plateau pressure of 34 and a driving pressure of 22. The single most important next move is:',
      options: [
        { label: 'Sedate more deeply', is_correct: false, explanation: "Doesn't address the lung problem." },
        { label: 'Increase PEEP', is_correct: false, explanation: 'That can raise plat further.' },
        { label: 'Reduce the tidal volume', is_correct: true, explanation: 'Book Ch. 8, Amato 2015. DP >15 is the survival-relevant lever.' },
        { label: 'Switch to PCV', is_correct: false, explanation: 'Tempting but does nothing physiologic — same lungs, same compliance.' },
      ],
    },
    {
      id: 'M7-Q4',
      prompt: 'The advantage of VCV over PCV is:',
      options: [
        { label: 'Lower peak airway pressures', is_correct: false, explanation: 'PCV typically has lower PIP.' },
        { label: 'Guaranteed minute ventilation, regardless of changes in compliance', is_correct: true, explanation: 'Book Ch. 9. The shocked patient with evolving lung injury needs a guaranteed Vt.' },
        { label: 'Greater patient comfort with constant flow', is_correct: false, explanation: "Constant flow is generally less comfortable; that's a PCV advantage." },
        { label: 'No volutrauma risk', is_correct: false, explanation: 'VCV can absolutely cause volutrauma if Vt is set too high.' },
      ],
    },
    {
      id: 'M7-Q5',
      prompt: "Owens's rule for the shocked patient with respect to mode choice is:",
      options: [
        { label: 'PSV — least work for the patient', is_correct: false, explanation: 'PSV is a recovery mode. The shocked patient cannot afford to do the breathing work.' },
        { label: 'SIMV — best of both worlds', is_correct: false, explanation: 'SIMV in the shocked patient risks high work of breathing on the spontaneous breaths.' },
        { label: 'A/C — the shocked patient should not fatigue', is_correct: true, explanation: "Don't let the shocked patient do the work of breathing while you're resuscitating him. A/C guarantees the minute ventilation; the patient's energy goes to the rest of the body." },
        { label: 'APRV — best oxygenation', is_correct: false, explanation: 'Not the first-line mode for shock.' },
      ],
    },
  ],

  explore_card: {
    patient_context: '70 kg male, post-laparotomy for perforated diverticulitis. Septic, intubated for refractory hypoxemia. Compliance 40 (sepsis pattern).',
    unlocked_controls_description: [
      { name: 'Vt · 350–600', description: 'the volume you order each breath.' },
      { name: 'Rate · 8–30', description: 'minimum rate.' },
      { name: 'PEEP · 0–15', description: 'end-expiratory floor.' },
      { name: 'FiO2 · 30–80%', description: 'inspired oxygen.' },
      { name: 'I-time · 0.6–1.5', description: 'length of each inspiration.' },
    ],
    readouts_description: [
      { name: 'Plat, driving pressure, PIP, MVe', description: 'the four numbers to land in the safe zone.' },
    ],
    suggestions: [
      'Push Vt to 600. Watch plat and driving pressure climb past safety.',
      'Pull Vt to 350. Plat falls but is the MVe still adequate?',
      'Raise rate from 14 to 22 at Vt 500. MVe scales linearly.',
      'Drop PEEP from 5 to 0. Plat falls; driving pressure unchanged.',
    ],
  },

  user_facing_task:
    "Set lung-protective VCV. This is the standard A/C ventilation that gets every fresh ARDS patient and every intubated trauma. Your Vt is currently 500. The patient is 5'10\", and his compliance is moderately reduced. Adjust the Vt down to the lung-protective range and confirm that plat and driving pressure are in range. Hold the new state for 5 breaths.",
  success_criteria_display: [
    'Tidal volume 410–470 mL (6 mL/kg ±5% for this 73 kg PBW patient).',
    'Plateau pressure ≤ 30 cmH2O.',
    'Driving pressure ≤ 15 cmH2O.',
    'Sustained for 5 consecutive breaths.',
  ],
  task_framing_style: 'B',

  key_points: [
    'VCV guarantees Vt; the pressure is whatever it has to be. Watch plat and driving pressure.',
    'Lung-protective VCV: 6 mL/kg PBW, plat ≤30, driving pressure ≤15.',
    'A rising plat at a fixed Vt means compliance is falling — assume worsening lung injury until proven otherwise.',
    'A rising PIP with unchanged plat means resistance is rising — think mucus, kink, or bronchospasm.',
    'The shocked patient and the unreliable-drive patient belong on A/C.',
  ],
};

/**
 * MODULE M8 — Pressure Control Ventilation (PCV)
 *
 * Track: Modes · Archetype: outcome (Style B with predict-observe) · 18 min
 * Anchor chapters: VB Ch. 9, Ch. 8
 *
 * Novice-pass §8.3 — the "Vt halves when compliance halves" predict_mcq
 * (M8-PM2 in this file) is the highest-quality teaching beat in the
 * curriculum. CANDIDATES for adopting the same predict → manipulate →
 * observe pattern in a later pass:
 *   - M3 step 1 (raise Vt → predict PIP behavior)
 *   - M4 compliance step (drop compliance → predict gap behavior)
 *   - M7 lung-protective step (move Vt to target → predict plat behavior)
 *   - M13 PEEP step (raise PEEP → predict PaO2 + SBP behavior)
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 35 — at PINSP 18 this yields Vt ~430 mL (≈6 mL/kg PBW)
 *
 * The Try-It locks compliance, but the Read-phase predict-observe block
 * temporarily unlocks it for demonstration of the PCV failure mode (Vt
 * collapses when compliance falls at fixed PINSP).
 *
 * Specced against docs/MODULE_SPECS_v3.md §M8 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §5. See MODULE_SPECS_v3.md Appendix A.
 */
export const M8: ModuleConfig = {
  id: 'M8',
  number: 8,
  title: 'Pressure Control Ventilation',
  track: 'Modes',
  estimated_minutes: 18,
  briefing: {
    tagline: 'Pressure is fixed. Volume is what gives way.',
    overview:
      "Pressure control flips the relationship. You pick the pressure, the machine holds it, and tidal volume is whatever the lungs accept at that pressure. This is gentler on stiff or heterogeneous lungs because you can't accidentally over-inflate them. The price is that volume drifts when mechanics change, so you have to watch the delivered tidal volume the same way you'd watch peak pressure in VC.\n\nAt the end of the read phase you'll also see a 5-minute addendum on the dual-control variants (PRVC, VC+, CMV-Autoflow). Same delivery pattern as PC, with a closed-loop volume target on top.",
    what_youll_do: [
      'In PC, you control pressure. Volume is what gives way.',
      'The flow waveform decelerates as the lungs fill. That shape is the PC fingerprint.',
      'A sudden drop in delivered tidal volume on PC is the signal that compliance got worse.',
      'PRVC and friends: pressure control with a volume target laid on top. Most of the time, that\'s a feature. When the patient has strong drive, the algorithm can yo-yo.',
    ],
  },

  visible_learning_objectives: [
    'Distinguish what PCV guarantees (PINSP, I-time) from what it does not (Vt, MVe).',
    'Predict the direction of change in Vt when compliance changes at a fixed PINSP.',
    "Distinguish PINSP from driving pressure (PINSP includes resistance; DP = plat − PEEP).",
    'Set lung-protective PCV: PINSP titrated to Vt 6 mL/kg PBW, total peak ≤30–35.',
  ],

  primer_questions: [
    {
      id: 'M8-P1',
      prompt: 'On PCV, what does the ventilator guarantee?',
      options: [
        { label: 'The tidal volume.', is_correct: false, explanation: 'Vt is the dependent variable, set by compliance and resistance.' },
        { label: 'The inspiratory pressure and the I-time.', is_correct: true, explanation: 'Book Ch. 9. The vent rises to PINSP, holds for I-time, drops back to PEEP.' },
        { label: 'The plateau pressure.', is_correct: false, explanation: "Plat depends on whether inspiratory flow reaches zero; in most PCV settings it doesn't." },
        { label: 'The driving pressure.', is_correct: false, explanation: 'DP requires a measured plat, which is not what you set in PCV.' },
      ],
    },
    {
      id: 'M8-P2',
      prompt: "A PCV patient's compliance improves overnight from 25 to 50 at a fixed PINSP. The most likely change is:",
      options: [
        { label: 'Vt is unchanged; only PIP rises.', is_correct: false, explanation: "PIP doesn't rise in PCV — it's *fixed*." },
        { label: 'Vt approximately doubles.', is_correct: true, explanation: 'Book Ch. 9. Vt ≈ PINSP × C. This is why PCV needs daily attention — improving lungs lead to higher Vt unless you titrate down.' },
        { label: 'Vt halves.', is_correct: false, explanation: 'Direction is reversed.' },
        { label: 'The ventilator reduces PINSP to compensate.', is_correct: false, explanation: 'Dual-control modes do this. PCV does not.' },
      ],
    },
    // Novice-pass §8.2 — the PINSP-vs-driving-pressure question requires
    // knowing Pplat is measurable in PCV, which the read teaches. Move
    // to summative. Replace primer slot with a simpler vocabulary
    // check: which variable does the clinician set in PCV?
    {
      id: 'M8-P3',
      prompt: 'In PCV (pressure control), which two things does the *clinician* set on each breath?',
      options: [
        { label: 'Tidal volume and respiratory rate.', is_correct: false, explanation: "Tidal volume is *measured* in PCV — it floats based on the patient's compliance. The clinician sets pressure, not volume." },
        { label: 'Inspiratory pressure (PINSP) and inspiratory time (I-time).', is_correct: true, explanation: "In PCV you set the pressure target each breath should reach and how long the breath should last. Tidal volume is whatever the patient's lung delivers at that pressure for that time." },
        { label: 'Tidal volume and PEEP.', is_correct: false, explanation: 'PCV sets pressure, not volume.' },
        { label: 'Peak pressure and plateau pressure.', is_correct: false, explanation: 'Plateau pressure is *measured*. PCV sets PINSP (the inspiratory pressure target).' },
      ],
    },
  ],

  scenario: {
    preset_id: 'M8_pcv_baseline',
    preset: {
      // Moderate ARDS, on PCV by clinician choice. PINSP 18 + PEEP 8
      // gives total peak ~26 (under 30). At C=35, delivered Vt ≈ 430.
      // PIN: compliance 35 — DO NOT CHANGE.
      mode: 'PCV',
      settings: { pInsp: 18, respiratoryRate: 14, peep: 8, fiO2: 50, iTime: 1.0 },
      patient: { compliance: 35, resistance: 10, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    // Per spec §5 v3.1: compliance is locked for Try-It (the task is PINSP
    // titration, not physiology). The Read-phase predict-observe block
    // below uses `awaits_control: 'compliance'`, which momentarily allows
    // a single adjustment for the demonstration without exposing the
    // slider for the whole task. TODO(M8-temp-unlock): cleaner gating
    // — `predict_observe.requires_temp_unlock: ['compliance']` — would
    // be more explicit if/when the engine gains that field.
    unlocked_controls: ['pInsp', 'respiratoryRate', 'peep', 'fiO2', 'iTime'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'vte', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  hidden_objective: {
    kind: 'outcome',
    readouts: {
      vte: { operator: '<=', value: 470 },
      pip: { operator: '<=', value: 30 },
      drivingPressure: { operator: '<=', value: 15 },
    },
    sustain_breaths: 5,
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        "**PCV reverses VCV's deal.** You set the *pressure* you want; the vent goes up to it, holds it, then releases. The tidal volume is whatever the patient's lungs and airway resistance permit. The waveform is decelerating — flow is high at the start and tapers off as the lungs fill, which most patients find more comfortable than VCV's square top.",
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown: 'PINSP is the rise above PEEP. If PINSP is 18 and PEEP is 8, total peak airway pressure is 26.',
    },
    {
      kind: 'predict_mcq',
      awaits_control: 'compliance',
      predict: "You drop compliance from 35 to 18 at constant PINSP. What happens to delivered Vt?",
      options: [
        { label: 'Vt falls roughly in proportion to the compliance drop.', is_correct: true },
        { label: 'Vt is unchanged — PCV guarantees the volume.', is_correct: false, explanation: 'PCV guarantees PRESSURE. Vt is the dependent variable. As compliance falls, the same pressure delivers less volume.' },
        { label: 'Vt rises — stiffer lungs accept more volume per pressure.', is_correct: false, explanation: 'Backwards. Stiffer lungs need MORE pressure per unit volume.' },
        { label: 'PIP rises to compensate — the vent adapts.', is_correct: false, explanation: "That's PRVC, not PCV. PCV holds PINSP fixed; Vt drifts silently downward.",
        },
      ],
      observe:
        "Vt falls roughly in proportion. This is the failure mode of PCV in worsening ARDS — the patient gets less and less ventilation as he gets sicker, and you won't see a PIP alarm fire.",
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        "In PCV, the **low-Vt alarm is your friend**. If the patient's compliance falls, Vt collapses silently. The PIP alarm will never fire — you set the pressure, the vent obeys.",
    },
    {
      kind: 'formative',
      question: 'In PCV, you cannot measure plateau pressure. True or false?',
      options: [
        { label: 'True — PCV has no plateau', is_correct: false },
        { label: 'False — an inspiratory hold gives you Pplat in PCV just as in VCV', is_correct: true },
        { label: 'True — only PIP is meaningful in PCV', is_correct: false },
        { label: 'False — but only if compliance is normal', is_correct: false },
      ],
      answer:
        'Book Ch. 9. An inspiratory hold equilibrates pressures throughout the airway tree, just as in VCV. You absolutely can — and should — measure plat in PCV. Common myth.',
    },
    // ── Fix 5 (Option A) — folded "dual-control variants" section ──
    // The standalone M9 (PRVC) was a CURRICULUM REVIEW CANDIDATE: the
    // most interesting content (the yo-yo failure mode) lived in prose
    // because the sim can't render it. The decision: fold the teaching
    // here as a brief read-only addendum to M8 (no separate try-it,
    // no separate summative). When the sim gains PinspSwing6 (see
    // docs/BLOCKED_SIM.md §1), this section can be hoisted back out
    // into its own module.
    {
      kind: 'prose',
      markdown:
        "**Dual-control variants (PRVC, VC+, CMV-Autoflow): a 5-minute addendum.** These modes try to give you the best of VCV and PCV. You set the Vt you want, and the vent figures out the PINSP needed to deliver it, breath by breath, using a decelerating flow. When compliance improves, PINSP drops. When compliance worsens, PINSP rises. **Most of the time, that's a feature.**",
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown:
        "PRVC is a pressure-control mode for people who don't like pressure-control. Same delivery pattern; just adds a closed-loop volume target on top.",
    },
    {
      kind: 'predict_mcq',
      predict:
        "A PRVC patient's compliance suddenly worsens (say, ARDS develops). Over the next 4–5 breaths the vent will:",
      options: [
        { label: 'Hold PIP constant; Vt will fall.', is_correct: false, explanation: "That's PCV. PRVC adjusts pressure to keep volume on target." },
        { label: 'Hold Vt constant; PIP will rise breath by breath.', is_correct: true },
        { label: 'Switch to volume-control automatically.', is_correct: false, explanation: "PRVC doesn't mode-switch; it adapts within its own mode." },
        { label: 'Nothing visible — the breath-by-breath adjustments are too small.', is_correct: false, explanation: "The adjustments are clearly visible — PINSP climbs by 1–3 cmH2O each breath until Vt is back on target." },
      ],
      observe:
        "PRVC senses Vt drift and corrects PINSP to compensate. With sudden worsening compliance, the algorithm ramps PINSP up over 4–5 breaths, holding Vt at target. This is closed-loop control when conditions stay stable.",
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        "**The yo-yo failure mode.** In an *awake patient with strong drive*, the algorithm misreads the patient's effort as 'compliance improved' and lowers PINSP. The next breath is therefore smaller, the algorithm reads 'compliance worsened,' and ramps PINSP back up. Over 30–60 seconds you see the PINSP cycle visibly: 12 → 22 → 12 → 22, while Vt stays on target. The patient is uncomfortable. **The fix is to switch to a non-adaptive mode (VCV or PCV)** and address why the patient is agitated. Not sedation — sedation buries the diagnostic information.",
    },
    {
      kind: 'callout',
      tone: 'tip',
      markdown:
        "If you don't see PRVC in your training hospital, that's fine — the principles (closed-loop targeting, breath-by-breath adaptation, the yo-yo failure mode) transfer to every adaptive mode. Recognize the cycle when you see it.",
    },
  ],

  hint_ladder: {
    tier1: 'At PINSP 18 and C=35, Vt is in the right range. Have you held it for 5 breaths?',
    tier2: "If the chip won't lock green, check driving pressure. It's plat − PEEP. With this PINSP, you should be at ~12. If you're over 15, lower PINSP.",
    tier3: { hint_text: 'Use "Show me" to move PINSP to 17 and verify the chip is green.', demonstration: { control: 'pInsp', target_value: 17 } },
  },

  summative_quiz: [
    {
      id: 'M8-Q1',
      prompt: 'A patient is on PCV with PINSP 20, PEEP 10, I-time 1.0. Compliance is 25 mL/cmH2O. The expected Vt is approximately:',
      options: [
        { label: '200 mL', is_correct: false, explanation: 'Too low — PINSP 20 × C 25 ≈ 500.' },
        { label: '500 mL', is_correct: true, explanation: 'Vt ≈ PINSP × C.' },
        { label: '800 mL', is_correct: false, explanation: 'That would be C = 40.' },
        { label: 'Cannot be calculated without knowing flow', is_correct: false, explanation: 'This is the deterministic relationship.' },
      ],
    },
    {
      id: 'M8-Q2',
      prompt: "A PCV patient's PIP alarm has never fired, but his Vt has dropped from 480 to 270 over six hours. The most likely cause is:",
      options: [
        { label: 'The vent is broken', is_correct: false, explanation: "Unlikely — PIP alarm wouldn't fire in PCV anyway." },
        { label: 'Worsening compliance, increased resistance, or both', is_correct: true, explanation: 'Book Ch. 9. In PCV the PIP is fixed; Vt collapse is the only warning of worsening mechanics.' },
        { label: 'The patient is over-sedated', is_correct: false, explanation: "Sedation doesn't change Vt at a fixed PINSP." },
        { label: 'Migrated endotracheal tube into the right mainstem', is_correct: false, explanation: 'Possible but would also raise plat dramatically; first instinct is mechanics.' },
      ],
    },
    {
      id: 'M8-Q3',
      prompt: 'Inverse-ratio ventilation (I:E ≥ 1:1) in PCV is:',
      options: [
        { label: 'Always required in severe ARDS', is_correct: false, explanation: 'A niche maneuver.' },
        { label: 'Used occasionally for severe hypoxemia, but requires heavy sedation', is_correct: true, explanation: 'Book Ch. 9. Owens: "Try breathing in for two seconds and out for one — this is uncomfortable."' },
        { label: 'Standard for all PCV settings', is_correct: false, explanation: 'Normal I:E is 1:2 to 1:4.' },
        { label: 'Used to reduce peak pressures', is_correct: false, explanation: 'It actually raises mean airway pressure.' },
      ],
    },
    {
      id: 'M8-Q4',
      prompt: 'Which is the WORST patient for PCV?',
      options: [
        { label: 'A stable ARDS patient on chronic vent', is_correct: false, explanation: 'PCV is fine here.' },
        { label: 'A status asthmaticus patient with rising resistance', is_correct: true, explanation: 'Book Ch. 15. In severe bronchospasm, rising resistance silently drops Vt in PCV; VCV is the mode of choice.' },
        { label: 'A post-op patient with normal lungs', is_correct: false, explanation: 'PCV is fine.' },
        { label: 'A weaning candidate', is_correct: false, explanation: "PSV is the answer for a weaning candidate; PCV isn't *worse* than other A/C modes." },
      ],
    },
    {
      id: 'M8-Q5',
      prompt: 'Driving pressure in a PCV patient is measured by:',
      options: [
        { label: 'Reading the PINSP directly', is_correct: false, explanation: 'PINSP includes resistance.' },
        { label: 'Performing an inspiratory hold to obtain plat, then subtracting PEEP', is_correct: true, explanation: 'Book Ch. 9. The hold equilibrates airway pressures; plat − PEEP is the DP regardless of mode.' },
        { label: 'Looking at the peak inspiratory flow', is_correct: false, explanation: 'Unrelated.' },
        { label: 'It cannot be measured in PCV', is_correct: false, explanation: 'Common myth.' },
      ],
    },
  ],

  explore_card: {
    // Novice-pass §8.1 — explicit sandbox-vs-task framing so a novice
    // doesn't think tuning compliance is part of completing the task.
    patient_context:
      "Same post-laparotomy septic patient as M7, but the attending placed him on PCV. Compliance 35.\n\n**Note on the compliance slider:** the compliance slider here is for exploration only — your task is to titrate PINSP. The slider lets you see how Vt responds when the lung changes (which it will, in real patients, hour by hour). You don't have to touch it to finish the module.",
    unlocked_controls_description: [
      { name: 'PINSP · 8–30', description: 'rise above PEEP. Total peak = PINSP + PEEP. ← This is what your task wants you to titrate.' },
      { name: 'Rate · 8–30', description: 'mandatory minimum.' },
      { name: 'PEEP · 0–18', description: 'end-expiratory floor.' },
      { name: 'FiO2 · 30–80%', description: 'inspired oxygen.' },
      { name: 'I-time · 0.6–1.5', description: 'how long the pressure is held.' },
      { name: 'Compliance · 20–60', description: 'SANDBOX lever — explore-only. Drag it to see Vt swing; not part of the task.' },
    ],
    readouts_description: [
      { name: 'Vt (delivered), plat (after hold), peak pressure, MVe', description: 'the four numbers PCV makes you watch.' },
    ],
    suggestions: [
      'Raise PINSP from 18 to 26. Vt climbs from ~430 to ~620.',
      'Drop compliance to 20 at PINSP 18. Vt falls to ~245.',
      'At PINSP 18, perform an inspiratory hold. Watch plat lag PIP by 1–2 cmH2O (low resistance).',
      'Bump resistance to 25 at PINSP 18 — Vt drops, but plat is still measurable.',
    ],
  },

  user_facing_task:
    'Titrate PINSP to a lung-protective Vt. Your patient is on PCV with PINSP 18 and PEEP 8. The compliance is ~35. Adjust the PINSP so the delivered Vt lands at 6 mL/kg PBW (~430 mL for this patient), with total peak pressure ≤30 and driving pressure ≤15. Hold for 5 breaths.',
  success_criteria_display: [
    'Tidal volume 410–470 mL.',
    'Total peak pressure ≤ 30 cmH2O.',
    'Driving pressure ≤ 15 cmH2O.',
    'Sustained for 5 consecutive breaths.',
  ],
  task_framing_style: 'B',

  key_points: [
    'PCV guarantees PINSP and I-time. Vt is the dependent variable.',
    'Vt ≈ PINSP × Compliance. As compliance changes, Vt swings.',
    'The PIP alarm does not warn you in PCV — the low-Vt alarm does.',
    'PINSP is the rise above PEEP. Driving pressure is plat minus PEEP. Not the same.',
    'In severe bronchospasm, choose VCV — PCV will silently underventilate as resistance rises.',
  ],
};
