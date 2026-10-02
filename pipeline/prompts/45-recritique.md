---

# This is a second look — revision round {{REVISION}}

An earlier critique today said NO SHIP: `{{DAY_DIR}}/{{REJECTED}}` (earlier
rounds, if there were any, are beside it as `40-critique.r<n>.md`). The build
phase was called again to answer it. `{{DAY_DIR}}/30-build.md` says what it
changed under "Revision {{REVISION}}", and the revised variant is the last
letter in `state.json.variants` (it is also `inPlace`).

- Judge the revised variant from ITS OWN stills, report and source — all nine
  lines, fresh. Variants an earlier round already scored keep their row in
  the table with the old numbers and "(round <n>)" in the last column; do not
  score them again.
- Check each thing the earlier verdict named against the new stills. A fix
  that `30-build.md` claims and the stills do not show is fatal, like any
  other false claim.
- Then look for what the earlier verdict missed. The first verdict is not a
  checklist the builder completed: a revision that fixes the named defect and
  carries another one is still a no-ship.
- The bar does not move: not lower because the day has been long, not higher
  because the template was rejected once.

Write `{{DAY_DIR}}/40-critique.md` anew, in the shape above, with one more
line directly under the decision:

```
## Revision {{REVISION}}: what the earlier verdict asked for, and whether it is there
```

Then `state.json` exactly as above: `decision`, `pick`, `noShipReason` when
no-ship, and finally `critique: "done"`.
