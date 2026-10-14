# Ship — 2026-10-14

## @one-a-day/gaming/tenxten-challenge-card/v1 — 10x10 Challenge Card

One card for the yearly 10x10 board game challenge, for the challengers who post
progress through the year: one row per game (name, a track of `goal` pips with
the first `plays` of them filled, the count), three stat tiles above it (plays
logged, games done, of-year pace) and a footnote that shows the pace formula.
From the inputs a challenger already has: the handle, the year, the 10-game
list with its plays pasted from the BGG play log or BG Stats, the goal, the day
of the year. Every number on the card - the "10 x 10" headline, the 81 / 100
plays, the 6 / 10 done, the "2 ahead" pace - is computed from the list; none of
it is typed. The sample challenger, list and counts are invented (as the schema
says).

## Render it

```
m0saic make @one-a-day/gaming/tenxten-challenge-card/v1 --template-repo . -w 1920 -h 1080 -o out.png
```

Props worth trying: `--props '{"goal": 5}'` (an honest 10x5 - every total
follows), `--props '{"dayOfYear": 365}'` (the pace tile reads the year end),
`--props '{"preset": "dark"}'` (the forum card), `--props '{"challenger": ""}'`
(removes the handle).

```
m0saic make @one-a-day/gaming/tenxten-challenge-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## Ship state

- Pick `a` (in place; no copy needed). `npm run build && npm run previews &&
  npm run build && npm run fingerprints:update && npm run verify` - all green;
  29 templates rendered at defaults, 0 skipped, 29 fingerprints unchanged.
- The timeline re-copied into `WHY` at ship (the critique's item 2): all five
  phase calls now, `build (2)` carrying its honest `status: "error"` (timed out
  at 94 min). `check-why` green. The `stills/tutorial-6.png` inside
  `variants/a/` predates the re-copy and shows the two-phase timeline the
  critic saw; the shipped tutorial carries all five.
- `m0saic doctor . --json`: `ok: true`, `errors: []`. Standing warnings only:
  `bindingsCover` on `goal`/`dayOfYear` (the rects that show them carry derived
  strings - binding would print a composed string into a number prop, which
  the template's UNBOUND declaration forbids; same posture as five other
  shipped templates) and the repo-wide 0.3.1 `catalogSidecar` lag that every
  template in this repo carries, the front door included.
- `m0saic make ... --tutorial --validate-only` exits 0 (1770 frames @ 30fps,
  59 s, validation passed).
- It is an image template (`format: { kind: "image", container: "png" }`), so
  the browse card is the rendered still itself - no t=0 reveal to worry about.
  `preview.png` is 103,601 bytes, byte-count-equal to the landscape render the
  builder probed at all 100 pip centres.
- Honest limit, repeated from the critique: nobody has viewed a still with
  eyes today - the builder, the critic and this ship call are all image-blind
  (this model rejects image input). Every visual claim rests on pixel probes
  at chosen points and clean exit-0 renders, not on the picture as a picture.
  A human's first look at `assets/templates/@one-a-day__gaming__tenxten-challenge-card__v1/preview.png`
  is the start of the polish pass.

## Weak spots (honest; a human polish pass starts here)

1. Nobody has seen it (above). First look should be the portrait still: the
   name column widens 0.28 -> 0.42 of card width between aspect classes, and
   "Lost Ruins of Arnak" is the first string to feel it.
2. `dayOfYear: 1` on the sample list reads "81 ahead" - honest arithmetic under
   the January-start assumption the challenge itself makes, but odd to a
   stranger; documented in the caveats, not special-cased.
3. The doctor's `bindingsCover` warnings for `goal` and `dayOfYear` (standing
   posture; see above).
4. No BGG import: the plays API needs a username and this repo downloads
   nothing, so counts are typed or pasted from the log you can already see.

## Follow-ups (what v2 would do)

1. A pip material swap to rings (variant `c`, on the shelf at
   `journal/2026-10-14/variants/c/src/`, identical fingerprint) if a human
   prefers the wood-board look - a future day, not an edit to v1.
2. A `startDayOfYear` prop so a mid-year start reads pace honestly instead of
   ahead.
3. Per-game footnotes (plays over goal clamp at the pips; a v2 could mark the
   over-goal rows the way the count already tells).

## Tokens and costs

From `trace.json` (all five calls reported by the CLI; `costBasis: "reported"`
- reported dollars, not dated estimates):

| call | tokens | USD (reported) |
|---|---:|---:|
| scout | 829,298 | $0.41 |
| plan | 553,706 | $0.36 |
| build | 1,350,095 | $0.62 |
| build (2) | 22,499,196 | $6.70 |
| critique | 1,331,222 | $0.55 |

Observed before this ship call: 26,563,517 tokens, $8.64 known cost, 0 calls
missing token usage or cost. The dominant cost is `build (2)` - the call that
timed out at 94 minutes and 22.5 M tokens; most of that draw is repeated
`npm run build` / `npm test` cycles against a large jest suite, not edits. This
ship call is not in the trace yet (the runner records it after the phase
ends); the final totals live in
[`60-token-costs.md`](60-token-costs.md), which is refreshed after this call -
read it there, not here. OpenCode Go allowance usage describes reported usage
against plan allowances; it is not an additional per-run invoice.
