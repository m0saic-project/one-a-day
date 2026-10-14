import type { MosaicColor, MosaicDocument, MosaicEngineContext, MosaicSource } from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import { bindProp, bindPropPath, defineMosaicTemplate, definePropsSchema, makeColorTile, placeInsetPieces, tag } from "@m0saic/template-utils";
import type { LayoutConstraint, RelationalConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/gaming/tenxten-challenge-card/v1` - the yearly 10x10 board game
 * challenge as one progress card: the list as a pip grid (one row per game,
 * `goal` pips per row, the first `plays` of them filled), the plays total,
 * the games-done count and the year pace as three tiles above it, and the
 * computed-from footnote under it.
 *
 * ONE CONCEPT: the challenge's own arithmetic is never typed. The "10 x 10"
 * headline (games x goal), the "81 / 100" plays tile, the "6 / 10" done tile
 * and the pace tile (pace = games x goal x dayOfYear / 365) all fall out of
 * `games`, `goal` and `dayOfYear` - day-022's "the card cannot disagree with
 * itself", with the pip lattice as the hero. `dayOfYear` is a prop, not a
 * clock, so the card is deterministic. The row anatomy (label | track |
 * count) is day-023's climbing send pyramid's, but the track is a discrete
 * tally lattice - exactly `goal` cells, fill = plays, a row completes.
 *
 * The rule that bites: the pip lattice is ONE integer lattice,
 * X_k = round(x0 + k * pitch), that every layer reads - the filled-pip mask,
 * the empty-pip mask, the row lines, the test. Compute a layer from its own
 * rounding and the pips drift a pixel per column. And the accent is pip ink
 * only: 3:1 against the page is not the 4.5:1 copy needs, so it never
 * colours text - the ahead-of-pace accent is a bar under the pace tile.
 */

export type TenxtenGame = { name: string; plays: number };

export type TenxtenChallengeCardProps = {
  /** The challenger's handle, the header's right side. "" removes it. */
  challenger?: string;
  /** The challenge year - the wordmark's tail. */
  year?: number;
  /** The challenge list: each game and its plays logged this year. The template does not read BGG. */
  games?: TenxtenGame[];
  /** Plays that complete a game - the pips per row. 5 makes an honest 10x5. */
  goal?: number;
  /** The day of the year the card is for - drives the pace tile. A prop, not a clock. */
  dayOfYear?: number;
  /** Filled-pip ink and the ahead-of-pace bar, as #rrggbb. Never text ink. */
  accent?: string;
  /** Page and ink. */
  preset?: "dark" | "light";
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/gaming/tenxten-challenge-card/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
const THEMES = {
  dark: { bg: "#1c2833", ink: "#eaeef2", dim: "#9aa7b4", track: "#2b3947" },
  light: { bg: "#f6f1e7", ink: "#1c1914", dim: "#6e6758", track: "#ddd4be" },
} as const;

// An invented challenger's invented October: six games done, an 8-6-4-3 tail,
// 81 of 100 plays at day 287 - two ahead of pace. Real games, invented counts.
const DEFAULT_GAMES: TenxtenGame[] = [
  { name: "Pandemic Legacy S1", plays: 10 },
  { name: "Brass Birmingham", plays: 10 },
  { name: "Wingspan", plays: 10 },
  { name: "Spirit Island", plays: 10 },
  { name: "7 Wonders Duel", plays: 10 },
  { name: "Azul", plays: 10 },
  { name: "Everdell", plays: 8 },
  { name: "The Crew", plays: 6 },
  { name: "Scythe", plays: 4 },
  { name: "Lost Ruins of Arnak", plays: 3 },
];

const DEFAULTS = {
  challenger: "@cardboard_kim",
  year: 2026,
  games: DEFAULT_GAMES,
  goal: 10,
  dayOfYear: 287,
  accent: "#c94f3d",
  preset: "light" as "dark" | "light",
  debugLayout: false,
};

const propsSchema = definePropsSchema<TenxtenChallengeCardProps>({
  challenger: {
    type: "string",
    required: false,
    description: "The challenger's handle, the header's right side, up to 32 printable ASCII characters. Empty removes it. The sample handle is invented.",
    meta: { control: { placeholder: DEFAULTS.challenger }, ui: { label: "Challenger", order: 1 } },
  },
  year: {
    type: "number",
    required: false,
    description: "The challenge year, 1900 to 2999 - the wordmark's tail.",
    meta: { constraints: { min: 1900, max: 2999 }, ui: { label: "Year", order: 2 } },
  },
  games: {
    type: "list",
    required: false,
    description:
      "The challenge list, 1 to 10 games, each with the game's name (up to 40 printable ASCII characters) and its plays logged this year (0 to 99 - may pass the goal; the pips clamp at goal and the count tells). The grid, the headline, the totals and the pace are all computed from this list. The template does not read BGG - paste the counts from the play log you can already see. The sample list is invented.",
    meta: { constraints: { minItems: 1, maxItems: 10 }, ui: { label: "Games", order: 3, primary: true } },
    fields: {
      name: { type: "string", required: true, description: "The game's name, 1 to 40 printable ASCII characters - the row's label.", meta: { ui: { label: "Game" } } },
      plays: { type: "number", required: true, description: "Plays logged this year, an integer 0 to 99. The first min(plays, goal) pips of the row fill in.", meta: { ui: { label: "Plays" } } },
    },
  },
  goal: {
    type: "number",
    required: false,
    description: "The plays that complete a game - the pips per row and the headline's second number. 1 to 10; 5 makes an honest 10x5, and every total follows it.",
    meta: { constraints: { min: 1, max: 10 }, ui: { label: "Goal (plays per game)", order: 4 } },
  },
  dayOfYear: {
    type: "number",
    required: false,
    description: "The day of the year the card is for, 1 to 366. Drives the pace tile: pace = games x goal x dayOfYear / 365, then ahead / on pace / behind. A prop, not a clock, so the card stays deterministic.",
    meta: { constraints: { min: 1, max: 366 }, ui: { label: "Day of year", order: 5 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "The filled pips and the ahead-of-pace bar, as #rrggbb. Must clear 3:1 against the page; never used as text ink.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULTS.accent }, ui: { label: "Accent", order: 6 } },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Page and ink: "light" (the paper fridge chart, default) or "dark" (the forum card).',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 7 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the tiles are one size, the rows keep their band) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/* ── the arithmetic: pure, exported, and what the test asserts ── */

function fail(field: string, rule: string): never { throw new Error(`${ID}: ${field} ${rule}`); }

/** Printable ASCII only - the bundled glyph font and the why-copy rule. */
const DRAWN = /^[\x20-\x7e]*$/;
function text(value: unknown, field: string, max: number, allowEmpty = false): string {
  if (typeof value !== "string") fail(field, "must be a string.");
  if (!DRAWN.test(value)) fail(field, `${JSON.stringify(value)} has a character the bundled font is not known to draw: use printable ASCII.`);
  const s = value.trim().replace(/\s+/g, " ");
  if (s.length > max) fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
  if (!allowEmpty && s.length === 0) fail(field, "is empty.");
  return s;
}
function int(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) fail(field, `${JSON.stringify(value)} is not an integer.`);
  if (value < min || value > max) fail(field, `${value} is outside ${min} to ${max}.`);
  return value;
}

/** WCAG contrast ratio of two #rrggbb colours. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export type TenxtenCard = ReturnType<typeof normalizeTenxten>;

/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export function normalizeTenxten(props: TenxtenChallengeCardProps) {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) };
  const challenger = text(p.challenger, "challenger", 32, true);
  const year = int(p.year, "year", 1900, 2999);
  const goal = int(p.goal, "goal", 1, 10);
  const dayOfYear = int(p.dayOfYear, "dayOfYear", 1, 366);
  if (p.preset !== "dark" && p.preset !== "light") fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
  if (typeof p.accent !== "string" || !HEX.test(p.accent.trim())) fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");
  if (!Array.isArray(p.games)) fail("games", "must be a list of { name, plays } entries.");
  if (p.games.length < 1 || p.games.length > 10) fail("games", `has ${p.games.length} entries; the challenge is 1 to 10 games.`);
  const games = p.games.map((g, i) => {
    if (typeof g !== "object" || g === null) fail(`games[${i}]`, "must be { name, plays }.");
    const name = text((g as TenxtenGame).name, `games[${i}].name`, 40);
    const plays = int((g as TenxtenGame).plays, `games[${i}].plays`, 0, 99);
    return { name, plays };
  });

  const accent = p.accent.trim().toLowerCase();
  const pipRatio = contrast(accent, THEMES[p.preset].bg);
  if (pipRatio < 3) fail("accent", `${accent} is ${pipRatio.toFixed(1)}:1 against the ${p.preset} page; pip ink needs 3:1 - pick a stronger colour.`);

  const n = games.length;
  const target = n * goal;
  const playsTotal = games.reduce((s, g) => s + g.plays, 0);
  const done = games.filter((g) => g.plays >= goal).length;
  const pace = (target * dayOfYear) / 365;
  const delta = playsTotal - pace;
  const ahead = delta >= 0.5;
  const paceText = Math.abs(delta) < 0.5 ? "on pace" : `${Math.round(Math.abs(delta))} ${ahead ? "ahead" : "behind"}`;

  return {
    challenger, year, games, goal, dayOfYear, n, target, playsTotal, done, pace, delta, ahead, paceText,
    headline: `${n} x ${goal} CHALLENGE`,
    playsText: `${playsTotal} / ${target}`,
    doneText: `${done} / ${n}`,
    footnote: `Plays, games done and pace computed from the list - pace = ${target} plays x day ${dayOfYear}/365. Sample challenger, list and counts invented.`,
    accent: accent as MosaicColor,
    preset: p.preset as "dark" | "light",
    debugLayout: p.debugLayout,
  };
}

/* ── geometry ── */

export type TenxtenRect = { x: number; y: number; w: number; h: number };
type Bind = { prop: "challenger" | "year" } | { row: number; field: "name" | "plays" } | null;
type Cell = { label: string; rect: TenxtenRect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; bind: Bind; field?: string };
type Tile = { label: string; rect: TenxtenRect; color: MosaicColor; radius: number; bind: "accent" | null };
/** One pip of the lattice, as the test reads it: row, column, pixel square, filled. */
export type TenxtenPip = { row: number; k: number; x: number; y: number; side: number; filled: boolean };

/** The largest whole size up to `maxPx` at which one line fits the cell's budget (`cell * 0.94 - 2px`). */
function fitPx(line: string, cellW: number, maxPx: number, bold: boolean): number {
  const top = Math.max(1, Math.round(maxPx));
  const room = budget(cellW), w = widthOf(line, top, bold);
  let px = w <= room ? top : Math.max(1, Math.floor((top * room) / w));
  while (px > 1 && widthOf(line, px, bold) > room) px--;
  return px;
}

/** A snug cell that always satisfies the contract's budget: cell * 0.94 - 2px >= measured. */
const snugW = (t: string, px: number, bold: boolean) => Math.ceil((widthOf(t, px, bold) + 2) / 0.94);

// Not exported: the pack index is `export *`, and every card carries one of these.
function mix(a: string, b: string, t: number): MosaicColor {
  const ch = (s: string, i: number) => parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * Math.max(0, Math.min(1, t))));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}` as MosaicColor;
}

