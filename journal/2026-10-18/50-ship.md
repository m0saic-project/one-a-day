# Ship - 2026-10-18

## @one-a-day/gaming/wh40k-roster-card/v1 - WH40k Roster Share Card

A Warhammer 40,000 BattleScribe roster as one share card: army name, faction, detachment, a points pill, and unit rows with category badges, model counts, optional enhancement and warlord chips. Built for competitive players who want a clean "rate my list" post or tournament check-in instead of a multi-page printout or unreadable screenshot. Takes normalized props (faction, detachment, points, units); it does not parse .ros/.rosz XML at render time.

## Render it

```
m0saic make @one-a-day/gaming/wh40k-roster-card/v1 --template-repo . -w 1080 -h 1920 -o roster.png
```

Props worth trying:

```json
{
  "armyName": "Krakendoom Strike",
  "faction": "Adeptus Astartes",
  "detachment": "Gladius Task Force",
  "pointsUsed": 1995,
  "pointsLimit": 2000,
  "accent": "#1f618d",
  "preset": "light",
  "units": [
    { "name": "Captain in Gravis Armor", "models": 1, "points": 292, "category": "HQ", "enhancement": "Artificer Armour", "warlord": "WARLORD" },
    { "name": "Intercessor Squad", "models": 5, "points": 292, "category": "TR" },
    { "name": "Bladeguard Veterans", "models": 3, "points": 287, "category": "EL" },
    { "name": "Inceptor Squad", "models": 3, "points": 312, "category": "FA" },
    { "name": "Eradicator Squad", "models": 3, "points": 332, "category": "HS" },
    { "name": "Stormraven Gunship", "models": 1, "points": 480, "category": "FL" }
  ]
}
```

Why it exists (the tutorial):

```
m0saic make @one-a-day/gaming/wh40k-roster-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## Weak spots (honest; a human polish pass starts here)

- On the default landscape two-column render the HQ's "Artificer Armour" enhancement chip is dropped while the warlord chip stays. The fallback order is documented in `30-build.md` and the chip is visible in portrait and square, but a user editing only the wide render may miss it. Keeping it would mean shortening the default HQ name, swapping the drop order so the warlord chip yields first, or widening the row less aggressively.
- The tutorial render emits an `OVERLAY_CHAIN_DEEP` warning (42 nested overlays). Validation passes and the output is not degraded, but it is close to the threshold where ffmpeg can silently collapse inline masks.
- `bindPropPath` does not accept a nested boolean kind, so `warlord` is typed as a string chip rather than a true boolean field.

## Follow-ups (what v2 would do)

- Keep the enhancement chip visible in landscape by default, then add a smarter overflow strategy.
- Accept a BattleScribe `.ros`/`.rosz` file or JSON export and normalize it into the props schema in a wrapper step.
- Add a catalog sidecar when the repo moves to the 0.3.1 conventions.

## Tokens and costs

Observed usage through the end of critique (3): 8 phase calls, 343 tool calls, ~20.9M tokens, ~2h 41m wall time, $5.77 reported cost. All token and cost figures were reported by the OpenCode CLI; none are estimates and no phase is missing usage. The ship call itself is not yet in `token-costs.json` or `60-token-costs.md`; the runner refreshes those after this phase ends. See [`journal/2026-10-18/60-token-costs.md`](60-token-costs.md) for the final totals. OpenCode Go allowance usage is not an additional per-run invoice.
