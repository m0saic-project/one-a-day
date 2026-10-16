# Brief - 2026-10-16

## The use case (two sentences, from the scout)

Commander/EDH players share decklists exported from Moxfield, Archidekt or ManaBox in game-night chats, "rate my deck" posts and tournament coverage, and today that share is an image hand-made in Canva or one-off web tools - a player built one two weeks ago just to stop re-making it. The digest is what the ecosystem converged on: deck name, commander, color identity, mana curve, bracket/record and a few highlight cards as one image, rebuilt every time the deck changes.

## The template

- **id:** `@one-a-day/gaming/commander-deck-spotlight/v1` (existing `gaming` pack - 5 templates at HEAD; no new pack)
- **title:** `Commander Deck Spotlight Card` (scaffold prefixes the date: "2026-10-16 - Commander Deck Spotlight Card")
- **kind:** image; canvas hint **1920x1080**; aspects that must work: **landscape 16:9**, **portrait 9:16**, **square 1:1**
- **duration:** still

## Layout (regions, ratios, what goes where)

A full-bleed generated background (no card art, no network - the scout's
accepted risk), three horizontal bands and a two-cell body.

```
+----------------------------------------------------------+
| DECK SPOTLIGHT                       [ BRACKET 3 ][ 4-0 ] |  kicker + pills
| Caesar's Legion Tokens                                   |  deck name, largest
| Commander: Caesar, Legion's Emperor          (W)(B)(R)   |  commander + chips
+----------------------------------------------------------+
| MANA CURVE          | HIGHLIGHT CARDS                    |
|                     | 1x Anointed Procession  token doub |
|      |x|            | 1x Skullclamp           draw engin |
|   |x||x|   |x|      | 1x Ashnod's Altar       sac outlet |
| |x||x||x| |x||x| |x|| 1x Impact Tremors      the drain  |
| 0 1  2  3  4  5  6+                                     |
| AVG MV 2.84 - 63 SPELLS                                  |
+----------------------------------------------------------+
| Flood the board with tokens, then drain everyone out.    |  plan line
+----------------------------------------------------------+
```

- **Header band, `yFrac [0, 0.30]`:** kicker `DECK SPOTLIGHT` top-left;
  bracket pill (`BRACKET 3`) and record pill (`4-0`) top-right; deck name
  largest; below it the commander line (`Commander: <name>`) with the color
  identity chips right-aligned on the same line. Chips are one square pip per
  letter of `colorIdentity`, in canonical WUBRG order, colored like mana
  (W parchment, U blue, B near-black, R red, G green).
- **Body, `yFrac [0.30, 0.86]`, two cells:** in landscape, curve left
  (`xFrac [0.03, 0.46]`) and highlights right (`xFrac [0.50, 0.97]`); in
  portrait the two cells stack inside the same band (curve above highlights).
  Square may use either arrangement - the build's choice, the contract bands
  are identical in both.
  - **Mana curve cell:** `MANA CURVE` label; 8 vertical bars for MV 0..6 and
    `7+`, left to right, bar height proportional to count / the largest count
    (the tallest bar fills the plot); the count number above each non-zero
    bar; the MV label under every bar; under the plot the derived figures
    `AVG MV 2.84 - 63 SPELLS` (both computed from the curve, never typed).
  - **Highlights cell:** `HIGHLIGHT CARDS` label; 3-6 equal-height rows,
    hairline-separated: `1x` qty badge (small square) + card name + dim note
    right or under. Rows are a uniform list, not cards.
- **Footer band, `yFrac [0.88, 1]`:** the plan one-liner, dim prose, full
  width. `plan: ""` removes the line and the footer stays empty.

Every cell that shows a prop is `bindProp`-bound to it (rows to
`highlights[i]` leaves via `bindPropPath`, chips to `colorIdentity`, pills to
`bracket`/`record`).

## Layout contract (the invariants the build sweeps)

- Every text source is `tag`-ged and carries `textFits` (measured blocks via
  `textFitsMeasured`, `svgLabel` copy via `textFitsAll` with `TEXT_EM.prose`);
  copy shrinks to fit - never ellipsis at the floor.
- Identity band: kicker, deck name, commander line live in `yFrac [0, 0.30]`;
  bracket/record pills live top-right (`within: { xFrac: [0.55, 1], yFrac: [0, 0.14] }`).
- Color chips are square marks (`aspect: 1`) and live in `yFrac [0, 0.30]`.
- Body: curve labels, bars, figures and every highlight row live in
  `yFrac [0.30, 0.86]`; the bar plot is present (bare `{ label: "curve-plot" }`).
- Footer: the plan line lives in `yFrac [0.88, 1]` (constraint only when
  `plan !== ""`).
