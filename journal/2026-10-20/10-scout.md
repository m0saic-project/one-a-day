# Scout — 2026-10-20

## Candidates (4, best first)

### 1. Geocaching milestone / profile-stat card
- Who: Geocachers who hit a milestone or want a stats card, gathered on the
  Geocaching forums (forums.geocaching.com), the Project-GC stats site, and
  their local clubs (e.g. YoGO posts a "congratulations on 1000 finds" note for
  every member who reaches one).
- The construct: the find count and its milestones. The first milestones are 1,
  10, 50 and 100 finds, then every hundred to 1000, every five hundred to 5000,
  then every thousand (Project-GC "Milestones tab"). The artifact every Premium
  member already has is the **My Finds pocket query** — a zipped GPX of every
  cache they logged, with per-find log date/type, cache type, and
  difficulty/terrain.
- The recurring need: a shareable "I hit N finds" card or profile-stats banner,
  generated from the GPX they already download. CacheSleuth already reads the
  My Finds GPX and builds a profile *banner* from it (Overview / Charts / Grids
  / Milestones / FTF / Finds sections), which the cacher pastes into their
  profile. Project-GC has a whole Milestones tab and BadgeGen badges. The
  moment repeats on every milestone and every "year in review".
- Evidence:
  - https://www.cachesleuth.com/tools/profilestats — "Upload your My Finds pocket
    query and see your geocaching statistics... [publish] a profile banner"
    built from Overview / Charts / Grids / Milestones / FTF / Finds.
  - https://project-gc.com/w/Milestones_tab — "The first milestones are 1, 10, 50
    and 100 caches, after that and up to 1000 caches every hundredth cache is
    considered a milestone."
  - https://www.geocaching.com/blog/2025/05/celebrating-25-years-of-geocaching-milestones
    — "As geocachers, we love milestones! We remember our first find, our first
    hide, the first Event we attended, our first international find..."
  - https://www.geocaching.com/help/index.php?id=118&pg=kb.page — the "My Finds"
    pocket query "returns all geocaches you found, including archived geocaches,
    and your log entries", a zipped GPX.
  - https://www.yogosc.org/announcements/congratulations-to-geohiker55-on-1000-finds
    — a local club announces "geohiker55 found his 1000th find yesterday".
- Why m0saic fits: rectangles on a canvas. A card with a big find-count, the
  milestone ordinal ("1,000th"), a cache-type breakdown as a small bar/pip row,
  FTF count, and a difficulty/terrain cell; props mirror the GPX fields
  (findCount, milestone, types per cache type, ftfCount, avgD, avgT, year). Batch
  one card per milestone or per year; deterministic, no GUI.
- Risks: the GPX itself must be parsed outside the template (props are the
  already-derived numbers), cache types are numerous (cap the mix to the top few),
  and existing tools (Project-GC, CacheSleuth) already show stats — so the angle
  must be the clean, deterministic *share card*, not another stats dashboard.

### 2. Disc golf round recap card (UDisc)
- Who: Disc golfers on r/discgolf and UDisc leagues; UDisc logs rounds with
  hole-by-hole scores, birdies/pars/bogeys, and a UDisc/PDGA rating.
- The construct: a round, scored against par, with a rating. Artifact: UDisc
  round data and its league "Export" (CSV).
- The recurring need: a clean per-round recap card (score, rating, birdies,
  bogeys, ace) to share after a good round or an ace.
- Evidence: https://udisc.com/events/... leaderboards with per-hole scores and
  "Rating | Round"; http://jim.roepcke.com/blog/archives/2025/01/01/year-in-review-2024.html
  — "According to UDisc I played 108 rounds... 286 birdies, 946 pars, 270 bogeys".
- Why m0saic fits: batchable round cards, props mirror the scorecard.
- Risks: nearly the same shape as the day-21 golf scorecard (birdie/bogey grid),
  and UDisc already has strong native share surfaces.

### 3. FPV drone flight recap (Betaflight blackbox)
- Who: FPV pilots on intoFPV.com, RCGroups, and the Betaflight Discord; the
  flight controller writes a `.bbl` blackbox log per armed flight.
- The construct: a flight, with telemetry (top speed, altitude, flight time,
  battery, RSSI). Artifact: `.bbl` logs decodable to CSV via `blackbox_decode`.
- The recurring need: a flight recap card/clip to share after a good session.
- Evidence: https://ghosttracefpv.com — "FLIGHT RECAP — Written from your
  telemetry once the flight is on your account"; https://betaflight.com/docs/wiki/guides/current/Black-Box-logging-and-usage.
- Why m0saic fits: deterministic recap from decoded CSV fields.
- Risks: community behavior skews toward PID tuning, not sharing recaps, and
  GhostTrace already generates the recap card.

### 4. Bowling league series / milestone card (USBC)
- Who: USBC league bowlers; the construct is the series and the 300 game / 700 /
  800 series milestones.
- Artifact: USBC "Bowler Average Sheet" and league standing sheets, not a clean
  per-bowler file a player exports themselves.
- The recurring need: a "I rolled a 300" or season-average card.
- Evidence: https://membership.bowl.com/USBCsearch/ViewMember-LeagueSheet.jsp,
  https://bowl.com/a-future-for-the-sport/2026-state-of-the-association.
- Why m0saic fits: a clean scorecard/award card.
- Risks: artifact lives with the league secretary, not the bowler; USBC already
  issues awards, so the "make it yourself" need is thinner.

## Pick

**Geocaching milestone / profile-stat card.** It is the most on-thesis niche of
the day: a community organised around one construct (the find count and its
milestones) with a shared artifact every member already downloads (the My Finds
GPX), and a recurring show-off moment (milestones and year-in-review) still
served today by hand-built banners. It is also cleanly distinct from all 30
prior days — no geocaching template exists.

## Rejected today
- Disc golf round recap: too close to the day-21 golf scorecard and UDisc already shares natively.
- FPV drone flight recap: tuning-focused community, and GhostTrace already ships the recap card.
- Bowling league series card: the artifact sits with the league secretary, and USBC awards cover it.
