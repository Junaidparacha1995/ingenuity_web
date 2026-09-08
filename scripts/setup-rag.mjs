import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { spawnSync } from 'child_process';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
if(!process.env.OPENAI_API_KEY){console.error('Missing OPENAI_API_KEY. Copy .env.example to .env and add the server-side key.');process.exit(1);}
const build=spawnSync(process.execPath,[path.join(here,'build-knowledge.mjs')],{stdio:'inherit'});if(build.status!==0)process.exit(build.status||1);
const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
let state={};try{state=JSON.parse(fs.readFileSync(path.join(root,'.rag-store.json'),'utf8'));}catch{}
let vectorStoreId=process.env.RAG_VECTOR_STORE_ID||state.vectorStoreId||'';
if(!vectorStoreId){const store=await openai.vectorStores.create({name:'Ingenuity Systems Website Knowledge'});vectorStoreId=store.id;console.log('Created vector store:',vectorStoreId);}else console.log('Reusing vector store:',vectorStoreId);

const manifest=JSON.parse(fs.readFileSync(path.join(root,'knowledge','manifest.json'),'utf8'));
const previous=state.documents||{};const next={};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const waitForFile=async fileId=>{for(let i=0;i<90;i++){const list=await openai.vectorStores.files.list(vectorStoreId,{limit:100});const item=list.data.find(x=>x.file_id===fileId||x.id===fileId);if(item?.status==='completed')return;if(item?.status==='failed')throw new Error(`Indexing failed for ${fileId}`);await sleep(1500);}throw new Error(`Timed out indexing ${fileId}`);};

for(const doc of manifest){
  const name=path.basename(doc.file),old=previous[name];
  if(old?.sha256===doc.sha256&&old?.fileId){next[name]=old;console.log('Unchanged:',name);continue;}
  if(old?.fileId){try{await openai.files.delete(old.fileId);}catch{}}
  process.stdout.write(`Uploading ${name}... `);
  const uploaded=await openai.files.create({file:fs.createReadStream(path.join(root,doc.file)),purpose:'assistants'});
  await openai.vectorStores.files.create(vectorStoreId,{file_id:uploaded.id});await waitForFile(uploaded.id);
  next[name]={fileId:uploaded.id,sha256:doc.sha256,url:doc.url,title:doc.title};console.log('indexed');
}
for(const [name,old] of Object.entries(previous)){
  if(next[name])continue;
  if(old?.fileId){console.log('Removing stale source:',name);try{await openai.files.delete(old.fileId);}catch{}}
}
const output={vectorStoreId,updatedAt:new Date().toISOString(),documents:next};fs.writeFileSync(path.join(root,'.rag-store.json'),JSON.stringify(output,null,2));
console.log(`RAG sync complete: ${Object.keys(next).length} current sources.`);console.log('Now run: npm start');
