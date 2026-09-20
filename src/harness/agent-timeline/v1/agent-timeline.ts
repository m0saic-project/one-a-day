import type {
  MosaicColor,
  MosaicDocument,
  MosaicEngineContext,
  MosaicSource,
} from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import type { LayoutConstraint } from "@m0saic/template-utils";
import {
  BRAND_ORANGE,
  HEADER_M_GLYPH,
  bindProp,
  brandGlyphTile,
  defineMosaicTemplate,
  definePropsSchema,
  makeColorTile,
  placeInsetPieces,
} from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, ellipsize, fitLine, textCell, widthOf } from "../../../_shared/text";

/**
 * `@one-a-day/harness/agent-timeline/v1` — how a day was made: the agent's
 * phases as a waterfall.
 *
 * HARNESS, not a day's work. A fixture the daily templates and the shared
 * pages use (the why-tutorial's last page renders it): one lane per phase of
 * the run - scout, plan, build, critique, ship, retries as their own lanes -
 * a bar on a shared time axis, and under the phase name what it cost: tool
 * calls, tokens, the tools it leaned on. The subtitle carries the totals; a
 * footer says where the numbers came from (the runner's trace, or the
 * agent's own account when no runner ran) and who ran.
 *
 * A port of the official `@m0saic/agents/trace-timeline/v1` for this repo:
 * per PHASE rather than per tool call (a day is hundreds of calls), exact
 * rects through `placeInsetPieces`, a still, and the repo's dark chrome so
 * it sits inside the tutorial. `internal: true` - never a top-level pick.
 *
 * Deterministic: no clock, no randomness; the default is a fixed sample day.
 */

export type TimelinePhase = {
  /** Phase name (scout, plan, build, critique, ship - or "build (2)" for a retry). */
  name: string;
  /** Start, ms from the run's start. */
  startMs: number;
  /** Duration, ms. */
  durMs: number;
  /** Tool calls in the phase. */
  calls?: number;
  /** Tokens the phase cost (input + output, cache included). */
  tokens?: number;
  /** Dollars the phase cost - as the CLI reported it, or an estimate (see `costNote`). */
  costUsd?: number;
  /** The tools it leaned on, as one line: "Bash 41, Read 12, Edit 8". */
  tools?: string;
  /** ok (default) · error (the call failed) · no-ship (the phase said no). */
  status?: "ok" | "error" | "no-ship";
};

