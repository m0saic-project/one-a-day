# Ship — 2026-10-13

## What shipped

`@one-a-day/gaming/vatsim-monthly-log/v1` - **2026-10-13 · VATSIM Monthly
Log** (variant a; the only variant, and it was fixed in place twice from the
stills: milestone caption over row 10, then heads at their own size).

A virtual airline pilot's month as one ops-log card: pilot + month header
with an accent rule, four stat tiles (flights, hours, longest with its
sector, average touchdown fpm), the month's PIREPs as a seven-column log,
and a career-milestone bar counting to the next hundred. Every number the
card prints is computed from the row list - nothing typed twice - and the
grammar refuses a bad row by name instead of clipping.

## Render one-liner

```
m0saic make @one-a-day/gaming/vatsim-monthly-log/v1 --template-repo . -w 1920 -h 1080 -o month.png
```

Props worth trying: `rows` (1-10 lines
`"DD Mon | FLIGHT | DEP-ARR | TYPE | H:MM | vs | score"`, `--` allowed in
vs/score), `careerHours` (last month's figure - the bar adds the month to
it), `preset: "light"` for the ops-sheet paper, `debugLayout: true` to see
the contract. The why-tutorial: same command with `--tutorial`.

## Verification

- `npm run build` clean (freeze intact, manifest 28 templates, registry,
  layout sweep on 7 canvases, check-why ok)
- `npm test` 481 passed / 31 suites, including this template's 9 (bindings,
  independent recomputation of every total, the `--` average rule, refusal
  messages, milestone clamp at the exact 500.0 landing, 7-canvas sweep x 4
  prop stressings, portrait/square stacking, determinism)
- `npm run previews` minted the browse card; fingerprints updated;
  `npm run verify` green; variant renders `report.json`: 3 renders, 9
  stills, no error mosaics
- `m0saic make --validate-only` and `--tutorial --validate-only` (gate ran
  them too)

## Weak spots (honest)

- Ten rows is the card; a 20-flight September needs a second card, and
  there is no "top 10 by block time" sorting - you pick before typing.
- The phpVMS log's `VERIFIED` status column is dropped; the card has no
  notion of pending PIREPs.
- No distance flown (not in the row grammar) and no country/passport
  flourish the VA dashboards have.
- `careerHours` is last-month's number typed by hand; if it is wrong, the
  bar is wrong (it is the one figure the card cannot derive).

## The failed first gate (round 1)

`npm run build`, `check-registry`, `check-layout`, `check-why` and `verify`
all passed while `m0saic doctor` - which the gate also runs - failed: the
numeric prop `careerHours` was neither bound to a rect nor declared
unbound (convention `bindingsDeclared`). The build-gate checks here do not
cover that convention, so the day died at the very last deterministic step;
the gate reverted the tree and committed the journal alone (ce53851).
Restored the day from `variants/a/src/` + the registry/index rows, added the
`bindings.unbound` declaration with its reason (the bar shows careerHours
PLUS the month's computed hours - no rect shows the raw figure), re-ran
previews/fingerprints/verify and the gate, and the doctor now holds. The
variant's source snapshot and stills were re-rendered after the fix, so the
first gate commit's "no template" row is corrected by this second one.

## Follow-ups (noted, not today's work)

- The `pipeline/agents/opencode.mjs` credential probe is stale on this
  machine (auth.json vs the account DB) - the headless scheduler cannot
  start a day here until a human fixes it (see 30-build.md).
