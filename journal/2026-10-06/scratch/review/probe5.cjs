const path = require('path');
const root = path.resolve(__dirname, '../../../..');
const { settleLayout } = require(path.join(root, 'dist/community/weekly-run-report/v1/weekly-run-report.js'));
const ALL = ["6xR25", "4xR50", "3xR100", "2xR250", "1xR500", "1xR1000", "5xV25", "3xV50", "2xV100", "1xV250"];
const canv = JSON.parse(process.argv[2]);
for (const [w, h] of canv) {
  const out = [];
  for (let n = 1; n <= 10; n++) { try { settleLayout({ milestones: ALL.slice(0, n).join(", ") }, w, h); out.push(n + ':ok'); } catch (e) { out.push(n + ':NO'); } }
  console.log(`${w}x${h}`.padEnd(10), out.join(' '));
}
