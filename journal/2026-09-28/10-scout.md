# Scout - 2026-09-28

## Candidates (3, best first)

### 1. Bird-walk sightings board from an eBird checklist

- Who: Sanctuary naturalists and bird-walk leaders who record outings in eBird and discuss their workflow in [r/birding](https://www.reddit.com/r/birding/comments/1lflgm2/printing_ebird_checklists/). The audience for the finished picture is their visitors, including people who do not use eBird.
- The construct: One outing's checklist. The existing artifact is the personal eBird spreadsheet export, `MyEBirdData.csv`; rows can be grouped by `Submission ID`. Useful field names already present include `Common Name`, `Count`, `Location`, `Date`, `Time`, and `Number of Observers`. Mirror those concepts in props rather than inventing a generic social-card schema.
- The recurring need: After each guided walk, turn the recorded birds into a legible, dated sightings sheet for a visitor noticeboard. The observed sanctuary does this twice a week. A PNG for printing or a visitor display is the smallest useful demo; a social post is a possible reuse, not the demand established by the source.
- Evidence:
  - [Printing eBird Checklists?](https://www.reddit.com/r/birding/comments/1lflgm2/printing_ebird_checklists/) (June 19, 2025): "Our naturalists lead a bird group and make a checklist twice a week." The author says printing the webpage wastes paper and looks poor, and asks about an Excel export. This is a direct recurring production complaint.
  - [Cornell: Download eBird Data](https://support.ebird.org/en/support/solutions/articles/48000838205-download-ebird-data): The personal-data section documents a spreadsheet export through My eBird. This establishes an input the observer can obtain without building an API integration.
  - [Birdsync's source repository](https://github.com/Sajmani/birdsync): Its README identifies `MyEBirdData.csv` and explicitly maps `Submission ID`, `Common Name`, `Count`, `Location`, and other columns. It independently demonstrates reuse of the same export by a community tool; it does not establish demand for a sightings board.
  - [Cornell: eBird Trip Reports](https://support.ebird.org/en/support/solutions/articles/48001201565): Existing reports combine checklists and media into shareable web pages. It also explains that `X` denotes an observation without a count. Web sharing already has a solution; the observed gap is a compact visitor-facing sheet.
- Why m0saic fits: A location/date header, repeated name-and-count rows, and a source/page footer are real rectangular cells. One normalized checklist payload can produce the same board every time, then another payload produces the next walk's board. No photographs, maps, live data, or pixel nudging are necessary. A light background and strong type suit the printed use case.
- Risks: The direct complaint is one older thread, not proof of widespread unmet demand or willingness to adopt a CLI. Long common names and long checklists are the main layout risk. Preserve `X` with a visible explanation; never convert it to zero or include it in a precise total. Do not call a row count a species total when the input might contain unidentified taxa or subspecies. Do not silently omit rows: use a bounded full-checklist demo, or explicit page selection with page numbering. A raster board demonstrates the idea but is not a PDF printing system. Use clearly fictional default observations and a fictional location; do not copy the author's checklist or fetch bird photos.

### 2. POTA activation band/mode recap from an ADIF log

- Who: Parks on the Air operators using community logging tools, including [POTACAT](https://docs.potacat.com/activator-mode.html) and [Get On The Air](https://getontheair.app/digital_log_utilities.php).
- The construct: A park activation and its logged contacts (QSOs), exported as ADIF. Recognizable inputs include park reference, callsign, QSO date, band, and mode.
- The recurring need: After a park outing, share a compact picture of contacts worked: park/date/callsign, QSO count, and band/mode breakdown. The recurrence is per activation; no evidence here establishes a typical weekly frequency.
- Evidence:
  - [POTACAT Activator Mode](https://docs.potacat.com/activator-mode.html): Documents per-activation ADIF export and a Share Image action that makes a QSO-map picture. This directly establishes the sharing moment and an existing solution.
  - [Get On The Air Digital Log Utilities](https://getontheair.app/digital_log_utilities.php): Accepts ADIF/CSV and offers a 4:5 sharing graphic with band/mode breakdowns and QSO statistics. Its CSV input documents `call`, `qso_date`, `band`, `mode`, and optional park reference.
- Why m0saic fits: Counts and proportional band bars are rectangles; a normalized log summary can deterministically render a card or short reveal clip. A map-free demo needs no callsign geocoding or downloaded basemap.
- Risks: Both opened tools already address this exact media workflow. A card-only implementation offers less than their maps unless batch rendering or a distinctive clip matters to users; that demand was not established. UTC boundaries, duplicate records for multi-park activations, and inconsistent ADIF fields make a trustworthy importer larger than today's demo.

### 3. Cubing practice average card from csTimer session results

- Who: Speedcubers discussing timers and session statistics on the [SpeedSolving forum](https://www.speedsolving.com/threads/what-timer-do-you-use.90989/) and using [csTimer](https://cstimer.net/).
- The construct: A timed solve session: solve times, penalties, averages, and personal bests. csTimer already retains session data and exports it to a local file; the exact export schema would need inspection before promising a native importer.
- The recurring need: Publish a compact five-solve average or practice-session milestone after a session. This is a plausible media extension of the statistics workflow, but the opened sources establish demand for statistics tools more clearly than demand for picture generation.
- Evidence:
  - [What timer do you use?](https://www.speedsolving.com/threads/what-timer-do-you-use.90989/) (September 2023; opened with the repo fetch helper): A member builds a replacement statistics website, asks which timer exports to support, and discusses charts, histograms, and PBs; export compatibility is a concrete difficulty.
  - [csTimer documentation](https://cstimer.net/): Documents session management, current/best single and average times, and OK/+2/DNF status controls. The structured inputs already exist.
  - [csTimer repository](https://github.com/cs0x7f/cstimer): Documents local session storage and file export/import, confirming an offline artifact path.
- Why m0saic fits: Five time cells plus an average headline and explicit penalty/discard markers are a small deterministic composition, with seconds as the unit. Synthetic solves can demonstrate it without solve footage.
- Risks: Existing timer statistics may be enough; evidence of an unmet media need is weaker than birding. Correct handling of +2, DNF, rounding, and excluded solves needs a verified calculation contract. It is also adjacent to day 7's timed-performance PB story, even though the community and artifact differ.

## Pick

**Bird-walk sightings board from an eBird checklist** - it wins because an opened community thread supplies the exact audience, twice-weekly cadence, existing artifact, and failure of the current printed output, while the export documentation makes a small deterministic demo plausible. It is absent from all eight entries in `journal/index.json`, requires no external media, and has a clearer unmet need than the already-served POTA graphics or the inferred cubing card.

Scope for the next phase: a still-first visitor sightings sheet for one outing, using normalized rows from one `Submission ID`, with fictional defaults. The demo should make the export-to-board idea recognizable; full CSV ingestion, account access, taxonomy reconciliation, and a production printing workflow are separate work. The plan should resolve row capacity and overflow explicitly so the card cannot misrepresent a partial list as the whole outing.

## Rejected today

- POTA activation recap: Excellent artifact and sharing habit, but two opened tools already generate the proposed graphics.
- Cubing average card: Good geometry and available data, but weaker evidence for an unmet picture-making task and some overlap with the existing PB theme.
- Speedrun and powerlifting recaps: Already shipped on September 26 and 27; excluded before candidate selection.

## Research trail and limits

Read today's run record, the journal index, root contract, knowledge entry point, thesis/router, and authoring guidance. Today had no state file or earlier phase report. The initial model declaration is `gpt-6`; the runner's more specific requested model remains separately recorded and `model.corrected` was preserved.

Ran 13 web search queries across amateur radio, cubing, and birding. The first six were:

1. `POTA activation summary ADIF share graphics QSO band mode`
2. `site.speedsolving.com cstimer share average image results`
3. `site.community.ebird.org checklist share trip report graphic`
4. `POTA "activation" "graphic" "log"`
5. `site.speedsolving.com "share" "statistics" "cstimer"`
6. `ebird checklist "print" "beautiful" OR "card" OR "report"`

Follow-up searches checked eBird export names/columns, POTA log fields, cubing result posts, and POTACAT's sharing feature. Every evidence URL above was opened and returned readable content. The birding complaint was readable through the web tool despite the runner's general Reddit-access warning. Several other Reddit result posts failed to open and were not used. SpeedSolving's timer thread failed in the web tool but succeeded through `pipeline/research/fetch-text.mjs`; a separate PB thread timed out and was not used. Search snippets alone were not treated as evidence.

No build, rendering, dependency installation, template edit, or contact with a community member was needed for this scout phase.
