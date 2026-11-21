'use strict';
// These state transitions are confined to in-memory fictional examples in this browser tab.
const operationsLab=(()=>{
  const views=['finance','incidents'];
  let view='finance',finance,incident;
  const blankFinance=()=>({state:'draft',amount:12550,reason:null,events:['draft']});
  const blankIncident=()=>({state:'open',actor:'operator',resolvedBy:null,events:[{action:'record',actor:'operator'}]});
  finance=blankFinance();incident=blankIncident();
  const actions={open:'triage',triage:'contain',contained:'resolve',resolved:'close',closed:'reopen'};
  const next={triage:'triage',contain:'contained',resolve:'resolved',close:'closed',reopen:'triage'};
  const reasons={duplicate_example:'Duplicate fictional entry',training_correction:'Training correction'};
  function incidentStep(){
    const action=actions[incident.state];
    const allowed=action==='close'?incident.actor==='reviewer'&&incident.actor!==incident.resolvedBy:
      action==='reopen'?incident.actor==='reviewer':incident.actor==='operator';
    return {action,allowed};
  }
  return Object.freeze({
    choose:value=>{if(views.includes(value))view=value;},
    read:()=>structuredClone({view,finance,incident,incidentStep:incidentStep()}),
    post:()=>{if(finance.state!=='draft')return false;finance.state='posted';finance.events.push('posted');return true;},
    voidEntry:reason=>{if(finance.state!=='posted'||!Object.hasOwn(reasons,reason))return false;finance.state='void';finance.reason=reasons[reason];finance.events.push('void');return true;},
    actor:value=>{if(['operator','reviewer'].includes(value))incident.actor=value;},
    advance:()=>{
      const {action,allowed}=incidentStep();if(!allowed)return false;
      if(action==='resolve')incident.resolvedBy=incident.actor;
      if(action==='reopen')incident.resolvedBy=null;
      incident.state=next[action];incident.events.push({action,actor:incident.actor});return true;
    },
    reset:()=>{if(view==='finance')finance=blankFinance();else incident=blankIncident();},
    financeCsv:()=>['context,description,status,amount_mad,posted_total_mad','fictional,Example materials expense,'+finance.state+','+(finance.amount/100).toFixed(2)+','+(finance.state==='posted'?finance.amount/100:0).toFixed(2)].join('\r\n')+'\r\n'
  });
})();
const labFinanceReason=[['duplicate_example','Duplicate fictional entry'],['training_correction','Training correction']];
const labIncidentActions={record:'Record incident',triage:'Start triage',contain:'Mark contained',resolve:'Mark resolved',close:'Review and close',reopen:'Reopen incident'};
const labActors={operator:'Example technical operator',reviewer:'Example independent reviewer'};
function operationsLabHTML(){
  const {view,finance,incident,incidentStep}=operationsLab.read();
  const toggle=(label,action,pressed)=>`<button type="button" class="btn secondary" aria-pressed="${pressed}" data-action="${e(action)}">${h(label)}</button>`;
  const switcher=`<div class="actions lab-options" aria-label="${h('Choose an operations exercise')}">${toggle('Finance practice','ops-lab-view:finance',view==='finance')}${toggle('Incident practice','ops-lab-view:incidents',view==='incidents')}</div>`;
  const financeHTML=()=>{
    const action=finance.state==='draft'?btn('Post example entry','ops-lab-post','primary'):
      finance.state==='posted'?`<div class="actions"><label>${h('Reason')} <select id="practice-void-reason">${labFinanceReason.map(([id,label])=>`<option value="${e(id)}">${h(label)}</option>`).join('')}</select></label>${btn('Void example entry','ops-lab-void','danger')}</div>`:'';
    return `<div class="grid"><section class="panel" id="ops-lab-outcome" tabindex="-1"><h2>${h('Example materials expense')}</h2>${detailFields([['Status',t(finance.state)],['Amount (MAD)',opsUI.money(finance.amount)],['Example posted total',opsUI.money(finance.state==='posted'?finance.amount:0)],['Reason',finance.reason?t(finance.reason):null]])}${action}</section><section class="panel"><h2>${h('Practice history')}</h2>${table(['Step','Status'],finance.events.map((state,index)=>[e(number(index+1)),pill(state)]))}${btn('Download sample CSV','ops-lab-csv')}</section></div>`;
  };
  const incidentHTML=()=>{
    const {action,allowed}=incidentStep;
    const blocker=action==='close'?'Switch to the independent reviewer to close this sample.':'Switch to the role authorized for this practice step.';
    return `<div class="grid"><section class="panel" id="ops-lab-outcome" tabindex="-1"><h2>${h('Example recovery incident')}</h2><p class="sub">${h('Practice role')}</p><div class="actions lab-options">${Object.entries(labActors).map(([key,label])=>toggle(label,`ops-lab-actor:${key}`,incident.actor===key)).join('')}</div>${detailFields([['Status',t(incident.state)],['Current role',t(labActors[incident.actor])]])}${!allowed?`<p class="notice" role="status">${h(blocker)}</p>`:''}${btn(labIncidentActions[action],'ops-lab-advance','primary',allowed?'':'disabled')}</section><section class="panel"><h2>${h('Practice history')}</h2>${table(['Step','Action','Role'],incident.events.map((entry,index)=>[e(number(index+1)),h(labIncidentActions[entry.action]),h(labActors[entry.actor])]))}</section></div>`;
  };
  return heading('Operations practice','Try finance and incident controls with fictional records.')+`<p class="notice">${h('Changes in this practice tab are temporary. Nothing is published or saved to GitHub.')}</p>${switcher}${view==='finance'?financeHTML():incidentHTML()}<div class="actions">${btn('Reset practice','ops-lab-reset')}</div>`;
}
