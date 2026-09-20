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
```

**`tsc --noEmit` is a weaker signal than `npm run build`.** **The CLI renders
`dist/`, so rebuild before you render.** **Exit 0 is not a picture:** `m0saic
make` exits **3** when it rendered an error mosaic — `render-variant` reports
it as `degraded`; treat it as a failure.

## Adding a template — the whole checklist

1. `npm run new -- <pack>/<slug> --title "<Title>"` — one template per day,
   `v1`, under an existing pack when one fits (`pipeline/config.json` lists the
   preferred vocabulary; a new pack needs a sentence of justification).
2. Edit `src/<pack>/<slug>/v1/<slug>.ts`. The header comment is the lesson:
   what it makes, for whom, the one rule that bites. Keep the scaffold's shape:
   typed props with deterministic defaults, `bindProp` on the rects that show a
   prop, `svgLabel` copy that fits its cell, geometry from `ctx.target`,
   fail-fast validation in `render()`, `outputHints` with a `format`.
3. Edit the test beside it to assert what the brief claims (bindings, floors,
   determinism, a validation error).
4. `npm run build` clean, `npm test` green, fingerprints updated.
5. Render variants with `render-variant.mjs`; the critic judges the stills and
   reports. Ship phase: `npm run build && npm run previews && npm run build && npm run fingerprints:update && npm run verify`.
6. Write the journal. Do not commit — the runner does, once, after its gate.

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

- Never `git commit` / `push` / `checkout` / `reset` / `tag`, never `npm publish`.
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
