# Critique — 2026-10-05

`@one-a-day/music/radio-top-30-chart/v1`, three variants of one template: a (uniform grid, dark), b (`lead: true`), c (`preset: "light"`). The three sources differ by one `DEFAULTS` line each; `src/` in place is byte-identical to `variants/a/src/`.

What I did: read the scout, the brief and the build note; opened every still of a (square, landscape, portrait, tutorial 1-6), the three canvases of b and c, b's `tutorial-3` and `tutorial-5`, and the builder's `scratch/build/` renders (`stress29-square`, `top5-portrait`, `genre10-square`); checked all 30 default markers in a's square against the brief's list and against the `LW` values (they also add up: five entries, five last-week ranks missing); read `radio-top-30-chart.ts` and the test; ran `npx jest src/music` (41 passed, 17 s) and `node tools/check-registry.mjs --json` (ok, 0 errors, no finding for this template, fingerprints unchanged). I checked every quote on `tutorial-2` against the scout's raw fetches in `scratch/` (all found, each under the URL the page lists).

Then I tried to break it, in `scratch/critique/`: a chart built from the rows KWVA really published (`real30.json`, `hard30.json`, render `real30-square.png`), canvases the build did not sweep (1080x1350, 1440x1080, 1200x630, 1920x600, 600x1920), and the things a paste from a web page carries (`edge.cjs`).

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 1 | 2 | 1 | 1 | 2 | 2 | 2 | 15 | no |
| b | 2 | 1 | 1 | 2 | 1 | 1 | 1 | 1 | 1 | 11 | no, but not shippable as snapshotted |
| c | 2 | 2 | 1 | 2 | 1 | 1 | 1 | 2 | 2 | 14 | no, but not shippable as snapshotted |

Line 9 is a 2 for a and c on the same condition as day 15: `tutorial-6` shows two phases (scout, plan, 9m 31s, $6.57) because that is what had run when the scaffold wrote `WHY.timeline`. The build took another 31 minutes. Copying the full timeline is the ship phase's job and `check-why` enforces it.

## What each variant gets right / wrong

### a - the uniform grid, dark

Right:
- `square.png` is the brief's "defaults must show", string by string: `KOAD 91.6 FM`, `TOP 30` in the accent, `Week of Oct 6, 2026` (a Tuesday, the NACC day), 1-15 left and 16-30 right, bold artist over title with the label dimmer, `=` at 4 and 9, `NEW` at 5, 12, 20, 29, `RE` at 18, row 7's title complete and visibly smaller, the sample footer. Nothing clipped, overlapping or ellipsized on any of the three canvases; `landscape.png` is 3 x 10 with a clear gutter.
- It survives a real chart. Thirty rows as KWVA typed them (upper-case artists, `Secretly Canadian/Secretly Group`, `MULATU ASTATKE AND HOODNA ORCHESTRA`, the 54-character Brat title, `BEYONCE` with its accent) render whole at all three aspects and `scratch/critique/real30-square.png` reads as a station's chart. That is the evidence for line 6 that the invented defaults cannot give.
- The contract promises what the brief said and nothing wider: a measured `textFits` per text (154 of them), header in the top fifth, footer in the bottom tenth, every row cell in the chart band, at least a quarter of the canvas wide, all one size. The test is real: it pins the markers, the grid shape per aspect, the ladder (row 7 alone at all seven canvases), a refusal by row name at every canvas, 23 validation errors, bindings and determinism.

Wrong (the worklist, none of it fatal):
- Line 3, `portrait.png`: the story is the square's type (21.7 / 16.5 px) in rows 103 px tall. The caps are bound by the column width (`cellW * 0.045`), so the extra 840 px of height buys the header (station 74 px) and air, not legibility. Same at 1080x1350, the 4:5 feed post. It fits and it is tidy; it is small for a phone. The brief said so; it is still the weakest still.
- Line 5: `rows` is a JSON array of strings, not pasted lines. NACC's own convention for a single is `"Title" [Single]`, so a real chart needs `\"` in many of its rows (12 of the 30 in `real30.json`; the rows of KWVA's Dec 3 chart that the scout fetched quote every title). A multi-line string is refused (`rows must be a list`). And a paste from a blog or a document fails on the first curly apostrophe, curly quote, en dash, ellipsis character or tab, with a message that quotes the whole line and does not say which character or where.
- Line 5, smaller: a numbered line (`1. CLAIRO | Charm | Virgin`) is accepted and renders `1` beside `1. CLAIRO`; the rank and marker cells are not bound to `rows`.
- Line 6: the card is better than a screenshot of a table and the fit rule is the right idea, but the music director has to be at home with JSON and a CLI, and the evidence for wanting a picture is still one station. The tutorial says both.
- The ladder's step is visible week to week: in `hard30.json` one line inside the 15% allowance takes all thirty rows down 12% (21.3 to 18.7 px) while row 4, which needs 18% off, costs nobody anything. Two weeks of the same station's chart side by side will not have the same type size. Declared in `30-build.md`; it will be noticed.
- 4:3 gets less than the square: 1440x1080 is 3 x 10 with 19.5 / 14.8 px type, 1400x1080 is 2 x 15 with 21.3 / 16.2 px. The `w/h >= 1.3` switch costs type just above it.
- `scratch/build/top5-portrait.png`: five rows end at 45% of the height and the footer sits alone at the bottom. As briefed, and it looks unfinished.
- `=` and the down markers are about 14 px of dim ink on the square: correct, close to invisible in a feed.