export type AgentTimelineProps = {
  /** Card title. */
  title?: string;
  /** Line under the title; empty = the run totals. */
  subtitle?: string;
  /** Header band, left: the run ("one-a-day - day 001 - 2026-09-20"). Empty hides the band's text. */
  header?: string;
  /** Header band, right: who ran ("claude / claude-opus-5[1m]"). */
  headerRight?: string;
  /** The phases, in run order. Up to 12 are drawn. */
  phases: TimelinePhase[];
  /** Where the numbers came from. */
  source?: "runner" | "self-reported";
  /** How the dollars were arrived at: "reported by the agent CLI" or "estimated at list prices of 2026-09-20". Empty = no cost line. */
  costNote?: string;
  /** Print tokens after each bar. */
  showTokens?: boolean;
  /** Bar colour for ok phases (#rrggbb). */
  accent?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/harness/agent-timeline/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;
const MAX_PHASES = 12;

const PAGE_BG = "#0d1117" as MosaicColor;
const HEADER_BG = "#161b22" as MosaicColor;
const WASH = "#1c232d" as MosaicColor;
const INK = "#ecf0f1" as MosaicColor;
const INK_DIM = "#8b96a5" as MosaicColor;
const ERROR = "#f85149" as MosaicColor;
const NO_SHIP = "#e3b341" as MosaicColor;
const DEFAULT_ACCENT = BRAND_ORANGE as string;
/** 630 carries a 7; at basis 90 the inset lattice stays 5-smooth (see the og-card). */
const INSET_BASIS = 90;

/** A fixed sample day: five phases, one build retry. ~2h20 wall, ~1.6M tokens. */
export const SAMPLE_PHASES: TimelinePhase[] = [
  { name: "scout", startMs: 0, durMs: 18 * 60000, calls: 34, tokens: 210000, costUsd: 4.1, tools: "WebSearch 9, Bash 14, Read 11" },
  { name: "plan", startMs: 18 * 60000, durMs: 9 * 60000, calls: 12, tokens: 95000, costUsd: 1.9, tools: "Read 8, Write 2" },
  { name: "build", startMs: 27 * 60000, durMs: 44 * 60000, calls: 96, tokens: 720000, costUsd: 14.6, tools: "Bash 51, Edit 27, Read 18", status: "error" },
  { name: "build (2)", startMs: 71 * 60000, durMs: 31 * 60000, calls: 58, tokens: 410000, costUsd: 8.3, tools: "Bash 33, Edit 16, Read 9" },
  { name: "critique", startMs: 102 * 60000, durMs: 12 * 60000, calls: 21, tokens: 88000, costUsd: 1.7, tools: "Read 19, Write 2" },
  { name: "ship", startMs: 114 * 60000, durMs: 26 * 60000, calls: 40, tokens: 130000, costUsd: 2.6, tools: "Bash 31, Read 6, Write 3" },
];

const propsSchema = definePropsSchema<AgentTimelineProps>({
  title: { type: "string", required: false, description: "Card title.", meta: { control: { placeholder: "none" }, ui: { label: "Title", order: 1, primary: true } } },
  subtitle: { type: "string", required: false, description: "Line under the title. Empty = the run totals (phases, wall time, tool calls, tokens).", meta: { control: { placeholder: "run totals" }, ui: { label: "Subtitle", order: 2 } } },
  header: { type: "string", required: false, description: "Header band, left: the run. Empty hides the text (the band stays).", meta: { control: { placeholder: "none" }, ui: { label: "Header", order: 3 } } },
  headerRight: { type: "string", required: false, description: "Header band, right: who ran.", meta: { control: { placeholder: "none" }, ui: { label: "Header right", order: 4 } } },
  phases: {
    type: "list",
    required: true,
    description: "The phases in run order: name, start and duration in ms, tool calls, tokens, the tools it leaned on, status (ok, error, no-ship). Up to 12 are drawn.",
    meta: { constraints: { maxItems: 24 }, ui: { label: "Phases", order: 5, primary: true } },
    fields: {
      name: { type: "string", required: true, description: "Phase name.", meta: { ui: { label: "Phase" } } },
      startMs: { type: "number", required: true, description: "Start (ms from run start).", meta: { ui: { label: "Start ms" } } },
      durMs: { type: "number", required: true, description: "Duration (ms).", meta: { ui: { label: "Duration ms" } } },
      calls: { type: "number", required: false, description: "Tool calls.", meta: { control: { placeholder: "none" }, ui: { label: "Calls" } } },
      tokens: { type: "number", required: false, description: "Tokens.", meta: { control: { placeholder: "none" }, ui: { label: "Tokens" } } },
      costUsd: { type: "number", required: false, description: "Dollars (reported or estimated).", meta: { control: { placeholder: "none" }, ui: { label: "Cost USD" } } },
      tools: { type: "string", required: false, description: "The tools it leaned on, one line.", meta: { control: { placeholder: "none" }, ui: { label: "Tools" } } },
      status: { type: "string", required: false, description: "ok · error · no-ship.", meta: { constraints: { oneOf: ["ok", "error", "no-ship"] }, control: { placeholder: "ok" }, ui: { label: "Status" } } },
    },
  },
  source: { type: "string", required: false, description: 'Where the numbers came from: "runner" (the pipeline\'s trace) or "self-reported" (the agent\'s own account).', meta: { constraints: { oneOf: ["runner", "self-reported"] }, ui: { label: "Source", order: 6 } } },
  costNote: { type: "string", required: false, description: "How the dollars were arrived at, printed under the source line. Empty = no cost line.", meta: { control: { placeholder: "none" }, ui: { label: "Cost note", order: 7 } } },
  showTokens: { type: "boolean", required: false, description: "Print each phase's tokens after its bar.", meta: { ui: { label: "Show tokens", order: 7 } } },
  accent: { type: "string", required: false, description: "Bar colour for ok phases, as #rrggbb.", meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 8 } } },
  debugLayout: { type: "boolean", required: false, description: "Dev-only: check the layout contract (every label fits, bars stay on the track) and draw it over the card.", meta: { ui: { label: "Debug layout", order: 9 } } },
});

