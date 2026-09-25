# Scout — 2026-09-25

Note on method: `pipeline/research/reddit.mjs` returned 403 (anonymous rate
limit) on every attempt across ~25 minutes, so today's community evidence is
Hacker News plus pages on the open web, all opened directly. Nine searches
were run (three `hn.mjs`, four web searches, two page fetches beyond those).

## Candidates (4, best first)

### 1. Podcast episode promo clip (audiogram)
- Who: podcast producers and show owners — hobby shows up to conference and
  brand podcasts — who post 1-2 short clips per episode to socials. They pay
  for [Headliner](https://headliner.app) and Wavve today; Buzzsprout and
  Adobe Podcast ship built-in audiogram makers because the demand is that
  recurring.
- The recurring need: every episode (weekly for most shows), a short square
  or vertical clip: animated waveform, the pull-quote, episode title, cover
  art, and the actual audio snippet. Producers make several per episode and
  per chapter.
- Evidence:
  - [Show HN: Podcast Audiograms (Milk Video)](https://news.ycombinator.com/item?id=29463007)
    — 164 points, 37 comments. bmau5: "sharing the entire clip to social
    media doesn't get the same engagement. Can't wait to try this."
    abnercoimbre pays for Headliner premium to make conference promo clips.
  - Same thread, the two top feature asks are batch: yakk0 wants chapter
    marks / RSS as input for "bulk production"; dannyeei: "upload multiple
    audio clips at the same time. That would differentiate you from the
    competition."
  - [Berkeley Advanced Media Institute, 16 Ways To Promote Your Podcast](https://multimedia.journalism.berkeley.edu/tutorials/16-ways-to-promote-your-podcast/)
    — strategy #2 is "Create audio clips to share episode highlights" as
    audiograms.
  - [Podcast Growth: Creating Beautiful Audiograms](https://podcastgrowth.substack.com/p/creating-beautiful-audiograms-for)
    — "the ones that come out of the box with other tools [are] quite
    boring": recurring dissatisfaction with stock templates.
- Why m0saic fits: everything on the canvas is data the producer already
  has — title, show name, quote, artwork, duration, the audio file, chapter
  timestamps. Rectangles: a waveform band is N bars driven by an amplitude
  array prop; the progress sweep is duration-driven; the quote and chrome
  are text cells. Batch is the unmet ask, and batch is what a deterministic
  CLI render is. And m0saic muxes real audio (`audio.mode`, audio-bearing
  inputs get a real mix), so the render is the finished postable MP4, not a
  visual layer waiting for an editor.
- Risks: word-level caption highlighting is out of scope — a static
  pull-quote with a progress sweep is the honest v1. The amplitude array is
  a prop the user extracts themselves (the docs must carry the one-liner),
  so the default array has to look genuinely good. First audio-bearing
  template in this repo: the muxing path is unproven here.

### 2. Streamer weekly schedule card
- Who: Twitch/Kick/YouTube streamers and VTubers.
- The recurring need: a new schedule graphic every single week — days,
  times, game/category, off-days — exported in several platform sizes.
- Evidence: [StreamLadder Schedule Maker](https://www.streamladder.com/schedule-maker)
  (a free purpose-built tool: "Build a weekly schedule graphic in seconds",
  "change a stream time or skip a day and re-share the updated image in
  seconds", multi-platform sizes); itch.io VTuber schedule template packs
  sold in 12-variation bundles; Placeit and gumroad template listings.
- Why m0saic fits: rows of structured data, multi-size from one doc,
  weekly re-render from a props file.
- Risks: the market is taste-dominated (VTuber aesthetics); it is a still
  in a repo that wants video-led days; free tools already serve it well.

### 3. Spotify Canvas loop
- Who: independent musicians on release day; distros (CD Baby, Ditto) push
  Canvas because tracks with one are saved ~4x more.
- Evidence: [Spotify: Adding a Canvas](https://support.spotify.com/in-en/artists/article/adding-a-canvas),
  CD Baby Video Creator, dontsleepgfx upload guide.
- Why m0saic fits: 3-8 s deterministic 9:16 loop from cover art and
  palette props; video-led.
- Risks: purely aesthetic, no structured data to bind; the guides warn
  against exactly the generic generated look a template would produce.

### 4. Changelog / release-notes video
- Evidence is thin: the HN hits are 1-5 point Show HNs. Changelogs are text
  products; no audience was found asking for them as video. Rejected on
  evidence.

## Pick

Podcast episode promo clip (audiogram). It is video-led where video is the
point, the evidenced unmet ask — batch production from chapter marks and
feeds — is literally m0saic's operating model, and audio muxing means the
output is the finished deliverable. The schedule card is a real need but a
still, and its market buys aesthetics, not structure.

## Rejected today
- Streamer weekly schedule card: strong recurrence, but taste-dominated and
  already served by free purpose-built tools.
- Spotify Canvas loop: no data to bind; generic output is the failure mode
  the community itself warns about.
- Changelog video: no evidenced audience.
