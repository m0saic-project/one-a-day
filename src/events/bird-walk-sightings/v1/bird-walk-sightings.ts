import type { MosaicColor, MosaicDocument, MosaicEngineContext, MosaicSource } from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import { bindProp, bindPropPath, defineMosaicTemplate, definePropsSchema, makeColorTile, placeInsetPieces, tag } from "@m0saic/template-utils";
import type { LayoutConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * A printable sightings sheet for sanctuary visitors, from one outing's rows.
 * ONE CONCEPT: pagination preserves the checklist instead of summarizing it.
 * The rule that bites: X is observed without a count, never zero. Keep every
 * name/count pair in input order, including duplicates and unidentified taxa.
 * Full names wrap (even unbroken identifiers); no ellipsis or hidden entries.
 */
export type Sighting = { commonName: string; count: number | "X" };
export type BirdWalkSightingsProps = {
  location?: string;
  date?: string;
  time?: string;
  numberOfObservers?: number;
  rows?: Sighting[];
  page?: number;
  sourceLabel?: string;
  debugLayout?: boolean;
};
const ID = "@one-a-day/events/bird-walk-sightings/v1";
const INK = "#202923" as MosaicColor;
const GREEN = "#285540" as MosaicColor;
export const SIGHTINGS_SAMPLE_ROWS: Sighting[] = [
  { commonName: "Mallard", count: 14 },
  { commonName: "Great Blue Heron", count: 1 },
  { commonName: "Red-tailed Hawk", count: 2 },
  { commonName: "Belted Kingfisher", count: 1 },
  { commonName: "Black-capped Chickadee", count: "X" },
  { commonName: "White-breasted Nuthatch", count: 3 },
  { commonName: "American Goldfinch", count: 7 },
  { commonName: "swallow sp.", count: "X" },
];
const DEFAULTS = { location: "Willowmere Demo Sanctuary", date: "2026-09-28", time: "08:00", numberOfObservers: 12, rows: SIGHTINGS_SAMPLE_ROWS, page: 1, sourceLabel: "Fictional example", debugLayout: false };
const propsSchema = definePropsSchema<BirdWalkSightingsProps>({
  location: { type: "string", required: false, description: "Outing location; 1-48 printable ASCII characters.", meta: { ui: { label: "Location", order: 1 } } },
  date: { type: "string", required: false, description: "Valid calendar date as YYYY-MM-DD.", meta: { ui: { label: "Date", order: 2 } } },
  time: { type: "string", required: false, description: "Local start time as HH:MM (24-hour); no timezone conversion.", meta: { ui: { label: "Local time", order: 3 } } },
  numberOfObservers: { type: "number", required: false, description: "Number of observers; integer 1-999.", meta: { constraints: { min: 1, max: 999 }, ui: { label: "Observers", order: 4 } } },
  rows: { type: "json", required: false, description: 'All rows of ONE outing, in order; 1-200 objects with commonName (1-48 ASCII characters) and count (integer 1-999999 or "X"). Normalize CSV numbers before supplying them.', meta: { ui: { label: "Checklist rows", order: 5 } } },
  page: { type: "number", required: false, description: "Selected page, starting at 1; eight entries per page. Render every page before posting the set.", meta: { constraints: { min: 1, max: 25 }, ui: { label: "Page", order: 6 } } },
  sourceLabel: { type: "string", required: false, description: "Attribution or checklist reference; 1-48 printable ASCII characters.", meta: { ui: { label: "Source", order: 7 } } },
  debugLayout: { type: "boolean", required: false, description: "Show the layout contract overlay.", meta: { ui: { label: "Debug layout", order: 99 } } },
});
function fail(field: string, rule: string): never { throw new Error(`${ID}: ${field} ${rule}`); }
function ascii(value: unknown, field: string): string {
  if (typeof value !== "string" || /[^\x20-\x7e]/.test(value)) fail(field, "must contain printable ASCII only.");
  const s = value.trim();
  if (s.length < 1 || s.length > 48) fail(field, "must have 1-48 characters after trimming.");
  return s;
}
function integer(value: unknown, field: string, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > max) fail(field, `must be an integer from 1 to ${max}.`);
  return value;
}
export function normalize(props: BirdWalkSightingsProps) {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) };
  const location = ascii(p.location, "location");
  const sourceLabel = ascii(p.sourceLabel, "sourceLabel");
  if (typeof p.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) fail("date", "must be YYYY-MM-DD.");
  const [year, month, day] = p.date.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) fail("date", "must be a valid calendar date.");
  if (typeof p.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time)) fail("time", "must be local HH:MM in 24-hour time.");
  const numberOfObservers = integer(p.numberOfObservers, "numberOfObservers", 999);
  if (!Array.isArray(p.rows) || p.rows.length < 1 || p.rows.length > 200) fail("rows", "must be an array of 1-200 entries.");
  // Array.from also exposes sparse-array holes to validation.
  const rows = Array.from(p.rows, (row: Sighting, i) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) fail(`rows[${i}]`, "must be an object.");
    return { commonName: ascii(row.commonName, `rows[${i}].commonName`), count: row.count === "X" ? "X" as const : integer(row.count, `rows[${i}].count`, 999999) };
  });
  const pages = Math.ceil(rows.length / 8);
  const page = integer(p.page, "page", pages);
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be boolean.");
  return { ...p, location, sourceLabel, numberOfObservers, rows, pages, page };
}
export type SightingsRect = { x: number; y: number; w: number; h: number };
type Cell = { label: string; rect: SightingsRect; text: string; px: number; width: number; bold: boolean; right: boolean; color: MosaicColor; prop?: keyof BirdWalkSightingsProps; row?: number; field?: "commonName" | "count" };
/** Lossless line breaks: split long tokens without adding a hyphen or deleting glyphs. */
function wrap(text: string, px: number, maxW: number, bold: boolean): string[] {
  const lines: string[] = [];
  let rest = text;
  while (widthOf(rest, px, bold) > maxW) {
    let n = 1;
    while (n < rest.length && widthOf(rest.slice(0, n + 1), px, bold) <= maxW) n++;
    const space = rest.lastIndexOf(" ", n);
    if (space > 0) { lines.push(rest.slice(0, space)); rest = rest.slice(space + 1); }
    else { lines.push(rest.slice(0, n)); rest = rest.slice(n); }
  }
  lines.push(rest);
  return lines;
}
export function layoutSightings(props: BirdWalkSightingsProps, W: number, H: number) {
  const p = normalize(props);
  const S = Math.min(W, H), margin = Math.round(S / 25), U = W - 2 * margin;
  const wide = W / H >= 1.35, slots = wide ? 4 : 8;
  const gutter = wide ? Math.round(S * 0.04) : 0, colW = (U - gutter) / (wide ? 2 : 1);
  const C = Math.max(270, Math.min(S, H * 0.8));
  const minPx = Math.max(8, Math.floor(S * 0.02));
  const cells: Cell[] = [], rules: Array<{ label: string; rect: SightingsRect; color: MosaicColor }> = [];
  const rect = (x: number, y: number, w: number, h: number): SightingsRect => ({ x: Math.round(x), y: Math.round(y), w: Math.round(x + w) - Math.round(x), h: Math.round(y + h) - Math.round(y) });
  function add(label: string, r: SightingsRect, text: string, maxPx: number, lines = 1, extra: Partial<Cell> = {}) {
    const bold = extra.bold === true;
    for (let px = Math.max(minPx, Math.round(maxPx)); px >= minPx; px--) {
      const ls = wrap(text, px, budget(r.w), bold);
      if (ls.length <= lines && ls.length * px * 1.2 <= r.h * 0.94 - 2) {
        const fitted = ls.join("\n");
        cells.push({ label, rect: r, text: fitted, px, width: Math.max(...ls.map(l => widthOf(l, px, bold))), bold: false, right: false, color: INK, ...extra });
        return;
      }
    }
    fail(label, `cannot fit at the ${minPx}px readability floor on ${W}x${H}.`);
  }
  const headingY = margin, locationY = margin + C * 0.055, metaY = margin + C * 0.165;
  add("heading", rect(margin, headingY, U, C * 0.052), "BIRD WALK SIGHTINGS", S * 0.031, 1, { bold: true, color: GREEN });
  add("location", rect(margin, locationY, U, C * 0.105), p.location, C * 0.053, 2, { bold: true, prop: "location" });
  add("date", rect(margin, metaY, U * 0.32, C * 0.05), p.date, S * 0.027, 1, { prop: "date" });
  add("time", rect(margin + U * 0.33, metaY, U * 0.3, C * 0.05), `${p.time} local`, S * 0.027, 1, { prop: "time" });
  add("observers", rect(margin + U * 0.64, metaY, U * 0.36, C * 0.05), `${p.numberOfObservers} observers`, S * 0.027, 1, { prop: "numberOfObservers", right: true });
  const labelY = margin + C * 0.23, labelH = C * 0.05;
  const footerY = H - margin - C * 0.20;
  const listY = labelY + labelH, listEnd = footerY - C * 0.025, rowH = (listEnd - listY) / slots;
  rules.push({ label: "header-rule", rect: rect(margin, labelY - C * 0.012, U, Math.max(1, S * 0.003)), color: GREEN });
  rules.push({ label: "footer-rule", rect: rect(margin, footerY, U, Math.max(1, S * 0.002)), color: GREEN });
  const start = (p.page - 1) * 8, visible = p.rows.slice(start, start + 8);
  for (let c = 0; c < (wide ? 2 : 1); c++) {
    const x = margin + c * (colW + gutter), countW = colW * 0.16, nameW = colW * 0.83;
    add(`column-${c}-name`, rect(x, labelY, nameW, labelH), "Common name", S * 0.026, 1, { bold: true });
    add(`column-${c}-count`, rect(x + colW - countW, labelY, countW, labelH), "Count", S * 0.026, 1, { bold: true, right: true });
    for (let r = 0; r < slots; r++) {
      const i = c * slots + r, entry = visible[i];
      if (!entry) continue;
      const y = listY + r * rowH;
      add(`name-${start + i}`, rect(x, y, nameW, rowH - S * 0.002), entry.commonName, S * 0.037, 3, { prop: "rows", row: start + i, field: "commonName" });
      add(`count-${start + i}`, rect(x + colW - countW, y, countW, rowH - S * 0.002), String(entry.count), S * 0.037, 1, { prop: "rows", row: start + i, field: "count", right: true, bold: true });
      rules.push({ label: `row-rule-${start + i}`, rect: rect(x, y + rowH - S * 0.005, colW, Math.max(1, S * 0.001)), color: "#d5dcd6" as MosaicColor });
    }
  }
  add("source", rect(margin, footerY + C * 0.012, U, C * 0.065), p.sourceLabel, S * 0.027, 2, { prop: "sourceLabel" });
  add("pagination", rect(margin, footerY + C * 0.083, U, C * 0.052), `Page ${p.page} of ${p.pages}  |  Entries ${start + 1}-${start + visible.length} of ${p.rows.length}`, S * 0.027, 1, { prop: "page" });
  add("legend", rect(margin, footerY + C * 0.145, U, C * 0.052), "X = observed, not counted", S * 0.027);
  return { cells, rules, margin, labelY, listY, listEnd, footerY, wide, visible, p };
}

