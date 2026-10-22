# Critique — 2026-10-22

Judged from every still (string by string), the three `report.json` (all exit 0,
`degraded: false`, probe dims correct, tutorial h264 55s), the variant sources
and diffs, the flattened `frc-event-recap.layout.m0`, `node
tools/check-registry.mjs --json` (ok: true, 37 rendered, 0 errors; the one
warning is day-old, on `social/episode-audiogram`), and a re-run of the
template's jest file (8/8 pass).

## Scores

| variant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | total | fatal? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a (dark, square hint) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18 | no |
| b (wide-first hint) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18 | no |
| c (light paper) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 17 | no |

## What each variant gets right / wrong

**a** — Right: the square still is the brief's "Defaults must show" verbatim —
TEAM 9128, RANK 1 / of 48 teams, 17-0-0 / W - L - T, both chips, the award
line with its tick, 78 DISTRICT POINTS beside DATA: THE BLUE ALLIANCE; every
string well-formed, no clipped text on any of the three aspects. Wrong: the
event line reads "Harbor City District  - Week 4" with ~3x a word space before
the dash on every canvas (square, portrait, landscape) — `weekRect.x` starts at
the *padded* `eventRect.w` (ceil(width*1.04)+4), so the fit-check slack becomes
visible space; the in-place file's hint note also differs from this snapshot by
one line (metadata only, but the ship phase should know which is final).
Landscape-left is airy between W - L - T and the footer, and portrait shares
its slack as very large band gaps — composed, not broken, but the first thing a
designer would nudge.

**b** — Right: exactly the claimed one-idea change — `outputHints` 1920x1080,
the WHY command and the hint-note follow; the three card stills are
byte-identical to a's, and tutorial-4 honestly shows `-w 1920 -h 1080`. Same
code, same tests, same gate. Wrong: nothing of its own beyond a's event-line
gap, but the scouted genre (the 1710 media-student Instagram ritual, the FRC
Rewind share card) is feed-first square, so wide-first is the weaker default
for the observed user — a posture difference, not a defect.

**c** — Right: exactly the claimed palette swap (PAGE #f4f5f0, INK #141b26,
DIM #5a6675); light paper renders clean on all three aspects and the blue
accent survives. Wrong: it contradicts the brief's own "Defaults must show" —
"one blue accent on a dark page" — and the recap-graphics genre the scout
evidenced is dark-mode social; the newsletter posture is a real use but not the
one the day was briefed to default to (line 8 docked). Same event-line gap as a.

## Decision: SHIP a

No fatals anywhere: no degraded render, the tests assert real behavior
(bindings, the 7-canvas contract sweep under stressed and emptied props, named
refusals including the misspelled-prop did-you-mean), every prop has a default,
pack/slug honest, and the tutorial tells the truth — page 2 quotes the 1710
build thread, the TBA team-9128 page and the FRC Rewind reply in the evidence's
own words with the three URLs the scout actually opened, page 3 describes this
card (enum chips, shrink-never-ellipsize awards, the points-zeroing weak spot),
page 5 is the template at defaults, and page 6's numbers (2 phases, 42 calls,
1.8M tok, $1.73) add up against the trace as of build time.

Pick **a** over b because the observed workflow is the Instagram/feed recap
graphic — square-first is the genre's native canvas, and the landscape reflow
still covers the Chief Delphi / X post. a over c because the brief's defaults
and the community's genre are both dark.

## What a human polish pass should look at first

1. The event-line join: place the week cell against the measured event width,
   not the padded fit-check box, so "Harbor City District - Week 4" reads as
   one line instead of "District  - Week 4" (visible on every canvas, every
   variant).
2. Ship phase: regenerate `WHY.timeline` from the full `trace.json`
   (`node pipeline/lib/trace.mjs --timeline`) so tutorial-6 shows all the
   phases that ran, not just scout+plan — then rebuild so the frozen tutorial
   matches the trace the gate checks.
3. Slack distribution: cap the band gaps in portrait and pull the landscape
   left column's hero stack down a touch more; both are airy, neither is
   broken.
4. Cosmetic: the in-place hint note ("A square still for the recap post.")
   differs from variant a's snapshot ("... (the Instagram feed).") — keep
   whichever is intended, they differ by one parenthetical.
