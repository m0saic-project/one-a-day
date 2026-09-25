# Build — 2026-09-25

Two variants built and rendered; b is the shape in `src/`. Every render
exit 0, nothing degraded. The renders were cheap all day: a 30 s clip is
14-20 s per canvas, the tutorial ~30 s.

## Variant a — the brief's baseline

Cover left, quote right of an accent bar, wave band of centred bars, footer
with a counting drawtext timecode. The mechanisms are day-004's, reused
deliberately: the sweep is one enable-gated accent copy per bar
(`gte(t, k*clip/N)`) over a static dim bar, all of it in a mask-free child
document on a 5-smooth canvas; the timecode is one drawtext expression
capped at the total (`min(trunc(t), S)`), so the end frame reads 00:30, not
over.

What its stills taught:
- The child document rendered on a BLACK canvas — the wave band read as a
  black strip against the `#101319` page. A child needs its own
  `backgroundColor`; nothing warns about it.
- The elapsed drawtext prints `00:15` but the static total printed `0:30` —
  the two clocks in one footer disagreed. `clockText` now pads minutes.

## Variant b — the mirror (PICK)

One idea: the classic audiogram baseline. The main bar stands on a midline
at 2/3 of the band; a static reflection hangs under it at 16% ink. Only the
main bars are gated, so the mirror costs zero extra overlay layers. Against
a's centred blobs, b reads as an audiogram from across the room.

## Audio, proven

The rubric asked for evidence, not intent (first audio-bearing template in
this repo):

- `audioSrc ["<abs path>/tone.wav"], clipSec 8` → ffprobe on the output:
  `h264` video + `aac` audio. The snippet ships inside the MP4.
- defaults (no file) → ffprobe: one video stream, NO audio track — the
  engine's tri-state law ("auto" writes no empty track) behaves exactly as
  documented.
- The proof tone was generated (`sine=330:8s`) and deleted before commit;
  only `logs/audio-proof.props.json` remains.

## What was hard (for the humans who read this)

1. **Asset ids are not paths.** `assets` keys must match
   `/^[A-Za-z0-9_][A-Za-z0-9_.\-]{0,127}$/` — a path with separators is
   refused at plan time. Day-005 never hit this because its `sourceIds` were
   bare filenames. The template now uses the ref itself when it is id-shaped
   and a fixed id (`audio-src`, `cover-art`) with the ref as the manifest
   path otherwise.
2. **Relative asset paths do not resolve for template renders.** The loader
   resolves a document's assets against the document directory; a template
   render has none, the path reaches ffmpeg raw, and the render dies with
   `missing-input` after a plan-time warning (`ASSET_PATH_NOT_ABSOLUTE`).
   File props must be absolute paths from the CLI. Worth an upstream look:
   resolving against cwd for `--template-repo` renders would be friendlier.
3. **overlayDepth 59 (warning, recorded posture).** The budget counts the
   flattened tree, so the 31 gated bars land on the parent's number even
   though they live in a child. The failure the budget guards against - svg
   glyph masks degrading past ~25 overlays in one chain - cannot bite here:
   the child carries no masks (plain rectangles), and the parent's own
   chain is shallow. Same posture talk-timer shipped with at 30 slices.
4. **PowerShell 5.1 ate the middle dots.** A `Get-Content`/`Set-Content`
   round-trip re-read the UTF-8 source as ANSI and shipped `Â·` into the
   template label; the manifest gate caught it. Repaired with explicit
   UTF-8 reads; the session now writes files only through the harness
   tools or `[System.IO.File]` with explicit encoding.

## Gates at the end of the phase

`npm run build` fully green (freeze, tsc, manifest, registry conventions,
fingerprints, layout contract at 7 canvases, why-tutorial). Jest: 10/10,
including the sweep arithmetic (`litBarsAt == floor(t*n/clip)+1`), the
5-smooth child canvas at a 1263x711 parent, the audio asset wiring, and the
duration-pin rule (a pin becomes the clip; the host-seeded target never
does).
