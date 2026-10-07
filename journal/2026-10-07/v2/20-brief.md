# Brief - 2026-10-07 v2 (founder-directed)

Day 018's scout found the right construct - the PGN every Lichess and
Chess.com game exports - and v1 (`claude-haiku`) shipped a card that uses
none of it: six typed fields and a coloured square. The founder looked at it
and said "this could be a solid template though"; this is the fork. Same
idea, same date, a stronger agent (Claude Opus 5.5 in an interactive
session), and the founder's three calls:

1. **Animated key moments**, not a still and not a full replay.
2. **The Opera Game** (Morphy, Paris 1858) is what everyone sees by default.
3. **v1 is deprecated** in favour of v2 (it stays frozen, loadable, and in
   the journal as the Haiku record).

## The use case

A player pastes the PGN of a game they want to show - a club game, a
tournament round, a Lichess "game of the month" pick, a streamer's game of
the day - and gets a 15-second clip of the game's story: who played, how it
ended, and the four or five moves that decided it, each played on a real
board. A screenshot shows one position; this shows why the game mattered.

## The template

- id: `@one-a-day/sports/chess-game-recap/v2`
- title: `2026-10-07 · Chess Game Recap` (tags `2026-10-07`, `day-018`)
- kind: video (mp4), 1920x1080 by default, ~15 s at the default pace
- canvases: all seven contract canvases; three arrangements (below)

## Input: one PGN

`pgn` (string): the game as exported. The template reads it itself:

- headers: White, Black, WhiteElo, BlackElo, Result, Event, Site, Date,
  ECO, Opening (Lichess), ECOUrl (Chess.com: the opening name is the URL
  slug), TimeControl, Termination, SetUp/FEN (a game from a position)
- movetext: move numbers, SAN with `+ # ! ? !! ?? !? ?!`, NAGs (`$1`..`$6`),
  `{comments}` (kept with the move they follow), `(variations)` (skipped),
  `[%eval ...]` and `[%clk ...]` inside comments (Lichess analysis exports)
- every move is REPLAYED on a board (legal-move check, disambiguation,
  castling, en passant, promotion). A move that does not parse or is not
  legal stops the render with an error that names it ("move 12 for Black:
  Nf6 is not legal here") - never a silently wrong board.

Knobs: `moments` (which moves to feature: `"10 13 16"` = White's 10th, 13th,
16th; `"12b"` / `"12..."` = Black's 12th; empty = automatic),
`orientation` (`white` | `black`), `board` (`walnut` | `green` | `slate`),
`momentSec` (seconds per moment, 1.5-6, default 2.6), `debugLayout`.

## The story (timeline)

- **0 s - the finished card**: final position, the last move lit, the
  result caption, the full graph. Frame 0 is the preview, so frame 0 must be
  the whole picture; the clip then tells how it got there and loops.
- **Each moment** (K of them, the last one is always the final move):
  the position just before the move appears, the moving piece SLIDES from
  its square to its target (castling slides king and rook), the board
  settles on the position after it with both squares lit, and the caption
  names the move: `16. Qb8+` large, a plain-words line under it ("gives up
  the queen") - the PGN's own comment when it has one.
- The graph under the caption carries a marker that walks with the moments.

**Automatic moments** (deterministic, from the moves alone): score every
ply - a sacrifice (the piece that moved is taken on the very next ply and
the mover is down material over the pair) scores twice the material it
gave, a capture scores the value taken, a check +1, a `!`/`?` annotation or
a comment +4, an eval swing (when `[%eval]` is there) by the change in
winning chances; the reply that accepts a sacrifice scores nothing (it is
part of the same moment). Take the best four that are at least two plies
apart, in game order, then the final move. For the Opera Game that is
10. Nxb5, 13. Rxd7, 15. Bxd7+, 16. Qb8+ and 17. Rd8# - the game's
canonical story.

## The graph

Material balance per ply (P 1, N 3, B 3, R 5, Q 9), White up, Black down,
as an area chart. When most plies carry `[%eval]`, it is the evaluation
instead (as winning chances, so a mate score is the top of the chart), and
the label says which. The Opera Game's graph is the point of the game: by
the mate, White is down a queen and a rook.

## Layout - three arrangements

```
landscape (W/H >= 1.25)        square                    portrait (W/H <= 0.85)
+--------+---------+          +------------------+      +-----------+
|        | players |          |  players/result  |      |  players  |
| board  | result  |          +--------+---------+      +-----------+
| (full  |---------|          | board  | caption |      |   board   |
| height)| caption |          |        | opening |      |  (full W) |
|        |---------|          +--------+---------+      +-----------+
|        | graph   |          |      graph       |      |  caption  |
+--------+---------+          +------------------+      |  graph    |
                                                        |  opening  |
                                                        +-----------+
```

## Layout contract

- every text fits its box (measured fits; names shrink, then wrap to two
  lines; a comment caption is cut at a word boundary to its first sentence
  before it is fitted)
- the board is square (`aspect: 1`) and is the largest element on every
  canvas
- the graph sits below the caption; the players/result block is at the top
  of its column

## Defaults must show

The Opera Game: `Paul Morphy` vs `Duke Karl / Count Isouard`, `1-0`,
`Paris 1858`, `C41 Philidor Defense`, 17 moves, checkmate; five moments
with real slides; the material graph diving below zero as White gives up
the queen and rook and still mates.

## Acceptance rubric

1. The board is right: every featured position is the real position of the
   game at that ply (the test replays the Opera Game and checks the final
   FEN), pieces readable at 480x270, orientation honoured.
2. Pieces move: each moment shows a slide from the from-square to the
   to-square (verified on stills taken mid-slide), castling moves two pieces.
3. The caption names the move correctly (number, side, SAN) and its words
   are true of the move (a "sacrifice" is one by the rule above).
4. Frame 0 is the finished card (final position, result, full graph).
5. All text fits on all seven canvases; nothing clips; names of 30+
   characters fit.
6. Bad input fails loudly: an illegal or unparseable move names itself; an
   empty PGN says so.
7. The graph is honest: material or eval, labelled, the marker on the right
   ply.
8. Deterministic: two renders of the same props are identical.
9. The why-tutorial tells the fork's story truthfully (v1 by Haiku, v2 by
   Opus 5.5 under the founder's direction) and its timeline is this
   session's.
