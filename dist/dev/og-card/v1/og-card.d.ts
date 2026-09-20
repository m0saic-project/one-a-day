import type { LayoutConstraint } from "@m0saic/template-utils";
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
export type Fit = {
    text: string;
    fontSize: number;
    width: number;
    height: number;
    lines: number;
};
export type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export type Placed = {
    rect: Rect;
    fit: Fit;
};
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
export declare function layoutOgCard(text: {
    title: string;
    summary: string;
    kicker: string;
    site: string;
    author: string;
}, W: number, H: number): OgCardLayout;
/**
 * What the geometry promises, as canvas-independent invariants against the
 * source labels. Only the rows that exist are constrained (a missing label
 * is a violation - that is the presence check).
 */
export declare function layoutContract(L: OgCardLayout): LayoutConstraint[];
export declare const OgCardV1: import("@m0saic/types").MosaicTemplate<OgCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default OgCardV1;
