# Scout - 2026-10-23

Day 34. Read journal/index.json first: 33 shipped days already mine most of the
classic niches (LiveSplit, csTimer, ADIF, PGN, BeerXML, OpenPowerlifting, eBird,
GEDCOM, BattleScribe, Moxfield, Monkeytype, The Blue Alliance, Concept2). Day 33's
scout searched disc golf and espresso and rejected the angles it found - noted in
place below; today's disc golf pick is a different artifact, not a retry. Ran eight
searches across five communities (disc golf, home espresso, CTF/security, concert
setlists, locksport, plus quiz bowl as a look). reddit.mjs still gets 403 and the
web tool only reaches threads through search snippets, so thread evidence below is
paraphrased from threads whose text I read.

## Candidates (5, best first)

### 1. Disc golf bag chart - the speed x stability matrix
- Who: disc golfers. r/discgolf (one of the larger hobby subs), r/mydiscbag, local
  UDisc leagues, disc shop and reviewer socials. They gather around bag posts:
  "rate my bag", "bag check", "what am I missing".
- The construct: every disc is catalogued by four flight numbers - speed, glide,
  turn, fade (a "9 5 -1 2" mid/fairway is how the community talks). The artifact a
  member already has is the bag: a list of discs, each with those four numbers,
  kept in MyDiscBag, DG Puttheads' bag tool, DiscField, TaDisc, UDisc's disc shelf,
  or a spreadsheet.
- The recurring need: the bag chart as a picture - the plot of the bag on the
  speed x stability map people post whenever the bag changes (several times a
  season), plus the league/shop "here is a balanced bag" content. Today that
  picture is a screenshot of a bag website (the standard look of "rate my bag"
  posts) or a hand-built spreadsheet chart.
- Evidence:
  - https://discfield.com/bag-check - "The speed and stability map plots each disc
    using manufacturer speed and turn + fade ratings. Its numbered points
    correspond to the disc list and can be downloaded as SVG" - the map is the
    deliverable, and the page is framed as gap-finding ("What is in your bag?").
  - https://tadisc.com/ - "Flight path overlays and stability grids show you your
    bag's true coverage at a glance. Spot overlaps, find holes, and make smarter
    decisions about what stays and what goes."
  - https://www.reddit.com/r/discgolf/comments/1s9o3c7/bag_check/ - Apr 2026, 98
    points, 109 comments: "Feeling like I'm missing something today" with a bag
    chart image; replies are pure slot talk ("You are missing 4 or 5 14 speeds").
  - https://www.reddit.com/r/mydiscbag/comments/12ratod/how_does_my_bag_look_any_holes/
    - answers name the empty cells: "lacks the ubiquitous overstable approach
    slot", "I'd try to find something in the 10-11 speed range and -1 to -2.
    There seems to be a hole there to me."
  - Spreadsheet evidence the chart is hand-made when the tools fall short:
    https://www.reddit.com/r/discgolf/comments/kunimh/i_created_a_spreadsheet_for_my_inventory/
    ("where the disc stands on the Marshall Street flight chart") and
    https://www.reddit.com/r/discgolf/comments/18g11z9/spreadsheet_of_disc_flight_numbers/
    ("would love to... make plot charts or other visual aids").
