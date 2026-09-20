/**
 * `@one-a-day/basics/hello-world/v1` — this repo's FRONT DOOR, and its one
 * human-placed template.
 *
 * The canonical m0saic hello-world card (`defineHelloWorldTemplate` from
 * `@m0saic/template-utils`) with ONE substitution, the same one the official
 * community repo's front door makes: the mark is a rendered PNG of the
 * brand M's 33 tiles. There, every tile is a contributor. Here, every tile is
 * a ROBOT — a different face per tile, generated deterministically
 * (tools/robot-faces.mjs) and baked into `assets/one-a-day-m.png` by
 * `npm run bake:mark`. The robots are the agents that write this repo.
 *
 * FALLBACK IS THE POINT. The asset is an override, not a dependency: when it
 * is missing the probe below passes `undefined` and the card renders the
 * brand M exactly as the core template does. The probe tests the
 * asar-translated path (`bundledAssetPath`) — inside a packaged Electron app
 * `existsSync` is true for an in-asar path that ffmpeg then cannot open.
 *
 * The convention (`repo.helloWorld` in src/repo.ts names this id): the
 * subline is ONE string, `TEMPLATE_REPO.displayName`.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { bundledAssetPath } from "@m0saic/template-utils/dist/m0saic/assetPath";
import type { HelloWorldMarkImage, HelloWorldProps } from "@m0saic/template-utils";
import {
  HELLO_WORLD_PROPS_SCHEMA,
  defineHelloWorldTemplate,
  defineMosaicTemplate,
} from "@m0saic/template-utils";
import { asTemplateId } from "@m0saic/types";
import { TEMPLATE_REPO } from "../../../repo";

export const HELLO_WORLD_ID = "@one-a-day/basics/hello-world/v1";

/** The one asset, re-baked only when a human wants new robots. */
export const ROBOT_M_ASSET = "one-a-day-m.png";

/** Absolute, asar-translated path to the baked robot M. */
export const ROBOT_M_PATH: string = bundledAssetPath(resolve(__dirname, "assets"), ROBOT_M_ASSET);

/** Present when the bake ran — else the brand M. */
export const ROBOT_M_AVAILABLE: boolean = existsSync(ROBOT_M_PATH);

/** The mark override, or undefined to fall back to the brand M. */
export const robotMark: HelloWorldMarkImage | undefined = ROBOT_M_AVAILABLE
  ? { path: ROBOT_M_PATH, assetId: "one_a_day_m" }
  : undefined;

/** The canonical card, built by the factory. */
const card = defineHelloWorldTemplate({
  id: HELLO_WORLD_ID,
  label: "01 · Hello World",
  // The subline — the muted line under the greeting. One string, one edit.
  subline: `by ${TEMPLATE_REPO.displayName}`,
  tags: ["basics", "starter", "brand", "hello", "robots"],
  description:
    "The canonical m0saic hello-world card with this repo's mark: the brand field wipes in, a navy card rises, the M appears as 33 robot faces — the agents that write this repo — then the wordmark and the greeting. The front door: what `m0saic hello-world --template-repo .` renders. Template 01; every template after it is one day of the agent's work.",
  ...(robotMark ? { mark: robotMark } : {}),
});

// Spelled out as a literal (not just `card`) on purpose: the repo's
// NO-INSTALL contract check (`npm run test:contract`) loads this module with
// the whole substrate stubbed to an identity proxy, so a factory call alone
// would read as an options bag. The structural fields it asserts — a numeric
// version, a render() function, a props schema — live HERE; with the real
// substrate installed they are exactly the factory's own.
export const HelloWorldV1 = defineMosaicTemplate<HelloWorldProps>({
  ...card,
  id: asTemplateId(HELLO_WORLD_ID),
  version: 1,
  propsSchema: { ...HELLO_WORLD_PROPS_SCHEMA },
  defaultProps: { ...card.defaultProps },
  render: (props, ctx) => card.render(props, ctx),
});

export default HelloWorldV1;
