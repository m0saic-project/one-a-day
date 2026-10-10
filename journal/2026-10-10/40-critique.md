# Critique — 2026-10-10

The critic ran with no image input (same session, same model), so the judgment
is the prompt's fallback path: `report.json` (exit codes, degraded flags,
probe dims), the variant's source and its flattened layout, the dumped
per-canvas sources (97 per aspect, audited string by string in
`30-build.md`), `node tools/check-registry.mjs --json` (ok, no findings on
this template) and a fresh lint/build/test run. Default stance: no ship.

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 2 | 2 | 17 | no |
| b | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 2 | 2 | 17 | no |

## Variant a (in place) - pencil marks on the dark page

Right: every number the brief tabulated is in the render and well-formed -
holes 1-18, pars (OUT 36 / IN 36), scores (42 / 47), `89` in the accent with
`+17 vs par` beside it, the nines line, the legend - verified per source at
four aspects, identical structure. Thirteen marks sit exactly where the
deltas put them (the birdie ring on 7, double squares on 8, 10, 16, 17, 18),
the five level-par holes carry none, and every binding resolves (course,
tees, golfer, date, accent, 18 pars, 18 scores, nothing rejected). Floors
refuse rather than clip; the sweep holds at all seven canvases for 9-hole,
eagle, ace, long-copy and light cases.

Wrong: the brief's contract section promised "the totals band is a full-width
presence" and the code never declares it - the band's cells do span margin to
margin (the tests pin them inside the margins), but the layout contract says
nothing about it, so the promise is unenforced (line 4). The made page of the
why-tutorial currently lists three phases (scout, plan, build); the ship step
must re-copy the finished timeline or the page under-reports the day (line 9,
by design, but it is not done yet). One style blemish: a vestigial ternary
with identical branches in the golfer cell width.

## Variant b (the paper card)

The same geometry with the light preset as default. Renders clean on all
three canvases; nothing in its structure differs from a. It was never left in
place, and without eyes on the stills the choice between them is a judgement
on principle, not pixels: every sibling card in this repo ships a dark
default, so a keeps the family grid coherent and the light preset stays one
prop away. Recorded, not shipped.

## Decision: SHIP a

17 of 18, no fatal: no degraded render, every test asserts real behaviour,
every prop shows its default, the pack and slug say exactly what it is, and
the tutorial's problem page cites only sources the scout opened.

## If ship: what a human polish pass should look at first

- Declare the totals band (a `minWidthFrac` presence on the nines/total row,
  or a band tile) so the brief's promise is enforced - or accept that the
  band is text and the promise was over-written.
- Eyes on the stills, which this run did not have: the ring stroke weight at
  640x360 (1 px at the smallest mark), the ace's digit over the accent fill,
  and the light preset's strip-frame contrast (#e3e1d8 on #f4f1e8 is subtle).
- The vestigial `both ? cellW(...) : cellW(...)` ternary in the golfer line.
- The timeline page after ship re-copies the trace: it must then carry
  critique and ship, or the day's own card under-counts its making.

## If no ship: the one thing that would have changed the verdict

(n/a - shipped)
