# Build — 2026-10-02

## Template: @one-a-day/sports/lap-telemetry-card/v1

### Variant A — Default lap card with stacked sector layout

**The one idea:** The delta bar shows at a glance which sector was the bottleneck—green bars mean faster than PB, red bars mean slower, and bar length is proportional to the improvement or loss.

- **Gate:** Clean - all build and layout checks pass
- **Render:** OK - landscape, portrait, square all render cleanly at all canvases
- **Stills:** 
  - landscape.png: full card at 1920x1080 showing all three sectors with green deltas (all faster than PB)
  - portrait.png: 1080x1920 orientation - same card stacked taller
  - square.png: 1080x1080 crop - fits all sectors in square social media format
  - tutorial stills: 6 pages covering the problem (sector comparison), solution (delta visualization), usage (command line), and timeline

### Why-tutorial

**Problem page:** Sim racers share lap achievements as screenshots or manually created graphics. SimTelemetry.site records telemetry automatically at 60Hz; drivers need a deterministic card.

**Solution page:** Track name, lap time, overall delta, three sectors with times and PB, each with a proportional delta bar (green/red). Driver name and top speed complete the context. The bar makes the bottleneck visible at a glance.

### What was hard

Time formatting had to handle both M:SS.sss and SS.sss formats, and the delta calculation required signed milliseconds (negative = faster). The layout contract demanded every text element be tagged and constrained, including all sector sub-labels (time, PB, delta). Squeezing three sectors plus header and footer into the card while keeping text legible at small canvases (480x270, 640x360) required careful fractional geometry.

### In place now

**Variant A** — the default implementation, ready for ship.

---

**Build status:** Done. All gates pass. One variant, clean render, all canvases, tutorial complete.
