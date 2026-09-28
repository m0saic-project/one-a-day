import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { TalkTimerV1 } from "./talk-timer/v1/talk-timer";
import { BirdWalkSightingsV1 } from "./bird-walk-sightings/v1/bird-walk-sightings";

/** Pack `events`, in registry order (mirrors ./registry.ts). */
export const eventsTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  TalkTimerV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  BirdWalkSightingsV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./talk-timer/v1/talk-timer";
export * from "./bird-walk-sightings/v1/bird-walk-sightings";
