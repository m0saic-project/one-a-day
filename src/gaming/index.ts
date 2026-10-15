import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { SpeedrunPbRecapV1 } from "./speedrun-pb-recap/v1/speedrun-pb-recap";
import { CrosswordGridCardV1 } from "./crossword-grid-card/v1/crossword-grid-card";
import { VatsimMonthlyLogV1 } from "./vatsim-monthly-log/v1/vatsim-monthly-log";
import { TenxtenChallengeCardV1 } from "./tenxten-challenge-card/v1/tenxten-challenge-card";
import { OsuScorepostCardV1 } from "./osu-scorepost-card/v1/osu-scorepost-card";

/** Pack `gaming`, in registry order (mirrors ./registry.ts). */
export const gamingTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  SpeedrunPbRecapV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  CrosswordGridCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  VatsimMonthlyLogV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  TenxtenChallengeCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  OsuScorepostCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./speedrun-pb-recap/v1/speedrun-pb-recap";
export * from "./crossword-grid-card/v1/crossword-grid-card";
export * from "./vatsim-monthly-log/v1/vatsim-monthly-log";
export * from "./tenxten-challenge-card/v1/tenxten-challenge-card";
export * from "./osu-scorepost-card/v1/osu-scorepost-card";
