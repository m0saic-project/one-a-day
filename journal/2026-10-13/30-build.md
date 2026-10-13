# Build — 2026-10-13

## Variant a (the card that shipped)

`@one-a-day/gaming/vatsim-monthly-log/v1`, scaffolded with `npm run new`
into the existing `gaming` pack. One variant: the brief's strip-line (b) and
paper (c) ideas are paletta/layout swaps of the same geometry; the render
time went into the fit instead.

What it draws: header (pilot left in ink, the month right in accent, the
airline dim under it), an accent head rule, four computed stat tiles, the
month's PIREPs as a seven-column operations log, and a career-milestone bar
between the rows and the footnote. `normalizeVatsimLog` parses the row
grammar and derives everything the card prints: count, hours, longest (with
its sector), average touchdown (skipping `--`), career total, next hundred,
hours to go, fill fraction. The test recomputes them independently.

## What cost real time

1. **Row/caption collision (caught from the stills, not the gate).** The
   first landscape render put the milestone caption ON TOP of row 10: the
   row band was reserved as `H - m - 0.13S` while the milestone block
   (caption + gap + bar + gap) needs about `0.10S` above the bar. Fixed by
   deriving the band bottom FROM the milestone block: `barY`, `capTop`,
   `bandBottom` computed upward from the footer, rows spread under it. The
   lesson: `check-layout` sweeps text-in-box, but two stacked blocks can
   each be internally tidy and still collide; the still is the test.
2. **Head size vs row size.** Column heads were fitted per label, so
   "DATE" drew large and "SCORE" small while all rows shared one size —
   the table read as two different type scales on square and portrait.
   `rowPx` already folds every head's fit into its min; heads now draw at
   `rowPx` too. One size for the whole table, now actually enforced.
3. **The 480x270 thumbnail.** With the derived band the ten rows get
   `pitch 9, cellH 8` at `480x270` — the table floor had to be the
   `small` rule (5px), which it now is (`rowPx >= small` or refuse). The
   whole card stays a proportional thumbnail down to 270; there is no
   pixel floor in the sizes themselves.
4. **Grammar before geometry.** The row regexes (7 fields, `H:MM` block,
   negative fpm or `--`, 1-12-char designator allowing the real
   `DL1701/C.PF` shape) run before any measuring, so the worst case a
   fitter must swallow is bounded — that is what lets one shared cell size
   survive all seven canvases without the radio-chart ladder.

## Notes

- `npm run new` title-cases the `--title` argument ("Vatsim"); the label,
  registry title and WHY title were hand-set to "VATSIM Monthly Log".
- No `trace.json` today: manual day in one session, timeline is
  self-reported, same as days 021-023.
- Machine note for the humans who own `pipeline/`: `node
  pipeline/run.mjs --agent random` could not start the day on this machine
  today — `agents/opencode.mjs` `available()` probes the legacy
  `~/.local/share/opencode/auth.json`, which holds nothing since
  OpenCode moved credentials into its account DB (the console account and
  its refresh token are live in `opencode.db`; `opencode run` authenticates
  from there fine). Every slot drew "unavailable" and the runner exited
  before preflight. The adapter's login check needs to learn the new
  location; until then scheduled days on this box die at the draw.
  (Not touched by today's day — `pipeline/` is human territory.)
