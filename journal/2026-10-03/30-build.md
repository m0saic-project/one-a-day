# Build - 2026-10-03

## Template: @one-a-day/community/qsl-card/v1

`src/community/qsl-card/v1/qsl-card.ts`. It is a new `community` pack, as the brief chose. Props are named after ADIF fields
(`stationCallsign`, `call`, `qsoDate`, `timeOn`, `freq`, `mode`, `rstSent`,
`myGridsquare`, `qth`, `myPotaRef`, `qslMsg`) plus `accentColor` and
`debugLayout`. The ADIF side is pure, exported and tested:

- `qslFormatDate`: `20261003` -> `03 OCT 2026`. It checks calendar days and leap years and rejects years before 1930, ADIF's floor.
- `qslFormatTime`: `1432` -> `14:32`, `143205` -> `14:32:05`.
- `qslBandOf`: BAND from FREQ. I checked the band table against the ADIF 3.1.6
  page (section III.B.4) during this build. The comparison runs in integer Hz, so the
  6m/5m seam (54 vs 54.000001) is exact. `27.185` is refused.
- `qslGrid`: Maidenhead validation in canonical case (`EN34lw`).

Bad input throws an error that names the prop. The test covers `qsoDate "20261332"`,
`timeOn "2560"`, `freq "27.185"`, `myGridsquare "ZZ99"`, a callsign with a
space and about a dozen more.

The card is built as four horizontal bands under a full-width accent bar. The
QSO table reflows by aspect: 6x1 at W/H >= 1.25, 3x2 down to 0.8, and 2x3
below that. Columns are as wide as their content needs, and the spare width is
shared equally between them. Every text is fitted against the measured font
(`textFitsMeasured`). The readability floor is 10/270 of the short side. Below
it the input is refused with an error, and it is never ellipsized. Hierarchy
is enforced and tested: the callsign px is at least 2x the value px, and the
worked call px is at least the value px. The values shrink first.

The tests sweep the layout contract at the 7 contract canvases plus 1650x1050
(the 5.5 x 3.5 in card) for 11 prop sets. Those include the brief's worst case
(`VP2V/G4ABC`, `VP2V/G4ABC/P`, a 32-character QTH, `143205`, `1296.200`), every
station line hidden, and the QSL message hidden.

## Variant a - bands (baseline) · gate: clean · render: ok · stills: checked
An open table: a dim label over a bold value, with one accent rule under each
label row. I opened landscape, portrait and square:

- Landscape: `N0CALL` dominates. `GRID EN34` / `Minneapolis, MN` /
  `POTA US-1234` are right-aligned at the right, with the prefixes in the dim ink.
- The strip reads `TO RADIO` (red tag), then `W1AW`, then `CONFIRMING OUR QSO` at the right.
- The table row reads `03 OCT 2026 | 14:32 | 14.074 | 20m | FT8 | -12`. The minus sign is there.
- The footer reads `TNX QSO 73` and `ADIF QSO CARD`.

Portrait has a 2x3 table and square a 3x2. In both, the confirmation phrase
drops to its own line. Scratch renders in `journal/2026-10-03/scratch/`
(worst case at 1920x1080, 1080x1080, 1080x1920, 480x270 and 1650x1050, and
the hidden-lines case at 1650x1050) all read cleanly, and no text clips.

## Variant b - station panel · not built
I skipped it to stay inside the 45-minute cap. The panel variant forces a 3x2
table into the right 62% of a landscape card. My guess is that the values
would come out at about 2/3 of variant a's size, but I never measured it. It
also changes two things at once (the header position and the table grid),
which makes it a weaker comparison than c.

## Variant c - ruled grid · gate: clean · render: ok · stills: checked
The only change is how the table is drawn. It is a printed form: rows+1
horizontal and cols+1 vertical ink rules, each 1/400 of the short side (the
test asserts both the counts and the thickness). Each label sits in its box's
top-left corner, with the value under it. The accent rule under the labels is
gone, so the accent now covers only the top bar and the TO RADIO tag. That is
a small departure from the brief's palette line. I checked the stills:

- Landscape: six boxes, and DATE is the widest.
- Portrait: a 2x3 form.
- Square: a 3x2 form.
- Worst case at 1080x1080 and 480x270: everything is inside its box.

The strings are the same as in a.

## Why-tutorial
- Problem page (tutorial-2): it quotes the WRL "QSL Card Generator" opening
  post ("select a template ... auto populated ... a PNG or JPEG could be saved
  off") and the "struggling with putting together a card" reply. It also
  covers the batch need from "Auto QSL Card" ("to all contacts made that day
  ... camping trip for 8 days"), the hand-placed Pillow script, and the point
  that Wavelog, DigiQSL and S53ZO take ADIF in but none renders an image per QSO
  from a CLI. Nothing clips. The page lists 6 sources and says there are "3 more in 10-scout.md".
- Solution page (tutorial-3): the props are the ADIF fields, the formats are
  printed the QSL way, and BAND is derived from FREQ. The one decision is that
  a callsign is never ellipsized: it reflows, then shrinks, then refuses. It
  also states that there is no photo background in v1. Its three caveats are no
  photo, no .adi reading (one call per QSO), and RST_RCVD/QSL_VIA not printed.

## What was hard
- At 1080 on the short side, the 10/270 floor is 40 px. That applies to
  every small line: labels, tags, the confirmation line and the mark. The first
  layout derived line heights from band fractions and refused its own default
  QTH at 1080x1080. The fix is to size each small line from the floor up
  (`lineH = floor / 0.62`) and only cap it from above.
- A shell heredoc with a `node -e` inside it ate the template literals
  (`${r}`) in a code patch. Patch from a `.cjs` file instead.
- Weak spot in c: at a few canvases the horizontal form rules overhang the
  right-hand vertical rule by a pixel. The rule under the form and the footer
  rule just below it make a double line.

## In place now: c
