# Ship — 2026-10-05

## @one-a-day/music/radio-top-30-chart/v1 — Radio Top 30 Chart
A still PNG of a radio station's weekly chart: the station, a `TOP 30` counted from the rows, the week, and every row as rank, bold artist, then title with its label in dimmer ink, with a movement marker under the rank (`+3`, `-2`, `=`, `NEW`, `RE`) worked out from last week's rank. It is for music directors at college and community stations who chart a Top 30 to NACC every Tuesday and then retype it for the blog and socials. Inputs: `rows` (a list of 1 to 30 strings, `Artist | Title | Label | last week`), `station`, `weekOf`, `genre`, `footer`, `accent`, `preset`, `lead`. Wide canvases are 3 x 10, square and portrait 2 x 15. Long titles shrink by rule or the render refuses and names the row; nothing is clipped. Variant a (uniform grid, dark) shipped; the critic scored it 15/18 against 11 for b (`lead: true`) and 14 for c (`preset: "light"`), and both of those stay one prop away. The default chart and station are invented.

## Render it
m0saic make @one-a-day/music/radio-top-30-chart/v1 --template-repo . -w 1920 -h 1080 -o out.png
Props worth trying: --props '{"station": "WXYZ 90.1 FM", "weekOf": "Week of Oct 6, 2026", "rows": ["Clairo | Charm | Virgin | 2", "Nora Vance | \"Blue Receipt\" [Single] | Self-Released | NEW", "Juno Park | Soft Machines [EP] | Night Shift | RE", "Static Bloom | Greenhouse | Tidewater"]}'
Also: `-w 1080 -h 1080` for the feed post (the hinted canvas), `-w 1080 -h 1920` for a story, `"genre": "Loud Rock"` with ten rows (title becomes `LOUD ROCK TOP 10`, one column), `"lead": true`, `"preset": "light"`, `"accent": "#2ec4b6"`. For thirty rows put the JSON in a file and pass `--props @chart.json`.
Why it exists (the tutorial): m0saic make @one-a-day/music/radio-top-30-chart/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4

### From a typed chart to `rows`
`rows` is a JSON array of strings, one string per chart line, in rank order. It is not a paste box: a multi-line string is refused (`rows must be a list`).

- `1. CLAIRO Album: Charm Label: Virgin` (how KWVA types it) becomes `"Clairo | Charm | Virgin"`. Drop the leading `1.`: the rank is the position in the list, and a kept `1.` is printed as part of the artist.
- A fourth field is last week's rank (`| 4`), `NEW` or `RE`. Leave it out for no marker on that row.
- NACC writes a single as `"Title" [Single]`. Inside JSON the quotes must be escaped: `"Nora Vance | \"Blue Receipt\" [Single] | Self-Released | NEW"`.
- Printable ASCII and accented Latin letters only. Curly quotes and apostrophes, en and em dashes, the ellipsis character and tabs are refused; retype them as `'`, `"`, `-`, `...` and a space. The error quotes the whole line and does not point at the character.
- A `|` inside a name cannot be written.

