# Build — 2026-09-29

Four build calls. Call 1 (25 min) hit the account's five-hour session limit
right after its first render. Calls 2 and 3 were refused at once. The
maintainer restored the tree and resumed the day at build (call 4,
`context.md`). Everything below the "call 1" note was done in call 4, under
m0saic 0.3.0.

## Template: @one-a-day/gaming/crossword-grid-card/v1

Construction (call 1). The brief asked for Recipe 3: a `grid()` with
index-aligned overlay grids for fills, letters and numbers. The gate's
`costBudget` caps a render at 400 frames and 400 sources, and a 15x15 drawn
per cell is 225 fills + ~190 letters + ~70 numbers. So the board is layers,
not cells:

- paper: one tile under the board;
- theme: one tile masked (inline-mask) to the theme cells;
- ink: one tile masked to "board minus paper cells", which gives the border,
  the rules and the blocks in one path;
- rings: one tile masked to the circled cells' annuli (plus a knockout
  behind a clue number that sits on a ring);
- letters and numbers: glyphs in multi-layer svg text sources, each glyph
  placed by a pixel `xExpr`/`yExpr` on the same lattice.

The cell lattice is integer lines `X_k = round(x0 + k*pitch)` that every layer
reads, so cells are equal within 1 px and no split count depends on the grid
size. Every size from 3 to 25 each way is supported, including the primes
13, 17, 19 and 23, with no `lattice.allow` and no fallback.

## Variant a — highlighter fill (baseline) · gate: clean · doctor 0.3.0: clean · render: ok · stills: the solved 7x7 with amber theme rows, rings, corner numbers, caption under / beside / around it

Three fixes went in during call 4. None changes the idea, so a was
re-rendered in place (`variants/a/`, last at 15:32Z with the review fixes below).

- **bindingsDeclared (0.3.0 doctor error on grid, themeEntries, circles,
  date, themeColor): fixed by binding, not by declaring.** The board ink tile
  carries `bindProps` [grid, themeEntries, circles, themeColor]. Grid comes
  first, so it is what a double-click opens. The teaser board offers only
  grid and circles, because it shows nothing else. Each theme-list id cell
  (`9A`) binds ITS token of the raw `themeEntries` string (`bindPropRange`
  with a `focus`), and the list swatches bind `themeColor`. The caption line
  is now three cells (publication, date, the rest), so `date` has its own
  handle and the derived `| 7x7 | solution` stays unbound. This follows the
  brief's "never bind the composite meta line" while still meeting the new
  roll call. Doctor: "meets 0.3.0", 0 errors, 0 warnings
  (`logs/doctor-call4-final.json`). The test asserts the full roll call.
- **OVERLAY_CHAIN_DEEP.** The first 21x21 stress render warned "an overlay
  chain 37 deep (threshold 20) with inline masks riding it. Past ~25 nested
  overlays ffmpeg SILENTLY degrades inline masks". Call 1 drew one text
  source per ROW. Now one source holds every letter and one every number.
  A 25x25 went from 86 sources to 38, the warning is gone, the 21x21 renders
  in 2.0 s instead of 6.4 s, and the board looks the same (compared by eye). The build gate
  does not see this: its `overlayDepth` metric read 13 for the same document.
  The test now pins "one letters source, one numbers source".
- **Stress renders** (`stress/`, props in `stress/*.props.json`, made by
  `stress/make-props.cjs`). All exit 0, not degraded, with no engine warning:
  - 15x15 at 1080x1080: `15x15-1080.png`, 2.0 s. Three 15-letter themes
    tinted, four circles, numbers 1-61. The fill letters are synthetic; the
    three 15s are words.
  - 21x21 at 1080x1080: `21x21-1080.png`, 2.0 s. 8 long themes in two
    sub-columns, numbers to 127.
  - the 15x15 teaser (`solved: false`), plus both grids at 480x270. At
    480x270 the 15x15 drops its clue numbers, as the size ladder says
    (6 px floor).

## Variant b — marked, not filled · gate: clean · doctor: clean · render: ok · stills: white theme cells with a thin pale-amber bar under each theme row

One idea changed: the theme cells stay paper-white, and each entry gets a
`themeColor` bar (0.14 of a cell) along the bottom of an across entry, or
down the left of a down entry, drawn under the rules. The brief's question
was whether a bar still reads at 480x270. At the default `#FFE08A` it does
not. On white it is a faint line at the hint (`stills/square.png`), close
to invisible at 480x270 (`stills/extra-480x270.png`), and lost in a 15x15
(`stills/extra-15x15-1080.png`). A saturated colour would help, but that is
a second idea, so it was not tried.

