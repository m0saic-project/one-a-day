# Operator note — 2026-10-02

This day was closed as a no-ship at 09:22 (commit 51fcb01) and is being taken
up again the same afternoon with `--from revise`: the runner of this morning
treated the critic's NO SHIP as the end of the day; since the maintain commit
of 2026-10-02 it is a review the build answers. The tree was put back from
`journal/2026-10-02/rejected/tree.patch` (made after the fact by
`logs/restore-tree.mjs`). The template has no `<slug>.layout.m0` yet: this
morning's build never ran `npm run fingerprints:update`.

A person read this morning's stills and source after the run. What follows is
what they saw that the first verdict (`40-critique.r1.md`) did not name. It is
for the build to fix and for the critic to check in the new stills - all of
it, alongside the missing bars.

1. **Every time is printed with an extra zero.** The stills say `7:045.123`,
   `S1: 2:030.123`, `PB 2:029.456`. `formatTime` pads the seconds to 7
   characters; `SS.sss` is 6. A lap time is `M:SS.sss`.
2. **A faster sector loses its sign.** `formatDelta` prints `+0.667s` for a
   slower sector and `0.667s` for a faster one. The brief writes `-0.667s`.
3. **The defaults tell the opposite story to the brief.** "Defaults must
   show" asks for an improvement run: sectors 1 and 2 faster than PB (green),
   sector 3 slightly slower (red). The defaults render three red sectors and
   a lap 2.667 s slower than PB, because the brief's own prop table
   contradicts its own paragraph. Resolve it in favour of the paragraph, with
   numbers that add up: the three sector times sum to the lap time, the three
   sector PBs sum to the PB, the sector deltas sum to the lap delta. For
   example, a GT3 lap of the Nurburgring GP circuit: lap `1:54.812`, PB
   `1:55.420` (-0.608); S1 `35.104` vs `35.512` (-0.408), S2 `41.236` vs
   `41.561` (-0.325), S3 `38.472` vs `38.347` (+0.125). Say in `30-build.md`
   that the brief's table was overridden and why.
4. **Bad input renders `NaN`.** `parseTimeToMs("abc")` returns NaN and the
   card prints it. The brief's rubric line 5 asks for a validation error:
   every time prop must match `M:SS.sss` or `SS.sss` (seconds below 60) or
   `render()` throws, naming the prop. The six sector props are not even
   type-checked today.
5. **The test asserts almost nothing the brief claims.** It counts sources
   and sweeps the layout. Assert the arithmetic (a known input gives a known
   delta string, sign included), the time format round trip, the validation
   error, and the bars: the larger |delta| has the wider bar, a faster sector
   is green and a slower one red.
6. **The bars.** One per sector row, under or beside the row's text, in the
   empty two thirds of each row band: a dim full-width track and a filled
   part whose width is proportional to |delta| against the largest |delta|
   on the card (so the longest bar fills the track and never leaves it),
   green when faster, red when slower. Solid rectangles are ordinary sources:
   `src/dev/bench-delta/v1/bench-delta.ts` draws its bars that way (its
   `fill(...)` helper near the end of `render`). Tag the bars and put them in
   the layout contract (present, inside their row's band). At 480x270 a bar
   must still be a visible bar: give it a minimum height in pixels.
7. **The footer is centred.** The brief says driver left-aligned, top speed
   right-aligned.
8. **Words follow the picture.** The header comment, the `description` (in
   the template AND in the row in `src/sports/registry.ts`) and
   `WHY.solution` describe what the revised stills show, nothing else.

For the critic: `tutorial-5.png` and the three canvases are where 1, 2, 3, 6
and 7 show or do not show; 4 and 5 are in `src/` of the revised variant.
