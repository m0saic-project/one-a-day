# Brief - 2026-09-30

## The use case

Homebrewers repeatedly change a beer's name, style, and ABV on labels for kegs, event serving, and bottles taken to club meetings; the scout's January 2026 firsthand example also notes the ink cost of elaborate artwork ([AHA forum](https://forum.homebrewersassociation.org/t/share-your-labels/40286)). Today's template turns those recipe or batch fields into one reusable serving-information PNG, with an explicit distinction between estimated, batch-derived, and unavailable ABV.

## The template

- id: `@one-a-day/events/homebrew-serving-card/v1`
- title: `Homebrew Serving Card`; retain the scaffold's date prefix and `day-011` tag.
- pack: existing `events`, because this is serving information for club meetings and tasting events.
- kind: image, opaque PNG; canvas hint 1920x1080.
- aspects that must work: landscape 16:9, portrait 9:16, and square 1:1, including the seven contract canvases below.
- duration: still. There is no animation, audio, or duration prop.
- output: one beer per card; six props including `debugLayout`; no media input or new dependencies.

The user supplies normalized text fields, either by typing them or mapping one exported recipe outside the template. Brewfather documents BeerXML export, so the handoff can start with an existing artifact ([recipe designer](https://docs.brewfather.app/recipes/designer)). XML parsing, Brewfather JSON parsing, batch-log integration, multi-card print sheets, paper dimensions, bleed, and printer alignment are outside this version. PNG dimensions alone do not promise a physical label size.

## Layout

Use a white canvas, near-black information, generous unprinted space, and thin dark rules. No artwork, logo, texture, filled dark panel, or large color wash is needed. The name is the primary identifier; the percentage is the other strong visual anchor; style and ABV provenance are clearly readable; brewer credit is subordinate.

The following ratios are starting proportions, not exact contract assertions. The builder may adjust them to fit accepted text while preserving the hierarchy and region relationships.

- Outer margin: about 1/24 of each canvas axis, leaving a rectangular content area.
- Content: about 6/7 body above 1/7 brewer footer, with a thin rule separating the footer. A blank brewer leaves quiet white space without a dangling caption.
- Landscape (`width / height >= 4/3`): divide the body approximately 2:1. The left region contains name above style, with roughly 3:1 of its useful height available to those fields. The right region contains the percentage and its qualifier, separated from the identity by a narrow white gutter and thin rule.
- Portrait and square: stack identity above ABV at roughly 5:4 within the body. Name and style remain together in the upper region; percentage and qualifier remain together below. The brewer footer stays at the bottom.
- Size small text and rule thickness from the shorter usable dimension so portrait does not create oversized footer lettering. Gaps are real empty regions, not blank text lines.

```text
Landscape                         Portrait / square
+-------------------------------+ +-------------------+
| Workshop Pale Ale |      5.2% | | Workshop Pale Ale |
| American Pale Ale | Estimated | | American Pale Ale |
|                   |      ABV | |-------------------|
|-------------------------------| |        5.2%       |
| BREWER: Example Homebrew Club  | |   Estimated ABV   |
+-------------------------------+ |-------------------|
                                  | BREWER: Example   |
                                  | Homebrew Club     |
                                  +-------------------+
```

The sketch shows hierarchy, not required line breaks. Prefer `Estimated ABV` on one line when it fits. Keep the user's complete name and style: wrap at spaces, split an unbroken token if necessary, then reduce type to a documented floor. At the seven supported canvases the floor for any visible information is `10 * min(width, height) / 270` pixels. Do not truncate, append ellipses, drop a supplied field, or remove the ABV qualifier to make copy fit. At defaults, name and numeric ABV should be visibly larger than the supporting copy.

## Layout contract

Sweep 1920x1080, 1280x720, 1080x1920, 1080x1080, 3840x2160, 640x360, and 480x270.

- Every text source has its own meaningful label and a `textFits` promise, with width and height sufficient for all displayed lines. Fit within the repository's quantization allowance (`cell * 0.94 - 2px`).
- Beer name, style, ABV value/status, and ABV qualifier are always present in distinct, non-overlapping text regions. Missing ABV changes the text, not the presence of its information block.
- Landscape identity stays in the left portion and the ABV block in the right portion. Portrait/square identity stays above the ABV block. The value and its qualifier remain adjacent inside the same visual region; color is never the sole indication of provenance.
- Footer and footer rule stay in the bottom 20% of the canvas. The rule spans the content width, at least 85% of canvas width. Brewer text is required only when the trimmed prop is nonempty; the empty state renders no `BREWER:` caption.
- All text stays inside the safe content area, clear of rules and neighboring copy. The background remains white in every variant. The numeric value's percent sign stays attached to its number.
- `debugLayout: false` produces the clean card; `true` reveals the contract overlay. The contract checks general placement and presence, not exact sketch ratios.

## Props

All props are optional at invocation because every one has an explicit deterministic default. Supplied values still undergo validation; a blank required content field is not an instruction to restore sample data.

| Name | Type | Default | What it changes | Required? |
| --- | --- | --- | --- | --- |
| `beerName` | string | `Workshop Pale Ale` | Main identifier; 1-48 printable ASCII characters after trimming. | No; supplied blank is invalid. |
| `beerStyle` | string | `American Pale Ale` | Style beneath the name; 1-48 printable ASCII characters. | No; supplied blank is invalid. |
| `abv` | string | `5.2` | Percentage as decimal text; empty means unavailable. See semantics below. | No. |
| `abvBasis` | string enum: `estimated`, `batch` | `estimated` | Visible qualifier for a supplied percentage. | No. |
| `brewer` | string | `Example Homebrew Club` | Footer credit, 0-48 printable ASCII characters; empty hides credit and prefix. | No. |
| `debugLayout` | boolean | `false` | Contract visualization. | No. |

Text inputs are single-line printable ASCII; trim surrounding whitespace, then wrap for presentation. Reject control characters, non-ASCII copy, wrong types, over-limit text, and invalid enum values with a field-specific error. The ASCII limit is a supported-input boundary, not permission to silently delete letters from a brewer's name. Name, style, ABV text, and brewer regions should expose their editable prop bindings; the enum uses its schema picker.

### ABV semantics and export mapping

Use a string for `abv` so an explicit empty value survives default merging and the supplied decimal precision can be retained. A nonempty value must be an unsigned decimal from 0 through 100, with at most two fractional digits, no leading zeros except `0`, and no percent sign, units, exponent, or comma. Append `%` for display without inventing extra precision or rounding. Thus `5.20` displays `5.20%`, and an explicit `0` displays `0%`; neither is the missing state.

| Supplied props | Visible result |
| --- | --- |
| `abv: "5.2", abvBasis: "estimated"` | `5.2%` with `Estimated ABV` immediately beside or below it. |
| `abv: "5.2", abvBasis: "batch"` | `5.2%` with `Batch ABV` immediately beside or below it. |
| `abv: ""`, either valid basis | `ABV` and `Not supplied`; no number, percent sign, or provenance claim. |

BeerXML defines `EST_ABV` as the recipe estimate and `ABV` as a calculation from measured original and final gravity; both are optional extensions ([BeerXML specification](https://www.beerxml.com/beerxml.htm)). `Batch ABV` means the supplied batch-derived value, not a laboratory measurement or a calculation performed by this template.

The documented mapping is `RECIPE.NAME` to `beerName`, `RECIPE.STYLE.NAME` to `beerStyle`, and `RECIPE.BREWER` to `brewer`. For the selected batch, use a present valid `ABV` with basis `batch`; otherwise use a present valid `EST_ABV` with basis `estimated`; when neither exists pass `abv: ""` explicitly. Preserve zero when checking presence. A malformed present value is an input error, not a reason to silently use another value. Do not infer strength from beer style or calculate it from gravity here.

For any real mapped recipe, supply all content props explicitly, including `brewer: ""` if absent and `abv: ""` if unavailable. Missing name or style must be resolved by the caller. Omitting props invokes the fictional demo defaults; it is not an import workflow.

## Defaults must show

A complete, mostly white serving card reads `Workshop Pale Ale`, `American Pale Ale`, `5.2%`, `Estimated ABV`, and `BREWER: Example Homebrew Club`. These are synthetic example fields, identified as such in the tutorial. No image download, external file, network call, or user input is needed to see the intended result. A permanent sample watermark is unnecessary once the user supplies their own fields.

The six shared WHY pages must explain the observed repeated label-editing workflow, these fictional defaults, the ABV distinction, and the single-card scope. Include the opened AHA, Brewfather, and BeerXML links; avoid claiming an importer or calibrated printing exists. Use the scaffold's day/date/agent/model and the required timeline provenance. Keep ASCII tutorial paragraphs within the shared copy budget.

Render one-liner for the tutorial and build handoff:

```powershell
m0saic make @one-a-day/events/homebrew-serving-card/v1 --template-repo . -w 1920 -h 1080 -o journal/2026-09-30/homebrew-serving-card.png
```

## Acceptance rubric

1. **Useful at a serving table.** At all three rendered aspects, a viewer can immediately find the beer name, style, and strength/status. Name and numeric percentage lead at defaults; the brewer remains readable and subordinate. Score the actual stills, including the smallest landscape, for hierarchy and breathing room.
2. **Honest alcohol information.** Estimated, batch-derived, empty, and explicit zero cases produce the exact distinctions above. No default percentage leaks into an explicitly missing value. The provenance qualifier survives every layout and text-fitting decision; malformed values fail clearly.
3. **Complete, fitted copy.** Seven-canvas sweeps pass at defaults and with accepted 48-character name/style/brewer values, including an unbroken token. Check the widest accepted ABV (`100.00`), both bases, missing ABV, and blank brewer. All supplied text survives without clipping, overlap, ellipses, tofu, or falling below the readability floor.
4. **Repeatable, economical artifact.** One opaque PNG uses white space, dark typography, and thin rules; no large ink-heavy region or decorative media dependency. All six defaults appear in the template defaults and prop documentation. Repeated identical props/target produce identical documents; editable text bindings, fail-fast validation, and geometry based on `ctx.target` pass the repository gates.
5. **Reviewable and truthful delivery.** Build, tests, intended fingerprints, and variant reports pass, with successful landscape/portrait/square pictures and all six tutorial pages. Exit 3/degraded media fails acceptance. The tutorial demonstrates prop mapping without promising XML import, print sheets, physical sizing, or laboratory ABV. The build journal records remaining weaknesses.

## Variants worth trying

- **a - Divided card:** the baseline geometry above, white background and dark text/rules.
- **b - Open card:** same props, typography, palette, footer, and regional ratios; remove only the body divider and let its white gutter separate identity from ABV. Keep the footer rule. Compare whether this reads more calmly while retaining a clear ABV block.

Two variants are enough. Both use the same template id/folder and the same acceptance rubric; the critic chooses based on legibility and clear grouping, not decoration.

## Neighbors and planning checks

The manifest and three local sources informed the spec:

- [Bird Walk Sightings](../../src/events/bird-walk-sightings/v1/bird-walk-sightings.ts): white PNG, thin rules, aspect reflow, and an explicit unknown-data state. Reuse the low-ink direction and honest absence handling.
- [OG Card](../../src/dev/og-card/v1/og-card.ts): dominant fitted title and subordinate optional credit, with a footer placement contract. Reuse the hierarchy without its filled accent band.
- [Testimonial Proof Card](../../src/social/testimonial-proof-card/v1/testimonial-proof-card.ts): disclosure stays attached to the displayed claim. Apply that relationship to the ABV qualifier.

Read the installed knowledge-base entry points and the five requested authoring/geometry/CLI pages. Planning did not scaffold a template, change shipped sources, run a build, or render media; those checks belong to the build phase.
