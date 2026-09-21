import fs from "node:fs"; import path from "node:path";
const DIR = path.resolve("journal/2026-09-21/logs/attack-make-it-clip/props");
const R = (c,n)=>c.repeat(n);
const cases = {
  "20-bignum-unit30": { rows: [
    { name: "a", unit: "nanoseconds_per_iteration_core", base: 1234567.89, value: 9876543.21, baseRange: 1000, range: 1000 },
    { name: "b", unit: "nanoseconds_per_iteration_core", base: 8765432.1, value: 1234567.8, baseRange: 1000, range: 1000 },
    { name: "c", unit: "nanoseconds_per_iteration_core", base: 4444444.4, value: 5555555.5 },
    { name: "d", unit: "nanoseconds_per_iteration_core", base: 7777777.7, value: 6666666.6, baseRange: 5, range: 5 },
  ]},
  "21-bignum-unit30-W": { rows: [
    { name: "a", unit: R("@",30), base: 1234567.89, value: 9876543.21, baseRange: 1000, range: 1000 },
    { name: "b", unit: R("@",30), base: 8765432.1, value: 1234567.8, baseRange: 1000, range: 1000 },
    { name: "c", unit: R("@",30), base: 4444444.4, value: 5555555.5 },
    { name: "d", unit: R("@",30), base: 7777777.7, value: 6666666.6, baseRange: 5, range: 5 },
  ]},
  "22-at200": { rows: [
    { name: R("@",200), unit: "ms", base: 412, baseRange: 14, value: 171, range: 6 },
    { name: R("@",199), unit: "ms", base: 88.2, baseRange: 9.6, value: 84.6, range: 8.4 },
    { name: R("@",198), unit: "ms", base: 1240, baseRange: 61, value: 1395, range: 64 },
    { name: R("@",197), unit: "ms", base: 59, value: 44.5 },
  ]},
  "23-name46-at": { rows: [0,1,2,3].map(i=>({ name: R("@",46), unit:"ms", base: 100+i, value: 50+i, baseRange: 1, range: 1 })) },
  "24-onerow-long": { rows: [{ name: R("resolve deeply nested module graph ",200).slice(0,200), unit:"ms", base: 100, value: 50, baseRange: 2, range: 2 }] },
  "25-manyshortwords": { rows: [{ name: "a b c d e f g h i j k l m n o p q r s t u v w x y z a b c d e f g h i j", unit:"ms", base:100, value:50, baseRange:1, range:1 }] },
  "26-rows8-name46": { rows: Array.from({length:8},(_,i)=>({ name: "resolve nested module graph with dedupe on r".slice(0,46).padEnd(46,"x"), unit:"ms", base:100+i*10, value:50+i*10, baseRange:2, range:2 })) },
  "27-title200-only": { title: R("@",200), subtitle: "" },
  "28-bignum-name200": { rows: [
    { name: R("resolve deeply nested node_modules graph with symlink dedupe ",200).slice(0,200), unit: "nanoseconds_per_iteration_core", base: 1234567.89, value: 9876543.21, baseRange: 1000, range: 1000 },
    { name: R("x",120), unit: "nanoseconds_per_iteration_core", base: 8765432.1, value: 1234567.8 },
  ]},
};
for (const [k,v] of Object.entries(cases)) fs.writeFileSync(path.join(DIR,k+".json"), JSON.stringify(v,null,2));
console.log("wrote", Object.keys(cases).length);
