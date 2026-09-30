import type { MosaicColor, MosaicDocument, MosaicEngineContext } from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import { bindProp, defineMosaicTemplate, definePropsSchema, makeColorTile, placeInsetPieces, tag } from "@m0saic/template-utils";
import type { LayoutConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/events/homebrew-serving-card/v1` - a serving card for one
 * homebrew (name, style, strength, brewer) from the fields a recipe export
 * already carries: mostly white, dark type, thin rules.
 *
 * ONE CONCEPT: a number says what kind of number it is. `abv` is a STRING so
 * "" (not supplied) and "0" (a real zero) both survive the defaults merge,
 * and the line under the percentage reads Estimated ABV, Batch ABV or Not
 * supplied - never a default standing in for a missing value.
 *
 * The rule that bites: the type floor is 10/270 of the short side (40 px at
 * 1080), and 48 of the widest glyph must still fit above it. Fixed boxes
 * cannot promise that on a square, so the boxes are sized FROM the fitted
 * text: each group fits its supporting line first, gives the primary the
 * rest and is centred in its region, and the footer grows into the bottom
 * fifth before a long brewer credit is refused.
 */

export type AbvBasis = "estimated" | "batch";
export type HomebrewServingCardProps = {
  /** The beer's name - BeerXML RECIPE.NAME. */
  beerName?: string;
  /** The style under the name - BeerXML RECIPE.STYLE.NAME. */
  beerStyle?: string;
  /** Alcohol by volume as decimal text ("5.2"); "" when no value is available. */
  abv?: string;
  /** What kind of number `abv` is: the recipe estimate, or the batch's own value. */
  abvBasis?: AbvBasis;
  /** Footer credit - BeerXML RECIPE.BREWER; "" hides the credit and its prefix. */
  brewer?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/events/homebrew-serving-card/v1";
const INK = "#161616" as MosaicColor;
const SUPPORT = "#3c3c3c" as MosaicColor;
/** The page: document.backgroundColor, never a full-canvas rect (doctor: canvasFill). */
const PAGE = "#ffffff" as MosaicColor;
/** Variant a draws a thin rule between the identity and the strength; b leaves the gutter open. */
const DIVIDED = true;
const LINE = 1.2;

const DEFAULTS = {
  beerName: "Workshop Pale Ale",
  beerStyle: "American Pale Ale",
  abv: "5.2",
  abvBasis: "estimated" as AbvBasis,
  brewer: "Example Homebrew Club",
  debugLayout: false,
};

const propsSchema = definePropsSchema<HomebrewServingCardProps>({
  beerName: {
    type: "string",
    required: false,
    description: "The beer's name (BeerXML RECIPE.NAME); 1-48 printable ASCII characters. A blank value is an error, not a request for the sample.",
    meta: { control: { placeholder: DEFAULTS.beerName }, ui: { label: "Beer name", order: 1 } },
  },
  beerStyle: {
    type: "string",
    required: false,
    description: "The style under the name (BeerXML RECIPE.STYLE.NAME); 1-48 printable ASCII characters.",
    meta: { control: { placeholder: DEFAULTS.beerStyle }, ui: { label: "Style", order: 2 } },
  },
  abv: {
    type: "string",
    required: false,
    description: 'Alcohol by volume as decimal text, 0-100 with at most two decimals and no percent sign ("5.2", "0", "5.20"). Leave it empty when no value is available: the card then says so instead of showing a number.',
    meta: { control: { placeholder: DEFAULTS.abv }, ui: { label: "ABV", order: 3 } },
  },
  abvBasis: {
    type: "string",
    required: false,
    description: 'What kind of number the ABV is: "estimated" (the recipe estimate, BeerXML EST_ABV) or "batch" (the value derived for this batch, BeerXML ABV). Shown under the number.',
    meta: { constraints: { oneOf: ["estimated", "batch"] }, ui: { label: "ABV basis", order: 4 } },
  },
  brewer: {
    type: "string",
    required: false,
    description: "Footer credit (BeerXML RECIPE.BREWER); up to 48 printable ASCII characters. Empty hides the credit and its BREWER: prefix.",
    meta: { control: { placeholder: DEFAULTS.brewer }, ui: { label: "Brewer", order: 5 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the regions stay where the design says) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

function fail(field: string, rule: string): never { throw new Error(`${ID}: ${field} ${rule}`); }
/** Single-line printable ASCII, trimmed. The limit is a supported-input boundary: a letter is refused, never dropped. */
function ascii(value: unknown, field: string, min: number): string {
  if (typeof value !== "string") fail(field, "must be a string.");
  if (/[^\x20-\x7e]/.test(value)) fail(field, "must be single-line printable ASCII (no control characters; type an accented letter without its accent).");
  const s = value.trim();
  if (s.length < min) fail(field, "must not be blank (a blank value does not restore the sample).");
  if (s.length > 48) fail(field, "must have at most 48 characters after trimming.");
  return s;
}
/** The schema is documentation; this is the gate. Explicit values are validated, only `undefined` takes a default. */
export function normalizeServingCard(props: HomebrewServingCardProps) {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => v !== undefined)) };
  const beerName = ascii(p.beerName, "beerName", 1);
  const beerStyle = ascii(p.beerStyle, "beerStyle", 1);
  const brewer = ascii(p.brewer, "brewer", 0);
  const abv = ascii(p.abv, "abv", 0);
  if (abv !== "" && (!/^(0|[1-9]\d{0,2})(\.\d{1,2})?$/.test(abv) || Number(abv) > 100)) fail("abv", 'must be an unsigned decimal from 0 to 100 with at most two decimals and no percent sign, such as "5.2" (leave it empty when no value is available).');
  if (p.abvBasis !== "estimated" && p.abvBasis !== "batch") fail("abvBasis", 'must be "estimated" or "batch".');
  if (typeof p.debugLayout !== "boolean") fail("debugLayout", "must be a boolean.");
  return {
    beerName, beerStyle, brewer, abv, abvBasis: p.abvBasis as AbvBasis, debugLayout: p.debugLayout,
    // The digits are the caller's: no rounding, no padding. A missing value changes the words, never the number.
    value: abv === "" ? "ABV" : `${abv}%`,
    qualifier: abv === "" ? "Not supplied" : p.abvBasis === "batch" ? "Batch ABV" : "Estimated ABV",
    credit: brewer === "" ? null : `BREWER: ${brewer}`,
  };
}

/** The readability floor: 10 px on a 270 px short side, scaled with the canvas. */
export const servingCardFloorPx = (W: number, H: number): number => Math.ceil((10 * Math.min(W, H)) / 270);
/** The box a fitted block needs - the contract's `cell * 0.94 - 2px` allowance, inverted. */
const boxFor = (lines: number, px: number): number => Math.ceil((lines * px * LINE + 2) / 0.94);

/**
 * Lossless line breaks. Break at the last space that fits - unless the word
 * after it could not fit a line of its own: it has to be split anyway, so it
 * starts on this line. No hyphen is added and no glyph is dropped.
 */
function wrap(text: string, px: number, maxW: number, bold: boolean): string[] {
  const lines: string[] = [];
  let rest = text;
  while (widthOf(rest, px, bold) > maxW) {
    let n = 1;
    while (n < rest.length && widthOf(rest.slice(0, n + 1), px, bold) <= maxW) n++;
    const space = rest.lastIndexOf(" ", n);
    if (space > 0 && widthOf(rest.slice(space + 1).split(" ")[0], px, bold) <= maxW) { lines.push(rest.slice(0, space).trimEnd()); rest = rest.slice(space + 1).trimStart(); }
    else { lines.push(rest.slice(0, n).trimEnd()); rest = rest.slice(n).trimStart(); }
  }
  lines.push(rest);
  return lines;
}

type Fit = { px: number; lines: string[]; width: number; box: number };
/** The largest size, from `maxPx` down to the floor, at which the wrapped text fits `w` x `h`; null when none does. */
function fit(text: string, w: number, h: number, maxPx: number, maxLines: number, bold: boolean, floor: number): Fit | null {
  const at = (px: number): Fit | null => {
    const lines = wrap(text, px, budget(w), bold);
    const box = boxFor(lines.length, px);
    return lines.length <= maxLines && box <= h ? { px, lines, width: Math.max(...lines.map((l) => widthOf(l, px, bold))), box } : null;
  };
  // Step down coarsely on a big canvas (2% of the size), then walk back up a
  // pixel at a time: every size returned is one that was measured to fit.
  const top = Math.max(floor, Math.round(maxPx));
  let px = top;
  let found = at(px);
  while (!found && px > floor) { px = Math.max(floor, px - Math.max(1, Math.floor(px / 48))); found = at(px); }
  if (!found) return null;
  while (found.px < top) { const next = at(found.px + 1); if (!next) break; found = next; }
  const lines = balance(found.lines, text, found.px, budget(w), bold);
  return lines === found.lines ? found : { ...found, lines, width: Math.max(...lines.map((l) => widthOf(l, found.px, bold))) };
}

/**
 * The same number of lines with the breaks moved so the longest line is as
 * short as it can be: "Workshop / Pale Ale", not "Workshop Pale / Ale". Only
 * when every break fell on a single space - a split token keeps its greedy
 * breaks. It cannot undo a fit: the line count is the same and no line is
 * wider than the greedy one it replaces.
 */
function balance(lines: string[], text: string, px: number, maxW: number, bold: boolean): string[] {
  const words = text.split(" ");
  if (lines.length < 2 || lines.join(" ") !== text || words.some((word) => word === "")) return lines;
  const n = words.length, k = lines.length;
  const memo = new Map<number, number>();
  const width = (i: number, j: number): number => {
    const key = i * (n + 1) + j;
    let v = memo.get(key);
    if (v === undefined) { v = widthOf(words.slice(i, j).join(" "), px, bold); memo.set(key, v); }
    return v;
  };
  // best[c][j]: the shortest "longest line" when the first j words fill c lines; from[c][j]: where line c starts.
  const best = Array.from({ length: k + 1 }, () => new Array<number>(n + 1).fill(Infinity));
  const from = Array.from({ length: k + 1 }, () => new Array<number>(n + 1).fill(-1));
  best[0][0] = 0;
  for (let c = 1; c <= k; c++) for (let j = c; j <= n; j++) for (let i = c - 1; i < j; i++) {
    if (best[c - 1][i] === Infinity) continue;
    const lineW = width(i, j);
    if (lineW > maxW) continue;
    const longest = Math.max(best[c - 1][i], lineW);
    if (longest < best[c][j]) { best[c][j] = longest; from[c][j] = i; }
  }
  if (best[k][n] === Infinity) return lines;
  const out: string[] = [];
  for (let c = k, j = n; c > 0; c--) { const i = from[c][j]; out.unshift(words.slice(i, j).join(" ")); j = i; }
  return out;
}

export type ServingCardRect = { x: number; y: number; w: number; h: number };
type Prop = keyof HomebrewServingCardProps;
/** `bind` is the prop a double-click edits in place; a rect that shows the enum has none (the schema picker edits it). */
type Cell = { label: string; rect: ServingCardRect; text: string; px: number; width: number; bold: boolean; align: "left" | "center"; color: MosaicColor; bind: Prop | null };
type Block = { label: string; text: string; maxPx: number; maxLines: number; prop: Prop; bind: Prop | null };

/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export function layoutServingCard(props: HomebrewServingCardProps, W: number, H: number) {
  const p = normalizeServingCard(props);
  const S = Math.min(W, H), floor = servingCardFloorPx(W, H);
  const mx = Math.round(W / 24), my = Math.round(H / 24), CW = W - 2 * mx, CH = H - 2 * my;
  const rule = Math.max(1, Math.round(S * 0.003));
  const gap = Math.round(S * 0.03);                  // the white space on each side of a rule
  const tight = Math.max(2, Math.round(S * 0.008));  // the footer rule to its text
  const pair = Math.max(2, Math.round(S * 0.015));   // between the two blocks of one group
  const wide = W / H >= 4 / 3;
  const cells: Cell[] = [];
  const rules: Array<{ label: string; rect: ServingCardRect }> = [];
  const unfit = (field: string): never => fail(field, `cannot be fitted at the ${floor}px readability floor on ${W}x${H}.`);

  // ── the footer: 1/7 of the content; the whole bottom fifth when a long credit needs a third line ──
  const bottom = H - my;
  let footTop = bottom - Math.round(CH / 7);
  if (p.credit !== null) {
    const room = (top: number) => bottom - top - rule - tight;
    let credit = fit(p.credit, CW, room(footTop), S * 0.042, 3, false, floor);
    if (!credit) { footTop = Math.ceil(H * 0.8) + 2; credit = fit(p.credit, CW, room(footTop), S * 0.042, 3, false, floor); }
    if (!credit) return unfit("brewer");
    const top = footTop + rule + tight;
    cells.push({ label: "brewer", rect: { x: mx, y: top + Math.floor((bottom - top - credit.box) / 2), w: CW, h: credit.box }, text: credit.lines.join("\n"), px: credit.px, width: credit.width, bold: false, align: wide ? "left" : "center", color: SUPPORT, bind: "brewer" });
  }
  rules.push({ label: "footer-rule", rect: { x: mx, y: footTop, w: CW, h: rule } });

  // ── the body: identity beside the strength on a wide canvas, above it otherwise ──
  const bodyTop = my, bodyBottom = footTop - gap, bodyH = bodyBottom - bodyTop;
  const split = wide ? mx + Math.round((CW * 2) / 3) : bodyTop + Math.round((bodyH * 5) / 9);
  const identity: ServingCardRect = wide ? { x: mx, y: bodyTop, w: split - gap - mx, h: bodyH } : { x: mx, y: bodyTop, w: CW, h: split - gap - bodyTop };
  const strength: ServingCardRect = wide ? { x: split + rule + gap, y: bodyTop, w: W - mx - (split + rule + gap), h: bodyH } : { x: mx, y: split + rule + gap, w: CW, h: bodyBottom - (split + rule + gap) };
  if (DIVIDED) rules.push({ label: "body-rule", rect: wide ? { x: split, y: bodyTop, w: rule, h: bodyH } : { x: mx, y: split, w: CW, h: rule } });

  /** A primary block over its supporting line, as one group centred in `region`. */
  function group(region: ServingCardRect, primary: Block, support: Block, align: "left" | "center") {
    const second = fit(support.text, region.w, Math.floor(region.h * 0.4), support.maxPx, support.maxLines, false, floor) ?? unfit(support.prop);
    const first = fit(primary.text, region.w, region.h - second.box - pair, primary.maxPx, primary.maxLines, true, floor) ?? unfit(primary.prop);
    const y = region.y + Math.floor((region.h - first.box - pair - second.box) / 2);
    cells.push({ label: primary.label, rect: { x: region.x, y, w: region.w, h: first.box }, text: first.lines.join("\n"), px: first.px, width: first.width, bold: true, align, color: INK, bind: primary.bind });
    cells.push({ label: support.label, rect: { x: region.x, y: y + first.box + pair, w: region.w, h: second.box }, text: second.lines.join("\n"), px: second.px, width: second.width, bold: false, align, color: SUPPORT, bind: support.bind });
  }
  group(identity,
    { label: "beer-name", text: p.beerName, maxPx: S * 0.15, maxLines: 4, prop: "beerName", bind: "beerName" },
    { label: "beer-style", text: p.beerStyle, maxPx: S * 0.055, maxLines: 3, prop: "beerStyle", bind: "beerStyle" },
    wide ? "left" : "center");
  // The qualifier shows `abvBasis`, an enum: a text rect cannot edit one in place, the schema
  // picker does. With no value it is part of the missing state, so it edits `abv` like the rect above it.
  group(strength,
    { label: "abv-value", text: p.value, maxPx: S * 0.2, maxLines: 1, prop: "abv", bind: "abv" },
    { label: "abv-qualifier", text: p.qualifier, maxPx: S * 0.05, maxLines: 2, prop: "abvBasis", bind: p.abv === "" ? "abv" : null },
    "center");

  return { p, cells, rules, wide, floor, mx, my, footTop, split, bodyBottom, identity, strength };
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 */
const WHY: WhySpec = {
  "day": 11,
  "date": "2026-09-30",
  "agent": "claude",
  "model": "claude-fable-5-1",
  "id": "@one-a-day/events/homebrew-serving-card/v1",
  "title": "Homebrew Serving Card",
  "who": "Homebrewers in the American Homebrewers Association forum and Homebrew Talk who make serving labels for keg changes, club meetings and tasting events.",
  "problem": [
    "\"I created this template in Canva and simply change the name, beer style, and ABV,\" a brewer wrote on the AHA forum in January 2026. The sheet is printed, cut and stapled to tags for kegs, event serving and club-meeting bottles. AI-made labels \"use a lot more ink because of all the rich colors.\"",
    "Those three fields change with every batch and already live in the recipe export. BeerXML carries NAME, STYLE.NAME and BREWER, plus two different strengths: EST_ABV, the recipe estimate, and ABV, calculated from measured gravities. A label with one bare number hides which it is."
  ],
  "sources": [
    "https://forum.homebrewersassociation.org/t/share-your-labels/40286",
    "https://docs.brewfather.app/recipes/designer",
    "https://www.beerxml.com/beerxml.htm",
    "https://homebrewtalk.com/threads/creating-tap-handle-labels.296516/"
  ],
  "solution": [
    "One mostly white card from five text props. The name and the percentage lead; the style and the brewer support; thin rules, no filled panels. The line under the number always says what it is: Estimated ABV, Batch ABV, or Not supplied when there is no value - never a default, never zero.",
    "abv is a string so an empty value and a real 0 survive the defaults. Batch ABV is the batch value you supply, not a lab result. Long names wrap at spaces, split an unbroken token, then shrink to a floor of 10/270 of the short side; nothing is cut. The defaults are a fictional beer."
  ],
  "usage": {
    "command": "m0saic make @one-a-day/events/homebrew-serving-card/v1 --template-repo . -w 1920 -h 1080 -o journal/2026-09-30/homebrew-serving-card.png",
    "try": [
      "beerName, beerStyle, brewer: NAME, STYLE.NAME, BREWER from the export; brewer \"\" hides the credit",
      "abv \"4.8\" with abvBasis \"batch\": the batch value, labelled Batch ABV",
      "abv \"\": the card says ABV / Not supplied instead of inventing a number",
      "-w 1080 -h 1920 or -w 1080 -h 1080: name and style stack above the strength"
    ]
  },
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 340832,
        "calls": 18,
        "tokens": 2313366,
        "tools": "shell 11, web_search 6, edit 1"
      },
      {
        "name": "plan",
        "startMs": 340849,
        "durMs": 372990,
        "calls": 17,
        "tokens": 2261524,
        "tools": "shell 13, edit 2, web_search 2"
      },
      {
        "name": "build",
        "startMs": 713859,
        "durMs": 70394,
        "calls": 10,
        "tools": "shell 10",
        "status": "error"
      },
      {
        "name": "build (2)",
        "startMs": 784260,
        "durMs": 2560,
        "status": "error"
      },
      {
        "name": "build (3)",
        "startMs": 786825,
        "durMs": 3290,
        "status": "error"
      },
      {
        "name": "build (4)",
        "startMs": 4195773,
        "durMs": 1386819,
        "calls": 71,
        "tokens": 8553427,
        "costUsd": 10.66,
        "tools": "Read 28, Bash 19, Edit 12"
      },
      {
        "name": "critique",
        "startMs": 5582592,
        "durMs": 87903,
        "calls": 7,
        "tokens": 1027109,
        "costUsd": 0.93,
        "tools": "Read 3, Write 2, Bash 1"
      },
      {
        "name": "ship",
        "startMs": 5670495,
        "durMs": 281307,
        "calls": 11,
        "tokens": 1800904,
        "costUsd": 1.68,
        "tools": "Bash 5, Write 3, Edit 2"
      }
    ],
    "costBasis": "estimated",
    "pricedAt": "2026-09-26"
  },
  "caveats": [
    "No BeerXML or Brewfather importer, one beer per card, no print sheet, paper size or DPI: map the fields yourself.",
    "Printable ASCII only - type Kolsch or Marzen without the umlaut; an accented letter is refused, never silently dropped.",
    "Scout and plan ran on Codex (gpt-6-astra); its usage limit cut the build, so a Claude session wrote the template from that brief."
  ]
};

export const HomebrewServingCardV1 = defineMosaicTemplate<HomebrewServingCardProps>({
  id: asTemplateId(ID),
  label: "2026-09-30 · Homebrew Serving Card",
  version: 1,
  description: "A low-ink serving card for one homebrew - name, style, strength, brewer - where the line under the number says whether it is an estimate, a batch value, or not supplied.",
  capabilities: { tier: "core" },
  tags: ["events", "2026-09-30", "day-011", "homebrewing", "labels", "print"],

  outputHints: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Still PNG on white. Wide canvases (4:3 and wider) put the strength beside the name; portrait and square stack it below. Minimum tested canvas 480x270. Pixel size only - no paper size or DPI is implied.",
  },

  propsSchema,
  defaultProps: DEFAULTS,

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default HomebrewServingCardV1;

async function render(props: HomebrewServingCardProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutServingCard(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];

  // What the geometry promises, against the labels: every text fits its box
  // and stays inside the margins; the identity and the strength keep to their
  // own sides of the split; the footer and its rule live in the bottom fifth.
  const eps = 0.004;
  const safeX: [number, number] = [L.mx / W - eps, 1 - L.mx / W + eps];
  const safeY: [number, number] = [L.my / H - eps, 1 - L.my / H + eps];
  const body: [number, number] = [safeY[0], L.footTop / H];
  const split = L.split / (L.wide ? W : H);
  const band = (label: string): { xFrac: [number, number]; yFrac: [number, number] } => {
    if (label === "brewer") return { xFrac: safeX, yFrac: [0.8, safeY[1]] };
    const identity = label.startsWith("beer-");
    if (L.wide) return { xFrac: identity ? [safeX[0], split + eps] : [split - eps, safeX[1]], yFrac: body };
    return { xFrac: safeX, yFrac: identity ? [safeY[0], split + eps] : [split - eps, body[1]] };
  };

  for (const r of L.rules) {
    pieces.push({ rect: { ...r.rect, importance: 1 }, source: tag(makeColorTile(INK), r.label) });
    constraints.push(r.label === "footer-rule" ? { label: r.label, within: { yFrac: [0.8, 1] }, minWidthFrac: 0.85 } : { label: r.label, within: { xFrac: safeX, yFrac: body } });
  }
  for (const c of L.cells) {
    // A text rect is BOUND to the string prop it shows (bind what you display).
    const source = tag(textCell({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, label: c.label }), c.label);
    pieces.push({ rect: { ...c.rect, importance: 2 }, source: c.bind ? bindProp(source, c.bind) : source });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
    constraints.push({ label: c.label, within: band(c.label) });
  }

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    backgroundColor: PAGE,
    sources: placed.sources,
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints, debug: props.debugLayout === true });
}
