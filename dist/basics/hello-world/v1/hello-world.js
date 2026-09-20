"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelloWorldV1 = exports.robotMark = exports.ROBOT_M_AVAILABLE = exports.ROBOT_M_PATH = exports.ROBOT_M_ASSET = exports.HELLO_WORLD_ID = void 0;
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
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const assetPath_1 = require("@m0saic/template-utils/dist/m0saic/assetPath");
const template_utils_1 = require("@m0saic/template-utils");
const types_1 = require("@m0saic/types");
const repo_1 = require("../../../repo");
exports.HELLO_WORLD_ID = "@one-a-day/basics/hello-world/v1";
/** The one asset, re-baked only when a human wants new robots. */
exports.ROBOT_M_ASSET = "one-a-day-m.png";
/** Absolute, asar-translated path to the baked robot M. */
exports.ROBOT_M_PATH = (0, assetPath_1.bundledAssetPath)((0, node_path_1.resolve)(__dirname, "assets"), exports.ROBOT_M_ASSET);
/** Present when the bake ran — else the brand M. */
exports.ROBOT_M_AVAILABLE = (0, node_fs_1.existsSync)(exports.ROBOT_M_PATH);
/** The mark override, or undefined to fall back to the brand M. */
exports.robotMark = exports.ROBOT_M_AVAILABLE
    ? { path: exports.ROBOT_M_PATH, assetId: "one_a_day_m" }
    : undefined;
/** The canonical card, built by the factory. */
const card = (0, template_utils_1.defineHelloWorldTemplate)({
    id: exports.HELLO_WORLD_ID,
    label: "01 · Hello World",
    // The subline — the muted line under the greeting. One string, one edit.
    subline: `by ${repo_1.TEMPLATE_REPO.displayName}`,
    tags: ["basics", "starter", "brand", "hello", "robots"],
    description: "The canonical m0saic hello-world card with this repo's mark: the brand field wipes in, a navy card rises, the M appears as 33 robot faces — the agents that write this repo — then the wordmark and the greeting. The front door: what `m0saic hello-world --template-repo .` renders. Template 01; every template after it is one day of the agent's work.",
    ...(exports.robotMark ? { mark: exports.robotMark } : {}),
});
// Spelled out as a literal (not just `card`) on purpose: the repo's
// NO-INSTALL contract check (`npm run test:contract`) loads this module with
// the whole substrate stubbed to an identity proxy, so a factory call alone
// would read as an options bag. The structural fields it asserts — a numeric
// version, a render() function, a props schema — live HERE; with the real
// substrate installed they are exactly the factory's own.
exports.HelloWorldV1 = (0, template_utils_1.defineMosaicTemplate)({
    ...card,
    id: (0, types_1.asTemplateId)(exports.HELLO_WORLD_ID),
    version: 1,
    propsSchema: { ...template_utils_1.HELLO_WORLD_PROPS_SCHEMA },
    defaultProps: { ...card.defaultProps },
    render: (props, ctx) => card.render(props, ctx),
});
exports.default = exports.HelloWorldV1;
