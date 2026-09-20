import type { MosaicTemplatePackDescriptor, MosaicTemplateRepoDescriptor } from "@m0saic/types";
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
export declare const TEMPLATE_REPO: MosaicTemplateRepoDescriptor;
/**
 * Packs, in display order. `basics` holds the front door. The daily agent
 * adds packs as use cases demand them (`npm run new -- <pack>/<slug>` wires
 * a new pack here); the vocabulary it prefers lives in pipeline/config.json.
 */
export declare const TEMPLATE_PACKS: MosaicTemplatePackDescriptor[];
