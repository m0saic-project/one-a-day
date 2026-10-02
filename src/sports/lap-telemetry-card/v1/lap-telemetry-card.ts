import type {
  MosaicColor,
  MosaicDocument,
  MosaicEngineContext,
  MosaicSource,
} from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import {
  bindProp,
  defineMosaicTemplate,
  definePropsSchema,
  makeColorTile,
  placeInsetPieces,
  svgLabel,
  tag,
} from "@m0saic/template-utils";
import type { LayoutConstraint } from "@m0saic/template-utils";
import { TEXT_EM, textFitsAll, withLayoutIntent } from "../../../_shared/layout";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

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

const ID = "@one-a-day/sports/lap-telemetry-card/v1";
const INK = "#eaeef2" as MosaicColor;
const DIM = "#9aa7b4" as MosaicColor;
const GREEN = "#2ecc71" as MosaicColor;
const RED = "#e74c3c" as MosaicColor;
const PAGE = "#1c2833" as MosaicColor;

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

const propsSchema = definePropsSchema<LapTelemetryCardProps>({
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

function layoutContract(): LayoutConstraint[] {
  return [
    ...textFitsAll([
      "trackName", "lapTime", "pbTime",
      "sector1", "sector1-pb", "sector1-delta",
      "sector2", "sector2-pb", "sector2-delta",
      "sector3", "sector3-pb", "sector3-delta",
      "driverId", "topSpeed"
    ], { charWidthEm: TEXT_EM.prose }),
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

const WHY: WhySpec = {
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

export const LapTelemetryCardV1 = defineMosaicTemplate<LapTelemetryCardProps>({
  id: asTemplateId(ID),
  label: "2026-10-02 · Sim Racing Lap Card",
  version: 1,
  description: "A sim racing lap card: track, lap time and delta vs PB, three sectors with times, PBs, and proportional delta bars (green for faster, red for slower), driver name, and top speed.",
  capabilities: { tier: "core" },
  tags: ["sports","2026-10-02","day-013","racing","telemetry","sector","delta"],

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
  renderTutorial: whyTutorial(WHY, render),
});

export default LapTelemetryCardV1;

function parseTimeToMs(timeStr: string): number {
  const parts = timeStr.trim().split(":");
  if (parts.length === 1) {
    const secs = parseFloat(parts[0]);
    if (isNaN(secs) || secs < 0 || secs >= 60) {
      throw new Error(`Invalid time format: "${timeStr}" (SS.sss must be seconds < 60)`);
    }
    return Math.round(secs * 1000);
  } else if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseFloat(parts[1]);
    if (isNaN(mins) || isNaN(secs) || secs < 0 || secs >= 60) {
      throw new Error(`Invalid time format: "${timeStr}" (M:SS.sss format expected)`);
    }
    return Math.round((mins * 60 + secs) * 1000);
  }
  throw new Error(`Invalid time format: "${timeStr}" (M:SS.sss or SS.sss format expected)`);
}

function formatTime(ms: number): string {
  const totalSecs = ms / 1000;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs - mins * 60;
  if (mins > 0) {
    return `${mins}:${secs.toFixed(3).padStart(6, "0")}`;
  }
  return secs.toFixed(3);
}

function formatDelta(ms: number): string {
  const sign = ms > 0 ? "+" : ms < 0 ? "-" : "";
  const secs = Math.abs(ms / 1000);
  return `${sign}${secs.toFixed(3)}s`;
}

async function render(
  props: LapTelemetryCardProps,
  ctx: MosaicEngineContext,
): Promise<MosaicDocument> {
    const { width: W, height: H } = ctx.target;

    const trackName = props.trackName ?? DEFAULTS.trackName;
    const lapTime = props.lapTime ?? DEFAULTS.lapTime;
    const pbTime = props.pbTime ?? DEFAULTS.pbTime;
    const sector1Time = props.sector1Time ?? DEFAULTS.sector1Time;
    const sector2Time = props.sector2Time ?? DEFAULTS.sector2Time;
    const sector3Time = props.sector3Time ?? DEFAULTS.sector3Time;
    const sector1Pb = props.sector1Pb ?? DEFAULTS.sector1Pb;
    const sector2Pb = props.sector2Pb ?? DEFAULTS.sector2Pb;
    const sector3Pb = props.sector3Pb ?? DEFAULTS.sector3Pb;
    const driverId = props.driverId ?? DEFAULTS.driverId;
    const topSpeed = props.topSpeed ?? DEFAULTS.topSpeed;

    if (typeof trackName !== "string") throw new Error(`${ID}: trackName must be a string.`);
    if (typeof lapTime !== "string") throw new Error(`${ID}: lapTime must be a string.`);
    if (typeof pbTime !== "string") throw new Error(`${ID}: pbTime must be a string.`);
    if (typeof driverId !== "string") throw new Error(`${ID}: driverId must be a string.`);

    const px = (fx: number, fy: number, fw: number, fh: number) => ({
      x: Math.round(fx * W),
      y: Math.round(fy * H),
      w: Math.round(fw * W),
      h: Math.round(fh * H),
    });

    const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
    const piece = (rect: { x: number; y: number; w: number; h: number }, importance: number, source: MosaicSource) =>
      pieces.push({ rect: { ...rect, importance }, source });

    const lapTimeMs = parseTimeToMs(lapTime);
    const pbTimeMs = parseTimeToMs(pbTime);
    const lapDeltaMs = lapTimeMs - pbTimeMs;

    // Header - track name
    const trackRect = px(0.06, 0.02, 0.88, 0.08);
    piece(trackRect, 2, bindProp(tag(svgLabel(trackName, trackRect.w, trackRect.h, { maxPx: Math.round(H * 0.06), maxLines: 1, color: INK }), "trackName"), "trackName"));

    // Lap time and delta
    const lapTimeRect = px(0.06, 0.11, 0.88, 0.065);
    const lapTimeText = `${formatTime(lapTimeMs)} (${formatDelta(lapDeltaMs)})`;
    piece(lapTimeRect, 2, bindProp(tag(svgLabel(lapTimeText, lapTimeRect.w, lapTimeRect.h, { maxPx: Math.round(H * 0.05), maxLines: 1, color: DIM }), "lapTime"), "lapTime"));

    // PB time
    const pbTimeRect = px(0.06, 0.175, 0.88, 0.055);
    const pbTimeText = `PB ${formatTime(pbTimeMs)}`;
    piece(pbTimeRect, 1, bindProp(tag(svgLabel(pbTimeText, pbTimeRect.w, pbTimeRect.h, { maxPx: Math.round(H * 0.04), maxLines: 1, color: DIM }), "pbTime"), "pbTime"));

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
      piece(labelRect, 2, bindProp(tag(svgLabel(timeStr, labelRect.w, labelRect.h, { maxPx: Math.round(H * 0.045), maxLines: 1, color: INK }), sec.name), sectorPropName as never));

      // PB time
      const pbRect = px(0.38, sec.yStart, 0.25, 0.065);
      const pbPropName = sec.name.replace("sector", "sector") + "Pb";
      piece(pbRect, 2, bindProp(tag(svgLabel(`PB ${formatTime(pbMs)}`, pbRect.w, pbRect.h, { maxPx: Math.round(H * 0.04), maxLines: 1, color: DIM }), `${sec.name}-pb`), pbPropName as never));

      // Delta text
      const deltaRect = px(0.65, sec.yStart, 0.29, 0.065);
      const deltaColor = isGreen ? GREEN : RED;
      piece(deltaRect, 2, tag(svgLabel(formatDelta(deltaMs), deltaRect.w, deltaRect.h, { maxPx: Math.round(H * 0.04), maxLines: 1, color: deltaColor }), `${sec.name}-delta`));

      // Delta bar - below the text
      if (maxAbsDelta > 0) {
        const barWidth = (Math.abs(deltaMs) / maxAbsDelta) * barTrackWidth * W;
        const barHeight = Math.max(barMinHeightPx, Math.round(H * 0.015));
        const barX = Math.round(0.65 * W);
        const barY = Math.round((sec.yStart + 0.05) * H);
        const barRect = { x: barX, y: barY, w: Math.round(barWidth), h: barHeight };
        piece(barRect, 1, tag(makeColorTile(isGreen ? GREEN : RED), `${sec.name}-bar`));
      }
    }

    // Footer - driver left-aligned, speed right-aligned
    const driverRect = px(0.06, 0.85, 0.4, 0.08);
    piece(driverRect, 2, bindProp(tag(svgLabel(driverId, driverRect.w, driverRect.h, { maxPx: Math.round(H * 0.06), maxLines: 1, color: INK }), "driverId"), "driverId"));

    const speedRect = px(0.54, 0.85, 0.4, 0.08);
    const speedText = `${topSpeed} km/h`;
    piece(speedRect, 2, bindProp(tag(svgLabel(speedText, speedRect.w, speedRect.h, { maxPx: Math.round(H * 0.06), maxLines: 1, color: DIM }), "topSpeed"), "topSpeed"));

    const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
    const doc: MosaicDocument = {
      kind: "mosaic_document",
      version: 1,
      m0: toM0String(placed.m0, ID),
      assets: {},
      backgroundColor: PAGE,
      sources: placed.sources,
    };
    return withLayoutIntent(doc, ctx, { templateId: ID, constraints: layoutContract(), debug: props.debugLayout === true });
}
