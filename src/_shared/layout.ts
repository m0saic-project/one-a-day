import type { MosaicDocument, MosaicEngineContext } from "@m0saic/types";
import type { LayoutConstraint, RelationalConstraint } from "@m0saic/template-utils";
import { assertLayout, checkLayout, textEmUnits, withLayoutContract } from "@m0saic/template-utils";

/**
 * The layout-contract convention — every template says what its geometry
 * promises, and the promise travels with the document.
 *
 * `@m0saic/template-utils` already has the machinery: tag a source with a
 * label, declare canvas-independent invariants against the label (`textFits`,
 * `within`, `aspect`, `min/maxWidthFrac`, ...), and `withLayoutContract` checks
 * them when the `debugLayout` knob is on (debug-only at render, by ruling:
 * a render with a clipped line beats no render). What the substrate does not
 * do is let a GATE see the contract - the constraints live inside `render()`.
 *
 * `withLayoutIntent` is `withLayoutContract` plus one stamp: the constraints
 * and relations go on `doc.editor.layoutIntent` on EVERY render (a few hundred
 * bytes of plain data, deterministic, UI-only metadata). `tools/check-layout.mjs`
 * reads it off a default render and sweeps the 7-canvas set with
 * `checkLayout`; the template's own test does the same through `sweepLayout`.
 *
 * What a template should promise (the general tidiness of one template, not
 * pixel positions): every fitted text fits its box (`textFits` on every text
 * label), the chrome lives where the design says (`within` bands, a full-width
 * bar is `minWidthFrac: 1`), a mark keeps its shape (`aspect`), and nothing
 * the design needs is missing (a bare `{ label }` is a presence check).
 * Pin exact fractions only when the brief demands them.
 */

export type LayoutIntent = {
  constraints: LayoutConstraint[];
  relations?: RelationalConstraint[];
  /** Assert through nested children (default: auto). */
  flatten?: boolean;
};

/** The canvases the convention sweeps: the 7-canvas set from the authoring contract. */
export const CONTRACT_CANVASES: ReadonlyArray<readonly [number, number]> = [
  [1920, 1080],
  [1280, 720],
  [1080, 1920],
  [1080, 1080],
  [3840, 2160],
  [640, 360],
  [480, 270],
];

/**
 * Calibrated `charWidthEm` rulers for the BUNDLED font (Roboto, the svg
 * rasterizer's): measured width / (em-units x fontSize) over the repo's copy
 * on 2026-09-20 - prose 0.42-0.47, ALL-CAPS 0.57-0.59, URLs ~0.52 - plus a
 * ~12% margin. The contract's default 0.72 is for an unknown font and flags
 * a full-width Roboto line that fits; `textFitsMeasured` is exact when the
 * template measured the block itself.
 */
export const TEXT_EM = { prose: 0.52, caps: 0.66, url: 0.6 } as const;

/** `textFits` for every label in `labels` - the one constraint every text needs. */
export function textFitsAll(labels: readonly string[], opts?: { charWidthEm?: number; padPx?: number }): LayoutConstraint[] {
  return labels.map((label) => ({ label, textFits: { ...(opts ?? {}) } }));
}

/**
 * `textFits` calibrated to a MEASURED block. The contract's ruler estimates
 * `em-units x fontSize x charWidthEm` with a coarse 0.72 default (Roboto
 * prose is nearer 0.46), so a text that was fitted against the real font at
 * the full box width would be flagged for clipping it cannot do. Hand the
 * contract the measured ratio (+2%) instead: the check then compares the
 * TRUE width with the REALIZED box - which is the crush it exists to catch.
 */
export function textFitsMeasured(label: string, text: string, fontSize: number, measuredWidthPx: number): LayoutConstraint {
  const longest = text.split("\n").reduce((m, l) => Math.max(m, textEmUnits(l)), 0);
  const em = longest > 0 && fontSize > 0 ? (measuredWidthPx / (longest * fontSize)) * 1.02 : 0.72;
  return { label, textFits: { charWidthEm: Math.max(0.05, Math.min(2, em)), padPx: 0 } };
}

/**
 * `withLayoutContract` (the debug tripwire) + the intent stamp (always).
 * Return this from `render()` in place of the bare document.
 */
