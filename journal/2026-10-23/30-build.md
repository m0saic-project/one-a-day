# Build - 2026-10-23

## Template: @one-a-day/sports/disc-bag-matrix/v1

## Variant a - baseline: chips name + numbers in the cell, dark share card, cool-to-warm row ramp anchored on `accent` - gate: clean - render: ok - stills: verified

Landscape / portrait / square all show the same 5 x 4 matrix claim by claim:
header ("Dana Kovac", "league bag - Oct 2026", "18 DISCS", gold accent mark);
all 18 chips with name + real flight numbers ("Firebird 9 3 0 4", "Wraith 11 5
-1 3", ...); every disc in the slot its speed and turn+fade say (Berg/Pig
OS-PUTTER stacked name-order, Teebird/Thunderbird OS-FAIRWAY, Wraith
OS-CONTROL, Tern US-DISTANCE, ...); 7 empty slots reading as faint tints (the
US-PUTTER hole, the near-empty CONTROL column, the BEEF row); axis labels
with per-column counts (4 / 4 / 6 / 1 / 3); footer "STABILITY = TURN + FADE",
"US FLIPS - BEEF FADES", "20 SLOTS - 13 FILLED - 7 EMPTY". Note: the brief's
sketch says "12 FILLED - 8 EMPTY" but the default bag fills 13 slots - the
footer computes the truth so it matches the grid. Pixel-extent checks
confirmed the right-aligned row labels sit flush to the grid with normal side
bearings (they look cut at low zoom; they are not).

## Variant b - one idea: label strategy, numbered chips keyed to a disc list on the right (DiscField's look) - gate: clean - render: ok - stills: verified

Same grid and props; chips show only the disc number (input order) and the
right column keys "1 Aviar 2 3 0 1" ... "18 Tern 12 6 -3 2". Every number
pairs with its list row and its slot; stacks sort name-then-input (2 over 3,
9 over 12). Crowding-proof cells as promised; 20-char names live in the list.

## Variant c - one idea: palette, light "printed chart" paper with muted class tints instead of the heat ramp - gate: clean - render: ok - stills: verified

Baseline layout, default preset "light": terracotta BEEF / khaki OS / sage
STABLE / dusty-blue US on warm paper, accent only on the header mark. Reads
like a scoreboard credit. Kept as a variant because the brief pins the
defaults to "a complete dark share card" - c's default is paper.

## Why-tutorial

Problem page: who (r/discgolf and r/mydiscbag bag-check posters) and the
observed quotes - "Feeling like I'm missing something today" with slot-talk
replies, DiscField's "speed and stability map ... numbered points", the
spreadsheet posts - plus all 6 sources, nothing clipped at 1280x720 or
1080x1920. Solution page: derived slotting (s = turn + fade), the densest-cell
chip rule with the count in the refusal, and the 3 honest weak spots.

## What was hard

- `_shared/text.ts` `fitLine` never terminates at px <= 6 (`round(px*0.92)`
  stops decrementing) - one 20-char name at a small canvas hung jest for 15
  minutes. This template ships its own decrementing fitter; the shared kit is
  untouched because every shipped template's fingerprint rides on it.
- A 20-char ALL-CAPS bold name needs <= 8px at 1080-wide canvases: the chip
  font floor is `max(5, 0.0072*S)` and the caps stress only fits at the three
  canvases the rubric names; the 480x270 sweep uses realistic mixed-case names
  (pathological caps cannot fit any readable floor there).
- PowerShell `Set-Content -Encoding UTF8` writes a BOM that node's
  `JSON.parse` refuses - check-why reported run.json "missing". Write journal
  JSON through node, never through the shell.

## In place now: a
