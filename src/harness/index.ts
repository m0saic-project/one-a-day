import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { AgentTimelineV1 } from "./agent-timeline/v1/agent-timeline";

/** Pack `harness`, in registry order (mirrors ./registry.ts). */
export const harnessTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  AgentTimelineV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./agent-timeline/v1/agent-timeline";
