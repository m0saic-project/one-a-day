# Brief — 2026-10-02

## The use case (two sentences, from the scout)
Competitive sim racers (iRacing, Assetto Corsa, Le Mans Ultimate) want to share lap achievements as cards: sector times, deltas against personal best, visualized with bars or comparison stats. Communities at SimTelemetry.site and competitive leagues currently screenshot or manually create graphics; a deterministic lap card lets them share standardized achievements.

## The template
- id: @one-a-day/sports/lap-telemetry-card/v1
- title: Sim Racing Lap Card
- kind: image; canvas hint 1920x1080; must also work at 1080x1920 (portrait) and 1080x1080 (square)
- duration: still

## Layout (regions, ratios, what goes where; a small ASCII sketch is welcome)
```
┌─────────────────────────────────────┐
│  Track Name · Lap Time · Date       │ ← Header (top 20%): track, lap time, delta vs PB
├─────────────────────────────────────┤
│                                     │
│  Sector 1:  2:30.123  (PB 2:29.456) │
│    Delta: -0.667s (green bar)       │
│                                     │ ← Sectors (middle 60%):
│  Sector 2:  2:45.234  (PB 2:44.123) │    3 rows, time + PB + delta bar
│    Delta: -1.111s (green bar)       │
│                                     │
│  Sector 3:  2:29.766  (PB 2:29.123) │
│    Delta: +0.643s (red bar)         │
│                                     │
├─────────────────────────────────────┤
│  Driver · Top Speed: 285 km/h       │ ← Footer (bottom 20%): driver, top speed
└─────────────────────────────────────┘
```

## Layout contract (the invariants the build sweeps: text fits, bands, presence)
- **Text fits**: track name up to 40 chars, lap time format M:SS.sss or SS.sss fits in header; sector labels and times fit in sector rows; all text checked at 0.94x cell width
- **Header band**: occupies top 20% of canvas, contains track name, lap time, and overall delta
- **Sector rows**: middle 60%, three equal-height rows for sectors 1, 2, 3; each shows time, PB time, delta, and a visual bar
- **Footer band**: bottom 20%, driver name left-aligned, top speed right-aligned
- **Presence**: every render shows track, lap time, three sectors with times and deltas, footer always present
- **Visual delta bars**: proportional length, green for faster (negative delta), red for slower (positive delta); bars never exceed sector cell width

## Props (name · type · default · what it changes · required?)
1. trackName · string · "Nürburgring" · The circuit name · yes
2. lapTime · string · "7:45.123" · Lap time in M:SS.sss format · yes
3. pbTime · string · "7:42.456" · Personal best lap time · yes
4. sector1Time · string · "2:30.123" · Sector 1 lap time · yes
5. sector2Time · string · "2:45.234" · Sector 2 lap time · yes
6. sector3Time · string · "2:29.766" · Sector 3 lap time · yes
7. sector1Pb · string · "2:29.456" · Sector 1 personal best · yes
8. sector2Pb · string · "2:44.123" · Sector 2 personal best · yes
9. sector3Pb · string · "2:29.123" · Sector 3 personal best · yes
10. driverId · string · "Driver" · Driver name or callsign · no
11. topSpeed · string · "285" · Peak speed in km/h this lap · no
12. date · string · (today) · Date of the lap attempt · no

## Beats (video only)
N/A — still image.

## Defaults must show
A realistic race-day lap with all three sectors faster than PB (negative deltas, green bars), showing a strong improvement run. Sector 1 and 2 highlight the biggest gains; sector 3 is slightly slower, showing the typical late-lap tire wear. Driver name and peak speed complete the context.

## Acceptance rubric (the critic scores against this)
1. **Arithmetic correctness**: deltas calculate correctly from (current time - PB time); sign and magnitude match the visual bar direction; times parse and format in M:SS.sss with no rounding artifacts
2. **Text fits at all canvases**: track name, lap time, sector labels, times, deltas, driver name all fit legibly at 1920x1080, 1280x720, 1080x1920, 1080x1080, 3840x2160, 640x360, 480x270 (0.94x cell width floor)
3. **Visual clarity**: delta bars are immediately readable; green/red distinction is clear even at small canvases; proportional bar length is accurate (longer bar = larger delta)
4. **Default render shows the use case**: all three sectors visible, deltas calculated and displayed, driver and speed present, layout balanced and not cramped
5. **No silent clipping**: validation rejects times with bad format (non-numeric, wrong separator, out of bounds); SVG text is tagged and contracted for every label

## Variants worth trying (up to 3, each ONE idea different: a layout, a motion, a palette — not a rewrite)
1. **Compact row layout** (sectors side-by-side instead of stacked): three-column grid where each sector occupies one column, times and deltas inline; trades height for width, optimizes for 1080x1080 square social crops
2. **Apex speed focus** (replace sector 3 with apex speeds): shows turn-by-turn apex speeds at corners 1–5 instead of sector 3 times, for drivers who want turn-level telemetry highlights
3. **Dark mode / accent color** (driver customization): card background and bar colors based on a team/driver accent color prop, for league identity or creator branding
