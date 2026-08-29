const CITY_ORDER=['Barcelona','Sevilla','Granada','Madrid'];

const googleSearch=query=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function cityIndex(city){
  const index=CITY_ORDER.indexOf(city);
  return index>=0?index:0;
}

export function initHotels({hotels,places,itineraryController}){
  const root=document.getElementById('hotels');
  if(!root) return {setCity:()=>false,ensureCity:()=>null,getActiveCity:()=>null};

  const placeById=new Map(places.map(place=>[place.id,place]));
  const hotelByCity=new Map();

  hotels.forEach(hotel=>{
    const place=placeById.get(hotel.placeId);
    if(place&&CITY_ORDER.includes(place.city)){
      hotelByCity.set(place.city,{hotel,place});
    }
  });

  const initialCity=itineraryController?.getActiveCity?.();
  let activeCity=initialCity==='all'||CITY_ORDER.includes(initialCity)?initialCity:'Barcelona';
  let scrollFrame=0;

  function hotelCard(city){
    const entry=hotelByCity.get(city);
    if(!entry){
      return `<div class="hotel-page-empty">目前沒有 ${escapeHtml(city)} 的住宿資料。</div>`;
    }

    const {hotel,place}=entry;
    return `<article class="hotel hotel-featured">
      <div class="hotel-main">
        <div class="hotel-city-line">
          <span>STAY · ${escapeHtml(city)}</span>
          <small>${escapeHtml(place.dates||'')}</small>
        </div>
        <b>${escapeHtml(place.name)}</b>
        <p>${escapeHtml(place.address||'')}</p>
        <div class="hotel-room">${escapeHtml(hotel.room)}</div>
      </div>
      <a target="_blank" rel="noopener" href="${googleSearch(place.name+' '+place.city)}">⌖ Maps ↗</a>
    </article>`;
  }

  function renderPager(){
    root.classList.remove('all-mode');
    root.innerHTML=CITY_ORDER.map(city=>`<section class="hotel-page" data-hotel-page-city="${city}" aria-label="${city} 住宿">
      ${hotelCard(city)}
    </section>`).join('');
  }

  function renderAll(){
    root.classList.add('all-mode');
    root.innerHTML=`<div class="hotel-all-grid" aria-label="全部住宿">
      ${CITY_ORDER.map(city=>hotelCard(city)).join('')}
    </div>`;
    root.scrollLeft=0;
  }

  function renderState(){
    if(activeCity==='all') renderAll();
    else renderPager();
  }

  function setCity(city,{behavior='smooth',syncItinerary=false}={}){
    if(city!=='all'&&!CITY_ORDER.includes(city)) return false;

    const changed=activeCity!==city;
    const modeChanged=(activeCity==='all')!==(city==='all');
    activeCity=city;

    if(activeCity==='all'){
      if(modeChanged||!root.classList.contains('all-mode')) renderAll();
    }else{
      if(modeChanged||root.classList.contains('all-mode')||!root.querySelector('.hotel-page')){
        renderPager();
      }

      requestAnimationFrame(()=>{
        const left=cityIndex(activeCity)*root.clientWidth;
        root.scrollTo({left,top:0,behavior});
      });
    }

    if(syncItinerary&&changed){
      itineraryController?.setCity?.(activeCity,{behavior:'auto'});
    }

    return true;
  }

  function ensureCity(){
    const itineraryCity=itineraryController?.getActiveCity?.();
    const city=itineraryCity==='all'||CITY_ORDER.includes(itineraryCity)?itineraryCity:activeCity;
    setCity(city,{behavior:'auto'});
    return city;
  }

  root.addEventListener('scroll',()=>{
    if(root.classList.contains('all-mode')||scrollFrame) return;

    scrollFrame=requestAnimationFrame(()=>{
      scrollFrame=0;
      const width=root.clientWidth;
      if(width<=0) return;

      const index=Math.max(0,Math.min(CITY_ORDER.length-1,Math.round(root.scrollLeft/width)));
      const city=CITY_ORDER[index];
      if(city===activeCity) return;

      activeCity=city;
      itineraryController?.setCity?.(activeCity,{behavior:'auto'});
    });
  },{passive:true});

  document.addEventListener('spain:citychange',event=>{
    const city=event.detail?.city;
    if(city!=='all'&&!CITY_ORDER.includes(city)) return;
    if(city===activeCity) return;
    setCity(city,{behavior:'smooth',syncItinerary:false});
  });

  window.addEventListener('resize',()=>{
    setCity(activeCity,{behavior:'auto',syncItinerary:false});
  });

  renderState();
  requestAnimationFrame(()=>setCity(activeCity,{behavior:'auto'}));

  return {
    setCity:(city,options={})=>setCity(city,options),
    ensureCity,
    getActiveCity:()=>activeCity
  };
}
