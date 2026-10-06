import type { LayoutConstraint } from "@m0saic/template-utils";
/**
 * `@one-a-day/events/talk-timer/v1` - the talk timer as a clip: a countdown
 * file a stage screen, a confidence monitor or an OBS scene can just play.
 *
 * ONE CONCEPT: **the picture is a function of `t` and of nothing else, and
 * every moving part is a scalar gate.** A five minute clip is 9,000 frames,
 * so anything per-pixel (an alpha fade, a geq) is paid 9,000 times. This
 * timer is built from exactly three cheap mechanisms:
 *
 * 1. The bar is rectangles that ARE the remaining time. The countdown is cut
 *    into equal slices (10 s for a 5 minute talk); every slice is two colour
 *    tiles on one rect - a LIT one enabled while `t < k` and a SPENT one
 *    enabled from `k` on, where `k` is the second that slice runs out. Slices
 *    go out from the right; the last thirty seconds sit at the left end in
 *    red, the minute before them in amber. At any moment the number of lit
 *    slices is `ceil(remaining / slice)` - the test asserts it. Nothing
 *    slides, nothing fades, no track has to be drawn under it.
 * 2. The digits are one `drawtext` expression - the same one every ffmpeg
 *    gist re-derives by hand - generated from the props:
 *    `%{eif\:trunc(R/60)\:d\:2}:%{eif\:mod(R\,60)\:d\:2}` with
 *    `R = max(0, ceil(S - t))`. Three copies on one rect, one per phase
 *    colour, each gated to its window; the engine trims each to its window.
 * 3. The phases are thresholds, not animations. `warnSec` (amber) and
 *    `finalSec` (red) are seconds remaining, exactly as the timer tools
 *    state them ("yellow at the 1-minute mark and red at 30 seconds"). The
 *    digits, the bar's colour zones and the caption all derive from those two
 *    numbers. At zero the end word appears and the clip holds.
 *
 * The rule that bites: **the countdown is the clip.** The natural length is
 * `seconds + holdSec`, authored on `doc.durationMs` and declared through
 * `resolveOutputHints` so a host seeds its Duration field from the props. An
 * explicit user pin (`--durationMs`, Make's Duration field) wins, and then the
 * countdown IS the pin minus the hold: a streamer who asks for a 180,000 ms
 * clip gets a three minute countdown, not five minutes cut off at two.
 * `ctx.target.durationMs` is never read as a pin - it only echoes the hint.
 *
 * Frame 0 is the finished picture (05:00 over a full bar), so the browse
 * still - frame 0, which is all a day agent can get - is representative.
 *
 * Day 004 of one-a-day, run by hand on the first day of WeAreDevelopers
 * World Congress North America. Scouted from timer-tool pages, the OBS
 * forums and four ffmpeg gists that each hand-wrote this expression.
 */
export type TalkTimerPreset = "dark" | "light";
export type TalkTimerProps = {
    /** The countdown length in seconds (5..21600). It is also the clip length, plus the hold. */
    seconds?: number;
    /** What the slot is. Bound: Make edits it in place. Empty removes the line. */
    title?: string;
    /** The rule of the format ("5 minute slot - hard stop"). Empty removes the line. */
    subtitle?: string;
    /** Seconds remaining at which the digits and the bar turn amber. 0 = no amber phase. */
    warnSec?: number;
    /** Seconds remaining at which they turn red. 0 = no red phase. */
    finalSec?: number;
    /** The word shown at zero ("TIME"; "LIVE" for a starting-soon screen). Empty = none. */
    endText?: string;
    /** How long the clip holds at 00:00 after the countdown (0..60). */
    holdSec?: number;
    /** The calm colour, for the digits and the bar (#rrggbb). Amber and red are fixed by the preset. */
    accent?: string;
    /** Tint the WHOLE frame with the phase - the room turns amber, then red - not only the digits. */
    phaseTint?: boolean;
    /** Hand-tuned dark (a confidence monitor) or light trio. */
    preset?: TalkTimerPreset;
    /** Dev-only: check the layout contract and draw it over the frame. */
    debugLayout?: boolean;
};
export declare const MIN_SECONDS = 5;
export declare const MAX_SECONDS = 21600;
export declare const MAX_HOLD = 60;
/** The bar never has more slices than this: past it a slice is a sliver, not a rectangle. */
export declare const MAX_SLICES = 30;
/** Slice lengths a human reads at a glance, smallest first. */
export declare const SLICE_STEPS: readonly [1, 2, 5, 10, 15, 20, 30, 60, 120, 300, 600, 900, 1800, 3600];
/** The slice length for a countdown: the smallest step that keeps the bar at or under MAX_SLICES slices. */
export declare function sliceSecondsFor(seconds: number): number;
export type Phase = "calm" | "warn" | "final";
export type SliceWindow = {
    /** 0 = the leftmost slice, the last to go out. */
    index: number;
    /** The remaining-time band this slice stands for: (remainLo, remainHi]. */
    remainLo: number;
    remainHi: number;
    /** The clip time at which it goes out: lit while t < outAtSec. */
    outAtSec: number;
    /** Its share of a full slice - the last slice of an uneven countdown is partial. */
    frac: number;
    phase: Phase;
};
/** The phase of a slice or of the digits at `remaining` seconds left. */
export declare function phaseAtRemaining(remaining: number, warnSec: number, finalSec: number, strict?: boolean): Phase;
/**
 * The bar's slices. Slice `i` (from the left) stands for the remaining-time
 * band `(i * slice, (i + 1) * slice]` and is lit while more than `i * slice`
 * seconds remain, i.e. while `t < seconds - i * slice`. Its colour is the
 * phase the digits are in while it is the lit tip, which is the phase at its
 * LOWER bound read strictly: the slice for 60..70 s left is calm, the slice
 * for 50..60 s left is amber, exactly as the digits flip at 60.
 */
