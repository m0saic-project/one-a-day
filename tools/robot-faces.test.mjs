import test from "node:test";
import assert from "node:assert/strict";
import { hashSeed, robotFaceSvg, robotFaces, svgDataUri } from "./robot-faces.mjs";

test("faces are deterministic per (seed, index) and differ across indexes", () => {
  assert.equal(robotFaceSvg(3), robotFaceSvg(3));
  assert.notEqual(robotFaceSvg(3), robotFaceSvg(4));
  assert.notEqual(robotFaceSvg(3, "a"), robotFaceSvg(3, "b"));
  assert.equal(hashSeed("one-a-day"), hashSeed("one-a-day"));
});

test("33 faces are 33 distinct, well-formed SVG documents", () => {
  const faces = robotFaces(33);
  assert.equal(faces.length, 33);
  assert.equal(new Set(faces).size, 33);
  for (const f of faces) {
    assert.match(f, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 100 100"/);
    assert.match(f, /<\/svg>$/);
    assert.ok(f.includes("<rect") && f.includes("stroke-width=\"3\""), "every face has a head plate");
  }
  assert.deepEqual(robotFaces(33), faces, "the set is reproducible");
});

test("data URIs are URL-encoded plain SVG (no base64, no ;utf8 param — the engine's parser rule)", () => {
  const uri = svgDataUri(robotFaceSvg(0));
  assert.match(uri, /^data:image\/svg\+xml,%3Csvg/);
  assert.ok(!uri.includes(";base64") && !uri.includes(";utf8"));
});
