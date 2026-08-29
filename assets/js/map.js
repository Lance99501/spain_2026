import {renderPlaceBilingual} from './place-language.js';
const googleSearch=query=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const MAIN_CITY_GROUPS={
  Barcelona:['Barcelona','Sitges'],
  Sevilla:['Sevilla','Cordoba'],
  Granada:['Granada'],
  Madrid:['Madrid','Segovia']
};

function mainCity(city){
  if(city==='Cordoba') return 'Sevilla';
  if(city==='Segovia') return 'Madrid';
  if(city==='Sitges') return 'Barcelona';
  return city;
}

export function initTripMap({places,mapConfig}){
  const mapRoot=document.getElementById('tripMap');
  const mapStage=document.getElementById('mapStage');
  const mapSection=document.getElementById('mapSection');
  const guardOverlay=document.getElementById('mapInteractionGuard');
  const activateButton=document.getElementById('mapGuardActivate');
  const doneButton=document.getElementById('mapInteractionDone');

  if(!window.L){
    if(mapRoot){
      mapRoot.innerHTML='<div class="map-fallback">地圖目前無法載入；每日行程、住宿與已快取內容仍可使用。</div>';
    }
    if(guardOverlay) guardOverlay.hidden=true;
    return {
      map:null,
      fitPlaces:()=>{},
      setCity:()=>{},
      lockInteraction:()=>false,
      unlockInteraction:()=>false,
      isInteractionLocked:()=>true,
      guardEnabled:false
    };
  }

  const guardEnabled=(
    navigator.maxTouchPoints>0
    || window.matchMedia('(pointer: coarse)').matches
    || window.matchMedia('(hover: none)').matches
    || window.innerWidth<=1024
  );

  const map=L.map('tripMap',{
    zoomControl:true,
    dragging:!guardEnabled,
    touchZoom:!guardEnabled,
    doubleClickZoom:!guardEnabled,
    scrollWheelZoom:!guardEnabled,
    boxZoom:!guardEnabled,
    keyboard:!guardEnabled,
    tap:false
  }).setView([39.8,-1.3],6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'&copy; OpenStreetMap contributors'
  }).addTo(map);

  const markerLayer=L.layerGroup().addTo(map);
  const routeLayer=L.layerGroup().addTo(map);
  const markerByPlaceId=new Map();
  const statusLabel={confirmed:'已確認',pending:'待確認',hotel:'住宿',flex:'彈性',transport:'交通'};
  const markerText={confirmed:'確',pending:'待',hotel:'宿',flex:'遊',transport:'移'};

  const mapPlaces=places.filter(place=>
    place.mapVisible!==false
    &&Number.isFinite(place.lat)
    &&Number.isFinite(place.lng)
  );

  function makeIcon(status){
    return L.divIcon({
      className:'',
      html:`<div class="jp-marker m-${status}"><span>${markerText[status]||'•'}</span></div>`,
      iconSize:[30,30],
      iconAnchor:[10,28],
      popupAnchor:[5,-25]
    });
  }

  function popupHtml(place){
    return `<div class="popup-kicker">${place.city} · ${statusLabel[place.status]||''}</div>
      <div class="popup-title popup-title-bilingual">${renderPlaceBilingual(place)}</div>
      <div class="popup-sub">${place.dates||''}${place.address?'<br>'+place.address:''}</div>
      <a class="popup-link" target="_blank" rel="noopener" href="${googleSearch(place.name+' '+place.city)}">↗ Google Maps</a>`;
  }

  mapPlaces.forEach(place=>{
    const marker=L.marker([place.lat,place.lng],{
      icon:makeIcon(place.status),
      zIndexOffset:place.status==='hotel'?1000:(place.status==='confirmed'?500:0),
      riseOnHover:true
    }).bindPopup(()=>popupHtml(place));

    markerByPlaceId.set(place.id,marker);
    markerLayer.addLayer(marker);
  });

  const center=mapConfig.cityCenter;
  const mainRoute=mapConfig.mainRouteCities.map(city=>center[city]);
  const sideRoutes=mapConfig.sideRouteCities.map(pair=>pair.map(city=>center[city]));

  function drawAllRoutes(){
    L.polyline(mainRoute,{color:'#789281',weight:3,opacity:.78}).addTo(routeLayer);
    sideRoutes.forEach(pair=>{
      L.polyline(pair,{color:'#8e948e',weight:2,opacity:.65,dashArray:'6 7'}).addTo(routeLayer);
    });
  }

  const mapButtons=[...document.querySelectorAll('[data-mapcity]')];

  function setMapButtonByCity(city){
    const resolved=city==='all'?'all':mainCity(city);
    mapButtons.forEach(button=>{
      const selected=button.dataset.mapcity===resolved;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
  }

  function selectedPlaces(city){
    if(city==='all') return mapPlaces;
    const resolved=mainCity(city);
    const group=MAIN_CITY_GROUPS[resolved]||[resolved];
    return mapPlaces.filter(place=>group.includes(place.city));
  }

  function fitPlaces(city='all'){
    const resolved=city==='all'?'all':mainCity(city);
    const selected=selectedPlaces(resolved);

    markerLayer.clearLayers();
    selected.forEach(place=>{
      const marker=markerByPlaceId.get(place.id);
      if(marker) markerLayer.addLayer(marker);
    });

    routeLayer.clearLayers();
    if(resolved==='all') drawAllRoutes();

    const bounds=L.latLngBounds(selected.map(place=>[place.lat,place.lng]));
    if(bounds.isValid()){
      map.fitBounds(bounds.pad(resolved==='all'?.09:.16),{maxZoom:14,animate:false});
    }
    setMapButtonByCity(resolved);
    window.setTimeout(()=>map.invalidateSize(),80);
  }

  let interactionLocked=guardEnabled;

  const interactionHandlers=[
    map.dragging,
    map.touchZoom,
    map.doubleClickZoom,
    map.scrollWheelZoom,
    map.boxZoom,
    map.keyboard
  ].filter(Boolean);

  function syncInteractionUi(){
    if(!guardEnabled){
      if(guardOverlay) guardOverlay.hidden=true;
      if(doneButton) doneButton.hidden=true;
      mapRoot?.classList.remove('map-locked');
      return;
    }

    mapStage?.classList.toggle('map-stage-locked',interactionLocked);
    mapRoot?.classList.toggle('map-locked',interactionLocked);

    // Hard guarantee: while locked, Leaflet itself cannot receive pointer/touch input.
    if(mapRoot) mapRoot.style.pointerEvents=interactionLocked?'none':'auto';

    if(guardOverlay) guardOverlay.hidden=!interactionLocked;
    if(doneButton) doneButton.hidden=interactionLocked;
  }

  function setMapInteractionLocked(locked){
    if(!guardEnabled) return false;

    interactionLocked=Boolean(locked);
    interactionHandlers.forEach(handler=>{
      if(interactionLocked) handler.disable();
      else handler.enable();
    });

    if(interactionLocked) map.closePopup();
    syncInteractionUi();
    return interactionLocked;
  }

  activateButton?.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    setMapInteractionLocked(false);
    map.invalidateSize();
  });

  doneButton?.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    setMapInteractionLocked(true);
  });

  if(guardEnabled){
    setMapInteractionLocked(true);

    if(mapSection&&'IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{
        const entry=entries[0];
        if(!entry||interactionLocked) return;
        if(entry.intersectionRatio<0.35) setMapInteractionLocked(true);
      },{threshold:[0,.35,.6,1]});
      observer.observe(mapSection);
    }

    document.addEventListener('visibilitychange',()=>{
      if(document.hidden&&!interactionLocked) setMapInteractionLocked(true);
    });
  }else{
    syncInteractionUi();
  }

  drawAllRoutes();
  fitPlaces('all');

  mapButtons.forEach(button=>button.addEventListener('click',()=>{
    fitPlaces(button.dataset.mapcity);
  }));

  // Itinerary/Hotels are the shared city source of truth.
  // When either one settles on a city, map follows once with no feedback loop.
  document.addEventListener('spain:citychange',event=>{
    const city=event.detail?.city;
    if(city!=='all'&&!MAIN_CITY_GROUPS[mainCity(city)]) return;
    fitPlaces(city);
  });

  return {
    map,
    fitPlaces,
    setCity:city=>fitPlaces(city),
    lockInteraction:()=>setMapInteractionLocked(true),
    unlockInteraction:()=>setMapInteractionLocked(false),
    isInteractionLocked:()=>interactionLocked,
    guardEnabled
  };
}
