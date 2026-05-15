# Blocked on sim primitives

The curriculum specs call for sim capabilities not yet built (or only
partially built). Each entry below names the affected modules, what the
spec asks for, what's implemented instead, the user-visible cost, and an
estimated effort to close the gap.

When you author a module that needs a capability the sim doesn't have
yet, **add an entry here and a one-line reference comment in the module
file** (`// [BLOCKED-SIM]: see docs/BLOCKED_SIM.md §<n> ...`). Don't bury
verbose JSDoc paragraphs in module files — they accumulate silently and
nobody reads them.

---

## 1. PINSP swing detection (M9 — PRVC)

**Spec asks for.** A long-term tracker shape called `PinspSwing6`: the
range of inspiratory pressure delivered over six consecutive breaths
when the sim runs with a strong-drive perturbation. M9's pedagogical
climax is the yo-yo failure mode — PRVC's adaptive PI loop ramps PINSP
up and down breath-to-breath when the patient pulls hard against it.
Without `PinspSwing6`, the sim can't surface the yo-yo as a live
readout the tracker can grade.

**Implemented instead.** The Try-It uses an implementable proxy: drop
compliance → PIP climbs (the adaptive loop ramps PINSP to maintain Vt).
The module exposes mode-switching so the learner's correct response —
switching out of PRVC into VCV or PCV — is still scored. The yo-yo
failure mode lives in the read phase as prose + a callout.

**User-visible cost.** A novice told "this is the failure mode" without
seeing it learns nothing durable. The most interesting content in the
module is read-only.

**Estimated effort.** Medium. Requires: (1) a scripted strong-drive
perturbation that toggles between breaths; (2) a moving-window stat in
the metrics pipeline that tracks max−min PINSP over a sliding 6-breath
window; (3) a tracker primitive that observes that stat. Per-module
curriculum review may relocate this content to M8 as a "dual-control
variant" (see Fix 5 from the engineering review) — if that lands, this
limitation becomes moot.

Spec refs: `docs/MODULE_SPECS_v3.md` §M9, `docs/MODULE_SPEC_UPDATE_v3.1.md`
§6, `docs/MODULE_SPECS_v3.md` Appendix A.

---

## 2. Live dyssynchrony rendering (M11)

**Spec asks for.** Live perturbations that physically alter the waveform
in real time — ineffective triggering (small negative pressure dips
with no breath delivery), double triggering (a second breath stacks on
top of the first), flow starvation (inspiratory pressure scoops
downward as patient demand exceeds set flow). The pedagogical point of
M11 is *waveform recognition* — pattern matching at 3 AM.

**Implemented instead.** Five static SVG clips at `/public/clips/` with
a SMIL `<animate>` sweep cursor crossing each panel every 6 s, giving
the static traces a "live monitor" feel. The three scored patterns
(ineffective, double, starvation) plus two reference patterns (reverse
triggering, premature cycling) are authored. Recognition prompts embed
the clip via the new `clip_src` field on `InlinePromptConfig`. The
sweep cursor is the only motion — the underlying trace is static.

**User-visible cost.** A novice trained on these clips will recognize
the static signature but may not lock onto the *rhythm* of a real
bedside trace, which is what matters most at the bedside. Animation
authoring is a one-time clinical-author task, not a sim capability.

**Estimated effort.** Low for the upgrade path (re-author clips with
multi-segment SMIL animation that simulates the trace appearing as the
cursor sweeps), but it's a clinical-author effort not an engineering
one. The infrastructure (`clip_src` field + RecognitionPrompt clip
render) is already in place.

Spec refs: `docs/MODULE_SPECS_v3.md` §M11,
`docs/MODULE_SPEC_UPDATE_v3.1.md` §8,
`docs/MODULE_SPECS_v3.2_revisions.md` §3.

---

## 3. DOPES perturbation visual signatures (M19)

**Spec asks for.** Live scripted sim perturbations between the five
DOPES recognition prompts. Displacement → lost ETCO2 waveform + no
chest rise. Obstruction → PIP climbs against steady plateau,
shark-fin ETCO2 capnogram. Pneumothorax → PIP and plateau rise in
parallel + asymmetric chest rise. Equipment → delivered Vt vs returned
Vt gap. Stacking → expiratory flow doesn't return to zero. Each
scenario starts from a clean baseline.

