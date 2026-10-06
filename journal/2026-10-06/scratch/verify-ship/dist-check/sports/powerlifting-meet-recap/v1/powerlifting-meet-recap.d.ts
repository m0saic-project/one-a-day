import type { MosaicColor } from "@m0saic/types";
import type { LayoutConstraint } from "@m0saic/template-utils";
/**
 * `@one-a-day/sports/powerlifting-meet-recap/v1` - a powerlifting meet recap
 * clip: the day's attempts on a 3 x 3 board (one row a lift, three tries
 * each), solid green for a good lift, hollow red for a no lift, the total
 * built from the bests as a number and as a bar to scale.
 *
 * ONE CONCEPT: **the results row is the prop.** Everything on the canvas is
 * a column OpenPowerlifting already publishes for every lifter - `Squat1Kg`
 * .. `Deadlift3Kg`, `Place`, `Dots`, `MeetName`. Paste the CSV into `csv`
 * (a lifter's download, or a meet's export: `row` picks the line), or pass
 * `attempts` shaped like it.
 *
 * The motion is data, not keyframes: the attempts land in meet order, evenly
 * spaced. Every label and every weight is static svg text; what changes over
 * time is colour and one number. The cell fills and the "now lifting" ring
 * are plain colour tiles in a mask-free child document, the bar's segments
 * in another (both canvases 5-smooth), each with its own `overlay.enable`;
 * the total is ONE drawtext expression, evaluated per frame, that counts up
 * when a good lift raises a best.
 *
 * The rule that bites: **a negative weight is a failed attempt.** That is
 * the CSV's own convention (`-85` = 85 kg, no lift), so `attempts` keeps it:
 * write the weight that was on the bar, and the sign says how it went.
 */
