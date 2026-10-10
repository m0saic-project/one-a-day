import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createGoLimitWatcher, credentialedProviders } from "./opencode.mjs";

test("credentialedProviders: the provider ids in auth.json, none when the file is missing or broken", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oc-auth-"));
  const file = path.join(dir, "auth.json");
  assert.deepEqual(credentialedProviders(file), []);
  fs.writeFileSync(file, "{not json");
  assert.deepEqual(credentialedProviders(file), []);
  fs.writeFileSync(file, JSON.stringify({ "opencode-go": { type: "api", key: "x" }, openrouter: { type: "api", key: "y" } }));
  assert.deepEqual(credentialedProviders(file), ["opencode-go", "openrouter"]);
});

test("createGoLimitWatcher: a limit-shaped error event is a hit with no reset time; other errors and parts are not", () => {
  const quiet = createGoLimitWatcher();
  quiet.onLine(JSON.stringify({ type: "error", error: { name: "UnknownError", data: { message: "Unexpected server error." } } }));
  quiet.onLine(JSON.stringify({ type: "text", part: { type: "text", text: "rate limit is a phrase in prose" } }));
  quiet.onLine("not json");
  assert.equal(quiet.finish().hit, false);
  assert.equal(quiet.finish().seen, false);

  const hit = createGoLimitWatcher();
  hit.onLine(JSON.stringify({ type: "error", error: { name: "APIError", data: { message: "Usage limit reached for kimi-k3 (5-hour)", statusCode: 429 } } }));
  const r = hit.finish();
  assert.equal(r.seen, true);
  assert.equal(r.hit, true);
  assert.equal(r.window, "five_hour");
  assert.equal(r.resetsAt, null);
  assert.match(r.message, /Usage limit reached/);
});
