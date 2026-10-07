# Critique - 2026-10-07 v2

independent critic subagent (Claude Sonnet), fresh context, did not build it

## Scores

Rubric criteria 1-9 from 20-brief.md, 0-2 each, 18 max.

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 0 | 15 | no |
| b | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 0 | 16 | no |

Basis: criteria 6 and 8 are credited from code and tests, not from a render. `npx jest src/sports/chess-game-recap/v2` passes, 22 of 22. I did not render twice and diff the output.

## What each variant gets right / wrong

Shared code (a and b differ only in layout polish; tutorial-1 and tutorial-3 are byte-identical across the two).

Right:

- **Frame 0 is the finished card.** Landscape b at t=0 shows the final position (Nb8, Rd8 lit with d1, Ke8, Bf8, Rh8, Qe6, e5, Bg5, e4, Kc1). It also shows "17. Rd8#", "1-0 checkmate on move 17" and the full graph with the marker at the last ply. The same frame is on portrait and square. At 15.3 s the clip ends on the same card, so it loops cleanly.
- **Every featured position is correct, checked against the game.** I cut the landscape b render at settle times 3.0, 5.6, 8.2, 10.8 and 13.4.
  - 10. Nxb5: Nb5 and c3 lit, black b5 pawn gone.
  - 13. Rxd7: Rd7 and d1 lit, black knight gone, Ra8 already on d8.
  - 15. Bxd7+: Bd7 and b5 lit, black rook gone, Qe6 and Nf6 in place.
  - 16. Qb8+: Qb8 and b3 lit, Nd7 still on d7 (the f6 knight took on d7 at move 15).
  - 17. Rd8#: Rd8 and d1 lit.
  - Each pre-move board is right too: Rd1 plus Rh1 before 13, Nf6 present before 15, Nd7 only before 16.
- **Slides are real.** Mid-slide frames at 2.25 (knight c3 to b5, halfway across Bc4), 4.85 (rook d1 to d7, at about d4), 7.45 (bishop b5 to d7, at c6), 10.05 (queen b3 to b8, at about b4/b5) and 12.65 (rook d1 to d8, at about d5). The from-square is lit in each. Portrait and square show the same slides.
- **Captions are true.**
  - 10. Nxb5 "gives a knight for a pawn": cxb5 retakes, net -2.
  - 13. Rxd7 "gives a rook for a knight": Rxd7 retakes.
  - 15. Bxd7+ "takes a rook with check": Nxd7 follows, but the trade is net +2, so the template correctly does not call it a sacrifice (story.ts:46).
  - 16. Qb8+ "gives up the queen with check".
  - 17. Rd8# "checkmate".
  - The numbering and SAN are right.
- **Pieces read at small size.** The light set is outlined, the dark set has detail lines. Pieces stay clear at the 960 px contact-sheet scale.
- **Nothing clips on landscape, portrait or square.** The 30-plus-character name "Duke Karl / Count Isouard" fits on all three. The board is square and the largest element on each.
- **Graph labelled and honest.** "MATERIAL", White above and Black below. The moment dots sit on real features: small peaks at 13 and 15, the plunge at 16-17. The marker walks with the moment and ends at the last ply.
- **Bad input fails loudly.** Illegal and unparseable moves and an empty PGN are covered by the 22 passing tests.

Wrong (see defects): the stub tutorial timeline and the ghosty cross-fades.

Variant a specifically:

- The square canvas has a widow: "gives a rook for a / knight" at 5.6 s.
- The portrait has spare height at the bottom and a short graph.
- The landscape graph is short with a gap above it.

Variant b (a's code plus layout polish, confirmed by comparing the same frames):

- The square wraps balanced: "gives a rook / for a knight".
- The portrait graph is taller, and the caption and graph sit better in the column.
- The landscape graph is taller, filling the gap (a 12.65 vs b 12.65). The vertical rhythm is better.

b is strictly better on layout. There is no regression I could find.

## Defects found

1. **should-fix: the why-tutorial's "How this template was made" page (tutorial-6) is a stub, not this session's timeline.** It reads "1 phase - 0s wall time - 1 tool calls - 1 tokens", with a single solid orange bar and a "0" axis label. The footer says "numbers self-reported by the agent - no runner trace for this run". Source: `timeline` in `WHY`, chess-game-recap.ts:912, `{durMs:1, calls:1, tokens:1, costUsd:0}`. Rubric 9 requires the timeline to be the session's. This costs the criterion 0 on both variants. The prose pages (tutorial-1 to 4) are truthful.
2. **should-fix: the cold-open to moment-0 hand-off is rough on landscape.**
   - At t=1.4 the caption is empty and the marker has already jumped to the 10. Nxb5 point while the board still shows the finished position.
   - At t=1.54 the board is a half-faded mix: ghost Rd8, Qe6 and Ra8 over the pre-move position.
   - A similar cross-fade appears at about 4.1 s (the board mid-fade, "13. Rxd7" caption dim). The caption and board are out of phase by a few frames.
   - It is brief, but it is visible on every moment change and slightly undermines "pieces slide".
3. **polish: the graph is small and flat for the first two thirds.** Until ply 19 it is a hairline near zero, with no axis, scale or Black/White legend. A newcomer cannot tell that "up" means White is ahead. The text label is only "MATERIAL". The plunge at the end is the point, and it reads.
4. **polish: the square canvas has a large empty block in the caption column** between the two-line caption (ending around y=410 at 1080 px) and the opening line at the bottom (y=820). It looks sparse. The portrait is fine in b.
5. **polish: the dark pieces on the dark squares.** The lit from/to highlights are gold and read fine. Some black pieces on dark-brown squares (for example Qe7 in the pre-move boards) have lower contrast than the same piece on a light square. They stay legible.
6. **polish: captions are generic.** "takes a rook with check" for Bxd7+ and "checkmate" for Rd8# are true but undersell the story. The first is part of a trade (the template logic deliberately avoids calling it a sacrifice). Nothing is false.

No fatal defect: no wrong position, no wrong caption, no clipping.

## Decision: SHIP b

Both variants pass the substantive bar. The chess is right at every featured ply, every slide goes from the correct square to the correct square, every caption is true of its move, and frame 0 is the complete finished card. The code is tested (22 of 22) and nothing clips on landscape, portrait or square. b is a's code with better wraps, a better-spaced portrait and a taller landscape graph, and I saw no regression, so it ships. The one rubric criterion that fails is the tutorial timeline (0 of 2), which is a stub of "1 token, 0 s". That does not affect the rendered template, but it is a record-integrity issue and should be fixed or replaced by the real session numbers before the tutorial page is trusted.

## If ship: what a human polish pass should look at first (ranked)

1. Replace the tutorial-6 timeline stub with real session phases (or drop the page, or mark it honestly "not measured"), `WHY.timeline` at chess-game-recap.ts:912.
2. Smooth the cold-open and moment-change cross-fade phase: have the caption and marker switch with the board, not before it, and shorten the ghosty overlap at 1.4-1.9 s.
3. Add a minimal graph legend ("White ahead" above the line, "Black ahead" below) or a faint scale, and consider amplifying the early flat section.
4. Use the empty block in the square canvas caption column (the graph, a longer caption area, or a larger board).
5. Check the dark-piece contrast on dark squares at 480x270 (the brief's own legibility size). I viewed 960 px sheets only, not 480x270.
