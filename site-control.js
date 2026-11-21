'use strict';
const siteControl=(()=>{
  const defaults={
    siteTitle:'AMAN – أمان',
    taglineAr:'الأمان حق، والمساندة مسؤولية مشتركة',
    taglineFr:'La sécurité est un droit, le soutien une responsabilité partagée',
    taglineEn:'Safety is a right, support is a shared responsibility',
    themeColor:'#4B176F',
    defaultTheme:'light',
    defaultLang:'ar',
    emergencyNumbers:'19 · 177 · 15 · 8350',
    sosEnabled:true,
    modules:{
      ai:true,
      voice:true,
      search:true,
      community:true,
      protect:true,
      partners:true,
      footer:true
    }
  };
  let state=structuredClone(defaults);
  function read(){return structuredClone(state);}
  function update(patch){
    if(patch.modules){state.modules={...state.modules,...patch.modules};delete patch.modules;}
    state={...state,...patch};
    return read();
  }
  function toggleModule(key){
    if(Object.hasOwn(state.modules,key))state.modules[key]=!state.modules[key];
    return read();
  }
  function reset(){state=structuredClone(defaults);return read();}
  return {read,update,toggleModule,reset};
})();

function siteControlHTML(){
  const s=siteControl.read();
  const moduleList=[
    ['ai','AI Assistant (app-ai.js)'],
    ['voice','Voice & Speech (app-voice.js)'],
    ['search','Search (search.js)'],
    ['community','Community (community.js)'],
    ['protect','Protection (protect.js)'],
    ['partners','Partners strip (#prt)'],
    ['footer','Footer (#ft)']
  ];
  return heading('Public site control','Manage the public AMAN website modules, branding, and emergency bar.')+
    `<p class="notice">${h('Changes here are temporary in this preview. Export JSON to apply them to your public site.')}</p>`+
    `<div class="grid">`+
      `<section class="panel"><h2>${h('Branding & defaults')}</h2>`+
        `<form data-form="site-control" class="form-grid">`+
          field('Site title','siteTitle',s.siteTitle,{required:true,max:80})+
          field('Theme color','themeColor',s.themeColor,{required:true,max:20})+
          field('Default theme','defaultTheme',s.defaultTheme,{items:[['light',t('Light')],['dark',t('Dark')]]})+
          field('Default language','defaultLang',s.defaultLang,{items:[['ar',t('Arabic')],['fr',t('French')],['en',t('English')]]})+
          field('Emergency numbers','emergencyNumbers',s.emergencyNumbers,{required:true,max:80,wide:true})+
          check('Enable SOS button','sosEnabled',s.sosEnabled)+
          submit('Apply preview')+
        `</form>`+
      `</section>`+
      `<section class="panel"><h2>${h('Public modules')}</h2>`+
        `<p class="sub">${h('Toggle which sections are active on the public index.html.')}</p>`+
        `<ul class="list">${moduleList.map(([key,label])=>`<li><span class="event">${h(label)}</span>${btn(s.modules[key]?'Enabled':'Disabled',`site-mod:${key}`,s.modules[key]?'primary':'secondary')}</li>`).join('')}</ul>`+
        `<hr class="divider"><div class="actions">${btn('Export config JSON','site-export','primary')}${btn('Reset defaults','site-reset')}</div>`+
      `</section>`+
    `</div>`;
}
