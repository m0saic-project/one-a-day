# Critique — 2026-10-09

Scored against `20-brief.md` as amended by the takeover addendum (a 16 s clip,
variants b and c optional). Only variant a exists. Read string by string from
the nine stills and tutorial pages 1-6; `check-registry --json` is clean (24
fingerprints unchanged, none missing or changed).

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 1 | 1 | 2 | 1 | 2 | 1 | 1 | 13/18 | no |

## What each variant gets right / wrong
**a - right.** Every landscape, portrait and square still has the right Ahnentafel
placement: 1 on the left, 2 over 3, 4/5 over 6/7, 8-15, 16-31 father over mother,
every number present, no malformed name or year. Title "CLARA WHITFIELD - ANCESTOR
BIRTHPLACES", subtitle "Fictional sample family - 28 of 31 known", five generation
headers. Legend is exactly Ohio 4 / Pennsylvania 4 / Kentucky 4 / Ireland 4 / Germany 4 /
Virginia 3 / Sweden 3 / New York 2 / Unknown 3 (31). Grey cells are 23, 30, 31.
The 10% still is the reset (blank tiles, names, legend present, nothing coloured), the
50% still is mid-replay (landscape: generations 1-3 coloured, 8, 9, 10 landed, 11-15 and
all of generation 5 blank, GREAT-GRANDPARENTS header tinted; portrait and square the same),
the 90% still is the finished chart. The migration story reads from colour alone. All
renders exit 0, not degraded, durations 16 s, dims right.

**a - wrong (the polish worklist, specific).**
1. `square-90/50/10`, `portrait-*`, `landscape-*`: generation-5 cells. The "1866 - Kentucky"
   meta line is ~9 px at 1080 (the name line ~11-12 px), under the brief's floor
   `max(7, 1.1% of short side)` = ~12 px at 1080. At landscape it is "15/12 px" as the build
   says, not the brief's "about 18 px": generation 5 is the hardest column to read on a phone
   and the T0 meta line there is the smallest text on the page. The build's own polish item
   (a one-line "n Name - year - key" tier at 16:9, where the cells are 358 px wide) is the fix.
2. `portrait-*`: the generation headers are ~10 px ("YOU", "PARENTS"... tiny, sized by the
   longest label "2X GREAT-GRANDPARENTS"), and there is a ~85 px empty band between the
   header strip and the cells (y 245-350) with the leftover centred. Reads as a layout gap.
   Header tint at `portrait-50` is a tall pale box with a tiny label in it.
3. `square-*`: headers ~12 px, the same longest-label sizing; legend takes 3 rows at ~34 px
   while the 16-cell column is at 9 px: legend text is 3-4x the size of the data it counts.
4. `landscape-*`: the legend is two rows (5 + 4) with an empty last slot; the brief said one
   row when it fits (the builder's own note). The legend font is larger than the chart's
   smallest text by a factor of 3 or more.
5. Contract: `cellRelations()` carries `tolerance: 0.08, tolerancePx: 6` where the brief
   promised `tolerancePx: 1`. The builder explains it (the lattice frame is not the paint,
   3840x2160 stress) and asserts the exact spans in a unit test, so it is honest, but the
   contract itself no longer promises an exact tree. Say so in the file header or tighten.
6. Reset (`landscape-10`): unknown cells 23/30/31 look identical to every other blank
   tile, so the reset does not preview which three will stay grey. Fine, but the
   "n unknown" copy is the only cue.
7. `tutorial-6.png` shows only scout and plan (2 phases, $8.60); the build, critique and
   ship are not there yet (the ship phase pastes them, per the build note). It does not
   claim anything false, but as rendered it does not show the phase that made the template.
   `tutorial-3.png`'s third paragraph and the KNOWN WEAK SPOTS list overlap in wording
   (the build says so too). `tutorial-2.png` lists six of seven sources, all opened by the
   scout, and quotes Genea-Musings and DNAeXplained in the evidence's words; it says
   "DNA Painter and the FamilySearch fan chart now colour by country of birth", which the
   scout supports. No source the scout did not open. `tutorial-5.png` is the template at
   defaults (mid-replay, correct).
8. Would a genealogist use it? The scout's community posts a still to Facebook groups; this
   is an mp4 clip whose finished frame is only 8 + 16 percent of the runtime. A "poster" still
   is not offered (frame 0 can be extracted, but the one-line props note does not say so).

## Decision: SHIP a

No fatal condition: exit 0 and non-degraded everywhere, 16 tests that assert real things
(spans, counts, GEDCOM walk, beats, contrast, determinism), all props have defaults, id and
pack tell the truth, the why-tutorial's problem and solution pages hold. The defects above
are legibility and polish, not wrongness. Score 13/18.

## If ship: what a human polish pass should look at first
1. Generation-5 text size at every aspect (a "n Name - year - key" one-line tier at 16:9, a
   floor of ~12 px, drop to name-only before going below it).
2. Portrait: bottom-align the cells, put the lattice leftover above the headers, and size
   the headers by the available height, not by the longest label (short forms
   "2X GGP" / "GGP" when narrow).
3. Legend: one row at 16:9 if the font allows, and cap the legend font to a ratio of the
   chart's smallest text so the legend stops dominating square and portrait.
4. Tighten `cellRelations()` or comment why it is 6 px.
5. Ship phase: paste the full timeline (build, critique, ship) into `tutorial-6` and remove
   the overlap between paragraph 3 and KNOWN WEAK SPOTS on `tutorial-3`.
