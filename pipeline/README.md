# pipeline/

The daily run. Humans edit this folder; the agent never does (the runner
reverts any change here before committing).

## One day

```
node pipeline/run.mjs                 # today: preflight → scout → plan → build → critique → ship → gate → push
node pipeline/run.mjs --no-push       # same, the commit stays local
node pipeline/run.mjs --agent codex   # pick the adapter (or ONE_A_DAY_AGENT, or config.json)
node pipeline/run.mjs --model <name>  # pass a model to the adapter (or ONE_A_DAY_MODEL)
node pipeline/run.mjs --phase build   # run one phase only, no gate (re-runnable: phases read the journal)
node pipeline/run.mjs --from critique # resume from a phase, then gate
node pipeline/run.mjs --gate-only     # no agent; gate the working tree as it is
node pipeline/run.mjs --date 2026-09-21
node pipeline/run.mjs --agent fake --no-push   # a canned day with no model (tests the machinery)
```

**Preflight** (runner, deterministic): on `main`, clean tree, `git pull --ff-only`,
`npm ci` if the lockfile moved, `m0saic versions` sees ffmpeg, `m0saic license`
is paid, `npm run verify` green on the untouched tree. Any failure = no run.

**Phases** (`config.json`): each is one fresh agent call with
`prompts/_preamble.md` + `prompts/<phase>.md`; the agent marks itself done in
`journal/<date>/state.json`; the runner re-calls up to `maxCalls` times inside
`timeoutMin` each, and the whole day inside `dayTimeoutMin`. `ship` runs only
when the critique set `decision=ship`.

**Gate** (`lib/gate.mjs`, deterministic):

1. Scope guard — only today's allowed paths may differ from HEAD
   (`lib/git.mjs` `classifyChanges`). Anything else is reverted and the day fails.
2. No-ship day — everything but the journal is reverted.
3. `npm run verify`, `tools/check-freeze.mjs`, `m0saic doctor . --json` ok.
4. Exactly one new `src/<pack>/<slug>/vN/`; it is in the manifest; only its
   preview assets were touched; `--validate-only` exits 0 (3 = error mosaic);
   `preview.png` is real; `50-ship.md` exists.
5. `tools/check-freeze.mjs --update --tag <date>` freezes the new folder.
6. One commit `day NNN: <id> — <title>` with `Agent:` / `Model:` trailers; push.

## Environment

| Variable | Purpose |
|---|---|
| `ONE_A_DAY_AGENT` | `claude` \| `codex` \| `kimi` \| `fake` (default `config.json`) |
| `ONE_A_DAY_MODEL` | model name handed to the adapter (recorded as `runner.modelFlag`) |
| `M0SAIC_PRODUCT_KEY` | paid tier for the CLI on this machine — previews are minted clean. Free tier stamps a QR and re-encodes; preflight refuses |
| `M0SAIC_TELEMETRY` | set to `ghost` by the runner unless you set it |
| `M0SAIC_NO_UPDATE_CHECK` | set to `1` by the runner unless you set it |

The agent CLIs authenticate with your subscriptions on the machine (log in
once, interactively). No API keys live in this repo.

## Correcting a model declaration

Edit `journal/<date>/run.json` → `model.corrected`, commit by hand. The
self-declared value stays as the record of what the agent said.

## Adapters

`agents/README.md` — the contract, the deny lists, how to add a CLI.

## Scheduling

`schedule/install.md` — launchd on macOS, Task Scheduler on Windows.
