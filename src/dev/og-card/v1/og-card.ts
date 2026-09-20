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
  bindProps,
  defineMosaicTemplate,
  definePropsSchema,
  makeColorTile,
  measureText,
  placeInsetPieces,
  resolveFontFile,
} from "@m0saic/template-utils";
import type { LayoutConstraint } from "@m0saic/template-utils";
import { textFitsMeasured, withLayoutIntent } from "../../../_shared/layout";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/dev/og-card/v1` — an Open Graph preview card from five strings.
 *
 * ONE CONCEPT: the `og:image` every post needs is a still made of text
 * rectangles, so it belongs in the build step, not in Figma. Feed it the
 * front matter (`--props @post.json`) and get the same PNG every build; a
 * stale card becomes a `git diff`, not a surprise on X or Slack.
 *
 * The rule that bites: the svg rasterizer never wraps or shrinks text. Every
 * line here is MEASURED against the bundled font (bold against the bold
 * file) and the cells are carved to the measured block — never the other way
 * round. Chrome scales with `min(H, 0.75 * W)`, so a 1080x1920 story keeps
 * the proportions of the 1200x630 card instead of growing a slab.
 *
 * Layout, top to bottom: margin · [kicker] · title (1-3 lines) · [summary
 * (1-2 lines)] · margin · an accent BAND across the bottom carrying the
 * footer (site left, author right) in on-colour ink. The text block centres
 * vertically between the top margin and the band, so square and portrait
 * canvases do not spread the rows apart. Every drawn prop is bound to its
 * rect (Make double-click edits it in place); the band binds `accent`;
 * `background` is the document colour and has no rect.
 *
 * The layout contract (`layoutContract()`, stamped on every render by
 * `withLayoutIntent`, swept at seven canvases in the test and by the build):
 * every text fits its box, the band spans the full width on the bottom
 * edge, the footer sits inside it, the title stays inside the margins and
 * is at least half the canvas wide.
 *
 * Day 001 of one-a-day. Scouted from HN / dev.to: people run headless
 * browsers and paid APIs to put five strings on a rectangle. The WHY spec
 * below is the template's own account of that (`renderTutorial`: the run,
 * the problem with its sources, the solution, how to use it, then the card).
 */

export type OgCardProps = {
  /** Headline, 1-3 lines. Required, but it carries a default so the card shows itself. */
  title: string;
  /** One or two muted lines under the title. Empty removes the row. */
  summary?: string;
  /** Small accent-coloured label above the title: a section, a tag. Empty removes it. */
  kicker?: string;
  /** Footer, left: the domain or site name. Empty removes it. */
  site?: string;
  /** Footer, right: the byline. Empty removes it. */
  author?: string;
  /** Accent colour (#rrggbb): the bar and the kicker. */
  accent?: string;
  /** Hand-tuned background / ink / muted trio. */
  preset?: "dark" | "light";
  /** Background override (#rrggbb); empty = the preset's. */
  background?: string;
  /** Title ink override (#rrggbb); empty = the preset's. */
  ink?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/dev/og-card/v1";
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Hand-tuned trios: dark is tuned, not derived from light. */
const PRESETS = {
  dark: { bg: "#0b1220" as MosaicColor, ink: "#f3f4f6" as MosaicColor, muted: "#9aa4b2" as MosaicColor },
  light: { bg: "#ffffff" as MosaicColor, ink: "#0f172a" as MosaicColor, muted: "#5b6472" as MosaicColor },
};
const DEFAULT_ACCENT = "#2f81f7";
const DEFAULT_TITLE = "Ship a preview image for every post";
const DEFAULT_SUMMARY =
  "One props file in, one 1200x630 PNG out. No browser, no API key, the same bytes every build.";
const DEFAULT_KICKER = "ENGINEERING BLOG";
const DEFAULT_SITE = "example.dev";
const DEFAULT_AUTHOR = "by one-a-day";

/** Font caps as fractions of `S = min(H, 0.75 * W)`. */
const CAP = { kicker: 0.034, title: 0.115, summary: 0.042, footer: 0.036 };
const MARGIN_FRAC = 0.08;
/** Below this the copy stops reading on a normal canvas; the fitter wraps at it anyway. */
const MIN_PX = 10;
/**
 * Lattice basis for the inset packer. The OG standard 1200x630 has a 7 in its
 * height (630 = 2*3^2*5*7): at the default basis (120) the packer picks pitch
 * 6 and a 105-row split, which the `latticeSmooth` gate refuses. At 90 the
 * pitch is 7 -> 90 rows (5-smooth), and 1080 / 1200 / 1920 stay smooth too.
 * Zero drift either way - the inset recovers the exact rect.
 */
const INSET_BASIS = 90;

const propsSchema = definePropsSchema<OgCardProps>({
  title: {
    type: "string",
    required: true,
    description: "Headline, one to three lines. Long titles shrink before they wrap past three lines. The rect is bound, so Make's double-click edits it in place.",
    meta: { ui: { label: "Title", order: 1, primary: true } },
  },
  summary: {
    type: "string",
    required: false,
    description: "One or two muted lines under the title - the post's description. Empty removes the row.",
    meta: { control: { placeholder: "none" }, ui: { label: "Summary", order: 2 } },
  },
  kicker: {
    type: "string",
    required: false,
    description: "Small accent-coloured label above the title: a section or a tag. Rendered as given (uppercase it yourself). Empty removes it.",
    meta: { control: { placeholder: "none" }, ui: { label: "Kicker", order: 3 } },
  },
  site: {
    type: "string",
    required: false,
    description: "Footer, left: the domain or site name. Empty removes it.",
    meta: { control: { placeholder: "none" }, ui: { label: "Site", order: 4 } },
  },
  author: {
    type: "string",
    required: false,
    description: "Footer, right: the byline. Empty removes it.",
    meta: { control: { placeholder: "none" }, ui: { label: "Author", order: 5 } },
  },
  accent: {
    type: "string",
    required: false,
    description: "Accent colour for the bar and the kicker, as #rrggbb.",
    meta: {
      constraints: { isColor: true },
      control: { colorPicker: true, defaultColor: DEFAULT_ACCENT },
      ui: { label: "Accent", order: 6 },
    },
  },
  preset: {
    type: "string",
    required: false,
    description: 'Hand-tuned background / ink / muted trio: "dark" (default) or "light".',
    meta: {
      constraints: { oneOf: ["dark", "light"] },
      ui: { label: "Preset", order: 7 },
    },
  },
  background: {
    type: "string",
    required: false,
    description: "Background override as #rrggbb. Empty uses the preset's background.",
    meta: {
      constraints: { isColor: true },
      control: { placeholder: "preset background", colorPicker: true },
      ui: { label: "Background", order: 8 },
    },
  },
  ink: {
    type: "string",
    required: false,
    description: "Title ink override as #rrggbb. Empty uses the preset's ink.",
    meta: {
      constraints: { isColor: true },
      control: { placeholder: "preset ink", colorPicker: true },
      ui: { label: "Ink", order: 9 },
    },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the band spans the bottom edge, the block stays inside the margins) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 10 } },
  },
});

/** A blank colour picker means "unset" - fall back. Anything else must be #rrggbb. */
function pickColor(value: string | undefined, fallback: MosaicColor, name: string): MosaicColor {
  const s = typeof value === "string" ? value.trim() : "";
  if (s.length === 0) return fallback;
  if (!HEX.test(s)) throw new Error(`${ID}: ${name} ${JSON.stringify(value)} must be #rrggbb.`);
  return s as MosaicColor;
}

