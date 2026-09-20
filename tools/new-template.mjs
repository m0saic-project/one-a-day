#!/usr/bin/env node
/**
 * new-template — scaffold one template that passes every convention on the
 * first build, and wire it everywhere the repo expects.
 *
 *   node tools/new-template.mjs <pack>/<slug> [--title "Human Title"] [--description "One line."]
 *
 * Writes:
 *   src/<pack>/<slug>/v1/<slug>.ts        the template (typed props, bound
 *                                         text, fitted copy, deterministic) with
 *                                         its WHY spec + renderTutorial (the
 *                                         why-tutorial convention, src/_shared/why.ts),
 *                                         pre-filled from today's journal when
 *                                         ONE_A_DAY_DAY_DIR (or journal/<today>/) exists
 *   src/<pack>/<slug>/v1/<slug>.test.ts   locks bindings, floors, determinism
 * and appends a row to src/<pack>/registry.ts + the import / array entry /
 * `export *` in src/<pack>/index.ts. A NEW pack also gets registry.ts +
 * index.ts and is wired into src/repo.ts, src/template-registry.ts and
 * src/index.ts (and CURRICULUM.md, where one exists).
 *
 * The title is "<date> · <Title>" and the tags carry the date and the day
 * ("2026-09-20", "day-001"): hosts sort the grid by name or by first tag, so
 * the day is the ordinal (a repo that ships daily outgrows "NN ·" fast).
 *
 * Then: npm run build && npm run previews && npm run build && npm run verify
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith("--"));
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
if (!target || !/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test(target)) {
  console.error('usage: node tools/new-template.mjs <pack>/<slug> [--title "Human Title"] [--description "One line."]\n  pack and slug: lowercase, digits, dashes.');
  process.exit(2);
}
const [pack, slug] = target.split("/");
const pascal = (s) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const camel = (s) => { const p = pascal(s); return p[0].toLowerCase() + p.slice(1); };
const title = opt("--title") ?? slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
const description = opt("--description") ?? `${title}: describe the ONE concept this template teaches, in one line, for the Templates page.`;
const exportName = `${pascal(slug)}V1`;
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const write = (rel, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true }); fs.writeFileSync(path.join(ROOT, rel), s); touched.push(rel); };
const touched = [];

const repoId = /repoId:\s*asRepoId\("([^"]+)"\)/.exec(read("src/repo.ts"))?.[1];
if (!repoId) { console.error("new-template: could not read repoId from src/repo.ts"); process.exit(1); }
const ID = `${repoId}/${pack}/${slug}/v1`;
const STARTER = fs.existsSync(path.join(ROOT, "src/_shared/tutorial.ts"));
const packDir = `src/${pack}`;
const packExists = fs.existsSync(path.join(ROOT, packDir, "registry.ts"));
if (fs.existsSync(path.join(ROOT, packDir, slug))) { console.error(`new-template: ${packDir}/${slug} already exists`); process.exit(1); }

// The `harness` pack is internal fixtures (hidden, unnumbered): a day's
// template never lands there (the gate refuses it too).
const INTERNAL_PACKS = new Set(["harness"]);
if (INTERNAL_PACKS.has(pack)) { console.error(`new-template: ${pack}/ is the internal harness pack — a day's template goes in a public pack (see pipeline/config.json packs.vocabulary)`); process.exit(1); }

// ── the WHY skeleton: pre-filled from today's journal where it already knows ──
// The runner sets ONE_A_DAY_DAY_DIR / ONE_A_DAY_DATE; an interactive session
// gets journal/<today>/ when it exists. Anything the journal cannot supply is
// the placeholder the gate refuses, so an unfilled WHY cannot ship.
const PLACEHOLDER = "[fill me]";
const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; } };
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const DATE = process.env.ONE_A_DAY_DATE ?? todayIso();
const DAY_DIR = process.env.ONE_A_DAY_DAY_DIR ?? path.join(ROOT, "journal", DATE);
const dayState = readJson(path.join(DAY_DIR, "state.json")) ?? {};
const dayRun = readJson(path.join(DAY_DIR, "run.json")) ?? {};
const indexRows = (() => { const v = readJson(path.join(ROOT, "journal", "index.json")); return Array.isArray(v) ? v : []; })();
const dayNumber = (() => { const row = indexRows.find((r) => r.date === DATE); return row?.day ?? indexRows.filter((r) => r.date < DATE).length + 1; })();
const ascii = (v) => String(v).replace(/[^\x20-\x7e]/g, "?").replace(/\s+/g, " ").trim();
const WHY = {
  day: dayNumber,
  date: DATE,
  agent: ascii(dayRun.runner?.adapter ?? PLACEHOLDER),
  model: ascii(dayRun.model?.selfDeclared ?? PLACEHOLDER),
  id: ID,
  title,
  who: dayState.who ? ascii(dayState.who) : `${PLACEHOLDER} who has the problem, and where they were found`,
  problem: [dayState.useCase ? ascii(dayState.useCase) : `${PLACEHOLDER} what was observed, in the evidence's words`],
  sources: Array.isArray(dayState.sources) && dayState.sources.length ? dayState.sources.map(ascii).slice(0, 12) : [`https://example.com/${PLACEHOLDER.replace(/[^a-z]/g, "")}`],
  solution: [ascii(description)],
  usage: { command: `m0saic make ${ID} --template-repo . -w 1280 -h 720 -o out.png`, try: [] },
};
// timeline: the runner's trace so far (scout, plan, this build call) - the ship
// phase re-copies it once every phase has run. No trace = self-reported, and a
// placeholder phase name so the gate refuses an unfilled one.
const trace = readJson(path.join(DAY_DIR, "trace.json"));
if (trace && Array.isArray(trace.phases) && trace.phases.length) {
  const { timelineFromTrace } = await import(pathToFileURL(path.join(ROOT, "pipeline", "lib", "trace.mjs")).href);
  WHY.timeline = timelineFromTrace(trace);
} else {
  WHY.timeline = { source: "self-reported", phases: [{ name: `${PLACEHOLDER} scout`, startMs: 0, durMs: 0 }] };
}
const whyLiteral = JSON.stringify(WHY, null, 2);
// The display title carries the day it shipped; the tags make it sortable
// and searchable by date and by day number.
const DAY_TAG = `day-${String(dayNumber).padStart(3, "0")}`;
const DATED_TITLE = `${DATE} · ${title}`;
const TAGS = [pack, DATE, DAY_TAG];

// ── the template ──
const tutorialImport = STARTER ? `\nimport { lessonTutorial } from "../../../_shared/tutorial";\n` : "";
const tutorial = STARTER ? `
  renderTutorial: lessonTutorial({
    title: ${JSON.stringify(title)},
    lines: [
      "State the one concept this template teaches, in a sentence a reader can act on.",
      "Name the rule that bites - the thing that costs an afternoon when you get it wrong.",
    ],
    explore: [
      "Double-click the title on the preview - it is bound",
      "Change Page color - the backdrop follows",
    ],
  }),
` : "";
const templateTs = `import type {
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
  makeColorTile,
  placeInsetPieces,
  svgLabel,
  tag,
} from "@m0saic/template-utils";
import type { LayoutConstraint } from "@m0saic/template-utils";
import { TEXT_EM, textFitsAll, withLayoutIntent } from "../../../_shared/layout";
import { whyTutorial } from "../../../_shared/why";
import type { WhySpec } from "../../../_shared/why";
${tutorialImport}
/**
 * \`${ID}\` — one line on what it draws.
 *
 * ONE CONCEPT: the single idea, stated plainly.
 *
 * The rule that bites: the thing that will cost someone an afternoon.
 *
 * Scaffolded by tools/new-template.mjs — it passes every build-gate
 * convention as generated (typed props with defaults, a bound title,
 * fitted svg copy, deterministic geometry from ctx.target). Replace the
 * body; keep the shape.
 */

