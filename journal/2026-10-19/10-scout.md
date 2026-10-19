# Scout - 2026-10-19

## Candidates (4, best first)

### 1. HYROX race split card
- Who: HYROX athletes who post a race-day graphic after each event. They gather around the official results site (results.hyrox.com), the HYROX app, and race-recap tools (PacePost, Sweatlas, Rox Lyfe).
- The construct: one race, always the same shape. Eight 1 km runs, eight stations in a fixed order (SkiErg, sled push, sled pull, burpee broad jump, row, farmers carry, sandbag lunges, wall balls), plus Roxzone time between them. The artifact is the official workout summary: athlete, bib, age group, division, overall time, rank, and a split/place for each run and station.
- The recurring need: after every race, athletes want a picture of that table for Instagram or a group chat. The results page is a wide timing table. The current fix is a screenshot, or typing every split into someone else's template.
- Evidence:
  - https://pacepost.app/guides/how-to-post-hyrox-results-on-instagram/ - "A screenshot of a results table is hard to read on a phone, looks like everyone else's, and buries the number you actually care about - your finish time. Generic template packs help, but you're stuck typing every split in manually."
  - https://results.hyrox.com/season-5/?content=detail&fpid=list&pid=list&idp=JGDMS4JI63FAA&lang=EN_CAP&event=H_JGDMS4JI466 - a real athlete page (Matthew Luxton, Barcelona, 01:12:40, rank 87): workout summary is Running 1 through Wall Balls, then Roxzone, run total, best lap, each with a time and a place.
  - https://roxlyfe.com/leaderboard-explained/ - the leaderboard "is not necessarily easy to understand"; the useful view is the athlete page: station times and station rank, plus division rank, age-group rank, and finish time.
  - https://sweatlas-hybrid.com/hyrox-result - "Crossed the line? Turn your Hyrox result into a branded card to share. Pick your division, enter your finish time, and post it."
- Why m0saic fits: the workout summary is already a stack of rectangles. Header: name, race, division, finish time, rank. Eight rows, each a run block beside a station block, width from the split. Footer: run total, Roxzone, best lap. Props mirror those columns. One card per athlete, no photo, no clock.
- Risks: HYROX and SkiErg are trademarks, so the card stays a data graphic (no wordmark, no logos). Sixteen in/out timestamps from the race replay will not fit; the demo is the workout summary only. Doubles and relay are a different shape. Photo-overlay apps already exist; this is the structured card, not a race photo. It is another splits card after swim, erg and sim-racing laps, so the picture has to read as a named-station race tape, not a time list.

### 2. Orienteering time-lost card
- Who: orienteers on Attackpoint, and club racers whose organisers publish splits.
- The construct: a course of controls. The artifact is an IOF XML splits file (name, club, status, start, finish, control codes, punch times), which WinSplits, OLA, eTiming and Sport Software already write.
- The recurring need: after a race, the question is which leg the time was lost on. The published splits are often a wrapped PDF. People want a diagram of time lost per leg.
- Evidence:
  - http://www.attackpoint.org/discussionthread.jsp/message_1589371 - 16 Sep 2025, Ansgar: analysis tools are "pretty deplorable"; "splits typically (at least in Germany) come as a terribly formatted PDF"; later, "I should script the graphical representation as well, as oocalc needs a lot of work to get the diagrams just right."
  - https://obasen.orientering.se/winsplits/online/en/file_format_info.asp - WinSplits asks software to emit IOF XML: name, club, status, start, finish, control codes and punch times.
- Why m0saic fits: one bar per leg, length the split or the time lost, a mark on the bad legs. Props are the punch list.
- Risks: WinSplits, Livelox and Splitsbrowser already draw this. The leftover pain is importing a bad PDF, which a prop template does not fix. Control count varies (a short course and a long one are different layouts). Weaker as a share card than as an analysis chart.

### 3. Archery indoor round card
- Who: club archers logging rounds for handicap and classification. OS Archers (UK) use Golden Records Online; indoor leagues shoot a fixed round such as the Indoor 300.
- The construct: a round is ends of arrows. Indoor 300 is 12 ends of 5 arrows, each arrow X/10/9/.../M, plus hits, golds and X count. The paper score sheet is the artifact.
- The recurring need: after every club night the score has to be logged, and the evidence is a photo of that sheet.
- Evidence:
  - https://www.osarchers.co.uk/hwto.html - "Scores must be accompanied by a photo of your score sheet or a screenshot from a scoring app"; the logged fields are date, age group, bow class, round, score, hits, golds and Xs.
  - https://rudysarchery.com/demo - a hosted Indoor 300 card is 12 ends, a counted total (278/300) and an X count (18); "photos required" and past ends stay locked.
- Why m0saic fits: an end-by-end grid with a running total and an X count is a still card. Props are the arrow values.
- Risks: clubs want a photo of the physical sheet as evidence, so a render does not replace the submission. Visually it is another score grid, close to the golf scorecard (day 21). Arrow-value strings are short, but 60 arrows is a lot of cells.

### 4. Curling line-score card
- Who: club curlers and bonspiel skips. Scoring apps (Score All, Curling I/O, club draw sheets) already keep the game.
- The construct: a line score. One number per end (0 for a blank, 1-8 for a count), hammer, steal, 6/8/10 ends plus an extra end.
- The recurring need: the line score is the picture of the game. Small clubs still want that card after the last end.
- Evidence:
  - https://score-all.com/sports/curling - "Curling is kept on a line score, one end at a time." The app scores +1 to +8 or a blank end, tracks the hammer, and offers a line-score overlay for a stream.
- Why m0saic fits: ten end cells, a hammer mark, a total. Props are the end scores.
- Risks: the line score is already the live scoreboard. A rendered still is a souvenir of a thing the scoring app just drew. Thin evidence that anyone is making that souvenir by hand.

## Pick

HYROX race split card. It beat the niche candidates because the media workflow is the thing people are already building products for: the official page is a timing table, and athletes screenshot it or retype every split to get a post. Orienteering is the better niche (IOF XML, time lost per leg), but WinSplits and Livelox already draw that diagram, and the leftover pain is PDF import. Archery's required artifact is a photo of the paper sheet. Curling's line score is already the scoreboard. HYROX is one fixed construct - eight runs and eight stations in a fixed order - so a small deterministic card of the workout summary is the demo.

## Rejected today

- Disc golf UDisc scorecard: same hole grid as the golf scorecard (day 21); passed over on 2026-10-18.
- Darts 501 recap: DartConnect already publishes a player card and a match recap; not a gap.
- Geocaching milestone image: Project-GC already generates the profile stats image.
- Soaring / WeGlide flight: the share object is the uploaded IGC flight, already on the contest site. No separate card people are making by hand.
