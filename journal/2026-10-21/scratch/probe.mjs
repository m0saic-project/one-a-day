import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const mod = require("../../../dist/gaming/typing-pb-card/v1/typing-pb-card.js");
const { layoutTypingPbCard } = mod;
for (const [w, h] of [[1080, 1080], [1920, 1080], [1080, 1920], [480, 270]]) {
  const L = layoutTypingPbCard({}, w, h);
  const track = L.tiles.find((t) => t.label === "chart-track");
  const bars = L.tiles.filter((t) => t.label === "chart-bar");
  const peak = L.tiles.find((t) => t.label === "chart-peak");
  const badge = L.tiles.find((t) => t.label === "pb-badge");
  const tiles = L.tiles.filter((t) => t.label === "stat-tile");
  const h0 = bars[0]?.rect.h, hMid = bars[30]?.rect.h, hLast = bars[59]?.rect.h;
  console.log(`${w}x${h} shape=${L.shape} wpmPx=${L.wpmPx} handlePx=${L.handlePx}`);
  console.log(`  track ${JSON.stringify(track.rect)} widthFrac=${(track.rect.w / w).toFixed(2)}`);
  console.log(`  bars=${bars.length}+peak=${peak ? 1 : 0} first.h=${h0} s31.h=${hMid} s60.h=${hLast} peakRect=${peak ? JSON.stringify(peak.rect) : "none"}`);
  console.log(`  badge=${badge ? JSON.stringify(badge.rect) : "none"} tiles=${tiles.map((t) => `${t.rect.w}x${t.rect.h}`).join("|")}`);
  console.log(`  texts=${L.cells.map((c) => `${c.label}:"${c.text}"@${c.px}px`).slice(0, 12).join(", ")}`);
}
