# Scout — 2026-10-14

Searched across five communities (board games/BGG, geocaching, osu!, Warhammer
40k, RetroAchievements): ~8 web searches plus ~20 page fetches through the
keyless helpers. Reddit itself refuses anonymous fetches (a JS wall, unchanged
since 2026-09-26), and boardgamegeek.com/bgg.cc return 403 to the fetcher, so
every citation below is a community home I could actually open: vendor pages,
hobby blogs, GitHub, tool sites. HN had nothing on any of these niches.

## Candidates (3–5, best first)

### 1. 10x10 Challenge Progress Card
- Who: board gamers running the yearly "10x10" challenge — pick 10 games,
  play each 10 times before the year ends. They gather on BoardGameGeek
  (forums, geeklists, the challenge guild and its microbadges), r/boardgames
  and r/soloboardgaming, Fediverse boardgames groups, and the hobby blog
  scene (Honest Meeple, Variant Hex, Leminal Space, BoardGameStash).
- The construct: the 10x10 list itself — 10 named games, a target of 10 plays
  each, 100 plays a year, "runs on the honor system tracked by each player
  themselves". The artifact every member already has is the play log: plays
  logged on BGG (the XML API2 `plays` endpoint serves per-game, per-year
  counts) or the BG Stats app's challenge tracker; geekgroup.app syncs both.
- The recurring need: a progress artifact. List post in January, progress
  updates through the year, completion badge in December. Today that artifact
  is made by hand: a chart drawn on paper and pinned to the fridge, a $35
  wood board with 10 meeples, a Google Sheet, or walls of text edited into a
  geeklist.
- Evidence:
  - https://thebrokentoken.com/products/10x10-challenge-board-kit — a
    commercial wood tracker: "Your 10 green meeples start the challenge to
    the left of the whiteboard space... move the meeples along the track to
    mark each game played. When all 10 meeples reach the tenth spot...
    challenge completed!" People pay for a physical progress grid.
  - https://boardgamestash.com/learn/10x10-board-game-challenge — the rules
    page: "pick 10 games at the start of the year and play each one 10 times
    before the year ends, for 100 total plays... runs on the honor system
    tracked by each player themselves"; it "spread through BoardGameGeek
    forums and later Reddit and Discord"; tracking must "show your running
    total per game at a glance". Also documents the variants (5x10,
    wildcard slots, half-year, family 10x10).
  - https://leminal.space/post/3028676 — a household's hand-made artifact:
    "To track everything I made up a chart to keep on the fridge and color
    in every time we played a game on the list." Their 2024 variant: 5 games
    x10 and 10 games x5, still 100 plays.
  - https://honestmeeple.co.uk/10x10-challenge-2020 — the recurring share
    moment, stated: "There will be regular updates throughout the year on my
    progress, sharing the challenge page with you all so you can check up on
    my progress" (via the BG Stats app's challenge page).
  - https://www.varianthex.com/blog/2020/07/02/10x10x5-challenge-part-one —
    spreadsheet tracking: "I've been tracking my progress using a Google
    sheet... I've played 22 different games for a total of 132 plays. Here
    are the games I've played 10 times so far:"
  - https://github.com/naxhh/tenXtenTrackerApp — the data path a tool takes:
    per-year, per-game play counts straight from
    `boardgamegeek.com/xmlapi2/plays?...&username=<user>&id=<game>`.
- Why m0saic fits: the construct IS a grid of rectangles — 10 rows of game
  names, 10 pips per row, filled vs empty, a completion bar, "X/100" headline.
  Props mirror the artifact (games + play counts + year + goal-per-game for
  the 5x10/10x5 variants). Pure counts, no randomness, fully deterministic;
  batchable — every member's month in one CLI render, no GUI, no screenshots.
- Risks: long game names ("Pandemic Legacy: Season 1") against a one-line
  name column — text fit is the main design risk (wrap or measured shrink,
  never ellipsis); the variants need one goal knob so the card doesn't lie
  about someone's 10x5 list; plays over goal need a deterministic display
  rule; the share moment is real but today it is text and app screenshots, so
  this is a new artifact — a demo that shows the idea, per the founder's
  direction.

### 2. Geocaching Milestone Card
- Who: geocachers — r/geocaching, regional clubs and blogs, and a whole tool
  ecosystem around the "My Finds" pocket query (CacheStats, GSAK, Project-GC,
  MyGeocachingProfile).
- The construct: the My Finds pocket query — one GPX/zip with every find and
  log; the milestone (1000th, 5000th, 10,000th find) is the community's
  recurring celebration.
- The recurring need: milestone and stats posts. Today: phone screenshots of
  the app or the Groundspeak stats page, or stats pasted into the gc.com
  profile.
