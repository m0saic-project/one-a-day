import type { MosaicColor, MosaicSource } from "@m0saic/types";
import { measureText, resolveFontFile, wrapMeasured } from "@m0saic/template-utils";

/**
 * The text kit the shared pages and harness cards draw with: svg-rasterized
 * cells (the bundled deterministic font, no drawtext), measured fits, and a
 * word-wrap that survives a token wider than its box. Templates written by
 * the daily agent usually carry their own fitter (the og-card measures bold
 * against the bold file); this kit is for the repo's own chrome.
 */

/** The fit budget inside a cell: `cell * 0.94 - 2px` (the layout contract's rule). */
export function budget(cellW: number): number {
  return Math.max(8, Math.floor(cellW * 0.94 - 2));
}

/** One svg-rasterized text cell, aligned inside its rect. */
export function textCell(opts: {
  text: string;
  fontSize: number;
  color: MosaicColor;
  hAlign: "left" | "right" | "center";
  bold?: boolean;
  vAlign?: "top" | "middle" | "bottom";
  label: string;
}): MosaicSource {
  return {
    type: "text",
    rasterizer: "svg",
    renderMode: { kind: "image" },
    layers: [
      {
        content: { kind: "literal", text: opts.text },
        style: { fontSize: opts.fontSize, fontColor: opts.color, ...(opts.bold ? { fontWeight: "bold" } : {}) },
        placement: { hAlign: opts.hAlign, vAlign: opts.vAlign ?? "middle" },
      },
    ],
    editor: { owner: "template", label: opts.label },
  } as MosaicSource;
}

/** Measured width of one block, in the weight that will be drawn. */
export function widthOf(text: string, fontSize: number, bold = false): number {
  const fontPath = bold ? resolveFontFile({ weight: "bold" })?.path : undefined;
  return measureText(text, { fontSize, ...(fontPath ? { fontPath } : {}) }).width;
}

/** Shrink one line until it fits `maxW` (never wraps); returns the size. */
export function fitLine(text: string, maxW: number, maxPx: number, minPx: number, bold = false): number {
  let px = Math.round(maxPx);
  while (px > minPx && widthOf(text, px, bold) > maxW) px = Math.max(minPx, Math.round(px * 0.92));
  return px;
}

/**
 * Word-wrap that also survives a token wider than the box (a URL, a long
 * flag): `wrapMeasured` never breaks a word, so such a token would run off
 * the edge. Over-long tokens are chunked by character to `chunkW` first.
 */
export function wrapFit(text: string, fontSize: number, maxW: number, chunkW = maxW): string[] {
  const width = (t: string) => measureText(t, { fontSize }).width;
  const words = text.split(" ").filter((w) => w.length > 0).flatMap((w) => {
    if (width(w) <= chunkW) return [w];
    const chunks: string[] = [];
    let cur = "";
    for (const ch of w) {
      if (cur.length > 0 && width(cur + ch) > chunkW) { chunks.push(cur); cur = ch; } else cur += ch;
    }
    if (cur.length > 0) chunks.push(cur);
    return chunks;
  });
  return wrapMeasured(words.join(" "), fontSize, maxW);
}

/** Cut `text` to fit `maxW` at `fontSize` with a trailing "..." - the last resort after shrinking. */
export function ellipsize(text: string, fontSize: number, maxW: number, bold = false): string {
  if (widthOf(text, fontSize, bold) <= maxW) return text;
  let t = text;
  while (t.length > 1 && widthOf(t + "...", fontSize, bold) > maxW) t = t.slice(0, -1);
  return t.trimEnd() + "...";
}
