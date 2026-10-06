# Scout — 2026-10-06

Day 17. Sixteen templates are on the shelf, and most of the recent ones are
one person's PB card made from their hobby's file: speedrun, powerlifting,
swim, sim racing, cubing. So today I looked for a community picture made
weekly by a volunteer for a whole group, and for constructs no earlier scout
opened. Eight parallel sweeps covered:

- monthly art challenges (Inktober runs now)
- novel word-count challenges
- Concept2 rowing
- peak-bagging lists
- roguelike and rhythm-game runs
- jam-band setlists
- CrossFit and parkrun
- a wildcard pass (bell ringing, coffee roasting)

Each sweep's notes are in [`scout-notes/`](scout-notes/).

## Candidates (3–5, best first)

### 1. parkrun weekly event-summary card

- Who: parkrun event teams. Each Saturday 5k event has a run director (RD)
  and a volunteer who writes the weekly run report, and they post the
  week's numbers to the event's Facebook page and its results/news page.
  There are events in 20+ countries: the Eventuate userscript lists
  parkrun.org.uk, .com.au, .us, .co.za, .ie, .ca, .jp and more under
  "Applies to" ([greasyfork](https://greasyfork.org/scripts/534157-eventuate)).
- The construct: **the weekly event and its results page**. Every run has
  an event name and run number (`#568`) and a date. It also has the same
  set of counts:
  - parkrunners (finishers)
  - new PBs
  - first-time parkrunners
  - visitors
  - volunteers and first-time volunteers
  - milestone clubs: 25 / 50 / 100 / 250 / 500 runs or volunteer credits

  Volunteers have built three tools that read that page and write the
  counts down, which gives the field names. The clearest is
  [parkrun-runstats](https://github.com/rwkura/parkrun-milestones):
  `parkrunners: 568`, `New PBs: 78`, `Visitors: 65`,
  `First-time parkrunners: 45`, `Volunteers: 24`,
  `First-time volunteers: 6`, `Milestones: 4xR25, 4xR50, 1xR100`.
- The recurring need: once a week, per event, a picture of "this week at
  our parkrun" made from those numbers. Today it is made by hand in
  PowerPoint, or posted as text.
- Evidence:
  - [ear1grey/parkrun-event-summary](https://github.com/ear1grey/parkrun-event-summary)
    is the strongest by-hand quote of the day. The author "saw a really cool
    infographic at my local parkrun, that was generated using a PowerPoint
    slide ... (for Rushmoor parkrun) that may in turn have been based on a
    design by Ian Gregory (an RD at Great Salterns) - there are many examples
    on the Rushmoor and Great Salterns Parkrun results pages. The process of
    getting the data into Powerpoint is quite cumbersome". Their answer is a
    beta Chrome extension that draws the infographic inside the results
    page (3 stars, released Jan 2024).
  - [johnsyweb/eventuate](https://github.com/johnsyweb/eventuate) was
    written "while volunteering as a Run Director at Brimbank parkrun, to
    celebrate our community on the Facebook page". It extracts "milestones,
    first-timers, personal bests, volunteers, and community facts" to help
    "write a weekly parkrun event report". The output is text only. Version
    1.20.0 was [updated 2026-09-30](https://greasyfork.org/scripts/534157-eventuate),
    so it is maintained right now.
  - [parkrun-runstats](https://github.com/rwkura/parkrun-milestones)
    "prints the stats of the latest run in list format; suitable for sharing
    in text-based social media". The same repo predicts the next run's
    milestone candidates (25, 50, 100, 250, 500).
- Why m0saic fits: the picture is a fixed set of stat tiles. A header band
  holds the event name, `#run` and date. Under it sit six tiles (finishers,
  PBs, first timers, visitors, volunteers, first-time volunteers) and a
  milestone row with one badge per club and a count. The props would mirror
  the runstats fields, so the RD pastes numbers they already have. The
  render is aggregate-only, with no names. It is one render per event per
  Saturday, with feed, story and square from the same props, and batchable
  across a season or across the events in a region. Every count is a number
  with a default, so the defaults render a full card. It needs no media, no
  map and no art. It is also a group picture made weekly by a volunteer,
  which is a different job from the personal PB cards already on the shelf.
- Risks:
  - Three tools already pull these numbers, and one already draws an
    infographic. That extension only works in a browser, on parkrun's own
    page, in its own look, and makes no file you can post or batch. The
    critic should ask whether a template beats it.
  - parkrun is hostile to scraping, so the template must take numbers as
    props and never fetch.
  - "parkrun" is a trademark: no logo, no lookalike brand palette, a
    descriptive name.
  - Milestone rows vary (0 to 6 clubs in a week) and need a layout rule for
    an empty week.
  - I could not open a Rushmoor or Great Salterns page to show one of the
    PowerPoint originals, so their look is described, not seen.

### 2. Bell ringing: first peal / first quarter peal card from a BellBoard record

- Who: change ringers in UK (and Commonwealth) church towers. Their
  performances are recorded on BellBoard, The Ringing World's site, and
  guilds and the Central Council (CCCBR) run the community around them.
- The construct: the **peal or quarter peal record**. A
  [BellBoard record](https://bb.ringingworld.co.uk/view.php?id=1401162) has:
  - place and county, dedication, date
  - duration ("in 3h 16") and tenor weight
  - changes and method ("5088 Plain Bob Major") and composer
  - the ringers numbered 1..N by bell, with "(C)" for the conductor
  - footnotes
- The recurring need: a ringer's first quarter peal or first peal is a
  milestone, and the
  [CCCBR publicity page](https://archive.cccbr.org.uk/?p=4271) offers
  "Congratulatory certificates: For a First peal ... For a First peal as
  conductor ... For a First quarter peal ... in either PDF or docx format".
  Those are blank forms that someone fills in by hand, per ringer.
- Why m0saic fits: it is a fixed form. A header band holds tower, dedication
  and date. A centre block holds changes, method, time and tenor. A grid of
  ringers 1..N has one row per bell (6-12 rows) and a highlighted row for the
  honoree. A footnote band closes it. The data comes from one record, and a
  guild newsletter could batch every first quarter peal.
- Risks: it is a certificate, which is print, not a feed post. BellBoard's
  export returned HTTP 500 to us, so the XML field names are unverified.
  Tenor weight uses an en dash (write it as 20-0-26). I found no "is there
  a tool" quote. And the prestige object is the hand-painted peal board.

### 3. Jam-band show setlist card from Songfish JSON

- Who: fans of Goose, Phish and the bands on the Songfish platform
  (elgoose.net, Bearly Dead).
- The construct: the setlist, with sets, encore, `>` segues, jamchart marks,
  and debut and bustout gaps. The
  [elgoose API](https://elgoose.net/api/v2/latest.json) is keyless JSON with
  real fields: `showdate, venuename, setnumber, set_label, position,
  songname, transition, isjamchart, footnote, shownotes`. A shownote reads,
  for example, "Franklin's Tower was played for the first time since
  December 14, 2024 (129 shows)".
- The recurring need: a setlist picture after every show. A
  [2011 blogger](https://tomorrowsverse.com/story/introducing-the-visual-setlist-2798.html)
  hand-made "Visual Setlists" for Phish "the morning after each
  performance", colour-coding the gap since a song was last played.
- Why m0saic fits: set blocks stacked as rows, with segue arrows and
  coloured gap badges. The data comes from one keyless JSON call.
- Risks: the demand evidence is a 2011 blog and an app review. Bands post
  their own setlist graphics. A 20+ song show with long titles is the
  text-overflow defect again.

### 4. Peak-list progress board (NH 48, ADK 46, Colorado 14ers)

- Who: peak baggers working through a fixed list. The AMC
  [4000 Footer Club](https://amc4000footer.org/how-to-apply.html) asks
  climbers to "note the dates of your ascents as you make them" for an
  application in PDF or Excel.
- The construct: a list of N peaks, each with a date. The picture is N cells
  with filled or empty state, plus "31/48" and a finisher card at N/N.
- Evidence: a [VFTT thread](https://vftt.org/threads/peakbagger-spreadsheet.44642/post-373258)
  of hand-made Excel trackers ("I want to post some of my stats to my
  blog"), from 2012. Tracker apps show progress in-app only.
- Why m0saic fits: a 48-cell grid is pure rectangles with one state per
  cell.
- Risks: no one asks for a shareable image. Each person finishes a list
  once. Munro and Wainwright names are non-ASCII and the lists run to
  214-282 cells.

### 5. Monthly art-challenge compilation grid (Inktober, Huevember)

- Who: artists doing 31-day prompt challenges. Inktober is running now: the
  [official 2026 list](https://www.svslearn.com/news/2026/9/1/the-official-inktober-2026-prompt-list)
  says "31 drawings in 31 days".
- The construct: the prompt list (31 numbered words) plus the artist's daily
  drawings. Huevember's founder
  [wants the month compiled](https://xquissive.com/huevember): "when you put
  all your artworks next to each other in order, you'd notice a sense of
  continuity through the colours".
- Why m0saic fits: a 31-cell grid of image, day number and prompt word.
  With no images it renders the host's prompt-list graphic.
- Risks: there is no data file, and the audience lives in Procreate and
  Canva. Demand is implied, not shown. Collage apps cover most of it. The
  defaults would be empty placeholders.

## Pick

**parkrun weekly event-summary card.** It is the only candidate where an
opened page says a volunteer team makes this exact picture by hand and that
doing so is "quite cumbersome". The numbers are a fixed set that three
volunteer tools already extract every week, which gives the props and their
defaults. It also adds a weekly group picture made by event volunteers to a
shelf of personal PB cards. Bell ringing has the more charming construct,
but its evidence is a blank docx certificate, not a recurring post.

## Rejected today

- NetHack ascension card (xlogfile `conduct`/`achieve` bitfields): a lovely
  rectangle shape, but ascension posts ("YAAP") are text plus dumplog links,
  and nobody I read makes a picture.
- Concept2 erg piece card: good numbers (split /500m, spm, watts, drag
  factor), but no opened page asks for a graphic, and ErgData shares a link.
- Word-count recap card (post-NaNoWriMo): Pacemaker, TrackBear and NaNo 2.0
  draw the par-line graph, and writers share screenshots of it.
- CrossFit daily WOD graphic: the workout is a free-text blob, and SugarWOD
  BoxTV and Canva packs serve it. A PR card had no evidence.
- parkrun personal milestone card (50/100/250): parkrun already recognises
  milestones with shirts, it needs names (non-ASCII and privacy risk), and
  I found no by-hand evidence.
- osu! replay thumbnails: [osr2png](https://github.com/xjunko/osr2png) is a
  CLI that already does it.
- Slay the Spire / Balatro run cards: run trackers serve them, and they need
  card art.
- Home coffee roasting (Artisan `.alog`): Artisan prints its own roast
  report.

## Research record

- Eight parallel sweeps ran about 55 web searches and opened about 35 pages.
  The per-angle notes, the searches and the failed URLs are in
  [`scout-notes/`](scout-notes/).
- I re-opened the pick's sources myself:
  - ear1grey/parkrun-event-summary
  - johnsyweb/eventuate
  - the Eventuate greasyfork page
  - rwkura/parkrun-milestones
  - the CCCBR publicity page
- Failed to open: the Walkhighlands forum and pixiv (403), BellBoard
  `export.php` (500), metacpan NAOdash (402) and TrackBear's help pages (403).
  Reddit was not tried (blocked since 2026-09-25).
