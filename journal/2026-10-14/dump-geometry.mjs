// Scratch: dump the exact lattice/sample geometry for the pixel probe (the
// agent cannot view images; PowerShell System.Drawing samples the stills
// against these numbers). Same dist the CLI renders - deterministic.
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire("C:/src/m0saic-production/one-a-day/package.json");
const { TenxtenChallengeCardV1, layoutTenxtenCard } = require("C:/src/m0saic-production/one-a-day/dist/gaming/tenxten-challenge-card/v1/tenxten-challenge-card.js");

const CANVASES = { landscape: [1920, 1080], portrait: [1080, 1920], square: [1080, 1080], tutorial: [1280, 720] };
const out = {};
for (const [name, [w, h]] of Object.entries(CANVASES)) {
  const L = layoutTenxtenCard({}, w, h);
  const cells = Object.fromEntries(L.cells.map((c) => [c.label, c.rect]));
  const tiles = Object.fromEntries(L.tiles.map((t) => [t.label, t.rect]));
  const band = (labels) => labels.map((l) => cells[l]).filter(Boolean).map((rect, i) => ({ label: ["stat-strip", "tile-value-0", "tile-label-0"][i] ?? `band-${i}`, ...rect }));
  const rings = /a[\d.]+ [\d.]+ 0 1/.test(L.emptyPath);
  const pipProbe = (q) => {
    const cx = q.x + q.side / 2, cy = q.y + q.side / 2, r = q.side / 2;
    if (q.filled) return { cx, cy, color: L.p.accent };
    if (!rings) return { cx, cy, color: L.theme.track };
    const t = Math.max(1, Math.round(q.side * 0.16));
    return { cx, cy, color: L.theme.bg, ring: { x: cx + r - t / 2, y: cy, color: L.theme.track } };
  };
  out[name] = {
    W: w, H: h,
    bg: L.theme.bg,
    accent: L.p.accent,
    track: L.theme.track,
    rings,
    pips: L.pips.map(pipProbe),
    paceBar: tiles["pace-mark"] ? { cx: tiles["pace-mark"].x + tiles["pace-mark"].w / 2, cy: tiles["pace-mark"].y + tiles["pace-mark"].h / 2, color: L.p.accent } : null,
    ...(tiles["tile-0"] ? { tile0Fill: { x: tiles["tile-0"].x + tiles["tile-0"].w / 2, y: tiles["tile-0"].y + Math.round(tiles["tile-0"].h * 0.55), color: "#e5e0d6" } } : {}),
    inkBands: [
      ...band(["stat-strip", "tile-value-0", "tile-label-0"]),
      { label: "mark", ...cells.mark },
      { label: "handle", ...cells.handle },
      { label: "game-name-0", ...cells["game-name-0"] },
      { label: "game-name-9", ...cells["game-name-9"] },
      { label: "game-count-0", ...cells["game-count-0"] },
      { label: "footnote", ...cells.footnote },
    ],
  };
}
fs.writeFileSync("C:/src/m0saic-production/one-a-day/journal/2026-10-14/geom.json", JSON.stringify(out));
