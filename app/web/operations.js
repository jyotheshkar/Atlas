(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const put = (id, value) => { const node = $(id); if (node) node.textContent = String(value); };
  const stamp = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/London',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(new Date(value)) : 'Not verified';
  let serverClockOffset = 0;
  const serviceNow = () => Date.now() + serverClockOffset;
  const londonDate = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(serviceNow()));
  let latest = null;
  const card = document.querySelector('.today-kpi');
  card.querySelector('h2').textContent = "Today's Completions";
  $('today-clean').id = 'operational-today';
  $('today-detail').id = 'operational-detail';
  put('operational-today', 'Pending');
  put('operational-detail', 'Awaiting verified SOL refresh');
  $('spark-today').style.display = 'none';
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'audit-button workflow-button'; button.textContent = 'Workflow';
  button.setAttribute('aria-label', 'Open SOL workflow and Ultra applications');
  document.querySelector('.header-right').prepend(button);
  const modal = document.createElement('dialog'); modal.id = 'workflow-dialog';
  modal.innerHTML = '<div class="dialog-content"><div class="dialog-top"><div><span class="eyebrow">Sol / Current Operations</span><h2>Work In Progress</h2></div><button class="close-button" type="button" aria-label="Close workflow">×</button></div><p id="workflow-freshness">No operational snapshot has been published yet.</p><div class="workflow-summary"><strong id="workflow-total">Pending</strong><span>Unique completions today / 40 target</span></div><p id="workflow-counts">Awaiting current evidence</p><div class="workflow-engines" id="workflow-engines"></div><div class="workflow-links"><a id="workflow-csv" href="./ultra-applications.csv" download hidden>Download Ultra Applications CSV</a><span>Private operational ledger link omitted from this public source.</span></div><p id="workflow-ready">Ready records require verified CV, answers, portal and supporting outreach. You submit the final application.</p><p id="workflow-digest">One Gmail digest every three hours is the requested reporting cadence.</p><p id="workflow-coverage"></p><p>UK-wide search, including startups and Scotland. A company and role count once. Discovery, incomplete packs, failed sends and repeat outreach do not increase completed units.</p><p>The campaign charts retain their separately dated mailbox audit. This view is refreshed only when a new verified operational snapshot is published.</p></div>';
  document.body.append(modal);
  button.addEventListener('click', () => modal.showModal());
  modal.querySelector('.close-button').addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => {if(event.target === modal) modal.close();});

  function render() {
    if (!latest) return;
    const ageMinutes = (serviceNow() - Date.parse(latest.checkedAt)) / 60000;
    const stale = ageMinutes > 210 || latest.calculationDate !== londonDate();
    const current = !stale;
    put('operational-today', current ? latest.today.uniqueCompleted : 'Pending');
    put('operational-detail', current ? `${latest.today.countLabel}: Auto ${latest.today.auto} + Ultra ${latest.today.ultra} / 40` : 'Awaiting a current operational refresh');
    put('workflow-total', current ? latest.today.uniqueCompleted : 'Pending');
    put('workflow-counts', `Checked ${latest.calculationDate}: Auto ${latest.today.auto}, Ultra ${latest.today.ultra}. ${latest.today.countLabel}.`);
    put('workflow-freshness', `${stale ? 'Refresh overdue' : 'Last checked'}: ${stamp(latest.checkedAt)}.${latest.clockStatus === 'CHECKPOINT_TIME_UNCERTAIN' ? ' Checkpoint timestamps remain unverified after a host clock discrepancy.' : ''} Browser polling does not run the engines.`);
    put('workflow-ready', `${latest.ultraReady} verified Ultra packages in this snapshot. ${latest.excludedIncompleteReady} incomplete ready claims excluded.${latest.coverage === 'Partial source coverage' ? ' The total ready inventory is not yet reconciled.' : ''} You submit the final application.`);
    put('workflow-digest', `Gmail digest: every 3 hours at :45. Reporting state: ${latest.digest.state}.`);
    const missing = Object.entries(latest.sourceComplete).filter(([,v])=>!v).map(([k])=>k).join(', ');
    put('workflow-coverage', `${latest.coverage}.${missing ? ' Not fully reconciled: ' + missing + '.' : ''}${latest.today.capBreach ? ' Daily cap breached: investigate before further completion.' : ''}`);
    const engines = $('workflow-engines'); engines.replaceChildren();
    for (const item of latest.engines) {
      const row = document.createElement('div'), title = document.createElement('b'), state = document.createElement('span'), end = document.createElement('small');
      title.textContent = `${item.name} :${String(item.minute).padStart(2,'0')}`;
      state.textContent = `${item.scheduleState} · ${item.health}`;
      end.textContent = `Last end: ${stamp(item.lastEndAt)}${item.lastRunId ? ' · ' + item.lastRunId : ''}`;
      row.append(title,state,end); engines.append(row);
    }
    const csv = $('workflow-csv'); csv.hidden = false;
    csv.textContent = `Download Ultra CSV (${latest.ultraReady} checked packages)`;
    csv.href = './ultra-applications.csv?checked=' + encodeURIComponent(latest.checkedAt);
  }
  async function refresh() {
    try {
      const response = await fetch('./operational.json?ts=' + Date.now(), {cache:'no-store',credentials:'same-origin'});
      if (!response.ok) throw Error('No current operational publication');
      const serverStamp = Date.parse(response.headers.get('date') || '');
      if (Number.isFinite(serverStamp)) serverClockOffset = serverStamp - Date.now();
      const next = await response.json();
      if (next.schemaVersion !== 1 || next.timezone !== 'Europe/London' || next.dailyTarget !== 40 || !Number.isFinite(Date.parse(next.checkedAt)) || Date.parse(next.checkedAt)>serviceNow()+120000 || !Array.isArray(next.engines)) throw Error('Invalid operational snapshot');
      if (!next.today || ![next.today.auto,next.today.ultra,next.today.uniqueCompleted,next.ultraReady,next.excludedIncompleteReady].every(n=>Number.isInteger(n)&&n>=0) || next.today.uniqueCompleted!==next.today.auto+next.today.ultra) throw Error('Operational accounting mismatch');
      if (latest && Date.parse(next.checkedAt) < Date.parse(latest.checkedAt)) throw Error('Older operational snapshot');
      latest = next; render();
    } catch {
      if (latest) { render(); put('workflow-freshness', 'Connection interrupted. Last checked: ' + stamp(latest.checkedAt)); }
      else put('workflow-freshness', 'No verified operational snapshot has been published. The master ledger remains available.');
    }
  }
  refresh(); setInterval(()=>{if(!document.hidden) refresh();},60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) refresh();});
})();
