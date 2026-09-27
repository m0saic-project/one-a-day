# Ship — 2026-09-27

## @one-a-day/sports/powerlifting-meet-recap/v1 — Powerlifting Meet Recap

A short, loopable recap clip of one lifter's meet: the day's attempts on a
3 x 3 board (one row a lift, three tries each), solid green for a good lift,
a red frame for a no lift, the best of each lift named, and the total built
from the bests as a counted number and as a bar to scale. The clip opens and
closes on the finished board (frame 0 is the browse card and the social
thumbnail) and replays the attempts in meet order in between. For
powerlifters, their coaches, and the meet directors who have a row like this
for every lifter. The input is the row they already have: paste an
OpenPowerlifting CSV into `csv` (a lifter's "Download as CSV", or a meet's
export; `row` picks the line by number, date or name), or pass `attempts` in
the CSV's own convention (kilograms, a negative number is a failed attempt).
Variant a shipped (critique: 15 vs 14).

## Render it

```
m0saic make @one-a-day/sports/powerlifting-meet-recap/v1 --template-repo . -w 1080 -h 1920 -o recap.mp4
```

Props worth trying: `--props '{"units":"lb"}'` (whole pounds, rounded down
the way a lifter says them) or `'{"units":"both"}'` (kilograms over pounds
in every cell, the losing variant); `--props '{"attempts":{"bench":[100,105,-110]}}'`
(a bench-only meet is one row); `-w 1080 -h 1080` (the lift names move
beside the cells); `-w 1920 -h 1080` (the total moves beside the board);
`--props '{"preset":"light","accent":"#0057b8"}'`.

Your own meet, from your OpenPowerlifting file (any shell):

```
node -e "require('fs').writeFileSync('props.json', JSON.stringify({ csv: require('fs').readFileSync('me.csv', 'utf8'), row: '2026-09-12' }))"
m0saic make @one-a-day/sports/powerlifting-meet-recap/v1 --template-repo . -w 1080 -h 1920 --props @props.json -o recap.mp4
```

A whole meet, one card a lifter: the same command in a loop over `row` from
1 to the number of result rows in the export.

Why it exists (the tutorial):
`m0saic make @one-a-day/sports/powerlifting-meet-recap/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4`

## How this day ran

By hand, in one interactive Claude Code session (Fable 5.1, effort xhigh),
started by the founder at 17:35 local: the machine was off at 09:00, so the
scheduled task never ran and no roster slot was drawn. The task was disabled
for the length of the run (its `StartWhenAvailable` could have replayed the
missed start on top of the session) and re-enabled after. Second day under
the niche direction: powerlifting, speedcubing, ham radio, fighting games
and sim racing were looked at; Instagram (where the recaps are posted) and
one forum could not be opened, so the evidence is the OpenPowerlifting
documentation, two lifters' write-ups, the OpenLifter guide and LiftingCast's
overlay starter (see 10-scout.md). Gated with `logs/gate-run.mjs`
(`runGate --no-push`, day 4's pattern) and pushed by hand.

The pick was put back in place by flipping the one default that separates
the variants (and the words that describe it), not by copying the older
snapshot: variant a was then re-rendered from the final source, and all 15
of its stills are byte-identical to the ones the critic judged
(`logs/variant-a-judged-stills.sha256.json`). `variants/a/src/` is the
shipped source but for the timeline, which was frozen after it.

## Verified before the gate
- `npm run build && npm run previews && npm run build && npm run
  fingerprints:update && npm run verify`: green (116 jest tests across the
  repo's templates, pipeline tests, lint, loader contract, dependency
  policy; layout contract at 7 canvases; the why-tutorial checks). No
  warning for this template: its gated tiles live in two children.
- `m0saic doctor . --json`: ok, 10 rendered, 1 warning (the audiogram's
  recorded overlayDepth posture, not today's).
- `--validate-only` and `--tutorial --validate-only`: exit 0. Final tutorial
  rendered; its last page (`logs/why-final-last.png`) shows the measured
  timeline.
- `preview.png` 130 KB (soft budget 500 KB): frame 0, the finished board.
- Four more stills through the CLI from a fictional CSV
  (`variants/b/extra/`): a full meet, a bench-only meet, a bests-only row in
  pounds on the light page, a bomb-out ("NO TOTAL", "Disqualified").

## Tokens and dollars
Measured from the session transcript, one record per API response, at the
2026-09-27 list prices (`60-token-costs.md`, `token-costs.json`,
`token-cost-audit.mjs`). When the tutorial card froze (22:28:08Z): 55 API
requests, 14.4M tokens (mostly cache reads), 134 tool calls, 52 min,
**$19.35 API-equivalent**. Fable 5.1 lists at $10 in and $50 out per
million tokens, against Opus 5.5's $4 and $20 yesterday: fewer tokens, more
dollars. `60-token-costs.md` carries the total through the last step before
the gate; the gate, the push and the closing message came after it.

## Weak spots (honest; a human polish pass starts here)
- No lift videos: what lifters post is the lifts themselves, and the nine
  cells do not hold clips yet. This is the closing card of the reel, not
  the reel.
- The CSV has no referee lights, so a 2-1 decision and a 3-0 look the same;
  fourth attempts (record attempts) are not drawn; the only points printed
  are Dots.
- The parser has met a fixture in the documented format, not a file
  downloaded today. The lifter's page the scout read is a real person's
  record, so it was used to learn the format and is cited in the scout
  notes, but it is neither a fixture nor a source on the tutorial card.
- The counted total is drawtext in the machine's font (a monospace here)
  beside the bundled Roboto; pixels are deterministic per machine only.
- Thirteen props, above the brief's own "five to ten"; `row` means nothing
  without `csv`.
- A CSV reaches the CLI through a JSON wrapper (the one-liner above).
- The weights wait in their cells through the whole replay (static text is
  what keeps the clip cheap), so the replay reveals outcomes, not weights.

## Follow-ups (what v2 would do)
- `clips: { squat: [..], bench: [..], deadlift: [..] }`: the lifter's nine
  videos in the nine cells, the weight and the outcome drawn over each, the
  attempts played in meet order. `bindPropPath` has a "media" leaf kind (a
  drop target in Make), so the cells can take the files where they are.
- `points: "dots" | "wilks" | "goodlift"`, read from the same row.
- Fourth attempts as a fourth, outlined cell when the row has one.
- The speedcubing average card (today's runner-up, evidence now on file in
  10-scout.md): csTimer's pasted export as the prop, each scramble drawn as
  the cube's net by a small move simulator.

## For a maintainer's polish pass (humans only - these files are protected)
- `tools/gen-previews.mjs` `ANIMATED_PREVIEW_IDS`: motion is the point
  here; adding this id would mint `preview.mp4` + `poster.png`.
- `token-cost-audit.mjs` has now been copied by hand two days running
  (SESSION, the date, the model's rates); it could live in `pipeline/lib/`
  and take them as arguments.
- The scaffold's "Next:" hint runs `fingerprints:update` after the build,
  which is right; an agent that updates the fingerprint BEFORE rebuilding
  reads the stale `dist/` and writes nothing (30-build.md). One line in
  AGENTS.md would save the detour.
