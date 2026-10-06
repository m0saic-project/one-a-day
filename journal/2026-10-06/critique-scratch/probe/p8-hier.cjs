const { m, render, texts } = require('./lib.cjs');
const CANV = [[1080,1350],[1200,628],[1080,1920],[1920,1080],[1080,1080],[480,270],[1280,720],[640,360],[3840,2160],[1200,1500],[820,312],[1500,500]];
const TEN = '6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250';
(async () => {
  for (const [label, props] of [['defaults', {}], ['ten clubs', { milestones: TEN }], ['1 club', { milestones: '1xR25' }]]) {
    console.log(`\n== ${label} ==`);
    console.log('canvas     shape  hero stat ratio label(2l) badge capt name(lines) run  title footer floor small | flags');
    for (const [w, h] of CANV) {
      let L; try { L = m.settleLayout(props, w, h).L; } catch (e) { console.log(`${w}x${h} REFUSED ${e.message.replace(/^.*?v1: /, '')}`); continue; }
      const px = (lab) => (L.cells.find(c => c.label === lab) || {}).px;
      const allPx = L.cells.map(c => ({ l: c.label, px: c.px }));
      const ratio = L.heroPx / L.statPx;
      const flags = [];
      if (ratio < 1.5) flags.push(`ratio<1.5`);
      if (L.badgePx > L.statPx) flags.push(`badge>stat`);
      const below = allPx.filter(c => c.px < L.floor);
      if (below.length) flags.push('below floor: ' + [...new Set(below.map(c => c.l.replace(/-\d+$/, '') + '=' + c.px))].join(','));
      const titlePx = px('band-title'), footPx = px('footer'), runPx = px('run-number'), emptyPx = px('milestone-empty');
      // largest non-hero text
      const nonHero = allPx.filter(c => !/^value-(finishers|volunteers)$/.test(c.l)).sort((a, b) => b.px - a.px)[0];
      if (nonHero.px >= L.heroPx) flags.push(`non-hero ${nonHero.l}=${nonHero.px} >= hero`);
      console.log(`${(w+'x'+h).padEnd(10)} ${L.shape.padEnd(6)} ${String(L.heroPx).padStart(4)} ${String(L.statPx).padStart(4)} ${ratio.toFixed(2)}  ${String(L.labelPx).padStart(3)}${L.twoLineLabels ? '(2)' : '   '}  ${String(L.badgePx).padStart(4)} ${String(L.captionPx).padStart(4)} ${String(L.namePx).padStart(4)}(${L.nameLines.length}${L.runBeside ? 'B' : ''})  ${String(runPx).padStart(3)} ${String(titlePx).padStart(4)} ${String(footPx).padStart(5)} ${String(L.floor).padStart(4)} ${String(L.small).padStart(4)} | largest non-hero: ${nonHero.l}=${nonHero.px} ${flags.join('; ')}${emptyPx ? ' empty=' + emptyPx : ''}`);
    }
  }
})();
