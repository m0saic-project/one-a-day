const path = require("path");
const v = process.argv[2];
const m = require(path.join(__dirname, v, "wrr.js"));
const C = { finishers: 214, newPbs: 38, firstTimers: 27, visitors: 19, volunteers: 31, firstTimeVolunteers: 4 };
const small = { finishers: 40, newPbs: 5, firstTimers: 3, visitors: 2, volunteers: 8, firstTimeVolunteers: 1 };
const cases = {
  "misspelled count": { eventName: "Rushmoor 5k", count: { ...C, finishers: 999 } },
  "counts as JSON string": { counts: JSON.stringify({ ...C, finishers: 1204 }) },
  "50 runners in clubs, 40 finishers": { counts: small, milestones: "30xR25, 20xR50" },
  "9 vol clubs, 8 volunteers": { counts: small, milestones: "9xV25" },
  "71-char footer": { footer: "Thanks to all 58 volunteers - see you next Saturday at 9am by the cafe!" },
  "pale accent": { accent: "#ffd23f" },
  "dark accent": { accent: "#1b3a2a" },
  "default accent purple": { accent: "#7a3b8f" },
};
for (const [k, props] of Object.entries(cases)) {
  try { const { L } = m.settleLayout(props, 1080, 1080); const fin = L.cells.find((c) => c.label === "value-finishers"); console.log(`${v} ${k}: RENDERS finishers=${fin ? fin.text : "?"} heroInk=${L.p.heroInk} footerLen=${L.p.footer.length}`); }
  catch (e) { console.log(`${v} ${k}: REFUSED ${e.message.slice(0, 140)}`); }
}
