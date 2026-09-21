# Critique - 2026-09-21

Three variants were scored independently, one adversarial reader each, against
the nine-line rubric in `20-brief.md`. Each reader opened the stills, read the
snapshotted source, ran the gates itself and measured pixels rather than
judging from the write-up. A second wave then attacked the template in place:
make it lie, make it clip, break its platform contract, and refuse to adopt it
as a practitioner.

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a - coloured words | 2 | 2 | 1 | 2 | 2 | 2 | 2 | 1 | 1 | **15** | none |
| b - a pill on every row | 2 | 1 | 1 | 2 | 2 | 2 | 2 | 1 | 1 | **14** | none |
| c - pills, nothing behind the abstention | 2 | 1 | 1 | 2 | 2 | 2 | 1 | 1 | 1 | **13** | none |

**The totals are not comparable, and reading them as a ranking would be the
wrong lesson.** No reader saw another's findings, and every point any of them
deducted below line 4 turned out to be a defect of the SHARED body - present
identically in all three - rather than of the variant it was charged to. c
scored lowest because its reader dug hardest and found the most. The honest
summary is one column, not three:

| defect found | in which variants | real? |
|---|---|---|
| the legend mis-teaches the colour encoding | a, b, c | **yes - fixed** |
| `range` arrives as a STRING from the real tool | a, b, c | **yes - fixed** |
| the animation decision ships one of its two citations | a, b, c | **yes - fixed** |
| pill ink fails contrast (white on mid-green, 2.5:1) | b, c | **yes - fixed** |
| the ladder's last rung is an ellipsis | a, b, c | partly - a rung added |
| the no-spread row's two greys are hard to separate | c | **yes - fixed** |
| portrait gaps are 1.57x the content | a, b, c | **yes - fixed** |
| the render is not reproducible | c | **no - see below** |

## What each variant got right and wrong

**a - the verdict as coloured words.** Right: the highest total, and the only
variant whose verdict column never competes with the bars for attention.
Wrong: its reader's own line-2 note is the case against it - the verdict is
20px of coloured type, and the browse card is that type scaled into a grid
thumbnail. It also carries every shared defect above.

**b - a filled pill on every row.** Right: the pill survives the thumbnail,
which is what it was built to test. Wrong, and decisively: "the pill on the
abstention inverts the template's stated opinion. Measured pill widths: 222 /
220 / 222 px for better, noise and worse - and **275px for 'no spread
given'**. The row that refuses to make a claim gets the largest, palest badge
on the card." Its reader also caught that the brief specified a ratio-width
pill and a verdict-tinted row, and b built neither - a real process finding:
the variant did not run the experiment the brief asked for.

**c - pills for the three claims, nothing behind the fourth.** Right: it is
the only variant where the visual hierarchy and the semantics agree; the pill
is the claim, so the row that makes no claim gets none. Wrong: its reader
found three genuine bugs nobody else did, and all three are now fixed.

## The finding that was not real

c's reader reported: "the render is not reproducible at the template's own
hinted canvas. Same one-liner, same props, 1600x900, preset light, twice:
10,585 pixels differ ... the difference is a filled pill with white centred
text behind 'no spread given'."

The observation was true and the diagnosis was not. The difference it measured
is exactly variant b's pill against variant c's absence of one - because
**another reader had copied `journal/2026-09-21/variants/b/src/bench-delta.ts`
over `src/` to render variant b, and did not put it back.** The working tree
changed between that reader's two renders. Re-checked against a stable tree,
three consecutive renders at 1600x900 preset light and two at 1920x1080
defaults are byte-identical (`md5sum`).

Two lessons, both for `pipeline/`:

- **A critique phase must be read-only.** The prompt for these readers said not
  to edit `src/`; one copied a file over it anyway to get a render. The daily
  gate's scope guard would catch this at commit time, but by then the critique
  has already judged a tree nobody intended. A critic that needs to render a
  losing variant needs a scratch copy of the repo, not the repo.
- **The fingerprint sidecar is what caught it.** The swap left variant b's
  source against variant c's committed `.layout.m0`, so the very next
  `npm run build` failed with a layout diff. That is the tripwire working
  exactly as designed.

