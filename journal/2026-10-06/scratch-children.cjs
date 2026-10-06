// One-off edit script for build call 1: move tiles and badges into child documents.
const fs = require("fs");
const p = "src/community/weekly-run-report/v1/weekly-run-report.ts";
let s = fs.readFileSync(p, "utf8");
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); s = s.replace(a, b); };

rep(`type Cell = { label: string; rect: ReportRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind; over: boolean };
type Tile = { label: string; rect: ReportRect; color: MosaicColor; radius: number; bind?: "accent" | "milestones" };`,
`/** \`group\`: the child document a tile and its text are drawn in (see render). */
type Cell = { label: string; rect: ReportRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind; over: boolean; group?: string };
type Tile = { label: string; rect: ReportRect; color: MosaicColor; radius: number; bind?: "accent" | "milestones"; group?: string };
/** A child document: one tile or badge with its text, on its own small canvas. */
export type ReportGroup = { key: string; label: "hero-tile" | "stat-tile" | "badge"; rect: ReportRect; bg: MosaicColor };

/**
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
}`);

rep(`  const cells: Cell[] = [];
  const tiles: Tile[] = [];
  const line = (label: string, rect: ReportRect, text: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; over?: boolean; field?: string; min?: number } = {}) => {
    if (px < (o.min ?? floor)) unfit(o.field ?? label, o.min ?? floor);
    cells.push({ label, rect, text, px, width: widthOf(text, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? (INK as MosaicColor), bind: o.bind ?? null, over: o.over === true });
  };`,
`  const cells: Cell[] = [];
  const tiles: Tile[] = [];
  const groups: ReportGroup[] = [];
  const line = (label: string, rect: ReportRect, text: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; over?: boolean; field?: string; min?: number; group?: string } = {}) => {
    if (px < (o.min ?? floor)) unfit(o.field ?? label, o.min ?? floor);
    cells.push({ label, rect, text, px, width: widthOf(text, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? (INK as MosaicColor), bind: o.bind ?? null, over: o.over === true, group: o.group });
  };`);

rep(`  const padOf = (r: ReportRect) =>`,
`  // Each tile is a child document, so its sides are 5-smooth (a pixel or two off the slot, centred in it).
  heroRects.splice(0, 2, ...heroRects.map(smoothRect));
  statRects.splice(0, 4, ...statRects.map(smoothRect));
  const padOf = (r: ReportRect) =>`);

rep(`  const tileText = (k: CountKey, r: ReportRect, px: number, lines: readonly string[], reserve: number, color: MosaicColor, label: string) => {
    tiles.push({ label, rect: r, color: TILE as MosaicColor, radius: tileRadius });`,
`  const tileText = (k: CountKey, r: ReportRect, px: number, lines: readonly string[], reserve: number, color: MosaicColor, label: "hero-tile" | "stat-tile") => {
    const group = \`tile-\${k}\`;
    groups.push({ key: group, label, rect: r, bg: PAPER as MosaicColor });
    tiles.push({ label: "tile-fill", rect: r, color: TILE as MosaicColor, radius: tileRadius, group });`);

rep(`bind: { prop: "counts", key: k }, over: true, field: \`counts.\${k}\` });`,
    `bind: { prop: "counts", key: k }, over: true, field: \`counts.\${k}\`, group });`);
rep(`t, labelPx, { align: "center", color: DIM as MosaicColor, over: true, field: "the tile labels" }));`,
    `t, labelPx, { align: "center", color: DIM as MosaicColor, over: true, field: "the tile labels", group }));`);

rep(`      const bw = Math.max(1, Math.min(slotW - Math.max(2, Math.round(gap * 0.6)), Math.round(rowH * 1.7)));
      const bh = Math.max(1, Math.min(rowH, bw));`,
`      // 5-smooth sides: each badge is a child document.
      const bw = smoothDown(Math.max(1, Math.min(slotW - Math.max(2, Math.round(gap * 0.6)), Math.round(rowH * 1.7))));
      const bh = smoothDown(Math.max(1, Math.min(rowH, bw)));`);

