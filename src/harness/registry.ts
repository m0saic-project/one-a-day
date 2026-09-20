import type { StarterRegistryEntry } from "../registry-types";

/**
 * Pack registry: `harness` — fixtures the daily templates and the shared
 * pages build on. Human-maintained; never a day's work, never a top-level
 * pick (every entry is `internal: true`). Array order is the display order.
 */
export const harnessRegistry: StarterRegistryEntry[] = [
  {
    slug: "agent-timeline",
    templateId: "@one-a-day/harness/agent-timeline/v1",
    exportName: "AgentTimelineV1",
    title: "Harness · Agent Timeline",
    description:
      "How a day was made: the agent's phases as a waterfall - one lane per phase on a shared time axis, tool calls, tokens and the tools it leaned on, with the run totals and where the numbers came from. A harness fixture the why-tutorial renders as its last page; never a top-level pick.",
    tags: ["harness", "agents", "timeline", "trace", "tokens", "internal"],
  },
];
