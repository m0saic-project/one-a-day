# Critique - 2026-10-15

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 2 | 1 | 15 | no |

## What each variant gets right / wrong

### Variant a - split-layout dark card

**Right**
- Renders cleanly at all three required aspects (and the tutorial), exit 0 everywhere, no degraded flag.
- The default fictional S-rank scorepost is immediately readable as an osu! result card: title, artist, difficulty, player, rank badge, four stat tiles, hit counts, mods.
- Text is fitted and readable in portrait and square, not just landscape; the seven-canvas sweep passes.
- Validation is fail-fast and specific: invalid rank, malformed hits, bad color, out-of-range numbers all throw with the prop name.
- No remote beatmap art is fetched; the background is generated from `backgroundColor` plus deterministic translucent spots.
- The problem page (`tutorial-2.png`) cites the six sources from `10-scout.md` and the solution page (`tutorial-3.png`) describes exactly what this variant does.

**Wrong**
- `WHY.timeline` in `osu-scorepost-card.ts` omits the `build` phase. `journal/2026-10-15/trace.json` shows three phases (scout, plan, build), 109 tool calls, 5.7M tokens, ~$1.51 and ~48 min wall time. `tutorial-6.png` instead says "2 phases - 5m51s - 36 tool calls - 943k tokens - $0.35", so the "how it was made" page does not show the phases that actually ran.
- The layout-contract loops hard-code `stat-acc-name` and `hit-300-name` for every index, so `stat-combo-name`, `stat-score-name`, `stat-pp-name`, `hit-100-name`, `hit-50-name` and `hit-miss-name` are never constrained to their bands. The sweep still passes, but the contract under-promises.
- Most rects that show props are not `bindProp`-ed. Only `beatmapTitle`, `beatmapArtist`, `difficulty`, `playerName` and `mods` are bound; the rank badge text, the four stat values and the four hit-count values are not, contrary to the AGENTS.md rule that rects showing a prop should be bound.
- `propsSchema.playerName.description` says "The sample name is invented", but `WhiteCat` is a real osu! player; it is a sample, not an invented one.
- On landscape and square the hit-count tile color is almost the same as the generated spot behind it, so the tile boundaries are hard to see (the numbers and labels are still readable).

## Decision: NO SHIP

## If no-ship: the one thing that would have changed the verdict

Update `WHY.timeline` from `journal/2026-10-15/trace.json` so `tutorial-6.png` includes the `build` phase and the real totals (phases, calls, tokens, cost, wall time), and fix the two layout-contract loops so every stat-name and hit-name label is actually constrained to its band.
