# AGENTS.md

Entry point for the coding agent that runs this repo. Humans want
[`README.md`](README.md). The daily pipeline that calls you is described in
[`pipeline/README.md`](pipeline/README.md); the prompt you were handed tells
you which phase you are in.

## What this repo is

**One m0saic template a day, written by an AI agent, built in public.** Every
day a fresh agent run scouts the web for a media workflow that needs support,
plans a media solution, builds one template (variants allowed), critiques it,
and ships the one that clears the gate. `journal/YYYY-MM-DD/` is the record of
each day; `src/` is the shelf of templates; `dist/` + `template-manifest.json`
are what Mosaic Desktop and the m0saic CLI load.

This is a **third-party** template repo: the namespace is `@one-a-day`, it is
not signed, and hosts show it as `3P`. Nobody reviews a day before it ships
except the gate. That is the point, and it is why the rules below are hard.

The agent that runs today may be Claude, Codex, Kimi or another CLI. Nothing
here assumes which. Your model name goes into `journal/<date>/run.json` as
`model.selfDeclared`; a human may correct it later.

## Before you write a template: the knowledge base and the examples

The reasoning behind every rule here lives in **`@m0saic/knowledge`** — the m0
handbook, the engine mental models, the template-authoring contract, as plain
Markdown. After `npm install` it is at `node_modules/@m0saic/knowledge/README.md`
(start there, then `docs/m0saic-thesis.md`, then the router `docs/README.md`);
on GitHub at [m0saic-packages/packages/knowledge](https://github.com/m0saic-project/m0saic-packages/tree/main/packages/knowledge).
The pages that pay for themselves on a template day:

- `docs/templates/philosophy-and-contract.md` — what a template is and promises
- `docs/templates/construction-strategy.md` — how to build the layout
- `docs/templates/standalone-pack-authoring.md` — the authoring loop in a repo like this
- `docs/handbook/feasibility-precision-quantization.md` — before any geometry
- `docs/runtime/cli-usage.md` — the CLI, its exit codes, `--validate-only`

Then read code. Three public repos cover most of the product surface:

- [m0saic-template-repo-starter](https://github.com/m0saic-project/m0saic-template-repo-starter)
  — ~80 one-concept lessons; copy a pattern in isolation.
- [m0saic-community-templates](https://github.com/m0saic-project/m0saic-community-templates)
  — the public library, one folder per publisher, signed releases.
- [m0saic-packages/packages/templates](https://github.com/m0saic-project/m0saic-packages/tree/main/packages/templates)
  — the official library that ships in the product; the house standard.

## The files that are your memory

A day is several fresh agent calls. Nothing survives between them except files:

```
journal/<date>/state.json      phase ledger: <phase>: "done"; decision, pick, useCase, pack, slug…
journal/<date>/run.json        who ran; model.selfDeclared (yours); phase outcomes (the runner's)
journal/<date>/10-scout.md     candidates, evidence, the pick
journal/<date>/20-brief.md     the spec the critic scores against
journal/<date>/30-build.md     what each variant tried
journal/<date>/40-critique.md  scores, SHIP <x> | NO SHIP
journal/<date>/50-ship.md      what shipped, the render one-liner, weak spots
journal/<date>/variants/<x>/   src/ + renders/ + stills/ + report.json per variant
journal/index.json             one row per day (the runner writes it) — read it to avoid repeats
```

Read the day's files before acting. Mark a phase done in `state.json` only when
its output file is complete; the runner re-calls a phase until it sees the key.

## The loop

```
npm run new -- <pack>/<slug> --title "Human Title"   # scaffold: template + test + registry wiring (+ pack)
npm run build          # check-freeze → tsc → copy assets → manifest → conventions gate (renders every template at defaults)
node tools/check-registry.mjs --json    # the gate's findings as JSON, each with its fix — loop on this
npm test               # jest (src/**/*.test.ts) + the pipeline's own tests
npm run fingerprints:update             # after an intended layout change (commits <slug>.layout.m0 beside the template)
node pipeline/render/render-variant.mjs @one-a-day/<pack>/<slug>/v1 journal/<date>/variants/a
                       # build + render landscape/portrait/square + stills + report.json + a copy of the source folder
npm run previews       # mint the browse card (ship phase only; needs the CLI + paid tier)
npm run verify         # build + lint + jest + loader contract + dependency policy — the gate runs this
m0saic doctor . --json # the same conventions from outside the build
m0saic make @one-a-day/<pack>/<slug>/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
                       # the why-tutorial as a clip (render-variant does this for you)
node tools/check-why.mjs --json         # the why-tutorial gate's findings (the build runs it last)
```

**`tsc --noEmit` is a weaker signal than `npm run build`.** **The CLI renders
`dist/`, so rebuild before you render.** **Exit 0 is not a picture:** `m0saic
make` exits **3** when it rendered an error mosaic — `render-variant` reports
it as `degraded`; treat it as a failure.

## Adding a template — the whole checklist

1. `npm run new -- <pack>/<slug> --title "<Title>"` — one template per day,
   `v1`, under an existing pack when one fits (`pipeline/config.json` lists the
   preferred vocabulary; a new pack needs a sentence of justification). The
   scaffold titles it `YYYY-MM-DD · <Title>` and tags it with the date and
   `day-NNN`: hosts sort the grid by name or by first tag, so the day is the
   ordinal and a search for a date finds the template. Keep both as written.
2. Edit `src/<pack>/<slug>/v1/<slug>.ts`. The header comment is the lesson:
   what it makes, for whom, the one rule that bites. Keep the scaffold's shape:
   typed props with deterministic defaults, `bindProp` on the rects that show a
   prop, `svgLabel` copy that fits its cell, geometry from `ctx.target`,
   fail-fast validation in `render()`, `outputHints` with a `format`, and the
   layout contract (below): tag every source, declare what the geometry
   promises, return `withLayoutIntent(...)`.
3. Edit the test beside it to assert what the brief claims (bindings, floors,
   determinism, a validation error).
4. Fill `WHY` — the why-tutorial spec (see the section below). The scaffold
   pre-filled day, date, agent, model, the use case and the sources from the
   journal; you write the words. The build refuses a leftover `[fill me]`.
5. `npm run build` clean, `npm test` green, fingerprints updated.
6. Render variants with `render-variant.mjs`; the critic judges the stills and
   reports — including the tutorial's pages (`stills/tutorial-<n>.png`). Ship
   phase: `npm run build && npm run previews && npm run build && npm run fingerprints:update && npm run verify`.
7. Write the journal. Do not commit — the runner does, once, after its gate.

## The layout contract — every template says what its geometry promises

Text is the #1 defect an agent ships: svg text never wraps or shrinks by
itself, and an unfitted string clips silently. So every template declares a
contract and the build sweeps it (`tools/check-layout.mjs`, after the
platform conventions) at the seven contract canvases — 1920x1080 · 1280x720
· 1080x1920 · 1080x1080 · 3840x2160 · 640x360 · 480x270 — at the template's
defaults; the template's own test sweeps it for the copy that stresses it
(`sweepLayout` from `src/_shared/layout.ts`).

What to promise — the general tidiness of one template, not pixel positions:

- **every text fits its box** — `tag(src, label)` every text source and give
  each label a `textFits`. Use `textFitsMeasured(label, text, px, width)` when
  you measured the block yourself (exact), or `textFitsAll(labels, {
  charWidthEm: TEXT_EM.prose })` for `svgLabel` copy (the bundled font's
  calibrated ruler; the contract's default 0.72 is for an unknown font and
  flags a full-width line that fits). A label is one-to-many: give cells with
  different copy different labels.
- **the chrome lives where the design says** — `within: { yFrac: [0.6, 1] }`
  for a footer band, `minWidthFrac: 0.98` for a full-width bar, `aspect: 1`
  for a mark, a bare `{ label }` when the element must simply be there.
- **only what the brief demands** — pin an exact fraction ("the header is
  18% tall") only when the observed use case asks for it.

Wire it as `return withLayoutIntent(doc, ctx, { templateId: ID, constraints,
debug: props.debugLayout === true })` with a `debugLayout` boolean knob
(default false): in Make, flipping it draws the contract over the render.
Debug-only at render by ruling — a violation never blocks a real render;
the build and the test are where it bites. A violation is a design
decision: shrink, compact the wording, drop the row — never ellipsis at the
floor. Fit copy at `cell * 0.94 - 2px` so quantization's pixel or two never
tips the check.

## The harness — fixtures every template can build on

`src/harness/` holds `internal: true` templates the shared pages and the
daily templates use — today `@one-a-day/harness/agent-timeline/v1`, the card
the why-tutorial ends with. Human-maintained: a day's template never lands
there (the gate refuses it), and harness entries carry no date prefix.

## The why-tutorial — every template explains itself

Make has no prose surface and a link preview has no README, so each template
carries the day's story as its `renderTutorial`: press the "?" pill in Make,
or `m0saic make <id> --template-repo . --tutorial -o why.mp4`. It is ONE
shared structure (`src/_shared/why.ts`, `whyTutorial(WHY, render)`), five
steps, each its own page a viewer scrubs:

1. **cover** — the run: day, date, which agent, which model (self-declared)
2. **the problem** — who was observed with what recurring problem, in the
   evidence's own words, and the online sources the agent actually opened
3. **the solution** — what this template attempts about it, the one design
   decision that matters, known weak spots
4. **use it** — the render one-liner and props worth trying
5. **the template itself**, rendered at its own defaults
6. **how it was made** — the harness agent-timeline card: the run's phases
   as a waterfall, tool calls, tokens AND dollars (devs read tokens,
   leadership reads dollars), wall time, and where the numbers came from

`WHY` is a literal in the template file, frozen with it. `npm run new`
writes it pre-filled from `journal/<date>/` (`state.json` `useCase`, `who`,
`sources`; `run.json` `runner.adapter`, `model.selfDeclared`;
`trace.json` for the timeline so far). The runner writes
`journal/<date>/trace.json` from the agent CLI's own event stream after
every phase call — tool calls, tokens, cost as the CLI reported it or an
estimate from `pipeline/config.json` `pricing` (dated). In the ship phase,
copy it into `WHY.timeline`:

```
node pipeline/lib/trace.mjs --timeline journal/<date>/trace.json
```

The build (`tools/check-why.mjs`) refuses a placeholder, non-ASCII copy, a
bad URL, a `day`/`date`/`agent`/`model` that disagrees with the journal, a
timeline that disagrees with the trace, or a tutorial that does not render
as those six steps. The critic scores whether the pages tell the truth.
Budget: 1-3 paragraphs of at most 320 characters per page — it is
orientation; the detail is the journal.

## Rules that fail silently

- **`ctx.target`, never `ctx.output`** — they agree until the template renders nested.
- **Never guess a `flattenedStableKey`** — compute it with `findStableKeys`. A wrong key renders *silently black* and exits 0.
- **`export *` only** in pack index files. Pairing it with a named re-export of the same module fills `templates[]` with `undefined`.
- **ASCII only in rendered copy** — the bundled glyph font draws `→` as tofu (the gate checks glyph coverage).
- **Blank lines are not spacing** — the svg rasterizer drops them when drawing *and* measuring. Gaps are geometry.
- **Splits above 12 must be 5-smooth** — `weightedSplit(…, { precision: 120 })`; the gate throws (`latticeSmooth`).
- **Validate any hand-written m0** with `validateM0String` from `@m0saic/dsl`.
- **Determinism** — no `Math.random()`, no clock, no ambient state. Seeds are props. The gate renders twice and diffs.
- **Every optional prop shows its default** — the gate renders with no inputs; a template that needs a file to look like anything gets skipped, not shipped.

## Hard rules (the runner reverts the day if you break one)

- Never `git commit` / `push` / `checkout` / `reset` / `tag`, never `npm publish`,
  never `npm run submit` (that is the maintenance ritual for work ON the repo;
  it refuses to run inside a day).
- Never edit `pipeline/`, `tools/`, `.github/`, `AGENTS.md`, `CLAUDE.md`, `README.md`,
  `package.json`, `dep-allowlist.json`, `frozen.manifest.json`, or another day's journal.
- **Shipped templates are frozen.** Never modify a `src/<pack>/<slug>/vN/` that exists
  at HEAD; `tools/check-freeze.mjs` fails the build and the gate reverts it. A fix is a
  new `vN+1` folder with `deprecated: { replacement }` on the old one — and that is a
  future day's work, not today's.
- **At most one new template folder per day.** Variants share the id and folder.
- No new dependencies (`dep-allowlist.json` mirrors what a host resolves — a new import
  compiles here and fails at load). No downloaded media into the repo. No secrets.

## Scope

Do not restructure packs, renumber titles, or delete templates. Do not "improve"
yesterday's template. Do not touch the pipeline to make today easier — write what
was hard into `30-build.md`; the humans who maintain `pipeline/` read it.
