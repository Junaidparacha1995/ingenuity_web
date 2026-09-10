import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'attached_assets' || entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
}
walk(root);

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const normalized = source.replace(
    /\b(href|src)="((?:\/|\.\.\/)?assets\/(?:css|js)\/[^"?]+?)(?:\?v=[^"]*)?"/g,
    '$1="$2?v=6.10.14"'
  );
  if (normalized !== source) fs.writeFileSync(file, normalized);
}
console.log(`Normalized ${files.length} HTML files`);