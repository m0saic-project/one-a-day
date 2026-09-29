// (a) Brief: solved=false hides letters/tints/list and "Nothing else moves". Compare every shared text rect.
// (b) What rect do the "cell-letter" / "cell-number" textFits constraints resolve to? And do the glyphs
//     really fit a cell at the brief's rule (cell*0.94 - 2px, no 8px floor)?
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { CONTRACT_CANVASES, checkLayoutIntent } = require(path.join(ROOT, "dist/_shared/layout.js"));
const { widthOf } = require(path.join(ROOT, "dist/_shared/text.js"));
const { resolveFrames } = (() => { try { return require("@m0saic/template-utils"); } catch { return {}; } })();
const ctx = (W, H) => ({ mode: "render", target: { width: W, height: H, fps: 30, durationMs: 2000 }, output: { width: W, height: H, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });
const MAX = { title: "A Title Long Enough To Need Two Lines Ok", author: "Constructor One and Constructor Two, eds. ABCDEF", publication: "The Weekly Puzzle Papers" };

for (const [name, over] of [["defaults", {}], ["max copy", MAX], ["30-char title", { title: "Wanting for Winter at the Lake" }]]) {
  for (const [W, H] of [[1080, 1080], [1920, 1080], [1080, 1920]]) {
    const a = T.layoutCrosswordCard(T.normalizeCrossword({ ...over, solved: true }), W, H);
    const b = T.layoutCrosswordCard(T.normalizeCrossword({ ...over, solved: false }), W, H);
    const diffs = [];
    for (const t of a.texts) {
      const u = b.texts.find((x) => x.label === t.label);
      if (!u) continue;
      if (u.px !== t.px || u.rect.x !== t.rect.x || u.rect.y !== t.rect.y || u.rect.w !== t.rect.w || u.text.replace("puzzle", "solution") !== t.text) diffs.push(`${t.label}: ${t.px}px ${JSON.stringify(t.text)} @${t.rect.x},${t.rect.y} w${t.rect.w} -> ${u.px}px ${JSON.stringify(u.text)} @${u.rect.x},${u.rect.y} w${u.rect.w}`);
    }
    console.log(`${name} @ ${W}x${H} [${a.mode}]: ${diffs.length ? "MOVES\n   " + diffs.join("\n   ") : "nothing moves"}`);
  }
}

// (b) resolved rect for cell-letter in a real doc
(async () => {
  const doc = await T.CrosswordGridCardV1.render({ ...T.CrosswordGridCardV1.defaultProps }, ctx(1080, 1080));
  const intent = doc.editor.layoutIntent;
  const cl = intent.constraints.filter((c) => c.label === "cell-letter" || c.label === "cell-number");
  console.log("\nstamped cell constraints:", JSON.stringify(cl));
  const L = T.layoutCrosswordCard(T.normalizeCrossword({}), 1080, 1080);
  const band = { w: L.board.X[7] - L.board.X[0], h: L.board.Y[7] - L.board.Y[0] };
  console.log(`the cell-letter/cell-number sources are placed on the board band ${band.w}x${band.h}; one cell's paper is ${L.board.hole(0).w}x${L.board.hole(0).h}`);
  // Proof the check cannot see a cell: forge a letter 3x wider than a cell and re-check the doc.
  const forged = JSON.parse(JSON.stringify(doc));
  const hole = L.board.hole(0).w;
  forged.editor.layoutIntent.constraints = forged.editor.layoutIntent.constraints.map((c) => c.label === "cell-letter" ? { label: "cell-letter", textFits: { charWidthEm: (3 * hole) / (1 * L.board.letterPx), padPx: 0 } } : c);
  const r = checkLayoutIntent(forged, 1080, 1080);
  console.log(`forged: a "W" ${3 * hole}px wide in a ${hole}px cell -> contract ok=${r.ok}, violations=${JSON.stringify(r.violations.map((v) => v.label))}`);

  // real fit at the strict rule for every square size at every contract canvas
  let worstL = null, worstN = null;
  for (let n = 3; n <= 25; n++) {
    const grid = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => String.fromCharCode(65 + ((i * 7 + j * 3) % 26))).join("")).join("/");
    const p = T.normalizeCrossword({ grid, themeEntries: "", circles: "" });
    const widest = String(Math.max(...p.numbers.values()));
    for (const [W, H] of [[1080, 1080], ...CONTRACT_CANVASES]) {
      const B = T.layoutCrosswordCard(p, W, H).board;
      const hw = Math.min(...Array.from({ length: n * n }, (_, i) => B.hole(i).w));
      const strict = hw * 0.94 - 2;
      const lw = widthOf("W", B.letterPx, true);
      const sl = lw - strict; if (!worstL || sl > worstL.s) worstL = { s: sl, at: `${n}x${n}@${W}x${H}`, lw, hw, px: B.letterPx };
      if (B.numberPx > 0) {
        const nw = Math.max(1, hw * 0.07) + widthOf(widest, B.numberPx);
        const sn = nw - hw; if (!worstN || sn > worstN.s) worstN = { s: sn, at: `${n}x${n}@${W}x${H}`, nw, hw, px: B.numberPx, widest };
      }
    }
  }
  console.log(`\nworst letter vs strict budget: ${JSON.stringify(worstL)}`);
  console.log(`worst number (offset + width) vs cell paper width: ${JSON.stringify(worstN)}`);
})();
