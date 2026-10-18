# Critique - 2026-10-18

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|--------|---|---|---|---|---|---|---|---|---|-------|--------|
| a      | 2 | 1 | 2 | 2 | 1 | 2 | 2 | 1 | 0 | 13    | yes (round 1) |
| b      | 2 | 1 | 2 | 2 | 1 | 2 | 2 | 1 | 0 | 13    | yes (round 1) |
| c      | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 0 | 16    | yes (round 2) |
| d      | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18    | no |

## What each variant gets right / wrong

### Variant a (dark datacard, round 1)

**Right:** Renders exit 0 on every canvas; the header band, category badges, points pill and footer make the card immediately readable as a Warhammer 40k BattleScribe share card; text fits on portrait and square; layout rectangles are honest; code is deterministic, uses `ctx.target`, binds every editable rect and enforces printable ASCII.

**Wrong:** Default `pointsUsed` is 815, not the briefed 1995/2000, so the no-input card does not match "Defaults must show". The why-tutorial page 6 omits the build phase and understates cost/tokens by more than 10x. Variant a is also not the pure portrait-rows variant the brief assigned to "a".

### Variant b (light "print checklist" palette, round 1)

**Right:** Same solid geometry as a; the light preset is a credible high-contrast checklist sheet and the red badges/pill still read clearly.

**Wrong:** Same 815/2000 default mismatch and the same truncated tutorial-6 timeline as a. It is also billed as the landscape two-column grid variant in the brief, but it is actually just the light palette variant.

### Variant c (light tournament-checklist palette, revision 1)

**Right:** Defaults now read 1995/2000 across the header pill, footer totals and unit points; text fits on every tested canvas; the layout contract passes; props and validation are tight; the community fit is strong.

**Wrong:** `tutorial-6.png` shows four phases and understates the day's totals because it omits the revision `build (2)` phase that produced variant c. The trace.json at that moment had five phases; `WHY.timeline` had four, so the cost/tokens/calls/wall-time totals were wrong (line 9 - fatal).

### Variant d (default dark datacard, revision 2)

**Right:**
- Renders exit 0 with no degraded flag on landscape, portrait, square and the tutorial (line 1).
- Defaults show a 1995/2000 Adeptus Astartes Gladius Strike Force; header pill, footer totals and unit points all agree, so a stranger sees exactly what the brief promised (lines 2, 5, 8).
- Text fits and remains readable on portrait, square and the small contract canvases; the chips stay inside the rows (line 3).
- Layout rectangles are honest: the header stays in [0,0.26], rows in [0.28,0.88], footer in [0.90,1]; landscape switches to two equal columns, portrait/square keep a single column; row heights and badge sizes are equal within a render; the layout contract passes on all seven contract canvases (line 4).
- Props are typed and bounded; validation fails fast on bad categories, blank lists, out-of-range numbers and non-ASCII copy; every shown field is bound (line 5, 7).
- The niche fit is strong: a clean card a 40k player could drop into a "rate my list" post or tournament check-in (line 6).
- Code uses `ctx.target`, contains no `Math.random` or clock reads, shrinks text before placing it, and keeps all default copy ASCII (line 7).
- `tutorial-2.png` names the sources the scout actually opened and quotes them in their own words; `tutorial-3.png` describes what this variant does (two-column landscape, portrait list, factual design); `tutorial-5.png` is the template at defaults; `tutorial-6.png` lists six phases with totals that match `trace.json` at the time variant d was built (line 9).

**Wrong:**
- On the landscape two-column still the default HQ's `enhancement:"Artificer Armour"` chip is dropped while the warlord and model-count chips remain. The fallback is documented in `30-build.md` and the chip is visible in portrait and square, but a user who only edits the landscape render might miss that the enhancement is hidden.

## Decision: SHIP d

## If ship: what a human polish pass should look at first

Consider keeping the enhancement chip on the default HQ row even in landscape two-column mode. The current fallback drops it before the warlord chip, which is safe but means the default roster silently loses a prop on the aspect most users will screenshot for wide posts. Either shorten the default HQ name, swap the drop order so the warlord chip yields before the enhancement, or widen the model-count chip slightly less aggressively. The rest of the card is ready.

## Revision 2: what the earlier verdict asked for, and whether it is there

- **Tutorial-6 shows all phases with real trace numbers:** Yes. The page now lists six phases - scout, plan, build, critique, build (2), critique (2) - with totals of 281 tool calls, 18.8M tokens, $5.07 and ~2h 11m wall time. These numbers match the `trace.json` that existed when variant d was rendered: 34+12+120+35+45+35 = 281 calls; 789080+348037+13377587+891071+2626314+735252 = 18,857,341 tokens; $0.252+$0.122+$3.501+$0.267+$0.687+$0.240 = $5.07.
- **No false claim about timeline source:** Yes. The page explicitly says "numbers from the runner's trace (journal/<date>/trace.json)" and "cost as reported by the agent CLI", and the `WHY.timeline.source` is `"runner"`.
- **Default points still 1995/2000:** Yes. The header pill, footer totals and unit points all read 1995/2000 in the d stills, and the test still asserts this.
