const VALID_VIEWS=new Set(['today','map','trip','stay']);
const VALID_CITIES=new Set(['Barcelona','Sevilla','Granada','Madrid']);

function normalizedRoute(){
  const params=new URLSearchParams(window.location.search);
  const view=VALID_VIEWS.has(params.get('view'))?params.get('view'):'today';
  const city=VALID_CITIES.has(params.get('city'))?params.get('city'):null;
  return {view,city,params};
}

export function initAppRouter(){
  const views=[...document.querySelectorAll('[data-app-view]')];
  const navButtons=[...document.querySelectorAll('[data-nav-view]')];
  const listeners=new Set();
  const scrollByView=new Map();
  let currentView=null;

  function notify(route){
    listeners.forEach(listener=>listener(route));
    document.dispatchEvent(new CustomEvent('app:routechange',{detail:route}));
  }

  function apply({restoreScroll=true}={}){
    const route=normalizedRoute();

    if(currentView&&currentView!==route.view){
      scrollByView.set(currentView,window.scrollY);
    }

    views.forEach(view=>{
      const active=view.dataset.appView===route.view;
      view.hidden=!active;
      view.classList.toggle('active',active);
      view.setAttribute('aria-hidden',String(!active));
    });

    navButtons.forEach(button=>{
      const active=button.dataset.navView===route.view;
      button.classList.toggle('active',active);
      button.setAttribute('aria-current',active?'page':'false');
      button.setAttribute('aria-pressed',String(active));
    });

    document.body.dataset.appView=route.view;
    const changed=currentView!==route.view;
    currentView=route.view;

    if(changed){
      requestAnimationFrame(()=>{
        const y=restoreScroll?(scrollByView.get(route.view)||0):0;
        window.scrollTo({top:y,left:0,behavior:'auto'});
      });
    }

    notify(route);
    return route;
  }

  function updateUrl(view,{city=null,replace=false,restoreScroll=true}={}){
    const route=normalizedRoute();
    const params=route.params;
    params.set('view',VALID_VIEWS.has(view)?view:'today');

    if(city&&VALID_CITIES.has(city)) params.set('city',city);

    const query=params.toString();
    const url=`${window.location.pathname}${query?`?${query}`:''}${window.location.hash||''}`;
    history[replace?'replaceState':'pushState']({},'',url);
    return apply({restoreScroll});
  }

  function go(view,options={}){
    return updateUrl(view,options);
  }

  function setCity(city,{replace=false}={}){
    if(!VALID_CITIES.has(city)) return normalizedRoute();
    return updateUrl('trip',{city,replace,restoreScroll:true});
  }

  function subscribe(listener,{immediate=false}={}){
    listeners.add(listener);
    if(immediate) listener(normalizedRoute());
    return ()=>listeners.delete(listener);
  }

  navButtons.forEach(button=>button.addEventListener('click',()=>{
    const view=button.dataset.navView;
    if(!VALID_VIEWS.has(view)||view===currentView) return;
    go(view);
  }));

  window.addEventListener('popstate',()=>apply());

  const initial=normalizedRoute();
  if(!new URLSearchParams(window.location.search).has('view')){
    updateUrl(initial.view,{city:initial.city,replace:true,restoreScroll:false});
  }else{
    apply({restoreScroll:false});
  }

  return {
    go,
    setCity,
    subscribe,
    getRoute:()=>normalizedRoute(),
    refresh:()=>apply()
  };
}
