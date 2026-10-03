import type { StarterRegistryEntry } from "../registry-types";

/**
 * Pack registry: `community` — array order is the display order.
 */
export const communityRegistry: StarterRegistryEntry[] = [
  {
    slug: "qsl-card",
    templateId: "@one-a-day/community/qsl-card/v1",
    exportName: "QslCardV1",
    title: "2026-10-03 · Ham Radio QSL Card",
    description:
      "A ham radio QSL card for one contact, from one ADIF log record: props named after the ADIF fields, the date and time printed the QSL way, BAND derived from FREQ. Paper and type only, no photo background in v1.",
    tags: ["community", "2026-10-03", "day-014", "ham-radio", "qsl", "adif", "card"],
  },
];
