import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { SpeedrunPbRecapV1 } from "./speedrun-pb-recap/v1/speedrun-pb-recap";
import { CrosswordGridCardV1 } from "./crossword-grid-card/v1/crossword-grid-card";

/** Pack `gaming`, in registry order (mirrors ./registry.ts). */
export const gamingTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  SpeedrunPbRecapV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  CrosswordGridCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./speedrun-pb-recap/v1/speedrun-pb-recap";
export * from "./crossword-grid-card/v1/crossword-grid-card";
