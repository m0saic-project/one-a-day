# Ship — 2026-09-29

## @one-a-day/gaming/crossword-grid-card/v1 — Crossword Grid Card

This template makes a still share card of a solved crossword, for the top of
a blog write-up or a constructor's new-puzzle post. It is for crossword
bloggers, such as the Crossword Fiend reviewers, who open every post with a
screenshot or phone photo of the app they solved in, and for indie
constructors who post a weekly `.puz`. The inputs are props:

- from the puzzle file: the solution rows (`grid`, "/" between rows, "#"
  or "." for a block), the circled squares (`circles`, 0-based cell indices
  in the `.puz` order), `title` and `author`;
- typed by hand: the theme clue ids (`themeEntries`, e.g. "17A 38A"),
  `publication` and `date`. No `.puz` field holds these.

The card derives the clue numbers, tints the theme entries and lists their
answers, rings the circled squares, and writes the caption line
("Demo Mini | Tue 9/29/26 | 7x7 | solution"). With `solved: false` it is a
teaser: the letters, tint and answers are hidden and nothing else moves.
Square, landscape and portrait canvases each get their own layout. Grids can
be 3 to 25 cells each way.

## Render it

```
m0saic make @one-a-day/gaming/crossword-grid-card/v1 --template-repo . -w 1080 -h 1080 -o grid.png
```

Props worth trying. Each one was rendered in this phase, into
[`ship/try/`](ship/try/); all exited 0 with no `[warn]`.

- the teaser: `--props '{"solved":false}'`
- another highlighter: `--props '{"themeColor":"#BDE3FF"}'`. A fill under
  4.5:1 against the ink is refused, and the error names the ratio.
- a themeless Friday at link-share size:
  `-w 1920 -h 1080 --props '{"themeEntries":"","circles":""}'`
- a full-size 15x15: `--props @journal/2026-09-29/stress/15x15.props.json`
  ([`ship/try/15x15-file.png`](ship/try/15x15-file.png))

Why it exists (the tutorial):