export type MeetLift = "squat" | "bench" | "deadlift";
export type MeetUnits = "kg" | "lb" | "both";
export type MeetPreset = "dark" | "light";
/** Kilograms per lift, in attempt order: negative = no lift, null or 0 = not taken. */
export type MeetAttemptsInput = Partial<Record<MeetLift, ReadonlyArray<number | string | null>>>;
export type PowerliftingMeetRecapProps = {
    /** The lifter (the CSV's Name). Empty removes the line. */
    lifter?: string;
    /** The meet (MeetName). Empty removes it. */
    meetName?: string;
    /** The line under it: federation, date, class, equipment. Empty removes it. */
    details?: string;
    /** { squat, bench, deadlift }: up to three weights each, in kilograms (or that object as a JSON string). */
    attempts?: MeetAttemptsInput | string;
    /** The CSV's Place: a number, or G, DQ, DD, NS. Empty removes it. */
    place?: string;
    /** Dots points; 0 hides them. */
    dots?: number;
    /** A pasted OpenPowerlifting CSV (header row + result rows). Non-empty wins over the six props above. */
    csv?: string;
    /** Which row of the CSV: a 1-based number, a Date (2026-09-12) or a Name. */
    row?: string;
    /** The weights in kilograms, in pounds, or both. */
    units?: MeetUnits;
    /** Clip length in whole seconds (6..30). */
    clipSec?: number;
    /** The stamp, the ring, the total (#rrggbb). */
    accent?: string;
    /** Hand-tuned dark or light page. */
    preset?: MeetPreset;
    /** Dev-only: check the layout contract and draw it over the frame. */
    debugLayout?: boolean;
};
export declare const MEET_LIFTS: ReadonlyArray<MeetLift>;
export declare const MEET_MIN_CLIP_SEC = 6;
export declare const MEET_MAX_CLIP_SEC = 30;
/** The international pound, as the federations convert. */
export declare const MEET_LB_PER_KG = 2.20462262;
/** A day for a lifter who does not exist: 8 for 9, a missed third bench, 392.5 kg. */
export declare const MEET_DEFAULT_ATTEMPTS: Readonly<Record<MeetLift, ReadonlyArray<number>>>;
/** 147.5 -> "147.5", 150 -> "150", 102.25 -> "102.25": never a trailing zero. */
export declare function fmtMeetKg(kg: number): string;
/** Whole pounds, rounded down - the way a lifter says a kilo bar out loud (160 kg is "352"). */
export declare function meetLb(kg: number): number;
/** The number a cell, a best or the total prints in its main unit. */
export declare function fmtMeetWeight(kg: number, units: MeetUnits): string;
/** 1 -> "1st", 2 -> "2nd", 11 -> "11th", 23 -> "23rd". */
export declare function meetOrdinal(n: number): string;
/** Latin diacritics folded (the bundled font is ASCII), the rest replaced, never a control character. */
export declare function meetAscii(raw: unknown): string;
export type MeetAttempt = {
    lift: MeetLift;
    /** 0, 1, 2: first, second, third attempt. */
    index: number;
    /** The weight on the bar, positive. */
    kg: number;
    good: boolean;
};
export type MeetLiftRow = {
    lift: MeetLift;
    /** Three slots; null = an attempt not taken. One slot when only the best was reported. */
    cells: Array<MeetAttempt | null>;
    /** The federation reported the best lift and no attempts. */
    bestOnly: boolean;
    /** The heaviest good lift, or null when none was made. */
    bestKg: number | null;
};
export type MeetModel = {
    lifter: string;
    meetName: string;
    details: string;
    lifts: MeetLiftRow[];
    /** Every attempt taken, in meet order. */
    order: MeetAttempt[];
    good: number;
    taken: number;
    /** The sum of the bests when every contested lift has one and the lifter was not disqualified; else null. */
    totalKg: number | null;
    /** "8/9", or "" when no attempt is known. */
    stamp: string;
    /** "1st place", "Guest lifter", "Disqualified" - or "". */
    placeLine: string;
    /** "398.12 Dots" (and the total in pounds when both units show) - or "". */
    pointsLine: string;
};
export type MeetRawLift = {
    attempts: Array<number | null>;
    best?: number | null;
};
export declare function buildMeet(meta: {
    lifter: string;
    meetName: string;
    details: string;
    place: string;
    dots: number;
}, raw: Partial<Record<MeetLift, MeetRawLift>>, units: MeetUnits): MeetModel;
export type MeetCsvRow = Record<string, string>;
/** Header row + result rows. The format disallows quotes and in-field commas, so a split is the parser. */
export declare function parseMeetCsv(text: string): MeetCsvRow[];
/** `row`: a 1-based number, else a Date, else a Name (the "#2" that tells namesakes apart is optional). */
export declare function pickMeetRow(rows: MeetCsvRow[], which: string): MeetCsvRow;
export type MeetCsvDay = {
    meta: {
        lifter: string;
        meetName: string;
        details: string;
        place: string;
        dots: number;
    };
    raw: Partial<Record<MeetLift, MeetRawLift>>;
};
/** One results row to the day it records. Fourth attempts (record attempts) do not count toward the total and are not drawn. */
export declare function meetFromCsvRow(row: MeetCsvRow): MeetCsvDay;
export type MeetBeats = {
    clip: number;
    hook: number;
    replay: number;
    end: number;
};
/** An eighth of the clip (at most 2 s) opens on the result, a quarter holds it at the end, the rest replays the day. */
export declare function meetBeats(clipSec: number): MeetBeats;
/** When attempt `k` of `n` lands: evenly spaced, the last one on the end of the replay. */
export declare function meetLandAt(k: number, n: number, b: MeetBeats): number;
/** Shown in the cold open and again from `at` on: ONE gate for two windows, so no `window` twin. */
export declare function meetOpenAndFrom(hook: number, at: number): string;
export type MeetStep = {
    at: number;
    lift: MeetLift;
    bestKg: number;
    subtotalKg: number;
};
/** Every good lift that raises its lift's best, in meet order, with the subtotal it leaves. */
export declare function meetSteps(model: MeetModel, b: MeetBeats): MeetStep[];
/** How many decimals the counted total prints: none in pounds, else as many as the weights carry. */
export declare function meetDecimals(model: MeetModel, units: MeetUnits): 0 | 1 | 2;
/**
 * The total: ONE drawtext expression, evaluated per frame - the final total
 * in the cold open, then the subtotal, counting up over `rise` seconds each
 * time a good lift raises a best. Inside `%{...}` drawtext wants `\:` and
 * `\,`. The +0.0005 keeps trunc() from printing 392.4 for a 392.5 stored as
 * 392.4999.
 */
