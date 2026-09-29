// Every grid size 3..25 each way (square and a few non-square), at the contract canvases:
// render, checkLayoutIntent, overlay depth, lattice report. Claims under test: "every size from 3 to 25 renders the same way".
const { CrosswordGridCardV1, numberCrosswordGrid, parseCrosswordGrid, normalizeCrossword, layoutCrosswordCard } = require("../../../../dist/gaming/crossword-grid-card/v1/crossword-grid-card.js");
const { checkLayoutIntent, CONTRACT_CANVASES } = require("../../../../dist/_shared/layout.js");
const { parseM0StringComplete } = require("@m0saic/dsl");
function synthetic(cols, rows) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const rr = Math.min(r, rows - 1 - r), cc = Math.min(c, cols - 1 - c);
      const block = (rr * 5 + cc * 3) % 7 === 3 && rr > 0 && cc > 0;
      line += block ? "#" : String.fromCharCode(65 + ((r * 7 + c * 3) % 26));
    }
    out.push(line);
  }
  return out.join("/");
}
const longThemes = (g) => [...numberCrosswordGrid(parseCrosswordGrid(g)).entries.values()].sort((a, b) => b.answer.length - a.answer.length || a.number - b.number).slice(0, 8).map((e) => e.id).join(" ");
const ctx = (w, h) => { const target = { width: w, height: h, fps: 30, durationMs: 2000 }; return { mode: "render", target, output: { ...target, workspaceDir: "." }, media: {} }; };
(async () => {
  const sizes = [];
  for (let n = 3; n <= 25; n++) sizes.push([n, n]);
  for (const [c, r] of [[15, 16], [3, 25], [25, 3], [21, 23], [13, 17], [25, 24]]) sizes.push([c, r]);
  let bad = 0, count = 0;
  for (const [c, r] of sizes) {
    const grid = synthetic(c, r);
    for (const withThemes of [true, false]) {
      const props = { ...CrosswordGridCardV1.defaultProps, grid, themeEntries: withThemes ? longThemes(grid) : "", circles: "" };
      for (const [w, h] of [[1080, 1080], ...CONTRACT_CANVASES]) {
        count++;
        let doc;
        try { doc = await CrosswordGridCardV1.render(props, ctx(w, h)); } catch (e) { bad++; console.log(`${c}x${r} themes=${withThemes} @${w}x${h}: THROW ${e.message}`); continue; }
        const res = checkLayoutIntent(doc, w, h);
        const parsed = parseM0StringComplete(String(doc.m0), w, h);
        let depth = 0; if (parsed.ok) for (const f of parsed.ir.editorFrames) depth = Math.max(depth, Number(f.overlayDepth ?? 0));
        const L = layoutCrosswordCard(normalizeCrossword(props), w, h);
        const spread = (xs) => { const d = xs.slice(1).map((x, i) => x - xs[i]); return Math.max(...d) - Math.min(...d); };
        const problems = [];
        if (!res || !res.ok) problems.push(`layout: ${JSON.stringify(res && (res.violations || res.failures || res)).slice(0, 300)}`);
        if (!parsed.ok) problems.push("m0 parse failed");
        if (depth > 20) problems.push(`overlayDepth ${depth}`);
        if (spread(L.board.X) > 1 || spread(L.board.Y) > 1) problems.push("cells unequal");
        if (L.board.letterPx < 6) problems.push(`letterPx ${L.board.letterPx}`);
        if (problems.length) { bad++; console.log(`${c}x${r} themes=${withThemes} @${w}x${h}: ${problems.join("; ")}`); }
      }
    }
  }
  console.log(`checked ${count} renders, ${bad} with problems`);
})();
