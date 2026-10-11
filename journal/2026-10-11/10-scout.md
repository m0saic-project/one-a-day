# Scout — 2026-10-11

## Candidates (best first)

### 1. Reading goal recap card
- Who: book bloggers (WordPress/Blogspot wrap-up culture) and the r/52book
  reading-challenge crowd; the monthly wrap-up is a fixed ritual on book blogs
  (Leah's Books has run one every month since December 2020).
- The construct: the yearly reading challenge (Goodreads Challenge / "52 books
  in a year"), tracked in Goodreads or StoryGraph. The artifact everyone has is
  the Goodreads library export (`goodreads_library_export.csv`: title, author,
  rating, date read, pages, shelves) - the only way the data comes out since
  Goodreads retired its API.
- The recurring need: once a month, a wrap-up post with the month's numbers -
  books finished, pages read, star breakdown, and pace against the yearly goal.
  The numbers are computed BY HAND, every month, per blogger.
- Evidence:
  - https://leahs-books.com/2022/11/05/monthly-wrap-up-october-2022/ - hand-tabulated
    "Books read: 43 ... Pages read: 9,130 ... Days per book: 2.63 ... Pages read
    per day: 125.33", plus genre/format tables, every month.
  - http://kamislibrarythoughts.blogspot.com/2022/11/october-stats.html - a hand-kept
    star table ("3 Stars: 3, 4 Stars: 11") and the goal line every challenger
    tracks by hand: "Goodreads Challenge - I am 16 books behind schedule. (88/125)".
  - https://booksense.app/tools/goodreads-stats - a whole tool exists to turn the
    export into monthly charts "ready to screenshot"; it documents the export
    flow and the CSV's fields (and its honest gaps: no genre column, Date Read
    often empty).
- Why m0saic fits: the wrap-up numbers are a small, fixed set of props (books,
  pages, avg rating, goal, books so far); the pace-against-goal bar is honest
  rectangles; deterministic, batchable (one card per month per blog), and the
  "16 behind (88/125)" line is exactly the kind of derived number a template
  computes instead of a person.
- Risks: book covers would need media we do not have (text-only card then);
  Goodreads exports lack genres, so the card sticks to counts, pages, ratings
  and pace - which is what the hand-made posts lead with anyway.

### 2. Espresso dial-in card
- Who: home baristas on r/espresso and Home-Barista; the shared tool is
  Beanconqueror (free, open source, logs 30+ shot parameters).
- The construct: the shot - dose, yield, ratio, time, grind, temperature. The
  artifact: the app's brew log (JSON export).
- The recurring need: every new bag of beans means a fresh dial-in, and the
  standard post is the shot's numbers. Apps already race to fill this:
- Evidence:
  - https://www.beanlog.so/ - its headline feature: "Generate a beautiful card
    from any shot and post it in a tap. Perfect for sharing dial-ins."
  - https://beanconqueror.com/ - user review quoted on the site: "the sharing
    feature is fantastic. It simply shares an image of your brew with all the
    stats".
- Why m0saic fits: a params grid + a ratio bar against the 1:2 window is
  rectangles; batch one card per shot from the export.
- Risks: the apps already generate share images in-app, so the demo mostly
  restates a solved problem; also a third numbers-card in a row after golf
  (day 021).

### 3. Concept2 erg score card
- Who: indoor rowers on the Concept2 forum and r/rowing; the community runs on
  the Concept2 Logbook and its rankings.
- The construct: the erg score (time/split/watts per piece). The artifact:
  the PM5 monitor summary screen itself - people photograph it, and a whole
  app exists just to read those photos.
- Evidence:
  - https://getwatta.com/ - "Photograph the PM5 after the piece and it reads
    the numbers" - the monitor photo is the community's proof and log.
  - https://www.c2forum.com/viewtopic.php?f=10&p=603179 - signatures carry
    typed PB lines ("500m: 1:26.0 1k: 3:07.8 2k: 6:37.1 5k: 17:26.2 ... FM:
    2:47:07.0"); a reply lists the Logbook rankings as the place to compare.
- Why m0saic fits: the PM5 summary is already a grid of numbers; a clean card
  from the Logbook CSV fields is batchable per test piece.
- Risks: the photo is proof of truth in a way a rendered card is not, and it
  is a second scorecard the day after the golf scorecard (day 021) - same
  shape two days running.

### 4. DJ setlist card
- Who: DJs uploading mixes (r/DJs, r/Beatmatch, Engine DJ forum) who owe
  Mixcloud a tracklist per show.
- The construct: the set; the artifact is the Serato History CSV (with the
  start-time column) or the .session file.
- Evidence:
  - https://help.mixcloud.com/hc/en-us/articles/360004053959-How-do-I-manually-add-a-tracklist-to-my-shows
    - Mixcloud's own help: fingerprinting "will not create a tracklist for you";
    it wants "Artist Name - Track Title - HH:MM:SS".
  - https://community.enginedj.com/t/playlist-export-to-cue-sheet/11475 -
    "the exported sheet was only marginally more useful than writing each one
    in individually."
  - https://songtimestamps.com/export-serato-playlist - a whole tool exists to
    turn the History CSV into a timestamped list.
- Why m0saic fits: a timestamped track roll is rectangles and text; could roll
  as a video.
- Risks: the real pain is text for an upload form, not a picture - a rendered
  card does not fix the Mixcloud box, and the share-visual evidence is thinner
  than the other three.

## Pick

Candidate 1, the reading goal recap card. It has the strongest hand-made
evidence (people literally publish "Pages read per day: 125.33" and "16 books
behind schedule (88/125)" computed by hand, monthly, for years), the artifact
is famous and maps to props directly, and it is not a third sports-ish
scorecard after days 018 and 021 - it opens the unused "personal" pack.

## Rejected today
- Espresso dial-in card: real need, but the apps already generate the share
  image in-app; weaker gap.
- Concept2 erg score card: strong community, wrong week - same shape as the
  golf scorecard shipped yesterday.
- DJ setlist card: the pain is a text paste box, not a visual.
