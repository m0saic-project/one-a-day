Digest for the 2026-10-06 PLAN phase (weekly parkrun event summary), based on the six neighbouring days. All paths are relative to `C:/src/m0saic-production/one-a-day/`.

## (1) The shape of a good 20-brief.md

The required skeleton is in `pipeline/prompts/20-plan.md`:
- `# Brief — DATE`
- `## The use case (two sentences, from the scout)`
- `## The template`: id (plus one sentence if the pack is new), title, `kind: image|video; canvas hint WxH; aspects that must work`, `duration`
- `## Layout`
- `## Layout contract`
- `## Props (name · type · default · what it changes · required?)`
- `## Beats`
- `## Defaults must show`
- `## Acceptance rubric` (1…5)
- `## Variants worth trying` (up to 3, each ONE idea different)

The phase then sets `pack`, `slug`, `title` and `plan: "done"` in state.json.

The best briefs (radio, 10-05; cubing, 10-04; swim, 10-01) add these sections:
- **Neighbours read.** One paragraph naming the neighbour ids and the lesson taken from each, then "What is new against those".
- **`## The design decisions`.** 2–6 numbered, bold one-line rulings, each with a paragraph of reasons. Radio has 6, for example "**4. Long strings: shared size first, the long row alone second, refusal last.**"
- **Layout.** An ASCII sketch for each arrangement (stacked square/portrait next to wide). Bands are given as approximate fractions ("about 12-14%… targets, not pins"). It names the aspect switch (`w/h >= 1.3`) and a few-rows rule ("cap the row height so a Top 5 does not become slabs"). It states the mechanism ("static svg text in the bundled font plus plain colour tiles", plus a reminder about 5-smooth splits above 12).
- **Layout contract.** Bullets that name labels and literal constraint values (see the excerpt below). It also says what is tested in the test rather than in the contract.
- **Props table.** Columns are `prop | type | default | what it changes`. Below it comes **"Rules, not props:"**: parse formats, validation ranges, character set, refusal messages, and what is not computed. QSL adds a source-field column (ADIF) and a numbered order.
- **Test vectors and stress copy.** Exact strings, plus the expected outputs worked out by hand. Radio lists marker strings for all 30 rows. Cubing gives the Ao12 half-up edge case, 28345/10 → `28.35`.
- **Defaults must show.** A string-by-string description of the hinted canvas, plus "Honest weakness the defaults will show" (the font px it will cost).
- **Acceptance rubric.** Five numbered points, each a dense paragraph with concrete strings and canvases. The critic still scores its fixed 9 lines at 0–2 (`pipeline/prompts/40-critique.md`). The brief's rubric feeds line 8 ("the variant does what 20-brief.md promised") and line 2 ("Defaults must show").
- **Variants.** a is the baseline. b and c each change one prop value (`lead: true`, `bar: "spread"`, `preset: "light"`). Add: "leave the one intended to ship last in place and make its choices the defaults".
- **`## What is weak in this plan`.** Bullets naming evidence limits, missing importers and density.

Excerpt from the best brief (`journal/2026-10-05/20-brief.md`, Layout contract):
```
- every text fits its box: station, chart title, week-of, footer, and per row the rank, marker, artist, title and label (a label per row and field; the copy differs). Measured fits (`textFitsMeasured`), fitted at `cell * 0.94 - 2px`.
- the header lives at the top: station and chart title `within yFrac [0, 0.2]`. The footer lives at the bottom: `within yFrac [0.9, 1]`.
- the chart is the card: every row cell `within yFrac [0.08, 0.97]`, all row cells the same size (`equal: "size"`), each at least a quarter of the canvas width (`minWidthFrac: 0.25`).
- presence: a row cell, a rank, an artist and a title for every row given.
- no pinned fractions; the use case does not ask for one.
In the test, not the contract: exactly `n` row cells; rank `i` is in column ...; the shared sizes are shared ...; determinism; each validation error.
```

## (2) Each neighbour

Every neighbour has `debugLayout: boolean = false`, and the prop counts below include it.

