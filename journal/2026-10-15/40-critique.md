# Critique - 2026-10-15

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 2 | 1 | 15 | no (round 1) |
| b | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 2 | 1 | 15 | no |

## What each variant gets right / wrong

### Variant a - split-layout dark card (round 1)

Already judged in `40-critique.r1.md`. The scores are preserved for reference.

### Variant b - revision 1

**Right**
- Renders cleanly at landscape, portrait and square (exit 0, no degraded flags), and the tutorial exits 0. The default fictional S-rank scorepost is immediately readable as an osu! result card.
- Text is fitted and readable at portrait and square; the seven-canvas sweep passes and the test asserts it for long copy, empty player/mods, and every rank.
- Validation is fail-fast and specific: invalid rank, malformed hits, bad color, out-of-range numbers, and non-string props all throw with the prop name.
- No remote beatmap art is fetched; the background is generated from `backgroundColor` plus deterministic translucent spots.
- The problem page (`tutorial-2.png`) names r/osugame and Discord, quotes the daily screenshot ritual, and lists the six sources from `10-scout.md`.
- The solution page (`tutorial-3.png`) accurately describes what this variant does: typed score fields, generated background, aspect-aware layout.
- The four stat values and the four hit-count values are now `bindProp`-ed; `playerName` is a clearly fictional `PlayerOne`.

**Wrong**
- `WHY.timeline` lists four phases (scout/plan/build/critique) from the trace, but `journal/2026-10-15/trace.json` already contains five phases at the time variant b was rendered - the revision `build (2)` is omitted. `tutorial-6.png` therefore shows "4 phases - 53m 33s - 142 tool calls - 6.7M tokens - $1.77" instead of the five phases that had actually run.
- The layout contract still under-promises: value cells (`stat-acc`, `stat-combo`, `stat-score`, `stat-pp`, `hit-300`, `hit-100`, `hit-50`, `hit-miss`, `rank`) are not constrained to their bands, only the tiles and name labels are. The sweep passes because the values happen to sit inside the tiles, but the contract does not promise it.
- The rank badge text cannot be `bindProp`-ed because `rank` is a closed-set picker the engine rejects (`unsupported-type`); the builder noted this as still weak. The rank still changes with the prop because the whole render recomputes, but the rect is absent from the prop-binding map.

## Decision: SHIP b

## If ship: what a human polish pass should look at first
- Add `within: { yFrac: [...] }` constraints for every value cell, not only the tiles and name labels, so the layout contract matches what the code actually guarantees.
- Decide whether to keep the rank badge text unbound (engine limitation) or wrap it in a string prop internally so it can be bound like the other cells.
- Refresh `WHY.timeline` from the final `trace.json` in the ship phase so `tutorial-6.png` includes the revision build and the current critique phase.

## Revision 1: what the earlier verdict asked for, and whether it is there
- **WHY.timeline must include the build phase and show real totals** - yes. `tutorial-6.png` now shows scout, plan, build and critique with the correct totals for those four phases.
- **Layout-contract loops must constrain every stat-name and hit-name label** - yes. The loops now use `${stats[i].label}-name` and `${HIT_LABELS[i].label}-name`, so all eight name labels are band-constrained.
- The earlier verdict also noted missing prop bindings and the `WhiteCat` sample name; the revision binds the stat/hit values and switches to `PlayerOne`.
