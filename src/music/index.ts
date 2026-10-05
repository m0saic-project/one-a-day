import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { RadioTop30ChartV1 } from "./radio-top-30-chart/v1/radio-top-30-chart";

/** Pack `music`, in registry order (mirrors ./registry.ts). */
export const musicTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  RadioTop30ChartV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./radio-top-30-chart/v1/radio-top-30-chart";
