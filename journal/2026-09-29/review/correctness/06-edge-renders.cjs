// Edge inputs through the full render(): crash? contract? odd constraints?
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { checkLayoutIntent } = require(path.join(ROOT, "dist/_shared/layout.js"));
const ctx = (W, H) => ({ mode: "render", target: { width: W, height: H, fps: 30, durationMs: 2000 }, output: { width: W, height: H, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });
const all25 = Array.from({ length: 25 }, () => "A".repeat(25)).join("/");
const CASES = {
  "no entries (isolated whites)": { grid: "A#A/###/A#A", themeEntries: "", circles: "" },
  "3x3 full, all circled": { grid: "ABC/DEF/GHI", themeEntries: "1A 1D 2D 3D 4A 5A", circles: "0 1 2 3 4 5 6 7 8" },
  "25x25 open, 120 circles": { grid: all25, themeEntries: "", circles: Array.from({ length: 120 }, (_, i) => i).join(" ") },
  "one-char copy": { title: "A", author: "x", publication: "Q" },
  "themeColor black": { themeColor: "#000000" },
  "null title": { title: null },
  "numeric grid": { grid: 12345 },
  "date 0001-01-01": { date: "0001-01-01" },
};
(async () => {
  for (const [name, over] of Object.entries(CASES)) {
    for (const [W, H] of [[1080, 1080], [480, 270]]) {
      try {
        const doc = await T.CrosswordGridCardV1.render({ ...T.CrosswordGridCardV1.defaultProps, ...over }, ctx(W, H)); const dbg = await T.CrosswordGridCardV1.render({ ...T.CrosswordGridCardV1.defaultProps, ...over, debugLayout: true }, ctx(W, H)); console.log("   debug layoutContract:", JSON.stringify(dbg.editor.layoutContract).slice(0, 300));
        const res = checkLayoutIntent(doc, W, H);
        const odd = doc.editor.layoutIntent.constraints.filter((c) => c.textFits && !(c.textFits.charWidthEm > 0.05 && c.textFits.charWidthEm < 2));
        console.log(`${name} @ ${W}x${H}: ok=${res.ok} violations=${JSON.stringify(res.violations.map((v) => `${v.label}:${v.rule}:${(v.detail || "").slice(0, 90)}`))} sources=${doc.sources.length}${odd.length ? " odd=" + JSON.stringify(odd) : ""}`);
      } catch (e) { console.log(`${name} @ ${W}x${H}: THREW ${e.message.slice(0, 160)}`); }
    }
  }
  // the no-entries case: what does the cell-number constraint measure?
  const p = T.normalizeCrossword({ grid: "A#A/###/A#A", themeEntries: "", circles: "" });
  console.log("no-entries widest number string:", JSON.stringify(String(Math.max(...p.numbers.values()))));
})();
