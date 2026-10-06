// One-off edit script for build call 1: snap child tiles/badges to the parent lattice with 5-smooth sides.
const fs = require("fs");
const p = "src/community/weekly-run-report/v1/weekly-run-report.ts";
let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); s = s.replace(a, b); };

// smoothUp -> smoothDown + a group snapper.
rep(`/**
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
}`,
`/** The largest 5-smooth number (2^a 3^b 5^c) at or below \`n\`. */
function smoothDown(n: number): number {
  for (let v = Math.max(1, Math.floor(n)); v >= 1; v--) {
    let k = v;
    for (const f of [2, 3, 5]) while (k % f === 0) k /= f;
    if (k === 1) return v;
  }
  return 1;
}
/** The parent's placement lattice (px per step on each axis); 1 = exact. */
export type Pitch = { x: number; y: number };
/**
 * Equal rects for a group of equal slots, each ON the parent lattice with
 * 5-smooth sides, centred in its slot (rounded down, so never larger than it).
 * Why: each tile is a child document. A child on a rough canvas fails
 * \`latticeSmooth\`, and a child ref off the lattice gets a recovery inset that
 * the layout checker's flatten does not apply, so it would judge the tiles
 * unequal although the engine draws them equal.
 */
function snapGroup(slots: ReportRect[], pitch: Pitch): ReportRect[] {
  const axis = (pos: number, len: number, step: number) => ({ start: Math.ceil(pos / step) * step, room: pos + len - Math.ceil(pos / step) * step });
  const kx = smoothDown(Math.min(...slots.map((r) => Math.floor(axis(r.x, r.w, pitch.x).room / pitch.x))));
  const ky = smoothDown(Math.min(...slots.map((r) => Math.floor(axis(r.y, r.h, pitch.y).room / pitch.y))));
  return slots.map((r) => {
    const ax = axis(r.x, r.w, pitch.x), ay = axis(r.y, r.h, pitch.y);
    const w = kx * pitch.x, h = ky * pitch.y;
    return { x: ax.start + Math.floor((ax.room - w) / pitch.x / 2) * pitch.x, y: ay.start + Math.floor((ay.room - h) / pitch.y / 2) * pitch.y, w, h };
  });
}`);

// layout signature takes the pitch.
rep(`/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export function layoutWeeklyRunReport(props: WeeklyRunReportProps, W: number, H: number) {`,
`/**
 * Every rect of the card for one canvas. Pure: same props, canvas and pitch,
 * same rects. \`pitch\` is the parent's placement lattice (render finds it, see
 * \`settleLayout\`); tiles and badges snap to it.
 */
export function layoutWeeklyRunReport(props: WeeklyRunReportProps, W: number, H: number, pitch: Pitch = { x: 1, y: 1 }) {`);

// snap hero/stat right after the slots are built.
rep(`  const padOf = (r: ReportRect) =>`,
`  heroRects.splice(0, 2, ...snapGroup(heroRects, pitch));
  statRects.splice(0, 4, ...snapGroup(statRects, pitch));
  const padOf = (r: ReportRect) =>`);

// badges: snap the common badge size and each badge in its slot.
rep(`        const rect = { x: x0 + i * slotW + Math.round((slotW - bw) / 2), y: rowY, w: bw, h: bh };`,
    `        const rect = snapped[k];`);
rep(`    const blockH = lineH(badgePx) + lineH(captionPx);
    const totalH = rowsN.length * bh + (rowsN.length - 1) * rowGap;
    let k = 0;`,
`    const blockH = lineH(badgePx) + lineH(captionPx);
    const totalH = rowsN.length * bh + (rowsN.length - 1) * rowGap;
    // The badge slots, then the same snap as the tiles (equal, on the lattice, 5-smooth).
    const slotsOf: ReportRect[] = [];
    rowsN.forEach((count, r) => {
      const rowY = area.y + Math.round((area.h - totalH) / 2) + r * (bh + rowGap);
      const x0 = area.x + Math.round((area.w - count * slotW) / 2);
      for (let i = 0; i < count; i++) slotsOf.push({ x: x0 + i * slotW + Math.round((slotW - bw) / 2), y: rowY, w: bw, h: bh });
    });
    const snapped = snapGroup(slotsOf, pitch);
    let k = 0;`);

// remove childCells (cells are now the rects themselves) and add settleLayout.
const start = s.indexOf("/**\n * Each child's canvas: its tile's rect grown OUTWARD");
const end = s.indexOf("/**\n * Why this template exists");
if (start < 0 || end < 0) throw new Error("childCells block not found");
s = s.slice(0, start) + `/**
 * The layout on its own lattice: lay out once, find the pitch the parent's
 * placement will use (set by the thin rule and separator, not by the tiles),
 * lay out again snapped to it, and repeat until the pitch holds (one pass in
 * practice). The child refs then land on the lattice with no recovery inset.
 */
export function settleLayout(props: WeeklyRunReportProps, W: number, H: number) {
  const dummy = makeColorTile(INK as MosaicColor) as MosaicSource;
  const pitchOf = (L: ReturnType<typeof layoutWeeklyRunReport>): Pitch => placeInsetPieces({
    rootW: W, rootH: H,
    pieces: [...L.tiles.filter((t) => t.group === undefined).map((t) => t.rect), ...L.cells.filter((c) => c.group === undefined).map((c) => c.rect), ...L.groups.map((g) => g.rect)]
      .map((r) => ({ rect: { ...r, importance: 1 }, source: dummy })),
  }).pitch;
  let pitch: Pitch = { x: 1, y: 1 };
  let L = layoutWeeklyRunReport(props, W, H, pitch);
  for (let pass = 0; pass < 4; pass++) {
    const next = pitchOf(L);
    if (next.x === pitch.x && next.y === pitch.y) break;
    pitch = next;
    L = layoutWeeklyRunReport(props, W, H, pitch);
  }
  return { L, pitch };
}

` + s.slice(end);

// render: use settleLayout; children on the group rects with a background again.
rep(`  const L = layoutWeeklyRunReport(props, W, H);
  type Pieces`, `  const { L } = settleLayout(props, W, H);
  type Pieces`);
rep(`  const cells = childCells(L, W, H);
  const groupOf = new Map(L.groups.map((g) => [g.key, { g, cell: cells.get(g.key)!, pieces: [] as Pieces }]));`,
`  const groupOf = new Map(L.groups.map((g) => [g.key, { g, cell: g.rect, pieces: [] as Pieces }]));`);
rep(`    // A transparent base: the cell is a little larger than the tile, and what shows
    // around it (and behind the rounded corners) is whatever the parent drew there.
    const base = tag({ type: "lavfi", color: "black@0" } as unknown as MosaicSource, "cell-base");
    const placedChild = placeInsetPieces({ rootW: cell.w, rootH: cell.h, pieces: [{ rect: { x: 0, y: 0, w: cell.w, h: cell.h, importance: 0 }, source: base }, ...own] });`,
`    const placedChild = placeInsetPieces({ rootW: cell.w, rootH: cell.h, pieces: own });`);
rep(`      durationMs: 2000,
      sources: placedChild.sources,
      editor: { label: g.key },`,
`      durationMs: 2000,
      // The child's own canvas shows behind the rounded corners: the page, or the band's white.
      backgroundColor: (g.label === "badge" ? TILE : PAPER) as MosaicColor,
      sources: placedChild.sources,
      editor: { label: g.key },`);
fs.writeFileSync(p, s);
console.log("ok");
