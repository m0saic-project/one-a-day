# Ship — 2026-10-04

## @one-a-day/sports/cubing-average-card/v1 — Cubing Average Card
A still PNG recap of a speedcubing average. Give it 3, 5 or 12 solves and it works out the Mo3, Ao5 or Ao12 from the count (best and worst dropped, half-up to hundredths), draws one bar per solve, and prints the average as the headline with the delta against the previous PB and a NEW PB chip when it beats it. It is for speedcubers on SpeedSolving.com race and competition threads who currently paste raw csTimer blocks and type PB tables by hand. Inputs: `solves` (list of strings), `previousPb`, `event`, `cuber`, `date`, `accent`, `preset`. Variant c (spread bars: distance from the average, centre line, dropped solves hollow) shipped; the critic scored it 17/18 against 15 for a and b.

## Render it
m0saic make @one-a-day/sports/cubing-average-card/v1 --template-repo . -w 1920 -h 1080 -o out.png
Props worth trying: --props '{"solves": ["14.20", "15.01", "DNF", "13.88", "14.55"], "previousPb": "14.80"}'
Also: `"bar": "length"` (each time from zero, a/b style), `"avgLine": true` (tick at the average), `"preset": "light"`, `"accent": "#2ec4b6"`, 12 solves for an Ao12.
Why it exists (the tutorial): m0saic make @one-a-day/sports/cubing-average-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4

### csTimer to `solves`
The template does not parse csTimer. Copy each time from the Time List by hand:
`1. 27.39 <scramble> @...` becomes `"27.39"`; a +2 is `"29.50+"`; a DNF is `"DNF"` or `"DNF(15.20)"`.

## What changed in the ship phase
- `WHY.timeline` now holds all four phases from `trace.json` (scout, plan, build, critique), including the build that hit its timeout (`status: "error"`, 54 min). The tutorial page no longer claims the template was made in five minutes.
- `m0saic doctor` reported an error: `solves` was not bound to any rect. Each time cell is now bound to its own `solves[i]` entry with `bindPropPath`. The text shown is that string, formatted (`(24.19)`, `29.50+`), so a double-click in Make edits the raw string. The binding test was updated (`solves: 5` bound at defaults; 6 bindings with the header props blank).
- Gates run: `npm run build && npm run previews && npm run build && npm run fingerprints:update && npm run verify` green; `m0saic doctor . --json` ok with no errors; `--tutorial --validate-only` exit 0; jest for the template 33 passed.

## Preview
`assets/templates/@one-a-day__sports__cubing-average-card__v1/preview.png` (118 KB, 1920x1080) is the square/landscape default render; viewed by eye: AO5 chip, 27.80 headline, NEW PB, five bars, no clipping. It is an image template, so there is no blank first frame.

## Weak spots (honest; a human polish pass starts here)
Carried from `40-critique.md`; none blocks.
1. The only statement of "left = faster" is the dim footnote. A stranger who skips it can read `(31.62)`'s long hollow bar as "long = good". A faster/slower caption under a track would fix it.
2. Landscape footnote wraps to four lines and breaks `left =` / `faster.`; the left column has dead space between the delta line and the footnote.
3. Portrait: rows are capped at 56 px bars on a 200 px pitch and there is about 230 px of empty page above the footnote.
4. A solve within 1% of the average still gets a 1% floor bar (`27.84` draws about twice its true 0.04 s length). Within the test tolerance but not strictly proportional, and the footnote does not say so.
5. The NEW PB chip floats beside the headline digits and reads as a separate badge.
6. Spread bars are a poor picture of an Ao12 with one slow outlier: eleven slivers and one half-track bar (`scratch/stress.png` in the build variants).
7. The light preset and `bar: "length"` with an Ao12 at 1920x1080 were not looked at by eye.
8. `solves` is hand-extracted; there is no csTimer parser. Half-up rounding is this template's choice, not checked against a regulation.
9. The build call timed out at 54 minutes; the code, test and notes were complete and the critic's gates were green, but the build never wrote a clean finish.

## Follow-ups (what v2 would do)
- Add the faster/slower caption and rework the footnote wrap; balance portrait and landscape bands.
- Decide whether a within-1% solve gets no bar or a note.
- Accept a pasted csTimer export as one string prop and parse the Time List into solves (needs a validated vector set).
- Ao50/Ao100 (bars become a histogram), Bo3 and multi-blind.
