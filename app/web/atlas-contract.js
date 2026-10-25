// ATLAS v1 read-model contract. This module contains no credentials or source writes.
export const SCHEMA_VERSION = '1.0.0';
export const COLLECTIONS = Object.freeze(['candidate_facts','project_index','cv_registry','applications','outreach','runs','events','review_queue','source_health','configuration']);
export const ENUMS = Object.freeze({
  source_health:['UNCONNECTED','CONNECTING','CONNECTED','STALE','ERROR'],
  record_review:['DRAFT','VERIFIED_EXISTING','REVIEW_REQUIRED','APPROVED','QUARANTINED','ARCHIVED'],
  project_maturity:['PROPOSED','DESIGNED','PROTOTYPE','TESTED','DEPLOYED'],
  application:['DISCOVERED','QUALIFIED','PREPARING','IN_PROGRESS','AWAITING_USER','UNKNOWN_OUTCOME','SUBMITTED_VERIFIED','REJECTED','WITHDRAWN','CLOSED'],
  outreach:['NOT_STARTED','CONTACT_UNAVAILABLE','CONTACT_RESEARCHED','DRAFTED','SENT_VERIFIED','SEND_UNKNOWN','FAILED','RESPONDED'],
  agent_run:['NOT_CONFIGURED','QUEUED','RUNNING','WAITING_USER','PARTIALLY_COMPLETED','COMPLETED','FAILED','CANCELLED'],
  sponsorship:['ROLE_CONFIRMED','EMPLOYER_LICENSE_ONLY','UNKNOWN','NOT_AVAILABLE'],
  agent:['PULSAR','NEBULA','MANUAL']
});
export const collectionFields = Object.freeze({
  candidate_facts:['fact_id','field','approved_value','source_file_id','review_status','verified_at','version'],
  project_index:['project_id','name','contribution','maturity','evidence_file_ids','approval_status','version'],
  cv_registry:['cv_id','variant','role_family','file_id','checksum','version','approval_status','created_at','supersedes_id'],
  applications:['application_id','job_key','agent','employer','role','country','status','receipt_ref','cv_id','sponsorship_status','last_updated_at'],
  outreach:['outreach_id','application_id','recipient_ref','gmail_message_id','attachment_cv_id','status','sent_at'],
  runs:['run_id','agent','requested_units','verified_submissions','full_units','blocked','started_at','last_checkpoint_at','state'],
  events:['event_id','entity_id','event_type','actor','timestamp','source_ref','before_hash','after_hash'],
  review_queue:['review_id','source_file_id','claim_type','detected_value','conflict_ref','state','decision_actor','decision_at'],
  source_health:['source_id','connection_state','last_success_at','data_watermark','error_code','schema_version'],
  configuration:['key','value','effective_from','version','approved_by']
});
const idFields = {candidate_facts:'fact_id',project_index:'project_id',cv_registry:'cv_id',applications:'application_id',outreach:'outreach_id',runs:'run_id',events:'event_id',review_queue:'review_id',source_health:'source_id',configuration:'key'};
const isDate = value => typeof value==='string' && Number.isFinite(Date.parse(value));
const isCalendarDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+'T12:00Z')) && new Date(value+'T12:00Z').toISOString().slice(0,10)===value;
const present = value => typeof value==='string' && value.trim().length>0;
const nonnegative = value => Number.isInteger(value) && value>=0;
const enumValue = (name,value) => ENUMS[name].includes(value);
const completeHealth = h => h && enumValue('source_health',h.connection_state) && h.schema_version===SCHEMA_VERSION;
export function validateSnapshot(snapshot) {
  const errors=[];const add=(ok,msg)=>{if(!ok)errors.push(msg);};
  if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))return {valid:false,errors:['Snapshot must be an object']};
  add(snapshot.schema_version===SCHEMA_VERSION,'Unsupported schema_version');
  add(['UNCONNECTED','DEMO','LIVE'].includes(snapshot.mode),'Invalid mode');
  add(completeHealth(snapshot.source_health),'Invalid source_health');
  add(snapshot.window?.timezone==='Europe/London','Reporting timezone must be Europe/London');
  for(const key of ['from','to'])add(snapshot.window?.[key]===null||isCalendarDate(snapshot.window?.[key]),'Invalid reporting date '+key);
  add((snapshot.window?.from===null)===(snapshot.window?.to===null),'Reporting window must have both bounds or neither');
  if(snapshot.window?.from&&snapshot.window?.to)add(snapshot.window.from<=snapshot.window.to,'Reporting from must precede to');
  add(typeof snapshot.complete==='boolean','Missing completeness flag');
  for(const name of ['ATLAS','PULSAR','NEBULA','integration'])add(typeof snapshot.agents?.[name]==='string','Missing agent state '+name);
  if(['CONNECTED','STALE'].includes(snapshot.source_health?.connection_state)) {
    add(isDate(snapshot.source_health.last_success_at),'Confirmed source requires last_success_at');
    add(present(snapshot.watermark)&&snapshot.source_health.data_watermark===snapshot.watermark,'Confirmed source requires consistent watermark');
  }
  if(snapshot.mode==='UNCONNECTED'){
    add(snapshot.source_health?.connection_state==='UNCONNECTED','Unconnected mode requires unconnected health');
    add(snapshot.watermark===null,'Unconnected source cannot have a watermark');
    add(snapshot.complete===false,'Unconnected source cannot claim complete data');
  }
  const c=snapshot.collections;
  if(!c||typeof c!=='object')return {valid:false,errors:[...errors,'Missing collections']};
  for(const name of COLLECTIONS){
    const rows=c[name];
    if(!Array.isArray(rows)){errors.push('Missing collection '+name);continue;}
    if(snapshot.mode==='UNCONNECTED')add(rows.length===0,'Unconnected collections must be empty: '+name);
    const ids=new Set();
    rows.forEach((row,index)=>{
      const path=name+'['+index+']';
      if(!row||typeof row!=='object'){errors.push(path+' must be an object');return;}
      for(const field of collectionFields[name])add(Object.hasOwn(row,field),path+' missing '+field);
      const id=row[idFields[name]];add(present(id),path+' requires stable identifier');add(!ids.has(id),path+' duplicate identifier');ids.add(id);
      if('version' in row)add(Number.isInteger(row.version)&&row.version>0,path+' invalid version');
      if(name==='candidate_facts'){
        add(enumValue('record_review',row.review_status),path+' invalid review_status');
        if(['APPROVED','VERIFIED_EXISTING'].includes(row.review_status))add(present(row.source_file_id)&&isDate(row.verified_at),path+' approved facts require provenance');
      }
      if(name==='project_index'){
        add(enumValue('project_maturity',row.maturity),path+' invalid maturity');
        add(enumValue('record_review',row.approval_status),path+' invalid approval_status');
        add(Array.isArray(row.evidence_file_ids),path+' requires evidence list');
      }
      if(name==='cv_registry'){
        add(enumValue('record_review',row.approval_status),path+' invalid approval_status');
        add(present(row.file_id)&&present(row.checksum)&&isDate(row.created_at),path+' invalid immutable revision metadata');
      }
      if(name==='applications'){
        add(enumValue('application',row.status),path+' invalid application status');
        add(enumValue('agent',row.agent),path+' invalid agent');
        add(enumValue('sponsorship',row.sponsorship_status),path+' invalid sponsorship status');
        add(present(row.job_key)&&present(row.employer)&&present(row.role)&&present(row.country),path+' missing vacancy identity');
        add(isDate(row.last_updated_at),path+' invalid update timestamp');
        if(row.status==='SUBMITTED_VERIFIED')add(present(row.receipt_ref)&&isDate(row.submitted_at),path+' verified submission requires receipt and submitted_at');
      }
      if(name==='outreach'){
        add(enumValue('outreach',row.status),path+' invalid outreach status');
        if(['SENT_VERIFIED','RESPONDED','SEND_UNKNOWN','FAILED'].includes(row.status))add(present(row.recipient_ref),path+' outreach attempts require recipient_ref');
        if(['SENT_VERIFIED','RESPONDED'].includes(row.status))add(present(row.gmail_message_id||row.provider_message_ref)&&isDate(row.sent_at),path+' verified send requires provider reference and sent_at');
      }
      if(name==='runs'){
        add(enumValue('agent_run',row.state),path+' invalid run state');
        for(const field of ['requested_units','verified_submissions','full_units','blocked'])add(nonnegative(row[field]),path+' invalid '+field);
        add(row.full_units<=row.verified_submissions,path+' full units cannot exceed submissions');
      }
      if(name==='events')add(isDate(row.timestamp)&&present(row.source_ref),path+' requires timestamp and source_ref');
      if(name==='review_queue')add(enumValue('record_review',row.state),path+' invalid review state');
      if(name==='source_health')add(completeHealth(row),path+' invalid source health');
    });
  }
  const appIDs=new Set(c.applications?.map(x=>x.application_id)||[]), cvIDs=new Set(c.cv_registry?.map(x=>x.cv_id)||[]);
  for(const row of c.outreach||[]){if(row.application_id)add(appIDs.has(row.application_id),'Outreach points to unknown application '+row.outreach_id);if(row.attachment_cv_id)add(cvIDs.has(row.attachment_cv_id),'Outreach points to unknown CV '+row.outreach_id);}
  for(const row of c.applications||[])if(row.cv_id)add(cvIDs.has(row.cv_id),'Application points to unknown CV '+row.application_id);
  const forbidden=/^(access_token|refresh_token|client_secret|password|oauth_token|private_key|cv_text|email_body)$/i;
  const walk=(value,path='snapshot')=>{if(value&&typeof value==='object')for(const [key,v]of Object.entries(value)){add(!forbidden.test(key),'Forbidden private field '+path+'.'+key);walk(v,path+'.'+key);}};walk(snapshot);
  return {valid:errors.length===0,errors};
}
export function assertSnapshot(snapshot){const result=validateSnapshot(snapshot);if(!result.valid)throw new Error('ATLAS schema validation failed: '+result.errors.join('; '));return snapshot;}
export function londonDay(value){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day;}
export function inWindow(timestamp,window){if(!isDate(timestamp))return false;const day=londonDay(timestamp);return (!window.from||day>=window.from)&&(!window.to||day<=window.to);}
export function deduplicateApplications(applications){
  const groups=new Map();
  for(const row of applications){const key=row.job_key;const group=groups.get(key)||[];group.push(row);groups.set(key,group);}
  const records=[],duplicates=[];
  for(const [job_key,rows]of groups){
    const sorted=[...rows].sort((a,b)=>Number(Boolean(b.receipt_ref))-Number(Boolean(a.receipt_ref))||Date.parse(b.last_updated_at)-Date.parse(a.last_updated_at)||a.application_id.localeCompare(b.application_id));
    records.push(sorted[0]);if(sorted.length>1)duplicates.push({job_key,canonical_id:sorted[0].application_id,record_ids:sorted.map(x=>x.application_id)});
  }
  return {records,duplicates};
}
export function eligibleFacts(snapshot,agent){return snapshot.collections.candidate_facts.filter(f=>['APPROVED','VERIFIED_EXISTING'].includes(f.review_status)&&present(f.source_file_id)&&isDate(f.verified_at)&&(!agent||(f.allow_agents||[]).includes(agent)));}
const definitions={
  unique_approaches:['Unique Approaches','Deduplicated receipt-backed company/role processes plus unmatched outreach attempt targets.','Opened forms, drafts, application-linked outreach, unresolved possible links and duplicate jobs are excluded. Attempts do not prove delivery.','applications + outreach'],
  application_processes:['Application Processes','Distinct job_key with receipt_ref and valid submitted_at in the reporting window. Includes later final outcomes.','Forms opened, attempted submissions and UNKNOWN_OUTCOME are excluded.','applications'],
  pending_outcome:['Pending Outcome','Receipt-backed processes with no REJECTED, WITHDRAWN or CLOSED outcome.','Unsubmitted and unknown-outcome attempts are excluded.','applications'],
  todays_completions:["Today’s Completions",'Distinct verified submitted applications whose submitted_at groups to the current Europe/London day.','Attempts, sends, drafts and prior-day submissions are excluded.','applications'],
  rejected_closed:['Rejected / Closed','Receipt-backed processes currently REJECTED, WITHDRAWN or CLOSED.','Unsourced closure and unsubmitted opportunities are excluded.','applications'],
  assessments:['Assessments','Receipt-backed processes with a distinct assessment_ref.','Human interviews are separate; repeated assessment messages are excluded.','applications'],
  unmatched_outreach:['Unmatched Attempts','Distinct unmatched outreach attempt targets with no application identity and no unresolved possible link.','Application-linked contacts, drafts, possible links and repeat recipient targets are excluded. These attempts do not prove delivery.','outreach'],
  unique_outreach:['Unique Outreach','Distinct recipient_ref among SENT_VERIFIED, SEND_UNKNOWN, FAILED or RESPONDED attempts in-window.','Unsent drafts, contact research and duplicate recipient targets are excluded. This is not a delivery count.','outreach'],
  potentially_linked:['Potentially Linked','Unmatched attempt targets marked possibly_linked true.','These ambiguous links are withheld from Unique Approaches.','outreach'],
  withheld_records:['Withheld Ledger Records','Applications with UNKNOWN_OUTCOME, plus additional duplicate identity rows.','A withheld record is not counted as a successful submission.','applications'],
  ready_packs:['Ready Packs','Distinct application records with pack_ready true and an APPROVED CV.','A ready pack is not a submitted application; incomplete/unapproved packs are excluded.','applications'],
  interview_invitations:['Interview Evidence','Receipt-backed processes with a distinct interview_ref.','Assessments, automated invitations and repeated messages are excluded.','applications'],
  sent_verified:['Sent Verified','Unique provider message references with SENT_VERIFIED or RESPONDED and sent_at.','Failed routes, SEND_UNKNOWN and unsent drafts are excluded. Provider acceptance does not prove inbox delivery.','outreach'],
  send_unknown:['Delivery Unknown','Outreach rows with SEND_UNKNOWN, deduplicated by outreach_id.','Unknown is not successful delivery.','outreach'],
  failed_routes:['Failed Routes','Outreach rows currently FAILED.','Failure never erases a separately receipt-backed application.','outreach'],
  responded:['Responses Received','Unique provider messages currently RESPONDED.','Automated receipts do not imply human response.','outreach'],
  attempts:['Submission Attempts','Distinct job_key with submission_attempted_at in-window.','Opening a form alone is excluded; an attempt does not imply success.','applications'],
  strict_full_units:['Strict Full Units','Verified submitted applications with APPROVED CV, pack_ready, and associated SENT_VERIFIED/RESPONDED outreach attaching that same CV revision.','Submission-only and failed/unknown sends are not full units.','applications + outreach']
};
export const metricDefinitions=Object.freeze(Object.fromEntries(Object.entries(definitions).map(([id,[label,inclusion,exclusion,collection]])=>[id,Object.freeze({id,label,inclusion,exclusion,collection,timezone:'Europe/London',scope:['ready_packs','withheld_records'].includes(id)?'CURRENT_INVENTORY':'REPORTING_WINDOW',version:SCHEMA_VERSION})])));
export function calculateMetrics(snapshot,{now=snapshot.generated_at||new Date().toISOString()}={}){
  assertSnapshot(snapshot);const {collections:c,window}=snapshot;
  const known=snapshot.mode!=='UNCONNECTED'&&snapshot.complete&&['CONNECTED','STALE'].includes(snapshot.source_health.connection_state);
  const result={};const metric=(key,rows,field)=>{const ids=[...new Set(rows.map(x=>field?x[field]:x.application_id||x.outreach_id))];result[key]={value:known?ids.length:null,record_ids:known?ids:[],definition_id:key};};
  if(!known){for(const key of Object.keys(metricDefinitions))result[key]={value:null,record_ids:[],definition_id:key};return result;}
  const {records:apps,duplicates}=deduplicateApplications(c.applications);
  const verified=apps.filter(a=>present(a.receipt_ref)&&inWindow(a.submitted_at,window));
  const ended=new Set(['REJECTED','WITHDRAWN','CLOSED']);
  const attempts=apps.filter(a=>inWindow(a.submission_attempted_at,window));
  const attemptedOutreach=c.outreach.filter(o=>['SENT_VERIFIED','SEND_UNKNOWN','FAILED','RESPONDED'].includes(o.status)&&inWindow(o.sent_at||o.updated_at,window));
  const byRecipient=new Map();const relationshipRisk=o=>o.application_id?2:o.possibly_linked?1:0;for(const o of attemptedOutreach){const existing=byRecipient.get(o.recipient_ref);if(!existing||relationshipRisk(o)>relationshipRisk(existing))byRecipient.set(o.recipient_ref,o);}
  const uniqueOutreach=[...byRecipient.values()];
  const unmatched=uniqueOutreach.filter(o=>!o.application_id&&!o.possibly_linked);
  const sent=c.outreach.filter(o=>['SENT_VERIFIED','RESPONDED'].includes(o.status)&&inWindow(o.sent_at,window));
  const sentUnique=new Map();for(const o of sent){const key=o.gmail_message_id||o.provider_message_ref,existing=sentUnique.get(key);if(!existing||o.status==='RESPONDED'&&existing.status!=='RESPONDED')sentUnique.set(key,o);}
  metric('application_processes',verified);metric('pending_outcome',verified.filter(a=>!ended.has(a.status)));
  metric('todays_completions',verified.filter(a=>londonDay(a.submitted_at)===londonDay(now)));
  metric('rejected_closed',verified.filter(a=>ended.has(a.status)));
  metric('assessments',verified.filter(a=>present(a.assessment_ref)));
  metric('interview_invitations',verified.filter(a=>present(a.interview_ref)));
  metric('unique_outreach',uniqueOutreach,'outreach_id');metric('unmatched_outreach',unmatched,'outreach_id');
  metric('potentially_linked',uniqueOutreach.filter(o=>!o.application_id&&o.possibly_linked),'outreach_id');
  const withheld=apps.filter(a=>a.status==='UNKNOWN_OUTCOME');
  result.withheld_records={value:withheld.length+duplicates.reduce((n,g)=>n+g.record_ids.length-1,0),record_ids:[...withheld.map(a=>a.application_id),...duplicates.flatMap(g=>g.record_ids.filter(id=>id!==g.canonical_id))],definition_id:'withheld_records'};
  const approvedCV=new Set(c.cv_registry.filter(cv=>cv.approval_status==='APPROVED').map(cv=>cv.cv_id));
  metric('ready_packs',apps.filter(a=>a.pack_ready&&approvedCV.has(a.cv_id)));
  metric('sent_verified',[...sentUnique.values()],'outreach_id');
  metric('send_unknown',attemptedOutreach.filter(o=>o.status==='SEND_UNKNOWN'),'outreach_id');
  metric('failed_routes',attemptedOutreach.filter(o=>o.status==='FAILED'),'outreach_id');
  metric('responded',[...sentUnique.values()].filter(o=>o.status==='RESPONDED'),'outreach_id');
  metric('attempts',attempts);
  metric('strict_full_units',verified.filter(a=>a.pack_ready&&approvedCV.has(a.cv_id)&&sent.some(o=>o.application_id===a.application_id&&o.attachment_cv_id===a.cv_id)));
  result.unique_approaches={value:verified.length+unmatched.length,record_ids:[...verified.map(a=>a.application_id),...unmatched.map(o=>o.outreach_id)],definition_id:'unique_approaches'};
  return result;
}
export const applicationTransitions=Object.freeze({
  DISCOVERED:['QUALIFIED','CLOSED'],QUALIFIED:['PREPARING','WITHDRAWN','CLOSED'],PREPARING:['IN_PROGRESS','AWAITING_USER','WITHDRAWN'],
  IN_PROGRESS:['AWAITING_USER','UNKNOWN_OUTCOME','SUBMITTED_VERIFIED'],AWAITING_USER:['IN_PROGRESS','UNKNOWN_OUTCOME','SUBMITTED_VERIFIED','WITHDRAWN'],
  UNKNOWN_OUTCOME:['IN_PROGRESS','SUBMITTED_VERIFIED','CLOSED'],SUBMITTED_VERIFIED:['REJECTED','WITHDRAWN','CLOSED'],REJECTED:[],WITHDRAWN:[],CLOSED:[]
});
export function canTransitionApplication(before,after,{receipt_ref,submitted_at}={}){return Boolean(applicationTransitions[before]?.includes(after)&&enumValue('application',after)&&(after!=='SUBMITTED_VERIFIED'||present(receipt_ref)&&isDate(submitted_at)));}