/** An optional string prop: undefined = the default, "" = removed. */
function pickText(value: string | undefined, fallback: string, name: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") throw new Error(`${ID}: ${name} must be a string.`);
  return value.trim().replace(/\s+/g, " ");
}

/** Ink for text on a coloured fill: white on a dark accent, near-black on a pale one (relative luminance). */
function onColor(hex: MosaicColor): MosaicColor {
  const c = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
  return (lum > 0.4 ? "#0b1220" : "#ffffff") as MosaicColor;
}

export type Fit = { text: string; fontSize: number; width: number; height: number; lines: number };

/**
 * Fit copy into a pixel box: greedy word-wrap measured against the bundled
 * font (the bold file when `bold`), binary-searching the largest size whose
 * wrapped block fits both axes within `maxLines`. Mirrors template-utils'
 * `fitSvgText` but measures the weight that will actually be drawn. When
 * nothing fits at MIN_PX the copy is still wrapped at the floor: a block that
 * clips at the bottom beats one line running off both edges.
 */
function fitCopy(
  text: string,
  boxW: number,
  boxH: number,
  opts: { maxPx: number; maxLines: number; bold?: boolean },
): Fit {
  const fontPath = opts.bold ? resolveFontFile({ weight: "bold" })?.path : undefined;
  const measure = (s: string, fontSize: number) => measureText(s, { fontSize, ...(fontPath ? { fontPath } : {}) });
  const wrap = (fontSize: number, maxW: number): string[] => {
    const words = text.split(" ").filter((w) => w.length > 0);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line.length === 0 ? word : `${line} ${word}`;
      if (line.length === 0 || measure(candidate, fontSize).width <= maxW) line = candidate;
      else { lines.push(line); line = word; }
    }
    if (line.length > 0) lines.push(line);
    return lines;
  };
  const attempt = (fontSize: number): Fit | undefined => {
    const lines = wrap(fontSize, boxW);
    if (lines.length > opts.maxLines) return undefined;
    const block = lines.join("\n");
    const m = measure(block, fontSize);
    if (m.width > boxW || m.height > boxH) return undefined;
    return { text: block, fontSize, width: m.width, height: m.height, lines: lines.length };
  };
  let lo = MIN_PX;
  let hi = Math.max(MIN_PX, Math.round(opts.maxPx));
  let best = attempt(lo);
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const fit = attempt(mid);
    if (fit) { best = fit; lo = mid + 1; } else { hi = mid - 1; }
  }
  if (best) return balance(best);
  const lines = wrap(MIN_PX, boxW);
  const block = lines.join("\n");
  const m = measure(block, MIN_PX);
  return { text: block, fontSize: MIN_PX, width: m.width, height: m.height, lines: lines.length };

  /**
   * Balance: the size search maximises the font, so a two-line title often
   * ends "... for every" / "post". Keep the size and the line count, but find
   * the narrowest wrap width that still yields that many lines (binary search
   * on width) - the lines end up even, like CSS `text-wrap: balance`. The
   * block only gets narrower, so every fit guarantee above still holds.
   */
  function balance(fit: Fit): Fit {
    if (fit.lines < 2) return fit;
    let loW = Math.ceil(fit.width / fit.lines);
    let hiW = Math.floor(fit.width);
    let bestLines: string[] | null = null;
    while (loW <= hiW) {
      const midW = Math.floor((loW + hiW) / 2);
      const lines = wrap(fit.fontSize, midW);
      if (lines.length <= fit.lines) { bestLines = lines; hiW = midW - 1; } else { loW = midW + 1; }
    }
    if (!bestLines || bestLines.length !== fit.lines) return fit;
    const block = bestLines.join("\n");
    const m = measure(block, fit.fontSize);
    if (m.width > boxW || m.height > boxH) return fit;
    return { text: block, fontSize: fit.fontSize, width: m.width, height: m.height, lines: bestLines.length };
  }
}

