'use strict';
const opsUI=(()=>{
  const financeKinds=['budget','grant','contribution','expense','maintenance','allocation'];
  const financeStates=['draft','posted','void'];
  const templates=['maintenance','training','policy_review'];
  const audiences=['staff','safeguarding','partners'];
  const money=n=>new Intl.NumberFormat(lang,{style:'currency',currency:'MAD'}).format(n/100);
  function financeDetail(x){
    const edit=!x.id||x.state==='draft'&&can('finance.edit');
    return `<p class="notice">${h('Record operational data only. Do not enter beneficiary information.')}</p>${edit?form('finance-save',[
      field('Type','kind',x.kind||'expense',{items:financeKinds}),field('Project','project',x.project,{required:true,max:100}),field('Label','label',x.label,{required:true,max:160}),
      field('Amount (MAD)','amount',x.amount_minor===undefined?'':(x.amount_minor/100).toFixed(2),{required:true,pattern:'[0-9]{1,9}([.,][0-9]{1,2})?',max:13}),
      field('Entry date','entryDate',x.entry_date||new Date().toISOString().slice(0,10),{type:'date',required:true})].join('')):detailFields([['Label',x.label],['Type',t(x.kind)],['Project',x.project],['Amount (MAD)',money(x.amount_minor)],['Entry date',date(x.entry_date)],['Status',t(x.state)],['Reason',x.reason,true]])}
      ${x.id&&x.state!=='void'&&can('finance.approve')?`<hr class="divider">${x.state==='draft'?btn('Post record','finance-post','primary'):''}${form('finance-void',field('Reason','reason','',{required:true,wide:true,area:true,max:400}),'Void record')}`:''}`;
  }
  function financeTotals(data){return `<div class="metric-board ops-totals">${financeKinds.map(k=>`<div class="metric"><span class="label">${h(k)}</span><strong class="value">${e(money(data.totals[k]))}</strong></div>`).join('')}</div><p class="sub ops-totals-note">${h('Totals include only posted records and follow the date, type and text filters.')}</p>`;}
  function settings(x){
    const fields=[field('Arabic name','nameAr',x.nameAr,{required:true,max:40}),field('French name','nameFr',x.nameFr,{required:true,max:40}),field('English name','nameEn',x.nameEn,{required:true,max:40}),field('Color palette','palette',x.palette,{items:['purple','plum','indigo']}),field('Logo','logo',x.logo,{items:[['mark.png',t('Symbol')],['logo.png',t('Main logo')]]}),check('Maintenance mode','maintenance',x.maintenance)];
    return heading('Platform settings','Branding and public community availability.')+`<section class="panel"><p class="notice">${h('Maintenance pauses community posting and reactions. Reporting and emergency channels stay accessible.')}</p>${can('settings.edit')?form('platform-settings',fields.join('')+`<input type="hidden" name="revision" value="${e(x.revision)}">`):detailFields([['Arabic name',x.nameAr],['French name',x.nameFr],['English name',x.nameEn],['Color palette',t(x.palette)],['Logo',x.logo],['Maintenance mode',t(x.maintenance?'Yes':'No')]])}</section>`;
  }
  function ai(x){
    const cfg=x.settings;
    const formHTML=can('ai.edit')?form('ai-settings',[
      check('Assistant available','enabled',cfg.enabled),...['ar','fr','en'].map(v=>`<label class="check wide"><input type="checkbox" name="languages" value="${v}" ${cfg.languages.includes(v)?'checked':''}>${h({ar:'Arabic',fr:'French',en:'English'}[v])}</label>`),
      field('Default response language','defaultLanguage',cfg.defaultLanguage,{items:[['ar',t('Arabic')],['fr',t('French')],['en',t('English')]]}),
      can('ai.approve')?check('Show approved public resources','includeSources',cfg.includeSources):`<input type="hidden" name="includeSources" value="${cfg.includeSources?'yes':'no'}">`,
      `<input type="hidden" name="revision" value="${e(cfg.revision)}">`
    ].join('')):detailFields([['Assistant available',t(cfg.enabled?'Yes':'No')],['Language',cfg.languages.join(' · ')],['Default response language',cfg.defaultLanguage],['Show approved public resources',t(cfg.includeSources?'Yes':'No')]]);
    const all=new Map(x.metrics.map(m=>[m.outcome,m.count]));
    return heading('Assistant','Settings for the built-in public guidance assistant.')+`<div class="grid"><section class="panel"><h2>${h('Assistant configuration')}</h2><p class="notice">${h('The assistant never makes or changes a safeguarding decision.')}</p>${formHTML}</section><section class="panel"><h2>${h('Seven-day activity')}</h2>${detailFields(['answered','emergency','unavailable','error'].map(k=>[k,number(all.get(k)||0)]))}<hr class="divider"><h2>${h('Test a response')}</h2>${form('ai-test',field('Language','language',cfg.defaultLanguage,{items:[['ar',t('Arabic')],['fr',t('French')],['en',t('English')]]})+field('Synthetic message','message','',{area:true,max:1000,required:true,wide:true}),'Test a response')}<div id="ai-test-output" aria-live="polite"></div></section></div><section class="panel"><h2>${h('Public resource approvals')}</h2><p class="sub">${h('Only published general-audience material can be attached to replies. Unpublishing removes it immediately.')}</p>${table(['Title','Type','Status','Updated'],x.sources.items.map(r=>[e(r.title_en),trValue(r.content_type),pill(r.active?'approved':r.approved_at?'inactive':'not_approved'),e(date(r.approved_at)),]))}${can('ai.approve')&&x.sources.items.length?`<ul class="list">${x.sources.items.map(r=>`<li><span class="event">${e(r.title_en)}</span>${btn(r.approved_at?'Remove approval':'Approve source',`ai-source:${r.id}:${r.approved_at?'remove':'approve'}`)}</li>`).join('')}</ul>`:''}<div class="pagination"><span class="muted">${h('Page')} ${e(number(Math.floor(offset/20)+1))}</span><div class="actions">${btn('Previous','page:prev','secondary',offset===0?'disabled':'')}${btn('Next','page:next','secondary',x.sources.hasMore?'':'disabled')}</div></div></section>`;
  }
  function noticeHTML(){return `<p class="notice">${h('In-app templates contain no case details. No email or SMS is sent.')}</p>${form('notice-create',field('Template','template','training',{items:templates})+field('Recipients','audience','staff',{items:audiences}),'Publish notice')}`;}
  function noticeCell(x){return table(['Template','Recipients','Status','Date','Read receipts','Actions'],x.items.map(r=>[trValue(r.template),trValue(r.audience),pill(r.status),e(date(r.created_at)),e(number(r.read_count)),r.status==='active'?btn('Withdraw',`notice-withdraw:${r.id}`):'—']));}
  function inboxCell(x){return table(['Template','Recipients','Date','Status','Actions'],x.items.map(r=>[trValue(r.template),trValue(r.audience),e(date(r.created_at)),pill(r.read_at?'read':'unread'),r.read_at?'—':btn('Mark as read',`notice-read:${r.id}`)]));}
  function quizHTML(x){
    const editable=!x.id||x.state==='draft'&&can('cms.edit');
    const labels=[['Ar','العربية'],['Fr','Français'],['En','English']];
    const questions=labels.map(([key,label])=>`<section class="panel wide" lang="${key.toLowerCase()}" dir="${key==='Ar'?'rtl':'ltr'}"><h3>${e(label)}</h3><div class="form-grid">${field('Question','question'+key,x['question'+key],{wide:true,required:true,max:320})}${field('Option A','aLabel'+key,x.options?.[0]?.['label'+key],{required:true,max:180})}${field('Option B','bLabel'+key,x.options?.[1]?.['label'+key],{required:true,max:180})}${field('Correct-answer feedback','feedback'+key,x['feedback'+key],{wide:true,area:true,required:true,max:500})}</div></section>`).join('');
    const editor=editable?form('quiz-save',field('Minimum age (Girls only)','minAge',x.min_age??10,{required:true,type:'number'})+field('Maximum age (Girls only)','maxAge',x.max_age??12,{required:true,type:'number'})+field('Correct option','correct',x.options?.find(o=>o.correct)?.id||'a',{items:[['a','A'],['b','B']]})+questions):detailFields([['Status',t(x.state)],['Age range',`${x.min_age}–${x.max_age}`],...labels.flatMap(([l,label])=>[[`${t('Question')} · ${label}`,x['question'+l],true],['Correct option',x.options.find(o=>o.correct)?.['label'+l],true],['Correct-answer feedback',x['feedback'+l],true]])]);
    const actions=[];
    if(x.state==='draft'&&can('cms.edit'))actions.push(['submit','Submit for review']);
    if(x.state==='review'&&can('cms.approve'))actions.push(['publish','Approve and publish'],['return','Return to draft']);
    if(x.state==='published'&&can('cms.approve'))actions.push(['unpublish','Unpublish']);
    if(x.state==='draft'&&can('cms.delete'))actions.push(['archive','Archive']);
    if(x.state==='archived'&&can('cms.delete'))actions.push(['restore','Restore']);
    return `<p class="notice">${h('Quiz content is public by selected age band after independent review. No answers are stored.')}</p>${editor}${actions.length?`<hr class="divider"><div class="actions">${actions.map(([action,label])=>btn(label,`quiz-workflow:${action}`)).join('')}</div>`:''}`;
  }
  return {financeKinds,financeStates,money,financeDetail,financeTotals,settings,ai,quizHTML,noticeHTML,noticeCell,inboxCell};
})();
