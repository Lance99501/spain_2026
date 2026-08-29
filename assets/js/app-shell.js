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

  buttons.forEach(button=>button.addEventListener('click',()=>{
    const name=button.dataset.navTarget;
    const target=targets[name];
    if(!target) return;

    if(name==='trip') itineraryController?.ensureCity?.();
    if(name==='stay') hotelsController?.ensureCity?.();

    setActive(name);
    target.scrollIntoView({behavior:'smooth',block:'start'});
  }));

  let frame=0;
  function updateActive(){
    frame=0;
    const marker=window.scrollY+window.innerHeight*.38;
    const ordered=['today','map','trip','stay'];
    let active='today';

    for(const name of ordered){
      const target=targets[name];
      if(target&&target.offsetTop<=marker) active=name;
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
