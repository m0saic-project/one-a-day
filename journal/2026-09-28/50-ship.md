# Ship - 2026-09-28

## @one-a-day/events/bird-walk-sightings/v1 - Bird Walk Sightings

A dated sightings sheet for the visitors of a sanctuary, from one outing's
checklist: the location, the date, the local start time and the number of
observers, then the birds as name and count, eight to a page, and a footer
that says where the rows came from, which page this is and what `X` means.
For the naturalists and walk leaders who record each outing in eBird and
want something better to pin up than a printed web page. The input is the
outing's rows (`commonName`, `count` as a number or `"X"`) in the order the
checklist has them, which the caller takes from the eBird spreadsheet
export. The template keeps every row as given: it does not sort, merge,
total, or turn an `X` into a number. Variant a shipped, the only variant
(critique: 14/18).

## Render it

```
m0saic make @one-a-day/events/bird-walk-sightings/v1 --template-repo . -w 1080 -h 1920 -o sightings.png
```

Props worth trying: `--props @journal/2026-09-28/example-page-2.json` (nine
fictional entries, page 2: one bird, `Page 2 of 2`, `Entries 9-9 of 9`);
`--props '{"page":1,"rows":[...]}'` with all the rows of one outing, then
the same props with `"page":2` and so on, until the footer says the last
page; `-w 1080 -h 1080` (the same eight, tighter); `-w 1920 -h 1080` (two
columns of four, read down the left, then the right);
`--props '{"sourceLabel":"eBird checklist S123456789"}'`.

Why it exists (the tutorial):
`m0saic make @one-a-day/events/bird-walk-sightings/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4`

## How this day shipped

Twice. At 09:00 the scheduled runner drew `codex-astra` (Codex, gpt-6-astra).
The agent scouted, planned, and built the template: build gates clean, 52
tests of its own passing. Then every render failed, four attempts over
three build calls, with the same line:

```
Failed to resolve source masks: EPERM: operation not permitted, open
C:\Users\MainDesktop\m0saic\cache\masks\mask-bc4529258f520562.png
```

The agent did what AGENTS.md told it to: it waited and retried, it did not
redirect `M0SAIC_ROOT`, it wrote the blocker into `30-build.md` and left the
build phase unset. The runner ran out of build calls and closed the day as
no-ship (`672085d`), reverting the source.

The error was not transient. The runner starts Codex with `-s
workspace-write`; on this machine that sandbox runs commands as a member of
`CodexSandboxUsers`, which may modify the repo and only read `~/m0saic`. A
render needs to write a mask only when the cache does not already hold it,
and a new template's geometry is new. So a Codex day can render yesterday's
templates and not its own. Days 3 and 5, the other two Codex days, met the
same line.

At 12:10 the founder asked why the day had not shipped, then asked for it to
be shipped. The maintainer's session (Claude Code, `claude-fable-5-1`):

1. Corrected the sentence in AGENTS.md that called the error transient
   (`maintain 2026-09-28`, `699a10d`).
2. Rebuilt the agent's source. No render had succeeded, so no snapshot of it
   existed; the only copy was the commands the agent ran, in
   `logs/build-1.jsonl`. `logs/restore-source.mjs` decodes them and replays
   the ones that wrote under `src/`, in order, after the same scaffold
   command. Nothing was re-typed. `logs/restore/compare-gates.mjs` then ran
   the registry, layout and why gates and found all three reports identical
   to the agent's last ones (`registry-final.json`, `layout-final.json`,
   `why-final.json`); the agent's 52 tests pass.
3. Rendered it, outside the sandbox, with nothing changed: exit 0 on every
   canvas and the tutorial, 53 seconds.
4. Judged it (`40-critique.md`) and ran the ship steps.

**Whose work is what.** The scout, the brief, the template, its test and the
words of the tutorial are the agent's. The renders, the critique, this note
and the cost audit are the maintainer's. One thing in the template file was
changed after the agent: `WHY.timeline`, which the ship step copies from the
runner's trace (the agent's scaffold held scout and plan only; it now holds
all five calls). `variants/a/src/` is the shipped source.

**Not done here.** The cache permission itself. The session's attempt to
grant `CodexSandboxUsers` write access to `~/m0saic/cache` was refused by
Claude Code's permission classifier as a security change, which is a fair
call for a session to be refused; it is the machine owner's to run. Until
it is granted, the next Codex day will stop at the same line, and will now
say so after one retry instead of four.

