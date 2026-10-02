# one-a-day — 2026-10-02 — phase: ship

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

When your task is complete, set `state.json.ship = "done"` (merge, do not
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


Finish today's template. Read `journal/2026-10-02/40-critique.md` — it names the
pick — and `state.json` (`pick`, `inPlace`, `pack`, `slug`).

1. If `pick` differs from `inPlace`, copy `journal/2026-10-02/variants/<pick>/src/`
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
   `node pipeline/lib/trace.mjs --timeline journal/2026-10-02/trace.json`
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
5. Write `journal/2026-10-02/50-ship.md`:

```
# Ship — 2026-10-02

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