const WHY: WhySpec = {
  "day": 9,
  "date": "2026-09-28",
  "agent": "codex",
  "model": "gpt-6",
  "id": "@one-a-day/events/bird-walk-sightings/v1",
  "title": "Bird Walk Sightings",
  "who": "Sanctuary naturalists and bird-walk leaders using eBird and discussing visitor checklist displays in r/birding.",
  "problem": [
    "\"Our naturalists lead a bird group and make a checklist twice a week.\" A sanctuary volunteer says printing the eBird webpage wastes paper and looks poor. Visitors need a compact, dated sheet.",
    "eBird offers a personal spreadsheet export. Group by Submission ID, then map names, counts and outing metadata to JSON. X means observed without a count."
  ],
  "sources": [
    "https://www.reddit.com/r/birding/comments/1lflgm2/printing_ebird_checklists/",
    "https://support.ebird.org/en/support/solutions/articles/48000838205-download-ebird-data",
    "https://github.com/Sajmani/birdsync",
    "https://support.ebird.org/en/support/solutions/articles/48001201565"
  ],
  "solution": [
    "Eight entries per page, with full names beside their unchanged counts. Wide canvases read down the left column, then the right. Every page discloses its entry range and explains X.",
    "Supply all rows from one outing and render every page before posting the set. Input order, duplicate names and unidentified taxa survive. Defaults are fictional observations."
  ],
  "usage": {
    "command": "m0saic make @one-a-day/events/bird-walk-sightings/v1 --template-repo . -w 1080 -h 1920 -o journal/2026-09-28/sightings.png",
    "try": [
      "rows: normalized commonName and numeric count or uppercase X",
      "page: 2 selects entries 9-16 when present",
      "location, date, time and numberOfObservers: outing metadata",
      "sourceLabel: your checklist reference; render every page"
    ]
  },
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 271668,
        "calls": 20,
        "tokens": 2278712,
        "tools": "shell 11, web_search 8, edit 1"
      },
      {
        "name": "plan",
        "startMs": 271683,
        "durMs": 252729,
        "calls": 15,
        "tokens": 1244217,
        "tools": "shell 13, edit 1, web_search 1"
      },
      {
        "name": "build",
        "startMs": 524434,
        "durMs": 617158,
        "calls": 39,
        "tokens": 5123504,
        "tools": "shell 39"
      },
      {
        "name": "build (2)",
        "startMs": 1141598,
        "durMs": 90617,
        "calls": 7,
        "tokens": 461516,
        "tools": "shell 6, edit 1"
      },
      {
        "name": "build (3)",
        "startMs": 1232219,
        "durMs": 88833,
        "calls": 7,
        "tokens": 519448,
        "tools": "shell 6, edit 1"
      }
    ]
  },
  "caveats": [
    "No CSV importer, account access or completeness verification.",
    "PNG output; paper sizing, DPI and PDF export are outside this template.",
    "Use printable ASCII; names and attribution are limited to 48 characters."
  ]
};

