// Worst-case glyph widths at the maximum lengths the props allow, swept like the test does.
const path = require("path");
const fs = require("fs");
const root = "C:/src/m0saic-production/one-a-day";
const T = require(path.join(root, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const Lay = require(path.join(root, "dist/_shared/layout.js"));
const ctx = (w, h) => ({ mode: "render", target: { width: w, height: h, fps: 30, durationMs: 2000 }, output: { width: w, height: h, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });
const p21 = JSON.parse(fs.readFileSync(path.join(root, "journal/2026-09-29/stress/21x21.props.json"), "utf8"));
const wide = { title: "W".repeat(40), author: "W".repeat(48), publication: "W".repeat(24) };
const wideWords = { title: "WWWWWW WWWWWW WWWWWW WWWWWW WWWWWW WWWWW", author: "MMMMMMM MMMMMMM MMMMMMM MMMMMMM MMMMMMM MMMMMMMM", publication: "WWWWWWWWWWW WWWWWWWWWWWW" };
const cases = { wide, wideWords, "p21+wideWords": { ...p21, ...wideWords } };
(async () => {
  for (const [name, over] of Object.entries(cases)) {
    const props = { ...T.CrosswordGridCardV1.defaultProps, ...over };
    try {
      await Lay.sweepLayout((p, c) => T.CrosswordGridCardV1.render(p, c), "x", props, (w, h) => ctx(w, h));
      console.log(name, "sweep ok");
    } catch (e) { console.log(name, "SWEEP FAIL", String(e.message).slice(0, 600)); }
    const p = T.normalizeCrossword(over);
    for (const [w, h] of [[1080,1080], ...Lay.CONTRACT_CANVASES]) {
      const L = T.layoutCrosswordCard(p, w, h);
      const small = L.texts.filter(t => (w === 480 && t.px < 8)).map(t => `${t.label}=${t.px}`);
      const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      const off = L.texts.filter(t => t.rect.x < 0 || t.rect.y < 0 || t.rect.x + t.rect.w > w || t.rect.y + t.rect.h > h).map(t => t.label);
      const over = [];
      for (let i = 0; i < L.texts.length; i++) for (let j = i + 1; j < L.texts.length; j++) if (hit(L.texts[i].rect, L.texts[j].rect)) over.push(`${L.texts[i].label}x${L.texts[j].label}`);
      const lines = L.texts.find(t => t.label === "title").text.split("\n").length;
      if (small.length || off.length || over.length || lines > 2) console.log(`  ${name} @${w}x${h}: under8=${small} offcanvas=${off} textOverlaps=${over.join(",")} titleLines=${lines}`);
    }
  }
})();
