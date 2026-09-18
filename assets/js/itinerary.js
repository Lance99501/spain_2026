import {renderPlaceName,renderLocalizedText,localizedSearchText} from './place-language.js';
import {dateInDeviceTimeZone} from './device-time.js';
export function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function ticketButton(ticket){
  if(!ticket) return '';
  return `<button type="button" class="ticket-icon" data-ticket-id="${escapeHtml(ticket.id)}" title="開啟 Google Drive 票券" aria-label="開啟 ${escapeHtml(ticket.label)} Google Drive 票券">🎫</button>`;
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

    const segmentName=place
      ?renderPlaceName(place,{fallbackText:segment.text})
      :renderLocalizedText(segment.text,item);
    const inner=segmentName+crown+(anchoredTicket?ticketButton(ticket):'');
    return place?.unesco?`<span class="poi-annotated">${inner}</span>`:inner;
  }).join('');

  if(allowTicket&&ticket&&!item.ticketAnchorPlaceId&&!anchoredTicketRendered){
    return html+ticketButton(ticket);
  }

  return html;
}

function travelModeIcon(mode=''){
  const value=String(mode).toLowerCase();
  if(value.includes('taxi')) return '🚕';
  if(value.includes('walk')) return '🚶';
  if(value.includes('train')||value.includes('cercan')) return '🚆';
  if(value.includes('metro')) return '🚇';
  if(value.includes('bus')) return '🚌';
  return '';
}

function renderTravelHint(item){
  const hint=item.travelHint;
  if(!hint) return '';
  const main=[];
  if(hint.leaveTime){
    const leave=String(hint.leaveTime);
    main.push(/抵達後|叫車|上車|出發/.test(leave)?leave:`${leave} 出發`);
  }
  if(hint.duration) main.push(`約 ${hint.duration}`);
  else if(Number.isFinite(hint.durationMin)) main.push(`約 ${hint.durationMin} 分`);
  if(!main.length&&hint.mode) main.push(String(hint.mode));

  const detail=hint.detail
    ?`<span class="travel-detail" title="${escapeHtml(hint.detail)}">${escapeHtml(hint.detail)}</span>`
    :'';
  const backup=hint.backup
    ?`<span class="travel-backup" title="${escapeHtml(hint.backup)}">備案：${escapeHtml(hint.backup)}</span>`
    :'';

  const icon=travelModeIcon(hint.mode);
  const mainText=escapeHtml(main.join(' · '));
  const mainHtml=mainText?`<span class="travel-main">${icon?`${icon} `:''}${mainText}</span>`:'';
  return `<span class="travel-hint">${mainHtml}${detail}${backup}</span>`;
}

