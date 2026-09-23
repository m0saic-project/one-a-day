# Build - 2026-09-23

## Template: `@one-a-day/events/talk-timer/v1`

A video, hinted 1920x1080 at 30 fps, natural length `seconds + holdSec`
(305 s at the defaults), eleven props (none required, every one showing its
default). The geometry is a pure exported function (`layoutTalkTimer`), and
so is the timing: `sliceWindows` (which slice goes out when, and in which
colour), `phaseWindows` (the three gates the digits and the caption share)
and `digitsExpr` (the one drawtext expression). The test asserts the
windows against `ceil(remaining / slice)`, the expression string, the
clip-length rule, and the layout contract at the seven canvases for six
prop sets.

The new pack `events` was scaffolded by `npm run new` (registry, barrel,
`repo.ts`, `template-registry.ts`, `src/index.ts`); its description in
`repo.ts` was rewritten from the scaffold placeholder.

## Feasibility spike first (14 s clip, 720p)

Before any full render the template was rendered with
`{"seconds":12,"warnSec":6,"finalSec":3,"holdSec":2}` and frames cut at
every phase boundary (`logs/spike/`). Everything the brief promised worked
on the first try - `00:12` opens the clip, the digits flip at whole
seconds, the slices go out from the right, the digits and the caption turn
amber then red, `00:00` and `TIME` hold - and one thing did not:

- `OVERLAY_CHAIN_DEEP: 33 deep (threshold 20) with inline masks riding it
  ... Tiles stayed off the grid sheet because of: enable, loopMode,
  window.` Every enable-gated tile is its own overlay in ffmpeg's chain,
  and a 5 minute talk has 30 slices x 2 tiles + 3 digit copies + 3
  captions = 69. Past ~25 the chain silently degrades inline masks, which is
  every svg glyph on the frame. The fix that shipped: the bar is a CHILD
  document on its own small canvas. Its spent tiles are static, so they
  lower onto the grid sheet; only the lit tiles are gated; none of them
  carries a rounding mask. The parent chain is ~10 deep, the child's has no
  masks to degrade, and the re-spiked clip rendered with no warning at all
  (and in 6 s instead of 53).

## Variant a - the brief as written

gate: clean (`npm run build` green: conventions, layout contract at 7
canvases, why-tutorial; 10 jest tests) - render: ok (exit 0 at 1920x1080 /
1080x1920 / 1080x1080, 305 s each, no warnings) - tutorial: ok (358 s, six
pages).

Stills (`variants/a/stills/`): `04:30` green over 27 lit slices at 10 %;
`02:28` green at 50 %; `00:26` red with `LAST 30 SECONDS` at 90 %; plus two
the runner does not cut - `landscape-amber-250s.png` (`00:50`, amber digits,
amber tip on the bar, `WRAP UP`) and `landscape-end-302s.png` (`00:00`,
every slice spent, `TIME`). Portrait centres the digits-plus-bar group with
the title top-left and the rule at the bottom; square sits between.

Timings on this laptop: landscape 250 s, portrait 177 s, square 151 s,
tutorial 160 s - 12.3 min for the variant.

## Variant b - the room turns amber, then red

ONE idea different: two full-frame tiles painted first and gated to the
warn / final windows tint the whole frame (`#2a2008`, then `#3a1216` on the
dark preset), not only the digits. Built as a knob, `phaseTint` (default
on), rather than a hard fork - this is the one deviation from the brief's
prop table (eleven props, not ten) and it is deliberate: a stage wants the
room to change, a stream overlay may not, and the default is what the
critique decides.

gate: clean after `npm run fingerprints:update` (the tint tiles changed the
m0, and the fingerprint tripwire caught it exactly as designed - the first
build step of the split runner records the failure) - render: ok x3 -
tutorial: ok. Timings: 261 / 185 / 189 / 198 s.

What the stills say: the tint is unmistakable from across a room
(`landscape-amber-250s.png`, `landscape-90.png`), and it exposed a defect:
the SPENT slices stay the calm preset's blue-grey under a red frame, so the
bar reads as pasted on from another picture.

## Variant c - the bar belongs to the room

ONE idea different from b: a spent slice is translucent (the dim ink at
opacity 0.28 on dark, 0.22 on light) instead of an opaque grey, so whatever
the frame is behind it - navy, amber, red - shows through. Geometry is
byte-identical to b (the fingerprint did not move). The 720p spike
(`logs/spike/h-9.5.png`) shows the spent slices reddish-grey under the red
frame and unchanged in the calm phase.

gate: clean - render: ok x3 (exit 0, 305 s each) - tutorial: ok (358 s).
Timings: landscape 362 s, portrait 256 s, square 216 s, tutorial 225 s -
17.7 min; the translucent tiles are overlays in the child now, so the child
costs more than b's static ones did.

This is the one in place.

## Why-tutorial

