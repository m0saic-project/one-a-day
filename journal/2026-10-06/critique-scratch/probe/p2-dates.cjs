const { m, render, texts, tryIt } = require('./lib.cjs');
const MON = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const WD = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
let n = 0, bad = 0, firstBad = [];
for (let t = Date.UTC(1900, 0, 1); t <= Date.UTC(2100, 11, 31); t += 86400000) {
  const d = new Date(t);
  const y = d.getUTCFullYear(), mo = d.getUTCMonth(), dd = d.getUTCDate();
  const iso = `${String(y).padStart(4,'0')}-${String(mo+1).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
  const exp = `${WD[d.getUTCDay()]} ${String(dd).padStart(2,'0')} ${MON[mo]} ${y}`;
  const got = m.formatRunDate(iso);
  n++;
  if (got !== exp) { bad++; if (firstBad.length < 5) firstBad.push([iso, got, exp]); }
}
console.log(`checked ${n} days 1900-01-01..2100-12-31, mismatches ${bad}`, firstBad);
// Every invalid day-of-month across the range: d = days+1..31 must be null; also 00
let invalidAccepted = 0, invalidChecked = 0;
for (let y = 1900; y <= 2100; y++) for (let mo = 1; mo <= 12; mo++) {
  const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  for (const d of [0, last + 1, 32, 99]) {
    if (d > 99) continue;
    const iso = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    invalidChecked++;
    if (m.formatRunDate(iso) !== null) { invalidAccepted++; console.log('INVALID ACCEPTED', iso, m.formatRunDate(iso)); }
  }
}
console.log(`invalid day-of-month checked ${invalidChecked}, accepted ${invalidAccepted}`);
const probes = ['2026-02-29','2100-02-29','2000-02-29','1900-02-29','2024-02-29','2026-13-01','2026-00-10','2026-1-3',' 2026-10-03 ','2026-10-03\n','2026-10-03T00:00','1899-12-31','0000-01-01','9999-12-31','2101-01-01','3000-06-15','２０２６-10-03','2026/10/03','03/10/2026','2026-10-3','+2026-10-03'];
(async () => {
  for (const s of probes) {
    const f = m.formatRunDate(s);
    const r = await tryIt(() => render({ date: s }));
    const shown = r.ok ? JSON.stringify((texts(r.v).find(x => x.label === 'run-date') || {}).text) : 'REFUSED: ' + r.err.replace(/^.*?v1: /, '');
    console.log(JSON.stringify(s).padEnd(22), 'formatRunDate=', JSON.stringify(f).padEnd(20), 'render=', shown);
  }
})();
