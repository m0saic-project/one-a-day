# Ship - 2026-10-08

## @one-a-day/science/astro-integration-summary/v1 - Astro Integration Summary
A 12 s clip for deep-sky astrophotographers who run unattended N.I.N.A. nights and post finished images with their acquisition numbers. It takes the session rows (typed by hand as `sessions`, or an `ImageMetaData.csv` pasted into `csv`) and draws one bar per filter on a single scale fixed from t=0, each bar stacked from a segment per night, over a night ruler and a running total in hours. The clip opens on the finished card, lets the nights land in order, and ends where it began, so the first frame (and the browse card) is the finished card, not a blank. Variant a (navy) shipped; it was already in place, so nothing was copied from `variants/`.

## Render it
m0saic make @one-a-day/science/astro-integration-summary/v1 --template-repo . -w 1920 -h 1080 -o out.mp4
Props worth trying: --props '{"csv": "<your ImageMetaData.csv>"}', `filterColors` {"Ha":"#ff5533"}, `target`, `equipment`, `footer: ""` to drop the "sample data" line, `clipSec`; -w 1080 -h 1920 for a story.
Why it exists (the tutorial): m0saic make @one-a-day/science/astro-integration-summary/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4

## What the ship phase did
- Ran `npm run build && npm run previews && npm run build && npm run fingerprints:update && npm run verify`: verify exit 0 (419 jest tests, contract check, deps clean). `preview.png` (100 KB) and `preview.gif` (150 KB) are in `assets/templates/@one-a-day__science__astro-integration-summary__v1/`; I looked at the png: it is the finished card, text and bars legible.
- `m0saic doctor . --json`: `ok: true`, 0 errors. Its first run flagged `bindingsDeclared` on `sessions`, `csv`, `filterColors`, `clipSec`; I declared them in `bindings.unbound` with a reason each (same pattern as chess-game-recap/v3). No layout change; fingerprints unchanged.
- `m0saic make ... --tutorial --validate-only`: exit 0.
- `WHY.timeline` refreshed from `trace.json` (scout, plan, build, critique; the ship phase is not in it, it was still running). `WHY.model` set to `claude-sonnet-5-5` to match `run.json` (earlier phases wrote `claude-sonnet-5.5`; same model, spelling differs).
- Critic's wording points fixed in `WHY`: `who` no longer claims AstroBin / NINA Discord as read, and the log-analyzer sentence is split from the CSV sentence.

## Weak spots (honest; a human polish pass starts here)
- Bar tints alternate by each filter's own segment index while the ruler alternates by night index, so a segment cannot be tied to a night by colour (Ha's last segment, night 4, sits under a light ruler cell but is dark). This is the thing closest to a no-ship in 40-critique.md; not fixed here (a layout/colour change belongs in the build, and the ship phase did not touch geometry).
- The CSV path (`ExposureStartUTC`, `Duration`) was only run on a synthetic file; no real NINA `ImageMetaData.csv` was opened. If the plugin writes timestamps in another form, a first paste is refused (by row, by name).
- Portrait leaves ~270-300 px of empty navy around the three rows; title and equipment lines sit close. `night-ruler` `minWidthFrac` is 0.85 where the brief said 0.9.
- Hours are drawn in a monospace face that differs from the rest of the card.
- The `WHY` demand evidence is inferred from hand-typed numbers on two observatory pages; AstroBin could not be read.
- Hours are drawtext in the machine's font; pixels are deterministic per machine only.
- No object image, by design. Dual-band filters are one row each, never split.
- Doctor's `catalogSidecar` / "lagging" notes about 0.3.1 apply repo-wide, not to this template.

## Follow-ups (what v2 would do)
1. Tint segments by night parity (or print "N1".. on wide segments) so bars and ruler agree.
2. Check against a real `ImageMetaData.csv` from the plugin repo and widen the reader to what it writes.
3. Use portrait's vertical slack; raise `minWidthFrac` to 0.9; gap between title and equipment.
4. A `theme` prop (navy | paper; variant b was only a palette swap) and a proportional face for the hours.