export type Rect = { x: number; y: number; w: number; h: number };
export type Placed = { rect: Rect; fit: Fit };
export type OgCardLayout = {
  W: number;
  H: number;
  /** The scale unit: min(H, 0.75 * W). */
  S: number;
  margin: number;
  bar: Rect;
  kicker: Placed | null;
  title: Placed;
  summary: Placed | null;
  site: Placed | null;
  author: Placed | null;
};

/**
 * The geometry, as a pure function of the copy and the canvas: measure every
 * line, then carve exact rects. Exported so the test can assert the rects
 * (inside the canvas, no overlaps, footer on the bottom margin) without
 * parsing the m0.
 */
export function layoutOgCard(
  text: { title: string; summary: string; kicker: string; site: string; author: string },
  W: number,
  H: number,
): OgCardLayout {
  // ── scale: chrome follows min(H, 0.75W), never H alone ──
  const S = Math.min(H, 0.75 * W);
  const margin = Math.max(8, Math.round(MARGIN_FRAC * S));
  const textX = margin;
  const interiorW = Math.max(16, W - 2 * margin);
  // The fit budget inside a cell: `cell * 0.94 - 2px` (the layout contract's
  // rule) - quantization hands a leaf a pixel or two less than its share, and
  // the contract's ruler checks the realized box, so the copy keeps slack.
  const budget = (cellW: number) => Math.max(8, Math.floor(cellW * 0.94 - 2));
  const pad = (px: number) => Math.max(1, Math.round(px * 0.12));

  // ── footer: site left, author right, on the bottom margin ──
  const footerCap = CAP.footer * S;
  const halfW = Math.max(8, Math.floor((interiorW - Math.round(0.04 * S)) / 2));
  const siteFit = text.site.length > 0 ? fitCopy(text.site, budget(halfW), footerCap * 2, { maxPx: footerCap, maxLines: 1 }) : null;
  const authorFit = text.author.length > 0 ? fitCopy(text.author, budget(halfW), footerCap * 2, { maxPx: footerCap, maxLines: 1 }) : null;
  const footerPx = Math.max(siteFit?.fontSize ?? 0, authorFit?.fontSize ?? 0);
  const footerH = footerPx > 0 ? Math.ceil(Math.max(siteFit?.height ?? 0, authorFit?.height ?? 0)) + 2 * pad(footerPx) : 0;
  // The footer sits inside an accent band across the bottom. With no footer
  // copy the band is a thin rule on the bottom edge.
  const bandPad = Math.round(0.45 * margin);
  const bandH = footerH > 0 ? footerH + 2 * bandPad : Math.max(4, Math.round(0.012 * S));
  const footerY = H - bandH + bandPad;

  // ── the text block: measured first, then carved ──
  const blockTop = margin;
  const blockBottom = H - bandH - Math.round(0.6 * margin);
  const blockH = Math.max(16, blockBottom - blockTop);
  const titleFit = fitCopy(text.title, budget(interiorW), blockH * 0.62, { maxPx: CAP.title * S, maxLines: 3, bold: true });
  const kickerFit = text.kicker.length > 0 ? fitCopy(text.kicker, budget(interiorW), blockH * 0.12, { maxPx: CAP.kicker * S, maxLines: 1, bold: true }) : null;
  const summaryFit = text.summary.length > 0 ? fitCopy(text.summary, budget(interiorW), blockH * 0.3, { maxPx: CAP.summary * S, maxLines: 2 }) : null;

  const titleH = Math.ceil(titleFit.height) + 2 * pad(titleFit.fontSize);
  const kickerH = kickerFit ? Math.ceil(kickerFit.height) + 2 * pad(kickerFit.fontSize) : 0;
  const summaryH = summaryFit ? Math.ceil(summaryFit.height) + 2 * pad(summaryFit.fontSize) : 0;
  const gapK = kickerFit ? Math.round(0.3 * titleFit.fontSize) : 0;
  const gapS = summaryFit ? Math.round(0.4 * titleFit.fontSize) : 0;
  const stackH = kickerH + gapK + titleH + gapS + summaryH;
  let y = blockTop + Math.max(0, Math.floor((blockH - stackH) / 2));

  let kicker: Placed | null = null;
  if (kickerFit) {
    kicker = { rect: { x: textX, y, w: interiorW, h: kickerH }, fit: kickerFit };
    y += kickerH + gapK;
  }
  const title: Placed = { rect: { x: textX, y, w: interiorW, h: titleH }, fit: titleFit };
  y += titleH + gapS;
  const summary: Placed | null = summaryFit ? { rect: { x: textX, y, w: interiorW, h: summaryH }, fit: summaryFit } : null;
  const site: Placed | null = siteFit ? { rect: { x: margin, y: footerY, w: halfW, h: footerH }, fit: siteFit } : null;
  const author: Placed | null = authorFit ? { rect: { x: W - margin - halfW, y: footerY, w: halfW, h: footerH }, fit: authorFit } : null;
  const bar: Rect = { x: 0, y: H - bandH, w: W, h: bandH };

  return { W, H, S, margin, bar, kicker, title, summary, site, author };
}

