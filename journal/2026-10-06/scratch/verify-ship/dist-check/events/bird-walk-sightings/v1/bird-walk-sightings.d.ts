import type { MosaicColor } from "@m0saic/types";
/**
 * A printable sightings sheet for sanctuary visitors, from one outing's rows.
 * ONE CONCEPT: pagination preserves the checklist instead of summarizing it.
 * The rule that bites: X is observed without a count, never zero. Keep every
 * name/count pair in input order, including duplicates and unidentified taxa.
 * Full names wrap (even unbroken identifiers); no ellipsis or hidden entries.
 */
export type Sighting = {
    commonName: string;
    count: number | "X";
};
export type BirdWalkSightingsProps = {
    location?: string;
    date?: string;
    time?: string;
    numberOfObservers?: number;
    rows?: Sighting[];
    page?: number;
    sourceLabel?: string;
    debugLayout?: boolean;
};
export declare const SIGHTINGS_SAMPLE_ROWS: Sighting[];
export declare function normalize(props: BirdWalkSightingsProps): {
    location: string;
    sourceLabel: string;
    numberOfObservers: number;
    rows: {
        commonName: string;
        count: number | "X";
    }[];
    pages: number;
    page: number;
    date: string;
    time: string;
    debugLayout: boolean;
};
export type SightingsRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Cell = {
    label: string;
    rect: SightingsRect;
    text: string;
    px: number;
    width: number;
    bold: boolean;
    right: boolean;
    color: MosaicColor;
    prop?: keyof BirdWalkSightingsProps;
    row?: number;
    field?: "commonName" | "count";
};
export declare function layoutSightings(props: BirdWalkSightingsProps, W: number, H: number): {
    cells: Cell[];
    rules: {
        label: string;
        rect: SightingsRect;
        color: MosaicColor;
    }[];
    margin: number;
    labelY: number;
    listY: number;
    listEnd: number;
    footerY: number;
    wide: boolean;
    visible: {
        commonName: string;
        count: number | "X";
    }[];
    p: {
        location: string;
        sourceLabel: string;
        numberOfObservers: number;
        rows: {
            commonName: string;
            count: number | "X";
        }[];
        pages: number;
        page: number;
        date: string;
        time: string;
        debugLayout: boolean;
    };
};
export declare const BirdWalkSightingsV1: import("@m0saic/types").MosaicTemplate<BirdWalkSightingsProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default BirdWalkSightingsV1;
