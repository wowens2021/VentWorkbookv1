# THE VENTILATOR WORKBOOK — MASTER SHELL v3

*The north-star instruction document for every code change going forward.*

> **Read this first, every time.** If a proposed change conflicts with anything in this document, the document wins. If the document is ambiguous, stop and ask before writing code. Drift from these rules is the single biggest cause of regressions in this codebase.

---

## Part 0 — Philosophy & Voice

### What this product is

The Ventilator Workbook is a **paid, professional-grade course** sold to ICU residency programs, respiratory therapy programs, and individual buyers of *The Ventilator Book* (Owens). It is not a toy. It is not a hackathon demo. The user is a clinician (or training to be one) and their time is expensive.

The pedagogical model is **Khan Academy / Coursera, applied to bedside mechanical ventilation**:

- Short, focused modules (12–18 min each).
- A *live, manipulable* simulator that is the central teaching surface — not a decoration next to text.
- Every concept is taught by *making the learner do something*, then asking them what they saw.
- Feedback is immediate, specific, and rooted in the physiology, not generic praise.

### Voice and tone

The reference voice is **Will Owens'** in *The Ventilator Book*: dry, direct, expert, occasionally wry, never condescending. Match it everywhere.

**Do:**
- "Slow the rate. Let the CO2 rise. Save the patient." (M16 tagline — perfect)
- "Volume is fixed. Pressure is the message about the patient." (M7 — perfect)
- "The lungs themselves will tell you where they're happiest." (M13 — perfect)

**Don't:**
- "Great job! 🎉 You did it!"
- "Awesome work, learner!"
- "Let's explore the wonderful world of ventilation together!"
- Any sentence with the word "wonderful," "amazing," or three exclamation points.

When the learner gets something right, the system says "Correct." or "Spot on." — not "AMAZING WORK!". When the learner gets something wrong, the system says specifically *why*, not "Try again!".

### Three commitments that override everything

1. **Every screen has one obvious next action.** If a learner can look at a screen for more than 4 seconds and not know what to do, the screen is broken. Fix it.
2. **The sim must visibly react to every learner action within 200 ms.** Number flashes, waveform redraws, halo highlights, badge ticks — *something* must respond. A "silent" interaction is a bug.
3. **No phase advances without explicit, clearly-signaled completion.** Mystery-meat progression ("did I do it? did the sim register it?") is the most common complaint. Always show the learner exactly where they are in the journey.

---

## Part 1 — The Five-Phase Model (Explicit Contracts)

Every module walks the learner through exactly five phases plus a one-time briefing splash. The shell handles the chrome; the module config supplies the content. **Do not invent new phases.** Do not collapse phases. Do not skip the splash.

### Briefing splash (one-time, before Phase 1)

**Visible:** full-page card with module title, track chip, estimated minutes, 2–4 sentence overview, 2–4 bullets of "what you'll do", and a single "Begin module →" button. Track-tinted top nav strip.

**Behavior:** acknowledged on click. The ack is persisted (`briefing_acknowledged_at`) so resuming a module does *not* re-show the splash. A Restart clears the ack alongside the rest.

**Failure mode to avoid:** showing this every time the learner re-enters the module. Once acknowledged, never again unless reset.

### Phase 1 — Primer (3 MCQs, 30 pts)

**Visible:** Workbook column = one MCQ at a time. Sim column = **locked** (greyed overlay, "Sim unlocks after the primer" badge). Both columns show full layout — the sim is teasingly visible, not absent.

**Behavior:** Each question has exactly 4 options. One correct, three distractors, every option has its own per-option explanation. The learner submits; the system reveals the explanation for the chosen option (green if right, rose if wrong). The learner cannot advance until they pick the correct option — but they can retry without penalty after seeing the explanation. The **first-attempt** correctness is what's recorded for the score.

**Contract for the author:**
- Distractors must be plausible to a clinically-trained novice. Never include "all of the above," "none of the above," or sarcasm options.
- Explanations are 1–3 sentences. They state the principle and why the wrong options are wrong-shaped.
- Each question previews a concept the Read phase will deepen — not a trick.

**Gate to advance:** all 3 questions answered correctly (with retries allowed). On the final correct answer, show a brief "Primer complete · First-attempt score: X/3" card with a "Enter the simulator →" CTA.

**Common failure mode (DO NOT REPEAT):** Letting a learner advance with a wrong answer on a primer question. The whole point is calibration before exposure. Retries are free; advancement requires correctness.

### Phase 2 — Read (prose, callouts, predict-observe, optional check-yourself)

**Visible:** Workbook column = scrollable reading. Sim column = **live**, fully interactive, controls unlocked per the module's `unlocked_controls`. The learner can poke the sim while reading.

**Critical interactivity rule:** This is *the* phase that distinguishes us from a textbook. The sim is alive and the reading is wired into it. Every `predict_observe` block declares an `awaits_control`; the moment the learner changes that control, the "Observe" half auto-reveals with a soft slide-in animation. The fallback button ("Then observe in the sim →") stays available for fast readers.

**Content blocks:**
- `prose` — paragraph with **bold** and `inline code` support.
- `callout` — colored panel, tone is `info | tip | warn`. One sentence, maybe two. Used for non-obvious gotchas.
- `predict_observe` — paired "Predict / Observe" cards. Always declare `awaits_control` when a control is unlocked. *Never* leave one passive.
- `figure` — ASCII or image. Reserve for shape comparisons (e.g., "compliance vs resistance waveform side-by-side"). Don't use for decoration.
- `formative` — these do NOT render inline. They render on the standalone **Check Yourself page** between Read and Explore (see below).

**The advance CTA:**
- If the module has formative blocks: "Continue — quick check yourself"
- Otherwise: "I'm ready — let me try it"

The CTA is sticky at the bottom of the scroll container once the learner has scrolled past ~70%. No duplicate CTA at the end of content.

**Check Yourself sub-phase:** If the module declared `formative` blocks, the Read phase has a `check` sub-page after the prose. Each formative is a single MCQ on its own card. *Wrong answers do not block forward progress* — the explanation appears regardless. The point is a confidence check, not a gate. Captured answers feed a small (5-pt) bonus in the final score.

