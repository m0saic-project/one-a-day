# one-a-day — 2026-10-02 — phase: critique

You are the coding agent running one phase of today's **one-a-day** run, in the
repo at `C:\src\m0saic-production\one-a-day`. Nobody is watching. Nobody can answer a question. You have
one job this call, stated under "Your task" below, and you finish it by writing
files. Then you stop.

## Files are your only memory

Every earlier phase today left its result in `journal/2026-10-02/`. Read what is
there before you do anything:

- `journal/2026-10-02/state.json` — the phase ledger. A phase is done when its key is
  `"done"`. The critique phase also writes `decision` (`ship` | `no-ship`) and
  `pick` (the variant letter).
- `journal/2026-10-02/run.json` — who is running (the runner fills `runner.*`), and
  `model.selfDeclared`, which YOU fill (below).
- `journal/2026-10-02/10-scout.md`, `20-brief.md`, `30-build.md`, `40-critique.md`,
  `50-ship.md` — the day's story, one file per phase.
- `journal/2026-10-02/variants/<a|b|c>/` — each built variant: `src/` (its code),
  `renders/`, `stills/`, `report.json`.

When your task is complete, set `state.json.critique = "done"` (merge, do not
overwrite other keys) as the LAST thing you do. Never set it early: the runner
re-calls this phase until it sees that key, and a half-written output marked
done ships a half-written day.

## Declare yourself

The runner asked for `claude`. In your FIRST action this phase, write into
`journal/2026-10-02/run.json` the key `model.selfDeclared` with the model you believe
you are (e.g. `claude-fable-5.1`, `gpt-5-codex`, `kimi-k2`), merged into the
existing JSON (keep every other key). If you cannot tell, write `"unknown"`. A
human may later set `model.corrected`; never touch that key.

## Read before you write

`AGENTS.md` at the repo root is the contract for this repo: the loop, the
checklist, the rules that fail silently. The reasoning behind it is in
`node_modules/@m0saic/knowledge/README.md` (start there, then `docs/m0saic-thesis.md`,
then `docs/README.md`, the router). For template work the pages that matter most are
`docs/templates/philosophy-and-contract.md`, `docs/templates/construction-strategy.md`,
`docs/templates/standalone-pack-authoring.md`,
`docs/handbook/feasibility-precision-quantization.md` and `docs/runtime/cli-usage.md`.

## Hard rules (the runner enforces every one of them after you; break one and the day is discarded)

- Never `git commit`, `git push`, `git checkout`, `git reset`, `git tag`, `npm publish`.
  The runner commits exactly once at the end of the day and pushes.
