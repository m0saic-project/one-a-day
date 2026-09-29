// List the non-square sizes whose stamped "board" aspect constraint fails, with the least-extreme ratio.
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { checkLayoutIntent, CONTRACT_CANVASES } = require(path.join(ROOT, "dist/_shared/layout.js"));
const ctx = (W, H) => ({ mode: "render", target: { width: W, height: H, fps: 30, durationMs: 2000 }, output: { width: W, height: H, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });
const open = (c, r) => Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => String.fromCharCode(65 + ((i * 7 + j * 3) % 26))).join("")).join("/");
(async () => {
  const out = [];
  for (let c = 3; c <= 25; c++) for (let r = 3; r <= 25; r++) {
    if (c === r) continue;
    const bad = [];
    for (const [W, H] of CONTRACT_CANVASES) {
      const doc = await T.CrosswordGridCardV1.render({ ...T.CrosswordGridCardV1.defaultProps, grid: open(c, r), themeEntries: "", circles: "" }, ctx(W, H));
      const v = (checkLayoutIntent(doc, W, H)?.violations ?? []).filter((x) => x.label === "board");
      if (v.length) bad.push(`${W}x${H}`);
    }
    if (bad.length) out.push({ k: `${c}x${r}`, ratio: Math.max(c, r) / Math.min(c, r), bad });
  }
  out.sort((a, b) => a.ratio - b.ratio);
  console.log(out.slice(0, 12).map((o) => `${o.k} (ratio ${o.ratio.toFixed(2)}): ${o.bad.join(",")}`).join("\n"));
  const doc = await T.CrosswordGridCardV1.render({ ...T.CrosswordGridCardV1.defaultProps, grid: open(out[0].k.split("x")[0] * 1, out[0].k.split("x")[1] * 1), themeEntries: "", circles: "" }, ctx(480, 270));
  console.log(JSON.stringify(checkLayoutIntent(doc, 480, 270)?.violations));
})();
