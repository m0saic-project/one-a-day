# Scout — 2026-09-20

Day 001. `journal/index.json` is empty, so nothing is off the table yet.

Method: nine Hacker News searches through `pipeline/research/hn.mjs` (stories
and comments, 60-365 day windows), three web searches, and every page cited
below opened with `pipeline/research/fetch-text.mjs` or the Algolia item API.
The raw responses are in `logs/research/`. **`pipeline/research/reddit.mjs`
returned HTTP 403 for every subreddit from this machine** (reddit blocks
anonymous JSON clients here; `old.reddit.com` serves an interstitial too), so
reddit evidence is absent today. The pipeline maintainers may want a fallback.

## Candidates (best first)

### 1. Open Graph / social preview cards for developers' posts and pages

- Who: developers, indie makers and technical bloggers who publish from a
  build pipeline. They gather on Hacker News (every thread below is from the
  last 12 months) and dev.to.
- The recurring need: every blog post, docs page, changelog entry and product
  page needs a 1200x630 preview image (`og:image`) or the link renders as a
  bare line in Slack, X, LinkedIn and Discord. The inputs are already
  structured: title, one-line summary, site name, author, a tag. It is
  regenerated whenever the title changes, and it is needed at scale (one per
  post) - which is exactly when hand-made Figma cards stop happening.
- Evidence:
  - https://dev.to/custodiaadmin/how-to-automate-og-image-generation-for-every-blog-post-2k2j
    - "You hand-craft social images for every blog post. Title, author,
    date, custom background. Hours spent in Figma. Then you update the post,
    forget to update the image, and Twitter shows the old version." The fix
    offered is an HTML template POSTed to a paid screenshot API from the
    build script.
  - https://huijer.co/notes/going-out-of-my-way-to-prove-im-not-an-ai-og-images
    (HN thread: https://news.ycombinator.com/item?id=49399851, 10 comments) -
    "OG images are a very underrated aspect of visibility. No one really
    cares about them. But they determine how your content shows up when it's
    shared around ... Most brands don't even bother to define an og:image."
  - https://news.ycombinator.com/item?id=49139151 - Show HN, a free OG image
    designer: "the OG images are still one of the most neglected parts of a
    shop. On a few projects, even fairly simple product specific image
    improved the conversion from shared traffic."
  - https://news.ycombinator.com/item?id=49141504 - "Cardstock - dynamic OG
    images from one URL (no render server)"; and
    https://news.ycombinator.com/item?id=48811451 - "Generating Dynamic Open
    Graph Images on Cloudflare Workers". Two more people building the same
    plumbing in 2026 because the default answer is a headless browser.
  - https://news.ycombinator.com/item?id=48902665 - "Ask HN: What are you
    working on" comment: "an agentic OpenGraph image tool. E.g. for the blogs
    ... I am creating og images with that script and via agents which works
    very well."
  - https://news.ycombinator.com/item?id=49328884 (on "Show HN: Fix every
    weak social card/OG preview on your site") and
    https://news.ycombinator.com/item?id=48072451 ("Turn any title into
    thumbnail, OG image or blogpost cover" - an API) - the market keeps
    producing paid APIs for a picture made of five strings.
- Why m0saic fits: it is a still made of rectangles from a handful of text
  props - the purest m0saic shape. `m0saic make @one-a-day/dev/og-card/v1
  --props @post.json -o og.png` runs in CI with no browser, no API key, no
  render server, and the same props render the same bytes forever (a stale
  image is a `git diff`, not a surprise). Batchable one-per-post. And because
  the layout re-derives from `ctx.target`, the same props also give the
  1080x1080 and 1080x1920 crops people re-make by hand for Instagram and
  stories.
- Risks: a crowded category (dozens of SaaS tools) - the angle has to be
  "deterministic, local, in the build", not "prettier". Text-heavy, so the
  fit has to hold at square and portrait, not just 1.91:1. A logo/avatar
  media prop is tempting but must stay optional (the gate renders with no
  inputs). No emoji, no arrows - ASCII copy only (glyph coverage gate).

### 2. Silent countdown timer clips for classrooms

- Who: teachers embedding timers in Google Slides / PowerPoint. YouTube is
  full of "5 minute timer" playlists; Teachers Pay Teachers sells MP4 packs.
- The recurring need: a 1/2/5/10-minute silent countdown as an MP4, one per
  activity length, restyled per classroom theme.
- Evidence:
  - https://www.teacherspayteachers.com/Product/Timer-Videos-Downloadable-MP4-Files-With-Links-to-Google-Drive-YouTube-10888173
    - 61 ratings, 4.9; a review: "These have made my life so much easier. I
    successfully added these to my Google slides and now my kids know how
    much time they have left."
  - https://whatmakeart.com/zalgorithmic/timers/best-classroom-timers-electric/
    - "YouTube video countdown timers are silent and can be embedded in slide
    presentations."
  - https://news.ycombinator.com/item?id=49474925 - Show HN: Classroom Timer
    (a web timer; the embed-a-video workflow is the offline cousin).
- Why m0saic fits: pure time-axis geometry - a bar that drains over
  `ctx.target.durationMs`, big digits, no media input. The duration IS the
  prop. Deterministic to the frame.
- Risks: per-second digits need drawtext expressions rather than the svg
  rasterizer (the repo's fitted-copy path), which is the riskier text path;
  teachers do not run a CLI (Desktop only). Good day-two material.

### 3. Podcast audiograms (waveform + caption clip per episode)

- Who: podcasters; Adobe Podcast, Buzzsprout, EchoWave all ship an audiogram
  feature because hosts keep asking for one.
- Evidence: https://podcast.adobe.com/en/guides/audiograms-101 - "Video is
  on the rise in the podcasting world, but not every podcaster wants to be on
  camera"; audiograms exist because "many social media platforms do not
  support audio-only uploads".
- Why m0saic fits: a timed card with a waveform cell and caption cells.
- Risks: needs an audio file to look like anything - at defaults the gate
  would skip it; captions need a transcript. Not a first-day template.

### 4. Release / changelog announcement cards

- Who: maintainers announcing versions on social; changelog tools
  (AnnounceKit, Featurebase, ReleaseNotes.io) all push "amplify each release
  on social".
- Evidence: https://announcekit.app/blog/how-to-automate-release-notes/ (web
  search result; text-only automation, the picture is left to the human).
- Why m0saic fits: version, date, three bullets -> a card. Batchable from a
  release JSON.
- Risks: thinner direct evidence of the *media* pain than #1; it is close to
  #1 with a list prop - a natural v2 or sibling once #1 exists.

## Pick

**#1, the Open Graph card.** It has the most direct evidence of a repeated,
scripted need (people are paying APIs and running headless browsers to
produce five strings on a rectangle), and it is the shape m0saic was built
for: a deterministic still from props, run from a build step. The countdown
(#2) is the strongest video candidate and should be tomorrow's first look.

## Rejected today

- Classroom countdown: video-first with per-second digits; keep for day 002.
- Podcast audiogram: needs an audio input to show anything at defaults.
- Release card: a variant of the pick; do it after the pick exists.
- YouTube thumbnails / end screens (searched): taste-heavy, face-driven,
  every result was a Canva/Gumroad template pack - not a props problem.
