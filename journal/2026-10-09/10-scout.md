# Scout — 2026-10-09

How this was done: seven research agents ran in parallel, one per candidate
niche plus a wildcard. Each was limited to about ten tool calls and allowed to
report only pages it actually opened. I then re-opened the pick's evidence
myself and sent two skeptics to refute it (see `## Pick`). Reddit was not
used because it refuses anonymous clients (pipeline/research/README.md). HN
had nothing for the niche nouns: "GEDCOM" returned only file-repair Show HNs,
and "MoonBoard" and "Kilter board" returned no climbing hits. The evidence
below comes from blogs, official help and spec pages, forums and tool repos.

Four of today's ideas had already been looked at by earlier scouts. They are
listed under `## Rejected today` with that history, so tomorrow's agent can
skip them.

## Candidates (3–5, best first)

### 1. Ancestor birthplace chart (#MyColorfulAncestry) from a GEDCOM
- Who: hobby genealogists and family historians. They share charts in
  Facebook genealogy groups and on genealogy blogs (Randy Seaver's weekly
  "Saturday Night Genealogy Fun" at Genea-Musings, Roberta Estes' DNAeXplained,
  J. Paul Hawthorne's GeneaSpy) and answer Amy Johnson Crow's weekly
  #52Ancestors prompt.
- The construct: the pedigree, with its standard Ahnentafel numbering (1 =
  you, 2n = the father of n, 2n+1 = the mother of n, so 5 generations is 31
  people and 6 is 63). The artifact is the GEDCOM file that every genealogy
  program exports. Each ancestor is an `INDI` record with `NAME` (surname
  between slashes), `BIRT` and `DEAT` events that carry `DATE` and `PLAC`,
  and `FAMC`/`FAMS` links between generations. `PLAC` is "a comma-separated
  list of region names, ordered from smallest to largest", so the last
  element is the country and the one before it is usually the state.
- The recurring need: a pedigree chart in which every ancestor's cell is
  coloured by where they were born, with a legend, posted as an image.
  Today it is made in Excel. You download Hawthorne's or Pat Richley-Erickson's
  spreadsheet, look up each ancestor in your genealogy program, type the
  place into the right cell, colour the cell by hand, and screenshot it.
  People re-make it with other fields (death place, occupation, birth year),
  once per side of the family, and again whenever a new ancestor is found.
- Evidence:
  - https://www.geneamusings.com/2016/03/saturday-night-genealogy-fun-ancestral.html
    \- "create a five or six generation ancestor chart that shows your
    ancestor's birthplaces ... enter text in the cells and then use the
    background and font color features to make it correct and look
    colorful ... Use your genealogy program to figure out which state or
    country your ancestors came from, then enter the data into the correct
    cell. Make an image of your spreadsheet."
  - https://cherylltoneyholley.com/2016/04/01/the-mycolorfulancestry-craze/
    \- "It seems like every genealogist on Facebook posted their version of
    the colorful Excel chart developed by Geneaspy blogger, J Paul
    Hawthorne", followed by her own 5- and 6-generation charts.
  - https://dna-explained.com/2016/03/25/migration-pedigree-chart/ - Estes
    adds birth years and per-column percentages, then a reader asks "Can you
    explain how you color coded?" ("It's just the cell colors in Excel").
    Another commenter wishes "a programmer type could figure out how to do a
    pedigree for any facts captured in a family tree", and Estes replies:
    "The challenge is that the program needs to be in the same location as,
    or have access to, your Gedcom file". A local CLI is exactly that.
  - https://gedcom.io/specifications/FamilySearchGEDCOMv7.html - the field
    definitions: `BIRT` "Entering into life", and `PLAC` as the
    smallest-to-largest region list quoted above.
  - https://www.amyjohnsoncrow.com/52-ancestors-in-52-weeks/ - "a series of
    weekly prompts to get you to think about an ancestor and share something
    about them ... How you share it is up to you ... Yes, I'm doing this
    again in 2025!". This is the recurring weekly moment that keeps
    genealogists posting charts.
- Why m0saic fits: the m0 tree is the pedigree tree. One ancestor
  `P(n)` is a horizontal split of [cell n | P(2n) over P(2n+1)], so a
  5-generation chart is 31 rectangles from five levels of halving. Every
  split is a 1:1 binary split, which stays clear of the 5-smooth trap. The
  colour is a lookup from one parsed field (the last or second-to-last `PLAC`
  element). Unknown ancestors render as grey cells, which is how the Excel
  charts show gaps. The legend is a strip of swatches with counts, or
  percentages per generation as Estes did. Props are one row per Ahnentafel
  number: name, birth year, place, key. No media is needed at all. Batch:
  the same GEDCOM with a different root person gives each sibling or cousin
  their own chart, and switching the coloured field gives the death-place and
  occupation variants.
- Already served, in part (found by the skeptics and re-opened by me):
  - https://dnapainter.com/blog/dna-painter-dimensions-a-new-way-to-showcase-your-ancestral-line/
    \- DNA Painter's automatic "Country of birth" dimension "Uses
    information from 'Birth place' to extract countries", but "since these
    are free text fields, some manual correction may be needed". Free users
    get one dimension. Region and state colouring is a custom dimension
    filled in by hand.
  - https://www.familysearch.org/help/helpcenter/article/how-do-i-use-the-fan-chart-view-in-family-tree
    \- the FamilySearch fan chart can show "Birth Place" for up to 7
    generations, but only for a person in FamilySearch's shared tree, and
    only as a fan.
  - https://help.heredis.com/en/?p=6623 (opened by a skeptic) - Heredis, a
    paid desktop program, colours pedigree boxes by an event's place.
  So colouring by country is now a platform feature. What none of these
  does is the Hawthorne column layout keyed by a field you choose (state,
  county, occupation, death place), rendered locally from your own GEDCOM,
  in a batch of one chart per root person. That gap is narrower than
  "nobody does this", and the brief should say so.
- Risks: the viral peak was March 2016. A skeptic found no 2022-2026 blog
  post reviving the spreadsheet chart. The latest Genea-Musings echo is a
  2020 "7-in-1" chart coloured by birth country
  (https://www.geneamusings.com/2020/09/saturday-night-genealogy-fun-your-7.html),
  and in a 2024 FamilySearch community thread someone asking about
  "geographic ancestry" is pointed to the fan chart. The need is alive but
  the meme is old. Today's recurrence rests on the weekly #52Ancestors
  prompt, new DNA results and new finds, not on a calendar event. Messy `PLAC` strings ("USA" vs "United States", missing
  country, old place names) mean the key should be a prop the user can
  override, not a hard-coded parser. Rendered copy must be ASCII only, so
  names with diacritics (Mueller, Bjoerk) must be folded and the demo data
  should be ASCII. Six generations means 32 cells in one column, which is
  dense at 1080 px, so five generations should be the default. Living people
  in a shared chart raise privacy issues, so the defaults must be fictional.

### 2. Pokemon VGC open team sheet card from a Showdown paste
- Who: competitive Pokemon (VGC) players and coverage sites, on Pokemon
  Showdown, pokepast.es, Pikalytics, Victory Road and the Elite Fourum.
- The construct: the Showdown/PokePaste export text, one block per Pokemon
  (`Species @ Item`, `Ability:`, `EVs:`, `<Nature> Nature`, four `- Move`
  lines), and its "Open Team Sheet" form without EVs, which tournaments
  publish.
- The recurring need: every regional or online event, players submit and
  publish team sheets, and coverage posts the winner's and Top 8 teams as
  images.
- Evidence (opened by the research agent in this run):
  - https://pokepast.es/syntax.html - the paste syntax line by line.
  - https://pikalytics.com/team - "export a team image ... for tournament
    reports, Discord, or social media" (one team at a time, from its own
    builder).
  - https://www.elitefourum.com/t/e4-pokemon-vgc-tournament-generation-4/49672?page=4
    \- organisers require "Upload to PokePaste (Open Team Sheet)" for each
    event.
  - https://victoryroad.pro/ - "Juan Salerno is the Recife Regional
    Champion!" linking to "Teams and results!" (Oct 3-4, 222 Masters).
- Why m0saic fits: a 3 x 2 grid of six panels (moves as four rows, a type
  colour band, EVs as optional bars), with a header strip for player,
  event, placing and record. A batch run would make one card per Top 8
  player from one event.
- Risks: the audience expects sprites, which are Nintendo IP and media we
  lack. Pikalytics already exports a single-team image. Day 019's scout
  listed this candidate and passed on it for the same sprite reason.

### 3. Disc golf round scorecard card from the UDisc rounds CSV
- Who: casual and league disc golfers on UDisc, and league directors in the
  UDisc forum (forum.udisc.com, Leagues).
- The construct: UDisc's "Export to CSV" of your rounds (PlayerName,
  CourseName, LayoutName, Date, Hole1..HoleN, a +/- and a Par row per third
  parties), and the event leaderboard XLSX.
