// Which cols x rows combos violate the "board" aspect constraint at the contract canvases (+2 social)?
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const Lx = require(path.join(ROOT, "dist/_shared/layout.js"));
const ctxOf = (w, h) => ({ mode: "render", target: { width: w, height: h, fps: 30, durationMs: 2000 }, output: { width: w, height: h, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });
const CANVASES = [...Lx.CONTRACT_CANVASES.map((c) => [c[0], c[1]]), [1200, 630], [1080, 1350]];
const grid = (c, r) => Array.from({ length: r }, () => "A".repeat(c)).join("/");
(async () => {
  const bad = [];
  for (let c = 3; c <= 25; c++) for (let r = 3; r <= 25; r++) {
    if (c === r) continue;
    const fails = [];
    for (const [W, H] of CANVASES) {
      const doc = await T.CrosswordGridCardV1.render({ grid: grid(c, r), themeEntries: "", circles: "" }, ctxOf(W, H));
      const res = Lx.checkLayoutIntent(doc, W, H);
      const v = res.violations.filter((x) => x.label === "board");
      if (v.length) fails.push(`${W}x${H}:${v[0].actual}`);
      const other = res.violations.filter((x) => x.label !== "board");
      if (other.length) console.log(`${c}x${r}@${W}x${H} OTHER ${other.map((o) => o.detail).join(" / ")}`);
    }
    if (fails.length) bad.push(`${c}x${r} (want ${(c / r).toFixed(3)}) fails at ${fails.length}/9: ${fails.join(" ")}`);
  }
  console.log(`${bad.length} non-square combos fail somewhere`);
  for (const want of ["16x15", "15x16", "21x15", "15x21", "17x15", "13x15", "15x13", "22x21", "21x22", "23x21", "21x23", "25x21", "24x23", "5x4", "4x5", "7x5", "5x7", "9x7", "10x9", "11x9", "15x14", "15x10", "15x5"]) {
    const hit = bad.find((b) => b.startsWith(want + " "));
    console.log(hit || `${want} ok everywhere`);
  }
})();
