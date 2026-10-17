# Brief — 2026-10-17

## The use case (two sentences, from the scout)

Every indoor rower's piece ends on a PM5 result — split, time or distance, spm,
watts, drag — and every PR and season 2k test wants a shareable record, but the
community types raw numbers into PB threads, carries whole ladders in forum
signatures, or photographs the monitor. The Logbook hands them structured rows
(and Concept2's own pitch is "broken your personal best and want to shout it to
the world") yet no picture; the card is that picture, from numbers every rower
already has. Sources: the c2forum PB thread, the public 2026 2000m ranking page
(percentile bands printed on it), the Logbook/Utility CSV pages.

## The template

- id: `@one-a-day/sports/erg-pb-card/v1` (pack `sports` exists — rowing joins
  swim, powerlifting, cubing, golf, climbing; no new pack needed)
- title: `Erg PB Card` (scaffold renders it `2026-10-17 · Erg PB Card`)
- kind: image (PNG); canvas hint 1080x1080; 1920x1080 and 1080x1920 must work,
  and the contract's seven canvases down to 480x270
- duration: still (`durationMs: 2000` in outputHints only because the
  why-tutorial's "the template itself" page needs a beat)

## The one decision

The split is the hero. `/500m` pace is the community's unit of comparison —
posters convert everything to splits to talk to each other — so the card's
hierarchy is the community's: split biggest, the piece's result second, the
PM5's supporting numbers (spm, watts, drag) as cells, and the season-ranking
percentile — which the ranking page publishes but which moves with
season/age/weight — as a chip the rower supplies. The template computes no
claim it cannot verify: no PB badge, no invented percentile, watts and split as
entered (the PM5 is authoritative, the card does not cross-check them).

## Layout

One shape at every aspect: stacked bands, figures centered. Region ratios of
card height (square): header ~16%, split hero ~30%, result ~14%, pace track
~10%, stat band ~18%, footnote ~12% (margins inside). Wide canvases keep the
same bands (the track loves width); portrait stretches the hero. Chrome sizes
off `min(H, 0.75·W)`, never a bare fraction of H.

```
+----------------------------------------------------------+
| MARCUS ALDER                          [50TH PERCENTILE]  |
| the 2026 season's median 2k             2026 rower      |  header band
|                                          ranking        |
|----------------------------------------------------------|
|                        1:58.8                            |  hero: the split,
|                         /500m                            |  the largest text
|                                                          |
|                        7:55.0                            |  the piece's result
|                        2,000 m                           |  (piece as caption)
|                                                          |
|  1:00        1:30       2:00        2:30        3:00     |
|  +-----------+----------+--^--------+-----------+------+ |
|                               ^ marker at the split      |  pace track
|                                                          |
|      26          |         209         |        110      |
|      SPM         |        WATTS        |        DRAG     |  stat band
|----------------------------------------------------------|
| Split, watts and percentile as entered. The ranking      |  footnote
| moves with season, age and weight class.                 |
+----------------------------------------------------------+
```

Pace track: a thin full-width track, five equal ticks labeled 1:00 / 1:30 /
2:00 / 2:30 / 3:00 (a fixed scale — it claims nothing about ranking; the chip
does that), and an accent marker whose position is `(splitSeconds - 60) / 120`
of the track. 1:58.8 lands at ~49%, just left of the 2:00 tick. Splits outside
1:00-3:00 clamp the marker to the end; the printed split is always the truth.

The percentile block: accent pill ("50TH PERCENTILE") in the header's right,
with the cohort as a small dim line under it ("2026 rower ranking"). Hidden
(percentile 0 or cohort "") rebalances the header to the name's full width.

## Layout contract (the invariants the build sweeps at the seven canvases)

- every text fits its box: `tag(src, label)` every text source, measured
  (`textFitsMeasured`), floors refuse rather than clip — figures and name at
  ~1.8% of the short side, chrome (unit, captions, tick labels, cells' labels,
  footnote, cohort) at ~1.3%; fit at `cell * 0.94 - 2px`
- header band: `rower`, `note`, the chip and the cohort all `within yFrac
  [0, 0.3]`; the name is present whenever set
- the split figure is the tallest text cell on the card (express as a relation
  or pinned zone `yFrac [0.16, 0.6]`); its unit caption sits immediately under
  it
- result figure and its piece caption `within yFrac [0.4, 0.85]`, below the
  split
- pace track: `minWidthFrac: 0.85`, `within yFrac [0.45, 0.8]`; the marker is
  present (bare `{ label: "pace-marker" }`); the five ticks `equal: "size"` with
  `tolerancePx: 2`
- stat cells: each shown cell present, in a band `within yFrac [0.6, 0.95]`,
  `equal: "size"` among themselves (two cells when one value is 0 — the
  relation covers what is shown)
- footnote is the bottommost text, `within yFrac [0.88, 1]`, at most two
  measured lines
- page colour is `document.backgroundColor`, never a base tile (doctor
  `canvasFill`); the only accents are the marker, the chip and the rules
- splits stay small-basis (bands ~5, ticks 5, cells 3) — nothing near the
  5-smooth threshold

## Props (10 user props + 3 chrome; every optional one shows its default)

| name | type | default | what it changes | required |
|---|---|---|---|---|
| `rower` | string | `"Marcus Alder"` (invented) | header name, the header's bold line | no |
| `note` | string | `"the 2026 season's median 2k"` | second header line; `""` removes | no |
| `piece` | string | `"2,000 m"` | caption under the result figure | no |
| `split` | string | `"1:58.8"` | the hero figure AND the marker position; format `m:ss.t`, 1:00.0-9:59.9 | effectively yes (only `undefined` takes the default; `""` or a bad format fails fast) |
| `result` | string | `"7:55.0"` | the second figure — a time (`"3:36:47"`) or metres (`"7,096 m"`); `""` removes figure + caption | no |
| `spm` | number | `26` | SPM cell; 0 hides the cell | no |
| `watts` | number | `209` | WATTS cell; 0 hides the cell | no |
| `drag` | number | `110` | DRAG cell; 0 hides the cell | no |
| `percentile` | number | `50` | the chip, 1-99; 0 hides chip + cohort | no |
| `percentileCohort` | string | `"2026 rower ranking"` | the dim line under the chip; `""` hides it | no |
| `accent` | color `#rrggbb` | a water blue the build settles (e.g. `#1c6fb8`) | marker, chip, rules; readable ink over it via contrast | no |
| `preset` | `"dark" \| "light"` | `"dark"` | page and ink | no |
| `debugLayout` | boolean | `false` | dev-only: draws the contract | no |

Validation: `split` parsed to tenths (`1:58.8` -> 118.8s, marker at (split-60)/120,
clamped 0..1); `spm` 10-60, `watts` 20-600, `drag` 50-250, else fail fast with
the field named; `rower` <= 40 chars, `note`/`cohort` <= 48/40, `piece` <= 16,
`result` <= 14; text charset printable ASCII plus accented Latin
(U+00C0-U+017F), same set the swim card proved the bundled font draws.

## Beats

Still image. The scout floated a count-up-to-split clip and declined it ("not
the need"). If the critic demands motion, a variant may slide the marker in —
the contract above stays untouched.

## Defaults must show

With no inputs, a viewer sees the 2026 season's median 2k rower, from the
cited ranking page: a name, "the 2026 season's median 2k" note, a 50TH
PERCENTILE pill over "2026 rower ranking", the split 1:58.8 huge with /500m
under it, the result 7:55.0 captioned "2,000 m", a marker just left of the
2:00 tick on a labeled pace track, and 26 SPM / 209 W / 110 DRAG cells. Where
each number came from: time 7:55.0 and percentile 50 are the ranking page's
own 50th band (10,198 ranked rowers); split 1:58.8 is that time / 4; watts 209
is 2.8 / (pace s/m)^3; spm and drag are illustrative. The why-tutorial and the
caveats say which is which — the default card claims nothing false.

## Acceptance rubric (the critic scores against this)

1. **Split is the subject.** On 1080x1080, 1920x1080 and 1080x1920 the /500m
   split reads first (biggest figure, unit beside it), the result second, the
   cells third — the community's own hierarchy, not a generic scorepost.
2. **Every number is entered, none invented.** All figures come from props;
   the default's time/split/percentile match the cited 2026 ranking page and
   the illustrative bits (name, spm, drag) are flagged in the WHY. No PB claim
   is made by the template — the words on the card are the rower's.
3. **The pace track tells the truth.** The marker sits at (split-60s)/120s of
   the track (1:58.8 -> ~49%, just left of 2:00); ticks equal and labeled
   1:00-3:00; a clamped marker never changes the printed split.
4. **Text discipline at all seven canvases.** Every string fits (measured,
   floor-refused, never ellipsis), down to 480x270; ASCII (plus accented Latin
   in names); layout contract green at defaults and under the test's stressful
   copy — a 40-char name, a `"3:36:47"` result, a hidden percentile, a
   two-cell stat band.
5. **Determinism and honest chrome.** Two renders from the same props are
   identical; the footnote names what is entered and what the ranking depends
   on; the chip and its cohort line read as one sentence together.

## Variants worth trying (one idea each, same id and folder)

- **a. Monitor mirror** (layout): the PM5 result screen's own arrangement —
  result big center, split + spm as the pair beneath it, cells in a bottom
  row. The recognizability play for people who photograph that screen; same
  props, same contract, different hero.
- **b. Accent band** (palette/chrome): the stat band becomes an accent-filled
  strip with light cells (light preset inverts it), the chip drops its fill
  for an outlined pill — a poster-bolder read of the same numbers.
- **c. Ladder strip** (data — the risky one): the piece row replaced by the
  fixed benchmark ladder (500m…marathon, one row per benchmark, a pace bar
  each, today's piece highlighted) — the scout's second mode. A different prop
  shape (a list of times), so only if a and b read too samey.

Ship the base or variant a by default; c only if it builds as cleanly as the
single-piece card.

## Notes for the build (not part of the spec)

- Registry row (`src/sports/registry.ts`) description, one line: "An
  indoor-rowing PR card from a PM5 result: the /500m split as the hero figure
  on a 1:00-3:00 pace track, the piece's time or metres beside it, stroke
  rate, watts and drag as cells, and the season-ranking percentile chip the
  rower supplies." Tags after `sports, 2026-10-17, day-028`: `rowing, erg,
  concept2, split, pb, pm5, percentile`.
- Watts math for the WHY/footnote, if wanted: W = 2.8 / (seconds per metre)^3;
  1:58.8 -> 0.2376 s/m -> ~209 W.
- `npm run new -- sports/erg-pb-card --title "Erg PB Card"`, then keep the
  scaffold's shape: typed props, `bindProp` on prop-driven cells, fail-fast
  `render()` validation, `outputHints` with `format: { kind: "image",
  container: "png" }`, `withLayoutIntent(...)` with `debugLayout`.
- Mirror `swim-time-drop-card/v1` for the floors/fittings and the
  `placeInsetPieces` + `makeColorTile` chrome; the pace track's ticks are one
  size, emitted as real rects (never size-expr stubs).
