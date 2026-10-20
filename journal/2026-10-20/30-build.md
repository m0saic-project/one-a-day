# Build — 2026-10-20

## Template: @one-a-day/community/geocache-milestone-card/v1

## Variant a — the baseline (four bands, left-aligned hero) · gate: clean · render: ok · stills: verified by contract, not by eye

The card the brief asked for. Header (GEOCACHING label, name in caps, "caching
since YYYY", accent rule), hero (the find count, the derived "1,000th find"
line, a square MILESTONE badge only when the count is one), a full-width
cache-type mix bar with a one-line legend, three equal FTF / avg D / avg T
tiles, and a footer. Landscape puts the header beside the hero; square and
portrait stack the four bands.

- The milestone is computed, never typed: `isMilestone(n)` follows Project-GC
  (1, 10, 50, 100; then hundreds to 1000, five-hundreds to 5000, thousands
  after) and `ordinal(n)` prints "1,000th" / "1,042nd". Unit-tested against the
  ladder in the brief.
- The mix is honest: recognized types refused by name (with a "did you mean"),
  top 5 by count render, the remainder draws as a grey Other so the bar always
  spans full width.
- Fail-fast: non-integer findCount, avgD/avgT outside 1-5, a misspelled type,
  a mix that sums past findCount, an unknown prop — each throws naming the field.

**I could not open the stills: this model does not take image input.** Instead I
checked every claim the header, description and WHY make against a
programmatic dump of the rendered document (labels, texts, colours, font sizes)
plus the layout contract. At 1080x1080 the default card is: "GEOCACHING",
"GEOHIKER55", "caching since 2015", find-count "1,000" in the accent green
(198px, the largest text), "1,000th find", a square #4a8f3c badge reading
"MILESTONE", the five coloured mix segments (Traditional/Mystery/Event/Multi/
Letterbox, in count order), legend "Trad 812 / Mystery 121 / Multi 38 / Event
20 / Letterbox 9", three equal tiles (24 / 2.3 / 1.8), and the footer. All
printable ASCII; every number well-formed; the accent colours the hero number,
badge and rule; the hero number outranks the name and every tile value at all
seven canvases.

## Variant b — night-cache preset · gate: clean · render: ok · stills: dark render at variants/b/renders/dark.png

Added a `preset` knob ("light" | "dark", default "light") with a navy page and
retuned ink/dim/tile/track — same layout, same accent, same geometry. The
default (light) render is byte-identical to variant a, so the variant's stills
are the light card; the dark card is at
`journal/2026-10-20/variants/b/renders/dark.png` (rendered with
`--props '{"preset":"dark"}'`). Reverted afterwards: the brief's baseline is
light paper, and the preset was a variant idea, not part of the 8-prop spec.

## Variant c — mix as rows · not built

The brief's "b — mix as rows" (vertical per-type rows instead of the stacked
bar) was left on the table: budget, and the baseline already clears the rubric.
No further variants.

## Why-tutorial: the problem page and the solution page

- Problem page: who = geocachers on the forums, Project-GC and their clubs;
  two paragraphs quoting Project-GC's milestone ladder and CacheSleuth's
  profile banner, and the YoGO club note "geohiker55 found his 1000th find
  yesterday"; the five scout sources listed.
- Solution page: one card per count from typed numbers; the decision that
  matters is that the milestone is computed, never typed, so the card cannot
  disagree with itself. Caveats: no GPX importer, top-5-only mix, hard-coded
  Project-GC ladder.

## What was hard (two or three lines an author would want tomorrow)

- The layout contract's `minWidthFrac 0.9` on the mix bar forces the page
  margin down to 0.045 of the short side (a 0.06 margin leaves only 88% width
  on square/portrait). Keep that coupling in mind before changing the margin.
- `#4a8f3c` on the cream paper is only ~3.6:1, below the 4.5:1 body-text bar;
  the hero number is large bold text, so the flip uses 3:1 (WCAG large text).
- `typeMix` is a json list, so it edits as a structured form, not a prop-bound
  rect; the bar track carries no binding (bindingsSound refuses a whole-list
  bind). And `formatCount` had to stay internal — the community pack already
  exports one from weekly-run-report.

## In place now: a
