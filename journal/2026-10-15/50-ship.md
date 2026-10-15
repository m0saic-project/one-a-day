# Ship - 2026-10-15

## @one-a-day/gaming/osu-scorepost-card/v1 - osu! Scorepost Card

An osu! result-screen card built from the API score object: beatmap title, artist and difficulty across the top, a large rank badge, four stat tiles (accuracy, max combo, score, PP), a hit-count bar and mods. The background is generated from a single colour, so no remote beatmap art is fetched. It is aimed at osu! players who post score screenshots to r/osugame or Discord and want a typed, shareable image instead.

Inputs are all props: `playerName`, `beatmapTitle`, `beatmapArtist`, `difficulty`, `rank`, `accuracy`, `maxCombo`, `score`, `pp`, `hits` (as `300/100/50/miss`), `mods`, `backgroundColor` and `preset` (`dark` or `light`).

## Render it

Static image (recommended):

```
m0saic make @one-a-day/gaming/osu-scorepost-card/v1 --template-repo . -w 1920 -h 1080 -o scorepost.png
```

Portrait or square also work:

```
m0saic make @one-a-day/gaming/osu-scorepost-card/v1 --template-repo . -w 1080 -h 1920 -o scorepost.png
m0saic make @one-a-day/gaming/osu-scorepost-card/v1 --template-repo . -w 1080 -h 1080 -o scorepost.png
```

Props worth trying:

```json
{
  "rank": "SS",
  "accuracy": 99.42,
  "maxCombo": 2856,
  "score": 1234567890,
  "pp": 942,
  "hits": "2500/30/5/0",
  "mods": "HD DT",
  "backgroundColor": "#1a0f2e",
  "preset": "dark"
}
```

Why it exists (the tutorial):

```
m0saic make @one-a-day/gaming/osu-scorepost-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## Weak spots (honest; a human polish pass starts here)

- The rank badge text is not `bindProp`-ed because `rank` is a closed-set picker and the engine rejects binding it (`unsupported-type`). The badge still updates when the prop changes because the whole render recomputes, but it does not appear in the binding map.
- `m0saic make --tutorial --validate-only` emits an `OVERLAY_CHAIN_DEEP` warning: the tutorial's agent-timeline page builds a 29-deep overlay chain. Validation passes and the tutorial renders cleanly, but the chain is above the engine's comfort threshold.
- The layout contract promises band placement for every text cell, but it does not promise exact alignment relationships between the rank badge and the stat grid; a future convention could add those.
- No real osu! API integration: users still have to copy fields manually or wire the template from a script.

## Follow-ups (what v2 would do)

- Wrap `rank` in an internal string prop so the badge text can be bound like the other cells, if the engine limitation persists.
- Add an optional `avatar` source and a `mapper` line for fuller scorepost metadata.
- Ship a small companion script or document the expected osu! API v2 `Score` JSON mapping.
- Lower the tutorial overlay depth by simplifying the agent-timeline harness page, or split it into nested sub-documents.

## Tokens and costs

Pre-ship totals from `journal/2026-10-15/trace.json` and `60-token-costs.md`:

- 6 phases (scout, plan, build, critique, build (2), critique (2))
- 220 tool calls
- 9,944,927 tokens
- $2.67 reported cost
- 79 min 50 s wall time

All costs are reported by the OpenCode CLI. This ship call's usage is not included yet; the runner refreshes `60-token-costs.md` after this phase ends. OpenCode Go allowance usage is not an additional per-run invoice.

See [`journal/2026-10-15/60-token-costs.md`](journal/2026-10-15/60-token-costs.md) for the final audited totals.
