import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/community/geocache-milestone-card/v1` - the "I hit N finds" card
 * a geocacher posts on a milestone or a year-in-review, built from the numbers
 * their own My Finds pocket-query GPX already contains (find count, the
 * cache-type mix, FTFs, difficulty/terrain). One render per count, from numbers
 * typed in, never fetched.
 *
 * ONE CONCEPT: the milestone is computed, never typed. The big number is the
 * find count; the card derives the ordinal ("1,000th", "1,042nd") and whether
 * that count is a Project-GC milestone, and shows the MILESTONE badge only
 * when it is. Nobody hand-writes the thing the whole post is about, so the
 * card cannot disagree with itself.
 *
 * The rule that bites: the card prints what was typed and the count it derives,
 * nothing else. A misspelled cache type is refused by name (with a "did you
 * mean" hint), a type-mix that sums to more finds than findCount is refused,
 * and copy that cannot fit above the readability floor is refused naming the
 * field - because a silently wrong number on a public card is worse than no
 * card.
 */
export type TypeMixEntry = {
    type: string;
    count: number;
};
export type GeocacheMilestoneCardProps = {
    /** The cacher's handle, drawn in capitals in the header. */
    cacherName?: string;
    /** The find count, the hero number. Drives the derived ordinal and the milestone badge. */
    findCount?: number;
    /** First-to-find count, the FTF tile. */
    ftfCount?: number;
    /** Average difficulty, 1.0-5.0, printed to one decimal. */
    avgD?: number;
    /** Average terrain, 1.0-5.0, printed to one decimal. */
    avgT?: number;
    /** The "caching since" year, 2000-2026. */
    sinceYear?: number;
    /** The cache-type breakdown as a list of { type, count }; top 5 render, remainder is "Other". */
    typeMix?: TypeMixEntry[];
    /** The one accent, as #rrggbb: hero number, badge fill, header rule. */
    accent?: string;
    /** The bottom line; "" removes it and the space returns to the card. */
    footer?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** 1,000th / 1,042nd / 11th / 21st: thousands separators plus the English ordinal suffix. */
export declare function ordinal(n: number): string;
/** Project-GC's milestone ladder: 1, 10, 50, 100; then every hundred to 1000, every five hundred to 5000, then every thousand. */
export declare function isMilestone(n: number): boolean;
export type MixBarEntry = {
    type: string;
    count: number;
    color: string;
};
export type NormalizedMix = {
    top: MixBarEntry[];
    other: number;
    legend: string;
};
/** The typeMix list: recognized types only, whole counts, top 5 kept, remainder as Other. Throws naming the bad entry. */
export declare function parseTypeMix(value: unknown, findCount: number): NormalizedMix;
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeGeocacheMilestoneCard(props: GeocacheMilestoneCardProps): {
    name: string;
    findCount: number;
    findText: string;
    ordinalText: string;
    milestoneLine: string;
    milestone: boolean;
    ftfText: string;
    avgDText: string;
    avgTText: string;
    sinceLine: string;
    mix: NormalizedMix;
    accent: MosaicColor;
    heroInk: MosaicColor;
    footer: string;
    debugLayout: boolean;
};
export type GmcRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = "cacherName" | "findCount" | "ftfCount" | "avgD" | "avgT" | "sinceYear" | "typeMix" | "accent" | "footer" | null;
type Cell = {
    label: string;
    rect: GmcRect;
    text: string;
    px: number;
    width: number;
    bold: boolean;
    align: "left" | "right" | "center";
    color: MosaicColor;
    bind: Bind;
    over: boolean;
};
type Tile = {
    label: string;
    rect: GmcRect;
    color: MosaicColor;
    radius: number;
    bind?: "accent";
};
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutGeocacheMilestoneCard(props: GeocacheMilestoneCardProps, W: number, H: number): {
    p: {
        name: string;
        findCount: number;
        findText: string;
        ordinalText: string;
        milestoneLine: string;
        milestone: boolean;
        ftfText: string;
        avgDText: string;
        avgTText: string;
        sinceLine: string;
        mix: NormalizedMix;
        accent: MosaicColor;
        heroInk: MosaicColor;
        footer: string;
        debugLayout: boolean;
    };
    shape: "square" | "wide" | "tall";
    floor: number;
    cells: Cell[];
    tiles: Tile[];
    headRect: GmcRect;
    heroRect: GmcRect;
    mixRect: GmcRect;
    tilesRect: GmcRect;
    findPx: number;
    namePx: number;
    badgeShown: boolean;
    segmentCount: number;
};
export declare const GeocacheMilestoneCardV1: import("@m0saic/types").MosaicTemplate<GeocacheMilestoneCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default GeocacheMilestoneCardV1;