export const BirdWalkSightingsV1 = defineMosaicTemplate<BirdWalkSightingsProps>({
  id: asTemplateId(ID), label: "2026-09-28 · Bird Walk Sightings", version: 1,
  description: "A visitor sightings sheet from one outing's normalized checklist rows: eight entries per page, preserving names, counts and X observations.",
  capabilities: { tier: "core" }, tags: ["events", "2026-09-28", "day-009", "birding", "checklist", "print"],
  outputHints: { width: 1080, height: 1920, fps: 30, durationMs: 2000, format: { kind: "image", container: "png" }, note: "Still PNG. Eight entries per page at portrait, square and landscape; wide canvases read down left, then right. Minimum tested canvas 480x270." },
  propsSchema, defaultProps: DEFAULTS, render, renderTutorial: whyTutorial(WHY, render),
});
export default BirdWalkSightingsV1;
async function render(props: BirdWalkSightingsProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutSightings(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];
  for (const r of L.rules) {
    pieces.push({ rect: { ...r.rect, importance: 1 }, source: tag(makeColorTile(r.color), r.label) });
    constraints.push({ label: r.label, ...(r.label === "footer-rule" ? { within: { yFrac: [0.7, 1] as [number, number] }, minWidthFrac: 0.88 } : {}) });
  }
  for (const c of L.cells) {
    let source: MosaicSource = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.right ? "right" : "left", bold: c.bold, label: c.label }), c.label);
    if (c.row !== undefined && c.field) source = bindPropPath(source, "rows", [c.row, c.field], c.field === "count" && L.p.rows[c.row].count !== "X" ? "number" : "string");
    else if (c.prop) source = bindProp(source, c.prop);
    pieces.push({ rect: { ...c.rect, importance: 2 }, source });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
    const footer = ["source", "pagination", "legend"].includes(c.label);
    const header = ["heading", "location", "date", "time", "observers"].includes(c.label);
    constraints.push({ label: c.label, within: { xFrac: [L.margin / W - 0.004, 1 - L.margin / W + 0.004], yFrac: footer ? [0.7, 1 - L.margin / H + 0.004] : header ? [0, 0.4] : [0, 1] } });
  }
  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces, basis: 90 });
  const doc: MosaicDocument = { kind: "mosaic_document", version: 1, m0: toM0String(placed.m0, ID), assets: {}, size: { width: W, height: H }, backgroundColor: "#ffffff", sources: placed.sources };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints, debug: props.debugLayout === true });
}
