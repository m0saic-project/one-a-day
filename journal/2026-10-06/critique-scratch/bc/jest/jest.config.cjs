const path = require("path");
const { createDefaultPreset } = require("ts-jest");
module.exports = {
  rootDir: path.resolve(__dirname, "../../../../.."),
  testEnvironment: "node",
  transform: { ...createDefaultPreset({ tsconfig: path.join(__dirname, "tsconfig.json") }).transform },
  testMatch: [path.join(__dirname, "**/*.test.ts").split(path.sep).join("/")],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
