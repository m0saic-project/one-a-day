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
 * Layout, top to bottom: accent bar (full width) · margin · [kicker] · title
 * (1-3 lines) · [summary (1-2 lines)] · margin · footer (site left, author
 * right). The text block centres vertically between the bar and the footer,
 * so square and portrait canvases do not spread the rows apart. Every drawn
 * prop is bound to its rect (Make double-click edits it in place); the bar
 * binds `accent`; `background` is the document colour and has no rect.
 *
 * Day 001 of one-a-day. Scouted from HN / dev.to: people run headless
 * browsers and paid APIs to put five strings on a rectangle.
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
  const barH = Math.max(4, Math.round(0.012 * S));
  const interiorW = Math.max(16, W - 2 * margin);
  const pad = (px: number) => Math.max(1, Math.round(px * 0.12));

  // ── footer: site left, author right, on the bottom margin ──
  const footerCap = CAP.footer * S;
  const halfW = Math.max(8, Math.floor((interiorW - Math.round(0.04 * S)) / 2));
  const siteFit = text.site.length > 0 ? fitCopy(text.site, halfW, footerCap * 2, { maxPx: footerCap, maxLines: 1 }) : null;
  const authorFit = text.author.length > 0 ? fitCopy(text.author, halfW, footerCap * 2, { maxPx: footerCap, maxLines: 1 }) : null;
  const footerPx = Math.max(siteFit?.fontSize ?? 0, authorFit?.fontSize ?? 0);
  const footerH = footerPx > 0 ? Math.ceil(Math.max(siteFit?.height ?? 0, authorFit?.height ?? 0)) + 2 * pad(footerPx) : 0;
  const footerY = H - margin - footerH;

  // ── the text block: measured first, then carved ──
  const blockTop = barH + margin;
  const blockBottom = footerH > 0 ? footerY - Math.round(0.5 * margin) : H - margin;
  const blockH = Math.max(16, blockBottom - blockTop);
  const titleFit = fitCopy(text.title, interiorW, blockH * 0.62, { maxPx: CAP.title * S, maxLines: 3, bold: true });
  const kickerFit = text.kicker.length > 0 ? fitCopy(text.kicker, interiorW, blockH * 0.12, { maxPx: CAP.kicker * S, maxLines: 1, bold: true }) : null;
  const summaryFit = text.summary.length > 0 ? fitCopy(text.summary, interiorW, blockH * 0.3, { maxPx: CAP.summary * S, maxLines: 2 }) : null;

  const titleH = Math.ceil(titleFit.height) + 2 * pad(titleFit.fontSize);
  const kickerH = kickerFit ? Math.ceil(kickerFit.height) + 2 * pad(kickerFit.fontSize) : 0;
  const summaryH = summaryFit ? Math.ceil(summaryFit.height) + 2 * pad(summaryFit.fontSize) : 0;
  const gapK = kickerFit ? Math.round(0.3 * titleFit.fontSize) : 0;
  const gapS = summaryFit ? Math.round(0.4 * titleFit.fontSize) : 0;
  const stackH = kickerH + gapK + titleH + gapS + summaryH;
  let y = blockTop + Math.max(0, Math.floor((blockH - stackH) / 2));

  let kicker: Placed | null = null;
  if (kickerFit) {
    kicker = { rect: { x: margin, y, w: interiorW, h: kickerH }, fit: kickerFit };
    y += kickerH + gapK;
  }
  const title: Placed = { rect: { x: margin, y, w: interiorW, h: titleH }, fit: titleFit };
  y += titleH + gapS;
  const summary: Placed | null = summaryFit ? { rect: { x: margin, y, w: interiorW, h: summaryH }, fit: summaryFit } : null;
  const site: Placed | null = siteFit ? { rect: { x: margin, y: footerY, w: halfW, h: footerH }, fit: siteFit } : null;
  const author: Placed | null = authorFit ? { rect: { x: W - margin - halfW, y: footerY, w: halfW, h: footerH }, fit: authorFit } : null;

  return { W, H, S, margin, bar: { x: 0, y: 0, w: W, h: barH }, kicker, title, summary, site, author };
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

export const OgCardV1 = defineMosaicTemplate<OgCardProps>({
  id: asTemplateId(ID),
  label: "02 · OG Card",
  version: 1,
  description:
    "Open Graph preview card from five strings - title, summary, kicker, site, author - as a deterministic PNG for a build step. 1200x630 by default; the same props also lay out square and story crops.",
  capabilities: { tier: "core" },
  tags: ["dev", "og-image", "social", "card", "blog", "build-step", "still"],
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
  },

  async render(props: OgCardProps, ctx: MosaicEngineContext): Promise<MosaicDocument> {
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

    // The bar shows `accent` - it is the swatch handle.
    piece(L.bar, 1, bindProp(makeColorTile(accent), "accent"));
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
        bindProp(textCell({ text: L.site.fit.text, fontSize: L.site.fit.fontSize, color: preset.muted, hAlign: "left", label: "site" }), "site"),
      );
    }
    if (L.author) {
      piece(
        L.author.rect,
        2,
        bindProp(textCell({ text: L.author.fit.text, fontSize: L.author.fit.fontSize, color: preset.muted, hAlign: "right", label: "author" }), "author"),
      );
    }

    const placed = placeInsetPieces({ rootW: W, rootH: H, pieces, basis: INSET_BASIS });
    return {
      kind: "mosaic_document",
      version: 1,
      m0: toM0String(placed.m0, ID),
      assets: {},
      size: { width: W, height: H },
      backgroundColor: bg,
      sources: placed.sources,
      editor: { label: `OG Card · ${site.length > 0 ? site : "no site"} · ${props.preset === "light" ? "light" : "dark"}` },
    };
  },
});

export default OgCardV1;
