'use strict';
// This GitHub Pages edition never connects to an API. All examples are invented.
const pagesPreview=(()=>{
  const permissions=Object.freeze(['dashboard.view','analytics.view','cms.view','partners.view','finance.view','settings.view','versions.view','incidents.view','ai.view']);
  const last='2026-01-31', stamp=last+'T12:00:00Z';
  const reports={
    incidents:[{id:'EXAMPLE-INC-01',category:'backup_recovery',severity:'medium',component:'data_store',state:'contained',updated_at:stamp,timeline:[{action:'contain',reason:'precaution_completed',actor_role:'tech_support',created_at:stamp},{action:'triage',reason:'assessment_started',actor_role:'tech_support',created_at:stamp},{action:'record',reason:'operator_reported',actor_role:'tech_support',created_at:stamp}]}],
    finance:[
      {id:'sample-budget',label:'Example training budget',project:'Sample education project',kind:'budget',amount_minor:200000,state:'posted',entry_date:'2026-01-10'},
      {id:'sample-expense',label:'Example materials expense',project:'Sample education project',kind:'expense',amount_minor:12550,state:'posted',entry_date:'2026-01-27'},
      {id:'sample-allocation',label:'Example draft allocation',project:'Sample operations project',kind:'allocation',amount_minor:15000,state:'draft',entry_date:'2026-01-30'}
    ],
    cms:[{id:'sample-resource',slug:'sample-resource',title_en:'Example educational resource',title_fr:'Exemple de ressource éducative',title_ar:'مثال على مورد تعليمي',body_en:'Trilingual sample text showing how a resource looks. Not official advice.',body_fr:'Texte fictif pour illustrer une ressource trilingue. Aucun conseil officiel.',body_ar:'نص تجريبي يعرض مثالاً لمورد بثلاث لغات، وليس إرشاداً رسمياً.',review_status:'published',content_type:'education',audience:'general',updated_at:stamp,publish_at:stamp,history:[],image:{src:'./pages-sample-illustration.png',alt_ar:'رسم تعليمي بنفسجي وذهبي',alt_fr:'Illustration éducative violette et dorée',alt_en:'Purple and gold educational illustration'}}],
    quizzes:[{id:'sample-quiz',title_en:'Example education quiz',questionEn:'Which of these is the colour purple?',questionFr:'Laquelle de ces couleurs est le violet ?',questionAr:'أيٌّ من هذه الألوان هو البنفسجي؟',feedbackEn:'Example feedback: purple.',feedbackFr:'Exemple de réponse : violet.',feedbackAr:'مثال على تعليق: بنفسجي.',min_age:10,max_age:12,state:'published',updated_at:stamp,options:[{id:'a',correct:true,labelEn:'Purple',labelFr:'Violet',labelAr:'بنفسجي'},{id:'b',correct:false,labelEn:'Gold',labelFr:'Or',labelAr:'ذهبي'}]}],
    partners:[{id:'sample-organization',name_en:'Sample organization (not verified)',name_fr:'Organisme fictif (non vérifié)',name_ar:'مؤسسة افتراضية غير متحقَّق منها',category:'Example only',review_state:'pending',public_listing:0}]
  };
  const financeKinds=['budget','grant','contribution','expense','maintenance','allocation'];
  function stats(range){
    const days=range==='week'?7:range==='year'?365:31;
    const series=Array.from({length:days},(_,i)=>{
      const d=new Date(Date.parse(last+'T00:00:00Z')-(days-1-i)*86400000);
      const day=d.toISOString().slice(0,10);
      return {date:day,registrations:{'2026-01-03':2,'2026-01-09':3,'2026-01-14':2,'2026-01-27':4,'2026-01-30':1}[day]||0};
    });
    // Summarize a year by month so the chart remains readable.
    let visible=series;
    if(range==='year'){
      const totals=new Map();for(const item of series){const month=item.date.slice(0,7)+'-01';totals.set(month,(totals.get(month)||0)+item.registrations);}
      visible=Array.from(totals,([date,registrations])=>({date,registrations}));
    }
    return {from:series[0].date,to:last,series:visible,metrics:{totalUsers:12,registrations:series.reduce((sum,day)=>sum+day.registrations,0),resources:1}};
  }
  async function read(path,{method='GET',binary=false}={}){
    if(method!=='GET'||binary||typeof path!=='string'||!path.startsWith('/api/admin/'))throw Object.assign(Error('read_only_preview'),{status:403});
    const [pathname,query='']=path.split('?'), bits=pathname.slice(11).split('/');
    const [section,id]=bits, params=new URLSearchParams(query);
    const value=(key)=>params.get(key)||'';
    if(bits.length<=2){
      if(!id&&section==='analytics')return stats(value('range'));
      if(!id&&section==='dashboard')return {stats:stats(value('range')),pending:{partners:1,incidents:1},health:{api:'—',database:'—',backup:null,backupVisible:false}};
      if(!id&&section==='versions')return {revision:'d4007d1',archive:'./AMAN-source-d4007d1.zip'};
      if(!id&&section==='ai')return {settings:{enabled:true,languages:['ar','fr','en'],includeSources:true},metrics:[{outcome:'answered',count:12},{outcome:'emergency',count:2}]};
      if(!id&&section==='settings')return {nameAr:'أمان',nameFr:'AMAN',nameEn:'AMAN',palette:'purple',logo:'mark.png',maintenance:false};
      if(Object.hasOwn(reports,section)){
        if(id){const item=reports[section].find(row=>row.id===id);if(item)return structuredClone(item);}
        else{
          const q=value('q').trim().toLowerCase(),state=value('state'),kind=value('kind'),audience=value('audience'),severity=value('severity'),category=value('category'),from=value('from'),to=value('to');
          const filtered=reports[section].filter(row=>(!q||[row.id,row.label,row.project,row.title_en,row.name_en].some(v=>v?.toLowerCase().includes(q)))&&(!state||state===(row.state||row.review_status||row.review_state)||state==='in_progress'&&row.state!=='closed')&&(!severity||severity===row.severity)&&(!category||category===row.category)&&(!kind||kind===row.kind)&&(!audience||audience===row.audience)&&(!from||row.entry_date>=from)&&(!to||row.entry_date<=to));
          const offset=Math.min(filtered.length,Math.max(0,Number.parseInt(value('offset'),10)||0));
          const result={items:filtered.slice(offset,offset+20),offset,hasMore:filtered.length>offset+20};
          if(section==='finance')result.totals=Object.fromEntries(financeKinds.map(k=>[k,filtered.filter(r=>r.kind===k&&r.state==='posted').reduce((sum,r)=>sum+r.amount_minor,0)]));
          return structuredClone(result);
        }
      }
    }
    throw Object.assign(Error('not_found'),{status:404});
  }
  return Object.freeze({permissions,read});
})();
