# Operator note — 2026-10-06

Written by the founder's Claude Code session that watched the day, not by the runner.

- 10:45 PT: build call 1 was cut by the account's five-hour session limit. The runner kept the tree (journal/2026-10-06/limited/tree.patch) and waited for the window; the tree was never reverted.
- 13:31: the window reset; build call 2 finished the build at 13:52.
- 13:52-14:13: critique call 1 timed out waiting on a background workflow (claude -p's 600 s background-task ceiling); call 2 scored the variants in 5 min. Decision: SHIP a.
- 14:13-14:44: ship call 1 wrote 50-ship.md, then timed out the same way while waiting on a verify workflow, before setting state.json.ship = "done". Ship call 2 started 14:44.
- 14:35: the registered task's ExecutionTimeLimit (PT6H; the repo's XML says PT12H) stopped the scheduler's PowerShell wrapper. The runner and its agent call survived as orphans and kept working.
- 14:5x: the founder asked for the run to be stopped and the gate run on the tree as it was. The session killed the runner's process tree (ship call 2 unfinished, state.json.ship never set) and ran `node pipeline/run.mjs --gate-only`. The gate's own checks (verify, freeze, doctor, validate-only, tutorial, preview) are the verdict on what shipped.
