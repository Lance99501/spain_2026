const API_BASE='https://api.open-meteo.com/v1/forecast';

const DAY_LOCATION_OVERRIDES={
  'day-2026-10-08':{
    key:'Taipei',
    label:'桃園機場｜TPE',
    lat:25.0797,
    lng:121.2342,
    timeZone:'Asia/Taipei'
  },
  'day-2026-10-12':{key:'Sitges'},
  'day-2026-10-16':{key:'Cordoba'},
  'day-2026-10-23':{key:'Segovia'}
};

const LABELS={
  Barcelona:'巴塞隆納｜Barcelona',
  Sevilla:'塞維亞｜Sevilla',
  Granada:'格拉納達｜Granada',
  Madrid:'馬德里｜Madrid',
  Cordoba:'科爾多瓦｜Córdoba',
  Segovia:'塞哥維亞｜Segovia',
  Sitges:'錫切斯｜Sitges'
};

function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function dateInTimeZone(date,timeZone){
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

function daysBetween(start,end){
  const toUtc=value=>{
    const [y,m,d]=value.split('-').map(Number);
    return Date.UTC(y,m-1,d);
  };
  return Math.round((toUtc(end)-toUtc(start))/86400000);
}

function weatherMeta(code){
  if(code===0) return {icon:'☀️',label:'晴朗'};
  if(code===1) return {icon:'🌤️',label:'大致晴朗'};
  if(code===2) return {icon:'⛅',label:'局部多雲'};
  if(code===3) return {icon:'☁️',label:'陰天'};
  if(code===45||code===48) return {icon:'🌫️',label:'有霧'};
  if(code>=51&&code<=57) return {icon:'🌦️',label:'毛毛雨'};
  if(code>=61&&code<=67) return {icon:'🌧️',label:'下雨'};
  if(code>=71&&code<=77) return {icon:'🌨️',label:'降雪'};
  if(code>=80&&code<=82) return {icon:'🌦️',label:'陣雨'};
  if(code>=85&&code<=86) return {icon:'🌨️',label:'陣雪'};
  if(code>=95) return {icon:'⛈️',label:'雷雨'};
  return {icon:'🌤️',label:'天氣變化'};
}

function resolveLocation(day,mapConfig){
  const override=DAY_LOCATION_OVERRIDES[day.id];
  if(override?.lat&&override?.lng) return override;

  const key=override?.key||day.city;
  const coords=mapConfig?.cityCenter?.[key];
  if(!coords) return null;

  return {
    key,
    label:LABELS[key]||key,
    lat:coords[0],
    lng:coords[1],
    timeZone:'Europe/Madrid'
  };
}

function apiUrl(location){
  const params=new URLSearchParams({
    latitude:String(location.lat),
    longitude:String(location.lng),
    current:'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
    hourly:'temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m',
    daily:'temperature_2m_max,temperature_2m_min',
    timezone:location.timeZone,
    forecast_days:'16'
  });
  return `${API_BASE}?${params.toString()}`;
}

function number(value,fallback='—'){
  return Number.isFinite(Number(value))?Math.round(Number(value)):fallback;
}

function hourlyWindow(data,targetDate,targetTime){
  const times=data.hourly?.time||[];
  const hour=(targetTime||'12:00').slice(0,2);
  const key=`${targetDate}T${hour}:00`;
  let start=times.findIndex(time=>time>=key);
  if(start<0) start=times.findIndex(time=>time.startsWith(targetDate));
  if(start<0) return [];

  return times.slice(start,start+6).map((time,offset)=>{
    const index=start+offset;
    return {
      time:time.slice(11,16),
      temp:data.hourly.temperature_2m?.[index],
      apparent:data.hourly.apparent_temperature?.[index],
      rain:data.hourly.precipitation_probability?.[index],
      code:data.hourly.weather_code?.[index],
      wind:data.hourly.wind_speed_10m?.[index]
    };
  });
}

function dailyFor(data,targetDate){
  const index=(data.daily?.time||[]).indexOf(targetDate);
  if(index<0) return null;
  return {
    max:data.daily.temperature_2m_max?.[index],
    min:data.daily.temperature_2m_min?.[index]
  };
}

function renderUnavailable(root,location,message){
  root.innerHTML=`<div class="weather-compact">
    <div class="weather-kicker">WEATHER · ${escapeHtml(location?.label||'今日')}</div>
    <div class="weather-message">${escapeHtml(message)}</div>
  </div>`;
}

export function initTodayWeather({
  root,day,mapConfig,previewDate=null,previewTime=null,isPreview=false,weatherMode='trip',isDemo=false
}){
  if(!root) return {destroy(){}};

  const location=resolveLocation(day,mapConfig);
  if(!location){
    renderUnavailable(root,null,'目前沒有這一天的天氣位置資料');
    return {destroy(){}};
  }

  let controller=new AbortController();
  let onlineHandler=null;

  async function load(){
    controller.abort();
    controller=new AbortController();

    if(navigator.onLine===false){
      renderUnavailable(root,location,'天氣需要網路連線；行程與已快取內容仍可離線使用。');
      onlineHandler=()=>load();
      window.addEventListener('online',onlineHandler,{once:true});
      return;
    }

    const localToday=dateInTimeZone(new Date(),location.timeZone);
    const currentMode=weatherMode==='current';
    const targetDate=currentMode?localToday:(previewDate||localToday);
    const delta=daysBetween(localToday,targetDate);

    if(!currentMode&&isPreview&&(delta<0||delta>15)){
      renderUnavailable(root,location,'此日期尚未進入約 16 天的天氣預報範圍。');
      return;
    }

    root.innerHTML=`<div class="weather-compact weather-loading">
      <div class="weather-kicker">WEATHER${currentMode?' CURRENT':''} · ${escapeHtml(location.label)}</div>
      <div class="weather-message">正在取得天氣…</div>
    </div>`;

    const timeout=window.setTimeout(()=>controller.abort(),8000);

    try{
      const response=await fetch(apiUrl(location),{
        signal:controller.signal,
        headers:{accept:'application/json'}
      });
      if(!response.ok) throw new Error(`Weather HTTP ${response.status}`);

      const data=await response.json();
      const targetTime=currentMode
        ?(data.current?.time?.slice(11,16)||'12:00')
        :isPreview
          ?(previewTime||'12:00')
          :(data.current?.time?.slice(11,16)||'12:00');
      const hours=hourlyWindow(data,targetDate,targetTime);
      const daily=dailyFor(data,targetDate);

      if(!hours.length||!daily){
        renderUnavailable(root,location,'這一天目前沒有可用的天氣預報。');
        return;
      }

      const currentHour=hours[0];
      const useCurrent=(currentMode||!isPreview)&&data.current?.time?.startsWith(targetDate);
      const temp=useCurrent?data.current.temperature_2m:currentHour.temp;
      const apparent=useCurrent?data.current.apparent_temperature:currentHour.apparent;
      const code=useCurrent?data.current.weather_code:currentHour.code;
      const wind=useCurrent?data.current.wind_speed_10m:currentHour.wind;
      const meta=weatherMeta(Number(code));
      const rainValues=hours.map(hour=>Number(hour.rain)).filter(Number.isFinite);
      const rainMax=rainValues.length?Math.max(...rainValues):null;

      root.innerHTML=`<div class="weather-compact">
        <div class="weather-kicker">
          <span>${isDemo?'DEMO · ':''}WEATHER${currentMode?' CURRENT':''} · ${escapeHtml(location.label)}</span>
          <small>Open-Meteo</small>
        </div>
        <div class="weather-summary">
          <div class="weather-temp"><span aria-hidden="true">${meta.icon}</span><b>${number(temp)}°</b></div>
          <div class="weather-condition">
            <strong>${escapeHtml(meta.label)}</strong>
            <small>最高 ${number(daily.max)}° · 最低 ${number(daily.min)}°</small>
          </div>
          <div class="weather-stats">
            <span>體感 <b>${number(apparent)}°</b></span>
            <span>風 <b>${number(wind)} km/h</b></span>
            <span>未來 6h 降雨 <b>${rainMax===null?'—':`${number(rainMax)}%`}</b></span>
          </div>
        </div>
        <div class="weather-hours" aria-label="未來六小時天氣">
          ${hours.map(hour=>{
            const hourMeta=weatherMeta(Number(hour.code));
            return `<div class="weather-hour">
              <time>${escapeHtml(hour.time)}</time>
              <span aria-hidden="true">${hourMeta.icon}</span>
              <b>${number(hour.temp)}°</b>
              <small>${hour.rain==null?'—':`${number(hour.rain)}%`}</small>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }catch(error){
      if(error?.name!=='AbortError'){
        renderUnavailable(root,location,'暫時無法取得天氣，稍後重新開啟 Today 即可再試。');
      }else if(navigator.onLine!==false){
        renderUnavailable(root,location,'天氣連線逾時，稍後再試。');
      }
    }finally{
      window.clearTimeout(timeout);
    }
  }

  load();

  return {
    destroy(){
      controller.abort();
      if(onlineHandler) window.removeEventListener('online',onlineHandler);
    }
  };
}
