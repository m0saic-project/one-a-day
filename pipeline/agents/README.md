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
  model,      // optional model name from --model / ONE_A_DAY_MODEL / the roster slot
  config,     // adapters.<name> from pipeline/config.json, with the drawn roster
              // slot's `adapter` overrides merged over it
  env,        // extra env for the child (M0SAIC_TELEMETRY, ONE_A_DAY_*)
}) → { exitCode, timedOut, ms, transcript, log, trace?, limit? }
export async function headroom({ cwd, env, logFile })   // optional: the account's session windows, from the cheapest call the CLI makes
```

`limit` is the account's session limit as the CLI reported it during the
call (`lib/limits.mjs` `createLimitWatcher`): `{ seen, hit, window,
resetsAt, status, windows, message }`. A CLI that says nothing about limits
returns `seen: false` or omits the field, and the runner treats its calls as
it always did. `hit: true` is what makes the runner keep the tree and wait
for the window instead of calling again (`pipeline/README.md`, "Session
limits"). `headroom()` is what preflight uses to see the windows before the
day spends anything.

`trace` is the phase call's record from `pipeline/lib/trace.mjs`
(`createTraceRecorder` fed every stdout line, then `finish()`): tool calls
with tool, target and timing, tokens, cost, wall time — read off the CLI's
own event stream, never self-reported. The runner merges it into
`journal/<date>/trace.json`; the ship-phase agent copies it into the
template's `WHY.timeline`, the last page of its why-tutorial. An adapter
whose CLI has no event stream may omit it (the timeline is then
`self-reported`, and the card says so).

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
| `claude.mjs` | Claude Code (`claude -p`) | stream-json transcript; permission mode from config (`bypassPermissions` for an unattended laptop); `claude.settings.json` denies git push/commit/reset, npm publish, sudo; reports the session windows (`limit`, `headroom()`) |
| `codex.mjs` | OpenAI Codex (`codex exec`) | `-s workspace-write`, `--json` events, `--skip-git-repo-check`; network for the scout phase via config override (verify the key name against your installed `codex --help`); reports no session windows yet |
| `opencode.mjs` | OpenCode (`opencode run --format json`) | one CLI, many providers: the model is `provider/model` and the roster rides OpenCode Go (`opencode-go/<model>`, one subscription across Kimi, GLM, DeepSeek, Qwen, MiMo, MiniMax, Grok, GPT); prompt on stdin; `--auto` with the deny list in `opencode.json` (same list as Claude's) handed over through `OPENCODE_CONFIG`; "logged in" = at least one credential in `~/.local/share/opencode/auth.json`, and a slot whose provider has none ends the call in the log without spending; Go's per-model dollar limits come back as a rejection with no reset time, so the runner keeps the tree and ends the day (tomorrow draws another slot) |

### Config keys these adapters read

| Key | Adapter | Effect |
|---|---|---|
| `permissionMode` | claude | `--permission-mode` (default `bypassPermissions`) |
| `effort` | claude | `--effort`; **forced to `xhigh` when `ultracode` is on** |
| `budgetUsd` | claude | `--max-budget-usd`, per phase call — not per day |
| `ultracode` | claude | there is no `--ultracode` flag: it is a session setting merged into `--settings`, and `--effort` below `xhigh` silently cancels it. The settings actually passed are written to `journal/<date>/logs/claude.settings.effective.json` |
| `sandbox` | codex | `-s` (default `workspace-write`) |
| `networkConfig` | codex | `-c <key=value>` for sandbox network access (the key name moves between versions) |
| `reasoningEffort` | codex | `-c model_reasoning_effort=<level>`: `low · medium · high · xhigh · max · ultra`. Models carry their own default and some ship at `low`, so ask for depth explicitly |
| `auto` | opencode | `--auto`: approve every permission `opencode.json` does not deny (default true; the day is unattended) |
| `pure` | opencode | `--pure`: run without user-installed plugins (default true) |
| `variant` | opencode | `--variant <level>`: provider-specific reasoning effort (`high`, `max`, …); off unless the slot sets it, since not every Go model takes one |
| `agent` | opencode | `--agent <name>`: an OpenCode agent; default is its `build` agent |

A roster slot's `adapter` block is merged over `adapters.<name>` before the call,
so one CLI can appear several times at different depths and budgets.
| `kimi.mjs` | Kimi CLI | **not wired** — fill in `available()` and `run()` once the CLI is on the laptop; the contract above is all it needs |
| `fake.mjs` | none | test double: performs a canned day (scaffold + journal files) without any model — used by `pipeline/lib/*.test.mjs` and `--agent fake` dry runs |
