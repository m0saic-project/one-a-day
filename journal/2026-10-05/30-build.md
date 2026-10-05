# Build - 2026-10-05

## Template: @one-a-day/music/radio-top-30-chart/v1

New pack `music`, folder `src/music/radio-top-30-chart/v1/`. One template; the three variants share the id and the folder and differ only in two defaults (`lead`, `preset`), so `variants/a|b|c/src/` are the same code with a different `DEFAULTS` line.

Every still named below was opened and read string by string (square, landscape, portrait of each variant; `tutorial-2/3/4` of a), plus six off-default renders in `scratch/build/` (listed under variant a). The 30 markers in the square still were checked one by one against the brief's list.

What the picture is: header (station bold left, computed `TOP 30` in the accent right, week under the station, a full-width accent rule), a grid of equal row cells, a dim footer line. A row is a rank cell (numeral in the accent, marker under it) and two lines: artist bold, then title with the label after it in dim ink at a fixed gap. Rows are told apart by a hairline gap between row tiles, not by alternating tints. Wide canvases are 3 x 10, square and portrait 2 x 15, ranks down the columns.

## Variant a - the uniform grid, dark (`lead: false`, `preset: "dark"`) - gate: clean - render: ok - stills: the brief's "defaults must show", all of it

- Square (1080x1080): `KOAD 91.6 FM`, `TOP 30` in pink, `Week of Oct 6, 2026`, two columns of fifteen, 1-15 left and 16-30 right. Artist 21.3 px, title and label 16.2 px. Row 7's title (`A Field Guide to Leaving Early Without Saying Goodbye`) is complete and visibly smaller than its neighbours, 13.4 px, with `Brass Key` after it; no other row shrank. Markers: `=` at 4 and 9, `NEW` at 5, 12, 20, 29, `RE` at 18; up / NEW / RE in the accent, down and `=` in dim ink. Footer says the chart is a sample.
- Landscape (1920x1080): three columns of ten, artist 26.7 px, title 20.3 px, row 7 alone at 16.5 px. No label near the next column's rank (the gutter is 27 px and every text is inside its own row tile; the test asserts both).
- Portrait (1080x1920): two columns of fifteen at the square's sizes (21.7 / 16.5 px) in rows 103 px tall. It is whole and tidy, and it is airy: see "weak" below.
- Off the defaults, rendered and looked at (`scratch/build/*.png`, props beside them as `.json`):
  - `genre10-square`: a 32-character station, `LOUD ROCK TOP 10`, one column of ten larger rows. Station and chart title shrink together to share the line.
  - `stress29-square`, `stress29-wide`: 29 rows (short last column, `TOP 29`), an 80-character title in row 12 (whole, about 9 px on the square and 11 px wide: small, not clipped), a 40-character label in row 3 at the shared size, `Sigur Ros` with its accent and a `+179` marker, no week line, no footer.
  - `top5-portrait`: five rows without a last-week field: no markers, numerals centred in their cells, rows capped and grouped at the top.
  - `sixteen-wide` (light): 8 + 8.
  - `default-480`: the 480x270 thumbnail. It renders and the gate accepts it; the title line is 5 px and row 7's is under 4 px. Nobody reads it; it is a thumbnail of the same picture, as the brief chose.

## Variant b - rank 1 as a full-width lead row (`lead: true`) - gate: clean - render: ok - stills: a lead row under the rule, ranks 2-30 below it (15 / 14, wide 10 / 10 / 9)

The lead row is one row at a larger scale (1.7 grid rows tall): a big `1`, `+1` under it, `Paper Lanterns`, `Night Bus Home  Tidewater`. It reads first, as intended.

The brief's bar for b was "the 29 rows lose no more than about 10% of their text size at 1080x1080". Measured: artist 21.3 -> 17.8 px, title 16.2 -> 13.5 px, a loss of 16.6%. About 9.6% is the height the lead takes. The rest is the fit ladder: at the smaller cap row 7's title needs only 8% off, which is inside the shared allowance, so every row comes down with it and row 7 is no longer set apart. b fails its own bar on the square and is not left in place.

On the other two aspects b costs the 29 rows nothing (their sizes are bound by the column width there, not the row height), and on the portrait it is the better picture: the lead uses height the grid cannot. `lead: true` stays one prop away.

## Variant c - the light page (`preset: "light"`) - gate: clean - render: ok - stills: variant a on paper

Off-white page, near-white row tiles, near-black ink, the same pink on ranks, title, rule and up markers (the accent as text is pulled 10% toward the ink on the light page so it keeps a 3.6:1 contrast; a pale accent such as `#ffe45c` is pulled further, tested). Everything variant a shows is there and legible; it is the one to print. Not left in place because the brief's default is the dark card and the feed post is the hinted use.

