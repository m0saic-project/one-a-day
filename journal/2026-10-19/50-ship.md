# Ship - 2026-10-19

## @one-a-day/sports/hyrox-split-card/v1 - HYROX Split Card

A still of the official workout summary, for athletes posting a race-day graphic from results.hyrox.com instead of a screenshot of the timing table. Finish time is the hero, division rank sits beside it, and eight run-plus-station pairs stay in race order on one shared scale: the slowest pair fills the track, and the station name stays in its own column. Inputs are athlete, race, division, finish, rank, the eight splits (run, station, place), plus roxzone, run total and best lap printed as entered. Jordan Hale at Harbor Open is invented. The columns follow the Luxton Barcelona page; the card does not fix a summary whose lines do not sum.

## Render it

```
m0saic make @one-a-day/sports/hyrox-split-card/v1 --template-repo . -w 1080 -h 1080 -o out.png
```

Landscape works the same way: `-w 1920 -h 1080 -o out.png`. Image template, not a clip.

Props worth trying: `--props '{"preset":"light","accent":"#2f6f62","rank":0}'` (light page, new station colour, no rank chip; the finish stays the largest figure). A long burpee and a short carry is the scale check: the burpee bar is the long accent, the carry bar is the short one. `"race":""` drops the race line and leaves the finish and the tape.

Why it exists (the tutorial):

```
m0saic make @one-a-day/sports/hyrox-split-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## Weak spots (honest; a human polish pass starts here)

- The place column is unlabeled. On the 1920x1080 browse card (`preview.png`, 75997 bytes, not blank) the right-hand numbers run 42..240 with no header, so 240 next to Burpee reads as a count. The critic's first pixel fix is a `PLC` header, only if it still fits at 480x270.
- On that same landscape still, `RANK` sits on the header rule. It needs a few pixels of air.
- The problem page glues "That card stops at the finish" onto the Sweatlas marketing line and paraphrases Rox Lyfe. The four sources are listed; the wording is not a clean quote.
- `m0saic make --tutorial --validate-only` exits 0 and is not degraded, but warns `OVERLAY_CHAIN_DEEP` (50, threshold 20). Tiles stay off the xstack sheet because row washes overlap the rails. Do not add more overlapping tiles.

## Follow-ups (what v2 would do)

- Label the place column and lift `RANK` off the rule, then re-sweep 480x270.
- Split the problem-page quotes so Sweatlas, PacePost and Rox Lyfe stay in their own words.
- Doubles, relay and the race-replay in/out list are a different shape and are not drawn.
- A catalog sidecar when the repo adopts the 0.3.1 conventions. Doctor is `"ok": true` with `lagOnly`; the whole shelf still declares presentation in code. Not a v1 pixel bug.

## Tokens and costs

Through the end of critique, `trace.json` totals 4 phases, 223 tool calls, 10610352 tokens, 2367855 ms wall (about 39 min), $6.94. `costBasis` is `reported`. No phase is missing tokens or cost, and none of these dollars are a dated estimate.

| Phase | Calls | Tokens | USD (reported) |
| --- | ---: | ---: | --- |
| scout | 42 | 1017711 | 0.8468 |
| plan | 28 | 689752 | 0.6267 |
| build | 114 | 7792283 | 4.6580 |
| critique | 39 | 1110606 | 0.8080 |

`WHY.timeline` copies the runner's rounded figures ($0.85, $0.63, $4.66, $0.81) and omits this ship call, which has not finished. [`60-token-costs.md`](60-token-costs.md) is the same snapshot (10610352 tokens, $6.94 reported, 0 calls missing usage) and will be refreshed after this call ends, so it cannot include ship yet. OpenCode Go allowance usage is not an additional per-run invoice.
