// Canvas scan: throws / text-text overlap / board overlap / off-canvas across many sizes.
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { CrosswordGridCardV1, normalizeCrossword, layoutCrosswordCard, parseCrosswordGrid, numberCrosswordGrid } = T;
const ctxOf = (w, h) => ({ mode: "render", target: { width: w, height: h, fps: 30, durationMs: 2000 }, output: { width: w, height: h, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function synth(cols, rows, white) { const out = []; for (let r = 0; r < rows; r++) { let l = ""; for (let c = 0; c < cols; c++) { const rr = Math.min(r, rows - 1 - r), cc = Math.min(c, cols - 1 - c); l += (!white && (rr * 5 + cc * 3) % 7 === 3 && rr > 0 && cc > 0) ? "#" : String.fromCharCode(65 + ((r * 7 + c * 3) % 26)); } out.push(l); } return out.join("/"); }
const ents = (g) => [...numberCrosswordGrid(parseCrosswordGrid(g)).entries.values()];
const longest = (g, n, minLen = 0) => ents(g).filter((e) => e.answer.length >= minLen).sort((a, b) => b.answer.length - a.answer.length || a.number - b.number).slice(0, n).map((e) => e.id);
const g21 = synth(21, 21);
const realAuthor = "Constructor One and Constructor Two, eds. ABCDEF";
const realTitle = "A Title Long Enough To Need Two Lines Ok";
const cases = {
  defaults: {},
  "8long": { grid: g21, themeEntries: longest(g21, 8, 20).join(" "), circles: "" },
  "8long+maxcopy": { grid: g21, themeEntries: longest(g21, 8, 20).join(" "), circles: "", title: realTitle, author: realAuthor, publication: "The Weekly Puzzle Papers" },
  "maxcopy": { title: realTitle, author: realAuthor, publication: "The Weekly Puzzle Papers" },
  "25x3": { grid: synth(25, 3), themeEntries: longest(synth(25, 3), 8).join(" "), circles: "" },
  "3x25": { grid: synth(3, 25), themeEntries: longest(synth(3, 25), 8).join(" "), circles: "" },
};
const sizes = [240, 270, 300, 320, 360, 400, 480, 540, 600, 640, 720, 800, 900, 1000, 1080, 1200, 1280, 1350, 1440, 1600, 1920];
(async () => {
  const stats = {};
  for (const [name, props] of Object.entries(cases)) {
    const p = normalizeCrossword(props);
    for (const W of sizes) for (const H of sizes) {
      const tag = `${name}@${W}x${H}`;
      try { await CrosswordGridCardV1.render(props, ctxOf(W, H)); } catch (e) { console.log(`${tag} THROW ${e.message.slice(0, 120)}`); continue; }
      const L = layoutCrosswordCard(p, W, H);
      const ink = L.board.ink;
      for (const t of L.texts) {
        if (overlap(t.rect, ink)) console.log(`${tag} BOARD-OVERLAP ${t.label}`);
        if (t.rect.y + t.rect.h > H || t.rect.x + t.rect.w > W || t.rect.x < 0 || t.rect.y < 0) console.log(`${tag} OFFCANVAS ${t.label} ${JSON.stringify(t.rect)}`);
      }
      for (let i = 0; i < L.texts.length; i++) for (let j = i + 1; j < L.texts.length; j++) {
        const a = L.texts[i], b = L.texts[j];
        if (/^theme-id-(\d+)$/.test(a.label) && b.label === `theme-${a.label.slice(9)}`) continue;
        if (overlap(a.rect, b.rect)) { console.log(`${tag} TEXT-OVERLAP ${a.label} x ${b.label} (${L.mode})`); }
      }
      for (const s of L.themeLines) { if (overlap(s.swatch, ink)) console.log(`${tag} SWATCH-BOARD`); for (const t of L.texts) if (!t.label.startsWith("theme") && overlap(s.swatch, t.rect)) console.log(`${tag} SWATCH-TEXT ${t.label}`); }
    }
  }
})();