**community/qsl-card (2026-10-03)**
- Still PNG. Hint 1920x1080, and 1650x1050 (the physical card) is tested too. 13 props: `stationCallsign call qsoDate timeOn freq mode rstSent myGridsquare qth myPotaRef qslMsg accentColor debugLayout`.
- No list. The fixed 6-cell table reflows by aspect: `>=1.25` gives 6x1, `0.8–1.25` gives 3x2, `<0.8` gives 2x3. "Reflowing comes first; shrinking the type to fit is the second resort."
- Empty states: `""` on an optional line hides the line and its prefix, and the remaining lines re-centre. Only `undefined` takes the default. `""` on a field that needs a value is an error.
- Floor: `Math.max(1, Math.round((S*10)/270))`, i.e. 10/270 of the short side. Below it the render refuses ("cannot be fitted on WxH above the Npx readability floor"). A callsign is never ellipsized.
- Hierarchy asserted in the test: call px ≥ 2x the table value px.
- Constraints (`src/community/qsl-card/v1/qsl-card.ts:438-442`):
```
{ label: "callsign", within: { yFrac: [0, 0.5] } }
{ label: `col-value-${k}`, within: { yFrac: [0.3, 0.92] } }  // k in date|utc|mhz|band|mode|rst
{ label: "qslmsg", within: { yFrac: [0.6, 1] } }  // only if present
{ label: "accent-bar", minWidthFrac: 0.98 }
{ label: "worked-call" }
+ textFitsMeasured(label, text, px, width) per text cell
```

**music/radio-top-30-chart (2026-10-05)**
- Still PNG. Hint 1080x1080. 9 props: `rows station weekOf genre footer lead accent preset debugLayout`.
- The variable list is `rows`, 1–30 strings `Artist | Title | Label [| LW]`. More than 30 is refused, with a message saying a longer list needs a second card.
- Grid: `columns = ceil(n/cap)`, cap 10 when wide (`w/h>=1.3`) and 15 otherwise. The last column may be short and its empty cells stay empty. A short chart is one column with a capped pitch (`min(S*0.11, …)`), and the rows group at the top.
- Fit ladder: shared size down to `RADIO_CHART_SHARED_FLOOR = 0.85` of the cap (line 292), then the line shrinks alone down to `RADIO_CHART_ALONE_FLOOR = 0.5` (line 294), then refusal by row and field. There is no absolute px floor, so 480x270 is "a thumbnail".
- Empty states: `weekOf`/`footer` `""` removes the line ("not the band"). `genre` `""` gives `TOP 30`. If no row has LW, no markers are drawn and the numerals centre.
- Constraints (lines 631-638):
```
{ label: "station", within: { yFrac: [0, 0.2] } }
{ label: "chart-title", within: { yFrac: [0, 0.2] } }
{ label: "footer", within: { yFrac: [0.9, 1] } }   // if footer !== ""
{ label: "header-rule", minWidthFrac: 0.9 }
{ label: `row-${i}`, within: { yFrac: [0.08, 0.97] }, minWidthFrac: 0.25 }  // each grid row
{ label: "lead", within: { yFrac: [0.08, 0.5] }, minWidthFrac: 0.9 }       // lead variant
relations: [{ label: gridLabels, equal: "size", tolerancePx: 2 }]  // passed as withLayoutIntent(..., { constraints, relations, debug })
```

**sports/cubing-average-card (2026-10-04)**
- Still PNG. Hint 1080x1080. Wide two-column layout at `w/h>=1.3`, stacked otherwise. 10 props: `solves previousPb event cuber date bar avgLine accent preset debugLayout`.
- `solves` holds 3, 5 or 12 strings; the count decides Mo3/Ao5/Ao12, and any other count is refused with a message saying what is needed. Mo3 rows are height-capped so they "do not become slabs".
- Empty states: `""` removes event, cuber or date. `previousPb` `""`/`DNF` removes both the delta and the chip. A DNF row has no bar. If all solves are DNF there is no scale and no bars. A DNF average prints `DNF` with no chip and no delta.
- Floor: `Math.max(6, round(S*0.016))`, small `Math.max(5, round(S*0.013))`, with refusal below it.
- Constraints (lines 649, 663-666):
```
{ label: t.label }   // presence for each bar tile
{ label: "headline", within: { yFrac: [0, 0.5] } }
{ label: "footnote", within: { yFrac: [0.8, 1] } }
{ label: `track-${i}`, minWidthFrac: 0.2 }
relations: [{ label: tracks, equal: "size", tolerancePx: 2 }]
```

