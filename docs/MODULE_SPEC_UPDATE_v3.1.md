# MODULE SPEC UPDATE — v3.1

*Delta document. Companion to MODULE_SPECS_v3.md. The spec wins where this document and the codebase disagree.*

> **Purpose.** This document is a single-pass work order for the code-editor agent. It lists every fix required to bring `src/modules/M4.ts` through `src/modules/M17_M18_M19.ts` into compliance with MODULE_SPECS_v3.md, plus the cross-cutting microcopy and pin-list enforcement that applies across all modules from M4 onward.
>
> **Scope.** M4–M19 only. M1–M3 are out of scope for this pass (already audited and largely compliant).
>
> **How to work.** Section 0 (cross-cutting) first, then sections per module in order. Run `npm run build` after each module's edits land. Do not modify simulator physics, the harness/tracker contract, or the scoring formula. Items flagged **[BLOCKED-SIM]** are out of scope for this pass and should be left as TODO comments referencing this document.

---

## 0 — Cross-cutting changes (apply across all M4–M19 files)

These fixes must be applied globally before any per-module work. Audit every M*.ts file and apply uniformly.

### 0.1 — Microcopy lock list (Appendix B enforcement)

**Strip leading affirmations from acknowledgment-correct explanations.** When an acknowledgment option's `is_correct: true` explanation begins with `"Right."`, `"Yes —"`, `"Correct."`, or any equivalent affirmation, remove that prefix. The chip already turned green; the explanation should start with the substantive content.

- Before: `explanation: 'Right. Compliance is in the V/C term...'`
- After: `explanation: 'Compliance is in the V/C term...'`

Audit every `require_acknowledgment.options[].explanation` field across M4–M19.

**Failure-state copy template.** Any user-facing "you got that wrong" or "try again" message must follow this exact pattern:

> `"That's a defensible move but not what the recipe asks for. [one-line rationale]"`

Never `"Wrong!"`, never `"Try again!"`, never `"Incorrect."`. Audit any inline feedback strings, hint-tier transitions, or chip-not-yet-locked messages.

**Voice rules.** Search every M*.ts file for the following strings and remove or rewrite them:

- `"awesome"` — remove entirely
- `"great job"` / `"great work"` — remove entirely
- `"nice work"` / `"you got it"` / `"well done"` — remove entirely
- Any emoji in user-facing strings (✓ in chip state is allowed only if it was already part of the locked progress-chip render; otherwise strip)

The Owens voice is dry, direct, expert. Compliments are rare and earned. After a green-chip lock, the appropriate copy is the key-points debrief, not an exclamation.

**Progress chip states.** Three states only — `not_yet` (grey), `partial` (amber), `locked` (green). If any module references a fourth state ("complete", "perfect", "all-clear"), collapse to the three-state set.

### 0.2 — Task Card title pattern

Every module's Task Card title must follow `[Verb] [target]`. Audit and rewrite if drifted:

| Module | Required title |
|---|---|
| M4 | `Demonstrate the gap signatures.` |
| M5 | `Induce shunt, then induce dead space.` |
| M6 | `Trap him, then untrap him.` |
| M7 | `Set lung-protective VCV.` |
| M8 | `Titrate PINSP to a lung-protective Vt.` |
| M9 | `Recognize and respond to PRVC dyssynchrony.` |
| M10 | `Titrate PSV by watching the patient.` |
| M11 | `Recognize the dyssynchrony pattern.` |
| M12 | `Fix the SIMV setup.` |
| M13 | `Set PEEP-FiO2 from the ARDSnet table.` |
| M14 | `De-escalate FiO2 by recruiting.` |
| M15 | `Apply the ARDSnet recipe.` |
| M16 | `Rescue the trapped asthmatic.` |
| M17 | `Read the bedside data and decide.` |
| M18 | `Four patients. Four decisions.` |
| M19 | `Five decompensations in a row.` |

### 0.3 — Pin-list comment block at top of every M*.ts file

Add a comment block at the top of each module file in the form:

```ts
/**
 * MODULE [ID] — [TITLE]
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - [param]: [value] — [rationale]
 *   - ...
 *
 * See MODULE_SPECS_v3.md Appendix A for the canonical pin list.
 */
```

Specific pin-list content for each module is given in the per-module sections below. The pin list for M1, M2 is `none` (display literacy); skip those files. M3 already exists per the prior audit.

### 0.4 — Commandment references

Any user-facing string that references Owens commandments by number (e.g., `"Commandment VIII"`, `"the eleventh commandment"`) must be rewritten to paraphrase the content rather than cite the number. The book's commandment list is copyrighted; the underlying clinical content is not. Modules affected (audit): M4, M7, M10, M16. Replacement pattern:

- Before: `"Owens's Eleventh Commandment regarding the choice of mode for the shocked patient is..."`
- After: `"Owens's rule for the shocked patient is..."` or `"The book's guidance for the shocked patient is..."`

### 0.5 — `success_criteria_display` must agree with task wording

Per Appendix C item 3: user-facing task wording and `success_criteria_display` must agree. Audit each module: if the task card prose says "Vt at 6 mL/kg PBW" but the criteria chip says "Tidal volume 410-470 mL", that's fine (the chip is the operational version). But if the task says "drop PEEP to ZEEP" and the criteria says "PEEP ≤5", that's drift — pick the spec value (≤3 for M16) and align both.

---

## 1 — M4: Compliance and Resistance

### Pin-list comment block

