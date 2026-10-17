# Scout - 2026-10-17

Reddit refused anonymous clients again (403 on `reddit.mjs`, stub pages from both
web fetchers), so every citation below is a page I opened through the community's
other homes: the Concept2 forum and Logbook site, Project-GC's wiki, Anki's docs
and GitHub. Nine searches across four communities (rowing, geocaching, Anki,
Discogs/vinyl); `journal/index.json` was checked against each candidate for
repeats.

## Candidates (3-5, best first)

### 1. Concept2 erg PR card (indoor rowing)

- Who: indoor rowers - club and masters rowers, CrossFitters, home-erg owners.
  They gather on the Concept2 forum (c2forum.com), the Concept2 Online Logbook
  (log.concept2.com), and r/Rowing, which runs a weekly "Success & Erg Screen
  Thread" (reddit blocks keyless fetch, so I read the forum and Logbook homes
  instead).
- The construct: the erg score. Every piece ends on a Performance Monitor result
  - time or distance, /500m split pace, stroke rate (spm), watts, calories, drag
  factor. The community's reference artifacts are the PB ladder across the fixed
  benchmarks (500m, 1k, 2k, 5k, 10k, 30min, 1hr, half, full) and the Concept2
  Online Ranking, which publishes percentile bands per season/age/weight/gender.
- The recurring need: every PR and every season 2k test wants a shareable
  record. Forum posters type raw numbers into PB threads or carry the whole
  ladder in their signature; reddit posters photograph the monitor screen; the
  Logbook hands them structured CSV rows but no picture.
- Evidence:
  - https://www.c2forum.com/viewtopic.php?t=156093 - the forum's PB thread (185
    posts, 13 pages): "Having a skierg PB thread is a good way to show off hard
    work & progress". One poster's signature IS the ladder: "63yo, 62kg, Erg
    500m, 1:58.6; ... 2k 8:04; 5k 20:46; 30min 7096m; 10k 43:49; 1 hour 13578m;
    half marathon, 1:37:49; marathon, 3:36:47"; another posts "5k 18:42,2 81 drag
    rate 37".
  - https://log.concept2.com/rankings/2026/rower/2000 - the public 2000m ranking
    page for the current season: 10198 ranked people, average 8:13.5, percentile
    bands printed on the page (90th 6:50.8, 75th 7:19.3, 50th 7:55.0, 25th
    8:48.8, each with its /500m pace).
  - https://www.concept2.com/logbook - the vendor's own pitch for the moment:
    "Broken your personal best and want to shout it to the world... you can use
    the Logbook to share your workouts with your friends."
  - https://www.concept2.nl/en/service/software/concept2-utility/how-to-use/transferring-results-to-spreadsheet - the Concept2 Utility writes every PM5/LogCard result out as a .csv ("LogCard.csv");
    https://www.c2forum.com/viewtopic.php?t=202783 shows users pulling the same
    CSV out of the online Logbook ("I use a pm5 and ergdata, then upload from the
    app to Concept2 logbook... downloading the csv file from my online logbook").
- Why m0saic fits: the card is numbers in boxes - the split (1:xx.x /500m) as
  the hero figure, time/distance/spm/watts/drag as footer cells, one pace bar
  per benchmark across the ladder, a percentile chip from the published ranking
  bands. All deterministic from ~10 props; a club test night or a CrossFit box's
  row benchmark is one render per results row (batchable); no media input.
- Risks: it is another stats card in a genre this repo has visited (swim,
  powerlifting, cubing) - the demo must lean on what only the erg has: split
  pace as the community's unit, the watts conversion, the fixed benchmark ladder,
  the season percentile bands. Percentiles move with the season/age/weight
  filter, so the card should take the percentile as a prop, not claim to compute
  it. Still image first; a count-up-to-split clip is possible but not the need.

### 2. Geocaching D/T matrix card

- Who: geocachers on Project-GC, the geocaching.com forums and r/geocaching.
- The construct: the D/T grid - 81 combinations of Difficulty (1-5) x Terrain
  (1-5) with a find count per cell, plus the "Way to 81" / Matrix Cacher badge
  and finds milestones (every 100 finds).
- The recurring need: D/T-grid challenge caches require the finder to show the
  grid when logging; milestone posts are a weekly ritual.
- Evidence:
  - https://project-gc.com/w/Finds_tab - Project-GC's own profile-stats docs: "A
    D/T grid showing all 81 combinations of Difficulty and Terrain ratings, with
    the number of caches found for each combination", the "Way to 81" summary
    below it, and "Filling in the grid increases the user's Matrix Cacher Badge."
- Why m0saic fits: the grid is literally 81 rectangles with counts and heat
  colors - the most m0saic-native picture of any candidate today.
- Risks: Project-GC already renders exactly this grid on every member's
  profile, so the template would mostly be an image of an image; 81 counts as
  hand-entered props is heavy for a demo; the geocaching.com forum thread on
  challenge suggestions sits behind a login wall for post content.

### 3. Anki study streak / stats card

- Who: Anki users (med and language learners) on AnkiWeb, forums.ankiweb.net and
  r/Anki.
- The construct: the review log (revlog) distilled to streak, days studied,
  review counts, retention, visualised as a GitHub-style heatmap.
- The recurring need: streak milestones and study wrap-ups get posted to r/Anki;
  the official stats window even exists to be shared.
- Evidence:
  - https://docs.ankiweb.net/stats.html - official docs: "Clicking on 'Save
    PDF' at the bottom will save a PDF document of the statistics to a file on
    your desktop to make it easy to share your statistics with others."
  - https://github.com/glutanimate/review-heatmap - the 1.3k-star add-on: "Adds
    a heatmap graph to Anki's main window which visualizes past and future card
    review activity, similar to the contribution view on GitHub. Information on
    the current streak is displayed alongside the heatmap."
- Why m0saic fits: a contribution-grid heatmap is rectangles; a streak milestone
  card is four numbers in boxes plus a bar.
- Risks: a true heatmap needs ~365 daily counts as props; a stats-only card
  overlaps day 22's reading wrap-up shape (counts plus pace against goal); and
  users who want the image already have add-ons for it (including a paid
  Yearly Heatmap Generator that exports heatmaps as images).

## Pick

The Concept2 erg PR card. It has the cleanest prop shape of the day (one result
row: time, /500m split, spm, watts - or the fixed benchmark ladder), a ritual
the vendor itself names ("shout it to the world" for every broken PB), and every
cited page is public and structured, including the ranking's published
percentile bands, which no other candidate offered as quotable numbers. It also
breaks no repeat: the repo has never touched rowing, and split-pace/watts/
season-percentile are fields none of the 27 shipped cards use.

## Rejected today

- Geocaching D/T matrix: Project-GC already renders the exact grid on member
  profiles (an image of an image), and 81 hand-entered props is a heavy demo.
- Anki study stats: the numbers are already exportable (official Save-PDF,
  heatmap add-ons, paid image-export add-on) and a stats-only card repeats day
  22's reading wrap-up shape.
- Discogs collection milestones: the platform's year-in-review is global, not
  personal, and no personal share-image need surfaced in pages I could open.
- Peakbagging tick lists (46ers, Wainwrights): a done/undone peak grid is day
  25's 10x10 pip grid with different nouns.
