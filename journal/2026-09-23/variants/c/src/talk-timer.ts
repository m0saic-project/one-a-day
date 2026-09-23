import type {
  MosaicColor,
  MosaicDocument,
  MosaicEngineContext,
  MosaicSource,
  MosaicTextSource,
} from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import {
  bindProp,
  defineMosaicTemplate,
  definePropsSchema,
  makeColorTile,
  placeInsetPieces,
  resolvePinnedDurationMs,
  tag,
} from "@m0saic/template-utils";
import type { LayoutConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { budget, ellipsize, textCell, widthOf } from "../../../_shared/text";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/events/talk-timer/v1` - the talk timer as a clip: a countdown
 * file a stage screen, a confidence monitor or an OBS scene can just play.
 *
 * ONE CONCEPT: **the picture is a function of `t` and of nothing else, and
 * every moving part is a scalar gate.** A five minute clip is 9,000 frames,
 * so anything per-pixel (an alpha fade, a geq) is paid 9,000 times. This
 * timer is built from exactly three cheap mechanisms:
 *
 * 1. The bar is rectangles that ARE the remaining time. The countdown is cut
 *    into equal slices (10 s for a 5 minute talk); every slice is two colour
 *    tiles on one rect - a LIT one enabled while `t < k` and a SPENT one
 *    enabled from `k` on, where `k` is the second that slice runs out. Slices
 *    go out from the right; the last thirty seconds sit at the left end in
 *    red, the minute before them in amber. At any moment the number of lit
 *    slices is `ceil(remaining / slice)` - the test asserts it. Nothing
 *    slides, nothing fades, no track has to be drawn under it.
 * 2. The digits are one `drawtext` expression - the same one every ffmpeg
 *    gist re-derives by hand - generated from the props:
 *    `%{eif\:trunc(R/60)\:d\:2}:%{eif\:mod(R\,60)\:d\:2}` with
 *    `R = max(0, ceil(S - t))`. Three copies on one rect, one per phase
 *    colour, each gated to its window; the engine trims each to its window.
 * 3. The phases are thresholds, not animations. `warnSec` (amber) and
 *    `finalSec` (red) are seconds remaining, exactly as the timer tools
 *    state them ("yellow at the 1-minute mark and red at 30 seconds"). The
 *    digits, the bar's colour zones and the caption all derive from those two
 *    numbers. At zero the end word appears and the clip holds.
 *
 * The rule that bites: **the countdown is the clip.** The natural length is
 * `seconds + holdSec`, authored on `doc.durationMs` and declared through
 * `resolveOutputHints` so a host seeds its Duration field from the props. An
 * explicit user pin (`--durationMs`, Make's Duration field) wins, and then the
 * countdown IS the pin minus the hold: a streamer who asks for a 180,000 ms
 * clip gets a three minute countdown, not five minutes cut off at two.
 * `ctx.target.durationMs` is never read as a pin - it only echoes the hint.
 *
 * Frame 0 is the finished picture (05:00 over a full bar), so the browse
 * still - frame 0, which is all a day agent can get - is representative.
 *
 * Day 004 of one-a-day, run by hand on the first day of WeAreDevelopers
 * World Congress North America. Scouted from timer-tool pages, the OBS
 * forums and four ffmpeg gists that each hand-wrote this expression.
 */

export type TalkTimerPreset = "dark" | "light";

export type TalkTimerProps = {
  /** The countdown length in seconds (5..21600). It is also the clip length, plus the hold. */
  seconds?: number;
  /** What the slot is. Bound: Make edits it in place. Empty removes the line. */
  title?: string;
  /** The rule of the format ("5 minute slot - hard stop"). Empty removes the line. */
  subtitle?: string;
  /** Seconds remaining at which the digits and the bar turn amber. 0 = no amber phase. */
  warnSec?: number;
  /** Seconds remaining at which they turn red. 0 = no red phase. */
  finalSec?: number;
  /** The word shown at zero ("TIME"; "LIVE" for a starting-soon screen). Empty = none. */
  endText?: string;
  /** How long the clip holds at 00:00 after the countdown (0..60). */
  holdSec?: number;
  /** The calm colour, for the digits and the bar (#rrggbb). Amber and red are fixed by the preset. */
  accent?: string;
  /** Tint the WHOLE frame with the phase - the room turns amber, then red - not only the digits. */
  phaseTint?: boolean;
  /** Hand-tuned dark (a confidence monitor) or light trio. */
  preset?: TalkTimerPreset;
  /** Dev-only: check the layout contract and draw it over the frame. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/events/talk-timer/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;

export const MIN_SECONDS = 5;
export const MAX_SECONDS = 21600;
export const MAX_HOLD = 60;
/** The bar never has more slices than this: past it a slice is a sliver, not a rectangle. */
export const MAX_SLICES = 30;
/** Slice lengths a human reads at a glance, smallest first. */
export const SLICE_STEPS = [1, 2, 5, 10, 15, 20, 30, 60, 120, 300, 600, 900, 1800, 3600] as const;

const DEFAULTS = {
  seconds: 300,
  title: "Lightning talk",
  subtitle: "5 minute slot - hard stop",
  warnSec: 60,
  finalSec: 30,
  endText: "TIME",
  holdSec: 5,
  accent: "#3fb950",
  preset: "dark" as TalkTimerPreset,
};

/** Hand-tuned trios: dark is tuned, not derived from light. */
const PRESETS = {
  dark: {
    bg: "#0d1117" as MosaicColor,
    ink: "#e6edf3" as MosaicColor,
    dim: "#8b949e" as MosaicColor,
    /** Spent slices are the dim ink at a low opacity, so whatever the frame is behind them - navy, amber, red - shows through and the bar belongs to the room. */
    spent: "#8b949e" as MosaicColor,
    spentOpacity: 0.28,
    amber: "#d29922" as MosaicColor,
    red: "#f85149" as MosaicColor,
    /** The frame behind everything during the amber / red phases when phaseTint is on. */
    tintWarn: "#2a2008" as MosaicColor,
    tintFinal: "#3a1216" as MosaicColor,
  },
  light: {
    bg: "#ffffff" as MosaicColor,
    ink: "#1f2328" as MosaicColor,
    dim: "#59636e" as MosaicColor,
    spent: "#59636e" as MosaicColor,
    spentOpacity: 0.22,
    amber: "#9a6700" as MosaicColor,
    red: "#cf222e" as MosaicColor,
    tintWarn: "#fff1cc" as MosaicColor,
    tintFinal: "#ffd9d9" as MosaicColor,
  },
};

const propsSchema = definePropsSchema<TalkTimerProps>({
  seconds: {
    type: "number",
    required: false,
    description: "The countdown length in seconds. It is also the clip length (plus the hold). 300 is the lightning talk; 1080 an 18 minute slot.",
    meta: { constraints: { min: MIN_SECONDS, max: MAX_SECONDS }, ui: { label: "Seconds", order: 1, primary: true } },
  },
  title: {
    type: "string",
    required: false,
    description: "What the slot is. The rect that shows it is bound to it, so Make's double-click edits it in place. Empty removes the line.",
    meta: { control: { placeholder: DEFAULTS.title }, ui: { label: "Title", order: 2, primary: true } },
  },
  subtitle: {
    type: "string",
    required: false,
    description: "The rule of the format, under the title. Empty removes the line.",
    meta: { control: { placeholder: DEFAULTS.subtitle }, ui: { label: "Subtitle", order: 3 } },
  },
  warnSec: {
    type: "number",
    required: false,
    description: "Seconds remaining at which the digits, the bar's tip and the caption turn amber (EventTimer: \"yellow at the 1-minute mark\"). 0 disables the amber phase.",
    meta: { constraints: { min: 0, max: MAX_SECONDS }, ui: { label: "Amber at (s left)", order: 4 } },
  },
  finalSec: {
    type: "number",
    required: false,
    description: "Seconds remaining at which they turn red (\"red at 30 seconds\"). 0 disables the red phase. Must not exceed the amber threshold.",
    meta: { constraints: { min: 0, max: MAX_SECONDS }, ui: { label: "Red at (s left)", order: 5 } },
  },
  endText: {
    type: "string",
    required: false,
    description: "The word shown when the countdown reaches zero. TIME for a talk; LIVE for a starting-soon screen. Empty shows nothing.",
    meta: { control: { placeholder: DEFAULTS.endText }, ui: { label: "End word", order: 6 } },
  },
  holdSec: {
    type: "number",
    required: false,
    description: "How long the clip holds at 00:00 after the countdown, in seconds (0..60).",
    meta: { constraints: { min: 0, max: MAX_HOLD }, ui: { label: "Hold at zero (s)", order: 7 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "The calm colour - the digits and the bar before any warning - as #rrggbb. Amber and red are fixed by the preset so the warnings mean the same thing on every screen.",
    meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULTS.accent }, ui: { label: "Accent", order: 8 } },
  },
  phaseTint: {
    type: "boolean",
    required: false,
    description: "Tint the whole frame with the phase - the room turns amber, then red - so a speaker reads the warning from the corner of an eye. Off keeps the frame dark and colours only the digits, the bar and the caption (quieter on a stream).",
    meta: { ui: { label: "Tint the frame by phase", order: 9 } },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Hand-tuned background / ink / muted trio: "dark" (default - a confidence monitor) or "light".',
    meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 10 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the digits and the bar sit in their bands) and draw it over the frame.",
    meta: { ui: { label: "Debug layout", order: 11 } },
  },
});

/* ── the arithmetic: pure, exported, and what the test asserts ── */

/** The slice length for a countdown: the smallest step that keeps the bar at or under MAX_SLICES slices. */
export function sliceSecondsFor(seconds: number): number {
  for (const step of SLICE_STEPS) if (Math.ceil(seconds / step) <= MAX_SLICES) return step;
  return SLICE_STEPS[SLICE_STEPS.length - 1];
}

export type Phase = "calm" | "warn" | "final";

export type SliceWindow = {
  /** 0 = the leftmost slice, the last to go out. */
  index: number;
  /** The remaining-time band this slice stands for: (remainLo, remainHi]. */
  remainLo: number;
  remainHi: number;
  /** The clip time at which it goes out: lit while t < outAtSec. */
  outAtSec: number;
  /** Its share of a full slice - the last slice of an uneven countdown is partial. */
  frac: number;
  phase: Phase;
};

/** The phase of a slice or of the digits at `remaining` seconds left. */
export function phaseAtRemaining(remaining: number, warnSec: number, finalSec: number, strict = false): Phase {
  const inside = (limit: number) => (strict ? remaining < limit : remaining <= limit);
  if (finalSec > 0 && inside(finalSec)) return "final";
  if (warnSec > 0 && inside(warnSec)) return "warn";
  return "calm";
}

/**
 * The bar's slices. Slice `i` (from the left) stands for the remaining-time
 * band `(i * slice, (i + 1) * slice]` and is lit while more than `i * slice`
 * seconds remain, i.e. while `t < seconds - i * slice`. Its colour is the
 * phase the digits are in while it is the lit tip, which is the phase at its
 * LOWER bound read strictly: the slice for 60..70 s left is calm, the slice
 * for 50..60 s left is amber, exactly as the digits flip at 60.
 */
export function sliceWindows(seconds: number, warnSec: number, finalSec: number): SliceWindow[] {
  const slice = sliceSecondsFor(seconds);
  const n = Math.max(1, Math.ceil(seconds / slice));
  const out: SliceWindow[] = [];
  for (let i = 0; i < n; i++) {
    const remainLo = i * slice;
    const remainHi = Math.min(seconds, (i + 1) * slice);
    out.push({
      index: i,
      remainLo,
      remainHi,
      outAtSec: round3(seconds - remainLo),
      frac: (remainHi - remainLo) / slice,
      phase: phaseAtRemaining(remainLo, warnSec, finalSec, true),
    });
  }
  return out;
}

/** How many slices are lit at clip time `t` - what the test checks against ceil(remaining / slice). */
export function litSlicesAt(windows: SliceWindow[], t: number): number {
  return windows.filter((w) => t < w.outAtSec).length;
}

function round3(n: number): number { return Math.round(n * 1000) / 1000; }

/**
 * The largest 5-smooth number (2^a 3^b 5^c) at or below `n`. The bar is a
 * child document on its own canvas, and a canvas whose side carries a large
 * prime (1790 = 2 x 5 x 179) has no divisor lattice under the basis, so the
 * placement degrades to exact and the split count goes rough (179). A
 * 5-smooth side always quantizes; the few pixels given up are margins.
 */
export function smoothDown(n: number): number {
  for (let v = Math.max(1, Math.floor(n)); v >= 1; v--) {
    let m = v;
    for (const p of [2, 3, 5]) while (m % p === 0) m /= p;
    if (m === 1) return v;
  }
  return 1;
}

/**
 * The digits: ONE drawtext expression, evaluated per frame by ffmpeg, that
 * prints MM:SS of the seconds remaining. `R = max(0, ceil(S - t - 0.001))`
 * so the clip opens on 05:00, flips to 04:59 at exactly one second, and
 * holds 00:00 through the end hold. Inside `%{...}` drawtext wants `\:` and
 * `\,`; the engine's textfile path keeps them. Minutes are not folded into
 * hours: a 90 minute slot reads 90:00.
 */
export function digitsExpr(seconds: number): string {
  const S = String(round3(seconds));
  const R = `max(0\\,ceil(${S}-t-0.001))`;
  return `%{eif\\:trunc((${R})/60)\\:d\\:2}:%{eif\\:mod(${R}\\,60)\\:d\\:2}`;
}

/** The three phase windows of the digits and the caption, in clip seconds. `null` = the phase does not exist. */
export function phaseWindows(seconds: number, warnSec: number, finalSec: number): Record<Phase, { startSec: number; endSec: number | null } | null> {
  const warnAt = warnSec > 0 ? round3(seconds - warnSec) : null;
  const finalAt = finalSec > 0 ? round3(seconds - finalSec) : null;
  const calmEnd = warnAt ?? finalAt;
  return {
    calm: { startSec: 0, endSec: calmEnd },
    warn: warnAt === null ? null : { startSec: warnAt, endSec: finalAt },
    final: finalAt === null ? null : { startSec: finalAt, endSec: null },
  };
}

/** "1:00", "0:30", "18:00" - a threshold as a human writes it. */
export function fmtClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** The enable gate for a window: raw commas - the engine escapes them natively. */
function gateExpr(w: { startSec: number; endSec: number | null }): string {
  const parts: string[] = [];
  if (w.startSec > 0) parts.push(`gte(t,${w.startSec})`);
  if (w.endSec !== null) parts.push(`lt(t,${w.endSec})`);
  return parts.length === 0 ? "1" : parts.join("*");
}

/* ── geometry ── */

export type TimerRect = { x: number; y: number; w: number; h: number };
export type TimerFit = { text: string; px: number; width: number };

export type TimerLayout = {
  W: number;
  H: number;
  S: number;
  margin: number;
  seconds: number;
  holdSec: number;
  slice: number;
  windows: SliceWindow[];
  phases: ReturnType<typeof phaseWindows>;
  title: TimerFit | null;
  titleRect: TimerRect;
  subtitle: TimerFit | null;
  subtitleRect: TimerRect;
  /** The digits' size and the width the widest string (88:88) measures at it. */
  digitsPx: number;
  digitsWidth: number;
  digitsRect: TimerRect;
  bar: TimerRect;
  slices: TimerRect[];
  rule: TimerFit;
  ruleRect: TimerRect;
  captions: Record<Phase, TimerFit | null>;
  endCaption: TimerFit | null;
  captionRect: TimerRect;
};

/** One line, shrunk until it fits; ellipsized only at the floor. */
function fitOne(text: string, maxW: number, maxPx: number, minPx: number, bold = false): TimerFit {
  let px = Math.max(minPx, Math.round(maxPx));
  while (px > minPx && widthOf(text, px, bold) > maxW) px = Math.max(minPx, Math.round(px * 0.92));
  const out = widthOf(text, px, bold) > maxW ? ellipsize(text, px, maxW, bold) : text;
  return { text: out, px, width: widthOf(out, px, bold) };
}

/**
 * Clauses joined by " - ", fitted by DROPPING whole clauses from the end
 * rather than cutting the sentence, so the thresholds survive a narrow
 * canvas and only the explanation goes.
 */
function fitClauses(clauses: string[], maxW: number, maxPx: number, minPx: number): TimerFit {
  for (let n = clauses.length; n >= 1; n--) {
    const text = clauses.slice(0, n).join(" - ");
    let px = Math.max(minPx, Math.round(maxPx));
    while (px > minPx && widthOf(text, px) > maxW) px = Math.max(minPx, Math.round(px * 0.92));
    if (widthOf(text, px) <= maxW) return { text, px, width: widthOf(text, px) };
  }
  return fitOne(clauses[0] ?? "", maxW, maxPx, minPx);
}

export type TimerOpts = {
  seconds: number;
  holdSec: number;
  title: string;
  subtitle: string;
  warnSec: number;
  finalSec: number;
  endText: string;
};

/**
 * The whole geometry as a pure function of the props and the canvas, so the
 * test can assert the rects, the windows and the fits without parsing m0.
 */
export function layoutTalkTimer(opts: TimerOpts, W: number, H: number): TimerLayout {
  const S = Math.min(H, 0.75 * W);
  const margin = Math.max(6, Math.round(0.06 * S));
  const minPx = Math.max(7, Math.round(0.016 * S));
  const contentW = Math.max(32, W - 2 * margin);
  const contentBudget = budget(contentW);

  // ── header: the slot's name and its rule ──
  const title = opts.title.length > 0 ? fitOne(opts.title, contentBudget, Math.round(0.07 * S), minPx, true) : null;
  const subtitle = opts.subtitle.length > 0 ? fitOne(opts.subtitle, contentBudget, Math.round(0.034 * S), minPx) : null;
  const titleH = title ? Math.round(1.25 * title.px) : 0;
  const subH = subtitle ? Math.round(1.5 * subtitle.px) : 0;
  const titleRect: TimerRect = { x: margin, y: margin, w: contentW, h: Math.max(1, titleH) };
  const subtitleRect: TimerRect = { x: margin, y: margin + titleH, w: contentW, h: Math.max(1, subH) };
  const headerBottom = margin + titleH + subH;

  // ── footer: the rule line left, the phase caption right ──
  const capPx = Math.max(minPx, Math.round(0.036 * S));
  const footerH = Math.round(1.6 * capPx);
  const footerY = H - margin - footerH;
  const captionW = Math.round(contentW * 0.38);
  const ruleW = contentW - captionW - Math.round(0.02 * contentW);
  const ruleRect: TimerRect = { x: margin, y: footerY, w: ruleW, h: footerH };
  const captionRect: TimerRect = { x: margin + contentW - captionW, y: footerY, w: captionW, h: footerH };

  // ── the middle band holds ONE centred group - the digits with the bar
  //    directly under them - so a tall canvas gets margins above and below,
  //    not a bar stranded at the bottom of an empty column ──
  const windows = sliceWindows(opts.seconds, opts.warnSec, opts.finalSec);
  const slice = sliceSecondsFor(opts.seconds);
  const bandTop = headerBottom + Math.round(0.5 * margin);
  const bandBottom = footerY - Math.round(0.6 * margin);
  const bandH = Math.max(24, bandBottom - bandTop);
  // The bar's own canvas: 5-smooth on both sides (see smoothDown), centred.
  const barH = smoothDown(Math.max(6, Math.min(Math.round(0.085 * S), Math.round(bandH * 0.2))));
  const barW = smoothDown(contentW);
  const barX = margin + Math.floor((contentW - barW) / 2);
  const gapUnder = Math.max(4, Math.round(0.45 * margin));

  // The digits are fitted to the WIDEST string the expression can print,
  // with room for the system font drawtext will use (a monospace or an
  // Arial-class face, wider than the bundled Roboto the measurer knows).
  const widest = "88:88";
  const widthCap = 0.92 * contentBudget;
  const digitsRoom = Math.max(12, bandH - gapUnder - barH);
  let digitsPx = Math.max(minPx, Math.min(Math.round(0.5 * S), Math.round(digitsRoom / 1.3)));
  while (digitsPx > minPx && widthOf(widest, digitsPx, true) > widthCap) digitsPx = Math.max(minPx, Math.round(digitsPx * 0.94));
  const digitsWidth = widthOf(widest, digitsPx, true);
  const digitsH = Math.min(digitsRoom, Math.round(1.3 * digitsPx));
  const groupH = digitsH + gapUnder + barH;
  const groupTop = bandTop + Math.max(0, Math.floor((bandH - groupH) / 2));
  const digitsRect: TimerRect = { x: margin, y: groupTop, w: contentW, h: digitsH };

  // ── the bar: one cell per slice, gaps between, the last one partial ──
  const barY = groupTop + digitsH + gapUnder;
  const bar: TimerRect = { x: barX, y: barY, w: barW, h: barH };
  const gap = Math.max(2, Math.round(0.006 * S));
  const n = windows.length;
  const fullW = (barW - (n - 1) * gap) / n;
  const slices: TimerRect[] = windows.map((w) => {
    const x0 = Math.round(barX + w.index * (fullW + gap));
    const x1 = Math.round(barX + w.index * (fullW + gap) + fullW * w.frac);
    return { x: x0, y: barY, w: Math.max(2, Math.min(x1, barX + barW) - x0), h: barH };
  });

  // ── the words ──
  const phases = phaseWindows(opts.seconds, opts.warnSec, opts.finalSec);
  const ruleClauses = [
    ...(opts.warnSec > 0 ? [`amber at ${fmtClock(opts.warnSec)}`] : []),
    ...(opts.finalSec > 0 ? [`red at ${fmtClock(opts.finalSec)}`] : []),
    ...(opts.endText.length > 0 ? [`then ${opts.endText}`] : []),
  ];
  const rule = fitClauses(ruleClauses.length > 0 ? ruleClauses : [`${fmtClock(opts.seconds)} on the clock`], budget(ruleW), Math.round(0.028 * S), minPx);
  const capBudget = budget(captionW);
  const captions: Record<Phase, TimerFit | null> = {
    calm: null,
    warn: phases.warn ? fitOne("WRAP UP", capBudget, capPx, minPx, true) : null,
    final: phases.final ? fitOne(`LAST ${Math.round(opts.finalSec)} SECONDS`, capBudget, capPx, minPx, true) : null,
  };
  const endCaption = opts.endText.length > 0 ? fitOne(opts.endText, capBudget, capPx, minPx, true) : null;

  return {
    W, H, S, margin,
    seconds: opts.seconds, holdSec: opts.holdSec, slice, windows, phases,
    title, titleRect, subtitle, subtitleRect,
    digitsPx, digitsWidth, digitsRect,
    bar, slices,
    rule, ruleRect, captions, endCaption, captionRect,
  };
}

/**
 * What the geometry promises. Text is calibrated from the measured block;
 * the digits from the widest string the expression prints, widened by 15%
 * for the system font; the bands the design depends on get a `within`.
 */
export function talkTimerContract(L: TimerLayout): LayoutConstraint[] {
  const digitsLabels = (["calm", "warn", "final"] as Phase[]).filter((p) => L.phases[p] !== null).map((p) => `digits-${p}`);
  return [
    ...(L.title ? [textFitsMeasured("title", L.title.text, L.title.px, L.title.width)] : []),
    ...(L.subtitle ? [textFitsMeasured("subtitle", L.subtitle.text, L.subtitle.px, L.subtitle.width)] : []),
    textFitsMeasured("rule", L.rule.text, L.rule.px, L.rule.width),
    ...(["warn", "final"] as Phase[]).filter((p) => L.captions[p]).map((p) => textFitsMeasured(`caption-${p}`, L.captions[p]!.text, L.captions[p]!.px, L.captions[p]!.width)),
    ...(L.endCaption ? [textFitsMeasured("caption-end", L.endCaption.text, L.endCaption.px, L.endCaption.width)] : []),
    ...digitsLabels.map((label) => textFitsMeasured(label, "88:88", L.digitsPx, L.digitsWidth * 1.15)),
    // The digits are the product: they live in the middle band and are never a sliver.
    ...digitsLabels.map((label): LayoutConstraint => ({ label, within: { yFrac: [0.08, 0.85] }, minWidthFrac: 0.35 })),
    // The bar is the other half of the product: present, under the digits,
    // never collapsed. Its slices live in a child document and the check
    // flattens through it - which is also why the parent's "bar" source has
    // no constraint: flattening replaces it with the slices themselves.
    { label: "seg-lit", within: { yFrac: [0.25, 0.97] } },
    { label: "seg-spent", within: { yFrac: [0.25, 0.97] } },
    ...(L.title ? [{ label: "title", within: { yFrac: [0, 0.35] } } as LayoutConstraint] : []),
    { label: "rule", within: { yFrac: [0.7, 1] } },
  ];
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts). Filled from journal/2026-09-23/.
 */
const WHY: WhySpec = {
  day: 4,
  date: "2026-09-23",
  agent: "claude",
  model: "claude-fable-5-1",
  id: ID,
  title: "Talk Timer",
  who: "Stage crews and organisers running timed talk slots, and streamers with starting-soon scenes; found on timer-tool pages, the OBS forums and in ffmpeg gists.",
  problem: [
    "Every timed slot needs a countdown the speaker can see. EventTimer: \"a large, unambiguous countdown in the speaker's line of sight, on a confidence monitor, a tablet at the podium ... turns yellow at the 1-minute mark and red at 30 seconds\". Stagetimer's customers: Slush, YC Startup School, Munich Security Conference.",
    "When the countdown has to be a FILE, people hand-roll it. A gist that fed a YouTube playlist, a wiki page and a LinkedIn batch loop each re-derive the same ffmpeg drawtext expression, %{eif\\:S-t\\:d}; a Python GUI wraps it. The OBS forums: \"most people fake a pre-stream countdown with a fixed-length video\".",
    "The setting: WeAreDevelopers World Congress North America, 23-25 September 2026, San Jose - \"10,000+ Builders, 500+ Speakers, 3 Days\" - is five hundred timed slots on a dozen stages, and this run happened on its first day.",
  ],
  sources: [
    "https://stagetimer.io/use-cases/conference-and-speaker-timer/",
    "https://www.eventtimer.io/tools/presentation-timer",
    "https://gist.github.com/derand/31b8312fd64156120cb8f45825a1f0f7",
    "https://www.linkedin.com/pulse/batch-video-generator-countdown-ffmpeg-jose-velazquez-ma-pfkxe",
    "https://obsproject.com/forum/resources/stream-countdown-starting-soon-with-auto-scene-switch.2603/",
    "https://www.wearedevelopers.com/world-congress-north-america",
    "https://presenttimer.com/presentation-timer/",
    "https://slidemodel.com/tools/countdown-timer/5-minute-timer/",
    "https://wiki.tonytascioglu.com/scripts/ffmpeg/add_countdown_to_video",
    "https://github.com/pyoko-dev/countdown-generator",
    "https://obsproject.com/forum/threads/looking-for-a-countdown-timer.148696/",
    "https://createtimer.com/blog/how-to-create-twitch-starting-soon-screen-with-timer/",
  ],
  solution: [
    "One video document, no pipeline: the bar is a row of time-slice rectangles, each switched off on its own schedule by a scalar enable gate, and the digits are one drawtext expression - the one the gists wrote by hand, generated from props. Nothing per-pixel moves, so a five minute clip is cheap.",
    "The phases are thresholds, not animations: warnSec and finalSec are seconds remaining, exactly as the tools state them. The digits, the bar's colour zones and the caption all read the same two numbers; at zero the end word appears and the clip holds.",
    "The claim is narrow on purpose. A file cannot pause or add a minute - the live apps can. This is for when the countdown must be a file: an OBS scene, a playback deck, a phone on the podium, a slide embed - and for batches, one clip per slot from the schedule.",
  ],
  usage: {
    command: "m0saic make @one-a-day/events/talk-timer/v1 --template-repo . -w 1920 -h 1080 -o timer.mp4",
    try: [
      "seconds 180, title Starting soon, endText LIVE, warnSec 0, finalSec 10 - a stream pre-roll",
      "seconds 1080, warnSec 300, finalSec 60 - an 18 minute slot with a five minute warning",
      "--durationMs 60000 - the clip length is the countdown: a one minute timer",
      "preset light, debugLayout true - the contract drawn over the frame",
    ],
  },
  caveats: [
    "A clip cannot pause, add time or be driven from backstage; a live timer app can. Regenerate the file when the slot changes.",
    "The digits are drawtext in the machine's default sans font, sized with margin; a very narrow canvas trades digit size for the bar.",
    "Minutes are not folded into hours: a 90 minute slot reads 90:00.",
  ],
  // No runner trace.json for this run: the day was run by hand in a Claude
  // Code session, so the phases are the session's own clock (the ship phase
  // fills the final numbers). Tokens and dollars are omitted rather than
  // guessed.
  timeline: {
    source: "self-reported",
    phases: [
      { name: "scout", startMs: 0, durMs: 1500000 },
    ],
  },
};

export const TalkTimerV1 = defineMosaicTemplate<TalkTimerProps>({
  id: asTemplateId(ID),
  label: "2026-09-23 · Talk Timer",
  version: 1,
  description:
    "A countdown clip for a timed talk slot: big digits, a bar of time-slice rectangles that go out on schedule, amber and red phases at the seconds you choose.",
  capabilities: { tier: "core" },
  tags: ["events", "2026-09-23", "day-004", "countdown", "timer", "talk", "conference", "stream", "video"],

  outputHints: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: (DEFAULTS.seconds + DEFAULTS.holdSec) * 1000,
    format: { kind: "video", container: "mp4" },
    note: "A clip whose length is the countdown plus the hold. 16:9 for a confidence monitor, a stage screen or an OBS scene; portrait for a phone on the podium. An explicit --durationMs makes the countdown that long.",
  },
  // The countdown is the clip: a host seeds its Duration field from the props.
  // Pure and cheap; at the defaults it equals the static hint above.
  resolveOutputHints: (props) => {
    const seconds = numberOr(props?.seconds, DEFAULTS.seconds, MIN_SECONDS, MAX_SECONDS);
    const hold = numberOr(props?.holdSec, DEFAULTS.holdSec, 0, MAX_HOLD);
    return { durationMs: Math.round((seconds + hold) * 1000) };
  },

  propsSchema,
  defaultProps: {
    seconds: DEFAULTS.seconds,
    title: DEFAULTS.title,
    subtitle: DEFAULTS.subtitle,
    warnSec: DEFAULTS.warnSec,
    finalSec: DEFAULTS.finalSec,
    endText: DEFAULTS.endText,
    holdSec: DEFAULTS.holdSec,
    accent: DEFAULTS.accent,
    phaseTint: true,
    preset: DEFAULTS.preset,
    debugLayout: false,
  },

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default TalkTimerV1;

/** A finite number in range, or the fallback - for the hints resolver, which must never throw. */
function numberOr(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

/** An optional string prop: undefined = the default, "" = removed. ASCII only - the bundled font draws the rest as tofu. */
function pickText(value: string | undefined, fallback: string, name: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") throw new Error(`${ID}: ${name} must be a string.`);
  return value.replace(/[^\x20-\x7e]/g, "?").replace(/\s+/g, " ").trim();
}

function pickNumber(value: unknown, fallback: number, name: string, min: number, max: number, integer = true): number {
  if (value === undefined) return fallback;
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) throw new Error(`${ID}: ${name} must be a number. Got ${JSON.stringify(value)}.`);
  if (integer && !Number.isInteger(n)) throw new Error(`${ID}: ${name} must be a whole number of seconds. Got ${JSON.stringify(value)}.`);
  if (n < min || n > max) throw new Error(`${ID}: ${name} must be between ${min} and ${max}. Got ${JSON.stringify(value)}.`);
  return n;
}

function pickColor(value: string | undefined, fallback: MosaicColor, name: string): MosaicColor {
  const s = typeof value === "string" ? value.trim() : "";
  if (s.length === 0) return fallback;
  if (!HEX.test(s)) throw new Error(`${ID}: ${name} ${JSON.stringify(value)} must be #rrggbb.`);
  return s as MosaicColor;
}