```ts
/**
 * MODULE M4 — Compliance and Resistance
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - tidalVolume: 480 — tracker math assumes baseline PIP ~22, Pplat ~16.
 *                       Smaller Vt blurs the gap and breaks the resistance step.
 *   - compliance variants 20/40/60 — three teaching points; trackers depend on each.
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset

Confirm exact match. Fix if any value drifts:

```ts
mode: 'VCV',
heightInches: 70, gender: 'male',
tidalVolume: 480,        // PINNED
respiratoryRate: 14,
peep: 5,
fiO2: 0.40,
iTime: 1.0,
compliance: 45,          // mildly reduced baseline
resistance: 12,          // just above normal
spontaneousRate: 0,
```

### Tracker structure

Confirm:

- `kind: 'compound', sequence: 'strict', reset_between: true`
- Step 1: `manipulation` on `compliance`, condition `{ type: 'absolute', operator: '<=', value: 28 }`, with acknowledgment.
- Step 2: `manipulation` on `resistance`, condition `{ type: 'absolute', operator: '>=', value: 25 }`, with acknowledgment.

### Acknowledgment explanations

Strip leading "Right." prefix per section 0.1. Step 1 correct explanation should read:

```ts
explanation: 'Compliance is in the V/C term — it raises alveolar pressure. Resistance didn\'t change, so the gap (which reflects resistance) didn\'t change.'
```

Step 2 correct explanation should read:

```ts
explanation: 'Mucus, bronchospasm, kinked tube — all raise resistance, which lives only in the R·flow term. PIP gets the whole hit; Pplat doesn\'t.'
```

### Primer Q3 (baby lung) distractor A

Update explanation text to:

```
'Pediatric mechanics aside; the term is about adults.'
```

### Summative Q3 explanation

Ensure the Amato 2015 framing is present in the correct-answer explanation:

```
'DP of 20 is over the lung-protective ceiling (15) even when Pplat is at the limit.'
```

### Task Card title

`Demonstrate the gap signatures.`

---

## 2 — M5: Gas Exchange Basics

### Pin-list comment block

```ts
/**
 * MODULE M5 — Gas Exchange Basics
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance-as-shunt-proxy mapping in PlaygroundSim:
 *       compliance 50 → SpO2 ~96%
 *       compliance 25 → SpO2 ~88%
 *       compliance 18 → SpO2 ~82%
 *   - shuntFraction baseline (if used directly) — teaching abstraction, not exact physiology.
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset

```ts
mode: 'VCV',
heightInches: 70, gender: 'male',
tidalVolume: 450, respiratoryRate: 14, peep: 5, fiO2: 0.40,
iTime: 1.0, compliance: 50, resistance: 10,
spontaneousRate: 0,
```

### Explore card patient context — MANDATORY sim-limitation acknowledgment

The patient-context string must include this exact disclosure (or near-verbatim equivalent):

> "Note: the sim uses compliance as a stand-in for 'shunt severity' — it's a teaching abstraction, not exact physiology."

If this string is missing from the current explore card, add it.

### Tracker structure — restore nested strict compound

The tracker must be exactly:

```ts
{
  kind: 'compound',
  sequence: 'strict',
  reset_between: true,
  children: [
    // Step 1: nested compound, no reset between sub-steps
    {
      kind: 'compound',
      sequence: 'strict',
      reset_between: false,
      children: [
        {
          kind: 'manipulation',
          control: 'compliance',
          condition: { type: 'absolute', operator: '<=', value: 25 },
        },
        {
          kind: 'manipulation',
          control: 'fiO2',
          condition: { type: 'absolute', operator: '>=', value: 0.90 },
          require_acknowledgment: { /* ... */ },
        },
      ],
    },
    // Step 2: single manipulation
    {
      kind: 'compound',
      sequence: 'strict',
      reset_between: false,
      children: [
        {
          kind: 'manipulation',
          control: 'respiratoryRate',
          condition: { type: 'absolute', operator: '>=', value: 30 },
          require_acknowledgment: { /* ... */ },
        },
      ],
    },
  ],
}
```

If the current code uses a flat structure, restructure to the nested form.

### Acknowledgment explanations

Strip leading "Right." per section 0.1.

### Primer Q1 correct-answer explanation

Must include the exact phrase:

> "response to 100% FiO2 — V/Q corrects, shunt doesn't"

### Read-phase formative check

Confirm presence:

> *"PaCO2 50, ETCO2 25. Gradient: 25. Most likely:"* — with B (dead space — PE, low cardiac output, or auto-PEEP) marked correct, citing Book Ch. 7.

### Task Card title

`Induce shunt, then induce dead space.`

---

## 3 — M6: Auto-PEEP and Air Trapping

### Pin-list comment block

```ts
/**
 * MODULE M6 — Auto-PEEP and Air Trapping
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 60 — preserved (obstructive disease pattern)
 *   - resistance: 22 — tuned to make Step 1 induction trip at rate ~26
 *   - iTime: 1.0 (baseline) — baseline must equal 1.0 for the manipulation to have room
 *
 * Change any one of these and Step 1 induction may not trigger.
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset

```ts
mode: 'VCV',
heightInches: 70, gender: 'male',
tidalVolume: 480, respiratoryRate: 18, peep: 5, fiO2: 0.50,
iTime: 1.0,           // PINNED baseline
compliance: 60,        // PINNED
resistance: 22,        // PINNED
spontaneousRate: 0,
```

If current code has resistance: 25, resistance: 18, or rate: 16, fix to the values above.

### Tracker structure — confirm reset_between FALSE

```ts
{
  kind: 'compound',
  sequence: 'strict',
  reset_between: false,    // CRITICAL — Step 2 builds on Step 1's trapped state
  children: [
    {
      kind: 'outcome',
      readouts: { autoPeep: { operator: '>=', value: 4 } },
      sustain_breaths: 3,
    },
    {
      kind: 'outcome',
      readouts: { autoPeep: { operator: '<=', value: 1.5 } },
      sustain_breaths: 5,
    },
  ],
}
```

If `reset_between: true` is currently set, this is a correctness bug — fix to `false`.

### Hint Tier 2

Must contain specific numbers:

> "Step 1: raise rate to 26+ and watch auto-PEEP climb past 4. Step 2: drop rate to 10–12 to give expiration room, sustained for 5 breaths."

### Summative Q4 distractor C

Preserve the "Wrong-ish" qualifier — do not simplify to "Wrong":

```
C. Lower the PEEP setting from 5 to 0. — Wrong-ish. Modest applied PEEP doesn't drive the trapping in COPD; the rate does. Disconnect first.
```

### Task Card title

`Trap him, then untrap him.`

---

## 4 — M7: Volume Control Ventilation (VCV A/C)

### Pin-list comment block

```ts
/**
 * MODULE M7 — Volume Control Ventilation (VCV A/C)
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 40 — at Vt 500 baseline this yields plat ~17.5
 *   - heightInches: 70, gender: male — PBW = 73 kg; 6 mL/kg = 438 mL
 *
 * Task target Vt is 410-470 (6 mL/kg PBW ±5%).
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset

```ts
mode: 'VCV',
heightInches: 70, gender: 'male',
tidalVolume: 500,              // starting Vt — learner must drop to 6 mL/kg
respiratoryRate: 14, peep: 5, fiO2: 0.50,
iTime: 1.0,
compliance: 40,                // PINNED
resistance: 10,
spontaneousRate: 0,
```

### Tracker — three concurrent conditions, sustained 5 breaths

```yaml
tracker_type: outcome
target_state:
  - measurement: tidalVolume
    operator: between
    min: 410
    max: 470
  - measurement: peakPressure
    operator: lte
    value: 30
  - measurement: drivingPressure
    operator: lte
    value: 15
sustain_breaths: 5
reset_between: false
```

If the current tracker uses `Vt = 6 mL/kg` as a single bound (or 6×PBW computed dynamically), replace with the explicit 410-470 range. The range is locked.

### Primer P3 nuance

The correct answer is A (shocked post-arrest patient). C (status asthmaticus) must be marked "Partially right" with the explanation:

```
C. A 28-year-old status asthmaticus with severe bronchospasm. — Partially right — VCV is the mode of choice for severe bronchospasm (Ch. 15), but VCV here is to control I:E ratio and prevent stacking, not "do all the work." A is the cleaner indication.
```

Do not flatten to "Wrong."

### Summative Q5

Rewrite to remove the commandment-number reference per section 0.4:

```
Q5. Owens's rule for the shocked patient with respect to mode choice is:
  A. PSV — least work for the patient. — Wrong. PSV is a recovery mode.
  B. SIMV — best of both worlds. — Wrong. SIMV in the shocked patient risks high WOB.
  C. A/C — the shocked patient should not fatigue. — Correct. Don't let the shocked
     patient do the work of breathing while you're resuscitating him.
  D. APRV — best oxygenation. — Wrong. Not the first-line mode for shock.
```

### Task Card title

`Set lung-protective VCV.`

---

## 5 — M8: Pressure Control Ventilation (PCV)

### Pin-list comment block

```ts
/**
 * MODULE M8 — Pressure Control Ventilation (PCV)
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 35 — at PINSP 18 this yields Vt ~430 mL (≈6 mL/kg PBW)
 *
 * PInsp range must be exposed 8–30 to allow the learner to overshoot.
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset

```ts
mode: 'PCV',
heightInches: 70, gender: 'male',
PInsp: 18,
respiratoryRate: 14, peep: 8, fiO2: 0.50,
iTime: 1.0,
compliance: 35,                // PINNED
resistance: 10,
spontaneousRate: 0,
```

### Tracker

```yaml
tracker_type: outcome
target_state:
  - measurement: tidalVolume
    operator: between
    min: 410
    max: 470
  - measurement: peakPressure
    operator: lte
    value: 30
  - measurement: drivingPressure
    operator: lte
    value: 15
sustain_breaths: 5
reset_between: false
```

### Read-phase compliance unlock

The Read phase contains a predict-observe block that **temporarily unlocks compliance** for the demonstration, then re-locks it before the Try-It tracker runs. Implementation: expose a `predict_observe.requires_temp_unlock: ['compliance']` field on this read-phase block (or equivalent mechanism in current architecture). If the current code locks compliance throughout, add the temporary unlock — this is the whole point of M8's failure-mode demonstration.

### Read-phase formative check

Must read exactly as:

> "In PCV, you cannot measure plateau pressure. True or false?"
>
> **False.** An inspiratory hold equilibrates pressures throughout the airway tree, just as in VCV. You absolutely can — and should — measure plat.

### Task Card title

`Titrate PINSP to a lung-protective Vt.`

---

## 6 — M9: PRVC and Dual-Control Ventilation

### Pin-list comment block

```ts
/**
 * MODULE M9 — PRVC and Dual-Control Ventilation
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 30, resistance: 12 — adaptive PINSP cycle lands in expected band
 *   - perturbation script: at t=30s of Try-It, set spontaneousRate=24, effortAmplitude=high
 *
 * The PRVC adaptive logic must produce a PINSP swing of ≥4 cmH2O over 6 breaths under
 * the perturbation. If the sim does not yet produce this swing, see [BLOCKED-SIM] below.
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset

```ts
mode: 'PRVC',
heightInches: 70, gender: 'male',
tidalVolume: 450,              // target volume
respiratoryRate: 14, peep: 8, fiO2: 0.45,
iTime: 1.0,
compliance: 30,                // PINNED
resistance: 12,                // PINNED
spontaneousRate: 0,            // perturbation flips to 24 at t=30s
```

### Unlocked controls

`tidalVolume, respiratoryRate, peep, fiO2, iTime, mode`. **`mode` is unlocked here and only here** — it is the correct intervention. Confirm the control list exposes mode-switching.

### Tracker — custom PinspSwing6 measurement required

The tracker requires a **new custom measurement**: `PinspSwing6` = `max(PINSP) − min(PINSP)` over the last 6 breaths.

```yaml
tracker_type: compound
required:
  - measurement: mode
    operator: equals
    value: ["VCV", "PCV"]      # learner must SWITCH OUT of PRVC
  - measurement: PinspSwing6
    operator: gte
    value: 4
    capture_pre_switch: true   # swing must have been observed BEFORE mode change
sustain_breaths: 3              # 3 breaths in the new mode
reset_between: false
```

`capture_pre_switch: true` is critical — it enforces that the learner observed the dyssynchrony before responding, rather than getting credit for a lucky mode switch.

**If the current tracker only checks `mode != PRVC`, this is a correctness gap.** Add the `PinspSwing6` measurement and the `capture_pre_switch` constraint.

### Primer P2 — keep the nuance

P2 has two defensible answers. Mark **B correct** with the explanation:

```
B is the cleanest mark: the vent senses the resulting Vt and adjusts PINSP to keep it
at target. A (compliance change) is the underlying cause that drives the mechanism; B
is what the vent actually measures.
```

### [BLOCKED-SIM] — Try-It briefing honest acknowledgment

If the sim cannot yet render a visible PINSP swing of ≥4 over 6 breaths under the perturbation, the Try-It card must include this acknowledgment near the task description:

> "Note: this scenario requires the simulator to render an adaptive PINSP oscillation. If you don't see the swing, the pattern is fully described in the read phase; the test of recognition here is whether you respond by switching out of PRVC."

Add this as a conditional UI block keyed to a sim-capability flag. Once the sim produces the swing reliably, the flag flips and the disclaimer disappears.

### Task Card title

`Recognize and respond to PRVC dyssynchrony.`

---

## 7 — M10: Pressure Support Ventilation (PSV)

### Pin-list comment block

```ts
/**
 * MODULE M10 — Pressure Support Ventilation (PSV)
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 55 — near-normal, recovering patient
 *   - spontaneousRate: 12 (base) — patient's underlying drive
 *   - effortAmplitude: medium
 *
 * Sim tuning: PS 10-14 yields Vt 380-470 and spont RR 16-22.
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset

```ts
mode: 'PSV',
heightInches: 70, gender: 'male',
PSupport: 18,                  // deliberately too high — learner titrates down
peep: 5, fiO2: 0.40,
compliance: 55,                // PINNED
resistance: 10,
spontaneousRate: 12,           // PINNED (base)
effortAmplitude: 'medium',     // PINNED
```

### Unlocked controls

`PSupport, peep, fiO2`. **Rate is NOT a setting in PSV.** If the UI currently shows a Rate slider when mode is PSV, hide it or disable it. Spontaneous rate appears only as a readout, not a control.

### Tracker

```yaml
tracker_type: outcome
target_state:
  - measurement: PSupport
    operator: between
    min: 10
    max: 14
  - measurement: spontaneousRate
    operator: between
    min: 14
    max: 24
  - measurement: tidalVolume
    operator: between
    min: 380
    max: 480
sustain_breaths: 5
reset_between: false
```

### Read-phase formative check — correct answer is (b)

```
"You raise PS from 10 to 20 in an air-hungry patient. His tidal volumes go from 200
to 850 mL. His rate drops from 38 to 8. The correct interpretation is:"
  (a) ideal — leave.                  ← WRONG
  (b) over-supported — lower PS back  ← CORRECT
      to ~14 for a Vt in the 6-8 mL/kg range.
  (c) under-supported.                ← WRONG
```

If the current code marks (a) correct or omits this formative, fix.

### Explore card patient context

Include the line: **"The patient is the readout."** It belongs in the patient context preamble:

> "Day 3 post-pneumonia, alert. The patient is the readout."

### Summative Q4 — careful with the negation

Q4 asks which is FALSE. The correct answer is **B** ("It is appropriate for paralyzed patients"). Ensure the explanation phrasing distinguishes the FALSE answer from the others without ambiguity.

### Task Card title

`Titrate PSV by watching the patient.`

---

## 8 — M11: Dyssynchrony Recognition

### Pin-list comment block

```ts
/**
 * MODULE M11 — Dyssynchrony Recognition
 *
 * PINNED PARAMETERS:
 *   - Static clip file paths in /public/clips/:
 *       dyssyn_ineffective.svg
 *       dyssyn_double.svg
 *       dyssyn_starvation.svg
 *
 * This module uses pre-rendered SVG clips, not live simulation. The current sim
 * cannot render flow starvation or reverse triggering faithfully — see [BLOCKED-SIM]
 * below for the long-term plan.
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Scenarios — exactly three, no more

```yaml
scenarios:
  - id: M11-s1-ineffective
    waveform: clips/dyssyn_ineffective.svg
    context: "65 yo with COPD on VCV. Auto-PEEP measured 9 cmH2O."
    correct_label: "ineffective_triggering"
    distractors: ["normal", "double_triggering", "auto_cycling"]

  - id: M11-s2-double
    waveform: clips/dyssyn_double.svg
    context: "35 yo ARDS on VCV Vt 400 (6 mL/kg), strong respiratory drive."
    correct_label: "double_triggering"
    distractors: ["normal", "ineffective_triggering", "flow_starvation"]

  - id: M11-s3-starvation
    waveform: clips/dyssyn_starvation.svg
    context: "50 yo asthma on PRVC, air hunger."
    correct_label: "flow_starvation"
    distractors: ["normal", "too_long_itime", "double_triggering"]
```

If the current code has reverse-triggering, auto-cycling, or too-long-iTime as scored scenarios, **remove them**. They can appear in the read-phase pattern atlas as labeled reference examples, but not as scored items.

### Tracker

```yaml
tracker_type: recognition
required_labels:
  - scenario: M11-s1-ineffective
    correct: "ineffective_triggering"
  - scenario: M11-s2-double
    correct: "double_triggering"
  - scenario: M11-s3-starvation
    correct: "flow_starvation"
all_required: true
```

No partial credit. All three required in one pass.

### Task wording

> "Three patients in a row. For each, look at the waveform clip and the bedside context, and select the dyssynchrony pattern. You must get all three correct in one pass."

Note the phrase **"look at the waveform clip"** — the task presupposes the clip exists. If the clips do not yet exist on disk, the module will not function. See [BLOCKED-SIM] below.

### [BLOCKED-SIM] — Clip authoring required

The three SVG clip files must exist at the paths above for this module to function. This is a content-authoring task, not a code task — but the code must reference the correct paths now so that dropping the SVGs into place at `/public/clips/` makes the module functional.

If the clips do not exist at the time of code-editor pass, leave a `TODO(M11-clips)` comment at the scenario reference, and add a fallback: render a static placeholder SVG with the text "Waveform clip pending — see MODULE_SPECS_v3.md M11 spec." Do not substitute a verbal vignette as a "good-enough" replacement. The whole pedagogical point of M11 is that the learner reads a waveform, not a description.

### Task Card title

`Recognize the dyssynchrony pattern.`

---

## 9 — M12: SIMV and Hybrid Modes

### Pin-list comment block

```ts
/**
 * MODULE M12 — SIMV and Hybrid Modes
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 45
 *   - effortAmplitude: low (weak — central to the failure-mode demonstration)
 *   - mandatory rate floor: 10 (must be allowed)
 *
 * Sim tuning: spontaneous Vt is ~140-180 mL with no PS; ~380-450 mL with PS 12.
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset

```ts
mode: 'SIMV',
heightInches: 70, gender: 'male',
tidalVolume: 450,              // mandatory breath Vt
respiratoryRate: 10,           // mandatory rate — deliberately low
PSupport: 0,                   // no PS — deliberately missing
peep: 5, fiO2: 0.40,
compliance: 45,                // PINNED
resistance: 12,
spontaneousRate: 18,
effortAmplitude: 'low',        // PINNED
```

### Tracker — requires sim to expose mandatory vs spontaneous Vt separately

```yaml
tracker_type: outcome
target_state:
  - measurement: PSupport
    operator: between
    min: 8
    max: 14
  - measurement: spontaneousTidalVolume
    operator: gte
    value: 320               # ~4.5 mL/kg PBW
  - measurement: mandatoryTidalVolume
    operator: between
    min: 410
    max: 470                 # 6 mL/kg
sustain_breaths: 5
reset_between: false
```

**Sim contract:** the sim must expose `spontaneousTidalVolume` and `mandatoryTidalVolume` as separate readouts. If the current sim only exposes a single `tidalVolume`, this is a sim-side change that must land before M12's tracker can pass meaningfully. [BLOCKED-SIM] — flag as TODO if not present and leave the tracker definition correct; the tracker will fail until the readouts are wired.

### Read-phase prose preservation

Owens's pragmatic line must survive in the Read-phase prose:

> "There is nothing wrong with SIMV as long as you pay attention to the work of breathing."

Audit and restore if trimmed.

### Summative Q3 explanation

Must reference Brochard and Esteban as the trials underlying the "no proven advantage" claim:

```
C. No proven advantage; daily SBT is what works. — Correct. Multiple trials including
   Brochard and Esteban show SIMV-based weaning is not faster than daily SBTs.
```

### Task Card title

`Fix the SIMV setup.`

---

## 10 — M13: PEEP

### Pin-list comment block

```ts
/**
 * MODULE M13 — PEEP
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 32, resistance: 11
 *   - PEEP-PaO2-BP response curve (calibrated):
 *       PEEP 5  → PaO2 58, BP baseline
 *       PEEP 10 → PaO2 75
 *       PEEP 14 → PaO2 88
 *       PEEP 18 → PaO2 92, SBP drops 15 mmHg
 *       PEEP 22 → PaO2 84 (overdistension), SBP drops 30 mmHg
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset

```ts
mode: 'VCV',
heightInches: 70, gender: 'male',
tidalVolume: 430, respiratoryRate: 18,
peep: 5,                       // LOW for this disease — learner climbs
fiO2: 0.70,                    // high to compensate
iTime: 1.0,
compliance: 32,                // PINNED
resistance: 11,                // PINNED
PaO2: 58,                      // under-recruited
spontaneousRate: 0,
sbpBaseline: 110,              // for hemodynamic feedback
```

### Tracker — SBP guardrail required

```yaml
tracker_type: outcome
target_state:
  - measurement: peep
    operator: between
    min: 10
    max: 14
  - measurement: PaO2
    operator: between
    min: 65
    max: 90
  - measurement: SBP
    operator: gte
    value: 95
sustain_breaths: 5
reset_between: false
```

The SBP guardrail teaches "don't overshoot PEEP into hypotension." If the current code omits this measurement, add it. This requires the sim to model PEEP-induced BP drop per the calibration curve above.

### Read-phase reference card

The ARDSnet Lower PEEP-FiO2 table must be rendered as a **table** inline in the Read phase, not as prose. Suggested rendering:

| FiO2 | 0.30 | 0.40 | 0.50 | 0.60 | 0.70 | 0.80 | 0.90 | 1.00 |
|------|------|------|------|------|------|------|------|------|
| PEEP | 5 | 5-8 | 8-10 | 10 | 10-14 | 14 | 14-18 | 18-22 |

(Or the exact lower-table values used by the spec/code.)

### Summative Q5 (volutrauma) — preserve citation

```
A. The tidal volume is excessive. — Correct. Webb/Tierney rats and Dreyfuss: high-Vt
   ventilation injures the lung even at low pressures.
```

### Task Card title

`Set PEEP-FiO2 from the ARDSnet table.`

---

## 11 — M14: Oxygenation Strategies

### Pin-list comment block

```ts
/**
 * MODULE M14 — Oxygenation Strategies
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - shuntFraction: 0.30 (initial preset)
 *   - PEEP-FiO2-PaO2 response curve (calibrated at shuntFraction 0.30):
 *       PEEP 8,  FiO2 1.0 → PaO2 65, SpO2 92  (shunt-limited)
 *       PEEP 14, FiO2 1.0 → PaO2 102, SpO2 99
 *       PEEP 14, FiO2 0.6 → PaO2 78, SpO2 95
 *       PEEP 14, FiO2 0.5 → PaO2 64, SpO2 92
 *   - Prone toggle: drops shuntFraction from 0.30 to ~0.18
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset

```ts
mode: 'VCV',
heightInches: 70, gender: 'male',
tidalVolume: 430, respiratoryRate: 18,
peep: 8,
fiO2: 1.0,                     // MAXIMAL — bad starting point
iTime: 1.0,
compliance: 30,
resistance: 11,
PaO2: 65,                      // despite FiO2 1.0 — the shunt clue
SpO2: 92,
shuntFraction: 0.30,           // PINNED
spontaneousRate: 0,
```

### Tracker

```yaml
tracker_type: outcome
target_state:
  - measurement: fiO2
    operator: lte
    value: 0.6
  - measurement: peep
    operator: gte
    value: 12
  - measurement: SpO2
    operator: between
    min: 88
    max: 96
sustain_breaths: 5
reset_between: false
```

### Prone sandbox toggle

Add a `prone: boolean` sandbox toggle in the Explore card controls. Toggling true drops the effective `shuntFraction` from 0.30 to ~0.18, raising PaO2 at the same FiO2/PEEP. Implementation: gate the shunt-to-SpO2 calculation on the prone flag.

### Summative Q2 — soften the conservative-oxygen claim

The published evidence on conservative vs liberal oxygen in ICU patients is genuinely mixed (HOT-ICU, ICU-ROX, LOCO2 give conflicting signals). Update Q2 option B explanation:

```
B. Reduced mortality in some recent RCTs; results have been mixed across trials. —
   Correct as the most-defensible answer in this question set. Conservative oxygen
   therapy has shown benefit in some trials and neutral results in others; the
   mechanistic concern about FiO2 >0.6 (absorption atelectasis, reactive oxygen
   species) remains the durable teaching point.
```

Do not say "Reduced mortality in a recent RCT" as a flat fact.

### Q5 (four levers) — preserve verbatim

```
B. FiO2, PEEP, mean airway pressure (longer I-time, IRV, APRV), prone positioning.
   — Correct.
```

### Task Card title

`De-escalate FiO2 by recruiting.`

---

## 12 — M15: ARDS-Specific Ventilation

### Pin-list comment block

```ts
/**
 * MODULE M15 — ARDS-Specific Ventilation
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 32 (moderate-severe ARDS)
 *   - heightInches: 70, gender: male — PBW = 73 kg; 6 mL/kg = 438 mL
 *
 * Calibration:
 *   Vt 430, PEEP 10, C=32 → plat = 430/32 + 10 = 23.4; DP = 13.4. Lands in target.
 *   Vt 430, PEEP 5,  C=32 → plat = 18.4; DP = 13.4. DP still good.
 *
 * Pinned target row of ARDSnet table for FiO2 0.6 is PEEP 10.
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset

```ts
mode: 'VCV',
heightInches: 70, gender: 'male',  // PBW ~73; 6 mL/kg = 438
tidalVolume: 600,                  // 8.2 mL/kg — DELIBERATELY too high
respiratoryRate: 12,
peep: 5,
fiO2: 0.80,
iTime: 1.0,
compliance: 32,                    // PINNED
resistance: 12,
PaO2: 62,
SpO2: 91,
PaCO2: 38,
pH: 7.39,
spontaneousRate: 0,
```

### Tracker — six concurrent conditions, sustained 5 breaths

```yaml
tracker_type: compound
all_required:
  - measurement: tidalVolume
    operator: between
    min: 410
    max: 470          # 6 mL/kg PBW, ±5%
  - measurement: plat
    operator: lte
    value: 30
  - measurement: drivingPressure
    operator: lte
    value: 15
  - measurement: peep
    operator: between
    min: 8
    max: 14
  - measurement: SpO2
    operator: between
    min: 88
    max: 96
  - measurement: fiO2
    operator: lte
    value: 0.70
sustain_breaths: 5
reset_between: false
show_progress_chip: true
```

This is the most complex tracker in the workbook. All six must be satisfied concurrently for 5 sustained breaths.

### Read-phase callout — permissive hypercapnia ICP exception

The warn callout must preserve the ICP exception clause:

> "Permissive hypercapnia: pH ≥7.15-7.20 is acceptable. The exception is elevated ICP — hypercapnia causes cerebral vasodilation."

### Read-phase formative check

```
"After your changes, plat is 32 and DP is 17. Your next move is:"
  (a) lower Vt by 50 mL.        ← CORRECT
  (b) lower PEEP.
  (c) raise rate.
  (d) sedate more.
```

This is pedagogically central — do not drop.

### ARMA and Amato claims

Preserve verbatim:

- ARMA 2000: 9% absolute mortality reduction with 6 vs 12 mL/kg.
- Amato 2015: driving pressure ≤15 independently linked to survival.

### Task Card title

`Apply the ARDSnet recipe.`

---

## 13 — M16: Obstructive Disease Ventilation

### Pin-list comment block

```ts
/**
 * MODULE M16 — Obstructive Disease Ventilation
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - resistance: 35 (SEVERE bronchospasm)
 *   - compliance: 60 (preserved — asthma pattern)
 *
 * Auto-PEEP calibration:
 *   Rate 22, I-time 1.0, R=35 → autoPEEP 8
 *   Rate 12, I-time 1.0, R=35 → autoPEEP 2
 *   Rate 10, I-time 0.8, R=35 → autoPEEP 1
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset — note the WRONG-MODE starting state

```ts
mode: 'PCV',                   // DELIBERATELY WRONG — learner must switch to VCV
heightInches: 70, gender: 'male',
PInsp: 22,
respiratoryRate: 22,           // TOO HIGH — drives auto-PEEP
peep: 8,                       // TOO HIGH for asthma
fiO2: 0.50,
iTime: 1.0,
compliance: 60,                // PINNED (preserved — asthma)
resistance: 35,                // PINNED (severe bronchospasm)
PaCO2: 60,                     // baseline hypercapnia
pH: 7.28,
autoPEEP: 8,                   // clearly auto-trapping
spontaneousRate: 0,
```

### Tracker — five concurrent, sustained 5 breaths

```yaml
tracker_type: compound
all_required:
  - measurement: mode
    operator: equals
    value: "VCV"
  - measurement: tidalVolume
    operator: between
    min: 530           # 7 mL/kg PBW
    max: 620           # 8.5 mL/kg PBW
  - measurement: respiratoryRate
    operator: between
    min: 10
    max: 14
  - measurement: peep
    operator: lte
    value: 3           # ZEEP or near-ZEEP for asthma
  - measurement: autoPEEP
    operator: lte
    value: 2
sustain_breaths: 5
reset_between: false
show_progress_chip: true
```

**Critical: the Vt target is 530-620 (7-8 mL/kg), NOT 410-470 (the ARDS range).** This is a deliberate pedagogical contrast with M15. The success-criteria chip must display the obstructive range, not the ARDS range.

### Hint Tier 1 — locked microcopy

Exact wording:

> "Two things are wrong: the mode and the rate."

Do not paraphrase to "the mode and rate are wrong" or "you have two problems." The comma, the "two things," and the Owens-dry framing are locked.

### Hint Tier 2

> "VCV, rate 12, Vt 7-8 mL/kg, PEEP 0. The pH will be low. That's permitted."

### Summative Q4 — preserve waterfall analogy reference

```
B. ~7-8 cmH2O (75-85% of auto-PEEP). — Correct. In COPD, the waterfall analogy
   applies: modest applied PEEP splints small airways open without adding to the
   trapped volume.
```

### Task Card title

`Rescue the trapped asthmatic.`

---

## 14 — M17: Weaning Concepts (Liberation)

### Pin-list comment block

```ts
/**
 * MODULE M17 — Weaning Concepts (Liberation)
 *
 * PINNED PARAMETERS:
 *   - SBT scenario state must be presented as STATIC DATA, not live sim.
 *   - The learner reads the strip and decides; this is a decisional module.
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Preset (static scenario data)

```ts
mode: 'PSV',                       // SBT setting
heightInches: 70, gender: 'male',
PSupport: 7,                       // SBT setting
peep: 5,                           // SBT setting
fiO2: 0.40,
compliance: 60,
resistance: 12,
spontaneousRate: 18,               // at the 30-minute mark
tidalVolume_spontaneous: 380,      // at the 30-minute mark
RSBI: 47,                          // = 18 / 0.38
SpO2: 95,
HR: 88,
SBP: 124,
clinicalScenario: "Post-pneumonia, day 5, awake, following commands. On FiO2 40% / PEEP 8 yesterday. Today, RT set up an SBT.",
```

### Tracker — decisional, not sim-driven

```yaml
tracker_type: recognition
required_decision:
  - field: precriteria_check
    expected: "all_met"
  - field: rsbi_calculation
    expected_value: 47
    tolerance: 2
  - field: pass_fail_decision
    expected: "pass"
all_required: true
```

If the current code uses a sim-driven outcome tracker, replace with this decisional one.

### Unlocked controls — gated by decision

- During the trial: **none**.
- After the decision is made: a `switch to A/C` button and an `extubate` button appear.

Confirm the UI gating logic.

### Read-phase opening prose

The "vent days vs get-off-the-vent days" framing is the module's spine:

> "'Weaning' implies a gradual reduction in support. Owens prefers 'liberation' because most patients don't need a gradual reduction — they need a daily assessment. There are vent days and there are get-off-the-vent days. The job is to know which kind of day it is."

### Reference card — render as table

The SBT protocol must appear in the Read phase as a structured reference card:

| Item | Detail |
|---|---|
| Pre-criteria | FiO2 ≤50%; PEEP ≤8; follows commands; not requiring frequent suctioning; hemodynamically stable |
| SBT setup | CPAP 5 + PS 7, FiO2 unchanged, 30-60 min |
| Pass | RSBI <80 (PSV) or <105 (T-piece) → extubate |
| Fail | RSBI ≥ threshold or abort → back to A/C |
| Abort criteria | SpO2 <88; HR rise ≥20; BP change; diaphoresis; accessory muscle use |

### Summative Q5 — preserve the "common practice but not required" framing for ABG

```
D. Get an ABG first. — Common practice but not required by Owens. The decision is
   primarily clinical; ABG is supportive, not gating.
```

Do not flatten to "Wrong."

### Task Card title

`Read the bedside data and decide.`

---

## 15 — M18: Extubation Criteria and Failure

### Pin-list comment block

```ts
/**
 * MODULE M18 — Extubation Criteria and Failure
 *
 * PINNED PARAMETERS:
 *   - Cuff leak thresholds:
 *       <110 mL: positive (high stridor risk)
 *       110-130 mL: borderline
 *       >130 mL: negative
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Scenarios — four, exact IDs

```yaml
scenarios:
  - id: M18-s1-cuff-leak
    context: "62 yo male, intubated 7 days for pneumonia. SBT passed. Cuff leak test shows leak of 80 mL."
    decision: "delay_extubation_consider_steroids"

  - id: M18-s2-cardiogenic
    context: "70 yo with HFrEF, ejection fraction 25%, intubated for pulmonary edema. SBT on PSV passed."
    decision: "extubate_with_NIPPV_standby"

  - id: M18-s3-mental-status
    context: "35 yo s/p TBI, GCS 9, no other reason to be intubated. FiO2 35%, PEEP 5."
    decision: "extubate_per_brain_injury_data"

  - id: M18-s4-failed-screen
    context: "60 yo with severe COPD, FiO2 0.50, PEEP 10, RR 30, RSBI 130."
    decision: "back_to_AC_not_ready"
```

### Decision option set — must be consistent across all four scenarios

Every scenario must present the same four options:

1. `delay_extubation_consider_steroids` — labeled "Delay 24h; IV steroids; recheck cuff leak"
2. `extubate_with_NIPPV_standby` — labeled "Extubate with NIPPV standby"
3. `extubate_per_brain_injury_data` — labeled "Extubate per brain-injury data"
4. `back_to_AC_not_ready` — labeled "Back to A/C — not ready"

If the current code presents different option sets per scenario, unify to this set. The pedagogical claim is that the learner is genuinely choosing among the same four options each time.

### Tracker

```yaml
tracker_type: compound
all_required:
  - scenario: M18-s1-cuff-leak
    correct: "delay_extubation_consider_steroids"
  - scenario: M18-s2-cardiogenic
    correct: "extubate_with_NIPPV_standby"
  - scenario: M18-s3-mental-status
    correct: "extubate_per_brain_injury_data"
  - scenario: M18-s4-failed-screen
    correct: "back_to_AC_not_ready"
```

### Scenario 3 explanation — preserve the counter-intuitive teaching

```
extubate_per_brain_injury_data — Correct. Brain-injured patients with low oxygen
requirement and no apnea do better with early extubation despite mental status.
This is counter-intuitive and well-supported by the data Owens cites. Do not require
GCS ≥ 10 as a gate.
```

Do not soften to "case by case" — the spec endorses this specific teaching.

### Task Card title

`Four patients. Four decisions.`

---

## 16 — M19: Troubleshooting the Vent (DOPES)

### Pin-list comment block

```ts
/**
 * MODULE M19 — Troubleshooting the Vent (DOPES)
 *
 * PINNED PARAMETERS:
 *   - Perturbation scripts for the five scenarios (see preset block)
 *   - reset_between: TRUE — mandatory. Without reset, the second scenario inherits
 *                          the first's chaos and the tracker is uninterpretable.
 *
 * Sim limitation: the sim renders three DOPES patterns faithfully (Obstruction by
 * mucus, Stacking, Equipment leak). Displacement and Pneumothorax are scripted
 * vital-sign trajectories rather than physical waveform changes. See [BLOCKED-SIM]
 * below.
 *
 * See MODULE_SPECS_v3.md Appendix A.
 */
