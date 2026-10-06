"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicsRegistry = void 0;
/**
 * Pack registry: `basics`. One row per template — the browse metadata the
 * manifest is generated from. The front door carries no date; every day's
 * template is titled "YYYY-MM-DD · Title" (the generator asserts it).
 */
exports.basicsRegistry = [
    {
        slug: "hello-world",
        templateId: "@one-a-day/basics/hello-world/v1",
        exportName: "HelloWorldV1",
        title: "Hello World",
        description: "The canonical m0saic hello-world card with this repo's mark: the brand field wipes in, a navy card rises, the M appears as 33 robot faces — the agents that write this repo — then the wordmark and the greeting. The front door: what `m0saic hello-world --template-repo .` renders. The one human-placed template; every other public template is one day of the agent's work, titled by its date.",
        tags: ["basics", "starter", "brand", "hello", "robots"],
    },
];
