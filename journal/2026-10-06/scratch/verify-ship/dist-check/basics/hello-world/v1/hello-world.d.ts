import type { HelloWorldMarkImage, HelloWorldProps } from "@m0saic/template-utils";
export declare const HELLO_WORLD_ID = "@one-a-day/basics/hello-world/v1";
/** The one asset, re-baked only when a human wants new robots. */
export declare const ROBOT_M_ASSET = "one-a-day-m.png";
/** Absolute, asar-translated path to the baked robot M. */
export declare const ROBOT_M_PATH: string;
/** Present when the bake ran — else the brand M. */
export declare const ROBOT_M_AVAILABLE: boolean;
/** The mark override, or undefined to fall back to the brand M. */
export declare const robotMark: HelloWorldMarkImage | undefined;
export declare const HelloWorldV1: import("@m0saic/types").MosaicTemplate<HelloWorldProps, import("@m0saic/types").MosaicTemplateOutputs, import("@m0saic/types").MosaicTemplateUpstreamVariables, import("@m0saic/types").MosaicTemplateUpstreamData, import("@m0saic/types").MosaicTemplateSidecars>;
export default HelloWorldV1;
