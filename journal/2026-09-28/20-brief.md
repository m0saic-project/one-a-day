# Brief - 2026-09-28

## The use case

Sanctuary naturalists who lead twice-weekly bird walks want to turn an eBird checklist into a legible, dated sightings sheet for visitors; the [observed complaint](https://www.reddit.com/r/birding/comments/1lflgm2/printing_ebird_checklists/) is that printing the checklist webpage wastes paper and looks poor. Use normalized rows from one outing in the [personal spreadsheet export](https://support.ebird.org/en/support/solutions/articles/48000838205-download-ebird-data) to make a repeatable noticeboard PNG, with fictional observations demonstrating it at defaults.

## The template

- id: `@one-a-day/events/bird-walk-sightings/v1`
- title: `Bird Walk Sightings` (retain the scaffold's date prefix and day-009 tag).
- pack: existing `events`; this is an outing's results board for a visitor space, consistent with the pack's boards-for-rooms remit.
- kind: image, PNG; canvas hint 1080x1920. Landscape 1920x1080 and square 1080x1080 must also work.
- duration: still. No motion, duration prop, audio, photographs, or external assets.
- scope: one selected page of one supplied checklist per render. The caller groups export rows by `Submission ID` and maps `Common Name`, `Count`, `Location`, `Date`, `Time`, and `Number of Observers` to the props below. No CSV parser, account access, data fetching, taxonomy reconciliation, automatic multi-file export, or PDF production today.

## Layout

A white paper surface, dark ink, a restrained forest-green heading/rule, and generously separated name/count rows. No full-page dark fill, decorative bird art, or oversized statistics competing with the list. Meaning must survive grayscale printing.

Use an outer safe margin of roughly 1/25 of the shorter canvas side. Within it, stack header, list, and footer. Start near 1:6:1 in portrait and 1:3:1 in square/landscape; these are design targets, not exact geometry promises. Keep the list the dominant region, and keep chrome compact as the canvas gets taller.

- Header: fixed heading `BIRD WALK SIGHTINGS`, location as the strongest identifying line, then date, local start time, and observer count. Label time as local; there is no timezone conversion. Metadata may wrap into separate cells in portrait.
- List: `Common name` and `Count` column labels, then eight available entry slots. Names align left; counts align right in a distinct count rail occupying roughly 1/6 of each column. A row's name and count stay together. Light separators or subtle alternating surfaces may aid tracking.
- Portrait and square: one column, top-to-bottom input order, up to eight entries.
- Landscape (width/height >= 1.35): two equal columns with a small gutter, four entry slots each. Read down the left column, then down the right; repeat the column labels. Partial pages fill those same slots in order, without redistributing or duplicating entries.
- Footer: source label, page/range disclosure, and the persistent legend `X = observed, not counted`. The footer is part of every page, including page 1 of 1. Separate its lines with real space, not blank text lines.
- Empty slots on the last page remain blank paper. They do not acquire zero counts, example rows, or extra labels.

```text
Portrait / square                 Landscape
+----------------------+          +----------------------------------+
| BIRD WALK SIGHTINGS   |          | BIRD WALK SIGHTINGS / location   |
| Location             |          | Date / local time / observers    |
| Date / time / people |          +----------------+-----------------+
| Common name    Count |          | Common name  # | Common name   # |
| entry 1            4 |          | entry 1      4 | entry 5       X |
| ...                  |          | ...            | ...             |
| entry 8            X |          | entry 4      1 | entry 8       X |
| Source               |          +----------------+-----------------+
| Page / entry range   |          | Source / Page / entry range      |
| X legend             |          | X = observed, not counted        |
+----------------------+          +----------------------------------+
```

### Pagination and data meaning

Capacity is exactly eight supplied entries per page at every aspect and resolution. For N rows, page count is ceil(N/8); `page` is 1-based. Preserve input order and original name/count pairings. The footer uses `Page 1 of 2` and `Entries 1-8 of 9`, changing the range for the selected page; even a one-page input says `Page 1 of 1` and `Entries 1-8 of 8`.

Do not sort, merge duplicate names, discard unidentified taxa, or label the row count as a species total. Do not compute a total number of birds. `X` is an observation without a count, as described in [Cornell's Trip Reports guidance](https://support.ebird.org/en/support/solutions/articles/48001201565); preserve it as `X`, never zero or a guessed number. Entry totals describe the supplied rows, not a verified complete eBird checklist. The tutorial must tell callers to supply all rows from one outing and render every page before posting the set.

## Layout contract

- Every rendered text source has a distinct meaningful label and a text-fit constraint, including each visible row name/count, column headings, metadata, source, pagination, and legend. Every line fits with quantization headroom; no clipped glyphs, ellipsis, or silently shortened identifiers.
- Header and metadata remain in the upper 40% of the canvas. The footer's text and separator remain in the bottom 30%. Header/footer span the usable width; decorative rules may be inset with the paper margin.
- The list is between header and footer. Row cells do not overlap, each count remains beside its own name, and columns preserve their reading order. These relationships are checked in tests where the layout-constraint API cannot express them directly.
- Presence is mandatory for heading, location, date, time, observer count, source label, page/range disclosure, legend, column labels, and every name/count on the selected page. Off-page rows are absent by deliberate page selection, with the total and range visible.
- All content stays inside the safe margins. The list gets at least half the usable height; no decorative mark needs an exact aspect or location contract.
- Fit full names by wrapping, then modest type reduction. Permit up to three name lines in a row; adjust row geometry before reducing readability. At 480x270, no essential text falls below 8 px. At primary canvases, aim for at least 24 px names/counts and 20 px supporting copy. These are legibility floors, not pixel-position rules. Do not solve a fit failure by reducing page capacity or hiding data.
- Sweep defaults and stressed accepted copy at 1920x1080, 1280x720, 1080x1920, 1080x1080, 3840x2160, 640x360, and 480x270. If the promised input envelope cannot fit, revise the design during build and document the issue; do not claim acceptance on a clipped render.
- `debugLayout` defaults false and exposes the contract overlay. Layout comes from `ctx.target`, including when nested in the tutorial.

## Props

Eight props; all have canonical deterministic defaults. Omitted props use those defaults. Explicit invalid values fail early with the field or row named, rather than reverting to sample data.

| Name | Type | Default | What it changes | Required? |
|---|---|---|---|---|
| `location` | string | `Willowmere Demo Sanctuary` | Outing location; 1-48 printable ASCII characters after trimming | No |
| `date` | string | `2026-09-28` | Outing date, a valid calendar date in YYYY-MM-DD; no ambient date lookup | No |
| `time` | string | `08:00` | Local start time, 24-hour HH:MM | No |
| `numberOfObservers` | number | `12` | Integer observer count, 1-999 | No |
| `rows` | JSON array of `{ commonName: string, count: number or "X" }` | Eight rows below | Whole outing's ordered entries, 1-200 rows; commonName is 1-48 printable ASCII characters; count is an integer 1-999999 or literal uppercase X | No |
| `page` | number | `1` | Integer selected page, 1 through computed page count | No |
| `sourceLabel` | string | `Fictional example` | Attribution line, 1-48 printable ASCII characters; for real data, e.g. `eBird checklist S123456789` supplied by the caller | No |
| `debugLayout` | boolean | `false` | Contract overlay | No |

Numeric strings from CSV must be normalized to numbers by the caller; the template does not coerce arbitrary strings. Reject empty arrays, more than 200 rows, missing row fields, blank names, unsupported glyphs, negative/zero/fractional/non-finite counts, and pages outside the valid range. Do not silently truncate overlength strings. Validate the whole supplied array, including off-page rows. Preserve duplicates if supplied; this is a display, not a taxonomic cleaner.

Default rows, in this order:

```json
[
  { "commonName": "Mallard", "count": 14 },
  { "commonName": "Great Blue Heron", "count": 1 },
  { "commonName": "Red-tailed Hawk", "count": 2 },
  { "commonName": "Belted Kingfisher", "count": 1 },
  { "commonName": "Black-capped Chickadee", "count": "X" },
  { "commonName": "White-breasted Nuthatch", "count": 3 },
  { "commonName": "American Goldfinch", "count": 7 },
  { "commonName": "swallow sp.", "count": "X" }
]
```

## Defaults must show

A complete single-page fictional outing at Willowmere Demo Sanctuary, dated 2026-09-28, starting at 08:00 local with 12 observers. All eight names and their counts are visible, including two X values and an unidentified taxon; `Fictional example`, `Page 1 of 1`, `Entries 1-8 of 8`, and the X legend make its provenance and limits clear.

The default does not claim affiliation with Cornell or eBird. No media or login is needed. Printing is a possible use of this PNG; physical paper sizing, DPI, printer margins, and PDF pagination remain outside today's promise.

## Acceptance rubric

Score each criterion 0-5. A visual score cannot excuse lost rows, changed counts, false totals, invalid page handling, or a failed required gate.

1. **Useful visitor sheet:** At portrait defaults, a reader can immediately identify where/when the walk happened and scan a bird's name and count. White paper and strong hierarchy work in grayscale; square and landscape preserve the same content without crowding.
2. **Faithful checklist:** Exact input order and count pairings survive. X values and unidentified taxa remain, no species/bird totals are invented, and attribution is visible. Test duplicates, six-digit counts, an all-X page, and malformed inputs, including malformed off-page rows.
3. **Honest pagination:** Test 1, 8, 9, 16, 17, and 200 entries, including first and last pages. Concatenating all pages reproduces the full input exactly once. For nine entries, page 2 displays only entry 9 with `Page 2 of 2` and `Entries 9-9 of 9`. Reject page 0, fractional pages, and pages beyond the end. Page membership never changes with aspect.
4. **Geometry and text:** Seven-canvas sweeps pass for defaults and boundary-length metadata/names, including wide letters and a long unbroken name. Inspect actual landscape, portrait, square, and 480x270 stills. No overflow, ellipsis, missing rows, illegible disclaimer, or count/name collision. Bound text props edit their displayed cells; repeated renders are deterministic. Build, tests, registry/layout/why gates, and intended fingerprints pass; a degraded/error-mosaic render fails acceptance.
5. **Truthful tutorial and handoff:** All six shared tutorial pages render and explain the observed printing complaint, normalized-input boundary, eight-entry pagination, X semantics, fictional defaults, usage, and the run's recorded provenance. Use scout-opened evidence links and current journal metadata. Do not claim an importer, verified completeness, or a PDF system. Include a reproducible props example and page-selection command in the build journal, and inspect tutorial stills along with the board.

The intended default render command after build is:

```text
m0saic make @one-a-day/events/bird-walk-sightings/v1 --template-repo . -w 1080 -h 1920 -o journal/2026-09-28/bird-walk-sightings.png
```

## Variants worth trying

- **a - ruled paper:** White page, forest-green heading/rule, dark text, thin separators between entries. Baseline.
- **b - row tracking:** Change only the row treatment to alternating very pale gray fills, retaining the baseline layout and palette.
- **c - monochrome:** Change only the accent to charcoal; keep variant a's geometry and separators. Judge whether green adds useful hierarchy for the noticeboard use.

All variants share one id, the same eight-entry page contract, and the same defaults. Build only alternatives that answer a real visual question.

## Neighbours and planning limits

Read the manifest and three local neighbours: [Bench Delta](../../src/dev/bench-delta/v1/bench-delta.ts) for repeated structured rows, text contracts, and an overflow disclosure; [OG Card](../../src/dev/og-card/v1/og-card.ts) for a still-first output with measured text and aspect-aware chrome; and [Powerlifting Meet Recap](../../src/sports/powerlifting-meet-recap/v1/powerlifting-meet-recap.ts) for domain-native fields and a tutorial tied to a real exported artifact. Reuse those established shapes, but this sheet requires full names and explicit pages rather than truncation or omitted-row summaries.

Read the installed knowledge entry point, thesis/router, template contract, construction guidance, standalone authoring guidance, geometry guidance, and CLI usage. Opening the linked public starter and official library through the web tool returned cache misses; the inspected local neighbours are the concrete pattern references for this brief. This plan makes no claim of having built or rendered the design. Evidence remains one older community complaint, as qualified by the scout.
