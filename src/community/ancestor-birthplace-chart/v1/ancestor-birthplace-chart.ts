import type {
  MosaicColor,
  MosaicDocument,
  MosaicEngineContext,
  MosaicSource,
} from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import {
  bindProp,
  defineMosaicTemplate,
  definePropsSchema,
  latticeMaxSlots,
  makeColorTile,
  placeInsetPieces,
  resolvePinnedDurationMs,
  tag,
} from "@m0saic/template-utils";
import type { LayoutConstraint, RelationalConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, textCell, widthOf, wrapFit } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/community/ancestor-birthplace-chart/v1` - the #MyColorfulAncestry
 * chart genealogists build by hand in Excel: five generations of ancestors,
 * every cell coloured by where that person was born, with a legend - drawn
 * from pasted rows or from the GEDCOM file every genealogy program exports,
 * as a clip in which the colours land generation by generation.
 *
 * ONE CONCEPT: **the geometry IS the Ahnentafel.** Person n sits level with
 * the union of father 2n (above) and mother 2n+1 (below): one unit of height
 * per generation-5 cell, doubled at every generation to the left, so the
 * tree is exact by construction and never summed from rounded parts. The
 * colour is a lookup from one parsed field of the place (the state inside
 * the home country, the country elsewhere); the legend is the same lookup
 * counted.
 *
 * The motion is data, not keyframes: the clip opens on the finished chart
 * (frame 0 is the picture), resets to blank cells with the names already
 * typed, then lands the colours in Ahnentafel order, generation by
 * generation, and holds the finished chart so it loops. Everything that
 * changes is a gated colour tile in one mask-free child document; every
 * word is static svg text in the bundled font, so there is no drawtext and
 * pixels are the same on every machine.
 *
 * The rule that bites: **text is chosen per column, never per cell.** A
 * generation picks the richest tier (name + year + place, name + year, name,
 * surname, number, nothing) whose font clears the floor for EVERY cell in
 * the column, so one generation never mixes tiers and nothing is ever
 * clipped or ellipsized.
 */

export type AncestryRow = {
  /** Ahnentafel number 1..31 (1 = the root, 2n = father of n, 2n+1 = mother of n). */
  n: number;
  /** The person's name, as it should print (folded to ASCII). */
  name: string;
  /** "", a 3-4 digit year, or "c. 1850". */
  year: string;
  /** GEDCOM PLAC order: smallest place first, country last, comma-separated. */
  place: string;
  /** An explicit colour key; when given it wins over the place. */
  key?: string;
};

export type AncestorBirthplaceChartProps = {
  /** Header title; "" makes it "<ROOT NAME> - ANCESTOR BIRTHPLACES". */
  title?: string;
  /** Rows "n | Name | year | place [| key]": one multi-line string, an array of such strings, or objects. */
  ancestors?: string | Array<string | AncestryRow>;
  /** The text of a GEDCOM 5.5.1 or 7.0 file; when non-empty it replaces `ancestors`. */
  gedcom?: string;
  /** GEDCOM xref of the root person, e.g. "@I12@"; "" means the first INDI. */
  root?: string;
  /** Which event fills the cells: "birth" or "death". */
  event?: string;
  /** How a place becomes a colour key: "state-or-country" or "country". */
  keyBy?: string;
  /** The country whose places key by state (case-insensitive; the usual spellings of the USA fold together). */
  homeCountry?: string;
  /** Per-key #rrggbb overrides, e.g. {"Ohio":"#e3a857"}; "Unknown" and "Other" too. */
  colors?: Record<string, string> | string;
  /** Clip length in whole seconds (4..60). */
  clipSec?: number;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/community/ancestor-birthplace-chart/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
export const ANCESTRY_SLOTS = 31;
const GENERATIONS = 5;
const MAX_KEYS = 9;
const MIN_CLIP_SEC = 4;
const MAX_CLIP_SEC = 60;
const MIN_PX = 7;
const LH = 1.2;
const EVENTS = ["birth", "death"] as const;
const KEY_MODES = ["state-or-country", "country"] as const;

const DEFAULTS = {
  title: "",
  event: "birth",
  keyBy: "state-or-country",
  homeCountry: "USA",
  clipSec: 16,
} as const;

/** Warm paper, near-black ink, pastel fills: the spreadsheet look, lighter. */
const THEME = {
  paper: "#f6f3ec" as MosaicColor,
  ink: "#1f1b16" as MosaicColor,
  light: "#ffffff" as MosaicColor,
  dim: "#6b645a" as MosaicColor,
  blank: "#e9e4da" as MosaicColor,
  headNow: "#f3dfa6" as MosaicColor,
  unknown: "#cdc9c2" as MosaicColor,
};

/** Ten categorical fills, medium lightness, assigned in legend order; every one clears 4.5:1 under the ink. */
export const ANCESTRY_PALETTE: readonly string[] = [
  "#f2c14e", // gold
  "#8fc1e3", // sky
  "#a8d08d", // sage
  "#f4a6a6", // rose
  "#c9b3e6", // lavender
  "#f7b267", // apricot
  "#9fd8cb", // mint
  "#e6c3a5", // sand
  "#d0d68c", // olive
  "#f2a2cc", // pink (also "Other")
];

/** A fictional family, all names invented; 28 of 31 known (23, 30 and 31 left out on purpose). */
export const ANCESTRY_DEFAULT_ROWS = `1 | Clara Whitfield | 1988 | Columbus, Franklin, Ohio, USA
2 | Daniel Whitfield | 1958 | Dayton, Montgomery, Ohio, USA
3 | Laura Brandt | 1960 | Erie, Erie, Pennsylvania, USA
4 | Harold Whitfield | 1929 | Lexington, Fayette, Kentucky, USA
5 | Mae Corrigan | 1932 | Cincinnati, Hamilton, Ohio, USA
6 | Walter Brandt | 1927 | Pittsburgh, Allegheny, Pennsylvania, USA
7 | Signe Lindqvist | 1931 | Jamestown, Chautauqua, New York, USA
8 | Amos Whitfield | 1898 | Harlan, Harlan, Kentucky, USA
9 | Ruth Pennington | 1902 | Abingdon, Washington, Virginia, USA
10 | Patrick Corrigan | 1899 | Skibbereen, Cork, Ireland
11 | Nora Hayes | 1904 | Cincinnati, Hamilton, Ohio, USA
12 | Friedrich Brandt | 1895 | Bremen, Germany
13 | Anna Keller | 1899 | Pittsburgh, Allegheny, Pennsylvania, USA
14 | Nils Lindqvist | 1897 | Vaxjo, Kronoberg, Sweden
15 | Ellen Dahl | 1903 | Jamestown, Chautauqua, New York, USA
16 | Josiah Whitfield | 1866 | Harlan, Harlan, Kentucky, USA
17 | Martha Cole | 1870 | Pineville, Bell, Kentucky, USA
18 | Samuel Pennington | 1871 | Abingdon, Washington, Virginia, USA
19 | Lydia Shaw | 1875 | Bristol, Washington, Virginia, USA
20 | Michael Corrigan | 1868 | Skibbereen, Cork, Ireland
21 | Bridget Walsh | 1872 | Bantry, Cork, Ireland
22 | Thomas Hayes | 1871 | Ennis, Clare, Ireland
24 | Johann Brandt | 1864 | Bremen, Germany
25 | Margarethe Vogel | 1868 | Oldenburg, Germany
26 | Georg Keller | 1866 | Ulm, Wurttemberg, Germany
27 | Mary Ann Fisher | 1870 | Lancaster, Lancaster, Pennsylvania, USA
28 | Anders Lindqvist | 1865 | Vaxjo, Kronoberg, Sweden
29 | Karin Holm | 1869 | Ljungby, Kronoberg, Sweden`;

/* ── text folding ── */

/** Fold to printable ASCII: strip accents, spell out the usual letters, drop the rest, collapse spaces. */
export function ancestryFoldAscii(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/Æ/g, "AE")
    .replace(/æ/g, "ae")
    .replace(/Œ/g, "OE")
    .replace(/œ/g, "oe")
    .replace(/Ø/g, "O")
    .replace(/ø/g, "o")
    .replace(/Ł/g, "L")
    .replace(/ł/g, "l")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d")
    .replace(/Þ/g, "Th")
    .replace(/þ/g, "th")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── colours ── */

function luminance(hex: string): number {
  const c = parseInt(hex.slice(1), 16);
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch((c >> 16) & 255) + 0.7152 * ch((c >> 8) & 255) + 0.0722 * ch(c & 255);
}

/** WCAG contrast ratio between two #rrggbb colours. */
export function ancestryContrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** The ink that reads on a fill: the page ink when it clears 4.5:1, else white. */
function inkFor(fill: string): { color: MosaicColor; light: boolean } {
  return ancestryContrast(fill, THEME.ink) >= 4.5 ? { color: THEME.ink, light: false } : { color: THEME.light, light: true };
}

/* ── the model ── */

export type AncestryPerson = {
  n: number;
  /** 0-based generation: 0 = the root, 4 = the great-great-grandparents. */
  gen: number;
  name: string;
  year: string;
  place: string;
  /** The colour key, or null when the place gives none. */
  key: string | null;
};

export type AncestryLegendEntry = {
  kind: "key" | "other" | "unknown";
  label: string;
  count: number;
  color: MosaicColor;
  /** Ahnentafel numbers, ascending. */
  members: number[];
};

export type AncestryModel = {
  /** Index = Ahnentafel number; [0] unused; null = unknown ancestor. */
  people: Array<AncestryPerson | null>;
  known: number;
  legend: AncestryLegendEntry[];
  /** Legend index by Ahnentafel number. */
  entryOf: number[];
  rootName: string;
  event: "birth" | "death";
};

const USA = new Set(["usa", "us", "u s", "u s a", "united states", "united states of america", "the united states", "america"]);

/** Country spellings fold together: every usual way of writing the USA is "USA". */
function foldCountry(s: string): string {
  const k = s.replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
  return USA.has(k) ? "USA" : s.replace(/\s+/g, " ").trim();
}

/** A place -> its colour key. An explicit key wins; "" or no element -> null (unknown). */
export function ancestryKeyOf(place: string, explicit: string | undefined, keyBy: string, homeCountry: string): string | null {
  if (explicit !== undefined && explicit.trim() !== "") return explicit.trim();
  const parts = place.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  if (parts.length === 0) return null;
  const country = foldCountry(parts[parts.length - 1]);
  if (keyBy === "state-or-country" && parts.length >= 2 && country.toLowerCase() === foldCountry(homeCountry).toLowerCase()) return parts[parts.length - 2];
  return country;
}

function generationOf(n: number): number {
  return Math.floor(Math.log2(n));
}

function parseYear(raw: string, where: string): string {
  const s = raw.trim();
  if (s === "") return "";
  const m = /^(?:(c|ca|abt|about|circa)\.?\s*)?(\d{3,4})$/i.exec(s);
  if (!m) throw new Error(`${ID}: ${where}: year ${JSON.stringify(raw)} must be empty, a 3-4 digit year, or "c. 1850".`);
  return m[1] ? `c. ${m[2]}` : m[2];
}

function rowFromParts(parts: string[], where: string): AncestryRow {
  if (parts.length < 2) throw new Error(`${ID}: ${where}: a row is "n | Name | year | place" (at least the number and the name).`);
  const n = Number(parts[0]);
  if (!Number.isInteger(n) || n < 1 || n > ANCESTRY_SLOTS) throw new Error(`${ID}: ${where}: the Ahnentafel number ${JSON.stringify(parts[0])} must be a whole number 1..${ANCESTRY_SLOTS}.`);
  const name = ancestryFoldAscii(parts[1] ?? "");
  if (name === "") throw new Error(`${ID}: ${where}: the name is empty.`);
  if (name.length > 48) throw new Error(`${ID}: ${where}: the name is ${name.length} characters; at most 48.`);
  const key = parts[4] !== undefined && parts[4].trim() !== "" ? ancestryFoldAscii(parts[4]) : undefined;
  return { n, name, year: parseYear(parts[2] ?? "", where), place: ancestryFoldAscii(parts[3] ?? ""), ...(key !== undefined ? { key } : {}) };
}

/** The `ancestors` prop -> rows. Lines split on "|" or tab; blank lines and "#" lines are skipped; a duplicate n is refused. */
export function ancestryParseRows(value: unknown): AncestryRow[] {
  let v: unknown = value === undefined ? ANCESTRY_DEFAULT_ROWS : value;
  if (typeof v === "string") {
    const text = v.trim();
    if (text.startsWith("[")) {
      try {
        v = JSON.parse(text);
      } catch {
        throw new Error(`${ID}: ancestors looks like JSON but does not parse - pass rows "n | Name | year | place", one per line.`);
      }
    } else {
      v = text.split(/\r?\n/);
    }
  }
  if (!Array.isArray(v)) throw new Error(`${ID}: ancestors must be rows "n | Name | year | place": a multi-line string or an array.`);
  const rows: AncestryRow[] = [];
  const seen = new Map<number, number>();
  v.forEach((item, i) => {
    const where = `ancestors[${i}]`;
    let row: AncestryRow;
    if (typeof item === "string") {
      const line = item.trim();
      if (line === "" || line.startsWith("#")) return;
      row = rowFromParts(line.split(/\t|\|/).map((s) => s.trim()), where);
    } else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const str = (k: string) => (o[k] === undefined || o[k] === null ? "" : String(o[k]));
      row = rowFromParts([str("n"), str("name"), str("year"), str("place"), ...(o.key !== undefined ? [str("key")] : [])], where);
    } else {
      throw new Error(`${ID}: ${where} must be a row string "n | Name | year | place" or an object { n, name, year, place }.`);
    }
    const prev = seen.get(row.n);
    if (prev !== undefined) throw new Error(`${ID}: ${where}: Ahnentafel number ${row.n} was already given by ancestors[${prev}].`);
    seen.set(row.n, i);
    rows.push(row);
  });
  if (rows.length === 0) throw new Error(`${ID}: ancestors has no rows - give at least the root person "1 | Name | year | place".`);
  if (!seen.has(1)) throw new Error(`${ID}: ancestors has no row 1 (the root person).`);
  return rows;
}

/* ── GEDCOM ── */

type GedEvent = { date: string; place: string };
type GedIndi = { xref: string; name: string; birth: GedEvent; death: GedEvent; famc: Array<{ fam: string; pedi: string }> };
type GedFam = { husb: string | null; wife: string | null };
export type AncestryGedcom = { indi: Map<string, GedIndi>; fam: Map<string, GedFam>; order: string[] };

/** The tags this template reads: INDI (NAME, BIRT/DEAT with DATE and PLAC, FAMC with PEDI) and FAM (HUSB, WIFE). Everything else is ignored. */
export function ancestryParseGedcom(text: string): AncestryGedcom {
  const indi = new Map<string, GedIndi>();
  const fam = new Map<string, GedFam>();
  const order: string[] = [];
  let sawHead = false;
  let rec: { kind: "INDI"; v: GedIndi } | { kind: "FAM"; v: GedFam } | null = null;
  let ctx1 = "";
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  for (const raw of lines) {
    const m = /^\s*(\d+)\s+(?:(@[^@\s]+@)\s+)?([A-Za-z0-9_]+)(?:\s(.*))?$/.exec(raw);
    if (!m) continue;
    const level = Number(m[1]);
    const xref = m[2] ?? null;
    const tag = m[3].toUpperCase();
    const value = (m[4] ?? "").trim();
    if (level === 0) {
      ctx1 = "";
      if (tag === "HEAD") sawHead = true;
      if (tag === "INDI" && xref) {
        const v: GedIndi = { xref, name: "", birth: { date: "", place: "" }, death: { date: "", place: "" }, famc: [] };
        indi.set(xref, v);
        order.push(xref);
        rec = { kind: "INDI", v };
      } else if (tag === "FAM" && xref) {
        const v: GedFam = { husb: null, wife: null };
        fam.set(xref, v);
        rec = { kind: "FAM", v };
      } else rec = null;
      continue;
    }
    if (!rec) continue;
    if (rec.kind === "INDI") {
      if (level === 1) {
        ctx1 = tag;
        if (tag === "NAME" && rec.v.name === "") rec.v.name = value;
        if (tag === "FAMC" && value) rec.v.famc.push({ fam: value, pedi: "" });
      } else if (level === 2) {
        if ((ctx1 === "BIRT" || ctx1 === "DEAT") && (tag === "DATE" || tag === "PLAC")) {
          const ev = ctx1 === "BIRT" ? rec.v.birth : rec.v.death;
          if (tag === "DATE" && ev.date === "") ev.date = value;
          if (tag === "PLAC" && ev.place === "") ev.place = value;
        } else if (ctx1 === "FAMC" && tag === "PEDI" && rec.v.famc.length > 0) {
          rec.v.famc[rec.v.famc.length - 1].pedi = value.toLowerCase();
        }
      }
    } else if (level === 1) {
      if (tag === "HUSB" && value) rec.v.husb = value;
      if (tag === "WIFE" && value) rec.v.wife = value;
    }
  }
  if (!sawHead) throw new Error(`${ID}: gedcom is not a GEDCOM file - no "0 HEAD" line.`);
  if (indi.size === 0) throw new Error(`${ID}: gedcom has no INDI records.`);
  return { indi, fam, order };
}

const APPROX = /^(ABT|EST|CAL|BEF|AFT|BET)\b/i;

function yearFromGedDate(date: string): string {
  const m = /(\d{3,4})(?!\d)/.exec(date);
  if (!m) return "";
  return APPROX.test(date.trim()) ? `c. ${m[1]}` : m[1];
}

function nameFromGed(name: string, xref: string): string {
  const folded = ancestryFoldAscii(name.replace(/\//g, " "));
  return folded === "" ? `no name ${xref}` : folded;
}

/** Walk FAMC -> HUSB / WIFE from the root into Ahnentafel 1..31. The FAMC with PEDI birth wins; otherwise the first. */
export function ancestryRowsFromGedcom(text: string, root: string, event: "birth" | "death"): AncestryRow[] {
  const g = ancestryParseGedcom(text);
  const rootX = root.trim() === "" ? g.order[0] : root.trim();
  if (!g.indi.has(rootX)) throw new Error(`${ID}: root ${JSON.stringify(root)} is not an INDI in the GEDCOM (${g.indi.size} people; the first is ${g.order[0]}).`);
  const slots: Array<string | null> = new Array(ANCESTRY_SLOTS + 1).fill(null);
  slots[1] = rootX;
  for (let n = 1; n <= 15; n++) {
    const x = slots[n];
    if (!x) continue;
    const p = g.indi.get(x);
    if (!p) continue;
    const famc = p.famc.find((f) => f.pedi === "birth") ?? p.famc[0];
    if (!famc) continue;
    const f = g.fam.get(famc.fam);
    if (!f) continue;
    slots[2 * n] = f.husb && g.indi.has(f.husb) ? f.husb : null;
    slots[2 * n + 1] = f.wife && g.indi.has(f.wife) ? f.wife : null;
  }
  const rows: AncestryRow[] = [];
  for (let n = 1; n <= ANCESTRY_SLOTS; n++) {
    const x = slots[n];
    if (!x) continue;
    const p = g.indi.get(x)!;
    const ev = event === "death" ? p.death : p.birth;
    rows.push({ n, name: nameFromGed(p.name, x), year: yearFromGedDate(ev.date), place: ancestryFoldAscii(ev.place) });
  }
  return rows;
}

/* ── rows -> model ── */

export type AncestryOptions = { keyBy: string; homeCountry: string; colors: Map<string, MosaicColor>; event: "birth" | "death" };

export function ancestryModelOf(rows: AncestryRow[], opts: AncestryOptions): AncestryModel {
  const people: Array<AncestryPerson | null> = new Array(ANCESTRY_SLOTS + 1).fill(null);
  for (const r of rows) {
    people[r.n] = { n: r.n, gen: generationOf(r.n), name: r.name, year: r.year, place: r.place, key: ancestryKeyOf(r.place, r.key, opts.keyBy, opts.homeCountry) };
  }
  const known = people.filter((p): p is AncestryPerson => p !== null).length;
  const groups = new Map<string, { label: string; members: number[] }>();
  const unknownMembers: number[] = [];
  for (let n = 1; n <= ANCESTRY_SLOTS; n++) {
    const p = people[n];
    if (!p || p.key === null) {
      unknownMembers.push(n);
      continue;
    }
    const id = p.key.toLowerCase();
    const g = groups.get(id);
    if (g) g.members.push(n);
    else groups.set(id, { label: p.key, members: [n] });
  }
  const ranked = [...groups.values()].sort((a, b) => b.members.length - a.members.length || a.members[0] - b.members[0]);
  const top = ranked.length > MAX_KEYS ? ranked.slice(0, MAX_KEYS) : ranked;
  const rest = ranked.length > MAX_KEYS ? ranked.slice(MAX_KEYS) : [];
  const over = (label: string, fallback: string) => opts.colors.get(label.toLowerCase()) ?? (fallback as MosaicColor);
  const legend: AncestryLegendEntry[] = top.map((g, i) => ({ kind: "key" as const, label: g.label, count: g.members.length, color: over(g.label, ANCESTRY_PALETTE[i]), members: g.members }));
  if (rest.length > 0) {
    const members = rest.flatMap((g) => g.members).sort((a, b) => a - b);
    legend.push({ kind: "other", label: "Other", count: members.length, color: over("Other", ANCESTRY_PALETTE[ANCESTRY_PALETTE.length - 1]), members });
  }
  legend.push({ kind: "unknown", label: "Unknown", count: unknownMembers.length, color: over("Unknown", THEME.unknown), members: unknownMembers });
  const entryOf: number[] = new Array(ANCESTRY_SLOTS + 1).fill(legend.length - 1);
  legend.forEach((e, i) => e.members.forEach((n) => (entryOf[n] = i)));
  return { people, known, legend, entryOf, rootName: people[1]?.name ?? "", event: opts.event };
}

/* ── beats ── */

export type AncestryBeats = {
  clip: number;
  hook: number;
  start: number;
  end: number;
  gens: Array<{ start: number; end: number }>;
  /** Landing second by Ahnentafel number; [0] unused. */
  lands: number[];
};

/** The generations' shares of the replay: the root alone is short, the cascade of 16 is long. */
const GEN_SHARES = [0.1, 0.15, 0.2, 0.25, 0.3];

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** 0-8% the finished chart, 8-14% the reset, 14-84% the replay (generation g over its share, its cells at equal spacing in Ahnentafel order), then the finished chart. */
export function ancestryBeatsOf(clipSec: number): AncestryBeats {
  const hook = round3(clipSec * 0.08);
  const start = round3(clipSec * 0.14);
  const end = round3(clipSec * 0.84);
  const len = end - start;
  let cum = 0;
  const gens = GEN_SHARES.map((share) => {
    const s = start + len * cum;
    cum += share;
    return { start: round3(s), end: round3(start + len * cum) };
  });
  const lands: number[] = [0];
  for (let n = 1; n <= ANCESTRY_SLOTS; n++) {
    const g = generationOf(n);
    const count = 2 ** g;
    const j = n - count;
    lands.push(round3(gens[g].start + ((gens[g].end - gens[g].start) * j) / count));
  }
  return { clip: clipSec, hook, start, end, gens, lands };
}

/* ── geometry ── */

type Rect = { x: number; y: number; w: number; h: number };
type Fit = { text: string; px: number; width: number };
type Block = { lines: string[]; px: number; width: number };

function fiveSmoothDown(n: number): number {
  for (let v = Math.max(1, Math.floor(n)); v >= 1; v--) {
    let m = v;
    for (const p of [2, 3, 5]) while (m % p === 0) m /= p;
    if (m === 1) return v;
  }
  return 1;
}

/** A rect of `w0 x h0` shrunk to 5-smooth sides and centred where it was. */
function smoothRect(x: number, y: number, w0: number, h0: number): Rect {
  const w = fiveSmoothDown(w0);
  const h = fiveSmoothDown(h0);
  return { x: x + Math.floor((w0 - w) / 2), y: y + Math.floor((h0 - h) / 2), w, h };
}

/**
 * Width at any size from ONE measurement per string (the bundled font's
 * advance widths scale with the size): the column fitter tries tiers, sizes
 * and cells, and measuring every attempt against the font file took minutes
 * over the seven-canvas sweep. The contract still gets an exact `widthOf` of
 * the chosen lines.
 */
const MEASURE_REF = 100;
const measureCache = new Map<string, number>();
function textW(text: string, px: number, bold = false): number {
  const k = (bold ? "b:" : "r:") + text;
  let w = measureCache.get(k);
  if (w === undefined) {
    w = widthOf(text, MEASURE_REF, bold);
    measureCache.set(k, w);
  }
  return (w * px) / MEASURE_REF;
}

/** Greedy word wrap on the cached ruler; a word wider than the box is the caller's problem (it checks). */
function wrapWords(text: string, px: number, maxW: number, bold: boolean): string[] {
  const words = text.split(" ").filter((w) => w.length > 0);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && textW(next, px, bold) > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** One line shrunk until it fits `maxW`; null when it does not fit even at `minPx`. */
function fitOne(text: string, maxW: number, maxPx: number, minPx: number, bold = false): Fit | null {
  let px = Math.max(minPx, Math.round(maxPx));
  while (px > minPx && textW(text, px, bold) > maxW) px = Math.max(minPx, Math.round(px * 0.92));
  const width = widthOf(text, px, bold);
  return width > maxW ? null : { text, px, width };
}

/** A title: one line down to 70% of `maxPx`, then up to two lines, shrinking to the box. Never an ellipsis. */
function titleBlock(text: string, w: number, h: number, maxPx: number, bold: boolean): Block {
  const maxW = budget(w);
  const widest = (lines: string[], px: number) => Math.max(...lines.map((l) => widthOf(l, px, bold)));
  let px = Math.max(MIN_PX, Math.round(Math.min(maxPx, h / LH)));
  const floorOne = Math.max(MIN_PX, Math.round(px * 0.7));
  for (; px >= floorOne; px = Math.min(px - 1, Math.round(px * 0.94))) {
    if (textW(text, px, bold) <= maxW) return { lines: [text], px, width: widthOf(text, px, bold) };
    if (px <= MIN_PX) break;
  }
  px = Math.max(MIN_PX, Math.min(floorOne, Math.floor(h / (2 * LH))));
  for (;;) {
    const lines = wrapFit(text, px, maxW);
    if ((lines.length <= 2 && widest(lines, px) <= maxW && lines.length * px * LH <= h) || px <= MIN_PX) {
      return { lines, px, width: widest(lines, px) };
    }
    px = Math.max(MIN_PX, Math.min(px - 1, Math.floor(px * 0.94)));
  }
}

/** The copy tiers a column can show, richest first. */
export const ANCESTRY_TIERS = ["name-year-place", "name-year", "name", "surname", "number", "none"] as const;
export type AncestryTier = (typeof ANCESTRY_TIERS)[number];

type CellCopy = { name: string | null; meta: string | null };

function copyFor(p: AncestryPerson | null, n: number, tier: number): CellCopy {
  const name = p ? `${n} ${p.name}` : `${n} unknown`;
  switch (tier) {
    case 0: {
      const meta = p ? [p.year, p.key ?? ""].filter((s) => s !== "").join(" - ") : "";
      return { name, meta: meta === "" ? null : meta };
    }
    case 1:
      return { name, meta: p && p.year !== "" ? p.year : null };
    case 2:
      return { name, meta: null };
    case 3: {
      const words = p ? p.name.split(" ") : ["unknown"];
      return { name: `${n} ${words[words.length - 1]}`, meta: null };
    }
    case 4:
      return { name: String(n), meta: null };
    default:
      return { name: null, meta: null };
  }
}

export type AncestryCellText = { n: number; nameLines: string[]; nameWidth: number; meta: string | null; metaWidth: number };
export type AncestryColumnText = { tier: AncestryTier; px: number; metaPx: number; cells: AncestryCellText[] };

/** The richest tier whose font clears `floorPx` for EVERY cell of the column; one size for the whole column. */
export function ancestryFitColumn(people: Array<AncestryPerson | null>, numbers: number[], innerW: number, innerH: number, capPx: number, floorPx: number): AncestryColumnText {
  const maxW = budget(innerW);
  for (let tier = 0; tier < 5; tier++) {
    const maxLines = tier <= 1 ? 2 : 1;
    const copies = numbers.map((n) => copyFor(people[n], n, tier));
    let px = Math.max(floorPx, Math.round(capPx));
    for (; px >= floorPx; px = Math.max(floorPx, Math.min(px - 1, Math.round(px * 0.94)))) {
      const metaPx = Math.max(MIN_PX, Math.round(px * 0.82));
      const cells: AncestryCellText[] = [];
      let ok = true;
      for (let i = 0; i < copies.length && ok; i++) {
        const c = copies[i];
        const nameText = c.name ?? "";
        if (nameText.split(" ").some((w) => textW(w, px, true) > maxW)) ok = false;
        const nameLines = maxLines === 1 ? [nameText] : wrapWords(nameText, px, maxW, true);
        if (nameLines.length > maxLines) ok = false;
        const nameWidth = Math.max(...nameLines.map((l) => textW(l, px, true)));
        if (nameWidth > maxW) ok = false;
        const metaWidth = c.meta ? textW(c.meta, metaPx) : 0;
        if (metaWidth > maxW) ok = false;
        const h = (nameLines.length - 1) * px * LH + px + (c.meta ? metaPx * LH : 0);
        if (h > innerH) ok = false;
        cells.push({ n: numbers[i], nameLines, nameWidth, meta: c.meta, metaWidth });
      }
      if (ok) {
        // the chosen lines, measured exactly for the contract (and refused if the ruler was optimistic)
        for (const cell of cells) {
          cell.nameWidth = Math.max(...cell.nameLines.map((l) => widthOf(l, px, true)));
          cell.metaWidth = cell.meta ? widthOf(cell.meta, metaPx) : 0;
          if (cell.nameWidth > maxW || cell.metaWidth > maxW) ok = false;
        }
        if (ok) return { tier: ANCESTRY_TIERS[tier], px, metaPx, cells };
      }
      if (px === floorPx) break;
    }
  }
  return { tier: "none", px: 0, metaPx: 0, cells: numbers.map((n) => ({ n, nameLines: [], nameWidth: 0, meta: null, metaWidth: 0 })) };
}

const HEAD_TIERS: ReadonlyArray<readonly string[]> = [
  ["YOU", "PARENTS", "GRANDPARENTS", "GREAT-GRANDPARENTS", "2X GREAT-GRANDPARENTS"],
  ["YOU", "PARENTS", "GRANDPARENTS", "GREAT-GP", "2X GREAT-GP"],
  ["G1", "G2", "G3", "G4", "G5"],
];

export type AncestryLayout = {
  W: number;
  H: number;
  U: number;
  stacked: boolean;
  title: { rect: Rect; block: Block };
  subtitle: { rect: Rect; fit: Fit };
  /** The chart's child canvas in the parent (5-smooth both sides). */
  chart: Rect;
  /** Inside the child: the header strip and the cells. */
  headH: number;
  head: Array<{ rect: Rect; fit: Fit }>;
  gap: number;
  pad: number;
  colW: number;
  /** The generation-5 unit height; generation g cells are unit * 2^(4-g) tall. */
  unit: number;
  /** Cell frames by Ahnentafel number (gutter already taken), in child coordinates; [0] unused. */
  cells: Rect[];
  columns: AncestryColumnText[];
  legend: { band: Rect; rows: number; px: number; items: Array<{ swatch: Rect; label: Rect; fit: Fit }> };
};

export function ancestryLayout(model: AncestryModel, copy: { title: string; subtitle: string }, W: number, H: number): AncestryLayout {
  const stacked = W < H * 1.3;
  const U = Math.min(W, H);
  const mx = Math.round(0.03 * W);
  const cw = W - 2 * mx;

  // ── header ──
  let titleRect: Rect;
  let subRect: Rect;
  let chartTop: number;
  if (!stacked) {
    titleRect = { x: mx, y: Math.round(0.03 * H), w: Math.round(0.6 * W), h: Math.round(0.085 * H) };
    const sw = Math.round(0.32 * W);
    subRect = { x: W - mx - sw, y: Math.round(0.04 * H), w: sw, h: Math.round(0.065 * H) };
    chartTop = Math.round(0.14 * H);
  } else {
    titleRect = { x: mx, y: Math.round(0.02 * U), w: cw, h: Math.round(0.065 * U) };
    subRect = { x: mx, y: titleRect.y + titleRect.h, w: cw, h: Math.round(0.035 * U) };
    chartTop = subRect.y + subRect.h + Math.round(0.015 * U);
  }
  const title = { rect: titleRect, block: titleBlock(copy.title, titleRect.w, titleRect.h, (stacked ? 0.05 : 0.06) * U, true) };
  const subFit = fitOne(copy.subtitle, budget(subRect.w), Math.min(0.028 * U, subRect.h / LH), MIN_PX) ?? { text: copy.subtitle, px: MIN_PX, width: widthOf(copy.subtitle, MIN_PX) };
  const subtitle = { rect: subRect, fit: subFit };

  // ── legend: the row count that gives the largest label ──
  const k = model.legend.length;
  const rowH = Math.round((stacked ? 0.04 : 0.055) * (stacked ? U : H));
  const pad = Math.max(1, Math.round(0.006 * U));
  const longest = model.legend.reduce((s, e) => {
    const t = `${e.label} ${e.count}`;
    return t.length > s.length ? t : s;
  }, "");
  let best: { rows: number; px: number; cols: number; cellW: number; sw: number; labelW: number } | null = null;
  for (const rows of [1, 2, 3]) {
    const cols = Math.ceil(k / rows);
    const cellW = Math.floor(cw / cols);
    const sw = Math.round(rowH * 0.55);
    const labelW = cellW - sw - 3 * pad;
    const fit = fitOne(longest, budget(Math.max(8, labelW)), Math.min(0.03 * U, rowH / LH), MIN_PX);
    const px = fit ? fit.px : 0;
    if (!best || px > best.px) best = { rows, px, cols, cellW, sw, labelW };
  }
  const lg = best!;
  const mb = Math.round((stacked ? 0.025 : 0.03) * (stacked ? U : H));
  const bandH = lg.rows * rowH;
  const band: Rect = { x: mx, y: H - mb - bandH, w: cw, h: bandH };
  const items = model.legend.map((e, i) => {
    const row = Math.floor(i / lg.cols);
    const col = i % lg.cols;
    const x = mx + col * lg.cellW;
    const y = band.y + row * rowH;
    const text = `${e.label} ${e.count}`;
    const fit = fitOne(text, budget(Math.max(8, lg.labelW)), lg.px, MIN_PX) ?? { text, px: MIN_PX, width: widthOf(text, MIN_PX) };
    return { swatch: { x, y: y + Math.round((rowH - lg.sw) / 2), w: lg.sw, h: lg.sw }, label: { x: x + lg.sw + pad, y, w: Math.max(8, lg.labelW), h: rowH }, fit };
  });

  // ── the chart's child canvas, ON its lattice ──
  // placeInsetPieces snaps every frame outward to a lattice whose pitch is a
  // divisor of the axis (at most 120 slots) and insets the paint back. The
  // header, the columns and the generation-5 unit are multiples of that
  // pitch, so every cell frame IS a run of lattice cells: equal by
  // construction, and the gutter is the inset.
  const chartBottom = band.y - Math.round(0.02 * (stacked ? U : H));
  const chart = smoothRect(mx, chartTop, cw, Math.max(40, chartBottom - chartTop));
  const pitchX = chart.w / latticeMaxSlots(chart.w);
  const pitchY = chart.h / latticeMaxSlots(chart.h);
  const gap = Math.max(1, Math.round(0.0025 * U));
  const headH = Math.max(pitchY, Math.round((0.06 * chart.h) / pitchY) * pitchY);
  const colW = Math.max(pitchX, Math.floor(chart.w / GENERATIONS / pitchX) * pitchX);
  const colX0 = Math.floor((chart.w - GENERATIONS * colW) / 2 / pitchX) * pitchX;
  const cellsH = chart.h - headH;
  const unit = Math.max(pitchY, Math.floor(cellsH / 16 / pitchY) * pitchY);
  const cellsY0 = headH + Math.max(0, Math.floor((cellsH - 16 * unit) / 2 / pitchY) * pitchY);
  const gh = Math.ceil(gap / 2);
  const cells: Rect[] = [{ x: 0, y: 0, w: 0, h: 0 }];
  for (let n = 1; n <= ANCESTRY_SLOTS; n++) {
    const g = generationOf(n);
    const h0 = unit * 2 ** (GENERATIONS - 1 - g);
    const j = n - 2 ** g;
    cells.push({ x: colX0 + g * colW + gh, y: cellsY0 + j * h0 + gh, w: colW - gap, h: h0 - gap });
  }

  // generation headers: one tier for all five
  const headMaxPx = Math.min(0.024 * U, (headH - gap) / LH);
  let head: Array<{ rect: Rect; fit: Fit }> = [];
  for (let t = 0; t < HEAD_TIERS.length; t++) {
    const labels = HEAD_TIERS[t];
    const widest = labels.reduce((s, l) => (widthOf(l, 10, true) > widthOf(s, 10, true) ? l : s), labels[0]);
    const fit = fitOne(widest, budget(colW - gap), headMaxPx, MIN_PX, true);
    if (!fit) continue;
    if (fit.px >= MIN_PX + 1 || t === HEAD_TIERS.length - 1) {
      head = labels.map((l, g) => ({ rect: { x: colX0 + g * colW + gh, y: 0, w: colW - gap, h: headH - gap }, fit: { text: l, px: fit.px, width: widthOf(l, fit.px, true) } }));
      break;
    }
  }
  if (head.length === 0) head = HEAD_TIERS[2].map((l, g) => ({ rect: { x: colX0 + g * colW + gh, y: 0, w: colW - gap, h: headH - gap }, fit: { text: l, px: MIN_PX, width: widthOf(l, MIN_PX, true) } }));

  // cell copy: per column
  const floorPx = Math.max(MIN_PX, Math.round(0.011 * U));
  const columns: AncestryColumnText[] = [];
  for (let g = 0; g < GENERATIONS; g++) {
    const numbers: number[] = [];
    for (let n = 2 ** g; n < 2 ** (g + 1); n++) numbers.push(n);
    const inner = cellInner(cells[numbers[0]], U);
    const capPx = Math.min((g === 0 ? 0.036 : 0.03) * U, inner.h / 1.02);
    columns.push(ancestryFitColumn(model.people, numbers, inner.w, inner.h, capPx, floorPx));
  }

  return { W, H, U, stacked, title, subtitle, chart, headH, head, gap, pad, colW, unit, cells, columns, legend: { band, rows: lg.rows, px: lg.px, items } };
}

/** The copy's box inside a cell frame: a pad that shrinks with the cell, and none vertically when the cell is a sliver. */
function cellInner(frame: Rect, U: number): Rect {
  const padX = Math.max(1, Math.min(Math.round(0.01 * U), Math.round(frame.h * 0.12)));
  const padY = frame.h < 14 ? 0 : padX;
  return { x: frame.x + padX, y: frame.y + padY, w: frame.w - 2 * padX, h: frame.h - 2 * padY };
}

/* ── the contract ── */

function layoutContract(L: AncestryLayout): LayoutConstraint[] {
  const out: LayoutConstraint[] = [
    textFitsMeasured("title", L.title.block.lines.join("\n"), L.title.block.px, L.title.block.width),
    textFitsMeasured("subtitle", L.subtitle.fit.text, L.subtitle.fit.px, L.subtitle.fit.width),
    { label: "title", within: { yFrac: [0, 0.18] } },
    { label: "chart", within: { yFrac: [0.05, 0.95] } },
    { label: "legend", within: { yFrac: [0.6, 1] }, minWidthFrac: 0.9 },
  ];
  for (let g = 0; g < GENERATIONS; g++) out.push({ label: `ancestor-cell-g${g + 1}` });
  L.head.forEach((h, g) => out.push(textFitsMeasured(`gen-head-${g + 1}`, h.fit.text, h.fit.px, h.fit.width)));
  L.columns.forEach((c, g) => {
    if (c.tier === "none") return;
    const widestName = c.cells.reduce((s, cell) => (cell.nameWidth > s.nameWidth ? cell : s), c.cells[0]);
    const line = widestName.nameLines.reduce((s, l) => (widthOf(l, c.px, true) > widthOf(s, c.px, true) ? l : s), widestName.nameLines[0] ?? "");
    out.push(textFitsMeasured(`cell-name-g${g + 1}`, line, c.px, widestName.nameWidth));
    const widestMeta = c.cells.filter((cell) => cell.meta).reduce<AncestryCellText | null>((s, cell) => (!s || cell.metaWidth > s.metaWidth ? cell : s), null);
    if (widestMeta) out.push(textFitsMeasured(`cell-meta-g${g + 1}`, widestMeta.meta!, c.metaPx, widestMeta.metaWidth));
  });
  L.legend.items.forEach((it, i) => out.push(textFitsMeasured(`legend-label-${i}`, it.fit.text, it.fit.px, it.fit.width)));
  return out;
}

/**
 * Cells of one generation are one height by construction (unit * 2^k, on the
 * lattice) and the paint is inset-recovered to the exact rect. What the
 * check measures is the engine's QUANTIZED frame, which at 3840x2160 with
 * dense copy lands some cells on the lattice run and some on the exact rect
 * (70 vs 75 px for a 75 px unit), so the relation gets the room the astro
 * template needed; the unit test asserts the exact geometry.
 */
function cellRelations(): RelationalConstraint[] {
  const out: RelationalConstraint[] = [];
  for (let g = 1; g < GENERATIONS; g++) out.push({ label: `ancestor-cell-g${g + 1}`, equal: "height", tolerance: 0.08, tolerancePx: 6 });
  out.push({ label: Array.from({ length: GENERATIONS }, (_, g) => `ancestor-cell-g${g + 1}`), equal: "width", tolerance: 0.08, tolerancePx: 6 });
  return out;
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts). Filled from journal/2026-10-09/.
 */
const WHY: WhySpec = {
  "day": 20,
  "date": "2026-10-09",
  "agent": "claude",
  "model": "claude-fable-5-1",
  "id": "@one-a-day/community/ancestor-birthplace-chart/v1",
  "title": "Ancestor Birthplace Chart",
  "who": "Hobby genealogists who post ancestor charts in Facebook groups and on blogs (Genea-Musings, DNAeXplained, #52Ancestors), from the GEDCOM their program exports.",
  "problem": [
    "Genea-Musings, 2016: \"create a five or six generation ancestor chart that shows your ancestor's birthplaces ... enter text in the cells and then use the background and font color features to make it correct and look colorful ... Make an image of your spreadsheet.\" It is built by hand in Excel.",
    "DNAeXplained, same month: \"Can you explain how you color coded?\" (\"It's just the cell colors in Excel\"); a reader wishes \"a programmer type could figure out how to do a pedigree for any facts captured in a family tree\" - the program \"needs ... access to your Gedcom file\".",
    "DNA Painter and the FamilySearch fan chart now colour by country of birth. The 2016 meme is old; the need comes back with every new find and the weekly #52Ancestors prompt."
  ],
  "sources": [
    "https://www.geneamusings.com/2016/03/saturday-night-genealogy-fun-ancestral.html",
    "https://cherylltoneyholley.com/2016/04/01/the-mycolorfulancestry-craze/",
    "https://dna-explained.com/2016/03/25/migration-pedigree-chart/",
    "https://gedcom.io/specifications/FamilySearchGEDCOMv7.html",
    "https://www.amyjohnsoncrow.com/52-ancestors-in-52-weeks/",
    "https://dnapainter.com/blog/dna-painter-dimensions-a-new-way-to-showcase-your-ancestral-line/",
    "https://www.familysearch.org/help/helpcenter/article/how-do-i-use-the-fan-chart-view-in-family-tree"
  ],
  "solution": [
    "The spreadsheet chart as a clip. Rows \"n | Name | year | place\" or the GEDCOM text go in; five columns of 1, 2, 4, 8 and 16 cells come out, each cell level with its father above and mother below, coloured by birth state (inside the home country) or country, with a counted legend. Unknown ancestors are grey.",
    "The one decision: the geometry is the Ahnentafel - one unit of height per generation-5 cell, doubled per generation to the left - and the copy is chosen per column, so no generation mixes tiers and nothing is clipped. The clip opens finished, resets to blank cells, lands the colours and ends where it began.",
    "Limits: the GEDCOM goes in as text (a props file on the CLI), not a path; places are keyed by their last elements, so a messy PLAC needs an explicit key; six generations are not drawn."
  ],
  "usage": {
    "command": "m0saic make @one-a-day/community/ancestor-birthplace-chart/v1 --template-repo . -w 1920 -h 1080 -o chart.mp4",
    "try": [
      "--props @props.json with {\"gedcom\": \"<your .ged text>\", \"root\": \"@I12@\"} - your tree; change root per cousin",
      "ancestors - rows \"n | Name | year | place\" pasted from a spreadsheet (tab-separated works)",
      "keyBy \"country\" for an all-country chart; homeCountry \"Canada\" keys by province; event \"death\"",
      "colors {\"Ohio\":\"#e3a857\"} for your own palette; -w 1080 -h 1920 for a story; clipSec 8 for a shorter clip"
    ]
  },
  "caveats": [
    "Country colouring exists in DNA Painter and the FamilySearch fan chart; what is new here is the spreadsheet layout, a key you choose, and local rendering from your own GEDCOM.",
    "The GEDCOM reader follows FAMC to HUSB and WIFE only (PEDI birth preferred). A place is keyed by its last elements: \"USA\" and \"United States\" fold, an old place name does not.",
    "The sample family is fictional; living people in a real chart are the user's call."
  ],
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 507953,
        "calls": 27,
        "tokens": 6541987,
        "costUsd": 4.34,
        "tools": "Bash 20, Edit 2, Workflow 2"
      },
      {
        "name": "plan",
        "startMs": 507993,
        "durMs": 478757,
        "calls": 37,
        "tokens": 6132943,
        "costUsd": 4.26,
        "tools": "Bash 22, Edit 10, Workflow 2"
      },
      {
        "name": "build",
        "startMs": 986850,
        "durMs": 1425138,
        "calls": 44,
        "tokens": 11010342,
        "costUsd": 17.36,
        "tools": "Bash 42, Read 1, Workflow 1",
        "status": "error"
      },
      {
        "name": "direct",
        "startMs": 15642880,
        "durMs": 170000,
        "calls": 13,
        "tokens": 216080,
        "costUsd": 1.44,
        "tools": "Bash 11, PowerShell 2"
      },
      {
        "name": "build (2)",
        "startMs": 15812880,
        "durMs": 20815841,
        "calls": 106,
        "tokens": 16065140,
        "costUsd": 24.3,
        "tools": "Bash 38, Edit 26, Read 23"
      },
      {
        "name": "critique",
        "startMs": 36628721,
        "durMs": 330382,
        "calls": 36,
        "tokens": 2784466,
        "costUsd": 1.67,
        "tools": "Read 22, Bash 7, Edit 4"
      },
      {
        "name": "ship",
        "startMs": 36959103,
        "durMs": 869834,
        "calls": 4,
        "tokens": 1313748,
        "costUsd": 0.67,
        "tools": "Bash 3, Read 1"
      }
    ],
    "costBasis": "estimated",
    "pricedAt": "2026-09-26"
  },
};

/* ── props ── */

const propsSchema = definePropsSchema<AncestorBirthplaceChartProps>({
  title: {
    type: "string",
    required: false,
    description: "Header title (1-60 characters). Empty makes it automatic: \"<ROOT NAME> - ANCESTOR BIRTHPLACES\" (DEATH PLACES when event is death). The rect that shows it is bound to it.",
    meta: { control: { placeholder: "automatic" }, ui: { label: "Title", order: 1 } },
  },
  ancestors: {
    type: "json",
    required: false,
    description:
      'One row per ancestor, "n | Name | year | place" with an optional fifth field "key": n is the Ahnentafel number 1..31 (1 = you, 2n = father of n, 2n+1 = mother of n), year is empty, "1850" or "c. 1850", place is GEDCOM order (smallest first, country last). Tabs separate fields too, so a spreadsheet paste works. One multi-line string, an array of such strings, or objects { n, name, year, place, key }. Missing numbers are unknown (grey). Replaced by gedcom when gedcom is not empty.',
    meta: {
      constraints: { jsonSchema: { anyOf: [{ type: "string" }, { type: "array", items: { anyOf: [{ type: "string" }, { type: "object" }] } }] } },
      control: { multiline: true, mono: true },
      ui: { label: "Ancestors", order: 2, primary: true },
    },
  },
  gedcom: {
    type: "string",
    required: false,
    description:
      "The text of a GEDCOM 5.5.1 or 7.0 file (paste the whole file). Only INDI (NAME, BIRT, DEAT, FAMC) and FAM (HUSB, WIFE) are read; FAMC with PEDI birth wins over other links. When set it replaces ancestors. On the CLI pass it through a props file (--props @props.json).",
    meta: { control: { multiline: true, mono: true, placeholder: "0 HEAD\n1 GEDC\n..." }, ui: { label: "GEDCOM", order: 3 } },
  },
  root: {
    type: "string",
    required: false,
    description: 'The root person\'s GEDCOM xref, e.g. "@I12@". Empty means the first INDI in the file. Changing only this makes one chart per sibling or cousin. Ignored without gedcom.',
    meta: { control: { placeholder: "first INDI" }, ui: { label: "Root xref", order: 4 } },
  },
  event: {
    type: "string",
    required: false,
    description: 'Which event fills the cells from the GEDCOM: "birth" (default) or "death". It also switches the automatic title. Ancestors rows are taken as given.',
    meta: { constraints: { oneOf: [...EVENTS] }, ui: { label: "Event", order: 5 } },
  },
  keyBy: {
    type: "string",
    required: false,
    description: '"state-or-country" (default): places in the home country key by their second-to-last element (the state), all others by their last (the country). "country": always the last element. A one-element place keys by that element; an explicit row key always wins.',
    meta: { constraints: { oneOf: [...KEY_MODES] }, ui: { label: "Key by", order: 6 } },
  },
  homeCountry: {
    type: "string",
    required: false,
    description: 'The country whose places key by state (default "USA"; "United States", "US" and "U.S.A." fold to it, in every place too). Set "Canada", "England" and so on.',
    meta: { control: { placeholder: DEFAULTS.homeCountry }, ui: { label: "Home country", order: 7 } },
  },
  colors: {
    type: "json",
    required: false,
    description: 'Per-key #rrggbb overrides, e.g. {"Ohio":"#e3a857"} (key match is case-insensitive); "Unknown" and "Other" may be set too. Text ink flips to white on a dark fill.',
    meta: { constraints: { jsonSchema: { type: "object", additionalProperties: { type: "string" } } }, ui: { label: "Colours", order: 8 } },
  },
  clipSec: {
    type: "number",
    required: false,
    description: "Clip length in whole seconds (4..60): 8% opens on the finished chart, a short reset, then the colours land generation by generation, and the clip ends on the finished chart. An explicit duration pin overrides it and becomes the clip.",
    meta: { constraints: { min: MIN_CLIP_SEC, max: MAX_CLIP_SEC }, ui: { label: "Clip seconds", order: 9 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the title and legend sit in their bands, five generations of cells) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

function numberOr(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}

/** Props with no rect to bind, and why (m0saic doctor's `bindingsDeclared`; the template type this repo builds against predates the field, so it is spread in). */
const UNBOUND = {
  bindings: {
    unbound: {
      ancestors: "source: every cell, its colour and the legend are derived from the rows; no single rect shows them",
      gedcom: "source: parsed into rows; nothing on the card shows the raw text",
      root: "selector: picks which person the rows are walked from",
      homeCountry: "rule: which country's places key by state",
      colors: "palette: recolours cells and legend swatches, which are drawn from the keys",
      clipSec: "timing",
    },
  },
};

export const AncestorBirthplaceChartV1 = defineMosaicTemplate<AncestorBirthplaceChartProps>({
  ...UNBOUND,
  id: asTemplateId(ID),
  label: "2026-10-09 · Ancestor Birthplace Chart",
  version: 1,
  description: "The #MyColorfulAncestry spreadsheet chart as a clip: five generations from pasted rows or a GEDCOM, every cell coloured by birth state or country, landing generation by generation over a counted legend.",
  capabilities: { tier: "core" },
  tags: ["community", "2026-10-09", "day-020", "genealogy", "gedcom", "pedigree", "ancestry", "birthplace", "family-tree", "video"],

  outputHints: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: DEFAULTS.clipSec * 1000,
    format: { kind: "video", container: "mp4" },
    note: "A 16 s clip: the finished chart, a reset, the colours landing generation by generation, the finished chart again. 1080x1920 and 1080x1080 keep the five columns and stack the header and legend; an explicit --durationMs overrides clipSec.",
  },
  resolveOutputHints: (props) => ({ durationMs: numberOr(props?.clipSec, DEFAULTS.clipSec, MIN_CLIP_SEC, MAX_CLIP_SEC) * 1000 }),

  propsSchema,
  defaultProps: {
    title: DEFAULTS.title,
    ancestors: ANCESTRY_DEFAULT_ROWS,
    gedcom: "",
    root: "",
    event: DEFAULTS.event,
    keyBy: DEFAULTS.keyBy,
    homeCountry: DEFAULTS.homeCountry,
    colors: {},
    clipSec: DEFAULTS.clipSec,
    debugLayout: false,
  },

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default AncestorBirthplaceChartV1;

/* ── sources ── */

type Gate = { enable: string; window?: { startSec?: number; endSec?: number } };

function pickText(value: unknown, fallback: string, name: string, max: number): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") throw new Error(`${ID}: ${name} must be a string.`);
  const s = ancestryFoldAscii(value);
  if (s.length > max) throw new Error(`${ID}: ${name} is ${s.length} characters; at most ${max}.`);
  return s;
}

function pickChoice<T extends string>(value: unknown, fallback: T, name: string, allowed: readonly T[]): T {
  if (value === undefined || value === "") return fallback;
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) throw new Error(`${ID}: ${name} must be one of ${allowed.map((a) => JSON.stringify(a)).join(", ")}. Got ${JSON.stringify(value)}.`);
  return value as T;
}

function pickColors(value: unknown): Map<string, MosaicColor> {
  let v: unknown = value;
  if (v === undefined || v === "") return new Map();
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      throw new Error(`${ID}: colors is not valid JSON - pass an object like {"Ohio":"#e3a857"}.`);
    }
  }
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error(`${ID}: colors must be an object like {"Ohio":"#e3a857"}.`);
  const out = new Map<string, MosaicColor>();
  for (const [k, c] of Object.entries(v as Record<string, unknown>)) {
    if (typeof c !== "string" || !HEX.test(c.trim())) throw new Error(`${ID}: colors.${k} ${JSON.stringify(c)} must be #rrggbb.`);
    out.set(ancestryFoldAscii(k).toLowerCase(), c.trim().toLowerCase() as MosaicColor);
  }
  return out;
}