```
m0saic make @one-a-day/gaming/crossword-grid-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## What the ship phase did

- The pick, a, was already in place, so nothing was copied.
- **The card itself did not change.**
  - The three renders in [`ship/renders/`](ship/renders/) are
    byte-identical to the `variants/a/renders/` the critic judged, and the
    layout fingerprint is unchanged.
  - `variants/a/` is left as it was judged. The shipped state, tutorial
    included, is in [`ship/`](ship/).
- **Words changed**, from the critique's polish list:
  - Tutorial page 2 said the `.puz` "holds all of it". It now says the
    `.puz` holds the grid, title, author and circles, but not the theme
    ([`ship/stills/tutorial-2.png`](ship/stills/tutorial-2.png)).
  - Page 3 said "one text source for every letter". It now says "two text
    sources, one holding every letter and one every number". Its layer
    list now names the number knockouts and no longer calls the paper
    masked, so the "8 at most" adds up
    ([`tutorial-3.png`](ship/stills/tutorial-3.png)).
  - `WHY.timeline` now holds the finished trace: all 7 phase calls, from
    scout to critique ([`tutorial-6.png`](ship/stills/tutorial-6.png)).
  - In Make, the `title` and `date` descriptions read "Puzzle title" and
    "Puzzle date", not "CrosswordPuzzle ...".
  - The registry entry, which feeds the manifest's `description`, still had
    the scaffold's "describe the ONE concept..." placeholder. It now
    describes the card.
- **A read-only review before marking done.** Three reviewers, each followed
  by a skeptic, checked this note's facts, the tutorial's truth and gate
  readiness. They confirmed the layer list, the registry placeholder and
  three slips in an earlier draft of this note. All five are fixed above
  and below.
- **Checks**, run in the order the task gives, and rerun after the fixes:
  - build, previews, build, fingerprints: `npm run build`,
    `npm run previews` (1 minted on the first run), `npm run build`,
    `npm run fingerprints:update` (12 unchanged).
  - `npm run verify` exited 0: lint, 182 jest tests, 54 node tests (44
    pipeline, 10 tools), the contract check and the deps check
    ([`logs/ship-verify-2.log`](logs/ship-verify-2.log)).
  - `m0saic doctor . --json` (0.3.0) returned `"ok": true`, with 0 errors
    and 0 warnings for this template
    ([`logs/doctor-ship.json`](logs/doctor-ship.json)). Its 4 warnings and
    its "lagging" entries all belong to frozen templates.
  - Both `--validate-only` and `--tutorial --validate-only` exited 0.
  - `check-why` was clean.
- **Preview.** [`preview.png`](../../assets/templates/@one-a-day__gaming__crossword-grid-card__v1/preview.png)
  is 1920x1080 and 162 KB. It shows the landscape card at its defaults and
  is byte-identical to `variants/a/renders/landscape.png`. This is an image
  template, so there is no first frame that could come out blank.

## Weak spots (honest; a human polish pass starts here)

- **No `.puz`/`.ipuz` parser.** A blogger has to get the solution string
  out of the file (puzpy's `p.solution`) or retype the rows. They also type
  the theme ids and the circle indices by hand, and counting 0-based
  row-major indices is tedious. An unbroken solution string only works for
  a square grid. This is the main reason the critic gave rubric line 6
  ("would a person in the community use this instead of what they do now")
  a 1: a screenshot still takes seconds.
- **The theme list shrinks at Sunday size.** On a 21x21 with 8 answers, the
  answers are about 10 px under a 14 px heading
  ([`stress/21x21-1080.png`](stress/21x21-1080.png)). In the square layout,
  five or more answers switch to two sub-columns; for answers of 15-21
  letters, the size drops from 19 px to 10-13 px.
- **The landscape card has voids.** The browse card itself shows them. The
  title is at the top, a two-line list in the middle and the caption at the
  bottom, with about 320 px of nothing between them.
- **The layout contract is partly hollow.** The `cell-letter` and
  `cell-number` fits are measured against the whole board, so the build
  cannot catch a glyph that outgrows its cell. Equal cells are asserted
  only in the test.
- **The `date` handle sits on derived text.** The card shows
  "| Tue 9/29/26"; the prop holds YYYY-MM-DD.
- **Not drawn:** rebus squares (only the first letter shows), shaded
  squares, and clue text.
- **Small floors.** A 48-character author of wide letters drops the byline
  to 7 px at 480x270. At 4:5 and 5:4, which are not contract canvases:
  - the portrait header runs 5 px into the gutter;
  - the landscape board floats.
- **A CLI wording issue, not a template one.** When a `themeColor` is too
  dark, the user sees "Error running ffmpeg: ... themeColor #223355 is too
  dark ...". The template's own message is right; the CLI's prefix
  misleads.
- **Tutorial page 6, the timeline:**
  - "build (4)" is drawn red because the trace records that call as timed
    out. The agent first reported done at 11:24, inside the 45-minute cap,
    but a background review was still running, so the process stayed up.
    The runner's SIGTERM at 11:27 did not stop it. The agent then reopened
    the phase, fixed the review's findings, and ended at 11:34 (`END ok`,
    $31.73, [`logs/build-4.log`](logs/build-4.log)). The process exited
    then, 52 minutes in.
  - "2h 34m wall time" includes the 51 minutes between the session-limit
    stop and the resume.
  - This ship phase is not on the page. It was still running when the
    spec was written.

## Follow-ups (what v2 would do)

- A `.puz`/`.ipuz` to props converter, so that the grid, title, author and
  circles come from the file. That is what would make the card faster than
  a screenshot for a blogger.
- Size the theme list properly. Pick its sub-column count by the text size
  it yields, or take height from the board as the long title already does,
  with the heading's size as the floor.
- Check each glyph against one cell (`hole(0)`) in the layout contract, not
  against the board band.
- Fill the landscape panel: a larger list, or give the board more width when
  the list is short.
- Draw shaded squares and rebus cells.
- Make a video teaser that fills the grid in.
