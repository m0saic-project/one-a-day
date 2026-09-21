# pipeline/

The daily run. Humans edit this folder; the agent never does (the runner
reverts any change here before committing).

## One day

```
node pipeline/run.mjs                 # today: preflight → scout → plan → build → critique → ship → gate → push
node pipeline/run.mjs --no-push       # same, the commit stays local
node pipeline/run.mjs --agent codex   # pick the adapter (or ONE_A_DAY_AGENT, or config.json)
node pipeline/run.mjs --agent random  # draw today's agent + model from the roster (what the scheduler runs)
node pipeline/run.mjs --roster claude-opus-ultracode   # pin one roster slot by name (or ONE_A_DAY_ROSTER)
node pipeline/run.mjs --model <name>  # pass a model to the adapter (or ONE_A_DAY_MODEL)
node pipeline/run.mjs --context "..." # an operator note appended to every phase prompt (or --context-file)
node pipeline/run.mjs --phase build   # run one phase only, no gate (re-runnable: phases read the journal)
node pipeline/run.mjs --from critique # resume from a phase, then gate
node pipeline/run.mjs --gate-only     # no agent; gate the working tree as it is
node pipeline/run.mjs --date 2026-09-21
node pipeline/run.mjs --agent fake --no-push   # a canned day with no model (tests the machinery)
```

## Who runs today — the roster

The project is more interesting the more models attempt the same kind of brief,
so the scheduler does not name an agent: it runs `--agent random` and
`config.json` `roster` decides. One slot is drawn per day, weighted, and the
runner walks the draw order taking the first CLI that is **installed and logged
in** — an agent that is not on this machine costs a log line, not the day.

```
roster.entries[].id       slot name; --roster <id> pins it
              .agent      which adapter in agents/
              .model      handed to the adapter; null = that CLI's own default
              .weight     relative odds, > 0
              .adapter    overrides merged over adapters.<agent> for this slot
              .enabled    false sits the slot out without deleting it
```

`avoidRepeat` reads yesterday off `journal/index.json`:

- `"hard"` (default) — yesterday's agent is ordered behind every other agent,
  and yesterday's exact slot behind its siblings. **With exactly two agents
  installed this is a strict alternation**, and the weights then only choose
  which slot of the chosen agent runs.
- `"soft"` — nothing is excluded, only damped by `repeatPenalty`, so the draw
  stays genuinely random and a repeat day is possible.
- `false` — a pure weighted draw with no memory.

No mode can stall: every enabled slot always stays in the order.

The pick is recorded in `run.json` (`runner.roster`) and in the day's
`journal/index.json` row (`rosterId`), which is how tomorrow's draw knows what
ran today. **A resumed day keeps its agent**: `--from`, or a second call after a
crash, re-reads the slot out of `run.json` instead of drawing again, so the
phases of one day never disagree about who wrote them. `--agent <name>`,
`--roster <id>` and `--model` always win over the draw.

Two slot knobs are worth knowing, because both fail *silently* if you get them
wrong by hand:

- **claude `ultracode: true`** — there is no `--ultracode` flag; it is a session
  setting that rides in `--settings`, and it needs `xhigh`. An explicit
  `--effort high` alongside it turns ultracode back off with no warning, so the
  adapter forces the effort up and writes the settings it actually used to
  `journal/<date>/logs/claude.settings.effective.json`.
- **codex `reasoningEffort`** — `low · medium · high · xhigh · max · ultra`
  (`ultra` is "maximum reasoning with automatic task delegation"). Each codex
  model carries its own default and some ship at `low`, so a slot that wants
  depth has to say so.

## The operator note

`--context "<text>"` (or `--context-file <path>`, `ONE_A_DAY_CONTEXT`,
`ONE_A_DAY_CONTEXT_FILE`) appends one message from whoever started the run to
**every** phase prompt, and keeps it in the journal as
`journal/<date>/context.md`. Use it to steer a day — a theme to chase, a pack to
prefer, something yesterday got wrong. It never overrides `AGENTS.md` or the
hard rules, and the gate does not know it exists.

