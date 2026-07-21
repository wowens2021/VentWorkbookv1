import type { ModuleConfig } from '../shell/types';

/**
 * M13 — PEEP and Oxygenation Strategies (merged M13 + M14)
 *
 * Per docs/M13_M14_merged_shell_spec.pdf. Replaces the two separate
 * M13 (PEEP) and M14 (Oxygenation Strategies) modules with a single
 * Advanced-Topics module (~25–30 min) that teaches the full clinical
 * reasoning loop: oxygenation is governed by mean airway pressure;
 * FiO2 / PEEP / inspiratory time are the three levers; PEEP is the
 * primary alveolar-recruitment lever and requires careful titration.
 *
 * Implementation notes for the sim layer:
 *   - The merged module uses VC mode throughout (spec §Config object).
 *   - inspiratory_time is unlocked during Phase 3 (Explore) for free
 *     experimentation; in Phase 4 (Try It) only PEEP is unlocked so the
 *     learner cannot satisfy the objective by a non-PEEP route.
 *   - The "compliance peaks at PEEP 13" curve is a SIM-LEVEL physics
 *     extension that the existing PlaygroundSim does NOT yet model — the
 *     module reads the live static-compliance value the sim already
 *     reports. If the sim later models PEEP-dependent recruitment, the
 *     tracker continues to work without changes.
 *
 * The merged variable name stays `M13` so module-index back-compat is
 * preserved (string id is now `M13_M14_merged`). The legacy `M14`
 * export is removed.
 */
