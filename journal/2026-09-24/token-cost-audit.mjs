import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const phases = [];
const incomplete = [];
for (const name of fs.readdirSync(path.join(dir, 'logs')).filter(n => /^(scout|plan|build|critique|ship)-\d+\.jsonl$/.test(n))) {
  const usage = { input: 0, cachedInput: 0, output: 0, events: 0 };
  let failedEvents = 0;
  for (const line of fs.readFileSync(path.join(dir, 'logs', name), 'utf8').split(/\r?\n/)) {
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (event.type === 'turn.failed' || event.type === 'error') failedEvents++;
    if (event.type !== 'turn.completed' || !event.usage) continue;
    usage.input += Number(event.usage.input_tokens ?? 0);
    usage.cachedInput += Number(event.usage.cached_input_tokens ?? 0);
    usage.output += Number(event.usage.output_tokens ?? 0);
    usage.events++;
  }
  if (failedEvents || !usage.events) incomplete.push({ log: name, failedEvents, completedUsageEvents: usage.events, note: 'Usage for interrupted or incomplete turns may be missing; no zero-cost assumption.' });
  if (!usage.events) continue;
  if (usage.cachedInput > usage.input) throw new Error(`Invalid cached token count: ${name}`);
  phases.push({ phase: name.replace('.jsonl', ''), ...usage,
    totalTokens: usage.input + usage.output,
    standardShortContextApiEquivalentUsd: ((usage.input - usage.cachedInput) * 4 + usage.cachedInput * 0.4 + usage.output * 20) / 1e6 });
}
const order = ['scout', 'plan', 'build', 'critique', 'ship'];
const recoveredPath = path.join(dir, 'recovered-build-usage.json');
if (fs.existsSync(recoveredPath)) {
  const recovered = JSON.parse(fs.readFileSync(recoveredPath, 'utf8').replace(/^\uFEFF/, ''));
  const u = recovered.usage;
  phases.push({ phase: recovered.phase, input: u.input_tokens, cachedInput: u.cached_input_tokens, output: u.output_tokens,
    totalTokens: u.input_tokens + u.output_tokens, source: recovered.source, threadId: recovered.threadId,
    standardShortContextApiEquivalentUsd: ((u.input_tokens - u.cached_input_tokens) * 4 + u.cached_input_tokens * 0.4 + u.output_tokens * 20) / 1e6 });
}
phases.sort((a, b) => order.indexOf(a.phase.split('-')[0]) - order.indexOf(b.phase.split('-')[0]) || a.phase.localeCompare(b.phase));
const sum = key => phases.reduce((n, p) => n + p[key], 0);
const audit = {
  modelFlag: 'gpt-5.6-sol', pricedAt: '2026-09-24',
  pricingSource: 'https://developers.openai.com/api/docs/models/gpt-5.6-sol',
  basis: 'Standard short-context API-equivalent estimate, not an invoice. Per-request context length, service tier, tool charges, and supervising-chat usage are unavailable and excluded. Input includes cached input; totalTokens does not double count the cache.',
  ratesUsdPerMillion: { uncachedInput: 4, cachedInput: 0.4, output: 20 },
  phases,
  incomplete,
  totals: Object.fromEntries(['input', 'cachedInput', 'output', 'totalTokens', 'standardShortContextApiEquivalentUsd'].map(k => [k, sum(k)])),
};
fs.writeFileSync(path.join(dir, 'token-costs.json'), JSON.stringify(audit, null, 2) + '\n');
const report = path.join(dir, '60-token-costs.md');
let markdown = fs.readFileSync(report, 'utf8').split('\n## Measured phase usage')[0];
markdown = markdown.replace('Final phase totals pending.', 'The table below includes completed phase usage events available when this audit was generated.');
markdown += '\n## Measured phase usage\n\n| Phase | Input (includes cache) | Cached input | Output | Total tokens | API-equivalent USD |\n| --- | ---: | ---: | ---: | ---: | ---: |\n';
for (const p of phases) markdown += `| ${p.phase} | ${p.input} | ${p.cachedInput} | ${p.output} | ${p.totalTokens} | $${p.standardShortContextApiEquivalentUsd.toFixed(4)} |\n`;
markdown += `| **Total** | **${sum('input')}** | **${sum('cachedInput')}** | **${sum('output')}** | **${sum('totalTokens')}** | **$${sum('standardShortContextApiEquivalentUsd').toFixed(4)}** |\n`;
markdown += '\nReproduce with `node journal/2026-09-24/token-cost-audit.mjs`. Raw CLI transcripts and the runner trace remain unchanged. The runner tutorial may use its older generic estimate; this audit supplies the separately verified pricing basis.\n';
if (fs.existsSync(recoveredPath)) markdown += '\nThe interrupted first build is recovered separately from its local Codex session token counter, preserved in `recovered-build-usage.json`. That thread emitted no turn.completed usage event, so it is not duplicated in the phase transcript totals.\n';
if (incomplete.length) markdown += '\n**Incomplete accounting:** these logs contain failed turns or lack a completed usage event: ' + incomplete.map(p => '`' + p.log + '`').join(', ') + '. Their unreported usage is excluded, not treated as zero. Totals above cover reported usage only and are not the complete cost of all attempts.\n';
fs.writeFileSync(report, markdown);
console.log(JSON.stringify(audit.totals));
