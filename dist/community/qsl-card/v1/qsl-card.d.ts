import type { MosaicColor } from "@m0saic/types";
/**
 * `@one-a-day/community/qsl-card/v1` - a ham radio QSL card for ONE contact,
 * rendered from the fields of one ADIF log record, so a script can loop over
 * a whole log and write one card per QSO.
 *
 * ONE CONCEPT: the props ARE the log record. Each prop is an ADIF field in
 * camelCase taking the ADIF format (QSO_DATE "20261003", TIME_ON "1432",
 * FREQ "14.074" in MHz), and the card prints it the way a QSL does
 * ("03 OCT 2026", "14:32"). BAND is not a prop: it is DERIVED from FREQ with
 * the ADIF 3.1.6 band enumeration, so the two can never disagree on a card.
 *
 * The rule that bites: a callsign is never ellipsized. A card with half a
 * call on it confirms nothing. The station call is sized from its own text
 * (a short K1A is limited by the band's height, a long VP2V/G4ABC by its
 * width), the QSO table reflows by aspect (6x1, 3x2, 2x3) before any type
 * shrinks, the table values shrink before the call drops below twice their
 * size, and copy that cannot fit above the readability floor (10/270 of
 * the short side) is refused with an error that names the prop.
 */
export type QslCardProps = {
    /** STATION_CALLSIGN: the sender, the biggest thing on the card. */
    stationCallsign?: string;
    /** CALL: the station worked - "TO RADIO <call>". */
    call?: string;
    /** QSO_DATE as YYYYMMDD (UTC). */
    qsoDate?: string;
    /** TIME_ON as HHMM or HHMMSS (UTC). */
    timeOn?: string;
    /** FREQ in MHz, printed as given; BAND is derived from it. */
    freq?: string;
    /** MODE (or SUBMODE), printed as the log says it. */
    mode?: string;
    /** RST_SENT: "59", "599" or a signed dB report ("-12"). */
    rstSent?: string;
    /** MY_GRIDSQUARE: 4, 6 or 8 character Maidenhead; "" hides the line. */
    myGridsquare?: string;
    /** MY_CITY / MY_STATE as one line; "" hides it. */
    qth?: string;
    /** MY_POTA_REF: a Parks on the Air reference; "" hides it. */
    myPotaRef?: string;
    /** QSLMSG: the footer line; "" hides it. */
    qslMsg?: string;
    /** The one accent: top bar, label rules, TO RADIO tag. */
    accentColor?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** An ADIF Number in MHz -> integer Hz; null when it is not one (more than 6 decimals is not one here). */
export declare function qslMHzToHz(text: string): number | null;
/** FREQ (MHz text) -> the ADIF band name, or null when the frequency is in no amateur band. Integer Hz, no floats. */
export declare function qslBandOf(freq: string): string | null;
/** QSO_DATE "20261003" -> "03 OCT 2026"; null for anything that is not a calendar date from 1930 on (ADIF's floor). */
export declare function qslFormatDate(text: string): string | null;
/** TIME_ON "1432" -> "14:32", "143205" -> "14:32:05"; null outside 00:00:00-23:59:59. */
export declare function qslFormatTime(text: string): string | null;
/** A Maidenhead locator (4, 6 or 8 characters) in canonical case - "EN34lw55" - or null. */
export declare function qslGrid(text: string): string | null;
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
export declare function normalizeQslCard(props: QslCardProps): {
    stationCallsign: string;
    call: string;
    date: string;
    time: string;
    freq: string;
    band: string;
    mode: string;
    rst: string;
    grid: string;
    qth: string;
    pota: string;
    qslMsg: string;
    accent: MosaicColor;
    debugLayout: boolean;
};
export type QslRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Bind = Exclude<keyof QslCardProps, "debugLayout"> | null;
type Cell = {
    label: string;
    rect: QslRect;
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
    rect: QslRect;
    color: MosaicColor;
    radius: number;
    bind?: "accentColor";
};
/** The six cells of the QSO table, in reading order. */
export declare const QSL_COLUMNS: readonly ["date", "utc", "mhz", "band", "mode", "rst"];
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
export declare function layoutQslCard(props: QslCardProps, W: number, H: number): {
    p: {
        stationCallsign: string;
        call: string;
        date: string;
        time: string;
        freq: string;
        band: string;
        mode: string;
        rst: string;
        grid: string;
        qth: string;
        pota: string;
        qslMsg: string;
        accent: MosaicColor;
        debugLayout: boolean;
    };
    shape: "square" | "wide" | "tall";
    grid: {
        rows: number;
        cols: number;
    };
    floor: number;
    cells: Cell[];
    tiles: Tile[];
    callPx: number;
    workedPx: number;
    valuePx: number;
    labelPx: number;
    twoLines: boolean;
    showMark: boolean;
    bands: {
        headY: number;
        stripY: number;
        tableY: number;
        footY: number;
        bottom: number;
    };
};
export declare const QslCardV1: import("@m0saic/types").MosaicTemplate<QslCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default QslCardV1;
