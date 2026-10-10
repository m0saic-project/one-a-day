# Brief — 2026-10-09

## The use case (two sentences, from the scout)
Hobby genealogists post a five-generation ancestor chart with every ancestor's cell coloured by where they were born (#MyColorfulAncestry). Today they build it by hand in Excel: they copy each birthplace out of their genealogy program into a spreadsheet cell, colour the cell from the toolbar and screenshot the sheet. This template draws the same chart from rows they paste or from the GEDCOM file their program exports.

Honest framing (from the scout): colouring by country already exists in DNA Painter (one free dimension, free-text places that need hand fixes) and in the FamilySearch fan chart (shared tree only, fan only). What this template adds is the column layout people recognise from the 2016 spreadsheet charts, a colour key you choose (US state or country), and local rendering from your own GEDCOM, one chart per root person in a batch. The meme peaked in 2016. The need comes back with the weekly #52Ancestors prompt and with new finds.

## The template
- id: `@one-a-day/community/ancestor-birthplace-chart/v1`
  - Existing pack `community`. Like `qsl-card` (ham radio, ADIF in, card out) it turns a hobby's own export file into the picture that hobby shares in its groups. No new pack.
- title: Ancestor Birthplace Chart (the scaffold prefixes the date)
- kind: **image (still)**. `outputHints` follows the still convention of `qsl-card` and `radio-top-30-chart`: `format { kind: "image", container: "png" }`, durationMs 2000, fps 30, and a `note` saying the layout reflows by aspect. There is no platform knob. Canvas hint **1920x1080** (the spreadsheet charts are landscape). Must also work, and is swept, at 1080x1920 and 1080x1080, plus the seven contract canvases down to 480x270.
- duration: still.

