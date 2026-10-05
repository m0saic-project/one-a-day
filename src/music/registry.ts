import type { StarterRegistryEntry } from "../registry-types";

/**
 * Pack registry: `music` — array order is the display order.
 */
export const musicRegistry: StarterRegistryEntry[] = [
  {
    slug: "radio-top-30-chart",
    templateId: "@one-a-day/music/radio-top-30-chart/v1",
    exportName: "RadioTop30ChartV1",
    title: "2026-10-05 · Radio Top 30 Chart",
    description:
      "A radio station's weekly chart card from a list of lines (Artist | Title | Label | last week): the station, a computed TOP 30, the week, and thirty equal two-line rows with rank and movement markers, 3 x 10 on a wide canvas and 2 x 15 on a square or story; long titles shrink by rule or are refused, never clipped.",
    tags: ["music","2026-10-05","day-016","radio","college-radio","chart","top-30","nacc"],
  },
];
