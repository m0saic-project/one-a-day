# Scout — 2026-09-26

First day under the scout's new standing direction (maintain 2026-09-26,
`dd4779e`): look first in niche communities organised around one construct.
The founder's own example was speedrunning, so that is where this started;
two other niches were checked against it.

Note on method. Reddit could not be read at all today: `reddit.mjs` got 403
from `www.reddit.com` and `api.reddit.com`, `old.reddit.com` served a "Welcome
to Reddit" wall instead of JSON, and this agent's web search refuses the
domain ("not accessible to our user agent"). speedrun.com, where the hobby's
own forum lives, answered 403 to both `fetch-text.mjs` and the agent's fetch,
and has no Wayback snapshots of the threads below. So the evidence cited is
what could be opened: LiveSplit's GitHub (README, issues), the splits.io
author's shutdown post, the Gold Split newsletter, and the community's own
`.lss` tools. 18 searches in all (12 web, one of them refused; 2 HN; 4
GitHub issue queries), 10 pages read (splits.io itself and a YouTube
tutorial returned no readable content).

## Candidates (4, best first)

### 1. Speedrun PB recap clip, from the splits file
- Who: speedrunners. They time runs with LiveSplit, post runs to
  speedrun.com, stream on Twitch, and share PBs on X, Bluesky and Discord.
- The construct: the run, cut into named segments, compared against the
  runner's personal best. The artifact every runner already has is the
  LiveSplit splits file (`.lss`, XML): per segment a `Name`, `SplitTimes`
  (cumulative time per comparison, e.g. "Personal Best"), a
  `BestSegmentTime` (the "gold"), and `SegmentHistory`; plus `GameName`,
  `CategoryName`, `AttemptCount` and an `AttemptHistory`.
- The recurring need: every PB (and most finished runs) gets shared. What
  the tooling offers is a screenshot of the timer window; the site that
  turned splits into something to look at and compare is gone; a short clip
  that tells the run (which segments gained, which were gold, the final
  time, the time saved) is made by hand in an editor, if at all.
- Evidence:
  - [LiveSplit README](https://github.com/LiveSplit/LiveSplit): sharing is a
    built-in moment, and what it produces is a screenshot: "Any run can be
    shared to Speedrun.com, X (Twitter), and Bluesky. You can also share a
    screenshot of your splits to Imgur or save it as a file."
  - [LiveSplit issue #2543](https://github.com/LiveSplit/LiveSplit/issues/2543)
    (maintainer, 2024-10): "Splits.io is shutting down on ... March 31, 2025.
    After that, the APIs (for downloading and uploading splits) will no
    longer work. This will likely affect the Speedrun.com integration a lot
    as well, since the splits for Speedrun.com runs were stored on
    Splits.io." The integration was removed.
  - [splits.io shutdown post](https://twos.dev/splitsio.html): run tracking
    for runners since 2013, closed 2025-03-31 because "It always lost money
    as a side project"; the domain became an export-only page. The
    [Gold Split newsletter](https://goldsplit.substack.com/p/week-16) had
    reported the October 2024 reprieve as welcome news before it closed
    anyway.
  - [LiveSplit-Analytics-Database](https://github.com/JuanCruzCB/LiveSplit-Analytics-Database)
    and [lss-tools](https://github.com/slaurent22/lss-tools): runners build
    their own tools on the `.lss` because "LiveSplit files store a ton of
    very useful data" and "LiveSplit itself does not provide any built-in
    analytics features."
- Why m0saic fits: the split table is rows of rectangles bound to data
  (segment name, split, delta, gold). The delta colour is a rule (ahead
  green, behind red, gold gold), not taste. The reveal is time-driven:
  each split lands at its share of the run, so the same props render a
  15 s teaser at 1080x1920 and a card at 1920x1080. It batches: one render
  per PB, straight from the numbers LiveSplit already saved.
- Risks: a template reads props, not files; the `.lss` still has to become
  props (the field names can mirror the XML so the mapping is one-to-one).
  Per-frame clock digits use drawtext (machine font). Game icons and
  gameplay are the runner's media; v1 must look finished without them.

### 2. Timer and splits over an already-recorded run (real-time overlay)
- Who: the same runners, specifically offline and console runners who
  record first and time afterwards.
- The construct: the same split times, played back against the recording.
- The recurring need: speedrun.com's own forum asks it again and again
  (titles found by search: "Adding Splits / Timer to a video", "Livesplit
  on recorded videos?", "Livesplit for post recorded runs", "Is there a way
  to add a timer to a video?"). The answers in the search snippets are
  "open your video in something like VLC, open LiveSplit, and use OBS to
  capture both", i.e. re-record the whole run in real time. None of those
  threads could be opened (403), so they are leads, not evidence.
- Evidence I could open: LiveSplit's [Video Component](https://github.com/LiveSplit/LiveSplit)
  ("play a video from a local file alongside your run"), which is the
  in-app half of that workaround.
- Why m0saic fits: the same props plus `gameplaySrc` and a 1:1 time scale;
  m0saic already places a video in a rect and renders deterministically.
- Risks: a defaults render cannot show it (no gameplay in the repo), and an
  hour-long 1080p render is a machine-hour. It is the v2 of candidate 1, not
  a separate template.

### 3. Speedcubing session card
- Who: cubers (WCA competitors and hobbyists).
- The construct: single, ao5, ao12 (averages with the best and worst
  trimmed). Artifact: [csTimer](https://cstimer.net/) sessions, which show
  "current single/average, best single/average" and back up to local files
  or its server.
- Evidence of a recurring picture: none found today (r/Cubers could not be
  opened).
- Rejected on evidence, worth a reddit-capable day.

### 4. Marathon run cards from the schedule
- Who: speedrun marathon organisers (Horaro and Oengus schedules).
- The construct: the run slot (game, category, runners, estimate).
- Evidence: already served on stream: [nodecg-speedcontrol](https://github.com/speedcontrol/nodecg-speedcontrol)
  imports Horaro and Oengus schedules and drives the overlays, and
  [schedule-helper](https://github.com/skenmy/schedule-helper) syncs the
  run order and timer to every screen. What is left (social schedule
  posts) had no evidence today.
- Rejected: served.

## Pick

Speedrun PB recap clip from the splits file. It sits exactly on the
community's construct (segments, PB, golds) and on an artifact every runner
already has. The only built-in share is a screenshot, and the site that made
splits worth looking at is gone. Candidate 2 is the same template with the
runner's gameplay and a 1:1 clock: v1 keeps the door open (props mirror the
`.lss`, the clock is data-driven) without trying to render an hour of
footage.

## Rejected today
- Real-time overlay on a recorded run: folded into the pick as its v2; the
  forum evidence could not be opened.
- Speedcubing session card: no evidence of a recurring picture today.
- Marathon run cards: served by nodecg-speedcontrol and schedule-helper.

## Found by search but not opened (speedrun.com answers 403)
- https://www.speedrun.com/post/j0475 (Adding Splits / Timer to a video)
- https://www.speedrun.com/forums/streaming_recording_equipment/o156p (Livesplit on recorded videos?)
- https://www.speedrun.com/forums/streaming_recording_equipment/mt9vk (Livesplit for post recorded runs)
- https://www.speedrun.com/forums/speedrunning/kpw9m (Is there a way to add a timer to a video?)
- https://www.speedrun.com/forums/speedrunning/cwb7t (Alternative to Splits.io?)
- https://therun.gg/about (TheRun: auto-uploads the `.lss` after every reset; also 403)
