export function initAppShell({itineraryController,hotelsController}={}){
  const nav=document.getElementById('appBottomNav');
  if(!nav) return;

  const buttons=[...nav.querySelectorAll('[data-nav-target]')];
  const targets={
    today:document.querySelector('.hero'),
    map:document.getElementById('mapSection'),
    trip:document.getElementById('citySwitchSection'),
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

  let manualTarget=null;
  let manualTimer=0;

  buttons.forEach(button=>button.addEventListener('click',()=>{
    const name=button.dataset.navTarget;
    const target=targets[name];
    if(!target) return;

    if(name==='trip') itineraryController?.ensureCity?.();
    if(name==='stay') hotelsController?.ensureCity?.();

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