export declare function sliceWindows(seconds: number, warnSec: number, finalSec: number): SliceWindow[];
/** How many slices are lit at clip time `t` - what the test checks against ceil(remaining / slice). */
export declare function litSlicesAt(windows: SliceWindow[], t: number): number;
/**
 * The largest 5-smooth number (2^a 3^b 5^c) at or below `n`. The bar is a
 * child document on its own canvas, and a canvas whose side carries a large
 * prime (1790 = 2 x 5 x 179) has no divisor lattice under the basis, so the
 * placement degrades to exact and the split count goes rough (179). A
 * 5-smooth side always quantizes; the few pixels given up are margins.
 */
export declare function smoothDown(n: number): number;
/**
 * The digits: ONE drawtext expression, evaluated per frame by ffmpeg, that
 * prints MM:SS of the seconds remaining. `R = max(0, ceil(S - t - 0.001))`
 * so the clip opens on 05:00, flips to 04:59 at exactly one second, and
 * holds 00:00 through the end hold. Inside `%{...}` drawtext wants `\:` and
 * `\,`; the engine's textfile path keeps them. Minutes are not folded into
 * hours: a 90 minute slot reads 90:00.
 */
export declare function digitsExpr(seconds: number): string;
/** The three phase windows of the digits and the caption, in clip seconds. `null` = the phase does not exist. */
export declare function phaseWindows(seconds: number, warnSec: number, finalSec: number): Record<Phase, {
    startSec: number;
    endSec: number | null;
} | null>;
/** "1:00", "0:30", "18:00" - a threshold as a human writes it. */
export declare function fmtClock(seconds: number): string;
export type TimerRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export type TimerFit = {
    text: string;
    px: number;
    width: number;
};
export type TimerLayout = {
    W: number;
    H: number;
    S: number;
    margin: number;
    seconds: number;
    holdSec: number;
    slice: number;
    windows: SliceWindow[];
    phases: ReturnType<typeof phaseWindows>;
    title: TimerFit | null;
    titleRect: TimerRect;
    subtitle: TimerFit | null;
    subtitleRect: TimerRect;
    /** The digits' size and the width the widest string (88:88) measures at it. */
    digitsPx: number;
    digitsWidth: number;
    digitsRect: TimerRect;
    bar: TimerRect;
    slices: TimerRect[];
    rule: TimerFit;
    ruleRect: TimerRect;
    captions: Record<Phase, TimerFit | null>;
    endCaption: TimerFit | null;
    captionRect: TimerRect;
};
export type TimerOpts = {
    seconds: number;
    holdSec: number;
    title: string;
    subtitle: string;
    warnSec: number;
    finalSec: number;
    endText: string;
};
/**
 * The whole geometry as a pure function of the props and the canvas, so the
 * test can assert the rects, the windows and the fits without parsing m0.
 */
export declare function layoutTalkTimer(opts: TimerOpts, W: number, H: number): TimerLayout;
/**
 * What the geometry promises. Text is calibrated from the measured block;
 * the digits from the widest string the expression prints, widened by 15%
 * for the system font; the bands the design depends on get a `within`.
 */
export declare function talkTimerContract(L: TimerLayout): LayoutConstraint[];
export declare const TalkTimerV1: import("@m0saic/types").MosaicTemplate<TalkTimerProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default TalkTimerV1;