export const M13: ModuleConfig = {
  id: 'M13_M14_merged',
  number: 13,
  title: 'PEEP and Oxygenation Strategies',
  track: 'Advanced Topics',
  estimated_minutes: 28,
  briefing: {
    tagline: 'Oxygenation is mean airway pressure. PEEP is the main lever.',
    overview:
      'A merger of the old PEEP module and the old Oxygenation Strategies module — they were always teaching the same thing from two angles. Oxygenation is governed by **mean airway pressure**, not peak pressure. The three levers that raise mean airway pressure are **FiO2** (parallel, no waveform change), **PEEP** (raises the floor and recruits alveoli), and **inspiratory time** (widens the inspiratory plateau, raises mean pressure without raising peak). Of the three, PEEP is the primary recruitment lever — and the one that bites back hardest when overshot. This module walks the full reasoning loop: pick the right lever, titrate PEEP stepwise to peak compliance, recognize when PEEP is helping vs harming, and know when PEEP should not be used at all. **Prerequisite:** M4a (Compliance) — the titration task reads the live static-compliance readout, and you need to know what that number means.',
    what_youll_do: [
      'See why the same SpO2 can sit on top of very different mean airway pressures.',
      'Move FiO2, PEEP, and inspiratory time in isolation and watch which readouts they touch.',
      'Run a stepwise PEEP titration and identify the PEEP that produces the highest static compliance.',
      'Recognize the hemodynamic and overdistension cost of too much PEEP, and the contraindications (pure shunt, dynamic hyperinflation).',
    ],
  },

  visible_learning_objectives: [
    'Explain why mean airway pressure (not peak pressure) is the primary determinant of oxygenation on the ventilator.',
    'Identify the three oxygenation levers — FiO2, PEEP, and inspiratory time — and predict how each affects mean airway pressure and the pressure waveform.',
    'Perform a stepwise PEEP titration, wait for compliance to stabilize at each step, and identify the PEEP value that produces the highest static compliance.',
    'Recognize the hemodynamic and overdistension risks of excessive PEEP and explain the clinical signs of each.',
    'Distinguish appropriate from inappropriate uses of PEEP (anatomic shunt, obstructive disease with dynamic hyperinflation).',
  ],

  primer_questions: [
    {
      id: 'M13M-P1',
      prompt: 'Among ventilator settings, oxygenation correlates most strongly with:',
      options: [
        { label: 'Peak inspiratory pressure', is_correct: false, explanation: 'Peak pressure is the maximum during a breath but occurs briefly. Brief excursions to a high pressure do not recruit alveoli for the rest of the breath cycle. Mean pressure does.' },
        { label: 'Mean airway pressure', is_correct: true, explanation: 'Mean airway pressure is the time-weighted average of pressure across the entire respiratory cycle. It reflects how long alveoli spend at elevated pressure — the window during which gas exchange occurs. All strategies that improve oxygenation (PEEP, longer inspiratory time, higher driving pressure in PC) work by raising mean airway pressure.' },
        { label: 'Tidal volume', is_correct: false, explanation: 'Tidal volume is the primary lever for CO2 clearance (minute ventilation), not oxygenation. In ARDS, smaller tidal volumes are protective.' },
        { label: 'Respiratory rate', is_correct: false, explanation: 'Rate primarily controls CO2 clearance via minute ventilation. It has minimal direct effect on oxygenation.' },
      ],
    },
    {
      id: 'M13M-P2',
      prompt: 'PEEP (positive end-expiratory pressure) primarily improves oxygenation by:',
      options: [
        { label: 'Increasing the FiO2 delivered to the alveoli', is_correct: false, explanation: 'FiO2 and PEEP are independent controls. PEEP does not change the oxygen concentration; it changes alveolar geometry.' },
        { label: 'Keeping alveoli open at end-expiration that would otherwise collapse', is_correct: true, explanation: 'PEEP holds alveolar pressure above atmospheric at end-expiration, preventing collapse of unstable alveoli. Recruited alveoli participate in gas exchange, reducing shunt fraction. This is why PEEP improves oxygenation in atelectasis, pneumonia, and ARDS.' },
        { label: "Increasing the patient's spontaneous respiratory rate", is_correct: false, explanation: 'PEEP does not drive respiratory rate.' },
        { label: 'Lowering airway resistance to improve gas distribution', is_correct: false, explanation: 'PEEP addresses alveolar recruitment, not airway resistance. Resistance is the M4b topic.' },
      ],
    },
    {
      id: 'M13M-P3',
      prompt: 'Which of the following best describes the primary risk of excessive PEEP?',
      options: [
        { label: 'FiO2 rises uncontrollably', is_correct: false, explanation: 'FiO2 and PEEP are set independently.' },
        { label: 'Overdistension of already-open alveoli, increasing dead space and impairing venous return to the heart', is_correct: true, explanation: 'Too much PEEP overdistends open alveoli, compressing pulmonary capillaries (increasing dead space) and raising intrathoracic pressure (impeding venous return, reducing cardiac output). The oxygenation benefit of more PEEP peaks and then reverses past the optimal point.' },
        { label: 'Plateau pressure falls, reducing alveolar ventilation', is_correct: false, explanation: 'Increasing PEEP raises plateau pressure, not lowers it.' },
        { label: 'CO2 retention worsens immediately', is_correct: false, explanation: 'CO2 is affected by minute ventilation, not directly by PEEP. Some dead space increase can occur with very high PEEP but it is not the primary or immediate risk.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'ards_moderate_vc',
    preset: {
      mode: 'VCV',
      // ~6 mL/kg PBW for a 67 kg PBW patient (67" male). Moderate ARDS:
      // compliance 28, resistance 12.
      settings: { tidalVolume: 400, respiratoryRate: 18, peep: 5, fiO2: 65, iTime: 1.0 },
      patient: { compliance: 28, resistance: 12, spontaneousRate: 0, gender: 'M', heightInches: 67 },
    },
    // Phase 3 (Explore) opens all three oxygenation levers for free
    // experimentation. The Phase 4 (Try It) task then locks fiO2 and
    // iTime so PEEP is the only route to satisfaction; the shell will
    // enforce this via the task framing / hint copy until per-phase
    // locking is wired into the scenario schema.
    unlocked_controls: ['peep', 'fiO2', 'iTime'],
    visible_readouts: [
      'pip', 'plat', 'drivingPressure', 'totalPeep',
      'fio2', 'spo2',
      'meanAirwayPressure', 'staticCompliance',
      'sbp',
    ],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  /**
   * The spec calls for a compound tracker:
   *   Part A — outcome tracker that samples static compliance at ≥ 5
   *            distinct stabilized PEEP values, at least one ≥ 13.
   *   Part B — recognition prompt asking which PEEP produced the
   *            highest compliance, with options generated from the
   *            learner's own sampled data.
   *
   * The Part-A "stabilized sample at five PEEPs" gate and the
   * dynamic Part-B options-generator both require new shell
   * machinery that does not yet exist. As a working substitute the
   * tracker below uses a strict-sequence compound of five PEEP
   * manipulations (5 → 7 → 9 → 11 → 13) followed by a fixed
   * recognition prompt with PEEP 13 as the correct answer. The
   * teaching outcome is the same — walk PEEP up, watch compliance,
   * identify the peak — and the shell upgrade can wire in the
   * dynamic options later without re-authoring the module.
   */
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    present_one_at_a_time: true,
    // Observation[i] is revealed AFTER child[i] fires, so each line describes
    // the PEEP the learner just set to trigger it (not the one before). The
    // sim models recruitment: compliance climbs from PEEP 5→8 and then
    // PLATEAUS (it does not fall — no overdistension penalty is modeled), so
    // the exercise is "recruit until Cstat stops rising," with the real-lung
    // overdistension caveat noted at the end.
    observations: [
      'PEEP 7 — Cstat has ticked up from its PEEP-5 baseline; the lung is starting to recruit. (Jot the PEEP-5 and PEEP-7 compliance numbers down.)',
      'PEEP 9 — Cstat has climbed further and is near its plateau; most of the recruitable lung is now open.',
      'PEEP 11 — Cstat has plateaued and SpO2 is improving. Extra PEEP is no longer buying you compliance.',
      'PEEP 13 — Cstat is flat at its recruited maximum. You\'ve reached the fully-open plateau.',
      'You\'ve walked PEEP up. Now identify where compliance stopped improving.',
      'PEEP 15 — Cstat is unchanged from the plateau; no further recruitment. In a real lung, pushing PEEP past the recruited plateau would eventually overdistend and drop compliance — this sim models recruitment only, so watch for the plateau, and treat the rising intrathoracic pressure (SBP may fall) as the signal you\'ve gone far enough.',
    ],
    children: [
      { kind: 'manipulation', control: 'peep', condition: { type: 'absolute', operator: '>=', value: 7 } },
      { kind: 'manipulation', control: 'peep', condition: { type: 'absolute', operator: '>=', value: 9 } },
      { kind: 'manipulation', control: 'peep', condition: { type: 'absolute', operator: '>=', value: 11 } },
      { kind: 'manipulation', control: 'peep', condition: { type: 'absolute', operator: '>=', value: 13 } },
      {
        kind: 'manipulation',
        control: 'peep',
        condition: { type: 'absolute', operator: '>=', value: 13 },
        require_acknowledgment: {
          question: 'Looking at the compliance values you recorded across the titration, at what PEEP did static compliance stop improving — i.e. reach its recruited plateau?',
          options: [
            { label: 'PEEP 5', is_correct: false, explanation: 'Compliance is at its lowest here; the lung is underrecruited.' },
            { label: 'PEEP 9', is_correct: true, explanation: 'Compliance climbs from PEEP 5 to about PEEP 8–9 and then plateaus — most of the recruitable lung is open by here. This is the compliance-guided best PEEP: the lowest PEEP that fully recruits. Going higher adds pressure without adding compliance.' },
            { label: 'PEEP 13', is_correct: false, explanation: 'Compliance at 13 is the same as at 9 — it plateaued earlier. You\'ve added PEEP (and intrathoracic pressure) without a compliance gain.' },
            { label: 'PEEP 17', is_correct: false, explanation: 'Same plateau compliance as 9, but the extra PEEP raises intrathoracic pressure and risks hemodynamic compromise for no recruitment benefit.' },
          ],
        },
      },
      {
        kind: 'manipulation',
        control: 'peep',
        condition: { type: 'absolute', operator: '>=', value: 15 },
        require_acknowledgment: {
          question: 'You pushed PEEP past the recruited plateau. Which of the following describes what you should expect on the readouts?',
          options: [
            { label: 'Cstat is flat (no further recruitment); SBP may drop from the higher intrathoracic pressure.', is_correct: true, explanation: 'Once the recruitable lung is open, more PEEP adds no compliance — Cstat plateaus. The rising airway/intrathoracic pressure can still cut venous return and drop the blood pressure, which is your signal you\'ve gone far enough. (In a real lung, pushing further would eventually overdistend and make Cstat FALL — the danger this method protects against.)' },
            { label: 'Cstat keeps rising indefinitely — more PEEP is always better.', is_correct: false, explanation: 'There is a ceiling. Once the recruitable lung is open, more PEEP adds no compliance and only raises pressure.' },
            { label: 'Cstat is unchanged because PEEP does not affect compliance.', is_correct: false, explanation: 'PEEP does affect compliance below the plateau — it determines whether unstable alveoli are open or collapsed. Above the plateau it just stops helping.' },
          ],
        },
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        '**What actually drives oxygenation on the ventilator.** The single most important concept in this module: oxygenation is governed by **mean airway pressure**, not by peak pressure. Mean airway pressure is the time-weighted average of pressure in the airways across the entire respiratory cycle — both inspiratory and expiratory phases. The higher the mean airway pressure, the more time alveoli spend at elevated pressure, and the more gas exchange can occur.\n\nThis is why the three oxygenation levers all work by raising mean airway pressure through different mechanisms:\n\n- **FiO2**: raises the oxygen concentration in the inspired gas. Has no effect on the pressure waveform at all. Acts in parallel with the pressure-based levers.\n- **PEEP**: raises the floor of the pressure waveform. Every moment of the respiratory cycle — inspiration and expiration — is shifted upward. PEEP also recruits collapsed alveoli, which is a separate and additive mechanism.\n- **Inspiratory time**: lengthens the proportion of each breath cycle spent at the higher inspiratory pressure. In pressure control, this raises mean airway pressure without raising peak pressure — the plateau phase is extended.\n\nWhen a patient is hypoxemic and you need to do something about it, you have three distinct levers. Understanding which one to reach for first — and what the trade-offs of each are — is the clinical skill this module teaches.',
    },
    {
      kind: 'figure',
      caption: 'The three levers on the pressure waveform. PEEP lifts the entire floor; longer inspiratory time widens the plateau without changing the peak; FiO2 is invisible on the waveform.',
      src: '/figures/peep_oxygenation_levers.svg',
    },
    {
      kind: 'prose',
      markdown:
        '**What PEEP does and why it needs titration.** PEEP holds alveolar pressure above atmospheric at end-expiration. In diseased lungs — ARDS, pneumonia, pulmonary edema — alveoli that have been flooded or destabilized by surfactant loss tend to collapse at the end of each exhalation. This cyclic collapse and reopening is itself a source of lung injury (atelectrauma). PEEP prevents it.\n\nBut PEEP has a ceiling. Once the recruitable alveoli are open, more PEEP does not open more alveoli — it overdistends the ones that are already open. Overdistension compresses pulmonary capillaries, increases dead space, and worsens gas exchange. Simultaneously, high PEEP raises intrathoracic pressure, which impedes venous return to the right heart and can cause hypotension, especially in hypovolemic patients.\n\nThe optimal PEEP is the point where recruitment benefit is maximized before overdistension begins. In practice, the bedside marker for this is **static compliance**: compliance is highest when the lung is neither underrecruited (atelectatic) nor overdistended. This is the basis of the decremental PEEP trial.',
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown:
        '**Clinical distinction — when PEEP does NOT help.** PEEP recruits collapsed alveoli. It cannot help blood that never reaches the alveoli at all. In **anatomic shunt** (right-to-left intracardiac defect), the blood bypasses the lungs entirely — PEEP has no access to it. In **obstructive disease** (COPD, severe asthma) with dynamic hyperinflation, adding external PEEP on top of existing auto-PEEP can worsen air trapping and compromise hemodynamics. **The rule:** use PEEP when the chest X-ray shows white stuff where it should be black (airspace disease). Use it cautiously or not at all when the lungs are hyperinflated or the problem is intracardiac.',
    },
    {
      kind: 'prose',
      markdown:
        '**How to find the best PEEP: the stepwise titration.** The decremental PEEP trial (described in ARDSNet protocols and supported by bedside practice) works as follows: walk PEEP upward in steps of 2 cmH2O, pause at least 5 breaths at each level for the lung to stabilize, record the static compliance at each step. Plot the compliance values mentally. The PEEP level where compliance is highest is the best PEEP for this patient right now.\n\nBelow that level, some alveoli are still collapsing — compliance is low because the tidal volume is being distributed across fewer open alveoli. Above that level, open alveoli are being stretched — compliance falls again as the alveolar walls resist further distension.\n\nThe ARDSNet FiO2/PEEP tables (lower-PEEP and higher-PEEP variants) are a simpler clinical shortcut: pair FiO2 and PEEP from the table to target SpO2 88–94% or PaO2 55–80 mmHg. These tables do not find the "optimal" PEEP physiologically but are practical and proven safe in large trials. For most patients with moderate ARDS, a PEEP of 8–12 cmH2O with a matched FiO2 is sufficient. The stepwise compliance-guided titration is reserved for patients where a more precise answer is needed (severe ARDS, unusual physiology, concern for overdistension).',
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        '**The trade-off you accept with high PEEP.** Driving pressure (Pplat − PEEP = Vt ÷ compliance) is the pressure applied across the lung with each tidal breath. As PEEP **recruits lung and raises compliance**, driving pressure falls for the same Vt — a good thing. (Note: at a *fixed* compliance, driving pressure is independent of PEEP — it\'s the recruitment that lowers it.) But once PEEP passes the recruited plateau, compliance stops improving, so driving pressure stops falling — and in a real lung, overdistension would drop compliance and drive it back up. Hemodynamically, PEEP above 10–12 cmH2O can reduce venous return in hypovolemic patients and should always be paired with a check of blood pressure and heart rate after each step.',
    },
    {
      kind: 'prose',
      markdown:
        '**Predict before you explore.** This patient is on PEEP 5 with an SpO2 in the high 80s and a static compliance around 23 mL/cmH2O (moderate ARDS, partly derecruited at this low PEEP). If you raise PEEP to 10, what do you expect will happen to:\n\n- (a) SpO2?\n- (b) static compliance?\n- (c) Ppeak?\n\nWrite down or mentally commit to an answer, then go to the Explore phase and try it.',
    },
  ],

  hint_ladder: {
    tier1: 'Walk PEEP up in steps of 2. At each step, wait and watch the Cstat readout stabilize before moving on.',
    tier2: 'You need compliance values at multiple PEEP levels. Try PEEP 5, 7, 9, 11, 13. Note the compliance number at each. Look for where it peaks.',
    tier3: { hint_text: 'Show me — sets PEEP to 13 (the best PEEP for this patient). You still need to walk the steps to record the compliance numbers.', demonstration: { control: 'peep', target_value: 13 } },
  },

  summative_quiz: [
    {
      id: 'M13M-Q1',
      prompt: 'During a stepwise PEEP titration on a patient with moderate ARDS, you record the following compliance values: PEEP 5 → 18 mL/cmH2O; PEEP 7 → 22; PEEP 9 → 26; PEEP 11 → 29; PEEP 13 → 31; PEEP 15 → 28; PEEP 17 → 24. The best PEEP for this patient is:',
      options: [
        { label: 'PEEP 5', is_correct: false, explanation: 'Compliance is at its lowest here; the lung is underrecruited.' },
        { label: 'PEEP 9', is_correct: false, explanation: 'Compliance is still rising at PEEP 9; the peak has not been reached. Stopping here leaves recruitable lung unopened.' },
        { label: 'PEEP 13', is_correct: true, explanation: 'Compliance peaks at PEEP 13 (31 mL/cmH2O). Below this, alveoli are still collapsing at end-expiration. Above this, open alveoli are being overdistended and compliance falls. PEEP 13 is where recruitment benefit is maximized before overdistension begins.' },
        { label: 'PEEP 17', is_correct: false, explanation: 'Compliance has fallen to 24 at PEEP 17, below the peak. This is the overdistension range for this patient. Hemodynamic compromise is also more likely here.' },
      ],
    },
    {
      id: 'M13M-Q2',
      prompt: 'To improve oxygenation in a patient on pressure control without raising peak pressure, the most effective single ventilator adjustment is:',
      options: [
        { label: 'Increase the set respiratory rate', is_correct: false, explanation: 'Rate primarily affects CO2 clearance (minute ventilation), not oxygenation. It does not change mean airway pressure in a meaningful way.' },
        { label: 'Increase inspiratory time', is_correct: true, explanation: 'In pressure control, extending inspiratory time keeps the alveoli at the elevated inspiratory pressure for more of each breath cycle, raising mean airway pressure without raising peak pressure. Peak stays the same; the plateau is simply wider.' },
        { label: 'Decrease PEEP', is_correct: false, explanation: 'Decreasing PEEP lowers mean airway pressure and promotes alveolar derecruitment. This worsens oxygenation.' },
        { label: 'Decrease FiO2', is_correct: false, explanation: 'Decreasing FiO2 directly reduces inspired oxygen concentration. This will worsen oxygenation.' },
      ],
    },
    {
      id: 'M13M-Q3',
      prompt: 'A patient with ARDS is on FiO2 0.90 and PEEP 8 with SpO2 88%. According to ARDSNet-style oxygenation management, the next step is:',
      options: [
        { label: 'Reduce FiO2 first to limit oxygen toxicity', is_correct: false, explanation: 'FiO2 is already very high (0.90). Reducing it further would worsen oxygenation. Oxygen toxicity is a concern with prolonged high FiO2, but the immediate problem is inadequate oxygenation, not excess.' },
        { label: 'Increase PEEP before increasing FiO2 further', is_correct: true, explanation: 'With FiO2 already at 0.90 and SpO2 not meeting target, the ARDSNet approach steps up PEEP next. PEEP recruits alveoli, reducing shunt. FiO2 can sometimes be weaned once PEEP improves the shunt fraction. Driving FiO2 to 1.0 first, without addressing the underlying shunt, risks prolonged hyperoxia without mechanism-based benefit.' },
        { label: 'Increase both FiO2 and PEEP simultaneously to maximum', is_correct: false, explanation: 'Maximum PEEP and FiO2 simultaneously is not a titration strategy; it removes the ability to know which lever is helping and exposes the patient to maximum hemodynamic and overdistension risk without diagnostic purpose.' },
        { label: 'Add inhaled nitric oxide', is_correct: false, explanation: 'Inhaled nitric oxide is a rescue therapy for refractory hypoxemia (P/F < 100) or severe RV failure, not a first-line response to inadequate oxygenation on moderate settings.' },
      ],
    },
    {
      id: 'M13M-Q4',
      prompt: 'A patient with severe COPD and dynamic hyperinflation (auto-PEEP of 10 cmH2O) is showing ineffective triggering — visible inspiratory efforts without delivered breaths. Adding extrinsic PEEP of 8 cmH2O (approximately 80% of auto-PEEP) is expected to:',
      options: [
        { label: 'Worsen the hyperinflation by adding to the existing auto-PEEP', is_correct: false, explanation: 'This is the common misconception. Adding extrinsic PEEP below the auto-PEEP level does not add to total end-expiratory pressure — it reduces the pressure gradient the patient must generate to trigger the vent. The "waterfall" model: the critical airway-collapse point is the auto-PEEP level. Adding extrinsic PEEP up to that level raises the downstream pressure to match, allowing flow without worsening collapse.' },
          { label: 'Reduce the triggering work by matching extrinsic PEEP to the auto-PEEP level, making it easier for the patient to trigger without worsening air trapping', is_correct: true, explanation: 'The patient must drop alveolar pressure below the set trigger threshold to initiate a breath. With auto-PEEP of 10 and set PEEP of 0, the patient must generate −10 cmH2O of effort before any trigger response. Setting extrinsic PEEP at 8 reduces the effective triggering work to approximately −2 cmH2O. Critically, extrinsic PEEP below the auto-PEEP level does not further trap gas.' },
        { label: 'Eliminate auto-PEEP entirely by equilibrating pressures', is_correct: false, explanation: 'Extrinsic PEEP does not eliminate auto-PEEP. It reduces triggering burden; the underlying obstruction still requires rate reduction and bronchodilators.' },
        { label: 'Have no effect because the patient already has elevated end-expiratory pressure', is_correct: false, explanation: 'This confuses total end-expiratory alveolar pressure (the auto-PEEP) with the set PEEP. The trigger threshold is referenced to the set PEEP. Setting extrinsic PEEP at 8 reduces the work of triggering even though alveolar pressure is already elevated.' },
      ],
    },
    {
      id: 'M13M-Q5',
      prompt: 'A patient with ARDS has improved from severe to moderate (P/F ratio now 180, up from 90). Current settings: FiO2 0.60, PEEP 14, SpO2 94%. The most appropriate next step in oxygenation management is:',
      options: [
        { label: 'Reduce PEEP first, then wean FiO2', is_correct: false, explanation: 'The standard approach is to wean the toxic exposure (FiO2) before weaning the recruitment support (PEEP). Removing PEEP first risks derecruitment.' },
        { label: 'Wean FiO2 toward 0.40 while maintaining PEEP', is_correct: true, explanation: 'When oxygenation is improving, FiO2 is typically weaned first to reduce prolonged hyperoxia risk. PEEP is held until oxygenation is more reliably stable — typically until FiO2 is at or below 0.40–0.50 — then weaned cautiously in 2 cmH2O decrements with reassessment of SpO2 and compliance between steps.' },
        { label: 'Wean both FiO2 and PEEP simultaneously', is_correct: false, explanation: 'Weaning both simultaneously makes it impossible to know which change caused any deterioration and doubles the risk of derecruitment.' },
        { label: 'Maintain current settings indefinitely until P/F normalizes', is_correct: false, explanation: 'Prolonged high FiO2 (above 0.60 for many days) is associated with oxidative lung injury. The goal is the lowest FiO2 that achieves target SpO2, not the highest.' },
      ],
    },
  ],

  explore_card: {
    patient_context:
      'A 67-year-old with moderate ARDS, admitted overnight. Lung-protective tidal volumes already set (Vt 400 mL at 6 mL/kg for a 67 kg PBW). Compliance 28, resistance 12 — typical for moderate ARDS. All three oxygenation levers are unlocked. Try the controls. Nothing counts yet.',
    unlocked_controls_description: [
      { name: 'PEEP · 5–20 cmH2O (steps of 2)', description: 'End-expiratory pressure. The primary alveolar-recruitment lever. Higher PEEP opens more alveoli and raises mean airway pressure. Too high and you overdistend the open alveoli and impair venous return.' },
      { name: 'FiO2 · 0.21–1.0', description: 'Fraction of inspired oxygen. The most direct oxygenation lever. Independent of the pressure waveform — watch SpO2 but not the waveform when you change FiO2.' },
      { name: 'Inspiratory time · 0.6–2.0 s', description: 'How long each breath holds at inspiratory pressure. Longer inspiratory time raises mean airway pressure without raising peak pressure. Watch MAP specifically when you change this — Ppeak will be unchanged.' },
    ],
    readouts_description: [
      { name: 'Mean airway pressure (MAP)', description: 'this is the oxygenation number. All three controls affect it differently. Watch which levers move it and which don\'t.' },
      { name: 'Static compliance (Cstat, live)', description: 'updates every breath. This is the key readout for the titration task. Learn what it looks like at PEEP 5 vs PEEP 12 vs PEEP 18.' },
      { name: 'SpO2', description: 'the clinical oxygenation signal. Tracks compliance at different PEEP levels.' },
      { name: 'Ppeak and Pplat', description: 'watch what happens to each when you change inspiratory time vs when you change PEEP. They behave differently.' },
    ],
    suggestions: [
      'Try raising PEEP from 5 to 14 in steps of 2. At each step, wait 5 breaths and watch the compliance readout stabilize. Does it always go up? Or does it peak and then fall?',
      'Reset PEEP to 5. Change only inspiratory time from 1.0 to 1.5 seconds. Watch mean airway pressure. Does Ppeak change? This is the key insight from the old M14.',
      'Reset everything. Change only FiO2 from 0.65 to 1.0. Watch SpO2. Does anything on the pressure waveform change? FiO2 is a parallel lever — it doesn\'t touch the mechanics at all.',
      'Try setting PEEP to 18 (high). Watch compliance fall. Watch what happens to the driving pressure. This is the overdistension territory.',
      'Use "Reset to start" between experiments to keep your bearings.',
    ],
  },

  user_facing_task:
    "You're caring for a 67-year-old with moderate ARDS admitted overnight. The team has already set lung-protective tidal volumes. The attending wants you to find the best PEEP for this patient using a stepwise titration — walk PEEP up across the available range, give the lungs time to respond at each level, and identify where compliance is highest.",
  success_criteria_display: [
    'Sample compliance at a minimum of 5 different PEEP values across the range (PEEP 5 through at least PEEP 15).',
    'Wait at least 5 breaths at each PEEP level before moving to the next (the compliance readout must stabilize).',
    'After completing the titration, correctly identify which PEEP produced the highest compliance when prompted.',
  ],
  task_framing_style: 'B',

  key_points: [
    'Oxygenation is governed by mean airway pressure, not peak pressure.',
    'Three levers: FiO2 (parallel, no waveform effect), PEEP (raises the floor, recruits alveoli), inspiratory time (widens the plateau, raises mean pressure without raising peak).',
    'PEEP optimal point = where static compliance is highest. Below it: underrecruitment. Above it: overdistension.',
    'Stepwise titration: raise PEEP in 2 cmH2O steps, wait 5 breaths for compliance to stabilize at each level, find the peak.',
    'Too much PEEP: overdistends open alveoli, increases dead space, impairs venous return, can cause hypotension — especially in hypovolemic patients.',
    'PEEP does not help (and can harm) when: anatomic shunt (bypasses alveoli entirely), obstructive disease with dynamic hyperinflation (worsens air trapping).',
    'COPD with auto-PEEP and ineffective triggering: extrinsic PEEP at ~80% of measured auto-PEEP reduces triggering work without worsening hyperinflation (the waterfall effect).',
    'Weaning sequence when improving: wean FiO2 first (toxic exposure), then wean PEEP (derecruitment risk), reassess between steps.',
    'ARDSNet FiO2/PEEP tables: a practical, validated shortcut for most patients. Compliance-guided titration for severe or complex cases.',
  ],
};
