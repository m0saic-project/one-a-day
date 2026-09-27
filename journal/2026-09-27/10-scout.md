# Scout — 2026-09-27

Second day under the niche direction (communities organised around one
construct). Yesterday was speedrunning, so today started everywhere else:
powerlifting, speedcubing, ham radio, fighting games and sim racing.

Note on method. Reddit was not tried again (unreadable for this agent since
2026-09-25, see `pipeline/research/README.md`); Instagram, where lifters post
their recaps, is closed to every fetcher. The evidence is what could be
opened: the OpenPowerlifting data documentation and a lifter's own CSV, the
OpenLifter guide, two lifters' meet write-ups, LiftingCast's overlay starter,
and for the runner-up the speedsolving.com forum. 13 web searches, 21 pages
requested with `fetch-text.mjs`, 18 read (startingstrength.com answered 403,
one GitHub repo 404, liftingcast.com is an empty app shell). The list of
requests is in `logs/scout-fetches.json`.

## Candidates (5, best first)

### 1. Powerlifting meet recap, from the lifter's OpenPowerlifting row
- Who: powerlifters, their coaches, and the meet directors who run the
  score table. They gather at meets, on Instagram, and around
  openpowerlifting.org, which archives every sanctioned meet.
- The construct: the meet day. Nine attempts (three squats, three bench
  presses, three deadlifts), each a good lift or a no lift; the best of each
  adds up to the total; the total and the bodyweight give the points (Dots,
  Wilks, IPF GL). "8 for 9" is a sentence every lifter understands. The
  artifact every competitor has is their OpenPowerlifting row: the lifter
  page has a "Download as CSV" link, one row per meet, with `Squat1Kg` ..
  `Deadlift3Kg` (negative = failed), `Best3SquatKg`, `TotalKg`, `Dots`,
  `Place`, `BodyweightKg`, `WeightClassKg`, `Federation`, `Date`, `MeetName`.
  The meet software exports the same columns for a whole meet.
- The recurring need: after every meet the lifter posts the day: the
  attempts, what was made and missed, the total, the PRs. It is written out
  by hand as text, or cut by hand in a phone editor over the lift videos.
