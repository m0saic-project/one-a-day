import fs from 'node:fs';
const P = process.argv[2];
const R = (o={}) => ({ name:"a", unit:"ms", base:10, value:5, ...o });
const cases = {
  "01-empty-rows": { rows: [] },
  "02-base-zero": { rows: [R({base:0})] },
  "03-base-negative": { rows: [R({base:-5})] },
  "04-value-zero": { rows: [R({value:0})] },
  "05-value-negative": { rows: [R({value:-3})] },
  "06-nan": { rows: [R({base:"NaN"})] },
  "07-null-base": { rows: [R({base:null})] },
  "08-string-num": { rows: [R({base:"10",value:"5"})] },
  "09-40rows": { rows: Array.from({length:40},(_,i)=>R({name:"row "+i, base:100+i, value:90+i, baseRange:2, range:2})) },
  "10-bad-accent": { rows:[R()], accent: "red" },
  "11-bad-preset": { rows:[R()], preset: "solarized" },
  "12-rows-object": { rows: { name:"a", base:1, value:1 } },
  "13-negative-range": { rows: [R({baseRange:-4, range:-4})] },
  "14-infinity": { rows: [R({base:1e308, value:1e-308})] },
  "15-empty-name": { rows: [R({name:""})] },
  "16-unicode": { rows: [R({name:"parse → json éé"})] },
  "17-missing-value": { rows: [{ name:"a", base:10 }] },
  "18-no-rows-key": { title: "no rows at all" },
  "19-huge-ratio": { rows: [R({base:1, value:100000, baseRange:0.001, range:0.001})] },
  "20-tiny-ratio": { rows: [R({base:100000, value:1, baseRange:0.001, range:0.001})] },
};
for (const [k,v] of Object.entries(cases)) fs.writeFileSync(`${P}/${k}.json`, JSON.stringify(v));
console.log(Object.keys(cases).length, "props files written");