**Common failure modes to avoid:**
- Writing prose that *describes* the waveform when the learner could just look at it. Tell them what to look at and *let them see it*.
- Forgetting `awaits_control` on `predict_observe` blocks (renders the block as a textbook bullet — wastes the live sim).
- Inline formative MCQs cluttering the read column. Use the dedicated check-yourself page.

### Phase 3 — Explore (free play, no scoring)

**Visible:** Workbook column = **Explore Card** (patient context, what's unlocked, what to watch, suggestions). Sim column = live, interactive, unchanged.

**Contract:**
- Patient context: 1–3 sentence clinical framing. Who is this patient, why are they on the vent, what's been happening?
- Unlocked controls: every control listed individually with a one-sentence description of what it does and its useful range.
- Readouts to watch: 2–4 readouts with a description of what each will tell the learner.
- Suggestions: 3–5 specific things to try. *Concrete experiments*, not vague directives.

**Good suggestion:** "Drop compliance from 50 to 25. What do peak and plateau do?"
**Bad suggestion:** "Explore the controls to understand the mode."

**Behavior:** No tracker is active. No score is being collected (though we count control changes for telemetry). The learner clicks "Start the task →" when they're ready.

**Failure mode:** Skipping this phase or making it perfunctory. The Explore phase is where the *intuition* gets built. The Try-It tracker only works if the learner has the muscle memory from Explore. Authors who treat Explore as "just say 'try the knobs'" produce modules where Try-It feels like a quiz nobody studied for.

### Phase 4 — Try It (the graded task)

**Visible:** Workbook column = **Task Card** with clinical framing + success criteria. Sim column = live, with the hidden tracker watching.

This is the heart of the product. Every detail matters.

**Two layers of communication:**
1. **The user-facing task** (clinical framing in the learner's voice — what their senior is asking them to do). Style A/B/C depending on module type (see Part 6).
2. **The hidden objective tracker** (the machine-readable success condition).

These can be *worded differently* on purpose. The user-facing task says "lung-protective settings"; the tracker says `vte ≤ 430 AND plateau ≤ 30 AND drivingPressure ≤ 15 sustained 5 breaths`. The learner sees the clinical concept; the machine watches the numbers.

**Live progress signals (mandatory — these are what make the phase feel responsive):**
- **B1 readout flash:** when the learner changes a control, the readouts physiologically downstream of that control briefly flash sky-blue (1.1 s). The mapping is in `CONTROL_AFFINITY` in `ModuleShell.tsx`. Outcome trackers that explicitly name readouts override the affinity table.
- **B2 progress chip:** when an outcome tracker is mid-flight ("hold X for 5 breaths"), a "Holding 3 of 5 breaths…" chip appears with a progress bar. The learner sees they're *getting warmer*.
- **F3 step checkmarks:** compound trackers show per-step checkmarks on the success-criteria list as each child fires.
- **F4 step-complete toast:** when a child in a `reset_between: true` compound fires, a 3-second toast announces "Step N of M complete — sim reset for the next step."
- **Hint ladder:** surfaces at 25 s / 75 s / 150 s idle, or 5 / 10 / 15 changes-without-progress, whichever fires first. Tier 3 includes a "Show me" button.

**Satisfaction:**
- The tracker fires `satisfied` exactly once.
- The Task Card flips to a green "Task complete — nice work" panel with a "Continue to debrief →" CTA.
- A subtle "Redo this task" link appears underneath for re-attempts (does not reset persisted achievement).
- Both the recognition question banner (if any was open) AND the click-feedback popup are dismissed simultaneously — never leave a stale prompt visible into the debrief.

**Hint ladder contract:**
- Tier 1 (25 s idle or 5 no-progress changes): a friendly nudge naming the *category* of action.
- Tier 2 (75 s / 10): more specific — names the control or numerical range.
- Tier 3 (150 s / 15): a "Show me" button that either runs a demonstration (the configured `control` → `target_value`, then auto-reset) OR, for recognition prompts, auto-fills the correct answer with an explanation popup that the learner clicks "Continue →" to actually advance.
- Hint engagement is only counted toward the score penalty when the learner *actively dismisses* the hint card or clicks "Show me." Auto-surfacing alone, ignored, is not counted.

**Common failure modes:**
- Tracker fires on a partial match and the learner thinks they're done but the next breath drops it (use sustain_breaths).
- The user-facing task wording doesn't match the tracker — learner satisfies the words but not the numbers (or vice versa).
- The Task Card stays visible after satisfaction without the green panel switch (looks broken).
- A wrong answer on a recognition prompt blocks the compound from advancing forever (always provide a "Continue →" path that force-advances after explanation).

### Phase 5 — Debrief (summative + review + next-up)

**Visible:** Workbook column = score card + track progress strip + key points + next-module CTA. Sim column = live but frozen.

**Sub-flow:**
1. **Summative quiz** (5 MCQs, 50 pts). Same shape as the primer but post-test. The learner picks all answers and submits at once. Each option shows its own explanation. No retry — this is summative.
2. **Score breakdown card** with:
   - Letter grade animation (zoom-in on the letter)
   - Percent counts up from 0 → final over ~1.2 s
   - Component rows: Primer / Knowledge check / Hint bonus / Reset bonus / Check-yourself bonus
   - Timing footer: task completion time + total module time
3. **Track progress strip** showing the current track's modules as filled / half / empty pills.
4. **"Review your answers →"** link → standalone evaluations sub-page. Don't inline three answer-review cards on the summary; it's noisy.
5. **Key points** collapsed block.
6. **Up Next** microcopy + primary CTA. If there's a next module, the CTA is "Continue to {nextModule.id} →" in track color. Otherwise "Return home" in track color.
7. Tertiary row: Return home (text link) + buried Restart link.

**Scoring formula (carved in stone):**

```
total = primer_pts + quiz_pts + hint_bonus + reset_bonus + check_yourself_bonus
      = (primer_correct / 3) * 30
      + (quiz_correct / 5) * 50
      + {0 hints: 10, 1 tier: 5, 2+ tiers: 0}
      + {0 resets: 10, 1 reset: 5, 2+ resets: 0}
      + (cy_correct / cy_total) * 5     (proportional, 0 if no formative blocks)

Capped at 100. Raw can reach 105 (the 5-pt cushion is intentional —
a strong learner absorbs a small hint/reset penalty without losing an A).

Letter: A >= 90, B >= 80, C >= 70, D >= 60, F < 60.
```

**Common failure modes:**
- Recomputing the score on every render with different inputs (use the persisted `total_score_percent` once written).
- Showing the score before the summative quiz is submitted (don't).
- Making "Restart module" the primary CTA (it's a tertiary, buried action — Next Module is the primary).

---

## Part 2 — The Sim Is a Teaching Surface

The PlaygroundSim is the teaching surface. It is *not* a decoration. Every interaction with it is a learning moment.

### Per-phase sim interactivity (immutable)

| Phase | `simInteractivity` | Visual state |
|---|---|---|
| Briefing splash | n/a (sim not shown) | — |
| Phase 1 (Primer) | `locked` | Greyed overlay, "Sim unlocks after the primer" pill |
| Phase 2 (Read) | `live` | Fully interactive — predict-observe blocks listen for control changes |
| Phase 3 (Explore) | `live` | Fully interactive, no tracker watching |
| Phase 4 (Try It) | `live` | Fully interactive, tracker watching, hint ladder running |
| Phase 5 (Debrief) | `live-frozen` | Animates, all controls disabled |

**Mode control is a special case.** Even when `simInteractivity` is `live`, the mode row respects the module's `unlocked_controls`. If a module fixes the patient on PSV (e.g., M17 weaning), `mode` is locked. All other controls are universally interactive in `live` so that the learner can poke around. This rule is *intentional* — fighting it is a known source of regression.

### Mandatory visual reactivity primitives

These are the engagement-feeling mechanisms. Every one of them MUST work or the product feels dead.

#### Number flashing (B1)

When the learner changes a control in Phase 4, the readouts physiologically downstream halo sky-blue for 1.1 s. Mapping table (extend cautiously — every new control needs a row):

| Control | Halos these readouts |
|---|---|
| `compliance` | pip, plat, drivingPressure |
| `resistance` | pip, drivingPressure |
| `peep` | pip, plat, totalPeep |
| `respiratoryRate` | mve, autoPeep, actualRate |
| `tidalVolume` | vte, mve, pip, plat |
| `fiO2` | (no readout halo — fiO2 is its own number) |
| `iTime` | ieRatio |
| `pInsp` | pip, vte |
| `psLevel` | vte, mve |
| `spontaneousRate` | actualRate, mve, rsbi |
| `endInspiratoryPercent` | vte, ieRatio |

If the active tracker is an outcome tracker that names readouts explicitly, those override the affinity table. The learner sees a flash on *the numbers the tracker is watching* — pointing exactly at what matters.

#### Outcome-progress chip (B2)

Outcome trackers emit `onOutcomeProgress({ current, target, label })` on every sim_tick. The TaskCard shows "Holding 3 of 5 breaths…" with a progress bar. **Resets to 0** the moment the condition breaks. **Goes to null** the moment satisfied fires. This is the single most reassuring signal in Phase 4 — never remove it.

#### Step-complete toast (F4)

In a `reset_between: true` compound tracker, when a child fires the harness `notifyStepComplete(idx, total)`. The shell shows a 3-second toast above the hint ladder: "Step 2 of 3 complete — sim reset for the next step." Then the sim resets.

#### Phase-badge clickability

The top strip shows 5 dots, one per phase. Past-completed phases are clickable (back-nav). The current dot is tinted with the track color. Hover reveals the phase name.

#### Recognition click-target mode

When a recognition prompt has `click_targets`, *every* readout tile and *every* control becomes clickable. There is no visual hint about which is correct — the learner must read the numbers and pick. A banner above the Measured Values strip carries the question text ("Click the reading that shows peak airway pressure"). Wrong clicks open a popup with a specific explanation (e.g., "Vte shows expired tidal volume — not pressure. Try another reading."); right clicks open a popup with the correct-answer explanation and a "Continue →" button that fires the recognition_response. **Wrong clicks do NOT advance the tracker**; right clicks advance only on Continue (so the next question doesn't appear behind an open popup).

### What the sim must NEVER do

- Auto-pause without learner action.
- Reset waveforms unannounced.
- Change scale (y-axis bounds) without smoothing.
- Show conflicting numbers across the strip and waveforms (drift between calculation and display).
- Display alarms during the locked/Phase-1 view.

---

## Part 3 — Tracker Logic (Canonical Contracts)

This is where the code LLM hurts itself most often. Read these slowly.

### Tracker primitives — exactly four kinds

#### 1. Manipulation

> "Move *this* control by *this much* in *this direction*, then optionally answer *this* acknowledgment question."

```ts
{
  kind: 'manipulation',
  control: 'compliance',
  condition: { type: 'delta_pct', direction: 'decrease', min_pct: 30 },
  require_acknowledgment: {
    question: 'You decreased compliance. What happened to the peak-to-plateau gap?',
    options: [
      { label: 'Unchanged', is_correct: true },
      { label: 'Widened', is_correct: false },
      { label: 'Narrowed', is_correct: false },
    ],
  },
}
```

**Condition types — pick one:**

- `{ type: 'delta_pct', direction, min_pct }` — change relative to baseline (from the preset). Use this for "raise resistance by 50%", "drop compliance by 30%".
- `{ type: 'absolute', operator, value }` — absolute comparison. Use for "PEEP ≥ 12", "rate ≤ 6".
- `{ type: 'range', min, max }` — value inside a band. Use for "set Vt to 580–620" (a target range that prevents over-specifying).
- `{ type: 'equals', value }` — exact match. Use for `mode` ('PSV', 'VCV') and other categorical controls.
- `{ type: 'any_change' }` — value differs from baseline. Use for "change End-Insp %, any direction" when the *learning* is independent of direction.

**`require_acknowledgment`:** when present, the manipulation fires only after BOTH the control change AND a correct answer to the follow-up MCQ. This is how we force the learner to *notice* what they just did, not just push buttons.

#### 2. Outcome

> "Hold *these* readouts at *these* values for *N consecutive breaths*."

```ts
{
  kind: 'outcome',
  readouts: {
    vte: { operator: '<=', value: 430 },
    plat: { operator: '<=', value: 30 },
    drivingPressure: { operator: '<=', value: 15 },
  },
  sustain_breaths: 5,
}
```

**Key rules:**

- All readouts must satisfy *simultaneously*. A single failed breath resets the counter to 0.
- `sustain_breaths` defaults to 1; use 2 for transition checks and 5 for "hold a state." Never lower than 2 for a target-state task.
- The shell shows the progress chip while the counter is non-zero. *Don't disable the chip thinking "the learner will be fine without it."* They won't.

#### 3. Recognition

> "Answer this MCQ. Either by picking an option, OR by clicking the correct reading/control on the sim itself."

```ts
{
  kind: 'recognition',
  prompt: {
    prompt_id: 'M1-peak',
    trigger: { kind: 'on_load' },
    question: 'Click the reading that shows peak airway pressure.',
    options: [/* canonical record — not shown if click_targets present */],
    click_targets: [
      { element: { kind: 'readout', name: 'pip' }, label: 'PIP', is_correct: true, explanation: '...' },
      { element: { kind: 'readout', name: 'vte' }, label: 'Vte', is_correct: false, explanation: '...' },
      // ...
    ],
  },
}
```

**Trigger types:**
- `on_load` — prompt appears immediately when this tracker starts.
- `on_sim_state` — prompt appears once the sim hits a readout condition.
- `after_manipulation` — prompt appears once the named control is moved.

**Two response modes:**
- **MCQ mode (no `click_targets`):** legacy floating modal with A/B/C/D buttons. Wrong answers no longer block — `onContinue` force-advances after explanation (see RecognitionPrompt.tsx). The original wrong attempt is still emitted for telemetry.
- **Click-target mode (`click_targets` non-empty):** the question is a banner above the Measured Values strip; the learner clicks a reading or control. Wrong clicks show explanation popup, don't advance. Right clicks show explanation popup; clicking "Continue →" advances.

#### 4. Compound

> "Run *these children* in *strict* or *any-order*, optionally resetting the sim between."

```ts
{
  kind: 'compound',
  sequence: 'strict',         // or 'any_order'
  reset_between: true,        // sim resets to preset between children
  children: [/* trackers */],
}
```

**Rules:**
- `strict`: only one child is active at a time. The next starts when the previous fires.
- `any_order`: all children are active simultaneously. Any can fire at any time; compound completes when all have fired.
- `reset_between: true` is *only* meaningful with `strict`. It resets the sim, fires the step-complete toast, dismisses any active prompt, and clears stale acknowledgment state on un-fired siblings.

### Anti-patterns the code LLM keeps hitting

#### ❌ Outcome tracker with conflicting conditions

```ts
// WRONG — these can never both be true
readouts: {
  vte: { operator: '<=', value: 200 },
  vte: { operator: '>=', value: 500 },
}
```

#### ❌ Compound with no reset_between when the children's manipulations interfere

If child 1 says "raise rate 50%" and child 2 says "lower rate 50%", `reset_between: true` is mandatory. Otherwise child 2's baseline is child 1's endpoint, and the math doesn't work.

#### ❌ Tracker that satisfies on the first breath

A passive patient on default settings already satisfies "plateau < 35" — the learner has done nothing. Always pick targets that *require an intervention*. Outcome targets must be *outside* the preset state.

#### ❌ Recognition that uses readout names as MCQ options

The on-screen tile shows "PIP". The MCQ option says "Peak airway pressure." Same thing, different word. Confusing. *Always* use the tile label verbatim, or use `click_targets` instead.

#### ❌ Acknowledgment MCQ that says "What happened?" with only one defensible answer

If the answer is obvious from the question, you've made the learner feel patronized. Either ask something subtle ("How did the *gap* change?") or use the prediction *before* the action via `predict_observe` and skip the acknowledgment.

#### ❌ `sustain_breaths: 1` for an ARDS-protective target

The learner adjusts Vt, sees the readouts blink into range, gets satisfied, and never confirms the state held. Use 5. Always.

---

## Part 4 — Engagement Patterns (the "Khan Academy moves")

These are the specific UX patterns that make the experience feel alive. Every module should use at least three.

### Pattern A — Predict-Observe-Explain

The reading says: "You're about to lower compliance by 30%. Predict: will peak rise, will plateau rise, will the peak-plateau gap change?" The Observe half is hidden behind `awaits_control: 'compliance'`. The moment the learner moves compliance, the Observe half slides in: "Both peak and plateau rose by roughly the same amount. The gap stayed the same because resistance didn't change."

This pattern is mandatory in any module where the equation of motion is being taught (M3, M4, M7, M8). Skipping it is malpractice.

### Pattern B — Click-target recognition

The learner sees a busy display with 11 readouts. The question banner says "Click the reading that shows peak airway pressure." The learner has to *read* the labels and find the right one. Wrong clicks get a specific explanation: "Vte shows expired tidal volume — not pressure. Try another reading."

This is the most engaging recognition pattern we have. Use it whenever the learning objective is *display literacy* (M1, M2). Don't use it when the learning is *abstract* (e.g., "what type of dyssynchrony is this" — that's MCQ territory).

### Pattern C — Outcome-with-live-progress-chip

The learner is told "Set lung-protective ventilation: Vt ≤ 6 mL/kg, plateau ≤ 30, driving pressure ≤ 15, sustained 5 breaths." They adjust controls. The moment all three are in range, a chip appears: "Holding 1 of 5 breaths…" Then "2 of 5…" Then "3 of 5…" Then *success*.

If they slip out of range, the chip resets to 0 visibly. The learner immediately knows what they did.

Use this whenever the task is "achieve a target state and hold it" (M6, M15, M16, parts of M13 and M17).

### Pattern D — Compound-with-step-toasts

For multi-stage tasks. The learner completes step 1; a toast announces "Step 1 of 3 complete — sim reset for the next step." Then step 2 begins.

Use this for compound-strict tasks with reset_between (M3, M4, M5, M7, M8, M10, parts of M9 and M17).

### Pattern E — Confidence micro-wins (Check Yourself)

A 1-question MCQ between Read and Explore. The learner gets it right or wrong, sees the explanation, and moves on. Wrong answers do not block. The point is *one easy, focused checkpoint* between reading and doing.

Use this in foundational modules (M1, M2, M3, M4, M5) and any module where a single concept needs to land before the sim phase makes sense.

### Pattern F — "You did this" debrief framing

The debrief never says "You completed Module X." It says: "You walked PEEP from 5 to 14, found the compliance peak at 11, then brought the patient back to lung-protective Vt." Specific. Their own actions, narrated back to them.

(This pattern is aspirational — implement it incrementally. For v3, the score breakdown + timing footer + key points + track progress strip are the minimum.)

### Pattern G — "Up Next" anticipation

The debrief ends with: "Up next · M5 — Gas Exchange Basics · 15 min" *above* the primary continue button. The learner sees what they're about to start before they click. Friction-reducer.

### Pattern H — Phase momentum animation

When the learner advances from one phase to the next, the workbook column slides in from the right (the `key={phase}` re-mount trick). Quiet, 300 ms, but it gives forward motion. *Don't* add a hero banner overlay — that's what the previous version tried and removed. The slide is enough.

---

## Part 5 — Authoring a Module from Scratch

Use this checklist *every time* a new module is being built. Skipping a step is how you get a module that works for the author and confuses the learner.

### Step 0 — Read the chapter

Before writing any config, read the corresponding chapter of *The Ventilator Book*. Identify:
- The single bedside skill or concept this chapter teaches.
- The 4–6 "Eleven Commandments" or maxims relevant to this chapter.
- The numerical thresholds (e.g., "plateau < 30", "RSBI < 105", "driving pressure < 15").
- The one canonical waveform pattern or display value the learner must recognize.

If you cannot summarize the chapter in two sentences, you cannot write the module. Re-read.

### Step 1 — Write the briefing first

The `briefing` field is the marketing copy. It's also the seed of the whole module. Author it before the trackers.

- **`tagline`** (~50 char): one-line statement of the bedside maxim. ("Slow the rate. Let the CO2 rise. Save the patient.")
- **`overview`** (2–4 sentences): why this matters at the bedside, in voice. Should make the reader want to learn the module.
- **`what_youll_do`** (2–4 bullets): not the learning objectives — the *insights* the learner will leave with. ("The problem is expiratory flow, not lung stiffness." not "Understand obstructive disease.")

If your briefing reads like a syllabus, rewrite it until it reads like a chapter intro from the book.

### Step 2 — Define the hidden objective

What does the learner *do* in Phase 4? Pick one of these archetypes:

| Archetype | Tracker shape | When to use |
|---|---|---|
| **Vocabulary** | compound any-order, several recognitions | M2-style display-reading |
| **Concept demo** | compound strict reset_between, 2-3 manipulations with acknowledgments | M3, M4, M7, M8 — equation-of-motion drills |
| **Algorithm watch** | compound strict, manipulation then outcome then recognition | M9 — "watch what the vent does" |
| **Target state** | single outcome with multiple readouts sustained 5 | M15, M16 — achieve and hold |
| **Stepwise titration** | compound strict, multiple outcome steps | M13 — PEEP staircase |
| **Recognition battery** | compound strict, several recognitions with one final round | M11, M19 — pattern recognition |
| **Decision panel** | single recognition with rich integrated scenario | M18 — extubation decision |

Pick the archetype, then fill in the specifics. Don't invent new shapes unless the existing seven don't cover the case (they almost always do).

### Step 3 — Write the user-facing task

This is the clinical framing the learner reads on the Task Card. It is *different* from the tracker definition.

- **Style A — direct:** name the controls. "Make three changes to the simulator — one to compliance, one to resistance, one to inspiratory flow — and answer a short question after each." (Use in foundational/concept modules.)
- **Style B — clinical:** name the targets, not the controls. "Set this ARDS patient to lung-protective ventilation." (Use in strategy modules.)
- **Style C — recognition (interrogative):** "Name the dyssynchrony pattern in each of these five clips." (Use in recognition modules.)

Pair the framing with `success_criteria_display` — 2–4 plain-language bullets the learner sees on the card. Match the tracker's verifiable conditions, but phrase clinically.

### Step 4 — Write the primer

Three questions. Each previews a concept the Read phase will deepen. *Not* trick questions, *not* "did you read the briefing" questions. They should be answerable by a clinician with vague training but not by a layperson.

Each option gets an explanation. The wrong options' explanations don't just say "wrong" — they say *why a competent person might think this and why it's still wrong*.

### Step 5 — Write the content blocks (Read phase)

Order:
1. **Opening prose** — one paragraph stating the central idea. Use the chapter's most quotable line if it fits.
2. **Callout** — one tip or warning that's the bedside "watch out."
3. **Predict-observe block** — declare an `awaits_control`. The learner moves the control, the Observe half reveals.
4. **(Optional) figure** — ASCII waveform comparison if shape matters.
5. **(Optional) second predict-observe** — for modules with two equation terms (M3, M4).
6. **(Optional) formative** — single MCQ for the check-yourself page if the concept needs a confidence check.

Length target: the read should fit on one screen with minimal scrolling. If you're past three paragraphs of prose, you've written a textbook, not a module.

### Step 6 — Write the explore card

Patient context (1–3 sentences). Each unlocked control with a description and range. Each readout to watch with what it'll tell the learner. 3–5 specific suggestions of things to try.

The suggestions must be *concrete experiments*. "Drop compliance from 50 to 25 and watch what peak and plateau do" is a good suggestion. "Explore the controls" is malpractice.

### Step 7 — Write the hint ladder

Three tiers:
- Tier 1 — friendly nudge naming the *category* of action. ("Try one of the unlocked controls.")
- Tier 2 — more specific. Names the control and direction. ("Lower compliance by 30%. Then check the gap.")
- Tier 3 — `{ hint_text, demonstration?: { control, target_value } }`. The Show Me button runs the demo or auto-answers the active recognition.

Don't write hints that give away the answer at Tier 1. The whole point of a ladder is escalation.

### Step 8 — Write the summative quiz

Five questions. The same shape as the primer. **Different** questions from the primer — never repeat. Each option has an explanation. The summative is post-test: it confirms the learning landed.

Coverage: each question maps to one of the 4–6 maxims from Step 0.

### Step 9 — Write the key points

4–6 plain bullets shown at the end of the debrief. These are the *takeaways* — what the learner should remember in 6 months. Treat them as the module's tagline plus four sentences.

### Step 10 — QA pass

Walk through the module yourself, end to end, twice. Once trying to satisfy the tracker as the author imagines. Once trying to confuse yourself.

**Stop and fix immediately if any of these happen:**

- A primer question is ambiguous (the "correct" answer depends on unstated assumptions).
- The Read phase has prose that describes what's already visible on the sim ("As you can see on the right…" — kill it).
- The Explore card's suggestions can't actually be done with the unlocked controls.
- The tracker satisfies on default settings (the learner does nothing and gets credit).
- The tracker requires an interaction the unlocked controls don't permit.
- The Task Card's success criteria differ from the tracker conditions in a way that misleads.
- The hint ladder Tier 1 gives away the answer.
- A summative question has two defensible correct answers.
- The key points contradict the briefing.

---

## Part 6 — Module-by-Module Spec (Adherence to *The Ventilator Book*)

This is the canonical reference. Every module config must match this spec. Deviations require a written rationale.

The existing 19 modules in `src/modules/` are largely correct. Where I note "fix" or "tighten," prioritize those changes. Where I say "good as-is," leave it alone.

### Track 1 — Foundations (M1–M3)

#### M1 — Why We Ventilate

**Book chapters:** 1 (ventilator role), 2 (initial settings), 5 (oximetry pitfalls), 8 (Type I/II failure).

**Maxims tested:** four indications, set vs measured, the basic display readings.

**Tracker archetype:** vocabulary (compound any-order, 4 recognitions, click-target mode on the sim).

**Engagement patterns:** B (click-target), E (check-yourself once on peak-plateau gap).

**Status:** Good as-is. The click-target recognition for PIP/Vte/PEEP/Rate is the right move.

**Tighten:** the briefing's "what_youll_do" should foreshadow M4's peak-plateau distinction more explicitly. The check-yourself preview is already there.

#### M2 — Vocabulary and the Vent Display

**Book chapters:** 2, 6 (compliance definition).

**Maxims tested:** eight terms (Vt, VE, PEEP, FiO2, PIP, Pplat, I:E, set RR), set vs measured.

**Tracker archetype:** vocabulary (compound any-order, 8 recognitions).

**Engagement patterns:** B (click-target if feasible — currently MCQ); E.

**Status:** Acceptable. Consider migrating the 8 recognitions to click-target mode since they're literally about *reading the display*.

#### M3 — The Equation of Motion

**Book chapters:** 3 (compliance/resistance basics), 6 (Eleven Commandments — esp. compliance & resistance).

**Maxims tested:** P = V/C + R·flow + PEEP. Pure compliance change → both rise. Pure resistance change → gap widens. Flow change → peak only.

**Tracker archetype:** concept demo (compound any-order, reset_between, 3 manipulations with acknowledgments).

**Engagement patterns:** A (mandatory, multiple), D.

**Status:** Good. The any-order is intentional — the three terms are independent.

**Tighten:** the second predict-observe (resistance) currently lives in `content_blocks`. Verify the auto-reveal fires when the learner moves resistance in the read phase. Browser test: read M3, move resistance, confirm Observe slides in.

### Track 2 — Physiology (M4–M6)

#### M4 — Compliance and Resistance

**Book chapters:** 7 (restrictive vs obstructive), 11 (high peak → measure plateau), 19 (parallel rise vs widening gap).

**Maxims tested:** peak-plateau gap as resistance signature. Parallel rise as compliance signature. Static compliance = Vt / (Pplat − PEEP).

**Tracker archetype:** concept demo (compound strict, reset_between, 2 manipulations with acknowledgments).

**Engagement patterns:** A, D.

**Status:** Good. Strict order is correct — compliance first, then resistance, because the *gap* concept needs the unchanged-baseline as anchor.

#### M5 — Gas Exchange Basics

**Book chapters:** 5 (oximetry), 8 (Type I/II failure), 18 (P/F ratio).

**Maxims tested:** shunt vs dead space signatures. V/Q mismatch is FiO2-responsive; pure shunt isn't.

**Tracker archetype:** concept demo (compound strict, reset_between, 2 manipulations with acknowledgments).

**Engagement patterns:** A, D.

**Status:** Acceptable. The use of `compliance` as a proxy for shunt severity is a sim limitation, not a teaching error — call it out in the explore card (already done).

#### M6 — Auto-PEEP and Air Trapping

**Book chapters:** 14, 17 (dynamic hyperinflation), Eleven Commandments on COPD.

**Maxims tested:** flow waveform doesn't return to zero. Lower rate / extend Te. Severe → disconnect.

**Tracker archetype:** target state, two-stage (compound strict: induce auto-PEEP, then resolve it).

**Engagement patterns:** C (mandatory — the chip is what makes this teachable).

**Status:** Good. The two-stage shape is the right call.

### Track 3 — Modes (M7–M12)

#### M7 — Volume Control

**Book chapters:** Eleven Commandments on VC, 11 (peak alarm response), 17 (Vt × flow → Ti).

**Tracker archetype:** concept demo (compound strict, reset_between, 2 manipulations: Vt-to-target-range + I-time shortening, each with acknowledgment).

**Engagement patterns:** A, D.

**Status:** Good.

#### M8 — Pressure Control

**Book chapters:** 20 (PC behavior on compliance change), VC/PC comparison.

**Tracker archetype:** concept demo (compound strict, reset_between, 2 manipulations).

**Engagement patterns:** A, D.

**Status:** Good. The "silent failure" warning callout is essential — keep it.

#### M9 — PRVC and Dual-Control

**Book chapters:** 23 (dual-control failure modes).

**Tracker archetype:** algorithm watch (compound strict, manipulation → outcome → recognition).

**Engagement patterns:** C (progress chip on the PIP-rising step is essential).

**Status:** Acceptable but FRAGILE. The outcome step "PIP must reach ≥ 20 sustained for 4 breaths" depends on the PRVC adaptive PI logic in PlaygroundSim continuing to work. If anyone touches the sim's adaptive code, re-test M9 first.

**Tighten:** add a `console.log` or an in-sim visual cue when the PRVC algorithm ticks up PIP. The learner currently has to stare at a number changing to see the algorithm work.

#### M10 — Pressure Support and Spontaneous Modes

**Book chapters:** Pressure-support discussions; trigger sensitivity; cycle-off.

**Tracker archetype:** concept demo (compound strict, reset_between, 2 manipulations).

**Engagement patterns:** A, D.

**Status:** Good.

#### M11 — Dyssynchrony Recognition

**Book chapters:** Patient-ventilator interaction (referenced throughout).

**Tracker archetype:** recognition battery (5 recognitions in strict order).

**Engagement patterns:** B-but-without-sim-click (the prompts describe waveforms verbally; the sim shows a normal pattern as reference).

**Status:** Acceptable, *but* this is the single weakest module pedagogically because the sim doesn't show the five patterns. Long-term fix: cycle the sim through pre-recorded waveform clips. Short-term: keep the verbal descriptions and add a small ASCII figure block per scenario.

**Add to v3 plan:** investigate whether the sim can be coerced into showing each pattern via clever parameter selection. If yes, that's a major engagement upgrade.

#### M12 — SIMV and Hybrid Modes

**Book chapters:** SIMV weaning discussion, mode-mix concept.

**Tracker archetype:** single manipulation with acknowledgment.

**Engagement patterns:** A.

**Status:** Good. Lean module — appropriate to its content.

### Track 4 — Strategy (M13–M16)

#### M13 — PEEP: What It Does and How to Set It

**Book chapters:** 22 (PEEP hemodynamics), 29 (driving pressure).

**Tracker archetype:** stepwise titration (compound strict: PEEP ≥ 8 → PEEP ≥ 12 → recognition on "best PEEP").

**Engagement patterns:** C (per-step), D, A (predict-observe on PEEP staircase).

**Status:** Acceptable. The "best PEEP" concept is hard to teach in our sim because we don't model PEEP-induced recruitment with compliance peak. The recognition consolidates the concept — keep it.

**Tighten:** the predict-observe block should auto-reveal showing the abstract compliance-vs-PEEP curve. Currently it's a text reveal — add an ASCII figure or simple SVG.

#### M14 — Oxygenation Strategies

**Book chapters:** Mean airway pressure discussion; FiO2 toxicity.

**Tracker archetype:** single manipulation with acknowledgment.

**Engagement patterns:** A.

**Status:** Good.

#### M15 — ARDS-Specific Ventilation

**Book chapters:** 25 (ARDSnet recipe), 29 (driving pressure ≤ 15).

**Tracker archetype:** target state (single outcome: Vt ≤ 6 mL/kg AND plateau ≤ 30 AND DP ≤ 15, sustained 5).

**Engagement patterns:** C (mandatory).

**Status:** Excellent. The 70 kg PBW + compliance 32 tuning is precise — *do not change patient parameters in this module's preset*. The math works exactly because of those numbers.

**Pin:** add a comment in the config flagging "DO NOT CHANGE compliance OR heightInches OR gender — the task's achievability depends on it."

#### M16 — Obstructive Disease Ventilation

**Book chapters:** 14, 17 (asthma/COPD ventilation), Eleven Commandments.

**Tracker archetype:** target state (single outcome: auto-PEEP < 2, sustained 5).

**Engagement patterns:** C.

**Status:** Excellent. Same pinning rule — the resistance value of 28 + rate 22 + Ti 1.0 is tuned to trip auto-PEEP > 2. Don't change without re-testing.

### Track 5 — Weaning (M17–M18)

#### M17 — Weaning Concepts

**Book chapters:** 10 (Eleven Commandments on SBT), weaning discussion.

**Tracker archetype:** algorithm watch / target state (compound strict: switch to PSV → PS ≤ 8 → RSBI < 105 sustained 5 → recognition).

**Engagement patterns:** C, D, B (recognition consolidates).

**Status:** Good.

#### M18 — Extubation Criteria and Failure

**Book chapters:** Cuff leak, post-extubation issues, decision-making.

**Tracker archetype:** decision panel (single recognition with integrated scenario).

**Engagement patterns:** F (aspirational — the explore card lists nine factors; the recognition asks for the integrated call).

**Status:** Good. This is the only module where the sim is decorative on purpose — the teaching is the *judgment*, not a knob.

### Track 6 — Synthesis (M19)

#### M19 — DOPE Troubleshooting

**Book chapters:** All troubleshooting chapters; high-pressure alarm response.

**Tracker archetype:** recognition battery (4 recognitions in strict order).

**Engagement patterns:** B-but-without-sim-click (same limitation as M11 — long-term, cycle the sim through 4 fault states).

**Status:** Acceptable, same critique as M11. The pattern-recognition is the core skill; the sim limitation is the only weakness.

---

## Part 7 — Microcopy & Voice

The single highest-leverage product improvement is *tightening the microcopy*. The shell already supports rotating phrases via `successPhrase()` / `wrongPhrase()` / `continueCTA()` in `microcopy.ts`. Use them.

### The voice rules

1. **Short.** Sentences under 18 words. Compound sentences need a damn good reason.
2. **Active.** Pick a subject. "The vent reduces pressure" not "Pressure is reduced by the vent."
3. **Specific.** "The peak-plateau gap widened to 23 — that's a resistance pattern" not "Good observation."
4. **Mechanical.** Praise should describe *what they did*, not how they feel. "You pushed PEEP to 12 and watched compliance peak" — not "Excellent intuition!"
5. **No hedges.** "It is generally considered that…" — no. "Plateau under 30 keeps the lungs safe."
6. **Owens-isms allowed.** Wry asides and the occasional dry joke ("the lungs themselves will tell you where they're happiest") are *on-voice*.

### The Anti-AI checklist

If your microcopy has any of these, rewrite:

- "Let's dive in"
- "Awesome"
- "🎉" or any emoji that isn't a clinical symbol
- "Don't worry"
- "You've got this"
- "Welcome to your learning journey"
- "Explore the wonderful world of ___"
- More than one exclamation point in a paragraph
- "Pro tip:" (use "Tip:" or just a callout)
- "TL;DR:" (this is a clinical product)

### Where rotating microcopy applies

| Surface | Use rotating phrases? |
|---|---|
| Recognition popup header (correct/wrong) | Yes — seeded by prompt_id |
| Check-yourself feedback header | Yes — seeded by question_id |
| Continue CTA on prompts | Yes — seeded by prompt_id |
| Primary phase-advance CTA | No — use the deliberate per-phase wording |
| Score-card celebration | No — use the breakdown rows |
| Hint ladder text | No — author-written per module |

---

## Part 8 — Anti-Patterns the Code LLM Keeps Hitting

A growing list of mistakes the assistant has made before. Read this every time before writing code.

### A1 — Inventing fields on `ModuleConfig`

The schema is the schema. If you need to add a field, propose it explicitly in a comment, get a human review, then add it to `types.ts` first. Don't ad-hoc fields on individual modules.

### A2 — Reusing prompt_ids across modules

`prompt_id` must be globally unique across modules. Convention: `{moduleId}-{shortname}` (e.g., `M1-peak`, `M11-3`, `M19-2`). Duplicates cause subscriber-mux confusion.

### A3 — Tracker conditions that depend on the preset state

If the preset already satisfies the condition, the tracker fires on the first sim_tick and the learner gets credit for breathing in the chair. Always pick targets *outside* the preset's resting state.

### A4 — Forgetting `reset_between: true` on compound-strict with conflicting manipulations

Child 1 raises rate. Child 2 lowers rate. Without reset, child 2's baseline is child 1's endpoint. The math breaks.

### A5 — Not specifying `sustain_breaths` on outcome trackers

The default is 1. The default is almost always wrong. Use 2 for "transient state check", 5 for "hold state". Never lower than 2 for a graded task.

### A6 — Mixing click-target and MCQ-only options inconsistently

If `click_targets` is set, the `options` array is the *canonical record* (used for telemetry and "Show me" lookup) but is NOT shown to the learner. Make sure the options' `is_correct` flags match the click_targets' `is_correct` flags exactly.

### A7 — Stripping out the live progress chip "because the test passed without it"

The progress chip is for the learner's psyche, not for tests. Never remove it.

### A8 — Inventing new phases

Five phases. Plus the briefing splash. That's it. If you think you need a sixth phase, you don't — you need a sub-phase (like the Read phase's `prose` → `check` sub-flow).

### A9 — Persisting partial progress as "complete"

`quiz_submitted_at` should be set only when the summative is *submitted*. `objective_satisfied_at` only when the tracker actually fires. The shell uses these to decide where to resume; mis-setting them breaks resume.

### A10 — Rendering different scores on different parts of the debrief

Compute the score *once* (in `advanceFromDebrief`), persist it, then read `total_score_percent` and `total_score_letter` from the record on every subsequent render. Recomputing in the render path causes drift between the headline number, the letter, and the breakdown.

### A11 — Drifting between user_facing_task and tracker conditions

The user-facing task says "lung-protective settings." The tracker says `Vte <= 430 && plat <= 30 && drivingPressure <= 15`. The success_criteria_display must mention all three numerical conditions in plain language. If the criteria say "Vt low-ish and plateau reasonable," and the tracker says specific numbers, the learner satisfies one and fails the other.

### A12 — Removing the briefing splash to "save time"

The splash is the only place the learner gets the module's frame. It is one click. Leave it alone.

### A13 — Forgetting to clear `activePrompt` on phase transition

If a recognition popup is open and the learner satisfies the compound by some other means, the popup must close on satisfaction. There's an effect in ModuleShell that does this on phase change; do not regress it.

### A14 — Making the "Next module" CTA the wrong color

The Next CTA in the debrief is in the *current module's track color*, not a generic emerald. The track color is the visual identity of the curriculum branch.

### A15 — Ignoring the long-conversation reminder

When working on this codebase across a long session, the assistant's standards drift toward verbosity and decoration. Periodically re-read the "Three commitments" in Part 0. The product is better when the code is plain.

---

## Part 9 — QA & Testing

### The "smoke test" walkthrough (5 minutes per module)

1. Land on Home. Click the module from the Modules picker.
2. Briefing splash appears. Click Begin. Splash should not reappear later.
3. Primer: answer Q1 incorrectly first, observe explanation, then correctly. Continue.
4. Read: scroll to the end. The CTA appears stickily once past ~70 % scroll. Click it.
5. Check Yourself (if present): answer the MCQ. Continue.
6. Explore: read the card. Move at least one unlocked control. Click Start the task.
7. Try It: deliberately make one wrong move. Watch the hint ladder surface at ~25 s. Dismiss it. Make the right moves. Watch the progress chip / step toasts. Hit satisfaction.
8. Debrief: take the summative. Submit. Confirm score breakdown matches expectations. Click "Review your answers." Click "Continue to next module."

If any of these steps confuses you, the learner will be confused worse.

### The "regression sweep" (15 minutes)

After any non-trivial change:

1. Run the smoke test on M1, M4, M9, M15, M17, M19 (one per track).
2. Confirm Restart works on at least one module.
3. Confirm back-nav via PhaseBadge works on a completed module.
4. Confirm the score formula gives sensible numbers for: perfect run, 1-hint run, 2-reset run, missed-quiz-Q run.

### What tests we don't have but should

The codebase has no automated tests. For v3, low-effort high-value additions:

1. A pure-function unit test for `computeTotalScore()` in `ModuleShell.tsx` — pull it out as a separate module, test it.
2. A tracker simulator: feed `HarnessEvent` arrays into each module's `hidden_objective` and assert satisfaction or not. This catches the "tracker fires on preset" anti-pattern automatically.
3. A schema validator: every `ModuleConfig` must pass a Zod check at build time. Catches missing fields and wrong tracker shapes.

Treat these three as the v3 testing roadmap. They are not optional for a paid course.

---

## Part 10 — How to Use This Document

### For the human (the product owner)

When you ask the code LLM to make a change, paste the relevant sections of this document into the prompt as context. Don't paste the whole thing every time — pick the sections that apply.

- Adding a module? Part 5 + the module-specific spec from Part 6.
- Fixing a tracker? Part 3 + relevant module spec.
- Touching the shell? Part 1 + Part 2 + Part 8.
- Writing microcopy? Part 7.

When the code LLM proposes a change that conflicts with this document, push back: "Section X.Y says ___. Justify deviation or align."

### For the code LLM

When you read this document, read it linearly the first time. Then keep it open as a reference. When you propose code, name the section that justifies the choice.

When you encounter a contradiction between this document and the existing code, flag it. Don't silently align to whichever is more convenient. Often the document is correct and the code has drifted; sometimes the code is correct and the document needs an update. Either way, surface the conflict.

When you don't know what the right behavior is, look here first. If it's not here, ask the human before guessing.

### Versioning

This is v3. Material changes get a new version bump (v3 → v4) with a changelog at the top. Minor edits (typos, clarifications) don't.

The document lives in the repo. It is checked in. Pull requests that change behavior should also update this document if the behavior involved is governed here.

---

*Owens, Will. The Ventilator Book (2021). Quoted in voice throughout. Liability for medical decisions remains with the clinician.*
