# Brief — 2026-10-22

## The use case

FRC media students write a recap post after every event their team plays (2-8
per season plus the October-December offseason circuit running right now), and
the numbers they quote - qual rank, W-L-T record, alliance selection, playoff
finish, awards, district points - all live on the team's The Blue Alliance
event page ("Team 9128 was Rank 1 with a record of 17-0-0 ... Captain of
Alliance 1 and won the event"). The community's reaction to the season-level
FRC Rewind web app ("Now I have something other than Spotify Wrapped!")
shows the appetite for a rendered card; this template is the per-event,
batchable, self-hosted version of that idea.

## The template

- id: `@one-a-day/sports/frc-event-recap/v1` — pack `sports`, no new pack:
  FRC is a team competition with quals, playoffs and records, and the pack
  already holds the chess, cubing, sim-racing and powerlifting recap cards.
- title: `FRC Event Recap` (the scaffold prefixes `2026-10-22 · `, tags
  `day-033`).
- kind: image (still PNG); canvas hint `1080x1080` (the Instagram feed the
  recap graphics are made for); must also render cleanly at landscape
  (`1920x1080`, the Chief Delphi / X post) and portrait (`1080x1920`, the
  story) - and pass the build's 7-canvas layout sweep (1920x1080 · 1280x720
  · 1080x1920 · 1080x1080 · 3840x2160 · 640x360 · 480x270).
- duration: still (no clock; `outputHints.format { kind: "image",
  container: "png" }`).

## Layout (regions, ratios — no pixels)

Square/portrait stack five bands; landscape splits header+hero left and
chips+awards right, footer full-width below.

```
+------------------------------------------+
| FRC EVENT RECAP        [accent rule]     | header ~24%: the label,
| TEAM 9128                                | the team number as the hero
| Harbor City District - Week 4            | line, event + week line,
| (IRON PANTHERS when teamName set)        | optional team name in caps
+------------------------------------------+
|  RANK 1          |   17-0-0              | hero ~26%: qual rank with
|  of 48 teams     |   W - L - T           | "of N teams", the record
+------------------------------------------+
| [CAPTAIN - ALLIANCE 1]  [EVENT WINNER]   | chips ~14%: alliance
|                                          | selection + playoff finish
+------------------------------------------+
| AWARDS                                   | awards ~24%: 0-3 lines,
|  + Innovation in Control Award           | accent tick each; an empty
|  + (a second award)                      | list returns the space
+------------------------------------------+
| 78 DISTRICT POINTS   DATA: THE BLUE ALL. | footer ~8%: points left
|                                          | (0 hides), TBA credit right
+------------------------------------------+
```

The one design decision: **the card derives what it can and constrains the
rest to The Blue Alliance's own vocabulary.** Rank, team count, record and
district points are numbers; the alliance and playoff chips come from enums
("captain" / "1st pick" / "2nd pick", alliance 1-8; winner / finalist /
semifinalist / quarterfinalist) so their text always fits. Awards are the
one free text on the card - the scout's flagged risk, since TBA award names
run long - so they are capped at three lines and shrink to fit above the
readability floor, never ellipsized at it.

## Layout contract (the invariants the build sweeps at 7 canvases)

- Every text fits its box — `textFitsMeasured` on each text source (header
  lines, both hero numbers, both chip texts, each award line, both footer
  texts).
- The team number is the top-of-card identity: `team-number` within
  `yFrac [0, 0.3]`.
- The footer band is at the bottom: `footer-points` and `footer-credit`
  within `yFrac [0.85, 1]`; the credit is always present.
- The hero pair is present: `rank-number` and `record-text` (bare labels).
- Chips are present when their props say so (at defaults, both):
  `alliance-chip` and `playoff-chip` bare labels.
- The awards block is present when the list is non-empty: `awards-label`
  within the middle band `yFrac [0.45, 0.9]`; an empty list reserves no
  band.
- No exact fractions pinned beyond those bands - the reflow between square
  bands and landscape columns is the template's own business.

## Props (13 + debugLayout)