## Variant c — newsprint · gate: clean · doctor: clean · render: ok · stills: cream cells, charcoal ink, warm-grey theme rows

One idea changed: the palette. Cells are `#F7F3E8`, ink `#2F2F2F`, and the
default theme fill is warm grey `#D5CEC0`. In greyscale
(`stills/extra-square-greyscale.png`, made with ffmpeg for a, b and c) c's
theme rows hold slightly more contrast than a's (grey ~#CFCFCF against
~#E0E0E0). In colour it loses on two counts:

- a grey band is exactly how a puzzle draws its own SHADED squares, which
  is the confusion the brief worried about;
- its list swatches nearly vanish on the page (`#D5CEC0` on `#F2EFE8`).

## Review (call 4)

Variant a got a four-lens review (code correctness, brief compliance, input
stress, tutorial/journal truth). Each medium or high finding went to a
skeptic who tried to reproduce it. Scripts and renders are in `review/`.
Status at 15:16Z:

- CONFIRMED, fixed: in the square layout the teaser widened the title
  column (the split followed `solved` instead of the prop), so the title
  grew and the byline moved. The brief says "Nothing else moves". The split
  now follows `themeEntries`. The test asserts identical caption rects for
  solved true/false at every contract canvas.
- CONFIRMED, fixed: in the square layout at 1080x1080 a title longer than
  ~18 characters shrank on one line instead of wrapping (21 chars 49 px,
  25 chars 42 px, 40 chars 26 px, smaller than the byline). The strip under
  a 0.72-H board is 146 px, too short for two lines at S/20. Now, when the
  title does not fit one line at S/20, the board gives up that second
  line's height (0.72 H -> 0.66 H) and the title wraps first. 25 chars:
  2 lines at 54 px; 40 chars: 2 lines at 50 px, still the largest panel
  text (`stress/long-title-1080.png`). The defaults do not move (fingerprint
  unchanged). Tested.
- fixed (low): the caption's cells sat 2-4x a space apart. The next cell
  now starts one space after the last one's ink.
- fixed (low): the 480x270 stress renders predated the one-source fix, and
  `stress/21x21-480.log` still showed the old `OVERLAY_CHAIN_DEEP`. All
  stress renders were redone with the code in place.
- disclosed (low): no contract `cell` relation. The cells are holes in one
  mask, not rects, so equal cells are asserted in the test from the
  lattice lines (spread <= 1 px).
- disclosed (low, also confirmed by the correctness lens): the theme list
  shrinks with no floor. In the square strip, the brief's own "two
  sub-columns when there are more than four answers" makes a cliff: 4
  answers of 15-21 letters get 19 px, 5 or more get 13 px (15 letters) or
  10 px (21 letters), under the 14 px heading. 8 answers of 25 letters at
  480x270 give 7 px, under the 8 px promise; the brief's stress set stops
  at 21 letters. Choosing the column count by the size it yields, or taking
  height from the board as the long title now does, is the v2 fix.
- disclosed (low): at exactly 4:5 (1080x1350) the portrait header runs
  5 px into the gutter and the board is not full width; at 5:4 the
  landscape board floats. Neither canvas is a contract canvas.
- truth lens (low, fixed):
  - The unbroken `.puz` string only works for SQUARE grids: a 16x25 string
    is 400 characters and reads as 20x20. The solution page, the try line
    and a caveat now say so.
  - The usage page's teaser line is now a real `--props '{"solved":false}'`.
  - The caption quote now ends "... solution * 20260922", as the scout
    recorded it.
  - The board `aspect` contract failed for 25x3, because the ink rect
    includes the border and 0.02 was absolute. It now declares the designed
    shape (lattice + border) within 2%. 25x3 and 3x25 pass at all eight
    canvases.
  - The stress PNGs and logs were all re-rendered with the final code, and
    none has a `[warn]`. The 21x21 board was compared by eye before and
    after the one-source change; no pixel diff was run.
- The correctness and stress lenses finished after the lines above. See
  "Review, second half" below.

## Review, second half (reopened after build was first marked done)

The correctness and stress lenses came back after build had been marked done
at 15:23Z. Build was unmarked, and these were fixed in variant a (in place),
re-rendered and re-checked:

- CONFIRMED, fixed: a canvas under ~400 px with a long theme list (a 21x21
  with 8 answers at 300x300, 240x240, 360x300) crashed the render with an
  anonymous `placeInsetRects: ... overflows rootH`. The list now drops when
  it cannot fit even at 6 px; the board's tint still marks the entries
  (`stress/21x21-tiny-300x300.png`, exit 0). Tested.