**sports/swim-time-drop-card (2026-10-01)**
- Still PNG. Hint 1080x1080; bars move into a column at 4:3 and wider. 10 props: `swims swimmer club meet details course bar accent preset debugLayout`.
- `swims` has 1–8 rows. A ninth is refused ("split the meet across two cards"). Row height is capped, so a 1–2 row card is mostly empty, which was chosen over slabs.
- Empty states: club, meet or details `""` removes the line. An `NT` entry prints "first swim", has no bar and is not counted. `DQ` has no drop, bar or chip and is not counted. With no comparable swim the summary says so instead of "0 of 0". A missing standard keeps its chip space so the columns don't shift.
- Floor: `Math.max(6, round(S*0.018))`.
- Constraints (lines 687-697):
```
{ label: "swimmer", within: { yFrac: [0, 0.35] } }
{ label: "course-chip", within: { yFrac: [0, 0.35] } }
{ label: "summary-count"|"summary-total"|"footnote", within: { yFrac: [0.65, 1] } }  // if present
{ label: "rule-top", minWidthFrac: 0.8 }, { label: "rule-bottom", minWidthFrac: 0.8, within: { yFrac: [0.6, 1] } }
{ label: `track-${i}`, minWidthFrac: 0.2 }; { label: `bar-${i}` } if bar; { label: `chip-${i}` } if chip
relations: rows<2 ? [] : [{ label: tracks, equal: "size", tolerancePx: 2 }]
```

**events/bird-walk-sightings (2026-09-28)**
- Still PNG. Hint 1080x1920. Two columns of 4 at `W/H >= 1.35`. 8 props: `location date time numberOfObservers rows page sourceLabel debugLayout`.
- `rows` holds 1–200 `{commonName, count:int|"X"}`. Pages are 8 entries each and `page` picks one. The footer always shows `Page 1 of 1` / `Entries 1-8 of 8`.
- Empty slots stay blank paper, with no zero counts. Nothing is sorted, merged or totalled, and `X` is never 0.
- Floor: `Math.max(8, floor(S*0.02))`. Names wrap up to 3 lines before the type shrinks.
- Constraints (lines 252, 259-262):
```
{ label: r.label }  // each rule; footer-rule: { within: { yFrac: [0.7, 1] }, minWidthFrac: 0.88 }
textFitsMeasured per cell
{ label, within: { xFrac: [margin/W - 0.004, 1 - margin/W + 0.004],
                   yFrac: footer ? [0.7, 1 - margin/H + 0.004] : header ? [0, 0.4] : [0, 1] } }
```

**sports/powerlifting-meet-recap (2026-09-27)**
- Video MP4. Hint 1080x1920. Duration is `clipSec` (default 12, range 6–30) via `resolveOutputHints`; frame 0 is the finished board and the clip loops.
- 13 props: `lifter meetName details attempts place dots csv row units clipSec accent preset debugLayout`. The critic flagged this as "above the brief's own five to ten".
- 1–3 lift rows: a lift left out drops its row, and an attempt not taken is a dim cell. A bomb-out or DQ is printed as "NO TOTAL" / "Disqualified", not hidden. `dots: 0` hides the points.
- Gated tiles live in child documents to keep overlay depth down.
- Constraints (`meetContract`, lines 852-875): `textFitsMeasured` for every text, plus:
```
{ label: "stamp-text", within: { yFrac: [0, 0.3] } }
landscape ? { label: "total" } : { label: "total", within: { yFrac: [0.5, 1] } }
{ label: "cell" }
```

## (3) Defects to pre-empt (critiques and ship notes)

**Unremovable chrome.** QSL prints `ADIF QSO CARD` in every user's footer with no prop to remove it ("leaks the template's pitch onto the user's card"), and it cannot be fixed once frozen. Rule: any mark or credit is a prop that defaults to `""`, or don't print it.

**Balance and empty space** (rated worse than overflow):
- QSL portrait: `CONFIRMING OUR QSO` floats with about 90 px of air on each side. QSL square: the call is limited by height and leaves the top-right quarter empty.
- Cubing portrait: 56 px bars on a 200 px pitch, about 230 px empty above the footnote. Cubing landscape: about 350 px dead in the left column.
- Swim: 2 rows leave half the square empty; portrait with 6 rows has about 100 px empty above the summary.
- Radio: a Top 5 on portrait ends at 45% of the height with the footer alone, which "looks unfinished".
- Bird walk landscape: a 43 px gutter puts the left column's counts next to the right column's names. Also a double rule (last row rule plus footer rule, about 30 px apart). QSL c has the same double-line problem.

**Tiny text.**
- Radio: at 1080 square the type is 21.7/16.5 px. In portrait and 4:5 the caps are bound by width (`cellW * 0.045`), so the extra height buys only air. 480x270 is about 6 px. The ladder's shared step changes type size from week to week. An 80-character title alone is about 9 px.
- Radio: the `=` and down markers are about 14 px of dim ink, "close to invisible in a feed".
- Swim square: labels are 23 px with 6 rows and 16 px with 8; chips sit 4 px above the track.
- Powerlifting b: about 20–22 px (7 pt on a phone), which cost line 3.
- Cubing: the bar meaning is explained only in a 22 px dim footnote, so a stranger reads the long bar as good. The footnote also orphan-wraps (`+` / `= +2…`, `left =` / `faster.`).

