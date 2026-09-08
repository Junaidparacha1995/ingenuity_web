import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const outDir=path.join(root,'knowledge','generated');
fs.mkdirSync(outDir,{recursive:true});

const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const p=path.join(dir,entry.name);
  if(entry.isDirectory()){
    if(['node_modules','knowledge','server','scripts'].includes(entry.name))return [];
    return walk(p);
  }
  return p.endsWith('.html')&&path.basename(p)!=='404.html'?[p]:[];
});
const decode=s=>s.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
const attr=(tag,name)=>tag.match(new RegExp(`${name}=["']([^"']*)["']`,'i'))?.[1]||'';
const materializeAnimatedValues=source=>source.replace(/<([a-z0-9]+)([^>]*\bdata-countup=["'][^"']+["'][^>]*)>[\s\S]*?<\/\1>/gi,(all,tag,attrs)=>{
  const value=attr(attrs,'data-countup'),prefix=attr(attrs,'data-prefix'),suffix=attr(attrs,'data-suffix');
  return `${prefix}${value}${suffix}`;
});
const cleanHtml=source=>{
  let s=materializeAnimatedValues(source);
  s=s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<svg[\s\S]*?<\/svg>/gi,' ').replace(/<header[\s\S]*?<\/header>/gi,' ').replace(/<footer[\s\S]*?<\/footer>/gi,' ').replace(/<div[^>]+class=["'][^"']*site-assistant[^"']*["'][\s\S]*$/gi,' ').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(p|h1|h2|h3|h4|li|section|article|div|strong|span)>/gi,'\n').replace(/<[^>]+>/g,' ');
  return decode(s).replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim();
};
const titleOf=source=>(source.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'Ingenuity Systems').replace(/<[^>]+>/g,'').trim();
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
for(const old of fs.readdirSync(outDir))if(old.endsWith('.md'))fs.unlinkSync(path.join(outDir,old));
const manifest=[];
for(const file of walk(root)){
  const rel=path.relative(root,file).replaceAll('\\','/');
  const source=fs.readFileSync(file,'utf8'),title=titleOf(source),text=cleanHtml(source);
  const safe=rel.replace(/\.html$/,'').replace(/[^a-z0-9/_-]/gi,'-').replaceAll('/','__')||'index';
  const target=path.join(outDir,`${safe}.md`),urlPath=rel==='index.html'?'/':rel.endsWith('/index.html')?`/${rel.slice(0,-'/index.html'.length)}`:`/${rel.replace(/\.html$/,'')}`;
  const md=`# ${title}\n\nSource page: ${urlPath}\n\n${text}\n`;
  fs.writeFileSync(target,md);
  manifest.push({page:rel,url:urlPath,file:path.relative(root,target).replaceAll('\\','/'),title,sha256:hash(md)});
}
// Add structured facts as a separate source of truth.
for(const [filename,title] of [['data/site-content.json','Verified company facts'],['data/projects.json','Public project metadata']]){
  const file=path.join(root,filename);if(!fs.existsSync(file))continue;
  const content=fs.readFileSync(file,'utf8'),md=`# ${title}\n\n${content}\n`,target=path.join(outDir,filename.includes('projects')?'public-project-metadata.md':'verified-company-facts.md');
  fs.writeFileSync(target,md);manifest.push({page:filename,url:'/',file:path.relative(root,target).replaceAll('\\','/'),title,sha256:hash(md)});
}
fs.writeFileSync(path.join(root,'knowledge','manifest.json'),JSON.stringify(manifest,null,2));
console.log(`Knowledge base generated from ${manifest.length} sources.`);
