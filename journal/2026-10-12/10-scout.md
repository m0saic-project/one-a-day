# Scout — 2026-10-12

## Candidates (best first)

### 1. Climbing send pyramid
- Who: outdoor climbers who log ticks on Mountain Project (mountainproject.com) and talk about them on the MP forum; a second home is the newer logbook apps (SendSage) that import the same file.
- The construct: the tick — one ascent, with a grade and a send style. The artifact everyone already has is the Mountain Project tick-list CSV (Profile, Ticks, Export CSV). Importers read `Rating` and `Lead Style` off that file (Onsight, Flash, Redpoint, Pinkpoint, Fell/Hung).
- The recurring need: the grade pyramid, the picture of how many clean sends sit at each grade, hardest on top. Climbers want it as a shareable snapshot of "where I am", and they still build it in a one-off web app or screenshot a dashboard.
- Evidence:
  - https://www.mountainproject.com/help/27/overview-of-mountain-project-features — "Can I export or download my tick list? Yes, to download a CSV of your Tick List ... use the Export CSV link at the top of the Ticks page."
  - https://www.mountainproject.com/forum/topic/200258880/visualize-your-mp-tick-pyramid — "Want to see what your current tick pyramid looks like?" A reply: "I dont think i understand the pyramid. It seems like only red points are important but onsights are not?" The author: "Yea I know you can do this on 8a.nu." Allen Sanderson: "How exactly is this chart a pyramid? It is two histograms on their side."
  - https://chenyang.co/climbing-dashboard/ — "Drop your CSV file here ... Get your ticks.csv from your Mountain Project profile, Ticks, Export CSV." The page's own headings: "Send Pyramid / Clean sends per grade, hardest first."
  - https://www.sendsage.ai/ — "See your grade pyramid, project trends, and what's actually working." "Mountain Project import brings your full history over in about a minute. Then Sage turns it into your climbing Wrapped ... ready to share."
- Why m0saic fits: one centered bar per grade, width = send count, is the pyramid the forum asked for — rectangles, not a screenshot of a dashboard. Props mirror the CSV fields (grade, sends, flashes). Deterministic, one card per season or crag.
- Risks: YDS, V-scale and French grades do not sort as strings; the demo takes grades already in pyramid order. Photos of the send are the other half of a share post, and we have no media. 8a.nu and SendSage already draw a pyramid in-app; the gap is a card from the CSV a person already exported, not another logbook.

### 2. DJ setlist card
- Who: DJs who upload mixes to Mixcloud and owe the show a tracklist.
- The construct: the set. The artifact is a pre-written list, or a Serato / Traktor / cue-sheet file.
- The recurring need: every upload, type or paste the tracklist, because fingerprinting does not build one.
- Evidence:
  - https://help.mixcloud.com/hc/en-us/articles/360004053959-How-do-I-manually-add-a-tracklist-to-my-shows — "While we automatically fingerprint tracks within shows you upload, this will not create a tracklist for you." Paste format they name: "Artist Name - Track Title - HH:MM:SS".
- Why m0saic fits: a poster of timed rows from that paste, one card per show.
- Risks: considered and passed over on 2026-10-11; a long set is a table, and the interesting part (the audio) is a file we would not ship. Weaker visual than a pyramid.

### 3. Concept2 erg share card
- Who: indoor rowers on the Concept2 logbook.
- The construct: the piece (distance, time, split). The artifact is the logbook workout, which people also photograph off the PM5.
- The recurring need: shout a 2000m personal best without opening the whole log.
- Evidence:
  - https://www.concept2.com/blog/new-logbook-features-garmin-connect-social-sharing-better-privacy-and-more — "if your logbook is normally open only to training partners but you've got a new 2000m personal best you want to shout out to the world ... you can now do so."
- Why m0saic fits: a small grid of time, split and watts, one card per piece.
- Risks: the logbook already has share icons (since 2018). Same shape as the golf and swim scorecards already on the shelf. Scouted and not picked on 2026-10-11.

### 4. Hive inspection card
- Who: hobby beekeepers with a handful of colonies.
- The construct: the inspection checklist (queen seen, brood, mite count and method).
- The recurring need: a shareable record of one visit, for a club or an inspector.
- Evidence:
  - https://www.shadowfetch.com/apps/hivecard — "Each visit runs through the same short checklist: queen and eggs seen, brood pattern, mite count and the method you used." "When the bee inspector calls ... Hivecard builds a PDF."
- Why m0saic fits: a checklist card, one per hive per visit, with the mite count against the method's line.
- Risks: the share moment is a PDF for an inspector, not a picture the community posts. Taste and local treatment rules make the "line" easy to get wrong. Less of a shared visual construct than the pyramid.

## Pick
Climbing send pyramid. It is the niche construct the shelf does not have yet: one file every Mountain Project climber can already export, and a picture (a real pyramid of grade bars, flashes marked inside the send) that the forum still argues about and that dashboards only show as a screenshot.

## Rejected today
- DJ setlist card: real gap, but a timed table, and it lost to this pick yesterday already.
- Concept2 erg share card: the logbook already shares the workout; another scorecard.
- Hive inspection card: checklist, not a picture the community shows off.
- Board-game Stats-o-graphic and geocaching Shareables: the apps already mint the share image (not opened far enough to cite; left off the list).
- Disc golf, Letterboxd, Go/SGF: too close to golf (day 021), reading (day 022) and chess (day 018).
