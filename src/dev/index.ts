import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { OgCardV1 } from "./og-card/v1/og-card";

/** Pack `dev`, in registry order (mirrors ./registry.ts). */
export const devTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  OgCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./og-card/v1/og-card";
