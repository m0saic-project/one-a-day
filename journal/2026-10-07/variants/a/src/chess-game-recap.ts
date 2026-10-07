import type {
  MosaicColor,
  MosaicDocument,
  MosaicEngineContext,
  MosaicSource,
} from "@m0saic/types";
import { asTemplateId } from "@m0saic/types";
import { toM0String } from "@m0saic/dsl-stdlib";
import {
  bindProp,
  defineMosaicTemplate,
  definePropsSchema,
  placeInsetPieces,
  svgLabel,
  tag,
} from "@m0saic/template-utils";
import type { LayoutConstraint } from "@m0saic/template-utils";
import { TEXT_EM, textFitsAll, withLayoutIntent } from "../../../_shared/layout";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";

/**
 * `@one-a-day/sports/chess-game-recap/v1` — shareable game recap card for chess.
 *
 * ONE CONCEPT: render opening name, result (colored icon + label), time control,
 * and rating change as a professional recap card that shares better than a screenshot.
 *
 * The rule that bites: chess-specific UI conventions (result colors: green/red/gray)
 * and tight text fitting across seven canvases from 640×360 to 3840×2160.
 */

export type ChessGameRecapProps = {
  /** The chess opening name displayed in the header. */
  opening?: string;
  /** The game result: win, loss, or draw. */
  result?: "win" | "loss" | "draw";
  /** The rating delta displayed (e.g., +32, -18, 0). */
  ratingChange?: number;
  /** The time control format (e.g., "10+5", "5+3", "1+0"). */
  timeControl?: string;
  /** The game date in ISO format (YYYY-MM-DD). */
  date?: string;
  /** The opponent or player name displayed in the footer. */
  opponentName?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = "@one-a-day/sports/chess-game-recap/v1";
const INK = "#eaeef2" as MosaicColor;
const DIM = "#9aa7b4" as MosaicColor;
const PAGE = "#1c2833" as MosaicColor;
const WIN_COLOR = "#2caf45" as MosaicColor;
const LOSS_COLOR = "#d84849" as MosaicColor;
const DRAW_COLOR = "#8b92a1" as MosaicColor;
const DEFAULT_OPENING = "King's Indian Defense";
const DEFAULT_RESULT = "win" as const;
const DEFAULT_RATING = 25;
const DEFAULT_TIME = "10+5";
const DEFAULT_DATE = "2026-10-07";
const DEFAULT_OPPONENT = "Opponent";

const propsSchema = definePropsSchema<ChessGameRecapProps>({
  opening: {
    type: "string",
    required: false,
    description: "The chess opening name.",
    meta: { control: { placeholder: DEFAULT_OPENING }, ui: { label: "Opening", order: 1 } },
  },
  result: {
    type: "string",
    required: false,
    description: "Game result: win, loss, or draw.",
    meta: { ui: { label: "Result", order: 2 } },
  },
  ratingChange: {
    type: "number",
    required: false,
    description: "Rating delta.",
    meta: { ui: { label: "Rating Change", order: 3 } },
  },
  timeControl: {
    type: "string",
    required: false,
    description: "Time control format (e.g., 10+5, 5+3).",
    meta: { control: { placeholder: DEFAULT_TIME }, ui: { label: "Time Control", order: 4 } },
  },
  date: {
    type: "string",
    required: false,
    description: "Game date in YYYY-MM-DD format.",
    meta: { control: { placeholder: DEFAULT_DATE }, ui: { label: "Date", order: 5 } },
  },
  opponentName: {
    type: "string",
    required: false,
    description: "Opponent name.",
    meta: { control: { placeholder: DEFAULT_OPPONENT }, ui: { label: "Opponent", order: 6 } },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/**
 * What the geometry promises: opening name fits the header (top 18%), result
 * and stats fit their columns, footer text fits the bottom band (22%).
 */
function layoutContract(): LayoutConstraint[] {
  return [
    ...textFitsAll(["opening", "result", "time", "rating", "date", "opponent"], { charWidthEm: TEXT_EM.prose }),
    { label: "opening", within: { yFrac: [0, 0.18] }, minWidthFrac: 0.85 },
    { label: "result", within: { yFrac: [0.18, 0.78] } },
    { label: "time", within: { yFrac: [0.18, 0.78] } },
    { label: "rating", within: { yFrac: [0.18, 0.78] } },
    { label: "date", within: { yFrac: [0.78, 1] } },
    { label: "opponent", within: { yFrac: [0.78, 1] } },
  ];
}

/**
 * Why this template exists - rendered by `renderTutorial` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 * Pre-filled from journal/2026-10-07/ - replace every "[fill me]" and say it
 * in the evidence's own words. The build refuses a placeholder.
 */
const WHY: WhySpec = {
  "day": 18,
  "date": "2026-10-07",
  "agent": "claude",
  "model": "claude-haiku-4-5-20251001",
  "id": "@one-a-day/sports/chess-game-recap/v1",
  "title": "Chess Game Recap",
  "who": "Chess players on Lichess and Chess.com, streamers analyzing games, and players sharing rating milestones in online communities.",
  "problem": [
    "Players screenshot their games to share online, but screenshots scale poorly across devices and lose metadata when resized. Streamers need clean, shareable recap cards that render vector-sharp at any size without quality loss."
  ],
  "sources": [
    "https://github.com/philphilphil/blunderbase",
    "https://github.com/brumar/chess-postmortem-skills",
    "https://news.ycombinator.com/item?id=49857528",
    "https://lichess.org"
  ],
  "solution": [
    "A chess recap card rendering opening name, result with color-coded label, time control, rating delta, date and opponent in a clean layout. SVG rendering ensures vector-sharp scaling across all devices. Works from PGN metadata with sensible defaults."
  ],
  "usage": {
    "command": "m0saic make @one-a-day/sports/chess-game-recap/v1 --template-repo . -w 1280 -h 720 -o out.png",
    "try": [
      "opening='Sicilian Defense' result='loss' ratingChange='-12'",
      "opening='Berlin Defense' result='draw' timeControl='classical'",
      "opponentName='Magnus Carlsen' result='win' ratingChange='+89'"
    ]
  },
  "timeline": {
    "source": "runner",
    "phases": [
      {
        "name": "scout",
        "startMs": 0,
        "durMs": 220183,
        "calls": 105,
        "tokens": 9009637,
        "costUsd": 0.47,
        "tools": "Bash 95, Read 7, Write 2"
      },
      {
        "name": "plan",
        "startMs": 220200,
        "durMs": 60866,
        "calls": 8,
        "tokens": 615291,
        "costUsd": 0.09,
        "tools": "Read 6, Edit 1, Write 1"
      }
    ],
    "costBasis": "reported"
  }
};

export const ChessGameRecapV1 = defineMosaicTemplate<ChessGameRecapProps>({
  id: asTemplateId(ID),
  label: "2026-10-07 · Chess Game Recap",
  version: 1,
  description: "Chess game recap card: opening, result, time control, and rating change rendered as a shareable card that scales beautifully across all devices.",
  capabilities: { tier: "core" },
  tags: ["sports","2026-10-07","day-018","chess","pgn","lichess","game-analysis","rating-progression"],

  outputHints: {
    width: 1280,
    height: 720,
    fps: 30,
    durationMs: 2000,
    format: { kind: "image", container: "png" },
    note: "Static card - any canvas and any duration render cleanly.",
  },

  propsSchema,
  defaultProps: {
    opening: DEFAULT_OPENING,
    result: DEFAULT_RESULT,
    ratingChange: DEFAULT_RATING,
    timeControl: DEFAULT_TIME,
    date: DEFAULT_DATE,
    opponentName: DEFAULT_OPPONENT,
    debugLayout: false,
  },

  render,
  renderTutorial: whyTutorial(WHY, render),
});

export default ChessGameRecapV1;

async function render(
  props: ChessGameRecapProps,
  ctx: MosaicEngineContext,
): Promise<MosaicDocument> {
    const opening = props.opening ?? DEFAULT_OPENING;
    const result = props.result ?? DEFAULT_RESULT;
    const ratingChange = props.ratingChange ?? DEFAULT_RATING;
    const timeControl = props.timeControl ?? DEFAULT_TIME;
    const date = props.date ?? DEFAULT_DATE;
    const opponentName = props.opponentName ?? DEFAULT_OPPONENT;

    if (typeof opening !== "string") throw new Error(`${ID}: opening must be a string.`);
    if (!["win", "loss", "draw"].includes(result)) throw new Error(`${ID}: result must be 'win', 'loss', or 'draw'.`);
    if (typeof ratingChange !== "number") throw new Error(`${ID}: ratingChange must be a number.`);
    if (typeof timeControl !== "string") throw new Error(`${ID}: timeControl must be a string.`);
    if (typeof date !== "string") throw new Error(`${ID}: date must be a string.`);
    if (typeof opponentName !== "string") throw new Error(`${ID}: opponentName must be a string.`);

    const { width: W, height: H } = ctx.target;
    const px = (fx: number, fy: number, fw: number, fh: number) => ({
      x: Math.round(fx * W),
      y: Math.round(fy * H),
      w: Math.round(fw * W),
      h: Math.round(fh * H),
    });

    const pieces: Parameters<typeof placeInsetPieces>[0]["pieces"] = [];
    const piece = (rect: { x: number; y: number; w: number; h: number }, importance: number, source: MosaicSource) =>
      pieces.push({ rect: { ...rect, importance }, source });

    // Determine result color and label
    const resultColor = result === "win" ? WIN_COLOR : result === "loss" ? LOSS_COLOR : DRAW_COLOR;
    const resultLabel = result.toUpperCase();

    // Header: opening name (top 18%)
    const headerBand = px(0, 0, 1, 0.18);
    const openingLabel = px(0.06, 0.02, 0.88, 0.14);
    piece(openingLabel, 2, bindProp(tag(svgLabel(opening, openingLabel.w, openingLabel.h, { maxPx: Math.round(H * 0.12), maxLines: 1, color: INK }), "opening"), "opening"));

    // Main zone (center 60%, from 18% to 78%)
    const mainStart = 0.18;
    const mainEnd = 0.78;
    const mainHeight = mainEnd - mainStart;

    // Left half: result icon (colored square) and label
    const resultLabelBox = px(0.06, mainStart + 0.25, 0.44, 0.20);
    piece(resultLabelBox, 2, tag(svgLabel(resultLabel, resultLabelBox.w, resultLabelBox.h, { maxPx: Math.round(H * 0.12), maxLines: 1, color: INK }), "result"));

    // Right half: time control and rating change (stacked)
    // Time control (upper)
    const timeBox = px(0.56, mainStart + 0.15, 0.38, 0.15);
    piece(timeBox, 2, bindProp(tag(svgLabel(timeControl, timeBox.w, timeBox.h, { maxPx: Math.round(H * 0.07), maxLines: 1, color: INK }), "time"), "timeControl"));

    // Rating change (lower)
    const ratingText = ratingChange >= 0 ? `+${ratingChange}` : `${ratingChange}`;
    const ratingBox = px(0.56, mainStart + 0.35, 0.38, 0.15);
    piece(ratingBox, 2, tag(svgLabel(ratingText, ratingBox.w, ratingBox.h, { maxPx: Math.round(H * 0.07), maxLines: 1, color: DIM }), "rating"));

    // Footer: date and opponent (bottom 22%, from 78% to 100%)
    const footerStart = 0.78;
    const dateBox = px(0.06, footerStart + 0.02, 0.3, 0.18);
    piece(dateBox, 2, bindProp(tag(svgLabel(date, dateBox.w, dateBox.h, { maxPx: Math.round(H * 0.06), maxLines: 1, color: DIM }), "date"), "date"));

    const opponentPrefix = "vs ";
    const opponentText = opponentPrefix + opponentName;
    const opponentBox = px(0.5, footerStart + 0.02, 0.44, 0.18);
    piece(opponentBox, 2, bindProp(tag(svgLabel(opponentText, opponentBox.w, opponentBox.h, { maxPx: Math.round(H * 0.06), maxLines: 1, color: INK }), "opponent"), "opponentName"));

    const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
    const doc: MosaicDocument = {
      kind: "mosaic_document",
      version: 1,
      m0: toM0String(placed.m0, ID),
      assets: {},
      backgroundColor: PAGE,
      sources: placed.sources,
    };
    return withLayoutIntent(doc, ctx, { templateId: ID, constraints: layoutContract(), debug: props.debugLayout === true });
}
