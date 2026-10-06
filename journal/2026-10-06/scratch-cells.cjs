// One-off edit script for build call 1: child canvases become lattice-aligned cells over a transparent base.
const fs = require("fs");
const p = "src/community/weekly-run-report/v1/weekly-run-report.ts";
let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); s = s.replace(a, b); };

// 1. The tiles and badges keep their exact rects; the CELL around them is what gets 5-smooth.
rep(`/**
 * The largest 5-smooth number (2^a 3^b 5^c) at or below \`n\`: a child renders
 * on its own canvas, and a side with a large prime factor has no divisor
 * lattice, so its placement degrades to exact and \`latticeSmooth\` fails.
 */
function smoothDown(n: number): number {
  for (let v = Math.max(1, Math.floor(n)); v >= 1; v--) {
    let k = v;
    for (const f of [2, 3, 5]) while (k % f === 0) k /= f;
    if (k === 1) return v;
  }
  return 1;
}
/** A slot shrunk to 5-smooth sides and centred where it was. */
function smoothRect(r: ReportRect): ReportRect {
  const w = smoothDown(r.w), h = smoothDown(r.h);
  return { x: r.x + Math.floor((r.w - w) / 2), y: r.y + Math.floor((r.h - h) / 2), w, h };
}`,
`/**
 * The smallest 5-smooth number (2^a 3^b 5^c) at or above \`n\`: a child renders
 * on its own canvas, and a side with a large prime factor has no divisor
 * lattice, so its placement degrades to exact and \`latticeSmooth\` fails.
 */
function smoothUp(n: number): number {
  for (let v = Math.max(1, Math.ceil(n)); ; v++) {
    let k = v;
    for (const f of [2, 3, 5]) while (k % f === 0) k /= f;
    if (k === 1) return v;
  }
}`);
rep(`  // Each tile is a child document, so its sides are 5-smooth (a pixel or two off the slot, centred in it).
  heroRects.splice(0, 2, ...heroRects.map(smoothRect));
  statRects.splice(0, 4, ...statRects.map(smoothRect));
`, ``);
rep(`      // 5-smooth sides: each badge is a child document.
      const bw = smoothDown(Math.max(1, Math.min(slotW - Math.max(2, Math.round(gap * 0.6)), Math.round(rowH * 1.7))));
      const bh = smoothDown(Math.max(1, Math.min(rowH, bw)));`,
`      const bw = Math.max(1, Math.min(slotW - Math.max(2, Math.round(gap * 0.6)), Math.round(rowH * 1.7)));
      const bh = Math.max(1, Math.min(rowH, bw));`);
rep(`/** A child document: one tile or badge with its text, on its own small canvas. */
export type ReportGroup = { key: string; label: "hero-tile" | "stat-tile" | "badge"; rect: ReportRect; bg: MosaicColor };`,
`/** A child document: one tile or badge with its text, on its own small canvas. */
export type ReportGroup = { key: string; label: "hero-tile" | "stat-tile" | "badge"; rect: ReportRect };`);
rep(`    groups.push({ key: group, label, rect: r, bg: PAPER as MosaicColor });`, `    groups.push({ key: group, label, rect: r });`);
rep(`        groups.push({ key: group, label: "badge", rect, bg: TILE as MosaicColor });`, `        groups.push({ key: group, label: "badge", rect });`);