/** One svg-rasterized text cell: bundled font, no drawtext, aligned inside its rect. */
function textCell(opts: {
  text: string;
  fontSize: number;
  color: MosaicColor;
  hAlign: "left" | "right";
  bold?: boolean;
  label: string;
}): MosaicSource {
  return {
    type: "text",
    rasterizer: "svg",
    renderMode: { kind: "image" },
    layers: [
      {
        content: { kind: "literal", text: opts.text },
        style: {
          fontSize: opts.fontSize,
          fontColor: opts.color,
          ...(opts.bold ? { fontWeight: "bold" } : {}),
        },
        placement: { hAlign: opts.hAlign, vAlign: "middle" },
      },
    ],
    editor: { owner: "template", label: opts.label },
  } as MosaicSource;
}

/**
 * What the geometry promises, as canvas-independent invariants against the
 * source labels. Only the rows that exist are constrained (a missing label
 * is a violation - that is the presence check).
 */
export function layoutContract(L: OgCardLayout): LayoutConstraint[] {
  const texts: Array<[string, Placed | null]> = [["title", L.title], ["kicker", L.kicker], ["summary", L.summary], ["site", L.site], ["author", L.author]];
  return [
    ...texts.flatMap(([label, p]) => (p ? [textFitsMeasured(label, p.fit.text, p.fit.fontSize, p.fit.width)] : [])),
    { label: "band", minWidthFrac: 0.98, within: { yFrac: [0.6, 1] } },
    { label: "title", minWidthFrac: 0.5, within: { xFrac: [0.02, 0.98], yFrac: [0, 0.9] } },
    ...(L.kicker ? [{ label: "kicker", within: { yFrac: [0, 0.8] } } as LayoutConstraint] : []),
    ...(L.site ? [{ label: "site", within: { yFrac: [0.6, 1] } } as LayoutConstraint] : []),
    ...(L.author ? [{ label: "author", within: { yFrac: [0.6, 1] } } as LayoutConstraint] : []),
  ];
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts). Filled from journal/2026-09-20/.
 */