## Verified before the gate
- `npm run build && npm run previews && npm run build && npm run
  fingerprints:update && npm run verify`: green (logs in `logs/restore/`).
  Layout fingerprints 11 unchanged; no warning for this template.
- `m0saic doctor . --json`: ok, 11 rendered, 1 warning (the audiogram's
  recorded overlayDepth posture, not today's).
- `--tutorial --validate-only`: exit 0, 59 s, six pages.
- Variant a re-rendered from the final source: `report.json` ok, not
  degraded, 3 renders, 9 stills; `variants/a/src/` identical to
  `src/events/bird-walk-sightings/v1/`.
- `preview.png` 118 KB: the landscape sheet at its defaults.
- Five more stills through the CLI, the ones the brief's rubric asks to be
  looked at (`variants/a/stills/extra-*.png`): the defaults and the stressed
  copy at 480x270, the stressed copy at portrait and landscape, page 2 of a
  nine entry outing.

## Tokens and dollars
Two bills, both API-equivalent estimates at list prices checked today, not
invoices (`60-token-costs.md`, `token-costs.json`, `token-cost-audit.mjs`).

- The agent's run: 5.0M tokens, **$10.14** at gpt-6-astra's published rates
  ($10 input, $1 cached input, $50 output per million).
- The restore session: in `60-token-costs.md`, measured from the session
  transcript through the last step before the gate; the closing total is in
  the session's last message to the founder.

The tutorial's last page says 9.6M tokens and gives no dollars. Both come
from the runner: `pipeline/lib/trace.mjs` adds Codex's cached input to an
input figure that already includes it, and `pipeline/config.json` has no
price row for gpt-6-astra. The card has to agree with `trace.json`, so it
carries the runner's numbers; the audit carries the corrected ones.

## Weak spots (honest; a human polish pass starts here)
- **Eight to a page against a complaint about paper.** A thirty species
  walk is four sheets. Legible on a noticeboard, and the brief's choice, but
  the person in the thread wanted less paper.
- **No way in from the file.** `rows` is JSON the caller builds from the
  export by hand. The naturalist has a spreadsheet.
- **The quote was not re-checked.** The problem page quotes the Reddit
  thread. The scout's log shows it opened the URL; the page text is not in
  the log, and Reddit answers the maintainer's session with 403.
- **Landscape gutter.** 43 px between the columns at 1920x1080 puts the
  left column's counts beside the right column's names.
- **Half the height, measured generously.** At 480x270 the eight entries
  get 45% of the usable height; the test counts the column-label row to
  reach the brief's half.
- **Tight rows.** A three line name sits almost on its separator; the last
  row's rule and the footer rule read as a double line.
- **The usage command on the tutorial writes into `journal/2026-09-28/`.**
- **Page 6 is the agent's run, not the whole day,** and its token figure is
  the runner's (see above). The restore is in this note, `run.json`,
  `state.json` and `git log`, not on the card.
- **One variant.** The brief's row-tracking and monochrome alternatives were
  never built, so the ruled paper won by default.
- ASCII only, 48 characters a name: a bird with an accent in its name
  (or a location) is refused.

## Follow-ups (what v2 would do)
- `rowsPerPage` (8, 16, 24) with type that steps down, so a walk is one or
  two sheets.
- `csv` + `submissionId`: the export as the input, as day 008 did with the
  OpenPowerlifting row.
- A wider gutter or a vertical rule in landscape; a little air under a
  three line name.
- The two alternatives the brief named, now that there is a picture to
  compare them with.

## For a maintainer's polish pass (humans only - these files are protected)
- **The cache grant.** Give the Codex sandbox write access to
  `~/m0saic/cache` and nothing else under `~/m0saic` (the license and the
  trust file stay read-only), then render a never-cached template from
  inside the sandbox to prove it.
- **A preflight probe.** The runner could try one write to the mask cache
  as the drawn agent's sandbox before spending a scout and a plan on a day
  that cannot render, and draw the next slot if it fails.
- `pipeline/lib/trace.mjs`: for Codex, input is `input_tokens -
  cached_input_tokens`. Today it counts cached input twice on every Codex
  day's card.
- `pipeline/config.json` `pricing`: rows for gpt-6-astra and the gpt-5.6
  models, so a Codex day's card has dollars.
- A no-ship day whose renders all failed leaves no source snapshot
  (`render-variant` takes it after the render). Taking it before would have
  made this restore a copy.
- `token-cost-audit.mjs` has now been copied by hand three days running.