export type ${pascal(slug)}Props = {
  /** Headline - the rect that shows it is bound to it. */
  title?: string;
  /** Backdrop (#rrggbb). */
  pageColor?: string;
  /** Dev-only: check the layout contract and draw it over the card. */
  debugLayout?: boolean;
};

const ID = ${JSON.stringify(ID)};
const HEX = /^#[0-9a-fA-F]{6}$/;
const INK = "#eaeef2" as MosaicColor;
const DIM = "#9aa7b4" as MosaicColor;
const DEFAULT_TITLE = ${JSON.stringify(title)};

const propsSchema = definePropsSchema<${pascal(slug)}Props>({
  title: {
    type: "string",
    required: false,
    description: "Headline. The rect that shows it is bound to it, so Make's double-click edits it in place.",
    meta: { control: { placeholder: DEFAULT_TITLE }, ui: { label: "Title", order: 1 } },
  },
  pageColor: {
    type: "string",
    required: false,
    description: "Backdrop as #rrggbb.",
    meta: {
      constraints: { isColor: true },
      control: { colorPicker: true, defaultColor: "#1c2833" },
      ui: { label: "Page color", order: 2 },
    },
  },
  debugLayout: {
    type: "boolean",
    required: false,
    description: "Dev-only: check the layout contract (every text fits its box, the title sits in its band) and draw it over the card.",
    meta: { ui: { label: "Debug layout", order: 99 } },
  },
});

