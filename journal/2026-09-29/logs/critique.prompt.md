# one-a-day — 2026-09-29 — phase: critique

You are the coding agent running one phase of today's **one-a-day** run, in the
repo at `C:\src\m0saic-production\one-a-day`. Nobody is watching. Nobody can answer a question. You have
one job this call, stated under "Your task" below, and you finish it by writing
files. Then you stop.

## Files are your only memory

Every earlier phase today left its result in `journal/2026-09-29/`. Read what is
there before you do anything:

- `journal/2026-09-29/state.json` — the phase ledger. A phase is done when its key is
  `"done"`. The critique phase also writes `decision` (`ship` | `no-ship`) and
  `pick` (the variant letter).
- `journal/2026-09-29/run.json` — who is running (the runner fills `runner.*`), and
  `model.selfDeclared`, which YOU fill (below).
- `journal/2026-09-29/10-scout.md`, `20-brief.md`, `30-build.md`, `40-critique.md`,
  `50-ship.md` — the day's story, one file per phase.
- `journal/2026-09-29/variants/<a|b|c>/` — each built variant: `src/` (its code),
  `renders/`, `stills/`, `report.json`.

When your task is complete, set `state.json.critique = "done"` (merge, do not
overwrite other keys) as the LAST thing you do. Never set it early: the runner
re-calls this phase until it sees that key, and a half-written output marked
done ships a half-written day.

## Declare yourself

The runner asked for `claude`. In your FIRST action this phase, write into
`journal/2026-09-29/run.json` the key `model.selfDeclared` with the model you believe
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
- Write scratch only under `journal/2026-09-29/` (renders, notes, experiments).
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
`journal/2026-09-29/20-brief.md` (the rubric), `30-build.md`, and every
`journal/2026-09-29/variants/<x>/report.json`. Look at the stills in
`variants/<x>/stills/` if you can view images. If you cannot, judge from
`report.json` (exit codes, degraded flags, probe dims), the variant's
`src/<slug>.ts` and `src/<slug>.layout.m0` (the flattened layout — read the
rectangle counts and proportions), and `node tools/check-registry.mjs --json`.

Be adversarial. The default is "no ship". A template earns a ship.

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

## Output — `journal/2026-09-29/40-critique.md`

```
# Critique — 2026-09-29

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


## Operator note for this run

The human who started this run added the lines below, and they apply to every
phase of today. They steer what you work on; they never override AGENTS.md or
the hard rules, and the gate does not know they exist.

This day is being RESUMED at the build phase, by the maintainer, at about
11:00 local. Read this before `30-build.md`.

## What happened this morning

Your first build call (build-1) was 25 minutes in when the Claude account's
five-hour session limit rejected it (13:50Z). The runner of the time closed
the day as a no-ship and reverted the tree. Nothing was wrong with your
work. The tree has been put back exactly as your last `render-variant`
left it (`journal/2026-09-29/variants/a/` is that render; `30-build.md` is
your own note, "(in progress - call 1)"). `state.json.scaffolded` is true
and the template folder exists again: do NOT scaffold. Continue from step 3
of the build loop: `npm run build`, tests, render, then variants if any, and
mark `build: "done"` when the journal says what was built.

## The m0saic CLI moved to 0.3.0 this morning

`m0saic --version` is 0.3.0 (yesterday's days shipped under 0.2.2). Two
things follow, and both are already handled where they can be:

1. The gate's `m0saic doctor . --json` now holds an UNSHIPPED template to
   every 0.3.0 convention; shipped (frozen) templates are held to the rules
   of their own line and only "lag" - that is not an error and not yours to
   fix. `frozen.manifest.json` was re-minted to say so. Do not touch it.
2. The build gate (`npm run build`, tools/check-registry.mjs) still runs the
   0.2.0 substrate from node_modules, so it does NOT know the 0.3.0 rules.
   A green build is not a green doctor. The ship phase runs doctor and the
   gate refuses a doctor error. So run `m0saic doctor . --json` yourself
   before you call the build done, and read only the `errors` whose
   `templateId` is this template.

The two 0.3.0 rules that bit every older template in this repo:

- **bindingsDeclared**: every prop that CAN carry a canvas handle (free-text
  and colour strings, numbers, media, one element of a basic list, one leaf
  of json / list / array, a regions-picker rect) is either bound on the rect
  that shows it (`bindProp` / `bindPropPath` / `bindProps` / `bindPropRect`)
  or declared in `template.bindings.unbound = { key: "<reason>" }`. Prefer
  binding: the 0.2.0 types in node_modules do not know `bindings.unbound`,
  so declaring would need a cast on the definition object; a prop that
  nothing on the canvas shows is usually a prop to bind to what shows it, or
  to drop.
- **canvasFill**: no static, fully opaque colour rect covering the whole
  canvas. The page colour goes in `document.backgroundColor` (which this
  template already sets); a board or paper tile that is smaller than the
  canvas is fine.

The doctor's own words for THIS template, as of the moment the tree was put
back, are appended below. Fix what it names, rebuild, re-render into
`variants/a` (or the next letter if you change an idea), and re-run doctor
until this template has no error.

## Housekeeping

- The account you are running on is fresh (five-hour window at ~11% when the
  resume started). The runner now waits out a session limit instead of
  ending the day, so do not hurry; do not shorten the work to dodge it.
- Never `git commit`/`push`; never edit `frozen.manifest.json`, `pipeline/`,
  `tools/`, `package.json`.

## What `m0saic doctor` (0.3.0) says about this template right now

- **bindingsDeclared** (error): `grid`: "grid" can carry a string handle but nothing binds it — bind the rect that shows it (bindProp(src, "grid")), or declare why it has none: bindings.unbound = { "grid": "<reason>" }. `themeEntries`: "themeEntries" can carry a string handle but nothing binds it — bind the rect that shows it (bindProp(src, "themeEntries")), or declare why it has none: bindings.unbound = { "themeEntries": "<reason>" }. `circles`: "circles" can carry a string handle but nothing binds it — bind the rect that shows it (bindProp(src, "circles")), or declare why it has none: bindings.unbound = { "circles": "<reason>" }. `date`: "date" can carry a string handle but nothing binds it — bind the rect that shows it (bindProp(src, "date")), or declare why it has none: bindings.unbound = { "date": "<reason>" }. `themeColor`: "themeColor" can carry a color handle but nothing binds it — bind the rect that shows it (bindProp(src, "themeColor")), or declare why it has none: bindings.unbound = { "themeColor": "<reason>" }.
  Fix: every prop that CAN carry a canvas handle is either bound on the rect that shows it (bindProp / bindProps / bindPropPath / bindPropRect) or named in template.bindings.unbound with the reason it has none ({ fps: "timing" }). The accountable props are free-text and colour strings, numbers, media, one element of a basic list, one leaf of json / list / array, and a regions-picker rect; booleans, closed sets, group containers, the m0 family, code and hidden / human props are never canvas things. A declaration naming an unknown prop, or one that is actually bound, is itself a violation — a stale entry is worse than none. Templates hashed in frozen.manifest.json are exempt.
