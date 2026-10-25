import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';

const appRoot=fileURLToPath(new URL('../',import.meta.url));
export const outputDirectory=path.join(appRoot,'dist','public');
const projectNames={
 'agentic-core':'Agentic Core',
 'system-architecture-workspace':'System Architecture Workspace',
 'quasar':'QUASAR',
 'rufus-eval-engine':'Rufus Eval Engine',
 'nhs-elective-flow-intelligence':'NHS Elective Flow Intelligence',
 'primelift':'PrimeLift AI',
};
const repositories=new Set(['agentic-core-evidence','system-architecture-workspace','Quasar','Rufus-Eval-Engine','nhs-elective-flow-intelligence','PrimeLift']);
const stages=new Set(['reviewed_runtime_excerpt','published_site_separate_source_export_pending','published_dashboard_site_readme_only_github_snapshot','independent_synthetic_evaluation_prototype','independent_aggregate_data_analytics_prototype','synthetic_causal_uplift_analytics_prototype','published_clean_demonstration','published_application_source']);
const digest=value=>createHash('sha256').update(value).digest('hex');
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
function safeLink(value){
 if(value===null)return null;
 const url=new URL(value);
 const parts=url.pathname.split('/').filter(Boolean);
 if(url.protocol!=='https:'||url.hostname!=='github.com'||url.username||url.password||url.search||(url.hash&&!/^#[A-Za-z0-9_-]+$/.test(url.hash))||parts[0]!=='jyotheshkar'||!repositories.has(parts[1]))throw Error('Public project link is outside reviewed repositories');
 return value;
}
export function projectProjection(registry){
 if(registry.public_safe!==true||registry.schema_version!=='1.0.0'||!Array.isArray(registry.projects)||registry.projects.length!==6)throw Error('A reviewed six-project public registry is required');
 const seen=new Set();
 const projects=registry.projects.map(project=>{
  const id=project.project_id;
  if(!Object.hasOwn(projectNames,id)||seen.has(id)||project.title!==projectNames[id])throw Error('Unknown or duplicate public project identity');
  seen.add(id);
  if(project.approved_cv_claims?.length||project.claim_approval_status!=='technical_evidence_only')throw Error('Career claims are not part of the public build');
  const repo=project.repository;
  if(repo.owner!=='jyotheshkar'||!repositories.has(repo.name)||repo.visibility!=='public')throw Error('Public repository identity is required');
  if(repo.source_commit_sha!==null&&!/^[0-9a-f]{40}$/.test(repo.source_commit_sha))throw Error('Invalid source revision');
  if(!stages.has(project.maturity.stage))throw Error('Unknown implementation stage');
  return {
   project_id:id,title:projectNames[id],
   repository_url:safeLink(repo.url),
   source_commit_sha:repo.source_commit_sha,
   maturity:project.maturity.stage,
   designs:project.designs.map(design=>({title:String(design.title).slice(0,160),url:safeLink(design.url),status:design.url?'documented':'pending'})),
  };
 });
 return {schema_version:'1.0.0',mode:'UNCONNECTED',connected:false,label:'Public project evidence only; no operational data source',operational_records_available:false,projects};
}
function htmlPage(title,body){
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><style>body{font:16px system-ui,sans-serif;max-width:72rem;margin:auto;padding:2rem;line-height:1.6;color:#ececec;background:#111}a{color:#ddd}nav{display:flex;gap:1.5rem}h1,h2{color:#fff}small,.badge{color:#d6c18a}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1rem}article{border:1px solid #555;padding:1.2rem;border-radius:.6rem}code,pre{overflow-wrap:anywhere;white-space:pre-wrap}footer{margin-top:2rem;border-top:1px solid #555;padding-top:1rem}</style><nav aria-label="Main navigation"><a href="/">Projects</a><a href="/architecture">Architecture scope</a><a href="/projects.json">Public metadata</a></nav><main>'+body+'</main><footer>UNCONNECTED public derivative. Historical v47 source; exact hosted v49 source synchronisation remains pending. No operational records, signed projections or live provider connection are included.</footer></html>';
}
export function publicAssets(projection,architecture){
 const cards=projection.projects.map(p=>'<article><h2>'+escape(p.title)+'</h2><p>'+escape(p.maturity.replaceAll('_',' '))+'</p><p><a href="'+escape(p.repository_url)+'">Inspect public source</a></p><p>Source revision: <code>'+escape(p.source_commit_sha||'Release receipt pending')+'</code></p><ul>'+p.designs.map(d=>'<li>'+(d.url?'<a href="'+escape(d.url)+'">'+escape(d.title)+'</a>':escape(d.title)+' (pending)')+'</li>').join('')+'</ul></article>').join('');
 return {
  '/':htmlPage('QUASAR Public Project Evidence','<h1>QUASAR</h1><p class="badge">UNCONNECTED · PUBLIC PROJECT EVIDENCE</p><p>This standalone viewer contains reviewed technical project metadata. It has no operational connection, career records or campaign metrics.</p><div class="cards">'+cards+'</div>'),
  '/architecture':htmlPage('QUASAR Architecture Scope','<h1>Evidence Architecture</h1><p>Newly authored reference documentation; intended relationships are not a deployment or integration receipt.</p><pre>'+escape(architecture)+'</pre>'),
  '/projects.json':JSON.stringify(projection,null,2),
 };
}
export async function buildPublic(){
 const relative=path.relative(appRoot,outputDirectory).replaceAll('\\','/');
 if(relative!=='dist/public'||!outputDirectory.startsWith(appRoot))throw Error('Unexpected generated output target');
 // Only these three generated files can exist here. Never sweep or copy a tree.
 await mkdir(outputDirectory,{recursive:true});
 const generated=new Set(['index.mjs','auth.mjs','build-manifest.json']);
 const existing=await readdir(outputDirectory);
 if(existing.some(name=>!generated.has(name)))throw Error('Generated output contains unexpected files; refusing to retain unknown assets');
 const registryFile=path.resolve(appRoot,'../docs/project-registry/project-registry.json');
 const architectureFile=path.resolve(appRoot,'../docs/architecture/README.md');
 const authFile=path.join(appRoot,'worker','auth.mjs');
 const [registryBytes,architectureBytes,authBytes]=await Promise.all([readFile(registryFile),readFile(architectureFile),readFile(authFile)]);
 const projection=projectProjection(JSON.parse(registryBytes.toString('utf8')));
 const assets=publicAssets(projection,architectureBytes.toString('utf8'));
 const server=[
  "import {handleAuth} from './auth.mjs';",
  'const ASSETS='+JSON.stringify(assets)+';',
  'const PROJECTS='+JSON.stringify(projection)+';',
  "const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});",
  "export default {async fetch(request,env={}){",
  " const url=new URL(request.url);",
  " const auth=await handleAuth(request,env);if(auth)return auth;",
  " if(!['GET','HEAD'].includes(request.method))return json({error:'Public evidence view is read-only'},405);",
  " if(!Object.hasOwn(ASSETS,url.pathname)&&url.pathname!=='/api/public/projects')return json({error:'Route unavailable in public evidence mode'},404);",
  " if(url.search)return json({error:'Query modes and provider filters are unavailable'},400);",
  " if(url.pathname==='/api/public/projects')return new Response(request.method==='HEAD'?null:JSON.stringify(PROJECTS),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});",
  " if(!Object.hasOwn(ASSETS,url.pathname))return json({error:'Route unavailable in public evidence mode'},404);",
  " return new Response(request.method==='HEAD'?null:ASSETS[url.pathname],{headers:{'content-type':url.pathname.endsWith('.json')?'application/json; charset=utf-8':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':\"default-src 'none'; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; frame-ancestors 'none'\"}});",
  "}};",
 ].join('\n');
 await writeFile(path.join(outputDirectory,'index.mjs'),server,'utf8');
 await copyFile(authFile,path.join(outputDirectory,'auth.mjs'));
 const manifest={schema_version:'1.0.0',mode:'UNCONNECTED',public_derivative:true,recovered_source_commit:'da0119d5ebb9780744e726a15967bd67a0e1fca8',current_site_source_commit:'e03b18fff2012e37f3d6800ddac4ba74c6b09134',matches_current_site:false,source_sync_status:'pending_exact_v49_retrieval',inputs:[{path:'../docs/project-registry/project-registry.json',sha256:digest(registryBytes)},{path:'../docs/architecture/README.md',sha256:digest(architectureBytes)},{path:'worker/auth.mjs',sha256:digest(authBytes)}],routes:[...Object.keys(assets),'/api/public/projects'],generated_files:[...generated],hosting_configuration_included:false,operational_records_included:false};
 await writeFile(path.join(outputDirectory,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
 return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const manifest=await buildPublic();
 console.log(JSON.stringify({mode:manifest.mode,routes:manifest.routes,generated_directory:'dist/public',hosting_configuration:false,operational_records:false}));
}
