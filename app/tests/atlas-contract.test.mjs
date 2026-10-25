import test from 'node:test';
import assert from 'node:assert/strict';
import {SCHEMA_VERSION,calculateMetrics,validateSnapshot,assertSnapshot,deduplicateApplications,eligibleFacts,londonDay,canTransitionApplication,metricDefinitions} from '../web/atlas-contract.js';
import {UnconnectedProvider,FixtureProvider,AtlasProvider,providerForMode} from '../web/atlas-providers.js';
const fixture=options=>new FixtureProvider().getSnapshot(options);

test('production provider is unconnected and has no fabricated totals',async()=>{
  const s=await providerForMode().getSnapshot();assert.equal(s.mode,'UNCONNECTED');assert.equal(s.source_health.connection_state,'UNCONNECTED');assert.equal(s.watermark,null);assert.equal(s.complete,false);
  for(const state of Object.values(s.agents))assert.ok(['NOT_CONFIGURED','UNCONNECTED'].includes(state));
  for(const rows of Object.values(s.collections))assert.deepEqual(rows,[]);
  for(const m of Object.values(calculateMetrics(s))){assert.equal(m.value,null);assert.deepEqual(m.record_ids,[]);}
});
test('synthetic fixture is deterministic and explicitly DEMO',async()=>{
  const a=await fixture(),b=await fixture();assert.deepEqual(a,b);assert.equal(a.mode,'DEMO');assert.equal(a.label,'DEMO DATA — NOT LIVE');assert.equal(a.schema_version,SCHEMA_VERSION);assert.equal(validateSnapshot(a).valid,true);
  assert.ok(Object.values(a.collections).flat().every(row=>!JSON.stringify(row).includes('@')));
});
test('applications, outreach attempts and strict units have independent evidence',async()=>{
  const s=await fixture(),m=calculateMetrics(s);
  assert.equal(m.application_processes.value,3);assert.equal(m.attempts.value,5);assert.equal(m.pending_outcome.value,2);assert.equal(m.strict_full_units.value,1);assert.equal(m.rejected_closed.value,1);
  assert.equal(m.sent_verified.value,2);assert.equal(m.failed_routes.value,2);assert.equal(m.send_unknown.value,1);assert.equal(m.responded.value,1);
  assert.equal(m.unique_outreach.value,5);assert.equal(m.potentially_linked.value,1);assert.equal(m.unique_approaches.value,5);assert.equal(m.withheld_records.value,2);assert.equal(m.ready_packs.value,3);
  assert.ok(m.application_processes.record_ids.includes('app-demo-1'));assert.ok(m.failed_routes.record_ids.includes('out-demo-1'));assert.ok(!m.strict_full_units.record_ids.includes('app-demo-1'));
  assert.equal(m.assessments.value,1);assert.equal(m.interview_invitations.value,1);
  for(const [key,value]of Object.entries(m)){assert.equal(value.definition_id,key);assert.ok(metricDefinitions[key].inclusion);assert.ok(metricDefinitions[key].exclusion);}
});
test('job-key reconciliation excludes duplicate identity while retaining audit evidence',async()=>{
  const s=await fixture();const before=JSON.stringify(s.collections.applications);const d=deduplicateApplications(s.collections.applications);
  assert.equal(d.records.length,6);assert.equal(d.duplicates.length,1);assert.equal(d.duplicates[0].canonical_id,'app-demo-1');assert.deepEqual(d.duplicates[0].record_ids,['app-demo-1','app-demo-1-duplicate']);assert.equal(JSON.stringify(s.collections.applications),before);
});
test('London grouping handles BST midnight and autumn clock change explicitly',async()=>{
  assert.equal(londonDay('2026-10-24T23:30:00Z'),'2026-10-25');assert.equal(londonDay('2026-10-25T23:30:00Z'),'2026-10-25');
  const m=calculateMetrics(await fixture());assert.equal(m.todays_completions.value,2);
  const next=calculateMetrics(await fixture(),{now:'2026-10-26T00:05:00Z'});assert.equal(next.todays_completions.value,0);
});
test('connected complete empty results are genuine zero; errors and connecting are unavailable',async()=>{
  const empty=await fixture({empty:true});assert.equal(empty.source_health.connection_state,'CONNECTED');assert.equal(empty.complete,true);for(const m of Object.values(calculateMetrics(empty)))assert.equal(m.value,0);
  for(const state of ['ERROR','CONNECTING','UNCONNECTED']){const s=await fixture({state});for(const m of Object.values(calculateMetrics(s)))assert.equal(m.value,null);}
});
test('stale known snapshot retains confirmed totals and original watermark',async()=>{
  const fresh=await fixture(),stale=await fixture({state:'STALE'});assert.equal(stale.source_health.connection_state,'STALE');assert.equal(stale.watermark,fresh.watermark);assert.deepEqual(calculateMetrics(stale),calculateMetrics(fresh));
});
test('unapproved claims and prototype accomplishments never enter the eligible fact feed',async()=>{
  const s=await fixture();const feed=eligibleFacts(s,'PULSAR');assert.deepEqual(feed.map(x=>x.fact_id),['fact-demo-1','fact-demo-2']);assert.equal(feed.find(x=>x.field==='years_of_experience').approved_value,1);assert.ok(!feed.some(x=>x.field==='project_impact'));assert.equal(eligibleFacts(s,'UNTRUSTED_AGENT').length,0);
});
test('new CV comparison preserves original references and shows existing versus conflicting claims',async()=>{
  const s=await fixture();const [oldCV,newCV]=s.collections.cv_registry;const conflict=s.collections.review_queue.find(x=>x.state==='REVIEW_REQUIRED'),existing=s.collections.review_queue.find(x=>x.state==='VERIFIED_EXISTING');
  assert.equal(newCV.supersedes_id,oldCV.cv_id);assert.equal(oldCV.file_id,'fixture-cv-original-v1');assert.equal(oldCV.version,1);assert.equal(conflict.original_source_file_id,oldCV.file_id);assert.equal(conflict.source_file_id,newCV.file_id);assert.equal(conflict.diff[0].before,1);assert.equal(conflict.diff[0].after,3);assert.equal(existing.diff[0].before,existing.diff[0].after);assert.equal(conflict.decision_actor,null);assert.equal(conflict.decision_at,null);
});
test('schema validation rejects unknown enums, missing receipts, private fields and inconsistent snapshots',async()=>{
  const mutations=[s=>s.schema_version='2.0.0',s=>s.collections.applications[0].status='HEALTHY',s=>s.collections.applications[0].receipt_ref=null,s=>s.collections.applications[0].cv_id='unknown-cv',s=>s.collections.outreach[1].gmail_message_id=null,s=>s.collections.outreach[0].recipient_ref='',s=>s.collections.candidate_facts[0].verified_at=null,s=>s.source_health.data_watermark='different',s=>s.window.timezone='UTC',s=>s.collections.runs[0].full_units=99,s=>s.collections.applications.push({...s.collections.applications[0]}),s=>s.access_token='no-token-should-be-here'];
  for(const mutate of mutations){const s=await fixture();mutate(s);assert.equal(validateSnapshot(s).valid,false,mutate.toString());assert.throws(()=>assertSnapshot(s),/schema validation failed/);}
});
test('application transitions require explicit states and receipt-backed success',()=>{
  assert.equal(canTransitionApplication('IN_PROGRESS','SUBMITTED_VERIFIED'),false);assert.equal(canTransitionApplication('IN_PROGRESS','SUBMITTED_VERIFIED',{receipt_ref:'fixture:receipt/1',submitted_at:'2026-10-25T08:15:00Z'}),true);assert.equal(canTransitionApplication('UNKNOWN_OUTCOME','COMPLETED'),false);assert.equal(canTransitionApplication('REJECTED','IN_PROGRESS'),false);
});
test('live AtlasProvider is a nonfunctional skeleton rather than a fake connection',async()=>{
  const p=new AtlasProvider();assert.equal(p.configured,false);await assert.rejects(()=>p.getSnapshot(),/ATLAS_NOT_CONFIGURED/);
});

