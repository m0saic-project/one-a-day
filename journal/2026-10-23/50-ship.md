# Ship — 2026-10-23

## @one-a-day/sports/disc-bag-matrix/v1 — Disc Bag Matrix

A deterministic dark share card for a disc golf bag: the speed x stability
matrix from the four flight numbers (speed, glide, turn, fade) every disc
already carries. The stability slot is derived (s = turn + fade, never a
prop), chips stack name + numbers in their slot, and empty cells keep a faint
row tint so the gap story — the US-PUTTER hole, the one-deep CONTROL column —
reads from the picture, with "20 SLOTS - 13 FILLED - 7 EMPTY" in the footer.
Built for r/discgolf and r/mydiscbag "rate my bag" / "bag check" posters, UDisc
leagues and disc shop socials who today post screenshots of a bag site or a
hand-built spreadsheet plot. Inputs: `discs[]` (name + the four numbers), then
`title`, `subtitle`, `chipDetail`, `preset`, `accent`; at defaults it shows a
finished 18-mold bag with real flight numbers. Shipped variant **a** (the
critic's pick over tied b: name + numbers on every chip so a thread reader
gets the gap without decoding a key, dark defaults as the brief pins). The
ship phase kept a's source and refreshed `WHY.timeline` from the full trace —
five phases through critique, priced "estimated" at 2026-10-14 — replacing the
two-phase snapshot the critic scored down; no other template change.

## Render it

```
m0saic make @one-a-day/sports/disc-bag-matrix/v1 --template-repo . -w 1920 -h 1080 -o out.png
```

Props worth trying:

```
--props '{"chipDetail":"numbers","title":"Bag check - week 12"}'
--props '{"preset":"light","accent":"#2f7bff"}'
--props '{"subtitle":"","discs":[{"name":"Aviar","speed":2,"glide":3,"turn":0,"fade":1},{"name":"Zone","speed":4,"glide":3,"turn":0,"fade":3},{"name":"Wraith","speed":11,"glide":5,"turn":-1,"fade":3}]}'
```

Why it exists (the tutorial):

```
m0saic make @one-a-day/sports/disc-bag-matrix/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## Gate state at ship

`npm run build && npm run previews && npm run build && npm run
fingerprints:update && npm run verify` all green in that order: 38 templates
render at defaults, check-layout clean at the 7 contract canvases, check-why
clean with 0 warnings after the timeline refresh, fingerprints 38 unchanged,
verify 41 suites / 604 jest tests + node tests, bundle, contract and deps
clean. `m0saic doctor . --json` reports `"ok": true` (0 errors; 6 warnings,
all `bindingsCover` on earlier days' frozen templates — nothing cheap to fix
on this one). The tutorial validates (`--validate-only` exit 0,
"Validation passed"). The browse card at
`assets/templates/@one-a-day__sports__disc-bag-matrix__v1/preview.png` is the
full 1920x1080 landscape default card (81,058 bytes — the same render as the
critic's `stills/landscape.png`), viewed and not a blank frame. It is an image
template, so the video-first-frame concern does not apply.

## Weak spots (honest; a human polish pass starts here)

1. Row-label strip flush to the grid edge: right-aligned names ("BEEF", "s 2-3")
   clear it by 1-4px. The glyphs are whole (the critique measured ink vs
   measureText), but the look is "cut" at low zoom and cost the critique a
   false lead. Pull the label rects in ~6px.
2. Empty slots share one row tint, so adjacent holes merge — the BEEF row
   reads as one strip instead of 4 empty slots. The footer's 13/7 is computed,
   not countable from the picture.
3. The chip number line ("9 3 0 4") is one string over four props and unbound
   in Make: double-clicking it edits nothing. Doctor's `bindingsCover` cannot
   attribute the composite, so it stays a silent rough edge.
4. The tutorial plan warns `OVERLAY_CHAIN_DEEP` (36 nested overlays; the CLI
   draws the line at 20) — today's tutorial stills render legibly, but inline
   masks past ~25 can degrade silently in ffmpeg. Also `variants/a/`'s
   tutorial stills and `tutorial.mp4` predate the timeline refresh:
   `tutorial-6.png` there shows the two-phase card the critic scored down;
   the shipped tutorial shows all five phases.
5. The sample player is invented (Dana Kovac) while the molds and flight
   numbers are real on purpose — the audience calls out wrong numbers. A
   20-char ALL-CAPS name still hits the chip font floor at 480x270.

## Follow-ups (what v2 would do)

- Per-cell empty-slot tints or hairline cell edges so holes are countable from
  the picture (the critique's item 3).
- Bind the numbers line — one compound handle over the four flight-number
  props, or at least one number (item 4).
- Variant b's numbered chips keyed to a right-hand disc list as the dense-bag
  mode: the critic's pick for a 30-disc bag where cells get tight.
- A scatter mode keeping the exact (speed, s) point inside its band — the
  deliberate trade the caveats admit.
- `_shared/text.ts` `fitLine` never terminates at px <= 6 (`round(px*0.92)`
  stops decrementing; 30-build.md) — kit maintenance, not a day's work, since
  shipped fingerprints ride on the shared kit.

## Tokens and costs

Per `journal/2026-10-23/trace.json` and
[60-token-costs.md](60-token-costs.md) (that snapshot is refreshed after this
ship call ends, so it cannot include this call yet): five phase calls observed
before ship — scout 886,512 tok / $0.07, plan 394,914 / $0.04, build 788,071 /
$0.08, build (2) 27,813,708 / $0.39, critique 2,950,628 / $0.13 — 32,833,833
tokens, $0.70 known cost, ~4h 01m wall across 298 tool calls. Four of the
five carry **reported** dollars from the agent CLI (scout $0.0653, plan
$0.0404, build $0.0821, critique $0.1276); build (2) — the call that wrote
the template, 2h45m and 27.8M tokens — is a **dated estimate** at list prices
of 2026-10-14 ($0.3871; partial reported cost on file), which is why the run
totals label the basis "estimated". No missing usage: 0 calls without tokens,
0 without cost. Both build and critique hit the runner's time cap (trace
status `error`; the outputs landed, and the tutorial's timeline page shows the
status honestly). Rendering, ffmpeg and m0saic CLI runs are outside these
numbers. OpenCode Go allowance usage is not an additional per-run invoice.
