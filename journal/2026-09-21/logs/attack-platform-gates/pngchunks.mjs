import fs from 'node:fs'; import crypto from 'node:crypto';
for (const f of process.argv.slice(2)) {
  const b = fs.readFileSync(f); let o = 8; const out = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o); const type = b.toString('ascii', o+4, o+8);
    const data = b.subarray(o+8, o+8+len);
    out.push(`${type}:${len}:${crypto.createHash('sha256').update(data).digest('hex').slice(0,12)}`);
    o += 12 + len; if (type === 'IEND') break;
  }
  console.log(f.split(/[\/]/).pop().padEnd(22), out.join(' | '));
}
