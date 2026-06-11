import type { ModuleConfig } from '../shell/types';

/**
 * M4b — Resistance
 * Track: Physiology · Phases: Primer → Read → Explore → Try It → Debrief.
 *
 * Per the M1M2_M4a_M4b shell spec. Focused module on airway resistance:
 * where it lives in the equation of motion, what it does to the
 * pressure waveform, and how the peak-plateau gap is used at the bedside
 * to distinguish a resistance problem from a compliance problem.
 */
export const M4b: ModuleConfig = {
  id: 'M4b',
  number: 5,
  title: 'Resistance',
  track: 'Physiology',
  estimated_minutes: 17,
  briefing: {
    tagline: 'Gap = flow × resistance.',
    overview:
      'Airway resistance is the extra pressure required to push gas through the endotracheal tube and the airways during flow. It lives in the resistive term of the equation of motion (flow × resistance) and shows up on the pressure waveform as the gap between peak and plateau. This module focuses on resistance — what it looks like on the waveform, what causes it acutely, and the bedside diagnostic move that separates it from a compliance problem.',
    what_youll_do: [
      'See how raising resistance lifts Ppeak while Pplat stays put — the widening-gap signature.',
      'Use the peak-plateau gap as a bedside diagnostic for resistance vs compliance.',
      'Name the common acute causes of rising resistance and the right first move for each.',
    ],
  },

  visible_learning_objectives: [
    'Explain how airway resistance appears on the pressure waveform and why it creates a peak-plateau gap.',
    'Use the peak-plateau gap as a bedside diagnostic tool to distinguish a resistance problem from a compliance problem.',
    'Recognize the common causes of acute resistance increase in ventilated patients and understand the management approach for each.',
  ],

  primer_questions: [
    {
      id: 'M4b-P1',
      prompt: 'In a passive patient on volume control, peak pressure rises sharply from 26 to 48 while plateau pressure rises only from 20 to 22. The most likely cause is:',
      options: [
        { label: 'Worsening lung compliance (pulmonary edema)', is_correct: false, explanation: 'A compliance problem moves peak and plateau together. Here the gap widened from 6 to 26 — that is a resistance pattern.' },
        { label: 'Increased airway resistance (e.g., bronchospasm or mucus plug)', is_correct: true, explanation: 'The peak-plateau gap widened from 6 to 26 cmH2O — reflects the resistive pressure component (extra pressure to push gas through narrowed airways during flow). Plateau is unchanged because alveolar mechanics are intact.' },
        { label: 'A disconnected circuit', is_correct: false, explanation: 'A leak would reduce delivered volume, not raise peak pressure.' },
        { label: 'Auto-PEEP', is_correct: false, explanation: 'Auto-PEEP raises plateau, not just peak; the flow waveform would show air trapping.' },
      ],
    },
    {
      id: 'M4b-P2',
      prompt: 'The peak-plateau gap is clinically useful because it directly reflects:',
      options: [
        { label: 'The compliance of the respiratory system', is_correct: false, explanation: 'Compliance is reflected in the plateau pressure (and driving pressure), not the gap.' },
        { label: 'The resistive pressure required to push gas through the airways during inspiratory flow', is_correct: true, explanation: 'During flow, pressure is needed to overcome airway and tube resistance. When flow stops at end-inspiration (plateau hold), that resistive pressure disappears. Ppeak − Pplat = the resistive component.' },
        { label: 'The PEEP level', is_correct: false, explanation: 'PEEP is the end-expiratory pressure — a different measurement.' },
        { label: 'The auto-PEEP level', is_correct: false, explanation: 'Auto-PEEP is measured by an expiratory hold maneuver, not an inspiratory hold.' },
      ],
    },
    {
      id: 'M4b-P3',
      prompt: 'A patient on volume control suddenly has a high peak pressure alarm. Plateau pressure measured by end-inspiratory hold is unchanged from baseline. The most appropriate first action is:',
      options: [
        { label: 'Increase tidal volume to overcome the obstruction', is_correct: false, explanation: 'Raising Vt raises peak pressure further. Never overcome a resistance problem by increasing volume.' },
        { label: 'Assess the patient and airway: suction, check tube position and patency, auscultate for bronchospasm, check that the patient is not biting the tube', is_correct: true, explanation: 'Widened gap = resistance. The differential includes secretions, bronchospasm, tube kinking, biting, or tube migration. Look and listen first.' },
        { label: 'Increase PEEP to splint open the airways', is_correct: false, explanation: 'PEEP does not treat resistance problems. It addresses alveolar recruitment.' },
        { label: 'Switch to pressure control', is_correct: false, explanation: 'Switching modes does not fix the obstruction and may mask the problem by silently reducing delivered volume.' },
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
    unlocked_controls: ['resistance', 'inspiratory_pause'],
    visible_readouts: ['pip', 'plat', 'drivingPressure'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    children: [
      {
        kind: 'manipulation',
        control: 'resistance',
        condition: { type: 'delta_pct', direction: 'increase', min_pct: 50 },
        require_acknowledgment: {
          question: 'What happened to peak pressure and plateau pressure?',
          options: [
            { label: 'Peak rose, plateau unchanged', is_correct: true, explanation: 'The resistance signature. Resistive pressure (flow × resistance) lives only during flow; when flow stops at the plateau hold, that component disappears.' },
            { label: 'Both rose together', is_correct: false, explanation: 'Parallel rise is the compliance signature, not resistance.' },
            { label: 'Peak unchanged, plateau rose', is_correct: false, explanation: 'Impossible — Ppeak ≥ Pplat always.' },
            { label: 'Both fell', is_correct: false, explanation: 'Higher resistance needs more pressure, not less.' },
          ],
        },
      },
      {
        kind: 'manipulation',
        control: 'resistance',
        condition: { type: 'delta_pct', direction: 'increase', min_pct: 50 },
        require_acknowledgment: {
          question: 'What happened to the peak-plateau gap?',
          options: [
            { label: 'Widened', is_correct: true, explanation: 'The gap IS the resistive component. Higher resistance → larger gap during flow.' },
            { label: 'Narrowed', is_correct: false, explanation: 'A narrowing gap would mean resistance falling, not rising.' },
            { label: 'Stayed the same', is_correct: false, explanation: 'A stable gap is the compliance signature.' },
          ],
        },
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        '**Where resistance lives in the pressure equation.** The equation of motion: `Pressure = (Vt / compliance) + (flow × resistance) + PEEP`.\n\nThe resistive component (flow × resistance) exists only during inspiratory flow. It is the extra pressure needed to push gas through the endotracheal tube and airways at speed. When flow stops — as it does during an end-inspiratory pause — the resistive pressure disappears and the remaining pressure equilibrates with the alveoli. This is the plateau pressure.\n\nTherefore: `Ppeak = Pplat + resistive pressure`. And: `Ppeak − Pplat = the resistive pressure = flow × resistance`.\n\nThis is why the peak-plateau gap is the resistance indicator. A normal gap is roughly 5–10 cmH2O. A gap above 10–15 is abnormal and demands investigation.',
    },
    {
      kind: 'prose',
      markdown:
        '**Clinical causes of increased resistance.**\n\n- **Secretions / mucus plug**: the most common cause of an acute resistance rise in the ICU. Suction the airway. Bronchoscopy if the plug is not cleared.\n- **Bronchospasm**: treat with inhaled bronchodilators (albuterol, ipratropium). Heliox may reduce resistance in severe cases. Consider IV magnesium in status asthmaticus.\n- **Endotracheal tube obstruction**: kinking, biting, or partial occlusion by secretions or blood. Pass a suction catheter; if resistance is met, replace the tube. A bite block prevents biting.\n- **Right mainstem intubation**: the tube has advanced into the right mainstem bronchus, so the left lung is excluded. Unilateral breath sounds + rising pressure. Pull back to 21–23 cm at the lip and confirm with chest X-ray.\n- **Circuit obstruction**: water accumulation in ventilator tubing, kinked circuit. Drain the circuit; reposition tubing.',
    },
    {
      kind: 'prose',
      markdown:
        '**Resistance vs compliance: the diagnostic move.** When a high peak pressure alarm fires in volume control, the first question is: what is the plateau pressure?\n\nIf Pplat is also high (gap is normal): compliance problem. Both peak and plateau moved together. Think pneumothorax, worsening ARDS, new consolidation, pulmonary edema, patient fighting the vent.\n\nIf Pplat is unchanged (gap widened): resistance problem. Think secretions, bronchospasm, tube obstruction, right mainstem intubation.\n\nThis single measurement (the plateau, via an end-inspiratory hold) directs the entire clinical response. Without it, all high-peak alarms look the same.\n\nIn pressure control, the logic reverses: resistance changes affect peak, but the ventilator holds pressure constant, so the delivered tidal volume falls. A sudden drop in delivered Vt in pressure control with unchanged settings is the resistance alarm equivalent.',
    },
    {
      kind: 'prose',
      markdown:
        '**Inspecting the flow waveform.** The flow-time waveform gives additional resistance information without needing a plateau hold. In volume control with constant (square) inspiratory flow, the pressure-time waveform should show a smooth ramp that ends at peak. A notch or sharp rise in the pressure waveform during flow suggests a sudden resistance increase.\n\nOn the expiratory side of the flow waveform, a slowed return to zero indicates obstructive disease with prolonged time constants. This is the early-warning sign for auto-PEEP (covered in a later module).',
    },
  ],

  hint_ladder: {
    tier1: 'Raise the resistance slider. Watch both Ppeak and Pplat carefully. Which one moves?',
    tier2: 'Resistance affects the pressure during flow. Once flow stops (plateau hold), resistance pressure disappears. So resistance changes Ppeak but not Pplat. The gap widens.',
    tier3: { hint_text: 'Show me — demonstrates a resistance increase and the widening gap, then resets.', demonstration: { control: 'resistance', target_value: 25 } },
  },

  summative_quiz: [
    {
      id: 'M4b-Q1',
      prompt: 'Two patients on volume control. Patient A: Ppeak 28, Pplat 26 (gap 2). Patient B: Ppeak 38, Pplat 18 (gap 20). Which is true?',
      options: [
        { label: 'Both have compliance problems', is_correct: false, explanation: 'B has a huge gap — that is resistance, not compliance.' },
        { label: 'Both have resistance problems', is_correct: false, explanation: 'A has a tiny gap with a high Pplat — that is compliance, not resistance.' },
        { label: 'Patient A has a compliance problem; Patient B has a resistance problem', is_correct: true, explanation: 'A\'s tiny gap = nearly all of Ppeak is alveolar = compliance problem. B\'s huge gap = most of Ppeak is resistive = resistance problem.' },
        { label: 'Patient A has a resistance problem; Patient B has a compliance problem', is_correct: false, explanation: 'Reversed.' },
      ],
    },
    {
      id: 'M4b-Q2',
      prompt: 'A high-peak alarm fires. You perform an end-inspiratory hold. Pplat is 28 cmH2O, unchanged from the baseline 10 minutes ago. Ppeak is now 46. The most appropriate first intervention is:',
      options: [
        { label: 'Reduce tidal volume', is_correct: false, explanation: 'Pplat is acceptable. The problem is resistance, not alveolar overdistension.' },
        { label: 'Suction the airway and assess for bronchospasm', is_correct: true, explanation: 'Gap widened from ~8 to ~18. This is a resistance problem. Suction, listen for wheeze, check tube position and patency.' },
        { label: 'Increase PEEP', is_correct: false, explanation: 'PEEP does not treat resistance problems.' },
        { label: 'Increase tidal volume to overcome the obstruction', is_correct: false, explanation: 'This would raise peak pressure further.' },
      ],
    },
    {
      id: 'M4b-Q3',
      prompt: 'In pressure-control ventilation, an acute increase in airway resistance will primarily cause:',
      options: [
        { label: 'Ppeak to rise with Pplat unchanged', is_correct: false, explanation: 'In PC, the vent holds pressure constant; peak is set by the operator. The consequence of resistance is different in PC.' },
        { label: 'Delivered tidal volume to fall, with the pressure waveform largely unchanged', is_correct: true, explanation: 'In PC, the inspiratory pressure is fixed. Rising resistance opposes flow, less gas enters the lungs per breath, Vt falls. The pressure waveform looks similar but volume drops silently — monitoring delivered Vt is essential in pressure control.' },
        { label: 'Both peak and plateau to rise together', is_correct: false, explanation: 'That is a compliance pattern in volume control.' },
        { label: 'Pplat to rise while Ppeak is unchanged', is_correct: false, explanation: 'Impossible; Pplat cannot exceed Ppeak.' },
      ],
    },
    {
      id: 'M4b-Q4',
      prompt: 'You suspect a mucus plug in an intubated patient. The expected peak-plateau gap is:',
      options: [
        { label: 'Narrow (< 5 cmH2O)', is_correct: false, explanation: 'A mucus plug causes airway obstruction = high resistance = widened gap.' },
        { label: 'Wide (> 15 cmH2O)', is_correct: true, explanation: 'Mucus plug = high airway resistance = large peak-plateau gap. Pplat stays near baseline; Ppeak rises dramatically.' },
        { label: 'Normal (5–10 cmH2O)', is_correct: false, explanation: 'A normal gap would not be expected with a significant obstruction.' },
        { label: 'Gap is not useful for this diagnosis', is_correct: false, explanation: 'The widened gap IS the diagnostic finding.' },
      ],
    },
    {
      id: 'M4b-Q5',
      prompt: 'The peak-plateau gap increases with a higher inspiratory flow rate even in a normal lung. Why?',
      options: [
        { label: 'Higher flow increases alveolar pressure', is_correct: false, explanation: 'Alveolar pressure (plateau) is independent of flow rate.' },
        { label: 'Higher flow increases the resistive pressure component (flow × resistance), raising Ppeak without changing Pplat', is_correct: true, explanation: 'Resistive pressure = flow × resistance. Double the flow, double the resistive component. Pplat stays the same. This is why operators sometimes reduce inspiratory flow to lower Ppeak in patients with known airway resistance.' },
        { label: 'Higher flow reduces compliance', is_correct: false, explanation: 'Flow rate has no effect on lung compliance.' },
        { label: 'Higher flow causes auto-PEEP', is_correct: false, explanation: 'Auto-PEEP is caused by insufficient expiratory time, not by high inspiratory flow per se.' },
      ],
    },
  ],

  explore_card: {
    patient_context:
      'Passive patient on volume control. Normal compliance (50) and resistance (10). You are going to manipulate resistance and watch what happens to the peak-plateau gap.',
    unlocked_controls_description: [
      { name: 'Resistance · 5–40 cmH2O/L/s', description: 'how hard it is to push gas through the airways. Higher = more obstruction (bronchospasm, mucus plug, kinked tube).' },
    ],
    readouts_description: [
      { name: 'Ppeak', description: 'rises with resistance because resistance creates extra pressure during flow.' },
      { name: 'Pplat', description: 'stays the same when resistance changes alone (alveolar mechanics unchanged).' },
      { name: 'Ppeak − Pplat (gap)', description: 'THIS is the resistance indicator. Watch it widen as you raise resistance.' },
    ],
    suggestions: [
      'Raise resistance from 10 to 25 (simulate bronchospasm). What happens to Ppeak? To Pplat? To the gap?',
      'Raise it further to 35 (severe obstruction). Gap should widen dramatically.',
      'Restore to 10. Now raise compliance slightly. Confirm that gap stays stable — gap is resistance, not compliance.',
      'The key observation: resistance changes Ppeak without changing Pplat. Gap widens. Pplat stays put.',
    ],
  },

  user_facing_task:
    'You are going to demonstrate the resistance signature to your senior. Increase resistance by at least 50% and identify what happened to peak pressure, plateau pressure, and the peak-plateau gap.',
  success_criteria_display: [
    'Raise resistance by at least 50% from baseline.',
    'Identify what happened to Ppeak.',
    'Identify what happened to Pplat.',
    'Identify what happened to the peak-plateau gap.',
  ],
  task_framing_style: 'A',

  key_points: [
    'Ppeak − Pplat = the resistive pressure component = flow × resistance.',
    'Resistance changes raise Ppeak while leaving Pplat unchanged. The gap widens.',
    'Compliance changes raise both Ppeak and Pplat together. The gap stays stable.',
    'The plateau pressure (end-inspiratory hold) is the single most important measurement to distinguish resistance from compliance problems.',
    'Common acute resistance causes: secretions/mucus plug, bronchospasm, endotracheal tube obstruction (kinking, biting), right mainstem intubation, circuit obstruction.',
    'In pressure control, a resistance increase causes Vt to fall silently (pressure waveform unchanged). Monitor delivered Vt closely in PC.',
    'Normal peak-plateau gap: 5–10 cmH2O. Gap > 15 cmH2O: investigate resistance.',
  ],
};