## Decision: SHIP c

With the following fixes applied before shipping. All of them come from the
critique; none of them changes the one idea.

1. **The legend now teaches the encoding it uses.** The candidate bars are
   coloured by verdict, so a single green swatch beside "v1.5" stated a rule
   the picture does not follow - three of the four default rows are not green.
   The candidate entry now carries one swatch per verdict present on the card,
   in spectrum order, and reads "v1.5 - by verdict" when there is more than one.
2. **Numeric strings are accepted.** `github-action-benchmark` declares `range`
   a string and its own canonical example ships `"range": "3"`; in the wild it
   carries the sign. `toNum` takes `3`, `"3"`, `" 12 "`, `"+/- 4"` and
   `"1,024"`, and a card built from string-typed rows now renders identically
   to the numeric one (asserted).
3. **Pill ink is chosen by measured contrast**, not a luminance cutoff. The old
   rule put white on mid-green at 2.5:1; every fill the template can paint now
   clears 4.5:1 against its chosen ink (asserted for seven fills).
4. **Both animation citations ship on the page a viewer reads**, and the source
   order was changed so the six the tutorial prints are the verified ones - the
   llvm-ld issue the scout's own verification pass demoted now sorts last.
5. **A rung was added above the ellipsis.** The label column widens (0.28 ->
   0.36 of the content width) when a name would otherwise lose words. The
   ladder is now shrink, wrap, widen the column, drop lines, and only then
   ellipsize - and the ellipsis is reached only at 480x270, where the box holds
   one line of 7px type and the alternative is dropping the row.
6. **The clamp is disclosed.** A bar past 3.2x is cut to the track; the footer
   now says so and says the printed ratio is exact. It used to be silent.
7. **`unknown` recedes instead of competing.** It was a grey lighter than the
   baseline and close to the interval tint; it is now clearly darker (light
   preset: clearly lighter), and it is still the only bar drawn thinner.
8. **Portrait spacing.** The pitch is capped and the block is centred, so a
   tall canvas gets margins instead of 236px gaps between 150px rows.
9. **Two bindings were removed.** `rows[i].value` was bound to a cell that
   renders `412 -> 171 ms`, and `baselineLabel` to one that renders
   `v1.4 baseline`. Make edits a binding in place, so both would have written
   the wrong string. Only cells that show the prop itself are bound now.

## The attack round, and the hole it found

After the scoring, four readers were told to break the template rather than
rate it: make the rectangles say something the numbers do not, make the text
clip, break the platform contract, and refuse to adopt it as a practitioner who
publishes benchmarks. Two of them returned **NOT SHIPPABLE**, and they were
right about the same thing.

**The hole.** `verdictOf` treated a MISSING `range` as an exact point interval.
So a candidate measured exactly once - no spread at all - was trivially
"disjoint" from a baseline that had been measured ten times, and earned a
confident, full-strength `2.00x better` pill. Verbatim: *"the exact claim the
template exists to refuse."* The template's whole stance is that it will not
call a change real without variance, and it was doing precisely that whenever
the silence was on one side. The unit test had even pinned the bug as intended
behaviour ("One side alone is enough to decide: the other is read as exact").

The rule is now: **both sides declare a spread, or there is no verdict.** An
explicit `0` still counts - that is a claim, and a deterministic metric like
bytes-on-disk deserves its verdict - but an absent field is silence, and
silence is not a measurement. A half-measured row reads `one side unmeasured`
and gets the thin bar and no pill. The default card gained a fifth row to show
it: `resolve imports`, a 1.42x gap that earns nothing.

Six more fixes came out of the same round:

- **An over-wide interval escaped the track** and, clamped, drew two intervals
  that are disjoint by 5.5x as *touching* - the picture contradicting its own
  pill. Intervals are now clamped in x as well as width, and the contract
  gained `iv-base` / `iv-cand`, which it had never constrained: the two
  rectangles the verdict is derived from were the only drawn elements
  `debugLayout` and the build sweep could never check.
- **The minimum-bar floor distorted a ratio by up to +5495%** and said nothing,
  while the top-end clamp was disclosed. The disclosure is now symmetric: one
  footer sentence counts every row that is no longer to scale, at either end.
