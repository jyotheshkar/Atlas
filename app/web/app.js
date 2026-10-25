(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const put = (id, value) => { const node = $(id); if (node) node.textContent = String(value); };
  const NS = 'http://www.w3.org/2000/svg';
  const C = { red: '#2dd4bf', white: '#fff', green: '#43d69e' };
  const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' });
  const clockFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false });
  const longFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'long', year: 'numeric' });
  const stampFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const shortFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short' });
  let snapshot = null, horizon = 14, busy = false, networkError = false;
  let serverClockOffset = 0;
  const serviceNow = () => new Date(Date.now() + serverClockOffset);
  const fmt = value => Number.isInteger(value) && value >= 0 ? value.toLocaleString('en-GB') : 'Not verified';
  const pct = (a, b) => b > 0 ? (a / b * 100).toFixed(1) + '%' : 'Not verified';
  const day = value => { const parts = Object.fromEntries(dateFmt.formatToParts(value).filter(p => p.type !== 'literal').map(p => [p.type, p.value])); return `${parts.year}-${parts.month}-${parts.day}`; };
  const stamp = value => Number.isFinite(Date.parse(value)) ? stampFmt.format(new Date(value)) : 'Unavailable';
  const dateNumber = value => Date.parse(value + 'T12:00:00Z');
  const daysInclusive = (start, end) => Math.max(1, Math.round((dateNumber(end) - dateNumber(start)) / 86400000) + 1);
  const el = (tag, attrs = {}, content) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v)); if (content !== undefined) n.textContent = String(content); return n; };

  function validate(input) {
    if (!input || ![2, 3].includes(input.schemaVersion)) throw Error('Unsupported snapshot');
    const s = input.schemaVersion === 2 ? {
      ...input, schemaVersion: 3, dailySeries: [], invalidExcluded: null,
      qualityNote: 'This is the last published audit. The scheduled audit is paused, and historical reconciliation remains incomplete. These totals are an evidence-backed floor, not a claim of complete historical coverage.',
      sourceLabel: 'Private Mailbox Evidence And Master Application Sheet',
      today: { ...input.today, confidence: 'minimum confirmed' }
    } : input;
    for (const key of ['applicationsSubmitted', 'activeApplications', 'rejectedClosed', 'withdrawn', 'interviewsReached', 'cleanAdditionalOutreach', 'totalCleanActions']) {
      if (!Number.isInteger(s[key]) || s[key] < 0) throw Error('Invalid ' + key);
    }
    if (s.applicationsSubmitted !== s.activeApplications + s.rejectedClosed + s.withdrawn) throw Error('Application statuses do not reconcile');
    if (s.totalCleanActions !== s.applicationsSubmitted + s.cleanAdditionalOutreach) throw Error('Clean actions do not reconcile');
    if (s.interviewsReached > s.applicationsSubmitted) throw Error('Interview count exceeds applications');
    if (!s.today || s.today.cleanActions !== s.today.applications + s.today.cleanAdditionalOutreach) throw Error('Daily clean actions do not reconcile');
    if (!Number.isFinite(Date.parse(s.asOf)) || Date.parse(s.asOf) > Date.now() + 300000) throw Error('Invalid audit date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.calculationDate)) throw Error('Invalid calculation date');
    return s;
  }

  function clock() {
    const now = serviceNow(), today = day(now);
    put('clock', clockFmt.format(now)); put('current-date', longFmt.format(now));
    put('campaign-day', `Day ${daysInclusive('2026-08-01', today)}`);
    put('today-date', shortFmt.format(now));
    if (snapshot && snapshot.calculationDate !== today) {
      for (const id of ['today-clean', 'today-apps', 'today-outreach', 'today-rejections', 'today-interviews', 'today-gmail', 'today-linked', 'today-followups']) put(id, 'Pending');
      put('today-detail', 'Awaiting A New Audit'); put('today-quality', 'Audit Paused');
      put('today-status', 'Audit Paused');
      $('spark-today').replaceChildren();
    }
    health();
  }

  function health() {
    if (!snapshot) return;
    const label = networkError ? 'Snapshot Connection Interrupted' : 'Audit Paused';
    put('sync-state', label); put('audit-time', stamp(snapshot.asOf));
    $('status-light').style.background = C.red;
    put('today-status', snapshot.calculationDate === day(serviceNow()) ? 'Audited' : 'Audit Paused');
  }

  function circle(id, value, total) {
    const svg = $(id); svg.replaceChildren(); svg.setAttribute('viewBox', '0 0 70 70');
    const r = 26, circumference = 2 * Math.PI * r, ratio = total > 0 ? Math.max(0, Math.min(value / total, 1)) : 0;
    svg.append(el('circle', { cx: 35, cy: 35, r, fill: 'none', stroke: '#fff', 'stroke-opacity': .13, 'stroke-width': 3 }));
    if (ratio) svg.append(el('circle', { cx: 35, cy: 35, r, fill: 'none', stroke: C.red, 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-dasharray': `${circumference * ratio} ${circumference}`, transform: 'rotate(-90 35 35)' }));
  }

  function ring() {
    const svg = $('status-ring'); svg.replaceChildren();
    const total = snapshot.applicationsSubmitted, r = 66, circumference = 2 * Math.PI * r;
    svg.setAttribute('viewBox', '0 0 180 180');
    svg.append(el('circle', { cx: 90, cy: 90, r, fill: 'none', stroke: '#fff', 'stroke-opacity': .09, 'stroke-width': 9 }));
    let offset = 0;
    for (const [value, color] of [[snapshot.activeApplications, C.green], [total - snapshot.activeApplications, C.red]]) {
      if (!value || !total) continue;
      const length = value / total * circumference;
      svg.append(el('circle', { cx: 90, cy: 90, r, fill: 'none', stroke: color, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-dasharray': `${Math.max(1, length - 4)} ${circumference}`, 'stroke-dashoffset': -offset, transform: 'rotate(-90 90 90)' }));
      offset += length;
    }
    svg.setAttribute('aria-label', `${snapshot.activeApplications} active and ${total - snapshot.activeApplications} ended applications`);
    put('live-rate', pct(snapshot.activeApplications, total));
    const gauge = $('callback-gauge'); gauge.replaceChildren();
    const rate = total ? snapshot.interviewsReached / total * 100 : 0;
    const scale = Math.max(10, Math.ceil(rate / 10) * 10);
    gauge.append(el('path', { d: 'M12 67 A55 55 0 0 1 122 67', fill: 'none', stroke: C.red, 'stroke-opacity': .2, 'stroke-width': 5, 'stroke-linecap': 'round' }));
    if (rate > 0) gauge.append(el('path', { d: 'M12 67 A55 55 0 0 1 122 67', pathLength: 100, fill: 'none', stroke: C.red, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': `${rate / scale * 100} 100` }));
    for (let tick = 0; tick <= 10; tick++) {
      const angle = Math.PI * (1 - tick / 10), inner = tick % 5 === 0 ? 43 : 46;
      gauge.append(el('line', { x1: 67 + inner * Math.cos(angle), y1: 67 - inner * Math.sin(angle), x2: 67 + 49 * Math.cos(angle), y2: 67 - 49 * Math.sin(angle), stroke: C.white, 'stroke-opacity': tick % 5 === 0 ? .75 : .3, 'stroke-width': 1 }));
    }
    if (total) {
      const angle = Math.PI * (1 - rate / scale);
      gauge.append(el('line', { x1: 67, y1: 67, x2: 67 + 40 * Math.cos(angle), y2: 67 - 40 * Math.sin(angle), stroke: C.white, 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
    }
    gauge.append(el('circle', { cx: 67, cy: 67, r: 5, fill: '#080808', stroke: C.red, 'stroke-width': 2 }));
    gauge.append(el('text', { x: 7, y: 83, fill: C.white, 'font-size': 9 }, '0%'));
    gauge.append(el('text', { x: 67, y: 7, fill: C.white, 'font-size': 8, 'text-anchor': 'middle', 'fill-opacity': .65 }, `${scale / 2}%`));
    gauge.append(el('text', { x: 127, y: 83, fill: C.white, 'font-size': 9, 'text-anchor': 'end' }, `${scale}%`));
    gauge.setAttribute('aria-label', total ? `Interview conversion speedometer: ${rate.toFixed(1)} percent. ${snapshot.interviewsReached} interview processes from ${total} submitted applications. Scale 0 to ${scale} percent.` : 'Interview conversion speedometer unavailable: no submitted applications.');
  }

  function mixRing() {
    const svg = $('mix-ring'); svg.replaceChildren();
    const r = 59, circumference = 2 * Math.PI * r;
    const share = snapshot.totalCleanActions ? snapshot.applicationsSubmitted / snapshot.totalCleanActions : 0;
    svg.append(el('circle', { cx: 80, cy: 80, r, fill: 'none', stroke: '#fff', 'stroke-opacity': .9, 'stroke-width': 9 }));
    svg.append(el('circle', { cx: 80, cy: 80, r, fill: 'none', stroke: C.red, 'stroke-width': 9, 'stroke-dasharray': `${share * circumference} ${circumference}`, transform: 'rotate(-90 80 80)' }));
    svg.setAttribute('aria-label', `${snapshot.applicationsSubmitted} applications and ${snapshot.cleanAdditionalOutreach} additional outreach opportunities`);
  }

  function completeHistory() {
    const rows = snapshot.dailySeries;
    if (!Array.isArray(rows) || rows.length < 2) return null;
    const ordered = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    if (ordered[0].date !== snapshot.campaignStart || ordered.at(-1).date !== snapshot.calculationDate) return null;
    let applications = 0, outreach = 0;
    for (let i = 0; i < ordered.length; i++) {
      const row = ordered[i];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Number.isInteger(row.applications) || row.applications < 0 || !Number.isInteger(row.cleanAdditionalOutreach) || row.cleanAdditionalOutreach < 0) return null;
      if (i && dateNumber(row.date) - dateNumber(ordered[i - 1].date) !== 86400000) return null;
      applications += row.applications; outreach += row.cleanAdditionalOutreach;
    }
    return applications === snapshot.applicationsSubmitted && outreach === snapshot.cleanAdditionalOutreach ? ordered : null;
  }

  function forecast() {
    const svg = $('activity-chart');
    const width = Math.round(svg.clientWidth), height = Math.round(svg.clientHeight);
    if (width < 100 || height < 50) return;
    svg.replaceChildren(); svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const days = daysInclusive(snapshot.campaignStart || '2026-08-01', snapshot.calculationDate);
    const pace = snapshot.totalCleanActions / days;
    const anchor = snapshot.totalCleanActions, projected = Math.round(anchor + pace * horizon);
    const history = completeHistory();
    put('chart-title', 'Clean Action Forecast');
    put('chart-description', `${shortFmt.format(new Date(snapshot.asOf))} Audit · Projection At Recorded Average Pace`);
    put('chart-total', fmt(projected));
    put('chart-summary-label', `Illustrative Total After ${horizon} Days`);
    put('pace-label', `+${projected - anchor} At ${pace.toFixed(1)} / Day`);
    put('chart-context', history ? 'Audited History + Pace Scenario' : 'Scenario Only · Daily History Unavailable');
    $('chart-empty').hidden = true;
    const x0 = 37, xf = width - 17, xa = history ? x0 + (xf - x0) * .42 : x0;
    const top = 20, bottom = height - 24;
    const axisMin = history ? 0 : Math.floor(anchor * .8 / 50) * 50;
    const axisMax = Math.max(axisMin + 50, Math.ceil(projected * 1.08 / 50) * 50);
    const y = value => bottom - (value - axisMin) / (axisMax - axisMin) * (bottom - top);
    for (let i = 0; i <= 3; i++) {
      const value = axisMin + (axisMax - axisMin) * i / 3, yy = y(value);
      svg.append(el('line', {x1:x0,y1:yy,x2:xf,y2:yy,stroke:'#fff','stroke-opacity':.085,'stroke-dasharray':'2 5'}));
      svg.append(el('text',{x:x0-8,y:yy+3,'text-anchor':'end'},Math.round(value)));
    }
    if (history) {
      let cumulative = 0;
      const points = history.map((row,i) => {
        cumulative += row.applications + row.cleanAdditionalOutreach;
        return `${i ? 'L' : 'M'} ${x0 + i / (history.length - 1) * (xa - x0)} ${y(cumulative)}`;
      });
      svg.append(el('path',{d:points.join(' '),fill:'none',stroke:C.red,'stroke-width':2,'stroke-linejoin':'round'}));
    }
    const defs = el('defs'), gradient = el('linearGradient',{id:'forecast-fill',x1:0,y1:0,x2:0,y2:1});
    gradient.append(el('stop',{offset:'0%','stop-color':C.red,'stop-opacity':.16}),el('stop',{offset:'100%','stop-color':C.red,'stop-opacity':0}));
    defs.append(gradient);svg.append(defs);
    svg.append(el('path',{d:`M ${xa} ${y(anchor)} L ${xf} ${y(projected)} L ${xf} ${bottom} L ${xa} ${bottom} Z`,fill:'url(#forecast-fill)'}));
    svg.append(el('path',{d:`M ${xa} ${y(anchor)} L ${xf} ${y(projected)}`,fill:'none',stroke:C.red,'stroke-width':2.3,'stroke-dasharray':'7 5','stroke-linecap':'round'}));
    for (let i=0;i<=4;i++) {
      const d=Math.round(horizon*i/4), xx=xa+(xf-xa)*d/horizon;
      svg.append(el('text',{x:xx,y:height-5,'text-anchor':i===0?'start':i===4?'end':'middle'},i===0?'Last Audit':`+${d}d`));
    }
    for(const [x,value] of [[xa,anchor],[xf,projected]]) {
      svg.append(el('circle',{cx:x,cy:y(value),r:3.5,fill:'#080808',stroke:C.red,'stroke-width':2}));
      svg.append(el('text',{x:x===xa?x+7:x-7,y:y(value)-10,'text-anchor':x===xa?'start':'end',class:'chart-value'},fmt(value)));
    }
    const guide=el('g',{visibility:'hidden','aria-hidden':'true'});
    const guideLine=el('line',{y1:top,y2:bottom,stroke:'#fff','stroke-opacity':.35,'stroke-dasharray':'3 4'});
    const guideDot=el('circle',{r:4,fill:C.red,stroke:'#000','stroke-width':2});
    const guideBox=el('rect',{y:0,width:130,height:19,rx:3,fill:'#080808',stroke:'#ffffff22'});
    const guideText=el('text',{y:13,'text-anchor':'middle',class:'chart-value'});
    guide.append(guideLine,guideDot,guideBox,guideText);svg.append(guide);
    let inspectedDay=0;
    const inspect=d=>{
      inspectedDay=Math.max(0,Math.min(horizon,d));
      const value=Math.round(anchor+pace*inspectedDay),x=xa+(xf-xa)*inspectedDay/horizon;
      const labelX=Math.max(68,Math.min(width-68,x));
      guide.setAttribute('visibility','visible');guideLine.setAttribute('x1',x);guideLine.setAttribute('x2',x);
      guideDot.setAttribute('cx',x);guideDot.setAttribute('cy',y(value));
      guideBox.setAttribute('x',labelX-65);guideText.setAttribute('x',labelX);
      guideText.textContent=`+${inspectedDay}d · ${fmt(value)} Actions`;
    };
    svg.onpointermove=event=>{const rect=svg.getBoundingClientRect();inspect(Math.round(((event.clientX-rect.left)*width/rect.width-xa)/(xf-xa)*horizon));};
    svg.onpointerleave=()=>guide.setAttribute('visibility','hidden');
    svg.onfocus=()=>inspect(0);svg.onblur=()=>guide.setAttribute('visibility','hidden');
    svg.onkeydown=event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();inspect(inspectedDay+(event.key==='ArrowRight'?1:-1));}};
    svg.setAttribute('aria-label', `${anchor} audited clean actions on ${snapshot.calculationDate}. Illustrative ${horizon}-day projection: ${projected} at ${pace.toFixed(1)} actions per day. Use left and right arrow keys to inspect the scenario. Later activity is not verified.`);
  }

  function details() {
    put('audit-notice', snapshot.qualityNote || 'The last published totals are evidence-backed. Full historical reconciliation is incomplete.');
    const dl = $('audit-facts'); dl.replaceChildren();
    const facts = [
      ['Last Mailbox Audit', stamp(snapshot.asOf)], ['Audit Quality', snapshot.confidence === 'confirmed' ? 'Fully Reconciled' : 'Historical Reconciliation Pending'],
      ['Calculation Day', snapshot.calculationDate + ' · Europe/London'],
      ['Applications', fmt(snapshot.applicationsSubmitted)], ['Clean Outreach', fmt(snapshot.cleanAdditionalOutreach)],
      ['Invalid Attempts Excluded', fmt(snapshot.invalidExcluded)],
      ['Interview Processes Reached', fmt(snapshot.interviewsReached)],
      ['Application-Linked Emails', fmt(snapshot.applicationLinkedEmails)],
      ['Follow-Ups / Corrections', fmt(snapshot.followUps)],
      ['Published Source', snapshot.sourceLabel || 'Private Opportunity Ledger']
    ];
    for (const [label, value] of facts) {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = value; dl.append(dt, dd);
    }
    const conflicts = $('audit-conflicts'); conflicts.replaceChildren();
    if (snapshot.reconciliationNotes?.length) {
      const h = document.createElement('h3'), ul = document.createElement('ul');
      h.textContent = 'Reconciliation Notes'; ul.className = 'warning-list';
      for (const item of snapshot.reconciliationNotes) { const li = document.createElement('li'); li.textContent = item; ul.append(li); }
      conflicts.append(h, ul);
    }
  }

  function render(s) {
    snapshot = s;
    const prefix = s.confidence === 'provisional' ? '≈' : '';
    for (const [id, key] of [['total', 'totalCleanActions'], ['applications', 'applicationsSubmitted'], ['active', 'activeApplications'], ['outreach', 'cleanAdditionalOutreach']]) put(id, prefix + fmt(s[key]));
    put('total-detail', `${fmt(s.applicationsSubmitted)} Applications + ${fmt(s.cleanAdditionalOutreach)} Outreach`);
    put('active-detail', `${pct(s.activeApplications, s.applicationsSubmitted)} Of Submitted`);
    put('applications-detail', 'Company + Role, Counted Once');
    for (const key of ['applications', 'active']) {
      const value = s.delta?.[key === 'applications' ? 'applicationsSubmitted' : 'activeApplications'];
      put(key + '-delta', Number.isInteger(value) ? (value > 0 ? '+' : '') + value + ' Since Audit' : '');
    }
    put('today-clean', fmt(s.today.cleanActions));
    put('today-detail', `${fmt(s.today.applications)} Applications + ${fmt(s.today.cleanAdditionalOutreach)} Outreach`);
    put('today-quality', s.today.confidence === 'provisional' ? 'Provisional' : 'Checked');
    put('last-day-label', `Last Audited Day · ${s.calculationDate}`);
    put('last-day-summary', `${fmt(s.today.cleanActions)} Actions · ${fmt(s.today.gmailJobSends)} Gmail Sends`);
    for (const [id, key] of [['today-apps', 'applications'], ['today-outreach', 'cleanAdditionalOutreach'], ['today-rejections', 'rejections'], ['today-interviews', 'interviews'], ['today-gmail', 'gmailJobSends'], ['today-linked', 'applicationLinkedEmails'], ['today-followups', 'followUps']]) put(id, fmt(s.today[key]));
    put('status-active', fmt(s.activeApplications)); put('rejected', fmt(s.rejectedClosed)); put('status-ended', fmt(s.applicationsSubmitted - s.activeApplications)); put('status-total', fmt(s.applicationsSubmitted));
    put('status-equation', `${s.activeApplications} Active + ${s.applicationsSubmitted - s.activeApplications} Ended = ${s.applicationsSubmitted} Submitted`);
    put('outreach-share', pct(s.cleanAdditionalOutreach, s.totalCleanActions));
    put('mix-total', fmt(s.totalCleanActions)); put('mix-apps', fmt(s.applicationsSubmitted));
    put('callback-rate', pct(s.interviewsReached, s.applicationsSubmitted));
    put('callback-count', `${fmt(s.interviewsReached)} Interview Processes Reached`);
    put('callback-formula', `${fmt(s.interviewsReached)} Processes ÷ ${fmt(s.applicationsSubmitted)} Submitted`);
    put('gmail-sends', fmt(s.gmailJobSends));
    put('overall-active', fmt(s.overallActive)); put('active-leads', fmt(s.activeAdditionalOutreach));
    put('linked-emails', fmt(s.applicationLinkedEmails)); put('follow-ups', fmt(s.followUps));
    put('bounced-leads', fmt(s.bouncedOutreach)); put('interviews-total', fmt(s.interviewsReached));
    circle('spark-total', s.totalCleanActions, s.totalCleanActions);
    circle('spark-apps', s.applicationsSubmitted, s.totalCleanActions);
    circle('spark-active', s.activeApplications, s.applicationsSubmitted);
    circle('spark-today', s.today.applications, s.today.cleanActions);
    ring(); mixRing(); forecast(); details(); clock();
  }

  async function refresh() {
    if (busy) return;
    busy = true;
    try {
      const response = await fetch('./snapshot.json?ts=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw Error('Snapshot unavailable');
      const serverStamp = Date.parse(response.headers.get('date') || '');
      if (Number.isFinite(serverStamp)) serverClockOffset = serverStamp - Date.now();
      const next = validate(await response.json());
      if (snapshot && Date.parse(next.asOf) < Date.parse(snapshot.asOf)) throw Error('Older snapshot rejected');
      networkError = false; render(next);
      try { localStorage.setItem('sol-pulse-v3', JSON.stringify(next)); } catch {}
      put('site-sync', 'Snapshot Dated ' + stamp(next.asOf));
    } catch (error) {
      console.error('Snapshot rejected:', error); networkError = true;
      if (!snapshot) {
        try { render(validate(JSON.parse(localStorage.getItem('sol-pulse-v3')))); }
        catch { put('sync-state', 'Audit Unavailable'); $('status-light').style.background = C.red; }
      }
      health(); put('site-sync', 'Last Published Snapshot Retained');
    } finally { busy = false; }
  }

  for (const button of document.querySelectorAll('[data-range]')) {
    button.addEventListener('click', () => {
      horizon = Number(button.dataset.range);
      for (const item of document.querySelectorAll('[data-range]')) {
        item.classList.toggle('selected', item === button);
        item.setAttribute('aria-pressed', String(item === button));
      }
      if (snapshot) forecast();
    });
  }
  const viewButtons = [...document.querySelectorAll('.compact-tabs [data-view]')];
  function selectView(button) {
    $('overview').dataset.view = button.dataset.view;
    for (const item of viewButtons) item.setAttribute('aria-selected', String(item === button));
    const label = { overview: 'Campaign Performance', outcomes: 'Application Portfolio', details: 'Campaign Details' }[button.dataset.view];
    document.querySelector('.heading h1').textContent = label;
  }
  document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); selectView(viewButtons[0]); });
  const compactLayout = matchMedia('(max-width:1050px), (max-height:560px)');
  compactLayout.addEventListener('change', event => { if (!event.matches) selectView(viewButtons[0]); });
  for (const [index, button] of viewButtons.entries()) {
    button.addEventListener('click', () => selectView(button));
    button.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const next = viewButtons[(index + (event.key === 'ArrowRight' ? 1 : -1) + viewButtons.length) % viewButtons.length];
      next.focus(); selectView(next);
    });
  }
  for (const id of ['details-open', 'source-details']) $(id).addEventListener('click', () => $('audit-dialog').showModal());
  $('details-close').addEventListener('click', () => $('audit-dialog').close());
  $('audit-dialog').addEventListener('click', event => { if (event.target === $('audit-dialog')) $('audit-dialog').close(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  const chartResize = new ResizeObserver(() => { if (snapshot) requestAnimationFrame(forecast); });
  chartResize.observe(document.querySelector('.plot-wrap'));
  $('focus-mode').addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch {}
  });
  document.addEventListener('fullscreenchange', () => $('focus-mode').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'));
  clock(); refresh(); setInterval(clock, 15000); setInterval(() => { if (!document.hidden) refresh(); }, 60000);
})();
