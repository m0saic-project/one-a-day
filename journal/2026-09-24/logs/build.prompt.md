# one-a-day — 2026-09-24 — phase: build

You are the coding agent running one phase of today's **one-a-day** run, in the
repo at `C:\src\m0saic-production\one-a-day`. Nobody is watching. Nobody can answer a question. You have
one job this call, stated under "Your task" below, and you finish it by writing
files. Then you stop.

## Files are your only memory

Every earlier phase today left its result in `journal/2026-09-24/`. Read what is
there before you do anything:

- `journal/2026-09-24/state.json` — the phase ledger. A phase is done when its key is
  `"done"`. The critique phase also writes `decision` (`ship` | `no-ship`) and
  `pick` (the variant letter).
- `journal/2026-09-24/run.json` — who is running (the runner fills `runner.*`), and
  `model.selfDeclared`, which YOU fill (below).
- `journal/2026-09-24/10-scout.md`, `20-brief.md`, `30-build.md`, `40-critique.md`,
  `50-ship.md` — the day's story, one file per phase.
- `journal/2026-09-24/variants/<a|b|c>/` — each built variant: `src/` (its code),
  `renders/`, `stills/`, `report.json`.

When your task is complete, set `state.json.build = "done"` (merge, do not
overwrite other keys) as the LAST thing you do. Never set it early: the runner
re-calls this phase until it sees that key, and a half-written output marked
done ships a half-written day.

## Declare yourself

The runner asked for `codex`. In your FIRST action this phase, write into
`journal/2026-09-24/run.json` the key `model.selfDeclared` with the model you believe
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
- Write scratch only under `journal/2026-09-24/` (renders, notes, experiments).
- If something is broken that you cannot fix inside this phase's scope, write what
  you found into this phase's output file and stop WITHOUT marking the phase done.
  A day that ships nothing is fine. A day that ships something wrong is not.

## Writing for the journal

The journal is public and is read by people and by tomorrow's agent. Short
sections, real links, numbers only when they change a decision, honest about
what is weak. Markdown, ASCII quotes, no marketing voice.

---

# Your task


Build today's template from `journal/2026-09-24/20-brief.md`. This phase may be
called more than once; `journal/2026-09-24/30-build.md` and `state.json` tell you
where you left off.

## The loop (from AGENTS.md — follow it exactly)

1. Scaffold once: `npm run new -- <pack>/<slug> --title "<Title>"` writes the
   template, its test, and the registry wiring, and passes every gate as
   generated. If `state.json.scaffolded` is already `true`, skip this.
   Then set `state.json.scaffolded = true`.
2. Edit `src/<pack>/<slug>/v1/<slug>.ts` — the header comment states the one
   idea; keep the shape (typed props with defaults, bound text, fitted copy,
   geometry from `ctx.target`). Edit the test beside it to assert what the
   brief claims.
   Declare the layout contract the brief promised: `tag` every source,
   build `constraints` (`textFitsMeasured` for copy you measured,
   `textFitsAll(labels, { charWidthEm: TEXT_EM.prose })` for `svgLabel` copy;
   `within` / `minWidthFrac` / `aspect` for the chrome), keep the
   `debugLayout` knob, return `withLayoutIntent(...)` — the scaffold shows
   the shape. The test's `sweepLayout` must pass for the copy that stresses
   it (long, empty, every closed-set value); the build sweeps the defaults.
   Fill `WHY` — the why-tutorial spec the scaffold pre-filled from the journal
   (`renderTutorial: whyTutorial(WHY, render)`, src/_shared/why.ts). Keep
   `day`, `date`, `agent`, `model` as written (they come from run.json and
   the gate cross-checks them). Write `who`, `problem` (1-3 paragraphs, in the
   evidence's own words — quote it), `sources` (only URLs you opened; the ones
   in `10-scout.md`), `solution` (what this template does about it, and the
   one design decision that matters), `usage.command` (the real one-liner at
   the hinted canvas), `usage.try` (up to 4), `caveats` (honest, up to 3).
   ASCII only; the build refuses a leftover `[fill me]`, a non-ASCII
   character, or a bad URL. Leave `timeline` as the scaffold copied it from
   `journal/<date>/trace.json` (the ship phase re-copies the finished one).
3. `npm run build` — the conventions gate runs here. On a failure read
   `node tools/check-registry.mjs --json`: every finding carries its `fix`.
   Loop until clean. `npm test` for the unit tests.
4. `npm run fingerprints:update` after a layout change (the sidecar
   `<slug>.layout.m0` is committed with the template).
5. Render and snapshot the variant:
   `node pipeline/render/render-variant.mjs @one-a-day/<pack>/<slug>/v1 journal/2026-09-24/variants/a`
   It builds, renders landscape/portrait/square, cuts stills, renders the
   why-tutorial (`renders/tutorial.mp4`, one still per page in
   `stills/tutorial-<n>.png` - six pages, the last is how the day was made),
   copies the source folder, and writes
   `report.json`. Exit 3 means an ERROR MOSAIC rendered — that variant is
   broken however green the build was. Look at the stills if you can view
   images; read `report.json` regardless.
   Run it as-is: never set `M0SAIC_ROOT` (a fresh root has no license or
   toolchain and every video render stalls), and always pass `-o` under
   `journal/2026-09-24/` when you call `m0saic make` yourself - a report with no
   `-o` lands as `out.validate.json` at the repo root.
   Read your own tutorial pages: a
   problem page that clips, or says less than the scout found, is a bug.
6. Variants: change ONE idea in place (the same id and folder), rebuild, render
   into `variants/b`, then `c`. At most 3. Each variant must
   pass the build gate on its own. Leave the one you like best in place last.

## Rules that bite here

- Rebuild before you render: the CLI loads `dist/`, not `src/`.
- `ctx.target`, never `ctx.output`. Never guess a `flattenedStableKey`.
- Splits above 12 must be 5-smooth (`weightedSplit(…, { precision: 120 })`).
- A layout-contract violation (`node tools/check-layout.mjs --json`) is a
  design decision: shrink, compact the wording, drop the row. Never widen the
  ruler to make it pass.
- Validate any hand-written m0 with `validateM0String`.
- ASCII in rendered copy; blank lines are not spacing.
- Only ONE new folder under `src/` today. Do not touch any other template.

## Output — `journal/2026-09-24/30-build.md`

```
# Build — 2026-09-24

## Template: @one-a-day/<pack>/<slug>/v1
## Variant a — <the one idea> · gate: clean/warnings · render: ok/degraded · stills: what they show
## Variant b — …
## Why-tutorial: the problem page and the solution page, one line each on what they say
## What was hard (two or three lines an author would want tomorrow)
## In place now: <variant letter>
```

Set `state.json.variants` to the list of letters built, `state.json.inPlace`
to the letter left in `src/`, and finally `build: "done"`. If you could not get
ANY variant through the gate, write why in `30-build.md`, set
`state.json.decision = "no-ship"` and `noShipReason`, and set `build: "done"`.
