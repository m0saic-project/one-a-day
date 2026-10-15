import type { MosaicColor, MosaicDocument, MosaicEngineContext, MosaicSource } from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import { bindProp, defineMosaicTemplate, definePropsSchema, makeColorTile, placeInsetPieces, tag } from "@m0saic/template-utils";
import type { LayoutConstraint, RelationalConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, fitLine, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/gaming/osu-scorepost-card/v1` - an osu! result-screen card from
 * the API score object: beatmap header, rank badge, four stat tiles, hit counts
 * and mods. No screenshots, no remote art - the background is generated from a
 * single colour.
 *
 * ONE CONCEPT: a scorepost is a typed score object rendered as a single card.
 * The rank badge, the four stat tiles and the hit-count bar are all driven by
 * props, so one template turns any osu! score into a shareable image.
 *
 * The rule that bites: text has to fit on every aspect (landscape, portrait and
 * square) and on the seven contract canvases down to 480x270. The header bands
 * and tile sizes are fractions of the smaller canvas edge, and every line is
 * measured and shrunk before it is placed - never ellipsis at the floor.
 */

export type OsuScorepostCardProps = {
  /** Small credit line under the title. "" removes it. */
  playerName?: string;
  /** Main header line - the beatmap title. */
  beatmapTitle?: string;
  /** Artist sub-line. */
  beatmapArtist?: string;
  /** Difficulty sub-line. */
  difficulty?: string;
  /** Large grade badge: SS, S, A, B, C or D. */
  rank?: string;
  /** Accuracy stat tile, shown as "98.72%". */
  accuracy?: number;
  /** Max combo stat tile. */
  maxCombo?: number;
  /** Score stat tile, comma-separated. */
  score?: number;
  /** PP stat tile. */
  pp?: number;
  /** Hit counts as "300/100/50/miss" with non-negative integers. */
  hits?: string;
  /** Mod acronyms in the bottom-right; "" removes. */
  mods?: string;
  /** Base colour for the generated background gradient/spots, as #rrggbb. */
  backgroundColor?: string;
  /** "dark" (classic result screen) or "light" (osu!lazer-style). */
  preset?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/gaming/osu-scorepost-card/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
const DRAWN = /^[\x20-\x7e]*$/;
const RANKS = ["SS", "S", "A", "B", "C", "D"] as const;

const RANK_COLORS: Record<string, string> = {
  SS: "#ffd700",
  S:  "#ffb700",
  A:  "#66ccff",
  B:  "#77dd77",
  C:  "#ff9955",
  D:  "#ff6666",
};

const THEMES = {
  dark:  { ink: "#eaeef2", dim: "#9aa7b4", tile: "#3d2b55", spot: 0.10 },
  light: { ink: "#1a1a2e", dim: "#5c6370", tile: "#dde1e7", spot: 0.07 },
} as const;

const DEFAULTS = {
  playerName:     "WhiteCat",
  beatmapTitle:   "Freedom Dive",
  beatmapArtist:  "xi",
  difficulty:     "Another",
  rank:           "S",
  accuracy:       98.72,
  maxCombo:       2385,
  score:          987654321,
  pp:             786,
  hits:           "2000/50/10/5",
  mods:           "HD HR",
  backgroundColor: "#2a1a3e",
  preset:         "dark" as "dark" | "light",
  debugLayout:    false,
};

const propsSchema = definePropsSchema<OsuScorepostCardProps>({
  playerName: {
    type: "string",
    required: false,
    description: "The player's name, a small credit line under the title. Up to 32 printable ASCII characters; empty removes it. The sample name is invented.",
    meta: { control: { placeholder: DEFAULTS.playerName }, ui: { label: "Player name", order: 1 } },
  },
  beatmapTitle: {
    type: "string",
    required: false,
    description: "The beatmap title, the card's main header. Up to 60 printable ASCII characters.",
    meta: { control: { placeholder: DEFAULTS.beatmapTitle }, ui: { label: "Beatmap title", order: 2 } },
  },
  beatmapArtist: {
    type: "string",
    required: false,
    description: "The artist line under the title. Up to 60 printable ASCII characters.",
    meta: { control: { placeholder: DEFAULTS.beatmapArtist }, ui: { label: "Artist", order: 3 } },
  },
  difficulty: {
    type: "string",
    required: false,
    description: "The difficulty line under the artist. Up to 40 printable ASCII characters.",
    meta: { control: { placeholder: DEFAULTS.difficulty }, ui: { label: "Difficulty", order: 4 } },
  },
  rank: {
    type: "string",
    required: false,
    description: 'The large grade badge. One of SS, S, A, B, C or D; each tier gets its own colour.',
    meta: { constraints: { oneOf: [...RANKS] }, ui: { label: "Rank", order: 5 } },
  },
  accuracy: {
    type: "number",
    required: false,
    description: "Accuracy percentage, 0 to 100. Shown as 98.72%.",
    meta: { constraints: { min: 0, max: 100 }, ui: { label: "Accuracy", order: 6 } },
  },
  maxCombo: {
    type: "number",
    required: false,
    description: "Max combo, a non-negative integer. Shown comma-separated if large.",
    meta: { constraints: { min: 0, max: 999999 }, ui: { label: "Max combo", order: 7 } },
  },
  score: {
    type: "number",
    required: false,
    description: "Score, a non-negative integer up to 9,999,999,999. Shown comma-separated.",
    meta: { constraints: { min: 0, max: 9999999999 }, ui: { label: "Score", order: 8 } },
  },
  pp: {
    type: "number",
    required: false,
    description: "Performance points, 0 to 9999. Shown as 786.",
    meta: { constraints: { min: 0, max: 9999 }, ui: { label: "PP", order: 9 } },
  },
  hits: {
    type: "string",
    required: false,
    description: 'Hit counts as "300/100/50/miss" with non-negative integers. Parsed and validated.',
    meta: { control: { placeholder: DEFAULTS.hits }, ui: { label: "Hits", order: 10 } },
  },
  mods: {
    type: "string",
    required: false,
    description: "Mod acronyms in the bottom-right, e.g. HD HR. Up to 40 printable ASCII characters; empty removes them.",
    meta: { control: { placeholder: DEFAULTS.mods }, ui: { label: "Mods", order: 11 } },
  },
  backgroundColor: {
    type: "string",
    required: false,
    description: "Base colour for the generated background gradient and spots, as #rrggbb. No remote beatmap art is fetched.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULTS.backgroundColor }, ui: { label: "Background colour", order: 12 } },
  },
  preset: {
    type: "string",
    required: false,
    description: '"dark" (classic result screen) or "light" (osu!lazer-style).',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 13 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the rank keeps its square, the tiles stay equal) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

function fail(field: string, rule: string): never { throw new Error(`${ID}: ${field} ${rule}`); }

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

function mix(a: string, b: string, t: number): MosaicColor {
  const ch = (s: string, i: number) => parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * Math.max(0, Math.min(1, t))));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}` as MosaicColor;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export type OsuScorepostCard = ReturnType<typeof normalizeOsuScorepost>;

export function normalizeOsuScorepost(props: OsuScorepostCardProps) {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) };
  const playerName    = text(p.playerName,    "playerName",    32, true);
  const beatmapTitle  = text(p.beatmapTitle,  "beatmapTitle",  60);
  const beatmapArtist = text(p.beatmapArtist, "beatmapArtist", 60);
  const difficulty    = text(p.difficulty,    "difficulty",    40);
  const rank          = text(p.rank,          "rank",          2);
  const mods          = text(p.mods,          "mods",          40, true);
  const hitsStr       = text(p.hits,          "hits",          40);
  const backgroundColor = typeof p.backgroundColor === "string" && HEX.test(p.backgroundColor.trim()) ? p.backgroundColor.trim().toLowerCase() : fail("backgroundColor", `${JSON.stringify(p.backgroundColor)} must be #rrggbb.`);

  if (!RANKS.includes(rank as typeof RANKS[number])) fail("rank", `${JSON.stringify(rank)} must be one of ${RANKS.join(", ")}.`);
  if (p.preset !== "dark" && p.preset !== "light") fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
  if (typeof p.accuracy !== "number" || p.accuracy < 0 || p.accuracy > 100) fail("accuracy", `${JSON.stringify(p.accuracy)} must be 0 to 100.`);
  if (typeof p.maxCombo !== "number" || p.maxCombo < 0 || p.maxCombo > 999999) fail("maxCombo", `${JSON.stringify(p.maxCombo)} must be 0 to 999999.`);
  if (typeof p.score !== "number" || p.score < 0 || p.score > 9999999999) fail("score", `${JSON.stringify(p.score)} must be 0 to 9999999999.`);
  if (typeof p.pp !== "number" || p.pp < 0 || p.pp > 9999) fail("pp", `${JSON.stringify(p.pp)} must be 0 to 9999.`);
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");

  const hitParts = hitsStr.split("/");
  if (hitParts.length !== 4) fail("hits", `${JSON.stringify(hitsStr)} must be "300/100/50/miss" with non-negative integers.`);
  const hitCounts = hitParts.map((part, i) => {
    const n = Number(part.trim());
    if (!Number.isInteger(n) || n < 0) fail("hits", `part ${i + 1} of ${JSON.stringify(hitsStr)} is not a non-negative integer.`);
    return n;
  });

  const theme = THEMES[p.preset];
  return {
    playerName,
    beatmapTitle,
    beatmapArtist,
    difficulty,
    rank,
    accuracy:    p.accuracy,
    maxCombo:    Math.round(p.maxCombo),
    score:       Math.round(p.score),
    pp:          Math.round(p.pp),
    hitCounts,
    mods,
    backgroundColor,
    preset:      p.preset as "dark" | "light",
    debugLayout: p.debugLayout,
    theme,
    accuracyText: `${p.accuracy.toFixed(2)}%`,
    comboText:    formatNumber(Math.round(p.maxCombo)),
    scoreText:    formatNumber(Math.round(p.score)),
    ppText:       formatNumber(Math.round(p.pp)),
  };
}

