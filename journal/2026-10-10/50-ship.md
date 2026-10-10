# Ship — 2026-10-10

## @one-a-day/sports/golf-round-scorecard/v1 — Golf Round Scorecard

One card per golf round, from the numbers every golfer already writes on the
paper scorecard: 9 or 18 pars and the same count of scores go in, and the
render returns two nine-hole strips of hole / par / score rows with OUT and
IN columns, the totals band (OUT 42 (+6) - IN 47 (+11) - the round total in
the accent with its to-par), and the paper card's own notation drawn as
masked marks around each score - a ring one under par, a square one over,
doubles for two or more, a filled ring for an ace. For the golfers who post
their rounds and today photograph the crumpled card or screenshot an app.

## Render it

```
m0saic make @one-a-day/sports/golf-round-scorecard/v1 --template-repo . -w 1920 -h 1080 -o golf.png
```

Props worth trying:

```
m0saic make @one-a-day/sports/golf-round-scorecard/v1 --template-repo . -o golf.png --props '{"pars":[4,4,5,3,4,5,4,4,3],"scores":[5,4,6,3,5,6,3,6,4]}'
```

(a 9-hole round renders one strip), and `--props '{"preset":"light"}'` for
the paper card, `--props '{"accent":"#e5534b"}'` to recolour the total, an
under-par line and the ace mark.

Why it exists (the tutorial):

```
m0saic make @one-a-day/sports/golf-round-scorecard/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## Weak spots (honest; a human polish pass starts here)

- The totals band's full-width presence is real in the geometry but undeclared
  in the layout contract (the critique's line-4 deduction); declare it or
  accept it as text.
- Nobody has actually looked at the pixels: this run's model has no image
  input, so the audit was per-source, not visual. The ring stroke at 640x360
  (1 px at the smallest mark), the ace's digit over the accent fill, and the
  light preset's strip-frame contrast are the first things eyes should check.
- Scores are integers 1-99: no picked-up holes (X/NR), no putts, no FIR/GIR,
  no net or handicap math - gross score rows only, as the caveats say.

## Follow-ups (what v2 would do)

- Putts per hole as an optional fourth row (the paper card has the box; the
  prop would be `putts?: number[]`), and a Stableford mode that scores the
  same numbers the other way.
- GHIN-style posting: a `courseHandicap` number that nets the card and adds
  the playing-adjustment line golfers post.
- Batch mode is the real prize and needs no template change: a folder of
  rounds rendered in one CLI loop - the founder's build-out, not the demo's.