**Preflight** (runner, deterministic): on `main`, clean tree, `git pull --ff-only`,
`npm ci` if the lockfile moved, `m0saic versions` sees ffmpeg, `m0saic license`
is paid, `npm run verify` green on the untouched tree. Any failure = no run.

**Phases** (`config.json`): each is one fresh agent call with
`prompts/_preamble.md` + `prompts/<phase>.md`; the agent marks itself done in
`journal/<date>/state.json`; the runner re-calls up to `maxCalls` times inside
`timeoutMin` each, and the whole day inside `dayTimeoutMin`. `ship` runs only
when the critique set `decision=ship`.

**Trace** (`lib/trace.mjs`): after every phase call the runner merges the
adapter's record — tool calls with tool, target and timing, tokens, cost as
the CLI reported it (Claude Code) or estimated from `config.json` `pricing`
(dated; edit it to the list prices of the day) — into
`journal/<date>/trace.json`. The ship-phase agent copies it into the
template's `WHY.timeline` (`node pipeline/lib/trace.mjs --timeline
journal/<date>/trace.json`), the last page of its why-tutorial.

**Gate** (`lib/gate.mjs`, deterministic):

1. Scope guard — only today's allowed paths may differ from HEAD
   (`lib/git.mjs` `classifyChanges`). Anything else is reverted and the day fails.
2. No-ship day — everything but the journal is reverted.
3. `npm run verify`, `tools/check-freeze.mjs`, `m0saic doctor . --json` ok.
4. Exactly one new `src/<pack>/<slug>/vN/` (never in `src/harness/`); it is in the manifest; only its
   preview assets were touched; `--validate-only` exits 0 (3 = error mosaic);
   `--tutorial --validate-only` exits 0 (the why-tutorial renders);
   `preview.png` is real; `50-ship.md` exists.
5. `tools/check-freeze.mjs --update --tag <date>` freezes the new folder.
6. One commit `day NNN: <id> — <title>` with `Agent:` / `Model:` trailers; push.

## Environment

| Variable | Purpose |
|---|---|
| `ONE_A_DAY_AGENT` | `claude` \| `codex` \| `kimi` \| `fake` \| `random` (default `config.json`) |
| `ONE_A_DAY_ROSTER` | pin one roster slot by id; beats `ONE_A_DAY_AGENT` |
| `ONE_A_DAY_MODEL` | model name handed to the adapter (recorded as `runner.modelFlag`) |
| `ONE_A_DAY_CONTEXT` | an operator note appended to every phase prompt |
| `ONE_A_DAY_CONTEXT_FILE` | the same, read from a file (repo-relative or absolute) |
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

## Maintenance commits — `npm run submit`

Work ON the repo (conventions, pipeline, harness, docs) by a human or an
agent the human is driving ends with one command:

```
npm run submit -- "<one-line summary>" [--agent claude --model claude-opus-5] [--refreeze] [--e2e] [--push]
```

The ritual runs in order and stops before git on any failure: the branch and
a non-empty tree; the freeze (unchanged, or `--refreeze` re-mints
`frozen.manifest.json` and the commit names the re-frozen files — a shipped
template never changes on `main`, so this is for pre-publication work or a
deliberate human act); `npm run verify`; `m0saic doctor . --json`; `--e2e`
for the fake day in all three modes. Then one commit in the day commits'
shape:

```
maintain <date>: <summary>

Areas: <folders touched (file counts)>
Re-frozen: <shipped files whose hash moved against HEAD>   (only with --refreeze)
Frozen: <files frozen for the first time>

Ritual: verify ok - doctor ok (<n> rendered, <w> warnings) - freeze <n> files @ <tag> - e2e <ok|skipped>
Agent: <name>
Model: <name> (self-declared)
```

A daily run never calls it (it refuses when `ONE_A_DAY_DAY_DIR` is set); the
runner's gate is the day's commit.
