import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { AstroIntegrationSummaryV1 } from "./astro-integration-summary/v1/astro-integration-summary";

/** Pack `science`, in registry order (mirrors ./registry.ts). */
export const scienceTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  AstroIntegrationSummaryV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./astro-integration-summary/v1/astro-integration-summary";