const WHY: WhySpec = {
  day: 1,
  date: "2026-09-20",
  agent: "claude",
  model: "claude-opus-5[1m]",
  id: ID,
  title: "OG Card",
  who: "Developers and technical bloggers who publish from a build pipeline; found on Hacker News and dev.to.",
  problem: [
    "Every post, docs page and changelog entry needs a 1200x630 og:image, or the link shows up bare on Slack, X and LinkedIn. It is regenerated whenever the title changes, one per post.",
    "dev.to: \"You hand-craft social images for every blog post. Hours spent in Figma. Then you update the post, forget to update the image, and Twitter shows the old version.\" The offered fix was an HTML template POSTed to a paid screenshot API.",
    "Three separate Show HNs in 2026 built the same plumbing (Cardstock, an OG image designer, OG images on Cloudflare Workers) because the default answer is a headless browser.",
  ],
  sources: [
    "https://dev.to/custodiaadmin/how-to-automate-og-image-generation-for-every-blog-post-2k2j",
    "https://huijer.co/notes/going-out-of-my-way-to-prove-im-not-an-ai-og-images",
    "https://news.ycombinator.com/item?id=49399851",
    "https://news.ycombinator.com/item?id=49139151",
    "https://news.ycombinator.com/item?id=49141504",
    "https://news.ycombinator.com/item?id=48811451",
    "https://news.ycombinator.com/item?id=48902665",
    "https://news.ycombinator.com/item?id=49328884",
    "https://news.ycombinator.com/item?id=48072451",
  ],
  solution: [
    "The inputs already exist as front matter: title, summary, a section, the site, the author. This template turns that props file into the PNG with no browser, no API key and no render server - the same bytes every build, so a stale card is a git diff.",
    "Text is measured against the bundled font and the cells are carved to the measured block, so a 106-character title shrinks and balances instead of clipping. The same props lay out 1080x1080 and 1080x1920 for the square and story crops.",
    "Three variants were built; the accent band on the bottom edge shipped because it is the one accent that survives thumbnail scaling, where OG images actually live.",
  ],
  usage: {
    command: "m0saic make @one-a-day/dev/og-card/v1 --template-repo . -w 1200 -h 630 --props @post.json -o og.png",
    try: [
      "preset: light with accent: #dc2626",
      "an empty kicker, summary or author: the row disappears, the band stays",
      "-w 1080 -h 1920 from the same props file: the story crop",
      "a 100-character title: it shrinks to three balanced lines",
    ],
  },
  caveats: [
    "A pale accent on the light preset inks the kicker faintly.",
    "No logo, date or avatar in v1; every prop must show at defaults.",
  ],
  // Day 001 ran as an interactive Claude Code session, not through the
  // runner, so there is no trace.json: phase boundaries come from the
  // journal files' timestamps (run.json startedAt 20:54:32Z -> the gate's
  // commit 21:16:46Z), tool calls are the agent's own count, tokens are
  // unknown and left out.
  timeline: {
    source: "self-reported",
    phases: [
      { name: "scout", startMs: 0, durMs: 293000, calls: 25, tools: "Bash 15, WebSearch 6, Write 1" },
      { name: "plan", startMs: 293000, durMs: 92000, calls: 6, tools: "Bash 5, Write 1" },
      { name: "build", startMs: 385000, durMs: 719000, calls: 36, tools: "Bash 26, Read 8, Write 2" },
      { name: "critique", startMs: 1104000, durMs: 119000, calls: 4, tools: "Read 2, Write 1, Bash 1" },
      { name: "ship", startMs: 1223000, durMs: 111000, calls: 11, tools: "Bash 9, Write 1, Read 1" },
    ],
  },
};

