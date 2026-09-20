"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devRegistry = void 0;
/**
 * Pack registry: `dev` — templates a developer runs from a build step or a
 * terminal, fed by the repo's own metadata. Array order is the display order.
 */
exports.devRegistry = [
    {
        slug: "og-card",
        templateId: "@one-a-day/dev/og-card/v1",
        exportName: "OgCardV1",
        title: "02 · OG Card",
        description: "Open Graph preview card from five strings - title, summary, kicker, site, author - as a deterministic PNG for a build step. 1200x630 by default; the same props also lay out square and story crops.",
        tags: ["dev", "og-image", "social", "card", "blog", "build-step", "still"],
    },
];
