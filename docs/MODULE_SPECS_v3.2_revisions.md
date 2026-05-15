# Module Revision Spec v3.2

**Status:** authoring complete, awaiting implementation
**Supersedes:** the relevant sections of `MODULE_SPECS_v3.md` and
`MODULE_SPEC_UPDATE_v3.1.md` for the eight modules listed below.

This document captures a focused round of revisions driven by clinical-UX
evaluation. It does **not** rewrite the curriculum; it specifies surgical
changes to eight modules (M5, M9, M11, M13, M14, M16, M17, M18, M19) and
one cross-cutting engine change (gated predict-MCQ content blocks).

The revisions fall into three buckets:

1. **Pedagogical correctness** — modules where the current implementation
   teaches the wrong skill (M11, M17, M19) or contradicts another module
   (M5).
2. **Tracker coverage** — modules where the most important teaching point
   lives in prose but isn't tested by the live objective (M13, M14, M16,
   M18).
3. **Engagement structure** — turning every `predict_observe` block in
   every module into a gated multiple-choice prediction the learner must
   answer correctly before they see the "observe" half.

Each section below is written as a drop-in replacement spec: it tells the
implementer exactly what changes, why, and what the new tracker /
content / sim wiring looks like.

---

## 0. Cross-cutting: gated predict-MCQ content blocks

### 0.1 Motivation

The current `predict_observe` block is a click-to-reveal nudge. A learner
can skip the prediction entirely by clicking "Then observe in the sim →"
and reading the answer. This defeats the whole point of the block —
prediction-before-feedback is the highest-leverage learning move in the
read phase, and we're shipping it on a permission system that lets the
learner opt out.

Replace it with a gated multiple-choice prediction. The learner must
commit to an answer; a wrong answer reveals the explanation but does not
advance; a correct answer reveals the "observe" prose and unlocks
forward progress through the read phase.

### 0.2 New content block type

Extend `ContentBlock` in `src/shell/types.ts`:

```ts
| {
    kind: 'predict_mcq';
    /** The prediction question — phrased as a forward question, not as
     *  a statement to agree with. */
    predict: string;
    /** 3-4 options. Exactly one must have is_correct: true. */
    options: { label: string; is_correct: boolean; explanation?: string }[];
    /** Revealed only after the correct option is picked. The "observe"
     *  half of the original predict_observe contract. */
    observe: string;
    /** Optional sim integration — when set, the block ALSO marks itself
     *  satisfied (without requiring an MCQ answer) the first time the
     *  learner changes the named control on the live sim. The MCQ
     *  remains visible and answerable; the sim path is an alternative
     *  way to unlock the same block. Use sparingly — only for blocks
     *  where the manipulation IS the prediction (e.g. "raise PEEP and
     *  watch what happens"). Most blocks should be MCQ-only. */
    awaits_control?: ControlName;
  }
```

The legacy `predict_observe` kind is retained as a deprecated alias
that renders the same as `predict_mcq` when authored with options;
modules that haven't migrated still render. New authoring uses
`predict_mcq` exclusively.

### 0.3 Shell behavior

`ContentBlocks.tsx` renders the new kind as a card with:

- **Header:** "Predict" eyebrow, violet-400 accent border (same palette
  as legacy predict_observe).
- **Question:** the `predict` prose.
- **Options:** rendered as 3-4 lettered buttons. Disabled after first
  correct answer.
- **Wrong answer:** flash rose border on the picked option, show the
  option's `explanation` if authored, leave the other options enabled.
- **Correct answer:** flash emerald border on the picked option, reveal
  the "Observe" half with a fade-in. The card is now in its terminal
  satisfied state.

Implementation note: each predict_mcq block tracks its own satisfied
state in React state. The `ReadPane` component sums satisfied-state
across all predict_mcq blocks in the module and gates the bottom CTA
("Continue → Check yourself" or "Continue → Let me try it") on **all
predict_mcq blocks being satisfied**. A learner who scrolls past an
unanswered block sees the CTA stay disabled and a hint banner: "Answer
the prediction above to continue."

The disabled-CTA state shows a count: "Answer 2 more predictions to
continue." This is the only friction; there is no time penalty, no
score penalty, and unlimited attempts.

### 0.4 Per-block telemetry

Persist to `ProgressRecord`:

```ts
predict_mcq_attempts?: {
  block_id: string;        // {moduleId}-PM{n}, derived from position
  attempts: number;        // total clicks until correct
  selected_labels: string[]; // ordered history
}[];
```

This is for dashboard signal only — it does not affect the score.

### 0.5 Authoring conventions

- Every module gets **at least one** predict_mcq block. Modules whose
  primary mode of teaching is recognition (M11, M18, M19) get a
  predict_mcq early in the read phase to anchor the patient state
  before recognition tasks begin.
- Per-block option count: 3 or 4. Three is preferred when the wrong
  options are genuinely instructive; four is fine when there's a
  natural fourth distractor.
