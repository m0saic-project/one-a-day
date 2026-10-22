# Scout - 2026-10-22

Day 33. Checked journal/index.json first: 32 shipped days already cover speedrunning,
cubing, chess, ham radio, sim racing, birding, homebrew, swim, powerlifting, golf,
climbing, reading, VATSIM, board games, osu, MTG, rowing, WH40k, HYROX, geocaching,
typing, astro, genealogy, parkrun, college radio, podcasting, crosswords, and the dev/
social staples. Searched nine queries across five communities (disc golf, tournament
Scrabble, speech/debate, Zwift, espresso, FRC, peakbagging). Best candidates below.

## Candidates (4, best first)

### 1. FRC event recap card (FIRST Robotics Competition)
- Who: high-school robotics teams and their media/outreach students, plus mentors.
  They live on Chief Delphi (chiefdelphi.com), team Instagram accounts, and r/FRC.
  Every team is known by its number.
- The construct: the team number and the competition season. The shared artifact is
  The Blue Alliance (thebluealliance.com), which republishes the FIRST Events API:
  per team per event it shows qual rank, W-L-T record, alliance selection
  (captain / 1st pick / 2nd pick), playoff finish, awards, and district points.
- The recurring need: after every event (2-8 per season, plus the October-December
  offseason circuit that is running right now), someone on the team makes the recap
  post - an Instagram graphic or a Chief Delphi write-up with the rank, record,
  alliance and awards. Season-level "wrapped" cards are an established genre too.
- Evidence:
  - https://www.chiefdelphi.com/t/release-frc-rewind-a-visual-season-recap-for-every-frc-team/522858
    - Team 9077 shipped "FRC Rewind" (July 2026), "a free web app that transforms any
      FRC team's season into a visual recap using The Blue Alliance data" with a
      "high-quality shareable recap card"; 17 likes, replies include "Now I have
      something other than Spotify Wrapped!" and a request for a card per season.
  - https://www.thebluealliance.com/team/9128/2026 - the artifact itself: "Team 9128
    was Rank 1 with a record of 17-0-0 ... competed in the playoffs as the Captain of
    Alliance 1 and won the event," award list, district-points breakdown.
  - https://www.chiefdelphi.com/t/frc-team-1710-2026-build-thread-open-alliance/507939?page=4
    - "the media team uploaded some pictures, and I have had a nap! That means it is
      time to write an event recap" - the hand-made per-event recap ritual, with stat
      bullets (rank, EPA, alliance number) quoted from The Blue Alliance / Statbotics.
- Why m0saic fits: props mirror the TBA fields one-for-one (teamNumber, eventName,
  weekLabel, qualRank, record, allianceRole, playoffResult, awards[], districtPoints).
  One deterministic card per event; batch a whole season from a JSON file; pure
  rectangles, digits and chips - no robot photos needed, so no taste-heavy imagery.
- Risks: FRC Rewind exists (season level, hosted web app, made in July 2026) - that
  validates the workflow more than it competes with a self-hosted, batchable, per-event
  template, but the brief should make the per-event angle explicit. Award names are
  long free-text strings (text-fit discipline needed). FIRST trademarks: keep it a
  numbers card, no logos.

### 2. PDGA rating-update card (disc golf)
- Who: disc golfers; r/discgolf is one of the largest hobby subs, local leagues run
  on UDisc.
- The construct: the PDGA player rating (roughly 300-1050), republished on the second
  Tuesday of every month; UDisc layers its own 1-300+ round ratings on top.
- The recurring need: ratings day is a monthly ritual - players check the new number,
  celebrate division thresholds, post it. League players also share UDisc scorecards
  weekly.