/**
 * What the geometry promises, as canvas-independent invariants against the
 * source labels - the layout contract (src/_shared/layout.ts). Every text
 * gets textFits with the bundled font's calibrated ruler (TEXT_EM.prose;
 * a template that measures the block itself uses textFitsMeasured, exact);
 * the chrome the design depends on gets a band. Only labels that rendered.
 */
function layoutContract(): LayoutConstraint[] {
  return [
    ...textFitsAll(["title", "caption"], { charWidthEm: TEXT_EM.prose }),
    { label: "title", within: { yFrac: [0.2, 0.6] }, minWidthFrac: 0.5 },
    { label: "caption", within: { yFrac: [0.5, 0.8] } },
  ];
}

/**
 * Why this template exists - rendered by \`renderTutorial\` (the why-tutorial
 * convention, src/_shared/why.ts): the run, the problem with the sources the
 * agent opened, the solution, how to use it, then the template itself.
 * Pre-filled from journal/${DATE}/ - replace every "${PLACEHOLDER}" and say it
 * in the evidence's own words. The build refuses a placeholder.
 */
const WHY: WhySpec = ${whyLiteral};

export const ${exportName} = defineMosaicTemplate<${pascal(slug)}Props>({
  id: asTemplateId(ID),
  label: ${JSON.stringify(DATED_TITLE)},
  version: 1,
  description: ${JSON.stringify(description)},
  capabilities: { tier: "core" },
  tags: ${JSON.stringify(TAGS)},

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
    title: DEFAULT_TITLE,
    pageColor: "#1c2833",
    debugLayout: false,
  },

  render,
  renderTutorial: whyTutorial(WHY, render),
${tutorial}});

export default ${exportName};

