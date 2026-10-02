# Ship — 2026-10-02

## @one-a-day/sports/lap-telemetry-card/v1 — Sim Racing Lap Card

A shareable lap achievement card for sim racers: track name, lap time vs personal best, three sectors with times, personal bests, delta times, and proportional delta bars (green for faster, red for slower), driver name, and top speed. Each sector bar scales to the largest delta on the card so the bottleneck is visible at a glance.

## Render it

```
m0saic make @one-a-day/sports/lap-telemetry-card/v1 --template-repo . -w 1280 -h 720 -o lap.png
```

Props worth trying:
- `--topSpeed 310` for higher speeds
- `-w 1080 -h 1920` for portrait
- `-w 1080 -h 1080` for square crop

Why it exists (the tutorial):
```
m0saic make @one-a-day/sports/lap-telemetry-card/v1 --template-repo . --tutorial -w 1280 -h 720 -o why.mp4
```

## Weak spots (honest; a human polish pass starts here)

- Delta bars are solid rectangles with no texture; at very small canvases (480×270 or smaller) where bars may be 3px tall, shading or hatching could improve clarity.
- Footer alignment uses static fractional positions (driver at x: 0.06, speed at x: 0.54); ultra-wide (3840×2160) and ultra-narrow (320×180) canvases may need adjustment.

## Follow-ups (what v2 would do)

- Weighted sector layout: allow driver to set which sector is most critical (more height, more visual weight).
- Apex speed per sector instead of lap top speed.
- Optional comparison to a rival or previous season's personal best.
