import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { PowerliftingMeetRecapV1 } from "./powerlifting-meet-recap/v1/powerlifting-meet-recap";
import { SwimTimeDropCardV1 } from "./swim-time-drop-card/v1/swim-time-drop-card";
import { LapTelemetryCardV1 } from "./lap-telemetry-card/v1/lap-telemetry-card";
import { CubingAverageCardV1 } from "./cubing-average-card/v1/cubing-average-card";
import { ChessGameRecapV1 } from "./chess-game-recap/v1/chess-game-recap";

/** Pack `sports`, in registry order (mirrors ./registry.ts). */
export const sportsTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  PowerliftingMeetRecapV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  SwimTimeDropCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  LapTelemetryCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  CubingAverageCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  ChessGameRecapV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./powerlifting-meet-recap/v1/powerlifting-meet-recap";
export * from "./swim-time-drop-card/v1/swim-time-drop-card";
export * from "./lap-telemetry-card/v1/lap-telemetry-card";
export * from "./cubing-average-card/v1/cubing-average-card";
export * from "./chess-game-recap/v1/chess-game-recap";