async function render(
  props: ${pascal(slug)}Props,
  ctx: MosaicEngineContext,
): Promise<MosaicDocument> {
    // The schema is documentation; render() is the gate.
    const title = props.title ?? DEFAULT_TITLE;
    if (typeof title !== "string") throw new Error(\`\${ID}: title must be a string.\`);
    if (props.pageColor !== undefined && !HEX.test(props.pageColor)) {
      throw new Error(\`\${ID}: pageColor \${JSON.stringify(props.pageColor)} must be #rrggbb.\`);
    }
    const page = (props.pageColor ?? "#1c2833") as MosaicColor;
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

    // Backdrop - the whole canvas, painted first.
    piece(px(0, 0, 1, 1), 0, makeColorTile(page));

    // The title rect is BOUND to the prop it shows (bind what you display).
    const head = px(0.06, 0.3, 0.88, 0.2);
    // Every text source is TAGGED (editor.label) so the layout contract can find it.
    piece(head, 2, bindProp(tag(svgLabel(title || " ", head.w, head.h, { maxPx: Math.round(H * 0.08), maxLines: 1, color: INK }), "title"), "title"));

    // Static caption - not a prop, so nothing to bind.
    const cap = px(0.06, 0.6, 0.88, 0.08);
    piece(cap, 2, tag(svgLabel("replace this scaffold with the one thing this template teaches", cap.w, cap.h, { maxPx: Math.round(H * 0.026), maxLines: 1, color: DIM }), "caption"));

    const placed = placeInsetPieces({ rootW: W, rootH: H, pieces });
    const doc: MosaicDocument = {
      kind: "mosaic_document",
      version: 1,
      m0: toM0String(placed.m0, ID),
      assets: {},
      backgroundColor: page,
      sources: placed.sources,
    };
    return withLayoutIntent(doc, ctx, { templateId: ID, constraints: layoutContract(), debug: props.debugLayout === true });
}
`;

const testTs = `import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { ${exportName} } from "./${slug}";

const render = (
  props: Parameters<typeof ${exportName}.render>[0] = {},
  w = 1280,
  h = 720,
) => ${exportName}.render({ ...${exportName}.defaultProps, ...props }, targetCtx(w, h)).then(asDocument);

describe(${JSON.stringify(ID)}, () => {
  it("binds the title rect to the title prop - Make's double-click edits it in place", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1280, 720, { propsSchema: ${exportName}.propsSchema });
    expect(rejected).toEqual([]);
    expect(byProp.title).toHaveLength(1);
  });

  it("clears its safe minimum at its own hint", async () => {
    const ev = evaluateM0(String((await render()).m0), { width: 1280, height: 720 });
    expect(ev.feasible && ev.meetsPrecision).toBe(true);
  });

  it("keeps its layout contract at the seven contract canvases - defaults, a long title, an empty one", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const over of [{}, { title: "A title long enough to have to shrink before it fits the band on a narrow canvas" }, { title: "" }]) {
      await sweepLayout((p, ctx) => ${exportName}.render(p, ctx).then(asDocument), ${JSON.stringify(ID)}, { ...${exportName}.defaultProps, ...over }, (w, h) => targetCtx(w, h));
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("is deterministic and rejects a bad colour", async () => {
    expect(await render()).toEqual(await render());
    await expect(render({ pageColor: "red" })).rejects.toThrow(/#rrggbb/);
  });
});
`;
write(`${packDir}/${slug}/v1/${slug}.ts`, templateTs);
write(`${packDir}/${slug}/v1/${slug}.test.ts`, testTs);

// ── registry row ──
const row = `  {
    slug: ${JSON.stringify(slug)},
    templateId: ${JSON.stringify(ID)},
    exportName: ${JSON.stringify(exportName)},
    title: ${JSON.stringify(DATED_TITLE)},
    description:
      ${JSON.stringify(description)},
    tags: ${JSON.stringify(TAGS)},
  },
`;
const registryVar = `${camel(pack)}Registry`;
const templatesVar = `${camel(pack)}Templates`;
if (packExists) {
  const rel = `${packDir}/registry.ts`;
  const s = read(rel);
  const i = s.lastIndexOf("];");
  if (i < 0) { console.error(`new-template: ${rel} has no closing ];`); process.exit(1); }
  write(rel, s.slice(0, i) + row + s.slice(i));
  const irel = `${packDir}/index.ts`;
  let idx = read(irel);
  const importLine = `import { ${exportName} } from "./${slug}/v1/${slug}";\n`;
  const lastImport = idx.lastIndexOf("\nimport {");
  const lastImportEnd = idx.indexOf("\n", idx.indexOf(";", lastImport)) + 1;
  idx = idx.slice(0, lastImportEnd) + importLine + idx.slice(lastImportEnd);
  const arr = idx.indexOf(`export const ${templatesVar}`);
  const close = idx.indexOf("];", arr);
  idx = idx.slice(0, close) + `  ${exportName} as unknown as MosaicTemplate<MosaicTemplateProps>,\n` + idx.slice(close);
  idx = idx.trimEnd() + `\nexport * from "./${slug}/v1/${slug}";\n`;
  write(irel, idx);
} else {
  write(`${packDir}/registry.ts`, `import type { StarterRegistryEntry } from "../registry-types";

/**
 * ${STARTER ? "Chapter" : "Pack"} registry: \`${pack}\` — array order is the ${STARTER ? "teaching" : "display"} order.
 */
export const ${registryVar}: StarterRegistryEntry[] = [
${row}];
`);
  write(`${packDir}/index.ts`, `import type { MosaicTemplate, MosaicTemplateProps } from "@m0saic/types";

import { ${exportName} } from "./${slug}/v1/${slug}";

/** ${STARTER ? "Chapter" : "Pack"} \`${pack}\`, in registry order (mirrors ./registry.ts). */
export const ${templatesVar}: MosaicTemplate<MosaicTemplateProps>[] = [
  ${exportName} as unknown as MosaicTemplate<MosaicTemplateProps>,
];

// \`export *\` ONLY — see the note in src/index.ts.
export * from "./${slug}/v1/${slug}";
`);
  // repo.ts pack descriptor
  let repo = read("src/repo.ts");
  const packsClose = repo.indexOf("];", repo.indexOf("TEMPLATE_PACKS"));
  repo = repo.slice(0, packsClose) + `  {
    id: ${JSON.stringify(pack)},
    title: ${JSON.stringify(pascal(pack).replace(/([A-Z])/g, " $1").trim())},
    description:
      ${JSON.stringify(`${pascal(pack)}: one line on what this pack teaches.`)},
  },
` + repo.slice(packsClose);
  write("src/repo.ts", repo);
  // template-registry.ts
  let tr = read("src/template-registry.ts");
  const lastReg = tr.lastIndexOf('/registry";');
  const lastRegEnd = tr.indexOf("\n", lastReg) + 1;
  tr = tr.slice(0, lastRegEnd) + `import { ${registryVar} } from "./${pack}/registry";\n` + tr.slice(lastRegEnd);
  const chClose = tr.indexOf("];", tr.indexOf("CHAPTERS"));
  tr = tr.slice(0, chClose) + `  { pack: ${JSON.stringify(pack)}, entries: ${registryVar} },\n` + tr.slice(chClose);
  write("src/template-registry.ts", tr);
  // src/index.ts
  let ix = read("src/index.ts");
  const lastTplImport = ix.lastIndexOf('Templates } from "./');
  const lastTplImportEnd = ix.indexOf("\n", lastTplImport) + 1;
  ix = ix.slice(0, lastTplImportEnd) + `import { ${templatesVar} } from "./${pack}";\n` + ix.slice(lastTplImportEnd);
  const arrClose = ix.indexOf("];", ix.indexOf("export const templates"));
  ix = ix.slice(0, arrClose) + `  ...${templatesVar},\n` + ix.slice(arrClose);
  const lastExport = ix.lastIndexOf('export * from "./');
  const lastExportEnd = ix.indexOf("\n", lastExport) + 1;
  ix = ix.slice(0, lastExportEnd) + `export * from "./${pack}";\n` + ix.slice(lastExportEnd);
  write("src/index.ts", ix);
  // CURRICULUM.md (starter): the dep policy lints for a `## <pack>` heading
  if (fs.existsSync(path.join(ROOT, "CURRICULUM.md"))) {
    let cur = read("CURRICULUM.md");
    const section = `## ${pack}\n\nWhat this chapter teaches, in a paragraph.\n\n| # | Template | id |\n|---|---|---|\n| ${DATE} | ${title} | \`${pack}/${slug}/v1\` |\n`;
    const anchor = "\n---\n\n## What is not here yet\n";
    cur = cur.includes(anchor) ? cur.replace(anchor, `\n${section}${anchor}`) : cur.trimEnd() + `\n\n${section}`;
    write("CURRICULUM.md", cur);
  }
}
if (STARTER && packExists) {
  // append the CURRICULUM row to the chapter's table
  const rel = "CURRICULUM.md";
  if (fs.existsSync(path.join(ROOT, rel))) {
    const cur = read(rel);
    const h = cur.indexOf(`\n## ${pack}\n`);
    if (h >= 0) {
      const tableEnd = (() => { let i = cur.indexOf("\n|", h); let last = -1; while (i >= 0 && i < (cur.indexOf("\n## ", h + 1) < 0 ? cur.length : cur.indexOf("\n## ", h + 1))) { last = i; i = cur.indexOf("\n|", i + 1); } return last; })();
      if (tableEnd >= 0) {
        const lineEnd = cur.indexOf("\n", tableEnd + 1);
        write(rel, cur.slice(0, lineEnd) + `\n| ${DATE} | ${title} | \`${pack}/${slug}/v1\` |` + cur.slice(lineEnd));
      }
    }
  }
}

console.log(`new-template: ${ID}  (${DATED_TITLE})`);
for (const f of touched) console.log(`  ${fs.existsSync(path.join(ROOT, f)) ? "wrote" : "?"}  ${f}`);
console.log("\nNext:\n  npm run build && npm run previews && npm run build && npm run fingerprints:update && npm run verify\n  then edit " + `${packDir}/${slug}/v1/${slug}.ts` + " — the header comment is the lesson; " + `${slug}.layout.m0` + " beside it is the layout fingerprint;\n  fill WHY (the why-tutorial: who, the observed problem, its sources, the solution, how to use it) — the build refuses a " + PLACEHOLDER + ".");
