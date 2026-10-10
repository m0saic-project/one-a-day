# Brief — 2026-10-10

## The use case (two sentences, from the scout)

Golfers write every round on a paper scorecard - hole, par, strokes - and the
good ones become posts: a photo of the crumpled card, or an app screenshot
locked inside a subscription's social layer. The vendors themselves prove the
moment (TheGrint transcribes scorecard photos with "a team of real humans";
their Scorephoto giveaway pushed golfers to share round pictures on social
media), and no tool turns the numbers into a clean, deterministic,
batchable card.

## The template

- id: @one-a-day/sports/golf-round-scorecard/v1 (pack `sports` exists; no new
  pack)
- title: Golf Round Scorecard (the scaffold prefixes the date)
- kind: image; canvas hint 1920x1080; every aspect must work - the strips
  stack the same way on landscape, portrait and square, only the header and
  totals reflow
- duration: still

## Layout (regions, ratios, what goes where)

```
wide (16:9)                              any aspect: same stacking
+---------------------------------------------------------------+
| JUNIPER LINKS                            dana_h - Oct 10 2026 |  header band ~14%
| White - 69.6/128                                              |
| +------+----+----+----+----+----+----+----+----+----+------+   |
| | HOLE |  1 |  2 |  3 |  ...              |  9 | OUT |      |   strip 1 ~26%
| | PAR  |  4 |  4 |  5 |  ...              |  3 | 36 |      |   (3 rows:
| | SCORE| (5)|  4 |  6 |  ...              |[4] | 42 |      |    hole/par/score)
| +------+----+----+----+----+----+----+----+----+----+------+   |
| | HOLE | 10 | 11 | 12 |  ...              | 18 | IN  |      |   strip 2 ~26%
| | ...                                                          |
| +------+----+----+----+----+----+----+----+----+----+------+   |
| OUT 42 (+6) - IN 47 (+11)      89   +17 vs par                |  totals band ~16%
| (o) 1 under  (oo) 2+ under  [ ] 1 over  [][] 2+ over          |  legend + note ~12%
+---------------------------------------------------------------+
```

- Each strip: a left gutter column (the row labels HOLE/PAR/SCORE), 9 equal
  hole columns, and an OUT/IN column (bold). A 9-hole round renders one strip.
- The score cell carries the mark around its number: a ring for one under
  par, two rings for two or more under, a square outline for one over, two
  for two or more over, a filled ring for an ace (score 1). Par scores are
  plain numbers. Holes and pars are dim chrome; scores are ink.
- Totals band: OUT and IN with their to-par, then the round total large and
  the total to-par beside it (accent when under par or even? no - accent only
  when under par; over par prints in the ordinary ink, as the cubing card
  ruled for a slower average).
- Legend row: mini marks drawn with the same mask machinery, then the
  footnote sentence (9 or 18 holes, par, the invented-round note only in the
  schema, not on the card).

## Layout contract (the invariants the build sweeps)

- every text fits its box - `textFitsMeasured` per cell (the card measures
  every line itself; the floors refuse below S*0.013 for chrome and S*0.016
  for scores rather than clip)
- the strips live in the middle band of the canvas (`within: yFrac` roughly
  [0.2, 0.75] on stacked aspects); the legend/footnote lives in the bottom
  fifth (`within: { yFrac: [0.8, 1] }`)
- every hole column in a strip is the same width as its siblings
  (`equal: "size"` relation across the strip's cells, tolerance 2px); the two
  strips are the same height
- every under/over-par score carries its mark (presence check per mark tile);
  the ace mark is filled (`aspect` on the mark cell optional - marks are
  square-authored)
- the header is the top quarter, the totals band is a full-width presence

## Props (name - type - default - what it changes - required?)

- course - string - "Juniper Links" - the header's first line (bound) - optional
- tees - string - "White - 69.6/128" - the dim line under the course (bound),
  "" removes it - optional
- golfer - string - "dana_h" - right side of the header (bound), "" removes - optional
- date - string - "Oct 10, 2026" - beside the golfer (bound), "" removes - optional
- pars - number[] - the 18 default pars below - one strip per 9; the OUT/IN
  and par totals; the marks derive from score minus par - optional (json
  schema: 9 or 18 items, each 3..6)
- scores - number[] - the 18 default scores below - the numbers and the marks
  (bound per hole) - optional (9 or 18 items, each 1..99, same length as pars)
- accent - string - "#ff8a1f" - the under-par total and the ace mark - optional
- preset - "dark" | "light" - "dark" - page and ink - optional
- debugLayout - boolean - false - dev-only contract overlay - optional

Nine props. The default round is an invented golfer's invented "finally broke
90" round: 89, par 72, one birdie, one double, a triple to finish.

Default pars:  [4,4,5,3,4,5,4,4,3, 5,4,4,3,4,4,4,3,5]  (OUT 36, IN 36, 72)
Default scores:[5,4,6,3,5,6,3,6,4, 7,4,5,3,5,4,6,5,8]  (OUT 42, IN 47, 89, +17)

## Beats

Still image - no beats.

## Defaults must show

A complete 18-hole round a golfer reads in one glance: a course header, two
nine-hole strips with hole/par/score rows, the circle-and-square notation
around the numbers (at least one ring, several squares, a double square),
OUT/IN totals and the 89 +17 headline, and a legend that decodes the marks.

## Acceptance rubric (the critic scores against this)

1. Renders at defaults on every contract canvas, exit 0, no error mosaic; a
   9-hole round and a long-named course also render clean.
2. The defaults SHOW the use case: a stranger sees a golf scorecard; a golfer
   sees their own notation (rings under par, squares over).
3. Text fits and reads at portrait 1080x1920 and square 1080x1080, not only
   1920x1080 - the two-digit scores keep their marks at 640x360.
4. Layout is honest rectangles: hole columns equal within a strip, strips the
   same height, header/totals/legend in their bands, on every aspect; the
   layout contract declares exactly that (no ruler widened to pass).
5. Props are the few that matter, typed, with sane defaults; pars and scores
   are the numbers a golfer already has on the card; a round feeds it in
   seconds.
6. A golfer who just broke 90 would rather post this card than a photo of the
   crumpled paper; a batch of a season's cards renders with one loop.
7. Code quality per AGENTS.md: deterministic, ctx.target only, every prop
   that shows is bound (course/tees/golfer/date/pars[i]/scores[i]), fitted
   copy, ASCII in defaults, floors that refuse rather than clip.
8. The brief was honest: the variant does what this file promised, including
   the marks, the totals math, and the legend.
9. The why-tutorial tells the truth: the problem page quotes the scout's
   evidence (TheGrint's paper-card transcription, the Scorephoto giveaway,
   Golf GameBook's share), the solution page describes what this card does,
   and the timeline page shows the phases that actually ran.

## Variants worth trying (up to 3, each ONE idea different)

- a. Pencil marks (the spec above): every mark in the page ink, shape-only
  semantics - the paper card's soul on a dark page.
- b. Ledger colour: identical geometry, but marks take colour (under-par in
  the accent, over-par in a warm red) beside their shapes - the broadcast
  leaderboard look; legend follows.
- c. Paper preset: the same card on a warm paper background with graphite ink
  (the light preset promoted to the shipped default) - literally the paper
  card, cleaned up.
