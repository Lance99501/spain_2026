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
  const tabs=[...document.querySelectorAll('.hotel-city-tab[data-hotel-city]')];
  if(!root) return {setCity:()=>false,ensureCity:()=>null,getActiveCity:()=>null};

  const placeById=new Map(places.map(place=>[place.id,place]));
  const hotelByCity=new Map();

  hotels.forEach(hotel=>{
    const place=placeById.get(hotel.placeId);
    if(place&&CITY_ORDER.includes(place.city)){
      hotelByCity.set(place.city,{hotel,place});
    }
  });

  let activeCity=CITY_ORDER.includes(itineraryController?.getActiveCity?.())
    ? itineraryController.getActiveCity()
    :'Barcelona';
  let scrollFrame=0;

  function renderPage(city){
    const entry=hotelByCity.get(city);
    if(!entry){
      return `<section class="hotel-page" data-hotel-page-city="${city}" aria-label="${city} 住宿">
        <div class="hotel-page-empty">目前沒有 ${city} 的住宿資料。</div>
      </section>`;
    }

    const {hotel,place}=entry;
    return `<section class="hotel-page" data-hotel-page-city="${city}" aria-label="${city} 住宿">
      <article class="hotel hotel-featured">
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
      </article>
    </section>`;
  }

  root.innerHTML=CITY_ORDER.map(renderPage).join('');

  function syncTabs(city){
    tabs.forEach(button=>{
      const selected=button.dataset.hotelCity===city;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
  }

  function setCity(city,{behavior='smooth',syncItinerary=false}={}){
    if(!CITY_ORDER.includes(city)) return false;

    const changed=activeCity!==city;
    activeCity=city;
    syncTabs(activeCity);

    const left=cityIndex(activeCity)*root.clientWidth;
    root.scrollTo({left,top:0,behavior});

    if(syncItinerary&&changed){
      itineraryController?.setCity?.(activeCity);
    }

    return true;
  }

  function ensureCity(){
    const itineraryCity=itineraryController?.getActiveCity?.();
    const city=CITY_ORDER.includes(itineraryCity)?itineraryCity:activeCity;
    setCity(city,{behavior:'auto'});
    return city;
  }

  tabs.forEach(button=>button.addEventListener('click',()=>{
    setCity(button.dataset.hotelCity,{behavior:'smooth',syncItinerary:true});
  }));

  root.addEventListener('scroll',()=>{
    if(scrollFrame) return;

    scrollFrame=requestAnimationFrame(()=>{
      scrollFrame=0;
      const width=root.clientWidth;
      if(width<=0) return;

      const index=Math.max(0,Math.min(CITY_ORDER.length-1,Math.round(root.scrollLeft/width)));
      const city=CITY_ORDER[index];
      if(city===activeCity) return;

      activeCity=city;
      syncTabs(activeCity);
      itineraryController?.setCity?.(activeCity);
    });
  },{passive:true});

  document.addEventListener('spain:citychange',event=>{
    const city=event.detail?.city;
    if(!CITY_ORDER.includes(city)||city===activeCity) return;
    setCity(city,{behavior:'smooth',syncItinerary:false});
  });

  window.addEventListener('resize',()=>{
    setCity(activeCity,{behavior:'auto',syncItinerary:false});
  });

  requestAnimationFrame(()=>setCity(activeCity,{behavior:'auto'}));

  return {
    setCity:(city,options={})=>setCity(city,options),
    ensureCity,
    getActiveCity:()=>activeCity
  };
}
