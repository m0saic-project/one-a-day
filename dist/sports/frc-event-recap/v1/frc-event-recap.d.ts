import type { MosaicColor } from "@m0saic/types";
import type { LayoutConstraint } from "@m0saic/template-utils";
/**
 * `@one-a-day/sports/frc-event-recap/v1` - an FRC event recap card from the
 * fields The Blue Alliance publishes for a team at an event: the team number
 * as the card's identity, the event and week, the qual rank with the team
 * count, the W-L-T record, the alliance selection and playoff finish as
 * chips, up to three award lines, and the district points in the footer. One
 * deterministic card per event, for the recap posts team media students
 * already write after every tournament.
 *
 * ONE CONCEPT: **the card derives what it can and constrains the rest to The
 * Blue Alliance's own vocabulary.** Rank, team count, record and district
 * points are numbers, validated in `render()`; the alliance and playoff
 * chips come from closed enums (captain / 1st pick / 2nd pick, alliance 1-8;
 * winner / finalist / semifinalist / quarterfinalist) so their text always
 * fits; awards are the one free text on the card, capped at three lines and
 * shrunk to fit above the floor, never ellipsized.
 *
 * The rule that bites: **qualRank above a non-zero teamCount is refused.** A
 * card that says "RANK 12 of 10 teams" is lying, and a recap graphic nobody
 * trusts is worse than none.
 */
export type FrcAllianceRole = "captain" | "pick1" | "pick2" | "none";
export type FrcPlayoffResult = "winner" | "finalist" | "semifinalist" | "quarterfinalist" | "none";
export type FrcEventRecapProps = {
    /** The team number - the hero line "TEAM 9128" (1-99999). */
    teamNumber?: number;
    /** The team nickname, printed in caps under the number. Up to 30 ASCII characters; "" removes the line. */
    teamName?: string;
    /** The event name as The Blue Alliance has it ("Harbor City District"). Up to 40 ASCII characters. */
    eventName?: string;
    /** Printed after the event name, " - " joined: "Week 4", "DCMP", "Offseason". Up to 20 ASCII characters; "" removes it. */
    weekLabel?: string;
    /** The qualification rank (1-200). Above teamCount (when set) is refused. */
    qualRank?: number;
    /** The teams at the event, for the "of 48 teams" line under the rank (0-200; 0 hides the line). */
    teamCount?: number;
    /** The qualification record as W-L-T digits, e.g. "17-0-0". */
    record?: string;
    /** The alliance-selection chip: "captain" / "pick1" / "pick2" ("CAPTAIN - ALLIANCE N", "1ST PICK - ALLIANCE N", "2ND PICK - ALLIANCE N"); "none" hides it. */
    allianceRole?: FrcAllianceRole;
    /** The N on the alliance chip (1-8; ignored when the role is "none"). */
    allianceNumber?: number;
    /** The playoff chip: "winner" ("EVENT WINNER") / "finalist" / "semifinalist" / "quarterfinalist"; "none" hides it. */
    playoffResult?: FrcPlayoffResult;
    /** 0-3 award lines (TBA award names run long): each up to 60 ASCII characters, shrunk to fit. */
    awards?: string[] | string;
    /** District points, the footer-left "78 DISTRICT POINTS" (0-999; 0 hides it - regionals and offseason events earn none). */
    districtPoints?: number;
    /** The one accent - the header rule, the chip outlines, the award ticks - as #rrggbb. */
    accent?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** The alliance chip's text, or "" when the team was not selected. */
export declare function allianceChipText(role: FrcAllianceRole, allianceNumber: number): string;
/** The playoff chip's text, or "" when the team did not make the playoffs. */
export declare function playoffChipText(result: FrcPlayoffResult): string;
/** The record as printed - validated W-L-T digits, then as-is. Throws naming the prop. */
export declare function recordText(wlt: string): string;
/** The line under the rank: "" when the team count is not given. */
export declare function rankSub(teamCount: number): string;
export type FrcRecapModel = {
    teamNumber: number;
    /** "TEAM 9128" - the top-of-card identity. */
    teamLine: string;
    /** The nickname in caps, or "" (line removed). */
    teamName: string;
    eventName: string;
    weekLabel: string;
    /** "Harbor City District - Week 4" or whichever parts are set; "" removes the line. */
    eventLine: string;
    qualRank: number;
    teamCount: number;
    /** "RANK 1" - the left hero figure. */
    rankBig: string;
    /** "of 48 teams" or "". */
    rankSubText: string;
    record: string;
    allianceChip: string;
    playoffChip: string;
    awards: string[];
    districtPoints: number;
    /** "78 DISTRICT POINTS" or "". */
    pointsText: string;
    accent: MosaicColor;
};
export declare function normalizeFrcEventRecap(props: FrcEventRecapProps): FrcRecapModel;
export type FrcRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export type FrcFit = {
    text: string;
    px: number;
    width: number;
};
export type FrcChip = {
    key: "alliance" | "playoff";
    label: "alliance-chip" | "playoff-chip";
    box: FrcRect;
    inner: FrcRect;
    text: FrcFit;
    textRect: FrcRect;
};
export type FrcAwardLine = {
    index: number;
    text: FrcFit;
    textRect: FrcRect;
    tickRect: FrcRect;
};
export type FrcLayout = {
    W: number;
    H: number;
    S: number;
    landscape: boolean;
    label: FrcFit;
    labelRect: FrcRect;
    ruleRect: FrcRect;
    team: FrcFit;
    teamRect: FrcRect;
    name: FrcFit | null;
    nameRect: FrcRect | null;
    event: FrcFit | null;
    eventRect: FrcRect | null;
    /** The " - Week 4" suffix, its own source so the week prop gets its own binding. */
    week: FrcFit | null;
    weekRect: FrcRect | null;
    rankBig: FrcFit;
    rankBigRect: FrcRect;
    rankSub: FrcFit | null;
    rankSubRect: FrcRect | null;
    recordBig: FrcFit;
    recordBigRect: FrcRect;
    recordSub: FrcFit;
    recordSubRect: FrcRect;
    chips: FrcChip[];
    awardsLabel: FrcFit | null;
    awardsLabelRect: FrcRect | null;
    awards: FrcAwardLine[];
    points: FrcFit | null;
    pointsRect: FrcRect | null;
    credit: FrcFit;
    creditRect: FrcRect;
};
/**
 * The whole card as rects and measured fits. Square and portrait stack five
 * bands (header, hero, chips, awards, footer); landscape puts header and hero
 * in a left column, chips and awards in a right one, the footer full-width.
 * The test asserts bands and fits without parsing m0.
 */
export declare function layoutFrc(m: FrcRecapModel, W: number, H: number): FrcLayout;
/**
 * What the geometry promises (the brief's contract): every text measured and
 * fitted; the team number in the top band; the footer texts in the bottom
 * one; the hero pair, the chips (when their props say so) and the awards
 * block (when non-empty, in the middle band) present. No exact fractions -
 * the reflow between square bands and landscape columns is the template's
 * own business.
 */
export declare function frcContract(L: FrcLayout): LayoutConstraint[];
export declare const FrcEventRecapV1: import("@m0saic/types").MosaicTemplate<FrcEventRecapProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default FrcEventRecapV1;