type Rect = { x: number; y: number; w: number; h: number };
type Cell = { label: string; rect: Rect; text: string; px: number; width: number; bold: boolean; align: "left" | "right" | "center"; color: MosaicColor; vAlign?: "top" | "middle" | "bottom"; bind?: string };
type Tile = { label: string; rect: Rect; color: MosaicColor; radius?: number };

function fitPx(line: string, cellW: number, maxPx: number, bold: boolean, minPx: number): number {
  const top = Math.max(1, Math.round(maxPx));
  const room = budget(cellW);
  const w = widthOf(line, top, bold);
  let px = w <= room ? top : Math.max(minPx, Math.floor((top * room) / w));
  while (px > minPx && widthOf(line, px, bold) > room) px--;
  return px;
}

function layoutOsuScorepostCard(props: OsuScorepostCardProps, W: number, H: number) {
  const p = normalizeOsuScorepost(props);
  const S = Math.min(W, H);
  const aspect = W / H;
  const isLandscape = aspect >= 1.2;
  const isPortrait = aspect <= 0.8;
  const m = Math.round(S * 0.045);
  const gap = Math.round(S * 0.018);
  const floor = Math.max(6, Math.round(S * 0.016));
  const small = Math.max(5, Math.round(S * 0.012));
  const ink = p.theme.ink as MosaicColor;
  const dim = p.theme.dim as MosaicColor;
  const tileBg = p.theme.tile as MosaicColor;
  const rankInk = "#1a1a1a" as MosaicColor;

  const cells: Cell[] = [];
  const tiles: Tile[] = [];

  const line = (label: string, rect: Rect, value: string, px: number, o: { bold?: boolean; align?: Cell["align"]; color?: MosaicColor; vAlign?: Cell["vAlign"]; bind?: string; floorPx?: number } = {}) => {
    if (px < (o.floorPx ?? floor)) throw new Error(`${ID}: ${label} cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
    cells.push({ label, rect, text: value, px, width: widthOf(value, px, o.bold === true), bold: o.bold === true, align: o.align ?? "left", color: o.color ?? ink, vAlign: o.vAlign ?? "middle", bind: o.bind });
  };

  // ── generated background: base page + deterministic soft spots ──
  const spotColors = [
    mix(p.backgroundColor, "#ffffff", p.theme.spot),
    mix(p.backgroundColor, "#000000", p.theme.spot),
    mix(p.backgroundColor, "#ffffff", p.theme.spot * 0.6),
  ];
  const spotRects = isPortrait
    ? [{ x: 0.00, y: 0.00, w: 0.70, h: 0.30 }, { x: 0.35, y: 0.55, w: 0.65, h: 0.40 }, { x: 0.00, y: 0.78, w: 0.55, h: 0.22 }]
    : isLandscape
    ? [{ x: 0.00, y: 0.00, w: 0.50, h: 0.35 }, { x: 0.55, y: 0.35, w: 0.45, h: 0.40 }, { x: 0.25, y: 0.68, w: 0.55, h: 0.32 }]
    : [{ x: 0.00, y: 0.00, w: 0.50, h: 0.35 }, { x: 0.50, y: 0.40, w: 0.50, h: 0.40 }, { x: 0.05, y: 0.72, w: 0.55, h: 0.28 }];
  spotRects.forEach((r, i) => {
    tiles.push({ label: `spot-${i}`, rect: { x: Math.round(r.x * W), y: Math.round(r.y * H), w: Math.round(r.w * W), h: Math.round(r.h * H) }, color: spotColors[i] });
  });

  // ── header band (top ~18%, contract yFrac [0, 0.25]) ──
  const headerTop = m;
  const titleW = W - 2 * m;
  const titleMax = S * 0.058;
  const titlePx = fitPx(p.beatmapTitle, titleW, titleMax, true, small);
  const titleH = Math.round(titlePx * 1.30);
  line("title", { x: m, y: headerTop, w: titleW, h: titleH }, p.beatmapTitle, titlePx, { bold: true, align: "left", bind: "beatmapTitle" });

  const artistPx = fitPx(p.beatmapArtist, titleW, S * 0.026, false, small);
  const artistH = Math.round(artistPx * 1.30);
  line("artist", { x: m, y: headerTop + titleH + Math.round(gap * 0.35), w: titleW, h: artistH }, p.beatmapArtist, artistPx, { color: dim, bind: "beatmapArtist" });

  const diffPx = fitPx(p.difficulty, titleW, S * 0.023, false, small);
  const diffH = Math.round(diffPx * 1.30);
  line("difficulty", { x: m, y: headerTop + titleH + artistH + Math.round(gap * 0.5), w: titleW, h: diffH }, p.difficulty, diffPx, { color: dim, bind: "difficulty" });

  let playerY = headerTop + titleH + artistH + diffH + Math.round(gap * 0.6);
  if (p.playerName !== "") {
    const playerPx = fitPx(p.playerName, titleW, S * 0.020, false, small);
    const playerH = Math.round(playerPx * 1.30);
    line("player", { x: m, y: playerY, w: titleW, h: playerH }, `by ${p.playerName}`, playerPx, { color: dim, bind: "playerName", floorPx: small });
    playerY += playerH;
  }
  const headerBottom = Math.min(Math.max(playerY, Math.round(0.15 * H)), Math.round(0.24 * H));

  // ── bottom band (bottom ~18%, contract yFrac [0.78, 1]) ──
  const bottomH = Math.round(0.18 * H);
  const bottomY = H - bottomH - m;
  const bottomW = W - 2 * m;
  const hitsW = Math.floor(bottomW * 0.60);
  const modsW = bottomW - hitsW - gap;
  const hitTileW = Math.floor((hitsW - 3 * gap) / 4);
  const hitTileH = Math.min(Math.round(bottomH * 0.70), Math.round(S * 0.12));
  const hitTop = bottomY + Math.round((bottomH - hitTileH) / 2);
  const HIT_LABELS = [
    { label: "hit-300", name: "300", value: formatNumber(p.hitCounts[0]) },
    { label: "hit-100", name: "100", value: formatNumber(p.hitCounts[1]) },
    { label: "hit-50",  name: "50",  value: formatNumber(p.hitCounts[2]) },
    { label: "hit-miss", name: "MISS", value: formatNumber(p.hitCounts[3]) },
  ];
  HIT_LABELS.forEach((h, i) => {
    const x = m + i * (hitTileW + gap);
    tiles.push({ label: `hit-tile-${i}`, rect: { x, y: hitTop, w: hitTileW, h: hitTileH }, color: tileBg, radius: 0.08 });
    const valuePx = fitPx(h.value, hitTileW * 0.88, hitTileH * 0.38, true, small);
    line(h.label, { x, y: hitTop + Math.round(hitTileH * 0.10), w: hitTileW, h: Math.round(valuePx * 1.25) }, h.value, valuePx, { bold: true, align: "center" });
    const namePx = fitPx(h.name, hitTileW * 0.80, hitTileH * 0.22, false, small);
    line(`${h.label}-name`, { x, y: hitTop + hitTileH - Math.round(hitTileH * 0.10) - Math.round(namePx * 1.25), w: hitTileW, h: Math.round(namePx * 1.25) }, h.name, namePx, { color: dim, align: "center" });
  });

  if (p.mods !== "" && modsW > S * 0.10) {
    const modsPx = fitPx(p.mods, modsW, S * 0.035, true, small);
    const modsH = Math.round(modsPx * 1.35);
    line("mods", { x: W - m - modsW, y: hitTop + Math.round((hitTileH - modsH) / 2), w: modsW, h: modsH }, p.mods, modsPx, { bold: true, align: "right", bind: "mods" });
  }

  // ── middle band: rank badge (yFrac [0.18, 0.75]) + stat tiles (yFrac [0.35, 0.88]) ──
  const rankBandTop = Math.max(headerBottom + gap, Math.ceil(0.18 * H));
  const rankBandBottom = Math.min(bottomY - gap, Math.floor(0.75 * H));
  const statBandTop = Math.max(headerBottom + gap, Math.ceil(0.35 * H));
  const statBandBottom = Math.min(bottomY - gap, Math.floor(0.88 * H));
  const rankBandH = Math.max(1, rankBandBottom - rankBandTop);
  const statBandH = Math.max(1, statBandBottom - statBandTop);

  const stats = [
    { label: "stat-acc",  name: "ACCURACY", value: p.accuracyText },
    { label: "stat-combo", name: "MAX COMBO", value: p.comboText },
    { label: "stat-score", name: "SCORE", value: p.scoreText },
    { label: "stat-pp",   name: "PP", value: p.ppText },
  ];

  let rankRect: Rect;
  let statRects: Rect[];

  if (isLandscape) {
    const rankW = Math.min(Math.round(0.38 * W), rankBandH);
    rankRect = { x: Math.round(m + (0.38 * W - rankW) / 2), y: rankBandTop + Math.round((rankBandH - rankW) / 2), w: rankW, h: rankW };
    const tileW = Math.floor((0.56 * W - gap) / 2);
    const tileH = Math.floor((statBandH - gap) / 2);
    const statX = Math.round(0.44 * W);
    statRects = stats.map((_, i) => ({ x: statX + (i % 2) * (tileW + gap), y: statBandTop + Math.floor(i / 2) * (tileH + gap), w: tileW, h: tileH }));
  } else if (isPortrait) {
    const rankW = Math.min(Math.round(0.42 * W), Math.round(rankBandH * 0.50));
    rankRect = { x: Math.round((W - rankW) / 2), y: rankBandTop, w: rankW, h: rankW };
    const statTop = rankRect.y + rankRect.h + gap;
    const tileW = Math.floor((W - 2 * m - gap) / 2);
    const tileH = Math.max(1, Math.floor((statBandBottom - statTop - gap) / 2));
    statRects = stats.map((_, i) => ({ x: m + (i % 2) * (tileW + gap), y: statTop + Math.floor(i / 2) * (tileH + gap), w: tileW, h: tileH }));
  } else {
    const rankW = Math.min(Math.round(0.30 * W), Math.round(rankBandH * 0.45));
    rankRect = { x: Math.round((W - rankW) / 2), y: rankBandTop, w: rankW, h: rankW };
    const statTop = rankRect.y + rankRect.h + gap;
    const tileW = Math.floor((W - 2 * m - 3 * gap) / 4);
    const tileH = Math.min(Math.max(1, Math.round((statBandBottom - statTop) * 0.40)), Math.round(S * 0.11));
    statRects = stats.map((_, i) => ({ x: m + i * (tileW + gap), y: statTop, w: tileW, h: tileH }));
  }

  tiles.push({ label: "rank-badge", rect: rankRect, color: RANK_COLORS[p.rank] as MosaicColor, radius: 0.06 });
  const rankPx = fitPx(p.rank, rankRect.w * 0.72, rankRect.h * 0.55, true, small);
  line("rank", { x: rankRect.x + Math.round(rankRect.w * 0.14), y: rankRect.y + Math.round((rankRect.h - rankPx * 1.2) / 2), w: Math.round(rankRect.w * 0.72), h: Math.round(rankPx * 1.2) }, p.rank, rankPx, { bold: true, align: "center", color: rankInk });

  stats.forEach((s, i) => {
    const r = statRects[i];
    tiles.push({ label: `stat-tile-${i}`, rect: r, color: tileBg, radius: 0.06 });
    const valuePx = fitPx(s.value, r.w * 0.88, r.h * 0.42, true, small);
    line(s.label, { x: r.x, y: r.y + Math.round(r.h * 0.10), w: r.w, h: Math.round(valuePx * 1.25) }, s.value, valuePx, { bold: true, align: "center" });
    const namePx = fitPx(s.name, r.w * 0.85, r.h * 0.20, false, small);
    line(`${s.label}-name`, { x: r.x, y: r.y + r.h - Math.round(r.h * 0.10) - Math.round(namePx * 1.25), w: r.w, h: Math.round(namePx * 1.25) }, s.name, namePx, { color: dim, align: "center" });
  });

  return { p, W, H, m, gap, floor, small, ink, dim, tileBg, cells, tiles, rankRect, statRects, headerBottom, bottomY, bottomH, hitTileW, hitTileH, hitTop };
}

const WHY: WhySpec = {
  "day": 26,
  "date": "2026-10-15",
  "agent": "opencode",
  "model": "kimi-k2.7-code",
  "id": "@one-a-day/gaming/osu-scorepost-card/v1",
  "title": "osu! Scorepost Card",
  "who": "osu! players on r/osugame and Discord who post score screenshots",
  "problem": [
    "osu! players screenshot their result screen and post it to r/osugame dozens of times a day. The subreddit has its own score submission guidelines, and tools like osu!scorepost and osu-scorepost-generator exist only to turn a score link into a shareable image and post title.",
    "A GitHub discussion asks for Discord score embeds because screenshots are the only easy way to share a play's details, and dynamic osu! stat cards already show the community values rendered stat cards.",
  ],
  "sources": [
    "https://osuscorepost.wesleyxie.com/how_to_use",
    "https://github.com/NoelleTGS/osu-scorepost-generator",
    "https://www.reddit.com/r/osugame/wiki/scoreposting",
    "https://github.com/ppy/osu/discussions/30685",
    "https://github.com/solstice23/osu-stats-signature",
    "https://github.com/saddexed/osu-stats-card",
  ],
  "solution": [
    "Type the score fields from the osu! API - player, beatmap, rank, accuracy, combo, score, pp, hits, mods - and get a result-screen card at any 16:9, 9:16 or 1:1 canvas. The background is generated from one colour, so no remote beatmap art is needed.",
    "The one decision: the layout adapts to the aspect ratio. Landscape splits the card into a rank badge on the left and a 2x2 stat grid on the right; portrait stacks rank above a 2x2 grid; square keeps rank centred with stats in one row. Every text is measured and shrunk, never clipped.",
  ],
  "usage": {
    "command": "m0saic make @one-a-day/gaming/osu-scorepost-card/v1 --template-repo . -w 1920 -h 1080 -o scorepost.png",
    "try": [
      "rank SS gives a gold badge; rank D gives red",
      "hits: 1500/120/30/0 parses as 300/100/50/miss counts",
      "mods: HD DT HR shows the acronyms bottom-right; empty removes them",
      "preset light switches to an osu!lazer-style palette",
    ],
  },
  "caveats": [
    "No remote beatmap art: the background is a generated gradient/spots from backgroundColor only.",
    "Hits must be exactly four non-negative integers separated by /; free-form text is rejected.",
    "The sample score (Freedom Dive by xi, S-rank, 98.72%) is fictional; replace every field with a real score.",
  ],
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 214422,
        "calls": 26,
        "tokens": 680248,
        "costUsd": 0.25,
        "tools": "websearch 16, read 4, webfetch 3",
      },
      {
        "name": "plan",
        "startMs": 214435,
        "durMs": 136367,
        "calls": 10,
        "tokens": 262446,
        "costUsd": 0.1,
        "tools": "read 7, write 3",
      },
    ],
    "costBasis": "reported",
  },
};

export const OsuScorepostCardV1 = defineMosaicTemplate<OsuScorepostCardProps>({
  id: asTemplateId(ID),
  label: "2026-10-15 · osu! Scorepost Card",
  version: 1,
  description:
    "An osu! result-screen card from the API score object: beatmap header, rank badge, four stat tiles, hit counts and mods - rendered for r/osugame or Discord without remote art.",
  capabilities: { tier: "core" },
  tags: ["gaming", "2026-10-15", "day-026", "osu", "scorepost", "rhythm-game", "card"],

  outputHints: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Static PNG. Works at 16:9, 9:16 and 1:1; minimum tested canvas 480x270.",
  },

  propsSchema,
  defaultProps: DEFAULTS,

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default OsuScorepostCardV1;

async function render(props: OsuScorepostCardProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutOsuScorepostCard(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];

  for (const t of L.tiles) {
    const tile = tag(makeColorTile(t.color, { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius ?? 0 } } }) as MosaicSource, t.label);
    pieces.push({ rect: { ...t.rect, importance: 0 }, source: tile });
  }

  for (const c of L.cells) {
    const cell = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, vAlign: c.vAlign ?? "middle", label: c.label }), c.label);
    const source = c.bind ? bindProp(cell, c.bind as keyof OsuScorepostCardProps) : cell;
    pieces.push({ rect: { ...c.rect, importance: 2 }, source });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }

  // Layout contract: every text fits; header in top band; rank badge square in middle band;
  // stat tiles equal size and in middle/bottom band; hit tiles and mods in bottom band.
  constraints.push({ label: "title", within: { yFrac: [0, 0.25] } });
  constraints.push({ label: "artist", within: { yFrac: [0, 0.25] } });
  constraints.push({ label: "difficulty", within: { yFrac: [0, 0.25] } });
  if (L.p.playerName !== "") constraints.push({ label: "player", within: { yFrac: [0, 0.25] } });

  constraints.push({ label: "rank-badge", aspect: 1, aspectTolerance: 0.05, within: { yFrac: [0.18, 0.75] } });
  constraints.push({ label: "rank" });

  for (let i = 0; i < 4; i++) {
    constraints.push({ label: `stat-tile-${i}`, within: { yFrac: [0.35, 0.88] } });
    constraints.push({ label: `stat-acc-name`, within: { yFrac: [0.35, 0.88] } });
  }

  for (let i = 0; i < 4; i++) {
    constraints.push({ label: `hit-tile-${i}`, within: { yFrac: [0.78, 1] } });
    constraints.push({ label: `hit-300-name`, within: { yFrac: [0.78, 1] } });
  }
  if (L.p.mods !== "") constraints.push({ label: "mods", within: { yFrac: [0.78, 1] } });

  const relations: RelationalConstraint[] = [
    { label: ["stat-tile-0", "stat-tile-1", "stat-tile-2", "stat-tile-3"], equal: "size", tolerancePx: 2 },
    { label: ["hit-tile-0", "hit-tile-1", "hit-tile-2", "hit-tile-3"], equal: "size", tolerancePx: 2 },
  ];

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    backgroundColor: L.p.backgroundColor as MosaicColor,
    sources: placed.sources,
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints, relations, debug: props.debugLayout === true });
}
