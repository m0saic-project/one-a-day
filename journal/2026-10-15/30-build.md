# Build - 2026-10-15

## Template: @one-a-day/gaming/osu-scorepost-card/v1

## Variant a - split-layout dark card · gate: clean · render: ok · stills: what they show

`npm run build` and `npm test` both pass. The layout contract holds at all seven canvases (1920x1080, 1280x720, 1080x1920, 1080x1080, 3840x2160, 640x360, 480x270).

The rendered stills show the default fictional S-rank scorepost:
- **Landscape**: "Freedom Dive" / "xi" / "Another" / "by WhiteCat" in the header; a gold S badge on the left; a 2x2 stat grid on the right showing 98.72%, 2,385 combo, 987,654,321 score and 786 pp; four hit-count tiles (2,000/300, 50/100, 10/50, 5/MISS) and "HD HR" mods at the bottom.
- **Portrait**: the same content stacked vertically - header, rank badge centred above a 2x2 stat grid, hit counts and mods at the bottom.
- **Square**: header, rank badge centred, four stats in one row beneath it, then hit counts and mods.

The background is generated from the single `backgroundColor` prop as a base colour plus three deterministic translucent spots; no remote beatmap art is fetched.

## Variant b / c

Not built. Variant a clears the brief and the gate; a light-preset variant and a video-beat variant were listed as worth trying, but the split-layout dark card already demonstrates the core use case across all three required aspects and passes every check.

## Why-tutorial: the problem page and the solution page, one line each on what they say

- **Problem page (tutorial-2)**: identifies osu! players on r/osugame and Discord, the daily screenshot ritual, the existing scorepost generators, and the six sources the scout opened.
- **Solution page (tutorial-3)**: states that typing the osu! API score fields yields a 16:9/9:16/1:1 card with a generated background, and that the layout adapts to aspect ratio so text is never clipped.

## What was hard (two or three lines an author would want tomorrow)

1. The layout contract bands are tight: the header must stay within yFrac [0, 0.25], the rank badge within [0.18, 0.75] while keeping aspect 1, and the stat tiles within [0.35, 0.88]. In portrait and square the rank badge was overlapping the stat grid until the stat top was explicitly set to `rankRect.y + rankRect.h + gap`.
2. Fitting four hit-count tiles plus mods into the bottom band on a 480x270 canvas required reserving 60% of the bottom width for hits and 40% for mods, and raising the hit-tile height to 70% of the band.
3. Closed-set props (`rank`, `preset`) cannot be bound to rects, and the `beatmapArtist`/`difficulty` lines had to be split into separate bound cells after an initial combined subtitle tripped `bindingsCover`.

## Revision 1 - variant b
- The verdict said: WHY.timeline omitted the build phase (tutorial-6 showed 2 phases/36 calls/943k tokens/$0.35); the layout-contract loops hard-coded `stat-acc-name` and `hit-300-name`, leaving the other stat-name and hit-name labels unconstrained.
- Changed: timeline now lists scout/plan/build/critique from `journal/2026-10-15/trace.json` (4 phases, 142 calls, 6.7M tokens, ~$1.77, 53m 33s) and `tutorial-6.png` shows the full waterfall. Layout-contract loops now use `${stats[i].label}-name` and `${HIT_LABELS[i].label}-name`, so every stat-name and hit-name label is constrained to its band. Stat value cells are bound to `accuracy`/`maxCombo`/`score`/`pp`, and hit-count value cells are bound to `hits`. The default `playerName` changed from `WhiteCat` to `PlayerOne` so the sample is clearly fictional, and hit-count tiles now use a distinct `hitTile` color so boundaries show against the generated spots.
- Also fixed: the `playerName` schema description no longer claims the sample name is invented; it now says "The default is a sample name." Verified the seven-canvas layout contract still passes and all bound props resolve without rejection.
- Still weak: the rank badge text cannot be `bindProp`-ed because `rank` is a closed-set picker, which the engine rejects (`unsupported-type`); the rank still changes when the prop changes because the whole render recomputes, but it is not in the prop-binding map.

## In place now: b
