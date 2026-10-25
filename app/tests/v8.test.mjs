import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import worker from '../dist/server/index.js';
const json=async name=>JSON.parse(await readFile(new URL('../web/'+name,import.meta.url),'utf8'));
test('v8 public shell shares navigation and never opens a separate architecture tab',async()=>{
 for(const name of ['login.html','dashboard.html','architecture.html'])assert.match(await readFile(new URL('../web/'+name,import.meta.url),'utf8'),/data-site-header/);
 const login=await readFile(new URL('../web/login.js',import.meta.url),'utf8');assert.doesNotMatch(login,/window\.open|architecture-dialog/);
 for(const path of ['/site-nav.css','/site-nav.js'])assert.equal((await worker.fetch(new Request('https://test.local'+path),{})).status,200);
 const response=await worker.fetch(new Request('https://test.local/dashboard',{headers:{accept:'text/html'}}),{});assert.equal(response.status,303);assert.equal(response.headers.get('location'),'/#email');
 assert.equal((await worker.fetch(new Request('https://test.local/cohort.json'),{})).status,401);
});
test('August evidence series and aggregate identities reconcile',async()=>{
 const c=await json('cohort.json'),m=await json('campaign.json');assert.equal(c.campaignStart,'2026-08-01');assert.equal(m.campaignStart,c.campaignStart);
 assert.equal(c.confirmedApplicationProcesses,c.pendingOutcome+c.rejectedClosed+c.withdrawn);
 assert.equal(c.matchedActions,c.confirmedApplicationProcesses+c.unmatchedEligibleOutreach);
 assert.equal(m.jobMessagesSent,m.gmailJobMessagesSent+m.outlookJobMessagesSent);
 assert.equal(m.dailySeries.length,58);let n=0;for(const d of m.dailySeries){n+=d.uniqueOutreach;assert.equal(n,d.cumulativeOutreach);}assert.equal(n,m.uniqueOutreach);
 assert.equal(c.dailyEvidenceSeries.reduce((n,d)=>n+d.firstMappedApplicationEvidence,0),c.confirmedApplicationProcesses);
 assert.equal(c.dailyEvidenceSeries.reduce((n,d)=>n+d.unmatchedOutreach,0),c.unmatchedEligibleOutreach);
 assert.equal(c.applicationsSubmitted,null);assert.equal(c.totalCleanActions,null);assert.equal(m.knownBouncedOpportunities,null);
 for(const x of [c,m])assert.doesNotMatch(JSON.stringify(x),/@|AQMk|1a0[a-z0-9]{12}/);
});
test('both contracts share the v8 overview without upgrading installed plugins',async()=>{
 const {makeGraph}=await import('../web/architecture-data.js');for(const mode of ['target','installed']){const g=makeGraph('pipeline',mode);assert.equal(g.profile.name,'Sol System v8');assert.deepEqual(g.nodes.map(n=>n.id),['scout','auto','ultra','pulse']);assert.equal(g.edges.length,4);}
 assert.ok(makeGraph('overview','target').nodes.some(n=>n.id==='sheets'));assert.ok(makeGraph('overview','installed').nodes.some(n=>n.id==='sqlite'));
});

