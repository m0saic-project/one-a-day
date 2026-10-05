# Scout — 2026-10-05

Day 16. Fifteen days are on the shelf (see `journal/index.json`); five of the
last nine are sports recap cards, and chess, climbing, Warhammer lists, disc
golf and POTA have each been rejected two or three times. So today looked at
communities no earlier scout opened: college and community radio, drum-machine
programmers, drum corps fans, club sailing, plus quick passes at bridge,
pinball leagues, knitting charts and chess-club standings.

## Candidates (3–5, best first)

### 1. College radio weekly Top 30 chart card

- Who: music directors (MDs) at college and community radio stations. They
  gather around the [NACC chart](https://naccchart.com/faq) (200+ reporting
  stations per
  [Wikipedia](https://en.wikipedia.org/wiki/North_American_College_and_Community_Radio_Chart)),
  their station blogs, and Spinitron, the playlist logger whose
  [home page](https://spinitron.com/) lists several hundred such stations.
- The construct: **the Top 30**. Every week each station ranks its 30
  most-played recent releases and reports them to NACC; NACC folds those into
  the national Top 200. The artifact is the chart the MD already types into
  NACC: rows of `Artist / Title / Label` in rank order, plus a short "adds"
  list, built from the station's playlist log. The
  [reporting guidelines](https://naccchart.com/reporting-guidelines) fix the
  format down to how a single or EP is written.
- The recurring need: once a week, on a deadline (reporting closes Tuesday
  2pm ET), the MD has a finished chart and the station publishes it: a blog
  post, a chart page, an image. 52 times a year per station, same shape every
  time, only the rows change.
- Evidence:
  - [WDCE 90.1, Richmond](https://create.richmond.edu/parsons/tag/slippers/)
    posts the chart **as a picture** every week, still doing so in July 2026:
    "Here's the WDCE Top 30 from 29 July 2026 (click the image to see a
    larger version)", then retypes the top four albums as text under it.
  - [KWVA, Oregon](https://kwva.uoregon.edu/charts?page=4): "Every week we
    compile data on what our DJs play on air during their shows, then we
    share that with you in the form of a Top 30 Chart", typed out as
    `1. CLAIRO Album: Charm Label: Virgin`.
  - [WUSC, South Carolina](https://www.wusc.fm/article/2021/08/top-30-chart-08-24-21):
    "Our music director, Jonas, puts it together by looking back at our
    playlist log to determine the top 30 plays", a weekly post
    ([another week](https://www.wusc.fm/article/2021/11/our-weekly-top-30-chart-11-02-21):
    "You know what day it is! Top 30 chart day").
  - [WUVT's music director](https://wuvt.vt.edu/article/music-article) on why
    it is not optional: "In exchange for promoters, artists, and labels
    giving us stuff, they want us to chart our Top 30 on the NACC radio chart
    every week."
- Why m0saic fits: a chart is a ranked stack of equal rows, which is a
  weighted split and nothing else. Props mirror the NACC row (`artist`,
  `title`, `label`, optional `lastWeek` for a movement marker) plus station
  call sign, frequency and week-of date. No cover art is needed for it to
  read as a chart (WDCE's weekly image is a table). One render per week from
  the same rows gives the feed post, the story and the web banner; a second
  station is the same template with a different call sign and colour.
- Risks: it is a text table, and text is the defect this repo ships most.
  Artist and title strings are unbounded ("Brat And It's Completely Different
  But Also Still Brat" is a real row on KWVA's page), so the brief has to
  decide between shrink, a top-10 hero with 11-30 in a compact block, or
  paging, and the test has to sweep long copy. The evidence for a
  *hand-made picture* is one station (WDCE); the other three publish typed
  lists, which shows the weekly chore and the audience, not a wish for a
  graphic. Station Instagram accounts, where chart graphics most likely live,
  could not be opened.

### 2. Drum pattern step-grid clip

- Who: drum-machine and beat-making hobbyists and teachers; pattern books,
  course sites, note-taking plugins.
- The construct: the 16-step grid, written as text everyone can read
  (`kick: x...x...x...x...`), one row per instrument.
- The recurring need: a lesson, a pattern-of-the-day post or a genre guide
  shows the grid; a clip with a moving playhead column would show it played.
- Evidence:
  - [Beat Kitchen's drum programming chapter](https://beatkitchen.io/guides/electronic-music/03-drum-programming/):
    "The standard electronic music grid divides one bar of 4/4 time into 16
    steps", and explains every genre pattern in those terms.
  - [Drum Notation for Obsidian](https://community.obsidian.md/plugins/drum-notation)
    (41 updates): drummers keep "grooves, fills, rudiments" as text beside
    their notes and export sheets from it.
- Why m0saic fits: it is literally a grid of rectangles, on or off, with a
  highlighted column moving at a tempo that is a prop. Deterministic by
  construction; a pattern library batches into a clip per pattern.
- Risks: no opened page shows anyone asking for the clip, only that the
  notation is shared. Without audio the clip is half the idea, and the repo
  carries no drum samples. Every browser drum machine already animates this.

### 3. Drum corps score recap card

- Who: drum corps and marching band fans and corps social accounts, around
  [DCI's official recaps](https://www.dci.org/scores/recap/2024-dci-capital-classic).
- The construct: the recap sheet. Per corps: General Effect, Visual and Music
  captions, each with sub-scores, a rank per caption, penalties, the total.
- The recurring need: after every show of a summer tour, the scores are the
  news; a per-corps card (caption bars, rank per caption, total) is the
  obvious post.
- Evidence: the DCI recap page above is a table so wide it says "Scroll the
  table horizontally to explore full recap" - the artifact exists and is
  awkward to share as is. That is all that was opened.
- Why m0saic fits: three caption bars and a total are rectangles; one render
  per corps per show.
- Risks: seasonal (the tour is June to August; it is October). No opened
  evidence of the hand-made picture. A sixth score card in sixteen days.

### 4. Club sailing series results card

- Who: club race officers and webmasters; the Sailwave user group.
- The construct: the series results sheet - per boat, a score per race,
  discards in brackets, net points - produced by
  [Sailwave](https://www.sailwave.com/), which is free and "used
  internationally at all levels".
- The recurring need: results go up after every race day;
  [Chanonry Sailing Club](https://www.chanonry.org.uk/results) publishes
  "usually within 2-3 working days depending on the workload that webmasters
  have at the time".
- Why m0saic fits: a standings table with bracketed discards is the cubing
  average card's grammar again; rows and cells.
- Risks: Sailwave already publishes HTML with user templates, so the table
  is served; nothing opened shows a club wanting a social picture of it.
  Close to days 12 and 15 in shape.

## Pick

**College radio weekly Top 30 chart card.** It is the only candidate where
the opened pages show all four things at once: a construct every member knows
(the Top 30), a fixed artifact (the NACC row: artist, title, label), a weekly
deadline that never stops, and a station that already publishes the result as
a picture every week in 2026. It also takes the shelf somewhere new (music,
after five sports cards), and the hard part - long strings in a ranked table
- is a problem the layout contract exists to test.

## Rejected today

- Drum pattern step-grid clip: the cleanest geometry of the day, but no
  opened evidence of demand, and silent drums are half a demo.
- Drum corps score recap card: out of season and evidence is the artifact
  alone.
- Club sailing series results: Sailwave's own HTML templates serve it.
- Bridge deal diagrams (PBN): search results point at Funbridge's deal-image
  export and a Wikiversity template; suit symbols are not ASCII, which the
  bundled font cannot draw. Not opened, not pursued.
- Pinball league night standings (Match Play): search found venues posting
  plain result tables; no artifact or picture evidence. Not opened.
- Knitting / colorwork charts: Stitch Fiddle and Stitchmastery came up as the
  standard chart makers. Served; not opened.
- Chess club standings from Swiss-Manager: the search returned only FIDE
  report PDFs; nothing to cite.

## Research notes

- 11 web searches across radio, drum machines, drum corps, sailing, bridge,
  pinball, knitting and chess clubs; 2 `hn.mjs` queries (drum patterns: only
  Show HN drum machines, nothing on sharing pictures); about 20 pages opened
  with `fetch-text.mjs`. Raw fetches are in `scratch/`.
- Reddit was not tried (refused since 2026-09-25).
- Opened but not usable: a KALX Spinitron "about" page (404), a SCAD Atlanta
  Radio music-director duty sheet (PDF came back as binary), the HN thread
  for "Beats, a web-based drum machine" (HTTP 419), a WDCE category page that
  did not show the chart posts (the tag page cited above does).
- Opened, supporting only: Planetary Group's
  [radio charts guide](https://planetarygroup.com/music-promotion-guide/radio-charts/)
  (a promoter's explanation of how station Top 30s feed the Top 200) and
  Flagler College Radio's
  [2013 chart post](https://gargoyle.flagler.edu/flagler-college-radio-weekly-200-and-adds/)
  (the same weekly "adds + Top 30" ritual in the CMJ era, before NACC).
- Not found: Spinitron's own chart-report documentation, so how the log
  becomes the chart inside Spinitron is not claimed anywhere above.
- What a later phase should know: NACC's rules give the copy conventions for
  free - an unreleased album's advance track is written `"Title" [Single]`,
  an EP as `Title [EP]`, and every row must have artist, title and label.
  Station names are a call sign plus a frequency (`WDCE 90.1`, `WUSC 90.5`).
