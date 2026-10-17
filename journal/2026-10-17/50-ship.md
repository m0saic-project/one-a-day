# Ship — 2026-10-17

## @one-a-day/sports/erg-pb-card/v1 — Erg PB Card

One share card from one PM5/Logbook result, for indoor rowers (club and masters
rowers, CrossFitters, home-erg owners on c2forum.com, the Concept2 Online
Logbook and r/Rowing's weekly erg screen threads): the /500m split as the hero
figure on a fixed 1:00-3:00 pace track, the piece's time or metres second,
stroke rate, watts and drag as equal cells, and the season-ranking percentile
as a chip the rower supplies. Every figure is entered exactly as the monitor
prints it - the card computes no claim it cannot verify (no PB badge, no
invented percentile, no watts/split cross-check). Inputs are ~12 props a
rower already has; the defaults are the cited 2026 ranking page's own median
2k band (7:55.0, 50th, 10,198 ranked rowers; the WHY says which sample
numbers are illustrative).

## Render it

```
m0saic make @one-a-day/sports/erg-pb-card/v1 --template-repo . -w 1920 -h 1080 -o out.png
```

Props worth trying:

```
--props '{"split":"2:05.5"}'                 (the marker moves along the track)
--props '{"result":"3:36:47","piece":"marathon"}'  (a distance piece on the same card)
--props '{"percentile":0}'                   (chip and cohort line go; the name takes the header)
--props '{"spm":0}'                         (the stat band rebalances; drag 0 same)
--props '{"preset":"light","accent":"#b8321c"}'    (a club colour)
```

Why it exists (the tutorial):

```
m0saic make @one-a-day/sports/erg-pb-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## What shipped (checks)

- Pick a == inPlace a: no copy needed; the repo source was byte-identical to
  `variants/a/src/` before and after (SHA-256 compared, all three files).
- `npm run build` clean, `npm run previews` minted the browse card
  (`ok preview`, 1 minted / 31 skipped / 0 failures), second build wrote the
  preview path into the manifest (32 with preview assets), fingerprints
  32 unchanged (the WHY.timeline paste moves no layout), `npm run verify`
  green end to end (543 jest + 68 pipeline + 1 bundle test, contract and
  dependency checks clean).
- `m0saic doctor . --json`: `"ok": true`, 32 rendered, 0 skipped, 0 errors.
  The 6 warnings are `bindingsCover` on other days' frozen templates; nothing
  aimed at today's. The `catalogSidecar` lag is repo-wide posture (target
  0.3.0, `lagOnly: true`, every shipped template lags it alike) - not a
  today fix.
- `m0saic make ... --tutorial --validate-only`: exit 0, "Validation passed",
  59s plan at 1080x1080, no stray output at the repo root.
- `WHY.timeline` now carries all four phases verbatim from
  `node pipeline/lib/trace.mjs --timeline journal/2026-10-17/trace.json`
  (check-why cross-checked it; the build phase honestly shows its trace
  `status: "error"` - the runner's build call hit its 66-minute timeout even
  though the phase completed its files).
- Browse card: `assets/templates/@one-a-day__sports__erg-pb-card__v1/preview.png`
  is 1920x1080 PNG, 99,007 bytes - byte-identical to variant a's clean
  landscape render (report.json: ok, degraded false, exit 0 on all canvases).
  No agent today could view images (no image input in this session either), so
  the card was verified by probe, not by eye; as an image template its card IS
  the render, so the blank-first-frame risk does not apply.

## Weak spots (honest; a human polish pass starts here)

- The pace marker at square sits only ~8px left of the 2:00 tick - distinct but
  tight at a glance (the critique's nit; deliberate center-on-scale math).
- The end tick labels are flush to the margins rather than centered on the
  end ticks (deliberate and tested; reads fine, but it is a choice).
- Tutorial page 2's "Reddit rowers photograph the PM5 screen instead" is the
  scout's paraphrase of the r/Rowing weekly thread's own name - reddit was
  403-blocked all day (disclosed in 10-scout.md), so it is the one sentence on
  the page not quotable to a source.
- No phase today could view images: every visual claim rests on the geometry
  inventory and pixel probes in this journal folder, not on an eye.
- The whole repo lags the 0.3.1 `catalogSidecar` convention (doctor `lagOnly`);
  when the maintainers adopt it, this template needs its
  `erg-pb-card.catalog.json` sidecar like every other.

## Follow-ups (what v2 would do)

- Widen the pace marker so its gap from the 2:00 tick at square reads safer
  (the critique's first polish suggestion).
- The PB ladder: one card per benchmark row from the Logbook CSV (500m to
  marathon) - the scouted use case named the ladder; v1 does one piece per
  card, which the brief scoped to keep the demo honest.
- A `--tutorial`-adjacent count-up-to-split clip was judged "possible but not
  the need" by the scout; revisit only if the community asks.

## Tokens and costs

Observed in `trace.json` and `60-token-costs.md` before this ship call ends:
21,166,287 tokens across the four completed phases, all costs reported by the
agent CLI (costBasis "reported" - no dated estimates needed, no missing
usage: 0 calls missing tokens, 0 missing cost):

- scout: 813,383 tokens, $0.43 (5.5 min, 31 calls)
- plan: 495,873 tokens, $0.40 (4.7 min, 16 calls)
- build: 18,224,257 tokens, $6.01 (66.0 min, 124 calls - the dominant phase;
  the runner's call timed out at the cap while the phase finished its files)
- critique: 1,632,774 tokens, $0.64 (8.5 min, 41 calls)

This ship call is not in those numbers: the trace is written after a call
ends, so `60-token-costs.md` (refreshed by the runner after this call) carries
the final totals including ship - read them there. OpenCode Go allowance
usage is not an additional per-run invoice.