test('Unmatched Attempts has exact independent provenance and reconciles minimum approaches',async()=>{
  const m=calculateMetrics(await fixture());assert.equal(m.unmatched_outreach.value,2);assert.deepEqual(m.unmatched_outreach.record_ids,['out-demo-3','out-demo-4']);
  assert.equal(m.unique_approaches.value,m.application_processes.value+m.unmatched_outreach.value);
  assert.deepEqual(m.unique_approaches.record_ids,[...m.application_processes.record_ids,...m.unmatched_outreach.record_ids]);
});
test('reporting bounds and stale source metadata must be internally valid',async()=>{
  for(const mutate of [s=>s.window.from='2026-02-31',s=>s.window.to=null,s=>s.source_health.last_success_at=null,s=>s.source_health.data_watermark='different']){
    const s=await fixture({state:'STALE'});mutate(s);assert.equal(validateSnapshot(s).valid,false,mutate.toString());
  }
});
test('ambiguous linkage is withheld regardless of row order; response evidence wins repeated message references',async()=>{
  const s=await fixture();s.collections.outreach.push({...s.collections.outreach[2],outreach_id:'out-demo-ambiguous',application_id:null,possibly_linked:true});
  const a=calculateMetrics(s);s.collections.outreach.reverse();const b=calculateMetrics(s);assert.equal(a.unique_approaches.value,4);assert.equal(a.unique_approaches.value,b.unique_approaches.value);assert.equal(a.potentially_linked.value,2);assert.equal(a.potentially_linked.value,b.potentially_linked.value);
  const sent=s.collections.outreach.find(o=>o.outreach_id==='out-demo-2');s.collections.outreach.push({...sent,outreach_id:'out-demo-reply',status:'RESPONDED'});assert.equal(calculateMetrics(s).responded.value,2);assert.equal(calculateMetrics(s).sent_verified.value,2);
});

test('a verified send with the wrong CV revision is not a strict full unit',async()=>{
  const s=await fixture();s.collections.outreach.find(o=>o.outreach_id==='out-demo-2').attachment_cv_id='cv-demo-v2';
  const m=calculateMetrics(s);assert.equal(m.application_processes.value,3);assert.equal(m.sent_verified.value,2);assert.equal(m.strict_full_units.value,0);
});
