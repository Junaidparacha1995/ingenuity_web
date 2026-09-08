import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'..');
const html=[];for(const dir of ['.','pages','services','industries','projects','case-studies'])for(const f of fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith('.html')))html.push(dir==='.'?f:`${dir}/${f}`);
let errors=[];const localRef=/\b(?:href|src)=["']([^"']+)["']/g;
const resolveLocal=(file,ref)=>{
  const clean=ref.split(/[?#]/)[0];
  if(!clean)return null;
  if(clean.startsWith('/')){
    const route=clean.replace(/^\/+|\/+$/g,'');
    if(!route)return path.join(root,'index.html');
    const direct=path.join(root,route);
    if(fs.existsSync(direct))return direct;
    if(fs.existsSync(`${direct}.html`))return `${direct}.html`;
    if(fs.existsSync(path.join(direct,'index.html')))return path.join(direct,'index.html');
    return direct;
  }
  const target=path.resolve(path.dirname(file),clean);
  if(fs.existsSync(target))return target;
  if(fs.existsSync(`${target}.html`))return `${target}.html`;
  if(fs.existsSync(path.join(target,'index.html')))return path.join(target,'index.html');
  return target;
};
for(const rel of html){const file=path.join(root,rel),s=fs.readFileSync(file,'utf8');const ids=[...s.matchAll(/\bid=["']([^"']+)["']/g)].map(x=>x[1]);const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);if(dup.length)errors.push(`${rel}: duplicate ids ${[...new Set(dup)].join(',')}`);const h1=(s.match(/<h1\b/gi)||[]).length;if(rel!=='404.html'&&h1!==1)errors.push(`${rel}: expected 1 h1, found ${h1}`);if(rel!=='404.html'&&!/<main\b[^>]*id=["']main-content["']/i.test(s))errors.push(`${rel}: missing main landmark`);if(rel!=='404.html'&&!/<nav\b[^>]*class=["'][^"']*nav/i.test(s))errors.push(`${rel}: missing primary nav`);if(/assets\/css\/styles\.css/.test(s))errors.push(`${rel}: legacy monolithic CSS still linked`);for(const m of s.matchAll(localRef)){let ref=m[1];if(!ref||/^(?:https?:|mailto:|tel:|#|javascript:|data:)/.test(ref))continue;const target=resolveLocal(file,ref);if(!target||!fs.existsSync(target))errors.push(`${rel}: missing ${m[1]}`);}}
const js=['assets/js/script.js','assets/js/premium.js','assets/js/projects.js','assets/js/v6.js','server/server.js','scripts/build-knowledge.mjs','scripts/setup-rag.mjs','scripts/sync-github.mjs'];
for(const f of js)if(!fs.existsSync(path.join(root,f)))errors.push(`missing ${f}`);
const all=html.map(x=>fs.readFileSync(path.join(root,x),'utf8')).join('\n');if(/60% of first-line|real estate, financial services, and manufacturing<\/strong>/i.test(all))errors.push('stale unverified case-study claim found');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));if(Object.values(pkg.dependencies||{}).includes('latest'))errors.push('package.json still uses latest dependency versions');
console.log(`Audited ${html.length} HTML files.`);if(errors.length){console.error(errors.join('\n'));process.exit(1);}console.log('PASS: landmarks, h1 structure, local references, CSS layering, stale claims, and dependency policy.');
