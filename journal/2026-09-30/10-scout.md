# Scout - 2026-09-30

## Candidates (4, best first)

### 1. Homebrew serving cards from recipe exports

- Who: Homebrewers in the American Homebrewers Association forum and Homebrew Talk who bring bottles or kegs to club meetings and tasting events.
- The construct: A named beer recipe and its brewed batch. Brewfather exports BeerXML and recipe JSON; BeerXML carries `NAME`, nested `STYLE.NAME`, and `BREWER`, with optional `ABV` and `EST_ABV` display extensions. These are recognizable brewing fields, not invented social-media metadata.
- The recurring need: Make a fresh serving label when a beer goes on tap or travels to a meeting. The observed workflow changes the same name, style, and alcohol percentage in a design template, then prints, cuts, and attaches the labels to reusable tags.
- Evidence:
  - [AHA: Share your labels](https://forum.homebrewersassociation.org/t/share-your-labels/40286) - On January 22, 2026, BrewBama describes repeatedly changing name, style, and ABV in Canva, then attaching the results to keg, event-serving, and club-meeting bottle tags. The same post notes that richer artwork consumes more ink. This is firsthand workflow evidence, not an explicit request for a new tool.
  - [Brewfather: Recipe designer](https://docs.brewfather.app/recipes/designer) - The export menu offers BeerXML and Brewfather recipe JSON, establishing an existing structured input rather than requiring brewers to maintain another database.
  - [BeerXML 1.0 specification](https://www.beerxml.com/beerxml.htm) - Defines recipe name, style, brewer, and the distinction between `EST_ABV` (recipe estimate) and `ABV` (calculated from measured original and final gravity). Both alcohol fields are optional extensions.
  - [Homebrew Talk: Creating Tap Handle Labels](https://homebrewtalk.com/threads/creating-tap-handle-labels.296516/) - A January 2012 author asks for help making labels without image-editing experience; replies describe custom-size PowerPoint slides and reused label templates. Older corroboration of the manual workflow, not evidence of current software availability.
- Why m0saic fits: One still card needs a name band, a style line, and a prominent percentage block on a mostly white background. A small set of props mapped from the export can make the next batch's card without moving text manually. Synthetic recipe defaults need no downloaded artwork, and the same geometry can reflow for landscape, portrait, and square. The smallest useful demo is one card; recipe import and multi-label print sheets can be later tooling.
- Risks: The best firsthand source shows a workable Canva solution, so the opportunity is repeatable data-to-image rendering, not an unserved market. Recipe estimates must not silently become measured-batch values: label estimated ABV explicitly, and never turn a missing value into zero. A PNG alone does not establish physical print size or sheet alignment. Artwork-heavy bottle branding would expand this into taste-driven design; keep today's scope to serving information.

### 2. ADIF contact-to-QSL confirmation cards

- Who: Amateur radio operators exchanging contact confirmations, including users of DXLab and YFKlog.
- The construct: One QSO record in an ADIF `.adi` log export: `STATION_CALLSIGN`, `CALL`, `QSO_DATE`, `TIME_ON`, `BAND` or `FREQ`, `MODE`, and `RST_SENT`.
- The recurring need: Make a card for each contact selected for confirmation. The documented DXLab workflow accumulates requested and needed confirmations and prints them in batches, with a weekly cycle as its example.
- Evidence:
  - [DXLab: QSLing](https://www.dxlabsuite.com/dxlabwiki/QSLing) - Explicitly describes card QSLing as a batch operation and documents both printing and filling cards by hand.
  - [YFKlog manual](https://fkurz.net/ham/yfklog/doc/) - Describes a card-writing queue and an Export QSL ADIF option for external label or card software; the input-to-media handoff already exists.
  - [ADIF 3.1.7 specification](https://adif.org/317/ADIF_317.htm) - Defines the contact fields, UTC time, station callsign, and sent signal report. These semantics constrain what the card should say.
  - [LU2EXV QSL Card Generator](https://igonzalezb.github.io/QSL-Card-Generator/) - Already imports ADIF and produces cards in bulk; concrete evidence of demand and substantial direct competition.
- Why m0saic fits: Large callsigns above a fixed contact-details table are straightforward rectangles. A record-shaped props object can produce a deterministic card for every selected QSO, with text-only defaults and an optional user-owned station image later.
- Risks: Existing generators already automate this exact workflow. Portable callsigns, UTC, and sent-versus-received reports must remain correct. Rendering a card must not imply it updates a log, sends a confirmation, or earns award credit. Full ADIF import and print production exceed the smallest demo.

### 3. Warhammer army-list overview images

- Who: Warhammer players sharing list proposals with their gaming groups and in r/Warhammer40k.
- The construct: An army roster: faction, detachment, units, model counts, and points. Battle Forge exports lists; ArmyDrop also saves and loads its own list files. These are distinct artifacts, not a universal roster schema.
- The recurring need: Publish a compact overview whenever a player revises a list or prepares for a game, instead of assembling unit blocks in an image editor.
- Evidence:
  - [ArmyDrop creator's v3 release thread](https://www.reddit.com/r/Warhammer40k/comments/1q0cdmh/armydrop_v3_visual_army_list_builder_update/) - Describes visual lists previously assembled in Paint or Photoshop and adds grouped point totals, detachment labels, and image exports. The creator's account is partly product promotion, but explicitly names the manual practice.
  - [Warhammer Community: Battle Forge introduction](https://www.warhammer-community.com/en-gb/articles/hcTX6nh9/download-the-all-new-warhammer-40000-app-for-free/) - Documents exporting army lists to share with friends or submit before events; establishes the recurring roster artifact.
  - [ArmyDrop](https://armydrop.com/) - The opened interface offers JPG and text exports, list-file save/load, and custom units with name, model count, points, and image. It currently warns that its points and lists support 10th Edition.
- Why m0saic fits: Grouped unit tiles, count badges, and point totals map directly to cells. A small roster supplied as props could become a consistent overview, while supplied points avoid embedding a changing game database.
- Risks: ArmyDrop already serves the visual result well. Much of its appeal comes from unit artwork that this repo cannot download and bundle. Long lists, wargear, and leader relationships can become illegible; a compact overview cannot substitute for the full tournament roster. Edition-dependent data increases maintenance risk.

### 4. csTimer average-of-five practice cards

- Who: Cubers posting training progress and asking for feedback in the SpeedSolving Cubing Progression forum.
- The construct: Five independent solves selected from a csTimer session. Its CSV export includes `No.`, `Time`, `Comment`, `Scramble`, and `Date`; solve records also carry penalty information.
- The recurring need: Share a notable practice round with the average and the underlying attempts. The observed practice is posting timer screenshots during an ongoing progress thread.
- Evidence:
  - [SpeedSolving: getting back into cubing](https://www.speedsolving.com/threads/getting-back-into-cubing.91367/post-1570178) - A November 2023 update shares an average-of-five screenshot, another member asks about the previous average, and later updates continue sharing results. This establishes repeated sharing, but not a complaint about formatting.
  - [csTimer official documentation](https://www.cstimer.net/) - Documents sessions, average statistics, solve metadata, and OK, +2, and DNF states.
  - [csTimer exporter source](https://github.com/cs0x7f/cstimer/blob/master/src/js/stats/stats.js) - `exportCSV` gives the field names above and supports exporting a selected round; a proposed adapter can follow the actual artifact.
  - [Kuebiko Cubing](https://www.kuebiko-cubing.com/) - Accepts csTimer export files and describes three counting solves for an average of five, confirming both an existing downstream workflow and competing statistics tools.
- Why m0saic fits: Five numbered cells can show all attempts, visibly mark the trimmed extremes, and emphasize the three counting solves beside the aggregate. This differs from the shipped speedrun recap: independent trials and a trimmed average, rather than segments within one run and deltas against a previous PB.
- Risks: The direct unmet formatting need is weaker than the top candidates. Penalties, ties, DNF, and rounding require careful handling. An attractive card adds presentation, while the existing timer already supplies the useful statistics.

## Pick

**Homebrew serving cards from recipe exports** - It has the clearest current firsthand account of repeatedly editing the same three fields for a real media artifact, and those fields already exist in a shared brewing format. It wins today on a small, recognizable demo with no required artwork, a practical low-ink design cue, and a fresh use case in this repo; QSL and army-list generation have closer dedicated competitors, while the cubing formatting need is less directly evidenced.

The handoff to planning is one reusable serving-information PNG with recipe name, style, and honestly labeled ABV; optional brewer credit is enough additional context. Treat mapping exported recipe fields to props as the demo boundary, not a claim that an XML importer, printer workflow, or batch-log integration already exists.

## Rejected today

- ADIF QSL cards: Strong artifact and batching evidence; dedicated generators already cover the exact conversion, making today's incremental value less clear.
- Army-list overview: Good manual-work evidence, but existing exports and dependence on unit artwork weaken a small asset-free demo.
- csTimer Ao5 card: A distinct aggregate from the prior speedrun template, but the evidence supports sharing more strongly than a need for another graphics tool.
- Chess PGN replay: [Lichess's forum](https://lichess.org/forum/lichess-feedback/suggestion-option-to-generate-gif-animation) answers a request with native GIF sharing, and [ChessMotion](https://chessmotion.com/how-it-works) already offers PGN-to-MP4/GIF. Move parsing and piece rendering add work without a clear missing presentation feature.
- Prior-day subjects: `journal/index.json` already records OG cards, benchmark deltas, testimonials, talk timers, app-store frames, audiograms, speedrun PBs, powerlifting meets, bird-walk sightings, and solved crossword grids. None is today's pick.

## Research record

Read the day's existing `run.json`, the repository contract, `journal/index.json`, the research-helper guidance, and the installed knowledge-base entry points. No `state.json` or earlier phase output existed when this scout started. Research was split across homebrewing, radio, wargaming, cubing, and chess; candidate ranking and demo boundaries above are judgments, not claims from the sources.

Representative executed searches, including more than six queries across multiple communities:

| Community | Queries |
| --- | --- |
| Homebrewing | `homebrew forum recipe share image beerxml recipe card label generator`; `homebrew keg tap list recipe export beerxml card generator`; `site:homebrewtalk.com "tap" "Powerpoint"`; `site:homebrewtalk.com "tap" "labels" "template"` |
| Wargaming | `Warhammer army list image export share roster card forum` |
| Amateur radio | `ham radio ADIF QSL card generator batch cards request`; `POTA activation recap log graphic share QSOs card`; `ham radio "QSL" "manual" "cards" "ADIF"` |
| Cubing | `site.reddit.com/r/Cubers cstimer share session stats screenshot`; `site.speedsolving.com cstimer session statistics sharing screenshot`; `site.speedsolving.com "cstimer" "share" "stats"` |
| Chess | `site.chess.com forum PGN gif share game animation` |

Every linked web page above was successfully opened. Some Reddit results failed on open and were excluded; the ArmyDrop release thread was readable. AHA's individual-post URL also failed, so its citation uses the successfully opened full thread. No downloaded media, template changes, or builds were needed for this phase.