rep(`        badges.push({ rect, kind: b.kind });
        tiles.push({ label: "badge", rect, color: fill, radius: badgeRadius });`,
`        const group = \`badge-\${k + 1}\`;
        badges.push({ rect, kind: b.kind });
        groups.push({ key: group, label: "badge", rect, bg: TILE as MosaicColor });
        tiles.push({ label: "badge-fill", rect, color: fill, radius: badgeRadius, group });`);
rep(`String(b.club), badgePx, { bold: true, align: "center", color: ink, over: true, field: "milestones", min: small });`,
    `String(b.club), badgePx, { bold: true, align: "center", color: ink, over: true, field: "milestones", min: small, group });`);
rep(`b.caption, captionPx, { align: "center", color: ink, over: true, field: "milestones", min: small });`,
    `b.caption, captionPx, { align: "center", color: ink, over: true, field: "milestones", min: small, group });`);
rep(`  return { p, shape, floor, small, cells, tiles, heroRects,`, `  return { p, shape, floor, small, cells, tiles, groups, heroRects,`);

rep(`  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];

  for (const t of L.tiles) {
    const tile = tag({ ...makeColorTile(t.color, t.radius > 0 ? { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } } : {}) } as MosaicSource, t.label);
    // The header rule shows \`accent\`; the band is the rect that shows \`milestones\`.
    pieces.push({ rect: { ...t.rect, importance: 1 }, source: t.bind ? bindProp(tile, t.bind) : tile });
  }
  for (const c of L.cells) {
    let cell: MosaicSource = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
    // A text rect is BOUND to the prop it shows; each count to its own key of \`counts\`. Fixed copy is not.
    if (c.bind?.prop === "counts") cell = bindPropPath(cell, "counts", [c.bind.key], "number");
    else if (c.bind) cell = bindProp(cell, c.bind.prop);
    pieces.push({ rect: { ...c.rect, importance: c.over ? 3 : 2 }, source: cell });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }
`,
`  type Pieces = Parameters<typeof placeInsetPieces>[0]["pieces"];
  const pieces: Pieces = [];
  const constraints: LayoutConstraint[] = [];
  // Text over a fill never lowers onto the engine's grid sheet: every such pair
  // is one more link in the overlay chain, and past ~25 the glyph masks degrade
  // silently. So each tile and each badge is a CHILD document (its fill and its
  // text, 3-4 deep), and the parent's pieces barely overlap.
  const groupOf = new Map(L.groups.map((g) => [g.key, { g, pieces: [] as Pieces }]));
  const push = (group: string | undefined, rect: ReportRect, importance: number, source: MosaicSource) => {
    if (group === undefined) { pieces.push({ rect: { ...rect, importance }, source }); return; }
    const owner = groupOf.get(group)!;
    owner.pieces.push({ rect: { ...rect, x: rect.x - owner.g.rect.x, y: rect.y - owner.g.rect.y, importance }, source });
  };

  for (const t of L.tiles) {
    const tile = tag({ ...makeColorTile(t.color, t.radius > 0 ? { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } } : {}) } as MosaicSource, t.label);
    // The header rule shows \`accent\`; the band is the rect that shows \`milestones\`.
    push(t.group, t.rect, 1, t.bind ? bindProp(tile, t.bind) : tile);
  }
  for (const c of L.cells) {
    let cell: MosaicSource = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
    // A text rect is BOUND to the prop it shows; each count to its own key of \`counts\`. Fixed copy is not.
    if (c.bind?.prop === "counts") cell = bindPropPath(cell, "counts", [c.bind.key], "number");
    else if (c.bind) cell = bindProp(cell, c.bind.prop);
    push(c.group, c.rect, c.over ? 3 : 2, cell);
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }
  const children: NonNullable<MosaicDocument["children"]> = {};
  for (const { g, pieces: own } of groupOf.values()) {
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
    pieces.push({ rect: { ...g.rect, importance: 2 }, source: tag({ type: "mosaic", ref: g.key, placement: { fit: "contain" } } as MosaicSource, g.label) });
  }
`);

rep(`    backgroundColor: PAPER as MosaicColor,
    sources: placed.sources,
  };`,
`    backgroundColor: PAPER as MosaicColor,
    sources: placed.sources,
    children,
  };`);
fs.writeFileSync(p, s);
console.log("ok");
