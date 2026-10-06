const { m, render, texts, tryIt } = require('./lib.cjs');
const ALL = ['6xR25', '4xR50', '3xR100', '2xR250', '1xR500', '1xR1000', '5xV25', '3xV50', '2xV100', '1xV250'];
const CANV = [[1080,1080],[1080,1920],[1920,1080],[1280,720],[640,360],[480,270],[1200,628],[1080,1350]];
for (const n of [0, 1, 4, 5, 6, 7, 8, 9, 10]) {
  const ms = ALL.slice(0, n).join(', ');
  const out = [];
  for (const [w, h] of CANV) {
    let L; try { L = m.settleLayout({ milestones: ms }, w, h).L; } catch (e) { out.push(`${w}x${h} REFUSED`); continue; }
    if (n === 0) { const e = L.cells.find(c => c.label === 'milestone-empty'); out.push(`${w}x${h} empty@${e.px}px band=${L.band.w}x${L.band.h}`); continue; }
    const rows = {};
    for (const b of L.badges) (rows[b.rect.y] = rows[b.rect.y] || []).push(b.rect);
    const desc = Object.values(rows).map(r => {
      const left = r[0].x - L.band.x, right = L.band.x + L.band.w - (r[r.length - 1].x + r[r.length - 1].w);
      return `${r.length}[${r[0].w}x${r[0].h} L${left}/R${right}]`;
    }).join('+');
    const sizes = new Set(L.badges.map(b => `${b.rect.w}x${b.rect.h}`));
    out.push(`${w}x${h} ${desc}${sizes.size > 1 ? ' UNEQUAL ' + [...sizes].join(',') : ''} club${L.badgePx}/cap${L.captionPx}`);
  }
  console.log(`n=${n}: ` + out.join(' | '));
}
