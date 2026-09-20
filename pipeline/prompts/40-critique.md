Judge today's variants. You are the critic: you do NOT edit code. Read
`{{DAY_DIR}}/20-brief.md` (the rubric), `30-build.md`, and every
`{{DAY_DIR}}/variants/<x>/report.json`. Look at the stills in
`variants/<x>/stills/` if you can view images. If you cannot, judge from
`report.json` (exit codes, degraded flags, probe dims), the variant's
`src/<slug>.ts` and `src/<slug>.layout.m0` (the flattened layout — read the
rectangle counts and proportions), and `node tools/check-registry.mjs --json`.

Be adversarial. The default is "no ship". A template earns a ship.

## Score each variant, 0–2 on each line

1. Renders at defaults, every canvas, no error mosaic (exit 0 everywhere; a 3 anywhere is fatal)
2. The defaults SHOW the use case — a stranger sees what it is for
3. Text fits and reads at portrait and square, not only landscape
4. Layout is honest rectangles: proportions hold across aspects, nothing overlaps or collapses; the
   layout contract promises what the brief said (read `layoutContract()` in `src/<slug>.ts`: text fits,
   the bands the design depends on - not a ruler widened until it passes)
5. Props are the few that matter, typed, with sane defaults; a user could actually feed it
6. Would a person in the scouted community use this instead of what they do now?
7. Code quality against AGENTS.md: deterministic, `ctx.target`, bound text, fitted copy, ASCII
8. The brief was honest — the variant does what `20-brief.md` promised
9. The why-tutorial tells the truth — `stills/tutorial-2.png` (the problem)
   cites what `10-scout.md` found, in the evidence's words, with its sources;
   `stills/tutorial-3.png` (the solution) describes what THIS variant does,
   not what the brief hoped; `tutorial-5.png` is the template at its defaults;
   `tutorial-6.png` (how it was made) shows the phases that actually ran

Fatal regardless of score: a degraded render, a test that only passes because
it asserts nothing, a prop with no default, a pack or slug that misrepresents
what it is, a why-tutorial whose problem page names sources the scout never
opened or whose solution page claims a feature the variant does not have.

## Output — `{{DAY_DIR}}/40-critique.md`

```
# Critique — {{DATE}}

## Scores
| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
## What each variant gets right / wrong (three lines each, specific: which still, which prop)
## Decision: SHIP <letter> | NO SHIP
## If ship: what a human polish pass should look at first
## If no ship: the one thing that would have changed the verdict
```

Then set `state.json.decision` to `"ship"` or `"no-ship"`, `state.json.pick` to
the letter (or null), `noShipReason` when no-ship (one line), and finally
`critique: "done"`.
