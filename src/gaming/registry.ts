import type { StarterRegistryEntry } from "../registry-types";

/**
 * Pack registry: `gaming` — array order is the display order.
 */
export const gamingRegistry: StarterRegistryEntry[] = [
  {
    slug: "speedrun-pb-recap",
    templateId: "@one-a-day/gaming/speedrun-pb-recap/v1",
    exportName: "SpeedrunPbRecapV1",
    title: "2026-09-26 · Speedrun PB Recap",
    description:
      "A speedrun PB recap clip from the splits file: the table fills in against the old PB in LiveSplit's delta colours, the timer fast-forwards the run, and the clip opens and closes on the result.",
    tags: ["gaming","2026-09-26","day-007","speedrun","livesplit","splits","recap","video"],
  },
  {
    slug: "crossword-grid-card",
    templateId: "@one-a-day/gaming/crossword-grid-card/v1",
    exportName: "CrosswordGridCardV1",
    title: "2026-09-29 · Crossword Grid Card",
    description:
      "Crossword Grid Card: a solved crossword grid drawn in a few layers on one integer lattice - derived clue numbers, circles, theme entries tinted and listed, the caption line; solved=false makes the teaser.",
    tags: ["gaming","2026-09-29","day-010"],
  },
];
