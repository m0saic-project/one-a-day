# Ship — 2026-10-07

## @one-a-day/sports/chess-game-recap/v1 — Chess Game Recap

A chess recap card rendering opening name, result with colored icon + label, time control, rating delta, date and opponent. SVG rendering ensures vector-sharp scaling at any size. Solves the need for shareable game recaps that don't lose quality or metadata when resized, working from PGN metadata with sensible defaults.

## Render it

```
m0saic make @one-a-day/sports/chess-game-recap/v1 --template-repo . -w 1920 -h 1080 -o out.png
```

Props worth trying:
```
--props '{"opening":"Sicilian Defense","result":"loss","ratingChange":-12}'
--props '{"opening":"Berlin Defense","result":"draw","timeControl":"classical"}'
--props '{"opponentName":"Magnus Carlsen","result":"win","ratingChange":89}'
```

Why it exists (the tutorial):
```
m0saic make @one-a-day/sports/chess-game-recap/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## Weak spots (honest; a human polish pass starts here)

- **Catalog sidecar**: Template is flagged as behind the 0.3.1 convention (catalogSidecar metadata), which requires moving prop presentation metadata out of propsSchema. This is a structural change needed for consistency with the repo's metadata conventions but does not affect template function.
- **Doctor warnings on other templates**: The doctor reports binding warnings on episode-audiogram, talk-timer, speedrun-pb-recap, and powerlifting-meet-recap (unbound props that are drawn as text). These are in existing templates outside today's scope; chess-game-recap itself passes all binding checks after fixes.

## Follow-ups (what v2 would do)

- Migrate to catalogSidecar metadata structure to satisfy 0.3.1 conventions.
- Add support for rendering tournament metadata (multiple games, aggregate stats) to handle multi-game scenarios.
- Add customizable result colors to support platforms with different color schemes.
