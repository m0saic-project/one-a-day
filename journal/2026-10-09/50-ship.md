# Ship - 2026-10-09

## @one-a-day/community/ancestor-birthplace-chart/v1 - Ancestor Birthplace Chart
A 16 s clip for hobby genealogists who post the #MyColorfulAncestry chart: five generations of ancestors as five columns of 1, 2, 4, 8 and 16 cells, every cell coloured by where that person was born, with a counted legend. It takes rows "n | Name | year | place" (one per Ahnentafel number, pasted from a spreadsheet) or the text of a GEDCOM file (`gedcom`, with `root` to pick the person and `event` for the death-place remake), keys each place by state inside the home country and by country elsewhere, and lands the colours generation by generation. The clip opens and closes on the finished chart, so frame 0 is the browse card and the loop point. Variant a shipped; it was in place, so nothing was copied from `variants/`. The day was taken over by hand in a Claude Code session (Fable 5.1) after the runner's build call died on a network error; scout and plan are the runner's (Opus 5.5).

## Render it
m0saic make @one-a-day/community/ancestor-birthplace-chart/v1 --template-repo . -w 1920 -h 1080 -o chart.mp4
Props worth trying: `--props @props.json` with `{"gedcom": "<the text of your .ged file>", "root": "@I12@"}` (change `root` for each sibling or cousin); `ancestors` as rows "n | Name | year | place" (tabs work); `keyBy "country"`; `homeCountry "Canada"` to key by province; `event "death"`; `colors {"Ohio":"#e3a857"}`; `clipSec 8`; -w 1080 -h 1920 for a story.
Why it exists (the tutorial): m0saic make @one-a-day/community/ancestor-birthplace-chart/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4

## What the ship phase did
- `npm run previews`: `preview.png` (503 KB, the finished chart - opened and checked) and `preview.gif` (311 KB, the 16 s clip at 1.6x) in `assets/templates/@one-a-day__community__ancestor-birthplace-chart__v1/`.
- `npm run build` after it: manifest 24 templates, all with preview assets; `TEMPLATES.md` regenerated; fingerprints 24 unchanged (the sidecar was minted in the build phase).
- `m0saic doctor . --json`: `ok: true`, 0 errors. Its first run (`logs/doctor-build.json`) refused `bindings.unbound` naming the two enum props `event` and `keyBy` (a closed set cannot carry a handle); dropped from the list, no geometry change. The 5 warnings are `bindingsCover` on five earlier frozen templates.
- `m0saic make ... --tutorial --validate-only`: exit 0 (69 s, 2070 frames).
- The session's phases (direct, build call 2, critique, ship) appended to `trace.json` from the transcript by `logs/session-trace.mjs` (one usage per API response, list prices), then pasted into `WHY.timeline` by `logs/paste-timeline.mjs`; `60-token-costs.md` has the audit. The frozen ship phase stops at the paste; the gate and the push came after.
- WHY wording: the solution's third paragraph now starts "Limits:" so it no longer repeats the KNOWN WEAK SPOTS heading (the critic's tutorial-3 note).
- `npm run verify`: see `logs/ship-verify.log` (the gate runs it again).

## Weak spots (honest; a human polish pass starts here)
- Generation-5 copy at 16:9 is 15 px names over 12 px year-and-place (the floor is 12 px): legible at 1080p, small on a phone. The cells have width to spare; a one-line "n Name - year - key" tier would let it grow.
- Portrait: the lattice leftover is centred between the header strip and the cells, leaving an empty band of ~85 px; headers there are ~10 px because the longest label sizes all five.
- The landscape legend is two rows (the chooser maximises the label size); the brief expected one row when it fits.
- `cellRelations()` carries tolerance 0.08 / 6 px where the brief said 1 px: the engine's quantized frames, not the paint, spread at 3840x2160 with dense copy. The unit test asserts the exact spans.
- In the reset, unknown cells look like every other blank cell; only "n unknown" tells them apart until they land grey.
- The community posts stills; the finished chart is 24% of the runtime and there is no poster-frame prop (use `--format image`, frame 0 is the finished chart).
- The GEDCOM reader was run on a synthetic fixture (PEDI birth, ABT and BET dates, a missing parent, pedigree collapse), not on a real export; CONC/CONT continuation lines are ignored.
- Six generations are not drawn; a GEDCOM with more is cut at 31.

## Follow-ups (what v2 would do)
1. Bottom-align the cells and put the lattice leftover above the headers; shorten the header tier when its size would fall under ~1.6% of the short side.
2. A one-line generation-5 tier and a `poster` boolean (or `--format image` documented in the tutorial) for the still people post.
3. Variant b from the brief: a per-generation share bar under each column (Estes' percentages); variant c: the Excel look (white page, gridlines, saturated fills).
4. Six generations (63 cells) as an option, with the same per-column tiers.
5. Read a real GEDCOM export (Ancestry, FamilySearch, Gramps) and handle CONC/CONT and NAME with suffixes.