export declare function meetTotalExpr(model: MeetModel, units: MeetUnits, b: MeetBeats): string;
export type MeetRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export type MeetFit = {
    text: string;
    px: number;
    width: number;
};
export type MeetCell = {
    lift: MeetLift;
    /** The slot in the row (0..2); the original index into `attempts[lift]`. */
    slot: number;
    attempt: MeetAttempt | null;
    /** Its place in meet order, or null for an attempt not taken. */
    k: number | null;
    /** The cell in the board child's own coordinates. */
    local: MeetRect;
    main: MeetFit;
    mainRect: MeetRect;
    sub: MeetFit | null;
    subRect: MeetRect | null;
};
export type MeetRowLayout = {
    lift: MeetLift;
    label: MeetFit;
    labelRect: MeetRect;
    best: MeetFit | null;
    bestRect: MeetRect;
    /** The best in pounds on its own line: only when the labels sit beside the cells and both units show. */
    bestSub: MeetFit | null;
    bestSubRect: MeetRect;
    bestAlign: "left" | "right";
    /** Meet-order index of the lift's last attempt: the best is named once the lift is over. */
    lastK: number;
};
export type MeetLayout = {
    W: number;
    H: number;
    S: number;
    landscape: boolean;
    lifter: MeetFit | null;
    lifterRect: MeetRect;
    stamp: MeetFit | null;
    stampBox: MeetRect;
    stampTextRect: MeetRect;
    meetName: MeetFit | null;
    meetRect: MeetRect;
    details: MeetFit | null;
    detailsRect: MeetRect;
    detailsAlign: "left" | "right";
    /** The board child's canvas in the parent - both sides 5-smooth. */
    board: MeetRect;
    ring: number;
    rows: MeetRowLayout[];
    cells: MeetCell[];
    totalLabel: MeetFit;
    totalLabelRect: MeetRect;
    /** The total's widest string (every digit an 8), or the words that replace it. */
    totalSample: string;
    totalPx: number;
    totalWidth: number;
    totalRect: MeetRect;
    /** The bar child's canvas in the parent - both sides 5-smooth - or null when there is nothing to stack. */
    bar: MeetRect | null;
    place: MeetFit | null;
    placeRect: MeetRect;
    points: MeetFit | null;
    pointsRect: MeetRect;
};
/**
 * The whole geometry as a pure function of the day and the canvas: the header
 * (lifter and stamp, meet, details), the board (three cells a lift, its name
 * above them or - on a square - beside them), and the total stack (label, number, bar, result) - under the board,
 * or beside it in landscape. The test asserts rects and fits without parsing m0.
 */
export declare function layoutMeet(model: MeetModel, units: MeetUnits, W: number, H: number): MeetLayout;
/**
 * What the geometry promises. Every text is measured (the counted total at
 * its widest string, already widened for the system font); the stamp lives
 * in the top band; the total in the bottom half when it sits under the board
 * (beside it, in landscape, the promise is that it is there); the cells (the
 * board child, flattened by the checker) are present.
 */
export declare function meetContract(L: MeetLayout): LayoutConstraint[];
export declare const PowerliftingMeetRecapV1: import("@m0saic/types").MosaicTemplate<PowerliftingMeetRecapProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default PowerliftingMeetRecapV1;
/** WCAG contrast of two colours, 1..21. */
export declare function meetContrast(a: MosaicColor, b: MosaicColor): number;
/**
 * The accent as a colour to DRAW with on the page (the total, the ring): kept
 * as given when it reads there, else pulled toward the ink until it does - a
 * yellow picked for the dark page would vanish on the light one.
 */
export declare function meetReadable(accent: MosaicColor, page: MosaicColor, ink: MosaicColor): MosaicColor;
