// Tests for the review fixes (build call 4).
const fs = require("fs");
const f = "src/gaming/crossword-grid-card/v1/crossword-grid-card.test.ts";
let s = fs.readFileSync(f, "utf8");
const rep = (a, b) => { if (!s.includes(a)) { console.error("MISSING", a.slice(0, 100)); process.exit(1); } s = s.replace(a, b); };

rep(`      [{ themeColor: "gold" }, /themeColor "gold" must be #rrggbb/],`,
`      [{ themeColor: "gold" }, /themeColor "gold" must be #rrggbb/],
      [{ themeColor: "#1E3A8A" }, /themeColor #1E3A8A is too dark for the ink letters over it \\(1\\.\\d:1, needs 4\\.5:1\\)/],`);

rep(`    // Nothing else moves: the caption keeps the solved card's rects at every canvas.
    for (const [w, h] of [[1080, 1080], ...CONTRACT_CANVASES]) {
      const rects = (solved: boolean) => layoutCrosswordCard(normalizeCrossword({ solved }), w, h).texts.filter((t) => !t.label.startsWith("theme")).map((t) => [t.label, t.rect.x, t.rect.y, t.rect.w, t.rect.h, t.px]);
      expect(rects(false)).toEqual(rects(true));
    }`,
`    // Nothing else moves: the caption keeps the solved card's rects at every canvas, for the defaults and the longest copy.
    const maxCopy = STRESS.find(([name]) => name === "max-length copy")![1];
    for (const over of [{}, maxCopy]) {
      for (const [w, h] of [[1080, 1080], ...CONTRACT_CANVASES]) {
        const rects = (solved: boolean) => layoutCrosswordCard(normalizeCrossword({ ...over, solved }), w, h).texts.filter((t) => !t.label.startsWith("theme")).map((t) => [t.label, t.rect.x, t.rect.y, t.rect.w, t.rect.h, t.px]);
        expect(rects(false)).toEqual(rects(true));
      }
    }`);

rep(`  it("is deterministic", async () => {`,
`  it("uses its space on purpose without a theme, and never overflows a canvas too small for the list", async () => {
    // Landscape, themeless: the title block sits mid-column above the caption, not at the top over an empty band.
    const L = layoutCrosswordCard(normalizeCrossword({ themeEntries: "" }), 1920, 1080);
    const title = L.texts.find((t) => t.label === "title")!, meta = L.texts.find((t) => t.label === "meta")!;
    expect(title.rect.y - L.panel.y).toBeGreaterThan((meta.rect.y - L.panel.y) * 0.25);
    // Portrait, themeless: the caption line is centred in the band under the board, not pinned to the bottom.
    const P = layoutCrosswordCard(normalizeCrossword({ themeEntries: "" }), 1080, 1920);
    const pm = P.texts.find((t) => t.label === "meta")!;
    expect(1920 - P.panel.y - (pm.rect.y + pm.rect.h)).toBeGreaterThan(100);
    // A 300x300 card with 8 long answers drops the list (the tint still marks them) instead of throwing.
    const grid = OPEN21;
    for (const [w, h] of [[300, 300], [240, 240], [360, 300]]) {
      const doc = await render({ grid, themeEntries: longThemes(grid), circles: "" }, w, h);
      expect(labels(doc)).toContain("theme-tint");
    }
  });

  it("is deterministic", async () => {`);

fs.writeFileSync(f, s);
console.log("ok");
