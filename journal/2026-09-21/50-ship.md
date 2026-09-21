# Ship - 2026-09-21

## `@one-a-day/dev/bench-delta/v1` - Bench Delta

The before/after benchmark card, for the maintainers of libraries, compilers,
runtimes and dev tools who re-publish a performance claim every release. It
takes the rows their harness already prints - a name, a unit, the baseline
number, the candidate number, and the run-to-run `+/-` of each (numbers or the
strings a harness actually emits: `"3"`, `" 12 "`, `"+/- 4"`) - and draws the
comparison so that the geometry, not the caption, carries the claim: every
row's **baseline bar ends at the same x**, so the card has one vertical rule;
the **candidate bar is drawn relative to its own baseline**, so its length is
the speedup rather than the magnitude, and nanoseconds, megabytes and percent
sit on one card without the scale lying; and under the default
smaller-is-better a bar that **crosses the rule** is a regression, read as a
shape before a single label (with `smallerIsBetter: false` the geometry is
byte-identical and crossing is the win - the footer says which way the card is
scoring). The run-to-run range is a
second rectangle, and the verdict - `better`, `worse`, `within noise`, or no
verdict at all - comes from whether the two intervals **overlap**, never from
the ratio alone. **Both sides have to declare a spread**: a candidate run once
is not disjoint from anything, it is unmeasured, and it reads
`one side unmeasured` and earns no pill. An explicit `0` counts - that is a
claim, and a deterministic metric deserves its verdict. That refusal is the
reason this is not a bar chart with nicer colours, and the footer states the
test it ran so a reader can argue with it: *a verdict means the two +/- ranges
do not overlap*.

It is a still on purpose, and the browse card is the finished picture rather
than frame 0 of a reveal. Both decisions are argued from the evidence in
`10-scout.md`.

## Render it

```
m0saic make @one-a-day/dev/bench-delta/v1 --template-repo . -w 1600 -h 900 \
  --props @bench.json -o bench.png
```

`logs/example-bench.json` in this folder is a runnable `bench.json`. It was
produced by joining two real `github-action-benchmark` result files by name,
which is the whole integration:

```js
// two runs of the action's own JSON ({name, unit, value, range}) -> one card
const by = Object.fromEntries(base.map(r => [r.name, r]));
const rows = head.map(h => ({
  name: h.name, unit: h.unit,
  base: +by[h.name].value, baseRange: +by[h.name].range,
  value: +h.value,         range: +h.range,
}));
```

Props worth trying:

- `--props '{"preset":"light","accent":"#8250df"}'` - the other half of a
  README's light/dark picture pair.
- `--props '{"smallerIsBetter":false}'` - throughput instead of time. The
  verdicts invert; the geometry does not move.
- drop every `range` and `baseRange` - the card stops making claims entirely
  and says so once in the header: "no spreads given / this card cannot say if
  any change is real". Four of the eleven dialects `github-action-benchmark`
  supports (go, googlecpp, julia, jmh) emit exactly this.
- set `baseRange: 0, range: 0` on a deterministic metric (bytes on disk) - an
  explicit zero IS a measurement, and the row gets its verdict.
- `--props '{"debugLayout":true}'` - the layout contract drawn over the card.
- `-w 1080 -h 1920` from the same props - the story crop, same rows re-laid.

Why it exists (the tutorial):

```
m0saic make @one-a-day/dev/bench-delta/v1 --template-repo . --tutorial \
  -w 1280 -h 720 -o why.mp4
```

## Weak spots (honest; a human polish pass starts here)

- **The demand argument cuts both ways, and the journal says so.** The two
  strongest pieces of evidence - hyperfine's six plotting scripts, the CI
  benchmark action's 1.3k stars - prove the chore is real by showing it is
  *already tooled*. A skeptic reads the same facts as "solved, nobody is
  waiting for you". The bet is narrower than "no tool exists": every existing
  tool draws the number, and none of them draws the doubt.
- **Disjoint `+/-` intervals are not a significance test, and the error runs
  in both directions.** They are what the harness reported, drawn honestly.
  Non-overlapping error bars is a *stricter* test than significance, so two
  genuinely significant results can overlap and be called `within noise`; and
  `better` is not a p-value. This is the sharpest criticism the template
  received and it is not fixable without data the harnesses do not emit. The
  answer is to stop implying otherwise: the footer names the test it ran, and
  v2 should also carry what `range` MEANT (stddev? min/max? a CI?).
- **The card suppresses the ratio on a `within noise` row.** A release note
  often wants the number *and* the caveat ("1.04x, within noise"); the card
  gives only the caveat, on the grounds that quoting a ratio it just called
  noise is the overclaim it exists to prevent. Defensible, and still a real
  friction for the launch-post use case.
- **One catastrophic regression stops widening the scale at 3.2x.** Past that
  the bar clamps to the track and only the printed ratio stays exact. A 40x
  blow-up therefore looks like a 3.2x one. It is bounded and documented, but
  it is the one place where the picture is less precise than the number.
- **A benchmark name with a non-ASCII character is silently rewritten.**
  A name with an accented letter renders with a `?` in its place. The bundled glyph font draws
  anything outside ASCII as tofu, so the substitution is the safe move and it
  is what day 001 does too - but it happens with no warning anywhere, on a
  string the user supplied.
- **The abstention leans on three weak cues rather than one strong one** - a
  thinner bar, a recessive grey, and the absence of a pill. It reads correctly
  once you know the convention; a first-time viewer may just see a thin bar.
- **Eight rows is the cap, and fewer at small canvases.** The footer says how
  many were dropped, but a 20-benchmark suite needs two renders.
- **Self-reported numbers.** No runner `trace.json` for this run: the
  why-tutorial's timeline takes phase boundaries from file mtimes, exact token
  and tool-call totals from the harness for the two subagent workflows, and
  the agent's own count for the main loop. Dollars are omitted rather than
  guessed - the input/output split needed to price them was not measurable
  from inside the session.

## Follow-ups (what v2 would do)

- Carry the **meaning** of `range` as a prop (`rangeKind: "stddev" | "minmax"
  | "ci95"`) and print it in the footer, so the verdict's strength is legible.
- Accept the raw per-run arrays a harness already has (`runs: number[]`) and
  derive the interval, instead of asking for a pre-computed `+/-`.
- A `log` scale switch for suites that genuinely span orders of magnitude,
  with the switch named on the card - the honest version of the 3.2x clamp.
- A `highlight` prop for "this row is the headline", since the launch-post use
  case usually has one.
- A second output that is not a picture: the same verdicts as a sidecar JSON,
  so a CI job can fail the build on `worse` without parsing pixels.
