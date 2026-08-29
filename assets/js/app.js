import {api} from './api.js';
import {initTripMap} from './map.js';
import {createTicketController} from './ticket.js';
import {initItinerary} from './itinerary.js';
import {initTodayMode} from './today.js';
import {initPwa} from './pwa.js';
import {initAppShell} from './app-shell.js';

const googleSearch=query=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function renderHotels(hotels,places){
  const root=document.getElementById('hotels');
  if(!root) return;

  const placeById=new Map(places.map(place=>[place.id,place]));

  root.innerHTML=hotels.map(hotel=>{
    const place=placeById.get(hotel.placeId);
    if(!place) return '';

    return `<article class="hotel">
      <div>
        <b>${escapeHtml(place.city)} · ${escapeHtml(place.name)}</b>
        <p>${escapeHtml(place.address||'')}<br>${escapeHtml(hotel.room)}</p>
      </div>
      <a target="_blank" rel="noopener" href="${googleSearch(place.name+' '+place.city)}">Maps ↗</a>
    </article>`;
  }).join('');
}

function initCountdown(config){
  const now=new Date();
  const today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());

  const dateUtc=value=>{
    const [y,m,d]=value.split('-').map(Number);
    return Date.UTC(y,m-1,d);
  };

  const depart=dateUtc(config.departDate);
  const spainStart=dateUtc(config.spainStartDate);
  const end=dateUtc(config.endDate);
  const oneDay=86400000;

  const c=document.getElementById('countdown');
  const ct=document.getElementById('countdownText');
  if(!c||!ct) return;

  if(today<depart){
    c.textContent=Math.ceil((depart-today)/oneDay)+' DAYS';
  }else if(today===depart){
    c.textContent='DEPART';
    ct.textContent='今晚 23:50 從 TPE 出發';
  }else if(today<=end){
    c.textContent='DAY '+(Math.floor((today-spainStart)/oneDay)+1);
    ct.textContent='西班牙旅行進行中';
  }else{
    c.textContent='17 DAYS';
    ct.textContent='Spain 2026 · 完成';
  }
}

function initCityReturn(){
  const btn=document.getElementById('cityReturnBtn');
  const target=document.getElementById('citySwitchSection');
  if(!btn||!target) return;

  function update(){
    const threshold=target.offsetTop+target.offsetHeight;
    btn.classList.toggle('show',window.scrollY>threshold);
  }

  btn.addEventListener('click',()=>{
    target.scrollIntoView({behavior:'smooth',block:'start'});
  });

  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  update();
}

async function bootstrap(){
  try{
    const data=await api.getBootstrapData();

    initTripMap({
      places:data.places,
      mapConfig:data.mapConfig
    });

    renderHotels(data.hotels,data.places);

    const ticketController=createTicketController({
      tickets:data.tickets,
      encryptedTickets:data.encryptedTickets,
      sessionMinutes:data.config.ticketSessionMinutes
    });

    const itineraryController=initItinerary({
      itinerary:data.itinerary,
      places:data.places,
      tickets:data.tickets,
      ticketController
    });

    initTodayMode({
      itinerary:data.itinerary,
      places:data.places,
      hotels:data.hotels,
      tickets:data.tickets,
      config:data.config,
      ticketController,
      itineraryController
    });

    initCountdown(data.config);
    initCityReturn();
    initAppShell({itineraryController});
  }catch(error){
    console.error('Spain 2026 bootstrap failed',error);

    const empty=document.getElementById('empty');
    if(empty){
      empty.hidden=false;
      empty.textContent='行程資料載入失敗，請重新整理頁面。';
    }
  }
}

initPwa();
bootstrap();
