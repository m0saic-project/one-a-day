const M = require('../../../../dist/community/weekly-run-report/v1/weekly-run-report.js');
const N = (p) => { try { const r = M.normalizeWeeklyRunReport(p); return 'OK ' + JSON.stringify({t:r.title, run:r.runText, d:r.date, c:r.counts, m:r.milestones.map(b=>b.kind+b.club+':'+b.caption), f:r.footer, a:r.accent, h:r.heroInk}); } catch (e) { return 'ERR ' + e.message.replace(/^@[^:]*: /,''); } };
const C = { finishers:214,newPbs:38,firstTimers:27,visitors:19,volunteers:31,firstTimeVolunteers:4 };
const cases = {
  countsNull: {counts:null}, countsStr: {counts: JSON.stringify(C)}, countsArr:{counts:[1]}, countsEmpty:{counts:{}},
  countsStrVal:{counts:{...C, finishers:"214"}}, countsNeg:{counts:{...C, newPbs:-1}}, countsFloat:{counts:{...C, finishers:214.0}},
  countsNaN:{counts:{...C, visitors:NaN}}, countsBool:{counts:{...C, visitors:true}},
  ms0:{milestones:'0xR25'}, ms1000:{milestones:'1000xR25'}, msLead:{milestones:'007xR0025'}, msSemi:{milestones:'4xR25; 3xR50'}, msDupCase:{milestones:'4xR25, 2xr25'},
  msNum:{milestones:25}, msSpace:{milestones:' 4 X r 25 '}, msTrail:{milestones:'4xR25,,'}, msV1000:{milestones:'1xV1000'},
  dateBad:{date:'2026-13-01'}, date1899:{date:'1899-12-31'}, dateSp:{date:' 2026-10-03 '}, dateNum:{date:20261003},
  runStr:{runNumber:'312'}, runFloat:{runNumber:312.5}, run0:{runNumber:0}, runNull:{runNumber:null},
  accShort:{accent:'#fff'}, accUpper:{accent:'#1F7A4D'}, accName:{accent:'red'}, accNum:{accent:123},
  nameNum:{eventName:123}, nameSpaces:{eventName:'   '}, nameNbsp:{eventName:'Park 5k'}, nameEsz:{eventName:'Straße 5k'}, nameNapos:{eventName:'ŉ 5k'},
  footer71:{footer:'x'.repeat(71)}, footerSp:{footer:'   '},
  dbg:{debugLayout:'true'},
};
for (const [k,v] of Object.entries(cases)) console.log(k.padEnd(12), N(v));
