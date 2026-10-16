# Critique - 2026-10-16

Reviewed both variants' stills string by string (landscape, portrait, square,
tutorial-1..6), every `report.json`, both `src/` snapshots and tests (11 tests
green on the in-place copy), `node tools/check-registry.mjs --json` (clean for
today's template; fingerprints unchanged), and the WHY literal against
`10-scout.md` and `trace.json`.

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 16 | no |
| b | 2 | 2 | 1 | 2 | 2 | 1 | 2 | 1 | 1 | 14 | yes - tutorial-3 |

Both: exit 0 on all three canvases + tutorial + validate; nothing degraded;
tests assert real numbers (179/63 = 2.84, bar rects = plot x count/16, WUBRG
order, fail-fast by prop name), not just smoke.

## Variant a - baseline

Right:
- Defaults show the whole use case exactly as the brief's "Defaults must show"
  promised - kicker, `BRACKET 3` / `4-0` pills, deck name over the commander
  line with W B R square chips, eight bars (4 10 16 13 9 6 3 2) with counts
  above, `AVG MV 2.84 - 63 SPELLS` (179/63 checks out), four rows, plan footer.
- Layout contract is the brief's own bands and not a widened ruler: chips
  `aspect: 1` in `yFrac [0, 0.30]`, pills in `x[0.55,1]x y[0,0.14]`, body
  `[0.30, 0.86]`, plan `[0.88, 1]`, rows `equal: "height"` (test asserts a
  single row height); portrait stacks curve over highlights inside the body.
- Code is textbook AGENTS.md: `ctx.target`, every drawn string measured
  (`textFitsMeasured`) and ASCII-enforced, `bindProp`/`bindPropPath` on every
  prop-showing rect (binding test asserts `rejected: []`), deterministic
  (render() === render()), fail-fast naming the prop.

Wrong:
- tutorial-6 shows 2 of the 3 phases that ran: the build phase (92 calls,
  11.26M tokens, 75 min wall) is missing although `trace.json` holds it - the
  ship phase must run `node pipeline/lib/trace.mjs --timeline
  journal/2026-10-16/trace.json` and rebuild before `npm run previews`.
- The prop is `manaIdentity`, not the brief's `colorIdentity` (forced: the
  colorProps convention matches `/color/i` and demands isColor + colorPicker,
  a swatch picker over WUBRG letters - documented in 30-build.md, and
  tutorial-4 teaches the real name, but the brief's props table misleads).
- The B pip (near-black on dark) is subtle; worth one look at 480x270 to
  confirm it still reads as a chip and not a gap.

## Variant b - swapped body axes

Right:
- Renders clean everywhere; the horizontal rows do what the brief's variant
  list promised (count at the row end, 4-10-16-13-9-6-3-2 climbing to MV 2),
  longest bar fills the track width, all figures well-formed on all canvases.
- Tiles are honestly equal-sized (`equal: "size"`, tolerance 2px) and the
  bands hold; test adapted correctly (track width, not plot height).
- Same props, same validation, same ASCII/fit discipline as a.

Wrong:
- tutorial-3 is byte-identical to a's and claims "the bars are height-proportional
  to the counts with the tallest filling the plot" - b's bars are horizontal
  rows of constant thickness (its own test says "the longest fills it"). The
  solution page describes a different variant's geometry and never mentions
  the 2-column tile grid that IS b's idea. Fatal per the why-tutorial rule;
  b cannot ship until its WHY is rewritten ("length-proportional rows, the
  longest fills the track").
- Square (and portrait) tile hierarchy inverts: the card name shrinks below
  the note - `the drain` renders larger than the Impact Tremors name at
  square (stills/square.png) - with the `1x` badge floating mid-height beside
  centered wrapped names; less legible than a's rows, as 30-build.md admits.
- Ragged tile composition across formats: single-line names (Skullclamp) sit
  high beside the badge while wrapped names hug it (landscape), so the grid
  never settles into a rhythm.

## Decision: SHIP a

a is the brief's shape done to the letter, verified by hand and by tests;
its two docks are a documented convention-forced prop rename and a tutorial
timeline the ship phase is already tasked to refresh. b is a good experiment
but its why-tutorial contradicts its own render.

## If ship: what a human polish pass should look at first

1. Refresh `WHY.timeline` at ship (`node pipeline/lib/trace.mjs --timeline
   journal/2026-10-16/trace.json`) and rebuild - page 6 must show all three
   phases; the build bar (75 min, $0.25) is the day's biggest and is missing.
2. Reconcile `manaIdentity` with the brief's `colorIdentity` - a sentence in
   the registry description or brief would save a CLI user one failed render.
3. Check the B pip at 480x270; a hairline border if it disappears.
4. Variant c (motion probe) is still open for a clip-native day - the brief
   ruled it out of scope today and that call was right.

## If no ship: n/a
