# one-a-day

**One m0saic template a day, written by an AI agent, built in public.**

Every day an agent run — Claude Code some days, Codex or Kimi on others — does
the same five things in this repo and pushes the result to `main`:

1. **Scout** the web (Hacker News, Reddit, wherever the complaints are) for a
   recurring media workflow that a deterministic template could serve.
2. **Plan** a media solution: canvas, props, beats, the acceptance rubric.
3. **Build** the template as a [m0saic](https://m0saic.io) template, with up to
   three variants, each rendered and snapshotted.
4. **Critique** the variants adversarially and pick one, or none.
5. **Ship** it: previews, verification, one commit.

Then a deterministic gate — no model involved — verifies the tree, checks that
exactly one new template appeared, that it renders without an error mosaic,
freezes it, and pushes. Some days ship nothing. Every day leaves a
[`journal/`](journal/) entry saying what happened and why, including the
variants that lost.

Nobody codes in this repo by hand. It exists to show that m0saic can be
**operated agentically and used deterministically**: an agent writes the
template, and after that the same `(template id, props)` renders the same
pixels on the pinned toolchain, forever. A template that turns out good gets
polished by a human elsewhere and promoted to the official community library;
this repo stays what it is.

## Use the templates

This is a **third-party** template repo: namespace `@one-a-day`, unsigned,
shown as `3P` in Mosaic Desktop. Loading it runs its code on your machine, as
with any template repo — read [the trust note](#trust) first.

**Mosaic Desktop.** Templates → **Add source** → paste
`https://github.com/m0saic-project/one-a-day` → consent. Desktop installs the
repo pinned at that day's commit. To pick up a new day, use **Update now** on
the source, or turn on **Follow upstream** (an explicit opt-in, with a warning
that says what it means). Until the Desktop build with GitHub sources ships:
clone, Add source → the folder, `git pull` + **Refresh repos** each day.

**CLI.**

```
git clone https://github.com/m0saic-project/one-a-day
m0saic list-templates --template-repo ./one-a-day --json
m0saic make @one-a-day/<pack>/<slug>/v1 --template-repo ./one-a-day -w 1920 -h 1080 -o out.mp4
```

`dist/`, `template-manifest.json` and the preview assets are committed, so a
clone loads with no build step. Each day's `journal/<date>/50-ship.md` has the
render one-liner and the props worth trying.

Titles carry the day (`2026-09-20 · OG Card`) and every template is tagged
with its date and its day number, so sorting the grid by name or by tag in
Mosaic Desktop reads as a calendar, and a date finds the template.

**Every template explains itself.** Its tutorial — the "?" pill on the Make
page in Mosaic Desktop, or on the CLI:

```
m0saic make @one-a-day/<pack>/<slug>/v1 --template-repo ./one-a-day --tutorial -w 1280 -h 720 -o why.mp4
```

is six pages: the run (day, date, which agent and which model it said it
was), the problem that was observed and the online sources the agent opened,
the solution this template attempts, how to use it, the template itself at
its defaults, and how the day was made — the run's phases as a waterfall
with tool calls, tokens and dollars (as the agent CLI reported them, or
estimated at the dated list prices in `pipeline/config.json`). The words and
the numbers are frozen into the template file with the code.

## The journal

[`journal/index.json`](journal/index.json) is the table of contents: one row
per day with the use case, the template id (or `null`), which agent ran and
which model it said it was. Each `journal/YYYY-MM-DD/` folder holds the
scout notes with sources, the brief, the build log, the critique with scores,
the ship note, and every variant's source and stills. Losing variants are kept
on purpose: the decision is the interesting part.

The model name in `run.json` is **self-declared** by the agent. A human may
add `model.corrected`. Commit trailers (`Agent:` / `Model:`) print the
self-declared value.

## Trust

- This repo is not reviewed by a person before it ships. The gate is code.
- It is not part of m0saic's official community library and carries no
  signature. Mosaic Desktop labels it third-party, and any repo like it.
- If this repo's `main` were ever compromised, whatever was pushed would reach
  anyone who follows upstream on their next refresh. That is why Desktop pins
  a GitHub source at the commit you added it at and makes following upstream
  an explicit choice. Decide for yourself whether an agent-run channel is
  something you want auto-updating on your machine.
- Loading any template repo executes its code. Look at `src/` — it is the whole
  story; `dist/` is its build.

## Run it yourself

The pipeline is agent-agnostic and lives in [`pipeline/`](pipeline/README.md).
Point it at your own coding-agent CLI, set the environment (`M0SAIC_PRODUCT_KEY`
for clean previews, `ONE_A_DAY_AGENT`), and run one day:

```
npm install
node pipeline/run.mjs --no-push
```

`pipeline/schedule/` has the launchd and Task Scheduler files for a dedicated
machine. [`AGENTS.md`](AGENTS.md) is the contract the agent works under.

## License

MIT. The templates are built with the `@m0saic/*` substrate from npm; see
[`NOTICE.md`](NOTICE.md).
