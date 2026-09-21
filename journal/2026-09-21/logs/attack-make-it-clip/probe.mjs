import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ROOT = path.resolve("C:/src/m0saic-production/one-a-day");
process.env.M0SAIC_CLI ??= "/usr/bin/false";
const entry = require(path.join(ROOT, "dist/index.js"));
const layoutMod = require(path.join(ROOT, "dist/_shared/layout.js"));
const bd = require(path.join(ROOT, "dist/dev/bench-delta/v1/bench-delta.js"));
const tmpl = entry.templates.find((t) => String(t.id) === "@one-a-day/dev/bench-delta/v1");

const CANVASES = process.env.CANVASES
  ? JSON.parse(process.env.CANVASES)
  : [[1920,1080],[1600,900],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270]];

const ctxFor = (w,h) => ({ mode:"render", target:{width:w,height:h,fps:30,durationMs:2000}, output:{width:w,height:h,fps:30,durationMs:2000,workspaceDir:path.join(ROOT,"test-output","attack")}, media:{} });

const files = process.argv.slice(2);
const out = [];
for (const f of files) {
  const props = JSON.parse(fs.readFileSync(f, "utf8"));
  const full = { ...tmpl.defaultProps, ...props, debugLayout: false };
  for (const [w,h] of CANVASES) {
    const ctx = ctxFor(w,h);
    let doc, dbg, err = null;
    try { doc = await tmpl.render(full, ctx); dbg = await tmpl.render({ ...full, debugLayout: true }, ctxFor(w,h)); } catch (e) { err = String(e && e.message || e); }
    if (err) { out.push({ file: path.basename(f), canvas:`${w}x${h}`, error: err }); continue; }
    const rep = layoutMod.checkLayoutIntent(doc, w, h);
    const stamp = dbg.editor && dbg.editor.layoutContract;
    const contractOk = stamp ? stamp.ok : null;
    const stampV = stamp && stamp.violations ? stamp.violations.map(v=>v.detail||JSON.stringify(v)) : [];
    // geometry, straight from the pure layout function
    const rows = (full.rows||[]).map(r=>({...r}));
    const L = bd.layoutBenchDelta(rows, {
      title: full.title, subtitle: full.subtitle, baselineLabel: full.baselineLabel,
      candidateLabel: full.candidateLabel, smallerIsBetter: full.smallerIsBetter !== false,
    }, w, h);
    const esc = [];
    const push = (name, r) => {
      if (!r) return;
      if (r.x < -0.5 || r.y < -0.5 || r.x + r.w > w + 0.5 || r.y + r.h > h + 0.5)
        esc.push(`${name} rect=[${r.x},${r.y},${r.w},${r.h}] canvas=${w}x${h}`);
    };
    push("titleRect", L.titleRect); push("subtitleRect", L.subtitleRect); push("summaryRect", L.summaryRect);
    push("footerRect", L.footerRect); push("ruleLabelRect", L.ruleLabelRect); push("rule", L.rule);
    L.legend.forEach(l=>{ push(`swatch-${l.key}`, l.swatch); push(`legendRect-${l.key}`, l.labelRect); });
    L.rows.forEach((r,i)=>{ push(`nameRect-${i}`, r.nameRect); push(`valuesRect-${i}`, r.valuesRect);
      push(`lane-${i}`, r.lane); push(`baseBar-${i}`, r.baseBar); push(`candBar-${i}`, r.candBar);
      push(`verdictRect-${i}`, r.verdictRect); });
    // vertical: does the name block's drawn height exceed its rect?
    const vclip = [];
    L.rows.forEach((r,i)=>{
      const need = Math.ceil(r.name.px * 1.3 * r.name.lines);
      if (need > r.nameRect.h) vclip.push(`name-${i}: needs ${need}px tall (px=${r.name.px} x ${r.name.lines} lines) box=${r.nameRect.h}px`);
      const bottom = r.valuesRect.y + r.valuesRect.h;
      const rowBottom = r.verdictRect.y + r.verdictRect.h;
      if (bottom > rowBottom + 0.5) vclip.push(`labelblock-${i}: bottom ${bottom} > row bottom ${rowBottom}`);
    });
    // horizontal: does label text run into the track?
    const hclip = [];
    L.rows.forEach((r,i)=>{
      if (r.name.width > L.trackX - r.nameRect.x) hclip.push(`name-${i} width ${Math.round(r.name.width)} > gap to trackX ${L.trackX - r.nameRect.x}`);
      if (r.values.width > L.trackX - r.valuesRect.x) hclip.push(`values-${i} width ${Math.round(r.values.width)} > gap to trackX`);
    });
    // legend run-off
    const last = L.legend[L.legend.length-1];
    const legendRight = last.labelRect.x + last.labelRect.w;
    const legendOver = legendRight > L.margin + (w - 2*L.margin) + 0.5 ? `legend ends at x=${legendRight}, content right edge=${L.margin + (w-2*L.margin)}` : null;
    // ellipsis inventory
    const ell = [];
    const chk = (n,t)=>{ if (typeof t === "string" && t.includes("...")) ell.push(n); };
    chk("title", L.title.text); if (L.subtitle) chk("subtitle", L.subtitle.text);
    chk("summary", L.summary.text); chk("footer", L.footer.text); chk("rule-label", L.ruleLabel.text);
    L.legend.forEach(l=>chk(`legend-${l.key}`, l.label.text));
    L.rows.forEach((r,i)=>{ chk(`name-${i}`, r.name.text); chk(`values-${i}`, r.values.text); chk(`verdict-${i}`, r.verdictFit.text); });
    out.push({
      file: path.basename(f), canvas: `${w}x${h}`,
      contractOk, checkOk: rep ? rep.ok : null,
      violations: rep && rep.violations ? rep.violations.map(v=>v.detail||v.message||JSON.stringify(v)) : [],
      stampViolations: stampV,
      shown: `${L.shown}/${L.total}`, labelFrac: +(L.rows.length? (L.rows[0].nameRect.w/(w-2*L.margin)).toFixed(3):0),
      minPx: Math.max(7, Math.round(0.016*Math.min(h,0.75*w))),
      namePx: L.rows.length? L.rows[0].name.px : null, nameLines: L.rows.map(r=>r.name.lines).join(","),
      escapes: esc, vclip, hclip, legendOver, ellipsis: ell,
      nameText0: L.rows.length ? JSON.stringify(L.rows[0].name.text) : null,
      values0: L.rows.length ? JSON.stringify(L.rows[0].values.text) : null,
      title: JSON.stringify(L.title.text), footer: JSON.stringify(L.footer.text),
    });
  }
}
for (const r of out) {
  const bad = r.error || r.checkOk === false || r.contractOk === false || (r.escapes&&r.escapes.length) || (r.vclip&&r.vclip.length) || (r.hclip&&r.hclip.length) || r.legendOver;
  console.log(`${bad ? "XX" : "ok"} ${r.file} ${r.canvas} contract=${r.contractOk} check=${r.checkOk} shown=${r.shown} namePx=${r.namePx} lines=${r.nameLines} ell=[${(r.ellipsis||[]).join(" ")}]`);
  if (r.error) console.log("    ERROR:", r.error);
  for (const v of r.violations||[]) console.log("    VIOLATION:", v);
  for (const v of r.stampViolations||[]) console.log("    DEBUGSTAMP:", v);
  for (const v of r.escapes||[]) console.log("    ESCAPE:", v);
  for (const v of r.vclip||[]) console.log("    VCLIP:", v);
  for (const v of r.hclip||[]) console.log("    HCLIP:", v);
  if (r.legendOver) console.log("    LEGEND:", r.legendOver);
}
fs.writeFileSync(path.resolve("journal/2026-09-21/logs/attack-make-it-clip/probe-out.json"), JSON.stringify(out,null,2));