- The recurring need: a card after a personal best or a league night, with
  the holes coloured birdie, par or bogey.
- Evidence (opened by the research agent in this run):
  - https://help.udisc.com/en/articles/10705081-how-can-i-export-my-scorecards-to-a-csv
    \- "tap the hamburger menu ... then Export to CSV".
  - https://forum.udisc.com/t/automated-league-winners-and-payout/441778 -
    a director exports by hand after each round and pastes the data into an
    Excel workbook every Sunday.
  - https://github.com/IsakJacobsson/udisc-stats-analyzer - parses the CSV
    into analytics plots, not shareable cards.
- Why m0saic fits: an 18-cell hole strip (2 x 9), each cell filled by score
  class, plus a total block. One card per CSV row.
- Risks: no opened page shows anyone making or asking for a scorecard
  picture, and the CSV header was confirmed only through third parties. Day
  019's scout already ran the league-week angle as its #2.

### 4. Board climbing grade pyramid or MoonBoard send card from a BoardLib logbook
- Who: indoor board climbers (MoonBoard, Kilter, Tension) and the training
  crowd (Lattice, the Mountain Project forum).
- The construct: the BoardLib logbook CSV (`board, angle, climb_name, date,
  logged_grade, displayed_grade, is_benchmark, tries, is_mirror,
  sessions_count, tries_total, is_repeat, is_ascent, comment`) and the
  MoonBoard's fixed A-K x 1-18 hold grid.
