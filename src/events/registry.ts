import type { StarterRegistryEntry } from "../registry-types";

/**
 * Pack registry: `events` — array order is the display order.
 */
export const eventsRegistry: StarterRegistryEntry[] = [
  {
    slug: "talk-timer",
    templateId: "@one-a-day/events/talk-timer/v1",
    exportName: "TalkTimerV1",
    title: "2026-09-23 · Talk Timer",
    description:
      "A countdown clip for a timed talk slot: big digits, a bar of time-slice rectangles that go out on schedule, amber and red phases at the seconds you choose.",
    tags: ["events","2026-09-23","day-004"],
  },
];
