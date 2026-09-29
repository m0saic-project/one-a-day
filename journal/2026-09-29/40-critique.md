# Critique — 2026-09-29

Critic: claude-opus-5-5, one call, no code edited. I looked at variant a's
stills myself: square, landscape, portrait, 480x270 and tutorial pages 2-6.
I also looked at the square stills of b and c, and at
[`stress/15x15-1080.png`](stress/15x15-1080.png) and
[`stress/21x21-1080.png`](stress/21x21-1080.png). Four read-only helpers
checked the rest in parallel: a's stills; b and c against a; whether the
tutorial is truthful; and code plus gate.

The tree as judged, with a in place:

- `node tools/check-registry.mjs --json`: ok, with no finding for this template.
- `m0saic doctor . --json` (0.3.0): 0 errors and 0 warnings for this template.
- jest for this template: 14 of 14 pass.
- `src/gaming/crossword-grid-card/v1/` is byte-identical to `variants/a/src/`.
  `dist/` was built after it (11:32 local, source 11:31).
- `report.json` for a, b and c: every render exits 0 with `degraded: false`
  and probe dims that match the canvas. The tutorial mp4 is 1280x720, 59 s,
  exit 0.
- Every source on the problem page was opened in the scout call
  (`logs/scout-1.jsonl`). The scout fetched the three Fiend posts and puzpy
  itself. Its research agents logged the download page, Crosshare and Exet as
  opened, with quotes.

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 1 | 2 | 1 | 2 | 2 | 1 | 15/18 | no |
| b | 2 | 1 | 2 | 1 | 2 | 1 | 1 | 2 | 1 | 13/18 | no |
| c | 2 | 1 | 2 | 1 | 2 | 1 | 1 | 2 | 1 | 13/18 | no |

Where a point was lost:

- **Line 4 (all three).** The contract is partly hollow.
  - The `cell-letter` and `cell-number` `textFits` are measured against the
    whole board band (`crossword-grid-card.ts:743-746`). The sweep cannot
    catch a glyph that outgrows its cell.
  - The brief's `cell` equal-size relation lives in the test (spread <= 1 px),
    not in the contract.
  - Both are disclosed in `30-build.md`, and the test does check the widest
    glyph against a cell at every canvas.
  - The landscape panel ([`a/stills/landscape.png`](variants/a/stills/landscape.png))
    reads as three islands with two ~320 px voids. The portrait's lower band
    holds a two-line list in its left third.
- **Line 6 (all three).** There is no `.puz` parser.
  - A Fiend reviewer who has just solved in an app has a screenshot in
    seconds. To use this card, they must get the solution string out of the
    file (puzpy) or retype the rows.
  - The uniform look and the tinted, listed theme are real gains over the
    screenshot.
  - A constructor who already has the grid in their own tool is the likelier
    first user.
- **Line 9 (all three).** Three problems in the tutorial, none fatal:
  - [`tutorial-2.png`](variants/a/stills/tutorial-2.png) says "The .puz file
    holding all of it sits on the same site." A .puz does not hold the theme
    ids, which the card makes you type in `themeEntries`. It does not hold the
    caption's publication either.
  - [`tutorial-3.png`](variants/a/stills/tutorial-3.png) says "one text source
    for every letter and one for every number". That reads as one source per
    glyph, the opposite of the design: one source holds all the letters.
  - [`tutorial-6.png`](variants/a/stills/tutorial-6.png) shows only scout and
    plan (2 phases, $16). It is missing the four build calls, including the
    session-limit stop, until the ship phase refreshes it.
  - No page names an unopened source or claims a feature the variant lacks.
- **Line 2 (b and c).**
  - b: at the default `#FFE08A` the bar is a faint line on white, and at
    480x270 it all but disappears, so the theme stops showing. Marking the
    theme is the card's point.
  - c: the warm grey reads as the puzzle's own shaded squares. The cream
    paper nearly merges with the page (about 1.05:1).