/** The per-frame digits: drawtext, video mode, one expression, gated to its phase window. */
function digitsSource(expr: string, px: number, color: MosaicColor, window: { startSec: number; endSec: number | null }, label: string): MosaicTextSource {
  return {
    type: "text",
    renderMode: { kind: "video" },
    visual: { backgroundColor: "black@0" as MosaicColor },
    layers: [
      {
        content: { kind: "expr", expr, eval: "frame" },
        style: { fontSize: px, fontColor: color },
        placement: { hAlign: "center", vAlign: "middle" },
      },
    ],
    overlay: {
      enable: gateExpr(window),
      window: { ...(window.startSec > 0 ? { startSec: window.startSec } : {}), ...(window.endSec !== null ? { endSec: window.endSec } : {}) },
    },
    editor: { owner: "template", label },
  } as MosaicTextSource;
}

/** A static (svg) text cell that exists only inside a window. */
function gatedText(cell: MosaicSource, window: { startSec: number; endSec: number | null }): MosaicSource {
  return {
    ...cell,
    overlay: {
      enable: gateExpr(window),
      window: { ...(window.startSec > 0 ? { startSec: window.startSec } : {}), ...(window.endSec !== null ? { endSec: window.endSec } : {}) },
    },
  } as MosaicSource;
}