/** "1.2k" / "1.6M" - compact, ASCII. */
export function fmtTokens(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`;
  return String(Math.round(n));
}
/** "$0.42" / "$3.20" / "$48" / "$1.2k" - the number leadership reads. */
export function fmtUsd(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 10) return `$${Math.round(n)}`;
  return `$${n.toFixed(2)}`;
}
/** "48s" / "3m 20s" / "2h 20m". */
export function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 === 0 ? `${m}m` : `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return m % 60 === 0 ? `${h}h` : `${h}h ${m % 60}m`;
}
/** Tick interval: the smallest 1-2-5 step (in minutes, or seconds under 2 min) that keeps the axis to at most 7 ticks. */
export function tickStepMs(totalMs: number): number {
  const target = totalMs / 6;
  const unit = totalMs < 120000 ? 1000 : 60000;
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(1, target / unit))));
  for (const m of [1, 2, 5, 10]) if (m * pow * unit >= target) return m * pow * unit;
  return 10 * pow * unit;
}
function fmtTick(ms: number): string {
  if (ms === 0) return "0";
  return ms < 120000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms / 60000)}m`;
}

function roundTile(color: MosaicColor, radius: number, label: string): MosaicSource {
  return { ...makeColorTile(color, { effects: { rounding: { cornerStyle: "rounded", borderRadius: radius } } }), editor: { owner: "template", label } } as MosaicSource;
}

type Rect = { x: number; y: number; w: number; h: number };

export const AgentTimelineV1 = defineMosaicTemplate<AgentTimelineProps>({
  id: asTemplateId(ID),
  label: "Harness · Agent Timeline",
  version: 1,
  description:
    "How a day was made: the agent's phases as a waterfall - one lane per phase on a shared time axis, tool calls, tokens and the tools it leaned on, with the run totals and where the numbers came from. A harness fixture the why-tutorial renders as its last page; never a top-level pick.",
  capabilities: { tier: "core" },
  tags: ["harness", "agents", "timeline", "trace", "tokens", "internal"],
  internal: true,
  outputHints: {
    width: 1280,
    height: 720,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "A still. Any canvas; lanes and type scale with min(H, 0.75 * W).",
  },
  propsSchema,
  defaultProps: {
    title: "How this day was made",
    subtitle: "",
    header: "one-a-day - sample day",
    headerRight: "an agent / a model",
    phases: SAMPLE_PHASES,
    source: "runner",
    costNote: "cost as reported by the agent CLI",
    showTokens: true,
    accent: DEFAULT_ACCENT,
    debugLayout: false,
  },
  render,
});

export default AgentTimelineV1;

async function render(props: AgentTimelineProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  // The schema is documentation; render() is the gate.
  const phases = (Array.isArray(props.phases) ? props.phases : [])
    .filter((p) => p && typeof p.name === "string" && p.name.trim().length > 0 && Number.isFinite(p.startMs) && Number.isFinite(p.durMs) && p.startMs >= 0 && p.durMs >= 0)
    .slice(0, MAX_PHASES);
  if (phases.length === 0) throw new Error(`${ID}: phases must hold at least one { name, startMs, durMs }.`);
  const accentRaw = typeof props.accent === "string" && props.accent.trim().length > 0 ? props.accent.trim() : DEFAULT_ACCENT;
  if (!HEX.test(accentRaw)) throw new Error(`${ID}: accent ${JSON.stringify(props.accent)} must be #rrggbb.`);
  const accent = accentRaw as MosaicColor;
  const showTokens = props.showTokens !== false;
  const source = props.source === "self-reported" ? "self-reported" : "runner";
  const clean = (v: string | undefined, fallback: string) => (v === undefined ? fallback : String(v).replace(/[^\x20-\x7e]/g, "?").replace(/\s+/g, " ").trim());
  const header = clean(props.header, "");
  const headerRight = clean(props.headerRight, "");
  const title = clean(props.title, "");

  // ── totals ──
  const totalMs = Math.max(1, ...phases.map((p) => p.startMs + p.durMs));
  const totalCalls = phases.reduce((a, p) => a + (p.calls ?? 0), 0);
  const totalTokens = phases.reduce((a, p) => a + (p.tokens ?? 0), 0);
  const totalUsd = phases.reduce((a, p) => a + (p.costUsd ?? 0), 0);
  const costNote = clean(props.costNote, "");
  // Both numbers: devs read tokens, leadership reads dollars.
  const subtitle = clean(props.subtitle, "") || [
    `${phases.length} phase${phases.length === 1 ? "" : "s"}`,
    `${fmtDuration(totalMs)} wall time`,
    ...(totalCalls > 0 ? [`${totalCalls} tool calls`] : []),
    ...(totalTokens > 0 ? [`${fmtTokens(totalTokens)} tokens`] : []),
    ...(totalUsd > 0 ? [`${fmtUsd(totalUsd)}`] : []),
  ].join(" - ");

  // ── scale ──
  const W = Math.max(1, Math.round(ctx.target.width));
  const H = Math.max(1, Math.round(ctx.target.height));
  const S = Math.min(H, 0.75 * W);
  const margin = Math.round(0.06 * S);
  const minPx = Math.max(6, Math.round(0.014 * S));
  const pieces: Array<{ rect: Rect & { importance: number }; source: MosaicSource }> = [];
  const constraints: LayoutConstraint[] = [];
  const put = (rect: Rect, importance: number, src: MosaicSource) => pieces.push({ rect: { ...rect, importance }, source: src });
  const putText = (rect: Rect, importance: number, opts: Parameters<typeof textCell>[0], bind?: keyof AgentTimelineProps) => {
    const cell = textCell(opts);
    put(rect, importance, bind ? bindProp(cell, bind) : cell);
    constraints.push(textFitsMeasured(opts.label, opts.text, opts.fontSize, widthOf(opts.text, opts.fontSize, opts.bold)));
  };

  // ── header band ──
  const headerH = Math.round(0.11 * S);
  put({ x: 0, y: 0, w: W, h: headerH }, 0, { ...makeColorTile(HEADER_BG), editor: { owner: "template", label: "header" } } as MosaicSource);
  const glyphSide = Math.round(0.5 * headerH);
  put({ x: margin, y: Math.round((headerH - glyphSide) / 2), w: glyphSide, h: glyphSide }, 2, { ...brandGlyphTile(HEADER_M_GLYPH, BRAND_ORANGE as MosaicColor), editor: { owner: "template", label: "mark" } } as MosaicSource);
  constraints.push({ label: "header", minWidthFrac: 0.98, within: { yFrac: [0, 0.25] } }, { label: "mark", aspect: 1, aspectTolerance: 0.2 });
  const headerPx = Math.round(0.3 * headerH);
  const headerTextX = margin + glyphSide + Math.round(0.6 * margin);
  const halfW = Math.max(16, Math.floor((W - headerTextX - margin) * 0.5));
  if (header.length > 0) putText({ x: headerTextX, y: 0, w: halfW, h: headerH }, 1, { text: header, fontSize: fitLine(header, budget(halfW), headerPx, minPx, true), color: INK, hAlign: "left", bold: true, label: "run" }, "header");
  if (headerRight.length > 0) putText({ x: W - margin - halfW, y: 0, w: halfW, h: headerH }, 1, { text: headerRight, fontSize: fitLine(headerRight, budget(halfW), headerPx, minPx), color: INK_DIM, hAlign: "right", label: "agent" }, "headerRight");

  // ── title + subtitle ──
  let y = headerH + margin;
  const contentW = W - 2 * margin;
  if (title.length > 0) {
    const px = fitLine(title, budget(contentW), Math.round(0.06 * S), minPx, true);
    const h = Math.round(1.3 * px);
    putText({ x: margin, y, w: contentW, h }, 1, { text: title, fontSize: px, color: INK, hAlign: "left", bold: true, label: "title" }, "title");
    constraints.push({ label: "title", within: { yFrac: [0, 0.4] } });
    y += h + Math.round(0.2 * px);
  }
  {
    const px = fitLine(subtitle, budget(contentW), Math.round(0.03 * S), minPx);
    const h = Math.round(1.4 * px);
    putText({ x: margin, y, w: contentW, h }, 1, { text: subtitle, fontSize: px, color: INK_DIM, hAlign: "left", label: "subtitle" }, "subtitle");
    y += h + Math.round(0.6 * margin);
  }

  // ── footer: the source of the numbers, and how the dollars were arrived at ──
  const footerPx = Math.round(0.024 * S);
  const footerLineH = Math.round(1.4 * footerPx);
  const footerLines = [
    source === "runner" ? "numbers from the runner's trace (journal/<date>/trace.json)" : "numbers self-reported by the agent - no runner trace for this run",
    ...(costNote.length > 0 && totalUsd > 0 ? [costNote] : []),
  ];
  const footerH = footerLineH * footerLines.length;
  const footerY = H - margin - footerH;
  footerLines.forEach((line, i) => {
    putText({ x: margin, y: footerY + i * footerLineH, w: contentW, h: footerLineH }, 1, { text: ellipsize(line, footerPx, budget(contentW)), fontSize: footerPx, color: INK_DIM, hAlign: "left", label: i === 0 ? "source" : "cost-note" }, i === 0 ? undefined : "costNote");
  });
  constraints.push({ label: "source", within: { yFrac: [0.75, 1] } });

  // ── the waterfall: axis row, then one lane per phase ──
  const bodyTop = y;
  const bodyBottom = footerY - Math.round(0.6 * margin);
  const labelW = Math.round(contentW * 0.3);
  const gapLabel = Math.round(contentW * 0.02);
  const trackX = margin + labelW + gapLabel;
  const trackW = Math.max(16, W - margin - trackX);
  const axisPx = Math.max(minPx, Math.round(0.022 * S));
  const axisH = Math.round(1.5 * axisPx);
  const lanesTop = bodyTop + axisH + Math.round(0.25 * margin);
  const lanesH = Math.max(16, bodyBottom - lanesTop);
  const N = phases.length;
  const pitch = Math.max(2, Math.floor(lanesH / N));
  const laneGap = Math.max(2, Math.round(pitch * 0.16));
  const laneH = Math.max(2, pitch - laneGap);
  const namePx = Math.max(minPx, Math.min(Math.round(0.034 * S), Math.round(laneH * 0.42)));
  const metaPx = Math.max(minPx, Math.min(Math.round(0.024 * S), Math.round(laneH * 0.3)));
  const tokenPx = Math.max(minPx, Math.min(Math.round(0.022 * S), Math.round(laneH * 0.3)));

  // axis ticks: at nice intervals across the track
  const step = tickStepMs(totalMs);
  for (let t = 0, i = 0; t <= totalMs && i < 12; t += step, i++) {
    const x = trackX + Math.round((t / totalMs) * trackW);
    const label = fmtTick(t);
    const w = Math.min(Math.round((step / totalMs) * trackW), trackX + trackW - x);
    if (w < 8) break;
    putText({ x, y: bodyTop, w, h: axisH }, 1, { text: label, fontSize: fitLine(label, budget(w), axisPx, minPx), color: INK_DIM, hAlign: "left", vAlign: "bottom", label: `tick-${i}` });
  }

  phases.forEach((p, i) => {
    const laneY = lanesTop + i * pitch;
    const status = p.status === "error" ? "error" : p.status === "no-ship" ? "no-ship" : "ok";
    const barColor = status === "error" ? ERROR : status === "no-ship" ? NO_SHIP : accent;
    // label column: the phase name over what it cost
    const name = clean(p.name, "");
    const metaParts = [
      ...(p.calls !== undefined && p.calls !== null && p.calls > 0 ? [`${p.calls} calls`] : []),
      ...(p.tokens !== undefined && p.tokens !== null && p.tokens > 0 ? [`${fmtTokens(p.tokens)} tok`] : []),
      ...(p.costUsd !== undefined && p.costUsd !== null && p.costUsd > 0 ? [fmtUsd(p.costUsd)] : []),
      ...(p.tools ? [clean(p.tools, "")] : []),
    ];
    const meta = metaParts.join(" - ");
    const nameH = Math.round(1.25 * namePx);
    const metaH = Math.round(1.3 * metaPx);
    const stackH = nameH + (meta ? metaH : 0);
    const stackY = laneY + Math.max(0, Math.floor((laneH - stackH) / 2));
    putText({ x: margin, y: stackY, w: labelW, h: nameH }, 1, { text: ellipsize(name, namePx, budget(labelW), true), fontSize: namePx, color: INK, hAlign: "left", bold: true, label: `phase-${i}` });
    if (meta) putText({ x: margin, y: stackY + nameH, w: labelW, h: metaH }, 1, { text: ellipsize(meta, metaPx, budget(labelW)), fontSize: metaPx, color: INK_DIM, hAlign: "left", label: `phase-meta-${i}` });
    // track: a faint wash, the bar, the tokens after it
    put({ x: trackX, y: laneY, w: trackW, h: laneH }, 0, roundTile(WASH, 0.3, "lane-wash"));
    const startPx = Math.round((Math.min(p.startMs, totalMs) / totalMs) * trackW);
    const barPx = Math.max(Math.round(laneH * 0.4), Math.round((p.durMs / totalMs) * trackW));
    const barX = trackX + Math.min(startPx, trackW - barPx);
    const barInset = Math.round(laneH * 0.2);
    put({ x: barX, y: laneY + barInset, w: barPx, h: Math.max(2, laneH - 2 * barInset) }, 1, roundTile(barColor, 0.5, `bar-${status}`));
    if (showTokens && p.tokens !== undefined && p.tokens !== null && p.tokens > 0) {
      const label = fmtTokens(p.tokens);
      const need = Math.ceil(widthOf(label, tokenPx)) + 2 * Math.round(0.25 * tokenPx);
      const after = trackX + trackW - (barX + barPx);
      if (after >= need) putText({ x: barX + barPx + Math.round(0.25 * tokenPx), y: laneY, w: need, h: laneH }, 2, { text: label, fontSize: tokenPx, color: INK_DIM, hAlign: "left", label: `tokens-${i}` });
    }
  });
  constraints.push({ label: "lane-wash", minWidthFrac: 0.4, within: { xFrac: [0.2, 1] } });
  for (const st of ["ok", "error", "no-ship"]) if (phases.some((p) => (p.status ?? "ok") === st)) constraints.push({ label: `bar-${st}`, within: { xFrac: [0.2, 1] } });

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces, basis: INSET_BASIS });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    size: { width: W, height: H },
    backgroundColor: PAGE_BG,
    sources: placed.sources,
    editor: { label: `Agent Timeline · ${phases.length} phases · ${fmtDuration(totalMs)}` },
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints, debug: props.debugLayout === true });
}