- Never edit `pipeline/`, `tools/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `.github/`,
  `package.json`, `dep-allowlist.json`, `frozen.manifest.json`, or any other day's
  `journal/` folder. Never run `check-freeze --update`.
- Never modify a template folder that already exists at HEAD (`src/<pack>/<slug>/vN/`
  that is not today's). Shipped templates are frozen; a fix is a new `vN+1`.
- Today produces AT MOST ONE new template folder under `src/`. Variants share its
  id and folder; the last variant left in place is what the critic judges last.
- No new dependencies. No downloaded media into the repo. No secrets, no wall-clock
  reads, no `Math.random` in template code.
- Write scratch only under `journal/2026-10-02/` (renders, notes, experiments).
- If something is broken that you cannot fix inside this phase's scope, write what
  you found into this phase's output file and stop WITHOUT marking the phase done.
  A day that ships nothing is fine. A day that ships something wrong is not.

## Writing for the journal

The journal is public and is read by people and by tomorrow's agent. Short
sections, real links, numbers only when they change a decision, honest about
what is weak. Markdown, ASCII quotes, no marketing voice.

---

# Your task


Judge today's variants. You are the critic: you do NOT edit code. Read
`journal/2026-10-02/20-brief.md` (the rubric), `30-build.md`, and every
`journal/2026-10-02/variants/<x>/report.json`. Look at the stills in
`variants/<x>/stills/` if you can view images. If you cannot, judge from
`report.json` (exit codes, degraded flags, probe dims), the variant's
`src/<slug>.ts` and `src/<slug>.layout.m0` (the flattened layout — read the
rectangle counts and proportions), and `node tools/check-registry.mjs --json`.

Be adversarial. The default is "no ship". A template earns a ship.

Read every still the way a stranger would, string by string, before you score
anything. A number that is malformed (`2:030.123` for a lap time), a sign
that is missing, a unit nothing explains, defaults that contradict what the
brief's "Defaults must show" promised: each is a defect on line 2 or line 8,
and none of them is in `report.json`. Day 013's first critique found the
missing bars and passed the malformed times beside them.

A no-ship is not the end of the day: the build phase is called again with
your verdict in hand, and you (a fresh call) judge the result. So "what each
variant gets wrong" is the builder's worklist — name every defect you found,
specifically, not only the worst one.

## Score each variant, 0–2 on each line

1. Renders at defaults, every canvas, no error mosaic (exit 0 everywhere; a 3 anywhere is fatal)
2. The defaults SHOW the use case — a stranger sees what it is for
3. Text fits and reads at portrait and square, not only landscape
4. Layout is honest rectangles: proportions hold across aspects, nothing overlaps or collapses; the
   layout contract promises what the brief said (read `layoutContract()` in `src/<slug>.ts`: text fits,
   the bands the design depends on - not a ruler widened until it passes)
5. Props are the few that matter, typed, with sane defaults; a user could actually feed it
6. Would a person in the scouted community use this instead of what they do now?
7. Code quality against AGENTS.md: deterministic, `ctx.target`, bound text, fitted copy, ASCII
8. The brief was honest — the variant does what `20-brief.md` promised
9. The why-tutorial tells the truth — `stills/tutorial-2.png` (the problem)
   cites what `10-scout.md` found, in the evidence's words, with its sources;
   `stills/tutorial-3.png` (the solution) describes what THIS variant does,
   not what the brief hoped; `tutorial-5.png` is the template at its defaults;
   `tutorial-6.png` (how it was made) shows the phases that actually ran

Fatal regardless of score: a degraded render, a test that only passes because
it asserts nothing, a prop with no default, a pack or slug that misrepresents
what it is, a why-tutorial whose problem page names sources the scout never
opened or whose solution page claims a feature the variant does not have.

## Output — `journal/2026-10-02/40-critique.md`

```
# Critique — 2026-10-02

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
## What each variant gets right / wrong (three lines each, specific: which still, which prop)
## Decision: SHIP <letter> | NO SHIP
## If ship: what a human polish pass should look at first
## If no ship: the one thing that would have changed the verdict
```

Then set `state.json.decision` to `"ship"` or `"no-ship"`, `state.json.pick` to
the letter (or null), `noShipReason` when no-ship (one line), and finally
`critique: "done"`.


---

# This is a second look — revision round 1

An earlier critique today said NO SHIP: `journal/2026-10-02/40-critique.r1.md` (earlier
rounds, if there were any, are beside it as `40-critique.r<n>.md`). The build
phase was called again to answer it. `journal/2026-10-02/30-build.md` says what it
changed under "Revision 1", and the revised variant is the last
letter in `state.json.variants` (it is also `inPlace`).

- Judge the revised variant from ITS OWN stills, report and source — all nine
  lines, fresh. Variants an earlier round already scored keep their row in
  the table with the old numbers and "(round <n>)" in the last column; do not
  score them again.
- Check each thing the earlier verdict named against the new stills. A fix
  that `30-build.md` claims and the stills do not show is fatal, like any
  other false claim.
- Then look for what the earlier verdict missed. The first verdict is not a
  checklist the builder completed: a revision that fixes the named defect and
  carries another one is still a no-ship.
- The bar does not move: not lower because the day has been long, not higher
  because the template was rejected once.

Write `journal/2026-10-02/40-critique.md` anew, in the shape above, with one more
line directly under the decision:

```
## Revision 1: what the earlier verdict asked for, and whether it is there
```

Then `state.json` exactly as above: `decision`, `pick`, `noShipReason` when
no-ship, and finally `critique: "done"`.


## Operator note for this run

The human who started this run added the lines below, and they apply to every
phase of today. They steer what you work on; they never override AGENTS.md or
the hard rules, and the gate does not know they exist.

This day was closed as a no-ship at 09:22 (commit 51fcb01) and is being taken
up again the same afternoon with `--from revise`: the runner of this morning
treated the critic's NO SHIP as the end of the day; since the maintain commit
of 2026-10-02 it is a review the build answers. The tree was put back from
`journal/2026-10-02/rejected/tree.patch` (made after the fact by
`logs/restore-tree.mjs`). The template has no `<slug>.layout.m0` yet: this
morning's build never ran `npm run fingerprints:update`.

A person read this morning's stills and source after the run. What follows is
what they saw that the first verdict (`40-critique.r1.md`) did not name. It is
for the build to fix and for the critic to check in the new stills - all of
it, alongside the missing bars.

1. **Every time is printed with an extra zero.** The stills say `7:045.123`,
   `S1: 2:030.123`, `PB 2:029.456`. `formatTime` pads the seconds to 7
   characters; `SS.sss` is 6. A lap time is `M:SS.sss`.
2. **A faster sector loses its sign.** `formatDelta` prints `+0.667s` for a
   slower sector and `0.667s` for a faster one. The brief writes `-0.667s`.
3. **The defaults tell the opposite story to the brief.** "Defaults must
   show" asks for an improvement run: sectors 1 and 2 faster than PB (green),
   sector 3 slightly slower (red). The defaults render three red sectors and
   a lap 2.667 s slower than PB, because the brief's own prop table
   contradicts its own paragraph. Resolve it in favour of the paragraph, with
   numbers that add up: the three sector times sum to the lap time, the three
   sector PBs sum to the PB, the sector deltas sum to the lap delta. For
   example, a GT3 lap of the Nurburgring GP circuit: lap `1:54.812`, PB
   `1:55.420` (-0.608); S1 `35.104` vs `35.512` (-0.408), S2 `41.236` vs
   `41.561` (-0.325), S3 `38.472` vs `38.347` (+0.125). Say in `30-build.md`
   that the brief's table was overridden and why.
4. **Bad input renders `NaN`.** `parseTimeToMs("abc")` returns NaN and the
   card prints it. The brief's rubric line 5 asks for a validation error:
   every time prop must match `M:SS.sss` or `SS.sss` (seconds below 60) or
   `render()` throws, naming the prop. The six sector props are not even
   type-checked today.
5. **The test asserts almost nothing the brief claims.** It counts sources
   and sweeps the layout. Assert the arithmetic (a known input gives a known
   delta string, sign included), the time format round trip, the validation
   error, and the bars: the larger |delta| has the wider bar, a faster sector
   is green and a slower one red.
6. **The bars.** One per sector row, under or beside the row's text, in the
   empty two thirds of each row band: a dim full-width track and a filled
   part whose width is proportional to |delta| against the largest |delta|
   on the card (so the longest bar fills the track and never leaves it),
   green when faster, red when slower. Solid rectangles are ordinary sources:
   `src/dev/bench-delta/v1/bench-delta.ts` draws its bars that way (its
   `fill(...)` helper near the end of `render`). Tag the bars and put them in
   the layout contract (present, inside their row's band). At 480x270 a bar
   must still be a visible bar: give it a minimum height in pixels.
7. **The footer is centred.** The brief says driver left-aligned, top speed
   right-aligned.
8. **Words follow the picture.** The header comment, the `description` (in
   the template AND in the row in `src/sports/registry.ts`) and
   `WHY.solution` describe what the revised stills show, nothing else.

For the critic: `tutorial-5.png` and the three canvases are where 1, 2, 3, 6
and 7 show or do not show; 4 and 5 are in `src/` of the revised variant.
