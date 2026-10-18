# Critique - 2026-10-18

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|--------|---|---|---|---|---|---|---|---|---|-------|--------|
| a      | 2 | 1 | 2 | 2 | 1 | 2 | 2 | 1 | 0 | 13    | yes (round 1) |
| b      | 2 | 1 | 2 | 2 | 1 | 2 | 2 | 1 | 0 | 13    | yes (round 1) |
| c      | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 0 | 16    | yes |

## What each variant gets right / wrong

### Variant a (dark datacard, round 1)

**Right:** Renders exit 0 on every canvas; the header band, category badges, points pill and footer make the card immediately readable as a Warhammer 40k BattleScribe share card; text fits on portrait and square; layout rectangles are honest (two-column landscape split, equal-height rows, square badges, band constraints hold); code is deterministic, uses `ctx.target`, binds every editable rect and enforces printable ASCII.

**Wrong:** Default `pointsUsed` is 815, not the briefed 1995/2000, so the no-input card does not match "Defaults must show". The why-tutorial page 6 omits the build phase and understates cost/tokens by more than 10x. Variant a is also not the pure portrait-rows variant the brief assigned to "a".

### Variant b (light "print checklist" palette, round 1)

**Right:** Same solid geometry as a; the light preset is a credible high-contrast checklist sheet and the red badges/pill still read clearly.

**Wrong:** Same 815/2000 default mismatch and the same truncated tutorial-6 timeline as a. It is also billed as the landscape two-column grid variant in the brief, but it is actually just the light palette variant.

### Variant c (light tournament-checklist palette, revision 1)

**Right:**
- Renders exit 0 with no degraded flag on landscape, portrait, square and the tutorial (line 1).
- The defaults now show a 1995/2000 Adeptus Astartes Gladius Strike Force; the header pill, footer totals and unit points all agree, so a stranger sees exactly what the brief promised (lines 2, 5, 8).
- Text fits on portrait and square; the light palette keeps the red badges and points pill readable (line 3).
- Layout rectangles are honest: bands land in the declared fractions, row heights are equal, category badges are square, and the layout contract passes on all seven contract canvases (line 4).
- Props are typed and bounded; validation fails fast on bad categories, blank lists, out-of-range numbers and non-ASCII copy (line 7).
- The niche fit is strong: a clean checklist sheet a 40k player could drop into a "rate my list" post or tournament check-in (line 6).

**Wrong:**
- `tutorial-6.png` says "4 phases - 1h 42m wall time - 201 tool calls - 15.4M tokens - $4.14", but the final `journal/2026-10-18/trace.json` contains five phases (scout, plan, build, critique, build (2)), 246 calls, ~18.0M tokens and ~$4.83. The revision build that produced variant c is missing from the timeline, so the page does not show the phases that actually ran (line 9 - fatal).
- `30-build.md` claims the timeline was replaced from the runner's trace; the still does not reflect the current trace, so the claim is false (line 9).
- On the landscape two-column still the default HQ's `enhancement:"Artificer Armour"` chip is dropped while the warlord chip remains; this is a legal optional-chip fallback, but a user editing the default roster might not notice the enhancement is hidden in landscape.

## Decision: NO SHIP

## If no-ship: the one thing that would have changed the verdict

Fix `WHY.timeline` to match the final `trace.json`, including the `build (2)` revision phase, and re-render so `tutorial-6.png` shows five phases with the correct total calls, tokens, cost and wall time. The geometry, defaults and community fit are otherwise ship-worthy.

## Revision 1: what the earlier verdict asked for, and whether it is there

- **Default points aligned to 1995/2000:** Yes. The source now defaults to `pointsUsed: 1995`, the six default units sum to 1995, and the header pill, footer totals and unit points in every c still read 1995/2000. The new test asserts this.
- **Tutorial-6 shows all phases with real trace numbers:** Partial. The page now includes the first `build` phase, but it omits the revision `build (2)` phase that produced this variant. The current `trace.json` has five phases; `WHY.timeline` has four. The cost/tokens/calls/wall-time totals on the page are therefore still wrong for the day as a whole.
