// Transpile a variant snapshot's TS source to CJS in this scratch dir, pointing _shared at dist/_shared.
const ts = require("typescript");
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "../../../..");
for (const v of ["a", "b", "c"]) {
  const src = fs.readFileSync(path.join(root, "journal/2026-10-06/variants", v, "src/weekly-run-report.ts"), "utf8");
  let out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const shared = path.join(root, "dist/_shared").split(path.sep).join("/");
  out = out.split('require("../../../_shared/layout")').join(`require("${shared}/layout.js")`);
  out = out.split('require("../../../_shared/text")').join(`require("${shared}/text.js")`);
  out = out.split('require("../../../_shared/why")').join(`require("${shared}/why.js")`);
  fs.mkdirSync(path.join(__dirname, v), { recursive: true });
  fs.writeFileSync(path.join(__dirname, v, "wrr.js"), out);
  console.log(v, out.length);
}
