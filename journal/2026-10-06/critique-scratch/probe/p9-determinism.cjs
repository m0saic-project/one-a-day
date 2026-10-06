const { m, render, tryIt, texts } = require('./lib.cjs');
const assert = require('assert');
const TEN = '6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250';
(async () => {
  for (const [w, h] of [[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270]]) {
    for (const props of [{}, { milestones: TEN }, { milestones: '' }, { debugLayout: true }]) {
      if (props.milestones === TEN && w === 480) continue;
      const a = JSON.stringify(await render(props, w, h));
      const b = JSON.stringify(await render(props, w, h));
      // also with a frozen defaults copy (production-like)
      const frozen = Object.freeze({ ...m.WeeklyRunReportV1.defaultProps, ...props });
      const c = JSON.stringify(await render(frozen, w, h));
      let same = a === b;
      try { assert.deepStrictEqual(JSON.parse(a), JSON.parse(b)); } catch { same = false; }
      console.log(`${w}x${h} ${JSON.stringify(props).slice(0, 30)} twice-equal=${same} frozen-defaults-equal=${a === c} bytes=${a.length}`);
    }
  }
  // tutorial determinism
  if (m.WeeklyRunReportV1.renderTutorial) {
    const ctx = require('./lib.cjs').ctx(1280, 720);
    const t1 = JSON.stringify(await m.WeeklyRunReportV1.renderTutorial(m.WeeklyRunReportV1.defaultProps, ctx));
    const t2 = JSON.stringify(await m.WeeklyRunReportV1.renderTutorial(m.WeeklyRunReportV1.defaultProps, ctx));
    console.log('tutorial twice-equal', t1 === t2, t1.length);
  }
  // null / cleared-field handling (host validator treats null as unset)
  for (const k of ['eventName', 'runNumber', 'date', 'counts', 'milestones', 'footer', 'accent', 'debugLayout']) {
    const r = await tryIt(() => render({ [k]: null }));
    console.log(`null ${k}: ${r.ok ? 'accepted' : 'REFUSED ' + r.err.replace(/^.*?v1: /, '')}`);
  }
  // ß expansion: 40 ß -> 80 SS
  for (const name of ['ß'.repeat(40), 'Straße '.repeat(5).trim().slice(0, 40), 'ŉŉ']) {
    const r = await tryIt(() => render({ eventName: name }, 1080, 1080));
    console.log(`eventName ${JSON.stringify(name)} (${name.length}): ${r.ok ? JSON.stringify(texts(r.v).filter(x => /^event-name/.test(x.label)).map(x => x.text + '@' + x.src.layers[0].style.fontSize)) : 'REFUSED ' + r.err.replace(/^.*?v1: /, '')}`);
  }
  // accent handling
  for (const accent of ['#ffff00', '#808080', '#dde1da', '#FFFFFF', '#1F7A4D', ' #1f7a4d ']) {
    const r = await tryIt(() => render({ accent }));
    if (!r.ok) { console.log(`accent ${accent}: REFUSED ${r.err}`); continue; }
    const t = texts(r.v);
    const hero = t.find(x => x.label === 'value-finishers').src.layers[0].style.fontColor;
    const cap = t.find(x => x.label === 'badge-caption-1').src.layers[0].style.fontColor;
    const fill = Object.values(r.v.children['badge-1'].sources).find(s => s.editor && s.editor.label === 'badge').color;
    const vfill = Object.values(r.v.children['badge-4'].sources).find(s => s.editor && s.editor.label === 'badge').color;
    console.log(`accent ${JSON.stringify(accent)}: hero ink ${hero}; run badge fill ${fill} text ${cap} contrast ${m.contrast(fill, cap).toFixed(2)}; vol badge fill ${vfill}; heroContrastVsTile ${m.contrast(hero, '#fbfbfb').toFixed(2)}`);
  }
})().catch(e => { console.error(e); process.exit(1); });
