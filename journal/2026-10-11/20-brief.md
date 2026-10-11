# Brief — 2026-10-11

## The use case (from the scout)

Book bloggers and reading-challenge readers post a monthly wrap-up whose
numbers - books finished, pages read, average rating, and the Goodreads
Challenge pace line ("16 books behind schedule (88/125)") - they compute by
hand from the Goodreads library export, every month, for years. The card
renders those numbers, including the pace math nobody enjoys redoing.

## The template

- id: @one-a-day/personal/reading-goal-recap/v1
  (new pack: the shelf has team, hobby and tool cards but nothing for a
  person's own numbers; "personal" is in the pack vocabulary and this is its
  first use)
- title: Reading Goal Recap   (scaffold prefixes "2026-10-11 · ")
- kind: image; canvas hint 1920x1080; landscape, portrait and square must all
  work (wrap-ups go to blogs, feeds and stories)
- duration: still

## Layout

```
+------------------------------------------------------+
| OCTOBER 2026                    wrap-up - @leah_reads|  header
| +-----------+  +-----------+  +-----------+          |
| |    15     |  |   4,703   |  |    4.3    |          |  stat tiles:
| | books     |  | pages     |  | avg rating|          |  books/pages/avg
| +-----------+  +-----------+  +-----------+          |
| GOAL  46 / 52 books                                  |
| [#####################---------|-------]  88%        |  progress bar,
|        3 ahead of pace          ^ pace tick          |  pace tick + delta
| ON THE OCTOBER SHELF                                 |
|  The Dark Descent of Elizabeth Frankenstein ..... 5  |  titles (max 6)
|  Nettle and Bone ............................... 5   |
|  Babel ......................................... 4   |
|  The Ex Hex .................................... 4   |
+------------------------------------------------------+
```

Header top band; three equal stat tiles; the goal block (count line, bar,
pace tick, delta line) is the hero in the middle band; the shelf list fills
the lower band. Portrait/square: same stacking, tiles stay one row.

## Layout contract (the invariants the build sweeps)

- every text fits its box (measured); the month header, the goal count, the
  delta line and every title row are `tag`ged sources with `textFits`
- the header lives in the top quarter; the goal bar in the middle band
  (yFrac roughly [0.3, 0.75]); the shelf list in the lower band
- the bar frame is full-width (minWidthFrac 0.9); the pace tick is present
  and sits inside the bar's y-range
- the three stat tiles are one size (relation: equal size)
- no exact fractions pinned beyond those bands

## Props (name · type · default · what it changes · required?)

- month · string · "October 2026" · the header's first line · no
- reader · string · "@leah_reads" · the handle, header right · no
- books · int 0-999 · 15 · books finished this month (tile 1) · no
- pages · int 0-999999 · 4703 · pages read (tile 2) · no
- avgRating · number 0-5, one decimal · 4.3 · the month's average (tile 3) · no
- goalTotal · int 1-999 · 52 · the year's reading-challenge goal · no
- booksSoFar · int 0-999 · 46 · books finished year-to-date (goal line, bar) · no
- dayOfYear · int 1-366 · 304 · the day the card is for; drives the pace tick
  (pace = goalTotal x dayOfYear / 365) - a PROP, no clock · no
- titles · json list of {title, rating} · 4 entries · the shelf rows, max 6
  shown, rating 0-5 in half steps drawn as "4.5" · no
- accent · #rrggbb · bar fill and delta-when-ahead · no
- preset · "dark" | "light" · page and ink · no
- debugLayout · boolean · dev-only contract overlay · no

Derived (computed, never props): progress fraction booksSoFar/goalTotal; pace
= goalTotal x dayOfYear/365; delta = booksSoFar - pace, printed "N ahead of
pace" / "N behind pace" / "on pace"; bar fill and tick x from those.

## Defaults must show

An invented but consistent October wrap-up: 15 books and 4,703 pages at a 4.3
average; 46 of 52 at day 304 of 365, i.e. the bar 88% full, the pace tick at
83%, "3 ahead of pace"; four shelf titles with ratings. The schema's
description says the numbers are invented, as the golf card's did.

## Acceptance rubric (the critic scores against this)

1. Renders at defaults on every contract canvas, no error mosaic; every
   printed number is derived consistently (88% = 46/52, tick at 304/365 of
   the bar, delta = booksSoFar - pace, sign correct).
2. A stranger reads it as a monthly reading wrap-up with a yearly-goal pace
   bar - the use case shows with no inputs.
3. Text fits at portrait and square, not only landscape; titles clamp at 6
   rows; long titles refuse with a named error rather than clip.
4. Deterministic: same props and canvas, same rects - dayOfYear is a prop,
   no clock, no Math.random.
5. The pace tick lands exactly at pace/goalTotal across the bar at every
   canvas, and the delta text agrees with it.

## Variants worth trying (one idea different each)

- a) goal-bar hero: dark preset, stat tiles row, the big bar with pace tick,
  shelf list below (the sketch above).
- b) pace-forward: the delta becomes the hero number ("3 ahead of pace" at
  display size), tiles compress to a single strip line; tests whether the
  pace line alone carries the card.
