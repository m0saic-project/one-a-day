# Ship - 2026-10-07 v2

**Shipped: `@one-a-day/sports/chess-game-recap/v2`** - the founder-directed
follow-up of day 018's v1. v1 stays frozen and loadable, deprecated in
favour of this (`src/sports/index.ts`).

## What ships

Variant **c**: the critic's pick **b** (16/18, no fatal defect - see
40-critique.md) plus answers to its two should-fix defects, re-rendered and
looked at before the commit:

1. The tutorial's last page now carries this session's real timeline (it was
   a stub, rubric 9 = 0): five phases from `trace.json` in this folder,
   measured from the transcript by `logs/session-trace.mjs`, critic priced at
   Sonnet rates.
2. Captions now CUT on a moment's first frame, in step with the graph marker
   (they faded in while the marker had already moved). The board keeps its
   0.3 s cross-fade into each "before" position - that is the one transition
   the eye should see.

Plus the critic's polish item 3, cheaply: the graph label says which side is
up ("MATERIAL - WHITE ABOVE THE LINE").

The board/caption/graph geometry, the moments, the slides and the chess are
b's, unchanged.

After c was rendered, the first `npm run submit` stopped on `m0saic doctor`
(0.3.2) `bindingsDeclared`: `pgn`, `moments` and `momentSec` are bound to no
rect. That is on purpose (every word on the page is derived from the PGN; an
in-place edit of a name would overwrite the game), so the template now SAYS
so in `bindings.unbound` with the reasons. Declaration only - no pixel moved;
`variants/c/src` predates it by those lines.

## Render it

```
m0saic make @one-a-day/sports/chess-game-recap/v2 --template-repo . -w 1920 -h 1080 -o opera.mp4
m0saic make @one-a-day/sports/chess-game-recap/v2 --template-repo . -w 1080 -h 1920 --props @game.json -o recap.mp4
```

`game.json`: `{ "pgn": "<a Lichess or Chess.com PGN>" }` - and worth trying:

- `"moments": "12 18b 24"` to choose the moves (Black's with `b` or `...`);
  the final move is always last.
- `"orientation": "black"` for your own games as Black; `"board": "green"`
  or `"slate"`.
- A Lichess export WITH analysis (`evals` is on by default when the game was
  analysed): the graph becomes the evaluation and big swings become moments.
- `--durationMs 30000` re-spaces the same moments over 30 s.

## Weak spots (the critic's polish list, not done)

- The square canvas leaves an empty block in the caption column between the
  caption and the opening line.
- The material graph is a near-flat line for most of a quiet game (honest,
  but small): the Opera Game is level until move 16.
- Dark pieces on dark squares are a little low in contrast at small sizes.
- Captions are true but plain ("takes a rook with check").
- No engine: a quiet blunder in an unanalysed game is not found. One game per
  paste, no Chess960.
- The tutorial's frozen shared helper prints `journal/2026-10-07/` as the
  footer and "numbers from the runner's trace (journal/<date>/trace.json)" on
  the last page; this record and its trace are in `v2/` inside that folder,
  and the numbers were measured from the session transcript, not a runner.

## The record

- `20-brief.md` the founder's three calls and the rubric; `10-scout.md` the
  pages opened to build it (the idea's evidence is the day's
  `../10-scout.md`); `30-build.md` what was built and what bit;
  `40-critique.md` the independent critique; `variants/a|b|c` source copies,
  stills, report.json (clips are gitignored); `run.json` who made it and why;
  `trace.json` + `60-token-costs.md` the cost; `logs/` the phase marks and the
  scripts that measured it.
- Committed with `npm run submit` (a maintain commit: the day's gate already
  ran this morning for v1) together with the record machinery:
  `tools/record-dir.mjs`, `tools/check-why.mjs`, `tools/gen-gallery.mjs`
  (credit a vN from `journal/<date>/vN/`), the manifest generator (several
  versions per slug), README (the follow-up convention).