- Why m0saic fits: props mirror the artifact one-for-one (discs[]: name, speed,
  glide, turn, fade, category derived from speed). The picture is rectangles - the
  matrix tools literally describe: speed bands as rows, stability (turn + fade) as
  columns (see https://www.discgolf-germany.de/bag-builder/ "Stabilitatsdiagramm"),
  one chip per disc, slotting deterministic so overlaps stack instead of collide.
  Fully batchable: one card per bag, per player, per shop list; still and clip.
- Risks: bag websites already draw versions of this chart, so the template wins
  only as the clean deterministic share render (no account, no screenshot, your
  own props) and the brief must say so; long mold names stress text fit; a
  stability x speed plot can degenerate into a wall of chips if the slotting is
  naive; and it must stay the bag chart, not drift into day 33's rejected PDGA
  rating card.

### 2. CTF event recap / "rewind" card
- Who: capture-the-flag teams (security students, hobbyist hackers) and event
  organizers; they live on CTFtime, team Discords, and writeup blogs.
- The construct: the CTFd (or Flagpost/rCTF) scoreboard export - per challenge:
  category, solves, first blood; per team: rank, points, solve list. Everyone
  agrees on first bloods, categories (pwn/web/crypto/rev/forensics) and dynamic
  scoring.
- The recurring need: after every event (several per weekend worldwide) teams
  write recap posts with the numbers, and organizers post highlight images -
  top 3, most first bloods, category breakdown. Input is the CTFd backup export.
- Evidence:
  - https://github.com/caveeroo/ctfd-rewind - "a simple tool that provides
    interesting visual insights on finished CTFd competitions" (solves per
    category, first bloods, challenge stats) exporting "SVG, PNG, PDF" from the
    CTFd backup - someone already automated the picture, badly, per event.
  - https://www.linkedin.com/posts/vulnbydefault_ramadan-ctf-2026-final-highlights-most-activity-7442229994094993409-22os
    - organizer recap image: "Most First Bloods: Bikini Bottom (11) ... Top 3".
  - https://xoblackburn.medium.com/discovery-ctf-writeup-cybersimba-initiative-a75b0f1186c4
    - the team ritual: "secured 3rd place with a solid 4,030 points. We snagged 2
    First Bloods (largest flag haul!), 0 Second Bloods, and 3 Third Bloods".
- Why m0saic fits: a score hero (rank, points, solves), category grid cells,
  first-blood chips, solve-timeline bar row - all props, all rectangles, no
  terminal screenshots needed. Batchable per team per event.
- Risks: the real share moment skews to text writeups; recap images so far are
  organizer-side; the CTFd export is dense JSON the brief would simplify to plain
  props; team names are long garbage strings ("4 score checks and 7 clears ago...").

### 3. Locksport belt-stats snapshot
- Who: lock pickers (r/lockpicking, LPU Discord); the community literally ranks
  itself in karate belts.
- The construct: the LPU belt ranking system (Lockpickers-United/Belt-Ranking-System,
  lpubelts.com) - every lock classified white through black, every member's
  picked-lock list earning belts and dan points. The artifact is the belt history
  spreadsheet the mods keep.
- The recurring need: monthly "Snapshot of r/lockpicking belt stats" images made
  by hand from that spreadsheet (posted for years), plus per-member belt
  promotion posts ("Just got my white belt!").
- Evidence:
  - https://github.com/Lockpickers-United/Belt-Ranking-System - "This project was
    written as a fun game on reddit.com/r/lockpicking. It has since become very
    popular" - the shared construct, with per-belt lock lists.
  - https://www.reddit.com/r/lockpicking/comments/1ehkebc/snapshot_of_rlockpicking_belt_stats/
    - Aug 2024, 86 points: the monthly stats image posted from a "Historical
    spreadsheet" (public Google Sheet); a reply: "Turn it into a graph".
  - https://github.com/Lockpickers-United/Belt-Ranking-System/blob/master/karatebelts.md
    - the ranking rules members cite when they post belt requests.
- Why m0saic fits: a belt-ladder of colored bands (white->black), counts and share
  per band, plus a per-member variant (picked locks listed under their belt
  color). Colors are semantic, geometry is trivial, fully deterministic.
- Risks: the recurring image is currently made by one maintainer, not by "a group
  of people"; the per-member share moment is video proof of a pick, not a still;
  evidence for a card habit is thinner than candidates 1-2.

### 4. Espresso dial-in sheet card
- Who: home baristas (r/espresso and friends); they buy beans by the bag and
  "dial in" each bag over 3-6 shots.
