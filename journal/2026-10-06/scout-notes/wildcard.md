# Scout notes: wildcard (2026-10-06)

## Candidate: Bell ringing "first peal / first quarter peal" card from a BellBoard record

- Construct: the BellBoard performance record (The Ringing World's site). Fields seen on a real record
  (https://bb.ringingworld.co.uk/view.php?id=1401162): place + county ("Cardington, Bedfordshire"),
  dedication ("St Mary"), date, duration ("in 3h 16"), tenor weight ("(20–0–26)"), changes + method
  ("5088 Plain Bob Major"), composer ("Composed by Charles W Clarke"), numbered ringer list
  1..N with "(C)" marking the conductor, free-text footnotes.
- Hand-made picture today: CCCBR publishes congratulatory certificates "For a First peal",
  "For a First peal as conductor", "For a First quarter peal", "(fewer details)" as PDF or docx,
  i.e. filled in by hand per ringer (https://archive.cccbr.org.uk/?p=4271).
- Milestone is culturally big: "Another major landmark is ringing one's first quarter peal ...
  published ... in The Ringing World, and also on-line" (allsaintswokinghambells.org.uk).
- Fit: fixed layout (header band: tower/dedication/date; centre: changes+method, time, tenor; ringer
  grid 6-12 rows with bell numbers; footnote band; optional highlight row for the honoree). ASCII
  apart from the en dash in tenor weight. Batchable (every first-QP in a guild newsletter).
- Served by: no image export seen on BellBoard view page; certificates are docx. Not exhaustively checked.
- Risks: BellBoard export endpoint (export.php?id=...) returned HTTP 500 for us, so field names in
  XML not verified; API access is queued ("We have a queue of people waiting to use this" - FAQ).
  Niche, UK-centric, older audience; physical painted peal boards are the prestige artifact.
  No direct "is there a tool" quote found.

## Rejected quickly
- Artisan coffee roasting: Artisan itself already produces roast reports/graphs (served).
- Others not checked for time.

## Failed URLs
- https://bb.ringingworld.co.uk/export.php?id=1401162 (500)
- https://bb.ringingworld.co.uk/help.php (404)
