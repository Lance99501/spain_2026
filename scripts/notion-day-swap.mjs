// Plan first, then apply both days in memory. The publisher writes no itinerary
// source files until every blocker (including unrelated publisher guards) clears.
const CONTENT_FIELDS=['city','focusCity','title','sub','categories','mapUrl','items','tags','note'];

function status(value){return String(value||'').trim().toLowerCase();}

function stayFor(date,hotels){
  return hotels.filter(hotel=>hotel.checkIn<=date&&date<hotel.checkOut).map(hotel=>hotel.placeId).sort().join('|');
}

function locked(day,rows){
  if(day.categories?.includes('confirmed')) return 'day is confirmed';
  for(const item of day.items||[]){
    if(item.ticketId||item.transport?.status==='confirmed'||item.notionFixed===true||status(item.notionStatus)==='confirmed') return `item ${item.id} is fixed or ticketed`;
    const row=rows.get(item.sourceItineraryId);
    if(row&&(row.Fixed===true||status(row.Status)==='confirmed')) return `Notion row ${item.sourceItineraryId} is fixed or confirmed`;
  }
  return '';
}

export function planDaySwaps({days,rows,links,hotels=[]}){
  const dayByDate=new Map(days.map(entry=>[entry.day.date,entry]));
  const rowBySource=new Map(rows.filter(row=>row['Itinerary ID']).map(row=>[row['Itinerary ID'],row]));
  const candidates=new Map();
  const blockers=[];
  const mapped=new Map();
  for(const link of Object.values(links.itinerary||{})){
    if(link.targetType==='day'||link.targetType==='hotel'||link.targetType==='travelHint') continue;
    if(link.targetType==='item'&&link.sourceId) mapped.set(link.sourceId,link.targetId);
  }
  for(const entry of days){
    for(const item of entry.day.items||[]){
      const source=item.sourceItineraryId;
      if(!source) continue;
      const row=rowBySource.get(source);
      if(!row||!row.Date||row.Date===entry.day.date) continue;
      const target=dayByDate.get(row.Date);
      if(!target){blockers.push(`Date move ${source} has no existing target day ${row.Date}.`);continue;}
      if(mapped.has(source)&&mapped.get(source)!==item.id){blockers.push(`Mapping ${source} does not match item ${item.id}.`);continue;}
      const dates=[entry.day.date,row.Date].sort();
      candidates.set(dates.join('↔'),dates);
    }
  }
  const used=new Set();
  const swaps=[];
  for(const dates of candidates.values()){
    const [a,b]=dates;
    if(used.has(a)||used.has(b)){blockers.push(`Overlapping swaps involving ${a} / ${b} are unsafe.`);continue;}
    used.add(a);used.add(b);
    const left=dayByDate.get(a)?.day,right=dayByDate.get(b)?.day;
    if(!left||!right){blockers.push(`Both dates must exist: ${a}, ${b}.`);continue;}
    if(left.city!==right.city||!stayFor(a,hotels)||stayFor(a,hotels)!==stayFor(b,hotels)){
      blockers.push(`Swap ${a} ↔ ${b} crosses a city or lodging stay.`);continue;
    }
    if(hotels.some(hotel=>dates.includes(hotel.checkIn)||dates.includes(hotel.checkOut))){blockers.push(`Swap ${a} ↔ ${b} touches a hotel arrival or departure date.`);continue;}
    const reason=locked(left,rowBySource)||locked(right,rowBySource);
    if(reason){blockers.push(`Swap ${a} ↔ ${b} blocked: ${reason}.`);continue;}
    const itineraryRows=rows.filter(row=>row.Date===a||row.Date===b);
    if(itineraryRows.some(row=>row.Fixed===true||status(row.Status)==='confirmed')){
      blockers.push(`Swap ${a} ↔ ${b} contains a fixed or confirmed Notion row.`);continue;
    }
    const sourceCheck=(day,targetDate)=>{
      if(!(day.items||[]).some(item=>item.sourceItineraryId)) return `day ${day.date} has no linked Notion source to prove the reverse move`;
      for(const item of day.items||[]){
        if(!item.sourceItineraryId) continue;
        const row=rowBySource.get(item.sourceItineraryId);
        if(!row||row.Date!==targetDate) return `source ${item.sourceItineraryId} has not moved to ${targetDate}`;
        if(row.City&&status(row.City)!==status(day.city)) return `source ${item.sourceItineraryId} belongs to ${row.City}, expected ${day.city}`;
      }
      return '';
    };
    const incomplete=sourceCheck(left,b)||sourceCheck(right,a);
    if(incomplete){blockers.push(`Swap ${a} ↔ ${b} incomplete: ${incomplete}.`);continue;}
    const expected=new Set([...left.items,...right.items].map(item=>item.sourceItineraryId).filter(Boolean));
    const unexpected=itineraryRows.find(row=>row['Itinerary ID']&&!expected.has(row['Itinerary ID'])
      && (mapped.has(row['Itinerary ID'])||row.Fixed===true||status(row.Status)==='confirmed'));
    if(unexpected){blockers.push(`Swap ${a} ↔ ${b} has an unrelated mapped or locked row ${unexpected['Itinerary ID']}.`);continue;}
    // Day-level source links and hotel/travel anchors are tied to a calendar date.
    const anchored=Object.values(links.itinerary||{}).find(link=>{
      if(link.targetType==='day') return link.targetId===left.id||link.targetId===right.id;
      if(link.targetType==='travelHint') return [...left.items,...right.items].some(item=>item.id===link.targetId);
      return false;
    });
    if(anchored){blockers.push(`Swap ${a} ↔ ${b} includes a day or travel-hint mapping requiring review.`);continue;}
    swaps.push({dates,files:[dayByDate.get(a).name,dayByDate.get(b).name]});
  }
  return {swaps,blockers};
}

export function applyDaySwaps(days,swaps){
  const byDate=new Map(days.map(entry=>[entry.day.date,entry]));
  for(const {dates:[a,b]} of swaps){
    const left=byDate.get(a).day,right=byDate.get(b).day;
    const first=Object.fromEntries(CONTENT_FIELDS.filter(key=>key in left).map(key=>[key,structuredClone(left[key])]));
    const second=Object.fromEntries(CONTENT_FIELDS.filter(key=>key in right).map(key=>[key,structuredClone(right[key])]));
    for(const key of CONTENT_FIELDS){delete left[key];delete right[key];}
    Object.assign(left,second);
    Object.assign(right,first);
    // Calendar identity and flexPair hints stay with their respective dates.
  }
}