- The correct option's `explanation` is usually empty — the "Observe"
  half is the explanation. The wrong options' `explanation` strings
  carry the corrective teaching ("X is what happens with resistance,
  not compliance").
- Wording: phrase the question so an unsure learner has to reason from
  the read material, not from clinical intuition. The point is to
  cement the just-read concept.

### 0.6 Migration scope

Every existing `predict_observe` block becomes a `predict_mcq` block.
The list below summarizes which blocks need new MCQ options authored
versus blocks that already imply an MCQ in their prose.

| Module | Existing predict_observe blocks | Action |
|---|---|---|
| M3 | 0 (uses sequential observations instead) | Add 1 predict_mcq (see §0.7) |
| M4 | 2 | Convert both |
| M5 | 2 (will be re-authored under §1 below) | New blocks authored as predict_mcq from the start |
| M6 | 2 | Convert both |
| M-EOM | 2 | Convert both |
| M7 | 1 | Convert |
| M8 | 1 | Convert |
| M9 | 1 (will be re-authored under §2) | New block authored as predict_mcq |
| M13 | 1 | Convert |
| M14 | 1 | Convert |
| M15 | 2 | Convert both |
| M1, M2, M10, M11, M12, M16, M17, M18, M19 | 0 | Author new blocks per §0.7 |

### 0.7 New predict_mcq blocks for modules that currently have none

These are the new blocks to author. Each is specified by question +
options + observe text. They sit inside the existing `content_blocks`
arrays.

**M1 — Why We Ventilate**

```
PREDICT
A 72-year-old has PaCO2 78, pH 7.21, PaO2 62 on 4 L. She's somnolent.
Which option best names the deficit?

A. Type I — failing to oxygenate
   (wrong — Type I requires low PaO2 with a normal or low PaCO2; her
   PaO2 is 62, marginal, and the dominant problem is the markedly
   elevated PaCO2 with acidemia)
B. Type II — failing to ventilate  [CORRECT]
C. Airway protection problem — she's somnolent
   (wrong — somnolence here is a *consequence* of CO2 narcosis, not an
   independent airway problem. The fix is restoring ventilation, not a
   tube for airway alone)
D. Type IV — shock-driven respiratory failure
   (wrong — there's no shock named in the prompt; the diaphragm isn't
   competing with cardiac output)

OBSERVE
The dominant signal is the CO2 — markedly elevated with acidemia. Type
II by definition. Naming this correctly is what saves you from reaching
for a non-rebreather (which fixes oxygenation, the lesser problem) when
the patient actually needs ventilatory support.
```

**M2 — Vocabulary**

```
PREDICT
You see "set Vt 450, Vte 360" on a VCV vent. Other settings are
unchanged. Most likely:

A. The patient's lungs absorbed 90 mL.
   (wrong — gas exchange across the alveolar membrane is a tiny
   fraction of tidal volume and the flow sensor doesn't see it)
B. A leak — circuit, cuff, or fistula.  [CORRECT]
C. The patient is breathing harder than the vent.
   (wrong — in VCV the vent guarantees the inspiratory volume; patient
   effort doesn't change Vte downward)
D. The display is malfunctioning.
   (wrong — display malfunction is a diagnosis of exclusion)

OBSERVE
In VCV, set Vt is delivered into the circuit. If the exhaled volume is
short, the gas escaped somewhere — cuff leak, circuit disconnect,
bronchopleural fistula. The set/measured gap is the first place to
look.
```

**M10 — PSV**

```
PREDICT
A patient on PSV with PS 14 has RR 28, spontaneous Vt 280, visible
accessory muscle use, and SpO2 96%. Best next move?

A. Add sedation — he's anxious.
   (wrong — sedation reduces drive, which lowers Vt further; the
   tachypnea isn't anxiety, it's hypoventilation compensation)
B. Lower PS to 8 to prepare for SBT.
   (wrong — wrong direction; PS 8 is the threshold for *passing* an
   SBT, not the rescue for an under-supported patient)
C. Raise PS to 18.  [CORRECT]
D. Switch to PRVC.
   (wrong — same support level in a different package; the issue is
   that the support level is too low, not that the mode is wrong)

OBSERVE
Tachypneic, shallow, accessory muscles. He's working too hard at this
support level. More PS will deepen each breath and slow the rate.
Recheck after 5 minutes; target spontaneous RR 14-24, Vt 6-8 mL/kg.
```

**M11 — Dyssynchrony**

```
PREDICT
A vented patient looks uncomfortable. The bedside reflex is to push
sedation. According to Owens, the correct first sequence is:

A. Sedate first, troubleshoot if the sedation doesn't work.
   (wrong — sedation buries the diagnostic information you need)
B. Bag off the vent, run DOPES, then read the waveform.  [CORRECT]
C. Switch modes (try APRV) to see if the patient is more comfortable.
   (wrong — mode-switching without a diagnosis is gambling)
D. Increase the FiO2 — discomfort is usually hypoxia.
   (wrong — discomfort on the vent is more commonly synchrony than
   oxygenation; FiO2 is the wrong axis)

OBSERVE
The patient is telling you something. Disconnect first to rule out the
vent. Then DOPES (displacement / obstruction / pneumothorax / equipment
/ stacking). Only after those are clean do you assume dyssynchrony and
read the waveform.
```

**M12 — SIMV**

```
PREDICT
A patient on SIMV (rate 10, Vt 450, PS 0) has actual rate 28,
spontaneous Vt 160. Over the next few hours, the most likely outcome
without intervention is:

A. The patient self-weans and gets extubated.
   (wrong — sub-dead-space breaths don't ventilate; he's working
   without effect)
B. Respiratory muscle fatigue and rising PaCO2.  [CORRECT]
C. Adequate gas exchange because MVe looks acceptable.
   (wrong — MVe = total volume per minute, not alveolar ventilation.
   Spontaneous breaths at 160 mL are mostly dead space)
D. Reduced auto-PEEP from the high spontaneous rate.
   (wrong — high RR with short Te tends to *cause* trapping, not
   relieve it)

OBSERVE
The mandatory breaths are doing the alveolar work. The spontaneous
breaths are wasted effort — sub-dead-space, all of it work, none of it
ventilation. Over hours this fatigues the diaphragm and the PaCO2
climbs. The fix is PS, not mode change.
```

**M16 — Obstruction**

```
PREDICT
A trapped asthmatic with measured auto-PEEP of 14 cmH2O suddenly drops
his BP from 110/70 to 65/40. Single best first action?

A. Push a fluid bolus.
   (wrong — fluids treat the symptom; the air trapped in his chest is
   still compressing venous return)
B. Norepinephrine.
   (wrong — same problem. Pressors won't fix mechanical compression
   of the right atrium)
C. Disconnect him from the vent for 10-15 seconds.  [CORRECT]
D. Raise the PEEP to splint open the airways.
   (wrong — in asthma, applied PEEP worsens trapping. This is the
   classic wrong reflex)

OBSERVE
Trapped gas is mechanically compressing his venous return. The fastest
fix is to let the chest fall — disconnect, let him exhale for ten
seconds, then resume with a slower rate. This is one of the few
bedside maneuvers that reliably reverses a peri-arrest situation in
seconds.
```

**M17 — Weaning**

```
PREDICT
A patient on PSV with PS 7 has RR 22, spontaneous Vt 320 mL.
Approximately what is the RSBI?

A. 52
   (wrong — that would be RR/Vt with Vt in mL, not L)
B. 69  [CORRECT]
C. 7
   (wrong — Vt(L) / RR, inverse)
D. 110
   (wrong — close to the Yang-Tobin failure threshold; would suggest
   not ready)

OBSERVE
RSBI = RR ÷ Vt(L) = 22 ÷ 0.32 = 68.75 ≈ 69. Below 80 on PSV — passes
Owens's threshold. Now look at the patient (accessory muscle use,
diaphoresis, mental status) before extubating. The number alone is
never the answer.
```

**M18 — Extubation**

```
PREDICT
A patient passes the SBT pre-screen, RSBI 60, no abort criteria, but
the cuff leak is 70 mL. Best decision?

A. Extubate — SBT criteria met.
   (wrong — cuff leak <110 mL is a positive screen for upper-airway
   edema; the SBT doesn't measure that)
B. Extubate with NIPPV standby.
   (wrong — NIPPV pushes air past obstruction, it doesn't open the
   obstruction. Upper-airway edema is the wrong indication)
C. Delay 24 hours, give IV steroids, recheck cuff leak.  [CORRECT]
D. Re-intubate now to a smaller tube.
   (wrong — he's still intubated; the question is about the post-
   extubation period, not the current tube)

OBSERVE
SBT pre-criteria are necessary, not sufficient. Cuff leak is a
separate gate testing for upper-airway edema. Steroids 24 hours, then
recheck. Re-intubation within 72 hours of failure doubles mortality —
the bar to extubate is high.
```

**M19 — DOPES**

```
PREDICT
A vented patient suddenly decompensates. Before you read the waveform,
the single most useful action is:

A. Increase FiO2 to 1.0.
   (wrong — reflex, not diagnostic. Helps with one type of problem
   and obscures the rest)
B. Push more sedation.
   (wrong — buries the diagnostic information you need)
C. Disconnect from the vent and bag.  [CORRECT]
D. Get a stat chest X-ray.
   (wrong — useful eventually, not first. The X-ray takes minutes; the
   bag tells you in seconds whether the problem is the vent or the
   patient)

OBSERVE
Disconnecting separates vent problems from patient problems in seconds.
If the patient improves on the bag, the problem is in the circuit or
the vent settings. If he doesn't, you have a patient problem and now
you read the waveform to localize it.
```

---

## 1. M5 — Gas Exchange Basics (re-authored)

### 1.1 Problem with current spec

The current M5 uses `compliance` as a stand-in for shunt severity.
Trainees who completed M4 just learned that low compliance means stiff
lungs that respond with parallel pressure rise. M5 then asks them to
"drop compliance to induce shunt" and watch SpO2 fail to respond to
FiO2. The proxy is teaching contradictory mental models for the same
control across consecutive modules.

### 1.2 Resolution

Add an explicit `shuntFraction` sim parameter; keep compliance locked
at a normal value (50); use scripted patient state to set the shunt;
do not expose `shuntFraction` as an unlocked control in M5. The
learner manipulates only FiO2 and PEEP. The point of the module is to
see FiO2 fail and PEEP succeed — not to manipulate the underlying
physiology.

### 1.3 Sim changes required

- Add `shuntFraction: number` to the patient state in
  `src/sim/constants.ts` (default 0.05 — physiologic).
- The ABG engine in `PlaygroundSim` already uses a derived shunt
  fraction from compliance (the `baselineShunt` ladder at line ~360).
  Replace that ladder with `patient.shuntFraction` when present:
  ```ts
  let baselineShunt = patient.shuntFraction ?? (
    patient.compliance < 20 ? 0.40 :
    patient.compliance < 35 ? 0.30 :
    patient.compliance < 55 ? 0.15 :
    0.05
  );
  ```
  This preserves backward compatibility for modules that haven't set
  the field while letting M5 set it explicitly.
- The PEEP-recruitment math (`peepRecruitment = Math.min(13,
  Math.max(0, settings.peep - 5))`) already responds correctly — PEEP
  raises PaO2 in shunt. No change needed.
- Add `shuntFraction` to the patient state type in `src/shell/types.ts`
  under `SimPreset.patient`.

### 1.4 New scenario preset

```ts
scenario: {
  preset_id: 'M5_shunt_baseline',
  preset: {
    mode: 'VCV',
    settings: { tidalVolume: 450, respiratoryRate: 14, peep: 5, fiO2: 40, iTime: 1.0 },
    patient: {
      compliance: 50,       // ← NORMAL, locked
      resistance: 10,
      spontaneousRate: 0,
      shuntFraction: 0.30,  // ← scripted ARDS-pattern shunt
      gender: 'M',
      heightInches: 70,
    },
  },
  unlocked_controls: ['fiO2', 'peep', 'respiratoryRate'],  // compliance REMOVED
  visible_readouts: ['pip', 'plat', 'spo2', 'pao2', 'paco2', 'fio2', 'peep'],
  visible_waveforms: ['pressure_time', 'flow_time'],
},
```

### 1.5 New hidden objective

The module now teaches two separable points: (1) FiO2 fails in shunt,
(2) PEEP recruits and rescues. Two strict-ordered children, no reset
between (the second step builds on the first):

```ts
hidden_objective: {
  kind: 'compound',
  sequence: 'strict',
  reset_between: false,
  children: [
    // Step 1: try FiO2. Watch it fail.
    {
      kind: 'manipulation',
      control: 'fiO2',
      condition: { type: 'absolute', operator: '>=', value: 90 },
      require_acknowledgment: {
        question: "FiO2 is now at 90%. SpO2 barely moved from baseline. Best explanation?",
        options: [
          {
            label: "Shunt — blood passes alveoli with no air in them. Adding O2 to the rest doesn't fix that blood.",
            is_correct: true,
            explanation: "The FiO2-resistance is the bedside test for shunt. The fix is to open the closed alveoli, which means PEEP, not more O2.",
          },
          {
            label: "V/Q mismatch — needs more FiO2 still.",
            is_correct: false,
            explanation: "V/Q mismatch RESPONDS to FiO2. Failure to respond is the diagnostic finding for shunt.",
          },
          {
            label: "Dead space — needs a higher rate.",
            is_correct: false,
            explanation: "Dead space causes hypercapnia, not refractory hypoxemia. Look at the PaCO2 — it's fine.",
          },
        ],
      },
    },
    // Step 2: now try PEEP. Watch it work.
    {
      kind: 'outcome',
      readouts: {
        peep: { operator: '>=', value: 12 },
        spo2: { operator: '>=', value: 92 },
      },
      sustain_breaths: 5,
    },
  ],
},
```

The second step is an outcome, not a manipulation — because the
learning point is "PEEP works," not "click the PEEP knob." A learner
who raises PEEP but SpO2 doesn't climb (because they didn't raise it
high enough) sees the chip count their breaths-in-range. They
self-correct.

