// Pass 2: resolved rects from the contract, small canvases in all three modes, 8px floor everywhere.
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const Lx = require(path.join(ROOT, "dist/_shared/layout.js"));
const { widthOf, budget } = require(path.join(ROOT, "dist/_shared/text.js"));
const { CrosswordGridCardV1, normalizeCrossword, layoutCrosswordCard, parseCrosswordGrid, numberCrosswordGrid } = T;
const ctxOf = (w, h) => ({ mode: "render", target: { width: w, height: h, fps: 30, durationMs: 2000 }, output: { width: w, height: h, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function synth(cols, rows, white) { const out = []; for (let r = 0; r < rows; r++) { let l = ""; for (let c = 0; c < cols; c++) { const rr = Math.min(r, rows - 1 - r), cc = Math.min(c, cols - 1 - c); l += (!white && (rr * 5 + cc * 3) % 7 === 3 && rr > 0 && cc > 0) ? "#" : String.fromCharCode(65 + ((r * 7 + c * 3) % 26)); } out.push(l); } return out.join("/"); }
const ents = (g) => [...numberCrosswordGrid(parseCrosswordGrid(g)).entries.values()];
const longest = (g, n, minLen = 0) => ents(g).filter((e) => e.answer.length >= minLen).sort((a, b) => b.answer.length - a.answer.length || a.number - b.number).slice(0, n).map((e) => e.id);
const g21 = synth(21, 21);
const cases = {
  defaults: {},
  "8themes-20+": { grid: g21, themeEntries: longest(g21, 8, 20).join(" "), circles: "" },
  "author-lower48": { author: "constructorwithareallylonghandlefromcrosshare123" },
  "author-W48": { author: "W".repeat(48) },
  "title-nospace40": { title: "Supercalifragilisticexpialidociousnesses" },
  "title-spaced40": { title: "A Title Long Enough To Need Two Lines Ok" },
  "pub-W24": { publication: "W".repeat(24) },
  "pub-nospace24": { publication: "TheWashingtonPostSundays" },
  "maxcopy-nospace": { title: "Supercalifragilisticexpialidociousnesses", author: "constructorwithareallylonghandlefromcrosshare123", publication: "TheWashingtonPostSundays" },
  "maxcopy-nospace-8themes": { grid: g21, themeEntries: longest(g21, 8, 20).join(" "), circles: "", title: "Supercalifragilisticexpialidociousnesses", author: "constructorwithareallylonghandlefromcrosshare123", publication: "TheWashingtonPostSundays" },
  "maxcopy-W-8themes": { grid: g21, themeEntries: longest(g21, 8, 20).join(" "), circles: "", title: "W".repeat(40), author: "W".repeat(48), publication: "W".repeat(24) },
};
const CANVASES = [[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270],[1200,630],[1080,1350],[270,480],[270,270],[360,640],[360,360],[480,480],[640,640]];
(async () => {
  const want = process.argv.slice(2);
  for (const [name, props] of Object.entries(cases)) {
    if (want.length && !want.includes(name)) continue;
    for (const [W, H] of CANVASES) {
      const tag = `${name}@${W}x${H}`;
      let doc; try { doc = await CrosswordGridCardV1.render(props, ctxOf(W, H)); } catch (e) { console.log(`${tag} THROW ${e.message}`); continue; }
      const res = Lx.checkLayoutIntent(doc, W, H);
      if (!res.ok) console.log(`${tag} CONTRACT ${res.violations.map((v) => v.detail).join(" / ").slice(0, 400)}`);
      const R = res.resolved;
      const board = R.board && R.board[0].rect;
      for (const [label, arr] of Object.entries(R)) {
        if (label === "board" || label === "cell-letter" || label === "cell-number") continue;
        for (const n of arr) {
          const r = n.rect;
          if (board && overlap(r, board)) console.log(`${tag} RESOLVED-OVERLAP-BOARD ${label} ${JSON.stringify(r)} board=${JSON.stringify(board)}`);
          if (r.x < 0 || r.y < 0 || r.x + r.w > W || r.y + r.h > H) console.log(`${tag} RESOLVED-OFFCANVAS ${label} ${JSON.stringify(r)}`);
        }
      }
      const p = normalizeCrossword(props);
      const L = layoutCrosswordCard(p, W, H);
      const S = Math.min(W, H);
      for (const t of L.texts) {
        if (t.px < 8) console.log(`${tag} UNDER8 ${t.label} px=${t.px} lines=${t.text.split("\n").length} "${t.text.replace(/\n/g, "|").slice(0, 60)}"`);
        const lines = t.text.split("\n");
        const mw = Math.max(...lines.map((l) => widthOf(l, t.px, t.bold)));
        if (mw > budget(t.rect.w)) console.log(`${tag} CLIP-W ${t.label} ink=${mw.toFixed(1)} budget=${budget(t.rect.w)}`);
        if (t.rect.y + t.rect.h > H - L.margin + 1 && t.label !== "meta") {}
      }
      const title = L.texts.find((t) => t.label === "title");
      const primary = (W === 1080 && H === 1080) || (W === 1920 && H === 1080) || (W === 1080 && H === 1920);
      if (primary && title.px < S / 20) console.log(`${tag} TITLE<S/20 px=${title.px} need=${S / 20} lines=${title.text.split("\n").length} "${title.text.replace(/\n/g, "|")}"`);
      for (let i = 0; i < L.texts.length; i++) for (let j = i + 1; j < L.texts.length; j++) {
        const a = L.texts[i], b = L.texts[j];
        if (/^theme-id-(\d+)$/.test(a.label) && b.label === `theme-${a.label.slice(9)}`) continue;
        if (overlap(a.rect, b.rect)) console.log(`${tag} TEXT-OVERLAP ${a.label} ${JSON.stringify(a.rect)} x ${b.label} ${JSON.stringify(b.rect)}`);
      }
      if (process.env.V) console.log(`${tag} mode=${L.mode} ${L.texts.map((t) => `${t.label}:${t.px}`).join(",")}`);
    }
  }
})();
