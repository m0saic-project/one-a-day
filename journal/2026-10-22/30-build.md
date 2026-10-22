# Build — 2026-10-22

## Template: @one-a-day/sports/frc-event-recap/v1

One new folder: `src/sports/frc-event-recap/v1/` (+ registry row). 13 props +
debugLayout, exactly the brief's table; derived helpers exported and unit
tested (`allianceChipText`, `playoffChipText`, `recordText`, `rankSub`,
`normalizeFrcEventRecap`). Dark page `#0d131c`, one `#2f7bff` accent (header
rule, chip outlines, award ticks), TBA credit always in the footer.

## Variant a — dark social card, square-first (the brief's baseline) · gate: clean · render: ok (exit 0 x3 + tutorial) · stills:

- square 1080x1080: five bands as the brief's art - "FRC EVENT RECAP" + accent
  rule, TEAM 9128 hero, "Harbor City District - Week 4", RANK 1 / of 48 teams
  beside 17-0-0 / W - L - T, both outlined chips (CAPTAIN - ALLIANCE 1, EVENT
  WINNER), AWARDS + tick + Innovation in Control Award, 78 DISTRICT POINTS and
  DATA: THE BLUE ALLIANCE in the footer. Every claim in the header comment and
  WHY.solution is visible; nothing clipped.
- landscape 1920x1080: header+hero stacked left, chips top-right, awards
  pinned into the lower half (the contract's yFrac [0.45, 0.9]), footer
  full-width. Airy but composed.
- portrait 1080x1920: the square stack with the slack shared out as equal
  gaps; calm, nothing lost.
- tutorial pages 1-6 all render; page 5 is the template at 1280x720.

## Variant b — wide-first: hint 1920x1080, WHY command and the test's hint assertion follow · gate: clean · render: ok · stills:

Same card, same reflow; only the default canvas changes (the Chief Delphi / X
header posture). The landscape still is identical in composition to a's
landscape - the change is which canvas a host opens first.

## Variant c — light paper: PAGE #f4f5f0, INK #141b26, DIM #5a6675, square hint restored · gate: clean · render: ok · stills:

The newsletter/team-website posture: dark ink on paper, the blue accent still
reads, chips stay outlined. Clean on all three aspects; but the brief's
"Defaults must show" asks for "one blue accent on a dark page", and the recap
graphics genre the scout found is dark-mode social.

## Why-tutorial

- Problem page: who (FRC media students/mentors), the three observations in
  the evidence's own words (the 1710 build-thread recap ritual, the TBA "Rank
  1 ... 17-0-0 ... Captain of Alliance 1" page, the FRC Rewind "Spotify
  Wrapped" reply) and the three sources actually opened.
- Solution page: one deterministic card per event with props mirroring the TBA
  fields; the design decision (derive what's derivable, constrain the rest to
  TBA's vocabulary - enum chips always fit, awards shrink never ellipsize);
  weak spots honestly (no photos/logos; regionals zero the points out).

## What was hard

- The gate rejects rect bindings on closed-picker enum props (bindingsSound):
  the chip texts had to lose their bindProp - Make edits enums from the panel.
  And bindingsCover then demanded weekLabel's own source: the event line is
  two adjacent text cells ("Harbor City District" + " - Week 4") sharing one
  fitted px, each bound to its prop.
- Tightening that adjacency so it does not read as a double space taught the
  contract's arithmetic: textFitsMeasured hands the checker measured*1.02, and
  placeInsetPieces' realized box shaves a pixel or two - an authored box of
  ceil(width)+2 fails by ~4px. ceil(width*1.04)+4 is the tight fit that holds
  on all seven canvases.
- fingerprints:update reads dist/, not src/ - after changing outputHints you
  must build, THEN mint, then build again (a stale-dist mint reports "0
  written" and the next build fails the fingerprint).

## In place now: a
