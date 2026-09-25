# Ship — 2026-09-25

**Shipped: `@one-a-day/social/episode-audiogram/v1` — 2026-09-25 · Episode
Audiogram** (variant b, the mirrored wave). The repo's second video
template and its first with a real audio path: `audioSrc` joins the
engine's mix, so the rendered MP4 IS the postable clip.

## The render one-liner

```
m0saic make @one-a-day/social/episode-audiogram/v1 --template-repo . -w 1080 -h 1080 -o clip.mp4
```

Batch is the point: one call per episode with `--props` (episodeTitle,
quote, wave, an ABSOLUTE audioSrc path, coverSrc), `-w 1080 -h 1920` for
the reel crop, `--durationMs` to pin the clip length.

## How this day ran

The 09:00 task fired at 06:04 PT as a missed-start catch-up while the
laptop lid was closed (the founder is travelling; the machine clock is
Pacific, so the trigger is currently 09:00 PT), stalled asleep for two
hours, resumed at 08:12, and was cancelled by the founder at 08:15 during
its first scout call. The founder's interactive Claude Code session
(Fable 5) ran the day instead, keeping the roster's own draw —
`claude-fable` — honest. The scheduled task was disabled for the run and
re-enabled after the push. Gated via `logs/gate-run.mjs`
(`runGate --no-push`), pushed by hand, day-004's pattern exactly.

## Verified before the gate

- `npm run build` and `npm run verify` fully green (freeze, registry
  conventions, fingerprints, layout contract at 7 canvases, why-tutorial,
  jest 10/10, contract-check, check-deps).
- Audio both ways by ffprobe: a snippet in → `h264 + aac` out; defaults →
  video stream only (30-build.md).
- Preview minted: `preview.png` 75 KB (frame 0 is the finished picture —
  bar 0 already lit, clocks at 00:00 / 00:30).

## Weak spots, honestly

- No word-level captions; the quote is static. Headliner does karaoke
  captions; this does batch.
- `wave` is the producer's to extract (8..32 peaks, 0..1); the default
  array is hand-tuned but generic to the actual audio.
- File props need absolute paths from the CLI (relative dies at ffmpeg
  with `missing-input` after an `ASSET_PATH_NOT_ABSOLUTE` warning) — an
  upstream ergonomics gap worth filing.
- overlayDepth 59 recorded-posture warning: the flattened count includes
  the child's 31 gated bars; the mask-degradation failure it guards cannot
  bite (no masks in the child), same posture as talk-timer.

## For a maintainer's polish pass (humans only — these files are protected)

- `tools/gen-previews.mjs` `ANIMATED_PREVIEW_IDS`: motion is the point
  here; adding this id would mint `preview.mp4 + poster.png` for the
  browse grid (talk-timer is in the same position).
- The critique's polish list: portrait's empty upper band, a quieter
  initials cover, in-template wave resampling.
