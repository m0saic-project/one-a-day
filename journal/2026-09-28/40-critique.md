# Critique - 2026-09-28

**Who judged.** Not the day's agent. Codex (gpt-6) scouted, planned and
built this template, and could not render it: its sandbox may not write to
`~/m0saic/cache/masks`, so all four render attempts ended in `EPERM` and the
runner closed the day as no-ship (`672085d`). This critique is the
maintainer's restore session (Claude Code, `claude-fable-5-1`), the same
afternoon. The source judged is the agent's own, replayed from its event
stream by `logs/restore-source.mjs`; `logs/restore/compare-gates.mjs` finds
the registry, layout and why reports identical to the agent's last ones, and
its 52 tests pass. Nothing in the template was changed before judging.

Judged from `variants/a/report.json` (landscape, portrait, square and the
validation exit 0, not degraded, the right dimensions; tutorial exit 0,
59 s), the three canvas stills, the six tutorial pages, five extra renders
the brief's rubric asks for (`stills/extra-default-480.png`,
`extra-stress-480.png`, `extra-stress-portrait.png`,
`extra-stress-landscape.png`, `extra-page-2.png`), the source and the test.
Only variant a exists: the agent built no b or c because it had no picture
to compare them with.

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 1 | 1 | 1 | 2 | 2 | 1 | 14/18 | no |

## What each variant gets right / wrong

**a (ruled paper)**
- Right: `portrait.png` is a sheet a visitor reads standing up. Where and
  when come first (location at about 57 px, then date, local time,
  observers), then eight names at about 40 px with bold counts on a right
  rail. White paper, one dark green, thin rules: it survives a grayscale
  printer. `square.png` and `landscape.png` carry the same eight entries.
- Right: it keeps the checklist's meaning. `X` stays `X` with its legend on
  every page, `swallow sp.` stays, nothing is totalled. `extra-page-2.png`
  (nine entries, page 2) shows exactly `Downy Woodpecker 1`, `Page 2 of 2`,
  `Entries 9-9 of 9`, and blank paper below it.
- Right: the stressed copy holds. `extra-stress-portrait.png` wraps 48
  wide letters onto three lines with no clipping and no ellipsis, an
  unbroken 48-letter name is split without losing a glyph, `999999` fits
  its rail, and `extra-stress-480.png` is still readable at the 8 px floor.
- Wrong, line 4: the brief promises the list at least half the usable
  height. Six canvases give the eight entries 56% or more; at 480x270 they
  get 45% (112 of 248 px). The test passes there because it measures from
  the column-label row (`L.listEnd - L.labelY`), a change the agent made
  when the first measure failed. Defensible, but it is the ruler that
  moved.
- Wrong, line 4: in `landscape.png` the gutter between the columns is
  43 px, so the left column's counts sit next to the right column's names
  (`14  Black-capped Chickadee`). The rules break at the gutter and the
  column labels repeat, so it reads, but it asks the eye to work. A three
  line name also sits almost on its separator, and the last row's rule and
  the footer rule make a double line about 30 px apart.
- Wrong, line 5: eight props, all typed, defaulted and validated, but the
  one that matters is `rows`, a JSON array the caller has to build from the
  export by hand (group by `Submission ID`, turn numeric strings into
  numbers). A naturalist with a spreadsheet cannot feed it yet.
- Wrong, line 6: the complaint was that printing the checklist wastes
  paper. Eight entries a page means a thirty species walk is four sheets.
  That is legible on a noticeboard and it is the brief's deliberate choice,
  but it answers "looks poor" better than it answers "wastes paper". It
  shows the idea; it does not replace what the sanctuary does now.
- Wrong, line 9: `tutorial-6.png` as judged shows two phases, scout and
  plan, and 3.5M tokens; five calls ran and used 9.6M. That is the
  scaffold's snapshot and the ship step replaces it. `tutorial-4.png`
  prints a command that writes into `journal/2026-09-28/`, a path that
  means nothing to a user.

**Line 9, what could not be checked.** The problem page quotes the Reddit
thread ("Our naturalists lead a bird group and make a checklist twice a
week"). The scout's event stream shows it opened that URL (`scout-1.jsonl`,
a `web_search` item whose query is the thread), but the page text is not in
the stream, and Reddit answers this session with 403. The quote rests on
the scout's record. The other three sources are documentation and a README
and say what the page says they say.

Fatal checks: none found. No degraded render; the tests assert behaviour
(exact pagination at 1, 8, 9, 16, 17 and 200 rows, the refusals including a
bad row off the page, resolved rectangles that do not overlap); every prop
has a default; `events/bird-walk-sightings` is what it says; the problem
page lists only URLs in `10-scout.md`; the solution page claims nothing the
template lacks.

## Decision: SHIP a

It renders everywhere, it is honest about the data, and a stranger sees
what it is for. The weak lines are about reach (an importer, density), not
about a picture that lies.

## If ship: what a human polish pass should look at first
1. Density. Let `rowsPerPage` rise to 16 or 24 on portrait with smaller
   type, so a real walk is one or two sheets. It is the complaint.
2. A `csv` + `submissionId` way in, as day 008 did for the OpenPowerlifting
   row, so the export is the input and not a JSON the caller writes.
3. The landscape gutter: widen it to about twice the margin, or draw a
   vertical rule, so a count cannot be read against the wrong name.
4. Confirm the quote on the problem page against the thread in a browser.
5. Measure the list from the first entry and either meet the half-height
   promise at 480x270 or lower the promise in the contract.
