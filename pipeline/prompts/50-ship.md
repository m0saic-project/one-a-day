Finish today's template. Read `{{DAY_DIR}}/40-critique.md` — it names the
pick — and `state.json` (`pick`, `inPlace`, `pack`, `slug`).

1. If `pick` differs from `inPlace`, copy `{{DAY_DIR}}/variants/<pick>/src/`
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
   `node pipeline/lib/trace.mjs --timeline journal/{{DATE}}/trace.json`
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
5. Write `{{DAY_DIR}}/50-ship.md`:

```
# Ship — {{DATE}}

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
