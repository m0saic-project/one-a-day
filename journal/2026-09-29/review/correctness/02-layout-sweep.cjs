// Layout probes: for a wide input set x canvases, check NaN, off-canvas rects, text/board overlap,
// text/text overlap, swatch overlap, and the stamped layout contract (checkLayoutIntent).
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { checkLayoutIntent, CONTRACT_CANVASES } = require(path.join(ROOT, "dist/_shared/layout.js"));
const { normalizeCrossword, layoutCrosswordCard, numberCrosswordGrid, parseCrosswordGrid, CrosswordGridCardV1 } = T;

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
const longThemes = (grid, n = 8) => {
  const { entries } = numberCrosswordGrid(parseCrosswordGrid(grid));
  return [...entries.values()].sort((a, b) => b.answer.length - a.answer.length || a.number - b.number).slice(0, n).map((e) => e.id).join(" ");
};
const OPEN21 = Array.from({ length: 21 }, (_, r) => "ABCDEFGHIJKLMNOPQRSTU".slice(r % 21) + "ABCDEFGHIJKLMNOPQRSTU".slice(0, r % 21)).join("/");
const MAXCOPY = { title: "A Title Long Enough To Need Two Lines Ok", author: "Constructor One and Constructor Two, eds. ABCDEF", publication: "The Weekly Puzzle Papers" };
const NOSPACE = { title: "W".repeat(40), author: "W".repeat(48), publication: "W".repeat(24) };
const DEF8 = "1A 4A 7A 8A 9A 11A 12A 16A";

const INPUTS = {
  defaults: {},
  "maxcopy+8themes 21x21": { grid: OPEN21, themeEntries: longThemes(OPEN21), circles: "", ...MAXCOPY },
  "maxcopy+8themes 15x15": { grid: synthetic(15, 15), themeEntries: longThemes(synthetic(15, 15)), circles: "", ...MAXCOPY },
  "maxcopy+8themes 7x7": { themeEntries: DEF8, ...MAXCOPY },
  "nospace copy + 8 themes 7x7": { themeEntries: DEF8, ...NOSPACE },
  "25x3 wide": { grid: synthetic(25, 3), themeEntries: "", circles: "" },
  "3x25 tall": { grid: synthetic(3, 25), themeEntries: "", circles: "" },
  "25x5 wide + maxcopy": { grid: synthetic(25, 5), themeEntries: longThemes(synthetic(25, 5)), circles: "", ...MAXCOPY },
  "5x25 tall + maxcopy": { grid: synthetic(5, 25), themeEntries: longThemes(synthetic(5, 25)), circles: "", ...MAXCOPY },
  "25x25 + 8": { grid: synthetic(25, 25), themeEntries: longThemes(synthetic(25, 25)), circles: "", ...MAXCOPY },
  teaser: { solved: false, ...MAXCOPY },
};
const CANVASES = [[1080, 1080], ...CONTRACT_CANVASES, [1350, 1080], [1080, 1350], [1200, 630], [1000, 800], [1240, 1000], [800, 1000], [1080, 1440], [2560, 1080], [1080, 2400]];

const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const ov = (a, b) => ({ dx: Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), dy: Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) });
const R = (r) => `${r.x},${r.y} ${r.w}x${r.h}`;

(async () => {
  const issues = [];
  for (const [name, over] of Object.entries(INPUTS)) {
    let p;
    try { p = normalizeCrossword(over); } catch (e) { issues.push(`${name}: normalize threw ${e.message}`); continue; }
    for (const [W, H] of CANVASES) {
      const where = `${name} @ ${W}x${H}`;
      const L = layoutCrosswordCard(p, W, H);
      const B = L.board;
      const all = [["board", B.ink], ...L.texts.map((t) => [t.label, t.rect]), ...L.themeLines.map((s, i) => [`swatch-${i}`, s.swatch])];
      for (const [lab, r] of all) {
        if (![r.x, r.y, r.w, r.h].every(Number.isFinite)) issues.push(`${where}: ${lab} NaN rect ${JSON.stringify(r)}`);
        if (r.x < 0 || r.y < 0 || r.x + r.w > W || r.y + r.h > H) issues.push(`${where}: ${lab} off canvas ${R(r)}`);
      }
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const [la, a] = all[i], [lb, b] = all[j];
        if (hit(a, b)) { const o = ov(a, b); issues.push(`${where}: ${la} [${R(a)}] overlaps ${lb} [${R(b)}] by ${o.dx}x${o.dy}`); }
      }
      // text boxes too small for their measured ink
      for (const t of L.texts) {
        const need = t.width, room = t.rect.w;
        if (need > room) issues.push(`${where}: ${t.label} ink ${need.toFixed(1)} > box ${room}`);
        if (t.px < 6) issues.push(`${where}: ${t.label} px ${t.px}`);
      }
      // the rendered doc's own contract
      const doc = await CrosswordGridCardV1.render({ ...CrosswordGridCardV1.defaultProps, ...over }, { mode: "render", target: { width: W, height: H, fps: 30, durationMs: 2000 }, output: { width: W, height: H, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });
      const res = checkLayoutIntent(doc, W, H);
      if (res && res.ok === false) issues.push(`${where}: contract violations: ${JSON.stringify(res.violations.map((v) => `${v.label}:${v.kind ?? v.rule ?? ""}:${v.message ?? ""}`)).slice(0, 600)}`);
    }
  }
  console.log(issues.length ? issues.join("\n") : "no issues");
  console.log(`\n${issues.length} issue(s)`);
})();
