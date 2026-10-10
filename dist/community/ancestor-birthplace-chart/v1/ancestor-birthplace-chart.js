"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AncestorBirthplaceChartV1 = exports.ANCESTRY_TIERS = exports.ANCESTRY_DEFAULT_ROWS = exports.ANCESTRY_PALETTE = exports.ANCESTRY_SLOTS = void 0;
exports.ancestryFoldAscii = ancestryFoldAscii;
exports.ancestryContrast = ancestryContrast;
exports.ancestryKeyOf = ancestryKeyOf;
exports.ancestryParseRows = ancestryParseRows;
exports.ancestryParseGedcom = ancestryParseGedcom;
exports.ancestryRowsFromGedcom = ancestryRowsFromGedcom;
exports.ancestryModelOf = ancestryModelOf;
exports.ancestryBeatsOf = ancestryBeatsOf;
exports.ancestryFitColumn = ancestryFitColumn;
exports.ancestryLayout = ancestryLayout;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const text_1 = require("../../../_shared/text");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/community/ancestor-birthplace-chart/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
exports.ANCESTRY_SLOTS = 31;
const GENERATIONS = 5;
const MAX_KEYS = 9;
const MIN_CLIP_SEC = 4;
const MAX_CLIP_SEC = 60;
const MIN_PX = 7;
const LH = 1.2;
const EVENTS = ["birth", "death"];
const KEY_MODES = ["state-or-country", "country"];
const DEFAULTS = {
    title: "",
    event: "birth",
    keyBy: "state-or-country",
    homeCountry: "USA",
    clipSec: 16,
};
/** Warm paper, near-black ink, pastel fills: the spreadsheet look, lighter. */
const THEME = {
    paper: "#f6f3ec",
    ink: "#1f1b16",
    light: "#ffffff",
    dim: "#6b645a",
    blank: "#e9e4da",
    headNow: "#f3dfa6",
    unknown: "#cdc9c2",
};
/** Ten categorical fills, medium lightness, assigned in legend order; every one clears 4.5:1 under the ink. */
exports.ANCESTRY_PALETTE = [
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
exports.ANCESTRY_DEFAULT_ROWS = `1 | Clara Whitfield | 1988 | Columbus, Franklin, Ohio, USA
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
function ancestryFoldAscii(s) {
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
function luminance(hex) {
    const c = parseInt(hex.slice(1), 16);
    const ch = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * ch((c >> 16) & 255) + 0.7152 * ch((c >> 8) & 255) + 0.0722 * ch(c & 255);
}
/** WCAG contrast ratio between two #rrggbb colours. */
function ancestryContrast(a, b) {
    const la = luminance(a);
    const lb = luminance(b);
    const [hi, lo] = la > lb ? [la, lb] : [lb, la];
    return (hi + 0.05) / (lo + 0.05);
}
/** The ink that reads on a fill: the page ink when it clears 4.5:1, else white. */
function inkFor(fill) {
    return ancestryContrast(fill, THEME.ink) >= 4.5 ? { color: THEME.ink, light: false } : { color: THEME.light, light: true };
}
const USA = new Set(["usa", "us", "u s", "u s a", "united states", "united states of america", "the united states", "america"]);
/** Country spellings fold together: every usual way of writing the USA is "USA". */
function foldCountry(s) {
    const k = s.replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
    return USA.has(k) ? "USA" : s.replace(/\s+/g, " ").trim();
}
/** A place -> its colour key. An explicit key wins; "" or no element -> null (unknown). */
function ancestryKeyOf(place, explicit, keyBy, homeCountry) {
    if (explicit !== undefined && explicit.trim() !== "")
        return explicit.trim();
    const parts = place.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    if (parts.length === 0)
        return null;
    const country = foldCountry(parts[parts.length - 1]);
    if (keyBy === "state-or-country" && parts.length >= 2 && country.toLowerCase() === foldCountry(homeCountry).toLowerCase())
        return parts[parts.length - 2];
    return country;
}
function generationOf(n) {
    return Math.floor(Math.log2(n));
}
function parseYear(raw, where) {
    const s = raw.trim();
    if (s === "")
        return "";
    const m = /^(?:(c|ca|abt|about|circa)\.?\s*)?(\d{3,4})$/i.exec(s);
    if (!m)
        throw new Error(`${ID}: ${where}: year ${JSON.stringify(raw)} must be empty, a 3-4 digit year, or "c. 1850".`);
    return m[1] ? `c. ${m[2]}` : m[2];
}
function rowFromParts(parts, where) {
    var _a, _b, _c;
    if (parts.length < 2)
        throw new Error(`${ID}: ${where}: a row is "n | Name | year | place" (at least the number and the name).`);
    const n = Number(parts[0]);
    if (!Number.isInteger(n) || n < 1 || n > exports.ANCESTRY_SLOTS)
        throw new Error(`${ID}: ${where}: the Ahnentafel number ${JSON.stringify(parts[0])} must be a whole number 1..${exports.ANCESTRY_SLOTS}.`);
    const name = ancestryFoldAscii((_a = parts[1]) !== null && _a !== void 0 ? _a : "");
    if (name === "")
        throw new Error(`${ID}: ${where}: the name is empty.`);
    if (name.length > 48)
        throw new Error(`${ID}: ${where}: the name is ${name.length} characters; at most 48.`);
    const key = parts[4] !== undefined && parts[4].trim() !== "" ? ancestryFoldAscii(parts[4]) : undefined;
    return { n, name, year: parseYear((_b = parts[2]) !== null && _b !== void 0 ? _b : "", where), place: ancestryFoldAscii((_c = parts[3]) !== null && _c !== void 0 ? _c : ""), ...(key !== undefined ? { key } : {}) };
}
/** The `ancestors` prop -> rows. Lines split on "|" or tab; blank lines and "#" lines are skipped; a duplicate n is refused. */
function ancestryParseRows(value) {
    let v = value === undefined ? exports.ANCESTRY_DEFAULT_ROWS : value;
    if (typeof v === "string") {
        const text = v.trim();
        if (text.startsWith("[")) {
            try {
                v = JSON.parse(text);
            }
            catch {
                throw new Error(`${ID}: ancestors looks like JSON but does not parse - pass rows "n | Name | year | place", one per line.`);
            }
        }
        else {
            v = text.split(/\r?\n/);
        }
    }
    if (!Array.isArray(v))
        throw new Error(`${ID}: ancestors must be rows "n | Name | year | place": a multi-line string or an array.`);
    const rows = [];
    const seen = new Map();
    v.forEach((item, i) => {
        const where = `ancestors[${i}]`;
        let row;
        if (typeof item === "string") {
            const line = item.trim();
            if (line === "" || line.startsWith("#"))
                return;
            row = rowFromParts(line.split(/\t|\|/).map((s) => s.trim()), where);
        }
        else if (item && typeof item === "object") {
            const o = item;
            const str = (k) => (o[k] === undefined || o[k] === null ? "" : String(o[k]));
            row = rowFromParts([str("n"), str("name"), str("year"), str("place"), ...(o.key !== undefined ? [str("key")] : [])], where);
        }
        else {
            throw new Error(`${ID}: ${where} must be a row string "n | Name | year | place" or an object { n, name, year, place }.`);
        }
        const prev = seen.get(row.n);
        if (prev !== undefined)
            throw new Error(`${ID}: ${where}: Ahnentafel number ${row.n} was already given by ancestors[${prev}].`);
        seen.set(row.n, i);
        rows.push(row);
    });
    if (rows.length === 0)
        throw new Error(`${ID}: ancestors has no rows - give at least the root person "1 | Name | year | place".`);
    if (!seen.has(1))
        throw new Error(`${ID}: ancestors has no row 1 (the root person).`);
    return rows;
}
/** The tags this template reads: INDI (NAME, BIRT/DEAT with DATE and PLAC, FAMC with PEDI) and FAM (HUSB, WIFE). Everything else is ignored. */
function ancestryParseGedcom(text) {
    var _a, _b;
    const indi = new Map();
    const fam = new Map();
    const order = [];
    let sawHead = false;
    let rec = null;
    let ctx1 = "";
    const lines = text.replace(/^﻿/, "").split(/\r?\n/);
    for (const raw of lines) {
        const m = /^\s*(\d+)\s+(?:(@[^@\s]+@)\s+)?([A-Za-z0-9_]+)(?:\s(.*))?$/.exec(raw);
        if (!m)
            continue;
        const level = Number(m[1]);
        const xref = (_a = m[2]) !== null && _a !== void 0 ? _a : null;
        const tag = m[3].toUpperCase();
        const value = ((_b = m[4]) !== null && _b !== void 0 ? _b : "").trim();
        if (level === 0) {
            ctx1 = "";
            if (tag === "HEAD")
                sawHead = true;
            if (tag === "INDI" && xref) {
                const v = { xref, name: "", birth: { date: "", place: "" }, death: { date: "", place: "" }, famc: [] };
                indi.set(xref, v);
                order.push(xref);
                rec = { kind: "INDI", v };
            }
            else if (tag === "FAM" && xref) {
                const v = { husb: null, wife: null };
                fam.set(xref, v);
                rec = { kind: "FAM", v };
            }
            else
                rec = null;
            continue;
        }
        if (!rec)
            continue;
        if (rec.kind === "INDI") {
            if (level === 1) {
                ctx1 = tag;
                if (tag === "NAME" && rec.v.name === "")
                    rec.v.name = value;
                if (tag === "FAMC" && value)
                    rec.v.famc.push({ fam: value, pedi: "" });
            }
            else if (level === 2) {
                if ((ctx1 === "BIRT" || ctx1 === "DEAT") && (tag === "DATE" || tag === "PLAC")) {
                    const ev = ctx1 === "BIRT" ? rec.v.birth : rec.v.death;
                    if (tag === "DATE" && ev.date === "")
                        ev.date = value;
                    if (tag === "PLAC" && ev.place === "")
                        ev.place = value;
                }
                else if (ctx1 === "FAMC" && tag === "PEDI" && rec.v.famc.length > 0) {
                    rec.v.famc[rec.v.famc.length - 1].pedi = value.toLowerCase();
                }
            }
        }
        else if (level === 1) {
            if (tag === "HUSB" && value)
                rec.v.husb = value;
            if (tag === "WIFE" && value)
                rec.v.wife = value;
        }
    }
    if (!sawHead)
        throw new Error(`${ID}: gedcom is not a GEDCOM file - no "0 HEAD" line.`);
    if (indi.size === 0)
        throw new Error(`${ID}: gedcom has no INDI records.`);
    return { indi, fam, order };
}
const APPROX = /^(ABT|EST|CAL|BEF|AFT|BET)\b/i;
function yearFromGedDate(date) {
    const m = /(\d{3,4})(?!\d)/.exec(date);
    if (!m)
        return "";
    return APPROX.test(date.trim()) ? `c. ${m[1]}` : m[1];
}
function nameFromGed(name, xref) {
    const folded = ancestryFoldAscii(name.replace(/\//g, " "));
    return folded === "" ? `no name ${xref}` : folded;
}
/** Walk FAMC -> HUSB / WIFE from the root into Ahnentafel 1..31. The FAMC with PEDI birth wins; otherwise the first. */
function ancestryRowsFromGedcom(text, root, event) {
    var _a;
    const g = ancestryParseGedcom(text);
    const rootX = root.trim() === "" ? g.order[0] : root.trim();
    if (!g.indi.has(rootX))
        throw new Error(`${ID}: root ${JSON.stringify(root)} is not an INDI in the GEDCOM (${g.indi.size} people; the first is ${g.order[0]}).`);
    const slots = new Array(exports.ANCESTRY_SLOTS + 1).fill(null);
    slots[1] = rootX;
    for (let n = 1; n <= 15; n++) {
        const x = slots[n];
        if (!x)
            continue;
        const p = g.indi.get(x);
        if (!p)
            continue;
        const famc = (_a = p.famc.find((f) => f.pedi === "birth")) !== null && _a !== void 0 ? _a : p.famc[0];
        if (!famc)
            continue;
        const f = g.fam.get(famc.fam);
        if (!f)
            continue;
        slots[2 * n] = f.husb && g.indi.has(f.husb) ? f.husb : null;
        slots[2 * n + 1] = f.wife && g.indi.has(f.wife) ? f.wife : null;
    }
    const rows = [];
    for (let n = 1; n <= exports.ANCESTRY_SLOTS; n++) {
        const x = slots[n];
        if (!x)
            continue;
        const p = g.indi.get(x);
        const ev = event === "death" ? p.death : p.birth;
        rows.push({ n, name: nameFromGed(p.name, x), year: yearFromGedDate(ev.date), place: ancestryFoldAscii(ev.place) });
    }
    return rows;
}
function ancestryModelOf(rows, opts) {
    var _a, _b;
    const people = new Array(exports.ANCESTRY_SLOTS + 1).fill(null);
    for (const r of rows) {
        people[r.n] = { n: r.n, gen: generationOf(r.n), name: r.name, year: r.year, place: r.place, key: ancestryKeyOf(r.place, r.key, opts.keyBy, opts.homeCountry) };
    }
    const known = people.filter((p) => p !== null).length;
    const groups = new Map();
    const unknownMembers = [];
    for (let n = 1; n <= exports.ANCESTRY_SLOTS; n++) {
        const p = people[n];
        if (!p || p.key === null) {
            unknownMembers.push(n);
            continue;
        }
        const id = p.key.toLowerCase();
        const g = groups.get(id);
        if (g)
            g.members.push(n);
        else
            groups.set(id, { label: p.key, members: [n] });
    }
    const ranked = [...groups.values()].sort((a, b) => b.members.length - a.members.length || a.members[0] - b.members[0]);
    const top = ranked.length > MAX_KEYS ? ranked.slice(0, MAX_KEYS) : ranked;
    const rest = ranked.length > MAX_KEYS ? ranked.slice(MAX_KEYS) : [];
    const over = (label, fallback) => { var _a; return (_a = opts.colors.get(label.toLowerCase())) !== null && _a !== void 0 ? _a : fallback; };
    const legend = top.map((g, i) => ({ kind: "key", label: g.label, count: g.members.length, color: over(g.label, exports.ANCESTRY_PALETTE[i]), members: g.members }));
    if (rest.length > 0) {
        const members = rest.flatMap((g) => g.members).sort((a, b) => a - b);
        legend.push({ kind: "other", label: "Other", count: members.length, color: over("Other", exports.ANCESTRY_PALETTE[exports.ANCESTRY_PALETTE.length - 1]), members });
    }
    legend.push({ kind: "unknown", label: "Unknown", count: unknownMembers.length, color: over("Unknown", THEME.unknown), members: unknownMembers });
    const entryOf = new Array(exports.ANCESTRY_SLOTS + 1).fill(legend.length - 1);
    legend.forEach((e, i) => e.members.forEach((n) => (entryOf[n] = i)));
    return { people, known, legend, entryOf, rootName: (_b = (_a = people[1]) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "", event: opts.event };
}
/** The generations' shares of the replay: the root alone is short, the cascade of 16 is long. */
const GEN_SHARES = [0.1, 0.15, 0.2, 0.25, 0.3];
function round3(n) {
    return Math.round(n * 1000) / 1000;
}
/** 0-8% the finished chart, 8-14% the reset, 14-84% the replay (generation g over its share, its cells at equal spacing in Ahnentafel order), then the finished chart. */
function ancestryBeatsOf(clipSec) {
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
    const lands = [0];
    for (let n = 1; n <= exports.ANCESTRY_SLOTS; n++) {
        const g = generationOf(n);
        const count = 2 ** g;
        const j = n - count;
        lands.push(round3(gens[g].start + ((gens[g].end - gens[g].start) * j) / count));
    }
    return { clip: clipSec, hook, start, end, gens, lands };
}
function fiveSmoothDown(n) {
    for (let v = Math.max(1, Math.floor(n)); v >= 1; v--) {
        let m = v;
        for (const p of [2, 3, 5])
            while (m % p === 0)
                m /= p;
        if (m === 1)
            return v;
    }
    return 1;
}
/** A rect of `w0 x h0` shrunk to 5-smooth sides and centred where it was. */
function smoothRect(x, y, w0, h0) {
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
const measureCache = new Map();
function textW(text, px, bold = false) {
    const k = (bold ? "b:" : "r:") + text;
    let w = measureCache.get(k);
    if (w === undefined) {
        w = (0, text_1.widthOf)(text, MEASURE_REF, bold);
        measureCache.set(k, w);
    }
    return (w * px) / MEASURE_REF;
}
/** Greedy word wrap on the cached ruler; a word wider than the box is the caller's problem (it checks). */
function wrapWords(text, px, maxW, bold) {
    const words = text.split(" ").filter((w) => w.length > 0);
    const lines = [];
    let cur = "";
    for (const w of words) {
        const next = cur ? `${cur} ${w}` : w;
        if (cur && textW(next, px, bold) > maxW) {
            lines.push(cur);
            cur = w;
        }
        else
            cur = next;
    }
    if (cur)
        lines.push(cur);
    return lines;
}
/** One line shrunk until it fits `maxW`; null when it does not fit even at `minPx`. */
function fitOne(text, maxW, maxPx, minPx, bold = false) {
    let px = Math.max(minPx, Math.round(maxPx));
    while (px > minPx && textW(text, px, bold) > maxW)
        px = Math.max(minPx, Math.round(px * 0.92));
    const width = (0, text_1.widthOf)(text, px, bold);
    return width > maxW ? null : { text, px, width };
}
/** A title: one line down to 70% of `maxPx`, then up to two lines, shrinking to the box. Never an ellipsis. */
function titleBlock(text, w, h, maxPx, bold) {
    const maxW = (0, text_1.budget)(w);
    const widest = (lines, px) => Math.max(...lines.map((l) => (0, text_1.widthOf)(l, px, bold)));
    let px = Math.max(MIN_PX, Math.round(Math.min(maxPx, h / LH)));
    const floorOne = Math.max(MIN_PX, Math.round(px * 0.7));
    for (; px >= floorOne; px = Math.min(px - 1, Math.round(px * 0.94))) {
        if (textW(text, px, bold) <= maxW)
            return { lines: [text], px, width: (0, text_1.widthOf)(text, px, bold) };
        if (px <= MIN_PX)
            break;
    }
    px = Math.max(MIN_PX, Math.min(floorOne, Math.floor(h / (2 * LH))));
    for (;;) {
        const lines = (0, text_1.wrapFit)(text, px, maxW);
        if ((lines.length <= 2 && widest(lines, px) <= maxW && lines.length * px * LH <= h) || px <= MIN_PX) {
            return { lines, px, width: widest(lines, px) };
        }
        px = Math.max(MIN_PX, Math.min(px - 1, Math.floor(px * 0.94)));
    }
}
/** The copy tiers a column can show, richest first. */
exports.ANCESTRY_TIERS = ["name-year-place", "name-year", "name", "surname", "number", "none"];
function copyFor(p, n, tier) {
    var _a;
    const name = p ? `${n} ${p.name}` : `${n} unknown`;
    switch (tier) {
        case 0: {
            const meta = p ? [p.year, (_a = p.key) !== null && _a !== void 0 ? _a : ""].filter((s) => s !== "").join(" - ") : "";
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
/** The richest tier whose font clears `floorPx` for EVERY cell of the column; one size for the whole column. */
function ancestryFitColumn(people, numbers, innerW, innerH, capPx, floorPx) {
    var _a;
    const maxW = (0, text_1.budget)(innerW);
    for (let tier = 0; tier < 5; tier++) {
        const maxLines = tier <= 1 ? 2 : 1;
        const copies = numbers.map((n) => copyFor(people[n], n, tier));
        let px = Math.max(floorPx, Math.round(capPx));
        for (; px >= floorPx; px = Math.max(floorPx, Math.min(px - 1, Math.round(px * 0.94)))) {
            const metaPx = Math.max(MIN_PX, Math.round(px * 0.82));
            const cells = [];
            let ok = true;
            for (let i = 0; i < copies.length && ok; i++) {
                const c = copies[i];
                const nameText = (_a = c.name) !== null && _a !== void 0 ? _a : "";
                if (nameText.split(" ").some((w) => textW(w, px, true) > maxW))
                    ok = false;
                const nameLines = maxLines === 1 ? [nameText] : wrapWords(nameText, px, maxW, true);
                if (nameLines.length > maxLines)
                    ok = false;
                const nameWidth = Math.max(...nameLines.map((l) => textW(l, px, true)));
                if (nameWidth > maxW)
                    ok = false;
                const metaWidth = c.meta ? textW(c.meta, metaPx) : 0;
                if (metaWidth > maxW)
                    ok = false;
                const h = (nameLines.length - 1) * px * LH + px + (c.meta ? metaPx * LH : 0);
                if (h > innerH)
                    ok = false;
                cells.push({ n: numbers[i], nameLines, nameWidth, meta: c.meta, metaWidth });
            }
            if (ok) {
                // the chosen lines, measured exactly for the contract (and refused if the ruler was optimistic)
                for (const cell of cells) {
                    cell.nameWidth = Math.max(...cell.nameLines.map((l) => (0, text_1.widthOf)(l, px, true)));
                    cell.metaWidth = cell.meta ? (0, text_1.widthOf)(cell.meta, metaPx) : 0;
                    if (cell.nameWidth > maxW || cell.metaWidth > maxW)
                        ok = false;
                }
                if (ok)
                    return { tier: exports.ANCESTRY_TIERS[tier], px, metaPx, cells };
            }
            if (px === floorPx)
                break;
        }
    }
    return { tier: "none", px: 0, metaPx: 0, cells: numbers.map((n) => ({ n, nameLines: [], nameWidth: 0, meta: null, metaWidth: 0 })) };
}
const HEAD_TIERS = [
    ["YOU", "PARENTS", "GRANDPARENTS", "GREAT-GRANDPARENTS", "2X GREAT-GRANDPARENTS"],
    ["YOU", "PARENTS", "GRANDPARENTS", "GREAT-GP", "2X GREAT-GP"],
    ["G1", "G2", "G3", "G4", "G5"],
];
function ancestryLayout(model, copy, W, H) {
    var _a;
    const stacked = W < H * 1.3;
    const U = Math.min(W, H);
    const mx = Math.round(0.03 * W);
    const cw = W - 2 * mx;
    // ── header ──
    let titleRect;
    let subRect;
    let chartTop;
    if (!stacked) {
        titleRect = { x: mx, y: Math.round(0.03 * H), w: Math.round(0.6 * W), h: Math.round(0.085 * H) };
        const sw = Math.round(0.32 * W);
        subRect = { x: W - mx - sw, y: Math.round(0.04 * H), w: sw, h: Math.round(0.065 * H) };
        chartTop = Math.round(0.14 * H);
    }
    else {
        titleRect = { x: mx, y: Math.round(0.02 * U), w: cw, h: Math.round(0.065 * U) };
        subRect = { x: mx, y: titleRect.y + titleRect.h, w: cw, h: Math.round(0.035 * U) };
        chartTop = subRect.y + subRect.h + Math.round(0.015 * U);
    }
    const title = { rect: titleRect, block: titleBlock(copy.title, titleRect.w, titleRect.h, (stacked ? 0.05 : 0.06) * U, true) };
    const subFit = (_a = fitOne(copy.subtitle, (0, text_1.budget)(subRect.w), Math.min(0.028 * U, subRect.h / LH), MIN_PX)) !== null && _a !== void 0 ? _a : { text: copy.subtitle, px: MIN_PX, width: (0, text_1.widthOf)(copy.subtitle, MIN_PX) };
    const subtitle = { rect: subRect, fit: subFit };
    // ── legend: the row count that gives the largest label ──
    const k = model.legend.length;
    const rowH = Math.round((stacked ? 0.04 : 0.055) * (stacked ? U : H));
    const pad = Math.max(1, Math.round(0.006 * U));
    const longest = model.legend.reduce((s, e) => {
        const t = `${e.label} ${e.count}`;
        return t.length > s.length ? t : s;
    }, "");
    let best = null;
    for (const rows of [1, 2, 3]) {
        const cols = Math.ceil(k / rows);
        const cellW = Math.floor(cw / cols);
        const sw = Math.round(rowH * 0.55);
        const labelW = cellW - sw - 3 * pad;
        const fit = fitOne(longest, (0, text_1.budget)(Math.max(8, labelW)), Math.min(0.03 * U, rowH / LH), MIN_PX);
        const px = fit ? fit.px : 0;
        if (!best || px > best.px)
            best = { rows, px, cols, cellW, sw, labelW };
    }
    const lg = best;
    const mb = Math.round((stacked ? 0.025 : 0.03) * (stacked ? U : H));
    const bandH = lg.rows * rowH;
    const band = { x: mx, y: H - mb - bandH, w: cw, h: bandH };
    const items = model.legend.map((e, i) => {
        var _a;
        const row = Math.floor(i / lg.cols);
        const col = i % lg.cols;
        const x = mx + col * lg.cellW;
        const y = band.y + row * rowH;
        const text = `${e.label} ${e.count}`;
        const fit = (_a = fitOne(text, (0, text_1.budget)(Math.max(8, lg.labelW)), lg.px, MIN_PX)) !== null && _a !== void 0 ? _a : { text, px: MIN_PX, width: (0, text_1.widthOf)(text, MIN_PX) };
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
    const pitchX = chart.w / (0, template_utils_1.latticeMaxSlots)(chart.w);
    const pitchY = chart.h / (0, template_utils_1.latticeMaxSlots)(chart.h);
    const gap = Math.max(1, Math.round(0.0025 * U));
    const headH = Math.max(pitchY, Math.round((0.06 * chart.h) / pitchY) * pitchY);
    const colW = Math.max(pitchX, Math.floor(chart.w / GENERATIONS / pitchX) * pitchX);
    const colX0 = Math.floor((chart.w - GENERATIONS * colW) / 2 / pitchX) * pitchX;
    const cellsH = chart.h - headH;
    const unit = Math.max(pitchY, Math.floor(cellsH / 16 / pitchY) * pitchY);
    const cellsY0 = headH + Math.max(0, Math.floor((cellsH - 16 * unit) / 2 / pitchY) * pitchY);
    const gh = Math.ceil(gap / 2);
    const cells = [{ x: 0, y: 0, w: 0, h: 0 }];
    for (let n = 1; n <= exports.ANCESTRY_SLOTS; n++) {
        const g = generationOf(n);
        const h0 = unit * 2 ** (GENERATIONS - 1 - g);
        const j = n - 2 ** g;
        cells.push({ x: colX0 + g * colW + gh, y: cellsY0 + j * h0 + gh, w: colW - gap, h: h0 - gap });
    }
    // generation headers: one tier for all five
    const headMaxPx = Math.min(0.024 * U, (headH - gap) / LH);
    let head = [];
    for (let t = 0; t < HEAD_TIERS.length; t++) {
        const labels = HEAD_TIERS[t];
        const widest = labels.reduce((s, l) => ((0, text_1.widthOf)(l, 10, true) > (0, text_1.widthOf)(s, 10, true) ? l : s), labels[0]);
        const fit = fitOne(widest, (0, text_1.budget)(colW - gap), headMaxPx, MIN_PX, true);
        if (!fit)
            continue;
        if (fit.px >= MIN_PX + 1 || t === HEAD_TIERS.length - 1) {
            head = labels.map((l, g) => ({ rect: { x: colX0 + g * colW + gh, y: 0, w: colW - gap, h: headH - gap }, fit: { text: l, px: fit.px, width: (0, text_1.widthOf)(l, fit.px, true) } }));
            break;
        }
    }
    if (head.length === 0)
        head = HEAD_TIERS[2].map((l, g) => ({ rect: { x: colX0 + g * colW + gh, y: 0, w: colW - gap, h: headH - gap }, fit: { text: l, px: MIN_PX, width: (0, text_1.widthOf)(l, MIN_PX, true) } }));
    // cell copy: per column
    const floorPx = Math.max(MIN_PX, Math.round(0.011 * U));
    const columns = [];
    for (let g = 0; g < GENERATIONS; g++) {
        const numbers = [];
        for (let n = 2 ** g; n < 2 ** (g + 1); n++)
            numbers.push(n);
        const inner = cellInner(cells[numbers[0]], U);
        const capPx = Math.min((g === 0 ? 0.036 : 0.03) * U, inner.h / 1.02);
        columns.push(ancestryFitColumn(model.people, numbers, inner.w, inner.h, capPx, floorPx));
    }
    return { W, H, U, stacked, title, subtitle, chart, headH, head, gap, pad, colW, unit, cells, columns, legend: { band, rows: lg.rows, px: lg.px, items } };
}
/** The copy's box inside a cell frame: a pad that shrinks with the cell, and none vertically when the cell is a sliver. */
function cellInner(frame, U) {
    const padX = Math.max(1, Math.min(Math.round(0.01 * U), Math.round(frame.h * 0.12)));
    const padY = frame.h < 14 ? 0 : padX;
    return { x: frame.x + padX, y: frame.y + padY, w: frame.w - 2 * padX, h: frame.h - 2 * padY };
}
/* ── the contract ── */
function layoutContract(L) {
    const out = [
        (0, layout_1.textFitsMeasured)("title", L.title.block.lines.join("\n"), L.title.block.px, L.title.block.width),
        (0, layout_1.textFitsMeasured)("subtitle", L.subtitle.fit.text, L.subtitle.fit.px, L.subtitle.fit.width),
        { label: "title", within: { yFrac: [0, 0.18] } },
        { label: "chart", within: { yFrac: [0.05, 0.95] } },
        { label: "legend", within: { yFrac: [0.6, 1] }, minWidthFrac: 0.9 },
    ];
    for (let g = 0; g < GENERATIONS; g++)
        out.push({ label: `ancestor-cell-g${g + 1}` });
    L.head.forEach((h, g) => out.push((0, layout_1.textFitsMeasured)(`gen-head-${g + 1}`, h.fit.text, h.fit.px, h.fit.width)));
    L.columns.forEach((c, g) => {
        var _a;
        if (c.tier === "none")
            return;
        const widestName = c.cells.reduce((s, cell) => (cell.nameWidth > s.nameWidth ? cell : s), c.cells[0]);
        const line = widestName.nameLines.reduce((s, l) => ((0, text_1.widthOf)(l, c.px, true) > (0, text_1.widthOf)(s, c.px, true) ? l : s), (_a = widestName.nameLines[0]) !== null && _a !== void 0 ? _a : "");
        out.push((0, layout_1.textFitsMeasured)(`cell-name-g${g + 1}`, line, c.px, widestName.nameWidth));
        const widestMeta = c.cells.filter((cell) => cell.meta).reduce((s, cell) => (!s || cell.metaWidth > s.metaWidth ? cell : s), null);
        if (widestMeta)
            out.push((0, layout_1.textFitsMeasured)(`cell-meta-g${g + 1}`, widestMeta.meta, c.metaPx, widestMeta.metaWidth));
    });
    L.legend.items.forEach((it, i) => out.push((0, layout_1.textFitsMeasured)(`legend-label-${i}`, it.fit.text, it.fit.px, it.fit.width)));
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
function cellRelations() {
    const out = [];
    for (let g = 1; g < GENERATIONS; g++)
        out.push({ label: `ancestor-cell-g${g + 1}`, equal: "height", tolerance: 0.08, tolerancePx: 6 });
    out.push({ label: Array.from({ length: GENERATIONS }, (_, g) => `ancestor-cell-g${g + 1}`), equal: "width", tolerance: 0.08, tolerancePx: 6 });
    return out;
}
/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts). Filled from journal/2026-10-09/.
 */
const WHY = {
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
const propsSchema = (0, template_utils_1.definePropsSchema)({
    title: {
        type: "string",
        required: false,
        description: "Header title (1-60 characters). Empty makes it automatic: \"<ROOT NAME> - ANCESTOR BIRTHPLACES\" (DEATH PLACES when event is death). The rect that shows it is bound to it.",
        meta: { control: { placeholder: "automatic" }, ui: { label: "Title", order: 1 } },
    },
    ancestors: {
        type: "json",
        required: false,
        description: 'One row per ancestor, "n | Name | year | place" with an optional fifth field "key": n is the Ahnentafel number 1..31 (1 = you, 2n = father of n, 2n+1 = mother of n), year is empty, "1850" or "c. 1850", place is GEDCOM order (smallest first, country last). Tabs separate fields too, so a spreadsheet paste works. One multi-line string, an array of such strings, or objects { n, name, year, place, key }. Missing numbers are unknown (grey). Replaced by gedcom when gedcom is not empty.',
        meta: {
            constraints: { jsonSchema: { anyOf: [{ type: "string" }, { type: "array", items: { anyOf: [{ type: "string" }, { type: "object" }] } }] } },
            control: { multiline: true, mono: true },
            ui: { label: "Ancestors", order: 2, primary: true },
        },
    },
    gedcom: {
        type: "string",
        required: false,
        description: "The text of a GEDCOM 5.5.1 or 7.0 file (paste the whole file). Only INDI (NAME, BIRT, DEAT, FAMC) and FAM (HUSB, WIFE) are read; FAMC with PEDI birth wins over other links. When set it replaces ancestors. On the CLI pass it through a props file (--props @props.json).",
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
function numberOr(value, fallback, min, max) {
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
exports.AncestorBirthplaceChartV1 = (0, template_utils_1.defineMosaicTemplate)({
    ...UNBOUND,
    id: (0, types_1.asTemplateId)(ID),
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
    resolveOutputHints: (props) => ({ durationMs: numberOr(props === null || props === void 0 ? void 0 : props.clipSec, DEFAULTS.clipSec, MIN_CLIP_SEC, MAX_CLIP_SEC) * 1000 }),
    propsSchema,
    defaultProps: {
        title: DEFAULTS.title,
        ancestors: exports.ANCESTRY_DEFAULT_ROWS,
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
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.AncestorBirthplaceChartV1;
function pickText(value, fallback, name, max) {
    if (value === undefined)
        return fallback;
    if (typeof value !== "string")
        throw new Error(`${ID}: ${name} must be a string.`);
    const s = ancestryFoldAscii(value);
    if (s.length > max)
        throw new Error(`${ID}: ${name} is ${s.length} characters; at most ${max}.`);
    return s;
}
function pickChoice(value, fallback, name, allowed) {
    if (value === undefined || value === "")
        return fallback;
    if (typeof value !== "string" || !allowed.includes(value))
        throw new Error(`${ID}: ${name} must be one of ${allowed.map((a) => JSON.stringify(a)).join(", ")}. Got ${JSON.stringify(value)}.`);
    return value;
}
function pickColors(value) {
    let v = value;
    if (v === undefined || v === "")
        return new Map();
    if (typeof v === "string") {
        try {
            v = JSON.parse(v);
        }
        catch {
            throw new Error(`${ID}: colors is not valid JSON - pass an object like {"Ohio":"#e3a857"}.`);
        }
    }
    if (!v || typeof v !== "object" || Array.isArray(v))
        throw new Error(`${ID}: colors must be an object like {"Ohio":"#e3a857"}.`);
    const out = new Map();
    for (const [k, c] of Object.entries(v)) {
        if (typeof c !== "string" || !HEX.test(c.trim()))
            throw new Error(`${ID}: colors.${k} ${JSON.stringify(c)} must be #rrggbb.`);
        out.set(ancestryFoldAscii(k).toLowerCase(), c.trim().toLowerCase());
    }
    return out;
}
/** A static svg cell with a gate. */
function gated(cell, gate) {
    return { ...cell, overlay: gate };
}
/** Shown in the cold open and from `at` on: ONE gate for two windows, so no `window` twin. */
function openAndFrom(hook, at) {
    return { enable: `lt(t,${hook})+gte(t,${at})` };
}
const windowGate = (from, to) => ({ enable: `gte(t,${from})*lt(t,${to})`, window: { startSec: from, endSec: to } });
async function render(props, ctx) {
    var _a, _b;
    // The schema is documentation; render() is the gate.
    const titleProp = pickText(props.title, DEFAULTS.title, "title", 60);
    const event = pickChoice(props.event, DEFAULTS.event, "event", EVENTS);
    const keyBy = pickChoice(props.keyBy, DEFAULTS.keyBy, "keyBy", KEY_MODES);
    const homeCountry = pickText(props.homeCountry, DEFAULTS.homeCountry, "homeCountry", 40) || DEFAULTS.homeCountry;
    const colors = pickColors(props.colors);
    if (props.gedcom !== undefined && typeof props.gedcom !== "string")
        throw new Error(`${ID}: gedcom must be the text of a GEDCOM file.`);
    if (props.root !== undefined && typeof props.root !== "string")
        throw new Error(`${ID}: root must be a GEDCOM xref string like "@I12@".`);
    const gedcom = ((_a = props.gedcom) !== null && _a !== void 0 ? _a : "").trim();
    const clipSec = (() => {
        const v = props.clipSec;
        if (v === undefined)
            return DEFAULTS.clipSec;
        const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
        if (typeof n !== "number" || !Number.isInteger(n) || n < MIN_CLIP_SEC || n > MAX_CLIP_SEC) {
            throw new Error(`${ID}: clipSec must be a whole number between ${MIN_CLIP_SEC} and ${MAX_CLIP_SEC}. Got ${JSON.stringify(v)}.`);
        }
        return n;
    })();
    const rows = gedcom.length > 0 ? ancestryRowsFromGedcom(gedcom, (_b = props.root) !== null && _b !== void 0 ? _b : "", event) : ancestryParseRows(props.ancestors);
    const model = ancestryModelOf(rows, { keyBy, homeCountry, colors, event });
    const isSample = gedcom.length === 0 && (props.ancestors === undefined || props.ancestors === exports.ANCESTRY_DEFAULT_ROWS);
    const title = titleProp !== "" ? titleProp : `${model.rootName.toUpperCase()} - ANCESTOR ${event === "death" ? "DEATH PLACES" : "BIRTHPLACES"}`;
    const subtitle = `${isSample ? "Fictional sample family" : `${GENERATIONS} generations`} - ${model.known} of ${exports.ANCESTRY_SLOTS} known`;
    // The clip is authored. An explicit user pin wins and BECOMES the clip; the host-seeded target is never read as one.
    const pinned = (0, template_utils_1.resolvePinnedDurationMs)(ctx);
    const clip = pinned !== undefined ? Math.max(1, pinned / 1000) : clipSec;
    const durationMs = pinned !== undefined ? Math.round(pinned) : clipSec * 1000;
    const b = ancestryBeatsOf(clip);
    const W = Math.max(1, Math.round(ctx.target.width));
    const H = Math.max(1, Math.round(ctx.target.height));
    const L = ancestryLayout(model, { title, subtitle }, W, H);
    const pieces = [];
    const piece = (rect, importance, source) => pieces.push({ rect: { ...rect, importance }, source });
    // ── 1. the chart: a CHILD document on a 5-smooth canvas, no masks. A paper
    //      tile under everything (the contract's "chart" - a child's own label
    //      does not survive flattening), the header strip with its tinted
    //      "now" band, then per cell a blank tile, the gated colour tile and
    //      the static copy. ──
    const chartPieces = [];
    const cpiece = (rect, importance, source) => chartPieces.push({ rect: { ...rect, importance }, source });
    cpiece({ x: 0, y: 0, w: L.chart.w, h: L.chart.h }, 1, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(THEME.paper), "chart"));
    L.head.forEach((h, g) => {
        cpiece(h.rect, 2, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(THEME.headNow, { overlay: windowGate(b.gens[g].start, b.gens[g].end) }), `gen-now-${g + 1}`));
        cpiece(h.rect, 4, (0, template_utils_1.tag)((0, text_1.textCell)({ text: h.fit.text, fontSize: h.fit.px, color: THEME.dim, hAlign: "center", bold: true, vAlign: "middle", label: `gen-head-${g + 1}` }), `gen-head-${g + 1}`));
    });
    for (let n = 1; n <= exports.ANCESTRY_SLOTS; n++) {
        const g = generationOf(n);
        const frame = L.cells[n];
        const entry = model.legend[model.entryOf[n]];
        const ink = inkFor(entry.color);
        const gate = openAndFrom(b.hook, b.lands[n]);
        cpiece(frame, 2, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(THEME.blank), `ancestor-cell-g${g + 1}`));
        cpiece(frame, 3, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(entry.color, { overlay: gate }), `ancestor-fill-${n}`));
        const col = L.columns[g];
        const cell = col.cells.find((c) => c.n === n);
        if (!cell || col.tier === "none" || cell.nameLines.length === 0)
            continue;
        const inner = cellInner(frame, L.U);
        const nameH = Math.min(inner.h, Math.round((cell.nameLines.length - 1) * col.px * LH + col.px * 1.02));
        const metaH = cell.meta ? Math.round(col.metaPx * LH) : 0;
        const blockH = nameH + metaH;
        const top = inner.y + Math.max(0, Math.floor((inner.h - blockH) / 2));
        // a fill dark enough to need white ink gates its copy to the landing too (the reset's blank is pale)
        const text = (src) => (ink.light ? gated(src, gate) : src);
        cpiece({ x: inner.x, y: top, w: inner.w, h: Math.min(nameH, inner.h) }, 4, text((0, template_utils_1.tag)((0, text_1.textCell)({ text: cell.nameLines.join("\n"), fontSize: col.px, color: ink.color, hAlign: "left", bold: true, vAlign: "middle", label: `cell-name-g${g + 1}` }), `cell-name-g${g + 1}`)));
        if (cell.meta && metaH > 0 && top + nameH + metaH <= inner.y + inner.h + 1) {
            cpiece({ x: inner.x, y: top + nameH, w: inner.w, h: metaH }, 4, text((0, template_utils_1.tag)((0, text_1.textCell)({ text: cell.meta, fontSize: col.metaPx, color: ink.color, hAlign: "left", vAlign: "middle", label: `cell-meta-g${g + 1}` }), `cell-meta-g${g + 1}`)));
        }
    }
    const chartPlaced = (0, template_utils_1.placeInsetPieces)({ rootW: L.chart.w, rootH: L.chart.h, pieces: chartPieces });
    const children = {};
    children.chart = {
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(chartPlaced.m0, ID),
        assets: {},
        size: { width: L.chart.w, height: L.chart.h },
        fps: ctx.target.fps,
        durationMs,
        backgroundColor: THEME.paper,
        sources: chartPlaced.sources,
        editor: { label: `pedigree - ${model.known} of ${exports.ANCESTRY_SLOTS} known` },
    };
    piece(L.chart, 1, (0, template_utils_1.tag)({ type: "mosaic", ref: "chart", placement: { fit: "contain" } }, "chart-child"));
    // ── 2. the header ──
    piece(L.title.rect, 3, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, text_1.textCell)({ text: L.title.block.lines.join("\n"), fontSize: L.title.block.px, color: THEME.ink, hAlign: "left", bold: true, vAlign: "middle", label: "title" }), "title"), "title"));
    piece(L.subtitle.rect, 3, (0, template_utils_1.tag)((0, text_1.textCell)({ text: L.subtitle.fit.text, fontSize: L.subtitle.fit.px, color: THEME.dim, hAlign: L.stacked ? "left" : "right", vAlign: "middle", label: "subtitle" }), "subtitle"));
    // ── 3. the legend: a paper band (the contract's "legend"), a swatch and a counted label per entry ──
    piece(L.legend.band, 1, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(THEME.paper), "legend"));
    L.legend.items.forEach((it, i) => {
        const e = model.legend[i];
        piece(it.swatch, 2, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(e.color), "legend-swatch"));
        piece(it.label, 3, (0, template_utils_1.tag)((0, text_1.textCell)({ text: it.fit.text, fontSize: it.fit.px, color: THEME.ink, hAlign: "left", vAlign: "middle", label: `legend-label-${i}` }), `legend-label-${i}`));
    });
    const placed = (0, template_utils_1.placeInsetPieces)({ rootW: W, rootH: H, pieces });
    const doc = {
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(placed.m0, ID),
        assets: {},
        size: { width: W, height: H },
        fps: ctx.target.fps,
        // The clip is authored, so it out-ranks the hint.
        durationMs,
        backgroundColor: THEME.paper,
        sources: placed.sources,
        children,
        editor: { label: `Ancestor Birthplace Chart - ${model.rootName} - ${model.known} of ${exports.ANCESTRY_SLOTS} known - ${model.legend.length} keys` },
    };
    return (0, layout_1.withLayoutIntent)(doc, ctx, { templateId: ID, constraints: layoutContract(L), relations: cellRelations(), debug: props.debugLayout === true });
}
