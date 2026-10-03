import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { QslCardV1 } from "./qsl-card/v1/qsl-card";

/** Pack `community`, in registry order (mirrors ./registry.ts). */
export const communityTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  QslCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./qsl-card/v1/qsl-card";
