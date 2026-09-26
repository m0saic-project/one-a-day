import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { TEMPLATE_PACKS, TEMPLATE_REPO } from "./repo";
import { basicsTemplates } from "./basics";
import { harnessTemplates } from "./harness";
import { devTemplates } from "./dev";
import { socialTemplates } from "./social";
import { eventsTemplates } from "./events";
import { gamingTemplates } from "./gaming";

/** The two exports every Mosaic host requires from a template repo. */
export const repo = TEMPLATE_REPO;

export const templates: MosaicTemplate<MosaicTemplateProps>[] = [
  ...basicsTemplates,
  ...harnessTemplates,
  ...devTemplates,
  ...socialTemplates,
  ...eventsTemplates,
  ...gamingTemplates,
];

// Library re-exports for anyone importing this repo as code. `export *`
// ONLY for template modules — never pair `export * from "./x"` with a
// named re-export of the same module (tsc double-require hazard).
export * from "./basics";
export * from "./harness";
export * from "./dev";
export * from "./social";
export * from "./events";
export * from "./gaming";
export { TEMPLATE_PACKS, TEMPLATE_REPO };