- Evidence:
  - https://logicweave.com/ — CacheStats "analyzes your 'My Finds' pocket
    query" for find rate, streaks, milestones and a goal calculator; the
    query can be regenerated every 3 days.
  - https://www.geocacherscompass.com/how-to-geocache/my-finds-pocket-query/ —
    "a single file that contains ALL of your caches you have found and all of
    your associated logs."
  - https://tentmantent.co.uk/2024/11/21/plotting-the-past-the-story-of-my-stats/ —
    the stats-reading culture: Project-GC profile graphs read like a diary; a
    comment: "I'm posting a milestone tribute cache for her 10,000th find and
    at our monthly meetup tonight presenting her with a 10K coin."
- Why m0saic fits: a milestone card from the computed numbers (total finds,
  first find date, best day, milestone cache) is deterministic and batchable.
- Risks: MyGeocachingProfile already renders profile images from the same
  pocket query; the raw GPX is thousands of rows, so the template takes
  summary numbers as hand-filled props, not the file; and the shape (a stats
  recap card) is close to days 22 and 24 (reading goal, VATSIM log).

### 3. osu! Scorepost Card
- Who: osu! players — r/osugame and its tool ecosystem (osu!scorepost, Look
  At My Score, sm4ko's generator, o!rdr).
- The construct: the score result screen — map, difficulty, mods, accuracy,
  max combo, 300/100/50/miss counts, grade letter, PP.
- The recurring need: every good play becomes a "scorepost" image for
  Discord/Reddit; the community even has official-ish post criteria.
- Evidence:
  - https://lookatmysco.re/ — "Ever thought the osu! result screen is just a
    tad too big to spam in a discord chat... Simply enter some details below
    and get a nice picture generated just for you!"
  - https://tools.osuck.net/?item=osu%21scorepost+by+sm4ko — directory entry:
    "Generates Scorepost Title, Generates Score Screenshot... Automatically
    opens r/osugame with the title already written in the submission box."
- Why m0saic fits: rank counts and combo as rectangles; deterministic from
  the score's numbers.
- Risks: at least three free generators already serve this exact workflow,
  and they work straight from a score link via the osu! API while a m0saic
  template would take hand-entered props; the recognizable scorepost includes
  map artwork (media we lack — a text/rect card looks generic next to
  theirs).

### 4. Warhammer 40k Roster Card
- Who: Warhammer 40k players — r/Warhammer40k, r/WarhammerCompetitive, and
  the list-builder ecosystem (BattleScribe, New Recruit, ListForge,
  WarOrgan).
- The construct: the army roster — a points-validated list (BattleScribe
  `.roster` XML or the builders' exports) of units, models, enhancements.
- The recurring need: sharing lists — for feedback ("rate my list"), for the
  pre-game handoff the mission packs literally require ("Each player must
  then provide a copy of the army roster for their opponent"), and after
  tournaments.
- Evidence:
  - https://www.newrecruit.eu — "List Sharing: Share your lists with a link
    or QR code. Anyone can view them, no account needed"; "the community's
    favourite BattleScribe replacement, trusted by thousands of players and
    tournament organisers."
  - https://share.listforge.club/6cdbf79d0de89cbc4c64 — a live shared-list
    viewer offering Interactive / Simple Text / Short Text / Detailed Text /
    WTC Text renderings of one roster.
- Why m0saic fits: a roster-at-a-glance card (faction, points, unit rows by
  role, model count) from the roster numbers as rectangles.
- Risks: the community's chosen answer to list sharing is text exports, links
  and QR codes, not images — the "stop screenshots, use the export" advice I
  found lives on reddit, which refuses citation; a full roster is a text
  table, and the builders already print/export it well.

## Pick

The **10x10 Challenge Progress Card**. The construct is the most literal
rectangles-on-canvas fit this repo has seen — the challenge IS a 10x10 grid —
and the artifact (the named 10-game list plus per-game play counts) is already
written down in BGG play logs and BG Stats, recurs on a calendar (January
list, monthly updates, December badge), and is still rendered by hand as
fridge charts, wood boards, spreadsheets and text walls, with no image tool
in sight. Geocaching and osu! both have established generators already
serving their moment, and 40k's community chose text and links over images.

## Rejected today
- RetroAchievements mastery cards: "Mastery #N" posts are constant, but the
  share is a game screenshot plus text, and the citable evidence lives on
  reddit only.
- Letterboxd monthly recap: real community and a CSV export, but it is day
  22's reading wrap-up with films instead of books.
- Go (baduk) game recap from SGF: day 18 shipped chess from PGN; too close.
- Disc golf round recap from UDisc: day 21 shipped golf's scorecard; too
  close.
