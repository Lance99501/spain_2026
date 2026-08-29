export function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function ticketButton(ticket){
  if(!ticket) return '';
  return `<button type="button" class="ticket-icon" data-ticket-id="${escapeHtml(ticket.id)}" title="開啟票券 QR" aria-label="開啟 ${escapeHtml(ticket.label)} 票券 QR">🎫</button>`;
}

export function renderSegments(segments,item,placeById,ticketById,{allowTicket=true}={}){
  const ticket=item.ticketId?ticketById.get(item.ticketId):null;
  let anchoredTicketRendered=false;

  const html=segments.map(segment=>{
    const place=segment.placeId?placeById.get(segment.placeId):null;
    const crown=place?.unesco
      ? '<span class="unesco-crown" title="UNESCO 世界文化遺產" aria-label="UNESCO 世界文化遺產">♛</span>'
      : '';

    const anchoredTicket=allowTicket
      &&ticket
      &&item.ticketAnchorPlaceId
      &&segment.placeId===item.ticketAnchorPlaceId;

    if(anchoredTicket) anchoredTicketRendered=true;

    const inner=escapeHtml(segment.text)+crown+(anchoredTicket?ticketButton(ticket):'');
    return place?.unesco?`<span class="poi-annotated">${inner}</span>`:inner;
  }).join('');

  if(allowTicket&&ticket&&!item.ticketAnchorPlaceId&&!anchoredTicketRendered){
    return html+ticketButton(ticket);
  }
  return html;
}

