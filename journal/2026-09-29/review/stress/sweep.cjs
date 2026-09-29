// Robustness sweep: node API from dist, contract check + own geometry checks.
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const Lx = require(path.join(ROOT, "dist/_shared/layout.js"));
const { widthOf, budget } = require(path.join(ROOT, "dist/_shared/text.js"));
const { CrosswordGridCardV1, normalizeCrossword, layoutCrosswordCard, parseCrosswordGrid, numberCrosswordGrid } = T;

const CANVASES = [...Lx.CONTRACT_CANVASES.map((c) => [c[0], c[1]]), [1200, 630], [1080, 1350]];
const ctxOf = (w, h) => ({ mode: "render", target: { width: w, height: h, fps: 30, durationMs: 2000 }, output: { width: w, height: h, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });

function synth(cols, rows, opts = {}) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const rr = Math.min(r, rows - 1 - r), cc = Math.min(c, cols - 1 - c);
      const block = !opts.white && (rr * 5 + cc * 3) % 7 === 3 && rr > 0 && cc > 0;
      line += block ? "#" : String.fromCharCode(65 + ((r * 7 + c * 3) % 26));
    }
    out.push(line);
  }
  return out.join("/");
}
const entriesOf = (g) => [...numberCrosswordGrid(parseCrosswordGrid(g)).entries.values()];
const longest = (g, n, minLen = 0) => entriesOf(g).filter((e) => e.answer.length >= minLen).sort((a, b) => b.answer.length - a.answer.length || a.number - b.number).slice(0, n).map((e) => e.id);

const cases = {};
cases["3x25"] = { grid: synth(3, 25), themeEntries: "", circles: "" }; // cols 3, rows 25
cases["25x3"] = { grid: synth(25, 3), themeEntries: "", circles: "" };
cases["3x25-theme"] = { grid: synth(3, 25), themeEntries: longest(synth(3, 25), 8).join(" "), circles: "" };
cases["25x3-theme"] = { grid: synth(25, 3), themeEntries: longest(synth(25, 3), 8).join(" "), circles: "" };
cases["25x25-white"] = { grid: synth(25, 25, { white: true }), themeEntries: "1A 1D", circles: "" };
cases["4x21"] = { grid: synth(4, 21), themeEntries: longest(synth(4, 21), 4).join(" "), circles: "" };
cases["21x4"] = { grid: synth(21, 4), themeEntries: longest(synth(21, 4), 4).join(" "), circles: "" };
{
  const g = synth(21, 21, { white: false });
  const ids = longest(g, 8, 20);
  cases["8themes-20+"] = { grid: g, themeEntries: ids.join(" "), circles: "" };
  const g25 = synth(25, 25, { white: true });
  cases["8themes-25"] = { grid: g25, themeEntries: ["1A", "26A", "27A", "28A", "29A", "30A", "31A", "32A"].join(" "), circles: "" };
}
const longTitle = "Supercalifragilisticexpialidociousnesses".slice(0, 40); // 40, no spaces
const longAuthor = "Mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm"; // 48 no spaces, widest glyph
const longAuthorW = "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW";
const longPub = "WWWWWWWWWWWWWWWWWWWWWWWW"; // 24
const longTitleW = "W".repeat(40);
cases["maxcopy"] = { title: longTitle, author: longAuthor, publication: longPub };
cases["maxcopy-W"] = { title: longTitleW, author: longAuthorW, publication: longPub };
cases["maxcopy-W-8themes"] = { ...cases["8themes-20+"], title: longTitleW, author: longAuthorW, publication: longPub };
cases["unsolved-8themes"] = { ...cases["8themes-20+"], solved: false };
{
  const g = synth(15, 15, { white: true });
  const circ = Array.from({ length: 120 }, (_, i) => i).join(" ");
  cases["120circles"] = { grid: g, circles: circ, themeEntries: "1A 16A" };
}
cases["themes-comma-newline"] = { themeEntries: "9A,\n12A\n1D, 3D", circles: "14,15\n16" };
{
  const g = synth(25, 25, { white: false });
  const ns = numberCrosswordGrid(parseCrosswordGrid(g)).numbers;
  cases["nums>150"] = { grid: g, themeEntries: longest(g, 8).join(" "), circles: "0 1 2 3" , _maxNum: Math.max(...ns.values()) };
}
// A grid whose numbering exceeds 150 surely: checkerboard-ish blocks every other cell creates lots of numbers
{
  const rows = [];
  for (let r = 0; r < 25; r++) { let l = ""; for (let c = 0; c < 25; c++) l += (r % 2 === 1 && c % 2 === 1) ? "#" : "A"; rows.push(l); }
  const g = rows.join("/");
  const ns = numberCrosswordGrid(parseCrosswordGrid(g)).numbers;
  cases["nums-max"] = { grid: g, themeEntries: "", circles: "", _maxNum: Math.max(...ns.values()) };
}

