# Build - 2026-10-09

Built by hand in a Claude Code session (Fable 5.1) after the runner's first
build call (Opus 5.5, ultracode) died 23.8 min in on a network error ("API
Error: Can't reach the API server - ENOTFOUND") with nothing but the scaffold
written, and the runner parked for the five-hour window. The founder asked
for the day to be taken over and for a VIDEO ("so many of them have been
images lately"); the scout's pick and the brief stand, amended by the
takeover addendum at the end of `20-brief.md`. Build phase from 12:35 PT
(runner stopped); the session's usage window closed at 13:33 and reopened at
17:32, which is where most of the day's wall clock went.

## Template: @one-a-day/community/ancestor-birthplace-chart/v1
One file, ~1050 lines, one idea: **the geometry is the Ahnentafel.** One unit
of height per generation-5 cell, doubled per generation to the left, so cell
n is exactly the union of father 2n (above) and mother 2n+1 (below) by
construction. Colour is a lookup from the place's last elements (state inside
the home country, country elsewhere); the legend is the same lookup counted.
Props: `title`, `ancestors` (rows "n | Name | year | place [| key]"),
`gedcom`, `root`, `event`, `keyBy`, `homeCountry`, `colors`, `clipSec`,
`debugLayout`. The clip (16 s): 0-8% the finished chart, 8-14% the reset
(blank cells, names already typed), 14-84% the colours landing in Ahnentafel
order generation by generation (10/15/20/25/30% of the replay), then the
finished chart again, so frame 0 is the browse card and the loop point.
Everything that moves is a gated colour tile in one mask-free child document
(31 fills + 5 header tints); every word is static svg text in the bundled
font - no drawtext, so pixels do not depend on the machine's fonts.
16 jest tests (Ahnentafel spans, legend counts, GEDCOM walk with PEDI birth /
ABT dates / a missing parent / pedigree collapse, key folding, refusals by
row and key, beats and gates, pin override, contrast, Other folding, a tier
snapshot per canvas, the seven-canvas sweep over six prop sets,
determinism). `npm run build` clean: the conventions gate, the layout sweep
at the seven canvases and check-why all pass, no overlayDepth warning.

## Variant a - the brief as a clip · gate: clean · render: ok · stills: opened
Rendered one canvas per foreground call with `logs/render-variant-split.mjs`
(the day-4 split of `pipeline/render/render-variant.mjs`): landscape 443 s,
portrait 496 s, square 361 s for a 16 s clip, tutorial separately.
Opened `landscape-10/50/90`, `portrait-50/90`, `square-50/90` and read them
string by string:
- landscape-90 (the finished chart, also frame 0): title "CLARA WHITFIELD -
  ANCESTOR BIRTHPLACES", subtitle "Fictional sample family - 28 of 31 known",
  five columns YOU / PARENTS / GRANDPARENTS / GREAT-GRANDPARENTS / 2X
  GREAT-GRANDPARENTS, cells 1 | 2,3 | 4-7 | 8-15 | 16-31 each with "n Name"
  and "year - key" (generation 5 at ~15/12 px, still legible at 1080p), 23,
  30 and 31 grey "unknown". Father above mother everywhere (2 over 3, 4,5
  over 6,7, 16,17 over 18,19 ...). Legend, two rows: Ohio 4 / Pennsylvania 4
  / Kentucky 4 / Ireland 4 / Germany 4 / Virginia 3 / Sweden 3 / New York 2
  / Unknown 3 - the brief's exact counts, 31 in all. The migration story
  reads from the colours: Kentucky and Virginia lines meet Irish immigrants
  in Ohio on top, German and Swedish lines settle in Pennsylvania and New
  York below.
- landscape-50 (t = 8.0 s, inside generation 4's window 7.28-10.08 s):
  generations 1-3 coloured, cells 8, 9, 10 landed, 11-15 and all of
  generation 5 still blank, the GREAT-GRANDPARENTS header tinted amber. I
  recomputed the landing: (8.0 - 7.28) / 0.35 = 2.06 cells -> 8, 9, 10. Right.
- landscape-10 (t = 1.6 s, the reset): every cell a pale blank tile with its
  name, year and key already on it; the legend already there; no colour.
- portrait-50/90: the same five columns, names wrapping to two lines in the
  200 px columns ("2 Daniel / Whitfield"), legend in three rows, headers
  small (the 2X GREAT-GRANDPARENTS label sets the size for all five).
- square-50/90: tight, every cell readable, three legend rows.
No clipped string anywhere; every number well-formed; the grey cells say
"n unknown".

Not built: variants b (per-generation share bars) and c (the Excel look).
The brief's addendum made them optional and the day's budget - and the
machine's memory - went to a.

## Why-tutorial: the problem page and the solution page, one line each on what they say
(filled in below once the tutorial pages rendered - see "Tutorial pages")

## What was hard (two or three lines an author would want tomorrow)
- **A size-step loop that cannot reach its floor.** `px = round(px * 0.94)`
  sticks at 8 (round(7.52) = 8), so a `for (; px >= floor; ...)` with
  `break` on `px === floor` spins forever when the copy does not fit at 8 px.
  It hung jest and the build gate's layout sweep for 20 minutes before I saw
  it. Every step is now `min(px - 1, round(px * 0.94))`. The astro title
  fitter has the same latent shape (its MIN_PX guard happens to save it).
- **Measuring every fit attempt against the font file is minutes, not
  seconds.** The per-column tier fitter tries tiers x sizes x cells x words;
  with `widthOf` on each try, the seven-canvas sweep over six prop sets was
  ~2M measurements. One measurement per string at a reference size, scaled
  linearly (advance widths scale with the size), then one exact `widthOf`
  of the chosen lines for the contract: the whole test file runs in 6 s.
- **Lattice frames are not the paint.** `placeInsetPieces` snaps every frame
  OUTWARD to a divisor lattice (pitch = axis / latticeMaxSlots(axis)) and
  insets the paint back, so an `equal: "height"` relation measures the
  lattice run, not the cell. Header, columns and the generation-5 unit are
  multiples of the pitch, which made the frames exact at six canvases; at
  3840x2160 with the stress rows some generation-5 cells still measured 70
  and others 75 for a 75 px unit, so the relation carries tolerance 0.08 /
  6 px (as astro's tracks do) and the unit test asserts the exact spans.
- **A child document's sources are not in push order** - `placeInsetPieces`
  emits them layer-major, then by band. A test that indexed `fills[15]` got
  cell 31. Every fill is labelled `ancestor-fill-<n>` and every header tint
  `gen-now-<g>`, so tests (and a reader of the .layout.m0) find a cell by
  its Ahnentafel number.
- **The why-tutorial budget** is tight (who 160, a paragraph 320, a try 110,
  a caveat 200 characters); the first spec was refused on seven counts.
- **Rendering.** A whole-variant `render-variant.mjs` run spawned eleven
  engine workers (~650 MB each) and the harness stopped it for low memory
  with a 48-byte landscape.mp4 behind; the split renderer, one canvas per
  foreground call, took 6-8 min a canvas at 16 s. Every CLI call needs
  `M0SAIC_TELEMETRY=ghost M0SAIC_NO_UPDATE_CHECK=1`: without them the CLI
  stalled two minutes on its update check (the morning's network was flaky
  enough to kill the runner's build call).

## Tutorial pages (opened: tutorial-2, -3, -5, -6)
- Problem page: the Genea-Musings and DNAeXplained quotes from `10-scout.md`,
  the DNA Painter / FamilySearch caveat, six of the seven opened sources
  listed ("1 more in journal"). Nothing the scout did not open.
- Solution page: rows or GEDCOM in, five columns out, the Ahnentafel
  geometry and per-column copy as the one decision, the clip's beats; the
  weak spots name the text-only GEDCOM input, the last-element keying and
  the five-generation cap. The third paragraph and the KNOWN WEAK SPOTS
  list overlap in wording - tidy in the ship phase.
- Page 5 is the template at its defaults (caught mid-replay); page 6 shows
  the runner's scout and plan only - the ship phase pastes the finished
  timeline with the session's build, critique and ship.

## Polish for a v2 (not blocking)
- Portrait: the lattice leftover is centred between the header strip and the
  cells, leaving an empty band; bottom-align the cells and put the leftover
  above the headers.
- Narrow columns shrink all five headers to the longest label; drop to the
  short forms when the size would fall under ~1.6% of the short side.
- Generation 5 at 16:9 has width to spare: a one-line "n Name - year - key"
  tier would let the copy grow from ~15 px to ~22 px.
- The legend chooser took two rows at 16:9 because the font came out larger;
  the brief expected one row when it fits.

## In place now: a