- Relation: highlight rows share `equal: "height"` (a uniform list).
- The same bands hold at landscape, portrait and square; nothing is clipped
  at any of the seven contract canvases (1920x1080, 1280x720, 1080x1920,
  1080x1080, 3840x2160, 640x360, 480x270). No exact fractions pinned beyond
  the bands above - the use case asks for regions, not pixels.

## Props

| name | type | default | what it changes | required? |
|---|---|---|---|---|
| `deckName` | string | `"Caesar's Legion Tokens"` | the largest header line; ASCII, 1-48 chars | no |
| `commander` | string | `"Caesar, Legion's Emperor"` | the commander line under the deck name; ASCII, 1-40 chars | no |
| `colorIdentity` | string | `"WBR"` | one mana chip per letter, canonical WUBRG order; letters from `WUBRG`, no duplicates, 0-5 chars; `""` removes the chip row | no |
| `bracket` | number | `3` | the `BRACKET n` pill, integer 1-5 | no |
| `record` | string | `"4-0"` | the record pill (e.g. `4-0`, `2-1-1`); ASCII, 0-8 chars; `""` removes the pill | no |
| `curve` | number[] | `[4, 10, 16, 13, 9, 6, 3, 2]` | the histogram: counts at MV 0,1,2,3,4,5,6,7+ (exactly 8 integers, 0-99); also drives the derived AVG MV and spell count | no |
| `highlights` | list | 4 rows (see below) | the highlight rows: 3-6 rows of `{ name (ASCII 1-48), note (ASCII 0-28), qty (1-99) }` | no |
| `plan` | string | `"Flood the board with tokens, then drain everyone out with Impact Tremors."` | the footer one-liner; ASCII, 0-90 chars; `""` removes it | no |
| `preset` | string | `"dark"` | `"dark"` (builder-UI night look) or `"light"` (daylight look); oneOf | no |
| `accent` | string | `"#c9a227"` | bar and pill accent ink, `#rrggbb` | no |
| `debugLayout` | boolean | `false` | draws the layout-contract overlay | no |

Default `highlights` rows: `Anointed Procession / token doubler / 1`,
`Skullclamp / draw engine / 1`, `Ashnod's Altar / sac outlet / 1`,
`Impact Tremors / the drain / 1`.

Derived, never typed: `AVG MV` = sum(mv x count) / sum(count) over the curve
(179/63 = 2.84 at defaults), and the spell count = sum(count) = 63.

Validation is fail-fast in `render()` with the prop name and the rule: curve
length != 8, curve sum 0, bracket outside 1-5, invalid or duplicate color
letters, highlights outside 3-6 rows or name over 48 chars, any drawn copy
outside printable ASCII.

## Beats (video only: t=0...end, what moves)

Still - no beats. (Variant c probes motion below; it is not the ship target.)

## Defaults must show

With no inputs the viewer sees a complete Mardu tokens spotlight on the dark
preset: kicker `DECK SPOTLIGHT`, `BRACKET 3` and `4-0` pills, `Caesar's
Legion Tokens` over `Commander: Caesar, Legion's Emperor` with three mana
chips (W B R) right-aligned; an eight-bar curve peaking at MV 2 with counts
above the bars and `AVG MV 2.84 - 63 SPELLS` beneath; four highlight rows;
the plan line across the footer. Every optional knob visibly does what its
default claims.

## Acceptance rubric (the critic scores against this)

1. `npm run build` and `npm test` pass; the template renders at defaults with
   no inputs, and the layout contract holds at all seven contract canvases.
2. The curve never lies: 8 bars in MV order 0..7+, heights proportional to
   counts (tallest fills the plot), labels match the prop, and the derived
   figures check out by hand (179/63 = 2.84, 63 spells at defaults).
3. Identity is complete at a glance and each part removes cleanly: deck name,
   commander line, one square mana chip per color letter in WUBRG order,
   bracket and record pills - `""` empties a part, never leaves a blank.
4. Deterministic and fail-fast: two renders diff identical; `render()` throws
   naming the prop on curve sum 0 / length != 8, bad color letters, bracket
   out of range, highlights outside 3-6; no `Math.random`, no clock, no fetch.
5. Text fits everywhere (measured shrink, no ellipsis at the floor), default
   copy is ASCII-only, highlight rows are equal height, and nothing clips or
   overlaps at 1920x1080, 1080x1920 or 1080x1080.

## Variants worth trying (up to 3, each ONE idea different)

1. **a - Baseline layout:** histogram left, highlight rows right, as spec'd
   above.
2. **b - Swap the body axes:** one layout idea - mana curve as horizontal
   rows (count at the row end, climbing-pyramid style) and the highlights as
   a 2-column tile grid; same bands, same props.
3. **c - Motion probe:** one motion idea - a ~4s clip where the bars grow
   from the axis and the rows stagger in, holding on the full card; not the
   ship target, it tests whether the digest works in motion. If it wins, the
   still must remain readable as its final frame.