async function render(props: TalkTimerProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  // The schema is documentation; render() is the gate.
  let seconds = pickNumber(props.seconds, DEFAULTS.seconds, "seconds", MIN_SECONDS, MAX_SECONDS);
  let holdSec = pickNumber(props.holdSec, DEFAULTS.holdSec, "holdSec", 0, MAX_HOLD);
  const warnSec = pickNumber(props.warnSec, DEFAULTS.warnSec, "warnSec", 0, MAX_SECONDS);
  const finalSec = pickNumber(props.finalSec, DEFAULTS.finalSec, "finalSec", 0, MAX_SECONDS);
  if (warnSec >= seconds) throw new Error(`${ID}: warnSec (${warnSec}) must be below seconds (${seconds}) - a warning that starts before the clock does is no warning.`);
  if (finalSec >= seconds) throw new Error(`${ID}: finalSec (${finalSec}) must be below seconds (${seconds}).`);
  if (warnSec > 0 && finalSec > warnSec) throw new Error(`${ID}: finalSec (${finalSec}) must not exceed warnSec (${warnSec}) - red comes after amber.`);
  if (props.preset !== undefined && props.preset !== "dark" && props.preset !== "light") throw new Error(`${ID}: preset must be "dark" or "light".`);
  const theme = props.preset === "light" ? PRESETS.light : PRESETS.dark;
  const accent = pickColor(props.accent, DEFAULTS.accent as MosaicColor, "accent");
  const title = pickText(props.title, DEFAULTS.title, "title");
  const subtitle = pickText(props.subtitle, DEFAULTS.subtitle, "subtitle");
  const endText = pickText(props.endText, DEFAULTS.endText, "endText");

  // The countdown is the clip. An explicit user pin wins and BECOMES the
  // countdown (minus the hold); the host-seeded target is never read as one.
  const pinned = resolvePinnedDurationMs(ctx);
  if (pinned !== undefined) {
    const total = pinned / 1000;
    holdSec = Math.min(holdSec, Math.floor(total / 2));
    seconds = Math.max(1, Math.floor(total - holdSec));
    holdSec = round3(total - seconds);
  }
  const effWarn = warnSec >= seconds ? 0 : warnSec;
  const effFinal = finalSec >= seconds ? 0 : finalSec;

  const W = Math.max(1, Math.round(ctx.target.width));
  const H = Math.max(1, Math.round(ctx.target.height));
  const L = layoutTalkTimer({ seconds, holdSec, title, subtitle, warnSec: effWarn, finalSec: effFinal, endText }, W, H);

  const phaseColor = (p: Phase): MosaicColor => (p === "final" ? theme.red : p === "warn" ? theme.amber : accent);
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const piece = (rect: TimerRect, importance: number, source: MosaicSource) => pieces.push({ rect: { ...rect, importance }, source });

  const durationMs = Math.round((seconds + holdSec) * 1000);

  // ── 0. variant b's idea: the whole frame tints with the phase. Two
  //    full-canvas tiles painted first, each gated to its window (the engine
  //    trims each to its lifetime, so they cost nothing outside it). ──
  if (props.phaseTint !== false) {
    for (const p of ["warn", "final"] as Phase[]) {
      const w = L.phases[p];
      if (!w) continue;
      const tile = makeColorTile(p === "warn" ? theme.tintWarn : theme.tintFinal, {
        overlay: { enable: gateExpr(w), window: { startSec: w.startSec, ...(w.endSec !== null ? { endSec: w.endSec } : {}) } },
      });
      piece({ x: 0, y: 0, w: W, h: H }, 0, tag(tile as MosaicSource, `tint-${p}`));
    }
  }

  // ── 1. the bar, as a CHILD document. Every enable-gated tile is its own
  //    overlay in ffmpeg's chain, and past ~25 the chain silently degrades
  //    the inline masks that every svg glyph on the frame rides. So the
  //    gated tiles live in a child rendered on its own small canvas (the bar
  //    rect): the spent tiles are static and lower onto the grid sheet, only
  //    the lit tiles are overlays, and none of them carries a mask (plain
  //    rectangles - the rectangle IS the data). The parent sees one source. ──
  const barPieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  for (const w of L.windows) {
    const r = L.slices[w.index];
    const local = { x: r.x - L.bar.x, y: r.y - L.bar.y, w: r.w, h: r.h };
    // Variant c's idea: a spent slice is translucent, so the frame's tint
    // reads through it and the bar stays one object with the room.
    barPieces.push({ rect: { ...local, importance: 1 }, source: tag({ ...makeColorTile(theme.spent), visual: { opacity: theme.spentOpacity } } as MosaicSource, "seg-spent") });
  }
  for (const w of L.windows) {
    const r = L.slices[w.index];
    const local = { x: r.x - L.bar.x, y: r.y - L.bar.y, w: r.w, h: r.h };
    const lit = makeColorTile(phaseColor(w.phase), { overlay: { enable: `lt(t,${w.outAtSec})`, window: { endSec: w.outAtSec } } });
    barPieces.push({ rect: { ...local, importance: 2 }, source: tag(lit as MosaicSource, "seg-lit") });
  }
  const barPlaced = placeInsetPieces({ rootW: L.bar.w, rootH: L.bar.h, pieces: barPieces });
  const barDoc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(barPlaced.m0, ID),
    assets: {},
    size: { width: L.bar.w, height: L.bar.h },
    fps: ctx.target.fps,
    durationMs,
    sources: barPlaced.sources,
    editor: { label: `bar - ${L.windows.length} slices of ${L.slice}s` },
  };
  piece(L.bar, 2, tag({ type: "mosaic", ref: "bar", placement: { fit: "contain" } } as MosaicSource, "bar"));
  // 2. the header
  if (L.title) piece(L.titleRect, 3, bindProp(tag(textCell({ text: L.title.text, fontSize: L.title.px, color: theme.ink, hAlign: "left", bold: true, vAlign: "middle", label: "title" }), "title"), "title"));
  if (L.subtitle) piece(L.subtitleRect, 3, bindProp(tag(textCell({ text: L.subtitle.text, fontSize: L.subtitle.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "subtitle" }), "subtitle"), "subtitle"));
  // 3. the digits - one copy per phase, gated to disjoint windows. The calm
  //    copy is painted in the accent, so it is the rect that shows the prop.
  const expr = digitsExpr(seconds);
  for (const p of ["calm", "warn", "final"] as Phase[]) {
    const w = L.phases[p];
    if (!w) continue;
    const src = tag(digitsSource(expr, L.digitsPx, phaseColor(p), w, `digits-${p}`) as MosaicSource, `digits-${p}`);
    piece(L.digitsRect, 4, p === "calm" ? bindProp(src, "accent") : src);
  }
  // 4. the footer: the rule (static) and the captions (gated)
  piece(L.ruleRect, 3, tag(textCell({ text: L.rule.text, fontSize: L.rule.px, color: theme.dim, hAlign: "left", vAlign: "middle", label: "rule" }), "rule"));
  for (const p of ["warn", "final"] as Phase[]) {
    const fit = L.captions[p];
    const w = L.phases[p];
    if (!fit || !w) continue;
    // The caption of the last phase yields to the end word at zero.
    const win = p === "final" && L.endCaption ? { startSec: w.startSec, endSec: seconds } : w;
    piece(L.captionRect, 3, gatedText(tag(textCell({ text: fit.text, fontSize: fit.px, color: phaseColor(p), hAlign: "right", bold: true, vAlign: "middle", label: `caption-${p}` }), `caption-${p}`), win));
  }
  if (L.endCaption) {
    const endColor = L.phases.final ? theme.red : L.phases.warn ? theme.amber : accent;
    piece(L.captionRect, 3, bindProp(gatedText(tag(textCell({ text: L.endCaption.text, fontSize: L.endCaption.px, color: endColor, hAlign: "right", bold: true, vAlign: "middle", label: "caption-end" }), "caption-end"), { startSec: seconds, endSec: null }), "endText"));
  }

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    size: { width: W, height: H },
    fps: ctx.target.fps,
    // The countdown is the clip - authored, so it out-ranks the hint.
    durationMs,
    backgroundColor: theme.bg,
    sources: placed.sources,
    children: { bar: barDoc },
    editor: { label: `Talk Timer · ${fmtClock(seconds)} · ${L.windows.length} slices of ${L.slice}s` },
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints: talkTimerContract(L), debug: props.debugLayout === true });
}
