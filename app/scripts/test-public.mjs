import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import worker from '../dist/public/index.mjs';
import {sessionValid} from '../dist/public/auth.mjs';
import {buildPublic,outputDirectory,projectProjection} from './build-public.mjs';

const appRoot=fileURLToPath(new URL('../',import.meta.url));
const registry=JSON.parse(await readFile(path.resolve(appRoot,'../docs/project-registry/project-registry.json'),'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
const get=(url,method='GET')=>worker.fetch(new Request('https://public.example.test'+url,{method}));
const outputHashes=async()=>Object.fromEntries(await Promise.all((await readdir(outputDirectory)).sort().map(async name=>[name,hash(await readFile(path.join(outputDirectory,name)))])));

test('build reads only reviewed metadata, design reference and original auth source',async()=>{
 const manifest=JSON.parse(await readFile(path.join(outputDirectory,'build-manifest.json'),'utf8'));
 assert.equal(manifest.mode,'UNCONNECTED');
 assert.equal(manifest.hosting_configuration_included,false);
 assert.equal(manifest.operational_records_included,false);
 assert.equal(manifest.matches_current_site,false);
 assert.deepEqual(manifest.inputs.map(x=>x.path),['../docs/project-registry/project-registry.json','../docs/architecture/README.md','worker/auth.mjs']);
 assert.deepEqual((await readdir(outputDirectory)).sort(),['auth.mjs','build-manifest.json','index.mjs']);
 const auth=await readFile(path.join(appRoot,'worker/auth.mjs'));
 assert.equal(hash(auth),manifest.inputs[2].sha256);
 assert.equal(hash(await readFile(path.join(outputDirectory,'auth.mjs'))),hash(auth));
});

test('project API exposes only technical metadata in unconnected mode with no external request',async()=>{
 const originalFetch=globalThis.fetch;
 globalThis.fetch=()=>{throw Error('External requests are forbidden in public mode')};
 try{
  const response=await get('/api/public/projects');
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.mode,'UNCONNECTED');
  assert.equal(data.connected,false);
  assert.equal(data.operational_records_available,false);
  assert.equal(data.projects.length,6);
  assert.deepEqual(Object.keys(data.projects[0]).sort(),['designs','maturity','project_id','repository_url','source_commit_sha','title']);
 }finally{globalThis.fetch=originalFetch}
});

test('operational, career-data, original dashboard and proxy routes are unavailable',async()=>{
 for(const url of ['/dashboard','/cohort.json','/campaign.json','/operational.json','/snapshot.json','/ultra-applications.csv','/api/quasar/v1/snapshot','/api/quasar/v1/snapshot?demo=1','/api/atlas/v1/review-decisions','/mcp','/web/campaign.json']){
  const response=await get(url);
  assert.equal(response.status,404,url);
  assert.ok(!response.headers.has('set-cookie'),url);
 }
});

test('public mode rejects writes regardless of supplied request identity',async()=>{
 for(const url of ['/','/api/public/projects','/api/quasar/v1/applications']){
  const response=await worker.fetch(new Request('https://public.example.test'+url,{method:'POST',headers:{'oai-authenticated-user-id':'fixture-owner'}}));
  assert.equal(response.status,405,url);
 }
});

test('original authentication is unavailable and fail-closed without runtime configuration',async()=>{
 for(const url of ['/api/login','/api/session','/api/logout']){
  const response=await get(url);
  assert.equal(response.status,503,url);
  assert.ok(!response.headers.has('set-cookie'));
 }
 assert.equal(await sessionValid(new Request('https://public.example.test/'),{}),false);
});

test('fixture activation and provider filters cannot activate a data source',async()=>{
 for(const query of ['demo=1','state=CONNECTED','provider=atlas','token=fixture']){
  const response=await get('/api/public/projects?'+query);
  assert.equal(response.status,400,query);
 }
});

test('static pages retain safe headers and HEAD omits all response content',async()=>{
 const page=await get('/');
 assert.equal(page.status,200);
 assert.match(await page.text(),/UNCONNECTED/);
 assert.match(page.headers.get('content-security-policy'),/connect-src 'none'/);
 for(const url of ['/','/architecture','/projects.json','/api/public/projects']){
  const response=await get(url,'HEAD');
  assert.equal(response.status,200,url);
  assert.equal(await response.text(),'');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('cache-control'),'no-store');
 }
});

test('projection rejects unknown identity, unsafe source links and approved career claims',()=>{
 for(const change of [
  value=>value.projects[0].repository.url='https://unapproved.example.test/private',
  value=>value.projects[0].project_id='unreviewed',
  value=>value.projects[0].approved_cv_claims=['unsupported'],
  value=>value.projects[0].repository.source_commit_sha='main',
  value=>value.projects[0].maturity.stage='CONNECTED',
 ]){
  const value=structuredClone(registry);change(value);
  assert.throws(()=>projectProjection(value));
 }
});

test('unknown source fields cannot leak into the minimal technical projection',()=>{
 const value=structuredClone(registry);
 value.private_records=[{fixture_marker:'DO_NOT_COPY_PRIVATE_FIXTURE'}];
 value.projects[0].candidate_history={fixture_marker:'DO_NOT_COPY_PRIVATE_FIXTURE'};
 const result=JSON.stringify(projectProjection(value));
 assert.ok(!result.includes('DO_NOT_COPY_PRIVATE_FIXTURE'));
 assert.ok(!result.includes('candidate_history'));
 assert.ok(!result.includes('private_records'));
});

test('same public inputs produce identical generated files',async()=>{
 const before=await outputHashes();
 await buildPublic();
 assert.deepEqual(await outputHashes(),before);
});

test('unexpected generated assets cannot silently survive another build',async()=>{
 const unexpected=path.join(outputDirectory,'unexpected.json');
 await writeFile(unexpected,'{"fixture":"DO_NOT_KEEP"}');
 try{await assert.rejects(buildPublic(),/unexpected files/)}
 finally{await unlink(unexpected)}
});

test('generated worker and retained public source omit operational resource references',async()=>{
 const source=await readFile(path.join(outputDirectory,'index.mjs'),'utf8');
 assert.ok(!source.includes('FixtureProvider'));
 assert.ok(!source.includes('atlas-providers.js'));
 assert.ok(!source.includes('ultra-applications.csv'));
 assert.ok(!source.includes('.openai/hosting.json'));
 const forbidden=[
  /https?:\/\/(?:docs|drive|sheets)\.google\.com\//i,
  /https?:\/\/[^\s"'<>]*(?:workers\.dev|supabase\.(?:co|com)|cloudfront\.net|execute-api\.)/i,
  /appg(?:prj|ver|dep)_[a-z0-9_-]+/i,
 ];
 async function checkDirectory(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
   if(['dist','__pycache__','node_modules','.git'].includes(entry.name))continue;
   const item=path.join(directory,entry.name);
   if(entry.isDirectory())await checkDirectory(item);
   else if(entry.isFile()){
    const text=await readFile(item,'utf8');
    for(const pattern of forbidden)assert.ok(!pattern.test(text),'Unreviewed operational resource reference in '+path.relative(appRoot,item));
   }
  }
 }
 await checkDirectory(path.resolve(appRoot,'..'));
});
