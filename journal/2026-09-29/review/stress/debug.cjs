const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const ctxOf = (w, h) => ({ mode: "render", target: { width: w, height: h, fps: 30, durationMs: 2000 }, output: { width: w, height: h, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });
const grid = (c, r) => Array.from({ length: r }, () => "A".repeat(c)).join("/");
(async () => {
  for (const [name, props] of [["25x3", { grid: grid(25, 3), themeEntries: "", circles: "" }], ["defaults", {}], ["21x4", { grid: grid(21, 4), themeEntries: "1A", circles: "" }]]) {
    for (const [W, H] of [[1080, 1080], [480, 270]]) {
      try {
        const doc = await T.CrosswordGridCardV1.render({ ...props, debugLayout: true }, ctxOf(W, H));
        const e = doc.editor || {};
        console.log(name, W, H, "ok; editor keys:", Object.keys(e).join(","), "sources:", doc.sources.length, JSON.stringify(e.layoutContract || e.layoutViolations || {}).slice(0, 300));
      } catch (err) { console.log(name, W, H, "THROW", err.message.slice(0, 200)); }
    }
  }
})();
