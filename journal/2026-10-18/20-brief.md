# Brief - 2026-10-18

## The use case

Competitive Warhammer 40,000 players build armies in BattleScribe and share the resulting `.ros`/`.rosz` roster for "rate my list" posts and tournament check-ins. The native printout is a multi-page wall of text and screenshots are hard to read, so the community wants a single clean card that shows faction, detachment, points and units at a glance.

## The template

- **id:** `@one-a-day/gaming/wh40k-roster-card/v1`
- **pack:** `gaming` — an existing pack; the last two days shipped MTG Commander and osu! cards there and the audience is the same hobby-gaming share-card niche.
- **title:** `WH40k Roster Share Card`
- **kind:** image
- **canvas hint:** 1080x1920 portrait
- **aspects that must work:** landscape (16:9, 4K), portrait (9:16, story), square (1:1), and the small contract canvases down to 480x270
- **duration:** still

## Layout

Portrait-first card, three horizontal bands:

```
+----------------------------------+
| ARMY NAME                1995/2000 |  <- header ~22-26% of height
| Faction · Detachment               |
+----------------------------------+
| [HQ]  Captain in Gravis      95   |  <- unit rows ~62-66%
| [TR]  Intercessor Squad x5   95   |
| [EL]  Bladeguard Veterans x3 90   |
| ...                                |
+----------------------------------+
| 1995 / 2000 pts  ·  BattleScribe   |  <- footer ~8-10%
+----------------------------------+
```

- **Header band:** left-aligned army name (largest line), faction and detachment on the line below, points used / points limit as a pill in the top-right. On landscape the pill can sit beside the army name; on portrait it stays top-right and the name wraps/fits.
- **Body band:** one row per unit. Each row has a category badge (HQ, TR, EL, FA, HS, FL, LW, DT), the unit name, a model-count chip, points right-aligned, and optional enhancement/warlord chips.
- **Footer band:** totals (points used / limit) and a small "BattleScribe Roster" credit line.

The layout adapts to aspect ratio: portrait keeps a single list; landscape switches to a two-column unit grid if there are enough rows; square keeps one centered column with slightly larger margins.

## Layout contract

- Every text source is tagged and every label has a `textFits` constraint.
- Header elements live in `yFrac [0, 0.26]`.
- Unit rows live in `yFrac [0.28, 0.88]`.
- Footer lives in `yFrac [0.90, 1]`.
- All unit-row backgrounds are equal height within a render (relational constraint).
- Category badges share the same width/height and are left-aligned.
- The points pill is right-aligned in the header (`xFrac [0.55, 1]`).
- No non-ASCII characters in default copy or labels.

## Props

| name | type | default | what it changes | required? |
|------|------|---------|-----------------|-----------|
| `armyName` | string | `"Strike Force"` | largest header line | no |
| `faction` | string | `"Adeptus Astartes"` | faction line and palette hint | no |
| `detachment` | string | `"Gladius Task Force"` | detachment line | no |
| `pointsUsed` | number | `1995` | points total in header pill and footer | no |
| `pointsLimit` | number | `2000` | points limit in header pill and footer | no |
| `units` | list of `{name, models, points, category, enhancement?, warlord?}` | 6 default Space Marine units | the unit rows | no |
| `accent` | string (#rrggbb) | `"#c0392b"` | header pill, category badge ink, enhancement chips | no |
| `preset` | `"dark" \| "light"` | `"dark"` | page/ink palette | no |
| `debugLayout` | boolean | `false` | draws layout-contract overlay | no |

Unit list constraints: 1-20 rows; `category` must be one of the allowed BattleScribe role abbreviations (HQ, TR, EL, FA, HS, FL, LW, DT); `name` 1-48 printable ASCII; `models` and `points` are non-negative integers.

## Defaults must show

With no inputs the card renders a 2000-point Adeptus Astartes Gladius Strike Force with six sample units (HQ, Troops, Elites, etc.), a red points pill, dark palette, and the "BattleScribe Roster" footer — immediately readable as a Warhammer 40k army share card.

## Acceptance rubric

1. Header clearly shows army name, faction, detachment, and points used/limit.
2. Unit rows show category badge, name, model count, points, and optional enhancement/warlord chips.
3. Footer totals match `pointsUsed`/`pointsLimit`.
4. No text clips on any of the seven contract canvases (1920x1080, 1280x720, 1080x1920, 1080x1080, 3840x2160, 640x360, 480x270).
5. Defaults render with no inputs and communicate the template's purpose.
6. No Games Workshop art, stat blocks, or rule text — only user-supplied factual names.
7. Output is deterministic: identical props produce identical pixels.

## Variants worth trying

- **a — portrait list rows (default):** single-column unit list under a tall header, optimized for story/phone posts.
- **b — landscape two-column grid (layout):** when `W >= H`, split units into two equal columns beside the header; the header stays top and the points pill moves to the right.
- **c — tournament check-in palette (palette):** a light, high-contrast "print" preset that looks like a checklist sheet rather than a dark datacard.