- **A sub-pixel interval drew as a 2px block anchored left of its value**, both
  reading as nothing and biasing the mark. It is now a caliper centred on the
  value, so a tight-but-real measurement reads as "measured, and tight".
- **The header summary counted only the drawn rows.** With 32 rows it said
  "2 better" while 10 were. A verdict is a property of the measurement, not of
  whether there was room to draw it; the summary now counts every row and the
  footer says how many were drawn.
- **`range: 0` was thrown away by `render()`** before the layout ever saw it,
  so a perfectly stable measurement was accused of reporting no variance.
- **Four of the eleven tool dialects `github-action-benchmark` supports emit no
  `range` at all** (go, googlecpp, julia, jmh), which made the card a wall of
  identical grey rows each repeating "no spread given". It now says it once, as
  the headline it actually is: *"no spreads given / this card cannot say if any
  change is real."*

Four more came from the two attacks that ran longest, and one of them was the
most valuable finding of the day:

- **The card was one row away from silently tofuing its own glyphs.** The
  engine warned `OVERLAY_CHAIN_DEEP: 22 deep (threshold 20)` at the defaults
  and **27 at five rows** - past the ~25 where ffmpeg silently degrades inline
  masks, and every glyph on this card is an inline mask. The cause was the lane
  wash: a full-track rect under every bar and interval keeps the tiles off the
  engine's grid sheet, so each becomes another overlay. It was also the only
  rect on the card that carried no data. Removing it cleared the warning at
  every row count from 1 to 8, and the card reads better without it - the
  baseline bar above each candidate already IS the full-length reference the
  wash was drawing.
- **The footer threw away its own disclosures first.** It was one long
  sentence, ellipsized to fit, and the clauses appended last - "showing 7 of 10
  rows", "1 row not to scale" - were the first characters cut, at exactly the
  canvas where rows get dropped. It is now an ordered list of clauses that
  drops WHOLE clauses, lowest value first: the direction, then the two
  disclosures, then the method, then the explanation. At 480x270 the
  explanation goes and both disclosures survive.
- **The values line could truncate the measurement.** `123456789 -> 98765432
  nanoseconds` was cut tail-first, so the card could print a candidate number
  that was not the number measured. The unit is now dropped before any digit.
- **The legend walked past the content margin** with long run labels. It now
  has a width budget: shrink the legend type, then drop the most explanatory
  entry.
- **The manifest advertised three tags while the template declared nine.** The
  browse metadata comes from `src/<pack>/registry.ts`, not from the template
  file - so editing `tags` and `description` on the template alone left the
  template unfindable by `benchmark`, `regression` or `variance`. Worth knowing
  before tomorrow: they are two places, and only one of them is the one hosts
  read.

**The criticism that stands, unfixed.** A practitioner reader's core objection
is not a bug: *non-overlapping error bars is a stricter test than significance*,
so two genuinely significant results can overlap and be called noise. That is
true, and the template cannot fix it without asking for data the harnesses do
not emit. The response is to stop implying otherwise: the footer now states the
test it actually ran - "a verdict means the two +/- ranges do not overlap" - and
the caveat says the same. A card that names its own method can be argued with;
one that just prints a verdict cannot.

## What a human polish pass should look at first

- **The abstention still relies on convention.** `no spread given` is carried
  by a thinner bar, a recessive grey and the absence of a pill. That is three
  weak cues where one strong one would do. A hatch, an outline-only bar, or the
  word `?` on the track would all be louder.
- **Portrait still has generous empty space** above and below the block. Capped
  pitch plus centring is the least-bad option here, but a designer may prefer
  to grow the label column and the type instead of the margins.
- **Two greys do a lot of work** - the baseline bar and the interval tint. On
  the light preset the interval is a darkened stripe and on dark a lightened
  one; neither has been checked against a colour-blind palette.
- **The 3.2x scale cap is a number with no evidence behind it.** It was chosen
  so one runaway row cannot flatten the card. A real corpus of benchmark suites
  would pick it better, or replace it with the log switch in the follow-ups.
