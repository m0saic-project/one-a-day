import type { LayoutConstraint } from "@m0saic/template-utils";
/**
 * `@one-a-day/social/episode-audiogram/v1` - an episode promo clip: cover,
 * pull-quote, a waveform that lights up as the snippet plays, a counting
 * timecode - and the audio file muxed in, so the render IS the post.
 *
 * ONE CONCEPT: **audio is an input like any other prop.** A media source
 * with `mediaType: "audio"` has no pixels but joins the engine's real mix,
 * so `audioSrc` turns the render into the finished, postable MP4 - the
 * thing the GUI audiogram tools export one at a time. With no file the
 * template renders silent, and the engine's tri-state audio law means no
 * empty track is written (audio-bearing = intent: an unprobed
 * `mediaType: "audio"` source counts, a missing one does not).
 *
 * The motion reuses day-004's slice mechanism upside down: the wave is a
 * mask-free CHILD document - N static dim bars lowered onto the grid sheet,
 * one accent copy per bar enable-gated at `k * clip / N` - so the parent
 * sees one source and the svg glyphs on the frame never ride a deep overlay
 * chain. The timecode is one drawtext expression evaluated per frame.
 *
 * The rule that bites: **the wave array is honest, so it is yours.** m0saic
 * does not read amplitudes out of the audio file; `wave` is a prop (8..32
 * values, 0..1) the producer extracts with the one-liner on the usage page.
 * The default array is hand-tuned so the zero-input render still reads as
 * an audiogram - frame 0 is the browse still, and bar 0 is already lit.
 */
export type AudiogramPreset = "dark" | "light";
export type EpisodeAudiogramProps = {
    /** The show, as the header line and the generated cover's initials. Empty removes the line. */
    showName?: string;
    /** The episode - the bold line. Bound: Make edits it in place. */
    episodeTitle?: string;
    /** The pull quote, wrapped and fitted beside the cover. Empty removes it and the accent bar. */
    quote?: string;
    /** 8..32 amplitudes, 0..1 - the wave's bars, left to right. Extract them with the one-liner on the usage page. */
    wave?: number[];
    /** Clip length in whole seconds (5..600). The sweep and the timecode derive from it. */
    clipSec?: number;
    /** Zero or one audio snippet. It joins the real mix - the MP4 carries it. Empty renders silent. */
    audioSrc?: string[];
    /** Zero or one cover art image. Empty draws the initials cover instead. */
    coverSrc?: string[];
    /** The footer-right call to action. Empty removes it. */
    cta?: string;
    /** Played bars, quote bar, cover tile (#rrggbb). */
    accent?: string;
    /** Hand-tuned dark or light trio. */
    preset?: AudiogramPreset;
    /** Dev-only: check the layout contract and draw it over the frame. */
    debugLayout?: boolean;
};
export declare const MIN_CLIP_SEC = 5;
export declare const MAX_CLIP_SEC = 600;
export declare const MIN_BARS = 8;
/** Enable-gated tiles are ffmpeg overlays; the child keeps the count at talk-timer's proven scale. */
export declare const MAX_BARS = 32;
/** Hand-tuned to read as speech: phrases, a breath, an emphatic run. */
export declare const DEFAULT_WAVE: ReadonlyArray<number>;
/** The second bar k (0-based, of n) flips from dim to accent: k * clipSec / n. Bar 0 is lit at t=0, so frame 0 - the browse still - already shows the accent. */
export declare function litTimes(n: number, clipSec: number): number[];
/** How many bars are lit at clip time t - what the test checks against floor(t * n / clip) + 1. */
export declare function litBarsAt(times: number[], t: number): number;
/**
 * The timecode: ONE drawtext expression, evaluated per frame, printing the
 * elapsed MM:SS capped at the total - the end frame reads the total, never
 * over. Inside `%{...}` drawtext wants `\:` and `\,`; the engine's textfile
 * path keeps them. Minutes are not folded into hours (the cap is 10:00).
 */
export declare function timecodeExpr(clipSec: number): string;
/** "00:30", "10:00" - both fields padded, exactly as the drawtext elapsed prints them. */
export declare function clockText(seconds: number): string;
/**
 * The largest 5-smooth number (2^a 3^b 5^c) at or below `n` - the wave child
 * renders on its own canvas, and a side that carries a large prime has no
 * divisor lattice, so placement degrades to exact and `latticeSmooth` fails.
 */
export declare function fiveSmoothDown(n: number): number;
export type AgRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export type AgFit = {
    text: string;
    px: number;
    width: number;
};
export type AudiogramLayout = {
    W: number;
    H: number;
    S: number;
    margin: number;
    clipSec: number;
    n: number;
    show: AgFit | null;
    showRect: AgRect;
    title: AgFit;
    titleRect: AgRect;
    cover: AgRect;
    initials: AgFit | null;
    quoteBar: AgRect | null;
    quoteLines: AgFit[];
    quoteRects: AgRect[];
    /** The child's canvas rect in the parent - both sides 5-smooth. */
    wave: AgRect;
    /** Child-local bar rects, one per amplitude, dropped onto the midline. */
    bars: AgRect[];
    /** The mirror below the midline - static, calm, one per bar. */
    refls: AgRect[];
    litAt: number[];
    timecodePx: number;
    timecodeWidth: number;
    timecodeRect: AgRect;
    total: AgFit;
    totalRect: AgRect;
    cta: AgFit | null;
    ctaRect: AgRect;
};
export type AudiogramOpts = {
    showName: string;
    episodeTitle: string;
    quote: string;
    cta: string;
    wave: number[];
    clipSec: number;
};
/**
 * The whole geometry as a pure function of the props and the canvas: header
 * (show, title), the media row (cover left, quote right) centred in the
 * band it gets, the wave band, the footer (timecode, total, CTA). The test
 * asserts the rects, the lit times and the fits without parsing m0.
 */
export declare function layoutAudiogram(opts: AudiogramOpts, W: number, H: number): AudiogramLayout;
/** The first letters of the first two words that start with an ASCII letter or digit. */
export declare function initialsOf(showName: string): string;
/**
 * What the geometry promises. Every fitted text is measured; the timecode is
 * measured against the widest string its expression prints (already widened
 * for the system font); the wave and the footer hold their bands. The parent
 * "wave" source carries no constraint: the checker flattens through the
 * child and replaces it with the bars themselves.
 */
export declare function audiogramContract(L: AudiogramLayout): LayoutConstraint[];
export declare const EpisodeAudiogramV1: import("@m0saic/types").MosaicTemplate<EpisodeAudiogramProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default EpisodeAudiogramV1;
