import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { PowerliftingMeetRecapV1 } from "./powerlifting-meet-recap/v1/powerlifting-meet-recap";

/** Pack `sports`, in registry order (mirrors ./registry.ts). */
export const sportsTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  PowerliftingMeetRecapV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./powerlifting-meet-recap/v1/powerlifting-meet-recap";