/**
 * Every rect of the card for one canvas, top to bottom: the wordmark band,
 * three stat tiles, the pip grid (one row per game: name | track | count),
 * the footnote. Pure: same props and canvas, same rects.
 */
export function layoutTenxtenCard(props: TenxtenChallengeCardProps, W: number, H: number) {
  const p = normalizeTenxten(props);
  const theme = THEMES[p.preset];
  const ink = theme.ink as MosaicColor, dim = theme.dim as MosaicColor;
  const S = Math.min(W, H);
  const m = Math.round(S * 0.045), CW = W - 2 * m;
  const gap = Math.round(S * 0.014), secGap = Math.round(S * 0.03);
  const floor = Math.max(6, Math.round(S * 0.017)), small = Math.max(5, Math.round(S * 0.013));
  const aspect = W / H;
  // Portrait widens the name cell; square sits between.
  const nameFrac = aspect >= 1.25 ? 0.28 : aspect <= 0.8 ? 0.42 : 0.34;
  const cells: Cell[] = [];
  const tiles: Tile[] = [];
  const unfit = (field: string): never => fail(field, `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
  const line = (label: string, rect: TenxtenRect, value: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; bind?: Bind; field?: string; floorPx?: number } = {}) => {
    if (px < (o.floorPx ?? floor)) unfit(o.field ?? label);
    cells.push({ label, rect, text: value, px, width: widthOf(value, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? ink, bind: o.bind ?? null, ...(o.field ? { field: o.field } : {}) });
  };

  /* ── header: the derived wordmark left, the challenger's handle right ── */
  let y = m;
  const handlePx = p.challenger !== "" ? fitPx(p.challenger, CW * 0.35, S * 0.03, false) : 0;
  if (p.challenger !== "" && handlePx < small) unfit("challenger");
  const handleW = p.challenger !== "" ? snugW(p.challenger, handlePx, false) : 0;
  const markMax = CW - handleW - (handleW > 0 ? gap : 0);
  const yearText = `- ${p.year}`;
  const pairW = (px: number) => widthOf(p.headline, px, true) + Math.round(px * 0.2) + widthOf(yearText, px, false);
  let markPx = Math.round(S * 0.05);
  while (markPx > small && pairW(markPx) > budget(markMax)) markPx--;
  if (markPx < small) unfit("the headline");
  const markW = snugW(p.headline, markPx, true);
  const markH = Math.round(markPx * 1.3);
  line("mark", { x: m, y, w: markW, h: markH }, p.headline, markPx, { bold: true, floorPx: small });
  line("year", { x: m + markW + Math.round(markPx * 0.2), y, w: snugW(yearText, markPx, false), h: markH }, yearText, markPx, { color: dim, bind: { prop: "year" }, floorPx: small });
  if (p.challenger !== "") {
    const handleH = Math.round(handlePx * 1.35);
    line("handle", { x: W - m - handleW, y: y + Math.round((markH - handleH) / 2), w: handleW, h: handleH }, p.challenger, handlePx, { color: dim, align: "right", bind: { prop: "challenger" }, floorPx: small });
  }
  y += markH;

  /* ── the three computed stat tiles, one row, one size ── */
  // The tile band is at least 15% of card height: on a portrait canvas the
  // S-sized header would otherwise pull the tiles above the promised band.
  const tilesY = Math.max(y + secGap, Math.round(0.15 * H));
  const tileH = Math.round(S * 0.135);
  const tileGap = Math.round(S * 0.02);
  const tileW = Math.floor((CW - 2 * tileGap) / 3);
  const STATS = [
    { value: p.playsText, label: "plays logged" },
    { value: p.doneText, label: "games done" },
    { value: p.paceText, label: "of year pace" },
  ];
  STATS.forEach((st, i) => {
    const rect: TenxtenRect = { x: m + i * (tileW + tileGap), y: tilesY, w: tileW, h: tileH };
    tiles.push({ label: `tile-${i}`, rect, color: mix(theme.bg, theme.ink, 0.08), radius: 0.06, bind: null });
    const valuePx = fitPx(st.value, tileW * 0.88, tileH * 0.42, true);
    line(`tile-value-${i}`, { x: rect.x, y: rect.y + Math.round(tileH * 0.09), w: tileW, h: Math.round(valuePx * 1.25) }, st.value, valuePx, { bold: true, align: "center" });
    const labelPx = fitPx(st.label, tileW * 0.88, tileH * 0.2, false);
    const labelH = Math.round(labelPx * 1.35);
    line(`tile-label-${i}`, { x: rect.x, y: rect.y + tileH - Math.round(tileH * 0.09) - labelH, w: tileW, h: labelH }, st.label, labelPx, { color: dim, align: "center", floorPx: small });
  });
  const tilesBottom = tilesY + tileH;
  // Ahead of pace: an accent bar on the page under the pace tile - pip ink
  // rules, never coloured copy (the header comment's rule).
  let barExtra = 0;
  if (p.ahead) {
    const barH = Math.max(2, Math.round(tileH * 0.07));
    const barY = tilesBottom + Math.round(S * 0.007);
    tiles.push({ label: "pace-mark", rect: { x: m + 2 * (tileW + tileGap), y: barY, w: tileW, h: barH }, color: p.accent, radius: 0.5, bind: "accent" });
    barExtra = barH + Math.round(S * 0.007);
  }

  /* ── footnote, pinned to the bottom, then the grid band between ── */
  const footPx = fitPx(p.footnote, CW, S * 0.02, false);
  if (footPx < small) unfit("the footnote");
  const footH = Math.round(footPx * 1.35);
  line("footnote", { x: m, y: H - m - footH, w: CW, h: footH }, p.footnote, footPx, { color: dim, floorPx: small });
  const footnoteTop = H - m - footH;

  // The grid band keeps its promise structurally: the rows live inside
  // [0.30, 0.94] of card height (the contract's band), whatever the aspect -
  // a portrait canvas with wide pips (goal 5) would otherwise fill the band
  // from the stat tiles down and escape it.
  const gridTop = Math.max(tilesBottom + barExtra + secGap, Math.ceil(0.31 * H));
  const gridBottom = Math.min(footnoteTop - secGap, Math.floor(0.935 * H));
  const bandH = gridBottom - gridTop;
  const rows = p.n;
  const nameW = Math.round(nameFrac * CW);
  const countW = Math.round(0.16 * CW);
  const trackX = m + nameW + gap;
  const trackW = Math.max(8, CW - nameW - countW - 2 * gap);
  const pitch = trackW / p.goal;
  // Rows fill the band but stay proportional to the pip pitch, so a portrait
  // canvas centres a breathing grid instead of stretching names past pips.
  const rowPitch = Math.min(bandH / rows, Math.round(pitch * 1.9));
  if (rowPitch < 8) unfit("the game rows");
  const rowTop = gridTop + (bandH - rows * rowPitch) / 2;
  const pipSide = Math.max(1, Math.round(0.72 * Math.min(pitch, rowPitch)));
  const insetX = Math.round((pitch - pipSide) / 2);
  const insetY = Math.round((rowPitch - pipSide) / 2);

  // THE lattice: X_k = round(x0 + k * pitch), Y_r = round(y0 + r * rowPitch) -
  // the pip masks, the row cells and the test all read these lines.
  const X = Array.from({ length: p.goal }, (_, k) => Math.round(trackX + k * pitch) + insetX);
  const Y = Array.from({ length: rows }, (_, r) => Math.round(rowTop + r * rowPitch) + insetY);
  const pips: TenxtenPip[] = [];
  p.games.forEach((g, r) => {
    const filled = Math.min(g.plays, p.goal);
    for (let k = 0; k < p.goal; k++) pips.push({ row: r, k, x: X[k], y: Y[r], side: pipSide, filled: k < filled });
  });

  /* ── row texts: names one shared size, counts one shared size ── */
  const capRow = rowPitch * 0.52;
  const nameFits = p.games.map((g) => fitPx(g.name, nameW, capRow, false));
  const namePx = Math.min(...nameFits);
  if (namePx < small) unfit(`games[${nameFits.indexOf(namePx)}].name`);
  const nameH = Math.round(namePx * 1.35);
  const countFits = p.games.map((g) => fitPx(String(g.plays), countW, capRow, true));
  const countPx = Math.min(...countFits);
  if (countPx < small) unfit("the counts");
  const countH = Math.round(countPx * 1.35);
  p.games.forEach((g, r) => {
    const rowY = Math.round(rowTop + r * rowPitch);
    line(`game-name-${r}`, { x: m, y: rowY + Math.round((rowPitch - nameH) / 2), w: nameW, h: nameH }, g.name, namePx, { bind: { row: r, field: "name" }, field: `games[${r}].name`, floorPx: small });
    line(`game-count-${r}`, { x: W - m - countW, y: rowY + Math.round((rowPitch - countH) / 2), w: countW, h: countH }, String(g.plays), countPx, { bold: true, align: "right", bind: { row: r, field: "plays" }, field: `games[${r}].plays`, floorPx: small });
  });

  /* ── the pip lattice as two masked colour tiles, not 100 pieces ── */
  const maskTop = Math.round(rowTop);
  const maskRect: TenxtenRect = { x: trackX, y: maskTop, w: trackW, h: Math.round(rowTop + rows * rowPitch) - maskTop };
  const pipPath = (q: TenxtenPip) => `M${q.x - trackX} ${q.y - maskTop}h${q.side}v${q.side}h-${q.side}z`;
  const filledPath = pips.filter((q) => q.filled).map(pipPath).join("");
  const emptyPath = pips.filter((q) => !q.filled).map(pipPath).join("");

  return { p, theme, m, CW, gap, secGap, floor, small, cells, tiles, pips, pipSide, pitch, rowPitch, trackX, trackW, maskRect, filledPath, emptyPath, tilesY, tileW, tileH, nameW, countW, rowTop };
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY: WhySpec = {
  "day": 25,
  "date": "2026-10-14",
  "agent": "opencode",
  "model": "glm-5.3",
  "id": "@one-a-day/gaming/tenxten-challenge-card/v1",
  "title": "10x10 Challenge Card",
  "who": "Board gamers running the yearly 10x10 challenge (BGG forums, geeklists, the challenge guild) who log plays on BGG or BG Stats and post progress updates",
  "problem": [
    "The 10x10 challenge - \"pick 10 games at the start of the year and play each one 10 times before the year ends, for 100 total plays\" - \"runs on the honor system tracked by each player themselves\", and it recurs: a January list post, \"regular updates throughout the year on my progress\", a December badge.",
    "That progress artifact is still made by hand: a chart \"to keep on the fridge and color in every time we played a game on the list\", a Google Sheet, or a $35 wood board - \"move the meeples along the track to mark each game played\". The counts already sit in BGG play logs and BG Stats; the picture does not.",
  ],
  "sources": [
    "https://thebrokentoken.com/products/10x10-challenge-board-kit",
    "https://boardgamestash.com/learn/10x10-board-game-challenge",
    "https://leminal.space/post/3028676",
    "https://honestmeeple.co.uk/10x10-challenge-2020",
    "https://www.varianthex.com/blog/2020/07/02/10x10x5-challenge-part-one",
    "https://github.com/naxhh/tenXtenTrackerApp",
  ],
  "solution": [
    "Give the list - each game and its plays this year, pasted from the play log you can already see - and get the card: one row per game (name, a track of goal pips with the first plays filled, the count), three stat tiles, and the footnote. The sample challenger and list are invented.",
    "The one decision: the challenge's arithmetic is never typed. The \"10 x 10\" headline, the 81 / 100 plays, 6 / 10 done and pace tiles are computed from the list (pace = games x goal x dayOfYear / 365), and the pip grid is two masked tiles on one integer lattice - a handful of overlays, not 100 pieces.",
  ],
  "usage": {
    "command": "m0saic make @one-a-day/gaming/tenxten-challenge-card/v1 --template-repo . -w 1920 -h 1080 -o tenxten.png",
    "try": [
      "games: the 10-game list with this year's plays, from your BGG play log or the BG Stats challenge page",
      "goal 5 makes an honest 10x5 - every total follows; plays over goal clamp the pips and the count tells",
      "dayOfYear sets the pace tile: 287 on the sample list reads \"2 ahead\"; challenger \"\" removes the handle",
      "preset \"dark\" is the forum card; accent recolours the filled pips (needs 3:1 against the page)",
    ],
  },
  "caveats": [
    "No BGG import: the plays API needs a username and this repo downloads nothing, so counts are typed or pasted from the log you can already see.",
    "Pace assumes a January start (the challenge's own shape); a mid-year start would need its own day offset and would read ahead falsely.",
    "The sample challenger (@cardboard_kim), the ten games and every count are invented, as the schema says; every number on the card agrees with the list.",
  ],
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 482237,
        "calls": 38,
        "tokens": 829298,
        "costUsd": 0.41,
        "tools": "bash 23, websearch 7, read 6"
      },
      {
        "name": "plan",
        "startMs": 482264,
        "durMs": 272003,
        "calls": 16,
        "tokens": 553706,
        "costUsd": 0.36,
        "tools": "read 9, bash 5, edit 1"
      }
    ],
    "costBasis": "reported"
  }
};

/** Props with no rect to bind, and why (m0saic doctor's `bindingsDeclared`). */
const UNBOUND = {
  bindings: {
    unbound: {
      goal: "the pips are holes in one mask path, and every number that shows goal (the headline's second count, the / 100 totals, the done tile) is derived arithmetic; binding would print a composed string into a number prop",
      dayOfYear: "shown only inside the footnote's pace formula and the pace tile, both computed from it; no rect shows the raw figure",
    },
  },
};

export const TenxtenChallengeCardV1 = defineMosaicTemplate<TenxtenChallengeCardProps>({
  id: asTemplateId(ID),
  label: "2026-10-14 · 10x10 Challenge Card",
  version: 1,
  description:
    "The yearly 10x10 board game challenge as a progress card: ten games x ten plays as a pip grid - per-game fill, the plays and games-done totals and the year pace computed from the list, never typed.",
  capabilities: { tier: "core" },
  ...UNBOUND,
  tags: ["gaming", "2026-10-14", "day-025", "board-games", "10x10", "challenge", "progress", "plays", "bgg"],

  outputHints: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Still PNG. The pip grid is the hero on landscape, square and portrait (the name column widens on portrait); pips one size, rows one height. Minimum tested canvas 480x270.",
  },

  propsSchema,
  defaultProps: DEFAULTS,

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default TenxtenChallengeCardV1;

async function render(props: TenxtenChallengeCardProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutTenxtenCard(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];

  // Tiles first (stat tiles, the pace bar), then the pip masks (empty under
  // filled), then text: placeInsetPieces stacks a rect on the first layer it
  // does not collide with, so the two masks over one rect take two layers.
  for (const t of L.tiles) {
    const tile = tag(makeColorTile(t.color, { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } }) as MosaicSource, t.label);
    pieces.push({ rect: { ...t.rect, importance: t.label === "pace-mark" ? 2 : 1 }, source: t.bind === "accent" ? bindProp(tile, "accent") : tile });
  }
  const maskTile = (color: MosaicColor, path: string, label: string, importance: number, bind?: "accent") => {
    const tile = tag(makeColorTile(color, { mask: { kind: "inline-mask", localPath: path, bounds: { x: 0, y: 0, width: L.maskRect.w, height: L.maskRect.h } } }) as MosaicSource, label);
    pieces.push({ rect: { ...L.maskRect, importance }, source: bind ? bindProp(tile, bind) : tile });
  };
  if (L.emptyPath) maskTile(L.theme.track as MosaicColor, L.emptyPath, "pip-empty", 1);
  if (L.filledPath) maskTile(L.p.accent, L.filledPath, "pip-filled", 2, "accent");

  for (const c of L.cells) {
    const cell = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, vAlign: "middle", label: c.label }), c.label);
    // A text rect is BOUND to the prop it shows; a row cell is bound to its
    // field in `games`; derived text (the wordmark, the tiles) stays unbound.
    const source = c.bind === null ? cell : "prop" in c.bind ? bindProp(cell, c.bind.prop) : bindPropPath(cell, "games", [c.bind.row, c.bind.field], c.bind.field === "name" ? "string" : "number");
    pieces.push({ rect: { ...c.rect, importance: 3 }, source });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }

  // What the geometry promises, against the labels: the wordmark band is the
  // top fifth; the three tiles one row of one size inside their band; the
  // pace bar present when ahead; every game row - cells and pip mask alike -
  // inside the grid band; the footnote in the bottom band. Only labels that
  // rendered (an empty challenge list has no filled mask; a behind pace has
  // no bar).
  constraints.push({ label: "mark", within: { yFrac: [0, 0.2] } });
  constraints.push({ label: "year", within: { yFrac: [0, 0.2] } });
  if (L.p.challenger !== "") constraints.push({ label: "handle", within: { yFrac: [0, 0.2] } });
  constraints.push({ label: "tile-0", within: { yFrac: [0.14, 0.36] } });
  constraints.push({ label: "tile-1", within: { yFrac: [0.14, 0.36] } });
  constraints.push({ label: "tile-2", within: { yFrac: [0.14, 0.36] } });
  if (L.p.ahead) constraints.push({ label: "pace-mark" });
  if (L.emptyPath) constraints.push({ label: "pip-empty", within: { yFrac: [0.3, 0.94] } });
  if (L.filledPath) constraints.push({ label: "pip-filled", within: { yFrac: [0.3, 0.94] } });
  for (let r = 0; r < L.p.n; r++) {
    constraints.push({ label: `game-name-${r}`, within: { yFrac: [0.3, 0.94] } });
    constraints.push({ label: `game-count-${r}`, within: { yFrac: [0.3, 0.94] } });
  }
  constraints.push({ label: "footnote", within: { yFrac: [0.9, 1] } });
  const relations: RelationalConstraint[] = [
    { label: ["tile-0", "tile-1", "tile-2"], equal: "size", tolerancePx: 2 },
  ];

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    backgroundColor: L.theme.bg as MosaicColor,
    sources: placed.sources,
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints, relations, debug: props.debugLayout === true });
}