export function withLayoutIntent(
  doc: MosaicDocument,
  ctx: MosaicEngineContext,
  opts: { templateId: string; debug?: boolean } & LayoutIntent,
): MosaicDocument {
  const intent: LayoutIntent = {
    constraints: mergeTextFits(opts.constraints),
    ...(opts.relations && opts.relations.length > 0 ? { relations: opts.relations } : {}),
    ...(opts.flatten !== undefined ? { flatten: opts.flatten } : {}),
  };
  const checked = withLayoutContract(doc, ctx, {
    templateId: opts.templateId,
    constraints: intent.constraints,
    relations: opts.relations,
    flatten: opts.flatten,
    debug: opts.debug === true,
  });
  return { ...checked, editor: { ...(checked.editor ?? {}), layoutIntent: intent } as MosaicDocument["editor"] };
}

/**
 * A label is one-to-MANY: a `textFits` constraint applies to EVERY node that
 * carries its label. Several measured constraints on one label (five
 * `phase-meta` cells with different copy) would each be checked against all
 * five - the widest calibration wins, so a narrower sibling could be flagged
 * for a clip it cannot do. Merge them: one `textFits` per label, the WIDEST
 * em (the check stays a true upper bound), other constraints untouched.
 * Prefer unique labels for cells with different copy; this is the safety net.
 */
export function mergeTextFits(constraints: LayoutConstraint[]): LayoutConstraint[] {
  const widest = new Map<string, LayoutConstraint>();
  const out: LayoutConstraint[] = [];
  for (const c of constraints) {
    if (!c.textFits) { out.push(c); continue; }
    const prev = widest.get(c.label);
    if (!prev) { const copy = { ...c, textFits: { ...c.textFits } }; widest.set(c.label, copy); out.push(copy); continue; }
    const em = Math.max(prev.textFits?.charWidthEm ?? 0.72, c.textFits.charWidthEm ?? 0.72);
    const pad = Math.max(prev.textFits?.padPx ?? 2, c.textFits.padPx ?? 2);
    prev.textFits = { charWidthEm: em, padPx: pad };
  }
  return out;
}

/** The stamped intent of a rendered document, or null when the template declared none. */
export function layoutIntentOf(doc: MosaicDocument): LayoutIntent | null {
  const v = (doc.editor as { layoutIntent?: unknown } | undefined)?.layoutIntent;
  if (!v || typeof v !== "object" || !Array.isArray((v as LayoutIntent).constraints)) return null;
  return v as LayoutIntent;
}

/** Labels of every `type: "text"` source (tagged or not - untagged ones come back as null). */
export function textLabelsOf(doc: MosaicDocument): Array<string | null> {
  return (doc.sources ?? [])
    .filter((s) => s && (s as { type?: string }).type === "text")
    .map((s) => (s as { editor?: { label?: string } }).editor?.label ?? null);
}

/**
 * Render at every contract canvas and assert the stamped intent holds -
 * the sweep every template's test runs. `variants` are prop overrides worth
 * stressing (long copy, emptied rows, every closed-set value).
 */
export async function sweepLayout<P extends object>(
  render: (props: P, ctx: MosaicEngineContext) => Promise<MosaicDocument> | MosaicDocument,
  templateId: string,
  props: P,
  makeCtx: (w: number, h: number) => MosaicEngineContext,
  canvases: ReadonlyArray<readonly [number, number]> = CONTRACT_CANVASES,
): Promise<void> {
  for (const [w, h] of canvases) {
    const ctx = makeCtx(w, h);
    const doc = await render(props, ctx);
    const intent = layoutIntentOf(doc);
    if (!intent) throw new Error(`${templateId}: render at ${w}x${h} carries no layout intent (return withLayoutIntent(...) from render)`);
    assertLayout(doc, ctx, templateId, { constraints: intent.constraints, relations: intent.relations, flatten: intent.flatten });
  }
}

/** The pure evaluation of a document against its own stamped intent. */
export function checkLayoutIntent(doc: MosaicDocument, canvasW: number, canvasH: number) {
  const intent = layoutIntentOf(doc);
  if (!intent) return null;
  return checkLayout(doc, { canvasW, canvasH, constraints: intent.constraints, relations: intent.relations, flatten: intent.flatten });
}
