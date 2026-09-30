# Critique - 2026-09-30

The critic is the same Claude Code session that built the variants (see `run.json` `runner.session`); nobody else looked. It read `20-brief.md`, `30-build.md`, both `report.json` files, all eighteen stills and the five off-default renders in `variants/<x>/extra/`.

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| a - divided card | 2 | 2 | 2 | 2 | 1 | 1 | 2 | 2 | 1 | 15 | no |
| b - open card | 2 | 2 | 2 | 1 | 1 | 1 | 2 | 2 | 1 | 14 | no |

Lines 5, 6 and 9 cost both variants a point:

- **5 (props a user could feed):** six props, typed, every one with a default, `abv` a string for a stated reason. But the input is printable ASCII only, and Kolsch, Marzen and Weissbier are everyday style names that a brewer types with an umlaut or an eszett. The brief asked for the ASCII boundary and the template refuses the letter instead of dropping it, which is the honest half; it is still a prop this community cannot always feed as written.
- **6 (would they use it instead of what they do now):** the brewer in the evidence has a working Canva template and prints a sheet. This makes one PNG per beer: no sheet, no tag size, no artwork. It earns its place for someone who scripts a club's tap list from recipe exports, and only there.
- **9 (the tutorial tells the truth):** pages 1-5 do - the problem page quotes the thread the scout cited, the solution page describes the variant it ships with (a says "thin rules", b says "white space and one thin rule"), the third caveat says who wrote what. Page 6 at critique time shows the five Codex calls and not the session build that produced the template. The ship phase has to close that.

## What each variant gets right / wrong

**a - divided card**
- `stills/landscape.png`: the name at 162 px and the number at 216 px are the two things seen first; the vertical rule makes the strength a block of its own; the footer credit at 45 px stays subordinate.
- `extra/widest-48-square.png`: 48 x `@` in all three text props with `100.00` batch - three, two and three lines, nothing outside the margins, the footer grown to the bottom fifth and its rule at 80.2% of the height. The rule is what keeps a full identity block from running into the number.
- `extra/missing-abv-no-brewer-square.png`: `ABV` / `Not supplied`, no digit, no percent sign, no `BREWER:`; the footer rule stays over quiet white. Wrong: the vertical rule in landscape runs the full body height while the text groups are centred, so it is taller than anything beside it.

**b - open card**
- `stills/landscape.png`: the calmest picture of the day; the gutter alone separates the groups and it is enough at the defaults.
- `extra/long-real-square.png`: a two-line name over a two-line style over the number - one undivided stack. The strength is set apart only by white space of about the same size as the gaps inside the groups. The brief's contract wants the value and its qualifier "inside the same visual region"; here the region is implied, not drawn. That is the point it loses on line 4.
- `stills/portrait.png`: two groups floating in a tall white page with nothing between them; reads as unfinished next to a's portrait.

## Decision: SHIP a

## If ship: what a human polish pass should look at first

1. Accept Latin-1 letters if the bundled font draws them (check the glyph coverage gate first): Kolsch and Marzen should not need transliterating.
2. The landscape divider's height: tie it to the taller text group instead of the whole body.
3. Portrait spends half its height on white. A print-oriented v2 would size for a tag (and lay several cards on a sheet) instead of centring two groups in a phone-shaped page.
4. The fit takes the largest size that fits, so a long style line wraps to two big lines before it shrinks to one. Supporting copy might prefer fewer lines over more pixels.
