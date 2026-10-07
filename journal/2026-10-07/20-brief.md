# Brief — 2026-10-07

## The use case (two sentences, from the scout)

Chess players on Lichess and Chess.com share their games in forums, Discord, blogs, and streaming communities; Lichess runs a monthly "Game of the Month" contest and streamers analyze games for audiences. Rating milestones and tournament results prompt local announcements — a card renders one game's metadata (opening, result, rating change, time control) as a shareable recap, simpler and more professional than a screenshot.

## The template

- id: `@one-a-day/sports/chess-game-recap/v1`
- title: `2026-10-07 · Chess Game Recap`
- kind: image (still)
- canvas hint: 1920×1080 landscape (primary); must work at portrait 1080×1920 and square 1080×1080
- aspects: all seven canvases (640×360, 480×270, 1280×720, 1920×1080, 1080×1920, 1080×1080, 3840×2160)

## Layout

Five regions:

```
┌────────────────────────────────┐
│  OPENING NAME                  │  ← header band, top 18%
├────────────────┬────────────────┤
│                │                │
│   RESULT       │  TIME / RATING │  ← main zone, center 60%
│  (icon + text) │  (stacked)     │
│                │                │
├────────────────┴────────────────┤
│  Date · vs Opponent            │  ← footer band, bottom 22%
└────────────────────────────────┘
```

**Regions**:
- Header (top ~18%): Opening name, centered, large readable type
- Main (center ~60%): Left half shows result icon + word (WIN / LOSS / DRAW in 44pt+); right half shows time control (stacked above rating change) in smaller type
- Footer (bottom ~22%): Date (left) · opponent name (center-right), slightly smaller type

## Layout contract

- **Text fits**: Opening name fits in the header width at defaults; result icon + label and time/rating values all fit their cells at all seven canvases
- **Presence**: Opening name, result (icon + label), time control, rating change, and date always present; opponent name in footer always present (default or supplied)
- **Chrome**: Header bar is full width, footer bar is full width; result icon is a bold square or circle mark, 40% of left-half width, vertically centered

## Props

| Name | Type | Default | What it changes | Required? |
|------|------|---------|-----------------|-----------|
| `opening` | string | "King's Indian Defense" | The opening name displayed in the header | Yes |
| `result` | "win" \| "loss" \| "draw" | "win" | The outcome label and icon color (green for win, red for loss, gray for draw) | Yes |
| `ratingChange` | number | 25 | The rating delta displayed in the right column (e.g., +32, -18) | Yes |
| `timeControl` | string | "10+5" | The time control format displayed in the right column (e.g., "5+3", "1+0", "classical") | Yes |
| `date` | string (ISO YYYY-MM-DD) | "2026-10-07" | The date displayed in the footer | Yes |
| `opponentName` | string | "Opponent" | The opponent/player name displayed in the footer after "vs" | No |

## Beats

N/A — this is a still image, no animation or motion.

## Defaults must show

A viewer with no inputs sees:
- "King's Indian Defense" in the header
- A green square or circle with "WIN" in the main left zone
- "10+5" (time control) stacked above "+25" (rating change) in the main right zone
- "2026-10-07 · vs Opponent" in the footer
- The template is complete and requires no user input to render something professional and understandable

## Acceptance rubric

1. **All text fits** at all seven canvases (640×360 through 3840×2160); no clipping, no overflow; opening name, result label, time control, rating change, date and opponent name all fully readable
2. **Result indicator is clear**: Icon (colored square or circle) + label are visually distinct; colors are unambiguous (green = win, red = loss, gray = draw) at small and large canvases
3. **Footer information is legible** in the 22% band at the bottom; date is left-aligned, opponent name right-aligned with "vs" prefix, readable at 640×360
4. **Determinism**: Renders identically each time with the same props; no random colors, no timestamp, no external API calls
5. **Defaults tell the story**: A viewer with zero prop inputs sees a complete, professional game recap card that immediately communicates opening, result, time control, rating change, date and opponent

## Variants worth trying

1. **Compact layout**: Result and stats side-by-side in one row instead of a two-column split (left result | right time/rating); test legibility at portrait aspect
2. **Vertical icon emphasis**: Result icon (large square or circle, 80% of left cell height) with label below instead of beside; frees space for FEN or piece count footnote
3. **Palette toggle**: Dark background with light text (current implied); variant with light background and dark text for screenshot contrast against different backdrops
