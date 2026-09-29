# Scout — 2026-09-29

Today's scout ran as a fan-out: eight research agents, one per cluster of
niche communities, each told to cite only pages it opened. Then I re-opened
the evidence for the top two candidates myself. About 100 searches in all,
across 16 communities (crosswords, chess, 40k wargaming, TTRPG, swimming,
track, film and astro photography, DJs, board games, geocaching, bowling,
climbing, rowing, disc golf, ham contesting, homebrewing, fantasy sports).
Reddit was not used: it refuses anonymous clients.

## Candidates (3–5, best first)

### 1. Crossword solved-grid card, from the puzzle's .puz / .ipuz
- Who: crossword bloggers who write up every day's puzzles (the Crossword
  Fiend team covers NYT, LAT, WSJ, Universal, New Yorker, Jonesin' and more,
  4 to 6 grid images on each daily post I opened), and indie constructors who put out a weekly
  puzzle on Substack or their own site. They gather at
  [crosswordfiend.com](https://crosswordfiend.com/download/), on the daily
  blogs, and on [Crosshare](https://crosshare.org/crosswords/pJMezWuZ6oRSxfHehRTw/wanting-for-winter).
- The construct: the American crossword grid. It is 15x15 on weekdays (21x21
  on Sunday, 5x5 for minis), with black squares, clue numbers in the corner,
  one letter per square, circled or shaded squares, theme entries and a
  revealer. Every write-up has the same caption line under it: publication,
  date, weekday, title, constructor, "solution".
- The artifact: Across Lite `.puz`, the binary format every outlet offers.
  Fiend's download page says "download today's puzzles in either AcrossLite
  (puz) or Adobe (pdf) format". The open parsers are
  [puzpy](https://github.com/alexdej/puzpy) ("read and write crossword puzzle
  files in Across Lite .puz") and the JSON `.ipuz` format. Either one gives
  width, height, the solution string, title, author, clues, circles and rebus.
- The recurring need: every Fiend write-up starts with a picture of the
  solved grid, and each picture is an OS screenshot or a phone photo of
  whatever app the reviewer solved in. The upload names on three posts I
  opened:
  - Sep 22: `Screenshot-2026-09-20-at-3.04.29 PM.png`,
    `Screenshot-2026-09-22-213516.png`, `IMG_2411.jpeg`, `Image-1.jpeg`
  - Sep 25: `Screenshot-2026-09-24-213215.png`, `grid.png`,
    `lat20260925.png`
  - Sep 27: `Screenshot-2026-09-26-at-10.07.54 PM.png`,
    `Screenshot-2026-09-27-9.41.50-AM.png`, `wpsol092726.png`

  Sizes and styles differ from one grid to the next, and so does the app
  chrome. One screenshot keeps a wrong square ("The one incorrect square was
  my fault"). The theme entries are never marked on the picture, so every
  post retypes them below it as a separate "THEME ANSWERS:" list.
- Evidence:
  - [Fiend, Tue Sep 22](https://crosswordfiend.com/2026/09/21/tuesday-september-22-2026/):
    six reviews, each with a hand-made grid image and a hand-typed caption,
    e.g. "WSJ * 9/22/26 * Tues * "Variety Pack" * Zhoukin Burnikel *
    solution * 20260922", followed by "THEME ANSWERS: ...".
  - [Fiend, Fri Sep 25](https://crosswordfiend.com/2026/09/24/friday-september-25-2026/)
    and [Fiend, Sun Sep 27](https://crosswordfiend.com/2026/09/26/sunday-september-27-2026/):
    the same pattern, with a different file-naming habit per reviewer.
  - [Fiend download page](https://crosswordfiend.com/download/): the day's
    puzzles as `.puz` next to the blog, so the input sits beside the output.
  - [Crosshare puzzle page](https://crosshare.org/crosswords/pJMezWuZ6oRSxfHehRTw/wanting-for-winter):
    Crosshare generates a 1200x630 og:image ("An image of the puzzle grid"),
    but only for puzzles it hosts.
- Why m0saic fits: the grid is a lattice of rectangles. A 15x15 grid is
  225 cells from one 5-smooth split per axis. Blocks are dark cells. A clue
  number is a small corner cell, a letter is a centred cell, and a theme entry
  is a band of cells tinted across a row or down a column. Props can mirror
  the file: `width`, `height`, `solution` rows ('#' for a block), `circles`,
  `title`, `author`, plus `publication`, `date` and `themeEntries`
  (`["17A","24A",...]`). Clue numbers are derived from the grid, not typed,
  so the card is deterministic. The same props give a still (the card) and a
  short clip (the grid fills entry by entry, then the theme bands light up).
  Batch: one card per puzzle per day for a blog, one per week for a
  constructor.
- Risks:
  - The default puzzle must be original. No NYT, WSJ or other published
    grid goes into the repo, and filling a valid 15x15 by hand is real work.
    A small original mini (5x5 or 7x7) or a sparse demo grid is the honest
    default; the size must stay a prop.
  - 21x21 is not 5-smooth (3 x 7), so a Sunday grid needs nested splits
    (3 groups of 7). Worth checking in the brief.
  - Circled squares need a mask or an inset-square stand-in. Rebus squares
    need smaller text. Letters must be ASCII.
  - `.puz` is binary, so v1 takes props, not the file. A converter is the
    founder's follow-up.
  - Existing tools cover pieces of this.
    [Exet](https://github.com/viresh-ratnakar/exet) can save a grid SVG by
    hand from a GUI. [print-puz](https://github.com/taylorjg/print-puz)
    renders a print page from a `.puz` URL. Crosshare covers its own puzzles.
    None makes a captioned, theme-marked share card from the file in a
    batch.

### 2. Swim meet recap card: new cuts and biggest drops, from SDIF / HY3
- Who: age-group swim clubs (USA Swimming clubs, summer leagues). Coaches and
  parent volunteers post a recap after every meet on TeamUnify/GoMotion and
  SwimTopia team sites.
- The construct: "X of Y swam a best time", new B/BB/A/AA motivational times,
  and "dropped N seconds in the 200 Free".
- The artifact: the meet results file every host posts, SDIF `.sd3`/`.cl2`
  or Hy-Tek `.hy3`, which [flipturn](https://github.com/enagon-athletics/flipturn)
  parses ("meet, teams, swimmers, entries, results, splits").
- Evidence:
  - [Wave meet recap](https://www.gomotionapp.com/team/wave/page/news/507024/fall-divisional-meet-recap):
    hand-compiled new motivational times and drop callouts ("dropped 40
    seconds in the 200 Free", "average time drop per race ... 3.07 seconds").
  - [CATCC recap](https://www.gomotionapp.com/team/catcc/page/news/570837/hvda-scy-bbbc-meet-recap):
    the same structure at another club.
  - [Maverick time drops](https://www.mavswim.org/page/celebrations/time-drops):
    per-swimmer "time drop sheets" land in mailboxes "1-2 weeks after the
    completion of a meet".
  - [MediaHub](https://github.com/anedav68/MediaHub): a 0-star SaaS from June
    2026 that attempts the same thing, so the idea is live and not yet served.
- Why m0saic fits: stat tiles, tier columns of name chips, drop bars sized in
  seconds. All rectangles, with a clean batch of one card per swimmer.
- Risks: a results file has no true previous best (the seed time is a
  proxy). The tier tables change each cycle. Minors' names. It is the second
  sports results card in three days after powerlifting.

### 3. Warhammer 40k tournament list card, from the GW app export
- Who: competitive 40k players and the sites that publish "top lists" after
  each major event.
- The construct: the army list (faction, detachment, points, units by section)
  and the top-8 table with round scores.
- The artifact: the Warhammer 40k app's plain-text export, which Best Coast
  Pairings also shows.
- Evidence:
  - [Spikey Bits, CaptainCon 2026](https://spikeybits.com/top-40k-unbeatable-army-lists-captaincon-2026/)
    (opened, credits Best Coast Pairings), plus
    [Nottingham](https://spikeybits.com/top-40k-tournament-army-lists-nottingham-super-major/)
    and [Tennessee](https://spikeybits.com/top-40k-tournament-army-lists-tennessee-elite-open/)
    (opened by the research agent; I got a 403 on a direct fetch). The
    research agent read the image names and sizes: every list is 2-5 cropped
    BCP phone screenshots of uneven size, plus a screenshot of the top 8.
  - [40kCompactor](https://desjani.github.io/40kCompactor/) already parses
    the same export and has a "Codex Card" image output.
- Why m0saic fits: section blocks, unit rows with right-aligned points, a
  points-by-section stacked bar, and a round-score grid.
- Risks: mostly text, so fitting long lists is the whole job. The export
  format changes with each edition. The evidence of hand-made pictures comes
  from one outlet. GW IP means text and colour only.

### 4. Astrophotography acquisition card, from the AstroBin acquisition CSV
- Who: deep-sky imagers who post on AstroBin, Instagram and
  r/astrophotography.
- The construct and artifact: per-filter subs x exposure and total
  integration hours. The
  [AstroBin CSV import](https://welcome.astrobin.com/importing-acquisitions-from-csv)
  defines the columns (date, filter, number, duration, gain, ...), and
  [AstroBinUploader](https://github.com/SteveGreaves/AstroBinUploader) and the
  [NINA session-metadata plugin](https://github.com/tcpalmer/nina.plugin.sessionmetadata)
  generate it.
- Evidence: the
  [r/astrophotography rules](https://r-astrophotography.gitbook.io/r-astrophotography-wiki/posting-guidelines-and-rules-explanation)
  require acquisition details on every post, as text. The paid
  [AstroIndexer](https://astroindexer.com/) (EUR 89) paints them onto the
  photo.
- Why m0saic fits: one bar per filter sized by hours, and a night-by-night
  stacked strip.
- Risks: no opened page shows anyone hand-making this graphic. The filter
  column is a numeric ID.

### 5. Bowling weekly honor-roll card
- Who: USBC associations, centres and bowling bloggers.
- Evidence: [Green Bay Bowling](https://greenbaybowling.com/category/honor-scores/)
  posted honor scores six times in eight days, as plain text.
  [The Tenth Board](https://tenthboard.net/category/honor-scores/) rebuilds a
  weekly list from LeagueSecretary pages.
- Why m0saic fits: league blocks, score chips, and an optional 10-frame
  scoresheet hero.
- Risks: the posts are text; no opened evidence of a picture being made. The
  LeagueSecretary export is paywalled.

## Pick

**Crossword solved-grid card from the puzzle file.** It has the best-verified
evidence of the day: I re-opened three Crossword Fiend daily posts, and every
grid picture is a screenshot or a phone photo. The files already sit on the
same site as `.puz`, and the theme entries are retyped by hand under each
image because the picture cannot show them. The geometry is a literal
lattice of rectangles, the need is new to this repo, and it is not another
results table. It beat the swim recap (strong evidence, but the second sports
results card in three days and a harder input) and the 40k list card (one
outlet, a partial competitor, mostly text-fitting).

Scope note for the plan: a still-first card for one puzzle. Props mirror
`.puz`/`.ipuz` fields, the defaults are an original small grid, and there is
a theme-entry highlight plus the caption line. A fill-in clip is optional.
Parsing the binary `.puz` is out of scope for the demo.

## Rejected today
- DJ tracklist card (Serato/rekordbox history): the export pain is real, but
  nothing opened shows DJs hand-making the image, and track titles are often
  non-ASCII.
- QSO party / contest certificates from results CSV: plausible batch, but no
  first-hand complaint opened, and sponsors want seals and photos.
- Homebrew recipe card (BeerXML): labels, prints and tap lists are served,
  and the complaint is from 2016 and about print layout.
- Climbing grade pyramid (Mountain Project ticks): at least five tools
  already draw it, and the need is yearly.
- Disc golf league results (UDisc XLSX): the weekly export is confirmed, but
  UDisc's own leaderboard link covers sharing.
- Film roll data sheet (Exif Notes CSV): no opened demand, and Pellica
  exports a PDF contact sheet.
- Geocaching D/T grid, BGG 10x10 grid: served by Project-GC/GSAK and by BG
  Stats' new grid image.
- Chess puzzle / game clips: lichess's lila-gif serves them, and pieces
  would need art or non-ASCII glyphs.
- Fantasy league recaps: served by League Legacy, ffwrapped and others.
- TTRPG dice-stats card: no evidence of a recurring hand-made picture.
- Concept2 2k card: ErgZone and the logbook already share images (search
  results only).

## Research trail and limits
- Opened, not usable: ipuz.org (connection refused and a timeout, twice),
  so the `.ipuz` field list above comes from the research agent's reading
  and puzpy, not from the spec page.
- Refused: Photrio, Cloudy Nights, BoardGameGeek geeklists, SwimCloud and
  the groups.io QSOParty thread all refused anonymous fetches. Spikey Bits
  returned 403 to curl and WebFetch but opened through
  `pipeline/research/fetch-text.mjs`.
- Not opened: search snippets are not used as evidence anywhere above. The
  Crossword Compiler image export and the PosterMyWall tracklist template
  counts are search snippets only.
