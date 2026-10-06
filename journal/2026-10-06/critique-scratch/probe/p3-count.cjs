const { m } = require('./lib.cjs');
let bad = [];
for (let n = 0; n <= 9999; n++) { const a = m.formatCount(n), b = n.toLocaleString('en-US'); if (a !== b) bad.push([n, a, b]); }
console.log('0..9999 mismatches', bad.length, bad.slice(0, 5));
for (const n of [10000, 123456, 1234567, -1, -1204, 1.5, 1e21]) console.log(n, JSON.stringify(m.formatCount(n)));
