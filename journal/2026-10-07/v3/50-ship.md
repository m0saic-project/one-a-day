# Ship - 2026-10-07 v3

**Shipped: `@one-a-day/sports/chess-game-recap/v3`** - v2 rebuilt cell by
cell with a platform knob, at the founder's request. v2 (and v1) stay frozen
and loadable, deprecated in favour of v3 (`src/sports/index.ts`).

## What ships

Variant **a** - the independent critic's pick (13/14, no fatal defect;
40-critique.md: all five featured positions verified square by square on 18
frames, slides land, no piece left behind or doubled). Then, before the
commit: this session's timeline pasted into WHY (tutorial page 6 only), and
the v3 layout fingerprint written (the critic's one should-fix). No pixel of
the clip moved.

- `platform`: `desktop` 1920x1080 (default), `square` 1080x1080, `mobile`
  1080x1920 - the canvas follows in hosts that follow the template's size;
  an explicit size wins.
- 64 square cells (`sq-a1`..`sq-h8`), exact on all seven canvases; every
  piece its own rect (`e4-wp`), one layer per piece per square over the
  stretches it stands there; lit squares (`lit-d8`); the slider rects
  (`slide-3-0`); the graph as bar rects and marker rects.
- `white`, `black`, `event` override the PGN on the canvas and are bound
  to their rects - edit a name in place in Make.
- Render cost: 70 s against v2's 74 s at 1920x1080 on this machine (30-build.md).

## Render it

```
m0saic make @one-a-day/sports/chess-game-recap/v3 --template-repo . -o opera.mp4
m0saic make @one-a-day/sports/chess-game-recap/v3 --template-repo . --props @game.json -o recap.mp4
```

`game.json`: `{ "pgn": "<a Lichess or Chess.com PGN>", "platform": "mobile" }`;
`"white": "..."` to fix a username on the canvas; `"moments": "12 18b 24"`;
`"orientation": "black"`; `"board": "green"`.

## Weak spots (the critic's polish list, not done)

- A captured piece shows under the slider for the last frames of a capture
  slide (it leaves when the piece lands - as in v2).
- Moments change with a cut, square by square; v2 cross-faded whole boards.
- The graph is bars now (v2: an area chart with a dot per moment); bars are
  thin on the smallest canvases, and the final marker sits on the last bar.
- From v2: the square canvas's empty caption column, plain captions, no
  engine, the frozen tutorial footer's `journal/<date>/` path.

## The record

`20-brief.md` the ask; `10-scout.md` points at v2's evidence; `30-build.md`
how the board is built, what bit, the cost table; `40-critique.md`;
`variants/a`; `run.json`; `trace.json` + `60-token-costs.md`; `logs/`.
Committed with `npm run submit` (a maintain commit).
