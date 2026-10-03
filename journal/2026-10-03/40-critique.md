# Critique — 2026-10-03

Judged: variants `a` (bands, the brief's baseline) and `c` (ruled grid, in
place). `b` was not built. For each variant I looked at the three canvas stills
and the six tutorial pages. I also looked at the builder's worst-case scratch
renders (`scratch/worst-*.png`, `scratch/c-worst-*.png`, `scratch/hidden-1650x1050.png`)
and zoomed into c's form corners pixel by pixel
(`scratch/critique/c-*.png`). I read both sources and both tests, and ran
`npx jest src/community` (8/8 pass, c in place), `check-registry --json` (no
errors for this id), `check-layout` and `check-why` (both clean). a's own
suite passed 8/8 in the build log before c replaced it.

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a (bands) | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 17 | no |
| c (ruled grid) | 2 | 2 | 2 | 1 | 1 | 1 | 2 | 1 | 2 | 14 | no |

Line 6 is 1 for both. A plain paper card is legitimate, and contest-style
text-only QSLs exist. But the usual emailed QSL has a photo, and using this
one means writing a script that turns an ADIF record into `--props`. The
people the scout found would use it, but only the ones who script.

## What each variant gets right / wrong

I read every string on the stills. At defaults both variants print exactly
what the brief's "Defaults must show" promised:
`N0CALL` / `GRID EN34` / `Minneapolis, MN` / `POTA US-1234` /
`TO RADIO W1AW` / `CONFIRMING OUR QSO` /
`03 OCT 2026 | 14:32 | 14.074 | 20m | FT8 | -12` / `TNX QSO 73`. The minus
on `-12` is there. The date is the QSL convention. 14.074 MHz really is the
20m FT8 frequency, so BAND agrees with FREQ. EN34 really is the Minneapolis
grid. No string is malformed.

**a - bands**
- Right: `landscape.png` passes as an emailed QSL from across a room. The call
  is about 2x a table value, and W1AW is larger than the values. The accent is
  used exactly where the brief put it (top bar, the label rule, the TO RADIO
  tag). `portrait.png` reflows to 2x3 and `square.png` to 3x2 with the values
  still bold and large. `hidden-1650x1050.png` re-centres the lone QTH line,
  with no orphaned prefix. The worst case (`VP2V/G4ABC`, `VP2V/G4ABC/P`,
  `1296.200` -> `23cm`, `14:32:05`, `OLIVIA-8`, a 32-character QTH) fits at
  1080x1920. The ADIF side is pure and tested: the date with leap years, the
  time range, the band table in integer Hz including the 6m/5m seam, the
  Maidenhead case, and 18 bad inputs that each name their prop.
- Wrong: `ADIF QSO CARD` is printed in the footer of every user's card, and
  no prop removes it. It is the file format's name, not something a ham
  writes on a QSL. The brief allowed it, but it leaks the template's pitch
  onto the user's card.
- Wrong: in `portrait.png` (and `worst-1080x1920.png`), `CONFIRMING OUR QSO`
  floats alone, with about 90 px of air above and below. It reads as detached
  from `TO RADIO W1AW`. In `square.png`, N0CALL is limited by height and ends
  around half width, which leaves the top-right quarter of the header empty.
  Both are balance issues, not fit issues. Roboto's unslashed `0` makes
  `N0CALL` read as `NOCALL`. Hams print a slashed zero on cards for exactly
  this reason. That is a font limit, but worth knowing.

**c - ruled grid**
- Right: same strings, same ADIF engine, same fit sweep. The boxed form does
  look like a pre-printed QSL in `landscape.png` and `square.png`, and labels
  sit cleanly in the box corners. `c-worst-1080x1080.png` and
  `c-worst-480x270.png` keep everything inside its box.
- Wrong: the one idea of the variant, the form, has ragged corners. At
  pixel level the horizontal rules overhang the right vertical rule by 1 px
  in `square.png` (top and bottom right). In `landscape.png` the right
  vertical pokes 1 px above the top rule. The form's bottom rule and the grey
  footer rule sit about 25 px apart (868 vs 893 in landscape, 885 vs 912 in
  square) and read as a double line. The builder noted both and shipped them anyway.
- Wrong: the `accentColor` prop description still says it colours "the
  rules under the table labels". c has no such rules. Its form is drawn in
  INK, so the prop documentation is false for this variant (line 5). The
  accent also dropped off the label rule the brief's palette assigned it,
  which is an admitted departure from the brief (line 8). Like a, it keeps the
  unremovable `ADIF QSO CARD` mark and the floating confirmation line in
  `portrait.png`.

The why-tutorial is the same for both, and it is true. `tutorial-2.png` quotes
the WRL thread in the scout's words ("select a template ... auto populated
... a PNG or JPEG could be saved off", 57 likes, "struggling with putting
together a card", "camping trip for 8 days"). It lists six sources that are
all in `10-scout.md`, with "3 more" pointing there. `tutorial-3.png` claims
only what both variants do (ADIF props, derived BAND, reflow, never-ellipsize,
no photo) and lists its caveats. `tutorial-5.png` is each variant at its
defaults. `tutorial-6.png` shows scout and plan, the phases that had run when
it was rendered. AGENTS.md has the ship phase copy the full trace into
`WHY.timeline`.

## Decision: SHIP a

a does everything in the brief's acceptance rubric. It reads as a QSL in one
glance, its ADIF handling is faithful and tested, text fits at the 8 canvases
across 11 prop sets, the defaults look finished, and the tutorial is honest.
c adds an idea, but it draws that idea with visible 1 px corner defects and a
double rule, and its own prop documentation is false. a is in `variants/a/src/`.
The ship phase must copy it over the in-place c (`pick` != `inPlace`),
including a's `qsl-card.layout.m0`. It must also make sure the registry
`description` is a's ("... the date and time printed the QSL way ..."), not
c's "the QSO in a ruled form".

## If ship: what a human polish pass should look at first
1. `ADIF QSO CARD` on every card. Make it a prop (default `""`) or drop it in
   v2. A user cannot remove it from v1.
2. The portrait to-radio strip. `CONFIRMING OUR QSO` should sit tight under
   `TO RADIO <call>`, not float midway to the table.
3. The square header's empty top-right. Either let the station block sit
   beside a short call when it fits, or give the call more height.
4. Slashed zero. Callsigns are where O/0 confusion costs a QSL. Check whether
   the engine has a font with a slashed or dotted zero.
5. Before tagging, confirm `src/community/qsl-card/v1/` matches
   `variants/a/src/` byte for byte, and re-run `npx jest src/community` and
   `check-registry` with a in place.
