import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/science/astro-integration-summary/v1` - the integration summary
 * an astrophotographer types under every finished image ("Ha 128 x 180 s,
 * OIII 123 x 120 s, SII 105 x 180 s = 15.8 h"), drawn from the rows N.I.N.A.
 * already wrote: one bar per filter, built night by night, and a clip that
 * replays the nights.
 *
 * ONE CONCEPT: **the bars are the data, on ONE scale.** Bar length is that
 * filter's hours divided by the LARGEST filter's hours, fixed from the first
 * frame, so a bar only grows into its place and never rescales; each bar is
 * stacked from one segment per night (alternating two tints), so the nights
 * read as steps. Seconds are summed as whole integers and rounded once, for
 * display.
 *
 * The motion is data, not keyframes: night k lands at
 * `replayStart + replayLen * k / nights`. Everything that changes is a gated
 * overlay (`overlay.enable`): the segments and the ruler cells are colour
 * tiles in two mask-free child documents on 5-smooth canvases, the running
 * hours are drawtext layers (one source per filter, one for the total). The
 * clip opens and closes on the finished card, so it loops.
 *
 * The rule that bites: **the CSV is read for three columns only** -
 * FilterName, ExposureStartUTC, Duration - by header name; the ~30 others
 * are ignored. A new night starts when two consecutive frames are more than
 * six hours apart, so it does not depend on a time zone.
 */
export type AstroSessionInput = {
    /** The night, "YYYY-MM-DD". Rows of one night add up. */
    night?: string;
    /** The filter name as the wheel calls it ("Ha", "OIII", "L"). */
    filter?: string;
    /** Light frames kept, whole 1..9999. */
    frames?: number;
    /** Seconds per frame, whole 1..3600. */
    exposureSec?: number;
};
export type AstroIntegrationSummaryProps = {
    /** The target, header left (1-60 chars). */
    target?: string;
    /** The equipment line under it; "" drops it. */
    equipment?: string;
    /** Rows { night, filter, frames, exposureSec } (or that array as a JSON string). */
    sessions?: AstroSessionInput[] | string;
    /** A pasted NINA ImageMetaData.csv; when non-empty it replaces `sessions`. */
    csv?: string;
    /** Per-filter #rrggbb overrides, e.g. {"Ha":"#ff5533"}. */
    filterColors?: Record<string, string> | string;
    /** Clip length in whole seconds (4..60). */
    clipSec?: number;
    /** The bottom line; "" removes it. */
    footer?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** Four invented nights: Ha 128 x 180 s = 6.4 h, OIII 123 x 120 s = 4.1 h, SII 105 x 180 s = 5.3 h, 15.8 h in all. */
export declare const ASTRO_DEFAULT_SESSIONS: ReadonlyArray<Readonly<AstroSessionInput>>;
type Seg = {
    night: number;
    sec: number;
    cumSec: number;
};
type FilterRow = {
    name: string;
    color: MosaicColor;
    frames: number;
    sec: number;
    /** The one exposure length when every frame had it; null when they differ. */
    exposure: number | null;
    segs: Seg[];
};
type NightCol = {
    date: string;
    sec: number;
    cumSec: number;
    label: string;
    short: string;
};
type Model = {
    nights: NightCol[];
    filters: FilterRow[];
    totalSec: number;
    maxSec: number;
};
/** Hours with one decimal, rounded half up on whole seconds: 56 700 s -> "15.8". */
export declare function astroHoursText(sec: number): string;
/** The `sessions` prop -> the model. A bad row is refused by number. */
export declare function astroModelFromSessions(value: unknown, overrides: Map<string, MosaicColor>): Model;
/** RFC-4180-ish rows: commas, double quotes, CRLF or LF. */
export declare function astroParseCsv(text: string): string[][];
/** A NINA ImageMetaData.csv -> the model: three columns read, a night = a run of frames with no 6 h gap. */
export declare function astroModelFromCsv(csv: string, overrides: Map<string, MosaicColor>): Model;
type Beats = {
    clip: number;
    hook: number;
    start: number;
    end: number;
    lands: number[];
};
/** The first 6% is the finished card, 6-14% the reset, 14-82% the replay (night k at its share), the rest the finished card again. */
export declare function astroBeatsOf(clipSec: number, nights: number): Beats;
type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Fit = {
    text: string;
    px: number;
    width: number;
};
type Block = {
    lines: string[];
    px: number;
    width: number;
};
type ChartLayout = {
    W: number;
    H: number;
    stacked: boolean;
    title: {
        rect: Rect;
        block: Block;
    };
    equipment: {
        rect: Rect;
        fit: Fit;
    } | null;
    total: {
        rect: Rect;
        fit: Fit;
    };
    totalLabel: {
        rect: Rect;
        fit: Fit;
    };
    /** The tracks' child canvas in the parent (5-smooth both sides) and its row geometry. */
    chart: Rect;
    rowH: number;
    trackY: number;
    trackH: number;
    trackW: number;
    trackX: number;
    names: Array<{
        rect: Rect;
        fit: Fit;
    }>;
    captions: Array<{
        rect: Rect;
        fit: Fit;
    }> | null;
    values: Array<Rect>;
    valuePx: number;
    valueSample: string;
    valueWidth: number;
    ruler: Rect;
    cells: Rect[];
    labels: Array<{
        rect: Rect;
        fit: Fit;
    } | null>;
    footer: {
        rect: Rect;
        fit: Fit;
    } | null;
};
export declare function astroLayout(model: Model, props: {
    target: string;
    equipment: string;
    footer: string;
}, W: number, H: number): ChartLayout;
/** The shared scale: where a cumulative `sec` ends on a track, rounded per boundary (never summed widths). */
export declare function astroTrackEdge(sec: number, maxSec: number, trackW: number): number;
export declare const AstroIntegrationSummaryV1: import("@m0saic/types").MosaicTemplate<AstroIntegrationSummaryProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default AstroIntegrationSummaryV1;