function dateInTimeZone(timeZone){
  const formatter=new Intl.DateTimeFormat('en-US',{
    timeZone,
    year:'numeric',
    month:'2-digit',
    day:'2-digit'
  });
  const parts=Object.fromEntries(
    formatter.formatToParts(new Date())
      .filter(part=>part.type!=='literal')
      .map(part=>[part.type,part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function initItinerary({
  itinerary,
  places,
  tickets,
  ticketController,
  config,
  navigation
}){
  const CITY_ORDER=['Barcelona','Sevilla','Granada','Madrid'];
  const pager=document.getElementById('cityPager');
  const track=document.getElementById('cityPagerTrack');
  const search=document.getElementById('search');
  const empty=document.getElementById('empty');
  const expandAll=document.getElementById('expandAll');
  const placeById=new Map(places.map(place=>[place.id,place]));
  const ticketById=new Map(tickets.map(ticket=>[ticket.id,ticket]));

  let activeFilter='all';
  let expandState=false;
  let activeIndex=0;
  let drag=null;
  let resizeFrame=0;

  const today=dateInTimeZone(config?.timeZone||'Europe/Madrid');
  const todayDay=itinerary.find(day=>day.date===today);
  const fallbackCity=CITY_ORDER.includes(todayDay?.city)?todayDay.city:'Barcelona';

  function routeCity(){
    const city=navigation?.getRoute()?.city;
    return CITY_ORDER.includes(city)?city:fallbackCity;
  }

  function cityForIndex(index){
    return CITY_ORDER[Math.max(0,Math.min(CITY_ORDER.length-1,index))];
  }

  function indexForCity(city){
    const index=CITY_ORDER.indexOf(city);
    return index>=0?index:0;
  }

  function searchableText(day){
    return [
      day.date,
      day.dateLabel,
      day.city,
      day.title,
      day.sub,
      ...day.items.flatMap(item=>[
        item.time,
        ...item.segments.map(x=>x.text),
        ...(item.noteSegments||[]).map(x=>x.text)
      ]),
      ...day.tags.map(x=>x.text),
      day.note||''
    ].join(' ').toLowerCase();
  }

  function renderDay(day){
    const bodyId=`day-body-${day.id}`;
    return `<article class="day${expandState?' open':''}" data-city="${escapeHtml(day.city)}" data-day-id="${escapeHtml(day.id)}">
      <div class="day-main-wrap">
        <button type="button" class="day-main" aria-expanded="${expandState}" aria-controls="${bodyId}">
          <span class="date"><b>${escapeHtml(day.dateLabel)}</b><span>${escapeHtml(day.dow)}</span></span>
          <span class="day-title"><b>${escapeHtml(day.title)}</b><small>${escapeHtml(day.sub)}</small></span>
          <span class="arrow">⌄</span>
        </button>
        <a class="day-map" target="_blank" rel="noopener" href="${day.mapUrl}" aria-label="在 Google Maps 開啟 ${escapeHtml(day.title)}"><span class="map-icon">⌖</span><span class="map-label">Maps ↗</span></a>
      </div>
      <div class="day-body" id="${bodyId}">
        <ul class="timeline">${day.items.map(item=>`<li data-item-id="${escapeHtml(item.id)}"><time>${escapeHtml(item.time)}</time><p>${renderSegments(item.segments,item,placeById,ticketById)}${item.noteSegments?`<em>${renderSegments(item.noteSegments,item,placeById,ticketById,{allowTicket:false})}</em>`:''}</p></li>`).join('')}</ul>
        <div class="tags">${day.tags.map(tag=>`<span class="tag ${escapeHtml(tag.tone)}">${escapeHtml(tag.text)}</span>`).join('')}</div>
        ${day.note?`<div class="day-note">${escapeHtml(day.note)}</div>`:''}
      </div>
    </article>`;
  }

  function filteredDays(city){
    const term=(search?.value||'').trim().toLowerCase();
    return itinerary.filter(day=>{
      const matchesCity=day.city===city;
      const matchesFilter=activeFilter==='all'||day.categories.includes(activeFilter);
      const matchesSearch=!term||searchableText(day).includes(term);
      return matchesCity&&matchesFilter&&matchesSearch;
    });
  }

  function render(){
    if(!track) return;

    track.innerHTML=CITY_ORDER.map(city=>{
      const rows=filteredDays(city);
      return `<section class="city-page" data-pager-city="${city}" aria-label="${city} 行程">
        <div class="days">
          ${rows.length?rows.map(renderDay).join(''):`<div class="city-page-empty">這個城市目前沒有符合條件的行程。</div>`}
        </div>
      </section>`;
    }).join('');

    if(empty) empty.hidden=true;
    snapToIndex(activeIndex,{animate:false});
    requestPagerHeight();
  }

  function syncCityControls(city){
    document.querySelectorAll('.city-card[data-city]').forEach(card=>{
      const selected=card.dataset.city===city;
      card.classList.toggle('active',selected);
      card.setAttribute('aria-pressed',String(selected));
    });

    document.querySelectorAll('.city-dock-btn[data-dock-city]').forEach(button=>{
      const selected=button.dataset.dockCity===city;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
  }

  function requestPagerHeight(){
    if(resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(()=>{
      resizeFrame=0;
      const panel=track?.querySelectorAll('.city-page')[activeIndex];
      if(pager&&panel) pager.style.height=`${panel.scrollHeight}px`;
    });
  }

  function snapToIndex(index,{animate=true,offset=0}={}){
    if(!track||!pager) return;
    activeIndex=Math.max(0,Math.min(CITY_ORDER.length-1,index));
    const x=-(activeIndex*pager.clientWidth)+offset;
    track.classList.toggle('dragging',!animate);
    track.style.transform=`translate3d(${x}px,0,0)`;
    syncCityControls(cityForIndex(activeIndex));
    requestPagerHeight();
  }

  function setCity(city,{animate=true,updateRoute=false,replace=false}={}){
    const nextIndex=indexForCity(city);
    const changed=nextIndex!==activeIndex;
    snapToIndex(nextIndex,{animate:animate&&changed});

    if(updateRoute&&navigation){
      navigation.setCity(city,{replace});
    }
  }

  function resetFilters(){
    activeFilter='all';
    expandState=false;
    if(search) search.value='';
    if(expandAll){
      expandAll.textContent='展開全部';
      expandAll.setAttribute('aria-pressed','false');
    }
    if(initialFilter) setFilterState(initialFilter);
  }

  // Ticket/day interactions use delegation so they survive pager rerenders.
  pager?.addEventListener('click',event=>{
    const ticket=event.target.closest('.ticket-icon[data-ticket-id]');
    if(ticket){
      event.preventDefault();
      event.stopPropagation();
      ticketController.open(ticket.dataset.ticketId);
      return;
    }

    const dayButton=event.target.closest('.day-main');
    if(dayButton){
      const day=dayButton.closest('.day');
      day?.classList.toggle('open');
      dayButton.setAttribute('aria-expanded',String(day?.classList.contains('open')));
      requestPagerHeight();
    }
  });

  const filterButtons=[...document.querySelectorAll('[data-filter]')];
  function setFilterState(activeButton){
    filterButtons.forEach(button=>{
      const selected=button===activeButton;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
  }

  const initialFilter=filterButtons.find(button=>button.dataset.filter==='all');
  if(initialFilter) setFilterState(initialFilter);

  filterButtons.forEach(button=>button.addEventListener('click',()=>{
    activeFilter=button.dataset.filter;
    setFilterState(button);
    render();
  }));

  search?.addEventListener('input',render);

  if(expandAll) expandAll.setAttribute('aria-pressed','false');
  expandAll?.addEventListener('click',()=>{
    expandState=!expandState;
    expandAll.textContent=expandState?'收合全部':'展開全部';
    expandAll.setAttribute('aria-pressed',String(expandState));
    render();
  });

  function chooseCity(city){
    resetFilters();
    render();
    setCity(city,{animate:true,updateRoute:true});
    document.getElementById('itinerary')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  document.querySelectorAll('.city-card[data-city]').forEach(card=>card.addEventListener('click',()=>{
    chooseCity(card.dataset.city);
  }));

  document.querySelectorAll('.city-dock-btn[data-dock-city]').forEach(button=>button.addEventListener('click',()=>{
    chooseCity(button.dataset.dockCity);
  }));

  // Keep the previously requested floating city dock, but only while Trip is the active app view.
  const cityDock=document.getElementById('cityDock');
  const citySwitchSection=document.getElementById('citySwitchSection');
  let dockFrame=0;

  function setDockVisible(visible){
    if(!cityDock) return;
    cityDock.classList.toggle('show',visible);
    cityDock.setAttribute('aria-hidden',String(!visible));
    cityDock.inert=!visible;
    document.body.classList.toggle('city-dock-visible',visible);
  }

  function updateDockVisibility(){
    dockFrame=0;
    if(!cityDock||!citySwitchSection){
      setDockVisible(false);
      return;
    }
    if(document.body.dataset.appView!=='trip'){
      setDockVisible(false);
      return;
    }
    setDockVisible(citySwitchSection.getBoundingClientRect().bottom<=8);
  }

  function requestDockUpdate(){
    if(dockFrame) return;
    dockFrame=requestAnimationFrame(updateDockVisibility);
  }

  window.addEventListener('scroll',requestDockUpdate,{passive:true});
  window.addEventListener('resize',()=>{
    requestDockUpdate();
    snapToIndex(activeIndex,{animate:false});
  });
  document.addEventListener('app:routechange',requestDockUpdate);

  // Pointer-based pager. Vertical scrolling remains native; edge gestures are left to the OS/browser.
  pager?.addEventListener('pointerdown',event=>{
    if(event.button!==0) return;
    if(event.target.closest('button,a,input')) return;

    const rect=pager.getBoundingClientRect();
    const localX=event.clientX-rect.left;
    if(localX<24||localX>rect.width-24) return;

    drag={
      pointerId:event.pointerId,
      startX:event.clientX,
      startY:event.clientY,
      lastX:event.clientX,
      startedAt:performance.now(),
      horizontal:null
    };
    pager.setPointerCapture?.(event.pointerId);
  });

  pager?.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.pointerId) return;
    const dx=event.clientX-drag.startX;
    const dy=event.clientY-drag.startY;
    drag.lastX=event.clientX;

    if(drag.horizontal===null&&Math.max(Math.abs(dx),Math.abs(dy))>8){
      drag.horizontal=Math.abs(dx)>Math.abs(dy)*1.15;
    }
    if(!drag.horizontal) return;

    event.preventDefault();
    const atFirst=activeIndex===0&&dx>0;
    const atLast=activeIndex===CITY_ORDER.length-1&&dx<0;
    const resistance=(atFirst||atLast)?.32:1;
    const limited=dx*resistance;
    snapToIndex(activeIndex,{animate:false,offset:limited});
  });

  function finishDrag(event){
    if(!drag||event.pointerId!==drag.pointerId) return;

    const dx=drag.lastX-drag.startX;
    const elapsed=Math.max(1,performance.now()-drag.startedAt);
    const velocity=Math.abs(dx)/elapsed;
    const width=pager?.clientWidth||1;
    const shouldMove=drag.horizontal&&(Math.abs(dx)>Math.min(90,width*.22)||velocity>.5);
    let nextIndex=activeIndex;

    if(shouldMove){
      if(dx<0) nextIndex=Math.min(CITY_ORDER.length-1,activeIndex+1);
      if(dx>0) nextIndex=Math.max(0,activeIndex-1);
    }

    const previousIndex=activeIndex;
    drag=null;
    const city=cityForIndex(nextIndex);
    snapToIndex(nextIndex,{animate:true});
    if(nextIndex!==previousIndex){
      navigation?.setCity(city);
    }
  }

  pager?.addEventListener('pointerup',finishDrag);
  pager?.addEventListener('pointercancel',finishDrag);

  navigation?.subscribe(route=>{
    if(route.view!=='trip') return;
    const city=CITY_ORDER.includes(route.city)?route.city:routeCity();
    setCity(city,{animate:true,updateRoute:false});
    requestDockUpdate();
  },{immediate:true});

  function showAll(){
    resetFilters();
    render();
    const city=cityForIndex(activeIndex);
    navigation?.go('trip',{city});
    requestAnimationFrame(()=>{
      document.getElementById('itinerary')?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  function showDay(dayId){
    const target=itinerary.find(day=>day.id===dayId);
    if(!target) return;
    const city=CITY_ORDER.includes(target.city)?target.city:'Barcelona';

    resetFilters();
    render();
    setCity(city,{animate:false});
    navigation?.go('trip',{city});

    requestAnimationFrame(()=>{
      const day=track?.querySelector(`.day[data-day-id="${CSS.escape(dayId)}"]`);
      if(!day) return;
      day.classList.add('open');
      const button=day.querySelector('.day-main');
      button?.setAttribute('aria-expanded','true');
      requestPagerHeight();
      day.scrollIntoView({behavior:'smooth',block:'start'});
      setTimeout(()=>button?.focus({preventScroll:true}),300);
    });
  }

  activeIndex=indexForCity(routeCity());
  render();
  syncCityControls(cityForIndex(activeIndex));
  updateDockVisibility();

  return {
    render,
    showDay,
    showAll,
    setCity:city=>setCity(city,{animate:true,updateRoute:true}),
    getActiveCity:()=>cityForIndex(activeIndex)
  };
}
