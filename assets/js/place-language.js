const STORAGE_KEY='spain2026_place_language_v1';
const VALID_MODES=new Set(['zh','original']);
let mode='zh';

try{
  const saved=localStorage.getItem(STORAGE_KEY);
  if(VALID_MODES.has(saved)) mode=saved;
}catch{}

function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function updateNode(node,{animate=true}={}){
  const next=mode==='original'?node.dataset.nameOriginal:node.dataset.nameZh;
  const alt=mode==='original'?node.dataset.nameZh:node.dataset.nameOriginal;
  if(!next) return;

  node.setAttribute('title',alt||'');
  node.setAttribute('aria-label',alt?(next+'；'+alt):next);
  if(node.textContent===next) return;

  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!animate||reduceMotion||!node.animate){
    node.textContent=next;
    return;
  }

  node.getAnimations().forEach(animation=>animation.cancel());
  const out=node.animate(
    [{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-4px)'}],
    {duration:90,easing:'ease-out',fill:'forwards'}
  );

  out.finished.then(()=>{
    node.textContent=next;
    node.getAnimations().forEach(animation=>animation.cancel());
    node.animate(
      [{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],
      {duration:130,easing:'cubic-bezier(.2,.8,.2,1)'}
    );
  }).catch(()=>{node.textContent=next;});
}

export function refreshPlaceLanguageNames(options={}){
  document.querySelectorAll('.poi-name-swap[data-name-zh][data-name-original]')
    .forEach(node=>updateNode(node,options));
}

function updateToggle(){
  const button=document.getElementById('placeLanguageToggle');
  if(!button) return;

  button.dataset.mode=mode;
  button.setAttribute('aria-label',mode==='zh'
    ?'景點名稱目前中文優先，點一下切換成官方原文'
    :'景點名稱目前官方原文優先，點一下切換成中文');
  button.setAttribute('aria-pressed',String(mode==='original'));

  button.querySelectorAll('[data-lang-choice]').forEach(node=>{
    const active=node.dataset.langChoice===mode;
    node.classList.toggle('active',active);
    node.setAttribute('aria-hidden',String(!active));
  });

  button.classList.toggle('original-mode',mode==='original');
}

export function setPlaceLanguageMode(next,{animate=true,persist=true}={}){
  if(!VALID_MODES.has(next)||next===mode){
    updateToggle();
    return mode;
  }

  mode=next;
  document.documentElement.dataset.placeLang=mode;
  if(persist){try{localStorage.setItem(STORAGE_KEY,mode);}catch{}}
  updateToggle();
  refreshPlaceLanguageNames({animate});
  document.dispatchEvent(new CustomEvent('spain:placelanguagechange',{detail:{mode}}));
  return mode;
}

export function getPlaceLanguageMode(){return mode;}

export function renderPlaceBilingual(place,{fallbackText=''}={}){
  if(!place?.displayName){
    return '<span class="poi-bilingual-single">'+escapeHtml(fallbackText||place?.name||'')+'</span>';
  }

  return '<span class="poi-bilingual" data-place-id="'+escapeHtml(place.id||'')+'">'
    +'<span class="poi-bilingual-name poi-bilingual-zh">'+escapeHtml(place.displayName)+'</span>'
    +'<span class="poi-bilingual-name poi-bilingual-original">'+escapeHtml(place.name)+'</span>'
    +'</span>';
}

export function renderPlaceName(place,{fallbackText=''}={}){
  if(!place?.displayName) return escapeHtml(fallbackText||place?.name||'');
  const current=mode==='original'?place.name:place.displayName;
  const alt=mode==='original'?place.displayName:place.name;
  return '<span class="poi-name-swap"'
    +' data-place-id="'+escapeHtml(place.id||'')+'"'
    +' data-name-zh="'+escapeHtml(place.displayName)+'"'
    +' data-name-original="'+escapeHtml(place.name)+'"'
    +' title="'+escapeHtml(alt)+'"'
    +' aria-label="'+escapeHtml(current+'；'+alt)+'">'
    +escapeHtml(current)+'</span>';
}

export function initPlaceLanguage(){
  document.documentElement.dataset.placeLang=mode;
  const button=document.getElementById('placeLanguageToggle');
  updateToggle();
  button?.addEventListener('click',()=>{
    button.classList.remove('is-switching');
    requestAnimationFrame(()=>{
      button.classList.add('is-switching');
      window.setTimeout(()=>button.classList.remove('is-switching'),260);
    });
    setPlaceLanguageMode(mode==='zh'?'original':'zh',{animate:true,persist:true});
  });
  return {getMode:getPlaceLanguageMode,setMode:setPlaceLanguageMode};
}
