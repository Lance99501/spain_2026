const googleSearch = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export function initTripMap({places,mapConfig}){
  if(!window.L) throw new Error('Leaflet is not available.');

  const map=L.map('tripMap',{zoomControl:true,scrollWheelZoom:true}).setView([39.8,-1.3],6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19, attribution:'&copy; OpenStreetMap contributors'
  }).addTo(map);

  const markerLayer=L.layerGroup().addTo(map);
  const routeLayer=L.layerGroup().addTo(map);
  const markerByPlace=new Map();
  const statusLabel={confirmed:'已確認',pending:'待確認',hotel:'住宿',flex:'彈性',transport:'交通'};
  const markerText={confirmed:'確',pending:'待',hotel:'宿',flex:'遊',transport:'移'};

  function makeIcon(status){
    return L.divIcon({
      className:'',
      html:`<div class="jp-marker m-${status}"><span>${markerText[status]||'•'}</span></div>`,
      iconSize:[30,30],iconAnchor:[10,28],popupAnchor:[5,-25]
    });
  }

  function popupHtml(p){
    return `<div class="popup-kicker">${p.city} · ${statusLabel[p.status]||''}</div>
      <div class="popup-title">${p.name}</div>
      <div class="popup-sub">${p.dates||''}${p.address?'<br>'+p.address:''}</div>
      <a class="popup-link" target="_blank" rel="noopener" href="${googleSearch(p.name+' '+p.city)}">↗ Google Maps</a>`;
  }

  places.forEach(p=>{
    const marker=L.marker([p.lat,p.lng],{
      icon:makeIcon(p.status),
      zIndexOffset:p.status==='hotel'?1000:(p.status==='confirmed'?500:0),
      riseOnHover:true
    }).bindPopup(popupHtml(p));
    markerByPlace.set(p.name,marker);
    markerLayer.addLayer(marker);
  });

  const center=mapConfig.cityCenter;
  const mainRoute=mapConfig.mainRouteCities.map(city=>center[city]);
  const sideRoutes=mapConfig.sideRouteCities.map(pair=>pair.map(city=>center[city]));

  function drawAllRoutes(){
    L.polyline(mainRoute,{color:'#789281',weight:3,opacity:.78}).addTo(routeLayer);
    sideRoutes.forEach(pair=>L.polyline(pair,{color:'#8e948e',weight:2,opacity:.65,dashArray:'6 7'}).addTo(routeLayer));
  }

  function fitPlaces(city='all'){
    const selected=city==='all'
      ? places
      : places.filter(p=>p.city===city || (city==='Barcelona'&&p.city==='Sitges'));

    markerLayer.clearLayers();
    selected.forEach(p=>{
      const marker=markerByPlace.get(p.name);
      if(marker) markerLayer.addLayer(marker);
    });

    routeLayer.clearLayers();
    if(city==='all') drawAllRoutes();

    const bounds=L.latLngBounds(selected.map(p=>[p.lat,p.lng]));
    if(bounds.isValid()) map.fitBounds(bounds.pad(city==='all'?.09:.18),{maxZoom:14});
    setTimeout(()=>map.invalidateSize(),80);
  }

  drawAllRoutes();
  fitPlaces('all');

  document.querySelectorAll('[data-mapcity]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-mapcity]').forEach(x=>x.classList.toggle('active',x===btn));
    fitPlaces(btn.dataset.mapcity);
  }));

  return {map,fitPlaces};
}
