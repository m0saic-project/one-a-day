/**
 * `@one-a-day/harness/agent-timeline/v1` — how a day was made: the agent's
 * phases as a waterfall.
 *
 * HARNESS, not a day's work. A fixture the daily templates and the shared
 * pages use (the why-tutorial's last page renders it): one lane per phase of
 * the run - scout, plan, build, critique, ship, retries as their own lanes -
 * a bar on a shared time axis, and under the phase name what it cost: tool
 * calls, tokens, the tools it leaned on. The subtitle carries the totals; a
 * footer says where the numbers came from (the runner's trace, or the
 * agent's own account when no runner ran) and who ran.
 *
 * A port of the official `@m0saic/agents/trace-timeline/v1` for this repo:
 * per PHASE rather than per tool call (a day is hundreds of calls), exact
 * rects through `placeInsetPieces`, a still, and the repo's dark chrome so
 * it sits inside the tutorial. `internal: true` - never a top-level pick.
 *
 * Deterministic: no clock, no randomness; the default is a fixed sample day.
 */
export type TimelinePhase = {
    /** Phase name (scout, plan, build, critique, ship - or "build (2)" for a retry). */
    name: string;
    /** Start, ms from the run's start. */
    startMs: number;
    /** Duration, ms. */
    durMs: number;
    /** Tool calls in the phase. */
    calls?: number;
    /** Tokens the phase cost (input + output, cache included). */
    tokens?: number;
    /** Dollars the phase cost - as the CLI reported it, or an estimate (see `costNote`). */
    costUsd?: number;
    /** The tools it leaned on, as one line: "Bash 41, Read 12, Edit 8". */
    tools?: string;
    /** ok (default) · error (the call failed) · no-ship (the phase said no). */
    status?: "ok" | "error" | "no-ship";
};
export type AgentTimelineProps = {
    /** Card title. */
    title?: string;
    /** Line under the title; empty = the run totals. */
    subtitle?: string;
    /** Header band, left: the run ("one-a-day - day 001 - 2026-09-20"). Empty hides the band's text. */
    header?: string;
    /** Header band, right: who ran ("claude / claude-opus-5[1m]"). */
    headerRight?: string;
    /** The phases, in run order. Up to 12 are drawn. */
    phases: TimelinePhase[];
    /** Where the numbers came from. */
    source?: "runner" | "self-reported";
    /** How the dollars were arrived at: "reported by the agent CLI" or "estimated at list prices of 2026-09-20". Empty = no cost line. */
    costNote?: string;
    /** Print tokens after each bar. */
    showTokens?: boolean;
    /** Bar colour for ok phases (#rrggbb). */
    accent?: string;
    /** Dev-only: check the layout contract and draw it over the card. */
    debugLayout?: boolean;
};
/** A fixed sample day: five phases, one build retry. ~2h20 wall, ~1.6M tokens. */
export declare const SAMPLE_PHASES: TimelinePhase[];
/** "1.2k" / "1.6M" - compact, ASCII. */
export declare function fmtTokens(n: number): string;
/** "$0.42" / "$3.20" / "$48" / "$1.2k" - the number leadership reads. */
export declare function fmtUsd(n: number): string;
/** "48s" / "3m 20s" / "2h 20m". */
export declare function fmtDuration(ms: number): string;
/** Tick interval: the smallest 1-2-5 step (in minutes, or seconds under 2 min) that keeps the axis to at most 7 ticks. */
export declare function tickStepMs(totalMs: number): number;
export declare const AgentTimelineV1: import("@m0saic/types").MosaicTemplate<AgentTimelineProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default AgentTimelineV1;
