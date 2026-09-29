# Brief — 2026-09-29

## The use case (two sentences, from the scout)

Crossword bloggers put a picture of the solved grid at the top of every write-up. On the three [Crossword Fiend](https://crosswordfiend.com/2026/09/21/tuesday-september-22-2026/) daily posts the scout opened, each picture is an OS screenshot or a phone photo of whatever app the reviewer solved in, with a hand-typed caption ("WSJ * 9/22/26 * Tues * "Variety Pack" * Zhoukin Burnikel * solution") and a retyped "THEME ANSWERS:" list, because the picture cannot mark the theme. This card draws the grid from the puzzle file's own fields (the solution rows, the circled squares, title, author), derives the clue numbers, tints the theme entries, and sets the caption line, so every grid on a blog looks the same. With the letters hidden, the same card is the new-puzzle teaser an indie constructor posts.

## The template

- id: `@one-a-day/gaming/crossword-grid-card/v1`. Existing pack: a crossword is a word game (the NYT files its crossword under "Games"), and `gaming` already holds a hobby community's recap card (speedrun-pb-recap).
- title: `Crossword Grid Card` (the scaffold makes it `2026-09-29 · Crossword Grid Card`, tag `day-010`; keep both).
- kind: image (PNG), still. Canvas hint **1080x1080**, the square grid image at the top of a write-up. Landscape 1920x1080 (link and social share) and portrait 1080x1920 (story) must work, as must the seven contract canvases.
- duration: still. No motion, audio, media file or external asset.
- scope: one puzzle per render, from props. No `.puz`/`.ipuz` parser and no clue text. The input is shaped so that the `.puz` solution string pastes in as is (see `grid`).

## Layout

The grid is the hero, a square board. Caption copy goes in a panel whose place depends on the canvas aspect, `a = W/H` from `ctx.target`. The outer margin is about 4% of the short side, and the gutter between board and panel is at least 2x the margin (the day-9 critic marked a 43 px landscape gutter).

- **Landscape** (`a >= 1.25`): the board is a square of side `H - 2*margin` at the left, and the panel is a column filling the rest. Top to bottom the column holds the title block, the theme-answers list and the meta line. Spread these vertically with geometry so the column is not a top-heavy stack over empty space.
- **Portrait** (`a <= 0.8`): the header (title, byline) sits above a full-width board, and the theme list and meta line sit below it. The space above and below the square is then used on purpose. The critic docked sparse portraits on days 5 and 8.
- **Square-ish** (between): the board is on top, centred, with a side of about 0.72-0.76 of H. Below it is a full-width caption strip: title, byline and meta on the left, the theme list on the right (two sub-columns when there are more than four answers). It reads like the blog: picture first, caption under it.

The board looks like a newspaper solution grid. Dark ink shows through thin gaps between cells as the rules, and the outer border is slightly heavier. White cells are paper-coloured; black cells are ink with no text. A **clue number** sits in the top-left corner of each numbered cell, about 0.28 of the cell. The **letter** is caps, centred slightly low, about 0.6 of the cell. Theme cells take `themeColor` as their fill (a fill, not an extra layer per cell). A circled cell gets a thin ink **ring** inside the cell, over the fill and under the letter.

```text
Square (hint)                 Landscape                         Portrait
+----------------------+      +--------------+-----------+      +--------------+
|   +--------------+   |      | +----------+ | Title     |      | Title        |
|   | 1  |2  |3 | #|   |      | |  board   | | by Author |      | by Author    |
|   |    board     |   |      | |  (square)| |           |      | +----------+ |
|   |  (square)    |   |      | |          | | THEME     |      | |  board   | |
|   +--------------+   |      | |          | | 9A  DOG.. |      | | (square) | |
| Title       | THEME  |      | |          | | 12A CAT.. |      | +----------+ |
| by Author   | 9A DOG |      | +----------+ | meta line |      | THEME ANSWERS|
| meta line   | 12A CAT|      +--------------+-----------+      | meta line    |
+----------------------+                                        +--------------+
```

**The panel copy**
- title: the puzzle title, the largest panel text; wraps to at most 2 lines, then shrinks.
- byline: `by <author>`.
- meta line, derived and never typed: `<publication> | <Wkd> <M/D/YY> | <cols>x<rows> | solution`. For the defaults that is `Demo Mini | Tue 9/29/26 | 7x7 | solution`. The weekday is computed from the `date` prop by calendar arithmetic (no clock). With `solved: false` the last field reads `puzzle`.
- theme list: a small heading `THEME ANSWERS`, then one line per theme entry, `<id>  <ANSWER>` (for example `9A  DOGSLED`). The answer is read from the grid, not typed. Each line has a small swatch in `themeColor` so the list keys to the tint. There is no heading when `themeEntries` is empty.

**Numbering is derived.** A white cell gets the next number when it starts an across entry (the left is edge or block, the right is white) or a down entry (the top is edge or block, the cell below is white). Numbers run left to right, top to bottom. This is the standard American rule, and it also numbers British-style grids with unchecked cells correctly.

**Unsolved mode** (`solved: false`), for a constructor's teaser: blocks, rules, numbers and rings stay; letters, theme tints and the theme list are hidden (they are spoilers); the meta line says `puzzle`. Nothing else moves.

**Grid sizes and the lattice.** Each axis takes 3 to 25 cells, and rows and columns may differ (15x16 exists). The cells must be equal to within 1 px on each axis. The lattice gate (`latticeSmooth`) refuses any split count above 12 that is not 5-smooth. The build therefore must:
- 3-12, 15, 16, 18, 20, 24, 25: a single `grid()`, Recipe 3 in `node_modules/@m0saic/knowledge/docs/templates/geometry-recipes.md` (a gutterless grid, with the rules as a `latticeCellInset`; letters and numbers on index-aligned overlay grids of the same shape; the heatmap v2 in `node_modules/@m0saic/templates` is the working precedent).
- 14, 21, 22: nested splits (2x7, 3x7, 2x11). Every factor is 12 or less.
- 13, 17, 19, 23 are primes above 12. Try `lattice.allow` first, with the reason "crossword grid size is content cardinality" (`docs/templates/reference/template-flags.md`). If the gate rejects that, try a 5-smooth outer lattice in half-cell units that centres the grid (17 cells = 34 of 36 slots). If neither is clean, `render()` fails fast for those sizes with a message naming the supported sizes, and the tutorial's caveats and `30-build.md` say so. `weightedSplit` at precision 120 is not acceptable here: 13 into 120 makes cells 9 or 10 units, a visible 11% difference.

## Layout contract (the invariants the build sweeps)

- **Every text fits.** Tag every text source and give each label a measured `textFits` (`textFitsMeasured`). The labels:
  - `cell-letter`: one label for all letters, measured on the widest glyph `W` at the letter size;
  - `cell-number`: one label, measured on the widest number string this grid produces;
  - `title`, `byline`, `meta`, `theme-heading`;
  - `theme-<i>`: one label per list line.

  Fit at `cell * 0.94 - 2px`. Shrink or wrap; no ellipsis, no clipped glyph.
- **The board is the hero and keeps its shape.** Label `board`: `aspect` = cols/rows, and at the defaults (a square grid) at least 0.45 of the canvas width and at least 0.45 of its height at every contract canvas. Label `cell`, relation `equal: "size"` with a tolerance of 0.02 or 1 px. The rules are at least 1 px at every canvas, and `latticeCellInset` reports no clamped edges.
- **The panel never overlaps the board.** Assert it in the test from the resolved rects (the contract has no orientation-aware band). Presence: `title`, `byline`, `meta`, `board`, and, when a theme is set and `solved` is true, `theme-heading` plus every `theme-<i>`.
- **The size ladder, stated now so the ruler never moves.**
  - The letter is about 0.6 of the cell, the number about 0.28 of the cell.
  - Clue numbers are omitted, never shrunk below **6 px**. A 15x15 at 480x270 (cells of about 16 px) shows letters without numbers.
  - Letters are never omitted. They are at least 6 px at every contract canvas for grids up to 21 cells on the long side. 22-25 cells is promised only from 640x360 up.
  - At the 1080x1080 hint, a 15x15 has letters of at least 28 px and numbers of at least 13 px.
  - The panel title is at least 1/20 of the short side at the primary canvases, and no panel text is under 8 px at 480x270.
- **What the test sweeps.** `sweepLayout` at the seven canvases for the defaults and for the stress copy: a synthetic 15x15, a 21x21 and a 25x25 (the letters can be synthetic, since only the default must be real words), a non-square 15x16, the largest odd prime the build supports, a grid with unchecked cells, `themeEntries` at the maximum of 8 with 15-21 letter answers, maximum-length title, author and publication, and `solved: false`.
- **`debugLayout`** (default false) draws the contract over the render. The geometry comes from `ctx.target`.

## Props (name · type · default · what it changes · required?)

Ten props, all optional with the defaults below. An explicit invalid value fails in `render()` with the field named (for a cell, the row and column), never by falling back to the sample.

| name | type | default | what it changes |
|---|---|---|---|
| `grid` | string (multiline, mono) | `PAN#BOW/AGE#ARE/DOGSLED/##AIL##/CATNAPS/OWE#SAT/YES#TRY` | The solution. Rows are separated by `/` or newlines; `#` or `.` is a block; letters are A-Z. An unbroken string whose length is a perfect square is read as a square grid, so the `.puz` solution string (puzpy's `p.solution`) pastes in unchanged. Rows must have equal length, 3-25 each way, with at least one white cell. Lowercase is refused, not coerced. |
| `themeEntries` | string | `9A 12A` | Clue ids (`17A`, `3D`), separated by spaces or commas. Each must exist in the derived numbering. At most 8, no duplicates. Tints those cells and lists them. `""` means no theme. |
| `circles` | string | `14 15 16 28 29 30` | 0-based row-major cell indices, the order the `.puz` circle markup uses, separated by spaces or commas. Each must be a white cell. Draws rings. `""` means none. |
| `title` | string | `Cats and Dogs` | Puzzle title, 1-40 printable ASCII characters. The rect is bound (`bindProp`). |
| `author` | string | `one-a-day agent` | Constructor(s), 1-48 ASCII characters, shown as `by <author>`. |
| `publication` | string | `Demo Mini` | The outlet or series in the meta line, 1-24 ASCII characters. |
| `date` | string | `2026-09-29` | Puzzle date, a valid `YYYY-MM-DD`. Gives `Tue 9/29/26` in the meta line. |
| `solved` | boolean | `true` | `false` hides the letters, tints and theme list for a teaser, and the meta line says `puzzle`. |
| `themeColor` | string (color, `#rrggbb`) | `#FFE08A` | Theme-cell fill and list swatches. It is never used as text ink. Letters stay in ink, and the default gives well over 4.5:1. |
| `debugLayout` | boolean | `false` | Contract overlay. |

Bind only the rects that show a bare prop value (`title`; `author` only if its cell holds the bare name next to a separate `by`). Never bind the composite meta line. Day 2's critic caught composite bindings that Make would overwrite wrongly.

## Beats

Still. A fill-in clip (the entries typing in, then the theme bands lighting up) is a later day's v2.

## Defaults must show: what a viewer sees with no inputs

An original 7x7 themed mini, built and independently checked for this brief (`journal/2026-09-29/scratch/grid-7.mjs`, `verify-7.mjs`: 180-degree symmetry, connected, every entry 3+ letters, standard numbering). The grid is solved, with numbers 1-19 (two-digit numbers show).

```text
P A N # B O W
A G E # A R E
D O G S L E D
# # A I L # #
C A T N A P S
O W E # S A T
Y E S # T R Y
```

- Across: 1 PAN, 4 BOW, 7 AGE, 8 ARE, **9 DOGSLED**, 11 AIL, **12 CATNAPS**, 16 OWE, 17 SAT, 18 YES, 19 TRY.
- Down: 1 PAD, 2 AGO, 3 NEGATES, 4 BALLAST, 5 ORE, 6 WED, 10 SIN, 12 COY, 13 AWE, 14 PAR, 15 STY.
- The two theme entries are tinted pale amber, and the hidden DOG and CAT are circled (cells 14-16 and 28-30). This is the way real puzzles use circles, so rings over a tint get exercised at the defaults.
- The panel shows `Cats and Dogs`, `by one-a-day agent`, `THEME ANSWERS` with `9A  DOGSLED` and `12A  CATNAPS`, and `Demo Mini | Tue 9/29/26 | 7x7 | solution`.
- No real outlet, constructor or published grid appears. `Demo Mini` and the agent byline say it is a demo, and the author credit is true, since agents made the grid today.

## Acceptance rubric (the critic scores against this)

1. **Reads as the solved grid at a glance.** In `square.png` a stranger sees a crossword solution: black blocks, thin rules, small corner numbers, caps letters, the theme marked, and the caption under it. The same holds in landscape and portrait, which use their extra space on purpose (no empty half-panel, no 40 px gutters). The ink is legible in greyscale.
2. **Faithful to the file.** The numbering is derived and correct. The test compares the default to the list above, plus a British-style grid with unchecked cells and a non-square grid. Theme answers are read from the grid. Every validation fails fast with a named field: a ragged row, a bad character, lowercase, a theme id not in the grid, a duplicate id, a circle on a block or out of range, more than 8 themes, a bad date, a non-hex colour, an unsupported size. `solved: false` shows no letter, tint or answer anywhere (test it on the resolved sources). A `.puz`-style unbroken 225-character string renders as 15x15.
3. **Geometry and text hold.** The seven-canvas sweeps pass for the defaults and the stress set in the contract. Cells are equal within 1 px, and the rules are at least 1 px. The size ladder holds (numbers dropped below 6 px, never shrunk past it). The lattice gate is clean, and the supported sizes are exactly what the brief lists, or the disclosed prime fallback. One real render of a 15x15 and a 21x21 at 1080x1080 goes into `journal/2026-09-29/`, has exit 0 and is not degraded. Renders are deterministic.
4. **A blogger could feed it tonight.** Ten props, no JSON. The `.puz` solution string pastes into `grid`, and the circle indices are the file's order. The theme ids are the ones the write-up already lists. The tutorial's usage page gives a real one-liner at 1080x1080 that writes to a neutral path (not `journal/`), plus a `solved=false` teaser example.
5. **The tutorial tells the truth.** The problem page quotes the scout's Fiend evidence: the screenshot file names, the hand-typed caption and the retyped theme list, with only the URLs the scout opened. The solution page describes the variant left in place. The caveats say:
   - there is no `.puz` parser (the rows are pasted);
   - a rebus square shows its first letter, which is what the `.puz` solution string holds;
   - shaded squares are not drawn;
   - which grid sizes are supported.

   Page 6 is refreshed from the final trace at ship.

## Variants worth trying (each ONE idea different)

- **a — highlighter fill (baseline):** theme cells filled with `themeColor` as above.
- **b — marked, not filled:** theme cells stay paper-white, and each theme entry gets a thick `themeColor` bar along the bottom (across) or left (down) edge of its cells. The question: does a fill get mistaken for a puzzle's own shaded squares, and does a bar still read at 480x270? Everything else as a.
- **c — newsprint:** off-white paper, charcoal ink, a warm grey theme fill instead of amber. The question: does colour add anything over the newspaper convention bloggers already know, and which survives a greyscale print? Everything else as a.

All three share the id, the props and the defaults. Build b or c only if a is through the gate. Leave in place the one that best passes rubric line 1 at 480x270 and at the hint.

## Neighbours and planning limits

- **Read for this brief:**
  - `AGENTS.md`;
  - the installed knowledge base, via readers dispatched for this plan: feasibility and quantization, the layout contract, text in templates, geometry recipes (Recipe 3: the grid), construction strategy (`circleMask`), template flags (`lattice.allow`) and DSL complexity;
  - `src/_shared/layout.ts` and `text.ts`;
  - the bird-walk and speedrun neighbours, for fail-fast validation and prop schemas;
  - the official heatmap v2 (`node_modules/@m0saic/templates/dist/m0saic/alpine/heatmap/v2/heatmap.js`), the one grid-of-cells precedent installed;
  - every earlier `40-critique.md`. They set the recurring penalties this brief pre-empts: JSON input friction, portrait emptiness, narrow gutters, composite bindings, a moved ruler, a stale tutorial page 6, more than 10 props.
- **Not verified here:** whether this repo's gate accepts `lattice.allow`. No template in `src/` uses it yet, so the brief gives the build a fallback ladder.
- **Render cost:** a 21x21 has about 580 text sources. The build should time the stress render and write it down.
- **Open risk:** a new template needs circle masks the mask cache does not hold (AGENTS.md's EPERM note). If the cache cannot be written, stop as that note says. Do not swap rings for squares to dodge it.
