# Build - 2026-10-16

## Template: @one-a-day/gaming/commander-deck-spotlight/v1

One deviation from the brief's props table: the `colorIdentity` prop is named
`manaIdentity` (its ui.label still reads "Color identity"). The `colorProps`
convention treats any prop key containing "color" as a colour and demands
isColor + colorPicker - a swatch picker over WUBRG letters. Full story under
"What was hard".

## Variant a - baseline: vertical histogram left, highlight rows right - gate: clean - render: ok - stills: verified

The brief's own sketch, drawn: kicker and BRACKET 3 / 4-0 pills top-right,
`Caesar's Legion Tokens` over `Commander: Caesar, Legion's Emperor` with W B R
chips right-aligned on the line; eight vertical bars (4, 10, 16, 13, 9, 6, 3,
2) with counts above and 0..7+ under, `AVG MV 2.84 - 63 SPELLS` beneath the
plot; four equal-height highlight rows (1x badge, name, dim note, hairline
between); the plan line in the footer. Portrait stacks curve over highlights
inside the same bands; square reads as landscape.

Opened landscape.png, portrait.png, square.png and tutorial-1/2/3 and checked
string by string and claim by claim: 2.84 = 179/63 and 63 SPELLS are the
computed figures; bar heights are count/16 of the plot and the 16 fills it;
chips are one square per letter in WUBRG order; every part named in the header
comment, the registry description and WHY.solution is in the picture; nothing
clipped on any of the three canvases.

## Variant b - swap the body axes: horizontal curve rows, 2-column tile grid - gate: clean - render: ok - stills: verified, weaker

Same bands, same props. The curve becomes eight horizontal rows (MV label at
left, bar, count at the row end) - the silhouette climbs to 16 at MV 2 and
steps back down - and the highlights a 2x2 tile grid (badge, name up to three
wrapped lines, note as the tile footer). All three stills render clean, every
number well-formed. Weak spot the stills show: at square and 480x270 the tile
names wrap small beside a floating badge and the type balance inside the tile
is off - less legible than a's rows. Rubric 2 ("heights proportional ...
tallest fills the plot") and rubric 5 ("highlight rows are equal height")
describe variant a's shape, so a is the ship shape and is back in `src/`.

Variant c (the motion probe) was not built: the brief itself rules it "not the
ship target", it changes the deliverable from a still to a clip, and two still
variants through a clean gate beat one destabilized by a rewrite of the
render kind. The probe remains open for a clip-native day.

## Why-tutorial

- The problem page: Mythichub in its own words ("I created a tool for myself
  that turns decks into fun images", "an image gets more attention") plus the
  ecosystem convergence - Archidekt's FAQ, TopDeck.gg's 16:9 deck images
  ("Share your 4-0 tournament deck"), DeckPassport ("No more walls of text ...
  Just share the card.") - over the five sources the scout opened.
- The solution page: the one decision - the curve never lies. AVG MV and the
  spell count are COMPUTED from the buckets (179/63 = 2.84 at defaults) and
  the bars are count-proportional with the tallest filling the plot; then the
  three caveats (no card art, MV/bracket read off the builder UI, 3-6 rows is
  the digest, not the 100).

## What was hard

- `colorProps` fires on any prop key containing "color": `colorIdentity` holds
  WUBRG letters, and declaring isColor + colorPicker would put a swatch picker
  over them (the exact opposite of the convention's intent). Renamed the prop
  to `manaIdentity`, kept the "Color identity" label and the description;
  render() still refuses anything outside WUBRG by name.
- A fit budget rounds: the pill copy fitted against the inner width (pill minus
  its pad) came out one pixel short at 480x270 and fell under the reading
  floor. Fitting the text cell to the FULL pill width makes the pad slack and
  the failure disappears - worth knowing before you trust `snugW` + subtract.
- In variant b's tile grid, a 48-character name needs up to three wrap lines
  and the note the full tile width to clear the floor at 480x270 and
  1080x1080; wrapping beats shrinking, and the fit stays measured and named
  (`highlights[i].name cannot be fitted...`), never ellipsized.

## In place now: a
