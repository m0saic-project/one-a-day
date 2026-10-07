# Evidence - 2026-10-07 v2 (founder-directed follow-up)

No new scout: v2 is day 018's idea ([../10-scout.md](../10-scout.md), the
chess game recap from a PGN), built again at the founder's request. These are
the pages this session opened itself to build it right - the facts the
template depends on, checked rather than remembered.

## Opened

- https://news.ycombinator.com/item?id=49857528 - "Show HN: A Claude Code
  skill to analyze your chess games" (cited by the day's scout too). The
  author on why: reviewing a game with an explainer is "a much more pleasant
  and memorable experience than clicking around Stockfish branches"; a player
  in the thread: "there are plenty of analysis options already on lichess on
  chess.com" - analysis exists; a shareable telling of a game does not.
- https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/games/game-export-gameId.yaml
  - Lichess's game export (`GET /game/export/{gameId}`): `clocks` add
  `{ [%clk 1:01:27] }` after each move, `evals` add `{ [%eval 0.23] }` "when
  available", `opening` adds `[Opening "King's Gambit Accepted, King's Knight
  Gambit"]`, `literate` inserts textual annotations about mistakes. All on by
  default except `literate`. So the template reads `[%eval]` (graph and
  moments), skips `[%clk]`, takes `[Opening]` for the name, and uses a
  comment's first sentence as the caption when there is one.
- https://en.wikipedia.org/wiki/Opera_Game - the default game, checked move
  for move against the template's PGN (1. e4 e5 2. Nf3 d6 ... 16. Qb8+ Nxb8
  17. Rd8#); played October or November 1858 at the Salle Ventadour, Paris,
  Morphy against "Karl II, Duke of Brunswick and Comte Isouard de
  Vauvenargues" in consultation (databases shorten Black to "Duke Karl /
  Count Isouard", as the template does). Celebrated for development and the
  queen sacrifice on move 16 - the moment the automatic picker must find.

## Not opened (and why it does not matter)

- Chess.com's own PGN help: the headers the template uses from Chess.com
  exports (`ECOUrl`, `Termination` as a sentence, `TimeControl` in seconds)
  are handled defensively and covered by the test's sample; nothing depends
  on a field only Chess.com documents.
