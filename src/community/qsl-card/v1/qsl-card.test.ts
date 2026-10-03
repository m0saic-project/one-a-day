import { evaluateM0 } from "@m0saic/dsl-stdlib";
import { resolvePropBindings } from "@m0saic/template-utils";

import { asDocument, targetCtx } from "../../../__testutils__/render";
import { CONTRACT_CANVASES, checkLayoutIntent, layoutIntentOf, sweepLayout } from "../../../_shared/layout";
import {
  QslCardV1 as T,
  layoutQslCard,
  normalizeQslCard,
  qslBandOf,
  qslFormatDate,
  qslFormatTime,
  qslGrid,
  qslMHzToHz,
} from "./qsl-card";
import type { QslCardProps } from "./qsl-card";

const ID = "@one-a-day/community/qsl-card/v1";
const render = (p: QslCardProps = {}, w = 1920, h = 1080) => T.render({ ...T.defaultProps, ...p }, targetCtx(w, h)).then(asDocument);
const textOf = (p: QslCardProps, w = 1920, h = 1080) => Object.fromEntries(layoutQslCard(p, w, h).cells.map((c) => [c.label, c.text]));
const pxOf = (p: QslCardProps, w: number, h: number) => Object.fromEntries(layoutQslCard(p, w, h).cells.map((c) => [c.label, c.px]));

/** The seven contract canvases plus the physical card, 5.5 x 3.5 in at 300 dpi. */
const CANVASES: ReadonlyArray<readonly [number, number]> = [...CONTRACT_CANVASES, [1650, 1050]];

// The copy that stresses the card: the longest calls a log holds, a 32-character
// QTH, seconds on the time, a microwave frequency, a long mode and message.
const WORST: QslCardProps = {
  stationCallsign: "VP2V/G4ABC",
  call: "VP2V/G4ABC/P",
  qth: "North Little Rock, Arkansas, USA",
  timeOn: "143205",
  freq: "1296.200",
  mode: "OLIVIA-8",
  myGridsquare: "EM34lw55",
  myPotaRef: "GB-0001@GB-ENG",
  qslMsg: "TNX FER QSO ES PSE QSL VIA BURO - 73 DE",
};
const CASES: QslCardProps[] = [
  {},
  WORST,
  { stationCallsign: "K1A", call: "K2B" },
  { myGridsquare: "" },
  { qth: "" },
  { myPotaRef: "" },
  { myGridsquare: "", qth: "", myPotaRef: "" },
  { qslMsg: "" },
  { myGridsquare: "", qth: "", myPotaRef: "", qslMsg: "" },
  { freq: "432.100", mode: "SSB", rstSent: "59" },
  { freq: "7.074", mode: "CW", rstSent: "599", accentColor: "#f2c14e" },
];

