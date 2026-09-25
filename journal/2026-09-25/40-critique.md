# Critique — 2026-09-25

Judged from the stills (viewed), both report.json files (every render exit
0, degraded false), the variant sources, and the green gate run recorded in
30-build.md. Both variants carry the same props, tests and tutorial; they
differ by one idea, the wave's geometry.

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---------|---|---|---|---|---|---|---|---|---|-------|--------|
| a       | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 17    | no     |
| b       | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18    | no     |

## What each variant gets right / wrong

**a (centred bars).** Everything renders and fits (square-50, portrait-50:
quote wraps to three measured lines, footer clocks agree at 00:15 / 00:30).
Its weakness is the read: bars centred on the band's midline scan as a
graphic-equalizer, not the audiogram the community posts — a stranger
hesitates on what it is for (line 6). Its first renders also exposed the
black child canvas and the unpadded total; both fixes are in the code both
variants now share.

**b (mirror, PICK).** The same frame with the bars stood on a 2/3 midline
and a 16%-ink reflection below (square-50, landscape-90). It reads as an
audiogram from across the room — the exact convention Headliner and Wavve
made standard. The mirror is static, so it costs zero overlay layers; the
sweep still gates only the main bars. tutorial-2 quotes the scout's own
evidence with the three opened sources; tutorial-5 is the defaults;
audio was proven by probe (aac in, no track when silent - 30-build.md).

## Decision: SHIP b

## If ship: what a human polish pass should look at first

1. Portrait leaves a large empty band between the header and the media row
   — deliberate centring, but a reel-native layout (cover above quote,
   both larger) would use the height better.
2. The initials cover is a loud accent field at large canvases; a softer
   two-tone tile would sit quieter behind real cover art workflows.
3. `wave` accepts 8..32 values as given; resampling an arbitrary-length
   peaks file down to 32 inside the template would remove the one fiddly
   step in the batch pipeline.
4. Upstream: relative asset paths die at ffmpeg for template renders
   (ASSET_PATH_NOT_ABSOLUTE warns, then missing-input) — resolving against
   cwd would make the CLI one-liner copy-pasteable.
