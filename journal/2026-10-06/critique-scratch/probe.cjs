const m = require("../../../dist/community/weekly-run-report/v1/weekly-run-report.js");
const f = m.formatRunDate, c = m.formatCount, pm = m.parseMilestones;
for (const d of ["2026-10-03","2024-02-29","2000-01-01","1900-02-29","2000-02-29","1900-01-01","2100-02-29","2026-01-01","2026-03-01"]) console.log(d, f(d));
for (const n of [1000,1204,9999,999,0]) console.log(n, c(n));
const t = (s) => { try { return JSON.stringify(pm(s).map(b=>b.kind+b.club+":"+b.caption)); } catch (e) { return "ERR " + e.message; } };
for (const s of ["0xR25","1000xR25","4xR25,","R25",",,,","4xR025","001xR25","4 x r 25","4XV1000","4xR25;1xR50"]) console.log(JSON.stringify(s), t(s));
