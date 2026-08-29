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
      && ticket
      && item.ticketAnchorPlaceId
      && segment.placeId===item.ticketAnchorPlaceId;

    if(anchoredTicket) anchoredTicketRendered=true;

    const inner=escapeHtml(segment.text)+crown+(anchoredTicket?ticketButton(ticket):'');

    return place?.unesco
      ? `<span class="poi-annotated">${inner}</span>`
      : inner;
  }).join('');

  if(allowTicket && ticket && !item.ticketAnchorPlaceId && !anchoredTicketRendered){
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

  let activeCity='all';
  let activeFilter='all';
  let expandState=false;
  let swipeAnimating=false;

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

  function render(){
    const term=(search?.value||'').trim().toLowerCase();

    const rows=itinerary.filter(day=>{
      const matchesCity=activeCity==='all'||day.city===activeCity;
      const matchesFilter=activeFilter==='all'||day.categories.includes(activeFilter);

      const searchable=[
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

      const matchesSearch=!term||searchable.includes(term);
      return matchesCity&&matchesFilter&&matchesSearch;
    });

    daysRoot.innerHTML=rows.map(day=>{
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
    }).join('');

    if(empty) empty.hidden=rows.length>0;

    daysRoot.querySelectorAll('.day').forEach(day=>{
      const btn=day.querySelector('.day-main');
      btn?.addEventListener('click',()=>{
        day.classList.toggle('open');
        btn.setAttribute('aria-expanded',String(day.classList.contains('open')));
      });
    });
  }

  daysRoot.addEventListener('click',event=>{
    const btn=event.target.closest('.ticket-icon[data-ticket-id]');
    if(!btn) return;
    event.preventDefault();
    event.stopPropagation();
    ticketController.open(btn.dataset.ticketId);
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

  filterButtons.forEach(btn=>btn.addEventListener('click',()=>{
    activeFilter=btn.dataset.filter;
    setFilterState(btn);
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

  function syncCityCards(city){
    const resolvedCity=mainCity(city);

    document.querySelectorAll('.city-card[data-city]').forEach(card=>{
      const selected=resolvedCity!=='all'&&card.dataset.city===resolvedCity;
      card.classList.toggle('active',selected);
      card.setAttribute('aria-pressed',String(selected));
    });

    document.querySelectorAll('.city-dock-btn[data-dock-city]').forEach(button=>{
      const selected=resolvedCity!=='all'&&button.dataset.dockCity===resolvedCity;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
  }

  document.querySelectorAll('.city-card[data-city]').forEach(card=>card.addEventListener('click',()=>{
    const city=card.dataset.city;
    activeCity=activeCity===city?'all':city;
    syncCityCards(activeCity);
    render();
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
  window.addEventListener('resize',requestDockUpdate);
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

      setCity(city,{scroll:true});
    });
  });

  function setCity(city,{scroll=false,direction=0}={}){
    const resolvedCity=mainCity(city);
    if(!CITY_ORDER.includes(resolvedCity)) return false;

    const apply=()=>{
      activeCity=resolvedCity;
      syncCityCards(activeCity);
      render();

      if(direction!==0&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        const incoming=direction>0?'city-swipe-in-right':'city-swipe-in-left';
        daysRoot.classList.add(incoming);
        window.setTimeout(()=>daysRoot.classList.remove(incoming),220);
      }

      if(scroll){
        document.getElementById('itinerary')?.scrollIntoView({behavior:'smooth',block:'start'});
      }
    };

    if(direction===0||window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      apply();
      return true;
    }

    if(swipeAnimating) return false;
    swipeAnimating=true;
    const outgoing=direction>0?'city-swipe-out-left':'city-swipe-out-right';
    daysRoot.classList.add(outgoing);

    window.setTimeout(()=>{
      daysRoot.classList.remove(outgoing);
      apply();
      swipeAnimating=false;
    },120);

    return true;
  }

  function ensureCity(){
    if(CITY_ORDER.includes(activeCity)) return activeCity;
    const city=getDefaultCity();
    setCity(city);
    return city;
  }

  function adjacentCity(direction){
    const city=ensureCity();
    const index=CITY_ORDER.indexOf(city);
    const next=Math.max(0,Math.min(CITY_ORDER.length-1,index+direction));
    return CITY_ORDER[next];
  }

  let swipe=null;

  daysRoot.style.touchAction='pan-y pinch-zoom';

  let suppressSwipeClick=false;

  daysRoot.addEventListener('click',event=>{
    if(!suppressSwipeClick) return;
    suppressSwipeClick=false;
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);

  daysRoot.addEventListener('pointerdown',event=>{
    if(swipeAnimating||event.button!==0) return;
    if(event.target.closest('a,input,select,textarea,.ticket-icon')) return;

    const rect=daysRoot.getBoundingClientRect();
    const localX=event.clientX-rect.left;
    if(localX<24||localX>rect.width-24) return;

    swipe={
      id:event.pointerId,
      startX:event.clientX,
      startY:event.clientY,
      lastX:event.clientX,
      startedAt:performance.now(),
      horizontal:null
    };
    daysRoot.setPointerCapture?.(event.pointerId);
  });

  daysRoot.addEventListener('pointermove',event=>{
    if(!swipe||event.pointerId!==swipe.id) return;

    const dx=event.clientX-swipe.startX;
    const dy=event.clientY-swipe.startY;
    swipe.lastX=event.clientX;

    if(swipe.horizontal===null&&Math.max(Math.abs(dx),Math.abs(dy))>8){
      swipe.horizontal=Math.abs(dx)>Math.abs(dy)*1.2;
    }
    if(!swipe.horizontal) return;

    suppressSwipeClick=true;
    event.preventDefault();
    const limited=Math.max(-42,Math.min(42,dx*.28));
    daysRoot.style.transform=`translate3d(${limited}px,0,0)`;
    daysRoot.style.opacity=String(Math.max(.82,1-Math.abs(limited)/260));
  });

  function finishSwipe(event){
    if(!swipe||event.pointerId!==swipe.id) return;

    const dx=swipe.lastX-swipe.startX;
    const elapsed=Math.max(1,performance.now()-swipe.startedAt);
    const velocity=Math.abs(dx)/elapsed;
    const width=daysRoot.clientWidth||1;
    const horizontal=swipe.horizontal===true;
    const shouldMove=horizontal&&(Math.abs(dx)>Math.min(76,width*.18)||velocity>.55);

    swipe=null;
    daysRoot.style.transform='';
    daysRoot.style.opacity='';

    if(!shouldMove){
      window.setTimeout(()=>{suppressSwipeClick=false;},250);
      return;
    }

    const direction=dx<0?1:-1;
    const current=ensureCity();
    const target=adjacentCity(direction);
    if(target===current){
      daysRoot.classList.add(direction>0?'city-swipe-bump-left':'city-swipe-bump-right');
      window.setTimeout(()=>{
        daysRoot.classList.remove('city-swipe-bump-left','city-swipe-bump-right');
      },180);
      return;
    }

    setCity(target,{direction});
  }

  daysRoot.addEventListener('pointerup',finishSwipe);
  daysRoot.addEventListener('pointercancel',finishSwipe);

  function resetView(){
    activeCity='all';
    activeFilter='all';
    expandState=false;

    if(search) search.value='';
    if(expandAll){
      expandAll.textContent='展開全部';
      expandAll.setAttribute('aria-pressed','false');
    }

    syncCityCards('all');
    if(initialFilter) setFilterState(initialFilter);
    render();
  }

  function showAll(){
    resetView();
    document.getElementById('itinerary')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function showDay(dayId){
    resetView();

    const day=document.querySelector(`.day[data-day-id="${CSS.escape(dayId)}"]`);
    if(!day) return;

    day.classList.add('open');
    const button=day.querySelector('.day-main');
    button?.setAttribute('aria-expanded','true');

    day.scrollIntoView({behavior:'smooth',block:'start'});
    setTimeout(()=>button?.focus({preventScroll:true}),300);
  }

  render();
  return {render,showDay,showAll,setCity,ensureCity,getActiveCity:()=>activeCity};
}
