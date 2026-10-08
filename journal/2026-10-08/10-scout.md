# Scout — 2026-10-08

Reddit was not reachable (see pipeline/research/README.md), and AstroBin's
forum is a JS app that fetch-text returns as the bare word "AstroBin", so
nothing from AstroBin is cited below. HN had nothing for the niche queries
(disc golf, Showdown, Scrabble, Concept2 all returned 0 hits). Evidence comes
from tool repos, official help pages, forums and observatory pages that I opened.

## Candidates (3-5, best first)

### 1. Astrophotography integration summary from the NINA session CSVs
- Who: deep-sky astrophotographers who run unattended imaging nights with N.I.N.A.
  (Nighttime Imaging 'N' Astronomy) and post the finished image with its
  acquisition numbers. They gather on AstroBin, the NINA Discord and observatory
  gallery pages.
- The construct: integration time per filter. An image is "Ha 128 x 180 s, OIII
  123 x 120 s, SII 105 x 180 s = 15.8 h". The artifact already exists: the NINA
  Session Metadata plugin writes `AcquisitionDetails.csv` (TargetName,
  TelescopeName, FocalLength, FocalRatio, CameraName, PixelSize) once per
  session folder and `ImageMetaData.csv` with one row per light frame
  (ExposureNumber, FilterName, ExposureStartUTC, Duration, Gain, Offset,
  CameraTemp, HFR, ...). Multi-night projects are NIGHT_1/, NIGHT_2/ folders,
  each with its own pair of files.