- Evidence:
  - https://www.pdga.com/announcements/pdga-player-ratings-update-published-october-13-2026
    - "PDGA Player Rating Updates are published on the second Tuesday of every month"
      (the tenth update of 2026 went out nine days ago).
  - https://udisc.com/blog/post/udisc-round-ratings - UDisc built a whole parallel
    rating system because players obsess over the number.
  - https://help.udisc.com/en/articles/10705081-how-can-i-export-my-scorecards-to-a-csv
    - the export path for the underlying rounds.
- Why m0saic fits: hero-number card - old rating, new rating, delta, distance to the
  next division line (970 MA1 etc.), rated-round count. All props, all deterministic.
- Risks: both apps already surface the number, so the card adds presentation, not
  missing information - the "I make this by hand" pain is weaker than FRC's. And a
  number-hero sports card rhymes with day 21 (golf scorecard) and day 28 (erg PB).

### 3. Tournament Scrabble cross-table recap
- Who: NASPA club and tournament players; cross-tables.com and scrabbleplayers.org
  are the shared record.
- The construct: the cross-table - per player per event: OLD RATING, the W/L/L row
  against each opponent, WINS, SPR (spread), PERF RATING, NEW RATING.
- The recurring need: after a tournament players post their record, spread and rating
  change to club groups; the cross-table row is the canonical text artifact.
- Evidence:
  - http://www.scrabbleplayers.org/tourneys/2026/xt/05/007.shtml - the Austin May 2026
    cross-table, every field above in plain text.
  - https://www.scrabbleplayers.org/w/Tournament_results - NASPA's own docs on reading
    these tables ("detailed tournament results (also known as cross-tables) for all
    sanctioned tournaments").
- Why m0saic fits: the row is already tabular - a card with a W-L chip strip, spread,
  and an old-to-new rating delta renders deterministically.
- Risks: the community shares links and text, not images; I found no existing "we make
  graphics" workflow, so the template would be inventing a habit rather than serving
  one. Small numbers everywhere - risk of shipping a spreadsheet row.

### 4. NH48 peakbagging progress / completion grid
- Who: White Mountains hikers - the AMC Four Thousand Footer Club, peakery and
  peakbagger.com loggers, and the big Facebook groups.
- The construct: the fixed list of 48 New Hampshire 4,000-footers; peakery's NH48
  challenge has 1,152 pursuers and 109 finishers; the AMC awards a patch on completion,
  and hardcore hikers chase "The Grid" (all 48 in all 12 months).
- The recurring need: completion announcements ("Carrigain for number 48!"), winter
  tallies, and progress trackers - people literally keep the 48-cell checklist.
- Evidence:
  - https://peakery.com/challenges/new-hampshire-4000-footers-Challenge - "THE
    mega-classic New Hampshire peak challenge," pursuer/finisher counts, per-peak
    climb logs.
  - http://4000footers.com/list_nh48.shtml - the canonical list with a "printable
    mountain checklist" and the patch links.
- Why m0saic fits: a 6x8 cell grid, one cell per peak, filled and dated from props;
  progress-bar header; completion variant. Extremely deterministic.
- Risks: the summit photo is the real share object; the grid complements it rather
  than replacing anything painful. Seasonal and regional.

## Pick

**FRC event recap card.** It is the only candidate where the evidence shows a media
workflow happening by hand right now - media students write recap posts after every
event, and the community liked a purpose-built recap-card web app enough to ask for
more card outputs - while the shared artifact (The Blue Alliance team-event page)
maps one-to-one onto props. Disc golf's rating day is a bigger crowd but the number
is already well-served by two apps, and the card shape rhymes with two earlier days;
FRC is a community this repo has never touched.

## Rejected today
- Zwift race result card: too close to day 13 (lap telemetry) and day 28 (erg PB) -
  another power-numbers-on-a-card.
- Espresso dial-in card: apps (Dialed, DialInLog) already own the log-and-share
  workflow; the shared moment is a text recipe table, not an image people make.
- Speech & debate (Tabroom): rich artifact (ranks, speaker points) but no visible
  card/graphic workflow surfaced in search.