```

### Baseline preset

```ts
mode: 'VCV',
heightInches: 70, gender: 'male',
tidalVolume: 450,
respiratoryRate: 16,
peep: 8,
fiO2: 0.40,
iTime: 1.0,
compliance: 40,
resistance: 12,
spontaneousRate: 0,
```

### Perturbations — five scenarios, exact

```yaml
perturbations:
  - id: M19-s1-displacement
    apply: { etco2: "drops_to_zero", chestRise: "none_or_asymmetric" }
    correct_pattern: "displacement"
    correct_first_action: "verify_tube_position_bag_off"

  - id: M19-s2-obstruction-mucus
    apply: { PIP: "+15", plat: "unchanged", etco2: "shark_fin" }
    correct_pattern: "obstruction"
    correct_first_action: "suction_pass"

  - id: M19-s3-pneumothorax
    apply: { PIP: "+12", plat: "+10", BP: "-25", spo2: "-8", chestRise: "asymmetric" }
    correct_pattern: "pneumothorax"
    correct_first_action: "needle_decompression"

  - id: M19-s4-equipment-leak
    apply: { Vt_exh: "300_from_450", PIP: "-5", circuit_pressure: "drops" }
    correct_pattern: "equipment"
    correct_first_action: "check_circuit_bag_off"

  - id: M19-s5-stacking
    apply: { autoPEEP: "+8", BP: "-15", expiratory_flow: "non_zero" }
    correct_pattern: "stacking"
    correct_first_action: "disconnect_let_exhale"
