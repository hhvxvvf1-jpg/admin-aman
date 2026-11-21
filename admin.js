'use strict';
const $=(q,root=document)=>root.querySelector(q);
const app=$('#app'), dialog=$('#dialog');
const e=v=>String(v??'').replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
const initLang=new URLSearchParams(location.search).get('lang');
let lang=['en','fr','ar'].includes(initLang)?initLang:'en';
const t=k=>messages[k]?.[lang==='fr'?0:lang==='ar'?1:-1] || k;
const h=k=>e(t(k));
const words=k=>String(k??'').replaceAll('_',' ');
const trValue=k=>h(messages[k]?k:words(k));
const icons={grid:'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M20 8a4 4 0 0 1 0 7 M22 21v-2a4 4 0 0 0-3-4 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',case:'M4 5h6l2 2h8v13H4z M8 13h8 M8 16h5',book:'M4 4h6a2 2 0 0 1 2 2v15a3 3 0 0 0-3-2H4z M20 4h-6a2 2 0 0 0-2 2v15a3 3 0 0 1 3-2h5z',pin:'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',chat:'M4 4h16v12H9l-5 4z M8 9h8 M8 12h6',shield:'M12 22s7-3 7-10V5l-7-3-7 3v7c0 7 7 10 7 10Z M9 12l2 2 4-5',chart:'M4 3v17h17 M8 16v-4 M13 16V8 M18 16V5',arrows:'M3 8h16l-3-3 M21 16H5l3 3',log:'M6 3h12v18H6z M9 8h6 M9 12h6 M9 16h4',search:'M15.5 15.5 21 21 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',bell:'M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8 M10 20a2 2 0 0 0 4 0',menu:'M4 6h16 M4 12h16 M4 18h16',external:'M13 5h6v6 M19 5l-9 9 M19 13v6H5V5h6',close:'M6 6l12 12 M6 18 18 6',plus:'M12 5v14 M5 12h14'};
const icon=k=>`<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="${icons[k]||icons.grid}"/></svg>`;
const nav=[['dashboard','Dashboard','grid','dashboard.view','Operations'],['analytics','Analytics','chart','analytics.view','Operations'],['versions','Versions and features','book','versions.view','Operations'],['incidents','Security incidents','shield','incidents.view','Governance'],['users','Users','users','users.view','Operations'],['cases','Cases','case','cases.view','Safeguarding'],['referrals','Referrals','arrows','referrals.view','Safeguarding'],['cms','Content','book','cms.view','Operations'],['quizzes','Girls quizzes','book','cms.view','Operations'],['partners','Partners','pin','partners.view','Operations'],['community','Community','chat','community.view','Operations'],['roles','Roles','shield','roles.manage','Governance'],['audit','Audit','log','audit.view','Governance'],['finance','Finance','chart','finance.view','Governance'],['settings','Platform settings','grid','settings.view','Governance'],['ai','Assistant','chat','ai.view','Governance'],['notices','Staff notices','bell','notices.manage','Governance'],['inbox','Inbox','bell','notices.view','Operations']];
const statuses=['NEW','RECEIVED','INITIAL_REVIEW','HUMAN_ASSESSMENT','ACTION_REQUIRED','REFERRED','FOLLOW_UP','RESOLVED','CLOSED'];
const groups=['women','girls','child'], audiences=['general',...groups], priorities=['low','normal','high','urgent'];
const roles=['super_admin','platform_admin','content_manager','safeguarding_supervisor','women_caseworker','girls_caseworker','child_caseworker','authorized_professional','partner_admin','moderator','auditor','tech_support','member'];
const operational=['platform_admin','content_manager','moderator','auditor','tech_support'];
const types=['article','education','awareness','faq','legal','emergency','announcement','video','safety_guide'];
const cmsStates=['draft','review','published','archived'], orgStates=['pending','verified','rejected','suspended'];
const flagReasons=['privacy','harassment','spam','other'];
let session=null, view='dashboard', filters={}, offset=0, range='month', epoch=0, toastTimer, onConfirm, detailEditor, pending=null;
const can=p=>Boolean(session?.permissions.includes(p));
const langSelect=()=>`<select class="language" id="language" aria-label="${h('Select language')}">${[['en','EN'],['fr','FR'],['ar','ع']].map(([id,label])=>`<option value="${id}" ${id===lang?'selected':''}>${label}</option>`).join('')}</select>`;
const date=x=>{
  if (!x) return '—'; const d=new Date(x.length===10?x+'T00:00:00Z':x.includes('T')?x:x.replace(' ','T')+'Z');
  return Number.isFinite(+d)?new Intl.DateTimeFormat(lang,{dateStyle:'medium',...(x.length>10?{timeStyle:'short'}:{}),timeZone:'UTC'}).format(d):x;
};
const number=x=>typeof x==='number'?new Intl.NumberFormat(lang).format(x):x;
const btn=(label,action='',kind='secondary',extra='')=>`<button type="button" class="btn ${kind}" ${action?`data-action="${e(action)}"`:''} ${extra}>${h(label)}</button>`;
const submit=label=>`<button type="submit" class="btn">${h(label)}</button>`;
const pill=value=>`<span class="pill">${trValue(value)}</span>`;
const noData=()=>`<p class="state">${h('No records match this view.')}</p>`;
function optionList(items,value){return items.map(x=>Array.isArray(x)?x:[x,t(messages[x]?x:words(x))]).map(([id,label])=>`<option value="${e(id)}" ${String(id)===String(value)?'selected':''}>${e(label)}</option>`).join('');}
const field=(label,name,value='',opts={})=>`<label class="field ${opts.wide?'wide':''}">${h(label)}${opts.items?`<select name="${e(name)}" ${opts.required?'required':''}>${optionList(opts.items,value)}</select>`:opts.area?`<textarea name="${e(name)}" maxlength="${opts.max||20000}" ${opts.required?'required':''}>${e(value)}</textarea>`:`<input name="${e(name)}" type="${opts.type||'text'}" value="${e(value)}" ${opts.required?'required':''} ${opts.max?`maxlength="${opts.max}"`:''} ${opts.pattern?`pattern="${e(opts.pattern)}"`:''} ${opts.type==='number'?'step="any"':''} ${opts.autocomplete?`autocomplete="${e(opts.autocomplete)}"`:''}>`}</label>`;
const check=(label,name,checked)=>`<label class="check wide"><input type="checkbox" name="${e(name)}" ${checked?'checked':''}>${h(label)}</label>`;
const detailFields=entries=>`<dl class="detail-grid">${entries.map(([label,value,wide])=>`<div ${wide?'class="wide"':''}><dt>${h(label)}</dt><dd>${value===null||value===undefined||value===''?'—':e(value)}</dd></div>`).join('')}</dl>`;
const form=(action,fields,label='Save changes')=>`<form data-form="${e(action)}" class="form-grid">${fields}${submit(label)}<div class="wide form-error" role="alert"></div></form>`;
const request=(path,options)=>pagesPreview.read(path,options);
const api=(path,opts)=>request('/api/admin/'+path,opts);
function errorLabel(err){
  if(err.message==='independent_reviewer_required')return 'Another authorized reviewer must approve this item.';
  if(err.status===403)return 'Access denied';
  if(err.status===409)return 'This action is no longer available. Refresh and try again.';
  if(err.status===429)return 'Too many attempts. Please try again later.';
  return 'A problem occurred. Please check the inputs and retry.';
}
function rootLanguage(){document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';$('.skip').textContent=t('Skip to content');}
function shell(){
  rootLanguage();
  const selected=nav.find(n=>n[0]===view);
  const visible=nav.filter(n=>can(n[3]));
  const sidebar=['Operations','Safeguarding','Governance'].map(group=>{
    const links=visible.filter(n=>n[4]===group); return links.length?`<div class="nav-label">${h(group)}</div>${links.map(([id,label,ico])=>`<a class="nav-link" href="#${id}" data-action="nav:${id}" ${id===view?'aria-current="page"':''}>${icon(ico)}${h(label)}</a>`).join('')}`:'';
  }).join('');
  app.innerHTML=`<div class="shell"><aside class="sidebar" id="sidebar"><a class="brand" href="#${visible[0][0]}" data-action="nav:${visible[0][0]}"><img src="./mark.png" alt=""><span><strong>AMAN</strong><small>${h('Control center')}</small></span></a><nav aria-label="${h('Navigation')}">${sidebar}</nav><div class="sidebar-foot"><a class="nav-link" href="https://hhvxvvf1-jpg.github.io/amanapp/">${icon('external')}${h('Public website')}</a></div></aside><div class="workspace"><div class="pages-notice" role="note">${h('Read-only preview')} · ${h('Example data')}</div><header class="top"><button class="icon-btn menu" type="button" aria-label="${h('Navigation')}" aria-controls="sidebar" aria-expanded="false" data-action="menu">${icon('menu')}</button><div class="crumb">${h('Administration')} <span aria-hidden="true">/</span> <strong>${h(selected[1])}</strong></div><div class="top-controls"><button class="icon-btn" type="button" data-action="search" aria-label="${h('Search records')}">${icon('search')}</button>${langSelect()}</div></header><main class="main" id="main" tabindex="-1"></main></div></div>`;
}
const heading=(label,sub='',right='')=>`<header class="section-head"><div><p class="kicker">${h('Institutional workspace')}</p><h1>${h(label)}</h1>${sub?`<p>${h(sub)}</p>`:''}</div>${right}</header>`;
const rangeButtons=()=>`<div class="segmented" aria-label="${h('Reporting window')}">${[['week','Week'],['month','Month'],['year','Year']].map(([id,label])=>`<button type="button" data-action="range:${id}" aria-pressed="${range===id}">${h(label)}</button>`).join('')}</div>`;
const metricLabels={totalUsers:['Total users','users'],registrations:['New registrations','plus'],requests:['Help requests','case'],newCases:['New cases','case'],urgent:['Urgent cases','shield'],review:['Under review','log'],referrals:['Referrals','arrows'],resolved:['Resolved cases','shield'],partners:['Verified organizations','pin'],resources:['Published resources','book'],posts:['Visible posts','chat']};
function chart(series){
  const high=Math.max(1,...series.map(x=>x.registrations)), width=560, step=(width-38)/series.length;
  const bars=series.map(({date:day,registrations},i)=>{const y=140*registrations/high, label=`${date(day)} · ${number(registrations)}`;return `<rect class="bar" x="${32+i*step}" y="${153-Math.max(y,1)}" width="${Math.max(step-4,3)}" height="${Math.max(y,1)}" rx="2" tabindex="0" aria-label="${e(label)}" data-point="${e(label)}"><title>${e(label)}</title></rect>`;}).join('');
  return `<svg class="chart" viewBox="0 0 ${width} 183" role="group" aria-label="${h('Registration trend')}"><path class="gridline" d="M30 13h527 M30 48h527 M30 83h527 M30 118h527 M30 153h527" fill="none"/><text x="2" y="17">${e(number(high))}</text><text x="4" y="156">${e(number(0))}</text>${bars}<text x="31" y="174">${e(series[0]?.date||'')}</text><text x="555" y="174" text-anchor="end">${e(series.at(-1)?.date||'')}</text></svg><div class="sub chart-detail" aria-live="polite"></div>`;
}
const pendingMeta={incidents:['Example security incidents','incidents'],cms:['Content reviews','cms'],quizzes:['Quiz reviews','quizzes'],partners:['Partner reviews','partners'],community:['Community flags','community']};
const pendingList=tasks=>Object.entries(tasks||{}).length?`<ul class="list">${Object.entries(tasks).map(([id,count])=>`<li>${can(nav.find(x=>x[0]===pendingMeta[id][1])[3])?`<button class="link-button" data-action="task:${e(id)}">${h(pendingMeta[id][0])}</button>`:h(pendingMeta[id][0])}<span class="pill">${e(number(count))}</span></li>`).join('')}</ul>`:noData();
const eventList=(items=[])=>items.length?`<ul class="list">${items.map(row=>`<li><span class="event">${trValue(row.action||row.event)}</span><time class="when">${e(date(row.created_at))}</time></li>`).join('')}</ul>`:noData();
function statsHTML(stats){
  if(!stats)return '';
  return `<div class="metric-board">${Object.entries(stats.metrics).map(([key,value])=>`<div class="metric"><span class="mark">${icon(metricLabels[key][1])}</span><span class="label">${h(metricLabels[key][0])}</span><strong class="value">${e(number(value))}</strong></div>`).join('')}</div><section class="panel"><h2>${h('Registration trend')}</h2><p class="sub">${h(range==='year'?'Example registrations by month.':'Example registrations by day.')} · ${e(stats.from)} → ${e(stats.to)}</p>${chart(stats.series)}<p class="sub">${h('These numbers do not represent actual activity.')}</p></section>`;
}
function dashboardHTML(data){
  return `${heading('Dashboard','Sample administrative activity.',rangeButtons())}<div class="banner"><div><p class="kicker">${h('Platform overview')}</p><h2>${h('Read-only preview')}</h2><p>${h('Fictional examples only. No accounts, personal data or live service metrics.')}</p></div><button type="button" class="btn secondary" data-action="nav:versions">${h('Versions and features')}</button></div><div class="grid"><div>${statsHTML(data.stats)}</div><div class="stack"><section class="panel"><h2>${h('Example pending tasks')}</h2>${pendingList(data.pending)}</section><section class="panel"><h2>${h('Private administration')}</h2><p>${h('The real admin panel requires a separately hosted server and secure sign-in.')}</p></section></div></div>`;
}
function versionsHTML(data){
  const rows=[
    ['Dashboard','dashboard','Reports CSV, Excel and PDF'],['Content','cms','Image upload and editorial approval'],['Girls quizzes','quizzes','Independent quiz publication'],['Finance','finance','Financial edits and exports'],['Partners','partners','Partner verification and referrals'],['Security incidents','incidents','Record, review and close incidents'],['Assistant','ai','Assistant configuration and testing'],['Platform settings','settings','Branding and maintenance controls'],['Staff invitations',null,'One-time invitations, roles and MFA'],['Safeguarding',null,'Restricted casework and audio'],['Backup and recovery',null,'Encrypted snapshots and offline restore']
  ];
  return heading('Versions and features','One place to explore AMAN and obtain the full source.')+`<div class="grid"><section class="panel"><h2>${h('GitHub Pages edition')}</h2><p>${h('A public, read-only preview with fictional examples. No login is needed.')}</p>${btn('Dashboard','nav:dashboard')}</section><section class="panel"><h2>${h('Full AMAN Admin')}</h2><p>${h('Requires Node.js 22.13 or newer, SQLite and secure staff sign-in. It does not run on GitHub Pages.')}</p><p><a class="btn secondary" href="${e(data.archive)}" download>${h('Download full source ZIP')}</a></p><p class="sub">${h('Source revision')} <code>${e(data.revision)}</code> · <a href="https://github.com/hhvxvvf1-jpg/amanapp">amanapp</a></p></section></div><section class="panel"><h2>${h('Feature directory')}</h2>${table(['Feature','On this page','In full AMAN Admin'],rows.map(([label,id,full])=>[h(label),id?btn('Open sample',`nav:${id}`):h('Private only'),h(full)]))}</section>`;
}
function assistantSample(x){
  return heading('Assistant','Read-only sample configuration.')+`<div class="grid"><section class="panel"><h2>${h('Assistant configuration')}</h2>${detailFields([['Assistant available',t(x.settings.enabled?'Yes':'No')],['Language',x.settings.languages.join(' · ')]])}<p>${h('This page does not send messages to an assistant.')}</p></section><section class="panel"><h2>${h('Example activity')}</h2>${detailFields(x.metrics.map(row=>[words(row.outcome),number(row.count)]))}</section></div>`;
}
function incidentSample(x){
  return detailFields([['Reference',x.id],['Category',t(x.category)],['Component',t(x.component)],['Severity',t(x.severity)],['Status',t(x.state)]]) + `<h3>${h('Incident timeline')}</h3>${table(['Action','Reason','Role','Date'],x.timeline.map(row=>[trValue('incident_'+row.action),trValue(row.reason),trValue(row.actor_role),e(date(row.created_at))]))}`;
}

const config={
 incidents:{label:'Security incidents',search:true,filters:[['state','Status',['in_progress','open','triage','contained','resolved','closed']],['severity','Severity',['low','medium','high','critical']]],headers:['Reference','Category','Severity','Status','Updated'],row:x=>[openCell('incidents',x.id,x.id),trValue(x.category),pill(x.severity),pill(x.state),e(date(x.updated_at))]},
 quizzes:{label:'Girls quizzes',search:true,filters:[['state','Status',cmsStates]],create:'cms.create',headers:['Question','Age range','Status','Updated'],row:x=>[openCell('quizzes',x.id,x.title_en),`${e(x.min_age)}–${e(x.max_age)}`,pill(x.state),e(date(x.updated_at))]},
 finance:{label:'Finance',search:true,dates:true,filters:[['kind','Type',opsUI.financeKinds],['state','Status',opsUI.financeStates]],create:'finance.edit',headers:['Label','Project','Type','Amount (MAD)','Status','Entry date'],row:x=>[openCell('finance',x.id,x.label),e(x.project),trValue(x.kind),e(opsUI.money(x.amount_minor)),pill(x.state),e(date(x.entry_date))]},
 notices:{label:'Staff notices',create:'notices.manage',custom:opsUI.noticeCell},
 inbox:{label:'Inbox',custom:opsUI.inboxCell},
 users:{label:'Users',search:true,filters:[['role','Role',roles],['state','Status',[['active',t('Active')],['suspended',t('Suspended')]]]],headers:['Name','Role','Status','Last sign-in'],row:x=>[openCell('users',x.id,x.full_name||x.id),trValue(x.role),pill(x.is_active?'active':'suspended'),e(date(x.last_login_at))]},
 cases:{label:'Cases',search:true,filters:[['group','Group',groups],['status','Status',statuses],['urgency','Priority',priorities]],headers:['Reference','Group','Category','Priority','Status','Created'],row:x=>[openCell('cases',x.id,x.reference_code),trValue(x.beneficiary_group),e(x.category),pill(x.urgency),pill(x.status),e(date(x.created_at))]},
 cms:{label:'Content',search:true,filters:[['state','Status',cmsStates],['audience','Audience',audiences]],create:'cms.create',headers:['Title','Type','Audience','Status','Updated'],row:x=>[openCell('cms',x.id,x.title_en),trValue(x.content_type),trValue(x.audience),pill(x.review_status),e(date(x.updated_at))]},
 partners:{label:'Partners',search:true,filters:[['state','Status',orgStates]],create:'partners.create',headers:['Name','Category','City','Status'],row:x=>[openCell('partners',x.id,x.name_en),e(x.category),e(x.city),pill(x.review_state)]},
 referrals:{label:'Referrals',headers:['Reference','Status','Created','Updated'],row:x=>[openCell('referrals',x.id,x.id,x.status),pill(x.status),e(date(x.created_at)),e(date(x.updated_at))]},
 audit:{label:'Audit',filters:[['category','Category',[['auth',t('Authentication')]]]],headers:['Event','Actor ID','Date'],row:x=>[trValue(x.action),e(x.actor_id||'—'),e(date(x.created_at))]}
};
function openCell(section,id,label,extra=''){return `<button type="button" class="link-button" data-action="detail:${e(section)}:${e(id)}${extra?':'+e(extra):''}">${e(label)}</button>`;}
function table(headers,rows){return rows.length?`<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th scope="col">${h(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:noData();}
const commType=()=>filters.type || 'post';
function listHTML(data){
  let cfg=config[view];
  if(view==='community') {
    const type=commType();
    cfg={label:'Community',search:type!=='flag',filters:[['type','Type',[['post',t('Posts')],['comment',t('Comments')],['flag',t('Flags')]]]],headers:type==='flag'?['Flagged item','Reason','Date']:['Title','Status','Date'],row:x=>type==='flag'?[openCell('flag',x.id,x.target_id,`${x.target_type}:${x.target_id}`),trValue(x.reason),e(date(x.created_at))]:[openCell(type,x.id,x.title||x.excerpt||x.id),pill(x.hidden?'hidden':'visible'),e(date(x.created_at))]};
  }
  let toolbar=(cfg.search||(cfg.filters||[]).length)?`<form class="toolbar" data-form="filter">${cfg.search?`<input name="q" type="search" maxlength="120" aria-label="${h('Search')}" placeholder="${h('Search')}" value="${e(filters.q||'')}">`:''}${cfg.dates?`<input type="date" name="from" value="${e(filters.from||'')}" aria-label="${h('From date')}"><input type="date" name="to" value="${e(filters.to||'')}" aria-label="${h('To date')}">`:''}${(cfg.filters||[]).map(([k,label,opts])=>`<select name="${e(k)}" aria-label="${h(label)}">${optionList(k==='type'?opts:[['',t('All')+' · '+t(label)],...opts],filters[k]||'')}</select>`).join('')}${submit('Search')}</form>`:'';
  return `${heading(cfg.label,'',`<div class="actions">${btn('Refresh','refresh')}${view==='finance'&&can('finance.export')?[btn('Export CSV','finance-export:csv'),btn('Export Excel','finance-export:xlsx'),btn('Export PDF','finance-export:pdf')].join(''):''}${cfg.create&&can(cfg.create)?btn('Create',`create:${view}`,'primary'):''}</div>`)}${view==='finance'?opsUI.financeTotals(data):''}<section class="panel">${toolbar}${cfg.custom?cfg.custom(data):table(cfg.headers,data.items.map(cfg.row))}<div class="pagination"><span class="muted">${h('Page')} ${e(number(Math.floor(data.offset/20)+1))}</span><div class="actions">${btn('Previous','page:prev','secondary',offset===0?'disabled':'')}${btn('Next','page:next','secondary',data.hasMore?'':'disabled')}</div></div></section>`;
}
function roleHTML(data){return `${heading('Roles','Operational roles only. Safeguarding roles require trusted provisioning.')}${table(['Role','Status'],data.items.map(x=>[openCell('roles',x.role,t(x.role)),e(`${x.enabled.length} / ${x.available.length}`)]))}`;}
async function render({focus=false}={}){
  if(!session)return;
  const current=++epoch;
  shell();
  const main=$('#main');
  main.innerHTML=`<p class="state" role="status">${h('Loading…')}</p>`;
  if(focus)main.focus();
  try {
    const q=new URLSearchParams({...filters,offset:String(offset)});
    const response=await api((view==='inbox'?'notices/inbox':view)+(view==='dashboard'||view==='analytics'?`?range=${range}`:view==='roles'?'':`?${q}`));
    if(epoch!==current||!session)return;
    if(view==='dashboard'){pending=response.pending;main.innerHTML=dashboardHTML(response);}
    else if(view==='analytics')main.innerHTML=`${heading('Analytics','',`<div class="actions">${rangeButtons()}${can('analytics.export')?[btn('Export CSV','analytics-export:csv'),btn('Export Excel','analytics-export:xlsx'),btn('Export PDF','analytics-export:pdf')].join(''):''}</div>`)}${statsHTML(response)}`;
    else if(view==='roles'){detailEditor=response.items;main.innerHTML=`<section class="panel">${roleHTML(response)}</section>`;}
    else if(view==='settings')main.innerHTML=opsUI.settings(response);
    else if(view==='ai')main.innerHTML=assistantSample(response);
    else if(view==='versions')main.innerHTML=versionsHTML(response);
    else main.innerHTML=listHTML(response);
  } catch(err){if(epoch===current&&session)main.innerHTML=`${heading(nav.find(x=>x[0]===view)[1])}<p class="error-box" role="alert">${h('Unable to load this view.')} ${h(errorLabel(err))}</p>${btn('Try again','refresh')}`;}
}
function go(id,options={}){
  if(!nav.some(n=>n[0]===id&&can(n[3])))return;
  if(dialog.open)dialog.close();
  view=id;offset=0;filters=options;
  try{history.replaceState(null,'',`#${id}`);}catch{}render({focus:true});
}
let dialogModel=null;
const audioURLs=new Set();
dialog.addEventListener('close',()=>{for(const url of audioURLs)URL.revokeObjectURL(url);audioURLs.clear();if(!dialog.open){dialog.replaceChildren();dialogModel=null;onConfirm=null;}});
function modal(title,html){
  const existing=dialog.open;
  dialog.innerHTML=`<header class="dialog-head"><h2 id="dialog-title">${h(title)}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${h('Close')}">${icon('close')}</button></header><div class="dialog-body">${html}</div>`;
  if(!existing)dialog.showModal();
  $('.dialog-body',dialog).scrollTop=0;
}
function confirmAction(label,callback){
  const back=dialogModel;
  onConfirm=callback;
  modal(label,`<p>${h(label)}?</p><div class="actions">${btn('Cancel',back?'back-detail':'close')}${btn('Confirm','confirm','danger')}</div><div class="form-error" role="alert"></div>`);
}
const caseStatusName=(value)=>t(value);
function caseHTML(x){
  const idx=statuses.indexOf(x.status);
  const reopening=['RESOLVED','CLOSED'].includes(x.status)&&can('cases.reopen');
  const options=[];
  if(x.status!=='CLOSED') {
    const next=x.status==='ACTION_REQUIRED'?'FOLLOW_UP':statuses[idx+1];
    if(next && next!=='REFERRED' && (next!=='ACTION_REQUIRED'||can('cases.assign'))) options.push(next);
  }
  if(reopening)options.push('INITIAL_REVIEW');
  const next=options[0];
  const showReason=options.some(x=>['INITIAL_REVIEW','RESOLVED','CLOSED'].includes(x));
  const statusForm=can('cases.edit')&&next?form('case-status',`${field('Status','status',next,{items:options,required:true})}${next==='ACTION_REQUIRED'?field('Assignee','assignedTo','',{items:[['','—'],...x.assignees.map(a=>[a.id,a.full_name])],required:true}):''}${showReason?field('Reason','reason','',{max:2000,area:true,wide:true}):''}`,'Move case forward'):'';
  const notes=x.notes.length?`<ul class="list">${x.notes.map(n=>`<li><span class="detail-copy">${e(n.content)}</span><time class="when">${e(date(n.created_at))}</time></li>`).join('')}</ul>`:noData();
  const referrals=x.referrals.length?table(['Organization','Status','Date'],x.referrals.map(r=>[e(r.organization),pill(r.status),e(date(r.created_at))])):noData();
  return `<div class="notice">${h('This workspace is restricted to authorized staff.')}</div>${detailFields([['Reference',x.reference_code,true],['Group',t(x.beneficiary_group)],['Status',caseStatusName(x.status)],['Category',x.category],['Priority',t(x.urgency)],['Assignee',x.assigned_to],['Created',date(x.created_at)],['Description',x.description,true],['Safe contact',x.safe_contact,true],['City',x.city],['Reason',x.reopen_reason||x.closure_reason]])}${statusForm}<hr class="divider"><h3>${h('Notes')}</h3>${notes}${can('cases.edit')&&x.status!=='CLOSED'?form('case-note',field('Body','content','',{area:true,wide:true,required:true,max:5000}),'Record note'):''}<hr class="divider"><h3>${h('Referrals')}</h3>${referrals}${can('cases.refer')&&x.status==='ACTION_REQUIRED'&&x.organizations.length?form('case-referral',field('Organization','organizationId','',{items:[['','—'],...x.organizations.map(o=>[o.id,o.name_en])],required:true})+field('Notes','notes','',{area:true,wide:true,max:3000}),'Create referral'):''}<hr class="divider"><h3>${h('Audio reports')}</h3>${x.audio.length?`<ul class="list">${x.audio.map(a=>`<li><time class="when">${e(date(a.created_at))}</time>${btn('Load audio',`audio:${a.id}`)}<span data-player="${e(a.id)}"></span></li>`).join('')}</ul>`:noData()}<hr class="divider"><h3>${h('Timeline')}</h3>${eventList(x.timeline)}`;
}
function accountHTML(x){
  const allowed=x.canManage&&can('users.edit');
  return `${detailFields([['Account',x.id,true],['Staff name',x.full_name],['Email',x.email],['Role',t(x.role)],['Status',t(x.is_active?'Active':'Suspended')],['Last sign-in',date(x.last_login_at)],['Enrolled MFA',t(x.mfa_enabled?'Yes':'No')],['Active sessions',x.active_sessions]])}${allowed?form('account',`${field('Role','role',x.role,{items:operational.includes(x.role)?operational:[x.role]})}${check('Active','active',Boolean(x.is_active))}`):''}${can('sessions.manage')&&x.canManage?`<hr class="divider">${btn('Revoke sessions','revoke','danger')}`:''}`;
}
function cmsHTML(x){
  const isNew=!x.id, editing=isNew||x.review_status==='draft'&&can('cms.edit');
  const labels=[['Ar','العربية'],['Fr','Français'],['En','English']];
  const editor=editing?form('cms-save',`${field('Slug','slug',x.slug,{required:true,pattern:'[a-z0-9]+(-[a-z0-9]+)*',max:100})}${field('Type','contentType',x.content_type||'article',{items:types})}${field('Audience','audience',x.audience||'general',{items:audiences})}${field('Minimum age (Girls only)','minAge',x.min_age??10,{type:'number'})}${field('Maximum age (Girls only)','maxAge',x.max_age??17,{type:'number'})}${labels.map(([suffix,label])=>`${field(`${t('Title')} · ${label}`,'title'+suffix,x['title_'+suffix.toLowerCase()],{wide:true,required:true,max:200})}${field(`${t('Body')} · ${label}`,'body'+suffix,x['body_'+suffix.toLowerCase()],{area:true,wide:true,required:true})}`).join('')}${field('Source reference','sourceRef',x.source_ref,{wide:true,max:500})}${field('SEO description','seoDescription',x.seo_description,{wide:true,max:320})}${btn('Preview','cms-preview')}`):`${detailFields([['Slug',x.slug],['Type',words(x.content_type)],['Audience',t(x.audience)],['Age range',x.min_age?`${x.min_age}–${x.max_age}`:null],['Status',t(x.review_status)],['Publication date',date(x.publish_at)],['Source reference',x.source_ref,true]])}${btn('Preview','cms-preview')}`;
  const buttons=[];
  if(x.review_status==='draft'&&can('cms.edit'))buttons.push(['Submit for review','submit']);
  if(x.review_status==='draft'&&can('cms.delete'))buttons.push(['Archive','archive']);
  if(x.review_status==='review'&&can('cms.approve'))buttons.push(['Return to draft','return']);
  if(x.review_status==='published'&&can('cms.approve'))buttons.push(['Unpublish','unpublish']);
  if(x.review_status==='archived'&&can('cms.delete'))buttons.push(['Restore','restore']);
  return `<p class="notice">${h('Content is shown as plain text. Safety guidance requires an independent reviewer and a source.')}</p>${editor}${x.image?`<h3>${h('Public content image')}</h3><img class="sample-illustration" src="${e(x.image.src)}" alt="${e(x.image['alt_'+lang])}">`:''}${isNew?'':`<hr class="divider"><div class="actions">${buttons.map(([label,action])=>btn(label,`cms-workflow:${action}`)).join('')}</div>${x.review_status==='review'&&can('cms.approve')?form('cms-publish',field('Date and time (optional)','publishAt','',{type:'datetime-local'}),'Approve and publish'):''}<h3>${h('History')}</h3>${eventList(x.history)}`}`;
}
function partnerHTML(x){
  const create=!x.id;
  const keys=[['Name · العربية','nameAr','name_ar',160,true],['Name · Français','nameFr','name_fr',160,true],['Name · English','nameEn','name_en',160,true],['Category','category','category',100,true],['City','city','city',120,true],['Region','region','region',120,true],['Address','address','address',250],['Phone','phone','phone',80],['Email','email','email',254],['Hours','operatingHours','operating_hours',200],['Accessibility','accessibilityInfo','accessibility_info',500],['Latitude','latitude','latitude'],['Longitude','longitude','longitude']];
  return `<p class="notice">${h('Publish only a public service location. Never add a confidential shelter or a beneficiary address.')}</p>${create||can('partners.edit')?form('partner-save',keys.map(([label,key,col,max,required])=>field(label,key,x[col]??'',{max,required,type:['latitude','longitude'].includes(key)?'number':key==='email'?'email':'text'})).join('')):detailFields(keys.map(([label,,col])=>[label,x[col]]))}${!create?`<hr class="divider">${detailFields([['Status',t(x.review_state)],['Evidence reference / reason',x.verification_ref,true],['Public listing',t(x.public_listing?'Yes':'No')]])}${can('partners.approve')?form('partner-review',`${field('Decision','state','verified',{items:orgStates.slice(1),required:true})}${field('Evidence reference / reason','evidence','',{required:true,max:300})}${check('Publish this organization’s public contact and location','publicListing',Boolean(x.public_listing))}`,'Save changes'):''}`:''}`;
}
function roleDetail(x){return `<form data-form="role" class="form-grid">${x.available.length?x.available.map(p=>`<label class="check wide"><input name="permission" value="${e(p)}" type="checkbox" ${x.enabled.includes(p)?'checked':''} ${x.role==='super_admin'?'disabled':''}>${e(p)}</label>`).join(''):noData()}${x.role!=='super_admin'&&x.available.length?submit('Save permissions'):''}<div class="form-error wide" role="alert"></div></form>`;}
function referralHTML(id,status){
  const options={PENDING:['ACCEPTED','REJECTED'],ACCEPTED:['COMPLETED']}[status]||[];
  return detailFields([['Reference',id,true],['Status',t(status)]])+(can('referrals.edit')&&options.length?form('referral',field('Status','status',options[0],{items:options})):'');
}
function communityHTML(type,x,flagId){
  return `${detailFields([['Title',x.title],['Status',words(x.hidden?'hidden':'visible')],['Body',x.body||x.text,true]])}<p class="notice">${h('Flag privacy concerns before publishing or restoring content.')}</p>${can('community.edit')?form('community-moderate',field('Reason','reason','privacy',{items:flagReasons}),x.hidden?'Restore':'Hide'):''}${flagId&&can('community.edit')?`<hr class="divider"><div class="actions">${btn('Mark reviewed','flag:reviewed')}${btn('Dismiss','flag:dismissed')}</div>`:''}`;
}
const titles={incidents:'Security incidents',quizzes:'Girls quizzes',finance:'Finance',notices:'Staff notices',users:'Account',cases:'Cases',cms:'Content',partners:'Organization',roles:'Roles',referrals:'Referrals',post:'Posts',comment:'Comments',flag:'Flagged item'};
async function showDetail(section,id='',extra=[]){
  const model={section,id,extra,data:null};
  dialogModel=model;
  const title=titles[section];
  modal(title,`<p role="status">${h('Loading…')}</p>`);
  try{
    let x={};
    if(section==='roles')x=detailEditor.find(r=>r.role===id);
    else if(section==='referrals')x={id,status:extra[0]};
    else if(section==='flag')x=await api(`community/${extra[0]}/${extra[1]}`);
    else if(['post','comment'].includes(section))x=await api(`community/${section}/${id}`);
    else if(id)x=await api(`${section}/${id}`);
    if(!dialog.open||dialogModel!==model||!session)return;
    model.data=x;
    const body=section==='incidents'?incidentSample(x):section==='quizzes'?opsUI.quizHTML(x):section==='finance'?opsUI.financeDetail(x):section==='notices'?opsUI.noticeHTML():section==='cases'?caseHTML(x):section==='users'?accountHTML(x):section==='cms'?cmsHTML(x):section==='partners'?partnerHTML(x):section==='roles'?roleDetail(x):section==='referrals'?referralHTML(id,x.status):communityHTML(section,x,section==='flag'?id:null);
    modal(title,body);
  }catch(err){if(dialog.open&&dialogModel===model&&session)modal(title,`<p class="error-box" role="alert">${h(errorLabel(err))}</p>`+(section==='flag'&&can('community.edit')?btn('Dismiss','flag:dismissed'):''));}
}
function toast(key){const node=$('#toast');node.textContent=t(key);clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.textContent='',3300);}
async function finish(task){
  const result=await task;
  if(dialog.open)dialog.close();
  if(session){toast('Saved');await render();}
  return result;
}
const patch=(path,body)=>api(path,{method:'PATCH',body});
const post=(path,body)=>api(path,{method:'POST',body});
function linkDownload(data,filename){const url=URL.createObjectURL(data);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function profile(){dialogModel=null; modal('Profile',detailFields([['Name',session.user.fullName],['Email',session.user.email],['Role',t(session.user.role)]])+btn('Sign out','logout','danger'));}
async function notifications(){if(can('notices.view'))return go('inbox');dialogModel=null; modal('Notifications',`<p role="status">${h('Loading…')}</p>`);try{if(can('dashboard.view'))pending=(await api(`dashboard?range=${range}`)).pending;if(dialog.open&&!dialogModel)modal('Notifications',pendingList(pending));}catch(error){if(dialog.open&&!dialogModel)modal('Notifications',`<p role="alert">${h(errorLabel(error))}</p>`);}}
function globalSearch(){
  const modules=nav.filter(x=>can(x[3])&&['users','cases','cms','partners','community','finance','quizzes'].includes(x[0]));
  dialogModel=null;
  modal('Search records',modules.length?form('global-search',`${field('Search','q','',{required:true,max:120,wide:true})}${field('Type','section',modules[0][0],{items:modules.map(([id,label])=>[id,t(label)])})}`,'Search'):noData());
}
function detailBack(){const x=dialogModel;if(x)return showDetail(x.section,x.id,x.extra);}
function inDialogError(err){const dst=$('.form-error',dialog)||$('.dialog-body',dialog);if(dst){const p=document.createElement('p');p.className='error-box';p.setAttribute('role','alert');p.textContent=t(errorLabel(err));dst.append(p);}else toast(errorLabel(err));}
app.addEventListener('change',ev=>{
  if(ev.target.id!=='language')return;
  lang=ev.target.value;
  config.users.filters[1][2]=[['active',t('Active')],['suspended',t('Suspended')]];
  config.audit.filters[0][2]=[['auth',t('Authentication')]];
  const url=new URL(location.href);url.searchParams.set('lang',lang);try{history.replaceState(null,'',url);}catch{}
  render();
});
document.addEventListener('submit',async ev=>{
  const f=ev.target, action=f.dataset.form;
  if(!action)return;
  ev.preventDefault();
  const input=new FormData(f); const data=Object.fromEntries(input); const target=dialogModel;
  const button=f.querySelector('[type=submit]');
  const out=$('.form-error',f); if(out)out.replaceChildren();
  if(button)button.disabled=true;
  try{
    if(action==='filter'){offset=0;filters=Object.fromEntries([...input].filter(([,v])=>v!==''));await render();}
    else if(action==='global-search'){go(data.section,{q:data.q});}
    else if(action==='case-status'){await finish(patch(`cases/${target.id}/status`,{status:data.status,reason:data.reason||'',assignedTo:data.assignedTo||null}));}
    else if(action==='case-note'){await finish(post(`cases/${target.id}/notes`,data));}
    else if(action==='case-referral'){await finish(post(`cases/${target.id}/referrals`,data));}
    else if(action==='account'){confirmAction('Save changes',()=>finish(patch(`users/${target.id}`,{role:data.role,active:input.has('active')})));}
    else if(action==='role'){confirmAction('Save permissions',()=>finish(patch(`roles/${target.id}`,{enabled:input.getAll('permission')})));}
    else if(action==='referral'){await finish(patch(`referrals/${target.id}`,data));}
    else if(action==='cms-save'){const payload={...data,minAge:Number(data.minAge),maxAge:Number(data.maxAge)};await finish(target.id?patch(`cms/${target.id}`,{...payload,revision:target.data.revision}):post('cms',payload));}
    else if(action==='cms-publish'){
      const when=data.publishAt?new Date(data.publishAt).toISOString():'';
      confirmAction('Approve and publish',()=>finish(post(`cms/${target.id}/workflow`,{action:'publish',revision:target.data.revision,publishAt:when})));
    }else if(action==='partner-save'){
      const payload={...data,latitude:data.latitude===''?null:Number(data.latitude),longitude:data.longitude===''?null:Number(data.longitude)};
      const save=()=>finish(target.id?patch(`partners/${target.id}`,payload):post('partners',payload));
      if(target.data.review_state==='verified')confirmAction('Return to review',save);else await save();
    }else if(action==='partner-review'){confirmAction('Save changes',()=>finish(post(`partners/${target.id}/review`,{...data,publicListing:input.has('publicListing')})));}
    else if(action==='quiz-save'){const payload={...data,revision:target.data.revision,minAge:Number(data.minAge),maxAge:Number(data.maxAge)};await finish(target.id?patch(`quizzes/${target.id}`,payload):post('quizzes',payload));}
    else if(action==='finance-save'){const payload={...data,revision:target.data.revision};await finish(target.id?patch(`finance/${target.id}`,payload):post('finance',payload));}
    else if(action==='finance-void'){confirmAction('Void record',()=>finish(post(`finance/${target.id}/workflow`,{revision:target.data.revision,action:'void',reason:data.reason})));}
    else if(action==='platform-settings'){await finish(patch('settings',{...data,revision:Number(data.revision),maintenance:input.has('maintenance')}));}
    else if(action==='ai-settings'){await finish(patch('ai',{enabled:input.has('enabled'),includeSources:input.has('includeSources')&&data.includeSources!=='no',revision:Number(data.revision),languages:input.getAll('languages'),defaultLanguage:data.defaultLanguage}));}
    else if(action==='ai-test'){
      const output=$('#ai-test-output');output.replaceChildren();
      const result=await post('ai/test',data);
      const p=document.createElement('p');p.className='detail-copy';p.textContent=result.reply||t('Assistant unavailable');output.replaceChildren(p);
      if(result.sources?.length){const list=document.createElement('ul');for(const item of result.sources){const li=document.createElement('li');li.textContent=item.title;list.append(li);}output.append(list);}
    }
    else if(action==='notice-create'){confirmAction('Publish notice',()=>finish(post('notices',data)));}
    else if(action==='community-moderate'){
      const targetType=target.section==='flag'?target.extra[0]:target.section, id=target.section==='flag'?target.extra[1]:target.id;
      confirmAction(target.data.hidden?'Restore':'Hide',()=>finish(patch(`community/${targetType}/${id}`,{hidden:!target.data.hidden,reason:data.reason})));
    }
  }catch(err){
    if(action==='login'){
      token='';session=null;if(out)out.textContent=t(err.status===429?errorLabel(err):'Sign-in failed. Check your credentials and code.');
    } else if(out){out.innerHTML=`<p class="error-box">${h(errorLabel(err))}</p>`;}
    else inDialogError(err);
  }finally{if(button)button.disabled=false;}
});
document.addEventListener('click',async ev=>{
  const el=ev.target.closest('[data-action]');
  if(!el)return;
  ev.preventDefault();
  const [action,a,b,...extra]=el.dataset.action.split(':');
  try{
    switch(action){
      case 'nav':go(a);break;
      case 'range':range=a;await render();break;
      case 'task':go(a,['cms','quizzes'].includes(a)?{state:'review'}:a==='partners'?{state:'pending'}:a==='incidents'?{state:'in_progress'}:{type:'flag'});break;
      case 'menu':{const state=$('#sidebar').classList.toggle('open');el.setAttribute('aria-expanded',state);if(state)$('#sidebar .nav-link')?.focus();break;}
      case 'refresh':await render();break;
      case 'page':offset=Math.max(0,offset+(a==='next'?20:-20));await render({focus:true});break;
      case 'close':dialog.close();break;
      case 'back-detail':await detailBack();break;
      case 'profile':profile();break;
      case 'notifications':await notifications();break;
      case 'search':globalSearch();break;
      case 'detail':await showDetail(a,b,extra);break;
      case 'create':await showDetail(a);break;
      case 'confirm':{el.disabled=true;const callback=onConfirm;await callback?.();break;}
      case 'finance-export':{el.disabled=true;linkDownload(await api(`finance/${a}?${new URLSearchParams(filters)}`,{binary:true}),`aman-finance.${a}`);break;}
      case 'finance-post':{const x=dialogModel;confirmAction('Post record',()=>finish(post(`finance/${x.id}/workflow`,{revision:x.data.revision,action:'post'})));break;}
      case 'ai-source':{confirmAction(b==='approve'?'Approve source':'Remove approval',()=>finish(patch(`ai/sources/${a}`,{approve:b==='approve'})));break;}
      case 'notice-read':await finish(post(`notices/${a}/read`,{}));break;
      case 'notice-withdraw':confirmAction('Withdraw',()=>finish(post(`notices/${a}/withdraw`,{})));break;
      case 'analytics-export':{el.disabled=true;linkDownload(await api(`analytics/${a}?range=${range}`,{binary:true}),`aman-activity.${a}`);break;}
      case 'revoke':{const id=dialogModel.id;confirmAction('Revoke sessions',()=>finish(api(`users/${id}/sessions`,{method:'DELETE'})));break;}
      case 'cms-preview':{
        const data=dialogModel.data, editor=$('[data-form="cms-save"]',dialog);const values=editor?Object.fromEntries(new FormData(editor)):{};
        modal('Preview',[['Ar','العربية','rtl'],['Fr','Français','ltr'],['En','English','ltr']].map(([suffix,label,dir])=>`<section dir="${dir}"><p class="kicker">${e(label)}</p><h3>${e(values['title'+suffix]??data['title_'+suffix.toLowerCase()])}</h3><p class="detail-copy">${e(values['body'+suffix]??data['body_'+suffix.toLowerCase()])}</p></section>`).join('<hr class="divider">')+btn('Back','cms-preview-back')); dialogModel.preview=values;break;
      }
      case 'cms-preview-back':{
        const {id,preview}=dialogModel;await showDetail('cms',id);
        const formEl=$('[data-form="cms-save"]',dialog);
        if(formEl)for(const [key,value] of Object.entries(preview||{}))if(formEl.elements.namedItem(key))formEl.elements.namedItem(key).value=value;
        break;
      }
      case 'quiz-workflow':{const x=dialogModel;const labels={submit:'Submit for review',publish:'Approve and publish',return:'Return to draft',archive:'Archive',restore:'Restore',unpublish:'Unpublish'};confirmAction(labels[a],()=>finish(post(`quizzes/${x.id}/workflow`,{action:a,revision:x.data.revision})));break;}
      case 'cms-workflow':{const x=dialogModel;const labels={submit:'Submit for review',return:'Return to draft',archive:'Archive',restore:'Restore',unpublish:'Unpublish'};confirmAction(labels[a],()=>finish(post(`cms/${x.id}/workflow`,{action:a,revision:x.data.revision})));break;}
      case 'flag':{const id=dialogModel.id;await finish(patch(`community/flag/${id}`,{status:a}));break;}
      case 'audio':{
        const model=dialogModel;el.disabled=true;const blob=await request('/api/audio/'+a,{binary:true});
        const player=$(`[data-player="${CSS.escape(a)}"]`,dialog);
        if(player&&dialog.open&&dialogModel===model){const url=URL.createObjectURL(blob);audioURLs.add(url);const audio=document.createElement('audio');audio.controls=true;audio.src=url;player.replaceChildren(audio);el.remove();}
        break;
      }
    }
  }catch(error){dialog.open?inDialogError(error):toast(errorLabel(error));}finally{if(el.isConnected)el.disabled=false;}
});
function updateChart(ev){const point=ev.target.closest?.('[data-point]');if(point)$('.chart-detail',point.closest('section')).textContent=point.dataset.point;}
app.addEventListener('focusin',updateChart);app.addEventListener('mouseover',updateChart);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!dialog.open&&$('#sidebar.open')){$('#sidebar').classList.remove('open');const menu=$('[data-action="menu"]');menu.setAttribute('aria-expanded','false');menu.focus();}});
// Run only client-side filters, including in sandboxed frames without allow-forms.
document.addEventListener('click',event=>{
  const button=event.target.closest('button[type="submit"]'), form=button?.form;
  if(!form?.matches('form[data-form="filter"],form[data-form="global-search"]'))return;
  event.preventDefault();if(form.reportValidity())form.dispatchEvent(new SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:button}));
},true);
document.addEventListener('keydown',event=>{
  if(event.key!=='Enter'||event.isComposing||!event.target.matches('input'))return;
  const form=event.target.form;
  if(!form?.matches('form[data-form="filter"],form[data-form="global-search"]'))return;
  event.preventDefault();if(form.reportValidity())form.dispatchEvent(new SubmitEvent('submit',{bubbles:true,cancelable:true}));
},true);
const requestedView=location.hash.slice(1);
session={user:{fullName:'Read-only preview'},permissions:pagesPreview.permissions};
go(nav.some(x=>x[0]===requestedView&&can(x[3]))?requestedView:'dashboard');