- **The problem page** cites what the scout found, in the evidence's
  words: EventTimer's "large, unambiguous countdown in the speaker's line
  of sight ... turns yellow at the 1-minute mark and red at 30 seconds",
  Stagetimer's customer list, the gist / wiki / LinkedIn loop / Python GUI
  that each hand-write `%{eif\:S-t\:d}`, the OBS forum's "most people fake
  a pre-stream countdown with a fixed-length video", and the conference
  outside the window. Twelve sources, all opened this run, all in
  `10-scout.md`.
- **The solution page** describes what the variant does - the three
  mechanisms (gated slices, one drawtext expression, thresholds as gates)
  and the narrow claim (a file cannot pause or add time) - and its caveats
  (regenerate when the slot changes; the system font; minutes past 59).
  For c the ship phase must add the tint knob to the words, since the
  brief's page was written before b existed.
- **How it was made** (page 6) shows one provisional phase at critique
  time; the ship phase copies the finished session timeline in.

## What was hard (for whoever runs tomorrow)

- **Every `overlay.enable` tile is an overlay, and overlays are a chain.**
  Thirty gated tiles is thirty deep, and the engine's warning names the
  cost: past ~25 the svg glyph masks silently degrade. Put gated tiles in a
  CHILD document with nothing mask-bearing beside them (no `rounding` -
  rounding is an svg mask too), keep static tiles static so they lower
  onto the grid sheet, and let the parent see one `mosaic` source.
- **A child canvas must be 5-smooth.** The content width at 1920 is 1790 =
  2 x 5 x 179; a divisor lattice cannot quantize that under the basis, so
  placement degraded to exact and `check-registry` failed with
  `latticeSmooth: N=179`. `smoothDown(n)` (the largest 2^a 3^b 5^c at or
  below n) sizes the bar's canvas; the few pixels lost are margin. The test
  sweeps ten canvases, including 1366x768 and 999x777.
- **The layout checker flattens through `children`**, which is why the
  slice labels inside the child are found - and why the parent's own
  `mosaic` source label is NOT ("no source tagged bar"): flattening
  replaces it with the child's cells. Constrain the child's labels, not the
  wrapper.
- **Per-frame digits mean drawtext, and drawtext means the machine's
  font.** The svg rasterizer (the bundled, deterministic font every other
  template here uses) does not support `expr` text; the engine falls back
  to drawtext, which resolves `fontFamily` through fontconfig and emits no
  `font=` at the default - so the digits are whatever this machine's
  default sans is (a monospace with dotted zeros here). The document is
  deterministic; the pixels are deterministic per machine. Sized from a
  Roboto measurement of `88:88` with 15 % headroom, and stated as a caveat
  on the tutorial. A bundled `fontfile=` for expr text would close this;
  worth raising with the engine.
- **The drawtext expression escapes.** Inside `%{...}` use `\:` and `\,`;
  a literal `:` between two `%{eif}` blocks needs nothing on the engine's
  textfile path. `R = max(0, ceil(S - t - 0.001))` opens on `05:00`, flips
  at exactly one second and holds `00:00` through the end hold.
- **The clip length is the countdown.** `doc.durationMs` is authored,
  `resolveOutputHints(props)` declares it (equal to the static hint at
  the defaults, as the convention demands), and only
  `resolvePinnedDurationMs(ctx)` - an explicit user ask - overrides it, in
  which case the countdown becomes the pin minus the hold. The test util's
  2000 ms `ctx.target.durationMs` is a hint and is never read.
- **The why-tutorial spec throws at import** the moment a paragraph passes
  320 characters (problem[0] was 331): the budget is enforced, not advised.
- **The session harness reaped the one background render for low system
  memory** (16 GB laptop, ~5 GB free at rest) after ~10 minutes, and a
  foreground call is capped at ten minutes - shorter than a variant. So
  `logs/render-variant-split.mjs` runs the pipeline's `render-variant`
  steps one per call (`--step build|landscape|portrait|square|tutorial|
  snapshot`), copied from the pipeline script, writing the same
  `report.json` shape. One bug of its own, recorded in
  `variants/b/report.json`: it set `ok=false` on b's first (fingerprint)
  build failure and never cleared it; `ok` was re-derived from the steps.
- **Render cost is real.** A 305 s clip: ~4-6 min at 1920x1080, ~3 min at
  1080x1920 or 1080x1080, ~3 min for the tutorial at 720p; a variant is
  12-15 min. Every phase text copy is trimmed to its `window`, so three
  copies cost one clip's worth of drawtext, not three.
- **A pipe hides an exit code.** `npm run build | tail` made a failed build
  look green twice (the fingerprint tripwire for b, a type error for c) and
  a spike rendered the previous `dist/`. Capture `$?` before the pipe.
- **Reddit is 403 from this machine for the second day running**; see
  `10-scout.md`.

## Deviation from the brief, recorded

Eleven props, not ten: `phaseTint` (default on) carries variant b's idea as
a knob. Everything else in the brief's table shipped as written.

## In place now: c
