"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LapTelemetryCardV1 = void 0;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/sports/lap-telemetry-card/v1";
const INK = "#eaeef2";
const DIM = "#9aa7b4";
const GREEN = "#2ecc71";
const RED = "#e74c3c";
const PAGE = "#1c2833";
const DEFAULTS = {
    trackName: "Nurburgring GP",
    lapTime: "1:54.812",
    pbTime: "1:55.420",
    sector1Time: "35.104",
    sector2Time: "41.236",
    sector3Time: "38.472",
    sector1Pb: "35.512",
    sector2Pb: "41.561",
    sector3Pb: "38.347",
    driverId: "Driver",
    topSpeed: "285",
};
const propsSchema = (0, template_utils_1.definePropsSchema)({
    trackName: {
        type: "string",
        required: false,
        description: "The track or circuit name, up to 40 characters.",
        meta: { control: { placeholder: DEFAULTS.trackName }, ui: { label: "Track", order: 1 } },
    },
    lapTime: {
        type: "string",
        required: false,
        description: "Lap time in M:SS.sss or SS.sss format.",
        meta: { control: { placeholder: DEFAULTS.lapTime }, ui: { label: "Lap time", order: 2 } },
    },
    pbTime: {
        type: "string",
        required: false,
        description: "Personal best lap time.",
        meta: { control: { placeholder: DEFAULTS.pbTime }, ui: { label: "PB time", order: 3 } },
    },
    sector1Time: {
        type: "string",
        required: false,
        description: "Sector 1 lap time.",
        meta: { control: { placeholder: DEFAULTS.sector1Time }, ui: { label: "Sector 1 time", order: 4 } },
    },
    sector2Time: {
        type: "string",
        required: false,
        description: "Sector 2 lap time.",
        meta: { control: { placeholder: DEFAULTS.sector2Time }, ui: { label: "Sector 2 time", order: 5 } },
    },
    sector3Time: {
        type: "string",
        required: false,
        description: "Sector 3 lap time.",
        meta: { control: { placeholder: DEFAULTS.sector3Time }, ui: { label: "Sector 3 time", order: 6 } },
    },
    sector1Pb: {
        type: "string",
        required: false,
        description: "Sector 1 personal best time.",
        meta: { control: { placeholder: DEFAULTS.sector1Pb }, ui: { label: "Sector 1 PB", order: 7 } },
    },
    sector2Pb: {
        type: "string",
        required: false,
        description: "Sector 2 personal best time.",
        meta: { control: { placeholder: DEFAULTS.sector2Pb }, ui: { label: "Sector 2 PB", order: 8 } },
    },
    sector3Pb: {
        type: "string",
        required: false,
        description: "Sector 3 personal best time.",
        meta: { control: { placeholder: DEFAULTS.sector3Pb }, ui: { label: "Sector 3 PB", order: 9 } },
    },
    driverId: {
        type: "string",
        required: false,
        description: "Driver name or callsign, up to 30 characters.",
        meta: { control: { placeholder: DEFAULTS.driverId }, ui: { label: "Driver", order: 10 } },
    },
    topSpeed: {
        type: "string",
        required: false,
        description: "Top speed in km/h.",
        meta: { control: { placeholder: DEFAULTS.topSpeed }, ui: { label: "Top speed", order: 11 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check the layout contract and draw it over the card.",
        meta: { ui: { label: "Debug layout", order: 99 } },
    },
});
function layoutContract() {
    return [
        ...(0, layout_1.textFitsAll)([
            "trackName", "lapTime", "pbTime",
            "sector1", "sector1-pb", "sector1-delta",
            "sector2", "sector2-pb", "sector2-delta",
            "sector3", "sector3-pb", "sector3-delta",
            "driverId", "topSpeed"
        ], { charWidthEm: layout_1.TEXT_EM.prose }),
        { label: "trackName", within: { yFrac: [0, 0.15] } },
        { label: "lapTime", within: { yFrac: [0.1, 0.2] } },
        { label: "pbTime", within: { yFrac: [0.17, 0.24] } },
        { label: "sector1", within: { yFrac: [0.23, 0.43] } },
        { label: "sector1-pb", within: { yFrac: [0.23, 0.43] } },
        { label: "sector1-delta", within: { yFrac: [0.23, 0.43] } },
        { label: "sector1-bar", within: { yFrac: [0.23, 0.43] } },
        { label: "sector2", within: { yFrac: [0.43, 0.63] } },
        { label: "sector2-pb", within: { yFrac: [0.43, 0.63] } },
        { label: "sector2-delta", within: { yFrac: [0.43, 0.63] } },
        { label: "sector2-bar", within: { yFrac: [0.43, 0.63] } },
        { label: "sector3", within: { yFrac: [0.63, 0.83] } },
        { label: "sector3-pb", within: { yFrac: [0.63, 0.83] } },
        { label: "sector3-delta", within: { yFrac: [0.63, 0.83] } },
        { label: "sector3-bar", within: { yFrac: [0.63, 0.83] } },
        { label: "driverId", within: { yFrac: [0.8, 1] } },
        { label: "topSpeed", within: { yFrac: [0.8, 1] } },
    ];
}
const WHY = {
    "day": 13,
    "date": "2026-10-02",
    "agent": "claude",
    "model": "claude-haiku-4-5-20251001",
    "id": "@one-a-day/sports/lap-telemetry-card/v1",
    "title": "Sim Racing Lap Card",
    "who": "Competitive sim racers in iRacing, Assetto Corsa, Le Mans Ultimate communities; platforms like SimTelemetry.site, YouTube channels, competitive leagues.",
    "problem": [
        "Sim racers want to share lap achievements - sector times, deltas vs PB, apex speeds - as shareable cards. SimTelemetry.site records telemetry at 60Hz. Drivers currently screenshot lap times or manually create graphics; a deterministic lap card lets them share standardized achievements."
    ],
    "sources": [
        "https://simtelemetry.site",
        "https://news.ycombinator.com/item?id=49045861"
    ],
    "solution": [
        "A deterministic lap card: each sector shows its time and delta (negative = faster, positive = slower) with a proportional bar that is green when faster or red when slower than PB. Driver name and top speed complete the context. The delta bar makes it obvious at a glance which sector was the bottleneck on this run."
    ],
    "usage": {
        "command": "m0saic make @one-a-day/sports/lap-telemetry-card/v1 --template-repo . -w 1280 -h 720 -o lap.png",
        "try": [
            "Add --topSpeed 310 to show higher speeds",
            "Try portrait: -w 1080 -h 1920",
            "Square crop: -w 1080 -h 1080"
        ]
    },
    "timeline": {
        "source": "runner",
        "phases": [
            {
                "name": "scout",
                "startMs": 0,
                "durMs": 217259,
                "calls": 100,
                "tokens": 8356979,
                "costUsd": 0.44,
                "tools": "Bash 93, Read 4, Write 2"
            },
            {
                "name": "plan",
                "startMs": 217273,
                "durMs": 63094,
                "calls": 11,
                "tokens": 923341,
                "costUsd": 0.11,
                "tools": "Read 7, Glob 2, Bash 1"
            },
            {
                "name": "build",
                "startMs": 280395,
                "durMs": 668552,
                "calls": 48,
                "tokens": 6699447,
                "costUsd": 0.63,
                "tools": "Edit 19, Read 13, Bash 12"
            },
            {
                "name": "critique",
                "startMs": 948961,
                "durMs": 102064,
                "calls": 25,
                "tokens": 2006884,
                "costUsd": 0.19,
                "tools": "Read 20, Glob 2, Bash 1"
            },
            {
                "name": "build (2)",
                "startMs": 15572548,
                "durMs": 683517,
                "calls": 52,
                "tokens": 7172898,
                "costUsd": 0.61,
                "tools": "Edit 18, Read 18, Bash 15"
            },
            {
                "name": "critique (2)",
                "startMs": 16256092,
                "durMs": 114289,
                "calls": 20,
                "tokens": 1981107,
                "costUsd": 0.18,
                "tools": "Read 15, Glob 2, Bash 1"
            }
        ],
        "costBasis": "reported"
    }
};
exports.LapTelemetryCardV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID),
    label: "2026-10-02 · Sim Racing Lap Card",
    version: 1,
    description: "A sim racing lap card: track, lap time and delta vs PB, three sectors with times, PBs, and proportional delta bars (green for faster, red for slower), driver name, and top speed.",
    capabilities: { tier: "core" },
    tags: ["sports", "2026-10-02", "day-013", "racing", "telemetry", "sector", "delta"],
    outputHints: {
        width: 1280,
        height: 720,
        fps: 30,
        durationMs: 2000,
        format: { kind: "image", container: "png" },
        note: "Static card - renders cleanly at any canvas size and duration.",
    },
    propsSchema,
    defaultProps: {
        trackName: DEFAULTS.trackName,
        lapTime: DEFAULTS.lapTime,
        pbTime: DEFAULTS.pbTime,
        sector1Time: DEFAULTS.sector1Time,
        sector2Time: DEFAULTS.sector2Time,
        sector3Time: DEFAULTS.sector3Time,
        sector1Pb: DEFAULTS.sector1Pb,
        sector2Pb: DEFAULTS.sector2Pb,
        sector3Pb: DEFAULTS.sector3Pb,
        driverId: DEFAULTS.driverId,
        topSpeed: DEFAULTS.topSpeed,
        debugLayout: false,
    },
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.LapTelemetryCardV1;
function parseTimeToMs(timeStr) {
    const parts = timeStr.trim().split(":");
    if (parts.length === 1) {
        const secs = parseFloat(parts[0]);
        if (isNaN(secs) || secs < 0 || secs >= 60) {
            throw new Error(`Invalid time format: "${timeStr}" (SS.sss must be seconds < 60)`);
        }
        return Math.round(secs * 1000);
    }
    else if (parts.length === 2) {
        const mins = parseInt(parts[0], 10);
        const secs = parseFloat(parts[1]);
        if (isNaN(mins) || isNaN(secs) || secs < 0 || secs >= 60) {
            throw new Error(`Invalid time format: "${timeStr}" (M:SS.sss format expected)`);
        }
        return Math.round((mins * 60 + secs) * 1000);
    }
    throw new Error(`Invalid time format: "${timeStr}" (M:SS.sss or SS.sss format expected)`);
}
function formatTime(ms) {
    const totalSecs = ms / 1000;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs - mins * 60;
    if (mins > 0) {
        return `${mins}:${secs.toFixed(3).padStart(6, "0")}`;
    }
    return secs.toFixed(3);
}
function formatDelta(ms) {
    const sign = ms > 0 ? "+" : ms < 0 ? "-" : "";
    const secs = Math.abs(ms / 1000);
    return `${sign}${secs.toFixed(3)}s`;
}
async function render(props, ctx) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const { width: W, height: H } = ctx.target;
    const trackName = (_a = props.trackName) !== null && _a !== void 0 ? _a : DEFAULTS.trackName;
    const lapTime = (_b = props.lapTime) !== null && _b !== void 0 ? _b : DEFAULTS.lapTime;
    const pbTime = (_c = props.pbTime) !== null && _c !== void 0 ? _c : DEFAULTS.pbTime;
    const sector1Time = (_d = props.sector1Time) !== null && _d !== void 0 ? _d : DEFAULTS.sector1Time;
    const sector2Time = (_e = props.sector2Time) !== null && _e !== void 0 ? _e : DEFAULTS.sector2Time;
    const sector3Time = (_f = props.sector3Time) !== null && _f !== void 0 ? _f : DEFAULTS.sector3Time;
    const sector1Pb = (_g = props.sector1Pb) !== null && _g !== void 0 ? _g : DEFAULTS.sector1Pb;
    const sector2Pb = (_h = props.sector2Pb) !== null && _h !== void 0 ? _h : DEFAULTS.sector2Pb;
    const sector3Pb = (_j = props.sector3Pb) !== null && _j !== void 0 ? _j : DEFAULTS.sector3Pb;
    const driverId = (_k = props.driverId) !== null && _k !== void 0 ? _k : DEFAULTS.driverId;
    const topSpeed = (_l = props.topSpeed) !== null && _l !== void 0 ? _l : DEFAULTS.topSpeed;
    if (typeof trackName !== "string")
        throw new Error(`${ID}: trackName must be a string.`);
    if (typeof lapTime !== "string")
        throw new Error(`${ID}: lapTime must be a string.`);
    if (typeof pbTime !== "string")
        throw new Error(`${ID}: pbTime must be a string.`);
    if (typeof driverId !== "string")
        throw new Error(`${ID}: driverId must be a string.`);
    const px = (fx, fy, fw, fh) => ({
        x: Math.round(fx * W),
        y: Math.round(fy * H),
        w: Math.round(fw * W),
        h: Math.round(fh * H),
    });
    const pieces = [];
    const piece = (rect, importance, source) => pieces.push({ rect: { ...rect, importance }, source });
    const lapTimeMs = parseTimeToMs(lapTime);
    const pbTimeMs = parseTimeToMs(pbTime);
    const lapDeltaMs = lapTimeMs - pbTimeMs;
    // Header - track name
    const trackRect = px(0.06, 0.02, 0.88, 0.08);
    piece(trackRect, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.svgLabel)(trackName, trackRect.w, trackRect.h, { maxPx: Math.round(H * 0.06), maxLines: 1, color: INK }), "trackName"), "trackName"));
    // Lap time and delta
    const lapTimeRect = px(0.06, 0.11, 0.88, 0.065);
    const lapTimeText = `${formatTime(lapTimeMs)} (${formatDelta(lapDeltaMs)})`;
    piece(lapTimeRect, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.svgLabel)(lapTimeText, lapTimeRect.w, lapTimeRect.h, { maxPx: Math.round(H * 0.05), maxLines: 1, color: DIM }), "lapTime"), "lapTime"));
    // PB time
    const pbTimeRect = px(0.06, 0.175, 0.88, 0.055);
    const pbTimeText = `PB ${formatTime(pbTimeMs)}`;
    piece(pbTimeRect, 1, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.svgLabel)(pbTimeText, pbTimeRect.w, pbTimeRect.h, { maxPx: Math.round(H * 0.04), maxLines: 1, color: DIM }), "pbTime"), "pbTime"));
    // Sectors - first pass to collect deltas for normalization
    const sectorData = [
        { name: "sector1", label: "S1", time: sector1Time, pb: sector1Pb, yStart: 0.235 },
        { name: "sector2", label: "S2", time: sector2Time, pb: sector2Pb, yStart: 0.435 },
        { name: "sector3", label: "S3", time: sector3Time, pb: sector3Pb, yStart: 0.635 },
    ];
    const sectorDeltas = sectorData.map(sec => {
        const sectorMs = parseTimeToMs(sec.time);
        const pbMs = parseTimeToMs(sec.pb);
        return sectorMs - pbMs;
    });
    const maxAbsDelta = Math.max(...sectorDeltas.map(d => Math.abs(d)));
    const barTrackWidth = 0.25;
    const barMinHeightPx = 3;
    for (let i = 0; i < sectorData.length; i++) {
        const sec = sectorData[i];
        const sectorMs = parseTimeToMs(sec.time);
        const pbMs = parseTimeToMs(sec.pb);
        const deltaMs = sectorDeltas[i];
        const isGreen = deltaMs < 0;
        // Sector label and time
        const labelRect = px(0.06, sec.yStart, 0.3, 0.065);
        const timeStr = `${sec.label}: ${formatTime(sectorMs)}`;
        const sectorPropName = sec.name.replace("sector", "sector") + "Time";
        piece(labelRect, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.svgLabel)(timeStr, labelRect.w, labelRect.h, { maxPx: Math.round(H * 0.045), maxLines: 1, color: INK }), sec.name), sectorPropName));
        // PB time
        const pbRect = px(0.38, sec.yStart, 0.25, 0.065);
        const pbPropName = sec.name.replace("sector", "sector") + "Pb";
        piece(pbRect, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.svgLabel)(`PB ${formatTime(pbMs)}`, pbRect.w, pbRect.h, { maxPx: Math.round(H * 0.04), maxLines: 1, color: DIM }), `${sec.name}-pb`), pbPropName));
        // Delta text
        const deltaRect = px(0.65, sec.yStart, 0.29, 0.065);
        const deltaColor = isGreen ? GREEN : RED;
        piece(deltaRect, 2, (0, template_utils_1.tag)((0, template_utils_1.svgLabel)(formatDelta(deltaMs), deltaRect.w, deltaRect.h, { maxPx: Math.round(H * 0.04), maxLines: 1, color: deltaColor }), `${sec.name}-delta`));
        // Delta bar - below the text
        if (maxAbsDelta > 0) {
            const barWidth = (Math.abs(deltaMs) / maxAbsDelta) * barTrackWidth * W;
            const barHeight = Math.max(barMinHeightPx, Math.round(H * 0.015));
            const barX = Math.round(0.65 * W);
            const barY = Math.round((sec.yStart + 0.05) * H);
            const barRect = { x: barX, y: barY, w: Math.round(barWidth), h: barHeight };
            piece(barRect, 1, (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(isGreen ? GREEN : RED), `${sec.name}-bar`));
        }
    }
    // Footer - driver left-aligned, speed right-aligned
    const driverRect = px(0.06, 0.85, 0.4, 0.08);
    piece(driverRect, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.svgLabel)(driverId, driverRect.w, driverRect.h, { maxPx: Math.round(H * 0.06), maxLines: 1, color: INK }), "driverId"), "driverId"));
    const speedRect = px(0.54, 0.85, 0.4, 0.08);
    const speedText = `${topSpeed} km/h`;
    piece(speedRect, 2, (0, template_utils_1.bindProp)((0, template_utils_1.tag)((0, template_utils_1.svgLabel)(speedText, speedRect.w, speedRect.h, { maxPx: Math.round(H * 0.06), maxLines: 1, color: DIM }), "topSpeed"), "topSpeed"));
    const placed = (0, template_utils_1.placeInsetPieces)({ rootW: W, rootH: H, pieces });
    const doc = {
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(placed.m0, ID),
        assets: {},
        backgroundColor: PAGE,
        sources: placed.sources,
    };
    return (0, layout_1.withLayoutIntent)(doc, ctx, { templateId: ID, constraints: layoutContract(), debug: props.debugLayout === true });
}
