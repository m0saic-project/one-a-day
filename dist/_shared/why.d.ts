import type { MosaicDocumentPipeline, MosaicEngineContext, MosaicRenderableFile } from "@m0saic/types";
import type { TimelinePhase } from "../harness/agent-timeline/v1/agent-timeline";
/**
 * The why-tutorial — every template in this repo explains itself.
 *
 * Make has no prose surface and a link preview has no README, so a
 * template's `renderTutorial` is where it says WHY it exists: which people
 * were observed with which recurring problem (with the references the agent
 * actually opened), what this template attempts about it, and how to run it.
 * Every template shares ONE structure, built here from a small `WhySpec`:
 *
 *   1. cover     — the run: day, date, which agent, which model (self-declared)
 *   2. problem   — who, what was observed, the online sources
 *   3. solution  — why this template answers it, known weak spots
 *   4. use it    — the render one-liner and props worth trying
 *   5. the template itself, rendered at its own defaults
 *   6. how it was made — the harness agent-timeline card: the run's phases
 *      as a waterfall, tool calls, tokens, wall time (from the runner's
 *      trace, or self-reported when no runner ran)
 *
 * Each page is its own pipeline step, so a viewer scrubs page by page in
 * Make's "?" pill and `m0saic make <id> --template-repo . --tutorial` renders
 * the same walk as a clip. Pages own their duration (the contract forbids
 * deriving it from `ctx.target.durationMs`); geometry follows `ctx.target`.
 *
 * `whyTutorial(spec, render)` validates the spec at MODULE level - over
 * budget, non-ASCII copy or a bad source URL throws the moment the template
 * is imported - and records it in a registry keyed by template id, which
 * `tools/check-why.mjs` reads on every build (`whySpecFor(id)`) to confirm
 * every template carries one and that it agrees with the journal. The agent
 * fills the spec from the day's journal; the scaffold pre-fills what the
 * journal already knows.
 */
export type WhySpec = {
    /** Day number in this repo (journal/index.json). */
    day: number;
    /** The day, ISO date. */
    date: string;
    /** The adapter that ran the day: claude | codex | kimi | ... */
    agent: string;
    /** The model as the agent declared it (run.json model.selfDeclared). */
    model: string;
    /** The template id. */
    id: string;
    /** The template's human title (without the date prefix). */
    title: string;
    /** Who has the problem, and where they were found. One line. */
    who: string;
    /** What was observed - the recurring problem, in the evidence's own words. 1-3 paragraphs. */
    problem: string[];
    /** URLs the agent actually opened. 1-12. */
    sources: string[];
    /** Why this template answers the problem. 1-3 paragraphs. */
    solution: string[];
    /** How to run it: the one-liner, and up to 4 things worth trying. */
    usage: {
        command: string;
        try: string[];
    };
    /** Known weak spots, honest. Up to 3. */
    caveats?: string[];
    /**
     * How the day was made: the run's phases with their cost, for the last page.
     * `runner` = copied from journal/<date>/trace.json (the pipeline recorded
     * it); `self-reported` = the agent's own account (no runner ran).
     */
    timeline: {
        source: "runner" | "self-reported";
        phases: TimelinePhase[];
        /** How the dollars were arrived at: reported by the agent CLI, or estimated at list prices. */
        costBasis?: "reported" | "estimated";
        /** The price table's date when estimated (pipeline/config.json pricing.pricedAt). */
        pricedAt?: string;
    };
};
/** The length budget, enforced: a tutorial is orientation, not documentation. */
export declare const WHY_BUDGET: {
    readonly maxParagraphs: 3;
    readonly maxParagraphChars: 320;
    readonly maxWhoChars: 160;
    readonly minSources: 1;
    readonly maxSources: 12;
    readonly maxTry: 4;
    readonly maxTryChars: 110;
    readonly maxCommandChars: 200;
    readonly maxCaveats: 3;
    readonly maxCaveatChars: 200;
    readonly minPhases: 1;
    readonly maxPhases: 12;
};
/** The scaffold's placeholder marker; the gate refuses a spec that still carries it. */
export declare const WHY_PLACEHOLDER = "[fill me]";
export declare function assertWhySpec(spec: WhySpec): void;
/** A tutorial renderer that also carries its spec. */
export type WhyTutorial = ((props: unknown, ctx: MosaicEngineContext) => Promise<MosaicDocumentPipeline>) & {
    readonly why: WhySpec;
};
export declare function whySpecFor(id: string): WhySpec | undefined;
export declare function listWhySpecs(): WhySpec[];
/** The step labels the pages carry, in order - the gate checks a tutorial has this shape. */
export declare const WHY_PAGE_LABELS: readonly ["why: cover", "why: the problem", "why: the solution", "why: use it"];
/** The label of the page after the template: the harness timeline. */
export declare const WHY_MADE_LABEL = "why: how it was made";
/**
 * Build a template's why-tutorial. Assign directly:
 * `renderTutorial: whyTutorial(WHY, render)` where `render` is the template's
 * own render function (the last step shows the template at its defaults).
 */
export declare function whyTutorial<P>(spec: WhySpec, render: (props: P, ctx: MosaicEngineContext) => Promise<MosaicRenderableFile> | MosaicRenderableFile): WhyTutorial;
