const M = require("../../../../dist/community/weekly-run-report/v1/weekly-run-report.js");
const ms = "6xR25, 4xR50, 3xR100, 2xR250, 1xR500, 1xR1000, 5xV25, 3xV50, 2xV100, 1xV250";
for (const [W,H] of [[1080,1080],[1440,900],[3840,2160]]) {
  let t=Date.now(); try { M.settleLayout({milestones: ms}, W, H); } catch(e){console.log(e.message)} const a=Date.now()-t;
  t=Date.now(); try { M.layoutWeeklyRunReport({milestones: ms}, W, H); } catch(e){console.log(e.message)} const b=Date.now()-t;
  console.log(W,H,"settle",a,"ms layout",b,"ms");
}