/** A static svg cell with a gate. */
function gated(cell: MosaicSource, gate: Gate): MosaicSource {
  return { ...cell, overlay: gate } as MosaicSource;
}

/** Shown in the cold open and from `at` on: ONE gate for two windows, so no `window` twin. */
function openAndFrom(hook: number, at: number): Gate {
  return { enable: `lt(t,${hook})+gte(t,${at})` };
}

const windowGate = (from: number, to: number): Gate => ({ enable: `gte(t,${from})*lt(t,${to})`, window: { startSec: from, endSec: to } });

async function render(props: AncestorBirthplaceChartProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  // The schema is documentation; render() is the gate.
  const titleProp = pickText(props.title, DEFAULTS.title, "title", 60);
  const event = pickChoice(props.event, DEFAULTS.event, "event", EVENTS);
  const keyBy = pickChoice(props.keyBy, DEFAULTS.keyBy, "keyBy", KEY_MODES);
  const homeCountry = pickText(props.homeCountry, DEFAULTS.homeCountry, "homeCountry", 40) || DEFAULTS.homeCountry;
  const colors = pickColors(props.colors);
  if (props.gedcom !== undefined && typeof props.gedcom !== "string") throw new Error(`${ID}: gedcom must be the text of a GEDCOM file.`);
  if (props.root !== undefined && typeof props.root !== "string") throw new Error(`${ID}: root must be a GEDCOM xref string like "@I12@".`);
  const gedcom = (props.gedcom ?? "").trim();
  const clipSec = (() => {
    const v = props.clipSec;
    if (v === undefined) return DEFAULTS.clipSec;
    const n = typeof v === "string" && (v as string).trim() !== "" ? Number(v) : v;
    if (typeof n !== "number" || !Number.isInteger(n) || n < MIN_CLIP_SEC || n > MAX_CLIP_SEC) {
      throw new Error(`${ID}: clipSec must be a whole number between ${MIN_CLIP_SEC} and ${MAX_CLIP_SEC}. Got ${JSON.stringify(v)}.`);
    }
    return n;
  })();

  const rows = gedcom.length > 0 ? ancestryRowsFromGedcom(gedcom, props.root ?? "", event) : ancestryParseRows(props.ancestors);
  const model = ancestryModelOf(rows, { keyBy, homeCountry, colors, event });
  const isSample = gedcom.length === 0 && (props.ancestors === undefined || props.ancestors === ANCESTRY_DEFAULT_ROWS);
  const title = titleProp !== "" ? titleProp : `${model.rootName.toUpperCase()} - ANCESTOR ${event === "death" ? "DEATH PLACES" : "BIRTHPLACES"}`;
  const subtitle = `${isSample ? "Fictional sample family" : `${GENERATIONS} generations`} - ${model.known} of ${ANCESTRY_SLOTS} known`;

  // The clip is authored. An explicit user pin wins and BECOMES the clip; the host-seeded target is never read as one.
  const pinned = resolvePinnedDurationMs(ctx);
  const clip = pinned !== undefined ? Math.max(1, pinned / 1000) : clipSec;
  const durationMs = pinned !== undefined ? Math.round(pinned) : clipSec * 1000;
  const b = ancestryBeatsOf(clip);

  const W = Math.max(1, Math.round(ctx.target.width));
  const H = Math.max(1, Math.round(ctx.target.height));
  const L = ancestryLayout(model, { title, subtitle }, W, H);

  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const piece = (rect: Rect, importance: number, source: MosaicSource) => pieces.push({ rect: { ...rect, importance }, source });

  // ── 1. the chart: a CHILD document on a 5-smooth canvas, no masks. A paper
  //      tile under everything (the contract's "chart" - a child's own label
  //      does not survive flattening), the header strip with its tinted
  //      "now" band, then per cell a blank tile, the gated colour tile and
  //      the static copy. ──
  const chartPieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const cpiece = (rect: Rect, importance: number, source: MosaicSource) => chartPieces.push({ rect: { ...rect, importance }, source });
  cpiece({ x: 0, y: 0, w: L.chart.w, h: L.chart.h }, 1, tag(makeColorTile(THEME.paper) as MosaicSource, "chart"));
  L.head.forEach((h, g) => {
    cpiece(h.rect, 2, tag(makeColorTile(THEME.headNow, { overlay: windowGate(b.gens[g].start, b.gens[g].end) }) as MosaicSource, `gen-now-${g + 1}`));
    cpiece(h.rect, 4, tag(textCell({ text: h.fit.text, fontSize: h.fit.px, color: THEME.dim, hAlign: "center", bold: true, vAlign: "middle", label: `gen-head-${g + 1}` }), `gen-head-${g + 1}`));
  });
  for (let n = 1; n <= ANCESTRY_SLOTS; n++) {
    const g = generationOf(n);
    const frame = L.cells[n];
    const entry = model.legend[model.entryOf[n]];
    const ink = inkFor(entry.color);
    const gate = openAndFrom(b.hook, b.lands[n]);
    cpiece(frame, 2, tag(makeColorTile(THEME.blank) as MosaicSource, `ancestor-cell-g${g + 1}`));
    cpiece(frame, 3, tag(makeColorTile(entry.color, { overlay: gate }) as MosaicSource, `ancestor-fill-${n}`));
    const col = L.columns[g];
    const cell = col.cells.find((c) => c.n === n);
    if (!cell || col.tier === "none" || cell.nameLines.length === 0) continue;
    const inner = cellInner(frame, L.U);
    const nameH = Math.min(inner.h, Math.round((cell.nameLines.length - 1) * col.px * LH + col.px * 1.02));
    const metaH = cell.meta ? Math.round(col.metaPx * LH) : 0;
    const blockH = nameH + metaH;
    const top = inner.y + Math.max(0, Math.floor((inner.h - blockH) / 2));
    // a fill dark enough to need white ink gates its copy to the landing too (the reset's blank is pale)
    const text = (src: MosaicSource) => (ink.light ? gated(src, gate) : src);
    cpiece({ x: inner.x, y: top, w: inner.w, h: Math.min(nameH, inner.h) }, 4, text(tag(textCell({ text: cell.nameLines.join("\n"), fontSize: col.px, color: ink.color, hAlign: "left", bold: true, vAlign: "middle", label: `cell-name-g${g + 1}` }), `cell-name-g${g + 1}`)));
    if (cell.meta && metaH > 0 && top + nameH + metaH <= inner.y + inner.h + 1) {
      cpiece({ x: inner.x, y: top + nameH, w: inner.w, h: metaH }, 4, text(tag(textCell({ text: cell.meta, fontSize: col.metaPx, color: ink.color, hAlign: "left", vAlign: "middle", label: `cell-meta-g${g + 1}` }), `cell-meta-g${g + 1}`)));
    }
  }
  const chartPlaced = placeInsetPieces({ rootW: L.chart.w, rootH: L.chart.h, pieces: chartPieces });
  const children: NonNullable<MosaicDocument["children"]> = {};
  children.chart = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(chartPlaced.m0, ID),
    assets: {},
    size: { width: L.chart.w, height: L.chart.h },
    fps: ctx.target.fps,
    durationMs,
    backgroundColor: THEME.paper,
    sources: chartPlaced.sources,
    editor: { label: `pedigree - ${model.known} of ${ANCESTRY_SLOTS} known` },
  };
  piece(L.chart, 1, tag({ type: "mosaic", ref: "chart", placement: { fit: "contain" } } as MosaicSource, "chart-child"));

  // ── 2. the header ──
  piece(L.title.rect, 3, bindProp(tag(textCell({ text: L.title.block.lines.join("\n"), fontSize: L.title.block.px, color: THEME.ink, hAlign: "left", bold: true, vAlign: "middle", label: "title" }), "title"), "title"));
  piece(L.subtitle.rect, 3, tag(textCell({ text: L.subtitle.fit.text, fontSize: L.subtitle.fit.px, color: THEME.dim, hAlign: L.stacked ? "left" : "right", vAlign: "middle", label: "subtitle" }), "subtitle"));

  // ── 3. the legend: a paper band (the contract's "legend"), a swatch and a counted label per entry ──
  piece(L.legend.band, 1, tag(makeColorTile(THEME.paper) as MosaicSource, "legend"));
  L.legend.items.forEach((it, i) => {
    const e = model.legend[i];
    piece(it.swatch, 2, tag(makeColorTile(e.color) as MosaicSource, "legend-swatch"));
    piece(it.label, 3, tag(textCell({ text: it.fit.text, fontSize: it.fit.px, color: THEME.ink, hAlign: "left", vAlign: "middle", label: `legend-label-${i}` }), `legend-label-${i}`));
  });

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    size: { width: W, height: H },
    fps: ctx.target.fps,
    // The clip is authored, so it out-ranks the hint.
    durationMs,
    backgroundColor: THEME.paper,
    sources: placed.sources,
    children,
    editor: { label: `Ancestor Birthplace Chart - ${model.rootName} - ${model.known} of ${ANCESTRY_SLOTS} known - ${model.legend.length} keys` },
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints: layoutContract(L), relations: cellRelations(), debug: props.debugLayout === true });
}