- The recurring need: every finished image gets posted with a block of
  acquisition numbers (text pasted into the caption, or a typed "Technical
  details" panel). Long projects (tens of hours over many nights) need a
  "how the hours stacked up" picture. Today that is typed by hand or made in a
  spreadsheet, once per image.
- Evidence:
  - https://github.com/tcpalmer/nina.plugin.sessionmetadata - the plugin
    README says NINA's own FITS headers are "not really convenient to access
    for a set of images" and that the plugin automates capture of per-image
    and per-session CSV/JSON; the source (SessionMetaDataWatcher.cs) shows the
    field names above.
  - https://www.ideviceapps.de/NINAImageAnalysisHandbook/ - a third-party
    session analyzer whose required inputs are `AcquisitionDetails.csv` and
    `ImageMetaData.csv`, with a documented multi-night folder layout. The files
    are common enough that people build tools around them.
  - https://scopetrader.com/nina-log-analyzer/ - an imager wrote a free web tool
    because the overnight log is "hard-to-read"; it renders a Gantt-style
    timeline of exposures vs filter changes vs autofocus. Shows appetite for
    visual summaries of a night, but it is for diagnosing, not for sharing.
  - https://skycenter.arizona.edu/astrophotography/m57-ring-nebula - a
    university observatory lists exposure as one line,
    "RGBHaSIIOIII = 360:340:335:725:720:715 (53.25hours)"; and
    https://sdspacegrant.sdsmt.edu/PacmanNebula-RichardWalker.htm lists
    "SII 15 x 10 min., Ha 10 x 10 min., OIII 20 x 10 min." in a prose block.
    Both are hand-typed numbers a card would replace.
- Why m0saic fits: one horizontal bar per filter, bar length = frames x
  seconds, so the proportions are the data (rectangles, no media needed for the
  chart). A clip can grow the bars night by night (ExposureStartUTC date) with a
  running total in hours, ending on the final card; a still is the same layout
  at t=end. Props mirror the CSV (target, telescope, focalLength, camera, and
  an array of {filter, frames, exposureSec, night}). Totals are pure arithmetic,
  so the render is deterministic and batchable over a folder of sessions.
- Risks: filter colours are a taste call and need a small fixed palette (Ha red,
  OIII teal, SII deep red, L grey, RGB as themselves); shared dual-band filters
  are counted differently by convention, so the demo should take filter names as
  given and not try to split them; the image itself is optional (demo uses a
  placeholder swatch, no media in the repo); the real CSV has about 30 columns
  and the template should read only a handful. I did not find a thread where
  someone asks for exactly this picture, so the demand is inferred from the
  hand-typed blocks, not quoted.

### 2. Disc golf league week card from the UDisc event export
- Who: disc golf league directors and scorekeepers, on UDisc and the UDisc forum.
- The construct: the event leaderboard export (XLSX) with Division, Position,
  Name, Relative Score, Total Score, PDGA #, Round Rating and "Scores by hole".
- The recurring need: weekly results posted to the club after every league round.
- Evidence:
  - https://help.udisc.com/en/articles/10859468-how-can-i-export-results-after-an-event-finishes
    - lists the export fields above, including scores by hole.
  - https://forum.udisc.com/t/round-ratings-as-part-of-leage-events-csv/257524
    - a league organiser says "scraping from the page each week is a non-started
    for our scorekeeper - too time consuming and too error prone"; staff reply
    that adding round ratings to the export is not planned.
- Why m0saic fits: the hole-by-hole grid with birdie/bogey shading is a pure
  rectangle layout and the leaderboard is a ranked list.
- Risks: closely resembles the parkrun and swim-meet weekly cards already
  shipped; UDisc has its own share image and a yearly "Replay" (from search
  summaries, not opened); the evidence is a request for data columns, not for
  pictures.

### 3. Climbing tick-list year in review from the Mountain Project CSV
- Who: climbers who log sends on Mountain Project.
- The construct: the ticks "Export CSV" link on a user's ticks page.
- The recurring need: a yearly (or trip-end) grade pyramid and send count.
- Evidence:
  - https://www.mountainproject.com/forum/message/116587823 - a user answers
    "you can 'Export CSV' (link near top of page). You can open that file in
    Excel or Google Sheets"; others ask for better export and sorting.
  - https://www.mountainproject.com/forum/message/108352851 - users keep an
    offline spreadsheet from the CSV to compare "year to year, season to
    season".
- Why m0saic fits: a grade pyramid is stacked rectangles; counts are props.
- Risks: the site has its own tick breakdown charts (search summary, not
  opened); I found no complaint about sharing them, only about exporting;
  grade systems (YDS, V, French) need care.

### 4. Competitive Pokemon team card from a Showdown export paste
- Who: VGC and Smogon players on Pokemon Showdown and pokepast.es.
- The construct: the Showdown "export format" team text (species @ item,
  Ability, EVs, Nature, four moves; up to six blocks).
- The recurring need: sharing a team for a tournament report or a post.
- Evidence:
  - https://github.com/smogon/pokemon-showdown/blob/262160e8e3b36473732b88a198ed8981dbd37668/sim/TEAMS.md
    - the official description of the export/JSON/packed formats with the exact
    field names.
  - https://pokepast.es/ - opened, but it is a JS app and returned only its
    title, so I could not confirm what it renders.
- Why m0saic fits: six cards on a 3 x 2 grid, EV bars as rectangles.
- Risks: the audience expects sprites (media we lack); pokepast.es already
  covers sharing; weak evidence of a manual picture workflow.

## Pick
Astrophotography integration summary from the NINA session CSVs. It is the only
candidate where I found a specific documented artifact with field names and
visible hand-typed output that the artifact could replace, and the picture (bars
proportional to hours per filter, growing night by night) is what rectangles do
best with no media files. The disc golf, climbing and Pokemon candidates either
resemble days already shipped or already have an adjacent way to share.

## Rejected today
- Go (SGF) game recap: sgf-render already makes SVG/PNG diagrams, and it would
  repeat the chess-game-recap board idea.
- Concept2 rowing logbook card: https://c2forum.com/viewtopic.php?p=536366 is
  about getting data out at all; the artifact is not clean enough for props.
- Scrabble (GCG files): the format is documented but I found no recurring
  visual need beyond annotated game pages.
- Film photography roll logs: many apps already make contact sheets and dev sheets.
- Coffee brew cards (Beanconqueror JSON): another app already makes share images.
- Warhammer / Old World army lists: no stable text export spec found, and it needs unit art.
