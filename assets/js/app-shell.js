export function initAppShell({itineraryController,hotelsController,mapController}={}){
  const nav=document.getElementById('appBottomNav');
  if(!nav) return;

  const todaySection=document.getElementById('todaySection');
  const buttons=[...nav.querySelectorAll('[data-nav-target]')];
  const targets={
    today:todaySection&&!todaySection.hidden?todaySection:document.querySelector('.hero'),
    map:document.getElementById('mapSection'),
    trip:document.getElementById('itinerary'),
    stay:document.getElementById('hotelsSection')
  };

  const todayButton=buttons.find(button=>button.dataset.navTarget==='today');
  if(todayButton) todayButton.querySelector('b').textContent=todaySection&&!todaySection.hidden?'今日':'首頁';

  function setActive(name){
    buttons.forEach(button=>{
      const active=button.dataset.navTarget===name;
      button.classList.toggle('active',active);
      button.setAttribute('aria-current',active?'location':'false');
      button.setAttribute('aria-pressed',String(active));
    });
  }

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

    const dock=document.getElementById('cityDock');
    const topInset=dock?.classList.contains('show')?dock.getBoundingClientRect().bottom:0;
    const marker=window.scrollY+Math.max(24,topInset+24);
    const ordered=['today','trip','stay','map'];
    let active='today';

    for(const name of ordered){
      const target=targets[name];
      if(target&&target.offsetTop<=marker) active=name;
    }

    const nearPageBottom=window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-80;
    if(nearPageBottom) active='map';

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
