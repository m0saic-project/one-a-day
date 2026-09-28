import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";
import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, checkLayoutIntent, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import { BirdWalkSightingsV1 as T, layoutSightings, normalize, SIGHTINGS_SAMPLE_ROWS } from "./bird-walk-sightings";
import type { BirdWalkSightingsProps, Sighting } from "./bird-walk-sightings";
const ID = "@one-a-day/events/bird-walk-sightings/v1";
const render = (p: BirdWalkSightingsProps = {}, w = 1080, h = 1920) => T.render(p, targetCtx(w, h)).then(asDocument);
const rows = (n: number): Sighting[] => Array.from({ length: n }, (_, i) => ({ commonName: `Bird ${i + 1}`, count: i % 3 ? i + 1 : "X" }));
const stress: BirdWalkSightingsProps = { location: "W".repeat(48), sourceLabel: "W".repeat(48), numberOfObservers: 999, rows: Array.from({ length: 8 }, (_, i) => ({ commonName: i % 2 ? "W".repeat(48) : "WWWW WWWW WWWW WWWW WWWW WWWW WWWW WWWW WWWW WWW", count: i % 2 ? "X" : 999999 })) };

describe(ID, () => {
  it("preserves all entries exactly once across pages and aspect ratios", async () => {
    for (const n of [1, 8, 9, 16, 17, 200]) {
      const input = rows(n);
      for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
        const collected: Sighting[] = [];
        for (let page = 1; page <= Math.ceil(n / 8); page++) {
          const L = layoutSightings({ rows: input, page }, w, h);
          collected.push(...L.visible);
          const first = (page - 1) * 8;
          expect(L.cells.find(c => c.label === "pagination")?.text).toBe(`Page ${page} of ${Math.ceil(n / 8)}  |  Entries ${first + 1}-${Math.min(first + 8, n)} of ${n}`);
          const names = L.cells.filter(c => c.label.startsWith("name-"));
          const counts = L.cells.filter(c => c.label.startsWith("count-"));
          expect(names.map(c => c.text)).toEqual(input.slice(first, first + 8).map(r => r.commonName));
          expect(counts.map(c => c.text)).toEqual(input.slice(first, first + 8).map(r => String(r.count)));
          expect(L.rules.filter(r => r.label.startsWith("row-rule-"))).toHaveLength(L.visible.length);
        }
        expect(collected).toEqual(input);
      }
    }
    const doc = await render({ rows: rows(9), page: 2 });
    const labels = doc.sources?.map(s => s.editor?.label);
    expect(labels).toContain("name-8");
    expect(labels).not.toContain("name-0");
  });

  it("keeps duplicates, unidentified taxa, X and six-digit counts without inventing totals", () => {
    const input: Sighting[] = [{ commonName: "swallow sp.", count: "X" }, { commonName: "swallow sp.", count: 999999 }];
    expect(normalize({ rows: input }).rows).toEqual(input);
    expect(normalize({}).rows).toEqual(SIGHTINGS_SAMPLE_ROWS);
    expect(normalize({ rows: [{ commonName: " Mallard ", count: 1 }] }).rows[0].commonName).toBe("Mallard");
  });

  it("fits defaults and boundary copy at all seven canvases and supports nested targets", async () => {
    for (const p of [{}, stress, { rows: rows(8).map(r => ({ ...r, count: "X" as const })) }, { rows: rows(9), page: 2 }, { location: "A", sourceLabel: "B", rows: [{ commonName: "C", count: 1 }] }]) {
      await sweepLayout((p, ctx) => T.render(p, ctx).then(asDocument), ID, p, targetCtx);
      for (const [w, h] of CONTRACT_CANVASES) {
        const L = layoutSightings(p, w, h);
        const doc = await render(p, w, h);
        const ev = evaluateM0(String(doc.m0), { width: w, height: h });
        expect(ev.feasible && ev.meetsPrecision).toBe(true);
        const intent = layoutIntentOf(doc)!;
        const resolved = checkLayoutIntent(doc, w, h)!.resolved;
        const drawn = L.cells.map(c => ({ ...c, rect: resolved[c.label][0].rect }));
        for (let i = 0; i < drawn.length; i++) for (let j = i + 1; j < drawn.length; j++) {
          const a = drawn[i].rect, b = drawn[j].rect;
          expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false);
        }
        for (const c of drawn.filter(c => c.field === "commonName")) {
          const count = drawn.find(x => x.label === `count-${c.row}`)!;
          expect(Math.abs(count.rect.y - c.rect.y)).toBeLessThanOrEqual(2);
          expect(count.rect.x).toBeGreaterThanOrEqual(c.rect.x + c.rect.w);
          expect(c.rect.y).toBeGreaterThan(resolved.time[0].rect.y + resolved.time[0].rect.h);
          expect(c.rect.y + c.rect.h).toBeLessThan(resolved["footer-rule"][0].rect.y);
        }
        for (const s of doc.sources ?? []) {
          expect(s.editor?.label).toBeTruthy();
          expect(intent.constraints.some(c => c.label === s.editor?.label)).toBe(true);
          if (s.type === "text") expect(intent.constraints.some(c => c.label === s.editor?.label && c.textFits)).toBe(true);
        }
        expect(L.listEnd - L.labelY).toBeGreaterThanOrEqual((h - 2 * L.margin) / 2);
        for (const c of L.cells) {
          expect(c.px).toBeGreaterThanOrEqual(8);
          expect(c.rect.x).toBeGreaterThanOrEqual(L.margin);
          expect(c.rect.y).toBeGreaterThanOrEqual(L.margin);
          expect(c.rect.x + c.rect.w).toBeLessThanOrEqual(w - L.margin);
          expect(c.rect.y + c.rect.h).toBeLessThanOrEqual(h - L.margin);
          expect(c.text).not.toContain("...");
          if (c.field === "commonName") {
            expect(c.text.split("\n").length).toBeLessThanOrEqual(3);
            expect(c.text.replace(/\s/g, "")).toBe(L.p.rows[c.row!].commonName.replace(/\s/g, ""));
            const count = L.cells.find(x => x.label === `count-${c.row}`)!;
            expect(count.rect.y).toBe(c.rect.y);
            expect(count.rect.x).toBeGreaterThan(c.rect.x + c.rect.w);
          }
        }
        for (let i = 0; i < L.cells.length; i++) for (let j = i + 1; j < L.cells.length; j++) {
          const a = L.cells[i].rect, b = L.cells[j].rect;
          expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false);
        }
        const names = L.cells.filter(c => c.field === "commonName");
        for (let i = 1; i < names.length; i++) {
          if (L.wide && i === 4) { expect(names[i].rect.x).toBeGreaterThan(names[i - 1].rect.x); expect(names[i].rect.y).toBe(names[0].rect.y); }
          else expect(names[i].rect.y).toBeGreaterThan(names[i - 1].rect.y);
        }
      }
    }
    const ctx = targetCtx(480, 270); ctx.output.width = 3840; ctx.output.height = 2160;
    expect(await T.render({}, ctx).then(asDocument)).toEqual(await render({}, 480, 270));
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("binds metadata, pagination and row paths including the selected page's original index", async () => {
    for (const p of [{}, { rows: rows(9), page: 2 }]) {
      const doc = await render(p);
      const { byProp, rejected } = resolvePropBindings(doc, 1080, 1920, { propsSchema: T.propsSchema });
      expect(rejected).toEqual([]);
      for (const prop of ["location", "date", "time", "numberOfObservers", "sourceLabel", "page"]) expect(byProp[prop]).toHaveLength(1);
      expect(byProp.rows).toHaveLength(p.page ? 2 : 16);
    }
    const changed = await render({ location: "Changed sanctuary", date: "2024-02-29", time: "23:59", sourceLabel: "Changed source", numberOfObservers: 99 });
    const text = JSON.stringify(changed.sources);
    for (const s of ["Changed sanctuary", "2024-02-29", "23:59 local", "Changed source", "99 observers"]) expect(text).toContain(s);
    expect(await render()).toEqual(await render());
  });

  it.each<[string, unknown]>([
    ["location", ""], ["location", "W".repeat(49)], ["location", null], ["sourceLabel", " "], ["sourceLabel", "W".repeat(49)],
    ["location", "Bird\u00e9"], ["location", "a\nb"], ["date", "2026-02-29"], ["date", "1900-02-29"], ["date", "0000-01-01"], ["date", "2026-13-01"], ["date", "2026-04-31"], ["date", "2026-01-00"], ["date", "2026-1-01"],
    ["time", "24:00"], ["time", "08:60"], ["time", "8:00"], ["time", null],
    ["numberOfObservers", 0], ["numberOfObservers", 1000], ["numberOfObservers", 1.5], ["numberOfObservers", "12"],
    ["page", 0], ["page", 1.5], ["page", 2], ["page", "1"], ["debugLayout", "false"],
    ["rows", []], ["rows", rows(201)], ["rows", null], ["rows", "[]"], ["rows", [{}]], ["rows", [null]], ["rows", [{ commonName: "" , count: 1 }]],
    ["rows", [{ commonName: "W".repeat(49), count: 1 }]], ["rows", [{ commonName: "\t", count: 1 }]],
    ...[0, -1, 1.5, Infinity, NaN, 1000000, "1", "x", null, undefined].map((count): [string, unknown] => ["rows", [{ commonName: "Bird", count }]]),
    ["rows", [...rows(8), { commonName: "Bad off-page", count: 0 }]],
  ])("rejects invalid %s inputs without substituting sample data", (field, value) => {
    expect(() => normalize({ [field as string]: value } as BirdWalkSightingsProps)).toThrow(new RegExp(field as string));
  });
  it("accepts calendar boundaries without reading the clock", () => {
    expect(normalize({ date: "2000-02-29", time: "00:00" }).date).toBe("2000-02-29");
    expect(normalize({ date: "2026-12-31" }).date).toBe("2026-12-31");
    expect(() => normalize({ rows: new Array(9) })).toThrow(/rows\[0\]/);
  });
});
