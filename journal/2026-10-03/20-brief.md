# Brief — 2026-10-03

## The use case (two sentences, from the scout)
After every operating session (a contest weekend, a park activation, an evening
on FT8), a ham radio operator owes each station they worked a QSL card. The card
confirms the contact, and its content is always the same handful of ADIF log
fields: call, date, UTC, MHz, band, mode, RST. Members of the World Radio League
forum ask for exactly this: "select a template ... the appropriate information
(other callsign/band/frequency/mode/time/report/etc.) would be auto populated
... a PNG or JPEG could be saved off". So the template renders one card per
QSO record, headless, so a script can loop over a whole log.

## The template
- id: `@one-a-day/community/qsl-card/v1`. The pack is new: `community`, from the
  preferred vocabulary. A QSL card is something one hobby community trades
  between its members. It is not a sports result, and it is not an event poster
  like the ones in `events`. Ham radio, cubing and tabletop days would all land
  in this pack.
- title: `Ham Radio QSL Card`
- kind: image. Canvas hint 1920x1080. Landscape, portrait (1080x1920) and square
  (1080x1080) must all work. The physical card is 5.5 x 3.5 in (about 11:7,
  1650x1050 at 300 dpi), which sits between the landscape and square layouts.
  It has to render cleanly too, and the test should include it.
- duration: still

## Layout (regions, ratios, what goes where)
The layout is four full-width bands stacked top to bottom, with a thin accent
bar at the very top. Ratios are of canvas height in landscape. Builders may
nudge them by a few points, but the order and roles are fixed.

```
+--------------------------------------------------------------+
|==================== accent bar (~2%) ========================|
|                                              GRID  EN34      |
|  N0CALL                                      Minneapolis, MN |  header ~40%
|  (station callsign, the biggest thing)       POTA  US-1234   |
+--------------------------------------------------------------+
|  TO RADIO   W1AW                      CONFIRMING OUR QSO     |  to-radio strip ~14%
+-----------+--------+---------+-------+--------+--------------+
|  DATE     |  UTC   |  MHz    | BAND  | MODE   |  RST         |  label row  } QSO table
|  03 OCT 2026 | 14:32 | 14.074 | 20m  | FT8    |  -12         |  value row  } ~30%
+-----------+--------+---------+-------+--------+--------------+
|  TNX QSO 73                                   ADIF QSO CARD  |  footer ~14%
+--------------------------------------------------------------+
```

- **Header.** In landscape, the station callsign takes the left ~60% and the
  station block (grid, QTH, POTA ref) takes the right ~40%, as right-aligned
  lines. In portrait and square, the callsign spans the full width and the
  station block sits on one or two lines under it. The callsign is sized FROM
  its text: the cap height comes from the band, and a long call gets less.
  A short call (K1A) is limited by height. A long call (VP2V/G4ABC) is limited
  by width.
- **To-radio strip.** It reads "TO RADIO" in small caps and then the worked
  call, which is the second-largest text on the card. The confirmation phrase
  sits at the right in landscape, or on a second line in portrait.
- **QSO table.** Six cells: DATE, UTC, MHz, BAND, MODE, RST. Each cell has a
  small label over a larger value. Columns are weighted by their fitted content,
  so DATE ("03 OCT 2026") is wider than BAND ("20m"). They are not equal.
  The table reflows by aspect (W/H):
  - `>= 1.25`: one row of 6 columns
  - `0.8 - 1.25`: 3 columns x 2 rows
  - `< 0.8`: 2 columns x 3 rows

  The band's share of height grows with the row count. Reflowing comes first;
  shrinking the type to fit is the second resort.
- **Footer.** QSLMSG on the left ("TNX QSO 73"). A fixed small mark on the right
  says what the card is ("ADIF QSO CARD"). It is decorative, and the builder
  may drop it if it costs fit.
