# Brief — 2026-10-24

## The use case

Orienteers post their split times after every race on Attackpoint and club/WinSplits
result pages, and everyone asks the same question: "where did I lose time?" WinSplits
already computes the answer — a per-leg "time loss" with mistake legs coloured pink —
but it lives in a results-table web page nobody can post. This template turns one
racer's IOF XML 3.0 result row into a shareable, deterministic split-analysis card.

## The template

- id: `@one-a-day/sports/orienteering-split-analysis/v1`
- pack: `sports` (existing — an orienteering split card is a race-recap card exactly
  like the swimming, HYROX, erg and golf cards already in this pack; no new pack).
- title: `Orienteering Split Analysis` (scaffold renders `2026-10-24 · Orienteering Split Analysis`)
- kind: **still image**; canvas hint **1280x720** (landscape, the shape of a WinSplits
  table read left-to-right). Must also work at portrait 1080x1920 and square 1080x1080,
  and the seven-contract-canvas sweep at defaults.
- duration: still.

## Layout

A card in three vertical bands: header, a control-by-control body, footer.

```
+--------------------------------------------------------------+
| EMMA LINDQVIST                        FINISH  45:02          |
| OK Klyftamo · W21E                   PLACE   #12   +1:23     |
| Middle, 4.2 km                                             |
+--------------------------------------------------------------+
| ctrl |         split tape (slowest leg = full)    | split | loss |
|  1   | [#################]                       | 4:08  | +0:47 |  <-- pink
|  2   | [##########]                              | 2:41  | 0:00  |
|  ...                                                        |
|  F   | [########]                                | 1:55  | 0:00  |
+--------------------------------------------------------------+
| TIME W/O MISTAKES  42:04        TOTAL LOSS  +2:58   BEST LEG  1:32 |
+--------------------------------------------------------------+
```

- **Header (top ~0–0.26 of H).** Left: name (bold), then `club · class`, then `course`
  (dim). Right: the finish time as the hero figure with a `FINISH` label, a place chip
  (`#12`, accent fill), and `+1:23` as the time-behind line. The finish is the number a
  screenshot buries, so it is the largest text on the card.
- **Body (~0.26–0.80 of H).** One row per leg, in course order. Columns: control code
  (dim, right-aligned), the split tape, split time (bold, right), time loss (right).
  The tape bar's length is `split / slowestSplit` — the slowest leg fills the track,
  every other leg is shorter in proportion. A leg with `loss > 0` is a **mistake leg**:
  its bar is filled in the accent (pink), its loss text is accent-coloured and signed
  (`+0:47`); a clean leg gets a neutral bar and `0:00` (or an empty loss cell).
- **Footer (bottom ~0.80–1.0 of H).** Three cells: `TIME W/O MISTAKES`, `TOTAL LOSS`,
  `BEST LEG`. Time-without-mistakes = finish − total loss; total loss = Σ leg loss;
  best leg = min split. All three are arithmetic on the entered numbers, so the card
  can verify them — no class-relative claim is re-derived.

## Layout contract (the invariants the build sweeps)

- **Every text fits its box** — `tag` every text source and give each label a
  `textFitsMeasured` (the header block is fitted against the real font, so measured is
  exact).
- **Bands** — `name`/`club`/`class`/`course`/`finish`/`place`/`behind` and the place
  chip `within { yFrac: [0, 0.26] }`; every body row and its cells `within
  { yFrac: [0.26, 0.80] }`; the three footer cells and their values `within
  { yFrac: [0.80, 1] }`.
- **Presence + shape** — the place chip is `{ label }` present; the tape column is
  `minWidthFrac: 0.32` so the bars read as bars at every aspect; the full-width row
  bands are present for every leg.
- **Relation** — all body rows `equal: "size"` (tolerance 2px), and the three footer
  cells equal size.
- No exact fractions are pinned beyond the three bands and the tape width — the use
  case does not ask for pixel positions.

## Props (name · type · default · what it changes · required?)

1. `name` · string · `"Emma Lindqvist"` · header bold line · no (empty hides)
2. `club` · string · `"OK Klyftamo"` · header second line · no (empty hides)
3. `className` · string · `"W21E"` · class, joined after club · no
4. `course` · string · `"Middle, 4.2 km"` · header third line · no (empty hides)
5. `finish` · string · `"45:02"` · the hero figure, `m:ss` / `h:mm:ss` · no (fail-fast if unparseable)
6. `place` · number · `12` · the place chip `#12`; 0 hides the chip · no
7. `behind` · string · `"+1:23"` · time behind winner, printed as entered · no
8. `splits` · json list · a 12-control middle course (13 legs incl. the `F` finish
   leg) · the body rows · no. Each item `{ control: string, split: "m:ss", loss: "m:ss" }`;
   `loss` is the WinSplits per-leg time loss, `0:00` = clean. Min 4 legs, max 18.
9. `accent` · color · `#d94f8c` · the mistake-leg pink (bars + loss text + place chip) · no
10. `preset` · string · `"dark"` · page and ink, `"dark"` | `"light"` · no
11. `debugLayout` · boolean · `false` · draws the contract over the card (dev-only) · no

The `splits` json schema (via `meta.constraints.jsonSchema`) mirrors the IOF field
names (`control`, `split`, `loss`) so the editor surfaces a structured form.

## Beats

Still image — no beats.

## Defaults must show

With no inputs the gate renders a legible dark card: the name/club/class/course header,
`45:02` as the hero, a `#12` chip and `+1:23`, a 13-row body in course order with
three mistake legs drawn pink and their loss signed, and a footer reading
`TIME W/O MISTAKES 42:04 · TOTAL LOSS +2:58 · BEST LEG 1:32` (computed from the
entered splits). The "where did I lose time?" answer is visible at a glance: pink =
mistake, bar length = split.

## Acceptance rubric (the critic scores against this)

1. **The question reads instantly.** Bar length = split length; mistake legs (`loss > 0`)
   are pink in both bar and loss text; clean legs are neutral. No legend needed.
2. **The header is the result.** Finish time is the largest text; name/club/class/course,
   place chip and time-behind are all in the top band and all fit at defaults.
3. **Honest math.** `loss` per leg is taken as a prop (never re-derived — it is WinSplits'
   class-relative number); total loss and time-without-mistakes are computed from it and
   printed consistently; `finish` is printed as entered and not checked against the split
   sum.
4. **Layout contract holds at the seven canvases at defaults** — every text fits, header/
   body/footer in their bands, rows equal height, tape ≥ 32% wide — and the template's own
   test sweeps the stress copy (a long club name, a 4-leg course, an 18-leg course, light
   preset, a mistake on the last leg).
5. **Deterministic and fail-fast.** No clock/random/ambient state; same props → identical
   m0 (the gate diffs twice). A malformed time (decimal, over 99:59:59), a non-`m:ss` loss,
   a control count outside 4–18, or a name longer than the fit floor throws a clear
   `@one-a-day/...: <field> <rule>` error instead of rendering.

## Variants worth trying (each ONE idea, not a rewrite)

- **a (primary):** dark card, bar = split length, pink fills the mistake leg's bar and its
  loss text; clean legs leave the loss cell blank.
- **b (layout):** loss-first — the time-loss column becomes the emphasised, right-of-tape
  figure and the split time dims, so the "mistake" column is what the eye lands on; the
  whole mistake row also gets a thin pink left rule + a pink wash.
- **c (motion):** a short video reveal — the tape bars draw on left-to-right in leg order
  (pink legs land pink) and the finish time counts up; same geometry, `ctx.target.durationMs`
  as the clock.
