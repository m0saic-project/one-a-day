import type { StarterRegistryEntry } from "../registry-types";

/**
 * Pack registry: `dev` — templates a developer runs from a build step or a
 * terminal, fed by the repo's own metadata. Array order is the display order.
 */
export const devRegistry: StarterRegistryEntry[] = [
  {
    slug: "og-card",
    templateId: "@one-a-day/dev/og-card/v1",
    exportName: "OgCardV1",
    title: "2026-09-20 · OG Card",
    description:
      "Open Graph preview card from five strings - title, summary, kicker, site, author - as a deterministic PNG for a build step. 1200x630 by default; the same props also lay out square and story crops.",
    tags: ["dev", "2026-09-20", "day-001", "og-image", "social", "card", "blog", "build-step", "still"],
  },
];