## What changed in the ship phase
- `pick` was `a` and `a` was in place, so nothing was copied.
- `WHY.timeline` now holds all four phases from `trace.json` (scout, plan, build, critique: 49m 36s, 164 tool calls, $24). `tutorial-6` no longer shows a template made in nine minutes.
- `m0saic doctor` reported one error: `genre` was bound to the chart title only when it was non-empty, so at the defaults nothing bound it. The chart-title rect is now always bound to `genre`; the binding test asserts `genre: 1` at the defaults. No pixel changed: the three default renders are byte-identical to `variants/a/renders/`.
- Words, to match what the critic found about feeding it: the description and the tutorial's solution page said "pasted lines" / "Paste the chart as lines"; they now say "a list of lines". The first known weak spot on `tutorial-3` now says that curly quotes, en dashes and tabs are refused.
- `src/repo.ts`: the `music` pack description was the scaffold's placeholder; it now says what the pack holds.
- So `src/music/radio-top-30-chart/v1/` differs from `variants/a/src/` by exactly those edits. The source as shipped, re-rendered with its stills and report, is in `scratch/ship/final/`.
- Gates run after the last edit: `npm run build`, `npm run previews` (minted 1), `npm run build`, `npm run fingerprints:update` (0 written, 18 unchanged), `npm run verify` exit 0 (jest 354 passed, 41 of them this template's; pipeline 61 passed; contract and deps clean); `m0saic doctor . --json` `"ok": true` with 0 errors (4 warnings, all on older frozen templates); `--tutorial --validate-only` exit 0. Logs in `scratch/ship/`.

## Preview
`assets/templates/@one-a-day__music__radio-top-30-chart__v1/preview.png` (184 KB, 1920x1080) is the default render at 3 x 10, opened and read: station, pink `TOP 30`, the week, thirty rows whole, row 7's long title visibly smaller with its label, the sample footer. It is an image template, so there is no blank first frame.

## Weak spots (honest; a human polish pass starts here)
Carried from `40-critique.md` unless marked new; none blocks.
1. New, found in this phase: every render prints the CLI warning `OVERLAY_CHAIN_DEEP` (an overlay chain 32 deep at the defaults, threshold 20; 25 deep with five rows). The CLI says ffmpeg can silently degrade masks past about 25 layers. The stills do not show it: preview, square, portrait and the five-row example were opened and every string is whole, and the repo's own gate (`costBudget`) does not flag this template. Neither the build note nor the critique mentions the warning. It is still a layout that sits above a documented threshold, and a human should decide whether it is safe.
2. Feeding it. `rows` is JSON; a real NACC-style chart needs `\"` in many rows (12 of 30 in the critic's `real30.json`), and a paste from a blog fails on the first curly quote, en dash or tab with an error that does not say which character. A music director has to be at home with JSON and a CLI.
3. Small type on tall canvases. Portrait (and 4:5) carries the square's type, about 21.7 / 16.5 px, in rows 103 px tall: the caps are bound by the column width, so the extra height buys air, not legibility. Tidy, small for a phone.
4. The evidence for wanting a picture at all is one station of the four opened (WDCE). The other three show the weekly chore, not a wish for a graphic.
5. The ladder's step shows week to week: a line that needs 14% off takes all thirty rows down with it, one that needs 16% off takes none. Two weeks of the same station's chart can have different type sizes.
6. A row that shrinks alone gets small: an 80-character title is about 9 px on a 1080 square. Whole, not readable in a feed.
7. 4:3 gets less than the square: the `w/h >= 1.3` switch to 3 x 10 costs type just above it (1440x1080: 19.5 / 14.8 px; 1400x1080: 21.3 / 16.2 px).
8. A Top 5 on a portrait canvas ends at 45% of the height with the footer alone at the bottom.
9. `=` and the down markers are about 14 px of dim ink on the square: correct, close to invisible in a feed.
10. A numbered line (`1. CLAIRO | Charm | Virgin`) is accepted and renders `1` beside `1. CLAIRO`. The rank and marker cells are not bound to `rows`.
11. The invented default names were not checked against real acts or labels.

## Follow-ups (what v2 would do)
- Take the chart as text: `rows` as one multi-line string as well as a list, fold the typographic characters a paste carries to ASCII (or name the character and its column in the error), strip a leading `12.`.
- Cut the overlay chain: build each column (or the row tiles and the text) as a nested child document so no chain passes the CLI's threshold, then confirm the warning is gone.
- Give the story and the 4:5 post their height: a larger width cap with the ladder doing the work, one column of thirty, or a third line for the label.
- Decide whether the shared-size step is wanted, or whether rows should only ever shrink alone.
- Revisit the 1.3 aspect switch, the half-empty short chart on portrait, and the weight of `=` and the down markers.
- Read a NACC or Spinitron export directly, once there is a sample file to validate against.
