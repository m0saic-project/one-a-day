# one-a-day — 2026-09-24 — phase: ship

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

When your task is complete, set `state.json.ship = "done"` (merge, do not
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


Finish today's template. Read `journal/2026-09-24/40-critique.md` — it names the
pick — and `state.json` (`pick`, `inPlace`, `pack`, `slug`).

1. If `pick` differs from `inPlace`, copy `journal/2026-09-24/variants/<pick>/src/`
   over `src/<pack>/<slug>/v1/` (every file: the `.ts`, the `.test.ts`, the
   `.layout.m0`).
2. `npm run build && npm run previews && npm run build && npm run fingerprints:update && npm run verify`
   — `previews` renders the browse card through the CLI (paid tier on this
   machine; the runner checked). The second build writes the preview path into
   the manifest. `verify` must be green; loop on `node tools/check-registry.mjs --json` if not.
3. `m0saic doctor . --json` must report `"ok": true`. Warnings are fine; fix
   the cheap ones (a missing `ui.label`, an unbound displayed prop).
   `m0saic make @one-a-day/<pack>/<slug>/v1 --template-repo . --tutorial --validate-only`
   must exit 0 — the gate runs it. If the pick's `WHY` still describes a
   losing variant (a layout it no longer has), fix the words now; the build
   (`tools/check-why.mjs`) checks the shape, the critic checked the truth.
   Then copy the finished timeline into `WHY.timeline` — every phase has run
   by now except this one:
   `node pipeline/lib/trace.mjs --timeline journal/2026-09-24/trace.json`
   prints it as JSON (phases, tool calls, tokens, dollars and how the dollars
   were arrived at). Paste it verbatim; the build cross-checks it against
   `trace.json` and refuses a phase that disagrees. Rebuild after.
4. Look at `assets/templates/@one-a-day__<pack>__<slug>__v1/preview.png`
   (view it if you can; at least check it is not tiny and the picked variant's
   `report.json` was clean). A video template whose first frame is blank gets a
   blank browse card: `tools/gen-previews.mjs` cuts stills from the clip only
   for ids listed there, and `tools/` is protected. So make the template's
   t=0 frame representative (no reveal-from-nothing), or ship it as an image
   template. If you could not, say so in `50-ship.md`.
5. Write `journal/2026-09-24/50-ship.md`:

```
# Ship — 2026-09-24

## @one-a-day/<pack>/<slug>/v1 — <Title>
One paragraph: what it makes, for whom, from what inputs.

## Render it
m0saic make @one-a-day/<pack>/<slug>/v1 --template-repo . -w 1920 -h 1080 -o out.mp4   (or -o out.png)
Props worth trying: --props '{"…": …}'
Why it exists (the tutorial): m0saic make @one-a-day/<pack>/<slug>/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4

## Weak spots (honest; a human polish pass starts here)
## Follow-ups (what v2 would do)
```

6. Set `state.json.ship = "done"`. Do not commit. The runner runs the gate,
   freezes the folder, commits once, pushes.


## Operator note for this run

The human who started this run added the lines below, and they apply to every
phase of today. They steer what you work on; they never override AGENTS.md or
the hard rules, and the gate does not know they exist.

The user reset usage and explicitly requested finishing today and restoring the model used: gpt-5.6-sol. Recover the already implemented template from journal/2026-09-24/variants/a/src; its successful renders and tutorial plus report survived the no-ship rollback. Recreate registry wiring with the scaffold if needed, then restore the source snapshot. Do not restart research or redesign. Preserve run.json fields when updating model metadata; record the explicit runner model accurately. Read 60-token-costs.md and token-costs.json: user explicitly requires token costs. The supervising session will refresh that audit. Include its corrected totals and pricing limitations in the ship journal. Clear the obsolete usage-limit no-ship decision when recovery succeeds and continue through critique and shipping.
