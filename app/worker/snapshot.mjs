const count = v => v === null || v === undefined ? null : Number.isSafeInteger(v) && v >= 0 ? v : null;
const metricKeys = ['verifiedApplications','verifiedOutreach','interviewProcesses','assessmentProcesses','rejections','offers','ukConfirmedOpportunities','locationUnknownOpportunities','recruiterScreens'];
const date = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(T[0-9:.]+Z)?$/.test(v) ? v : null;
const status = v => ['COMPLETE','PARTIAL','INCOMPLETE','UNAVAILABLE','IN_PROGRESS','VERIFIED'].includes(v) ? v : 'PARTIAL';
export function safeSnapshot(input) {
 if (!input || typeof input !== 'object' || !date(input.audit?.lastVerifiedUtc)) throw Error('A dated aggregate snapshot is required');
 if (input.period?.startLocal !== '2023-09-01' || input.period?.endLocal !== '2026-10-23') throw Error('Baseline period mismatch');
 const out={schemaVersion:1,period:{startLocal:'2023-09-01',endLocal:'2026-10-23',timeZone:'Europe/London',incrementalStartUtc:'2026-10-23T23:00:00Z'},audit:{status:status(input.audit.status),lastVerifiedUtc:date(input.audit.lastVerifiedUtc),providers:[]},metrics:{},monthly:[],quality:{}};
 for(const p of input.audit.providers||[]) if(['Gmail','Outlook','gmail','outlook'].includes(p.provider)) out.audit.providers.push({provider:p.provider,status:status(p.status),messagesRetrieved:count(p.messagesRetrieved),eventsReviewed:count(p.eventsReviewed),coverageNote:status(p.status)==='COMPLETE'?'Recorded scope completed.':'Coverage or classification remains incomplete.'});
 for(const k of metricKeys)out.metrics[k]=count(input.metrics?.[k]);
 for(const row of (input.monthly||[]).slice(0,120))if(/^20\d{2}-(0[1-9]|1[0-2])$/.test(row.month))out.monthly.push({month:row.month,applications:count(row.applications),outreach:count(row.outreach),interviews:count(row.interviews),assessments:count(row.assessments),rejections:count(row.rejections)});
 for(const k of ['ambiguousRecords','legacyRowsUnverified','duplicateMessageIds'])out.quality[k]=count(input.quality?.[k]);
 return out;
}