- **Palette.** The face is paper (`#f4f1ea`, as `document.backgroundColor`, not
  a full-canvas rect). Ink is dark navy and labels are a muted grey-blue. One
  accent colour (default `#b3261e`, QSL-card red) covers the top bar, the
  label row rule and the "TO RADIO" tag. There is no photo slot in v1, because
  we ship no media. The card has to look like a card from geometry and type
  alone.
- Gaps are geometry (insets), never blank text lines. Splits above 12 parts
  use `weightedSplit(..., { precision: 120 })`.

## Layout contract (the invariants the build sweeps)
- **Every text fits its box** at all seven contract canvases and at 1650x1050,
  at defaults. The template test must also sweep worst-case copy:
  `stationCallsign: "VP2V/G4ABC"`, `call: "VP2V/G4ABC/P"`, `qth` at its
  32-character max, `timeOn: "143205"`, `freq: "1296.200"`. Give each cell
  its own label: `callsign`, `station-grid`, `station-qth`, `station-pota`,
  `to-radio`, `worked-call`, `confirm`, `col-label-<k>`, `col-value-<k>`
  for k in date|utc|mhz|band|mode|rst, `qslmsg`, `mark`.
- **Header in the top half:** `callsign` sits `within: { yFrac: [0, 0.5] }`.
- **The QSO table is present and complete.** All six `col-value-*` labels exist
  and sit `within: { yFrac: [0.3, 0.92] }`.
- **The footer is a bottom band:** `qslmsg` sits `within: { yFrac: [0.6, 1] }`.
- **The accent bar is full width:** `minWidthFrac: 0.98`.
- **Hierarchy (prose, asserted in the test, not the contract).** The callsign
  font px is at least 2x the table value px. The worked call px is at least
  the table value px. If the callsign would drop below 2x, the table values
  shrink first.
- Fit copy at `cell * 0.94 - 2px`. The readability floor is 10/270 of the
  short side. Below the floor the template refuses the input with a clear
  error. It never ellipsizes a callsign.

## Props (name · type · default · what it changes · required?)
Props mirror ADIF field names (camelCase), so an operator can map a log record
by eye. All are optional with defaults, and only `undefined` takes the default.
An explicit `""` on a field that requires a value is an error, not a request
for the sample.

| # | prop | ADIF | type | default | renders as / rule |
|---|------|------|------|---------|-------------------|
| 1 | `stationCallsign` | STATION_CALLSIGN | string | `"N0CALL"` | header callsign; 3-13 chars `[A-Z0-9/]`, upper-cased |
| 2 | `call` | CALL | string | `"W1AW"` | "TO RADIO W1AW"; same rule |
| 3 | `qsoDate` | QSO_DATE | string `YYYYMMDD` | `"20261003"` | `03 OCT 2026` (the month is spelled out, so the date reads the same in the US and the EU); invalid calendar dates are errors |
| 4 | `timeOn` | TIME_ON | string `HHMM` or `HHMMSS` | `"1432"` | `14:32` (or `14:32:05`) under the UTC label; 24h range checked |
| 5 | `freq` | FREQ | string, MHz decimal | `"14.074"` | MHz cell as given (no rounding); the BAND cell is DERIVED from it with the ADIF 3.1.6 band enumeration (e.g. 14.074 -> 20m, 7.074 -> 40m, 144.174 -> 2m, 432.100 -> 70cm). A frequency in no amateur band (27.185) is an error that names the field |
| 6 | `mode` | MODE / SUBMODE | string | `"FT8"` | MODE cell; 1-8 chars `[A-Z0-9-]` upper-cased; no enumeration check (print what the log says) |
| 7 | `rstSent` | RST_SENT | string | `"-12"` | RST cell; `RS`/`RST` digits (`59`, `599`) or a signed dB report (`-12`, `+05`) |
| 8 | `myGridsquare` | MY_GRIDSQUARE | string | `"EN34"` | "GRID EN34"; 4, 6 or 8-char Maidenhead, validated, printed in canonical case (`EN34lw`); `""` hides the line |
| 9 | `qth` | MY_CITY / MY_STATE | string | `"Minneapolis, MN"` | QTH line; up to 32 printable ASCII; `""` hides it |
| 10 | `myPotaRef` | MY_POTA_REF | string | `"US-1234"` | "POTA US-1234"; `XX-NNNN(N)` shape; `""` hides it (most cards are not from a park) |
| 11 | `qslMsg` | QSLMSG | string | `"TNX QSO 73"` | footer line; up to 40 printable ASCII; `""` hides it |
| 12 | `accentColor` | - | color | `"#b3261e"` | top bar, label rule, TO RADIO tag |
| - | `debugLayout` | - | boolean | `false` | draws the contract over the card |

