// (a) Which cols x rows fail the stamped "board" aspect constraint at the contract canvases?
// (b) Panel text floors: 8px at 480x270, title >= S/20 at the primary canvases, with long copy.
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
const T = require(path.join(ROOT, "dist/gaming/crossword-grid-card/v1/crossword-grid-card.js"));
const { checkLayoutIntent, CONTRACT_CANVASES } = require(path.join(ROOT, "dist/_shared/layout.js"));
const { normalizeCrossword, layoutCrosswordCard, CrosswordGridCardV1 } = T;
const ctx = (W, H) => ({ mode: "render", target: { width: W, height: H, fps: 30, durationMs: 2000 }, output: { width: W, height: H, fps: 30, durationMs: 2000, workspaceDir: "." }, media: {} });
const open = (c, r) => Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => String.fromCharCode(65 + ((i * 7 + j * 3) % 26))).join("")).join("/");

(async () => {
  const fails = new Map();
  for (let c = 3; c <= 25; c++) for (let r = 3; r <= 25; r++) {
    if (c === r) continue;
    const props = { ...CrosswordGridCardV1.defaultProps, grid: open(c, r), themeEntries: "", circles: "" };
    for (const [W, H] of CONTRACT_CANVASES) {
      const doc = await CrosswordGridCardV1.render(props, ctx(W, H));
      const res = checkLayoutIntent(doc, W, H);
      const v = (res?.violations ?? []).filter((x) => x.label === "board");
      if (v.length) { const k = `${c}x${r}`; fails.set(k, [...(fails.get(k) ?? []), `${W}x${H}`]); }
    }
  }
  console.log(`non-square sizes failing the board aspect at >=1 contract canvas: ${fails.size} of ${23 * 23 - 23}`);
  for (const k of ["15x16", "16x15", "21x23", "23x21", "5x6", "6x5", "4x5", "5x4", "5x7", "7x5", "13x15", "15x13", "17x15", "21x15", "15x21", "9x16", "16x9", "11x9", "12x13"]) console.log(`  ${k}: ${fails.has(k) ? "FAIL at " + fails.get(k).join(", ") : "ok"}`);
  // show one violation in full
  const doc = await CrosswordGridCardV1.render({ ...CrosswordGridCardV1.defaultProps, grid: open(15, 21), themeEntries: "", circles: "" }, ctx(480, 270));
  console.log(JSON.stringify(checkLayoutIntent(doc, 480, 270).violations, null, 0).slice(0, 800));

  // (b) floors
  const COPY = [
    ["default", {}],
    ["max", { title: "A Title Long Enough To Need Two Lines Ok", author: "Constructor One and Constructor Two, eds. ABCDEF", publication: "The Weekly Puzzle Papers" }],
    ["20-char title", { title: "Variety Pack Tuesday" }],
    ["30-char title", { title: "Wanting for Winter at the Lake" }],
    ["max + 8 themes", { themeEntries: "1A 4A 7A 8A 9A 11A 12A 16A", title: "A Title Long Enough To Need Two Lines Ok", author: "Constructor One and Constructor Two, eds. ABCDEF", publication: "The Weekly Puzzle Papers" }],
  ];
  for (const [name, over] of COPY) {
    const p = normalizeCrossword(over);
    for (const [W, H] of [[1080, 1080], [1920, 1080], [1080, 1920], [480, 270]]) {
      const L = layoutCrosswordCard(p, W, H);
      const t = L.texts.find((x) => x.label === "title");
      const small = L.texts.filter((x) => W === 480 && x.px < 8).map((x) => `${x.label}=${x.px}`);
      console.log(`${name} @ ${W}x${H} [${L.mode}]: title ${t.px}px (S/20=${Math.min(W, H) / 20}) lines=${t.text.split("\n").length}${small.length ? "  UNDER 8px: " + small.join(" ") : ""}`);
    }
  }
})();
