import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { QslCardV1 } from "./qsl-card/v1/qsl-card";
import { WeeklyRunReportV1 } from "./weekly-run-report/v1/weekly-run-report";

/** Pack `community`, in registry order (mirrors ./registry.ts). */
export const communityTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  QslCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  WeeklyRunReportV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./qsl-card/v1/qsl-card";
export * from "./weekly-run-report/v1/weekly-run-report";
