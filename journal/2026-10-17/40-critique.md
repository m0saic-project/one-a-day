# Critique — 2026-10-17

Neither this critic nor the build agent could view images this session, so every
visual claim was re-verified rather than trusted: the geometry inventory
(`debug-geometry.mjs`, re-run), pixel probes of the actual stills
(`probe-pixels.mjs`, `probe-tutorial.mjs`, both re-run here, all PASS), the
builder's b probes (re-run; the two naive FAILs are single-point samples that
landed on glyphs — `probe-chip-b.mjs`'s box-level count confirms the ring +
page-fill + ink chip), `check-registry --json` (ok, 32/32 rendered, fingerprints
unchanged 32/32), `check-why --json` (ok), the template's own jest (34 passed),
and a byte-for-byte check that the in-repo source is variant a (the b revert is
exact). Read as strings, the stills carry no malformed number: "1:58.8" m:ss.t,
"/500m" under it, "7:55.0" captioned "2,000 m", ticks 1:00-3:00 equal, cells
26/SPM 209/WATTS 110/DRAG, the marker accent-verified at 49% of the track (just
left of the 2:00 tick) on square, portrait and landscape alike.

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18 | no |
| b | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 17 | no |

## What each variant gets right / wrong

### a — the base layout (in place)

- Right: the split is the hero at every aspect (211px vs 63px next at square,
  263px stretched at portrait; probe-verified ink in the hero band on all three
  stills), the marker sits at (118.8s-60s)/120s = 49% with the accent pixel
  confirmed at the computed spot on square/portrait/landscape, and the defaults
  are the cited 2026 ranking's own median 2k (7:55.0 and 50th are that page's
  printed 50th band; 1:58.8 = 7:55.0/4; 209 W = 2.8/(pace s/m)^3 — the math
  checks). The contract matches the brief's invariants line for line (header
  [0,0.3], split [0.16,0.6], track >= 85% with equal ticks, stats equal in
  [0.6,0.95], footnote [0.88,1] at most two lines, floors 1.8%/1.3%, chrome off
  min(H, 0.75W)) — not a ruler widened until it passes; the test sweeps all
  seven canvases across 23 stress prop cases with overlap and margin checks.
- Right: honest chrome — every figure entered (no PB claim, percentile supplied
  not computed, footnote says what moves), every text source tagged and
  prop-driven ones bound (resolvePropBindings verified in the test), floors
  refuse rather than clip (tested at 160x90), ASCII + accented Latin proven
  glyph-by-glyph in both weights, `ctx.target` proven against a divergent
  `ctx.output`, deterministic double-render.
- Wrong (nits, none fatal): at square the 9px marker sits only ~8px left of the
  2:00 tick — distinct but tight; the end tick labels are flush to the margins
  rather than centered on the end ticks (deliberate and tested, reads fine); the
  WHY timeline as frozen lists only scout and plan, so tutorial-6 today
  under-reports the run (see polish).

### b — the accent band (reverted, kept as exploration)

- Right: it is exactly the brief's variant b (accent stat strip with light
  values, tinted dividers, outlined pill), gated clean with its own re-minted
  fingerprint, rendered ok, and the probes quantify it honestly (the strip fills
  95% of its band; the outlined chip is ring + page-fill + ink).
- Wrong: the trade — accent coverage jumps 0.9% -> 8.7% of the canvas, so the
  strip competes with the split hero for the first glance, and the outlined
  chip demotes the percentile, which is this community's distinctive claim
  (the ranking page prints the bands; nothing else in the scouted world does).
  Same props, same WHY, same tests otherwise.
- The builder's revert is the right call and is exact (restoring a reproduced
  its fingerprint byte-for-byte; the repo source is byte-identical to
  variants/a/src).

## Decision: SHIP a

## If ship: what a human polish pass should look at first

1. **The ship phase must copy the trace into WHY.timeline** (`node
   pipeline/lib/trace.mjs --timeline journal/2026-10-17/trace.json`, then
   rebuild). As frozen, tutorial-6 shows scout and plan ($0.83) and omits the
   day's dominant phase — build alone was 66 minutes, 18.2M tokens, $6.01 of
   the $6.84 total. Skipping it would ship a "how it was made" page that
   understates the run by ~88%.
2. Tutorial page 2's "Reddit rowers photograph the PM5 screen instead" is the
   scout's paraphrase of the r/Rowing weekly thread's own name (reddit was
   403-blocked all day, disclosed in 10-scout.md); every other quote on the
   page is verbatim from an opened source. Acceptable, but it is the one
   sentence not quotable to a page.
3. If a v2 ever happens: widen the pace marker so its 8px gap from the 2:00 tick
   at square reads safer at a glance; v1 is honest, tested and clear as is.
