// Build the same card twice: the code in place (one letters source, one numbers source) and a copy
// patched back to the old "one source per row" drawing. Writes both documents as .mosaic JSON.
const fs = require("fs"), path = require("path");
const root = "C:/src/m0saic-production/one-a-day";
const distJs = path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js");
let s = fs.readFileSync(distJs, "utf8");
s = s.replace(/require\("\.\.\/\.\.\/\.\.\/_shared\/(\w+)"\)/g, (_, m) => `require(${JSON.stringify(root + "/dist/_shared/" + m)})`);
s = s.replace(/require\("(@m0saic\/[\w-]+)"\)/g, (_, m) => `require(require.resolve(${JSON.stringify(m)}, { paths: [${JSON.stringify(root)}] }))`);
const start = s.indexOf("    const band = { x: B.X[0], y: B.Y[0]");
const end = s.indexOf("    // The caption copy and the list swatches.");
if (start < 0 || end < 0) throw new Error("anchor missing");
const perRow = `    for (let r = 0; r < pz.rows; r++) {
        const band = { x: B.X[0], y: B.Y[r], w: B.X[pz.cols] - B.X[0], h: B.Y[r + 1] - B.Y[r] };
        const nums = [];
        const lets = [];
        for (let c = 0; c < pz.cols; c++) {
            const i = r * pz.cols + c, ch = pz.cells[i];
            if (ch === null) continue;
            const h = B.hole(i);
            const n = p.numbers.get(i);
            if (n !== undefined && B.numberPx > 0) {
                nums.push({ text: String(n), x: h.x - band.x + Math.max(1, h.w * 0.07), y: Math.max(0, h.y - band.y + h.h * 0.06 - CAP_TOP_EM * B.numberPx) });
            }
            if (p.solved) {
                lets.push({ text: ch, x: h.x - band.x + (h.w - (0, text_1.widthOf)(ch, B.letterPx, true)) / 2, y: Math.max(0, h.y - band.y + h.h * 0.57 - CAP_MID_EM * B.letterPx) });
            }
        }
        if (nums.length > 0) add(band, 7, glyphRow("cell-number", nums, B.numberPx, false));
        if (lets.length > 0) add(band, 8, glyphRow("cell-letter", lets, B.letterPx, true));
    }
`;
const patched = s.slice(0, start) + perRow + s.slice(end);
const cur = path.join(__dirname, "_cur.cjs"), old = path.join(__dirname, "_perrow.cjs");
fs.writeFileSync(cur, s); fs.writeFileSync(old, patched);
const ctx = (w, h) => { const target = { width: w, height: h, fps: 30, durationMs: 2000 }; return { mode: "render", target, output: { ...target, workspaceDir: "." }, media: {} }; };
(async () => {
  const props = JSON.parse(fs.readFileSync(path.join(root, "journal/2026-09-29/stress/21x21.props.json"), "utf8"));
  for (const [tag, file] of [["cur", cur], ["perrow", old]].filter(([t]) => t === process.argv[2])) {
    const T = require(file).CrosswordGridCardV1;
    for (const [w, h] of [[480, 270], [1080, 1080]]) {
      const doc = await T.render({ ...T.defaultProps, ...props }, ctx(w, h));
      const out = path.join(__dirname, `${tag}-${w}x${h}.mosaic`);
      fs.writeFileSync(out, JSON.stringify(doc));
      const letterSrc = doc.sources.filter((x) => x.editor && x.editor.label === "cell-letter");
      console.log(tag, w, h, "sources", doc.sources.length, "letter sources", letterSrc.length);
    }
  }
})().catch((e) => { console.error(e); process.exit(1); });
