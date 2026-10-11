import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { ReadingGoalRecapV1 } from "./reading-goal-recap/v1/reading-goal-recap";

/** Pack `personal`, in registry order (mirrors ./registry.ts). */
export const personalTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  ReadingGoalRecapV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./reading-goal-recap/v1/reading-goal-recap";
