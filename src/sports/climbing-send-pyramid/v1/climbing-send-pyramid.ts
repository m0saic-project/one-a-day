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
 * `@one-a-day/sports/climbing-send-pyramid/v1` - a climbing grade pyramid
 * from the rows a tick list already has: one centered bar per grade, width
 * the clean-send count, a cap for the flash or onsight share.
 *
 * ONE CONCEPT: center the bars. A left-aligned chart is the histogram the
 * Mountain Project thread already rejected. Width is sends / the widest
 * grade, so a normal list reads as a pyramid and a top-heavy list stays
 * top-heavy. The template does not sort grades and does not read a CSV.
 *
 * The rule that bites: flashes is a subset of sends, not a second total.
 * A cap wider than its bar, or a grade string sorted as text (5.10 before
 * 5.9), would lie. Grades stay in the order given, hardest first.
 */

export type ClimbDiscipline = "sport" | "boulder" | "trad";
export type GradeRow = {
  /** The grade as the log prints it: "5.12a", "V8", "7a+". */
  grade: string;
  /** Clean sends at this grade, including flash and onsight. */
  sends: number;
  /** How many of those sends were a flash or an onsight. */
  flashes?: number;
};
export type ClimbingSendPyramidProps = {
  climber?: string;
  /** Crag, season or gym. Empty removes the line. */
  place?: string;
  discipline?: ClimbDiscipline;
  /** 3 to 8 rows, hardest first. The template does not sort them. */
  grades?: GradeRow[];
  /** Send-bar ink, #rrggbb. */
  accent?: string;
  /** Flash/onsight cap ink, #rrggbb. */
  cap?: string;
  preset?: "dark" | "light";
  debugLayout?: boolean;
};

const ID = "@one-a-day/sports/climbing-send-pyramid/v1";
export const MIN_GRADES = 3;
export const MAX_GRADES = 8;
const HEX = /^#[0-9a-fA-F]{6}$/;
const GRADE = /^[\x21-\x7e]{1,8}$/;
const ASCII = /^[\x20-\x7e]*$/;

const THEMES = {
  dark: { bg: "#14160f", ink: "#f3efe4", dim: "#a39b86", track: "#2a2c22" },
  light: { bg: "#f6f1e7", ink: "#1c1914", dim: "#6e6758", track: "#e4dccb" },
} as const;

const DEFAULT_GRADES: GradeRow[] = [
  { grade: "5.12a", sends: 1, flashes: 0 },
  { grade: "5.11d", sends: 2, flashes: 1 },
  { grade: "5.11c", sends: 3, flashes: 1 },
  { grade: "5.11b", sends: 5, flashes: 1 },
  { grade: "5.11a", sends: 8, flashes: 2 },
  { grade: "5.10d", sends: 12, flashes: 4 },
  { grade: "5.10c", sends: 16, flashes: 5 },
  { grade: "5.10b", sends: 18, flashes: 7 },
];

const DEFAULTS = {
  climber: "Mara Ellison",
  place: "Red River Gorge, fall 2026",
  discipline: "sport" as ClimbDiscipline,
  grades: DEFAULT_GRADES,
  accent: "#d4783a",
  cap: "#f3efe4",
  preset: "dark" as "dark" | "light",
  debugLayout: false,
};

