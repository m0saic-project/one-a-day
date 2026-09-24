import type { LayoutConstraint } from "@m0saic/template-utils";
/**
 * `@one-a-day/dev/app-store-screenshot-frame/v1` - a release-ready store
 * screenshot from one capture, localized copy and a generic device frame.
 *
 * ONE CONCEPT: the composition is a deterministic build artifact. Change the
 * capture or locale props and regenerate it instead of maintaining artboards.
 *
 * The rule that bites: a mobile capture must remain complete. The screen is a
 * real rect inside an exact 9:19.5 shell and media uses `contain`; an aspect
 * mismatch shows a quiet matte instead of stretching or silently cropping.
 */
export type AppStoreScreenshotFrameProps = {
    /** Zero or one image capture. Empty renders the deterministic demo UI. */
    sourceIds?: string[];
    /** Localized product promise, fitted to at most three lines. */
    headline: string;
    /** Optional supporting copy. Empty removes the row. */
    subhead?: string;
    /** App lockup and the first ASCII alphanumeric used by the mark. */
    appName: string;
    /** Current slide number. */
    slideNumber?: number;
    /** Total slide count. */
    slideCount?: number;
    /** Accent (#rrggbb). */
    accentColor?: string;
    /** Opaque canvas surface (#rrggbb). */
    backgroundColor?: string;
    /** Dev-only: draw the layout contract over the output. */
    debugLayout?: boolean;
};
type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Fit = {
    text: string;
    fontSize: number;
    width: number;
    height: number;
    lines: number;
};
type PlacedText = {
    rect: Rect;
    fit: Fit;
};
export type AppStoreFrameLayout = {
    W: number;
    H: number;
    orientation: "landscape" | "square" | "portrait";
    accentBar: Rect;
    copyRegion: Rect;
    stage: Rect;
    appMark: Rect;
    appName: PlacedText;
    markLetter: PlacedText;
    headline: PlacedText;
    subhead: PlacedText | null;
    slideIndex: PlacedText;
    deviceShell: Rect;
    capture: Rect;
};
/** Pure aspect-aware geometry. Exported so tests can assert containment without reverse-engineering m0. */
export declare function layoutAppStoreFrame(text: {
    headline: string;
    subhead: string;
    appName: string;
    slideIndex: string;
    markLetter: string;
}, W: number, H: number): AppStoreFrameLayout;
export declare function appStoreFrameContract(L: AppStoreFrameLayout): LayoutConstraint[];
export declare const AppStoreScreenshotFrameV1: import("@m0saic/types").MosaicTemplate<AppStoreScreenshotFrameProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default AppStoreScreenshotFrameV1;
