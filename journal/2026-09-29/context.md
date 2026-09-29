# Operator note — 2026-09-29

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
