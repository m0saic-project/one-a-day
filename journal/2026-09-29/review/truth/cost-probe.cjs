// Cost probe: frames, sources, overlay depth and inline masks for the stress grids, at the canvases the brief names.
const { CrosswordGridCardV1, numberCrosswordGrid, parseCrosswordGrid } = require("../../../../dist/gaming/crossword-grid-card/v1/crossword-grid-card.js");
const { getComplexityMetricsFast, parseM0StringComplete } = require("@m0saic/dsl");
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
  for (const n of [7, 15, 21, 25]) {
    const grid = n === 7 ? undefined : synthetic(n, n);
    for (const [w, h] of [[1080, 1080], [1920, 1080], [1080, 1920]]) {
      const props = { ...CrosswordGridCardV1.defaultProps, ...(grid ? { grid, themeEntries: longThemes(grid), circles: "0 1 2" } : {}) };
      const doc = await CrosswordGridCardV1.render(props, ctx(w, h));
      const m0 = String(doc.m0);
      const frames = getComplexityMetricsFast(m0).frameCount;
      const parsed = parseM0StringComplete(m0, w, h);
      let depth = 0;
      if (parsed.ok) for (const f of parsed.ir.editorFrames) depth = Math.max(depth, Number(f.overlayDepth ?? 0));
      const masks = doc.sources.filter((s) => s.mask && s.mask.kind === "inline-mask").length;
      console.log(`${n}x${n} @ ${w}x${h}: frames ${frames}, sources ${doc.sources.length}, overlayDepth ${depth}${parsed.ok ? "" : " (parse failed)"}, inlineMasks ${masks}`);
    }
  }
})();