export function initItinerary({itinerary,places,tickets,ticketController}){
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
  let pagerSettleTimer=0;
  let pendingCity=null;
  let programmaticCity=null;
  let resizeFrame=0;
  let resizeObserver=null;

  function mainCity(city){
    return city==='Cordoba'?'Sevilla':city==='Segovia'?'Madrid':city==='Sitges'?'Barcelona':city;
  }

  function getDefaultCity(){
    const today=dateInDeviceTimeZone();
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
        ...item.segments.flatMap(x=>{
          const place=x.placeId?placeById.get(x.placeId):null;
          return [x.text,place?.displayName||'',place?.name||''];
        }),
        ...(item.noteSegments||[]).map(x=>x.text),
        ...Object.values(item.travelHint||{})
      ]),
      ...day.tags.map(x=>x.text),
      day.note||''
    ].map(text=>localizedSearchText(text,day)).join(' ').toLowerCase();
  }

  function matchesCity(day,city){
    return city==='all'||mainCity(day.city)===city;
  }

  function pairedFlexDay(day){
    return day.flexPair?itinerary.find(entry=>entry.date===day.flexPair.pairedDate)||null:null;
  }

  function flexPairLocked(day,paired){
    return [...(day.items||[]),...(paired?.items||[])].some(item=>Boolean(item.ticketId));
  }

  function flexPlanChoice(day){
    if(!day.flexPair) return 'A';
    const paired=pairedFlexDay(day);
    if(flexPairLocked(day,paired)) return 'A';
    try{
      return localStorage.getItem(`spain2026:flex:${day.flexPair.id}`)==='B'?'B':'A';
    }catch{
      return 'A';
    }
  }

  function renderFlexMiniTimeline(sourceDay){
    return `<ul class="flex-mini-timeline">${sourceDay.items.map(item=>`<li data-flex-source-item="${escapeHtml(item.id)}"><time>${escapeHtml(item.time)}</time><p>${renderSegments(item.segments,item,placeById,ticketById)}${renderTravelHint(item)}</p></li>`).join('')}</ul>`;
  }

  function renderFlexPlanColumn(sourceDay,plan,selected){
    return `<section class="flex-plan-column${selected===plan?' selected':''}" data-flex-column="${plan}">
      <div class="flex-plan-title"><span>${plan}</span><b>${renderLocalizedText(sourceDay.title,sourceDay)}</b></div>
      ${renderFlexMiniTimeline(sourceDay)}
    </section>`;
  }

  function renderFlexCompare(day){
    const paired=pairedFlexDay(day);
    if(!paired) return '';
    const selected=flexPlanChoice(day);
    const locked=flexPairLocked(day,paired);
    const pair=day.flexPair;
    const controls=locked
      ?'<span class="flex-lock">已鎖票 · 依票面日期</span>'
      :`<div class="flex-plan-toggle" role="group" aria-label="切換 A/B 顯示方案">
        <button type="button" data-flex-plan="A" aria-pressed="${selected==='A'}">${escapeHtml(pair.baselineLabel||'A 基準')}</button>
        <button type="button" data-flex-plan="B" aria-pressed="${selected==='B'}">${escapeHtml(pair.alternateLabel||'B 對調')}</button>
      </div>`;

    return `<div class="flex-compare" data-flex-pair-id="${escapeHtml(pair.id)}" data-selected-plan="${selected}">
      <div class="flex-compare-head">
        <span class="flex-pair-label">⇄ ${escapeHtml(pair.label||'Weather Flex')}</span>
        ${controls}
      </div>
      <div class="flex-plan-grid">
        ${renderFlexPlanColumn(day,'A',selected)}
        ${renderFlexPlanColumn(paired,'B',selected)}
      </div>
      <div class="flex-pair-note">${escapeHtml(pair.note||'此選擇只影響本機顯示，不修改 Notion。')}</div>
    </div>`;
  }

  function renderDay(day){
    const bodyId=`day-body-${day.id}`;
    const paired=pairedFlexDay(day);
    const selected=flexPlanChoice(day);
    const selectedMapDay=day.flexPair&&selected==='B'&&paired?paired:day;
    const title=day.flexPair?.displayTitle||day.title;
    const sub=day.flexPair?.displaySub||day.sub;
    const flexAttrs=day.flexPair?` data-flex-pair="${escapeHtml(day.flexPair.id)}"`:'';
    const mapAttrs=day.flexPair&&paired
      ?` data-flex-map-a="${escapeHtml(day.mapUrl)}" data-flex-map-b="${escapeHtml(paired.mapUrl)}"`
      :'';
    const body=day.flexPair
      ?renderFlexCompare(day)
      :`<ul class="timeline">${day.items.map(item=>`<li data-item-id="${escapeHtml(item.id)}"><time>${escapeHtml(item.time)}</time><p>${renderSegments(item.segments,item,placeById,ticketById)}${item.noteSegments?`<em>${renderSegments(item.noteSegments,item,placeById,ticketById,{allowTicket:false})}</em>`:''}${renderTravelHint(item)}</p></li>`).join('')}</ul>
        <div class="tags">${day.tags.map(tag=>`<span class="tag ${escapeHtml(tag.tone)}">${renderLocalizedText(tag.text,day)}</span>`).join('')}</div>
        ${day.note?`<div class="day-note">${renderLocalizedText(day.note,day)}</div>`:''}`;

    return `<article class="day${day.flexPair?' flex-day':''}${expandState?' open':''}" data-city="${escapeHtml(day.city)}" data-day-id="${escapeHtml(day.id)}"${flexAttrs}>
      <div class="day-main-wrap">
        <button type="button" class="day-main" aria-expanded="${expandState}" aria-controls="${bodyId}">
          <span class="date"><b>${escapeHtml(day.dateLabel)}</b><span>${escapeHtml(day.dow)}</span></span>
          <span class="day-title"><b>${renderLocalizedText(title,day)}</b><small>${renderLocalizedText(sub,day)}</small></span>
          <span class="arrow">⌄</span>
        </button>
        <a class="day-map" target="_blank" rel="noopener" href="${selectedMapDay.mapUrl}" aria-label="在 Google Maps 開啟目前顯示方案"${mapAttrs}><span class="map-icon">⌖</span><span class="map-label">Maps ↗</span></a>
      </div>
      <div class="day-body" id="${bodyId}">
        ${body}
      </div>
    </article>`;
  }

  function filteredRows(city){
    const term=(search?.value||'').trim().toLowerCase();

    return itinerary.filter(day=>{
      const matchesFilter=activeFilter==='all'||day.categories.includes(activeFilter);
      const aliases={'火車':['火車','列車','高鐵','renfe','alvia','ave','iryo'],'機場':['機場','航班','airport'],'咖啡':['咖啡','café','cafe']};
      const matchesSearch=!term||(aliases[term]||[term]).some(word=>searchableText(day).includes(word));
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
    if(activeCity==='all'){
      return daysRoot?.querySelector('.city-page-all')||null;
    }
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
    const allMode=activeCity==='all';
    const pageHtml=allMode
      ?`<section class="city-page city-page-all" data-pager-city="all" aria-label="全部城市行程">
        <div class="city-page-days">
          ${filteredRows('all').length
            ?filteredRows('all').map(renderDay).join('')
            :'<div class="city-page-empty">目前沒有符合條件的行程。</div>'}
        </div>
      </section>`
      :CITY_ORDER.map(city=>{
        const rows=filteredRows(city);
        return `<section class="city-page" data-pager-city="${city}" aria-label="${city} 行程">
          <div class="city-page-days">
            ${rows.length
              ?rows.map(renderDay).join('')
              :'<div class="city-page-empty">這個城市目前沒有符合條件的行程。</div>'}
          </div>
        </section>`;
      }).join('');

    daysRoot.classList.toggle('all-mode',allMode);
    daysRoot.innerHTML=pageHtml;
    if(empty) empty.hidden=true;

    observePages();
    requestAnimationFrame(()=>{
      if(!allMode){
        scrollToCity(activeCity,{behavior:'auto',syncOnly:true});
      }
      requestPagerHeight();
    });
  }

  function commitActiveCity(city,{announce=true,updateHeight=true}={}){
    const resolved=mainCity(city);
    if(!CITY_ORDER.includes(resolved)) return false;

    const changed=resolved!==activeCity;
    activeCity=resolved;
    pendingCity=null;
    syncCityControls(activeCity);

    if(changed&&announce) announceCity(activeCity);
    if(updateHeight) requestPagerHeight();
    return changed;
  }

  function schedulePagerSettle(){
    window.clearTimeout(pagerSettleTimer);
    pagerSettleTimer=window.setTimeout(()=>{
      if(programmaticCity){
        programmaticCity=null;
        pendingCity=null;
        syncCityControls(activeCity);
        requestPagerHeight();
        return;
      }

      if(pendingCity){
        commitActiveCity(pendingCity,{announce:true,updateHeight:true});
      }else{
        syncCityControls(activeCity);
        requestPagerHeight();
      }
    },120);
  }

  function scrollToCity(city,{behavior='smooth',syncOnly=false}={}){
    if(!daysRoot) return false;

    window.clearTimeout(pagerSettleTimer);
    pendingCity=null;

    if(city==='all'){
      const changed=activeCity!=='all';
      activeCity='all';
      programmaticCity=null;
      syncCityControls('all');
      if(changed) announceCity('all');
      render();
      return true;
    }

    const resolved=mainCity(city);
    if(!CITY_ORDER.includes(resolved)) return false;

    const modeChanged=activeCity==='all'||daysRoot.classList.contains('all-mode');
    const changed=activeCity!==resolved;
    activeCity=resolved;
    syncCityControls(activeCity);
    if(changed) announceCity(activeCity);

    if(modeChanged){
      programmaticCity=null;
      render();
      return true;
    }

    const left=cityIndex(activeCity)*daysRoot.clientWidth;

    if(syncOnly){
      programmaticCity=null;
      daysRoot.scrollLeft=left;
    }else{
      programmaticCity=activeCity;
      daysRoot.scrollTo({left,top:0,behavior});
      schedulePagerSettle();
    }

    requestPagerHeight();
    return true;
  }

  function ensureCity(){
    if(activeCity==='all'||CITY_ORDER.includes(activeCity)) return activeCity;
    const city=getDefaultCity();
    scrollToCity(city,{behavior:'auto'});
    return city;
  }

  daysRoot.addEventListener('pointerdown',()=>{
    if(daysRoot.classList.contains('all-mode')) return;
    window.clearTimeout(pagerSettleTimer);
    programmaticCity=null;
    pendingCity=null;
  },{passive:true});

  daysRoot.addEventListener('touchstart',()=>{
    if(daysRoot.classList.contains('all-mode')) return;
    window.clearTimeout(pagerSettleTimer);
    programmaticCity=null;
    pendingCity=null;
  },{passive:true});

  daysRoot.addEventListener('scroll',()=>{
    if(daysRoot.classList.contains('all-mode')||scrollFrame) return;

    scrollFrame=requestAnimationFrame(()=>{
      scrollFrame=0;
      const width=daysRoot.clientWidth;
      if(width<=0) return;

      if(programmaticCity){
        schedulePagerSettle();
        return;
      }

      const index=Math.max(0,Math.min(CITY_ORDER.length-1,Math.round(daysRoot.scrollLeft/width)));
      pendingCity=CITY_ORDER[index];
      syncCityControls(pendingCity);

      window.clearTimeout(heightTimer);
      heightTimer=window.setTimeout(requestPagerHeight,140);
      schedulePagerSettle();
    });
  },{passive:true});

  function applyFlexSelection(pairId,plan){
    const selected=plan==='B'?'B':'A';
    try{localStorage.setItem(`spain2026:flex:${pairId}`,selected);}catch{}

    daysRoot.querySelectorAll(`[data-flex-pair-id="${CSS.escape(pairId)}"]`).forEach(root=>{
      root.dataset.selectedPlan=selected;
      root.querySelectorAll('[data-flex-plan]').forEach(button=>{
        button.setAttribute('aria-pressed',String(button.dataset.flexPlan===selected));
      });
      root.querySelectorAll('.flex-plan-column').forEach(column=>{
        column.classList.toggle('selected',column.dataset.flexColumn===selected);
      });
    });

    daysRoot.querySelectorAll(`.day[data-flex-pair="${CSS.escape(pairId)}"] .day-map`).forEach(link=>{
      const next=selected==='B'?link.dataset.flexMapB:link.dataset.flexMapA;
      if(next) link.href=next;
    });
    requestPagerHeight();
  }

  daysRoot.addEventListener('click',event=>{
    const flexPlan=event.target.closest('[data-flex-plan]');
    if(flexPlan){
      event.preventDefault();
      event.stopPropagation();
      const root=flexPlan.closest('[data-flex-pair-id]');
      if(root) applyFlexSelection(root.dataset.flexPairId,flexPlan.dataset.flexPlan);
      return;
    }

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
    const city=card.dataset.city;
    scrollToCity(activeCity===city?'all':city,{behavior:'smooth'});
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
    if(activeCity==='all') requestPagerHeight();
    else scrollToCity(activeCity,{behavior:'auto',syncOnly:true});
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

      const nextCity=activeCity===city?'all':city;
      scrollToCity(nextCity,{behavior:'smooth'});
      requestAnimationFrame(()=>{
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
    scrollToCity('all',{behavior:'auto'});
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
    setCity:(city,options={})=>scrollToCity(city,{behavior:options.behavior||'smooth',syncOnly:options.syncOnly||false}),
    ensureCity,
    getSearchState:()=>({city:activeCity,category:activeFilter}),
    applySearch:({term='',city='all',category='all'}={})=>{
      if(search) search.value=term;
      activeFilter=category;
      setFilterState(filterButtons.find(button=>button.dataset.filter===category));
      scrollToCity(city,{behavior:'auto'});
      render();
    },
    getActiveCity:()=>activeCity
  };
}