// 2. The cells, computed before render places anything.
rep(`/**
 * Why this template exists - rendered by \`renderTutorial\``,
`/**
 * Each child's canvas: its tile's rect grown OUTWARD to the parent's placement
 * lattice, with 5-smooth sides. A lattice-aligned piece gets no recovery
 * inset, so the engine and the layout checker (which inlines a child into its
 * cell) both draw the child 1:1; the tile sits inside at its exact rect, over
 * a transparent base. The pitch is set by the thin rule and separator, so it
 * settles in one pass; a cell that would leave the canvas keeps the tile's rect.
 */
export function childCells(L: ReturnType<typeof layoutWeeklyRunReport>, W: number, H: number): Map<string, ReportRect> {
  const dummy = makeColorTile(INK as MosaicColor) as MosaicSource;
  const others = [...L.tiles.filter((t) => t.group === undefined).map((t) => t.rect), ...L.cells.filter((c) => c.group === undefined).map((c) => c.rect)];
  const pitchOf = (rects: ReportRect[]) => placeInsetPieces({ rootW: W, rootH: H, pieces: rects.map((r) => ({ rect: { ...r, importance: 1 }, source: dummy })) }).pitch;
  let cells = new Map(L.groups.map((g) => [g.key, g.rect]));
  for (let pass = 0; pass < 3; pass++) {
    const pitch = pitchOf([...others, ...cells.values()]);
    const next = new Map<string, ReportRect>();
    for (const g of L.groups) {
      const r = g.rect;
      const x = Math.floor(r.x / pitch.x) * pitch.x, y = Math.floor(r.y / pitch.y) * pitch.y;
      const w = smoothUp(Math.ceil((r.x + r.w - x) / pitch.x)) * pitch.x, h = smoothUp(Math.ceil((r.y + r.h - y) / pitch.y)) * pitch.y;
      next.set(g.key, x + w <= W && y + h <= H ? { x, y, w, h } : r);
    }
    const same = [...next].every(([k, c]) => { const o = cells.get(k)!; return o.x === c.x && o.y === c.y && o.w === c.w && o.h === c.h; });
    cells = next;
    if (same) break;
  }
  return cells;
}

/**
 * Why this template exists - rendered by \`renderTutorial\``);

// 3. render: children on their cells.
rep(`  const groupOf = new Map(L.groups.map((g) => [g.key, { g, pieces: [] as Pieces }]));
  const push = (group: string | undefined, rect: ReportRect, importance: number, source: MosaicSource) => {
    if (group === undefined) { pieces.push({ rect: { ...rect, importance }, source }); return; }
    const owner = groupOf.get(group)!;
    owner.pieces.push({ rect: { ...rect, x: rect.x - owner.g.rect.x, y: rect.y - owner.g.rect.y, importance }, source });
  };`,
`  const cells = childCells(L, W, H);
  const groupOf = new Map(L.groups.map((g) => [g.key, { g, cell: cells.get(g.key)!, pieces: [] as Pieces }]));
  const push = (group: string | undefined, rect: ReportRect, importance: number, source: MosaicSource) => {
    if (group === undefined) { pieces.push({ rect: { ...rect, importance }, source }); return; }
    const owner = groupOf.get(group)!;
    owner.pieces.push({ rect: { ...rect, x: rect.x - owner.cell.x, y: rect.y - owner.cell.y, importance }, source });
  };`);
rep(`  for (const { g, pieces: own } of groupOf.values()) {
    const placedChild = placeInsetPieces({ rootW: g.rect.w, rootH: g.rect.h, pieces: own });
    children[g.key] = {
      kind: "mosaic_document",
      version: 1,
      m0: toM0String(placedChild.m0, ID),
      assets: {},
      size: { width: g.rect.w, height: g.rect.h },
      fps: ctx.target.fps,
      durationMs: 2000,
      // The child's own canvas shows behind the rounded corners: the page, or the band's white.
      backgroundColor: g.bg,
      sources: placedChild.sources,
      editor: { label: g.key },
    };
    pieces.push({ rect: { ...g.rect, importance: 2 }, source: tag({ type: "mosaic", ref: g.key, placement: { fit: "contain" } } as MosaicSource, g.key) });
  }`,
`  for (const { g, cell, pieces: own } of groupOf.values()) {
    // A transparent base: the cell is a little larger than the tile, and what shows
    // around it (and behind the rounded corners) is whatever the parent drew there.
    const base = tag({ type: "lavfi", color: "black@0" } as unknown as MosaicSource, "cell-base");
    const placedChild = placeInsetPieces({ rootW: cell.w, rootH: cell.h, pieces: [{ rect: { x: 0, y: 0, w: cell.w, h: cell.h, importance: 0 }, source: base }, ...own] });
    children[g.key] = {
      kind: "mosaic_document",
      version: 1,
      m0: toM0String(placedChild.m0, ID),
      assets: {},
      size: { width: cell.w, height: cell.h },
      fps: ctx.target.fps,
      durationMs: 2000,
      sources: placedChild.sources,
      editor: { label: g.key },
    };
    pieces.push({ rect: { ...cell, importance: 2 }, source: tag({ type: "mosaic", ref: g.key, placement: { fit: "contain" } } as MosaicSource, g.key) });
  }`);
fs.writeFileSync(p, s);
console.log("ok");
