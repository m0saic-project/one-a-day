# Ship — 2026-10-24

## @one-a-day/sports/orienteering-split-analysis/v1 — Orienteering Split Analysis

A shareable still of one racer's IOF XML 3.0 result row, for orienteers who post
and analyze their control split times after every race on Attackpoint and
club/WinSplits result pages. The finish time is the hero with course and place
beside it; each leg is a tape whose length is `split / slowest`, and any leg with
time loss (`loss > 0`, the WinSplits per-leg number) is pink in bar and signed
loss text. The footer answers the one question everyone asks — "where did I lose
time?" — as `TIME W/O MISTAKES`, `TOTAL LOSS` and `BEST LEG`, all arithmetic on
the entered numbers. Inputs are the JSON `splits` list (fields mirror the IOF
schema: `control`, `split`, `loss`) plus name/club/class/course/finish/place/behind.

## Render it

```
m0saic make @one-a-day/sports/orienteering-split-analysis/v1 --template-repo . -w 1280 -h 720 -o out.png
```

Props worth trying:

```
--props '{"preset":"light","accent":"#2f6f62"}'
--props '{"place":0}'
--props '{"splits":[{"control":"1","split":"4:08","loss":"0:47"},{"control":"2","split":"2:41","loss":"0:00"},{"control":"3","split":"3:15","loss":"0:21"},{"control":"F","split":"1:55","loss":"0:00"}]}'
```

Why it exists (the tutorial):

```
m0saic make @one-a-day/sports/orienteering-split-analysis/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## Weak spots (honest; a human polish pass starts here)

- No column header row. The split column is bold and the loss column is pink and
  signed, so a stranger must infer "bold = split, pink = loss" — it leans hard on
  the "no legend" promise. Works, but a one-line header would remove the guess.
- The `iof-xml` tag over-promises. The template takes a JSON `splits` list whose
  field names mirror IOF XML 3.0; it does not parse XML. A lone racer must
  transcribe 13 legs by hand. The batch use case (a club's timing system
  scripting the props) is where this earns its keep, and that converter is out of
  scope.
- `OVERLAY_CHAIN_DEEP` (45 deep) engine warning. Text verified rendering (the hero
  digits anti-alias, no tofu), but it is over the ~25 comfort ceiling. A future
  pass could nest the tape band into a child document to cut depth.

## Follow-ups (what v2 would do)

- A column header row (or a compact legend) above the first leg.
- Nest the tape band into a child document to drop the overlay chain under ~25.
- An IOF XML 3.0 / WinSplits SPL converter that parses a result file into the
  `splits` prop, so a club can batch one card per racer instead of transcribing.
- 19+ leg support (ultra-long courses currently fail fast below 640-wide canvases).

## Tokens and costs

Snapshot at ship time (see `60-token-costs.md` for the runner's refreshed totals —
it is regenerated after this call ends, so it cannot include this ship call yet):

- Phases: 6 (scout, scout (2), scout (3), plan, build, critique). Calls: 172.
- Tokens observed: 17,590,866. Known cost subtotal: $0.99, all **reported** by the
  OpenCode Go CLI (no dated estimates used).
- Missing usage: 2 calls (scout and scout (2) errored before recording tokens/cost)
  and their cost is unknown, never zero.
- OpenCode Go allowance usage is not an additional per-run invoice.

The full timeline (phases, tool calls, tokens, dollars, wall time) is frozen in the
template's `WHY.timeline` and the tutorial's "how it was made" page, both copied
verbatim from `journal/2026-10-24/trace.json` in this phase.
