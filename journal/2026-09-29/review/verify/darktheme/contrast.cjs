const lum = (h) => { const c = [1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255).map(v => v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; };
const cr = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05); };
const INK = "#15171C";
const cols = { default:"#FFE08A", navy:"#1E3A8A", blue:"#0000FF", purple:"#6A1B9A", green:"#008000", red:"#D32F2F", mdBlue500:"#2196F3", mdRed500:"#F44336", mdGreen500:"#4CAF50", mdPurple500:"#9C27B0", mdIndigo500:"#3F51B5", mdTeal500:"#009688", mdOrange500:"#FF9800", nytBlue:"#4F85E5", pink:"#FFC0CB", lightblue:"#ADD8E6", grey:"#808080", ink:INK };
for (const [k,v] of Object.entries(cols)) console.log(k.padEnd(12), v, cr(INK,v).toFixed(2));
const { normalizeCrossword } = require("C:/src/m0saic-production/one-a-day/dist/gaming/crossword-grid-card/v1/crossword-grid-card.js");
for (const c of ["#1E3A8A", "#15171C", "#000000"]) { try { const n = normalizeCrossword({ themeColor: c }); console.log("accepted", c, n.themeColor); } catch (e) { console.log("rejected", c, e.message); } }
