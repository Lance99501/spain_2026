import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  buildManagedItem,
  buildTravelHint,
  insertItemChronologically,
  isSafeAutoCreateRow,
  likelyDuplicateOnDay,
  mappedStartTime,
  mergeManagedItem,
  primaryClock,
  syncMappedPublicItem,
  timeDetail
} from '../scripts/notion-public-item.mjs';

test('explicit flexible mapping parses approximate time only when opted in',()=>{
  const row={'Start Time':'約 11:30'};
  assert.equal(mappedStartTime(row,{syncPrimaryClock:true}),'11:30');
  assert.equal(mappedStartTime(row,{}),'約 11:30');
  assert.equal(mappedStartTime({'Start Time':'約 12:00'},{syncPrimaryClock:true}),'12:00');
  assert.equal(mappedStartTime({'Start Time':'待確認'},{syncPrimaryClock:true}),'');
});

const policy={
  enabled:true,
  statuses:['Planned','Idea'],
  flexibilities:['Flexible','Idea'],
  types:['Attraction','Meal','Free time','Other'],
  minItineraryNumber:63
};

test('safe flexible attractions can be auto-created but protected types/statuses cannot',()=>{
  const row={Name:'Flamenco｜Teatro Flamenco Triana｜首選',Date:'2026-10-17','Itinerary ID':'ITN-63',Status:'Planned',Flexibility:'Flexible',Type:'Attraction',Fixed:false,'Start Time':'19:30（首選；備選 21:00）'};
  assert.equal(isSafeAutoCreateRow(row,policy),true);
  assert.equal(isSafeAutoCreateRow({...row,Status:'Confirmed'},policy),false);
  assert.equal(isSafeAutoCreateRow({...row,Fixed:true},policy),false);
  assert.equal(isSafeAutoCreateRow({...row,Type:'Transit'},policy),false);
  assert.equal(isSafeAutoCreateRow({...row,Status:'Idea',Flexibility:'Idea',Type:'Day trip'},policy),false);
  assert.equal(isSafeAutoCreateRow({...row,Type:'Hotel'},policy),false);
  assert.equal(isSafeAutoCreateRow({...row,'Itinerary ID':'ITN-62'},policy),false);
});

test('managed item uses the existing timeline shape and keeps alternative time as a note',()=>{
  const row={Name:'Flamenco｜Teatro Flamenco Triana｜首選',Date:'2026-10-17','Itinerary ID':'ITN-63',Status:'Planned',Flexibility:'Flexible',Type:'Attraction',Fixed:false,'Start Time':'19:30（首選；備選 21:00）'};
  const item=buildManagedItem(row);
  assert.equal(item.id,'item-2026-10-17-itn-63');
  assert.equal(item.time,'19:30');
  assert.equal(item.startTime,'19:30');
  assert.deepEqual(item.segments,[{text:row.Name}]);
  assert.deepEqual(item.noteSegments,[{text:'首選；備選 21:00'}]);
  assert.equal(item.sourceItineraryId,'ITN-63');
  assert.equal(item.notionManaged,true);
  assert.equal(primaryClock(row['Start Time']),'19:30');
  assert.equal(timeDetail(row['Start Time']),'首選；備選 21:00');
  assert.equal(timeDetail('約 11:30'),'約');
});

test('managed items are inserted chronologically without reordering equal-time existing rows',()=>{
  const day={items:[
    {id:'a',time:'上午',segments:[{text:'A'}]},
    {id:'b',time:'下午',segments:[{text:'B'}]},
    {id:'c',time:'隨興',segments:[{text:'C'}]}
  ]};
  insertItemChronologically(day,{id:'x',time:'19:00',segments:[{text:'X'}]});
  assert.deepEqual(day.items.map(x=>x.id),['a','b','x','c']);
});

test('managed updates preserve unrelated fields and duplicate guard catches similar visible rows',()=>{
  const existing={id:'x',time:'19:30',segments:[{text:'Old'}],sourceItineraryId:'ITN-63',notionManaged:true,customField:'keep'};
  const row={Name:'New',Date:'2026-10-17','Itinerary ID':'ITN-63',Status:'Idea',Flexibility:'Idea',Type:'Attraction',Fixed:false,'Start Time':'20:00'};
  const next=mergeManagedItem(existing,row);
  assert.equal(next.customField,'keep');
  assert.equal(next.time,'20:00');
  assert.equal(next.segments[0].text,'New');
  assert.equal(likelyDuplicateOnDay({items:[{segments:[{text:'Teatro Flamenco Triana 首選'}]}]},{Name:'Flamenco｜Teatro Flamenco Triana｜首選'}),true);
  assert.equal(
    likelyDuplicateOnDay(
      {items:[{segments:[{text:'Catedral',placeId:'seg-catedral-de-segovia'}]}]},
      {Name:'塞哥維亞主教座堂｜Catedral de Segovia｜一般參觀'}
    ),
    true
  );
});


