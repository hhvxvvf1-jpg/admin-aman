'use strict';
// Only built-in fictional content. No staff identity, form input, persistence or network calls.
const revisionLab=(()=>{
  const current=Object.freeze({revision:3,age:'13–15',audience:'girls',label:'Current sample draft',image:false,
    ar:['التعرّف على الألوان','مثال جديد لبطاقة تعليمية عن الألوان.'],fr:['Découvrir les couleurs','Nouvel exemple de fiche éducative sur les couleurs.'],en:['Discovering colours','New example of an educational card about colours.']});
  const matching=Object.freeze({revision:2,age:'13–15',audience:'girls',label:'Previous sample',image:false,
    ar:['ألوان وأشكال','مثال سابق عن الألوان والأشكال.'],fr:['Couleurs et formes','Un exemple précédent sur les couleurs et les formes.'],en:['Colours and shapes','An earlier example about colours and shapes.']});
  const restricted=Object.freeze({revision:1,age:'10–17',audience:'girls',label:'Previous sample',image:false,
    ar:['بطاقة تعريفية','مثال سابق بنطاق عمري مختلف.'],fr:['Fiche de présentation','Un exemple précédent avec une autre tranche d’âge.'],en:['Introduction card','An earlier example with a different age range.']});
  const imageDraft={revision:3,age:null,audience:'general',image:false,ar:['المورد بدون صورة','مسودة تجريبية لا تحتوي على صورة.'],fr:['Ressource sans illustration','Brouillon fictif sans image.'],en:['Resource without artwork','Fictional draft without an illustration.']};
  const imageSaved={revision:2,age:null,audience:'general',image:true,ar:['مورد مصوّر','نسخة تجريبية سابقة مع صورة.'],fr:['Ressource illustrée','Ancienne version fictive avec une illustration.'],en:['Illustrated resource','Earlier fictional version with an illustration.']};
  const scenarios=Object.freeze({age:{draft:current,originals:[matching,restricted]},image:{draft:imageDraft,originals:[imageSaved]}});
  let scenario='age',selected=2,draft=current;
  const get=()=>scenarios[scenario].originals.find(item=>item.revision===selected);
  const allowed=()=>get().age===draft.age&&get().audience===draft.audience;
  return Object.freeze({
    state:()=>structuredClone({draft,selected:get(),originals:scenarios[scenario].originals,scenario,allowed:allowed()}),
    changeScenario:(key)=>{if(Object.hasOwn(scenarios,key)){scenario=key;selected=2;draft=scenarios[key].draft;}},
    select:revision=>{const value=Number(revision);if(scenarios[scenario].originals.some(item=>item.revision===value))selected=value;},
    restore:()=>{if(!allowed()||draft.restoredFrom===selected)return false;draft={...get(),revision:draft.revision+1,label:'Current sample draft',restoredFrom:selected};return true;},
    reset:()=>{selected=2;draft=scenarios[scenario].draft;}
  });
})();
function revisionLabHTML(){
  const {draft,selected,originals,scenario,allowed}=revisionLab.state();
  const version=item=>`${h('Version')} ${e(number(item.revision))}`;
  const card=(item,headingLabel,id)=>`<section class="panel"${id?` id="${id}" tabindex="-1"`:''}><p class="kicker">${version(item)}</p><h2>${h(headingLabel)}</h2><p class="sub">${item.age?`${h('Age range')}: ${e(item.age)}`:h('general')}</p><h3>${e(item[lang][0])}</h3><p>${e(item[lang][1])}</p>${item.image?`<img class="sample-illustration" src="./pages-sample-illustration.png" alt="${h('Sample illustration')}">`:''}${item.restoredFrom?`<p class="notice">${h('Restored from version')} ${e(number(item.restoredFrom))} · ${h('draft')}</p>`:''}</section>`;
  return heading('Revision practice','Try a CMS restore with fictional data.')+`<p class="notice">${h('Changes in this practice tab are temporary. Nothing is published or saved to GitHub.')}</p><div class="actions lab-options">${[['age','Age-range exercise'],['image','Illustration exercise']].map(([key,label])=>`<button class="btn secondary" type="button" aria-pressed="${key===scenario}" data-action="lab-scenario:${key}">${h(label)}</button>`).join('')}</div><div class="actions lab-options" aria-label="${h('Saved examples')}">${originals.map(item=>`<button class="btn secondary" type="button" aria-pressed="${item.revision===selected.revision}" data-action="lab-select:${e(item.revision)}">${version(item)}</button>`).join('')}</div><div class="grid">${card(draft,'Current sample draft','practice-draft')}${card(selected,'Selected example')}</div>${!allowed?`<p class="notice" role="status">${h('Restore is blocked when the age range is different.')}</p>`:''}<div class="actions">${btn('Restore sample as draft','lab-restore','primary',!allowed||draft.restoredFrom===selected.revision?'disabled':'')}${btn('Reset practice','lab-reset')}</div>`;
}
