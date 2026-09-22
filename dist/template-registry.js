"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateRegistry = exports.CHAPTERS = void 0;
const registry_1 = require("./basics/registry");
const registry_2 = require("./harness/registry");
const registry_3 = require("./dev/registry");
const registry_4 = require("./social/registry");
/**
 * Every template, chapter by chapter. Array order is display order — the
 * manifest generator flattens this verbatim into template-manifest.json
 * and asserts it agrees exactly with what src/index.ts exports.
 */
exports.CHAPTERS = [
    { pack: "basics", entries: registry_1.basicsRegistry },
    { pack: "harness", entries: registry_2.harnessRegistry },
    { pack: "dev", entries: registry_3.devRegistry },
    { pack: "social", entries: registry_4.socialRegistry },
];
/** Flat view over every chapter, in order. */
exports.templateRegistry = exports.CHAPTERS.flatMap((chapter) => chapter.entries);
