import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const here=path.dirname(fileURLToPath(import.meta.url));const root=path.resolve(here,'..');const file=path.join(root,'data','projects.json');
const data=JSON.parse(fs.readFileSync(file,'utf8'));const headers={'Accept':'application/vnd.github+json','User-Agent':'IngenuitySystems-Portfolio'};if(process.env.GITHUB_TOKEN)headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
async function get(url){const r=await fetch(url,{headers});if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json();}
try{
  const profile=await get(`https://api.github.com/users/${data.profile}`);data.publicRepositoryCount=profile.public_repos;data.lastVerified=new Date().toISOString();
  for(const item of data.projects){
    const m=item.repository.match(/github\.com\/([^/]+)\/([^/#?]+)/);if(!m)continue;
    try{const repo=await get(`https://api.github.com/repos/${m[1]}/${m[2]}`);Object.assign(item,{githubName:repo.name,description:repo.description||item.description,language:repo.language||item.language,stars:repo.stargazers_count,forks:repo.forks_count,updatedAt:repo.updated_at,topics:repo.topics||[],repository:repo.html_url});}catch(error){console.warn(`Keeping cached metadata for ${item.slug}: ${error.message}`);}
  }
  fs.writeFileSync(file,JSON.stringify(data,null,2));console.log(`GitHub metadata synced: ${data.publicRepositoryCount} public repositories, ${data.projects.length} curated projects.`);
}catch(error){console.warn('GitHub sync unavailable; cached project metadata retained:',error.message);}
