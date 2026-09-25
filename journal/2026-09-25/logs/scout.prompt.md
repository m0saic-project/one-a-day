# one-a-day — 2026-09-25 — phase: scout

You are the coding agent running one phase of today's **one-a-day** run, in the
repo at `C:\src\m0saic-production\one-a-day`. Nobody is watching. Nobody can answer a question. You have
one job this call, stated under "Your task" below, and you finish it by writing
files. Then you stop.

## Files are your only memory

Every earlier phase today left its result in `journal/2026-09-25/`. Read what is
there before you do anything:

- `journal/2026-09-25/state.json` — the phase ledger. A phase is done when its key is
  `"done"`. The critique phase also writes `decision` (`ship` | `no-ship`) and
  `pick` (the variant letter).
- `journal/2026-09-25/run.json` — who is running (the runner fills `runner.*`), and
  `model.selfDeclared`, which YOU fill (below).
- `journal/2026-09-25/10-scout.md`, `20-brief.md`, `30-build.md`, `40-critique.md`,
  `50-ship.md` — the day's story, one file per phase.
- `journal/2026-09-25/variants/<a|b|c>/` — each built variant: `src/` (its code),
  `renders/`, `stills/`, `report.json`.

When your task is complete, set `state.json.scout = "done"` (merge, do not
overwrite other keys) as the LAST thing you do. Never set it early: the runner
re-calls this phase until it sees that key, and a half-written output marked
done ships a half-written day.

## Declare yourself

The runner asked for `claude`. In your FIRST action this phase, write into
`journal/2026-09-25/run.json` the key `model.selfDeclared` with the model you believe
you are (e.g. `claude-fable-5.1`, `gpt-5-codex`, `kimi-k2`), merged into the
existing JSON (keep every other key). If you cannot tell, write `"unknown"`. A
human may later set `model.corrected`; never touch that key.

## Read before you write

`AGENTS.md` at the repo root is the contract for this repo: the loop, the
checklist, the rules that fail silently. The reasoning behind it is in
`node_modules/@m0saic/knowledge/README.md` (start there, then `docs/m0saic-thesis.md`,
then `docs/README.md`, the router). For template work the pages that matter most are
`docs/templates/philosophy-and-contract.md`, `docs/templates/construction-strategy.md`,
`docs/templates/standalone-pack-authoring.md`,
`docs/handbook/feasibility-precision-quantization.md` and `docs/runtime/cli-usage.md`.

## Hard rules (the runner enforces every one of them after you; break one and the day is discarded)

- Never `git commit`, `git push`, `git checkout`, `git reset`, `git tag`, `npm publish`.
  The runner commits exactly once at the end of the day and pushes.
- Never edit `pipeline/`, `tools/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `.github/`,
  `package.json`, `dep-allowlist.json`, `frozen.manifest.json`, or any other day's
  `journal/` folder. Never run `check-freeze --update`.
- Never modify a template folder that already exists at HEAD (`src/<pack>/<slug>/vN/`
  that is not today's). Shipped templates are frozen; a fix is a new `vN+1`.
- Today produces AT MOST ONE new template folder under `src/`. Variants share its
  id and folder; the last variant left in place is what the critic judges last.
- No new dependencies. No downloaded media into the repo. No secrets, no wall-clock
  reads, no `Math.random` in template code.
- Write scratch only under `journal/2026-09-25/` (renders, notes, experiments).
- If something is broken that you cannot fix inside this phase's scope, write what
  you found into this phase's output file and stop WITHOUT marking the phase done.
  A day that ships nothing is fine. A day that ships something wrong is not.

## Writing for the journal

The journal is public and is read by people and by tomorrow's agent. Short
sections, real links, numbers only when they change a decision, honest about
what is weak. Markdown, ASCII quotes, no marketing voice.

---

# Your task


Find today's use case: one recurring **media workflow** somewhere on the web that
a deterministic m0saic template could serve, and that this repo has not done
before.

## What counts

A use case is a group of people who repeatedly need the same kind of picture or
clip made from data or media they already have: a card, a chart clip, a
before/after, a caption reel, a countdown, a changelog video, a lyric video, a
grid of screenshots, a progress bar, a release banner, a badge, a thumbnail.
m0saic is rectangles on a canvas, driven by props, rendered by the CLI with no
GUI — so the best use cases are batchable, repeatable, and visual-but-structured.
Free-form artwork, hand-edited video, and anything that needs a person to nudge
pixels are bad fits.

## Where to look

1. Read `journal/index.json` (root of the repo) — the use cases already done.
   Do not repeat one; a genuinely different angle on a busy area is fine.
2. Your own web search, plus the keyless helpers (each prints JSON):
   - `node pipeline/research/hn.mjs "<query>" --days 60 --n 25` (add `--comments` for comment threads)
   - `node pipeline/research/reddit.mjs r/<sub> --q "<query>" --t month` — subs worth a look:
     r/VideoEditing, r/youtubers, r/NewTubers, r/podcasting, r/smallbusiness, r/marketing,
     r/datavisualization, r/webdev, r/devops, r/musicians, r/WeAreTheMusicMakers,
     r/Teachers, r/socialmedia, r/Twitch, r/streaming, r/ObsidianMD, r/Notion
   - `node pipeline/research/fetch-text.mjs <url>` to read a page or thread
   `pipeline/research/README.md` has query ideas. Spend real time here — at least
   six searches across two or more communities. Follow the complaints: "every week
   I have to…", "is there a tool that…", "how do you all make…".
3. Anything you cite must be a URL you actually opened.

## Output — `journal/2026-09-25/10-scout.md`

```
# Scout — 2026-09-25

## Candidates (3–5, best first)
### 1. <name>
- Who: the audience and where they gather (links)
- The recurring need: what they make, how often, from what inputs
- Evidence: 2–4 links with a one-line quote/paraphrase each
- Why m0saic fits: rectangles / props / batch / deterministic — be concrete
- Risks: what could make this a bad template (needs media we lack, taste-heavy, too many knobs)

### 2. …

## Pick
<the one candidate> — two sentences on why it beat the others today.

## Rejected today
- <name>: <one line>
```

Then, in `state.json`, set `useCase` (one short line), `who` (one line: the
audience and where they gather - it seeds the template's why-tutorial),
`sources` (the URLs you cited for the pick), `tags` (3–6 lowercase words) and
finally `scout: "done"`.
