#!/usr/bin/env node
/**
 * gen-gallery — TEMPLATES.md, the repo's directory page.
 *
 * A clone has `template-manifest.json` for hosts and `journal/` for the
 * story, but nothing a person can scroll on GitHub to see what the repo
 * holds. This writes that page from what is already committed: one row per
 * template with its browse-card preview, its id, its one-line description
 * and links to its source folder and the journal of the day that made it.
 * Newest first, one section per month, so the page stays usable as the days
 * add up.
 *
 * Runs in `npm run build` right after the manifest is written, so the page
 * can never describe a template the manifest does not. It is GENERATED: a
 * hand edit is overwritten by the next build, and the daily gate treats it
 * like `template-manifest.json` (pipeline/lib/git.mjs).
 *
 * Sources, all in the tree (no network, no clock - the same tree writes the
 * same bytes):
 *   template-manifest.json            title, description, tags, pack, preview
 *   dist/index.js                     outputHints (still or clip, hinted size), `internal`
 *   journal/<date>/run.json           which agent ran the day, and the model it declared
 *                                     (journal/<date>/vN/run.json for a founder-directed vN)
 *   assets/templates/<key>/preview.*  the thumbnail's pixel size (PNG header)
 *
 * GitHub does not play a repo-relative .mp4 inline, so a video template
 * shows its preview still and, where a clip asset exists, links to it.
 *
 *   node tools/gen-gallery.mjs            write TEMPLATES.md
 *   node tools/gen-gallery.mjs --check    exit 1 if TEMPLATES.md is stale (writes nothing)
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { recordDirFor } from "./record-dir.mjs";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "TEMPLATES.md");
const CHECK = process.argv.includes("--check");
const THUMB_W = 320;
const THUMB_H = 240;
const ASSETS = "assets/templates";

const readJson = (rel) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8").replace(/^﻿/, "")); } catch { return null; } };
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

const manifest = readJson("template-manifest.json");
if (!manifest || !Array.isArray(manifest.templates)) { console.error("gen-gallery: template-manifest.json is missing or has no templates - build first."); process.exit(1); }

// The built modules know what the manifest does not: still or clip, the hinted canvas, `internal`.
const modules = new Map();
try {
  for (const t of require("../dist/index.js").templates ?? []) modules.set(String(t.id), t);
} catch (err) {
  console.warn(`gen-gallery: dist/index.js did not load (${String(err && err.message).split("\n")[0]}) - kinds and sizes are left out.`);
}

/** Width and height from a PNG's IHDR, or null for anything else. */
function pngSize(rel) {
  try {
    const fd = fs.openSync(path.join(ROOT, rel), "r");
    const head = Buffer.alloc(24);
    fs.readSync(fd, head, 0, 24, 0);
    fs.closeSync(fd);
    if (head.toString("latin1", 1, 4) !== "PNG") return null;
    return { w: head.readUInt32BE(16), h: head.readUInt32BE(20) };
  } catch { return null; }
}

const KIND = { image: "still image", video: "video", audio: "audio" };
const cell = (s) => String(s ?? "").replace(/\r?\n/g, " ").replace(/</g, "&lt;").replace(/\|/g, "\\|").trim();
const link = (rel) => encodeURI(rel);

function describe(entry) {
  const id = String(entry.templateKey);
  const [, pack, slug, version] = id.split("/");
  const tags = Array.isArray(entry.tags) ? entry.tags : [];
  const date = tags.find((t) => /^\d{4}-\d{2}-\d{2}$/.test(t)) ?? null;
  const dayTag = tags.find((t) => /^day-\d+$/.test(t)) ?? null;
  const mod = modules.get(id);
  const hints = mod?.outputHints ?? null;
  // A founder-directed vN keeps its own record in journal/<date>/vN/ (tools/record-dir.mjs).
  const record = date ? recordDirFor(ROOT, id, date) : null;
  const run = record ? readJson(`${record.rel}/run.json`) : null;
  const srcDir = `src/${pack}/${slug}/${version}/`;
  return {
    id, pack, slug, date,
    day: dayTag ? `day ${dayTag.slice(4)}` : null,
    name: String(entry.title ?? slug).replace(/^\d{4}-\d{2}-\d{2} · /, ""),
    description: entry.description ?? "",
    internal: mod?.internal === true,
    frontDoor: id === manifest.repo?.helloWorld,
    kind: hints?.format?.kind ? (KIND[hints.format.kind] ?? hints.format.kind) : null,
    size: hints?.width && hints?.height ? `${hints.width}x${hints.height}` : null,
    agent: run?.runner?.adapter ?? null,
    model: run?.model?.corrected ?? run?.model?.selfDeclared ?? null,
    image: entry.preview?.image && exists(entry.preview.image) ? entry.preview.image : null,
    video: entry.preview?.video && exists(entry.preview.video) ? entry.preview.video : null,
    // The loop tools/gen-previews.mjs mints for a video template; found by name, the manifest does not list it.
    gif: exists(`${ASSETS}/${id.replace(/\//g, "__")}/preview.gif`) ? `${ASSETS}/${id.replace(/\//g, "__")}/preview.gif` : null,
    srcDir: exists(srcDir) ? srcDir : null,
    journal: record && exists(record.rel) ? `${record.rel}/` : null,
    shipNote: record && exists(`${record.rel}/50-ship.md`) ? `${record.rel}/50-ship.md` : null,
    followUp: record ? record.followUp : false,
    deprecated: mod?.deprecated ?? null,
  };
}

