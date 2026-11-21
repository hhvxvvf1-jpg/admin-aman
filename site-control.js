'use strict';
const siteControl=(()=>{
  const STORAGE_KEY='aman-site-control';
  const defaults={
    siteTitle:'AMAN – أمان',
    taglineAr:'الأمان حق، والمساندة مسؤولية مشتركة',
    taglineFr:'La sécurité est un droit, le soutien une responsabilité partagée',
    taglineEn:'Safety is a right, support is a shared responsibility',
    themeColor:'#4B176F',
    defaultTheme:'light',
    defaultLang:'ar',
    metaDescription:'AMAN – أمان: منصة مغربية للوقاية من العنف ضد النساء والفتيات.',
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
  function load(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(raw){
        const parsed=JSON.parse(raw);
        return {...structuredClone(defaults),...parsed,modules:{...defaults.modules,...(parsed.modules||{})}};
      }
    }catch{}
    return structuredClone(defaults);
  }
  let state=load();
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}}
  function read(){return structuredClone(state);}
  function update(patch){
    if(patch.modules){state.modules={...state.modules,...patch.modules};delete patch.modules;}
    state={...state,...patch};
    save();
    return read();
  }
  function toggleModule(key){
    if(Object.hasOwn(state.modules,key)){state.modules[key]=!state.modules[key];save();}
    return read();
  }
  function reset(){state=structuredClone(defaults);save();return read();}
  function patchHTML(html){
    const s=state;
    const dir=s.defaultLang==='ar'?'rtl':'ltr';
    let out=html
      .replace(/<html lang="[^"]*" dir="[^"]*">/,`<html lang="${e(s.defaultLang)}" dir="${dir}">`)
      .replace(/<title>[^<]*<\/title>/,`<title>${e(s.siteTitle)}</title>`)
      .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${e(s.metaDescription)}">`)
      .replace(/<meta name="theme-color" content="[^"]*">/,`<meta name="theme-color" content="${e(s.themeColor)}">`)
      .replace(/19 · 177 · 15 · 8350/g,e(s.emergencyNumbers));
    if(!s.sosEnabled)out=out.replace(/<button type="button" class="btn-sos"[^>]*>[\s\S]*?<\/button>/,'');
    if(!s.modules.ai)out=out.replace(/<script src="app-ai\.js"><\/script>/,'');
    if(!s.modules.voice)out=out.replace(/<script src="app-speech\.js"><\/script>/,'').replace(/<script src="app-voice\.js"><\/script>/,'');
    if(!s.modules.search)out=out.replace(/<link rel="stylesheet" href="search\.css">\s*<script src="search\.js"><\/script>/,'');
    if(!s.modules.community)out=out.replace(/<link rel="stylesheet" href="community\.css">\s*<script src="community\.js"><\/script>/,'');
    if(!s.modules.protect)out=out.replace(/<link rel="stylesheet" href="protect\.css">[\s\S]*?<script src="protect\.js"><\/script>/,'');
    if(!s.modules.partners)out=out.replace(/<section id="prt"[\s\S]*?<\/section>/,'');
    if(!s.modules.footer)out=out.replace(/<footer>[\s\S]*?<\/footer>/,'');
    return out;
  }
  return {read,update,toggleModule,reset,applyPreset,patchHTML};
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
    `<p class="notice">${h('Settings are saved in your browser. Download the patched index.html or JSON config to deploy to your public site.')}</p>`+
    `<div class="grid">`+
      `<section class="panel"><h2>${h('Branding & defaults')}</h2>`+
        `<form data-form="site-control" class="form-grid">`+
          field('Site title','siteTitle',s.siteTitle,{required:true,max:80})+
          field('Theme color','themeColor',s.themeColor,{required:true,max:20})+
          field('Default theme','defaultTheme',s.defaultTheme,{items:[['light',t('Light')],['dark',t('Dark')]]})+
          field('Default language','defaultLang',s.defaultLang,{items:[['ar',t('Arabic')],['fr',t('French')],['en',t('English')]]})+
          field('Meta description','metaDescription',s.metaDescription,{required:true,max:220,wide:true,area:true})+
          field('Emergency numbers','emergencyNumbers',s.emergencyNumbers,{required:true,max:80,wide:true})+
          check('Enable SOS button','sosEnabled',s.sosEnabled)+
          submit('Apply preview')+
        `</form>`+
      `</section>`+
      `<section class="panel"><h2>${h('Public modules')}</h2>`+
        `<p class="sub">${h('Toggle which sections are active on the public index.html.')}</p>`+
        `<ul class="list">${moduleList.map(([key,label])=>`<li><span class="event">${h(label)}</span>${btn(s.modules[key]?'Enabled':'Disabled',`site-mod:${key}`,s.modules[key]?'primary':'secondary')}</li>`).join('')}</ul>`+
        `<hr class="divider"><div class="actions">${btn('Standard mode','site-preset:standard')}${btn('Emergency mode','site-preset:emergency')}${btn('French mode','site-preset:french')}</div>`+
        `<hr class="divider"><div class="actions">${btn('Download patched index.html','site-download-html','primary')}${btn('Export config JSON','site-export')}<label class="btn secondary">${h('Import config JSON')}<input type="file" accept="application/json,.json" data-action="site-import" hidden></label>${btn('Reset defaults','site-reset')}</div>`+
      `</section>`+
    `</div>`+
    `<section class="panel"><h2>${h('Live public site status')}</h2>`+
      detailFields([
        ['Site title',s.siteTitle],
        ['Default language',s.defaultLang.toUpperCase()],
        ['Default theme',t(s.defaultTheme==='dark'?'Dark':'Light')],
        ['Theme color',s.themeColor],
        ['Emergency numbers',s.emergencyNumbers],
        ['SOS button',t(s.sosEnabled?'Enabled':'Disabled')],
        ['Active modules',`${Object.values(s.modules).filter(Boolean).length} / ${Object.keys(s.modules).length}`]
      ])+
    `</section>`;
}