const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

async function run(name, props, only) {
  const out = [];
  const clean = Object.fromEntries(Object.entries(props).filter(([k]) => !k.startsWith("_")));
  for (const [W, H] of only || CANVASES) {
    const tag = `${name}@${W}x${H}`;
    let doc;
    try { doc = await CrosswordGridCardV1.render(clean, ctxOf(W, H)); } catch (e) { out.push(`${tag} THROW ${e.message}`); continue; }
    const res = Lx.checkLayoutIntent(doc, W, H);
    const viol = res && (res.violations || res.issues || res.failures || (res.ok === false ? [res] : []));
    if (res && res.ok === false) out.push(`${tag} CONTRACT ${JSON.stringify(viol).slice(0, 600)}`);
    const p = normalizeCrossword(clean);
    const L = layoutCrosswordCard(p, W, H);
    const ink = L.board.ink;
    if (ink.x < 0 || ink.y < 0 || ink.x + ink.w > W || ink.y + ink.h > H) out.push(`${tag} BOARD off-canvas ${JSON.stringify(ink)}`);
    for (const t of L.texts) {
      const r = t.rect;
      if (overlap(r, ink)) out.push(`${tag} OVERLAP-BOARD ${t.label} ${JSON.stringify(r)} ink=${JSON.stringify(ink)}`);
      if (r.x < 0 || r.y < 0 || r.x + r.w > W + 0.5 || r.y + r.h > H + 0.5) out.push(`${tag} OFFCANVAS ${t.label} ${JSON.stringify(r)} "${t.text.slice(0, 30)}"`);
      if (W === 480 && H === 270 && t.px < 8) out.push(`${tag} TINY ${t.label} px=${t.px} "${t.text.slice(0, 30)}"`);
      // measured fit: every line width vs budget(rect.w)
      const lines = t.text.split("\n");
      const mw = Math.max(...lines.map((l) => widthOf(l, t.px, t.bold)));
      if (mw > budget(r.w)) out.push(`${tag} CLIP-W ${t.label} ink=${mw.toFixed(1)} budget=${budget(r.w)} rectW=${r.w} px=${t.px} "${t.text.slice(0, 40).replace(/\n/g, "|")}"`);
      const needH = Math.ceil(t.px * (1.17 + 1.25 * (lines.length - 1)));
      if (needH > r.h) out.push(`${tag} CLIP-H ${t.label} need=${needH} rectH=${r.h}`);
    }
    // text-text overlaps (excluding id/answer pairs overlapping swatch etc.)
    for (let i = 0; i < L.texts.length; i++) for (let j = i + 1; j < L.texts.length; j++) {
      const a = L.texts[i], b = L.texts[j];
      if (overlap(a.rect, b.rect)) out.push(`${tag} TEXT-OVERLAP ${a.label} ${JSON.stringify(a.rect)} x ${b.label} ${JSON.stringify(b.rect)}`);
    }
    for (const ln of L.themeLines) {
      if (overlap(ln.swatch, ink)) out.push(`${tag} SWATCH-OVER-BOARD`);
      const s = ln.swatch; if (s.x < 0 || s.y < 0 || s.x + s.w > W || s.y + s.h > H) out.push(`${tag} SWATCH-OFFCANVAS ${JSON.stringify(s)}`);
    }
    // letters ≥6px promise
    if (p.solved && L.board.letterPx < 6) out.push(`${tag} LETTER<6`);
    const S = Math.min(W, H);
    out.push(`${tag} ok-info mode=${L.mode} pitch=${L.board.pitch.toFixed(2)} letter=${L.board.letterPx} num=${L.board.numberPx} texts=${L.texts.map((t) => `${t.label}:${t.px}`).join(",")}`);
  }
  return out;
}

(async () => {
  const want = process.argv.slice(2);
  const verbose = process.env.V === "1";
  for (const [name, props] of Object.entries(cases)) {
    if (want.length && !want.includes(name)) continue;
    if (props._maxNum) console.log(`# ${name}: max clue number ${props._maxNum}`);
    const lines = await run(name, props);
    for (const l of lines) if (verbose || !l.includes(" ok-info ")) console.log(l);
  }
})();
