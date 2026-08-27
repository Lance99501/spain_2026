import {escapeHtml,renderSegments} from './itinerary.js';

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

function resolveTodayDate(timeZone,itinerary){
  const preview=new URLSearchParams(window.location.search).get('previewDate');
  if(preview&&/^\d{4}-\d{2}-\d{2}$/.test(preview)&&itinerary.some(day=>day.date===preview)){
    return {date:preview,isPreview:true};
  }

  return {
    date:isoDateInTimeZone(new Date(),timeZone||'Europe/Madrid'),
    isPreview:false
  };
}

export function initTodayMode({
  itinerary,
  places,
  tickets,
  config,
  ticketController,
  itineraryController
}){
  const section=document.getElementById('todaySection');
  const root=document.getElementById('todayRoot');
  if(!section||!root) return {visible:false};

  const {date,isPreview}=resolveTodayDate(config.timeZone,itinerary);
  const day=itinerary.find(entry=>entry.date===date);

  if(!day){
    section.hidden=true;
    root.innerHTML='';
    return {visible:false,date};
  }

  const placeById=new Map(places.map(place=>[place.id,place]));
  const ticketById=new Map(tickets.map(ticket=>[ticket.id,ticket]));
  const badge=isPreview?'PREVIEW':'TODAY';

  root.innerHTML=`<article class="today-card" data-day-id="${escapeHtml(day.id)}">
    <div class="today-head">
      <div>
        <div class="today-kicker">${badge} · ${escapeHtml(day.dateLabel)} · ${escapeHtml(day.city)}</div>
        <h2 id="todayHeading">${escapeHtml(day.title)}</h2>
        <p>${escapeHtml(day.sub)}</p>
      </div>
      <span class="today-date" aria-hidden="true">${escapeHtml(day.dateLabel)}</span>
    </div>

    <ul class="today-timeline">
      ${day.items.map(item=>`<li data-item-id="${escapeHtml(item.id)}">
        <time>${escapeHtml(item.time)}</time>
        <div>
          <p>${renderSegments(item.segments,item,placeById,ticketById)}</p>
          ${item.noteSegments?`<small>${renderSegments(item.noteSegments,item,placeById,ticketById,{allowTicket:false})}</small>`:''}
        </div>
      </li>`).join('')}
    </ul>

    <div class="today-actions">
      <a class="today-action primary" href="${day.mapUrl}" target="_blank" rel="noopener">今日 Maps ↗</a>
      <button type="button" class="today-action" id="todayFullDay">完整今日行程</button>
    </div>
  </article>`;

  section.hidden=false;

  root.addEventListener('click',event=>{
    const ticketButton=event.target.closest('.ticket-icon[data-ticket-id]');
    if(ticketButton){
      event.preventDefault();
      event.stopPropagation();
      ticketController.open(ticketButton.dataset.ticketId);
      return;
    }

    if(event.target.closest('#todayFullDay')){
      itineraryController.showDay(day.id);
    }
  });

  return {visible:true,date,dayId:day.id,isPreview};
}