```

### Tracker — reset_between MUST be true

```yaml
tracker_type: compound
all_required:
  - scenario: M19-s1-displacement
    pattern: "displacement"
    first_action: "verify_tube_position_bag_off"
  - scenario: M19-s2-obstruction-mucus
    pattern: "obstruction"
    first_action: "suction_pass"
  - scenario: M19-s3-pneumothorax
    pattern: "pneumothorax"
    first_action: "needle_decompression"
  - scenario: M19-s4-equipment-leak
    pattern: "equipment"
    first_action: "check_circuit_bag_off"
  - scenario: M19-s5-stacking
    pattern: "stacking"
    first_action: "disconnect_let_exhale"
reset_between: true
```

**Critical: `reset_between: true`.** If the current tracker has `reset_between: false`, fix immediately — this is a correctness bug.

### Per-scenario control gating

Each scenario reveals only the controls relevant to its correct action:

- s1 (displacement): show `verify tube position` + `bag off` buttons
- s2 (obstruction): show `suction pass` button
- s3 (pneumothorax): show `needle decompression` button
- s4 (equipment): show `check circuit` + `bag off` buttons
- s5 (stacking): show `disconnect / let exhale` button

If the current UI exposes all controls in all scenarios, this is a teaching dilution — gate the controls.

### [BLOCKED-SIM] — ETCO2 waveform and chest-rise indicators

The spec acknowledges that displacement (s1) and pneumothorax (s3) are currently represented as scripted vital-sign trajectories rather than physical waveform changes. For now:

- ETCO2 must be displayed at minimum as a numerical readout that scripts to zero (s1) or scripts to a "shark fin" indicator string (s2). A waveform trace is the long-term ask.
- Chest rise must be displayed at minimum as a textual indicator (`"symmetric"`, `"asymmetric — right side absent"`, `"none"`). A visual chest-rise animation is the long-term ask.

The module's read-phase Pattern Atlas should describe what the trace *would* look like even if the current implementation can only show the textual proxy. This preserves the educational claim and lets future infrastructure swap in the real trace without rewriting the module.

### Task Card title

`Five decompensations in a row.`

---

## 17 — Authoring checklist before merging

Per MODULE_SPECS_v3.md Appendix C, before each module's edits land:

1. **Pin list check.** Did any change touch a pinned parameter? If yes, re-tune the tracker math and document the new calibration in the pin-list comment block.
2. **Manual tracker simulation.** Walk through the success criteria on paper. Does a correct learner action sequence (3-5 moves) actually trip every required measurement?
3. **Task wording + criteria display agreement.** Read the task card and the success-criteria chip side by side. Do they say the same thing in different words, or do they contradict?
4. **Distractor explanation update.** If a primer or summative question's correct answer changed, did the explanations for the other three options also get re-touched?
5. **Clip path check (M11 only).** Do the clip files actually exist at the referenced paths? If not, leave the `TODO(M11-clips)` comment.
6. **Build check.** `npm run build` must pass after each module's edits.

---

## 18 — Out-of-scope items (flag, do not fix in this pass)

The following are flagged in the spec but should not be addressed in this code-editor pass. Leave TODO comments referencing this section so future work can pick them up:

- **M9 PRVC yo-yo rendering** — the sim's adaptive logic must produce a PINSP swing ≥4 over 6 breaths under perturbation. If it does not today, leave the disclaimer copy in place per section 6 above.
- **M11 dyssynchrony clip authoring** — the three SVG files at `/public/clips/` are content tasks, not code tasks. Code must reference correct paths now; fallback per section 8.
- **M12 mandatory vs spontaneous Vt separation** — sim must expose `spontaneousTidalVolume` and `mandatoryTidalVolume` as separate readouts. Tracker is defined correctly; will fail until sim is wired.
- **M14 prone toggle** — `prone: boolean` sandbox control that drops effective shuntFraction.
- **M19 ETCO2 waveform trace and chest-rise visual** — currently scripted text proxies; long-term infrastructure ask.
- **Dyssynchrony perturbation overlay system** — the long-term path for making waveform pattern recognition first-class, applicable to M11/M14/M16/M19. Out of scope for this pass.

---

*End of MODULE_SPEC_UPDATE_v3.1.md.*