test('auto-managed item dates remain protected while same-day flexible time/name updates remain mergeable',()=>{
  const existing={id:'item-2026-10-17-itn-63',time:'19:30',startTime:'19:30',segments:[{text:'Old'}],sourceItineraryId:'ITN-63',notionManaged:true};
  const sameDay={Name:'Flamenco｜Teatro Flamenco Triana｜首選',Date:'2026-10-17','Itinerary ID':'ITN-63',Status:'Planned',Flexibility:'Flexible',Type:'Attraction',Fixed:false,'Start Time':'21:00（備選）'};
  const next=mergeManagedItem(existing,sameDay);
  assert.equal(next.id,existing.id);
  assert.equal(next.time,'21:00');
  assert.equal(next.startTime,'21:00');
  assert.equal(next.segments[0].text,sameDay.Name);
});


test('structured travel hint preserves only public-safe compact fields',()=>{
  const hint=buildTravelHint({
    'Itinerary ID':'ITN-74',
    'Travel From':'Hotel Royal Passeig de Gracia',
    'Travel Mode':'Taxi',
    'Travel Min':20,
    'Travel Duration':'15–20 分',
    'Leave Time':'07:20–07:25',
    'Travel Backup':'Diagonal → L5 → Sants Estació',
    'Travel Detail':'約 07:40 抵站；08:30 AVE',
    Notes:'private long note must not be copied'
  });
  assert.deepEqual(hint,{
    sourceItineraryId:'ITN-74',
    from:'Hotel Royal Passeig de Gracia',
    mode:'Taxi',
    durationMin:20,
    duration:'15–20 分',
    leaveTime:'07:20–07:25',
    backup:'Diagonal → L5 → Sants Estació',
    detail:'約 07:40 抵站；08:30 AVE'
  });
  assert.equal('Notes' in hint,false);
});


test('source-only rows do not create travel hints',()=>{
  assert.deepEqual(buildTravelHint({'Itinerary ID':'ITN-1'}),{});
});

test('same-date public-field sync preserves one Maps anchor and copies only allowlisted metadata',()=>{
  const existing={
    id:'item-2026-10-23-02',time:'下午',
    segments:[
      {text:'Parque del Retiro',placeId:'mad-parque-del-retiro'},
      {text:' → Puerta de Alcalá → Plaza de Cibeles'}
    ],
    sourceItineraryId:'ITN-53',customField:'keep'
  };
  const row={
    Name:'Retiro＋Puerta de Alcalá＋Cibeles｜城市景觀','Start Time':'Prado 後','End Time':'',
    Status:'Planned',Fixed:false,Flexibility:'Flexible',Area:'Retiro / Paseo del Prado / Cibeles',
    Type:'Free time',City:'Madrid',Notes:'must remain private'
  };
  const link={syncPublicFields:['Name','Start Time','End Time','Status','Fixed','Flexibility','Area','Type','City']};
  const result=syncMappedPublicItem(existing,row,link);
  assert.equal(result.error,undefined);
  assert.deepEqual(result.item.segments,[{text:row.Name,placeId:'mad-parque-del-retiro'}]);
  assert.equal(result.item.time,'Prado 後');
  assert.equal('startTime' in result.item,false);
  assert.equal(result.item.notionArea,row.Area);
  assert.equal(result.item.notionFixed,false);
  assert.equal(result.item.customField,'keep');
  assert.equal('Notes' in result.item,false);
});

test('mapped Name sync can strip an internal prefix but blocks multiple Maps anchors',()=>{
  const stripped=syncMappedPublicItem(
    {id:'royal',segments:[{text:'Old'}]},
    {Name:'Royal Madrid｜Palacio Real＋Almudena'},
    {syncPublicFields:['Name'],stripNamePrefix:'Royal Madrid｜'}
  );
  assert.equal(stripped.item.segments[0].text,'Palacio Real＋Almudena');
  assert.equal(stripped.item.notionName,'Royal Madrid｜Palacio Real＋Almudena');

  const blocked=syncMappedPublicItem(
    {id:'route',segments:[{text:'A',placeId:'a'},{text:'B',placeId:'b'}]},
    {Name:'A＋B'},
    {syncPublicFields:['Name']}
  );
  assert.match(blocked.error,/multiple Maps place anchors/);
});
