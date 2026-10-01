# Critique — 2026-10-01

Template: `@one-a-day/sports/swim-time-drop-card/v1`. Three variants, one idea
apart: a = bars in percent of the entry time, b = bars in seconds, c = a with
each bar's percent printed at its end. I looked at every still in
`variants/<x>/stills/`, the stress renders in [`scratch/`](scratch/), the
three `report.json`, the source and test of each variant, and re-ran the gate
and the suite on what is in place (c).

What I checked myself, not taken from `30-build.md`:

- `report.json` for a, b, c: every render exit 0, `degraded: false`, probe
  dims match (1920x1080, 1080x1920, 1080x1080), tutorial 1280x720, 59 s.
- `src/sports/swim-time-drop-card/v1/` is byte-identical to
  `variants/c/src/` (template and test).
- `node tools/check-registry.mjs --json`: `ok: true`, 14 of 14 rendered, no
  errors, fingerprints unchanged. The one warning is day 6's audiogram.
- `npx jest src/sports/swim-time-drop-card`: 33 of 33 pass. The tests assert
  real things (bar widths against the numbers from the engine's resolved
  rects, pairwise overlap of every text and tile at the seven canvases from
  1 to 8 rows, 20 named validation errors). None passes by asserting nothing.
- The build phase ran 56 minutes against a 45 minute cap and was cut off
  (`run.json`: `timedOut: true`). It had already written `30-build.md` and
  marked itself done; I found nothing half-written.

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 1 | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 16 | no |
| b | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 0 | 15 | yes |
| c | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 17 | no |

Line 6 is a 1 for all three for the same reason: the recap this replaces is
one team-wide post, and the card is per swimmer with no results-file reader.
A parent can type six rows; a coach with 100 swimmers needs a parser and a
standards lookup that the day does not deliver. The brief said so; it is
still the weakest line.

## What each variant gets right / wrong (three lines each, specific: which still, which prop)

**a**
- Right: `stills/square.png` reads as a swim meet at a glance: name, club,
  meet, `SCY` chip, six events, two times each, signed drops, four chips,
  `5 of 6 swims faster` / `14.82 s dropped`. `+0.42` is in the same ink as
  the minus rows, with an empty track.
- Wrong: in `stills/square.png` and `stills/landscape.png` the `-0.87` row
  has a longer bar than the `-4.01` row, and the only explanation is the
  25 px footnote at the bottom. A stranger reads that as a bug. That is the
  line-2 point lost.
- The thin strip (13% of the row) is the tidiest of the three, and the
  footnote does name the scale (`the longest is 4.2%`), as the brief asked.

**b**
- Right: `stills/portrait.png`: bar and printed drop are the same unit, so
  nothing needs explaining; the footnote says `seconds dropped; the longest
  is 6.55 s`.
- Wrong on the picture: the 50 Free is a stub (13% of the track) beside the
  200s. The long events win, which is the unfairness the brief set out to
  avoid.
- Fatal: `stills/tutorial-3.png` is variant a's page. It says "bars show the
  share of the entry time dropped ... bar "seconds" is one prop away", and
  `tutorial-4.png` offers `bar "seconds"` as a thing to try, while this
  variant's default IS seconds and `tutorial-5.png` shows seconds bars. Only
  `DEFAULT_BAR` changed between a and b; `WHY` was not updated. The solution
  page describes a default the variant does not have.

**c**
- Right: every percent bar carries its number (`2.7%`, `3.1%`, `4.2%`,
  `3.3%`, `2.3%`), after the bar on the track or inside a bar too long to
  leave room (`4.2%` in dark ink on the accent). In `stills/landscape.png`
  and `stills/portrait.png` a reader can see why `-0.87` outranks `-4.01`
  without finding the footnote. `scratch/c-long-sq.png` (eight rows,
  30-character name, `-1:02.33`, `AAAA` everywhere, NT, DQ, `0.00`,
  `<0.1%`) holds, and so does `scratch/c-long-tiny.png` at 480x270.
- Right: `tutorial-3.png` was rewritten for this variant ("with that percent
  printed at its end") and `tutorial-4.png` says the labels go in seconds.
  `tutorial-2.png` quotes the Wave, CATCC and Maverick pages as the scout
  recorded them, names replaced by `[swimmer]`, and lists exactly the six
  sources `10-scout.md` opened.
- Wrong: in `stills/square.png` the labels are 23 px, the smallest data on
  the card, and 16 px at eight rows; the standard chips sit about 4 px above
  the track. The `description` in the template and in the
  `src/sports/registry.ts` row still says "a bar whose scale the footnote
  names", which was true of a: c's footnote names the unit and the labels
  carry the numbers. `BAR_LABELS = true` leaves variant a's branches in the
  file as dead code.

## Shared, checked against the brief's own rubric

1. Renders at the three canvases, exit 0, and the square reads to a stranger. Yes.
2. Arithmetic in integer hundredths; defaults give 5 of 6 and 14.82; plus
   sign, no bar, no warning colour (the test checks the ink set); `vs entry
   time` on every card and no "PB" / "best time" (the test greps the drawn
   sources; the scaffold's `who` line was edited to drop "best times"). Yes.
3. Bar lengths proportional to the stated quantity, checked from the
   engine's resolved rects at seven canvases in both modes; `bar` switches
   lengths and footnote together. Yes.
4. One to eight rows, stress copy, emptied lines, seven canvases: swept by
   the contract and by a pairwise overlap test. One or two rows stay rows
   (`scratch/c-one-sq.png`), at the price of an empty middle. Yes.
5. Props are a results row plus `standard`; no page claims the template
   reads `.hy3` / `.cl2` (page 3 says it does not). Yes. The ship note still
   owes the mapping from parsed rows to `swims`.

The layout contract is the one the brief wrote: `textFitsMeasured` on every
text with its own measured width (no widened ruler), the name and the course
chip in the top 35%, summary and footnote in the bottom 35%, every track at
least a fifth of the width, tracks equal in size, a bar present for every
faster swim. No pinned fractions. Every prop has a default; the defaults name
no real person and no age group.

## Decision: SHIP c

c is in place already (`state.json.inPlace` is `c`), so the ship phase moves
no code.

## If ship: what a human polish pass should look at first

1. The description. `description` in the template file and in the
   `src/sports/registry.ts` row (the one hosts and `TEMPLATES.md` show) says
   "a bar whose scale the footnote names". For c that should say each bar
   prints its percent and the footnote names the unit. Fix it in the ship
   phase, before the folder freezes.
2. Page 6 of the tutorial. `WHY.timeline` holds scout and plan only (8 min,
   $5.91). The build took 56 minutes and overran its cap. The ship phase
   must copy the full trace in, or the page understates the day.
3. The square at six to eight rows: 23 px and 16 px labels, chips 4 px above
   the track. Readable, but it is where the card is tightest, and 1080x1080
   is the hinted canvas.
4. `BAR_LABELS`: a module constant that is always `true`. The untaken
   branches (variant a's thin strip and footnote) ship as dead code and
   freeze with the folder.
5. The ship note owes two things from the brief: the `.hy3` / `.cl2` row to
   `swims` mapping (it is drafted at the end of `30-build.md`), and a plain
   sentence that someone else has to parse the file and look up standards.
6. Portrait with six rows leaves a 100 px empty band above the summary rule
   (the row cap); with two rows half the square is empty. The brief chose
   that over slabs. A human may disagree.
