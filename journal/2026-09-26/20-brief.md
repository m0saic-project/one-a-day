# Brief — 2026-09-26

## The use case (two sentences, from the scout)
Speedrunners share every PB, and what their timer gives them to share is a
screenshot of its window; the site that turned splits into something to look
at (splits.io) closed on 2025-03-31. This template turns the run's splits
(the numbers LiveSplit already saved) into a short clip that tells the run:
which segments gained, which were gold, the final time and the time saved.

## The template
- id: `@one-a-day/gaming/speedrun-pb-recap/v1`. New pack `gaming`:
  speedrunning is a game community, nothing in the vocabulary names games,
  and the niche-community direction will keep bringing them (splits, scores,
  lap telemetry).
- title: Speedrun PB Recap
- kind: video; canvas hint 1080x1920 (the reel/short where teasers live);
  1920x1080 and 1080x1080 must hold too.
- duration: `clipSec` (default 20 s, 8..60) from props; an explicit
  `--durationMs` pin becomes the clip. `ctx.target` is the canvas.

## Layout (regions, ratios)
```
portrait / square                  landscape
+---------------------------+      +----------------------------------+
| GAME             [NEW PB] |      | GAME                    [NEW PB] |
| category - attempt #1,284 |      | category - attempt #1,284  @run  |
| @runner                   |      +--------------+-------------------+
+---------------------------+      | DELTA VS PB  | name  delta  time |
| name        delta    time |      | graph panel  | ...  (N rows)     |
| ...  (N rows, 4..16)      |      |              |                   |
+---------------------------+      +--------------+-------------------+
| DELTA VS PB  graph band   |      | 21:11.27     PB by 12.34s - SoB  |
+---------------------------+      +----------------------------------+
| 21:11.27  (the clock)     |
| PB by 12.34s - SoB ...    |
+---------------------------+
```
Header ~14% of the height; the table takes what the header, graph and
footer leave; the graph band ~12% (portrait/square) or ~40% of the width
(landscape); the footer ~18%.

Mechanism (what keeps it cheap): names are static svg text. Everything that
changes over time is drawtext: ONE video-mode text source for the times and
one for the deltas, one layer per row per state, each gated by its own
`overlay.enable` (the official lyric-video template's mechanism, <= 60 layers
a source), plus one for the clock. Row stripes, the current-row highlight and
the graph bars are plain colour tiles in two mask-free CHILD documents
(day 4's and day 6's mechanism), both canvases 5-smooth.

## Layout contract
- every text fits its box: game, category line, runner, stamp, each row
  name, the summary; the drawtext times, deltas and clock measured at their
  widest string, widened 15% for the system font.
- the header lives in the top 30% (`within yFrac [0, 0.3]`); the clock and
  the summary in the bottom 35%; the table and the graph are present.
- no pinned fractions beyond that: the use case does not ask for them.

## Props (name - type - default - what it changes)
- `game` - string - "Mothlight Keep" - the header (GameName). Empty removes.
- `category` - string - "Any% Glitchless" - the second line (CategoryName).
- `attempts` - number - 1284 - "attempt #1,284" (AttemptCount); 0 hides it.
- `runner` - string - "@quillruns" - the handle; empty removes.
- `segments` - json - 10 rows - `[{ name, split, pb, best }]`: this run's
  cumulative split, the comparison's (old PB) cumulative split, the best
  segment time (gold). Times as "1:23.45", "1:02:03.4", "83.45", seconds, or
  LiveSplit's "00:01:23.4560000". 2..16 rows; `pb`/`best` optional per row;
  an empty `split` is a skipped split.
- `lss` - code (xml) - "" - paste a LiveSplit `.lss`. When non-empty it wins
  over game/category/attempts/segments: the run is the file's Personal Best,
  the comparison is the previous PB rebuilt from its attempt and segment
  history, the golds are its BestSegmentTime.
- `timing` - "real" | "game" - "real" - which clock the `.lss` is read with.
- `clipSec` - number 8..60 - 20 - the clip length.
- `accent` - #rrggbb - "#4fa3ff" - stamp, highlight, clock.
- `preset` - "dark" | "light" - "dark".
- `debugLayout` - boolean - false.
Delta colours are LiveSplit's own rule, not props: ahead-gaining,
ahead-losing, behind-gaining, behind-losing, gold.

## Beats (clipSec 20)
- t = 0 .. 2.5 s: the finished recap (cold open): every split, every delta,
  the full graph, the clock on the final time, the NEW PB stamp and the
  summary. Frame 0 is the browse still and the social thumbnail.
- t = 2.5 s: the run restarts: clock at 0:00.00, rows show the old PB split
  dim (LiveSplit's pending look), no deltas, graph empty, stamp and summary
  hidden.
- 2.5 .. 15 s: the clock counts the run's own time, fast-forwarded; split i
  lands at 2.5 + 12.5 x split_i / final: its time turns to ink, its delta
  appears in its colour, its graph bar appears, the highlight moves on.
- 15 s: the last split lands; clock holds the final time; stamp and summary
  return. 15 .. 20 s: hold. The last frame equals the first: the clip loops.

## Defaults must show
A believable 21-minute run of a fictional game: 10 named segments with four
golds, two red splits, one behind-but-gaining, three ahead; PB by 12.34 s;
sum of best 20:54.18. A stranger sees a speedrun splits table and a new PB.

## Acceptance rubric (the critic scores against this)
1. Renders at defaults at 1080x1920, 1920x1080 and 1080x1080, exit 0, no
   error mosaic; the clip is 20 s and frame 0 is the finished recap.
2. The deltas follow LiveSplit's colour rule exactly (gold overrides; ahead
   or behind by cumulative delta; gaining or losing by segment) and read at
   portrait and square.
3. The replay is honest: split i lands at its share of the run, the clock
   shows the run's own time and holds the exact final time.
4. `lss` really reads a LiveSplit file: game, category, attempt count,
   segment names, PB splits, golds, and the previous PB rebuilt from the
   attempt history (a unit test with a real-shaped fixture).
5. Nothing clips or collides from 4 to 16 rows, with long names, and with
   an hour-plus run (H:MM:SS formats).

## Variants worth trying (up to 3, each ONE idea different)
- a: the graph is the cumulative delta at each split (LiveSplit's Graph
  component: the story of being ahead or behind).
- b: the graph is each segment's time saved or lost against the old PB
  (where the time came from), gold segments capped.
