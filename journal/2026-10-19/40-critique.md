# Critique - 2026-10-19

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---------|---|---|---|---|---|---|---|---|---|-------|--------|
| a       | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 16    | no |

b and c were not built. The brief said to try them only if the shared scale read as the swim card or hid the slow station. It does neither.

## What each variant gets right / wrong

### Variant a (shared scale)

Right: landscape, portrait, square and the tutorial all exit 0 with `degraded: false`. `stills/square.png` shows `1:11:40` as the largest figure, `#64`, and eight named rows; lap 4 fills the rail and its burpee bar is longer than the run; lap 6 is the short tape and the carry bar is the short accent. Portrait and square stay one stack, one line per row (`Burpee`, `1:52`, `240` all fit). Footer on every still is `6:06` / `36:20` / `4:20`. No `HYROX`, no `SkiErg`, no yellow lockup. Tests assert the 386/584 bar rule, the checksum, fail-fast field names, and bindings (24 split paths). `check-registry` is clean for this id.

Wrong: the place column on `stills/landscape.png` is a bare `42`..`240` with no header, so a stranger cannot tell those are station places. `tutorial-2.png` quotes PacePost and Sweatlas and lists the four sources the scout opened, but glues "That card stops at the finish" onto the Sweatlas quote and paraphrases Rox Lyfe. `tutorial-6.png` shows scout and plan with numbers that match those trace rows, and omits build (114 calls, 7.8M tokens, $4.66, 23 min), so the headline "2 phases / $1.48" is not the day. Ship is supposed to refresh that page; it is not a feature the card claims, so it is not fatal.

## Decision: SHIP a

## If ship: what a human polish pass should look at first

The place column. On every still the right-hand numbers have no label, and `240` next to Burpee reads as an unexplained count. A `PLC` header, only if it still fits at 480x270, is the first pixel fix. Second: on `stills/landscape.png` the `RANK` label sits on the header rule; give it a few pixels. Before publish, copy `trace.json` into `WHY.timeline` or tutorial-6 will ship a day that never mentions the build.
