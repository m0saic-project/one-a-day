# Critique - 2026-10-18

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|--------|---|---|---|---|---|---|---|---|---|-------|--------|
| a      | 2 | 1 | 2 | 2 | 1 | 2 | 2 | 1 | 0 | 13    | yes    |
| b      | 2 | 1 | 2 | 2 | 1 | 2 | 2 | 1 | 0 | 13    | yes    |

## What each variant gets right / wrong

### Variant a (dark datacard, default)

**Right:**
- Renders exit 0 on landscape, portrait, square, and the tutorial (line 1).
- The card is immediately readable as a Warhammer 40k BattleScribe share card: header band, category badges, points pill, unit rows, footer totals (line 2).
- Text fits on all visible aspects; portrait and square keep the chips readable (line 3).
- Layout rectangles are honest: two-column landscape split for 6+ rows, equal-height rows, square badges, header/footer bands land where the contract says (line 4).
- Props are typed, bounded, and mostly have sane defaults; validation fails fast on bad input (line 5).
- Strong niche fit for r/WarhammerCompetitive rate-my-list posts (line 6).
- Deterministic, uses `ctx.target`, binds every editable rect, enforces printable ASCII, fits text before placing (line 7).

**Wrong:**
- Default `pointsUsed` is 815, but `20-brief.md` table says 1995 and "Defaults must show" a 1995/2000 card (line 2, line 5, line 8).
- Variant labels swapped from the brief: `20-brief.md` calls "b" the landscape two-column layout and "c" the light palette; the build shipped "a" as dark portrait/landscape and "b" as light palette (line 8).
- Why-tutorial page 6 (tutorial-6.png) shows only 2 phases (scout, plan) and claims 1.1M tokens / $0.37. The runner's `trace.json` shows 3 phases ran, 166 calls, 14.5M tokens, $3.88, ~1h 38m wall time. The build phase is missing entirely and the cost/tokens are off by more than 10x (line 9 - fatal).

### Variant b (light "print checklist" palette)

**Right:**
- Same geometry as a, so all the layout, fit, binding, and code-quality positives above apply (lines 1, 3, 4, 7).
- The light preset is a credible high-contrast checklist sheet; red badges and points pill still read clearly (line 2, line 6).

**Wrong:**
- Same default `pointsUsed` mismatch (815 vs briefed 1995) and same why-tutorial timeline omission (line 2, line 5, line 8, line 9 - fatal).
- As a palette variant it is fine, but it is not the "landscape two-column grid" variant the brief planned for "b" (line 8).

## Decision: NO SHIP

## If no-ship: the one thing that would have changed the verdict

Fix the why-tutorial timeline so `tutorial-6.png` shows all phases that actually ran (scout, plan, build) with the real token/cost/wall-time numbers from `journal/2026-10-18/trace.json`, and align the default `pointsUsed` with the brief (1995/2000) so the no-input card matches the promised "Defaults must show". The geometry is solid and the template is otherwise ship-worthy.