describe(ID, () => {
  it("shows the use case at its defaults: N0CALL to W1AW, one labelled QSO record, the footer", () => {
    expect(textOf({})).toMatchObject({
      callsign: "N0CALL",
      "station-grid-tag": "GRID", "station-grid": "EN34", "station-qth": "Minneapolis, MN", "station-pota-tag": "POTA", "station-pota": "US-1234",
      "to-radio": "TO RADIO", "worked-call": "W1AW", confirm: "CONFIRMING OUR QSO",
      "col-label-date": "DATE", "col-label-utc": "UTC", "col-label-mhz": "MHz", "col-label-band": "BAND", "col-label-mode": "MODE", "col-label-rst": "RST",
      "col-value-date": "03 OCT 2026", "col-value-utc": "14:32", "col-value-mhz": "14.074", "col-value-band": "20m", "col-value-mode": "FT8", "col-value-rst": "-12",
      qslmsg: "TNX QSO 73", mark: "ADIF QSO CARD",
    });
    expect(T.outputHints).toMatchObject({ width: 1920, height: 1080, format: { kind: "image" } });
  });

  it("reads the ADIF formats and derives BAND from FREQ with the ADIF 3.1.6 band table", () => {
    expect(qslFormatDate("20261003")).toBe("03 OCT 2026");
    expect(qslFormatDate("20240229")).toBe("29 FEB 2024");
    for (const bad of ["20261332", "20230229", "19291231", "2026103", "2026-10-03", "21000229"]) expect(qslFormatDate(bad)).toBeNull();
    expect(qslFormatTime("1432")).toBe("14:32");
    expect(qslFormatTime("143205")).toBe("14:32:05");
    expect(qslFormatTime("0000")).toBe("00:00");
    for (const bad of ["2560", "2400", "1460", "143260", "932", "14:32"]) expect(qslFormatTime(bad)).toBeNull();
    expect(qslMHzToHz("14.074")).toBe(14_074_000);
    expect(qslMHzToHz(".1357")).toBe(135_700);
    for (const bad of ["", ".", "14,074", "14.0740001", "-14.074", "1e3"]) expect(qslMHzToHz(bad)).toBeNull();
    expect(Object.fromEntries(["14.074", "7.074", "144.174", "432.100", "1296.200", "3.573", "50.313", "10.136", "28.074", "1.840", "5.357", ".475"].map((f) => [f, qslBandOf(f)]))).toEqual({
      "14.074": "20m", "7.074": "40m", "144.174": "2m", "432.100": "70cm", "1296.200": "23cm", "3.573": "80m",
      "50.313": "6m", "10.136": "30m", "28.074": "10m", "1.840": "160m", "5.357": "60m", ".475": "630m",
    });
    // The edges are inclusive, and the 6m / 5m seam is where the table puts it (54 is 6m, 54.000001 is 5m).
    expect([qslBandOf("14.0"), qslBandOf("14.350"), qslBandOf("14.350001"), qslBandOf("54"), qslBandOf("54.000001")]).toEqual(["20m", "20m", null, "6m", "5m"]);
    // CB radio (27.185 MHz) and the gap between 20m and 17m are not amateur bands.
    expect([qslBandOf("27.185"), qslBandOf("15.000")]).toEqual([null, null]);
    expect(qslGrid("en34")).toBe("EN34");
    expect(qslGrid("EN34LW")).toBe("EN34lw");
    expect(qslGrid("en34lw55")).toBe("EN34lw55");
    for (const bad of ["ZZ99", "EN3", "EN34l", "EN34yz", "EN34lw5"]) expect(qslGrid(bad)).toBeNull();
    const n = normalizeQslCard({ stationCallsign: " ve3abc/p ", mode: "ft4", myPotaRef: "k-12345" });
    expect([n.stationCallsign, n.mode, n.pota]).toEqual(["VE3ABC/P", "FT4", "K-12345"]);
  });

  it("fails fast on bad input and names the prop", async () => {
    const bad: Array<[QslCardProps, RegExp]> = [
      [{ qsoDate: "20261332" }, /qsoDate "20261332" is not an ADIF date/],
      [{ timeOn: "2560" }, /timeOn "2560" is not an ADIF time/],
      [{ freq: "27.185" }, /freq 27\.185 MHz is in no amateur band/],
      [{ freq: "14.074 MHz" }, /freq "14\.074 MHz" is not a frequency/],
      [{ myGridsquare: "ZZ99" }, /myGridsquare "ZZ99" is not a Maidenhead locator/],
      [{ stationCallsign: "N0 CALL" }, /stationCallsign "N0 CALL" is not a callsign/],
      [{ call: "W1AW W2" }, /call "W1AW W2" is not a callsign/],
      [{ call: "" }, /call must not be empty/],
      [{ stationCallsign: "VP2V/G4ABCDEFG" }, /stationCallsign .* is not a callsign/],
      [{ call: "QSL" }, /call "QSL" is not a callsign/],
      [{ mode: "" }, /mode "" must be 1-8 characters/],
      [{ rstSent: "5" }, /rstSent "5" is not a report/],
      [{ rstSent: "69" }, /rstSent "69" is not a report/],
      [{ myPotaRef: "US1234" }, /myPotaRef "US1234" is not a POTA reference/],
      [{ qth: "x".repeat(33) }, /qth .* is 33 characters; the card fits at most 32/],
      [{ qslMsg: "TNX QSO → 73" }, /qslMsg .* outside printable ASCII/],
      [{ accentColor: "red" }, /accentColor "red" must be #rrggbb/],
      [{ freq: 14.074 as never }, /freq must be a string/],
    ];
    for (const [p, re] of bad) await expect(render(p)).rejects.toThrow(re);
    // A call that cannot fit above the floor is refused, never ellipsized.
    await expect(render({ stationCallsign: "VP2V/G4ABC", call: "VP2V/G4ABC/P", qslMsg: "W".repeat(40) }, 1080, 1920)).rejects.toThrow(/qslMsg cannot be fitted on 1080x1920/);
  });

  it("binds every rect that shows a prop, and leaves the derived BAND unbound", async () => {
    const doc = await render();
    const { byProp, rejected } = resolvePropBindings(doc, 1920, 1080, { propsSchema: T.propsSchema });
    expect(rejected).toEqual([]);
    for (const k of ["stationCallsign", "call", "qsoDate", "timeOn", "freq", "mode", "rstSent", "myGridsquare", "qth", "myPotaRef", "qslMsg", "accentColor"]) {
      expect([k, byProp[k]?.length]).toEqual([k, 1]);
    }
    expect(layoutQslCard({}, 1920, 1080).cells.find((c) => c.label === "col-value-band")!.bind).toBeNull();
  });

  it("reflows the table by aspect (6x1, 3x2, 2x3) and keeps the hierarchy: call >= 2x a value, worked call >= a value", () => {
    expect(layoutQslCard({}, 1920, 1080).grid).toEqual({ rows: 1, cols: 6 });
    expect(layoutQslCard({}, 1650, 1050).grid).toEqual({ rows: 1, cols: 6 });
    expect(layoutQslCard({}, 1080, 1080).grid).toEqual({ rows: 2, cols: 3 });
    expect(layoutQslCard({}, 1080, 1920).grid).toEqual({ rows: 3, cols: 2 });
    for (const p of CASES) {
      for (const [w, h] of CANVASES) {
        const L = layoutQslCard(p, w, h);
        expect([w, h, L.callPx >= 2 * L.valuePx]).toEqual([w, h, true]);
        expect([w, h, L.workedPx >= L.valuePx]).toEqual([w, h, true]);
        // Every text is at or above the readability floor (10/270 of the short side).
        for (const c of L.cells) expect([w, h, c.label, c.px >= L.floor]).toEqual([w, h, c.label, true]);
        // The columns are weighted by what they hold: DATE is wider than BAND.
        const colW = (k: string) => L.cells.find((c) => c.label === `col-value-${k}`)!.rect.w;
        if (L.grid.cols === 6) expect(colW("date")).toBeGreaterThan(colW("band"));
      }
    }
    // A short call is limited by the band's height, a long one by its width.
    expect(pxOf({ stationCallsign: "K1A" }, 1920, 1080).callsign).toBeGreaterThan(pxOf({ stationCallsign: "VP2V/G4ABC" }, 1920, 1080).callsign);
  });

  it("hides an empty station line with its prefix and leaves no hole", () => {
    const t = textOf({ myGridsquare: "", myPotaRef: "" });
    expect(t["station-grid"]).toBeUndefined();
    expect(t["station-grid-tag"]).toBeUndefined();
    expect(t["station-pota-tag"]).toBeUndefined();
    expect(t["station-qth"]).toBe("Minneapolis, MN");
    // The remaining line re-centres in the header.
    const L = layoutQslCard({ myGridsquare: "", myPotaRef: "" }, 1920, 1080);
    const qth = L.cells.find((c) => c.label === "station-qth")!.rect;
    const head = L.cells.find((c) => c.label === "callsign")!.rect;
    expect(Math.abs(qth.y + qth.h / 2 - (head.y + head.h / 2))).toBeLessThanOrEqual(1);
    // All three hidden: the call takes the full header width.
    const bare = layoutQslCard({ myGridsquare: "", qth: "", myPotaRef: "" }, 1920, 1080);
    expect(bare.cells.find((c) => c.label === "callsign")!.rect.w).toBe(1920 - 2 * Math.round(1080 * 0.065));
    expect(textOf({ qslMsg: "" }).qslmsg).toBeUndefined();
  });

  it("keeps its layout contract at the seven contract canvases and on the 5.5 x 3.5 in card, for the copy that stresses it", async () => {
    expect(layoutIntentOf(await render())).not.toBeNull();
    for (const over of CASES) {
      await sweepLayout((p, ctx) => T.render(p, ctx).then(asDocument), ID, { ...T.defaultProps, ...over }, (w, h) => targetCtx(w, h), CANVASES);
    }
    for (const [w, h] of CANVASES) {
      const doc = await render(WORST, w, h);
      expect(checkLayoutIntent(doc, w, h)?.ok).toBe(true);
    }
    expect((await render({ debugLayout: true })).editor).toMatchObject({ layoutContract: { ok: true } });
  });

  it("clears its safe minimum and is deterministic", async () => {
    for (const [w, h] of CANVASES) {
      const ev = evaluateM0(String((await render({}, w, h)).m0), { width: w, height: h });
      expect([w, h, ev.feasible && ev.meetsPrecision]).toEqual([w, h, true]);
    }
    expect(await render(WORST)).toEqual(await render(WORST));
  });
});