## Why-tutorial: the problem page and the solution page, one line each on what they say

- Problem (`tutorial-2.png`): who (music directors charting a Top 30 to NACC every Tuesday), the chore in the stations' own words (WUVT, WUSC, KWVA's typed row, WDCE's picture post), and plainly that the evidence for a hand-made picture is one station of four; six of the nine source URLs fit the page and it says the other three are in the scout notes. Nothing clips.
- Solution (`tutorial-3.png`): paste lines, get the card (station, counted TOP 30, rank / bold artist / title / dim label, 3 x 10 or 2 x 15), "The default chart is invented", the fit rule as the one decision, and three weak spots (no NACC or Spinitron import, with the typed-line mapping; small type on a square and no pixel floor; no cover art, adds list or paging). Nothing clips.
- Use it (`tutorial-4.png`): the 1080x1080 one-liner and four things to try. It never says the template reads an export.

## Where the build left the brief (the critic should know these)

- **The ladder's numbers.** Shared allowance 15% (brief: about 20%), alone floor 50% of the cap (brief: about 55%). Both moved five points for a reason that shows in the test: row 7 needs 77-83% of its cap depending on the canvas, which straddles an 80% threshold (it would shrink alone on some canvases and drag all thirty rows on others), and at 55% an 80-character title next to a short label is refused on the small canvases. With 15% / 50%, row 7 shrinks alone at all seven canvases and the 80-character title fits at all seven. The margins are still thin: the 80-character row needs 53-57% of its cap, three points above the floor at 480x270.
- **How step 1 is read.** The shared sizes come down only for lines they can catch inside the allowance. A line that needs more than 15% off shrinks alone and costs the other rows nothing. The other reading (the shared size always drops to its floor when any line is too long) would put every default row at 85% because of row 7 and make row 7 indistinguishable, which is the opposite of "defaults must show". The cost of this reading is a step: a line needing 14% off takes all thirty rows with it, one needing 16% off takes none. Variant b on the square is that step, seen.
- **Sizes are not whole pixels.** Font sizes are multiples of 1/64 px. With whole pixels a 480x270 card (5 px titles) fits in 20% steps and the seven canvases stop agreeing on what fits.
- **Title ratio.** Title is 76% of the artist size (the brief's 17 / 22 is 77%); on the square that is 16.2 px, not 17.

## What is weak

- Portrait wastes height. The caps are bound by the column width (so an 80-character title can still fit above the floor), which gives the portrait the square's type in rows twice as tall. A story-first design would be one column of thirty, or a third line for the label; the brief asked for 2 x 15.
- A Top 5 on a portrait canvas fills less than half the card (rows are capped at 11% of the short side and group at the top, as briefed).
- A row that shrank alone is small: the 80-character title is about 9 px on a 1080 square. Whole, not readable in a feed.
- If every row is long, every row shrinks alone to its own size and the columns stop reading as columns. Not seen with realistic copy; the all-long stress case uses identical rows.
- `=` and the down markers are 14 px dim text on the square: correct, quiet.
- The invented names were not checked against real acts or labels.

## What was hard (for tomorrow's author)

- `placeInsetPieces` takes 185 pieces (30 row tiles, 150 texts, the header) without complaint: a render is about 50-140 ms and the m0 about 13k characters; 20 stress cases x 7 canvases run in 17 s. Square tiles need no inline masks; rounded ones would have been 30 masks.
- A fixed gap between two texts of different lengths: a text cell has to be about 2% wider than its ink for `textFitsMeasured`, so the slack grows with the title. The label's x subtracts the title cell's own slack from the gap; without that the long title's label drifts away from it.
- Proportional fit is spoiled by constant pixels: `budget()`'s `- 2px` and every `ceil` are a larger share of a 148 px column than of a 593 px one, so the small canvases need about 5% more room than the large ones. Leave that margin at 1920 or the 480x270 sweep fails.
- Changing a default changes the layout fingerprint: `npm run fingerprints:update` before `npm run build` after every variant switch.

## Gate and tests (with variant a in place)

- `npm run build`: clean. No finding for this template in `node tools/check-registry.mjs --json` (the two warnings the build prints belong to older templates); layout contract holds at the seven canvases; why-tutorial gate passes; fingerprint committed beside the template.
- `npm test`: jest 354 passed in 20 suites (41 of them this template's), pipeline tests 61 passed, exit 0. Log in `scratch/build/npm-test.log`.
- `npx eslint src/music`: no findings.
- The test file asserts variant a's defaults (`lead: false`, `preset: "dark"`), so it was not run against b or c in place; those two passed the build gate on their own, which sweeps the contract at their defaults.

## In place now: a

`lead: false`, `preset: "dark"`. Source in `src/` is byte-identical to `variants/a/src/`. `state.json`: variants `["a","b","c"]`, inPlace `a`.
