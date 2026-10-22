# Ship — 2026-10-22

## @one-a-day/sports/frc-event-recap/v1 — FRC Event Recap

A deterministic, dark, square-first recap card for one FRC event, built for
the media students and mentors who write the after-event post for their team.
The props mirror The Blue Alliance's team-event fields one for one — team
number, event and week, qual rank of N teams, the W-L-T record, alliance
selection and playoff finish as closed-enum chips, up to three award lines,
and district points in the footer beside the TBA credit. At defaults it shows
the scout's cited example (Team 9128, Rank 1, 17-0-0, Captain of Alliance 1,
event winner) as a finished card. Shipped variant **a** (the critic's pick:
square-first, dark page, one blue accent); the ship phase kept its source,
regenerated `WHY.timeline` from the full trace, declared the two intentionally
unbound props (`teamName`, `allianceNumber`) for `bindingsDeclared`, removed
one dead variable lint caught, and synced the hint note's parenthetical to the
picked snapshot.

## Render it

```
m0saic make @one-a-day/sports/frc-event-recap/v1 --template-repo . -w 1080 -h 1080 -o out.png
```

Props worth trying:

```
--props '{"teamNumber":2471,"eventName":"Portland District","weekLabel":"Week 2"}'
--props '{"allianceRole":"pick1","allianceNumber":4,"playoffResult":"finalist"}'
--props '{"awards":["Industrial Design Award","Gracious Professionalism Award"],"districtPoints":0}'
```

Why it exists (the tutorial):

```
m0saic make @one-a-day/sports/frc-event-recap/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

Gate state at ship: `npm run verify` green (build, lint, 595 jest + 68 node
tests, bundle, contract, deps), `m0saic doctor . --json` reports `"ok": true`
(0 errors; the template meets the 0.3.0 target), the tutorial validates
(`--validate-only` exit 0), and the browse card at
`assets/templates/@one-a-day__sports__frc-event-recap__v1/preview.png` is the
full landscape card, not a blank frame. It is an image template, so the
video-first-frame concern does not apply; I viewed the PNG.

## Weak spots (honest; a human polish pass starts here)

1. The event-line join the critic flagged on every canvas: "Harbor City
   District  - Week 4" carries ~3x a word space before the dash because the
   week cell starts at the padded fit-check box, not the measured event width.
   Visible in the shipped preview.
2. Slack distribution: portrait shares its slack as large equal band gaps and
   the landscape left column is airy between W - L - T and the footer.
   Composed, not broken — the first thing a designer would nudge.
3. Numbers and chips only: no robot photos, no team or FIRST/TBA marks. The
   card rides beside the team's pictures; it does not replace them.
4. Regionals and offseason events zero the district points out of the footer,
   which is honest but makes the footer one-sided.

## Follow-ups (what v2 would do)

- Place the week cell against the measured event width so the line reads as
  one (the critic's item 1), and cap the portrait band gaps.
- A batch mode or companion script that pulls a team's season from the TBA
  API into one JSON props file per event (the props already mirror the
  fields; the API key stays the user's).
- An optional photo strip prop (user-supplied media) so the recap post is one
  render instead of card-plus-picture.
- The `catalogSidecar` convention (0.3.1) the whole repo lags; adopt it when
  the repo does.

## Tokens and costs

Per `journal/2026-10-22/trace.json` and [60-token-costs.md](60-token-costs.md)
(snapshot refreshed after this ship call ends, so it cannot include this call
yet): four phase calls observed before ship — scout 1,262,534 tok / $0.96,
plan 511,564 / $0.77, build 8,921,727 / $3.81, critique 1,249,885 / $0.80 —
11,945,710 tokens and **$6.34** total, every dollar **reported** by the agent
CLI (no dated estimates, no missing usage: 0 calls missing tokens, 0 missing
cost). The build call dominates and is also the one that timed out at the
runner's cap (its trace status is `error`; its outputs still landed, which the
tutorial's timeline page shows honestly). OpenCode Go allowance usage is not
an additional per-run invoice.
