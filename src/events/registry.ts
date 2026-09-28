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
  {
    slug: "bird-walk-sightings",
    templateId: "@one-a-day/events/bird-walk-sightings/v1",
    exportName: "BirdWalkSightingsV1",
    title: "2026-09-28 · Bird Walk Sightings",
    description:
      "A visitor sightings sheet from one outing's normalized checklist rows: eight entries per page, preserving names, counts and X observations.",
    tags: ["events","2026-09-28","day-009","birding","checklist","print"],
  },
];