## Layout (regions, ratios, what goes where)
One page. No media. Background is `document.backgroundColor` (warm paper, about #f6f3ec), not a full-canvas rect. Ink is near-black. Fractions below are of the canvas, and the build may tune them inside the contract.

```
landscape 16:9
+----------------------------------------------------------------------+
| CLARA WHITFIELD - ANCESTOR BIRTHPLACES     Fictional sample - 28/31   |  header ~10%
+-------------+-------------+-------------+-------------+--------------+
|             |             |             |  8 Amos     | 16 Josiah    |
|             |  2 Daniel   |  4 Harold   |-------------| 17 Martha    |
|             |  Whitfield  |  Whitfield  |  9 Ruth     | 18 Samuel    |
|  1 Clara    |  1958 Ohio  |-------------|-------------| ...          |
|  Whitfield  |-------------|  5 Mae      | 10 Patrick  |              |
|  1988 Ohio  |             |  ...        |  ...        |              |  chart ~74%
|             |  3 Laura    |  6 Walter   |             |              |
|             |  Brandt     |-------------|             |              |
|             |             |  7 Signe    |             | 31 unknown   |
+-------------+-------------+-------------+-------------+--------------+
| [] Ohio 4  [] Pennsylvania 4  [] Kentucky 4  [] Ireland 4  ...       |  legend ~16%
+----------------------------------------------------------------------+
```

- **Header** (top ~10%; portrait up to ~12%): the title on the left, the largest text on the page. A sub-line sits on the right in landscape and under the title in portrait or square: "5 generations - 28 of 31 known". At the default sample it reads "Fictional sample family - 28 of 31 known".
- **Chart** (~74%): five equal-width columns, generation 1 (the root person) on the left and generation 5 (16 cells) on the right. The geometry IS the Ahnentafel tree. Person n is a horizontal split of [cell n | (person 2n over person 2n+1)], every split 1:1, so cell n's vertical span is exactly the union of its father's (2n, above) and mother's (2n+1, below) spans. The father's line is always the top half. A thin gutter separates every cell, about 0.25% of the short side and at least 1 px, so two neighbours with the same colour still read as two cells.
- **Cell fill** is the colour of the cell's key, and **cell text** sits on that fill. The text colour is dark or light depending on the fill's luminance (contrast >= 4.5:1). Copy tiers are chosen PER COLUMN, so one generation never mixes tiers. The build measures the longest copy in the column and picks the richest tier whose font is at or above the floor, `max(7 px, 1.1% of the short side)` (12 px at 1080, 7 px at 270). Neighbours set their own floors too (7-10 px); the gate has no font floor of its own.
  - T0: "n Name" (it may wrap onto 2 lines at a word boundary in a tall cell), then "1923 - Ohio" (birth year and key)
  - T1: line 1 "n Name", line 2 "1923"
  - T2: one line "n Name"
  - T3: one line "n Surname" (the last word of the name)
  - T4: the Ahnentafel number alone
  - T5: no text, the colour alone
  Unknown cells are grey and read "n unknown" at T0-T3 and "n" at T4. Never ellipsize. Shrink to the floor, then drop a tier. The ladder is computed, not hard-coded per canvas. 1280x720 and 3840x2160 are 1920x1080 scaled, so they choose the same tiers. The test records the chosen tier per generation per canvas as a snapshot. The one hard minimum: at 1920x1080 every generation shows at least name and year (T1), because gen-5 cells there are about 380x50 px and fit two lines at about 18 px. At 480x270 gen 5 is about 96x12 px, which leaves one line at the 7 px floor, so expect T2-T4 there.
- **Legend** (bottom ~16%): one entry per key, each a square swatch then "Ohio 4" (label and count). The order is by count, highest first, with ties broken by the lowest Ahnentafel number that has the key. "Unknown" is always last. Up to 9 keys get their own entry and every further key folds into one "Other n" entry (n = people). The entries sit in a grid of equal cells, and the build picks the number of rows (1, 2 or 3) that gives the largest legend font. That is 1 row at 16:9 when it fits, and 2-3 rows at 1:1, 9:16 and the two small canvases (a 4-5 x 2 grid beats 9 x 1 at 480x270). The legend counts all 31 cells, the root included, so the counts add up to 31.
- **Palette**: 10 distinct categorical fills, medium lightness and mid saturation (spreadsheet pastels, not neon), assigned in legend order. The order is fixed, so the same data always gets the same colours. "Other" takes the 10th fill. Unknown is a neutral grey (about #c9c9c9) that no key colour can take. `colors` overrides by key.

Portrait and square keep the same five columns. Portrait has more height per generation-5 cell (about 90 px at 1080x1920) but less width (about 200 px), so names shrink or drop to a lower tier there. The tree is never rotated: rotated generation-5 cells would be 16 columns about 60 px wide, too narrow for any name.

## Layout contract (the invariants the build sweeps)
Swept at 1920x1080, 1280x720, 1080x1920, 1080x1080, 3840x2160, 640x360 and 480x270 at defaults. The test also sweeps the stress data: 31 known people with long names (up to 28 chars, e.g. "Wilhelmina Featherstonehaugh"), 12 distinct keys (so "Other" appears) and the longest key labels ("Pennsylvania", "Mecklenburg-Schwerin").
1. **Every text fits its box.** Every text source is tagged and gets a `textFits`: `title`, `subtitle`, `cell-text-g1` ... `cell-text-g5` (one label per generation, one-to-many, because the copy differs per tier; `mergeTextFits` keeps the widest em per label) and `legend-label` (one-to-many). The fit is at `cell * 0.94 - 2px`. Years and numbers are digit strings, which are wider than `TEXT_EM.prose` assumes (Roboto digits measure about 0.56 em against 0.52). So cell and legend text use `textFitsMeasured` with the width the build actually measured, not the prose ruler. Text that drops out by tier is absent, and absent is fine. Clipped text is not.
2. **Chrome lives where the design says.** `title` within `yFrac [0, 0.18]`. `legend` within `yFrac [0.6, 1]` and full width (`minWidthFrac 0.9`). `chart` within `yFrac [0.05, 0.95]`. The contract has no non-overlap constraint, so the test asserts from the rects that the chart does not overlap the title or the legend.
3. **Presence.** `title`, `chart`, `legend` and the five cell labels `ancestor-cell-g1` ... `ancestor-cell-g5` (bare `{ label }`) always render. The contract has no count field, so the test asserts the counts from the resolved rects: 1, 2, 4, 8 and 16 cells, 31 in total, known or unknown, and one swatch per legend entry.
4. **The tree is exact.** In the contract, `relations` holds one `{ label: "ancestor-cell-gK", equal: "height", tolerancePx: 1 }` per generation and `{ label: [all five], equal: "width", tolerancePx: 1 }`. Use `tolerancePx`, because the default relative 2% fails at 480x270, where gen-5 cells are 11-12 px. Only the test can check the spans, since no constraint compares edges across labels: top of n = top of 2n and bottom of n = bottom of 2n+1, within 1 px, from the emitted rects.
5. Not pinned: the exact header, chart and legend fractions beyond the bands above.

## Props (name · type · default · what it changes · required?)
All are optional. With no input the gate renders the full default sample. Defaults are ASCII, and rendered names and places are folded to ASCII (NFD, strip combining marks, then ss/ae/oe/o/l for the usual letters; anything still non-ASCII is dropped). Eight props plus the debug knob.

1. `title` · string (placeholder "auto") · "" · header title. "" makes it automatic: "<ROOT NAME> - ANCESTOR BIRTHPLACES" ("... DEATH PLACES" when `event` is death). 1-60 chars when given. No.
2. `ancestors` · json: an array of row strings, or one multi-line string (the shape of `radio-top-30-chart`'s `rows`) · the 28-row sample below · one row per person: `n | Name | year | place`, with an optional 5th field `key`. `|` and tab both separate fields, so a paste from a spreadsheet works. `n` is the Ahnentafel number 1-31. `year` may be empty, a 3-4 digit year ("1850") or one prefixed "c." ("c. 1850"), the same form the GEDCOM path produces. `place` is in GEDCOM PLAC order (smallest to largest, comma-separated). `key`, when given, is the colour key as typed, so a row can be coloured by occupation or anything else. Numbers that are missing are unknown (grey). A duplicate n, an n outside 1-31, or a year outside that form is refused, and the message names the row (`ancestors[4]`). This is primary in the UI. No.
3. `gedcom` · string, `meta.control { multiline: true, mono: true }` like astro's `csv` and chess's `pgn` · "" · the text of a GEDCOM 5.5.1 or 7.0 file. When it is non-empty it replaces `ancestors`. The parser reads only `INDI` (`NAME` with the slashes stripped, `BIRT`/`DEAT` with `DATE` and `PLAC`, `FAMC`) and `FAM` (`HUSB`, `WIFE`), and ignores every other tag. It walks FAMC to HUSB/WIFE from the root to fill Ahnentafel 1-31. When a person has several FAMC (birth and adoptive), it follows the one with `PEDI birth` and otherwise the first. The year is the first 3-4 digit token of `DATE`, prefixed "c." when DATE starts with ABT/EST/CAL/BEF/AFT/BET. A people loop (pedigree collapse) is fine because each slot is filled independently. A missing `0 HEAD` or an unknown root is refused. On the CLI it goes in through a props file (`--props @props.json`), as a JSON string. No.
4. `root` · string · "" · GEDCOM xref of the root person, e.g. "@I12@". "" means the first `INDI` in the file. Changing only this prop is the batch: one chart per sibling or cousin. Ignored without `gedcom`. No.
5. `event` · string, `oneOf` `birth` | `death` · `birth` · which GEDCOM event's DATE and PLAC fill the cells (the scout's "death place" remake). It also switches the auto title. The `ancestors` rows are taken as given. No.
6. `keyBy` · string, `oneOf` `state-or-country` | `country` · `state-or-country` · how the colour key comes out of a place. `state-or-country` matches the 2016 US charts: places in `homeCountry` key by their second-to-last element (the state) and all other places by their last element (the country). `country` always uses the last element. A place with one element keys by that element, and an explicit row `key` always wins. A known person with an empty place keeps their name in the cell, but the cell is grey and counts under "Unknown". No.
7. `homeCountry` · string · "USA" · the country whose places key by state. Matching is case-insensitive. "United States", "United States of America", "US" and "U.S.A." all fold to "USA", and the fold also applies to every place's last element before keying, in both `keyBy` modes. So "..., United States" and "..., USA" never become two legend keys. Set it to "Canada", "England" and so on. No.
8. `colors` · json object (the same shape as astro's `filterColors`) · {} · per-key `#rrggbb` overrides, e.g. `{"Ohio":"#e3a857"}`. A bad hex is refused, and the message names the key. `"Unknown"` and `"Other"` may be overridden too. No.
9. `debugLayout` · boolean · false · draws the contract. No.

Default `ancestors` (a fictional family, all names invented, ASCII):

```
1 | Clara Whitfield | 1988 | Columbus, Franklin, Ohio, USA
2 | Daniel Whitfield | 1958 | Dayton, Montgomery, Ohio, USA
3 | Laura Brandt | 1960 | Erie, Erie, Pennsylvania, USA
4 | Harold Whitfield | 1929 | Lexington, Fayette, Kentucky, USA
5 | Mae Corrigan | 1932 | Cincinnati, Hamilton, Ohio, USA
6 | Walter Brandt | 1927 | Pittsburgh, Allegheny, Pennsylvania, USA
7 | Signe Lindqvist | 1931 | Jamestown, Chautauqua, New York, USA
8 | Amos Whitfield | 1898 | Harlan, Harlan, Kentucky, USA
9 | Ruth Pennington | 1902 | Abingdon, Washington, Virginia, USA
10 | Patrick Corrigan | 1899 | Skibbereen, Cork, Ireland
11 | Nora Hayes | 1904 | Cincinnati, Hamilton, Ohio, USA
12 | Friedrich Brandt | 1895 | Bremen, Germany
13 | Anna Keller | 1899 | Pittsburgh, Allegheny, Pennsylvania, USA
14 | Nils Lindqvist | 1897 | Vaxjo, Kronoberg, Sweden
15 | Ellen Dahl | 1903 | Jamestown, Chautauqua, New York, USA
16 | Josiah Whitfield | 1866 | Harlan, Harlan, Kentucky, USA
17 | Martha Cole | 1870 | Pineville, Bell, Kentucky, USA
18 | Samuel Pennington | 1871 | Abingdon, Washington, Virginia, USA
19 | Lydia Shaw | 1875 | Bristol, Washington, Virginia, USA
20 | Michael Corrigan | 1868 | Skibbereen, Cork, Ireland
21 | Bridget Walsh | 1872 | Bantry, Cork, Ireland
22 | Thomas Hayes | 1871 | Ennis, Clare, Ireland
24 | Johann Brandt | 1864 | Bremen, Germany
25 | Margarethe Vogel | 1868 | Oldenburg, Germany
26 | Georg Keller | 1866 | Ulm, Wurttemberg, Germany
27 | Mary Ann Fisher | 1870 | Lancaster, Lancaster, Pennsylvania, USA
28 | Anders Lindqvist | 1865 | Vaxjo, Kronoberg, Sweden
29 | Karin Holm | 1869 | Ljungby, Kronoberg, Sweden
```

Numbers 23, 30 and 31 are left out on purpose, so they are unknown. The result is 28 of 31 known, and the keys come out as Ohio 4, Pennsylvania 4, Kentucky 4, Ireland 4, Germany 4, Virginia 3, Sweden 3, New York 2 and Unknown 3, which adds up to 31. That is 8 keys plus Unknown, so no "Other" at defaults.

## Beats
Still. No motion.

## Defaults must show
A finished chart with no input. The title is "CLARA WHITFIELD - ANCESTOR BIRTHPLACES" and the sub-line says the family is a fictional sample with 28 of 31 known. There are five columns of 1, 2, 4, 8 and 16 cells, coloured in 8 key colours plus three grey unknowns. At 1920x1080, generations 1-4 should reach T0 (name, year and state or country), and generation 5 shows at least T1 ("n Name" over the year). The legend reads Ohio 4 / Pennsylvania 4 / Kentucky 4 / Ireland 4 / Germany 4 / Virginia 3 / Sweden 3 / New York 2 / Unknown 3. The family's migration story should read from the colours alone. In the paternal (top) half, Kentucky and Virginia lines meet Irish immigrants in Ohio. In the maternal (bottom) half, German and Swedish lines settle in Pennsylvania and New York.

The sample's longest name is "Samuel Pennington" (17 chars) and its longest key is "Pennsylvania" (12 chars). The stress data in the test goes further than that.

## Acceptance rubric (the critic scores against this)
1. **The tree is right.** Ahnentafel placement is exact: father above mother, cell n level with 2n and 2n+1, 31 cells, equal heights per generation. The default legend counts are exactly the ones listed above and add up to 31. The key derivation follows `keyBy`/`homeCountry`. A small GEDCOM fixture in the test (3-4 generations, one ABT date, one missing parent, one pedigree-collapse repeat) lands each person in the right slot.
2. **It reads as the #MyColorfulAncestry chart at a glance.** Colour is the main signal and the legend makes it decodable. Names are legible at phone size on the 1920x1080 still for generations 1-4. Unknowns are clearly grey. Text contrast on every fill is >= 4.5:1. Colour is never the only cue for a key: generations 1-3 print the key in T0, and the legend names every colour.
3. **The layout contract holds at all seven canvases and at 9:16 and 1:1.** No clipped text and no overlaps. The tiers degrade per column (never mixed inside one column, never ellipsized), and the stress data (long names, 12 keys, "Other") holds too.
4. **Input is honest and robust.** `ancestors` and `gedcom` both work. `root` and `event` change only what they should. Bad input is refused with the line, key or xref named. Non-ASCII names fold to ASCII. Determinism: two renders match, with no clock and no `Math.random`.
5. **The framing tells the truth.** Defaults are labelled fictional. The why-tutorial says that DNA Painter and FamilySearch already colour by country, that the meme peaked in 2016, and that GEDCOM goes in as a string prop (props file on the CLI), not as a file path.

## Variants worth trying (up to 3, each ONE idea different)
- **a (the spec above):** five columns on a warm paper page with spreadsheet pastels and a legend band at the bottom.
- **b (data: per-generation shares):** Estes added percentages per column by hand. Under each generation column, a thin 100%-stacked bar shows the share of each key in that generation (Ohio 25% of generation 3, and so on). The legend is unchanged, counts included. Same props, the same tree and the same bands. The bars sit inside the legend band (yFrac >= 0.6), aligned to the columns. This tests whether the migration story reads faster per generation than the overall count does.
- **c (palette: the 2016 Excel look):** a white page, 1 px dark gridlines instead of gutters, and saturated Office-style fills (the look people screenshot in the Facebook groups), with bold cell text. The text colour is still chosen by luminance, not forced black: black on Office blue is about 4.45:1, under the 4.5:1 rubric floor. Same layout and contract as a. It tests whether recognition beats the softer palette.

## Takeover addendum (interactive session, 2026-10-09 12:35 PT)

The runner's first build call died on a network error (ENOTFOUND) 24 minutes
in and the runner parked for the next five-hour window. The founder asked for
the day to be taken over in a Claude Code session (Fable 5.1) and for a
VIDEO: "so many of them have been images lately". Everything above stands
except these changes:

- kind: **video** (mp4). `outputHints` 1920x1080, 30 fps, `clipSec` 16
  (4..60; an explicit duration pin becomes the clip). The same five columns
  at 1080x1920 and 1080x1080.
- Beats, as fractions of the clip: 0-8% the finished chart (frame 0 IS the
  picture: the browse card and the loop point); 8-14% the reset: every cell
  a pale blank tile with its name and year already on it, the legend already
  there - the typed-but-not-yet-coloured spreadsheet; 14-84% the replay: the
  colours land generation by generation, the root first, then the parents,
  and so on. The generations take 10 / 15 / 20 / 25 / 30% of the replay and
  the cells inside a generation land in Ahnentafel order at equal spacing,
  so generation 5 is a quick cascade of 16. 84-100% the finished chart
  again, so the clip loops.
- A generation header strip over the columns: YOU / PARENTS / GRANDPARENTS /
  GREAT-GRANDPARENTS / 2X GREAT-GRANDPARENTS (shorter forms on narrow
  columns). The header of the generation currently landing is tinted.
- Everything that changes is a gated colour tile in ONE mask-free child
  document (the chart). Cell text, the legend and its counts are static svg
  text: no drawtext, so pixels are deterministic across machines. Ink is
  chosen by the fill's luminance; a user colour dark enough to need light
  ink gates that cell's text to its landing as well, so the reset never
  shows light text on a pale blank.
- Props: the nine above plus `clipSec`. `ancestors` rows are
  `n | Name | year | place [| key]` as one multi-line string, an array of
  such strings, or objects {n, name, year, place, key}.
- Rubric line 2 gains: the clip opens and closes on the finished chart, the
  landing order is the Ahnentafel order, and in the reset only the colour
  is missing.
- Variants: a = the spec above as a clip. b and c are optional; the budget
  goes to a.
