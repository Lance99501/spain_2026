function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function tagClass(text){
  if(/已確認|不可移動|固定|AVE|ALVIA|返程/.test(text)) return 'confirmed';
  if(/待/.test(text)) return 'pending';
  if(/休息|緩衝|累/.test(text)) return 'rest';
  return 'flex';
}

function decorateText(text,annotations){
  const matches=[];
  annotations.forEach(a=>{
    if(a.whenContains && !text.includes(a.whenContains)) return;
    let from=0,idx;
    while((idx=text.indexOf(a.term,from))!==-1){
      matches.push({start:idx,end:idx+a.term.length,a});
      from=idx+a.term.length;
    }
  });

  matches.sort((x,y)=>x.start-y.start || (y.end-y.start)-(x.end-x.start));
  const chosen=[];
  let cursor=-1;
  for(const m of matches){
    if(m.start>=cursor){
      chosen.push(m);
      cursor=m.end;
    }
  }

  let out='',pos=0;
  for(const m of chosen){
    out+=escapeHtml(text.slice(pos,m.start));
    const label=escapeHtml(text.slice(m.start,m.end));
    const crown=m.a.heritage
      ? '<span class="unesco-crown" title="UNESCO 世界文化遺產" aria-label="UNESCO 世界文化遺產">♛</span>'
      : '';
    const ticket=m.a.ticketId
      ? `<button type="button" class="ticket-icon" data-ticket-id="${escapeHtml(m.a.ticketId)}" data-ticket-label="${escapeHtml(m.a.ticketLabel||m.a.term)}" title="開啟票券 QR" aria-label="開啟 ${escapeHtml(m.a.ticketLabel||m.a.term)} 票券 QR">🎫</button>`
      : '';

    out+=m.a.heritage
      ? `<span class="poi-annotated">${label}${crown}${ticket}</span>`
      : label+ticket;
    pos=m.end;
  }
  return out+escapeHtml(text.slice(pos));
}

export function initItinerary({itinerary,annotations,ticketController}){
  const daysRoot=document.getElementById('days');
  const search=document.getElementById('search');
  const empty=document.getElementById('empty');
  const expandAll=document.getElementById('expandAll');

  let activeCity='all';
  let activeFilter='all';
  let expandState=false;

  function render(){
    const term=(search?.value||'').trim().toLowerCase();
    const rows=itinerary.filter(d=>{
      const matchesCity=activeCity==='all'||d.city===activeCity;
      const matchesFilter=activeFilter==='all'||d.cats.includes(activeFilter);
      const haystack=JSON.stringify(d).toLowerCase();
      const matchesSearch=!term||haystack.includes(term);
      return matchesCity&&matchesFilter&&matchesSearch;
    });

    daysRoot.innerHTML=rows.map(d=>{
      const bodyId=`day-body-${d.date.replace('/','-')}`;
      return `<article class="day${expandState?' open':''}" data-city="${escapeHtml(d.city)}">
        <div class="day-main-wrap">
          <button type="button" class="day-main" aria-expanded="${expandState}" aria-controls="${bodyId}">
            <span class="date"><b>${escapeHtml(d.date)}</b><span>${escapeHtml(d.dow)}</span></span>
            <span class="day-title"><b>${escapeHtml(d.title)}</b><small>${escapeHtml(d.sub)}</small></span>
            <span class="arrow">⌄</span>
          </button>
          <a class="day-map" target="_blank" rel="noopener" href="${d.map}" aria-label="在 Google Maps 開啟 ${escapeHtml(d.title)}"><span class="map-icon">⌖</span><span class="map-label">Maps ↗</span></a>
        </div>
        <div class="day-body" id="${bodyId}">
          <ul class="timeline">${d.items.map(x=>`<li><time>${escapeHtml(x[0])}</time><p>${decorateText(x[1],annotations)}${x[2]?`<em>${decorateText(x[2],annotations)}</em>`:''}</p></li>`).join('')}</ul>
          <div class="tags">${d.tags.map(t=>`<span class="tag ${tagClass(t)}">${escapeHtml(t)}</span>`).join('')}</div>
          ${d.note?`<div class="day-note">${escapeHtml(d.note)}</div>`:''}
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

  daysRoot.addEventListener('click',e=>{
    const btn=e.target.closest('.ticket-icon[data-ticket-id]');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    ticketController.open(btn.dataset.ticketId,btn.dataset.ticketLabel||'票券');
  });

  document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    activeFilter=btn.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===btn));
    render();
  }));

  search?.addEventListener('input',render);
  expandAll?.addEventListener('click',()=>{
    expandState=!expandState;
    expandAll.textContent=expandState?'收合全部':'展開全部';
    render();
  });

  function syncCityCards(city){
    const mainCity=city==='Cordoba'?'Sevilla':city==='Segovia'?'Madrid':city==='Sitges'?'Barcelona':city;
    document.querySelectorAll('.city-card[data-city]').forEach(card=>{
      card.classList.toggle('active',mainCity!=='all'&&card.dataset.city===mainCity);
    });
  }

  document.querySelectorAll('.city-card[data-city]').forEach(card=>card.addEventListener('click',()=>{
    const city=card.dataset.city;
    activeCity=activeCity===city?'all':city;
    syncCityCards(activeCity);
    render();
  }));

  render();
  return {render};
}
