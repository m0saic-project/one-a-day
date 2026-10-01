# Scout — 2026-10-01

Day 12. Agent: claude (self-declared claude-fable-5.1). Eleven days are on the
shelf (`journal/index.json`): OG card, bench delta, testimonial card, talk
timer, app-store frame, audiogram, speedrun PB recap, powerlifting meet recap,
bird-walk sightings, crossword grid card, homebrew serving card. None is
repeated below.

The short-course swim season starts this month, and the swim recap was the
best-evidenced runner-up on 2026-09-29. I re-opened its sources myself today
instead of trusting that day's notes, then looked for something that could
beat it in four other communities.

## Candidates (4, best first)

### 1. Swim meet time-drop card, from the meet results file
- Who: age-group swim clubs (USA Swimming clubs, summer leagues). Coaches and
  parent volunteers write a recap after every meet on the club's
  GoMotion/TeamUnify site, for example
  [Wave Aquatics](https://www.gomotionapp.com/team/wave/page/news/507024/fall-divisional-meet-recap)
  and [CATCC](https://www.gomotionapp.com/team/catcc/page/news/570837/hvda-scy-bbbc-meet-recap).
- The construct: the **time drop**. A swimmer's entry (seed) time against the
  time they just swam, per event, plus the motivational standard the new time
  reaches (B, BB, A, AA ...). Every swim parent reads "dropped 6.2 seconds in
  the 50 free, new BB" without help.
- The artifact: the results file the host exports after the meet. Hy-Tek Meet
  Manager's ["Export Results for TEAM MANAGER or SWIMS"](https://hytek.active.com/user_guides_html/swmm6/exportresultstotm.htm)
  writes a zip holding "both the old CL2 file format and the new HY3 format",
  filterable to one team. [flipturn](https://github.com/enagon-athletics/flipturn)
  reads those files in TypeScript: "meet, teams, swimmers, entries, results,
  splits".
- The recurring need: one recap per meet, per club, all season (a meet every
  two to four weeks). Today it is typed by hand from the results into a news
  post: a list of names, events and standards, and a paragraph of drops.
- Evidence:
  - [Wave recap](https://www.gomotionapp.com/team/wave/page/news/507024/fall-divisional-meet-recap):
    a hand-typed list of dozens of lines such as "Laney Brackett A time 200
    Fly, AA time 200 IM", then "Top time drops of the meet: Arnav Agnihotri
    dropped 40 seconds in the 200 Free! Ian Chow dropped 33.2 seconds in ...".
  - [CATCC recap](https://www.gomotionapp.com/team/catcc/page/news/570837/hvda-scy-bbbc-meet-recap):
    the same structure at another club ("Onto the numbers: ... New Nat BB
    Cuts ... New Nat B Cuts ..."), with drops called out in prose ("dropping
    thirty-three seconds in his 1000 Free").
  - [Maverick Swim Club's time drop program](https://www.mavswim.org/page/celebrations/time-drops):
    the club defines the construct in writing ("When a swimmer improves upon
    that baseline time, it is called a time drop") and hands out awards per
    five drops. The count is kept by the club, per swimmer, all season.
  - [MediaHub](https://github.com/anedav68/MediaHub): a 0-star project whose
    "shipped wedge" is "Swimming results -> content", ingesting "Hy-Tek HY3
    ZIPs, SDIF/CL2 files". Someone else thinks this is unserved enough to
    build; nobody has adopted it yet.
- Why m0saic fits: one card per swimmer per meet is a clean batch (a club of
  100 swimmers is 100 renders from one file). The geometry is rows of
  rectangles: event name, seed time, final time, a bar whose width is the drop
  in seconds, a standard chip. Props mirror the file: `event`, `seedTime`,
  `finalTime`, `course` (SCY/SCM/LCM), `standard`. Times are ASCII
  (`1:02.34`). A short clip where the bars grow in is a natural second variant.
- Risks:
  - The seed time in a results file is the entry time, not always the true
    previous best (Maverick's page says so itself). The card must say "vs
    entry time", not "PB".
  - Minors' names. The defaults must use invented swimmers, and the card is
    for the family or the club, not a public leaderboard.
  - Standards tables change each season and by age and sex. The demo takes
    the standard as a prop and does not compute it.
  - Overlap with day 7 (speedrun deltas vs the old PB) and day 8 (a sports
    results card). The construct and the community are different; the "delta
    row" idea is not new to this repo.
  - Parsing `.hy3` is out of scope for a template; props are the parsed rows.

### 2. Streamer / VTuber weekly schedule card
- Who: Twitch and YouTube streamers, VTubers especially, who post a schedule
  image at the start of every week.
- The construct: the week as seven day slots, each with a time and a title,
  or "off".
- The recurring need: a new image every week, same layout, seven strings
  changed.
- Evidence: one opened page only. An
  [itch.io release thread](https://itch.io/t/3247064/weekly-stream-schedule-template-for-vtubers-with-many-variations)
  offers a "Weekly Stream Schedule Template for Vtubers" as free PNGs in set
  colours "or purchase PSD file and use it in your own colour and style", so
  the weekly edit is a Photoshop job. A search listed more paid PSD and Figma
  templates on itch.io, Ko-fi and Gumroad; I did not open them.
- Why m0saic fits: seven rows, props per day, one render per week, batchable
  across time zones or languages.
- Risks: thin evidence (a seller's page, not a user's complaint). The look is
  the product in this community: character art and a personal style carry the
  image, and a plain typographic card may not read as "theirs". No structured
  artifact was confirmed (Twitch has a schedule feature; I did not open its
  export).

### 3. Cross country PR and improvement card
- Who: high-school cross country coaches, mid-season right now.
- The construct: the PR, per course. Results live on Athletic.net and in
  Hy-Tek exports.
- Evidence: [XCStats](https://www.xcstats.com/gallery.php) sells exactly this
  as a subscription: "PR's and improvement calculations are based on the
  actual course", "25 reports and charts", and "after the meet, send a message
  highlighting their accomplishments".
- Why m0saic fits: the same delta-row geometry as the swim card.
- Risks: served, by a product coaches already pay for, and nothing I opened
  shows a coach hand-making the picture. It is also the swim card with a
  weaker artifact.

### 4. Trivia night final standings card
- Who: pub quiz hosts who post the night's standings each week.
- The construct: teams, round scores, a total.
- Evidence: [Keep the Score](https://keepthescore.com/blog/posts/trivia-night-leaderboard)
  already puts a live leaderboard on the bar's TV and shares it by link.
- Why m0saic fits: a ranked table is rectangles.
- Risks: served live, and I found no host asking for a rendered image. A
  generic standings table with no community artifact behind it.

## Pick

**Swim meet time-drop card, from the meet results file.** It is the only
candidate today where I opened hand-made versions of the output at two
different clubs, a club's written definition of the construct, the exporting
tool's own documentation of the file, and an open-source parser for it. It
beat the schedule card (one seller's page, taste-heavy) and the cross country
card (the same idea, already sold to its audience).

Scope note for the plan: one swimmer, one meet. Rows are events with entry
time, final time, the drop and an optional standard chip; a header with
swimmer, club, meet and course; a summary line ("5 of 6 swims faster, 14.82 s
dropped"). A swim that was slower must still render honestly (no bar, a plus
sign). Label the comparison "vs entry time". Invented names in the defaults.
A still first; a clip where the bars grow is the obvious variant.

## Rejected today
- Streamer weekly schedule card: real weekly chore, but one opened source and
  the image's value is its art style.
- Cross country PR card: served by XCStats; no opened evidence of a hand-made
  picture.
- Trivia standings card: served by live leaderboards; no community artifact.
- FRC team match-schedule graphics (FIRST Robotics, from The Blue Alliance
  data): four searches of the Chief Delphi forum returned build threads and
  nothing about making the graphic, so there is no evidence to cite.
- Club cricket scorecard graphics, poker hand-history graphics for vlogs,
  bridge hand diagrams from PBN, marching band recap sheets: one web search
  each returned template marketplaces or tool listings and no page worth
  opening in the time available. Not judged, just not evidenced.

## Research record
- Searches: 9 web searches (FRC schedule graphics, cricket scorecards, poker
  hand graphics, bridge PBN diagrams, trivia leaderboards, swim recap
  graphics, marching band recaps, VTuber schedules, cross country PR
  graphics) and 4 Chief Delphi forum searches through its public search JSON.
- Opened and used: the nine URLs linked above.
- Failed to open: `github.com/SwimComm/sdif-rs` and a USMS copy of the SDIF v3
  spec PDF (both fetches failed), so the SDIF record names are not quoted
  here; the field list comes from flipturn's README and the Hy-Tek guide.
- Reddit was not tried: the helper has been refused since 2026-09-25.
- Search snippets are not used as evidence. Where a claim rests on a snippet
  it is marked "did not open".