### 1.6 Read content updates

The two existing `predict_observe` blocks are re-authored as
`predict_mcq` blocks. The first uses compliance — replace with shunt
language; the second is fine, just convert format.

**predict_mcq #1 (replaces the compliance-drop block):**

```
PREDICT
This patient has a 30% shunt — about a third of his pulmonary blood
flow is passing alveoli that have no air in them. He's on FiO2 1.0
and his PaO2 is 65. If you bump FiO2 from 0.6 → 1.0 the SpO2 will
move:

A. Up sharply — more O2 always helps.
   (wrong — for the shunted blood, more alveolar O2 changes nothing
   because the blood never sees the alveoli)
B. Up a little, mostly from V/Q-improvement.
   (wrong — there's no V/Q mismatch here, only fixed shunt; the
   modest gain you might see is from the *non*-shunted blood already
   being near-saturated)
C. Barely.  [CORRECT]
D. Down — high FiO2 worsens shunt.
   (wrong — FiO2 doesn't worsen shunt mechanically; it just doesn't
   improve it)

OBSERVE
Shunted blood doesn't touch alveolar gas. Adding more oxygen to the
alveoli the patient is already ventilating doesn't help the blood
bypassing them. This is the FiO2-resistance fingerprint of shunt and
why the four-lever escalation ladder (FiO2 → PEEP → mean Paw → prone)
puts FiO2 first only because it's easy, not because it's effective.
```

**predict_mcq #2 (replaces the rate-up block):**

```
PREDICT
You raise the rate from 14 to 30 in this patient. MVe goes up. What
happens to PaCO2?

A. Falls — more minute ventilation clears more CO2.
   (wrong — MVe rose, but most of the *added* volume is dead-space
   ventilation, not alveolar. Total CO2 clearance went down)
B. Stays the same.
   (wrong — see below; total alveolar ventilation actually drops)
C. Rises.  [CORRECT]
D. Depends on the PaO2.
   (wrong — CO2 and O2 are decoupled in this context)

OBSERVE
Anatomic dead space is ~150 mL per breath. At rate 30 with Vt 450,
that's 4.5 L/min of dead-space ventilation — most of his MVe. The
patient is hyperventilating air through his own dead space without
moving much alveolar volume. The fix is bigger breaths, slower rate.
```

### 1.7 Task framing rewrite

The user-facing task should describe the scripted shunt directly, not
a manipulation:

```
user_facing_task:
  "This patient has a 30% shunt — a third of his pulmonary blood flow
  is passing unventilated alveoli. He's on FiO2 1.0 and PaO2 is 65.
  Step 1: try fixing the SpO2 with FiO2 alone — push it to 100% and
  watch what happens. Step 2: now recruit by raising PEEP to ≥ 12 and
  hold SpO2 ≥ 92% for five breaths."
```

### 1.8 Summative impact