| name | type | default | what it changes | required |
|---|---|---|---|---|
| `teamNumber` | number | `9128` | the hero line "TEAM 9128" (1-99999, FRC numbers are digits) | no |
| `teamName` | string | `""` | the team nickname in caps under the number (<= 30 ASCII); "" removes the line (the default renders the scout's cited TBA page, number only) | no |
| `eventName` | string | `"Harbor City District"` | the event line (<= 40 ASCII; invented default) | no |
| `weekLabel` | string | `"Week 4"` | printed after the event name, " - " joined (<= 20 ASCII: "Week 4", "DCMP", "Offseason"); "" removes it | no |
| `qualRank` | number | `1` | the RANK hero (1-200) | no |
| `teamCount` | number | `48` | the "of 48 teams" line under the rank (0-200; 0 hides it); when > 0, `qualRank` above it is refused | no |
| `record` | string | `"17-0-0"` | the record hero, validated as W-L-T digits | no |
| `allianceRole` | enum | `"captain"` | alliance chip: `captain` / `pick1` / `pick2` -> "CAPTAIN - ALLIANCE N" / "1ST PICK - ALLIANCE N" / "2ND PICK - ALLIANCE N"; `none` hides the chip | no |
| `allianceNumber` | number | `1` | the N on the alliance chip (1-8; ignored when role is `none`) | no |
| `playoffResult` | enum | `"winner"` | playoff chip: "EVENT WINNER" / "FINALIST" / "SEMIFINALIST" / "QUARTERFINALIST"; `none` hides it | no |
| `awards` | json | `["Innovation in Control Award"]` | 0-3 award lines, each <= 60 ASCII (real TBA names run long), shrunk to fit above the floor | no |
| `districtPoints` | number | `78` | the footer-left "78 DISTRICT POINTS" (0-999; 0 hides, e.g. regionals and offseason) | no |
| `accent` | string color | `"#2f7bff"` | the one accent: header rule, chip outlines, award ticks (a TBA-ish blue) | no |
| `debugLayout` | boolean | `false` | draws the layout contract over the card | no |

Derived helpers (pure, exported, unit-tested): `allianceChipText(role,
allianceNumber)`, `playoffChipText(result)`, `recordText(wlt)` after format
validation, `rankSub(teamCount)` ("" when 0). All copy composed from these -
no chip or line is hand-typed free text except awards, eventName, weekLabel
and teamName, which are length-capped and shrink-fitted.

## Beats

Still — no beats.

## Defaults must show

A viewer with no inputs sees the scout's cited TBA example as a finished
card: **TEAM 9128** at the Harbor City District - Week 4, **RANK 1** of 48
teams with a **17-0-0** record, the chips **CAPTAIN - ALLIANCE 1** and
**EVENT WINNER**, one award line (Innovation in Control Award), **78
DISTRICT POINTS** and the "DATA: THE BLUE ALLIANCE" credit, one blue accent
on a dark page - a card a media student could post as-is.

## Acceptance rubric (the critic scores against this)

1. At defaults the card renders complete - header (label, team number,
   event + week), rank + record heroes, both chips, one award line, footer
   points + credit - with no clipped or overlapping text at any of the
   seven contract canvases.
2. The derived copy is right: `record "17-0-0"` prints as-is and bad
   formats are refused by name; `allianceRole "pick1"` + `allianceNumber 4`
   prints "1ST PICK - ALLIANCE 4"; `playoffResult "finalist"` prints
   "FINALIST"; `teamCount 0` drops the "of N teams" line; `districtPoints
   0` drops the footer-left text but keeps the TBA credit.
3. Impossible input is refused by name: `qualRank` above a non-zero
   `teamCount`, a `record` that is not W-L-T digits, an `allianceNumber`
   outside 1-8 with a playing role, a fourth award, a non-ASCII or overlong
   award/event/team string.
4. The three aspects reflow without loss: square and portrait stack the
   five bands, landscape puts header+hero left and chips+awards right with
   the footer full-width, and the layout contract holds on all seven
   canvases (award lines - the long free text - are the stress case).
5. Deterministic and honest: identical props give an identical document, no
   clock, no `Math.random`, a misspelled prop is refused by name, all
   default copy is printable ASCII, and the card reads at a glance as an
   FRC event recap (team number as identity, chips scannable, numbers no
   logos).

## Variants worth trying (each ONE idea different)

- **a — dark social card:** the baseline above, square-first, dark page,
  one blue accent; the Instagram posture.
- **b — wide-first:** hint `1920x1080` and lead with the two-column
  arrangement (header+hero left, chips+awards right) — the Chief Delphi / X
  header-image posture; same props, different composition.
- **c — light paper preset:** the square banded layout on a light page with
  dark ink — the newsletter / team-website print posture.
