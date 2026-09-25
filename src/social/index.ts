import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { TestimonialProofCardV1 } from "./testimonial-proof-card/v1/testimonial-proof-card";
import { EpisodeAudiogramV1 } from "./episode-audiogram/v1/episode-audiogram";

/** Pack `social`, in registry order (mirrors ./registry.ts). */
export const socialTemplates: MosaicTemplate<MosaicTemplateProps>[] = [
  TestimonialProofCardV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
  EpisodeAudiogramV1 as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// `export *` ONLY — see the note in src/index.ts.
export * from "./testimonial-proof-card/v1/testimonial-proof-card";
export * from "./episode-audiogram/v1/episode-audiogram";
