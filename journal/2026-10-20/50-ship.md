# Ship — 2026-10-20

## @one-a-day/community/geocache-milestone-card/v1 — Geocache Milestone Card

A one-per-count share card for a geocacher who just hit a milestone (or is
building a year-in-review). It draws the find count as the hero, the Project-GC
milestone and the English ordinal ("1,000th", "1,042nd") computed from that
count rather than typed, the cache-type mix as a full-width bar with a one-line
legend, three equal FTF / avg difficulty / avg terrain tiles, and a footer. The
props mirror the fields of the My Finds pocket-query GPX (findCount, typeMix,
ftfCount, avgD, avgT, sinceYear, accent, footer), but the numbers are typed in,
never fetched or parsed.

## Render it

```
m0saic make @one-a-day/community/geocache-milestone-card/v1 --template-repo . -w 1080 -h 1080 -o card.png
```

Props worth trying:

```
--props '{"cacherName":"GeoHiker","findCount":1042,"typeMix":[{"type":"Traditional","count":900}]}'
```

- `findCount` 1042 prints "1,042nd" with no badge; 1500 and 2000 print it (Project-GC milestones).
- `-w 1920 -h 1080` puts the header beside the hero; `-h 1920` stacks the four bands.
- `footer ""` drops the sample line and returns the space to the card; `accent "#b3261e"` recolours the hero number, badge and header rule.
- Why it exists: `m0saic make @one-a-day/community/geocache-milestone-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4`

## Weak spots (honest; a human polish pass starts here)

- The value angle is the thin part (critique line 6): the scouted artifact is
  the My Finds GPX, but the card retypes the numbers instead of importing it,
  and Project-GC / CacheSleuth already surface the milestone. The differentiator
  is the deterministic share card, and the caveats say so.
- `footer` is a 9th data prop the brief's "8 + debugLayout" table omits; it is
  described in the layout section but the count does not match. Harmless, untidy.
- Visual cramping at 640x360 and 480x270: the layout contract proves the legend
  line and the badge fit above the floor, but no human eye checked them - this
  model does not take image input, so the builder and critic both read the
  flattened document instead of the stills.
- The doctor lists this template as lagging the 0.3.1 `catalogSidecar` convention
  (presentation lives in a `<name>.catalog.json` sidecar, not the module). The
  repo's gate targets 0.3.0 and `m0saic doctor` reports `ok: true`, so it ships;
  it is a future-cleanup item, not a blocker.

## Follow-ups (what v2 would do)

- Parse the My Finds GPX so the card builds from the file itself, not retyped numbers.
- Render the full type list instead of the top five; make the grey "Other" fallback a toggle.
- A `preset` for the night-cache palette (variant b's idea) as a real, documented prop.
- Give `footer` a row in the brief's props table so the count matches.

## Tokens and costs

Trace so far (7 phase calls, 168 tool calls, 22,046,794 tokens observed): the
three failed first attempts (scout, scout (2), critique) recorded no token or
cost data, so the known-cost subtotal is $1.31 reported, of which the build is
the bulk (109 calls, 20,106,558 tokens, $0.99). scout (3) $0.0710, plan $0.0957,
critique (2) $0.1505 - all reported, none estimated. OpenCode Go dollars are
reported usage, not an additional per-run invoice. This ship call is not in the
trace yet; the runner's final totals, refreshed after this call ends, are in
[60-token-costs.md](60-token-costs.md).