No changes to the summative — Q4 ("In a patient with 30% shunt,
increasing FiO2 will...") already maps to the new scripted scenario.
The conceptual content is unchanged; only the mechanism by which the
learner experiences it is fixed.

---

## 2. M9 — PRVC (strip the yo-yo from the visible module)

### 2.1 Problem with current spec

The user-facing task asks the learner to "recognize and respond to
PRVC dyssynchrony," but the sim can't render the dyssynchrony. The
current half-implementation has the learner watch the algorithm work
correctly and then answer a recognition question about what they saw
— which is the correct answer to a question the prompt never asked.

### 2.2 Resolution

Rewrite the visible module as "PRVC: the adaptive loop in stable
conditions." The yo-yo failure mode is described in a read-only
content callout as "watch for this at the bedside." The summative
still tests recognition of the pattern from the read content.

### 2.3 Briefing rewrite

```
tagline: 'Volume target. Pressure-limited. Watch the algorithm work.'
overview:
  "PRVC tries to give you the predictability of volume control with
  the safety of pressure control. You set a volume target; the vent
  picks the pressure to hit it, breath by breath. In this module
  you'll induce a sudden drop in compliance and watch the algorithm
  ramp the inspiratory pressure up over a few breaths to keep
  delivered volume on target. You'll also read about a specific
  failure mode — the yo-yo in awake patients with strong drive —
  that the simulator doesn't render but that you'll see at the
  bedside."
what_youll_do: [
  'PRVC adjusts pressure breath by breath to hit a volume target.',
  "It's pressure-limited, so peaks can't run away.",
  "The yo-yo failure mode is read-only — you'll learn the pattern in
   the read phase, not on the sim.",
]
```

### 2.4 Hidden objective simplification

Strip the recognition-question child entirely. The learner manipulates
compliance; the outcome child fires when PIP has visibly climbed. No
trailing recognition prompt — the predict_mcq blocks in the read phase
already gate the learning.

```ts
hidden_objective: {
  kind: 'compound',
  sequence: 'strict',
  reset_between: false,
  children: [
    {
      kind: 'manipulation',
      control: 'compliance',
      condition: { type: 'delta_pct', direction: 'decrease', min_pct: 40 },
    },
    {
      kind: 'outcome',
      readouts: { pip: { operator: '>=', value: 22 } },
      sustain_breaths: 4,
    },
  ],
},
```

### 2.5 New read content

Convert the existing predict_observe to a predict_mcq covering the
*correct* operation of the algorithm; add a content callout describing
the yo-yo failure mode for read-only consumption.

**predict_mcq #1:**

```
PREDICT
You drop this patient's compliance from 30 to 18 — a sudden ARDS-like
worsening. Over the next several breaths the vent will:

A. Hold PIP constant; Vt will fall.
   (wrong — that's PCV. PRVC adjusts pressure to keep volume on
   target)
B. Hold Vt constant; PIP will rise breath by breath.  [CORRECT]
C. Switch to volume-control automatically.
   (wrong — PRVC doesn't mode-switch; it adapts within its own mode)
D. Nothing — the breath-by-breath adjustments are too small to see.
   (wrong — the adjustments are visible. You'll see PIP halos flash
   each adaptive step)

OBSERVE
PRVC senses Vt drift and corrects PINSP to compensate. With sudden
worsening compliance, the algorithm ramps PINSP up over 4-5 breaths,
holding Vt at target. You see the algorithm work in real time. This
is what closed-loop control looks like when conditions stay stable.
```

**New content callout (replaces summary recognition):**

```
kind: 'callout',
tone: 'warn',
markdown:
  "**The yo-yo: the sim can't show you this, but the bedside will.**
  In an awake patient with strong drive, the algorithm misreads the
  patient's effort as 'compliance improved' and lowers PINSP. The
  next breath is therefore smaller, the algorithm reads 'compliance
  worsened,' and ramps PINSP back up. Over 30-60 seconds you see the
  PINSP cycle visibly: 12 → 22 → 12 → 22, while Vt stays on target.
  The patient is uncomfortable. The fix is to switch to a
  non-adaptive mode (VCV or PCV) and address why the patient is
  agitated. Not sedation — sedation buries the diagnostic
  information."
```

### 2.6 Task framing rewrite

```
user_facing_task:
  "Watch the algorithm. Drop this patient's compliance into the ARDS
  range and wait. Over four to five breaths the inspiratory pressure
  will climb as PRVC keeps Vt on target. You'll see the PIP halo
  flash each adaptive step. No other intervention needed — your job
  is to observe."
success_criteria_display: [
  'Reduce compliance by at least 40%.',
  'Wait for PIP to climb to ≥ 22 cmH2O, sustained 4 breaths.',
]
```

### 2.7 Summative changes

Q3 currently asks the learner to recognize a yo-yo pattern from a
description. Keep that question — the read callout teaches it; the
quiz tests it. The point is that the learner has read about the
pattern, not that they've seen it on the sim.

No other summative changes needed.

---

## 3. M11 — Dyssynchrony Recognition (full rebuild with SVG clips)

### 3.1 Problem with current spec

The whole point of M11 is waveform pattern recognition. The current
implementation has prompts that *describe* the waveform in prose and
ask the learner to name the pattern from the description. That's
text-matching, not waveform recognition. A learner who passes M11 has
demonstrated they can match phrases — not that they could spot
ineffective triggering on a real vent.

### 3.2 Resolution

Author three SVG clips that show the actual waveform patterns, render
each clip as a static figure inside the recognition prompt, and ask
the learner to identify the pattern from the clip. The clinical
context (patient story) remains in the prompt prose but is shorter
and less leading. The clips do the diagnostic work.

### 3.3 SVG clip specifications

All three clips share a common geometry, palette, and grid so the
learner is reading the *pattern* and not learning to decode three
different charts.

**Common spec:**

- ViewBox: `0 0 800 360`. Two stacked panels: pressure (top, 0-180)
  and flow (bottom, 180-340), with a 20px label strip at y=340-360.
- Time axis: 6 seconds, gridlines every 1 s as dashed light-stone
  (#d6d3d1) verticals.
- Pressure axis: 0-40 cmH2O. Major gridline at 0 (the baseline) in
  solid #a8a29e, lighter dashed line at 30 cmH2O.
- Flow axis: -60 to +60 L/min. Major gridline at zero in solid
  #a8a29e; this is the diagnostic anchor for trapping.
- Trace color: #3b82f6 (sky-500, matches the live sim).
- Annotation color: #0284c7 (sky-700) for arrows; #b45309 (amber-700)
  for caption tags.
- Background: #f5f0e6 (brand cream).
- Font: ui-sans-serif at 11px for axis labels, 13px bold for the
  pathology callout.

All three clips include:

- Panel headers ("Airway Pressure (cmH2O)" / "Flow (L/min)") in
  top-left of each panel, 10px font, #57534e.
- Y-axis labels every 10 cmH2O on the pressure panel, every 30 L/min
  on the flow panel.
- A single sky-blue annotation callout pointing at the diagnostic
  feature, with one-word tag ("trigger attempt", "stacked", "scoop").
- NO label saying which dyssynchrony this is. The learner identifies
  it.

**Clip 1: `public/clips/dyssyn_ineffective.svg`**

Trace content:

- Three normal mandatory breaths spaced ~2 s apart. Each breath: PIP
  rises smoothly to ~25 cmH2O over 1 s, holds briefly, returns to PEEP
  5 cmH2O during expiration. Flow trace: square positive flow during
  insp (30 L/min), decelerating negative flow during exp returning to
  zero.
- Between breath 2 and breath 3, two small negative dips in pressure
  (down to ~2 cmH2O, lasting ~0.3 s each) with no corresponding breath
  delivery. The flow trace at those times shows a tiny negative blip
  (-5 to -8 L/min) — the patient pulling but not triggering.
- Annotation arrows pointing at the failed triggers with the tag
  "trigger attempt — no breath."

**Clip 2: `public/clips/dyssyn_double.svg`**

Trace content:

- Two normal breaths at the start of the trace.
- A pair of stacked breaths: breath A peaks at ~25 cmH2O, starts
  descending, but at ~50% of normal expiration the patient triggers
  again and breath B is delivered on top, with peak pressure climbing
  to ~38 cmH2O (because the lung didn't fully exhale).
- Followed by a longer expiration as the patient catches up.
- Flow trace: between breath A and B, the expiratory flow is
  *interrupted* — never returns to zero before B's positive flow
  starts.
- Annotation pointing at the second peak with tag "stacked — no
  expiration between."

**Clip 3: `public/clips/dyssyn_starvation.svg`**

Trace content:

- Three breaths, all VCV with constant flow.
- First breath is normal — pressure rises smoothly from PEEP to ~28
  cmH2O.
- Second and third breaths: instead of rising smoothly, the pressure
  trace dips DOWN to ~10 cmH2O early in inspiration before recovering.
  The dip is the patient pulling harder than the set flow can supply.
- Flow trace: visibly stays at the set value (no compensation in
  VCV). This is the diagnostic contrast — flow is constant, pressure
  is scooped.
- Annotation pointing at the inspiratory pressure dip with tag "scoop
  — patient pulling against the vent."

**Reference figures (non-scored, shown in read phase as a pattern
atlas):**

Add two more clips for the read phase:

- `public/clips/dyssyn_reverse.svg` — reverse triggering. A
  mandatory breath delivered, the diaphragm then contracts a beat
  later in response. Shows up as a pressure dip mid-expiration.
- `public/clips/dyssyn_cycling.svg` — premature/delayed cycling.
  PSV breath where the vent cycles off before the patient has finished
  inhaling (premature) shown as a pressure drop while flow is still
  positive.

Both are read-only reference; not in the recognition pool.

### 3.4 New recognition prompt structure

Each scored prompt embeds the clip as the question content. The
`InlinePromptConfig` type needs a new optional `clip_src` field:

```ts
clip_src?: string;  // path to the SVG clip relative to public/
```

`RecognitionPrompt.tsx` renders the clip above the question text when
`clip_src` is set. The clip is the primary diagnostic content; the
prose is a short clinical anchor.

### 3.5 Hidden objective rewrite

```ts
hidden_objective: {
  kind: 'compound',
  sequence: 'any_order',
  children: [
    {
      kind: 'recognition',
      prompt: {
        prompt_id: 'M11-ineffective',
        trigger: { kind: 'on_load' },
        clip_src: '/clips/dyssyn_ineffective.svg',
        question:
          "65 yo on VCV. Auto-PEEP measured 9 cmH2O. The waveform above is recorded over 6 seconds. What pattern is this?",
        options: [
          { label: 'Ineffective triggering', is_correct: true },
          { label: 'Double triggering', is_correct: false },
          { label: 'Flow starvation', is_correct: false },
          { label: 'Normal breathing with sigh breaths', is_correct: false },
        ],
        max_attempts: 2,
      },
    },
    {
      kind: 'recognition',
      prompt: {
        prompt_id: 'M11-double',
        trigger: { kind: 'on_load' },
        clip_src: '/clips/dyssyn_double.svg',
        question:
          "35 yo ARDS on VCV Vt 400 (6 mL/kg), strong respiratory drive. The waveform above is recorded over 6 seconds. What pattern is this?",
        options: [
          { label: 'Double triggering', is_correct: true },
          { label: 'Ineffective triggering', is_correct: false },
          { label: 'Flow starvation', is_correct: false },
          { label: 'Auto-cycling from a circuit leak', is_correct: false },
        ],
        max_attempts: 2,
      },
    },
    {
      kind: 'recognition',
      prompt: {
        prompt_id: 'M11-starvation',
        trigger: { kind: 'on_load' },
        clip_src: '/clips/dyssyn_starvation.svg',
        question:
          "50 yo asthma on VCV with visible air hunger. The waveform above is recorded over 6 seconds. What pattern is this?",
        options: [
          { label: 'Flow starvation', is_correct: true },
          { label: 'Bronchospasm raising resistance', is_correct: false },
          { label: 'Ineffective triggering', is_correct: false },
          { label: 'Too-long I-time', is_correct: false },
        ],
        max_attempts: 2,
      },
    },
  ],
},
```

Critical authoring choice: each prompt's distractors are *other
recognizable patterns*, not random text. The wrong-answer feedback for
each distractor briefly says what *that* pattern would look like ("That
pattern has stacked breaths with no expiration between — not what's
shown here"). This is how the module actually teaches recognition.

### 3.6 Read phase additions

The read phase becomes a pattern atlas. Add a new `figure` block for
each of the five patterns (the three scored + the two reference).
Each figure embeds the clip and a one-line label:

```ts
{
  kind: 'figure',
  caption: 'Ineffective triggering — patient effort, no breath delivered.',
  src: '/clips/dyssyn_ineffective.svg',
},
```

Plus a predict_mcq before the atlas (the M11 entry in §0.7 above).

### 3.7 Task framing rewrite

```
user_facing_task:
  "Recognize the dyssynchrony pattern. Three waveform clips, one
  patient context per clip. For each, look at the clip and the bedside
  vignette, and pick the pattern. You must get all three correct in
  one pass — wrong answers explain what *that* pattern would have
  shown."
success_criteria_display:
  // auto-derived from the three recognition questions (existing
  // behavior — no manual list)
```

### 3.8 Authoring workflow for the SVG clips

The clips should be authored as static SVG files, not generated at
runtime. Path traces can be computed once from a synthetic vent run:

1. Run the live sim with the relevant patient state and pathology
   forced (e.g. auto-PEEP scenario for ineffective triggering).
2. Capture the dataPoints array.
3. Convert to SVG paths using the same `generateSegmentedPaths` helper
   already in `PlaygroundSim.tsx`.
4. Hand-place the annotation arrows in Figma or Sketch.
5. Export as inline SVG with no `<script>` tags.

This is a one-time authoring task. Once the clips exist, they don't
change unless the pattern definition changes.

### 3.9 Open authoring tasks

| File | Status | Owner |
|---|---|---|
| `/public/clips/dyssyn_ineffective.svg` | TODO | clinical author |
| `/public/clips/dyssyn_double.svg` | TODO | clinical author |
| `/public/clips/dyssyn_starvation.svg` | TODO | clinical author |
| `/public/clips/dyssyn_reverse.svg` (reference) | TODO | clinical author |
| `/public/clips/dyssyn_cycling.svg` (reference) | TODO | clinical author |
| `clip_src` field on `InlinePromptConfig` | TODO | engineer |
| `RecognitionPrompt.tsx` clip rendering | TODO | engineer |

Until the clips are authored, this module should be marked
"unreleased" in the module picker and excluded from track-progress
calculations. Shipping the text-only fallback was the wrong call;
holding the module back until the clips exist is correct.

---

## 4. M13 — PEEP (surface SBP feedback)

### 4.1 Problem with current spec

The hidden objective only requires `peep ≥ 10` and `pao2 ≥ 65`
sustained 5 breaths. A learner can satisfy this by setting PEEP to 18
and crushing the patient's BP. The "PEEP-induced hypotension" teaching
in the explore prose has no consequence on the live module.

### 4.2 Resolution

Add `sbp` as a visible readout, drive it from the existing
`calculated_co` math in the ABG engine, and add SBP as a guardrail to
the outcome tracker. A learner who overshoots PEEP into hypotension
fails the sustain count.

### 4.3 Sim changes

The ABG calculation in `PlaygroundSim.tsx` already computes
`calculated_co` from the venous return / intrathoracic pressure model
(line ~410). Derive SBP from it:

```ts
// Add to the abg memo's return value:
const baselineSbp = 120;  // could be patient.bpSys, default 120
const co_factor = Math.max(0.3, Math.min(1.0, CO / 5.0));
const sbp = Math.round(baselineSbp * co_factor);
```

This makes SBP fall as PEEP overshoots and CO drops. The math is
intentionally simple — the goal isn't to model hemodynamics
faithfully, it's to give the learner immediate visible feedback when
they push PEEP too high.

Add `sbp` to the readout list in `src/shell/glossary.ts`:

```ts
sbp: 'systolic blood pressure — drops with overshoot PEEP if hemodynamically marginal',
```

Add the readout to `NumericCard` rendering in the Measured Values
strip (it's a vital sign, but lives naturally with the gas-exchange
group when displayed).

### 4.4 Tracker update

```ts
hidden_objective: {
  kind: 'outcome',
  readouts: {
    peep: { operator: '>=', value: 10 },
    pao2: { operator: '>=', value: 65 },
    sbp: { operator: '>=', value: 95 },   // ← NEW
  },
  sustain_breaths: 5,
},
```

### 4.5 Calibration

With the new SBP model, verify these target points:

| PEEP | PaO2 | SBP | Pass? |
|---|---|---|---|
| 5 | 58 | 120 | no (PaO2) |
| 10 | 72 | 110 | yes |
| 14 | 88 | 100 | yes |
| 18 | 92 | 88  | NO (SBP) — overshoot |
| 22 | 84 | 75  | NO (SBP) — overshoot, PaO2 falling too |

The PEEP-18 row is the key teaching: the oxygenation looks good but
the BP guardrail catches the overshoot. Adjust the
`co_factor` math if these numbers don't land.

### 4.6 New predict_mcq in the read phase

Replace the existing predict_observe with this:

```
PREDICT
You're going to raise PEEP from 5 to 18 in this patient. What's the
most likely BP response?

A. BP rises — PEEP improves cardiac output by reducing LV afterload.
   (wrong — that's true at modest PEEP in failing LVs. At PEEP 18
   in a euvolemic patient, the dominant effect is reduced venous
   return)
B. BP unchanged.
   (wrong — at this magnitude, intrathoracic pressure changes start
   to matter)
C. BP falls.  [CORRECT]
D. Depends on the FiO2.
   (wrong — FiO2 doesn't drive hemodynamics here)

OBSERVE
At PEEP 18, intrathoracic pressure crowds the right atrium, venous
return falls, cardiac output falls, and SBP drops. The recruitment
benefit (PaO2 climbs to 92) is real, but you've overshot the safe
ceiling. The SBP readout above is the live signal — watch it as you
titrate.
```

### 4.7 Hint ladder update

Tier 3 demonstration becomes "set PEEP to 12" — the safe target — not
just a higher number. The hint must not push the learner past the
guardrail.

---

## 5. M14 — Oxygenation Strategies (add ladder test)

### 5.1 Problem with current spec

The four-lever escalation ladder (FiO2 → PEEP → mean Paw → prone) is
named in the read but not tested in the summative or the hidden
objective. Trainees retain the shunt-vs-V/Q distinction (it's the
punchline) and forget the ladder.

### 5.2 Resolution

Add a summative question on the ladder ordering. Also add the ladder
to the predict-mcq layer in the read phase, before the existing
content.

### 5.3 New predict_mcq

Insert this block immediately after the four-bullet intro callout and
before the existing PEEP recruitment block:

```
PREDICT
A patient has refractory hypoxemia despite FiO2 0.8 and PEEP 12.
Which of the following is the next step on Owens's escalation
ladder?

A. Switch from VCV to PCV.
   (wrong — mode change doesn't move the ladder; same lungs, same
   compliance, same shunt)
B. Increase mean airway pressure — longer inspiratory time, or APRV.  [CORRECT]
C. Add a paralytic.
   (wrong — paralysis helps if dyssynchrony is the issue, but it's
   not a primary oxygenation lever in Owens's ladder)
D. Add inhaled nitric oxide.
   (wrong — INO is a rescue therapy below the four-lever ladder, not
   part of it)

OBSERVE
The four levers in order: FiO2 → PEEP → mean airway pressure → prone.
Each has a ceiling. You're hitting the PEEP ceiling here (PaO2 still
inadequate, hemodynamics getting marginal). The next move is mean
airway pressure — longer Ti, IRV, or APRV — which raises alveolar
recruitment time without raising PEEP further. Prone comes after
that.
```

### 5.4 Summative addition

Add a sixth summative question — yes, the module currently has five.
This module is dense enough to warrant a sixth. If the engine
hard-codes five-per-module (it doesn't, but check), this can replace
one of the weaker existing questions. Q4 ("In a patient with 30%
shunt...") is conceptually duplicate with the M5 summative; replace it
with the ladder question:

```
{
  id: 'M14-Q4',
  prompt:
    'A patient is on FiO2 1.0, PEEP 14, mean airway pressure 22, and
    PaO2 is still 55. According to Owens, the next intervention on
    the oxygenation ladder is:',
  options: [
    { label: 'Switch to VCV', is_correct: false },
    { label: 'Prone positioning', is_correct: true,
      explanation:
        'Four levers: FiO2 → PEEP → mean airway pressure → prone.
        Maxed on the first three. Prone is next. ECMO is the rescue
        below prone, not above it.' },
    { label: 'Inhaled epoprostenol', is_correct: false },
    { label: 'ECMO', is_correct: false },
  ],
}
```

### 5.5 Convert existing predict_observe

The existing block ("raise PEEP from 8 to 14 at FiO2 1.0") becomes a
predict_mcq:

```
PREDICT
This patient has a P/F of 65 (PaO2 65 on FiO2 1.0) — refractory
hypoxemia. You raise PEEP from 8 to 14 with FiO2 unchanged. What
happens to PaO2?

A. Unchanged — the patient is already on max O2.
   (wrong — that's the FiO2-resistance fingerprint of shunt, which
   doesn't predict the PEEP response)
B. Climbs as alveoli recruit.  [CORRECT]
C. Falls — PEEP overdistends.
   (wrong — overdistension is a real risk above ~18 in this patient,
   but at 14 you're still in the recruitment zone)
D. Hard to predict.
   (wrong — the lung is recruitable; the prediction is straightforward)

OBSERVE
PaO2 climbs from 65 to over 100 as PEEP recruits the previously
collapsed alveoli. The shunt fraction falls. Now you can drop FiO2 to
0.50-0.60 and PaO2 settles in the 70s — back to non-toxic O2 with a
safe buffer.
```

---

## 6. M16 — Obstruction (promote disconnect-the-vent to tracker)

### 6.1 Problem with current spec

The most important bedside teaching in M16 — "disconnect the vent from
the hypotensive trapped patient" — lives in a content callout and a
formative question. A learner can complete the module without
encountering this teaching as a graded skill.

### 6.2 Resolution

Add a recognition prompt to the hidden objective covering the
hypotensive scenario. The compound becomes four children: the existing
three manipulations, plus a fourth recognition child that presents
after the third (the PEEP drop) lands.

### 6.3 Tracker update

```ts
hidden_objective: {
  kind: 'compound',
  sequence: 'any_order',
  children: [
    // ... existing three manipulations (mode = VCV, tidalVolume range,
    // respiratoryRate range)
    {
      kind: 'outcome',
      readouts: {
        peep: { operator: '<=', value: 3 },
        autoPeep: { operator: '<=', value: 2 },
      },
      sustain_breaths: 5,
    },
    // NEW: hypotension recognition prompt
    {
      kind: 'recognition',
      prompt: {
        prompt_id: 'M16-disconnect',
        trigger: { kind: 'on_load' },
        question:
          "Your asthmatic is now stable on VCV, rate 12, PEEP 0. Auto-PEEP is 1. Suddenly his BP drops from 110/70 to 60/35. Measured auto-PEEP jumps to 16. What's the FIRST action?",
        options: [
          {
            label: 'Disconnect from the vent for 10-15 seconds.',
            is_correct: true,
            explanation:
              "Trapped gas is compressing his venous return. Letting the chest fall is the immediate fix — faster than any drug. Then sort out the rate / Te. This is the maneuver that reverses peri-arrest in seconds.",
          },
          {
            label: 'Push norepinephrine.',
            is_correct: false,
            explanation:
              "Treats the symptom, not the cause. The trapped air is still there. Pressors won't fix mechanical compression of the right atrium.",
          },
          {
            label: 'Fluid bolus.',
            is_correct: false,
            explanation:
              "Same issue. Fluids treat hypovolemic hypotension; this is mechanical compression.",
          },
          {
            label: 'Raise PEEP to splint open airways.',
            is_correct: false,
            explanation:
              "In asthma, applied PEEP worsens trapping. Don't reflex into PEEP without knowing whether the patient is asthma or COPD.",
          },
        ],
        max_attempts: 2,
      },
    },
  ],
},
```

### 6.4 Task framing update

Update the user-facing task to reflect the new fourth step:

```
user_facing_task:
  "Rescue the trapped asthmatic. Switch to VCV with lung-protective
  Vt, drop the rate to 10-14, drop PEEP to ZEEP. Hold the new state
  for 5 breaths. Then — when the patient starts to crash from the
  trapped air — answer the bedside question."
success_criteria_display: [
  'Mode switched to VCV.',
  'Tidal volume set 530-620 mL (7-8 mL/kg PBW).',
  'Respiratory rate set 10-14.',
  'PEEP ≤ 3.',
  'Auto-PEEP ≤ 2, sustained 5 breaths.',
  'Correctly identify the first action for the crashing trapped patient.',
],
```

### 6.5 Note on the formative

The existing formative block on the same content remains in the read
phase as a predict_mcq (per §0). A learner sees this teaching in two
places: in the read phase as a prediction, and in the live task as a
recognition. That redundancy is deliberate — the disconnect maneuver
is the single most important survival skill in the obstructive-disease
module.

---

## 7. M17 — Weaning (RSBI math, tighter numeric choices)

### 7.1 Problem with current spec

The current SBT scenario presents RR 18, spontaneous Vt 380 → RSBI 47.
The four answer options are 12, 47, 85, 110 — three of which are
implausible. A learner picks 47 by magnitude estimation alone without
doing the division.

### 7.2 Resolution

Change the bedside numbers to force a harder calculation, and tighten
the answer options so the learner must actually compute.

### 7.3 Replacement scenario numbers

New scenario data for the second recognition prompt:

```
At 30 minutes on CPAP 5 / PS 7 / FiO2 40%:
RR 22, spontaneous Vt 320 mL, SpO2 95%, HR 88, BP 124/72.
```

RSBI = 22 ÷ 0.32 = 68.75 ≈ 69.

### 7.4 New recognition prompt

```ts
{
  kind: 'recognition',
  prompt: {
    prompt_id: 'M17-rsbi-calc',
    trigger: { kind: 'on_load' },
    question:
      "At 30 minutes on CPAP 5 / PS 7 / FiO2 40%: RR 22, spontaneous Vt 320 mL, SpO2 95%, HR 88, BP 124/72. RSBI is approximately:",
    options: [
      {
        label: '55',
        is_correct: false,
        explanation:
          "Closer to 22 ÷ 0.40 — you used the wrong Vt or shifted a decimal.",
      },
      {
        label: '62',
        is_correct: false,
        explanation: "Close, but not the right division. Recompute: 22 ÷ 0.32.",
      },
      {
        label: '69',
        is_correct: true,
        explanation: "22 ÷ 0.32 = 68.75 ≈ 69. Below 80 on PSV — passes Owens's threshold.",
      },
      {
        label: '76',
        is_correct: false,
        explanation: "Higher than the actual RSBI here. Recompute: 22 ÷ 0.32.",
      },
    ],
    max_attempts: 2,
  },
},
```

Why these distractors:

- **55**: tests whether the learner correctly extracted Vt(L) from
  mL. A learner who divides 22 by 0.40 (a plausible misread of "320"
  as "400") lands here.
- **62**: close to 69 but achievable by sloppy mental math (22 ÷ 0.35
  ≈ 63). The closest single distractor.
- **69**: correct.
- **76**: the symmetric overshoot, lands near 22 ÷ 0.29.

All four are within the plausible RSBI range for the scenario. None
can be rejected by magnitude alone. A learner must do the actual
division.

### 7.5 Task framing update

```
user_facing_task:
  "Read the bedside data and decide. Your patient finished a
  30-minute SBT on CPAP 5 / PS 7 / FiO2 40%. At the 30-minute mark:
  RR 22, spontaneous Vt 320 mL, SpO2 95%, HR 88, BP 124/72. Check
  pre-criteria. Compute RSBI in your head. Decide."
```

Note "in your head" — explicit to the learner that calculator use is
not the point.

### 7.6 Pre-screen prompt unchanged

The first recognition (pre-SBT screen all-criteria-met) is unchanged.

### 7.7 Decision prompt update

The third recognition prompt currently shows RSBI 47. Update to RSBI
69 (the new computed value):

```
question:
  "RSBI 69, comfortable, no abort criteria triggered. The next step is:",
```

Options stay the same (extubate is correct; the three distractors —
repeat in 12 hours, reduce PS, get an ABG — are unchanged).

### 7.8 Read content updates

Update the predict_mcq (per §0.7 M17 entry above) — the example
already uses the new numbers (RR 22, Vt 320, RSBI 69). One number
update across the module.

The "patient context" in the explore card needs updating to match the
new numbers; replace `"RR 18, spontaneous Vt 380"` with `"RR 22,
spontaneous Vt 320"`.

---

## 8. M18 — Extubation (reframe scenario 3)

### 8.1 Problem with current spec

Scenario 3 asks the learner to extubate a brain-injured patient with
GCS 9 against the conventional teaching of "wait for GCS ≥ 10." The
explanation invokes "the data Owens cites" without specifying.
Trainees taught the conventional rule will pick "back to A/C" and
feel mis-graded; the question lives in the gray area between Owens's
specific recommendation and standard practice.

### 8.2 Resolution

Reframe the question as a direct statement about Owens's
recommendation rather than as a clinical-judgment question. Specify
the literature in the explanation. The answer becomes "what does
Owens recommend," which is the answerable, defensible question.

### 8.3 Updated prompt

```ts
{
  kind: 'recognition',
  prompt: {
    prompt_id: 'M18-s3-mental-status',
    trigger: { kind: 'on_load' },
    question:
      "35 yo s/p TBI, GCS 9, no other reason to be intubated. FiO2 35%, PEEP 5, RSBI 50, manageable secretions. Per Owens's framework, the recommended decision is:",
    options: [
      {
        label: 'Delay 24h; IV steroids; recheck cuff leak.',
        is_correct: false,
        explanation:
          "No airway-edema indication — the cuff leak isn't the issue here.",
      },
      {
        label: 'Extubate with NIPPV standby.',
        is_correct: false,
        explanation:
          "No cardiogenic indication. Brain-injured patients with low O2 needs don't have a clear NIPPV indication.",
      },
      {
        label: 'Extubate — Owens recommends early extubation in brain-injured patients with low oxygen requirement, despite GCS.',
        is_correct: true,
        explanation:
          "This is the counter-intuitive call. Owens cites data (Coplin et al., 2000; Manno et al., 2008) showing brain-injured patients with low O2 needs (FiO2 ≤ 40, PEEP ≤ 5) and no high secretion burden do better extubated than held for GCS to improve. The standard 'wait for GCS ≥ 10' rule delays liberation without benefit in this subgroup. This recommendation is Owens-specific; check your institution's protocol — some still require GCS ≥ 10.",
      },
      {
        label: 'Back to A/C — not ready, GCS too low.',
        is_correct: false,
        explanation:
          "The conventional answer — and what many institutions still teach. Owens's reading of the data is that this delays liberation unnecessarily for brain-injured patients with low O2 needs.",
      },
    ],
    max_attempts: 2,
  },
},
```

The reframe does three things:

1. Names the framework explicitly ("Per Owens's framework") so the
   learner knows what's being asked.
2. Calls the recommendation Owens-specific in the correct-answer
   explanation, so a learner who's used to "GCS ≥ 10" sees their
   teaching acknowledged.
3. Marks the conventional answer as "the conventional answer" in the
   wrong-answer explanation, so the learner who picks it isn't told
   they were wrong about their training — they're told Owens reads
   the data differently.

### 8.4 Other scenarios unchanged

Scenarios 1, 2, 4 are unchanged from the v3.1 spec. The same-four-
options structure is preserved across all four. The reframe to "Per
Owens's framework" should propagate to scenarios 1, 2, 4 for
consistency — they're already implicitly Owens-flavored, but stating
it explicitly removes the inferred friction.

Scenario 1, 2, 4 question reframes:

- **S1 cuff leak:** "Per Owens's framework, the best decision is:" (was: "Best decision?")
- **S2 cardiogenic:** "Per Owens's framework, the best decision is:"
- **S4 failed screen:** "Per Owens's framework, the best decision is:"

### 8.5 Summative impact

Q4 ("A brain-injured patient with GCS 8...") already asks "the
recommendation is" which is on the right axis. No change needed.

---

## 9. M19 — DOPES (script the perturbations)

### 9.1 Problem with current spec

The five DOPES scenarios are vignettes describing what the waveform
would show. Same critique as M11: trainees demonstrate text-matching,
not pattern recognition.

### 9.2 Resolution

Script live sim perturbations between scenarios. The sim provides the
diagnostic data; the learner reads the screen and names the pattern.
Unlike M11, the perturbations are programmatic state changes (no SVG
clip authoring required).

### 9.3 New sim mechanism: scripted perturbation

Extend `ScenarioHarness` and `TrackerContext` with a perturbation API:

```ts
// Add to TrackerContext:
applyPerturbation(p: PerturbationSpec): void;
clearPerturbations(): void;

// New type:
export interface PerturbationSpec {
  id: string;
  /** Optional one-time setting overrides applied to the sim. */
  settings?: Partial<{
    tidalVolume: number;
    pInsp: number;
    respiratoryRate: number;
    peep: number;
    iTime: number;
    fiO2: number;
  }>;
  /** Optional patient state overrides. */
  patient?: Partial<{
    compliance: number;
    resistance: number;
    shuntFraction: number;
    leak_mL_per_breath: number;        // NEW sim parameter
    etco2_loss_fraction: number;       // NEW sim parameter (displacement)
    bpSys: number;
  }>;
  /** Optional delivered-Vt cap, simulating a leaking circuit. */
}
```

The `PlaygroundSim` honors these overrides during the perturbation
window. `clearPerturbations` restores baseline. The
`reset_between: true` compound flag already calls
`harness.resetToPreset`; extend it to also call `clearPerturbations`.

### 9.4 Compound tracker extension

Add a new optional `perturbation` field to recognition tracker
children. Before the prompt is presented, the perturbation is applied;
when the child completes (or the compound resets between), the
perturbation is cleared.

```ts
{
  kind: 'recognition',
  perturbation: { ... },   // NEW
  prompt: { ... },
}
```

`buildTracker` and `RecognitionTracker.start` apply the perturbation
via `ctx.applyPerturbation(perturbation)`.

### 9.5 Per-scenario perturbation scripts

**Scenario 1 — Displacement:**

```ts
perturbation: {
  id: 'displacement',
  patient: {
    leak_mL_per_breath: 9999,       // total loss
    etco2_loss_fraction: 1.0,       // ETCO2 → 0
    // chest rise indicator: handled UI-side via leak proxy
  },
}
```

The learner sees: Vte → 0 over a few breaths, ETCO2 trace → 0,
pressure waveform still firing (because the vent is delivering into
the room).

**Scenario 2 — Obstruction:**

```ts
perturbation: {
  id: 'obstruction',
  patient: { resistance: 40 },
}
```

The learner sees: PIP climbs (because R·flow is much bigger), Pplat
unchanged (compliance is fine), wide gap. ETCO2 trace would show
shark-fin if rendered (see §9.7 below).

**Scenario 3 — Pneumothorax:**

```ts
perturbation: {
  id: 'pneumothorax',
  patient: { compliance: 12, bpSys: 75 },
}
```

The learner sees: PIP and Pplat both rise (compliance dropped), SBP
falls (the M13 SBP wiring covers this).

**Scenario 4 — Equipment leak:**

```ts
perturbation: {
  id: 'equipment',
  patient: { leak_mL_per_breath: 150 },
}
```

The learner sees: delivered Vt 450, Vte ~300, persistent gap.

**Scenario 5 — Stacking:**

```ts
perturbation: {
  id: 'stacking',
  settings: { respiratoryRate: 28 },   // pushed up
}
```

The learner sees: autoPEEP climbs, expiratory flow doesn't return to
zero, SBP starts to fall.

### 9.6 New sim parameters

Required sim implementation:

- `leak_mL_per_breath`: subtracted from Vte each breath. If > set Vt,
  Vte stays at 0.
- `etco2_loss_fraction`: multiplied against computed ETCO2. 1.0 means
  no signal.
- ETCO2 as a visible readout (currently computed in the ABG memo but
  not displayed in the readout strip). Add to glossary and to the
  NumericCard grid.

### 9.7 ETCO2 waveform (optional, future)

A full ETCO2 trace adds a fourth waveform panel. Out of scope for
this revision — the numeric ETCO2 readout is sufficient for the
recognition task. Note in [BLOCKED-SIM]: future builds can add the
capnograph trace for shark-fin recognition.

### 9.8 Updated hidden objective

```ts
hidden_objective: {
  kind: 'compound',
  sequence: 'strict',
  reset_between: true,                  // clears perturbation between
  children: [
    {
      kind: 'recognition',
      perturbation: { /* displacement */ },
      prompt: {
        prompt_id: 'M19-s1-displacement',
        trigger: { kind: 'on_load' },
        question:
          "The sim has just been perturbed. Read the readouts and waveforms. What pattern is this?",
        options: [
          { label: 'Displacement (tube out or esophageal)', is_correct: true },
          { label: 'Obstruction', is_correct: false },
          { label: 'Pneumothorax', is_correct: false },
          { label: 'Equipment leak', is_correct: false },
          { label: 'Stacking', is_correct: false },
        ],
        max_attempts: 2,
      },
    },
    // ... four more, one per scenario, each with its perturbation
  ],
},
```

The same five-option list appears on every prompt. The learner is
genuinely picking among the same five decisions each time, with the
correct answer rotating. The same-options structure (M18 precedent)
holds.

### 9.9 Read phase update

Add the predict_mcq from §0.7 M19 entry above. The existing five-row
DOPES figure stays. Add a sentence to the explore card:

```
patient_context:
  "This is the bedside rapid-response module. You'll be called to
  five decompensations in a row — the sim will perturb itself
  between scenarios. The sim is currently showing a normal, stable
  patient as your baseline."
```

### 9.10 Task framing update

```
user_facing_task:
  "Five decompensations in a row. The sim perturbs itself between
  scenarios — read the readouts and the waveforms each time, then
  pick the pattern from the same five options. Get all five right
  to complete the module."
```

`success_criteria_display` continues to auto-derive from the five
recognition questions.

---

## 10. Implementation order

Suggested sequencing:

1. **Engine: predict_mcq block type + shell gating** (§0). Touches
   `src/shell/types.ts`, `ContentBlocks.tsx`, `ReadPane.tsx`, persistence.
   Unblocks all per-module predict_mcq conversions and authoring.
2. **M5 sim parameter** (§1.3). Add `shuntFraction` to patient state.
   Verify the ABG ladder change is backward-compatible.
3. **M13 SBP wiring** (§4.3). Add `sbp` derived readout. Visible across
   all modules; M13 uses it in the tracker.
4. **Modules M5, M9, M13, M14, M16, M17, M18** (§§1, 2, 4, 5, 6, 7, 8).
   Each is a config edit plus the relevant predict_mcq authoring. No
   blocking dependencies between them once §0 lands.
5. **M19 perturbation API** (§9.3, §9.4, §9.6). Engine work plus per-
   scenario scripts. Add ETCO2 numeric readout.
6. **M19 module config** (§9.8, §9.9, §9.10). Applies the perturbation
   API.
7. **M11 clip authoring** (§3.3, §3.5). Five SVG files plus the
   `clip_src` field. Largest authoring lift; do last.
8. **M11 module config** (§3.5, §3.6, §3.7).

Steps 1-4 are roughly one engineering week plus one clinical-author
week. Steps 5-6 are another engineering week. Step 7 is independently
a clinical-author week. Step 8 is a day.

---

## 11. Per-module change summary

| Module | Change category | Engine work? | Author work | Risk |
|---|---|---|---|---|
| M5 | scripted shunt | yes (shuntFraction) | medium | medium (sim math) |
| M9 | strip yo-yo | no | small | low |
| M11 | rebuild with clips | yes (clip_src field) | large (5 SVGs) | high (clip quality) |
| M13 | SBP guardrail | yes (sbp readout) | small | medium (calibration) |
| M14 | ladder test | no | small | low |
| M16 | disconnect tracker | no | small | low |
| M17 | RSBI numbers | no | small | low |
| M18 | reframe S3 | no | small | low |
| M19 | scripted perturbations | yes (perturbation API + 2 sim params) | medium | medium (sim params) |
| All | predict_mcq conversion | yes (new block type) | medium (per-module copy) | medium (gating UX) |

---

## 12. What this spec deliberately does not change

- The five-phase model (Primer → Read → Explore → Try it → Debrief).
  Untouched.
- The track structure and module ordering. Untouched.
- The score formula in `src/shell/scoring.ts`. Untouched.
- M1, M2, M3, M4, M6, M-EOM, M7, M8, M10, M12, M15 hidden objectives.
  Each gets a predict_mcq conversion (§0) but no tracker changes.
- The KC question bank and selection engine. Untouched. (Module
  summative items that change here propagate automatically to the KC
  pool via the existing `moduleQuestionsToKC` builder.)

This is a tightening pass, not a redesign. The architecture is sound;
the modules above are where the architecture isn't being used
faithfully.
