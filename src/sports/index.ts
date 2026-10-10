import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { PowerliftingMeetRecapV1 } from "./powerlifting-meet-recap/v1/powerlifting-meet-recap";
import { SwimTimeDropCardV1 } from "./swim-time-drop-card/v1/swim-time-drop-card";
import { LapTelemetryCardV1 } from "./lap-telemetry-card/v1/lap-telemetry-card";
import { CubingAverageCardV1 } from "./cubing-average-card/v1/cubing-average-card";
import { ChessGameRecapV1 } from "./chess-game-recap/v1/chess-game-recap";
import { ChessGameRecapV2 } from "./chess-game-recap/v2/chess-game-recap";
import { ChessGameRecapV3 } from "./chess-game-recap/v3/chess-game-recap";
import { GolfRoundScorecardV1 } from "./golf-round-scorecard/v1/golf-round-scorecard";

/**
 * Deprecation without editing a frozen file: a shipped vN never changes, so
 * the flag goes on the copy this pack hands to hosts (`templates`), which is
 * what Mosaic Desktop, the CLI and the manifest read.
 */
const retired = <T extends object>(t: T, replacement: string, since: string, reason: string): T =>
  ({ ...t, deprecated: { replacement, since, reason } }) as T;

/** Pack `sports`, in registry order (mirrors ./registry.ts). */
export const sportsTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  PowerliftingMeetRecapV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  SwimTimeDropCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  LapTelemetryCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  CubingAverageCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  retired(
    ChessGameRecapV1,
    "@one-a-day/sports/chess-game-recap/v3",
    "2026-10-07",
    "v1 (claude-haiku) shows six typed fields and no board; v2 and v3 read the PGN, replay the game and play its key moments.",
  ) as unknown as MosaicTemplate<MosaicTemplateProps>,
  retired(
    ChessGameRecapV2,
    "@one-a-day/sports/chess-game-recap/v3",
    "2026-10-07",
    "v2 draws each board as one whole-board image; v3 builds it cell by cell (64 squares, every piece its own rect) and adds a platform knob.",
  ) as unknown as MosaicTemplate<MosaicTemplateProps>,
  ChessGameRecapV3 as unknown as MosaicTemplate<MosaicTemplateProps>,
  GolfRoundScorecardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./powerlifting-meet-recap/v1/powerlifting-meet-recap";
export * from "./swim-time-drop-card/v1/swim-time-drop-card";
export * from "./lap-telemetry-card/v1/lap-telemetry-card";
export * from "./cubing-average-card/v1/cubing-average-card";
export * from "./chess-game-recap/v1/chess-game-recap";
export * from "./chess-game-recap/v2/chess-game-recap";
export * from "./chess-game-recap/v3/chess-game-recap";
export * from "./golf-round-scorecard/v1/golf-round-scorecard";