- The recurring need: sharing a send, and checking a grade pyramid
  (e.g. V7 x1, V6 x2, V5 x4, V4 x6, V3 x8) when setting goals.
- Evidence (opened by the research agent in this run):
  - https://github.com/lemeryfertitta/BoardLib - the CSV fields above.
  - https://moonclimbing.com/News/post/ben-moon-moonboard-logbook-by-lattice
    \- Lattice builds grade-distribution charts by hand from Ben Moon's
    logbook.
  - https://touchstoneclimbing.com/building-a-pyramid-for-better-climbing/ -
    a pyramid drawn as a text diagram.
- Why m0saic fits: an 11 x 18 hold grid with start, middle and finish
  marks, or one bar per grade for the pyramid.
- Risks: the logbook has no hold positions (MoonBoard hold data is behind
  a login, and BoardLib says that API is broken for 2016/2024 boards), the
  official apps already draw the holds, and the pyramid is close to day
  019's climbing tick-list candidate.

## Pick
Ancestor birthplace chart from a GEDCOM (candidate 1). It has the best
documented hand-made workflow of the four: the instructions literally say
type each place into a cell, colour it with the toolbar and screenshot the
sheet. It also comes with an explicit wish for a program that reads your
GEDCOM. And it is the purest rectangle fit this repo has scouted: the m0 tree
is the pedigree tree, there is no media, and the defaults can look finished
on their own. Pokemon lost on sprites and disc golf on missing picture
demand.

What the plan phase should carry forward:
- Honest framing. Country colouring exists in DNA Painter and FamilySearch,
  so the demo's case is the recognisable Hawthorne column layout, a colour
  key the user chooses (state is what most of the 2016 US charts used), a
  local GEDCOM, and a batch of one chart per root person or field.
- Props should mirror GEDCOM and Ahnentafel: one row per ancestor number
  (1..31) with name, birth year, place and the colour key, plus an optional
  override map from key to label. Grey cells for unknown ancestors. Five
  generations by default.
- Fictional, ASCII-only demo family. The legend shows a count or percentage
  per key (Estes added percentages per column by hand).

## Research trail
- Research agents (this run, about ten opened pages each) covered genealogy,
  board climbing, disc golf, the FGC Top 8, geocaching, osu! and a wildcard
  sweep (bowling, darts, DCI, Letterboxd, Daylio, flight sim, Pokemon VGC,
  army lists). The wildcard came back with Pokemon VGC.
- I re-opened the pick's sources myself with `pipeline/research/fetch-text.mjs`:
  Genea-Musings 2016, Cheryll Toney Holley 2016, DNAeXplained 2016, the
  GEDCOM 7 spec, the 52 Ancestors page, the DNA Painter blog and the
  FamilySearch help article. The quotes in candidate 1 come from those reads.
- Two skeptics then tried to refute the pick, one arguing "already served"
  and one arguing "dead meme". Both returned "mixed" (details under candidate
  1). The FamilySearch community thread a skeptic read is
  https://community.familysearch.org/en/discussion/comment/578301 (December
  2024: "use the fan chart view and set it to color by birth place").
- HN (`pipeline/research/hn.mjs`, 365 days): "GEDCOM", "family tree chart",
  "Kilter board", "MoonBoard". None of them turned up a media workflow.
- Not opened, so not cited: top8er.com (empty JS page), the Groundspeak
  `cache.xsd` (certificate error), and the osu! API v2 score docs
  (truncated).

## Rejected today
- Fighting-game Top 8 graphic from start.gg standings: Top8er imports
  start.gg, Challonge and tonamel, top8ify does the same, and GitHub has
  about ten per-scene clones. Every one is built around character art we do
  not have. Day 008's scout rejected it for the same reasons.
- Geocaching D/T (Fizzy) and Jasmer grids: https://project-gc.com/w/Finds_tab
  already draws all 81 D/T combinations and the hidden-month calendar, and
  the evidence of need is about tracking, not drawing. Day 010's scout
  rejected it too.
- osu! score thumbnails from the `.osr` replay: https://github.com/xjunko/osr2png
  and https://lookatmysco.re/ already do it, both lean on beatmap background
  art, and the `.osr` lacks title, stars and pp. Day 017's scout rejected it.
- MoonBoard send card on its own (without the pyramid): the official apps
  already draw the holds, and the hold data is not in the logbook export.
