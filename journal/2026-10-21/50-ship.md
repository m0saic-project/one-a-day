# Ship — 2026-10-21

## @one-a-day/gaming/typing-pb-card/v1 — Typing PB Card

A personal-best share card for a Monkeytype user, one deterministic render
per result, from the result object's own fields typed in as props: the hero
wpm with the NEW PB badge and the "+N vs PB" delta computed against `pb`
(never typed), the raw / acc / consistency tiles, the per-second
`chartData.wpm` as a full-width bar row with the peak second in the accent,
and the mode line under the handle. The operator reviewed the renders and
approved the ship.

## Render it

```
m0saic make @one-a-day/gaming/typing-pb-card/v1 --template-repo . -w 1080 -h 1080 -o card.png
```

Props worth trying:

```
--props '{"handle":"keyrunner","wpm":102,"raw":108,"acc":98.2,"consistency":84.5,"mode":"english - time 60","pb":99,"chart":[92,94,93,96,95,98,97,99,98,100]}'
```

- `wpm` 102 vs `pb` 99 prints "+3 vs PB" with the NEW PB badge; `wpm` 98
  prints "1 under PB" with no badge; `wpm` 99 vs `pb` 99 prints "ties PB".
- `chart` holds `chartData.wpm`: 15 values for a 15s test, 60 for a 60s
  test; the peak second draws in the accent and the caption's peak is
  computed from the list.
- `raw` must stay >= `wpm` (raw counts mistakes); `acc` and `consistency`
  stay 0-100 - impossible values are refused by name.
- Why it exists: `m0saic make @one-a-day/gaming/typing-pb-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4`

## Weak spots (honest; a human polish pass starts here)

- No importer: the numbers are retyped from the result screen or the
  results CSV/API row; `chart` is a JSON list, not the file. The incumbent
  is one screenshot - the card's edge is the computed PB story, the
  per-second bars and repeatable branding, and that edge is unproven in the
  community.
- This model takes no image input, so no agent eyes saw the render: the
  stills were judged from `report.json`, the layout probe, the code and the
  test sweep (the critic's fallback); the operator then looked at the
  renders and approved. Cramping at 640x360 / 480x270 is machine-checked to
  the 6px floor but not human-checked.
- 10 data props + debugLayout sits at the brief's own ceiling; the
  scaffold's title-casing ("Typing Pb Card") had to be corrected in three
  places (label, registry row, WHY.title).

## Follow-ups (what v2 would do)

- Import the result JSON (a saved /results row or the results CSV) so the
  card builds from the file itself, not retyped numbers.
- Fold `raw` into a derived "mistakes cost" line or add a preset to slim
  the prop list to the brief's five-to-ten ideal.
- Mark tie-behind-peak seconds (sub-peak plateau) instead of only the first
  peak, and a light-page preset for print posture.

## Tokens and costs

No runner trace exists for this day: the runner aborted at preflight
(`npm run verify (untouched tree)` exceeded the 15-minute preflight cap on
a machine running roughly 6-12x slower than its normal verify - every step
was green, only the wall clock failed), so no phase calls were made through
the adapters and `journal/2026-10-21/trace.json` was never written. The day
was completed in one hand-driven opencode session, so the why-tutorial's
timeline is self-reported (disclosed in its caveats), there are no
per-phase token or cost numbers to summarize, and `60-token-costs.md` was
not written. OpenCode Go allowance usage is not an additional per-run
invoice.