- **Line 7 (b and c).** Both were forked at 10:57 and 10:59 local, before a's
  review fixes, and the missing fixes show:
  - They still crash on a canvas under ~400 px with a long list
    (`placeInsetRects ... overflows rootH`).
  - They still shrink a long square title instead of wrapping it.
  - Their `square.png` has a double-spaced caption
    ("Demo Mini  | Tue 9/29/26  | 7x7").
  - `30-build.md` says "one idea changed". That is true of the idea, not of
    the code.

## What each variant gets right / wrong

**a — highlighter fill**
- Right: [`square.png`](variants/a/stills/square.png) reads as a newspaper
  solution grid at a glance.
  - The derived numbers 1-19 match the brief's list exactly.
  - Rings mark DOG and CAT over the amber theme rows, with a knockout behind
    9, 12 and 13.
  - The caption strip "Demo Mini | Tue 9/29/26 | 7x7 | solution" sits under
    the grid.
  - Portrait and landscape hold too: the gutter is 78 px against a 39 px margin.
- Right: the build solved the hard part.
  - The board is layers on one integer lattice, not cells, so every size from
    3 to 25 renders, primes included, with no fallback.
  - The 15x15 and 21x21 stress renders exit 0 with no `[warn]`.
  - A `themeColor` under 4.5:1 is refused, and the error names the ratio.
- Wrong:
  - At Sunday size the theme list collapses. In
    [`stress/21x21-1080.png`](stress/21x21-1080.png) eight answers sit at about
    10 px, under a 14 px heading, next to a ~54 px title. That is unreadable
    once a blog scales the image down.
  - The prop descriptions Make shows read "CrosswordPuzzle title" and
    "CrosswordPuzzle date", a rename artifact (`crossword-grid-card.ts:108,126`).
  - The `date` handle sits on derived text ("| Tue 9/29/26").

**b — marked, not filled**
- Right: it answers the brief's question. A bar is never mistaken for a
  shaded square.
- Wrong: the bar does not read. It is 0.14 of a cell in pale amber: faint at
  1080 and lost at 480x270
  ([`b/stills/extra-480x270.png`](variants/b/stills/extra-480x270.png)).
- Wrong: it runs older code (line 7 above). Its tutorial describes b truthfully
  ("marks it with a bar") but carries the same .puz overclaim.

**c — newsprint**
- Right: it survives greyscale slightly better than a. Theme against paper is
  205 vs 242 in c and 222 vs 255 in a
  ([`c/stills/extra-square-greyscale.png`](variants/c/stills/extra-square-greyscale.png)).
- Wrong: a grey band is how a puzzle draws its own shaded squares, the
  confusion the brief warned about. The cream paper blends into the page, so
  only the border edges the board
  ([`c/stills/square.png`](variants/c/stills/square.png)).
- Wrong: older code, same as b.

## Decision: SHIP a

- a is the variant in place. It clears the build gate and the 0.3.0 doctor,
  and it renders exit 0, not degraded, at every canvas.
- Its defaults show what the brief promised.
- Its test asserts real things: the numbering, the exact bindings, that the
  teaser hides every letter, tint and answer, the size ladder and the cost
  budget.
- Its weak spots are disclosed in `30-build.md`, and none is fatal.

## If ship: what a human polish pass should look at first

1. The ship phase already edits `WHY` to refresh the timeline, so the tutorial
   wording should be fixed in the same pass:
   - The timeline must show the four build calls and the session-limit stop.
   - Replace "The .puz file holding all of it" with what the file holds: grid,
     title, author, circles, not the theme ids.
   - Say "one text source holds every letter, one every number".

   The two "CrosswordPuzzle" descriptions can ride along. Then rerun build,
   test, fingerprints and render.
2. The Sunday theme list ([`stress/21x21-1080.png`](stress/21x21-1080.png)).
   Choose the sub-column count by the text size it yields, or take height from
   the board as the long title already does. A Sunday write-up is where the
   list matters most. This is a v2.
3. The contract should do the per-cell fit check itself: check the glyphs
   against a cell (`hole(0)`), not the board band. Then the build, not only
   the test, would catch a letter that outgrows its square.
4. A `.puz`/`.ipuz` to props converter is what would turn line 6 into a 2 for
   bloggers.

## If no ship: the one thing that would have changed the verdict

Not applicable: a ships.
