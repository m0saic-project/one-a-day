# Critique — 2026-10-13

Variant a (the only variant rendered), judged against the brief's rubric,
from the stills in `variants/a/stills/` (landscape, portrait, square,
tutorial-1..6) and `report.json` (all renders exit 0, `degraded: false`).

| # | Rubric line | Score | Why |
|---|---|---|---|
| 1 | Reads as a recognised ops log | 8/10 | PIREP columns with a head rule and dated rows; the caption is literally the phpVMS panel's words ("FLIGHT OPERATIONS LOG"). Not verbatim - phpVMS also shows "VERIFIED" status, which the card drops. |
| 2 | Every total computed, cannot contradict the list | 9/10 | The test recomputes count/hours/longest/avg/milestone independently and pins the defaults ("30.7", "-263", "445.7", "54.3"). No prop takes a total. |
| 3 | Milestone bar matches career + month | 9/10 | Fill = (careerTotal-400)/100 checked to 1e-10; landing exactly on 500.0 resets to the 600 frame with fill 0 - tested. The "54.3 h to 500 h" line agrees with the bar by construction. |
| 4 | Seven canvases pass the sweep; bad rows refused by name | 8/10 | check-layout and the test's sweep pass; refusal messages name `rows[i]` and the field. First-principles check from the stills found and fixed a real collision (caption over row 10) that no gate caught - it would have shipped a week ago. |
| 5 | Deterministic | 9/10 | Test renders twice and deep-equals; no clock, no random, `--` placeholders fixed. |
| 6 | WHY tells the truth about the day | 8/10 | Sources are the pages actually opened (forum thread quoted correctly, the VA profile rows match, the FB quote verbatim); the reddit excerpt is honestly flagged in the scout as search-read. Timeline is self-reported and says so on the last page. The "5000 hours" quote is trimmed ("Just reaching 5000 hours") - the full line is "...on Vatsim". Fine. |
| 7 | Portrait/square are the same card | 8/10 | Same stack, one type scale per canvas; the portrait row pitch is airy (54px tiles in 115px slots), but it reads as a spread ledger, not a redesign. |

Weak spots on the record: ten-row ceiling; no distance column; the ops log
drops the "VERIFIED"/status field the source table has.

## Verdict

SHIP a. Nothing typed twice is visible in the picture, and the month,
tiles, rows and bar all reconcile by eye.
