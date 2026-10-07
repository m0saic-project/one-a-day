# Critique - 2026-10-07 v3

independent critic subagent (Claude Sonnet), fresh context, did not build it

## Scores (the 7 acceptance items, 0-2 each, 14 max)

| item | a |
|---|---|
| 1. Every square cell exact, all seven canvases | 2 |
| 2. Each square shows exactly the game's piece, never two | 2 |
| 3. Slides land on target; castling slides two rects | 2 |
| 4. Platform knob (hints follow, explicit wins, junk) | 2 |
| 5. Names/event editable in place, overrides show | 2 |
| 6. Render cost measured against v2 | 2 |
| 7. v2's rubric still holds (frame 0, captions, fit, determinism, tutorial truthful) | 1 |
| total | 13 / 14 |

Basis: `npx jest src/sports/chess-game-recap/v3` passes 9/9. Items 1, 4, 5 and the castling half of 3 are credited from tests and code; I did not re-render. Items 2 and 3 for the shown moves I checked on real frames (landscape render, ffmpeg cuts). Item 6 is credited from the build note's own back-to-back table (70 s vs 74 s, 162 vs 44 sources); I did not re-time it. Item 7 loses a point for the registry fingerprint warning and the graph change (defects 1 and 4).

## What it gets right / wrong

Right:

- **Frame 0 is the finished card.** t=0.1 shows the final position (Nb8, Rd8 lit with d1, Ke8, Bf8, Rh8, Qe6, Bg5, e5/e4), "17. Rd8#", "1-0 checkmate on move 17", graph with the gold marker at the last ply. Identical in content to v2's frame 0. The board sits 2 px right of v2's (66 vs 64) because it is now lattice-exact; invisible.
- **Pre/post positions are correct square by square** for all five featured moves (cut at moment start and after the slide):
  - 10. Nxb5 (1.9 s before, 2.6 s after): before, Nc3 with c3 lit and the black b5 pawn present; after, Nb5 on b5, c3 empty and lit, b5 pawn gone, Bc4, Qb3, Nf6, Qe7 in place.
  - 13. Rxd7 (4.0 to 5.3 s): Rd1 slides up the d file (frames 4.55 to 5.3 show it at d2, d4, d5, d6, then on d7 with d1 lit); black Nd7 gone after landing; Rd8 still black on d8; Rh1 untouched.
  - 15. Bxd7+ (7.7 to 7.85 s): Bb5 lands on d7 and the black rook is gone from the first frame after landing (7.74 s). b5 lit.
  - 16. Qb8+ (9.2 to 10.4 s): queen b3 to b8 with b3 lit, Nd7 still on d7 (took on d7 at move 15, correct).
  - 17. Rd8# (11.8 to 14.9 s): Rd1 slides to d8, Nb8 present, d1 lit; the end card is the same position as frame 0, so it loops.
- No missing or doubled piece found anywhere in the 18 frames I cut, and no piece left on a from-square at or after any slide.
- Portrait (15. Bxd7+ still) and square keep the v2 arrangements; text fits, long name "Duke Karl / Count Isouard" fits on all three.
- Tutorial slide 3 tells the truth, including the square-by-square cut and the 60-bar cap.
- Moment changes as hard cuts per square look fine at normal speed. Unchanged squares do not flicker, the changes are one or two squares plus the lit tiles, and the caption and the graph marker change at the same instant. The old whole-board cross-fade is not missed; if anything the cut reads crisper.

Wrong or weaker:

- At the end of a capture slide the captured piece is still drawn under the slider until the slider arrives (portrait-50 at 7.7 s: black rook visibly ghosted behind the white bishop, offset a few px). It disappears cleanly at landing. A 2 to 3 frame cosmetic ghost, expected from the layer design.
- The graph is visually different from v2 (see defect 4).

## Defects found

1. **Should-fix (gate warning, not a visual).** `node tools/check-registry.mjs --json` is ok with 0 errors, but warns that v3 has no committed `chess-game-recap.layout.m0` fingerprint at src/sports/chess-game-recap/v3. Run `--update-fingerprints` and commit it before shipping, or the registry stays noisy.
2. **Polish.** Captured piece ghosts behind the slider for the last few frames of a capture slide (7.7 s). Fix is a slightly earlier capture-gate off (e.g. at the slide's 90 percent) or accepting it.
3. **Polish.** Per-moment cut is a hard cut at the start second; no fade. Acceptable, but a one-frame lit-tile fade would soften it. Documented in the tutorial.
4. **Polish.** The graph changed from v2's filled area with a dot per moment to bars with only the current moment's marker line. Reads fine and more honest to "one rect per ply", but the other four moment dots that showed the story on one glance are gone, and 60 bars of height 1 to 4 px at small canvases are thin lines. Marker line is thicker than anything else on the graph and slightly crosses the panel edge at the top on landscape (frame 0).
5. **Polish.** Frame 0 graph marker in a bar-graph at the last ply overlaps the last bar, hiding the final plunge height. Cosmetic.

No fatal defects.

## Against v2

Improvements:

- Platform knob works (desktop 1920x1080 / square / mobile through resolveOutputHints), tested incl. junk, and the three arrangements render with the same flow as v2.
- Geometry is what the founder asked for: 64 labelled cells, one rect per piece, lit tiles, slider rects, bar rects; names and event bound in place with overrides.
- Document art fell from 244 KB to 13 KB; 1920x1080 render 70 s vs 74 s; clip 280 KB vs 340 KB.
- Cells are exact on all seven canvases (tested).

Regressions:

- Whole-board cross-fade replaced by a per-square cut (judged acceptable above).
- Graph look changed (defect 4).
- Source count 44 to 162, gated 30 to 50; no measured cost, but the document is bigger to inspect by hand.
- Pieces, text, spacing: no visible regression versus v2 (frame 0 compared side by side with v2's).

## Decision: SHIP a

13 of 14, no fatal defects, every featured position and slide verified on frames.

## If ship: what a human polish pass should look at first

1. Commit the layout fingerprint (`--update-fingerprints`) so the gate is clean.
2. The graph: whether the bars read well on mobile and the marker on frame 0 at the last ply; consider restoring per-moment dots.
3. The ghost of the captured piece in the last frames of a capture slide.
4. Whether the hard cut at each moment start wants a quick fade on the lit tiles.
