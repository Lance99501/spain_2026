const googleSearch=query=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export function initTripMap({places,mapConfig}){
  if(!window.L){
    const mapRoot=document.getElementById('tripMap');
    if(mapRoot){
      mapRoot.innerHTML='<div class="map-fallback">地圖目前無法載入；每日行程、住宿與已快取內容仍可使用。</div>';
    }
    return {map:null,fitPlaces:()=>{}};
  }

  const map=L.map('tripMap',{zoomControl:true,scrollWheelZoom:true}).setView([39.8,-1.3],6);
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
    && Number.isFinite(place.lat)
    && Number.isFinite(place.lng)
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
      <div class="popup-title">${place.name}</div>
      <div class="popup-sub">${place.dates||''}${place.address?'<br>'+place.address:''}</div>
      <a class="popup-link" target="_blank" rel="noopener" href="${googleSearch(place.name+' '+place.city)}">↗ Google Maps</a>`;
  }

  mapPlaces.forEach(place=>{
    const marker=L.marker([place.lat,place.lng],{
      icon:makeIcon(place.status),
      zIndexOffset:place.status==='hotel'?1000:(place.status==='confirmed'?500:0),
      riseOnHover:true
    }).bindPopup(popupHtml(place));

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

  function fitPlaces(city='all'){
    const selected=city==='all'
      ? mapPlaces
      : mapPlaces.filter(place=>place.city===city||(city==='Barcelona'&&place.city==='Sitges'));

    markerLayer.clearLayers();
    selected.forEach(place=>{
      const marker=markerByPlaceId.get(place.id);
      if(marker) markerLayer.addLayer(marker);
    });

    routeLayer.clearLayers();
    if(city==='all') drawAllRoutes();

    const bounds=L.latLngBounds(selected.map(place=>[place.lat,place.lng]));
    if(bounds.isValid()) map.fitBounds(bounds.pad(city==='all'?.09:.18),{maxZoom:14});
    setTimeout(()=>map.invalidateSize(),80);
  }

  drawAllRoutes();
  fitPlaces('all');

  const mapButtons=[...document.querySelectorAll('[data-mapcity]')];
  function setMapButtonState(activeButton){
    mapButtons.forEach(button=>{
      const selected=button===activeButton;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
  }

  const initialButton=mapButtons.find(button=>button.dataset.mapcity==='all');
  if(initialButton) setMapButtonState(initialButton);

  mapButtons.forEach(btn=>btn.addEventListener('click',()=>{
    setMapButtonState(btn);
    fitPlaces(btn.dataset.mapcity);
  }));

  return {map,fitPlaces};
}
