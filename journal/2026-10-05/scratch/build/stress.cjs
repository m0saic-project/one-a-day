// Scratch: the two pinned copies (row 7 alone, an 80-character title that still fits) at the seven canvases.
const t=require('../../../../dist/music/radio-top-30-chart/v1/radio-top-30-chart.js');
const T80='The Night We Drove the Long Way Home Past Every Radio Tower in the County, Twice';
const C=[[1920,1080],[1280,720],[1080,1920],[1080,1080],[3840,2160],[640,360],[480,270]];
const rows=t.RadioTop30ChartV1.defaultProps.rows.slice(); rows[11]='Tall Grass Choir | '+T80+' | Low Tide | NEW';
for (const [w,h] of C) { try { const t0=Date.now(); const L=t.layoutRadioChart({rows},w,h); const r=L.rows[11]; console.log(w,h,'caps',L.artistCap.toFixed(2),L.titleCap.toFixed(2),'shared',L.shared.toFixed(3),'row12',r.titlePx.toFixed(2),(r.titlePx/L.titleCap).toFixed(3), 'row7', (L.rows[6].titlePx/L.titleCap).toFixed(3), Date.now()-t0+'ms'); } catch(e){console.log(w,h,e.message)} }
const all=Array.from({length:30},()=>'The Extremely Long Named Orchestra of Upper Tidewater County | '+T80+' | Brass Key');
for (const [w,h] of C) { try { const L=t.layoutRadioChart({rows:all},w,h); const r=L.rows[0]; console.log(w,h,'ALL shared',L.shared.toFixed(3),(r.artistPx/L.artistCap).toFixed(3),(r.titlePx/L.titleCap).toFixed(3)); } catch(e){console.log(w,h,e.message)} }
const lead=t.RadioTop30ChartV1.defaultProps.rows;
for (const [w,h] of C) { try { const a=t.layoutRadioChart({},w,h), b=t.layoutRadioChart({lead:true},w,h); console.log(w,h,'lead: pitch',a.pitch,'->',b.pitch,'artist',a.artistShared.toFixed(2),'->',b.artistShared.toFixed(2),((b.artistShared/a.artistShared-1)*100).toFixed(1)+'%', 'row7', (b.rows[6].titlePx/b.titleCap).toFixed(3)); } catch(e){console.log(w,h,e.message)} }
