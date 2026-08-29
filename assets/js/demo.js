const WEATHER_MODES=new Set(['trip','current']);
const SCENARIOS=[
  {id:'sevilla',label:'Sevilla 經典日',date:'2026-10-15',time:'13:30'},
  {id:'train-before',label:'ALVIA 出發前',date:'2026-10-20',time:'10:30'},
  {id:'train-onboard',label:'ALVIA 車上',date:'2026-10-20',time:'12:30'},
  {id:'train-arrived',label:'Madrid 抵達後',date:'2026-10-20',time:'15:00'},
  {id:'flight-return',label:'返程航班日',date:'2026-10-25',time:'18:30'}
];

function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function validTime(value){return /^([01]\d|2[0-3]):[0-5]\d$/.test(value||'');}

function getContext(itinerary){
  const params=new URLSearchParams(window.location.search);
  const isDemo=params.get('demo')==='1';
  if(!isDemo){
    return {isDemo:false,previewDate:params.get('previewDate'),previewTime:params.get('previewTime'),weatherMode:'trip'};
  }
  const dates=new Set(itinerary.map(day=>day.date));
  const previewDate=dates.has(params.get('previewDate'))?params.get('previewDate'):'2026-10-20';
  const previewTime=validTime(params.get('previewTime'))?params.get('previewTime'):'12:30';
  const weatherMode=WEATHER_MODES.has(params.get('weather'))?params.get('weather'):'current';
  return {isDemo:true,previewDate,previewTime,weatherMode};
}

function navigate({date,time,weatherMode,exit=false}){
  const url=new URL(window.location.href);
  if(exit){
    ['demo','previewDate','previewTime','weather'].forEach(key=>url.searchParams.delete(key));
  }else{
    url.searchParams.set('demo','1');
    url.searchParams.set('previewDate',date);
    url.searchParams.set('previewTime',time);
    if(weatherMode==='current') url.searchParams.set('weather','current');
    else url.searchParams.delete('weather');
  }
  window.location.assign(url.toString());
}

function mountPanel(context,itinerary){
  const days=itinerary.filter(day=>day.date>='2026-10-08'&&day.date<='2026-10-25');
  const presetId=SCENARIOS.find(s=>s.date===context.previewDate&&s.time===context.previewTime)?.id||'custom';
  const root=document.createElement('aside');
  root.className='demo-panel';
  root.innerHTML=`
    <button type="button" class="demo-toggle" id="demoToggle" aria-expanded="false">
      <span>DEMO</span><b>${escapeHtml(context.previewDate.slice(5).replace('-','/'))} · ${escapeHtml(context.previewTime)}</b>
    </button>
    <div class="demo-panel-body" id="demoPanelBody" hidden>
      <div class="demo-panel-head"><div><span>DEMO MODE</span><b>Today 測試控制台</b></div><button type="button" class="demo-close" id="demoClose">×</button></div>
      <label><span>Scenario</span><select id="demoScenario">
        <option value="custom">自訂</option>
        ${SCENARIOS.map(s=>`<option value="${s.id}" ${s.id===presetId?'selected':''}>${escapeHtml(s.label)}</option>`).join('')}
      </select></label>
      <div class="demo-grid">
        <label><span>日期</span><select id="demoDate">${days.map(day=>`<option value="${day.date}" ${day.date===context.previewDate?'selected':''}>${escapeHtml(day.dateLabel)} · ${escapeHtml(day.city)}</option>`).join('')}</select></label>
        <label><span>時間</span><input id="demoTime" type="time" value="${escapeHtml(context.previewTime)}"></label>
      </div>
      <label><span>天氣資料</span><select id="demoWeather">
        <option value="current" ${context.weatherMode==='current'?'selected':''}>Current · 該行程地點現在天氣</option>
        <option value="trip" ${context.weatherMode==='trip'?'selected':''}>行程日期預報</option>
      </select></label>
      <div class="demo-note">Current 只替換天氣日期；Today 行程仍使用上方設定的旅行日期與時間。</div>
      <div class="demo-actions"><button type="button" class="demo-apply" id="demoApply">套用 Demo</button><button type="button" class="demo-exit" id="demoExit">退出 Demo</button></div>
    </div>`;
  document.body.appendChild(root);

  const body=root.querySelector('#demoPanelBody');
  const toggle=root.querySelector('#demoToggle');
  const scenario=root.querySelector('#demoScenario');
  const date=root.querySelector('#demoDate');
  const time=root.querySelector('#demoTime');
  const weather=root.querySelector('#demoWeather');

  const setOpen=open=>{body.hidden=!open;toggle.setAttribute('aria-expanded',String(open));root.classList.toggle('open',open);};
  toggle.addEventListener('click',()=>setOpen(body.hidden));
  root.querySelector('#demoClose').addEventListener('click',()=>setOpen(false));
  scenario.addEventListener('change',()=>{
    const p=SCENARIOS.find(s=>s.id===scenario.value); if(!p) return;
    date.value=p.date; time.value=p.time;
  });
  date.addEventListener('change',()=>{scenario.value='custom';});
  time.addEventListener('change',()=>{scenario.value='custom';});
  root.querySelector('#demoApply').addEventListener('click',()=>navigate({date:date.value,time:validTime(time.value)?time.value:'12:00',weatherMode:weather.value}));
  root.querySelector('#demoExit').addEventListener('click',()=>navigate({exit:true}));
}

export function initDemoMode({itinerary}){
  const context=getContext(itinerary);
  if(context.isDemo){
    document.documentElement.classList.add('demo-mode');
    mountPanel(context,itinerary);
  }
  return context;
}
