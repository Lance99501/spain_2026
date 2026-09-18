function normalize(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/[→↔｜|/+·•–—\-:：,，.。()（）\[\]{}]/g,' ').replace(/\s+/g,' ').trim();
}

export function primaryClock(value){
  return String(value||'').match(/(?:^|\s)([01]\d|2[0-3]):[0-5]\d/)?.[0]?.trim()||'';
}

export function timeDetail(value){
  const raw=String(value||'').trim();
  const clock=primaryClock(raw);
  if(!clock) return '';
  const index=raw.indexOf(clock);
  const before=raw.slice(0,index).trim().replace(/[（(]\s*$/,'').trim();
  const after=raw.slice(index+clock.length).trim().replace(/^[（(]\s*/,'').replace(/\s*[）)]$/,'').trim();
  return [before,after].filter(Boolean).join(' · ');
}

export function isSafeAutoCreateRow(row,policy={}){
  const statuses=new Set(policy.statuses||[]);
  const flexibilities=new Set(policy.flexibilities||[]);
  const types=new Set(policy.types||[]);
  if(policy.enabled===false) return false;
  if(!row?.Name||!row?.Date||!row?.['Itinerary ID']) return false;
  const sourceNumber=Number(String(row['Itinerary ID']).match(/(\d+)$/)?.[1]||0);
  if(policy.minItineraryNumber&&sourceNumber<policy.minItineraryNumber) return false;
  if(row.Fixed===true) return false;
  if(!statuses.has(row.Status)) return false;
  if(!flexibilities.has(row.Flexibility)) return false;
  if(!types.has(row.Type)) return false;
  if(String(row.Name).length>160||String(row['Start Time']||'').length>80) return false;
  return true;
}

export function buildManagedItem(row,{id}={}){
  const clock=primaryClock(row['Start Time']);
  const detail=timeDetail(row['Start Time']);
  const sourceId=String(row['Itinerary ID']);
  const item={
    id:id||`item-${row.Date}-${sourceId.toLowerCase()}`,
    time:clock||'彈性',
    segments:[{text:String(row.Name).trim()}],
    sourceItineraryId:sourceId,
    notionManaged:true,
    notionStatus:row.Status||null,
    notionFlexibility:row.Flexibility||null
  };
  if(clock) item.startTime=clock;
  if(detail) item.noteSegments=[{text:detail}];
  return item;
}

export function mergeManagedItem(existing,row){
  const next=buildManagedItem(row,{id:existing.id});
  const preserved={...existing};
  for(const key of ['time','segments','sourceItineraryId','notionManaged','notionStatus','notionFlexibility','startTime','noteSegments']){
    delete preserved[key];
  }
  return {...preserved,...next};
}

export function itemOrderScore(item){
  const clock=primaryClock(item?.startTime||item?.time);
  if(clock){
    const [h,m]=clock.split(':').map(Number);
    return h*60+m;
  }
  const value=String(item?.time||'');
  const dayparts=[
    ['凌晨',120],['早上',480],['上午',540],['白天',600],['中午',720],
    ['下午',900],['傍晚',1080],['晚上',1200],['隨興',2000],['彈性',2100]
  ];
  return dayparts.find(([label])=>value.includes(label))?.[1]??1800;
}

export function insertItemChronologically(day,item){
  const score=itemOrderScore(item);
  const index=day.items.findIndex(existing=>itemOrderScore(existing)>score);
  if(index<0) day.items.push(item);
  else day.items.splice(index,0,item);
}

function segmentText(segment){
  return [segment?.text||'',segment?.placeId||''].join(' ');
}

function tokens(value){
  return [...new Set(normalize(value).split(' ').filter(token=>token.length>=3))];
}

export function likelyDuplicateOnDay(day,row){
  const source=tokens(row?.Name);
  if(!source.length) return false;
  return (day?.items||[]).some(item=>
    [...(item?.segments||[]),...(item?.noteSegments||[])].some(segment=>{
      const target=tokens(segmentText(segment));
      if(!target.length) return false;
      const targetSet=new Set(target);
      const common=source.filter(token=>targetSet.has(token)).length;
      return common/Math.min(source.length,target.length)>=0.66;
    })
  );
}