export const OgCardV1 = defineMosaicTemplate<OgCardProps>({
  id: asTemplateId(ID),
  label: "2026-09-20 · OG Card",
  version: 1,
  description:
    "Open Graph preview card from five strings - title, summary, kicker, site, author - as a deterministic PNG for a build step. 1200x630 by default; the same props also lay out square and story crops.",
  capabilities: { tier: "core" },
  tags: ["dev", "2026-09-20", "day-001", "og-image", "social", "card", "blog", "build-step", "still"],
  // 1200x630 is the Open Graph size the platforms mandate; its height carries
  // a 7 the template cannot move. Declared so the gate charges the rough axis
  // to the canvas, not the construction - which stays 5-smooth by itself
  // (INSET_BASIS) and is still audited for any count the canvas does not explain.
  lattice: { canvas: "physical" },

  outputHints: {
    width: 1200,
    height: 630,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "A still. 1200x630 is the Open Graph standard; 1080x1080 and 1080x1920 re-lay the same props for square and story crops.",
  },

  propsSchema,
  defaultProps: {
    title: DEFAULT_TITLE,
    summary: DEFAULT_SUMMARY,
    kicker: DEFAULT_KICKER,
    site: DEFAULT_SITE,
    author: DEFAULT_AUTHOR,
    accent: DEFAULT_ACCENT,
    preset: "dark",
    background: "",
    ink: "",
    debugLayout: false,
  },

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default OgCardV1;

async function render(props: OgCardProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
  // The schema is documentation; render() is the gate.
  const title = pickText(props.title, DEFAULT_TITLE, "title");
  if (title.length === 0) throw new Error(`${ID}: title must not be empty.`);
  const summary = pickText(props.summary, DEFAULT_SUMMARY, "summary");
  const kicker = pickText(props.kicker, DEFAULT_KICKER, "kicker");
  const site = pickText(props.site, DEFAULT_SITE, "site");
  const author = pickText(props.author, DEFAULT_AUTHOR, "author");
  const preset = props.preset === "light" ? PRESETS.light : PRESETS.dark;
  const accent = pickColor(props.accent, DEFAULT_ACCENT as MosaicColor, "accent");
  const bg = pickColor(props.background, preset.bg, "background");
  const ink = pickColor(props.ink, preset.ink, "ink");

  const W = Math.max(1, Math.round(ctx.target.width));
  const H = Math.max(1, Math.round(ctx.target.height));
  const L = layoutOgCard({ title, summary, kicker, site, author }, W, H);

  // ── pieces: exact rects, packed as zero-drift laundered m0 ──
  const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
  const piece = (rect: Rect, importance: number, source: MosaicSource) =>
    pieces.push({ rect: { ...rect, importance }, source });

  // The band shows `accent` - it is the swatch handle. Footer ink flips for contrast.
  const bandInk = onColor(accent);
  piece(L.bar, 1, bindProp({ ...makeColorTile(accent), editor: { owner: "template", label: "band" } } as MosaicSource, "accent"));
  if (L.kicker) {
    piece(
      L.kicker.rect,
      2,
      bindProps(textCell({ text: L.kicker.fit.text, fontSize: L.kicker.fit.fontSize, color: accent, hAlign: "left", bold: true, label: "kicker" }), [
        { propKey: "kicker" },
        { propKey: "accent" },
      ]),
    );
  }
  piece(
    L.title.rect,
    2,
    bindProps(textCell({ text: L.title.fit.text, fontSize: L.title.fit.fontSize, color: ink, hAlign: "left", bold: true, label: "title" }), [
      { propKey: "title" },
      { propKey: "ink" },
    ]),
  );
  if (L.summary) {
    piece(
      L.summary.rect,
      2,
      bindProp(textCell({ text: L.summary.fit.text, fontSize: L.summary.fit.fontSize, color: preset.muted, hAlign: "left", label: "summary" }), "summary"),
    );
  }
  if (L.site) {
    piece(
      L.site.rect,
      2,
      bindProp(textCell({ text: L.site.fit.text, fontSize: L.site.fit.fontSize, color: bandInk, hAlign: "left", label: "site" }), "site"),
    );
  }
  if (L.author) {
    piece(
      L.author.rect,
      2,
      bindProp(textCell({ text: L.author.fit.text, fontSize: L.author.fit.fontSize, color: bandInk, hAlign: "right", label: "author" }), "author"),
    );
  }

  const placed = placeInsetPieces({ rootW: W, rootH: H, pieces, basis: INSET_BASIS });
  const doc: MosaicDocument = {
    kind: "mosaic_document",
    version: 1,
    m0: toM0String(placed.m0, ID),
    assets: {},
    size: { width: W, height: H },
    backgroundColor: bg,
    sources: placed.sources,
    editor: { label: `OG Card · ${site.length > 0 ? site : "no site"} · ${props.preset === "light" ? "light" : "dark"}` },
  };
  return withLayoutIntent(doc, ctx, { templateId: ID, constraints: layoutContract(L), debug: props.debugLayout === true });
}
