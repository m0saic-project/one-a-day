/**
 * `@one-a-day/sports/lap-telemetry-card/v1` — a sim racing lap achievement card:
 * track name, lap time, personal best, sector breakdown with times and deltas,
 * and proportional delta bars (green for faster, red for slower), driver name,
 * and top speed from telemetry or race results.
 *
 * ONE CONCEPT: the delta bar shows at a glance which sector was the bottleneck —
 * bar length is proportional to |delta|, green means faster than PB, red means
 * slower. The three sector bars scale relative to the largest |delta| on the card
 * so the longest bar fills its track and the others visibly rank by magnitude.
 *
 * The rule that bites: time formatting must match the parser exactly (M:SS.sss
 * or SS.sss), validation throws on bad format, delta sign is explicit (- for faster,
 * + for slower), and every time prop is validated before render.
 */
export type LapTelemetryCardProps = {
    /** The track or circuit name. */
    trackName?: string;
    /** Lap time in M:SS.sss or SS.sss format. */
    lapTime?: string;
    /** Personal best lap time in M:SS.sss or SS.sss format. */
    pbTime?: string;
    /** Sector 1 lap time. */
    sector1Time?: string;
    /** Sector 2 lap time. */
    sector2Time?: string;
    /** Sector 3 lap time. */
    sector3Time?: string;
    /** Sector 1 personal best time. */
    sector1Pb?: string;
    /** Sector 2 personal best time. */
    sector2Pb?: string;
    /** Sector 3 personal best time. */
    sector3Pb?: string;
    /** Driver name or callsign. */
    driverId?: string;
    /** Top speed in km/h. */
    topSpeed?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
export declare const LapTelemetryCardV1: import("@m0saic/types").MosaicTemplate<LapTelemetryCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default LapTelemetryCardV1;
