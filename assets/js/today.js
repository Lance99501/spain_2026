import {escapeHtml,renderSegments} from './itinerary.js';
import {initTodayWeather} from './weather.js';

const googleSearch=query=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

function isoDateInTimeZone(date,timeZone){
  const formatter=new Intl.DateTimeFormat('en-US',{
    timeZone,
    year:'numeric',
    month:'2-digit',
    day:'2-digit'
  });

  const parts=Object.fromEntries(
    formatter.formatToParts(date)
      .filter(part=>part.type!=='literal')
      .map(part=>[part.type,part.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function timeInTimeZone(date,timeZone){
  const formatter=new Intl.DateTimeFormat('en-GB',{
    timeZone,
    hour:'2-digit',
    minute:'2-digit',
    hourCycle:'h23'
  });

  const parts=Object.fromEntries(
    formatter.formatToParts(date)
      .filter(part=>part.type!=='literal')
      .map(part=>[part.type,part.value])
  );

  const text=`${parts.hour}:${parts.minute}`;
  return {text,minutes:Number(parts.hour)*60+Number(parts.minute)};
}

function parseClock(value){
  if(!/^\d{2}:\d{2}$/.test(value||'')) return null;
  const [hour,minute]=value.split(':').map(Number);
  return hour*60+minute;
}

function plainItemText(item){
  return item.segments.map(segment=>segment.text).join('');
}

function countdownLabel(diff){
  if(diff<=0) return '現在';
  if(diff<60) return `${diff} 分後`;
  const hours=Math.floor(diff/60);
  const minutes=diff%60;
  return minutes?`${hours} 小時 ${minutes} 分後`:`${hours} 小時後`;
}

function transportKindLabel(kind){
  return ({train:'TRAIN',bus:'BUS',flight:'FLIGHT'})[kind]||'TRANSPORT';
}

function transportDayLabel(items){
  const roles=items.map(item=>item.transport?.role).filter(Boolean);
  if(roles.includes('transfer')) return 'TRANSFER DAY';
  if(roles.includes('daytrip')) return 'DAY TRIP';
  if(roles.includes('flight')) return 'FLIGHT DAY';
  return 'TRANSPORT';
}

function statusLabel(status){
  return status==='confirmed'?'已確認':status==='pending'?'待確認':'';
}

function placeMapsUrl(place){
  return googleSearch([place.name,place.address||place.city].filter(Boolean).join(' '));
}

function resolveHotel(day,hotels,placeById){
  const candidates=hotels
    .filter(hotel=>day.date>=hotel.checkIn&&day.date<=hotel.checkOut)
    .map(hotel=>({hotel,place:placeById.get(hotel.placeId)}))
    .filter(entry=>entry.place);

  return candidates.find(entry=>entry.place.city===day.city)
    || candidates.find(entry=>entry.hotel.checkIn===day.date)
    || candidates[0]
    || null;
}

function buildMoments(day,placeById){
  const moments=[];

  day.items.forEach(item=>{
    const start=parseClock(item.startTime);
    if(start!==null){
      moments.push({
        minutes:start,
        type:'item',
        item,
        label:plainItemText(item)
      });
    }

    const transport=item.transport;
    const arrival=parseClock(transport?.arrivalTime);
    if(arrival!==null&&(transport.arrivalDayOffset||0)===0){
      const destination=placeById.get(transport.destinationPlaceId);
      moments.push({
        minutes:arrival,
        type:'arrival',
        item,
        label:destination?`抵達 ${destination.name}`:'抵達目的地'
      });
    }
  });

  return moments.sort((a,b)=>a.minutes-b.minutes);
}

function renderTransport(day,placeById,ticketById){
  const transportItems=day.items.filter(item=>item.transport);
  if(!transportItems.length) return '';

  const uniqueTicketIds=[...new Set(
    transportItems.map(item=>item.ticketId).filter(Boolean)
  )];

  return `<section class="today-transport" aria-label="今日交通">
    <div class="today-transport-head">
      <span>${transportDayLabel(transportItems)}</span>
      <small>${transportKindLabel(transportItems[0].transport.kind)}</small>
    </div>

    <div class="transport-legs">
      ${transportItems.map(item=>{
        const leg=item.transport;
        const origin=placeById.get(leg.originPlaceId);
        const destination=placeById.get(leg.destinationPlaceId);
        const dep=leg.departureTime||item.startTime||'—';
        const arr=leg.arrivalTime||'—';

        return `<div class="transport-leg ${escapeHtml(leg.status||'')}">
          <a class="transport-place" href="${origin?placeMapsUrl(origin):'#'}" ${origin?'target="_blank" rel="noopener"':''}>
            <small>FROM</small>
            <b>${escapeHtml(origin?.name||'待確認')}</b>
            <strong>${escapeHtml(dep)}</strong>
          </a>

          <div class="transport-service" aria-label="${escapeHtml(leg.service||leg.kind)}">
            <span>${escapeHtml(leg.service||transportKindLabel(leg.kind))}</span>
            <i aria-hidden="true">→</i>
            <small>${escapeHtml(statusLabel(leg.status))}</small>
          </div>

          <a class="transport-place end" href="${destination?placeMapsUrl(destination):'#'}" ${destination?'target="_blank" rel="noopener"':''}>
            <small>TO</small>
            <b>${escapeHtml(destination?.name||'待確認')}</b>
            <strong>${escapeHtml(arr)}</strong>
          </a>
        </div>`;
      }).join('')}
    </div>

    ${uniqueTicketIds.length?`<div class="transport-ticket-actions">
      ${uniqueTicketIds.map(ticketId=>{
        const ticket=ticketById.get(ticketId);
        if(!ticket) return '';
        return `<button type="button" class="today-mini-action" data-ticket-id="${escapeHtml(ticket.id)}">🎫 ${escapeHtml(ticket.kind==='flight'?'航班票券':'交通票券')}</button>`;
      }).join('')}
    </div>`:''}
  </section>`;
}

function renderQuickActions(day,hotelEntry,uniqueTickets,hasTransport){
  const hotel=hotelEntry?.place;

  return `<div class="today-actions" aria-label="今日快速操作">
    <a class="today-action primary" href="${day.mapUrl}" target="_blank" rel="noopener">⌖ 今日 Maps</a>

    ${!hasTransport&&uniqueTickets.length
      ?`<button type="button" class="today-action" data-action="tickets">🎫 今日票券${uniqueTickets.length>1?` ${uniqueTickets.length}`:''}</button>`
      :''}

    ${hotel
      ?`<a class="today-action" href="${placeMapsUrl(hotel)}" target="_blank" rel="noopener" aria-label="開啟 ${escapeHtml(hotel.name)} 地圖">⌂ 住宿</a>`
      :''}

    <button type="button" class="today-action" data-action="all">☰ 全部行程</button>
  </div>`;
}

export function initTodayMode({
  itinerary,
  places,
  hotels,
  tickets,
  config,
  mapConfig,
  demoContext,
  ticketController,
  itineraryController
}){
  const section=document.getElementById('todaySection');
  const root=document.getElementById('todayRoot');
  if(!section||!root) return {visible:false};

  const params=new URLSearchParams(window.location.search);
  const previewDate=demoContext?.previewDate||params.get('previewDate');
  const validPreview=previewDate&&/^\d{4}-\d{2}-\d{2}$/.test(previewDate)
    &&itinerary.some(day=>day.date===previewDate);

  const todayDate=validPreview
    ?previewDate
    :isoDateInTimeZone(new Date(),config.timeZone||'Europe/Madrid');

  const day=itinerary.find(entry=>entry.date===todayDate);
  if(!day){
    section.hidden=true;
    root.innerHTML='';
    return {visible:false,date:todayDate};
  }

  const placeById=new Map(places.map(place=>[place.id,place]));
  const ticketById=new Map(tickets.map(ticket=>[ticket.id,ticket]));
  const timeZone=day.timeZone||config.timeZone||'Europe/Madrid';
  const previewTime=demoContext?.previewTime||params.get('previewTime');
  const effectivePreviewTime=validPreview&&/^\d{2}:\d{2}$/.test(previewTime||'')
    ?previewTime
    :validPreview?'12:00':null;

  const transportItems=day.items.filter(item=>item.transport);
  const hasTransport=transportItems.length>0;
  const uniqueTickets=[...new Set(day.items.map(item=>item.ticketId).filter(Boolean))]
    .map(id=>ticketById.get(id))
    .filter(Boolean);
  const hotelEntry=resolveHotel(day,hotels,placeById);
  const badge=demoContext?.isDemo?'DEMO':validPreview?'PREVIEW':'TODAY';

  root.innerHTML=`<article class="today-card" data-day-id="${escapeHtml(day.id)}">
    <div class="today-head">
      <div>
        <div class="today-kicker">${badge} · ${escapeHtml(day.dateLabel)} · ${escapeHtml(day.city)}</div>
        <h2 id="todayHeading">${escapeHtml(day.title)}</h2>
        <p>${escapeHtml(day.sub)}</p>
      </div>
      <span class="today-date" aria-hidden="true">${escapeHtml(day.dateLabel)}</span>
    </div>

    <div class="today-now-next" aria-live="polite">
      <div class="now-panel">
        <span>NOW</span>
        <b id="todayNowTime">—</b>
        <small>${timeZone==='Asia/Taipei'?'台灣時間':'西班牙時間'}</small>
      </div>
      <div class="next-panel">
        <span>NEXT</span>
        <div id="todayNextContent"><b>—</b></div>
      </div>
    </div>

    <div class="today-weather" id="todayWeather" aria-live="polite">
      <div class="weather-compact weather-loading">
        <div class="weather-kicker">WEATHER · 今日</div>
        <div class="weather-message">正在取得天氣…</div>
      </div>
    </div>

    ${renderTransport(day,placeById,ticketById)}

    <ul class="today-timeline">
      ${day.items.map(item=>`<li data-item-id="${escapeHtml(item.id)}">
        <time>${escapeHtml(item.time)}</time>
        <div>
          <p>${renderSegments(item.segments,item,placeById,ticketById)}</p>
          ${item.noteSegments?`<small>${renderSegments(item.noteSegments,item,placeById,ticketById,{allowTicket:false})}</small>`:''}
        </div>
      </li>`).join('')}
    </ul>

    ${renderQuickActions(day,hotelEntry,uniqueTickets,hasTransport)}

    ${!hasTransport&&uniqueTickets.length>1?`<div class="today-ticket-tray" id="todayTicketTray" hidden>
      ${uniqueTickets.map(ticket=>`<button type="button" class="today-ticket-choice" data-ticket-id="${escapeHtml(ticket.id)}">🎫 ${escapeHtml(ticket.label)}</button>`).join('')}
    </div>`:''}
  </article>`;

  section.hidden=false;

  const weatherController=initTodayWeather({
    root:document.getElementById('todayWeather'),
    day,
    mapConfig,
    previewDate:validPreview?previewDate:null,
    previewTime:effectivePreviewTime,
    isPreview:validPreview,
    weatherMode:demoContext?.weatherMode||'trip',
    isDemo:demoContext?.isDemo===true
  });

  const moments=buildMoments(day,placeById);
  const nowNode=document.getElementById('todayNowTime');
  const nextNode=document.getElementById('todayNextContent');

  function updateNowNext(){
    const clock=effectivePreviewTime
      ?{text:effectivePreviewTime,minutes:parseClock(effectivePreviewTime)}
      :timeInTimeZone(new Date(),timeZone);

    if(nowNode) nowNode.textContent=clock.text;

    const next=moments.find(moment=>moment.minutes>=clock.minutes);
    if(!nextNode) return;

    if(!next){
      nextNode.innerHTML='<b>今天沒有下一個固定時間</b><small>其餘行程依現場節奏進行</small>';
      return;
    }

    const diff=next.minutes-clock.minutes;
    const title=next.type==='item'
      ?renderSegments(next.item.segments,next.item,placeById,ticketById,{allowTicket:false})
      :escapeHtml(next.label);

    nextNode.innerHTML=`<b>${escapeHtml(String(Math.floor(next.minutes/60)).padStart(2,'0'))}:${escapeHtml(String(next.minutes%60).padStart(2,'0'))}</b>
      <p>${title}</p>
      <small>${escapeHtml(countdownLabel(diff))}</small>`;
  }

  updateNowNext();
  let clockTimer=null;
  if(!effectivePreviewTime){
    clockTimer=window.setInterval(updateNowNext,30000);
  }

  root.addEventListener('click',event=>{
    const ticketButton=event.target.closest('[data-ticket-id]');
    if(ticketButton){
      event.preventDefault();
      event.stopPropagation();
      ticketController.open(ticketButton.dataset.ticketId);
      return;
    }

    const ticketsAction=event.target.closest('[data-action="tickets"]');
    if(ticketsAction){
      if(uniqueTickets.length===1){
        ticketController.open(uniqueTickets[0].id);
      }else{
        const tray=document.getElementById('todayTicketTray');
        if(tray){
          tray.hidden=!tray.hidden;
          ticketsAction.setAttribute('aria-expanded',String(!tray.hidden));
        }
      }
      return;
    }

    if(event.target.closest('[data-action="all"]')){
      itineraryController.showAll();
    }
  });

  window.addEventListener('pagehide',()=>{
    if(clockTimer) clearInterval(clockTimer);
    weatherController?.destroy?.();
  },{once:true});

  return {
    visible:true,
    date:todayDate,
    dayId:day.id,
    isPreview:validPreview
  };
}
