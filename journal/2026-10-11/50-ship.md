# Ship — 2026-10-11

## @one-a-day/personal/reading-goal-recap/v1 — Reading Goal Recap

The monthly reading wrap-up as one deterministic card, for book bloggers and
the 52book reading-challenge crowd who compute the same numbers by hand every
month. Give the month's books, pages and average rating, the year's goal, the
books so far and the day of the year; the card draws three stat tiles, the
goal bar with the pace tick (pace = goal x day-of-year / 365), the ahead/behind
delta line, and the month's shelf of titles with ratings. First template in
the `personal` pack.

## Render it

m0saic make @one-a-day/personal/reading-goal-recap/v1 --template-repo . -w 1920 -h 1080 -o recap.png

Props worth trying:
--props '{"goalTotal":125,"booksSoFar":88,"dayOfYear":304}'   (Kami's line: "16 behind pace")
--props '{"booksSoFar":159,"goalTotal":100}'                  (past the goal: the bar clamps, the delta tells)
--props '{"titles":[{"title":"Babel","rating":4.5},{"title":"Nettle & Bone","rating":5}],"preset":"light"}'

Why it exists (the tutorial):
m0saic make @one-a-day/personal/reading-goal-recap/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4

## Weak spots (honest; a human polish pass starts here)

- The shelf ratings column prints bare ("5", "4.5"); a stranger can read it
  as counts until the avg-rating tile gives context. "4.5/5" or a column
  header would kill the ambiguity (the critic named this too).
- Portrait gaps are even but generous on very tall canvases; a larger shelf
  row cap there would fill them with content instead of air.
- No covers and no genre table - the Goodreads export carries neither, so the
  card is text and bars only.

## Follow-ups (what v2 would do)

- A year-in-review variant: twelve month-ticks on the bar instead of one pace
  tick, from the same props plus a per-month count list.
- Optional half-star drawing for the shelf ratings (a five-pip row per title)
  once the ratings column has its header.
