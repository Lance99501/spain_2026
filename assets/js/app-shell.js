export function initAppShell({itineraryController,hotelsController,mapController}={}){
  const nav=document.getElementById('appBottomNav');
  if(!nav) return;

  const todaySection=document.getElementById('todaySection');
  const quickSearchBtn=document.getElementById('quickSearchBtn');
  const search=document.getElementById('search');
  const buttons=[...nav.querySelectorAll('[data-nav-target]')];
  const targets={
    today:todaySection&&!todaySection.hidden?todaySection:document.querySelector('.hero'),
    map:document.getElementById('mapSection'),
    trip:document.getElementById('itinerary'),
    stay:document.getElementById('hotelsSection')
  };

  function setActive(name){
    buttons.forEach(button=>{
      const active=button.dataset.navTarget===name;
      button.classList.toggle('active',active);
      button.setAttribute('aria-current',active?'page':'false');
      button.setAttribute('aria-pressed',String(active));
    });
  }

  const panel=document.getElementById('quickSearchPanel');
  const query=document.getElementById('quickSearchInput');
  const city=document.getElementById('quickSearchCity');
  const category=document.getElementById('quickSearchCategory');
  const chips=[...document.querySelectorAll('[data-keyword]')];
  function syncKeywords(){
    chips.forEach(button=>button.setAttribute('aria-pressed',String(query.value===button.dataset.keyword)));
  }
  quickSearchBtn?.addEventListener('click',()=>{
    const state=itineraryController?.getSearchState?.();
    query.value=search?.value||'';
    city.value=state?.city||'all';
    category.value=state?.category||'all';
    syncKeywords();
    panel.showModal();
    quickSearchBtn.setAttribute('aria-expanded','true');
    query.focus();
  });
  panel?.addEventListener('close',()=>{
    quickSearchBtn.setAttribute('aria-expanded','false');
    quickSearchBtn.focus({preventScroll:true});
  });
  document.getElementById('quickSearchClose')?.addEventListener('click',()=>panel.close());
  panel?.addEventListener('click',event=>{
    const box=panel.getBoundingClientRect();
    if(event.target===panel&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)) panel.close();
  });
  chips.forEach(button=>button.addEventListener('click',()=>{
    query.value=query.value===button.dataset.keyword?'':button.dataset.keyword;
    syncKeywords();
  }));
  query?.addEventListener('input',syncKeywords);
  document.getElementById('quickSearchReset')?.addEventListener('click',()=>{
    query.value='';city.value='all';category.value='all';syncKeywords();
  });
  document.getElementById('quickSearchForm')?.addEventListener('submit',event=>{
    event.preventDefault();
    itineraryController?.applySearch?.({term:query.value,city:city.value,category:category.value});
    panel.close();
    targets.trip?.scrollIntoView({behavior:'smooth',block:'start'});
  });

  let manualTarget=null;
  let manualTimer=0;

  buttons.forEach(button=>button.addEventListener('click',()=>{
    const name=button.dataset.navTarget;
    const target=targets[name];
    if(!target) return;

    if(name==='trip') itineraryController?.ensureCity?.();
    if(name==='stay') hotelsController?.ensureCity?.();
    if(name!=='map') mapController?.lockInteraction?.();

    manualTarget=name;
    window.clearTimeout(manualTimer);
    manualTimer=window.setTimeout(()=>{manualTarget=null;requestUpdate();},1100);

    setActive(name);
    target.scrollIntoView({behavior:'smooth',block:'start'});
  }));

  let frame=0;
  function updateActive(){
    frame=0;

    if(manualTarget){
      setActive(manualTarget);
      return;
    }

    const marker=window.scrollY+window.innerHeight*.38;
    const ordered=['today','map','trip','stay'];
    let active='today';

    for(const name of ordered){
      const target=targets[name];
      if(target&&target.offsetTop<=marker) active=name;
    }

    const stayRect=targets.stay?.getBoundingClientRect();
    const nearPageBottom=window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-80;
    if(stayRect&&stayRect.top<=window.innerHeight*.68){
      active='stay';
    }else if(nearPageBottom){
      active='stay';
    }

    setActive(active);
  }

  function requestUpdate(){
    if(frame) return;
    frame=requestAnimationFrame(updateActive);
  }

  window.addEventListener('scroll',requestUpdate,{passive:true});
  window.addEventListener('resize',requestUpdate);
  updateActive();
}
