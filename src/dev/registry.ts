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
  {
    slug: "bench-delta",
    templateId: "@one-a-day/dev/bench-delta/v1",
    exportName: "BenchDeltaV1",
    title: "2026-09-21 · Bench Delta",
    description:
      "Before/after benchmark card. Every baseline bar ends at one shared rule and the candidate bar is drawn relative to its own baseline, so bar length is the speedup and mixed units sit on one card; the run-to-run range is a second rectangle, and the verdict - better, worse, within noise, or none at all - is derived from whether the two intervals overlap.",
    tags: ["dev", "2026-09-21", "day-002", "benchmark", "regression", "before-after", "variance", "readme", "still"],
  },
  {
    slug: "app-store-screenshot-frame",
    templateId: "@one-a-day/dev/app-store-screenshot-frame/v1",
    exportName: "AppStoreScreenshotFrameV1",
    title: "2026-09-24 · App Store Screenshot Frame",
    description:
      "Turn one mobile capture and localized copy into a deterministic, generic device-framed store PNG while keeping the complete capture contained rather than cropped or stretched.",
    tags: ["dev", "2026-09-24", "day-005", "app-store", "screenshots", "localization", "mobile", "release", "still"],
  },
];
