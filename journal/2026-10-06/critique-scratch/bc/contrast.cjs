const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const cr = (a, b) => { const x = L(a), y = L(b); return ((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
const P = { page: "#14211a", ink: "#eef2ee", dark: "#14211a", dim: "#b4beb7", tile: "#2c2c2c", vol: "#5a5a5a", acc: "#3fae74", white: "#ffffff" };
const onColor = (f) => (cr(f, "#ffffff") >= cr(f, P.dark) ? "#ffffff" : P.dark);
const rows = [
  ["tiles vs page", P.tile, P.page],
  ["band vs page", P.tile, P.page],
  ["hero numbers (accent) vs tile", P.acc, P.tile],
  ["hero numbers (accent) vs page", P.acc, P.page],
  ["stat numbers (ink) vs tile", P.ink, P.tile],
  ["tile labels (dim) vs tile", P.dim, P.tile],
  ["band title (dim) vs tile", P.dim, P.tile],
  ["event name (ink) vs page", P.ink, P.page],
  ["run line (dim) vs page", P.dim, P.page],
  ["footer (dim) vs page", P.dim, P.page],
  ["header rule (accent) vs page", P.acc, P.page],
  [`run badge text (${onColor(P.acc)}) vs accent fill`, onColor(P.acc), P.acc],
  ["run badge text if white vs accent", P.white, P.acc],
  [`vol badge text (${onColor(P.vol)}) vs vol fill`, onColor(P.vol), P.vol],
  ["vol fill vs band tile", P.vol, P.tile],
  ["accent fill vs band tile", P.acc, P.tile],
  ["vol fill vs accent fill", P.vol, P.acc],
];
for (const [n, a, b] of rows) console.log(`${n.padEnd(45)} ${a} on ${b}: ${cr(a, b)}:1`);
// light (a) for comparison
console.log("--- a (light)");
for (const [n, a, b] of [["tile vs page", "#fbfbfb", "#f6f4ee"], ["accent vs tile", "#1f7a4d", "#fbfbfb"], ["dim vs tile", "#4f5651", "#fbfbfb"], ["white vs accent", "#ffffff", "#1f7a4d"], ["ink vs vol fill", "#1b1f1c", "#dde1da"]]) console.log(`${n.padEnd(45)} ${a} on ${b}: ${cr(a, b)}:1`);
