# Scout - 2026-09-23

Run by hand in a Claude Code session (Fable 5.1, effort xhigh) because the
09:00 scheduled task did not fire - the laptop was off. The operator note for
the day (`context.md`): the founder is at WeAreDevelopers this week, and every
template so far has been a still; m0saic "shines especially when VIDEO is the
target output". So the scout looked for a recurring workflow whose output is a
clip because it has to be, not because motion was added to a card.

Method: ten web searches, the HN helper on four queries (720 days), Reddit
through `pipeline/research/reddit.mjs`, and every page cited below opened with
`pipeline/research/fetch-text.mjs` and kept under `logs/research/` (22
captures). Three things to record before the candidates:

- **Reddit was 403 again** (`reddit: 403 (reddit rate-limits anonymous
  clients)` on r/Twitch and r/Toastmasters), the second day running after
  day 002 reported the same. `site:reddit.com` web searches returned no
  Reddit pages either. Streamer, teacher and Toastmasters evidence therefore
  comes from tool pages, the OBS forums and GitHub instead of the subs.
- **HN has nothing on this.** "countdown timer video", "lightning talk
  timer", "conference talk timer" and "starting soon screen" over 720 days
  returned tool launches and unrelated Show HNs, not a single complaint
  thread. That is a real null result: the people with this chore are stage
  crews and streamers, and they do not post about it on HN.
- One conference fact frames the day: WeAreDevelopers World Congress
  **North America** runs 23-25 September 2026 in San Jose, CA (the laptop's
  clock is Pacific) - "10,000+ Builders, 500+ Speakers, 3 Days"
  (<https://www.wearedevelopers.com/world-congress-north-america>, opened
  today). Today is the pre-check-in day; the talks start tomorrow
  (<https://www.wearedevelopers.com/world-congress-north-america/faq>). Five
  hundred timed slots across many stages is the setting for candidate 1.

## Candidates (5, best first)

### 1. The talk timer as a clip - a countdown file a stage screen can just play

- **Who:** stage managers and organisers running timed talk slots
  (conferences, pitch nights, meetups, lightning-talk tracks), the AV desk
  that plays files, and everyone downstream who needs a countdown on a
  screen with nothing installed: a confidence monitor, a phone on the
  podium, an OBS scene, a slide deck. They gather on timer-tool pages, the
  OBS forums, and in ffmpeg gists.
- **The recurring need:** every timed slot needs a visible countdown with a
  wrap-up warning, and every event has dozens of slots. The current answers
  are a live web app that needs a browser and a network, or a video file
  someone renders by hand.
- **Evidence:**
  - <https://stagetimer.io/use-cases/conference-and-speaker-timer/> (opened
    2026-09-23) - "Keep your conference on schedule with a countdown timer
    that speakers can actually see." Their customer list is the demand
    signal: "Production teams running tech summits, pitch competitions, and
    political broadcasts. The setups below come from Slush, YC Startup
    School, the Munich Security Conference, World Summit AI, AI Founders Demo
    Day". Slush: "a countdown display on the podium for speakers to see".
  - <https://www.eventtimer.io/tools/presentation-timer> (opened) -
    "Conference organizers know the pain of speakers running over time ...
    puts a large, unambiguous countdown in the speaker's line of sight, on a
    confidence monitor, a tablet at the podium, or a screen at the back of
    the room. The countdown turns yellow at the 1-minute mark and red at 30
    seconds, giving the speaker clear visual cues to wrap up without anyone
    having to wave a card". That sentence is the whole design: digits, a
    yellow phase, a red phase, thresholds in seconds.
  - <https://presenttimer.com/presentation-timer/> (opened) - presets named
    "Lightning Talk, Short Talk, TED-Style, Conference, Keynote", with
    "Color-coded warnings at 5 minutes (yellow) and 1 minute (red)
    remaining." Same convention, different thresholds - so the thresholds
    are props.
  - <https://slidemodel.com/tools/countdown-timer/5-minute-timer/> (opened)
    - "A 5 minute timer is the workhorse of short-format situations: a
    lightning talk, a meeting agenda block ... most people don't actively
    check a 30-minute timer in the middle, but they do glance at a 5-minute
    one." Five minutes is the default.
  - **The chore, hand-rolled - the strongest items in the run.**
    <https://gist.github.com/derand/31b8312fd64156120cb8f45825a1f0f7>
    (opened, 9 stars): "The code below was used to generate the video
    countdown timers that are available in the following playlist using
    ffmpeg" - a whole YouTube playlist of countdown clips rendered from one
    `drawtext` command with `%{eif\:($seconds-t)\:d}`.
    <https://wiki.tonytascioglu.com/scripts/ffmpeg/add_countdown_to_video>
    (opened) burns `%{eif\:$duration-t\:d}` into a slideshow after an
    ffprobe for the length.
    <https://www.linkedin.com/pulse/batch-video-generator-countdown-ffmpeg-jose-velazquez-ma-pfkxe>
    (opened) is a `for i in $(seq 1 12)` loop around
    `drawtext=...text='%{eif\:180-t\:d\:2}'` - twelve countdown videos from
    one command, and a second command that formats `MM:SS` with
    `trunc((180-t)/60)` and `mod(180-t,60)`.
    <https://github.com/pyoko-dev/countdown-generator> (opened) wraps the
    same ffmpeg call in a Python GUI: "generating lightweight countdown
    videos with a customizable text overlay ... for events, streams, or any
    scenario where a simple countdown is needed", with "Adjustable
    Resolution ... for vertical videos like stories/reels".
  - <https://obsproject.com/forum/resources/stream-countdown-starting-soon-with-auto-scene-switch.2603/>
    (opened, an OBS Lua script published 2026-07-16) states the incumbent in
    one line: "most people fake a pre-stream countdown with a fixed-length
    video (not reusable, and it cannot switch scenes)". The fixed-length
    video IS the common practice; its two weaknesses are named, and one of
    them (reusable) is exactly what a template fixes.
