# Brief — 2026-10-12

## The use case (two sentences, from the scout)
Outdoor climbers already export a Mountain Project tick CSV and still want the grade pyramid as a picture: clean sends per grade, hardest on top. The forum's own complaint is that the tools either hide flash and onsight or draw two histograms on their side instead of a pyramid.

## The template
- id: @one-a-day/sports/climbing-send-pyramid/v1
- title: Climbing Send Pyramid
- kind: image; canvas hint 1080x1080; landscape, portrait and square must all read
- duration: still

## Layout (regions, ratios, what goes where)
Square-first share card. Rock-and-chalk, not a dashboard screenshot.

```
+--------------------------------------+
| climber                    SPORT     |
| place · N clean sends                |
|                                      |
| 5.12a        [=]              1      |
| 5.11d       [==]              2 (1)  |
|  ...                                 |
| 5.10b   [================]   18 (7)  |
|                                      |
| bar width = clean sends. cap = flash |
+--------------------------------------+
```

- Header, about the top fifth: climber (largest), a discipline chip, then place and the derived total on one line.
- Body: 3 to 8 rows, equal height, caller's order, hardest first. Grade on the left. A track in the middle. The bar is centered in the track and its width is sends / max sends, so a base of easy grades reads as a pyramid and a top-heavy list reads as top-heavy. A cap on the left of the bar is flashes / sends of that bar (flash or onsight). The count sits on the right as `sends` or `sends (flashes)`.
- Footer, bottom band: one line that names both inks. No arrow glyphs.

A 1-send bar is at least a few pixels so the peak is visible; above that, width is the integer ratio. The template does not sort grades.

## Layout contract (the invariants the build sweeps)
- Every text label fits its box (measured).
- Climber sits in the top 30% of the canvas.
- Footer sits in the bottom 16%.
- Every grade row has a track and a bar; row tracks are one height.
- Do not pin a header percentage. The pyramid is the picture; the chrome just frames it.

## Props (name · type · default · what it changes · required?)
- climber · string · "Mara Ellison" · header name · no
- place · string · "Red River Gorge, fall 2026" · second line; empty removes it · no
- discipline · "sport" | "boulder" | "trad" · "sport" · the chip only; it does not filter rows · no
- grades · list of { grade, sends, flashes } · 8 invented sport rows that widen downward · the pyramid · no (defaults show the use case)
- accent · #rrggbb · "#e7d3a1" · the send-bar ink · no
- cap · #rrggbb · "#d4783a" · the flash/onsight cap · no
- preset · "dark" | "light" · "dark" · page and ink · no
- debugLayout · boolean · false · draw the contract · no

grade: 1-8 ASCII characters ("5.12a", "V8", "7a+"). sends: integer 0-999. flashes: integer 0-sends. 3 to 8 rows. At least one sends > 0. Duplicate grades refused. Order is the caller's.

## Beats
still

## Defaults must show
An invented climber, eight sport grades from 5.12a (1 send) down to 5.10b (18 sends, 7 of them flash or onsight), bars centered and widening toward the base, a rust cap on every row that has flashes, counts as `18 (7)`, total 65 clean sends, and a footer that says what the two inks are. A stranger should say "that is a climbing pyramid" without reading the journal.

## Acceptance rubric (the critic scores against this)
1. Still PNG at defaults on landscape, portrait and square, exit 0, no error mosaic.
2. Defaults show a pyramid: hardest grade on top, bars centered, wider toward the base, not a left-aligned histogram.
3. The cap width is flashes/sends of that bar, and the footer names both inks. A row with flashes 0 has no cap.
4. The total is the sum of sends, not a typed prop. Counts print `sends` or `sends (flashes)`.
5. Grades stay in the order given. flashes > sends, a duplicate grade, fewer than 3 or more than 8 rows, or a max of 0 sends is a validation error.
6. Text fits at 480x270 at defaults and at a long name with 8 rows.
7. WHY quotes the forum's pyramid complaint and does not claim the template sorts grades or reads a CSV file.

## Variants worth trying (up to 3, each ONE idea different)
- a: centered bars, flash/onsight as a cap inside the bar, count `sends (flashes)`.
- b: same math, but the cap is a thin bar under the send bar instead of inside it — only if (a) reads as one blob. Otherwise leave (a) in place.