**Implemented instead.** The `PerturbationSpec` API + `applyPerturbation`
/ `clearPerturbations` channel on `ScenarioHarness` (v3.2 §9). The
five scenarios are scripted: displacement zeros Vte and ETCO2;
obstruction spikes resistance; pneumothorax drops compliance and SBP;
equipment subtracts mL/breath from Vte; stacking pushes the rate up.
`reset_between: true` clears each perturbation before the next prompt.
The ETCO2 waveform itself is NOT rendered (only the numeric readout),
no chest-rise indicator, no capnogram trace. The numeric signatures
ARE diagnostic — Vte → 0 and ETCO2 → 0 for displacement, widening
PIP–Pplat gap for obstruction, etc.

**User-visible cost.** Some scenarios (obstruction's shark-fin
capnogram, pneumothorax's asymmetric chest rise) lose their canonical
diagnostic visual. The learner reads numbers instead of recognizing a
waveform shape. The recognition prompts have the same five options
each time, so a learner can pattern-match by elimination if the
numeric signature is ambiguous.

**Estimated effort.** Medium-high. ETCO2 capnogram trace = a fourth
waveform panel in `PlaygroundSim` with its own segmented path
generation. Chest-rise indicator = a small SVG diaphragm view that the
sim re-renders each breath. Both are bounded but non-trivial.

Spec refs: `docs/MODULE_SPECS_v3.md` §M19,
`docs/MODULE_SPEC_UPDATE_v3.1.md` §16,
`docs/MODULE_SPECS_v3.2_revisions.md` §9.

---

## 4. Mandatory vs spontaneous tidal volume readout (M12 — SIMV)

**Spec asks for.** Separate readouts for the mandatory-breath tidal
volume and the spontaneous-breath tidal volume in SIMV mode. M12's
classic failure mode is a weak patient pulling sub-dead-space (~150 mL)
spontaneous breaths between mandatory breaths sized at 450 mL. The
single Vte readout averages or shows the most-recent breath, masking
the asymmetry.

**Implemented instead.** The current sim exposes only `vte` (the
most-recent delivered breath, regardless of which kind). The M12
tracker uses the implementable proxy — set `psLevel` to 8–14 + `vte`
≥ 320 sustained for 5 breaths — which captures the same teaching point
(adding PS rescues the spontaneous breaths). The TaskCard framing is
honest about the limitation: "When the Vte chip holds steady at or
above 320, both the mandatory AND the spontaneous breaths are in
target."

**User-visible cost.** The visual contrast that makes the failure mode
striking at the bedside (a 450 / 150 / 450 / 150 / … pattern on the
Vte trace) isn't visible on the sim. The learner has to trust the
teaching point rather than see it.

**Estimated effort.** Medium. Requires the metrics pipeline to track
mandatory and spontaneous Vte separately + a small UI change to surface
both in the readout strip.

Spec refs: `docs/MODULE_SPECS_v3.md` §M12,
`docs/MODULE_SPEC_UPDATE_v3.1.md` §9.

---

## 5. Prone-position sandbox toggle (M14 — Oxygenation Strategies)

**Spec asks for.** A `prone: boolean` sandbox toggle in the M14 explore
card that drops the effective shunt fraction (modeling the recruitment
that prone positioning provides). The escalation ladder (FiO2 → PEEP
→ mean airway pressure → prone) is taught as a list; the prone step is
the only one that can't be exercised on the sim.

**Implemented instead.** The teaching is preserved in the read prose
and the v3.2 §5 ladder predict_mcq. The recognition prompt added in the
novice-pass §14.1 forces the prone decision once. The sim does NOT
model a separate prone state independent from the existing
`shuntFraction` patient parameter.

**User-visible cost.** Low. The learner sees the ladder, makes the
decision once, but doesn't get to *do* the proning hands-on.

**Estimated effort.** Low. Add a `prone` patient flag that scales
shuntFraction down by ~30 % when true; add the toggle to the M14
explore card UI.

Spec refs: `docs/MODULE_SPECS_v3.md` §M14,
`docs/MODULE_SPEC_UPDATE_v3.1.md` §11.

---

## Resolved (kept for history)

### ~~SBP guardrail readout (M13 — PEEP)~~ — resolved in v3.2 §4

**Originally.** The spec called for an `sbp` derived readout that
flashes red when overshoot PEEP tanks venous return. The sim didn't
expose SBP, so the hemodynamic ceiling lived in the read prose only.

**Resolution.** v3.2 §4 added the `sbp` derived readout to the ABG
computation pipeline, surfaced it as a `NumericCard` in the readout
strip (with rose flash under 95), and updated the M13 tracker to gate
on `sbp ≥ 95`. The marginal-baseline patient (`bpSys: 105`) gives the
right hemodynamic headroom for PEEP 10–12 but breaks at PEEP 18+. The
explicit SBP-guardrail teaching block was added in the novice-pass
§13.2.