**Aspect switches.** Radio's `w/h >= 1.3` switch costs type just above 4:3 (1440x1080 gets 19.5/14.8 px against 21.3 at 1400x1080). The critic also tested 1080x1350, 1200x630, 1920x600 and 600x1920, beyond the 7 contract canvases.

**The contract measured generously.** Bird walk's list got 45% of the height at 480x270 against a promised 50%; the test moved the ruler (`L.listEnd - L.labelY`) and the critic called it out.

**Numbers and formatting.**
- The critic prompt cites day 13's malformed `2:030.123`. Day 13's first verdict was NO SHIP because the promised bars were missing (`journal/2026-10-02/40-critique.r1.md:16`). Rule: the stills must contain every element the brief promises, and the test asserts the tiles exist.
- Cubing: a solve within 1% of the average gets a 1% floor bar about twice its true length.
- Conventions used: integer arithmetic, signs with an ASCII hyphen, and `0.00`/`=`/"ties" for equal values. QSL prints dates as `03 OCT 2026` "so it reads the same in the US and the EU". Bird walk validates the date and does no clock lookup.
- Swim avoided the words "PB" and "best time" (asserted by grep in the test) because the comparison is against entry time. Rule: label what a number is (vs. what).

**Feeding friction.**
- `rows` as JSON: radio needs `\"` in 12 of 30 real rows; a multi-line string is refused; curly quotes, en dash, ellipsis or tab are refused with an error that does not name the character.
- A numbered line `1. CLAIRO` renders the `1.` as part of the artist.
- Bird walk: the caller must group the export and turn strings into numbers.
- QSL: an unknown prop key (`myCity`) is silently ignored, so prop names that mirror the source field names matter.
- Powerlifting: CSV via a JSON wrapper.
- Line 6 (would the community use it) scored 1 for every neighbour; the usual cause is no importer and evidence from one source.

**Palette.**
- QSL c: the `accentColor` description claimed rules that variant did not draw (false prop documentation, line 5).
- Radio c (light): dim markers weaker and row tiles too close to the page.
- Powerlifting: accent moved `#ffb020` to `#ffd23f` to stay clear of the deadlift orange; green/red were not checked against colour-vision deficiency.
- Swim and cubing: "a slower result is printed, not drawn red".
- Bird walk: must survive grayscale printing.

**Glyphs.**
- ASCII only in defaults; `→` renders as tofu.
- Swim, cubing and radio accept `DRAWN = /^[\x20-\x7eÀ-ÖØ-öø-ſ]*$/` (U+00C0–U+017F) and refuse anything else by name; there is a test that every accepted character has a glyph in both weights.
- Bird walk was ASCII only, which refuses accented names (a listed weak spot).
- Roboto's 0 has no slash (N0CALL reads NOCALL).

