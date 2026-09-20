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
export const TEMPLATE_REPO: MosaicTemplateRepoDescriptor = {
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
];
