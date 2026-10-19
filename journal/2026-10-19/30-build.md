# Build - 2026-10-19

## Template: @one-a-day/sports/hyrox-split-card/v1
## Variant a — shared scale · gate: clean · render: ok · stills: finish 1:11:40 is the largest figure on landscape, portrait and square; eight rows stay one stack, names in their own column (Ski through Balls); lap 4 fills the rail and its burpee bar is longer than the run; lap 6 is the short tape and the carry bar is clearly short; footer prints 6:06, 36:20, 4:20 as entered. No wordmark, no yellow, no HYROX or SkiErg in the pixels. 480x270 stays one line per row.
## Variant b — not built. The brief says try a full-width within-row split only if (a) reads as the swim card. It does not: the shared scale is what makes lap 4 long and lap 6 short.
## Variant c — not built. The slowest station is already the long clay bar (Burpee). Muting the other stations would hide the tape, not clarify it.
## Why-tutorial: the problem page quotes PacePost (a screenshot buries the finish time; you retype every split) and Sweatlas (a branded card that stops at the finish). The solution page says the finish is the hero, bar length is the split on one shared scale, and the full station names stay off the row.
## What was hard (two or three lines an author would want tomorrow)
`m0saic make` warns OVERLAY_CHAIN_DEEP (~50). Row washes overlap the rails, bars and text, so tiles stay off the xstack sheet. Glyphs did not tofu on the three canvases or the tutorial; do not add more overlapping tiles. The finish has to stay the tallest text inside yFrac [0, 0.30] while eight rows and the footer keep their bands down to 480x270 - shrink the row type before the finish. Do not `export const TITLE`: erg-pb-card already exports that name, and the pack `export *` collides.
## In place now: a