Defaults are labelled examples. N0CALL is the conventional placeholder
callsign in ham software. W1AW is the ARRL station that ham documentation
habitually uses as its example. The default grid sits in the 0 call district,
so it agrees with N0CALL.

When an optional station line is `""`, it removes its prefix too, and the
remaining lines re-centre in the station block. No line ever leaves a hole.
If all three are hidden, the callsign takes the full header width in
landscape.

## Beats
Still. There are none.

## Defaults must show
A complete, printable-looking QSL card with no inputs. N0CALL is huge in
navy on paper, under a red bar. GRID EN34, "Minneapolis, MN" and
"POTA US-1234" sit at the right of the header. Next comes "TO RADIO W1AW,
CONFIRMING OUR QSO". The labelled row reads
`03 OCT 2026 | 14:32 | 14.074 | 20m | FT8 | -12`, and the footer reads
"TNX QSO 73". A ham should recognise it as a QSL card from across a room.

## Acceptance rubric (the critic scores against this)
1. **Reads as a QSL card in one glance.** The station callsign dominates.
   "TO RADIO <call>" comes second. One labelled QSO record carries all six of
   DATE / UTC / MHz / BAND / MODE / RST. The landscape still would pass as an
   emailed QSL.
2. **ADIF fidelity.** Props are named after ADIF fields and take ADIF formats.
   `20261003` renders `03 OCT 2026`, `1432` renders `14:32`, and BAND is
   derived from FREQ using the ADIF band table. Bad input fails fast and names
   the prop: `qsoDate: "20261332"`, `timeOn: "2560"`, `freq: "27.185"`,
   `myGridsquare: "ZZ99"`, a callsign with a space. The test covers these.
3. **Text fits everywhere.** Nothing clips at the seven contract canvases or
   at 1650x1050. Nothing clips with the worst-case callsigns. Portrait and
   square reflow the table (3x2 / 2x3) and don't shrink it into illegibility.
   The callsign is never ellipsized.
4. **Defaults look finished.** The card is balanced, uses the paper palette and
   has no dead space. Hiding grid, QTH, POTA or the QSL message with `""`
   leaves no hole and no orphaned prefix.
5. **Honest and deterministic.** The same props give the same PNG. The why-tutorial
   and registry description say plainly that there is no photo background in
   v1 and that BAND is derived. The defaults are labelled examples, not
   anybody's log.

## Variants worth trying (each ONE idea different)
- **a: Bands (baseline).** The layout above: horizontal bands, an open
  label-over-value table, a thin accent rule under the label row.
- **b: Station panel.** Same props, palette and table. The header becomes a
  left panel (~38% of width, full height below the accent bar) holding the
  callsign, grid, QTH and POTA ref. The to-radio strip, table and footer stack
  in the right 62%, and the table uses 3x2 there even in landscape. This is
  the classic "logo side / data side" QSL. Portrait falls back to stacking the
  panel on top.
- **c: Ruled grid.** Same layout as a, but the QSO table is drawn as a printed
  form: every cell is boxed by thin ink rules (rects, 1/400 of the short side),
  with the labels in the boxes' top-left corners. It is the look of a
  pre-printed QSL that someone filled in by hand. The only change is how the
  table is styled.
