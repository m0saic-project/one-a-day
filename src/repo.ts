import type {
  MosaicTemplatePackDescriptor,
  MosaicTemplateRepoDescriptor,
} from "@m0saic/types";
import { asRepoId, asTemplateId } from "@m0saic/types";

/**
 * Who this repo is. The entry module (src/index.ts) re-exports this as
 * `repo` — one of the two exports every Mosaic host requires from an
 * external template repo (the other is `templates`).
 *
 * `@one-a-day` is a THIRD-PARTY namespace: it is not reserved, not signed,
 * and not part of the official community repo. Hosts show these templates
 * as third-party (`3P`). The id namespace is derived from `repoId` by every
 * gate in this repo (manifest generator, contract check, dep policy,
 * scaffolder) — it is the one identity field.
 */
// `conventions` is a 0.3.1 descriptor field; the @m0saic/types this repo
// builds against (0.2.x) does not declare it yet, hence the intersection.
export const TEMPLATE_REPO: MosaicTemplateRepoDescriptor & { conventions?: string } = {
  repoId: asRepoId("@one-a-day"),
  displayName: "One a Day",
  schemaVersion: 1,
  description:
    "One m0saic template a day, written by an AI agent and built in public. Each morning the agent scouts the web for a media workflow that needs support, plans a media solution, writes a template (with variants), critiques it, and ships the one that passes every gate. The journal/ folder is the full record. Third-party, unsigned, by design.",
  curator: "an AI agent, built in public",
  homepage: "https://github.com/m0saic-project/one-a-day",
  assets: { templatesDir: "assets/templates" },
  // The front door — the template a newcomer renders first (the hello-world
  // convention): the canonical card with this repo's subline.
  helloWorld: asTemplateId("@one-a-day/basics/hello-world/v1"),
  // The template-convention line this repo targets (m0saic 0.3.1 field): the
  // checks hold its templates to the rules up to it; newer rules are advice
  // until it moves. 0.3.0 is the line this repo's build enforces and freezes
  // at (frozen.manifest.json `release`). 0.3.1's catalogSidecar needs a build
  // step that gathers <name>.catalog.json into template-catalog.json, which
  // tools/ does not have yet; move this to "0.3.1" once it does.
  conventions: "0.3.0",
};

/**
 * Packs, in display order. `basics` holds the front door. The daily agent
 * adds packs as use cases demand them (`npm run new -- <pack>/<slug>` wires
 * a new pack here); the vocabulary it prefers lives in pipeline/config.json.
 */
export const TEMPLATE_PACKS: MosaicTemplatePackDescriptor[] = [
  {
    id: "basics",
    title: "Basics",
    description: "The front door. Every other pack is a day's work by the agent.",
  },
  {
    id: "harness",
    title: "Harness",
    description:
      "Fixtures the daily templates and the shared pages build on - the agent timeline the why-tutorial ends with. Human-maintained, every entry internal; never a day's work.",
  },
  {
    id: "dev",
    title: "Dev",
    description:
      "Templates a developer runs from a build step or a terminal, fed by the repo's own metadata: preview cards, badges, banners. Deterministic, so a stale image is a diff.",
  },
  {
    id: "social",
    title: "Social",
    description:
      "Stills and clips a small business or a creator posts as themselves: testimonials, announcements, proof. Every card keeps its evidence attached - who said it, where it came from - so the post cannot pose as more than it is.",
  },
  {
    id: "events",
    title: "Events",
    description:
      "Event production media: timers, holding screens and boards for stages, streams and rooms - clips a screen can just play.",
  },
  {
    id: "gaming",
    title: "Gaming",
    description:
      "Gaming: one line on what this pack teaches.",
  },
  {
    id: "sports",
    title: "Sports",
    description:
      "Sports: one line on what this pack teaches.",
  },
  {
    id: "community",
    title: "Community",
    description:
      "Cards a hobby community makes for its own members, filled from the records the hobby already keeps (a ham radio log, a club roster): one card per record, scripted.",
  },
  {
    id: "music",
    title: "Music",
    description:
      "Station charts and other music artifacts, made from the rows the person already keeps (a weekly Top 30 as reported to NACC): the list goes in, the card comes out, and long names are fitted by rule or refused, never clipped.",
  },
];