- The construct: the shot recipe line - grind setting, dose (g), yield (g), ratio,
  time (s), taste tag, next change. Printable dial-in sheets exist for exactly
  this; apps (Dialed In, ShotHound, Beanlog, Pucksmith) log it and some already
  render "shareable recipe cards" and "monthly recap as an image".
- The recurring need: the recipe card for a bag once the shot is locked
  ("18 g -> 36 g, 28 s, grind 13.5"), shared with friends/cafes or kept on the
  bag shelf; plus the dial-in progression table.
- Evidence:
  - https://completehomebarista.com/guides/espresso-dial-in-sheet-a-printable-dose-yield-and-taste-log/
    - the hand-made artifact: a printable table (grind, dose, yield, ratio, time,
    taste, next change) kept "with each bag of coffee".
  - https://shothound.com/ - "Shareable Recipe Cards ... a formatted recipe card
    at a unique URL" - the app market already noticed the moment.
  - https://www.dialedin-app.com/en - "Turn shots into shareable cards and share
    your Monthly Recap as an image."
  - https://www.baristacalc.com/espresso-dial-in-helper/ - "Write it on the
    recipe card, share it with the team" - the ritual in the community's words.
- Why m0saic fits: one row per shot (a rectangle strip), computed ratio, the
  keeper row highlighted, target line at top - batchable one card per bag of
  beans; ASCII-only copy fits the domain's numbers.
- Risks: day 33 already read this one and rejected it ("apps already own the
  log-and-share workflow; the shared moment is a text recipe table, not an image
  people make"); my evidence confirms that read more than it overturns it - the
  apps ship the image. Taste-heavy culture (the cup photo is the real post).

### 5. Setlist night recap card
- Who: concert-goers and jamband fans organized around setlist.fm, the fan-run
  archive of "what bands played, night by night".
- The construct: the setlist - venue, date, ordered songs, encore split, and the
  fan extras (bustouts, debuts, "Nth time played").
- The recurring need: the poster/card of "the show you were at", per night, per
  tour; several paid tools already fetch setlist.fm and sell posters.
- Evidence:
  - https://setlistart.com/ - "Search any artist - we turn their real concert
    setlist into a poster" (setlist.fm data, paid download).
  - https://mysetprint.com/ - free set posters for DMB/Dead/Goose: "Every song
    your band played that night, drawn as a constellation."
  - https://github.com/evengene/lp-setlist-comparison - a fan tour site whose
    features include "download a shareable recap card" per show.
- Why m0saic fits: numbered song rows, encore divider, venue/date header - plain
  rows of text cells, deterministic per show.
- Risks: a crowded poster market (three tools above) where the paid product is
  already the image; long tours mean 25+ song rows and text-fit pain; the
  "bustout" facts need lookups the template cannot do (props would carry them).

## Pick

**Disc golf bag chart - the speed x stability matrix.** It beat the others because
the picture people already share is a chart of their own structured data -
screenshots of bag sites and hand-built spreadsheet plots in weekly "rate my bag"
threads - and the matrix tools describe (rows = speed, columns = stability) is
exactly m0saic's rectangle canvas with props that are the artifact's own field
names (speed/glide/turn/fade). Note this is not day 33's rejected PDGA rating
card: that was a hero number two apps already surface, while this is the bag
composition picture that members currently assemble by hand.

## Rejected today
- PDGA rating-update card: day 33's read stands - the number is already served by
  PDGA/UDisc; today's pick is the bag chart angle instead.
- Quiz bowl tournament stat card: the stat line (15/10/-5, PPG, PPB, TUH) is
  universal and SQBS/YellowFruit publish it, but the community shares forum
  tables and writeups, not images - no card habit to serve.
- Discogs vinyl year-in-review card: real export CSV, but the wrap-up card shape
  rhymes with day 22 (reading recap) and the sharing is screenshot-led.
