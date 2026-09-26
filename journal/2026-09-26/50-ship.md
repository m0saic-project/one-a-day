# Ship — 2026-09-26

## @one-a-day/gaming/speedrun-pb-recap/v1 — Speedrun PB Recap

A short, loopable speedrun PB recap clip made from the run's splits: the
table of segments fills in against the old PB with LiveSplit's own delta
colours (gold, ahead/behind, gaining/losing), a graph shows the time saved or
lost on each segment, the timer fast-forwards the run, and the clip opens and
closes on the finished result (frame 0 is the browse card and the social
thumbnail). For speedrunners who share every PB. The input is the file they
already have: paste a LiveSplit `.lss` into `lss` (the PB, the previous PB
rebuilt from the attempt history, the golds), or pass rows of
`{ name, split, pb, best }`. Variant b shipped (critique: 16 vs 15).

## Render it

```
m0saic make @one-a-day/gaming/speedrun-pb-recap/v1 --template-repo . -w 1080 -h 1920 -o recap.mp4
```

Props worth trying: `--props '{"graph":"delta","clipSec":15}'` (LiveSplit's
cumulative-delta graph, a shorter teaser); `-w 1920 -h 1080` (the graph moves
beside the table); `--props '{"preset":"light","accent":"#e4572e"}'`.

Your own run, from your splits file (any shell):

```
node -e "require('fs').writeFileSync('props.json', JSON.stringify({ lss: require('fs').readFileSync('MyGame.lss', 'utf8'), runner: '@me' }))"
m0saic make @one-a-day/gaming/speedrun-pb-recap/v1 --template-repo . -w 1080 -h 1920 --props @props.json -o recap.mp4
```

Why it exists (the tutorial):
`m0saic make @one-a-day/gaming/speedrun-pb-recap/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4`

## How this day ran

By hand, in one interactive Claude Code session (Opus 5.5, effort max),
triggered by the founder; the 09:00 task did not run today. Before the day,
the same session committed `dd4779e` (maintain 2026-09-26): the scout prompt
now looks first in niche communities organised around one construct (the
founder's direction, with speedrunning as his example), and the Claude price
rows in `pipeline/config.json` were re-checked against the published list
prices. This is the first day under that direction. Reddit and speedrun.com
could not be opened (see 10-scout.md), so the evidence is LiveSplit's GitHub,
the splits.io author's shutdown post and the community's own `.lss` tools.
Gated with `logs/gate-run.mjs` (`runGate --no-push`, day 4's pattern) and
pushed by hand.

## Verified before the gate
- `npm run build && npm run previews && npm run build && npm run
  fingerprints:update && npm run verify`: green (103 jest tests, pipeline
  tests, lint, loader contract, dependency policy; layout contract at 7
  canvases; the why-tutorial checks). No warning for this template.
- `m0saic doctor . --json`: ok, 9 rendered, 1 warning (the audiogram's
  recorded overlayDepth posture, not today's).
- `--tutorial --validate-only`: exit 0. Final tutorial rendered; its last
  page (`logs/why-final-last.png`) shows the measured timeline.
- `preview.png` 159 KB (soft budget 500 KB): frame 0, the finished recap.

## Tokens and dollars
Measured from the session transcript, one record per API response, at the
2026-09-26 list prices (`60-token-costs.md`, `token-costs.json`,
`token-cost-audit.mjs`). When the tutorial card froze (16:42:40Z): 110 API
requests, 33.0M tokens (mostly cache reads), 191 tool calls, 52 min,
**$15.44 API-equivalent**. `60-token-costs.md` carries the total through the
last step before the gate; the gate, the push and the closing message came
after it.

## Weak spots (honest; a human polish pass starts here)
- No gameplay: the speedrun.com forum's recurring ask (timer and splits over
  an already-recorded run) is the v2, not this.
- The previous-PB rebuild trusts `SegmentHistory` and has only met a fixture;
  a file whose history was cleaned keeps just that attempt's final time.
- The numbers are drawtext in the machine's font (here a monospace) beside
  the bundled Roboto names; pixels are deterministic per machine only.
- Square at ten or more rows drops the graph (rows first).
- A `.lss` reaches the CLI through a JSON wrapper (the one-liner above).

## Follow-ups (what v2 would do)
- `gameplaySrc` + a 1:1 clock: the same props over the recorded run, splits
  beside the footage, for the offline and console runners.
- A compact per-segment strip where the full graph drops out.
- Race recaps (two runners' splits side by side) from racetime-style data.

## For a maintainer's polish pass (humans only - these files are protected)
- `tools/gen-previews.mjs` `ANIMATED_PREVIEW_IDS`: motion is the point here;
  adding this id would mint `preview.mp4` + `poster.png`.
- `pipeline/research/reddit.mjs`: reddit now needs an OAuth app (a secret on
  the runner) - a founder decision; the niche direction leans on reddit.
- `token-cost-audit.mjs` works for any hand-run Claude day (change SESSION
  and the marks); it could live in `pipeline/lib/` so no session day ships
  without tokens and dollars again.
