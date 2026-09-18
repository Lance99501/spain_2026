import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  buildManagedItem,
  insertItemChronologically,
  isSafeAutoCreateRow,
  likelyDuplicateOnDay,
  mergeManagedItem,
  primaryClock,
  timeDetail
} from '../scripts/notion-public-item.mjs';

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