### b - rank 1 as a lead row

Right:
- `portrait.png` is the best story of the nine stills: the lead uses height the grid cannot, and the 29 rows keep a's sizes. `landscape.png` loses nothing either.
- The lead row is one row at a larger scale with its own fit, tested at seven canvases; 15 / 14 and 10 / 10 / 9 with the empty cell left empty, as briefed.

Wrong:
- `square.png`: the 29 rows drop to 17.8 / 13.5 px, 16.6% under a, past the brief's own bar of about 10%. Row 7 now falls inside the shared allowance, so every row shrinks with it and the one default row that shows the ladder is no longer set apart. The hinted canvas is the square.
- As snapshotted it cannot ship: the test asserts `lead: false`, and `tutorial-3` says "every row as rank, bold artist, then title ... 3 x 10 on a wide canvas, 2 x 15 on a square", which is a's layout, not a lead row over 10 / 10 / 9.
- On `landscape.png` the lead row's text ends at a third of the width; the other two thirds of the tallest cell on the card are empty.

### c - the light page

Right:
- Everything a shows, on paper: all three stills are whole and the contrast holds (the accent as text is pulled toward the ink, tested with a pale accent).
- It is the closest to WDCE's printed table, and the one to tape to the studio door.

Wrong:
- As snapshotted it cannot ship: the test asserts `preset: "dark"`.
- On `square.png` the dim `=` and down markers are weaker than on the dark card, and the row tiles are so close to the page that the hairlines carry all the separation.
- It answers no question a does not: same sizes, same weak portrait.

## Decision: SHIP a

a renders clean at every canvas, shows the use case at its defaults, keeps the promises of the brief's five-point rubric, and took a real station's rows without a clipped string. Its weaknesses are the ones the brief named in advance (small type for thirty rows, an airy story, one station's worth of evidence) plus a feeding problem (JSON, typographic characters) that the ship note has to state plainly. b and c stay one prop away, which is where the brief wanted them.

## If ship: what a human polish pass should look at first

For the ship phase, before anything else:
1. `src/repo.ts` still carries the scaffold's pack description: `"Music: one line on what this pack teaches."` It is in `dist/repo.js` and `template-manifest.json` now. Day 14 replaced its placeholder in the ship phase; do the same (the brief's sentence will do: station charts and other music artifacts made from the rows the person already keeps).
2. Copy the full timeline into `WHY.timeline` (`node pipeline/lib/trace.mjs --timeline journal/2026-10-05/trace.json`) so `tutorial-6` shows build and critique, not a template made in nine minutes.
3. In `50-ship.md`: show the mapping from a typed chart line to a `rows` entry, show one row with an escaped `\"Title\" [Single]`, and say that curly quotes, en dashes and tabs are refused and must be retyped as ASCII. Do not say "paste" without saying "into a JSON array".

For a human, or a v2:
4. Take the chart as text: `rows` as one multi-line string as well as a list, fold the six typographic characters a paste carries to ASCII (or name the character and its column in the error), and strip a leading `12.`.
5. Give the story and the 4:5 post their height: a row height cap is not the limit there, the `cellW * 0.045` width cap is. A larger cap with the ladder doing the work, or a third line for the label, would move the portrait from tidy to readable.
6. Decide whether the shared-size step is wanted: a floor that pulls all rows down for one in-band line makes the type size change from week to week.
7. The 1.3 aspect switch at 4:3, the half-empty Top 5 on a portrait canvas, and the weight of `=` and the down markers.