function thumb(t) {
  // A video template plays its loop; everything else shows its browse-card still.
  const shown = t.gif ?? t.image;
  if (!shown) return "_no preview yet_";
  const size = pngSize(shown);
  // Fit a 320 x 240 box: landscape is sized by width, portrait and square by height.
  const dim = size && size.w / size.h < THUMB_W / THUMB_H ? `height="${THUMB_H}"` : `width="${THUMB_W}"`;
  return `<a href="${link(shown)}"><img src="${link(shown)}" alt="${cell(t.name)} - ${t.gif ? "animated preview" : "preview"}" ${dim}></a>`;
}

function row(t) {
  const facts = [t.day, t.date, [t.kind, t.size].filter(Boolean).join(" "), t.agent ? `${t.agent}${t.model ? ` (${t.model})` : ""}` : null, t.followUp ? "founder-directed follow-up" : null].filter(Boolean).join(" · ");
  const note = t.deprecated ? `_Deprecated${t.deprecated.replacement ? `: use \`${t.deprecated.replacement}\`` : ""}._` : null;
  const links = [
    t.srcDir ? `[source](${link(t.srcDir)})` : null,
    t.journal ? `[journal](${link(t.journal)})` : null,
    t.shipNote ? `[ship note](${link(t.shipNote)})` : null,
    t.gif && t.image ? `[still](${link(t.image)})` : null,
    t.video ? `[clip](${link(t.video)})` : null,
  ].filter(Boolean).join(" · ");
  const title = t.srcDir ? `**[${cell(t.name)}](${link(t.srcDir)})**` : `**${cell(t.name)}**`;
  return `| ${thumb(t)} | ${[title, `\`${t.id}\``, note, cell(t.description), facts, links].filter(Boolean).join("<br>")} |`;
}
const table = (list) => ["| Preview | Template |", "| --- | --- |", ...list.map(row)].join("\n");

const all = manifest.templates.map(describe);
// A day's template carries its date; the front door and the harness fixtures do not.
const daily = all.filter((t) => t.date && !t.internal && !t.frontDoor).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
const others = all.filter((t) => !daily.includes(t));

const months = new Map();
for (const t of daily) { const m = t.date.slice(0, 7); months.set(m, [...(months.get(m) ?? []), t]); }
const packs = new Map();
for (const t of daily) packs.set(t.pack, (packs.get(t.pack) ?? 0) + 1);
const packLine = [...packs.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([p, n]) => `${p} ${n}`).join(" · ");

let md = "# Templates\n\n";
md += "<!-- GENERATED by tools/gen-gallery.mjs on every build, from template-manifest.json. Do not edit: the next build overwrites it. -->\n\n";
const dayCount = new Set(daily.map((t) => t.date)).size;
const followUps = daily.filter((t) => t.followUp).length;
md += `Every template in this repo, newest first: **${dayCount}** shipped ${dayCount === 1 ? "day" : "days"}${followUps ? ` and ${followUps} founder-directed follow-up${followUps === 1 ? "" : "s"}` : ""} in ${packs.size} ${packs.size === 1 ? "pack" : "packs"} (${packLine}). `;
md += "Each row is the preview Mosaic Desktop shows on its browse card, the template id, and links to the template's source folder and to the journal of the day that made it.\n\n";
const looped = all.filter((t) => t.gif).length;
const stillOnly = all.filter((t) => t.kind === "video" && !t.gif).length;
if (looped > 0) md += "A video template plays a short loop of its clip at the defaults; a clip longer than ten seconds is sped up so the whole of it fits. The loops are rendered small, for this page. ";
if (stillOnly > 0) md += `${looped > 0 ? `${stillOnly} video ${stillOnly === 1 ? "template has" : "templates have"} no loop yet and show` : "A video template shows"} the first frame. `;
md += "For the real thing, render it: `m0saic make <id> --template-repo . -o out.mp4`; each day's ship note has the props worth trying. To load the repo in Mosaic Desktop or the CLI, see [Use the templates](README.md#use-the-templates).\n\n";
if (months.size > 1) md += `Jump to: ${[...months.entries()].map(([m, list]) => `[${m}](#${m}) (${list.length})`).join(" · ")}\n\n`;
for (const [m, list] of months) md += `## ${m}\n\n${table(list)}\n\n`;
if (others.length) {
  md += "## Not a day's work\n\n";
  md += "The front door a newcomer renders first, and the fixtures the shared tutorial pages build on. People maintain these; the agent's days are above.\n\n";
  md += `${table(others)}\n`;
}
md = md.replace(/\n+$/, "\n");

const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : null;
if (CHECK) {
  if (current !== md) { console.error("gen-gallery: TEMPLATES.md is stale - run `npm run build` and commit it."); process.exit(1); }
  console.log(`[gen-gallery] ✓ TEMPLATES.md is current (${daily.length} daily, ${others.length} other).`);
} else {
  if (current !== md) fs.writeFileSync(OUT, md);
  console.log(`[gen-gallery] ${current === md ? "unchanged" : "wrote"} TEMPLATES.md (${daily.length} daily template(s) in ${months.size} month(s), ${others.length} other).`);
}
