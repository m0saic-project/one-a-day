# Agent adapters

The daily run is **agent-agnostic**. Each file here wraps one coding-agent CLI
behind the same contract; `pipeline/run.mjs` picks one from `ONE_A_DAY_AGENT`
(or `--agent`, or `agent` in `pipeline/config.json`) and calls it once per
phase with a prompt file. The agent's only job is to read the prompt, do the
work in the working tree, and mark the phase done in `journal/<date>/state.json`.

## The contract

```js
export async function available()            // true, or a string saying why not (binary missing, not logged in…)
export async function run({
  prompt,     // the full prompt text (preamble + phase)
  cwd,        // the repo root — the agent works here
  logDir,     // journal/<date>/logs — write <label>.jsonl (raw) and <label>.log (readable) here
  label,      // e.g. "build-2"
  timeoutMs,  // hard wall-clock cap; the adapter must pass it to runProcess
  model,      // optional model name from --model / ONE_A_DAY_MODEL / config
  config,     // this adapter's block from pipeline/config.json
  env,        // extra env for the child (M0SAIC_TELEMETRY, ONE_A_DAY_*)
}) → { exitCode, timedOut, ms, transcript, log }
```

Rules every adapter keeps:

- **Non-interactive.** No prompts can be answered; anything that would ask is
  either pre-approved by the adapter's permission model or denied.
- **Never let the agent push, commit, tag, reset or publish.** Adapters deny
  what they can (`claude.settings.json`, sandbox modes); the runner's scope
  guard and gate are the real line, and they are agent-independent.
- **Prompt via stdin** where the CLI allows it, so no shell quoting touches it.
- **Raw transcript to `<label>.jsonl`** (gitignored) and a readable feed to
  `<label>.log` (committed) through `pipeline/lib/stream-log.mjs`.

## Model self-declaration

The adapter records what it *asked for* (`runner.modelFlag` in `run.json`).
The agent records what it *believes it is* (`model.selfDeclared`, written by
the agent during the scout phase per `_preamble.md`). The human may set
`model.corrected`. The commit trailer prints the self-declared value.

## Adapters

| File | CLI | Notes |
|---|---|---|
| `claude.mjs` | Claude Code (`claude -p`) | stream-json transcript; permission mode from config (`bypassPermissions` for an unattended laptop); `claude.settings.json` denies git push/commit/reset, npm publish, sudo |
| `codex.mjs` | OpenAI Codex (`codex exec`) | `-s workspace-write`, `--json` events, `--skip-git-repo-check`; network for the scout phase via config override (verify the key name against your installed `codex --help`) |
| `kimi.mjs` | Kimi CLI | **not wired** — fill in `available()` and `run()` once the CLI is on the laptop; the contract above is all it needs |
| `fake.mjs` | none | test double: performs a canned day (scaffold + journal files) without any model — used by `pipeline/lib/*.test.mjs` and `--agent fake` dry runs |
