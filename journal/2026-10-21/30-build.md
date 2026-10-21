# Build — 2026-10-21

## Template: @one-a-day/gaming/typing-pb-card/v1

## Variant a — dark result card (the baseline) · gate: clean · render: ok (exit 0 everywhere, no degraded) · stills: judged without image input

One variant built, the brief's `a`: the app's own dark page with the
serika-yellow accent, hero wpm left-aligned under the header, five bands.

This model does not take image input, so the stills were not eyeballed
(the read of `stills/landscape.png`, `portrait.png`, `square.png` returned
"Cannot read image"). Per the build prompt the same claims were checked
against the flattened layout instead — a scratch probe
(`scratch/probe.mjs`, importing the BUILT dist) of
`layoutTypingPbCard({}, w, h)` at four canvases, plus
`report.json` and the test sweep:

- Every promised string is in the layout at every canvas, well-formed:
  "TYPING TEST", "KEYRUNNER", "english - time 60", "102" + "WPM",
  "+3 vs PB", "NEW PB", "wpm each second - peak 112 at 41s",
  "98.2%" / "84.5" / "108" with labels ACC / CONS / RAW, the sample footer.
- The chart track spans 0.91 of the width at 1080x1080 (0.95 at 1920x1080
  and 480x270), 59 plain bars + 1 accent peak = 60 seconds, first bar h=150
  ramping to h=178 at s31 and the full 183 at the peak (x=704, second 41) —
  the ramp the default chart encodes.
- The NEW PB badge is square (70x70 at 1080), the three stat tiles are one
  size (311x205 each), the hero (109px) dwarfs the handle (35px) and the
  tile values (90px). At 480x270 everything still clears the 6px floor.
- `report.json`: 3 renders + tutorial, all exit 0, none degraded, sizes
  45930-692572 bytes, probes at the asked dimensions, tutorial 59s/6 pages.
- The jest sweep asserts the same contract at all 7 contract canvases
  (12/12 passed), including the badge vanishing when wpm <= pb.

## Why-tutorial: the problem page and the solution page, one line each on what they say

- Problem page (tutorial-2): names who (Monkeytype users, the PB role bot),
  quotes the README's Discord bot ("auto-assign(s) optional roles based on
  typing performance") and the API's /results fields (wpm, rawWpm, acc,
  consistency, isPb, chartData.wpm), and lists the three sources actually
  opened.
- Solution page (tutorial-3): what this card draws (hero wpm, the
  raw/acc/consistency tiles, the per-second bar row), the one decision that
  matters (the PB is computed, never typed), and the raw>=wpm refusal rule.

## What was hard (two or three lines an author would want tomorrow)

- The scaffold title-cases the title ("Typing Pb Card") — check the label,
  the registry row and WHY.title for the intended casing before building.
- Test strings must be counted, not estimated: "seventeenchars!!" is 16
  characters and legitimately renders; the non-ASCII mode test needed a real
  U+00B0, not a lowercase "o".
- A 16-char handle fits even at 480x270 (unlike geocache's 40-char name);
  do not copy the neighbour's at-the-floor refusal test.

## In place now: a
