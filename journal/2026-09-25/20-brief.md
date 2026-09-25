# Brief — 2026-09-25

## The use case (from the scout)

Podcast producers post 1-2 short clips per episode to socials: waveform,
pull-quote, cover art, the audio snippet. The tools they pay for (Headliner,
Wavve) are one-at-a-time GUIs; the evidenced unmet ask is batch — one render
per episode or chapter from data the producer already has.

## The template

- id: `@one-a-day/social/episode-audiogram/v1` (existing pack — it is a
  social-post asset, sibling of testimonial-proof-card)
- title: Episode Audiogram (scaffold prefixes the date)
- kind: video; canvas hint 1080x1080; portrait 1080x1920 and landscape
  1920x1080 must also read (the gate renders all three; the contract sweeps
  seven canvases down to 480x270)
- duration: `clipSec * 1000` ms, authored on the doc (default 30 s). An
  explicit user pin (`--durationMs`, Make's Duration field) wins and BECOMES
  the clip length; `ctx.target.durationMs` is never read as a pin
  (talk-timer's rule, reused verbatim).

## Layout (square; the geometry function reflows the same regions elsewhere)

```
+--------------------------------------+
| SHOW NAME                            |  header: show (dim, small)
| Ep 12 - The batch is the workflow    |  episode title (bold, fitted)
|                                      |
|  +--------+  "We stopped making      |
|  | cover  |   clips by hand the day  |  media row: cover art (square)
|  |  art   |   the feed started       |  + pull quote (fitted lines)
|  +--------+   making them for us."   |
|                                      |
|  | || ||| |||| ||| || | || ||| ||    |  wave band: N bars, sweep L->R
|                                      |
|  00:12 / 00:30    New episode - out  |  footer: timecode + CTA
+--------------------------------------+
```

Portrait stacks the cover above the quote; landscape narrows the media row
and widens the wave. One pure `layoutAudiogram(opts, W, H)` decides — the
test asserts its rects, not pixels.

## Layout contract (what the build sweeps)

- Every text fits, measured: show name, episode title, each quote line, CTA,
  the total-time suffix; the per-frame timecode measured against the widest
  string its expression can print, widened for the system drawtext font
  (talk-timer's 1.15 factor).
- The wave band is present, `within: { yFrac: [0.35, 0.97] }`,
  `minWidthFrac: 0.5` — the wave is the product.
- The cover tile is `aspect: 1`.
- The episode title lives in the top 40%; the footer in the bottom 30%.
- No exact pinned fractions — the use case does not demand them.

## Props (name · type · default · what it changes · required?)

1. `showName` · string · "SIGNAL PATH" · the header line and the generated
   cover's initials · no
2. `episodeTitle` · string · "Ep 12 - The batch is the workflow" · the bold
   title · no
3. `quote` · string · "We stopped making clips by hand the day the feed
   started making them for us." · the pull quote, wrapped and fitted · no
4. `wave` · number[] (8..32 values, 0..1) · a literal 32-value array tuned
   to read as speech · the bar heights · no
5. `clipSec` · number (5..600) · 30 · clip length; the sweep and the
   timecode derive from it · no
6. `audioSrc` · string (file path) · "" · when set, the file joins the audio
   mix and the MP4 carries the real snippet; empty renders silent · no
7. `coverSrc` · string (file path, image) · "" · replaces the generated
   initials cover · no
8. `cta` · string · "New episode - out now" · the footer right cell; empty
   removes it · no
9. `accent` · #rrggbb · "#7c5cff" · played bars, quote marks, cover tile · no
10. `preset` · "dark" | "light" · "dark" · hand-tuned bg/ink/dim trio · no
11. `debugLayout` · boolean · false · dev-only contract overlay · no

## Beats (video)

- t=0: the finished picture — full layout, bar 0 already lit (frame 0 is the
  browse still), timecode 00:00.
- Bar k of N flips from dim to accent at `k * clipSec / N` (enable gate,
  child document, no masks — talk-timer's bar mechanism).
- The timecode is one drawtext expression counting elapsed MM:SS; the
  "/ MM:SS" total is static svg text.
- End: every bar accent, timecode at the total. No hold; the last frame is
  the lit wave.

## Defaults must show

A complete audiogram with zero inputs: generated initials cover ("SP" on
accent), dim wave with the sweep running, quote, show name, title, CTA,
counting timecode. Silent MP4 (no audio-bearing input → no track, the
engine's tri-state default).

## Acceptance rubric (the critic scores against this)

1. At 1080x1080 defaults it reads as an audiogram at a glance — cover,
   quote, wave, timecode all present, nothing clipped, nothing overlapping.
2. The sweep is truthful: the test asserts lit-bar count against
   `t * N / clipSec` and the timecode expression against elapsed seconds.
3. Audio is real: with `audioSrc` set, ffprobe on the rendered MP4 shows an
   audio stream carrying the snippet; with it empty, no audio track.
4. Batch is documented: the WHY usage page carries the one-render-per-episode
   command and the ffmpeg/audiowaveform one-liner that extracts the `wave`
   array from an audio file.
5. The layout contract passes at the seven canvases; portrait and landscape
   reflow without clipped or overlapping text.

## Variants worth trying (up to 3, each ONE idea different)

- a — baseline: the square-social layout above.
- b — layout: full-bleed cover as background under a scrim, quote overlaid
  (the footage-led look Headliner sells).
- c — motion: the wave mirrored below its baseline at low opacity (the
  classic audiogram reflection).
