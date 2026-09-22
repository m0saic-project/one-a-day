Build today's template from `{{DAY_DIR}}/20-brief.md`. This phase may be
called more than once; `{{DAY_DIR}}/30-build.md` and `state.json` tell you
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
   `node pipeline/render/render-variant.mjs @one-a-day/<pack>/<slug>/v1 {{DAY_DIR}}/variants/a`
   It builds, renders landscape/portrait/square, cuts stills, renders the
   why-tutorial (`renders/tutorial.mp4`, one still per page in
   `stills/tutorial-<n>.png` - six pages, the last is how the day was made),
   copies the source folder, and writes
   `report.json`. Exit 3 means an ERROR MOSAIC rendered — that variant is
   broken however green the build was. Look at the stills if you can view
   images; read `report.json` regardless.
   Run it as-is: never set `M0SAIC_ROOT` (a fresh root has no license or
   toolchain and every video render stalls), and always pass `-o` under
   `{{DAY_DIR}}/` when you call `m0saic make` yourself - a report with no
   `-o` lands as `out.validate.json` at the repo root.
   Read your own tutorial pages: a
   problem page that clips, or says less than the scout found, is a bug.
6. Variants: change ONE idea in place (the same id and folder), rebuild, render
   into `variants/b`, then `c`. At most {{VARIANTS_MAX}}. Each variant must
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

## Output — `{{DAY_DIR}}/30-build.md`

```
# Build — {{DATE}}

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
