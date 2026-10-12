# Ship — 2026-10-12

## @one-a-day/sports/climbing-send-pyramid/v1 — Climbing Send Pyramid

A still card for outdoor climbers who already export a Mountain Project tick list and want the grade pyramid as a picture instead of a dashboard screenshot. Give 3 to 8 grades, hardest first, with clean sends and how many of those were a flash or an onsight. The card centers one bar per grade so width is the send count, paints the flash share as a cap on the left of that bar, and prints the total as the sum. It does not read a CSV and it does not sort grades.

## Render it

m0saic make @one-a-day/sports/climbing-send-pyramid/v1 --template-repo . -w 1080 -h 1080 -o pyramid.png

Props worth trying:
--props '{"discipline":"boulder","place":"","grades":[{"grade":"V8","sends":1,"flashes":0},{"grade":"V4","sends":3,"flashes":1},{"grade":"V2","sends":9,"flashes":4}]}'
--props '{"preset":"light","accent":"#c45c26","cap":"#1c1914"}'

Why it exists (the tutorial):
m0saic make @one-a-day/sports/climbing-send-pyramid/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4

## Weak spots (honest; a human polish pass starts here)

- The user still types the rows. The CSV is the artifact the scout found, and this card does not parse it.
- A 1-send bar is almost square, so the corner radius turns the peak into a dot.
- Portrait rows are evenly spaced and airy. A story canvas has more gap than pyramid.
- WHY.timeline is self-reported. No runner wrote trace.json.

## Follow-ups (what v2 would do)

- Accept a pasted tick block (`grade,sends,flashes` lines, or the Mountain Project CSV header) and tally it, instead of asking for the tally.
- A season filter: date on each tick, one card per year, so the pyramid is not the whole log.
