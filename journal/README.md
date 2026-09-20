# journal/

One folder per day, written by the day's agent run and closed by the runner.
`index.json` is the table of contents (the runner maintains it; never edit by hand).

```
YYYY-MM-DD/
  run.json          runner.* (adapter, host, m0saic version), model.selfDeclared (the agent), model.corrected (a human), phases.*, result.*, gate.*
  state.json        the phase ledger the agent and runner share
  trace.json        what the agent did, per phase call: tool calls, tokens, cost, wall time (runner-written from the CLI's stream)
  10-scout.md       candidates with links, the pick, what was rejected
  20-brief.md       the spec: id, kind, canvas, props, beats, rubric, variants to try
  30-build.md       what each variant tried, what was hard
  40-critique.md    scores per variant, SHIP <x> | NO SHIP
  50-ship.md        what shipped, how to render it, weak spots, follow-ups
  variants/<x>/     src/ (the variant's code), renders/ (stills committed, clips not), stills/ (canvases + tutorial-<n>.png, one per why-tutorial page), report.json
  logs/             <phase>-<n>.log (readable), <phase>-<n>.prompt.md, gate.log, runner.log; raw .jsonl transcripts are gitignored
```

A day can end three ways (`run.json.result.status` and the commit subject):

- `shipped` — one new template under `src/`, frozen from now on.
- `no-ship` — the critic said no, or a phase did not complete. Only the journal lands.
- `failed` — the gate refused (scope violation, red verify, degraded render). Only the journal lands; `gate.reasons` says why.
