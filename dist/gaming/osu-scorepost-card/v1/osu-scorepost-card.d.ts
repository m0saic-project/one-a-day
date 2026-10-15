/**
 * `@one-a-day/gaming/osu-scorepost-card/v1` - an osu! result-screen card from
 * the API score object: beatmap header, rank badge, four stat tiles, hit counts
 * and mods. No screenshots, no remote art - the background is generated from a
 * single colour.
 *
 * ONE CONCEPT: a scorepost is a typed score object rendered as a single card.
 * The rank badge, the four stat tiles and the hit-count bar are all driven by
 * props, so one template turns any osu! score into a shareable image.
 *
 * The rule that bites: text has to fit on every aspect (landscape, portrait and
 * square) and on the seven contract canvases down to 480x270. The header bands
 * and tile sizes are fractions of the smaller canvas edge, and every line is
 * measured and shrunk before it is placed - never ellipsis at the floor.
 */
export type OsuScorepostCardProps = {
    /** Small credit line under the title. "" removes it. */
    playerName?: string;
    /** Main header line - the beatmap title. */
    beatmapTitle?: string;
    /** Artist sub-line. */
    beatmapArtist?: string;
    /** Difficulty sub-line. */
    difficulty?: string;
    /** Large grade badge: SS, S, A, B, C or D. */
    rank?: string;
    /** Accuracy stat tile, shown as "98.72%". */
    accuracy?: number;
    /** Max combo stat tile. */
    maxCombo?: number;
    /** Score stat tile, comma-separated. */
    score?: number;
    /** PP stat tile. */
    pp?: number;
    /** Hit counts as "300/100/50/miss" with non-negative integers. */
    hits?: string;
    /** Mod acronyms in the bottom-right; "" removes. */
    mods?: string;
    /** Base colour for the generated background gradient/spots, as #rrggbb. */
    backgroundColor?: string;
    /** "dark" (classic result screen) or "light" (osu!lazer-style). */
    preset?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
export type OsuScorepostCard = ReturnType<typeof normalizeOsuScorepost>;
export declare function normalizeOsuScorepost(props: OsuScorepostCardProps): {
    playerName: string;
    beatmapTitle: string;
    beatmapArtist: string;
    difficulty: string;
    rank: string;
    accuracy: number;
    maxCombo: number;
    score: number;
    pp: number;
    hitCounts: number[];
    mods: string;
    backgroundColor: string;
    preset: "dark" | "light";
    debugLayout: boolean;
    theme: {
        readonly ink: "#eaeef2";
        readonly dim: "#9aa7b4";
        readonly tile: "#3d2b55";
        readonly hitTile: "#4f3d6b";
        readonly spot: 0.1;
    } | {
        readonly ink: "#1a1a2e";
        readonly dim: "#5c6370";
        readonly tile: "#dde1e7";
        readonly hitTile: "#c5c9d0";
        readonly spot: 0.07;
    };
    accuracyText: string;
    comboText: string;
    scoreText: string;
    ppText: string;
};
export declare const OsuScorepostCardV1: import("@m0saic/types").MosaicTemplate<OsuScorepostCardProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default OsuScorepostCardV1;
