import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { QslCardV1 } from "./qsl-card/v1/qsl-card";
import { WeeklyRunReportV1 } from "./weekly-run-report/v1/weekly-run-report";
import { AncestorBirthplaceChartV1 } from "./ancestor-birthplace-chart/v1/ancestor-birthplace-chart";

/** Pack `community`, in registry order (mirrors ./registry.ts). */
export const communityTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  QslCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  WeeklyRunReportV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  AncestorBirthplaceChartV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./qsl-card/v1/qsl-card";
export * from "./weekly-run-report/v1/weekly-run-report";
export * from "./ancestor-birthplace-chart/v1/ancestor-birthplace-chart";
