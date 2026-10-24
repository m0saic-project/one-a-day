# Critique — 2026-10-24

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18 | no |
| b | 2 | 1 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 17 | no |

Judged without image input (this model cannot read the PNGs). Verified against
`report.json` (all renders exit 0, `degraded:false`), `node tools/check-registry.mjs
--json` (clean for this template; the two warnings there are pre-existing on other
templates), the flattened `.layout.m0`, the full `src`, both test files, and a
pixel-level probe of the rendered PNGs (header/body carry 82/139 unique colours and
the hero "45:02" bbox is anti-aliased digits, not a filled box — so the engine's
`OVERLAY_CHAIN_DEEP` (45) warning does not manifest as tofu text here).

## What each variant gets right / wrong

**a (primary) — bar = split, pink = mistake**
- Right: renders clean at landscape/portrait/square and all seven contract canvases
  at defaults; footer is honest arithmetic — `TIME W/O MISTAKES 42:04`, `TOTAL LOSS
  +2:58`, `BEST LEG 1:32` = finish 45:02 − Σloss 2:58, exactly three pink legs (1, 5,
  9) with signed loss, clean legs leave the loss cell blank.
- Right: finish is the largest text at every aspect (118px@1920 → 29px@480); header/
  body/footer hold their 0–0.26 / 0.26–0.80 / 0.80–1 bands; tape rail is 34% ≥ 32%;
  rows and the three footer cells are equal-height, all per the declared contract.
- Weak: no column header row — a stranger must infer that the bold column is the
  split and the pink signed column is the loss; only the `+` and the pink carry the
  distinction. Reads fine, but it leans hard on the "no legend" promise.

**b (loss-first)**
- Right: same clean render, same contract, same footer; the pink left rule + wash
  make the three mistake rows unmistakable and the loss is the bold figure exactly
  as the brief's "loss-first" asked.
- Wrong: dimming the split severs the "bar length = split" link the rubric's line 2
  depends on — the number that explains the tape is now secondary, so the card reads
  "pink rows" before "where the minutes went".
- Weak: the pink wash on the whole mistake row adds a second accent hue to the tape
  track, slightly muddying the clean pink=bar mapping; same missing column header.

## Decision: SHIP a

## What a human polish pass should look at first

1. **WHY.timeline is stale** — it lists only scout(+2 retries) and plan; the build
   phase (≈40 min, the phase that actually produced the template) is absent from
   `tutorial-6`. Regenerate in the ship phase
   (`node pipeline/lib/trace.mjs --timeline journal/2026-10-24/trace.json`) and copy
   into `WHY.timeline` before the runner freezes it. Not fatal — the ship loop owns it.
2. **`OVERLAY_CHAIN_DEEP` (45 deep)** — engine warning, text verified rendering, but
   it is over the ~25 comfort ceiling. Record-posture: a future pass could nest the
   tape band into a child doc to cut depth. Do not chase it today.
3. **The "iof-xml" tag over-promises** — the template takes a JSON `splits` list whose
   field names mirror IOF XML 3.0; it does not parse XML. The description ("from one
   IOF XML 3.0 result row") is one step past what is true. A lone racer must transcribe
   13 legs by hand; the batch use case (a club's timing system scripting the props) is
   where this earns its keep, and that converter is out of scope.

## If no ship: the one thing that would have changed the verdict

(n/a — shipping a.) For the record, the thing closest to sinking it was the missing
column header combined with the manual-JSON-only input: if either the split/loss
columns were unlabeled *and* the input were not batchable, this would be a no-ship.
The footer math, the fail-fast validation, and the honest layout contract are what
carried it over the line.