const propsSchema = definePropsSchema<ClimbingSendPyramidProps>({
  grades: {
    type: "list",
    required: false,
    description:
      "The pyramid, hardest grade first, 3 to 8 rows. Each row is a grade and how many clean sends sit there, plus how many of those were a flash or an onsight. The template does not sort grades and does not read a CSV: put the hardest on top or the picture is upside down.",
    meta: { constraints: { minItems: MIN_GRADES, maxItems: MAX_GRADES }, ui: { label: "Grades", order: 1, primary: true } },
    fields: {
      grade: { type: "string", required: true, description: 'The grade as the log prints it, 1 to 8 characters: "5.12a", "V8", "7a+".', meta: { ui: { label: "Grade" } } },
      sends: { type: "number", required: true, description: "Clean sends at this grade, including flash and onsight. Integer 0 to 999. At least one row must be above 0.", meta: { ui: { label: "Sends" } } },
      flashes: { type: "number", required: false, description: "How many of those sends were a flash or an onsight. Integer 0 to sends. Drawn as a cap on the left of the bar.", meta: { ui: { label: "Flashes" } } },
    },
  },
  climber: {
    type: "string",
    required: false,
    description: "The climber's name, the largest text. Up to 40 ASCII characters. The sample is invented.",
    meta: { control: { placeholder: DEFAULTS.climber }, ui: { label: "Climber", order: 2, primary: true } },
  },
  place: {
    type: "string",
    required: false,
    description: "Crag, season or gym, under the name. Empty removes the line. Up to 48 ASCII characters.",
    meta: { control: { placeholder: "none" }, ui: { label: "Place", order: 3 } },
  },
  discipline: {
    type: "string",
    required: false,
    description: 'The chip: "sport", "boulder" or "trad". A label only - it does not filter the rows.',
    meta: { constraints: { oneOf: ["sport", "boulder", "trad"] }, ui: { label: "Discipline", order: 4 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "The send-bar ink, as #rrggbb.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULTS.accent }, ui: { label: "Accent", order: 5 } },
  },
  cap: {
    type: "string",
    required: false,
    description: "The flash or onsight cap, as #rrggbb. Kept distinct from the send bar so the share reads.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULTS.cap }, ui: { label: "Cap", order: 6 } },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Page and ink: "dark" (default) or "light".',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 7 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

const WHY: WhySpec = {
  day: 23,
  date: "2026-10-12",
  agent: "opencode",
  model: "grok-4.7",
  id: ID,
  title: "Climbing Send Pyramid",
  who: "Outdoor climbers who export a Mountain Project tick CSV and want the grade pyramid as a card instead of a dashboard screenshot",
  problem: [
    "Want to see what your current tick pyramid looks like? Mountain Project already exports the tick list as CSV. Climbers still screenshot a dashboard, or a one-off chart, to show it.",
    "A reply on that thread: I dont think i understand the pyramid. It seems like only red points are important but onsights are not? Another called the chart two histograms on their side.",
  ],
  sources: [
    "https://www.mountainproject.com/help/27/overview-of-mountain-project-features",
    "https://www.mountainproject.com/forum/topic/200258880/visualize-your-mp-tick-pyramid",
    "https://chenyang.co/climbing-dashboard/",
    "https://www.sendsage.ai/",
  ],
  solution: [
    "One centered bar per grade. Width is the clean-send count, so a normal list reads as a pyramid and a top-heavy list stays top-heavy. It does not sort grades.",
    "The cap on the left of a bar is the share logged flash or onsight, and the count prints that number in parentheses. A row with none has no cap.",
  ],
  usage: {
    command: "m0saic make @one-a-day/sports/climbing-send-pyramid/v1 --template-repo . -w 1080 -h 1080 -o pyramid.png",
    try: [
      "grades: 3 to 8 rows, hardest first; each row is grade, sends, and flashes",
      "discipline is only the chip: sport, boulder or trad",
      "preset light is the paper card; accent and cap recolour the two inks",
      "place can be empty; the total is the sum of sends, not a typed prop",
    ],
  },
  caveats: [
    "It does not read a CSV and does not sort grades. Put the hardest first or the pyramid is upside down.",
    "A 1-send bar has a minimum width, so tiny counts can share a tick. Grades are labels, not a scale.",
    "The default climber and the 65 sends are invented.",
  ],
  timeline: {
    source: "self-reported",
    phases: [
      { name: "scout", startMs: 0, durMs: 1500000, calls: 14, tools: "WebSearch 8, Bash 8, Write 2" },
      { name: "plan", startMs: 1500000, durMs: 600000, calls: 6, tools: "Read 8, Write 1" },
      { name: "build", startMs: 2100000, durMs: 4200000, calls: 20, tools: "Read 10, Write 4, Edit 8, Bash 8" },
      { name: "critique", startMs: 6300000, durMs: 600000, calls: 4, tools: "Read 4, Write 1" },
      { name: "ship", startMs: 6900000, durMs: 900000, calls: 6, tools: "Bash 4, Edit 1, Write 1" },
    ],
  },
};

export const ClimbingSendPyramidV1 = defineMosaicTemplate<ClimbingSendPyramidProps>({
  id: asTemplateId(ID),
  label: "2026-10-12 · Climbing Send Pyramid",
  version: 1,
  description:
    "A climbing send pyramid from a tick list: one centered bar per grade, width the clean-send count, a cap for the flash or onsight share, hardest on top.",
  capabilities: { tier: "core" },
  tags: ["sports", "2026-10-12", "day-023", "climbing", "pyramid", "ticks", "grades", "mountain-project"],
  outputHints: {
    width: 1080,
    height: 1080,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Still PNG. The pyramid stacks the same way on landscape, square and portrait. Minimum tested canvas 480x270.",
  },
  propsSchema,
  defaultProps: DEFAULTS,
  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default ClimbingSendPyramidV1;

type Rect = { x: number; y: number; w: number; h: number };
type Bind = { prop: string } | { row: number; field: "grade" | "sends" | "flashes" };

export type PyramidCell = {
  label: string;
  text: string;
  px: number;
  color: string;
  align: "left" | "right" | "center";
  bold: boolean;
  rect: Rect;
  bind: Bind | null;
  width: number;
};
export type PyramidTile = {
  label: string;
  color: string;
  rect: Rect;
  radius: number;
  bind: "accent" | "cap" | null;
};
export type PyramidLayout = {
  theme: { bg: string; ink: string; dim: string; track: string };
  accent: string;
  cap: string;
  total: number;
  maxSends: number;
  cells: PyramidCell[];
  tiles: PyramidTile[];
  bars: Array<{ index: number; rect: Rect; cap: Rect | null; sends: number; flashes: number }>;
};

function fail(field: string, rule: string): never {
  throw new Error(`${ID}: ${field} ${rule}`);
}

function intField(value: unknown, field: string, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) fail(field, "must be an integer.");
  if (value < 0 || value > max) fail(field, `must be 0 to ${max}.`);
  return value;
}

/** The rows the card will draw, or a thrown error. Exported so the test locks the rules. */
export function normalizePyramid(props: ClimbingSendPyramidProps): {
  climber: string;
  place: string;
  discipline: ClimbDiscipline;
  grades: Array<{ grade: string; sends: number; flashes: number }>;
  accent: string;
  cap: string;
  preset: "dark" | "light";
} {
  const climber = props.climber ?? DEFAULTS.climber;
  const place = props.place ?? DEFAULTS.place;
  if (typeof climber !== "string" || !ASCII.test(climber) || climber.trim().length === 0 || climber.length > 40) {
    fail("climber", "must be 1 to 40 ASCII characters.");
  }
  if (typeof place !== "string" || !ASCII.test(place) || place.length > 48) fail("place", "must be 0 to 48 ASCII characters.");
  const discipline = props.discipline ?? DEFAULTS.discipline;
  if (discipline !== "sport" && discipline !== "boulder" && discipline !== "trad") {
    fail("discipline", `${JSON.stringify(discipline)} must be "sport", "boulder" or "trad".`);
  }
  const preset = props.preset ?? DEFAULTS.preset;
  if (preset !== "dark" && preset !== "light") fail("preset", `${JSON.stringify(preset)} must be "dark" or "light".`);
  const accent = (props.accent ?? DEFAULTS.accent).toLowerCase();
  const cap = (props.cap ?? DEFAULTS.cap).toLowerCase();
  if (!HEX.test(accent)) fail("accent", "must be #rrggbb.");
  if (!HEX.test(cap)) fail("cap", "must be #rrggbb.");
  const raw = props.grades ?? DEFAULTS.grades;
  if (!Array.isArray(raw)) fail("grades", "must be a list.");
  if (raw.length < MIN_GRADES || raw.length > MAX_GRADES) fail("grades", `needs ${MIN_GRADES} to ${MAX_GRADES} rows.`);
  const seen = new Set<string>();
  const grades = raw.map((row, i) => {
    if (!row || typeof row !== "object") fail(`grades[${i}]`, "must be a row.");
    const grade = (row as GradeRow).grade;
    if (typeof grade !== "string" || !GRADE.test(grade)) fail(`grades[${i}].grade`, "must be 1 to 8 ASCII characters with no spaces.");
    if (seen.has(grade)) fail(`grades[${i}].grade`, `duplicates ${JSON.stringify(grade)}.`);
    seen.add(grade);
    const sends = intField((row as GradeRow).sends, `grades[${i}].sends`, 999);
    const flashes = intField((row as GradeRow).flashes ?? 0, `grades[${i}].flashes`, 999);
    if (flashes > sends) fail(`grades[${i}].flashes`, "cannot exceed sends.");
    return { grade, sends, flashes };
  });
  if (grades.every((g) => g.sends === 0)) fail("grades", "needs at least one send.");
  return { climber: climber.trim(), place: place.trim(), discipline, grades, accent, cap, preset };
}

function fitPx(text: string, maxW: number, maxPx: number, minPx: number, bold: boolean): number {
  const room = budget(maxW);
  let px = Math.max(minPx, Math.round(maxPx));
  while (px > minPx && widthOf(text, px, bold) > room) px -= 1;
  return px;
}

/** Pure geometry. Bars are centered in one shared track; width is sends / max, with a 4px floor. */
export function layoutPyramid(props: ClimbingSendPyramidProps, W: number, H: number): PyramidLayout {
  const spec = normalizePyramid(props);
  const theme = THEMES[spec.preset];
  const n = spec.grades.length;
  const maxSends = spec.grades.reduce((m, g) => Math.max(m, g.sends), 0);
  const total = spec.grades.reduce((s, g) => s + g.sends, 0);
  const pad = Math.max(8, Math.round(Math.min(W, H) * 0.04));
  const headerH = Math.max(36, Math.round(H * (W >= H ? 0.2 : 0.14)));
  const footerH = Math.max(18, Math.round(H * 0.09));
  const bodyTop = pad + headerH;
  const bodyH = Math.max(n * 8, H - bodyTop - footerH - pad);
  const rowH = Math.floor(bodyH / n);
  const gradeW = Math.max(36, Math.round(W * 0.14));
  const gap = Math.max(14, Math.round(W * 0.02));
  const countProbe = Math.max(8, Math.round(rowH * 0.32));
  const sendsNeed = Math.ceil(Math.max(...spec.grades.map((g) => widthOf(String(g.sends), countProbe, false)))) + 10;
  const flashNeed = spec.grades.some((g) => g.flashes > 0)
    ? Math.ceil(Math.max(...spec.grades.filter((g) => g.flashes > 0).map((g) => widthOf(`(${g.flashes})`, countProbe, false)))) + 10
    : 0;
  const countW = Math.max(sendsNeed + flashNeed, Math.round(W * 0.18));
  const trackX = pad + gradeW + gap;
  const trackW = Math.max(24, W - pad - countW - gap - trackX);
  const barH = Math.max(4, Math.min(Math.round(rowH * 0.46), Math.round(W * 0.045)));
  const minBar = 4;

  const cells: PyramidCell[] = [];
  const tiles: PyramidTile[] = [];
  const bars: PyramidLayout["bars"] = [];

  const pushText = (label: string, text: string, rect: Rect, px: number, color: string, align: PyramidCell["align"], bold: boolean, bind: Bind | null) => {
    cells.push({ label, text, px, color, align, bold, rect, bind, width: widthOf(text, px, bold) });
  };

  const nameH = Math.round(headerH * 0.56);
  const metaH = headerH - nameH;
  const chipW = Math.max(52, Math.round(W * 0.12));
  const nameRect = { x: pad, y: pad, w: W - pad * 2 - chipW - gap, h: nameH };
  const namePx = fitPx(spec.climber, nameRect.w, nameH * 0.72, 8, true);
  pushText("climber", spec.climber, nameRect, namePx, theme.ink, "left", true, { prop: "climber" });

  const chip = spec.discipline.toUpperCase();
  const chipRect = { x: W - pad - chipW, y: pad + Math.round(nameH * 0.12), w: chipW, h: Math.max(14, Math.round(nameH * 0.7)) };
  tiles.push({ label: "chip", color: spec.accent, rect: chipRect, radius: Math.round(chipRect.h * 0.3), bind: "accent" });
  const chipPx = fitPx(chip, chipRect.w, chipRect.h * 0.62, 7, true);
  pushText("discipline", chip, chipRect, chipPx, "#14160f", "center", true, null);

  const metaRect = { x: pad, y: pad + nameH, w: W - pad * 2, h: metaH };
  const totalText = `${total} clean sends`;
  const totalW = spec.place.length > 0 ? Math.round(metaRect.w * 0.36) : metaRect.w;
  const totalPx = fitPx(totalText, totalW, metaH * 0.7, 7, false);
  pushText("total", totalText, { x: metaRect.x + metaRect.w - totalW, y: metaRect.y, w: totalW, h: metaH }, totalPx, theme.ink, spec.place.length > 0 ? "right" : "left", false, null);
  if (spec.place.length > 0) {
    const placeW = metaRect.w - totalW - gap;
    const placePx = fitPx(spec.place, placeW, metaH * 0.7, 7, false);
    pushText("place", spec.place, { x: metaRect.x, y: metaRect.y, w: placeW, h: metaH }, placePx, theme.dim, "left", false, { prop: "place" });
  }

  spec.grades.forEach((g, i) => {
    const y = bodyTop + i * rowH;
    const gradeRect = { x: pad, y, w: gradeW, h: rowH };
    const gradePx = fitPx(g.grade, gradeRect.w, rowH * 0.42, 7, true);
    pushText(`grade-${i}`, g.grade, gradeRect, gradePx, theme.ink, "right", true, { row: i, field: "grade" });

    const trackRect = { x: trackX, y: y + Math.round((rowH - barH) / 2), w: trackW, h: barH };
    tiles.push({ label: `track-${i}`, color: theme.track, rect: trackRect, radius: Math.min(3, Math.floor(barH / 2)), bind: null });

    const proportional = Math.round((trackW * g.sends) / maxSends);
    const barW = g.sends === 0 ? 0 : Math.min(trackW, Math.max(minBar, proportional));
    const barX = trackRect.x + Math.round((trackW - barW) / 2);
    const barRect = { x: barX, y: trackRect.y, w: barW, h: barH };
    if (barW > 0) {
      tiles.push({ label: `bar-${i}`, color: spec.accent, rect: barRect, radius: Math.min(3, Math.floor(barH / 2)), bind: "accent" });
    }
    let capRect: Rect | null = null;
    if (barW > 0 && g.flashes > 0) {
      const capW = Math.min(barW, Math.max(1, Math.round((barW * g.flashes) / g.sends)));
      capRect = { x: barX, y: trackRect.y, w: capW, h: barH };
      tiles.push({ label: `cap-${i}`, color: spec.cap, rect: capRect, radius: Math.min(3, Math.floor(barH / 2)), bind: "cap" });
    }
    bars.push({ index: i, rect: barRect, cap: capRect, sends: g.sends, flashes: g.flashes });

    const countRect = { x: trackX + trackW + gap, y, w: g.flashes > 0 ? sendsNeed : countW, h: rowH };
    const countPx = fitPx(String(g.sends), countRect.w, rowH * 0.4, 7, false);
    pushText(`count-${i}`, String(g.sends), countRect, countPx, theme.dim, "left", false, { row: i, field: "sends" });
    if (g.flashes > 0) {
      const flashText = `(${g.flashes})`;
      const flashRect = { x: countRect.x + countRect.w + 6, y, w: Math.max(8, Math.round(countW - countRect.w - 6)), h: rowH };
      const flashPx = fitPx(flashText, flashRect.w, rowH * 0.4, 7, false);
      pushText(`flash-${i}`, flashText, flashRect, flashPx, theme.dim, "left", false, { row: i, field: "flashes" });
    }
  });

  const foot = "Width = clean sends. Cap = flash or onsight. Hardest on top.";
  const footRect = { x: pad, y: H - pad - footerH, w: W - pad * 2, h: footerH };
  const footPx = fitPx(foot, footRect.w, footerH * 0.55, 7, false);
  pushText("footnote", foot, footRect, footPx, theme.dim, "left", false, null);

  return { theme, accent: spec.accent, cap: spec.cap, total, maxSends, cells, tiles, bars };
}

async function render(props: ClimbingSendPyramidProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  const { width: W, height: H } = ctx.target;
  const L = layoutPyramid(props, W, H);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const constraints: LayoutConstraint[] = [];

  for (const t of L.tiles) {
    const tile = tag(
      makeColorTile(t.color as MosaicColor, { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } }) as MosaicSource,
      t.label,
    );
    const source = t.bind === null ? tile : bindProp(tile, t.bind);
    pieces.push({ rect: { ...t.rect, importance: t.label.startsWith("cap") ? 3 : t.label.startsWith("bar") ? 2 : 1 }, source });
    constraints.push({ label: t.label });
  }
  for (const c of L.cells) {
    const cell = tag(textCell({ text: c.text, fontSize: c.px, color: c.color as MosaicColor, hAlign: c.align, bold: c.bold, vAlign: "middle", label: c.label }), c.label);
    const source = c.bind === null
      ? cell
      : "prop" in c.bind
        ? bindProp(cell, c.bind.prop)
        : bindPropPath(cell, "grades", [c.bind.row, c.bind.field], c.bind.field === "grade" ? "string" : "number");
    pieces.push({ rect: { ...c.rect, importance: 4 }, source });
    constraints.push(textFitsMeasured(c.label, c.text, c.px, c.width));
  }

  constraints.push({ label: "climber", within: { yFrac: [0, 0.3] } });
  constraints.push({ label: "footnote", within: { yFrac: [0.82, 1] } });
  const relations: RelationalConstraint[] = [
    { label: L.bars.map((_, i) => `track-${i}`), equal: "size", tolerancePx: 2 },
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
