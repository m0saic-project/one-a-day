const m = require('../../../../dist/community/weekly-run-report/v1/weekly-run-report.js');
function bands(L, W, H) {
  const hdr = L.tiles.find(t=>t.label==='header-rule').rect;
  const heroTop = Math.min(...L.heroRects.map(r=>r.y)), heroBot = Math.max(...L.heroRects.map(r=>r.y+r.h));
  const statTop = Math.min(...L.statRects.map(r=>r.y)), statBot = Math.max(...L.statRects.map(r=>r.y+r.h));
  const band = L.band; const foot = L.cells.find(c=>c.label==='footer');
  const m_ = Math.round(Math.min(H, 0.75*W)*0.05);
  const out = { hdrBot: hdr.y+hdr.h, gapHdrHero: heroTop-(hdr.y+hdr.h), heroH: L.heroRects[0].h, heroW: L.heroRects[0].w, gapHeroStat: statTop-heroBot, statH: L.statRects[0].h, statW: L.statRects[0].w, gapStatBand: band.y-statBot, bandH: band.h, gapBandFoot: foot ? foot.rect.y - (band.y+band.h) : null, belowFoot: foot ? (H - m_) - (foot.rect.y+foot.rect.h) : (H - m_) - (band.y+band.h) };
  return out;
}
for (const [w,h] of [[1080,1920],[720,1920],[600,1920],[1080,2400],[1080,3000],[500,1600],[864,1080],[850,1080]]) {
  for (const over of [{}, {footer:''}]) {
    try {
      const L0 = m.layoutWeeklyRunReport(over, w, h);
      const { L } = m.settleLayout(over, w, h);
      console.log(`${w}x${h} footer=${over.footer===''?'none':'yes'} ${L0.shape} pre:`, JSON.stringify(bands(L0,w,h)));
      console.log(`      settled:`, JSON.stringify(bands(L,w,h)), 'hero/stat/club', L.heroPx, L.statPx, L.badgePx, 'slab?', [...L.heroRects,...L.statRects].some(r=>r.h>1.3*r.w+1));
    } catch (e) { console.log(`${w}x${h} ERR ${e.message}`); }
  }
}
