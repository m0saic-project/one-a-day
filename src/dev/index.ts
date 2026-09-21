import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { OgCardV1 } from "./og-card/v1/og-card";
import { BenchDeltaV1 } from "./bench-delta/v1/bench-delta";

/** Pack `dev`, in registry order (mirrors ./registry.ts). */
export const devTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  OgCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  BenchDeltaV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./og-card/v1/og-card";
export * from "./bench-delta/v1/bench-delta";
