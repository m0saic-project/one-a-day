import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/community/weekly-run-report/v1` - the weekly results card a
 * free Saturday 5k's volunteers post after every run: event, run number and
 * date, the six counts from the results page, and the milestone clubs
 * reached that week. One render per event per week, from numbers typed in.
 *
 * ONE CONCEPT: two numbers carry the week. Finishers and volunteers get the
 * two big tiles, the same size, side by side (stacked in a left column on a
 * wide canvas): the run cannot happen without either, and the run report
 * thanks both. New PBs, first timers, visitors and first-time volunteers sit
 * under them as four equal smaller tiles, and their numbers are capped at
 * 1/1.6 of the headline numbers, so the hierarchy holds on every canvas.
 * The props mirror the lines parkrun-runstats prints ("Milestones: 4xR25,
 * 4xR50, 1xR100"), so a run director fills the card from that list.
 *
 * The rule that bites: the card prints what was typed and nothing else. It
 * fetches nothing, derives no percentage, no record and no ranking. A count
 * key it does not know, a missing key, more new PBs than finishers or a club
 * that does not exist is refused with an error that names the field, because
 * a silently ignored typo puts a wrong number on a public page. And the
 * milestone band never moves: an empty week keeps the band and says "No
 * milestone clubs this week", so the series keeps one shape every Saturday.
 */
export type RunCounts = {
    finishers: number;
    newPbs: number;
    firstTimers: number;
    visitors: number;
    volunteers: number;
    firstTimeVolunteers: number;
};
export type WeeklyRunReportProps = {
    /** The event, drawn in capitals in the header. */
    eventName?: string;
    /** The event's run number, printed as #312. */
    runNumber?: number;
    /** YYYY-MM-DD; printed as SAT 03 OCT 2026. "" drops it. */
    date?: string;
    /** The six counts from the results page. */
    counts?: RunCounts;
    /** "4xR25, 3xR50, 1xR100, 2xV25" - the runstats milestones line, V for volunteer clubs. */
    milestones?: string;
    /** The bottom line; "" removes it. */
    footer?: string;
    /** Run-club badges, the header rule and the headline numbers, as #rrggbb. */
    accent?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** The six counts in the order the results page and runstats list them. */
export declare const COUNT_KEYS: readonly ["finishers", "volunteers", "newPbs", "firstTimers", "visitors", "firstTimeVolunteers"];
export type CountKey = (typeof COUNT_KEYS)[number];
export declare const MILESTONE_CLUBS: readonly [25, 50, 100, 250, 500, 1000];
/** 1204 -> "1,204": ASCII digits and a thousands comma, never "1.2k". */
export declare function formatCount(n: number): string;
/** "2026-10-03" -> "SAT 03 OCT 2026"; null when it is not a real calendar day. The weekday comes from the date, never a clock. */
export declare function formatRunDate(text: string): string | null;
export type Milestone = {
    kind: "R" | "V";
    club: number;
    count: number;
    caption: string;
};
/** "4xR25, 1xV50" -> badges in card order (run clubs, then volunteer clubs, each ascending). Throws naming the bad entry. */
export declare function parseMilestones(text: string): Milestone[];
/** The counts object: exactly the six keys, whole numbers, and the sanity checks a results page always passes. */
export declare function parseCounts(value: unknown): RunCounts;
export declare function contrast(a: string, b: string): number;
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeWeeklyRunReport(props: WeeklyRunReportProps): {
    title: string;
    eventName: string;
    runNumber: number;
    runText: string;
    date: string;
    counts: RunCounts;
    milestones: Milestone[];
    footer: string;
    accent: MosaicColor;
    heroInk: MosaicColor;
    debugLayout: boolean;
};
export type ReportRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = {
    prop: "eventName" | "runNumber" | "date" | "footer";
} | {
    prop: "counts";
    key: CountKey;
} | null;
/** `group`: the child document a tile and its text are drawn in (see render). */
type Cell = {
    label: string;
    rect: ReportRect;
    text: string;
    px: number;
    width: number;
    bold: boolean;
    align: "left" | "right" | "center";
    color: MosaicColor;
    bind: Bind;
    over: boolean;
    group?: string;
};
type Tile = {
    label: string;
    rect: ReportRect;
    color: MosaicColor;
    radius: number;
    bind?: "accent" | "milestones";
    group?: string;
};
/** A child document: one tile or badge with its text, on its own small canvas. */
export type ReportGroup = {
    key: string;
    label: "hero-tile" | "stat-tile" | "badge";
    rect: ReportRect;
};
/** The parent's placement lattice (px per step on each axis); 1 = exact. */
export type Pitch = {
    x: number;
    y: number;
};
/**
 * Every rect of the card for one canvas. Pure: same props, canvas and pitch,
 * same rects. `pitch` is the parent's placement lattice (render finds it, see
 * `settleLayout`); tiles and badges snap to it.
 */
export declare function layoutWeeklyRunReport(props: WeeklyRunReportProps, W: number, H: number, pitch?: Pitch): {
    p: {
        title: string;
        eventName: string;
        runNumber: number;
        runText: string;
        date: string;
        counts: RunCounts;
        milestones: Milestone[];
        footer: string;
        accent: MosaicColor;
        heroInk: MosaicColor;
        debugLayout: boolean;
    };
    shape: "square" | "wide" | "tall";
    floor: number;
    small: number;
    cells: Cell[];
    tiles: Tile[];
    groups: ReportGroup[];
    heroRects: ReportRect[];
    statRects: ReportRect[];
    band: ReportRect;
    badges: {
        rect: ReportRect;
        kind: "R" | "V";
    }[];
    namePx: number;
    nameLines: string[];
    runBeside: boolean;
    heroPx: number;
    statPx: number;
    labelPx: number;
    twoLineLabels: boolean;
    badgePx: number;
    captionPx: number;
};
/**
 * The layout on its own lattice: lay out once, find the pitch the parent's
 * placement will use (set by the thin rule and separator, not by the tiles),
 * lay out again snapped to it, and repeat until the pitch holds (one pass in
 * practice). The child refs then land on the lattice with no recovery inset.
 */
export declare function settleLayout(props: WeeklyRunReportProps, W: number, H: number): {
    L: {
        p: {
            title: string;
            eventName: string;
            runNumber: number;
            runText: string;
            date: string;
            counts: RunCounts;
            milestones: Milestone[];
            footer: string;
            accent: MosaicColor;
            heroInk: MosaicColor;
            debugLayout: boolean;
        };
        shape: "square" | "wide" | "tall";
        floor: number;
        small: number;
        cells: Cell[];
        tiles: Tile[];
        groups: ReportGroup[];
        heroRects: ReportRect[];
        statRects: ReportRect[];
        band: ReportRect;
        badges: {
            rect: ReportRect;
            kind: "R" | "V";
        }[];
        namePx: number;
        nameLines: string[];
        runBeside: boolean;
        heroPx: number;
        statPx: number;
        labelPx: number;
        twoLineLabels: boolean;
        badgePx: number;
        captionPx: number;
    };
    pitch: Pitch;
};
export declare const WeeklyRunReportV1: import("@m0saic/types").MosaicTemplate<WeeklyRunReportProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default WeeklyRunReportV1;