- Evidence:
  - [OpenPowerlifting CSV documentation](https://openpowerlifting.gitlab.io/opl-csv/bulk-csv-docs.html):
    the format is public and stable. "Squat1Kg, Bench1Kg, Deadlift1Kg ...
    First attempts for each of squat, bench, and deadlift, respectively ...
    Negative values indicate failed attempts." and "TotalKg: Sum of
    Best3SquatKg, Best3BenchKg, and Best3DeadliftKg, if all three lifts were
    a success."
  - [A lifter's page](https://www.openpowerlifting.org/u/jamesmanley) has
    "Download as CSV"; [the file it serves](https://www.openpowerlifting.org/api/liftercsv/jamesmanley)
    is a header and one row per meet, 42 columns; the squat columns of a
    row read like `130,135,-140,,135` (three attempts, the third failed, no
    fourth, best 135).
  - [My First Powerlifting Meet](https://squattersrites.substack.com/p/my-first-powerlifting-meet)
    (a lifter's write-up): "Three white lights appear on the screen behind
    the platform; the lift is good." It ends: "Check out the Instagram post
    below for videos of my heaviest successful lifts and a recap of my
    attempted weights." The [second meet](https://squattersrites.substack.com/p/my-second-powerlifting-meet)
    is told the same way, attempt by attempt: "This time, I went
    three-for-three, making 226, 253, and 259."
  - [A nationals report](https://staff.washington.edu/griffin/pl_comp_nationals.txt)
    (plain text, years older, same shape): "I only went 4 for 9 and only hit
    one PR."
  - [OpenLifter guide](https://www.openlifter.com/en/guide/): the results
    table is already shown as a picture when it can be: "you can fit it to
    your projector and put on an impromptu slideshow at the end of the
    competition. Audiences seem to like that because it gives them something
    to look at." And "Export for OpenPowerlifting" writes the meet's results
    in the same format.
  - [liftingcast-overlays](https://github.com/liftingcast/liftingcast-overlays):
    what exists is for the LIVE stream ("graphic overlays for LiftingCast
    ... add this to your video feed as a web capture using tools like OBS"),
    and needs the meet's API key and password. Nothing there is for the
    lifter afterwards.
- Why m0saic fits: the day is a 3 x 3 board, nine rectangles whose colour is
  a rule (good, no lift, not taken), not taste. The props can be the CSV's
  own column names, so a pasted row is the whole input. It batches: a meet
  director's export is one row per lifter, one card per row. As a clip the
  attempts land in meet order and the total builds, which is the story a
  lifter tells in text today.
- Risks: the lift videos are the lifter's media; v1 must look finished
  without them (the clips in the nine cells are the v2). The CSV carries no
  referee lights (a 2-1 decision and a 3-0 are both "good"), so the board
  must not draw three lights it cannot know. Pounds: many US lifters think
  in lb; the CSV is kg. Not every federation reports attempts (some rows
  have only the bests).

### 2. Speedcubing average card, from csTimer's export
- Who: speedcubers; speedsolving.com ("50,000+ cubers"), WCA competitions.
- The construct: the average of five (best and worst solve dropped, shown
  in parentheses), and its longer cousins ao12, ao100. The artifact is
  csTimer's export text, pasted raw.
- The recurring need: the forum's
  [Accomplishment Thread](https://www.speedsolving.com/threads/accomplishment-thread.1688/page-3503)
  is past page 3,500 since 2007, and post after post is the same paste:
  "Generated By csTimer on 2022-10-28 / avg of 5: 10.15 / Time List: /
  1. (8.99) U F B U2 R' D B2 ... / 2. (13.42) ...". The same on
  [page 3438](https://www.speedsolving.com/threads/accomplishment-thread.1688/page-3438).
  [csTimer](https://cstimer.net/) itself lists "scramble image" among its
  tools: the unfolded cube, 54 coloured squares, which is rectangles.
- Why m0saic fits: the paste is the prop; each scramble can be drawn as the
  cube's net by a small move simulator; five solves land, the average
  resolves.
- Risks: evidence of a picture being wanted is thinner than the evidence of
  the text being shared (the forum takes text). A timer table two days in a
  row after the speedrun recap.
- Verdict: the strongest runner-up. The evidence yesterday's scout could not
  find is now on file; a good next day.

### 3. POTA activation recap, from the ADIF log
- Who: ham radio operators activating parks (Parks on the Air).
- The construct: the QSO (one contact); the artifact is the ADIF log the
  programme requires ([ADIF for POTA](https://docs.pota.app/docs/activator_reference/ADIF_for_POTA_reference.html):
  "Parks on the Air requires activators to submit their log files in the
  ADIF format").
- Evidence of the picture: [qsomap.org](https://www.qsomap.org/) already
  makes it ("Create QSO Maps ... from ADIF files"), behind a subscription
  now.
- Rejected: the picture hams want is a map, and a map is not rectangles.

### 4. Fighting-game top 8 graphic
- Who: tournament organisers; the construct is the top 8 of a bracket.
- Served: [top8.gg](https://www.top8.gg/) is a free in-browser generator
  with PNG export (others exist, see below). It also needs character art.

### 5. Sim racing league results and standings
- Who: league admins, every race week.
- Served: [Racing League Tools](https://www.overtake.gg/downloads/racing-league-tools.44891/)
  (a league database with a rendering engine for results and standings
  images, 21 reviews).

## Pick

Powerlifting meet recap from the lifter's OpenPowerlifting row. It sits on a
construct the whole sport shares (nine attempts, good or no lift, a total),
the artifact is public, per lifter and one click away, and what exists
serves the live stream, not the lifter's post afterwards. It beat the
speedcubing card on shape and on reach: a 3 x 3 board is a different picture
from yesterday's timer table, and a meet export makes it a batch (one card
per lifter) for the people who run meets.

## Rejected today
- Speedcubing average card: strong evidence of the text, thin evidence of
  the picture; a timer table again. Kept as the runner-up for another day.
- POTA activation recap: the wanted picture is a map.
- Fighting-game top 8 graphic: served by free generators; needs character art.
- Sim racing league results: served by Racing League Tools.

## Found by search but not opened
- https://startingstrength.com/resources/forum/general-q-and-a/80095-powerlifting-meet-recap.html (403 to both fetchers)
- https://www.instagram.com/popular/powerlifting-meet-recap/ (Instagram; not tried)
- https://www.capcut.com/template-detail/Powerlifting-edit/7305129700027010309 (a generic gym edit template; not opened)
- https://www.top8er.com/ and https://github.com/Watherum/Graphic-Generator (top 8 generators; not opened)
- https://www.simracingpanel.com/ (league platform; not opened)
- https://liftingcast.com/ (opened, but the page is an app shell with no readable text)