- **Why m0saic fits:** the picture is a function of `t` and nothing else.
  The bar is a row of rectangles that ARE the remaining time - one cell per
  slice, each switched off on its own schedule - and the colour phases are
  the thresholds the tools above all agree on (green, then yellow at N
  seconds, then red). The digits are the one per-frame text an engine has
  to draw, and ffmpeg's `drawtext` already does that in every gist cited.
  Everything is a prop: length, warn and final thresholds, the slot's
  title, the end word. No clock, no network, deterministic, and batchable:
  one clip per slot from a schedule file.
- **Risks:** a clip cannot pause, add a minute, or be controlled from
  backstage - the live apps can, and Stagetimer's customers pay for exactly
  that. This template is for the cases where a FILE beats an app: no
  network, no browser tab, the AV desk's playback deck, an OBS media source,
  a slide embed, a phone on a stand, a hallway screen. Render cost: a five
  minute clip is 9,000 frames, so the design must keep per-frame work to
  scalar gates and one drawtext, never per-pixel effects. And a countdown is
  a crowded shape; this earns its place only if the rectangles carry the
  time and the browse card (frame 0) is the finished picture.

### 2. The "starting soon" pre-roll for streams

- **Who:** streamers and small broadcasters with a pre-stream scene - and
  places of worship, per the OBS forums.
- **Evidence:** <https://obsproject.com/forum/threads/looking-for-a-countdown-timer.148696/>
  (opened): "We are a place of worship. Using OBS to Streamspot ... we
  display a simple 'Our services will start soon' slide. Then ... switch to
  a timer slide at 1820 or 1030 and ... switch from the timer slide to a
  live camera after 10 minutes."
  <https://createtimer.com/blog/how-to-create-twitch-starting-soon-screen-with-timer/>
  (opened): "Method 1: Complete DIY Setup ... Duration: 180 seconds (3
  minutes), Resolution: 1920x1080 ... Generate and download MP4. Result:
  Professional countdown video ready for OBS." And the loop guide
  <https://createtimer.com/blog/how-to-loop-countdown-timer-videos-in-obs/>
  (opened) documents the file-based workflow end to end.
- **Why m0saic fits:** it is candidate 1 with a different title and end
  word ("STARTING SOON" ... "LIVE"), and a different threshold story (no
  wrap-up, just the last ten seconds). One template, two labels.
- **Risks:** streamers want music and an animated background behind the
  numbers, which the template cannot supply from props; the OBS Lua author's
  criticism ("not reusable") applies until the clip is regenerated per
  stream - which is the batch case again.

### 3. The "I'm speaking at" clip - one per speaker from the speaker list

- **Who:** conference organisers and their speakers.
- **Evidence:** <https://blog.premagic.com/speaker-enablement-kit-templates/>
  (opened): the kit is "Their personalized 'I'm speaking' asset" plus three
  post templates, sent "within 48 hours of a speaker confirming". With
  "500+ Speakers" at this week's congress the batch is real.
- **Why m0saic fits:** N speakers x one template, deterministic, text-driven.
- **Risks:** the emotional content is the headshot, which is media the
  template cannot default (the gate skips a template that needs a file to
  look like anything); and without it this is a card with a reveal - a
  sibling of day 001's og-card and day 003's testimonial card. Video would be
  decoration here, not the point.

### 4. The now / next schedule board for a stage or hallway screen

- **Who:** organisers of multi-track events.
- **Evidence:** none opened - the communities for this are on Reddit, which
  was 403 all morning. Thin; recorded so tomorrow does not re-search it.

### 5. The classroom / Toastmasters timer

- **Who:** teachers and Toastmasters clubs. The Toastmasters timer role
  (<https://www.toastmasters.org/membership/club-meeting-roles/timer>,
  opened) is a person with "timing/signaling equipment" who signals each
  speaker - the green / yellow / red convention comes from there.
- **Why m0saic fits / risks:** same clip as candidate 1 with other labels
  and thresholds; the evidence for a classroom-specific need did not open
  (Reddit). Folded into the pick as a props example.

## Pick

**Candidate 1 - the talk timer as a clip.** Two reasons. First, it is the
only candidate whose output has to be a video: a still of a timer says
nothing, and the operator note asked for the kind of work a screenshot
service cannot do. Second, the chore is already tooled in the worst way -
four independent people (a gist that fed a YouTube playlist, a wiki page, a
LinkedIn batch loop, a Python GUI) each re-derived the same `drawtext`
expression by hand, which is the same shape of evidence day 002 found in
hyperfine's plotting scripts: the numbers exist, the picture is hand-made.
The tool pages give the design its rules verbatim (five minutes, yellow at
1:00, red at 0:30) and the conference outside the window gives it its
setting.

The counter-argument is real and goes into the brief: live timer apps do
things a file cannot (pause, add time, remote control), so the template's
claim is narrower than "replace Stagetimer". It is: when the countdown has
to be a file, make the file from props instead of from a shell one-liner.

## Rejected today

- **The speaker announcement clip:** a card with a reveal, and it needs a
  headshot to be worth posting. Kept as candidate 3 for a day with media.
- **The schedule board:** no evidence opened.
- **Countdown-to-a-date clips ("3 days to launch"):** they need the wall
  clock at render time or a `daysLeft` prop that is stale the next morning;
  a deterministic template can only make the one that is true once.
- **Audio ticks / beeps in the final seconds** (SlideModel offers one): the
  template has no audio primitive that is deterministic from props; noted
  as a v2 question, not attempted.
