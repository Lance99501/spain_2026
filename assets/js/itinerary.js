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

export function initItinerary({itinerary,places,tickets,ticketController,config}){
  const CITY_ORDER=['Barcelona','Sevilla','Granada','Madrid'];
  const daysRoot=document.getElementById('days');
  const search=document.getElementById('search');
  const empty=document.getElementById('empty');
  const expandAll=document.getElementById('expandAll');

  const placeById=new Map(places.map(place=>[place.id,place]));
  const ticketById=new Map(tickets.map(ticket=>[ticket.id,ticket]));

  let activeCity='Barcelona';
  let activeFilter='all';
  let expandState=false;
  let scrollFrame=0;
  let heightTimer=0;
  let resizeFrame=0;
  let resizeObserver=null;

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

  function mainCity(city){
    return city==='Cordoba'?'Sevilla':city==='Segovia'?'Madrid':city==='Sitges'?'Barcelona':city;
  }

  function getDefaultCity(){
    const today=dateInTimeZone(config?.timeZone||'Europe/Madrid');
    const day=itinerary.find(entry=>entry.date===today);
    const city=mainCity(day?.city);
    return CITY_ORDER.includes(city)?city:'Barcelona';
  }

  function cityIndex(city){
    const index=CITY_ORDER.indexOf(mainCity(city));
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

  function matchesCity(day,city){
    return mainCity(day.city)===city;
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

  function filteredRows(city){
    const term=(search?.value||'').trim().toLowerCase();

    return itinerary.filter(day=>{
      const matchesFilter=activeFilter==='all'||day.categories.includes(activeFilter);
      const matchesSearch=!term||searchableText(day).includes(term);
      return matchesCity(day,city)&&matchesFilter&&matchesSearch;
    });
  }

  function announceCity(city){
    document.dispatchEvent(new CustomEvent('spain:citychange',{detail:{city}}));
  }

  function syncCityControls(city){
    const resolved=mainCity(city);

    document.querySelectorAll('.city-card[data-city]').forEach(card=>{
      const selected=card.dataset.city===resolved;
      card.classList.toggle('active',selected);
      card.setAttribute('aria-pressed',String(selected));
    });

    document.querySelectorAll('.city-dock-btn[data-dock-city]').forEach(button=>{
      const selected=button.dataset.dockCity===resolved;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
  }

  function activePage(){
    return daysRoot?.querySelector(`.city-page[data-pager-city="${CSS.escape(activeCity)}"]`)||null;
  }

  function updatePagerHeight(){
    resizeFrame=0;
    const page=activePage();
    if(!page||!daysRoot) return;
    daysRoot.style.height=`${Math.ceil(page.scrollHeight)}px`;
  }

  function requestPagerHeight(){
    if(resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(updatePagerHeight);
  }

  function observePages(){
    resizeObserver?.disconnect();
    if(!('ResizeObserver' in window)) return;

    resizeObserver=new ResizeObserver(entries=>{
      if(entries.some(entry=>entry.target.dataset.pagerCity===activeCity)){
        requestPagerHeight();
      }
    });

    daysRoot.querySelectorAll('.city-page').forEach(page=>resizeObserver.observe(page));
  }

  function render(){
    const pageHtml=CITY_ORDER.map(city=>{
      const rows=filteredRows(city);
      return `<section class="city-page" data-pager-city="${city}" aria-label="${city} 行程">
        <div class="city-page-days">
          ${rows.length
            ?rows.map(renderDay).join('')
            :'<div class="city-page-empty">這個城市目前沒有符合條件的行程。</div>'}
        </div>
      </section>`;
    }).join('');

    daysRoot.innerHTML=pageHtml;
    if(empty) empty.hidden=true;

    observePages();
    requestAnimationFrame(()=>{
      scrollToCity(activeCity,{behavior:'auto',syncOnly:true});
      requestPagerHeight();
    });
  }

  function setActiveCity(city,{updateHeight=true}={}){
    const resolved=mainCity(city);
    if(!CITY_ORDER.includes(resolved)||resolved===activeCity) return;

    activeCity=resolved;
    syncCityControls(activeCity);
    announceCity(activeCity);
    if(updateHeight) requestPagerHeight();
  }

  function scrollToCity(city,{behavior='smooth',syncOnly=false}={}){
    const resolved=mainCity(city);
    if(!CITY_ORDER.includes(resolved)||!daysRoot) return false;

    const changed=activeCity!==resolved;
    activeCity=resolved;
    syncCityControls(activeCity);
    if(changed) announceCity(activeCity);

    if(!syncOnly){
      const left=cityIndex(activeCity)*daysRoot.clientWidth;
      daysRoot.scrollTo({left,top:0,behavior});
    }else{
      daysRoot.scrollLeft=cityIndex(activeCity)*daysRoot.clientWidth;
    }

    requestPagerHeight();
    return true;
  }

  function ensureCity(){
    if(CITY_ORDER.includes(activeCity)) return activeCity;
    const city=getDefaultCity();
    scrollToCity(city,{behavior:'auto'});
    return city;
  }

  daysRoot.addEventListener('scroll',()=>{
    if(scrollFrame) return;

    scrollFrame=requestAnimationFrame(()=>{
      scrollFrame=0;
      const width=daysRoot.clientWidth;
      if(width<=0) return;

      const index=Math.max(0,Math.min(CITY_ORDER.length-1,Math.round(daysRoot.scrollLeft/width)));
      setActiveCity(CITY_ORDER[index],{updateHeight:false});

      window.clearTimeout(heightTimer);
      heightTimer=window.setTimeout(requestPagerHeight,90);
    });
  },{passive:true});

  daysRoot.addEventListener('click',event=>{
    const ticket=event.target.closest('.ticket-icon[data-ticket-id]');
    if(ticket){
      event.preventDefault();
      event.stopPropagation();
      ticketController.open(ticket.dataset.ticketId);
      return;
    }

    const button=event.target.closest('.day-main');
    if(!button) return;

    const day=button.closest('.day');
    day?.classList.toggle('open');
    button.setAttribute('aria-expanded',String(day?.classList.contains('open')));
    requestPagerHeight();
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

  document.querySelectorAll('.city-card[data-city]').forEach(card=>card.addEventListener('click',()=>{
    scrollToCity(card.dataset.city,{behavior:'smooth'});
  }));

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
    if(!cityDock||!citySwitchSection) return;
    const rect=citySwitchSection.getBoundingClientRect();
    setDockVisible(rect.bottom<=8);
  }

  function requestDockUpdate(){
    if(dockFrame) return;
    dockFrame=requestAnimationFrame(updateDockVisibility);
  }

  window.addEventListener('scroll',requestDockUpdate,{passive:true});
  window.addEventListener('resize',()=>{
    requestDockUpdate();
    scrollToCity(activeCity,{behavior:'auto',syncOnly:true});
  });
  updateDockVisibility();

  document.querySelectorAll('.city-dock-btn[data-dock-city]').forEach(button=>{
    button.addEventListener('click',()=>{
      const city=button.dataset.dockCity;
      if(!city) return;

      activeFilter='all';
      expandState=false;

      if(search) search.value='';
      if(expandAll){
        expandAll.textContent='展開全部';
        expandAll.setAttribute('aria-pressed','false');
      }
      if(initialFilter) setFilterState(initialFilter);

      render();
      requestAnimationFrame(()=>{
        scrollToCity(city,{behavior:'smooth'});
        document.getElementById('itinerary')?.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
  });

  function resetView(){
    activeFilter='all';
    expandState=false;

    if(search) search.value='';
    if(expandAll){
      expandAll.textContent='展開全部';
      expandAll.setAttribute('aria-pressed','false');
    }

    if(initialFilter) setFilterState(initialFilter);
  }

  function showAll(){
    resetView();
    activeCity=CITY_ORDER.includes(activeCity)?activeCity:getDefaultCity();
    render();
    document.getElementById('itinerary')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function showDay(dayId){
    const target=itinerary.find(day=>day.id===dayId);
    if(!target) return;

    resetView();
    activeCity=mainCity(target.city);
    render();

    requestAnimationFrame(()=>{
      scrollToCity(activeCity,{behavior:'auto'});
      requestAnimationFrame(()=>{
        const day=daysRoot.querySelector(`.day[data-day-id="${CSS.escape(dayId)}"]`);
        if(!day) return;

        day.classList.add('open');
        const button=day.querySelector('.day-main');
        button?.setAttribute('aria-expanded','true');
        requestPagerHeight();
        day.scrollIntoView({behavior:'smooth',block:'start'});
        setTimeout(()=>button?.focus({preventScroll:true}),300);
      });
    });
  }

  activeCity=getDefaultCity();
  render();
  syncCityControls(activeCity);

  return {
    render,
    showDay,
    showAll,
    setCity:city=>scrollToCity(city,{behavior:'smooth'}),
    ensureCity,
    getActiveCity:()=>activeCity
  };
}
