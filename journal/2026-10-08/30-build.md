# Build - 2026-10-08

## Template: @one-a-day/science/astro-integration-summary/v1
New pack `science` (one sentence in the brief: the shelf had nothing for instrument or observation data).
One file, ~1000 lines, one idea: bars on ONE shared scale fixed from the first frame, each bar stacked from one
segment per night, replayed night by night. Props: `target`, `equipment`, `sessions`, `csv`, `filterColors`,
`clipSec`, `footer`, `debugLayout`. 14 unit tests; `npm run build` clean, `npm test` (419 + 61), eslint clean.

## Variant a - the spec: horizontal night-stacked bars on a navy page · gate: clean · render: ok · stills: opened
Opened `landscape-10/50/90`, `portrait-50/90`, `square-10` and the tutorial pages 2, 3, 5.
- landscape-90 (the finished card): "IC 1396 ELEPHANT'S TRUNK", equipment line, hero "15.8 h" + "TOTAL INTEGRATION", three bars
  (Ha red-orange 6.4 h, OIII teal 4.1 h, SII maroon 5.3 h) in alternating tints per night, captions "128 x 180 s" /
  "123 x 120 s" / "105 x 180 s", ruler "N1 09-12 ... N4 09-20" with cell widths proportional to the night's hours, the
  invented-data footer. Ha fills the track, the others are proportionally shorter.
- landscape-10 (reset): all bars empty, every number "0.0 h", ruler cells dim with dim labels. landscape-50 (mid replay): Ha 4.4 h,
  OIII 2.5 h, SII 3.8 h, total 10.7 h, N3 lit blue, N4 still dim - I recomputed all of these from the rows by hand.
- portrait / square restack each row as two lines (name, caption, hours over a full-width track); readable, but the portrait
  has a lot of empty navy above and below the three bars (rows are capped at 0.28 of the narrow side).
- Also rendered (scratch, `scratch/stress`, `scratch/csv`): 8 filters / 30 nights / long names, and a pasted CSV with 3 nights.
  Stress: the 22-character filter name fits (the name column widens to 30%), captions fall back to "715 frames" for mixed
  exposures, the ruler labels only the last night ("N30"; the first cell is under 2 px wide, so its label is dropped by the
  ladder as designed). CSV: nights split correctly, quoted fields read, blank equipment/footer dropped.

## Variant b - palette: a light "observing log" page (paper, dark ink, colours retuned for contrast) · gate: clean · render: ok · stills: opened
Same layout and props. Filter colours darkened (Ha #e4431d, SII #7d1426, OIII #0c8f84, L grey #6b7785), second tint mixes toward
white, current night is amber (the first try, blue, had weak contrast under dark label ink - changed before the final render).
It reads better printed and separates Ha from SII more clearly than a does. Not left in place: the brief's default page is the navy
one and a is the spec; b is a ten-line swap of `THEME` + the palette tables in `variants/b/src`.

Not built: the brief's portrait-first "towers" variant. It is a different geometry, not a swap, and the day's budget went to checking a.

## Why-tutorial: the problem page and the solution page, one line each on what they say
- Problem: two hand-typed acquisition blocks quoted from observatory pages, the Session Metadata plugin already writing one row per frame,
  and an explicit line that no thread asking for this picture was found and AstroBin could not be read (demand inferred).
- Solution: the CSV is the prop (three columns read), one scale fixed from the first frame, bars stacked by night, the clip opens and closes on the
  finished card; weak spots listed (no image, colours are a taste call, a night = any run with no 6 h gap, dual-band filters counted as named).
  Both pages fit without clipping (tutorial-2/3 opened).

## What was hard (two or three lines an author would want tomorrow)
- A child document's own label does not survive the flatten the layout check does: `{ label: "night-ruler" }` reported missing until
  I put an unlabelled-looking page-colour tile with that label under the cells inside the child. Same reason there is no `chart` label.
- `relations: equal` measures the divisor-pitch FRAMES of `placeInsetPieces`, not the inset-recovered tiles: tracks that are exactly 97 px
  tall measured 97..100. It needed `tolerancePx: 4`; the exact equality is by construction (one `trackH`) and in the unit test on the layout numbers.
  The relation also needs 2+ nodes, so it is dropped for a one-filter chart.
- `textFits` merges per label and the widest em wins, so one label for 8 differently shaped names ("OIII" caps vs a 22-char mixed-case name) flagged a
  fitting name. Cells with different copy got their own labels (`filter-name-3`, `night-label-2`).
- Generic exported names (`MAX_ROWS`, `beatsOf`, `buildModel`, `Seg`) collide in the root `export *` of `src/index.ts`; everything exported is `astro`-prefixed.

## Honest weak spots
- The CSV timestamp reader accepts `YYYY-MM-DD[ T]HH:MM:SS[.fff][Z]` and reads `Duration` as seconds. I did not open a real ImageMetaData.csv
  (the scout only has the field names), so a different timestamp format is refused with a message naming the row, not guessed at.
- The hours are drawtext in the machine's font (like the speedrun clip), so pixels are deterministic per machine only.
- Portrait is sparse with few filters; first-night ruler label is dropped when that night is a sliver.

## In place now: a
