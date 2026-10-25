import {SCHEMA_VERSION,COLLECTIONS,assertSnapshot} from './atlas-contract.js';
const clone=value=>JSON.parse(JSON.stringify(value));
const emptyCollections=()=>Object.fromEntries(COLLECTIONS.map(name=>[name,[]]));
const fixtureTime='2026-10-25T09:00:00Z';
const unconfigured={ATLAS:'NOT_CONFIGURED',PULSAR:'NOT_CONFIGURED',NEBULA:'NOT_CONFIGURED',integration:'UNCONNECTED'};
export class UnconnectedProvider {
  async getSnapshot(){return assertSnapshot({schema_version:SCHEMA_VERSION,mode:'UNCONNECTED',label:'No Source Connected',generated_at:null,complete:false,source_health:{source_id:'atlas',connection_state:'UNCONNECTED',last_success_at:null,data_watermark:null,error_code:null,schema_version:SCHEMA_VERSION},window:{from:null,to:null,timezone:'Europe/London'},watermark:null,agents:{...unconfigured},collections:emptyCollections()});}
}
export class AtlasProvider {
  constructor(){this.configured=false;}
  async getSnapshot(){throw new Error('ATLAS_NOT_CONFIGURED: An authenticated read adapter is required. No source fetch was attempted.');}
}
function fixtureCollections(){
  const cv1={cv_id:'cv-demo-v1',name:'Analyst CV',variant:'Data Analyst',role_family:'Analytics',file_id:'fixture-cv-original-v1',checksum:'fixture-sha256-v1',version:1,approval_status:'APPROVED',created_at:'2026-10-20T10:00:00Z',supersedes_id:null,file_type:'PDF',last_used_at:'2026-10-25T08:15:00Z',source_ref:'fixture:drive/cv-v1'};
  const cv2={...cv1,cv_id:'cv-demo-v2',name:'Analyst CV — proposed revision',file_id:'fixture-cv-import-v2',checksum:'fixture-sha256-v2',version:2,approval_status:'REVIEW_REQUIRED',created_at:'2026-10-25T07:00:00Z',supersedes_id:cv1.cv_id,last_used_at:null,source_ref:'fixture:drive/cv-v2'};
  const base={agent:'PULSAR',country:'UK',cv_id:cv1.cv_id,cv_version:1,sponsorship_status:'UNKNOWN',job_url:null,created_at:'2026-10-23T08:00:00Z',last_updated_at:'2026-10-25T08:00:00Z',receipt_ref:null,submitted_at:null,submission_attempted_at:null,assessment_ref:null,interview_ref:null,pack_ready:false,evidence_refs:[]};
  const applications=[
    {...base,application_id:'app-demo-1',job_key:'fixture-employer-a|ats-101|UK',employer:'Example Analytics A',role:'Data Analyst',status:'SUBMITTED_VERIFIED',receipt_ref:'fixture:receipt/1',submitted_at:'2026-10-25T08:15:00Z',submission_attempted_at:'2026-10-25T08:14:00Z',last_updated_at:'2026-10-25T08:16:00Z',pack_ready:true,evidence_refs:['fixture:receipt/1']},
    {...base,application_id:'app-demo-1-duplicate',job_key:'fixture-employer-a|ats-101|UK',employer:'Example Analytics A',role:'Data Analyst',status:'SUBMITTED_VERIFIED',receipt_ref:'fixture:receipt/1',submitted_at:'2026-10-25T08:15:00Z',submission_attempted_at:'2026-10-25T08:14:00Z',last_updated_at:'2026-10-25T08:15:00Z',evidence_refs:['fixture:receipt/1']},
    {...base,application_id:'app-demo-2',job_key:'fixture-employer-b|ats-202|UK',employer:'Example Research B',role:'Business Analyst',status:'IN_PROGRESS',submission_attempted_at:'2026-10-25T07:50:00Z'},
    {...base,application_id:'app-demo-3',job_key:'fixture-employer-c|ats-303|UK',employer:'Example Metrics C',role:'Reporting Analyst',status:'REJECTED',receipt_ref:'fixture:receipt/3',submitted_at:'2026-10-23T10:00:00Z',submission_attempted_at:'2026-10-23T09:59:00Z',evidence_refs:['fixture:receipt/3','fixture:outcome/3']},
    {...base,application_id:'app-demo-4',job_key:'fixture-employer-d|ats-404|UK',employer:'Example Systems D',role:'Data Analyst',status:'UNKNOWN_OUTCOME',submission_attempted_at:'2026-10-25T08:00:00Z',evidence_refs:['fixture:attempt/4']},
    {...base,application_id:'app-demo-5',job_key:'fixture-employer-e|ats-505|UK',employer:'Example Insights E',role:'Business Analyst',status:'AWAITING_USER',agent:'NEBULA',pack_ready:true},
    {...base,application_id:'app-demo-6',job_key:'fixture-employer-f|ats-606|UK',employer:'Example Modelling F',role:'Data Analyst',status:'SUBMITTED_VERIFIED',receipt_ref:'fixture:receipt/6',submitted_at:'2026-10-24T23:30:00Z',submission_attempted_at:'2026-10-24T23:29:00Z',pack_ready:true,assessment_ref:'fixture:assessment/6',interview_ref:'fixture:human-invitation/6',sponsorship_status:'ROLE_CONFIRMED',evidence_refs:['fixture:receipt/6','fixture:sponsorship/6']}
  ];
  const outreachBase={application_id:null,gmail_message_id:null,provider_message_ref:null,attachment_cv_id:cv1.cv_id,status:'NOT_STARTED',sent_at:null,updated_at:fixtureTime,agent:'PULSAR',channel:'Gmail',possibly_linked:false,evidence_refs:[]};
  const outreach=[
    {...outreachBase,outreach_id:'out-demo-1',application_id:'app-demo-1',recipient_ref:'fixture-contact-a',status:'FAILED',evidence_refs:['fixture:failure/1']},
    {...outreachBase,outreach_id:'out-demo-2',application_id:'app-demo-6',recipient_ref:'fixture-contact-f',gmail_message_id:'fixture-message-2',status:'SENT_VERIFIED',sent_at:'2026-10-25T08:20:00Z',evidence_refs:['fixture:message/2']},
    {...outreachBase,outreach_id:'out-demo-3',recipient_ref:'fixture-contact-g',gmail_message_id:'fixture-message-3',status:'RESPONDED',sent_at:'2026-10-24T12:00:00Z',evidence_refs:['fixture:message/3','fixture:response/3']},
    {...outreachBase,outreach_id:'out-demo-4',recipient_ref:'fixture-contact-h',status:'SEND_UNKNOWN',evidence_refs:['fixture:send-attempt/4']},
    {...outreachBase,outreach_id:'out-demo-5',recipient_ref:'fixture-contact-i',status:'DRAFTED',evidence_refs:['fixture:draft/5']},
    {...outreachBase,outreach_id:'out-demo-6',recipient_ref:'fixture-contact-j',status:'FAILED',possibly_linked:true,evidence_refs:['fixture:failure/6']},
    {...outreachBase,outreach_id:'out-demo-7',recipient_ref:'fixture-contact-g',gmail_message_id:'fixture-message-3',status:'RESPONDED',sent_at:'2026-10-24T12:00:00Z',evidence_refs:['fixture:message/3']}
  ];
  const facts=[
    {fact_id:'fact-demo-1',field:'role_family',approved_value:'Data Analyst',source_file_id:cv1.file_id,review_status:'APPROVED',approval_status:'APPROVED',verified_at:'2026-10-20T10:30:00Z',version:1,allow_agents:['PULSAR','NEBULA'],evidence_refs:['fixture:cv-v1/role']},
    {fact_id:'fact-demo-2',field:'years_of_experience',approved_value:1,source_file_id:cv1.file_id,review_status:'APPROVED',approval_status:'APPROVED',verified_at:'2026-10-20T10:30:00Z',version:1,allow_agents:['PULSAR','NEBULA'],evidence_refs:['fixture:cv-v1/experience']},
    {fact_id:'fact-demo-3',field:'years_of_experience',approved_value:3,source_file_id:cv2.file_id,review_status:'REVIEW_REQUIRED',approval_status:'REVIEW_REQUIRED',verified_at:null,version:2,allow_agents:[],evidence_refs:['fixture:cv-v2/experience']},
    {fact_id:'fact-demo-4',field:'project_impact',approved_value:'Proposed impact claim awaiting evidence',source_file_id:'fixture-project-prototype',review_status:'QUARANTINED',approval_status:'QUARANTINED',verified_at:null,version:1,allow_agents:[],evidence_refs:[]}
  ];
  const reviews=[
    {review_id:'review-demo-existing',source_file_id:cv2.file_id,original_source_file_id:cv1.file_id,claim_type:'EXISTING_FACT',detected_value:'Data Analyst',approved_value:'Data Analyst',conflict_ref:'fact-demo-1',state:'VERIFIED_EXISTING',decision_actor:'fixture-validator',decision_at:'2026-10-25T07:05:00Z',source_ref:cv2.source_ref,previous_version:1,proposed_version:2,impacted_ids:[cv2.cv_id,'fact-demo-1'],reason:'Equivalent existing approved fact with unchanged provenance; no new accomplishment.',diff:[{field:'role_family',before:'Data Analyst',after:'Data Analyst',kind:'EXISTING'}]},
    {review_id:'review-demo-conflict',source_file_id:cv2.file_id,original_source_file_id:cv1.file_id,claim_type:'CONFLICTING_FACT',detected_value:3,approved_value:1,conflict_ref:'fact-demo-2',state:'REVIEW_REQUIRED',decision_actor:null,decision_at:null,source_ref:cv2.source_ref,previous_version:1,proposed_version:2,impacted_ids:[cv2.cv_id,'fact-demo-2'],reason:'New CV claims three years; approved source records one. Original sources remain unchanged.',diff:[{field:'years_of_experience',before:1,after:3,kind:'CONFLICT'}]},
    {review_id:'review-demo-unsupported',source_file_id:'fixture-project-prototype',original_source_file_id:'fixture-project-prototype',claim_type:'UNSUPPORTED_CLAIM',detected_value:'Deployed impact',approved_value:'Prototype only',conflict_ref:'fact-demo-4',state:'QUARANTINED',decision_actor:null,decision_at:null,source_ref:'fixture:drive/project-prototype',previous_version:1,proposed_version:1,impacted_ids:['project-demo-1'],reason:'No deployment evidence. Excluded from agent-eligible facts.',diff:[{field:'maturity',before:'PROTOTYPE',after:'DEPLOYED',kind:'UNSUPPORTED'}]}
  ];
  const runs=[
    {run_id:'run-demo-pulsar',agent:'PULSAR',requested_units:3,verified_submissions:2,full_units:1,blocked:1,started_at:'2026-10-25T07:30:00Z',last_checkpoint_at:fixtureTime,state:'PARTIALLY_COMPLETED',in_progress:1,skipped:1,budget:{max_units:3,max_minutes:45},pause_scope:'ONE_VACANCY',exceptions:[{exception_id:'exception-demo-1',reason:'Sponsorship evidence requires review for one vacancy.',application_id:'app-demo-2',manual_action:'Inspect the employer’s role-specific sponsorship evidence in the originating task.',source_task_url:null,status:'OPEN',created_at:'2026-10-25T08:00:00Z',last_updated_at:fixtureTime,platform_approval:false}]},
    {run_id:'run-demo-nebula',agent:'NEBULA',requested_units:2,verified_submissions:0,full_units:0,blocked:1,started_at:'2026-10-25T08:00:00Z',last_checkpoint_at:fixtureTime,state:'WAITING_USER',in_progress:1,skipped:0,budget:{max_units:2,max_minutes:30},pause_scope:'WORK_PLATFORM',exceptions:[{exception_id:'exception-demo-2',reason:'The originating Work task requires user approval.',application_id:'app-demo-5',manual_action:'Return to the originating Work task and complete its own approval. Quasar cannot approve this action.',source_task_url:null,status:'OPEN',created_at:'2026-10-25T08:10:00Z',last_updated_at:fixtureTime,platform_approval:true}]}
  ];
  const events=[
    {event_id:'event-demo-1',entity_id:cv2.cv_id,entity_type:'cv_registry',event_type:'SOURCE_QUEUED',actor:'fixture-detector',timestamp:'2026-10-25T07:00:00Z',source_ref:cv2.source_ref,before_hash:null,after_hash:cv2.checksum,summary:'Synthetic CV import queued; original v1 preserved.'},
    {event_id:'event-demo-2',entity_id:cv2.cv_id,entity_type:'cv_registry',event_type:'SOURCE_EXTRACTED',actor:'fixture-extractor',timestamp:'2026-10-25T07:02:00Z',source_ref:cv2.source_ref,before_hash:cv2.checksum,after_hash:cv2.checksum,summary:'Synthetic claim metadata extracted; original file unchanged.'},
    {event_id:'event-demo-3',entity_id:'review-demo-existing',entity_type:'review_queue',event_type:'FACT_REUSED',actor:'fixture-validator',timestamp:'2026-10-25T07:05:00Z',source_ref:cv2.source_ref,before_hash:'fixture-fact-1',after_hash:'fixture-fact-1',summary:'Existing approved fact reused after synthetic comparison.'},
    {event_id:'event-demo-4',entity_id:'review-demo-conflict',entity_type:'review_queue',event_type:'REVIEW_REQUIRED',actor:'fixture-validator',timestamp:'2026-10-25T07:06:00Z',source_ref:cv2.source_ref,before_hash:'fixture-experience-1',after_hash:'fixture-proposed-3',summary:'Conflicting experience claim withheld from future agents.'},
    {event_id:'event-demo-5',entity_id:'app-demo-1',entity_type:'applications',event_type:'SUBMISSION_VERIFIED',actor:'fixture-reconciler',timestamp:'2026-10-25T08:16:00Z',source_ref:'fixture:receipt/1',before_hash:'fixture-attempt',after_hash:'fixture-receipt',summary:'Receipt-backed application retained despite separate failed outreach.'}
  ];
  return {
    candidate_facts:facts,
    project_index:[{project_id:'project-demo-1',name:'Example analytics prototype',contribution:'Built a synthetic reporting prototype; deployment and business impact are unverified.',actual_contribution:'Built a synthetic reporting prototype',maturity:'PROTOTYPE',evidence_file_ids:['fixture-project-prototype'],approval_status:'REVIEW_REQUIRED',version:1,source_ref:'fixture:drive/project-prototype'}],
    cv_registry:[cv1,cv2],applications,outreach,runs,events,review_queue:reviews,source_health:[],
    configuration:[{key:'reporting_timezone',value:'Europe/London',effective_from:'2026-10-01T00:00:00Z',version:1,approved_by:'fixture-owner'},{key:'strict_full_unit',value:'Verified submission + approved CV and pack + verified associated outreach',effective_from:'2026-10-01T00:00:00Z',version:1,approved_by:'fixture-owner'}]
  };
}
export class FixtureProvider {
  async getSnapshot(options={}){
    const state=options.state||'CONNECTED';const watermark='fixture-snapshot-2026-10-25-v1';
    const health={source_id:'fixture-atlas',connection_state:state,last_success_at:state==='UNCONNECTED'||state==='CONNECTING'?null:fixtureTime,data_watermark:watermark,error_code:state==='ERROR'?'FIXTURE_ADAPTER_FAILURE':null,schema_version:SCHEMA_VERSION};
    const collections=options.empty?emptyCollections():fixtureCollections();collections.source_health=[clone(health)];
    return assertSnapshot({schema_version:SCHEMA_VERSION,mode:'DEMO',label:'DEMO DATA — NOT LIVE',generated_at:fixtureTime,complete:!['UNCONNECTED','CONNECTING','ERROR'].includes(state),source_health:health,window:{from:'2026-10-23',to:'2026-10-25',timezone:'Europe/London'},watermark,agents:{ATLAS:'DEMO',PULSAR:'DEMO',NEBULA:'DEMO',integration:'DEMO'},collections});
  }
}
export function providerForMode(mode){return mode==='demo'?new FixtureProvider():new UnconnectedProvider();}
