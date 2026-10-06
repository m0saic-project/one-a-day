const { m, render, texts, tryIt } = require('./lib.cjs');
const cases = ['4xR25,,3xR50', '4xR25, 3xR50,', ',4xR25', ' , , ', '4 x r 25', '04xR25', '004xR25', '1000xR25', '0xR25', '00xR25', 'R25x4', '4xV1000', '4×R25', '4XR25', '4*R25', '4 R25', '4xR025', '4xR0025', '4xR 25', '4x R25', '   ', '4xR25;3xR50', '4xR25 3xR50', '4xR25,\t3xR50', '4xR25\n3xR50', '4xR25,\n3xR50', '4xR25.', '4xR25 ', '4xr25, 4xR25', '1xV25,1xR25', '999xR25', '4xR250, 4xR25', '4xR1000'];
(async () => {
  for (const s of cases) {
    let pm;
    try { pm = m.parseMilestones(s).map(b => `${b.kind}${b.club}:'${b.caption}'`).join(' '); } catch (e) { pm = 'THROW ' + e.message.replace(/^.*?v1: /, ''); }
    const r = await tryIt(() => render({ milestones: s, counts: { finishers: 2000, newPbs: 38, firstTimers: 27, visitors: 19, volunteers: 31, firstTimeVolunteers: 4 } }));
    let shown;
    if (r.ok) { const t = texts(r.v); shown = t.filter(x => /^badge-(club|caption)/.test(x.label) || x.label === 'milestone-empty').map(x => x.text).join('|'); }
    else shown = 'REFUSED ' + r.err.replace(/^.*?v1: /, '');
    console.log(JSON.stringify(s).padEnd(18), '=>', pm, ' || render:', shown);
  }
})();
