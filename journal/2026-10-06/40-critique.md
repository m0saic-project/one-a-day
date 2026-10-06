# Critique — 2026-10-06

This is critique call 2. Call 1 timed out while its audit workflow was still
running, and nothing it found was saved. Its scratch is in
[`critique-scratch/`](critique-scratch/). This call:

- read every still of a, the six stress sets in
  [`variants/a/extra/`](variants/a/extra/), and the square, landscape and
  solution pages of b and c;
- checked the tutorial quotes against [`10-scout.md`](10-scout.md);
- ran `node tools/check-registry.mjs --json`: ok, 19 rendered, no error, and
  the only warning is the frozen `social/episode-audiogram`;
- ran the template's jest file: 14/14 pass;
- diffed `src/` against `variants/a/src/`: identical;
- had one read-only auditor check a's code. It looked at the defaults, the
  weekday and leap-year rules, number format, every refusal,
  `layoutContract()`, test strength and ASCII.

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 2 | 2 | 2 | 1 | 2 | 1 | 2 | 2 | 1 | 15 | no |
| b | 2 | 1 | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 11 | no |
| c | 2 | 2 | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 12 | no |

## What each variant gets right / wrong (three lines each, specific: which still, which prop)

**a: two headline tiles, light paper (in place)**

- **Right.** `stills/square.png` shows everything under "Defaults must show",
  string by string:
  - the header `WILLOWMERE PARK 5K` and `#312 | SAT 03 OCT 2026` (2026-10-03
    is a Saturday);
  - `214 finishers` and `31 volunteers` in green at about 1.6x the stat
    numbers;
  - `38 new PBs`, `27 first timers`, `19 visitors`, and `4 first-time` /
    `volunteers` on two lines;
  - `MILESTONE CLUBS` with 25 `4 runners`, 50 `3 runners`, 100 `1 runner`,
    and a grey 25 `2 volunteers`;
  - the footer.

  The stress renders all read correctly:
  - `extra/long-1920x1080.png` shows `1,204` and `#1043`;
  - `extra/maxed-1080x1080.png` shows `9,999` with no clipping;
  - in `extra/ten-1080x1920.png`, ten clubs make 5 + 5 with the right
    singular and plural (`1 runner`, `1 volunteer`);
  - `extra/empty-1080x1080.png` keeps the band and shows `No milestone clubs
    this week`.

  The auditor found every refusal the brief lists, each naming the field and
  value. On top of those it refuses negatives, 3.5, 10000, `0xR25`, a bare
  `R25` and misspelled props. The weekday uses Sakamoto's method; 1900-02-29
  is refused and 2000-02-29 is accepted. No test is empty.
- **Wrong, layout (line 4).**
  - On the default square (`stills/square.png`) the four stat tiles sit 3-7
    px inside the hero and band edges. The right edge is at x=1030 against
    1037. The gaps between them are 28-32 px, against 25 between the hero
    tiles. This is the lattice snap, and the build admits it.
  - Six clubs at 1920x1080 (`extra/long-1920x1080.png`) are drawn as 144x81
    badges in two rows: 134 px apart side to side, 22 px top to bottom, in a
    band that is mostly empty. The `MILESTONE CLUBS` title (about 37 px) is
    bigger than the club numbers. One row of six would fit at about 200 px
    wide.
  - In `stills/landscape.png` the hero labels sit lower than the stat labels
    in the same row: `finishers` at y≈404, `new PBs` at y≈380.
- **Wrong, smaller.**
  - The accent's 4.5:1 check is made against the tile `#fbfbfb`, not the page
    as the brief says (L320).
  - `milestones ",,,"` silently gives the empty week, and `4xR025` and
    `001xR25` are read without complaint.
  - The contract cannot say "exactly 2 hero / 4 stat tiles", and tile labels
    have no presence entry of their own. The test covers the count only
    through text sizes.
  - `stills/tutorial-6.png` reads "3 phases - 22m 54s - $18": scout, plan and
    plan (2). It leaves out build call 1 (95 min, $28.58, timed out), which had
    already run when this tutorial was rendered at 20:49Z. Day 016's page also
    stops before build, so this is the tutorial tool's doing, not a's code.
    Still, the page undercounts the day.

**b: six equal tiles**

- **Right.** `stills/square.png` is a tidy 3x2 board in the runstats order,
  with one number size and every string right. `stills/tutorial-3.png`
  describes six equal tiles honestly.
- **Wrong, design.** The hierarchy is gone. In `stills/landscape.png` and the
  square, `31 volunteers` sits mid-grid in row two at the same size as
  `19 visitors`. Brief rubric 1 ("214 ran, 31 volunteered" in two seconds,
  headline at least 1.5x the stats) fails by construction.
- **Wrong, code.** b was built before the review fixes:
  - It has no unknown-prop refusal (no "did you mean" in its source), so
    `count` for `counts` prints the sample week under a real event name.
  - Club counts are not checked against finishers or volunteers.
  - Six clubs draw one row on wide canvases, against the brief's 5-per-row.
  - Six to ten clubs are refused on 1000x800, 1200x900, 1290x1000 and
    1440x900.
  - A `counts` JSON string is not parsed.
  - The footer has a 70-character cap the brief never set.

**c: a on a night page**

- **Right.** `stills/square.png` reads well. The light-green badges carry dark
  text, the grey volunteer badge white text, and the accent `#3fae74` keeps
  the hero numbers legible.
- **Wrong, design.** Tiles are only 1.19:1 against the `#14211a` page, so the
  tile edges nearly vanish and the board reads as one dark slab. It does not
  print, which drops a reason the brief gave for the page ("It prints").
- **Wrong, code.** c has the same pre-fix holes as b: the silent misspelled
  prop, unchecked club counts, rows of 6, mid-size refusals and no JSON-string
  counts. By its own `stills/tutorial-3.png`, ten clubs are refused at 640x360
  and 480x270. a takes ten clubs at 640x360.

## Decision: SHIP a

a is the only variant built after the review fixes, and it shows the brief's
promised defaults at every aspect. It renders exit 0 with no warning on 3
canvases plus 16 stress renders. Its tests pin real behaviour, and its WHY
pages are true to the scout and to the code. Its defects are alignment and
spacing polish, not wrong numbers or wrong claims. b answered its question,
and the answer is no: the hierarchy earns its space. c is a palette that
cannot print, with the old bugs.

## If ship: what a human polish pass should look at first

1. **Square stat-row alignment.** On the hinted 1080x1080, make the stat tiles
   flush with the hero row and the band, with equal gaps. This is the
   Facebook card, and the 7 px step on the right edge is the first thing a
   designer sees.
2. **Six or more clubs on wide canvases** (`extra/long-1920x1080.png`). Use
   one row of six at the four-club size, or pack the two rows tightly. Keep
   the band title smaller than the club numbers.
3. **Landscape label baselines.** Line up `finishers` / `volunteers` with the
   stat labels in the same row.
4. **Small input holes.** Refuse `",,,"` and zero-padded clubs, and check the
   accent against the page as the brief worded it.
5. **`tutorial-6.png`.** It omits the timed-out build call, which is a tool
   question for a maintain day.
6. **`counts` as JSON.** It is still friction for a volunteer on a Saturday,
   and the solution page says so.

## If no ship: the one thing that would have changed the verdict

n/a
