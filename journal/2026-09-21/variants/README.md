# The three variants, and what actually shipped

These folders are a **frozen record of the comparison**, not of the release.
Each one is the template exactly as it stood when its reader scored it - source,
three canvases, six tutorial pages, `report.json`. They are deliberately left
alone so the a-vs-b-vs-c experiment stays fair: variant a and variant b cannot
be judged against a variant c that later received fixes neither of them got.

- `a/` - the verdict as coloured words
- `b/` - a filled pill on every row
- `c/` - pills for the three claims, nothing behind the abstention

**The template that shipped is `c` plus the fixes the critique earned.** Nine
came from the scoring pass and six more from the adversarial attack that
followed; all fifteen are listed in `../40-critique.md`. They changed colours,
wording, the legend, number parsing and the verdict rule - none of them changed
the one idea any variant was testing.

So the stills here will NOT match the shipped picture, on purpose. The shipped
picture is:

    assets/templates/@one-a-day__dev__bench-delta__v1/preview.png

and the shipped source is `src/dev/bench-delta/v1/`. The most visible
differences from `c/stills/`: the legend now shows one candidate swatch per
verdict instead of a single green one; `no spread given` is drawn in a
recessive grey rather than a light one; a row measured on only one side now
reads `one side unmeasured` instead of earning a confident pill; and the
default card carries five rows instead of four, because a fifth state became
visible once that rule was fixed.

One reader was tripped by this, and its confusion is worth recording: it
rendered the template twice while another reader had copied `b/src/` over
`src/`, measured 10,585 differing pixels, and reported the template as
non-deterministic. It is not - three consecutive renders are byte-identical -
but the tree it measured really had changed underneath it. See
`../40-critique.md`, "The finding that was not real".