**Trademark, privacy and honesty.**
- Defaults are invented and labelled: radio's footer reads "Sample chart: artists, titles and labels are invented", and 91.6 is "not a US FM channel, on purpose". Bird walk uses `Willowmere Demo Sanctuary` / `Fictional example` and "does not claim affiliation with Cornell or eBird". Swim's swimmer is invented and the sample names no age group or sex.
- Tutorials quote evidence without private names (swim uses `[swimmer]`; powerlifting dropped the lifter's page; cubing quotes without naming members).
- Today's scout: "parkrun" is a trademark, so no logo, no lookalike brand palette, a descriptive name. Numbers are props only, never fetched ("parkrun is hostile to scraping"). Milestone rows vary from 0 to 6 clubs, so an empty week needs a layout rule.

**Variant and ship-process failures.**
- Swim b was fatal: its WHY described a's default after only `DEFAULT_BAR` changed. Radio b and c were "not shippable as snapshotted" because the test asserted `lead: false` / `preset: "dark"`. Rule: the tests and WHY must follow `DEFAULTS` per variant.
- The registry description must match the shipped variant; swim's and QSL's were corrected at ship.
- Swim: dead code from a constant that was always true (`BAR_LABELS`).
- Doctor errors at ship: a prop bound to no rect (cubing `solves`, fixed with `bindPropPath` per entry; radio `genre`, unbound when empty at defaults). Rule: bind every content prop at the defaults, including list entries via `bindPropPath(cell, "rows", [i, field], "number"|"string")`.
- Radio: CLI warning `OVERLAY_CHAIN_DEEP` (32 deep against a threshold of 20; ffmpeg degrades past about 25 layers) from many tiles plus text. Powerlifting avoided this with child documents. This matters for many badge or tile cells.
- The scaffold's pack description placeholder had to be replaced at ship (music; community on day 14).
- `WHY.timeline` must be copied from the trace at ship.

## (4) Prop typing, registry text and tags

**Strings for values that carry a format.** Times (`"27.84"`, `"1:10.52"`, `"29.50+"`) are parsed to integer hundredths. `freq` stays a string so it prints as given. ADIF dates and times are strings validated by regex.

**`number` type for true integers.**
- Bird walk: `numberOfObservers: { type: "number", meta: { constraints: { min: 1, max: 999 } } }` and `page` (min 1, max 25). Its rule: "Numeric strings from CSV must be normalized to numbers by the caller; the template does not coerce arbitrary strings"; it rejects negative, zero, fractional and non-finite values.
- Powerlifting: `dots` (0 hides it) and `clipSec`.
- This is the precedent for integer counts such as finishers, PBs and volunteers.

**Enums.** `type: "string"` with `meta: { constraints: { oneOf: [...] } }`, plus a runtime fail. Examples: `preset` dark|light, `bar`, `course` SCY|SCM|LCM, `units` kg|lb|both.

**Colour.** `type: "string"` with `meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT } }`, validated as `#rrggbb`. Named `accent` in 4 templates and `accentColor` in QSL. Defaults: QSL `#b3261e` on paper `#f4f1ea`; radio `#ff3d9a`; cubing `#ff8a1f`; swim `#2ec4b6`; powerlifting `#ffd23f`; bird walk has no colour prop (fixed `#285540` on white). The page goes in `document.backgroundColor`, never a full-canvas rect.

**Lists.**
- Radio `rows`: `type: "json"`, `jsonSchema {type:"array", minItems:1, maxItems:30, items:{type:"string"}}`, `|`-delimited inside each string.
- Cubing `solves`: `type: "json"` array of strings, min 3, max 12.
- Swim `swims`: `type: "list"` with `fields: { event, entry, final, standard }` and `meta.constraints {minItems, maxItems}`. This is a form list of objects.
- Bird walk `rows`: `type: "json"` array of objects, no schema meta.
- Powerlifting `attempts`: `type: "json"` object with jsonSchema; `csv` is a multiline mono string.

**Other schema conventions.** Each prop has a long `description` that states the format, the limit and the effect of `""`. `meta.ui {label, order, primary}`; `debugLayout` takes `order: 99`. Optional props use `required: false` with DEFAULTS.

**`outputHints`.** `{ width, height, fps: 30, durationMs: 2000, format: { kind: "image", container: "png" }, note: "Still PNG. … Minimum tested canvas 480x270." }`.

**Registry rows** (`src/<pack>/registry.ts`):
- `title: "YYYY-MM-DD · Title"`.
- The description is one sentence: "A <artifact> for/from <source record>: <what is on the card>, <the key rule>; <honest limit>." Example: QSL's "…Paper and type only, no photo background in v1."
- Tags: `[pack, date, "day-NNN", …3–5 domain tags]`. Examples: `["community","2026-10-03","day-014","ham-radio","qsl","adif","card"]`, `["music","2026-10-05","day-016","radio","college-radio","chart","top-30","nacc"]`. Today is day-017. State tags already proposed: parkrun, running, volunteers, weekly, stats, community.

## (5) Pack choice: `community`

`community` is the better pack for a weekly volunteer-run 5k event summary.

- **Community.** Its pack description (`src/repo.ts`) reads: "Cards a hobby community makes for its own members, filled from the records the hobby already keeps (a ham radio log, a club roster): one card per record, scripted." A run director or volunteer making a weekly group card from the results page fits this word for word: one card per event per Saturday, scripted across a season or region. It currently holds only `qsl-card`. The day-14 brief said this pack is for things "one hobby community trades between its members… not a sports result". It also said cubing would land here, but cubing went to sports, so the boundary is soft.
- **Sports.** It holds only one-athlete result and PB cards: powerlifting, swim, lap telemetry, cubing. Its pack description is still the placeholder "Sports: one line on what this pack teaches.", so a ship there would also have to write that line. The scout framed today's pick as "a group picture made weekly by a volunteer, which is a different job from the personal PB cards already on the shelf", and the state.json tags already include `community`.
- **Events.** Its description is "Event production media: timers, holding screens and boards for stages, streams and rooms - clips a screen can just play." That is on-site screen production, not a weekly feed post. Bird walk was put there as "an outing's results board for a visitor space" and talk-timer and homebrew card are room or print items, so a parkrun summary for Facebook and the results page fits less well.