# Build - 2026-09-30

## Template: @one-a-day/events/homebrew-serving-card/v1

Who built it: the scheduled run (Codex, gpt-6-astra, slot `codex-astra-ultra`) wrote the scout and the brief, then hit its usage limit 70 seconds into the build; build calls 1-3 in `trace.json` are that cut. This page is build call 4: a Claude Code session (Fable 5.1) working from Codex's brief, as recorded in `run.json` `runner.session`. The scaffold Codex had started was reverted by the no-ship gate, so the template was written from the scaffold up.

Before quoting the evidence the session opened the AHA thread itself (`logs/session-evidence.json` keeps the two passages it quotes, not the rest of the thread). The scout's paraphrase holds. The post, 22 January 2026: "I created this template in Canva and simply change the name, beer style, and ABV. I print a sheet, cut them out, and staple them to reusable hanging tags for kegs, jockey box for serving at events, and bottles so I can take them to a brew club meeting." And of AI-made labels: they "use a lot more ink because of all the rich colors." The tutorial quotes it without the member's handle.

What it is: one still PNG on white. Five text props (`beerName`, `beerStyle`, `abv`, `abvBasis`, `brewer`) plus `debugLayout`. Wide canvases (4:3 and wider) put the strength beside the name; portrait and square stack it below. `abv` is a string: `""` renders `ABV` / `Not supplied`, `"0"` renders `0%`, `"5.20"` keeps its digits. The line under the number is `Estimated ABV`, `Batch ABV` or `Not supplied`.

One departure from the brief's sketch, inside what it allows ("the builder may adjust them to fit accepted text"): the 3:1 and 6/7 shares are starting points, not fixed boxes. The type floor is 10/270 of the short side (40 px at 1080), and 48 of the widest glyph (`@`, 0.898 em - wider than `W`) do not fit fixed shares on a square at that floor. So each group fits its supporting line first, gives the primary the rest and is centred in its region, and the footer grows from 1/7 of the content into the whole bottom fifth before a brewer credit is refused. The footer rule never rises above 80% of the canvas.

## Variant a - divided card · gate: clean · render: ok · stills: the brief's baseline

A thin rule between the identity and the strength (vertical on a wide canvas, horizontal otherwise), and the footer rule. Build, layout sweep at 7 canvases, check-why and `m0saic doctor` clean (doctor: ok, 0 errors; its 4 warnings are older templates'). `report.json`: landscape, portrait, square and the tutorial all exit 0.

Stills: landscape reads "Workshop / Pale Ale" at 162 px with "American Pale Ale" under it on the left, "5.2%" at 216 px over "Estimated ABV" in the right third, "BREWER: Example Homebrew Club" under the footer rule. Portrait and square centre everything; the rule sits between the style and the number.

Off-default renders in `variants/a/extra/`: `missing-abv-no-brewer-square.png` (ABV / Not supplied, no number, no credit, the footer rule kept), `widest-48-square.png` (48 x `@` in name, style and brewer with `100.00` batch: three, two and three lines, all inside the margins, the footer grown), `long-real-480x270.png` (a 44-character name on the smallest contract canvas: three balanced lines at 34 px, the number at 38 px, everything legible).

## Variant b - open card · gate: clean · render: ok · stills: calmer, weaker grouping when the copy is long

The same card with only the body divider removed; the white gutter separates the two groups and the footer rule stays. Same gates, same result; the fingerprint differs by one frame.

Stills: landscape is the calmest of the six pictures. Portrait leaves the two groups floating in a lot of white. `variants/b/extra/long-real-square.png` is the telling one: with a two-line name and a two-line style the square becomes one undivided stack, and the strength is set apart by white space alone.

## Why-tutorial

- Problem page: the forum quote above, where the labels go (kegs, event serving, club-meeting bottles), the ink remark, then that BeerXML keeps `EST_ABV` and `ABV` as two different fields and one bare number hides which it is. Four sources, all opened by the scout; the first re-opened by this session.
- Solution page: five text props, what leads and what supports, the three strength states, why `abv` is a string, how long copy is fitted. Caveats: no importer or print sheet; printable ASCII only (Kolsch, Marzen without the umlaut); scout and plan on Codex, the template by a Claude session.
- Page 6 shows the five Codex calls for now; the ship phase copies the finished timeline once the session's phases are in `trace.json`.

## What was hard

- A text rect cannot be bound to an enum prop: `bindProp(qualifier, "abvBasis")` is rejected as `unsupported-type`. The qualifier stays unbound while a value is present (the schema picker edits the enum) and binds to `abv` in the missing state. Doctor accepts that.
- A pack index is `export *`: `normalize` collided with bird-walk-sightings' export of the same name (TS2308). Helpers a template exports need pack-unique names (`normalizeServingCard`, `layoutServingCard`).
- Greedy wrapping at the largest size leaves a widow ("Workshop Pale / Ale" on the square). After the size is chosen the breaks are rebalanced to make the longest line as short as possible; the line count and the size do not change, so the fit still holds.

## In place now: b