- CONFIRMED, fixed: a themeless puzzle (`themeEntries: ""`, routine on a
  Friday or Saturday) left 75% of the landscape column empty under a
  top-pinned title, and ~25% of H empty under the portrait board. Now the
  landscape title block centres above the caption line, and the portrait
  card splits the space evenly around the board with the caption centred in
  its band (`stress/themeless-1920x1080.png`, `themeless-1080x1920.png`).
  This follows the PROP, so the teaser of a themed puzzle still keeps the
  solved card's geometry and its empty list band (the brief's "nothing else
  moves" wins there). Tested.
- CONFIRMED, fixed: no contrast guard on `themeColor`. A navy fill (1.7:1
  against the ink) hid letters, numbers and rings. `render()` now refuses a
  fill under 4.5:1 with the field and the ratio named (the brief's own bar;
  the default is 13.9:1). Tested.
- fixed (low): the teaser re-fitted the caption line for long copy
  ("puzzle" is narrower than "solution"). The line now fits on the solved
  form. The "nothing else moves" test covers the max-length copy too.
- fixed (low): a grid with no entry at all stamped a `cell-number`
  constraint for a source that is never drawn.
- not fixed (low): a 48-character author of wide glyphs (48 x "W") drops
  the byline to 7 px at 480x270. Real names with spaces, or a long handle,
  stay at 8 px or more.
- not fixed (low): the `cell-letter` / `cell-number` textFits are checked
  against the whole-board rect, so they cannot catch a glyph overflowing its
  cell. The test checks the widest glyph against a cell's paper width at
  every size and canvas instead.
- noted (low): the date handle sits on derived text ("| Tue 9/29/26"), and
  neighbouring caption rects overlap by the fit's slack (transparent).

After the fixes: `npm run build` clean, fingerprint unchanged (the defaults
did not move), doctor "meets 0.3.0" with 0 errors and 0 warnings for this
template, `npm test` 182 jest + 54 pipeline tests pass
(`logs/test-call4-final.log`), and variant a re-rendered with the final code.

## Why-tutorial

- Problem page (2/6): quotes the Fiend evidence: the upload names
  (`Screenshot-2026-09-22-213516.png`, `IMG_2411.jpeg`, `grid.png`,
  `wpsol092726.png`), the hand-typed caption ("WSJ * 9/22/26 * Tues *
  "Variety Pack" ..."), and the retyped "THEME ANSWERS:" list. Six of the
  scout's seven opened URLs are listed; the seventh is left to the journal
  link.
- Solution page (3/6): paste the rows, and the card derives the numbers,
  reads the theme answers from the grid, tints and lists them, and writes
  the caption. The one decision is "a few masked layers plus one text
  source for every letter and one for every number, on one integer
  lattice". Caveats: no `.puz` parser, rebus shows its first letter, shaded
  squares not drawn, sizes 3-25, numbers dropped below 6 px, still only.
- Use-it page (4/6): `m0saic make ... -w 1080 -h 1080 -o grid.png`, plus
  `--props '{"solved":false}'` for the teaser; the unbroken `.puz` string
  is offered for square grids only.
- Page 6 shows scout + plan so far; the ship phase re-copies the finished
  trace.

## What was hard

- A green `npm run build` is not a green 0.3.0 doctor, and neither of them
  sees the engine's own overlay chain. Only a real render of a big input
  printed `OVERLAY_CHAIN_DEEP`. Render the stress case, not just the
  defaults, and read the CLI log for `[warn]`.
- `bindingsDeclared` makes a date shown as "Tue 9/29/26" a prop that needs a
  handle. Splitting the caption into cells gave it one without binding a
  composite line. `bindPropRange` + `focus` lets a list cell bind one token
  of a space-separated string prop.
- Glyphs placed by `xExpr`/`yExpr` inside ONE multi-layer text source are
  the cheap way to draw hundreds of letters on a lattice: 1 overlay, not
  hundreds.

## In place now: a

a is in `src/` (byte-identical to `variants/a/src/`), rebuilt, fingerprint
unchanged, doctor clean (`logs/doctor-call4-final.json`). `npm test`: 182
jest + 54 pipeline tests pass with the final code
(`logs/test-call4-final.log`).

Note for the critic: `state.json` still carries `decision: "no-ship"` /
`noShipReason: "build phase did not complete"`. The morning runner wrote
them when the session limit cut build call 1. The resume only clears a
reason that starts with "session limit", so they stayed. They are not this
build's verdict. The build phase left them alone (it only merges its own
keys); critique writes the real decision.
