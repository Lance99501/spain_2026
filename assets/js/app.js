import {api} from './api.js';
import {initTripMap} from './map.js';
import {createTicketController} from './ticket.js';
import {initItinerary} from './itinerary.js';
import {initTodayMode} from './today.js';
import {initPwa} from './pwa.js';
import {initAppShell} from './app-shell.js';
import {initHotels} from './hotels.js';
import {initDemoMode} from './demo.js';
import {initPlaceLanguage} from './place-language.js';
import {dateInDeviceTimeZone} from './device-time.js';

function initCountdown(config,demoContext){
  const now=new Date();

  const dateUtc=value=>{
    const [y,m,d]=value.split('-').map(Number);
    return Date.UTC(y,m-1,d);
  };

  const actualToday=dateUtc(dateInDeviceTimeZone(now));
  const today=demoContext?.isDemo&&demoContext.previewDate
    ?dateUtc(demoContext.previewDate)
    :actualToday;

  const depart=dateUtc(config.departDate);
  const spainStart=dateUtc(config.spainStartDate);
  const end=dateUtc(config.endDate);
  const oneDay=86400000;

  const c=document.getElementById('countdown');
  const ct=document.getElementById('countdownText');
  if(!c||!ct) return;

  const totalDays=Math.floor((end-spainStart)/oneDay)+1;
  const beforeDeparture=today<depart;
  const progress=beforeDeparture
    ?Math.max(0,Math.min(1,1-(depart-today)/(30*oneDay)))
    :Math.max(0,Math.min(1,(today-spainStart+oneDay)/(totalDays*oneDay)));
  const progressText=beforeDeparture?'出發前 30 天倒數':today===depart?'今天出發':today>end?'旅程完成':`旅程第 ${Math.floor((today-spainStart)/oneDay)+1} / ${totalDays} 天`;
  const card=c.closest('.hero-card');
  card.classList.toggle('trip-complete',today>end);
  card.style.setProperty('--trip-progress',`${progress*100}%`);
  card.insertAdjacentHTML('beforeend',`<div class="trip-progress" role="progressbar" aria-label="${progressText}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress*100)}" aria-valuetext="${progressText}"><div class="trip-track"><div class="trip-fill"></div><div class="trip-runner" aria-hidden="true"><svg viewBox="0 0 32 36"><circle cx="19" cy="6" r="3"/><path class="runner-body" d="M17 12l-3 10"/><path class="runner-arm runner-arm-back" d="M17 13l-7 4-5-3"/><path class="runner-leg runner-leg-back" d="M14 22l-6 5-5-1"/><path class="runner-arm runner-arm-front" d="M17 13l5 6 5-2"/><path class="runner-leg runner-leg-front" d="M14 22l6 5 2 6"/></svg></div><div class="trip-finish" aria-hidden="true">⚑</div></div></div>`);

  if(today<depart){
    c.textContent=Math.ceil((depart-today)/oneDay)+' DAYS';
  }else if(today===depart){
    c.textContent='DEPART';
    ct.textContent='今晚 23:50 從 TPE 出發';
  }else if(today>=spainStart&&today<=end){
    const tripDay=Math.floor((today-spainStart)/oneDay)+1;
    c.textContent='DAY '+tripDay;
    ct.textContent=`西班牙旅程第 ${tripDay} / 17 天`;
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
    const demoContext=initDemoMode({itinerary:data.itinerary});

    const mapController=initTripMap({
      places:data.places,
      mapConfig:data.mapConfig
    });

    const ticketController=createTicketController({
      tickets:data.tickets,
      ticketDriveFileIds:data.ticketDriveFileIds
    });

    const itineraryController=initItinerary({
      itinerary:data.itinerary,
      places:data.places,
      tickets:data.tickets,
      ticketController
    });

    const demoDay=demoContext?.isDemo
      ?data.itinerary.find(day=>day.date===demoContext.previewDate)
      :null;
    if(demoDay){
      itineraryController.setCity(demoDay.city,{behavior:'auto'});
    }

    const hotelsController=initHotels({
      hotels:data.hotels,
      places:data.places,
      itineraryController
    });

    initTodayMode({
      itinerary:data.itinerary,
      places:data.places,
      hotels:data.hotels,
      tickets:data.tickets,
      mapConfig:data.mapConfig,
      demoContext,
      ticketController,
      itineraryController
    });

    initCountdown(data.config,demoContext);
    initCityReturn();
    initAppShell({itineraryController,hotelsController,mapController});
  }catch(error){
    console.error('Spain 2026 bootstrap failed',error);

    const empty=document.getElementById('empty');
    if(empty){
      empty.hidden=false;
      empty.textContent='行程資料載入失敗，請重新整理頁面。';
    }
  }
}

initPlaceLanguage();
initPwa();
bootstrap();
