"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wh40kRosterCardV1 = void 0;
exports.normalizeWh40kRosterCard = normalizeWh40kRosterCard;
exports.layoutWh40kRosterCard = layoutWh40kRosterCard;
const types_1 = require("@m0saic/types");
const dsl_stdlib_1 = require("@m0saic/dsl-stdlib");
const template_utils_1 = require("@m0saic/template-utils");
const layout_1 = require("../../../_shared/layout");
const text_1 = require("../../../_shared/text");
const why_1 = require("../../../_shared/why");
const ID = "@one-a-day/gaming/wh40k-roster-card/v1";
const DEFAULT_ACCENT = "#c0392b";
const ALLOWED_CATEGORIES = ["HQ", "TR", "EL", "FA", "HS", "FL", "LW", "DT"];
const THEMES = {
    dark: { bg: "#161d27", row: "#1e2733", ink: "#e8edf3", dim: "#8b98a8" },
    light: { bg: "#f2f0ea", row: "#e7e4db", ink: "#1b222b", dim: "#5c6672" },
};
const DEFAULT_UNITS = [
    { name: "Captain in Gravis Armor", models: 1, points: 292, category: "HQ", enhancement: "Artificer Armour", warlord: "WARLORD" },
    { name: "Intercessor Squad", models: 5, points: 292, category: "TR" },
    { name: "Bladeguard Veterans", models: 3, points: 287, category: "EL" },
    { name: "Inceptor Squad", models: 3, points: 312, category: "FA" },
    { name: "Eradicator Squad", models: 3, points: 332, category: "HS" },
    { name: "Stormraven Gunship", models: 1, points: 480, category: "FL" },
];
const DEFAULTS = {
    armyName: "Strike Force",
    faction: "Adeptus Astartes",
    detachment: "Gladius Task Force",
    pointsUsed: 1995,
    pointsLimit: 2000,
    units: DEFAULT_UNITS,
    accent: DEFAULT_ACCENT,
    preset: "dark",
    debugLayout: false,
};
const propsSchema = (0, template_utils_1.definePropsSchema)({
    armyName: {
        type: "string",
        required: false,
        description: "The army's name, the largest header line. ASCII, 1 to 48 characters. The rect that shows it is bound to it, so Make's double-click edits it in place.",
        meta: { control: { placeholder: DEFAULTS.armyName }, ui: { label: "Army name", order: 1, primary: true } },
    },
    faction: {
        type: "string",
        required: false,
        description: "The faction line under the army name. ASCII, 1 to 40 characters.",
        meta: { control: { placeholder: DEFAULTS.faction }, ui: { label: "Faction", order: 2 } },
    },
    detachment: {
        type: "string",
        required: false,
        description: "The detachment line under the army name. ASCII, 1 to 40 characters.",
        meta: { control: { placeholder: DEFAULTS.detachment }, ui: { label: "Detachment", order: 3 } },
    },
    pointsUsed: {
        type: "number",
        required: false,
        description: "Points used, shown in the header pill and the footer totals.",
        meta: { constraints: { min: 0, max: 99999 }, ui: { label: "Points used", order: 4 } },
    },
    pointsLimit: {
        type: "number",
        required: false,
        description: "Points limit, shown in the header pill and the footer totals.",
        meta: { constraints: { min: 0, max: 99999 }, ui: { label: "Points limit", order: 5 } },
    },
    units: {
        type: "list",
        required: false,
        description: "The unit rows, 1 to 20. Each row is { name, models, points, category, enhancement?, warlord? }.",
        meta: { constraints: { minItems: 1, maxItems: 20 }, ui: { label: "Units", order: 6, primary: true } },
        fields: {
            name: { type: "string", required: true, description: "Unit name, ASCII, 1 to 48 characters.", meta: { ui: { label: "Name" } } },
            models: { type: "number", required: true, description: "Model count, a non-negative integer.", meta: { constraints: { min: 0, max: 9999 }, ui: { label: "Models" } } },
            points: { type: "number", required: true, description: "Points cost, a non-negative integer.", meta: { constraints: { min: 0, max: 99999 }, ui: { label: "Points" } } },
            category: { type: "string", required: true, description: "BattleScribe role abbreviation: HQ, TR, EL, FA, HS, FL, LW or DT.", meta: { ui: { label: "Category" } } },
            enhancement: { type: "string", required: false, description: "Enhancement name, ASCII, 0 to 28 characters. Empty removes the chip.", meta: { control: { placeholder: "none" }, ui: { label: "Enhancement" } } },
            warlord: { type: "string", required: false, description: 'Type "WARLORD" to draw the warlord chip; empty removes it. ASCII, 0 to 8 characters.', meta: { control: { placeholder: "none" }, ui: { label: "Warlord" } } },
        },
    },
    accent: {
        type: "string",
        required: false,
        description: "Header pill, category badge and chip accent ink, as #rrggbb.",
        meta: { constraints: { isColor: true }, control: { colorPicker: true, defaultColor: DEFAULT_ACCENT }, ui: { label: "Accent", order: 7 } },
    },
    preset: {
        type: "string",
        required: false,
        description: '"dark" (datacard night look, default) or "light" (printable checklist).',
        meta: { constraints: { oneOf: ["dark", "light"] }, ui: { label: "Preset", order: 8 } },
    },
    debugLayout: {
        type: "boolean",
        required: false,
        description: "Dev-only: check the layout contract (every text fits its box, the bands stay where they belong, badges are square, rows are one height) and draw it over the card.",
        meta: { ui: { label: "Debug layout", order: 99 } },
    },
});
/* ---- validation ---- */
function fail(field, rule) {
    throw new Error(`${ID}: ${field} ${rule}`);
}
const DRAWN = /^[\x20-\x7e]*$/;
function text(value, field, min, max) {
    if (typeof value !== "string")
        fail(field, "must be a string.");
    if (!DRAWN.test(value))
        fail(field, `${JSON.stringify(value)} has a character outside printable ASCII; the card draws ASCII only.`);
    const s = value.trim();
    if (s.length < min)
        fail(field, "must not be blank.");
    if (s.length > max)
        fail(field, `${JSON.stringify(s)} is ${s.length} characters; the card fits at most ${max}.`);
    return s;
}
function wholeNumber(value, field, min, max) {
    if (typeof value !== "number" || !Number.isInteger(value))
        fail(field, `${JSON.stringify(value)} must be a whole number.`);
    if (value < min || value > max)
        fail(field, `${value} is outside ${min} to ${max}.`);
    return value;
}
function luminance(hex) {
    const c = (i) => {
        const v = parseInt(hex.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
}
function onColor(fill) {
    const ratio = (other) => {
        const a = luminance(fill), b = luminance(other);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    return (ratio("#0b1220") >= ratio("#ffffff") ? "#0b1220" : "#ffffff");
}
/** The schema is documentation; this is the gate. Only `undefined` takes a default. */
function normalizeWh40kRosterCard(props) {
    const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(props !== null && props !== void 0 ? props : {}).filter(([, v]) => v !== undefined)) };
    const armyName = text(p.armyName, "armyName", 1, 48);
    const faction = text(p.faction, "faction", 1, 40);
    const detachment = text(p.detachment, "detachment", 1, 40);
    const pointsUsed = wholeNumber(p.pointsUsed, "pointsUsed", 0, 99999);
    const pointsLimit = wholeNumber(p.pointsLimit, "pointsLimit", 0, 99999);
    if (!Array.isArray(p.units))
        fail("units", "must be a list of unit rows.");
    if (p.units.length < 1)
        fail("units", "needs at least 1 row.");
    if (p.units.length > 20)
        fail("units", `has ${p.units.length} rows; the card shows 1 to 20.`);
    const units = p.units.map((u, i) => {
        const at = `units[${i}]`;
        if (!u || typeof u !== "object" || Array.isArray(u))
            fail(at, "must be an object { name, models, points, category, enhancement?, warlord? }.");
        const name = text(u.name, `${at}.name`, 1, 48);
        const models = wholeNumber(u.models, `${at}.models`, 0, 9999);
        const points = wholeNumber(u.points, `${at}.points`, 0, 99999);
        const category = text(u.category, `${at}.category`, 1, 3).toUpperCase();
        if (!ALLOWED_CATEGORIES.includes(category))
            fail(`${at}.category`, `${JSON.stringify(category)} must be one of ${ALLOWED_CATEGORIES.join(", ")}.`);
        const enhancement = u.enhancement === undefined ? "" : text(u.enhancement, `${at}.enhancement`, 0, 28);
        const warlord = u.warlord === undefined ? "" : text(u.warlord, `${at}.warlord`, 0, 8);
        return { name, models, points, category, enhancement, warlord };
    });
    if (p.preset !== "dark" && p.preset !== "light")
        fail("preset", `${JSON.stringify(p.preset)} must be "dark" or "light".`);
    if (typeof p.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(p.accent.trim()))
        fail("accent", `${JSON.stringify(p.accent)} must be #rrggbb.`);
    if (typeof p.debugLayout !== "boolean")
        fail("debugLayout", "must be a boolean.");
    return {
        armyName,
        faction,
        detachment,
        pointsUsed,
        pointsLimit,
        units,
        accent: p.accent.trim().toLowerCase(),
        preset: p.preset,
        debugLayout: p.debugLayout,
    };
}
function fitPx(line, cellW, maxPx, bold, minPx) {
    const top = Math.max(1, Math.round(maxPx));
    const room = (0, text_1.budget)(cellW);
    const w = (0, text_1.widthOf)(line, top, bold);
    let px = w <= room ? top : Math.max(minPx, Math.floor((top * room) / w));
    while (px > minPx && (0, text_1.widthOf)(line, px, bold) > room)
        px--;
    return px;
}
function snugW(t, px, bold) {
    return Math.ceil(((0, text_1.widthOf)(t, px, bold) + 2) / 0.94);
}
function makeBindUnit(i, field, type) {
    return { unit: [i, field], type };
}
/** Every rect of the card for one canvas. Pure: same props and canvas, same rects. */
function layoutWh40kRosterCard(props, W, H) {
    const p = normalizeWh40kRosterCard(props);
    const theme = THEMES[p.preset];
    const ink = theme.ink;
    const dim = theme.dim;
    const S = Math.min(W, H);
    const aspect = W / H;
    const isLandscape = aspect >= 1.2;
    const isPortrait = aspect <= 0.8;
    const m = Math.round(S * (isPortrait ? 0.045 : 0.04));
    const gap = Math.max(2, Math.round(S * 0.012));
    const hair = Math.max(1, Math.round(S * 0.002));
    const floor = Math.max(6, Math.round(S * 0.016));
    const small = Math.max(5, Math.round(S * 0.012));
    const cells = [];
    const tiles = [];
    const rows = [];
    const badges = [];
    const unfit = (field) => fail(field, `cannot be fitted on ${W}x${H} at the ${floor}px floor: shorten it or render a larger canvas.`);
    const line = (label, rect, value, px, o = {}) => {
        var _a, _b, _c, _d, _e;
        if (px < ((_a = o.floorPx) !== null && _a !== void 0 ? _a : floor))
            unfit((_b = o.field) !== null && _b !== void 0 ? _b : label);
        cells.push({
            label,
            rect,
            text: value,
            px,
            width: (0, text_1.widthOf)(value, px, o.bold === true),
            bold: o.bold === true,
            align: (_c = o.align) !== null && _c !== void 0 ? _c : "left",
            color: (_d = o.color) !== null && _d !== void 0 ? _d : ink,
            bind: (_e = o.bind) !== null && _e !== void 0 ? _e : null,
            over: o.over === true,
        });
    };
    /* ---- header band [0, 0.26] ---- */
    const headTop = m;
    const headBottom = Math.floor(H * 0.26);
    const headH = Math.max(1, headBottom - headTop);
    // Points pill sits top-right.
    const pillH = Math.min(Math.round(headH * 0.38), Math.round(S * 0.055));
    const pillPad = Math.round(pillH * 0.45);
    const pillPx0 = Math.max(small, Math.round(pillH * 0.45));
    const pointsPillText = `${p.pointsUsed}/${p.pointsLimit}`;
    const pillW = Math.max(1, snugW(pointsPillText, pillPx0, true) + 2 * pillPad);
    const pillX = W - m - pillW;
    const pillY = headTop + Math.round((headH * 0.35 - pillH) / 2);
    tiles.push({
        label: "points-pill-bg",
        rect: { x: pillX, y: pillY, w: pillW, h: pillH },
        color: p.accent,
        radius: 0.5,
        layer: 2,
        bind: { prop: "accent" },
    });
    const pillPx = fitPx(pointsPillText, pillW - 2 * pillPad, pillPx0, true, small);
    line("points-pill", { x: pillX, y: pillY, w: pillW, h: pillH }, pointsPillText, pillPx, { bold: true, align: "center", color: onColor(p.accent), bind: { prop: "pointsUsed" }, over: true, floorPx: small });
    // Faction · detachment: fit the line first, then split it into bound cells.
    const subW = W - 2 * m;
    const sep = " · ";
    let subPx = fitPx(`${p.faction}${sep}${p.detachment}`, subW, headH * 0.14, false, small);
    let factionW = snugW(p.faction, subPx, false);
    let sepW = snugW(sep, subPx, false);
    let detW = snugW(p.detachment, subPx, false);
    while (factionW + sepW + detW > subW && subPx > small) {
        subPx = Math.max(small, Math.round(subPx * 0.92));
        factionW = snugW(p.faction, subPx, false);
        sepW = snugW(sep, subPx, false);
        detW = snugW(p.detachment, subPx, false);
    }
    const subH = Math.round(subPx * 1.25);
    // Army name: use the space left of the pill when it fits, full width otherwise.
    const nameMaxW = pillX - gap - m;
    const nameW = nameMaxW > Math.round(W * 0.35) ? nameMaxW : W - 2 * m;
    const nameX = m;
    const namePx = fitPx(p.armyName, nameW, headH * 0.32, true, floor);
    const nameH = Math.round(namePx * 1.25);
    // Anchor the sub-line to the bottom of the header band, name above it.
    const subY = headBottom - m - subH;
    const nameY = subY - gap - nameH;
    line("army-name", { x: nameX, y: nameY, w: nameW, h: nameH }, p.armyName, namePx, { bold: true, bind: { prop: "armyName" }, field: "armyName" });
    if (factionW + sepW + detW <= subW) {
        line("faction", { x: m, y: subY, w: factionW, h: subH }, p.faction, subPx, { color: dim, bind: { prop: "faction" }, field: "faction" });
        line("sep", { x: m + factionW, y: subY, w: sepW, h: subH }, sep, subPx, { color: dim, field: "sep" });
        line("detachment", { x: m + factionW + sepW, y: subY, w: detW, h: subH }, p.detachment, subPx, { color: dim, bind: { prop: "detachment" }, field: "detachment" });
    }
    else {
        // Fallback for extreme narrow canvases: one combined line, bound to faction.
        line("faction", { x: m, y: subY, w: subW, h: subH }, `${p.faction}${sep}${p.detachment}`, subPx, { color: dim, bind: { prop: "faction" }, field: "faction" });
    }
    /* ---- body band [0.28, 0.88] ---- */
    const bodyTop = Math.ceil(H * 0.28);
    const bodyBottom = Math.floor(H * 0.88);
    const bodyH = Math.max(1, bodyBottom - bodyTop);
    const n = p.units.length;
    const useTwoCols = isLandscape && n >= 5;
    const cols = useTwoCols ? 2 : 1;
    const perCol = Math.ceil(n / cols);
    const colGap = gap;
    const colW = Math.floor((W - 2 * m - (cols - 1) * colGap) / cols);
    const rowPitch = Math.floor((bodyH - (perCol - 1) * hair) / perCol);
    const rowH = Math.max(floor + 2, rowPitch - hair);
    const badgeSide = Math.min(Math.round(rowH * 0.55), Math.round(S * 0.065), Math.round(colW * 0.14));
    const badgeMargin = Math.round(rowH * 0.12);
    const rowPadRight = Math.round(rowH * 0.12);
    p.units.forEach((u, i) => {
        const col = useTwoCols ? (i < perCol ? 0 : 1) : 0;
        const row = i % perCol;
        const colX = m + col * (colW + colGap);
        const y = bodyTop + row * rowPitch;
        const rowRect = { x: colX, y, w: colW, h: rowH };
        rows.push({ i, col, rect: rowRect });
        tiles.push({
            label: `row-bg-${i}`,
            rect: rowRect,
            color: theme.row,
            radius: 0.04,
            layer: 1,
            bind: null,
        });
        if (row > 0) {
            tiles.push({
                label: `row-hair-${i}`,
                rect: { x: colX, y: y - hair, w: colW, h: hair },
                color: "#3d4852",
                radius: 0,
                layer: 1,
                bind: null,
            });
        }
        // Category badge (accent square with white text).
        const badgeX = colX + badgeMargin;
        const badgeY = y + Math.round((rowH - badgeSide) / 2);
        const badgeRect = { x: badgeX, y: badgeY, w: badgeSide, h: badgeSide };
        badges.push({ i, rect: badgeRect });
        tiles.push({
            label: `cat-bg-${i}`,
            rect: badgeRect,
            color: p.accent,
            radius: 0.12,
            layer: 2,
            bind: makeBindUnit(i, "category", "string"),
        });
        const catPx = fitPx(u.category, badgeSide * 0.9, badgeSide * 0.5, true, small);
        line(`cat-${i}`, badgeRect, u.category, catPx, { bold: true, align: "center", color: onColor(p.accent), bind: makeBindUnit(i, "category", "string"), over: true, floorPx: small, field: `units[${i}].category` });
        // Build right-to-left: points, optional warlord/enhancement chips, model chip, name.
        // First compute each chip's preferred width, then drop optional chips until the name fits.
        const pointsText = String(u.points);
        const pointsMaxPx = Math.max(small, Math.round(rowH * 0.42));
        const pointsW = Math.max(1, Math.round(Math.min(colW * 0.14, snugW(pointsText, pointsMaxPx, true) + Math.round(rowH * 0.08))));
        const pointsPx = fitPx(pointsText, pointsW, pointsMaxPx, true, small);
        const chipH = Math.round(rowH * 0.52);
        const chipPad = Math.round(chipH * 0.30);
        const chipPx0 = Math.max(small, Math.round(chipH * 0.40));
        const modelText = `x${u.models}`;
        const modelPx0 = Math.max(small, Math.round(rowH * 0.36));
        const modelW = Math.max(1, Math.round(Math.min(colW * 0.11, snugW(modelText, modelPx0, true) + Math.round(rowH * 0.08))));
        const warlordText = u.warlord;
        const warlordW = warlordText !== "" ? Math.max(1, Math.round(Math.min(colW * 0.16, snugW(warlordText, chipPx0, true) + 2 * chipPad))) : 0;
        const enhText = u.enhancement;
        const enhW = enhText !== "" ? Math.max(1, Math.round(Math.min(colW * 0.20, snugW(enhText, chipPx0, false) + 2 * chipPad))) : 0;
        const nameX = badgeX + badgeSide + gap;
        const nameFits = (withEnh, withWarlord, withModel) => {
            let rightX = colX + colW - rowPadRight - pointsW;
            if (withWarlord)
                rightX -= gap + warlordW;
            if (withEnh)
                rightX -= gap + enhW;
            if (withModel)
                rightX -= gap + modelW;
            const nameW = Math.max(1, Math.round(rightX - gap - nameX));
            const namePx = fitPx(u.name, nameW, rowH * 0.42, true, floor);
            // Fits if we did not have to floor the font, or the floored size still fits.
            return namePx > floor || (0, text_1.widthOf)(u.name, floor, true) <= (0, text_1.budget)(nameW);
        };
        let drawEnh = enhW > 0 && nameFits(true, warlordW > 0, true);
        let drawWarlord = warlordW > 0 && nameFits(drawEnh, true, true);
        let drawModel = nameFits(drawEnh, drawWarlord, true);
        // If the model chip itself makes the name clip, try dropping optional chips first.
        if (!drawModel) {
            drawEnh = false;
            drawWarlord = false;
            drawModel = nameFits(false, false, true);
        }
        let rightX = colX + colW - rowPadRight;
        rightX -= pointsW;
        line(`points-${i}`, { x: rightX, y: y + Math.round((rowH - Math.round(pointsPx * 1.25)) / 2), w: pointsW, h: Math.round(pointsPx * 1.25) }, pointsText, pointsPx, { bold: true, align: "right", bind: makeBindUnit(i, "points", "number"), field: `units[${i}].points` });
        if (drawWarlord) {
            rightX -= gap + warlordW;
            tiles.push({
                label: `warlord-bg-${i}`,
                rect: { x: rightX, y: y + Math.round((rowH - chipH) / 2), w: warlordW, h: chipH },
                color: p.accent,
                radius: 0.5,
                layer: 2,
                bind: makeBindUnit(i, "warlord", "string"),
            });
            const warlordPx = fitPx(warlordText, warlordW - 2 * chipPad, chipPx0, true, small);
            line(`warlord-${i}`, { x: rightX, y: y + Math.round((rowH - Math.round(chipPx0 * 1.25)) / 2), w: warlordW, h: Math.round(chipPx0 * 1.25) }, warlordText, warlordPx, { bold: true, align: "center", color: onColor(p.accent), bind: makeBindUnit(i, "warlord", "string"), over: true, floorPx: small, field: `units[${i}].warlord` });
        }
        if (drawEnh) {
            rightX -= gap + enhW;
            tiles.push({
                label: `enh-bg-${i}`,
                rect: { x: rightX, y: y + Math.round((rowH - chipH) / 2), w: enhW, h: chipH },
                color: dim,
                radius: 0.5,
                layer: 2,
                bind: makeBindUnit(i, "enhancement", "string"),
            });
            const enhPx = fitPx(enhText, enhW - 2 * chipPad, chipPx0, false, small);
            line(`enh-${i}`, { x: rightX, y: y + Math.round((rowH - Math.round(chipPx0 * 1.25)) / 2), w: enhW, h: Math.round(chipPx0 * 1.25) }, enhText, enhPx, { align: "center", color: onColor(String(dim)), bind: makeBindUnit(i, "enhancement", "string"), over: true, floorPx: small, field: `units[${i}].enhancement` });
        }
        if (drawModel) {
            rightX -= gap + modelW;
            tiles.push({
                label: `model-bg-${i}`,
                rect: { x: rightX, y: y + Math.round((rowH - chipH) / 2), w: modelW, h: chipH },
                color: theme.dim,
                radius: 0.5,
                layer: 2,
                bind: makeBindUnit(i, "models", "number"),
            });
            const modelPx = fitPx(modelText, modelW - Math.round(rowH * 0.1), modelPx0, true, small);
            line(`models-${i}`, { x: rightX, y: y + Math.round((rowH - Math.round(modelPx0 * 1.25)) / 2), w: modelW, h: Math.round(modelPx0 * 1.25) }, modelText, modelPx, { bold: true, align: "center", color: onColor(String(theme.dim)), bind: makeBindUnit(i, "models", "number"), over: true, floorPx: small, field: `units[${i}].models` });
        }
        // Name fills the space between the badge and the right-hand block.
        const nameW = Math.max(1, Math.round(rightX - gap - nameX));
        const namePx = fitPx(u.name, nameW, rowH * 0.42, true, floor);
        line(`name-${i}`, { x: nameX, y: y + Math.round((rowH - Math.round(namePx * 1.25)) / 2), w: nameW, h: Math.round(namePx * 1.25) }, u.name, namePx, { bold: true, bind: makeBindUnit(i, "name", "string"), field: `units[${i}].name` });
    });
    /* ---- footer band [0.90, 1] ---- */
    const footTop = Math.ceil(H * 0.90);
    const footH = Math.max(1, H - m - footTop);
    const totalsText = `${p.pointsUsed} / ${p.pointsLimit} PTS`;
    const creditText = "BattleScribe Roster";
    const footPx = fitPx(totalsText, Math.floor((W - 2 * m - gap) * 0.55), footH * 0.55, true, small);
    const creditPx = fitPx(creditText, Math.floor((W - 2 * m - gap) * 0.45), footH * 0.45, false, small);
    const totalsW = Math.max(1, Math.min(Math.floor((W - 2 * m - gap) * 0.55), snugW(totalsText, footPx, true)));
    line("totals", { x: m, y: footTop + Math.round((footH - Math.round(footPx * 1.25)) / 2), w: totalsW, h: Math.round(footPx * 1.25) }, totalsText, footPx, { bold: true, bind: { prop: "pointsLimit" }, field: "pointsLimit" });
    const creditW = Math.max(1, Math.min(Math.floor((W - 2 * m - gap) * 0.45), snugW(creditText, creditPx, false)));
    line("credit", { x: W - m - creditW, y: footTop + Math.round((footH - Math.round(creditPx * 1.25)) / 2), w: creditW, h: Math.round(creditPx * 1.25) }, creditText, creditPx, { color: dim, align: "right", field: "credit" });
    return {
        p,
        theme,
        ink,
        dim,
        W,
        H,
        m,
        gap,
        hair,
        floor,
        small,
        cells,
        tiles,
        rows,
        badges,
        useTwoCols,
        cols,
        perCol,
        bodyTop,
        bodyBottom,
        headBottom,
        footTop,
    };
}
/* ---- why-tutorial spec ---- */
const WHY = {
    day: 29,
    date: "2026-10-18",
    agent: "opencode",
    model: "kimi-k2.7-code",
    id: "@one-a-day/gaming/wh40k-roster-card/v1",
    title: "WH40k Roster Share Card",
    who: "Warhammer 40,000 competitive players on r/WarhammerCompetitive, r/WarhammerListBuilding and faction Discords",
    problem: [
        "Goonhammer's ButtScribe exists because \"BattleScribe printouts are ten pages long and practically illegible\" - it turns a roster into a printable PDF and an embeddable army-summary image.",
        "On r/WarhammerCompetitive players say \"screenshots contain so much more info than friends/teammates/coaches would need to critique a list\", and a dedicated listbuilding subreddit was created because rate-my-list posts were cluttering the main competitive sub.",
        "One community member built a prototype app to \"upload, display (and later share) Battlescribe lists\" because the native sharing was poor."
    ],
    sources: [
        "https://www.goonhammer.com/buttscribe-printed-materials-for-you-and-others/",
        "https://www.reddit.com/r/WarhammerCompetitive/comments/1r447pt/best_appsite_for_building_lists_to_share_for/",
        "https://www.reddit.com/r/WarhammerCompetitive/comments/1h83ytt/new_listbuilding_subreddit/",
        "https://www.reddit.com/r/WarhammerCompetitive/comments/i3pj79/i_am_currently_working_on_a_prototype_app_to/"
    ],
    solution: [
        "Type faction, detachment, points and unit rows and get a single share card instead of a wall of text. Landscape runs the unit list in two columns; portrait keeps one tall list for story posts.",
        "The one decision: the card stays factual - no GW art, stat blocks or rule text - only the names and numbers the player supplies, with role badges and a right-aligned points pill."
    ],
    usage: {
        command: "m0saic make @one-a-day/gaming/wh40k-roster-card/v1 --template-repo . -w 1080 -h 1920 -o roster.png",
        try: [
            "units: up to 20 rows with category HQ, TR, EL, FA, HS, FL, LW or DT",
            "accent \"#1f618d\" recolors the points pill and category badges",
            "preset light gives a high-contrast checklist sheet instead of the dark datacard",
            "add enhancement:\"Rites of War\" and warlord:\"WARLORD\" to draw the optional chips"
        ]
    },
    caveats: [
        "BattleScribe XML is deep and edition-specific; this template takes normalized props, it does not parse a .ros/.rosz file at render time.",
        "No GW art, stat blocks or rule text - only user-supplied names and numbers.",
        "A 20-row roster can get tight at 480x270; very long names shrink to the floor."
    ],
    timeline: {
        source: "runner",
        phases: [
            { name: "scout", startMs: 0, durMs: 218165, calls: 34, tokens: 789080, costUsd: 0.25, tools: "websearch 21, read 6, webfetch 3" },
            { name: "plan", startMs: 218194, durMs: 125346, calls: 12, tokens: 348037, costUsd: 0.12, tools: "read 10, edit 1, write 1" },
            { name: "build", startMs: 343573, durMs: 5570162, calls: 120, tokens: 13377587, costUsd: 3.5, tools: "edit 40, read 38, bash 27", status: "error" },
            { name: "critique", startMs: 5913772, durMs: 227423, calls: 35, tokens: 891071, costUsd: 0.27, tools: "read 31, write 3, bash 1" },
            { name: "build (2)", startMs: 6141356, durMs: 1378616, calls: 45, tokens: 2626314, costUsd: 0.69, tools: "read 25, bash 9, edit 7" },
            { name: "critique (2)", startMs: 7520260, durMs: 377511, calls: 35, tokens: 735252, costUsd: 0.24, tools: "read 27, bash 4, glob 2" },
            { name: "build (3)", startMs: 7897844, durMs: 1581060, calls: 36, tokens: 1639773, costUsd: 0.51, tools: "read 23, bash 8, edit 5" },
            { name: "critique (3)", startMs: 9478941, durMs: 200621, calls: 26, tokens: 541251, costUsd: 0.2, tools: "read 20, edit 2, glob 2" }
        ],
        costBasis: "reported"
    }
};
exports.Wh40kRosterCardV1 = (0, template_utils_1.defineMosaicTemplate)({
    id: (0, types_1.asTemplateId)(ID),
    label: "2026-10-18 · WH40k Roster Share Card",
    version: 1,
    description: "A Warhammer 40,000 BattleScribe roster as one share card: army name, faction, detachment, points pill and unit rows with category badges, model counts and optional enhancement/warlord chips - no art or rules.",
    capabilities: { tier: "core" },
    tags: ["gaming", "2026-10-18", "day-029", "warhammer-40k", "battlescribe", "roster", "army-list", "share-card"],
    outputHints: {
        width: 1080,
        height: 1920,
        fps: 30,
        durationMs: 2000,
        format: { kind: "image", container: "png" },
        note: "Static PNG. Portrait-first story card; landscape switches to two unit columns, square keeps a centered column. Minimum tested canvas 480x270.",
    },
    propsSchema,
    defaultProps: DEFAULTS,
    render,
    renderTutorial: (0, why_1.whyTutorial)(WHY, render),
});
exports.default = exports.Wh40kRosterCardV1;
async function render(props, ctx) {
    const { width: W, height: H } = ctx.target;
    const L = layoutWh40kRosterCard(props, W, H);
    const pieces = [];
    const constraints = [];
    for (const t of [...L.tiles].sort((a, b) => a.layer - b.layer)) {
        const tile = (0, template_utils_1.tag)((0, template_utils_1.makeColorTile)(t.color, { effects: { rounding: { cornerStyle: "rounded", borderRadius: t.radius } } }), t.label);
        let source = tile;
        if (t.bind) {
            if ("prop" in t.bind) {
                source = (0, template_utils_1.bindProp)(tile, t.bind.prop);
            }
            else if ("unit" in t.bind) {
                source = (0, template_utils_1.bindPropPath)(tile, "units", t.bind.unit, t.bind.type);
            }
        }
        pieces.push({ rect: { ...t.rect, importance: t.layer }, source });
    }
    for (const c of L.cells) {
        const cell = (0, template_utils_1.tag)((0, text_1.textCell)({ text: c.text, fontSize: c.px, color: c.color, hAlign: c.align, bold: c.bold, vAlign: "middle", label: c.label }), c.label);
        let source = cell;
        if (c.bind) {
            if ("prop" in c.bind) {
                source = (0, template_utils_1.bindProp)(cell, c.bind.prop);
            }
            else if ("unit" in c.bind) {
                source = (0, template_utils_1.bindPropPath)(cell, "units", c.bind.unit, c.bind.type);
            }
        }
        pieces.push({ rect: { ...c.rect, importance: c.over ? 3 : 2 }, source });
        constraints.push((0, layout_1.textFitsMeasured)(c.label, c.text, c.px, c.width));
        // Band constraints.
        if (c.label === "army-name" || c.label === "faction" || c.label === "detachment" || c.label === "sep" || c.label === "points-pill") {
            constraints.push({ label: c.label, within: { yFrac: [0, 0.26] } });
        }
        if (/^(cat|name|models|points|warlord|enh|row-bg|row-hair)-\d+$/.test(c.label)) {
            constraints.push({ label: c.label, within: { yFrac: [0.28, 0.88] } });
        }
        if (c.label === "totals" || c.label === "credit") {
            constraints.push({ label: c.label, within: { yFrac: [0.9, 1] } });
        }
    }
    // Tile constraints.
    for (const t of L.tiles) {
        if (t.label === "points-pill-bg") {
            constraints.push({ label: t.label, within: { xFrac: [0.55, 1], yFrac: [0, 0.26] } });
        }
        if (/^cat-bg-\d+$/.test(t.label)) {
            constraints.push({ label: t.label, aspect: 1, aspectTolerance: 0.05, within: { yFrac: [0.28, 0.88] } });
        }
        if (/^row-bg-\d+$/.test(t.label)) {
            constraints.push({ label: t.label, within: { yFrac: [0.28, 0.88] } });
        }
        if (/^(model-bg|enh-bg|warlord-bg)-\d+$/.test(t.label)) {
            constraints.push({ label: t.label, within: { yFrac: [0.28, 0.88] } });
        }
    }
    // Relational constraints: row backgrounds equal height, category badges equal size.
    const rowBgLabels = L.rows.map((r) => `row-bg-${r.i}`);
    const catBgLabels = L.badges.map((b) => `cat-bg-${b.i}`);
    const relations = [
        ...(rowBgLabels.length > 1 ? [{ label: rowBgLabels, equal: "height", tolerancePx: 2 }] : []),
        ...(catBgLabels.length > 1 ? [{ label: catBgLabels, equal: "size", tolerancePx: 2 }] : []),
    ];
    const placed = (0, template_utils_1.placeInsetPieces)({ rootW: W, rootH: H, pieces });
    const doc = {
        kind: "mosaic_document",
        version: 1,
        m0: (0, dsl_stdlib_1.toM0String)(placed.m0, ID),
        assets: {},
        backgroundColor: L.theme.bg,
        sources: placed.sources,
    };
    return (0, layout_1.withLayoutIntent)(doc, ctx, { templateId: ID, constraints, relations, debug: props.debugLayout === true });
}
