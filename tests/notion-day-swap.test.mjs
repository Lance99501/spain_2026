import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {planDaySwaps,applyDaySwaps} from '../scripts/notion-day-swap.mjs';

async function fixture(){
  const dates=['21','23','24'];
  const days=await Promise.all(dates.map(async date=>({name:`2026-10-${date}.json`,day:JSON.parse(await readFile(new URL(`../data/source/itinerary/2026-10-${date}.json`,import.meta.url),'utf8'))})));
  const hotels=JSON.parse(await readFile(new URL('../data/source/hotels.json',import.meta.url),'utf8'));
  const rows=days.flatMap(({day})=>day.items.filter(item=>item.sourceItineraryId).map(item=>({'Itinerary ID':item.sourceItineraryId,Date:day.date,City:day.city,Status:'Planned',Fixed:false})));
  return {days,rows,hotels,links:{itinerary:{}}};
}

function unlockFixture(data){
  for(const {day} of data.days){
    day.categories=day.categories.filter(category=>category!=='confirmed');
    for(const item of day.items){
      delete item.ticketId;
      item.notionStatus='Planned';
      item.notionFixed=false;
      item.transport&&delete item.transport.status;
    }
  }
}

test('purchased Madrid Palace blocks a full-day swap',async()=>{
  const data=await fixture();
  for(const row of data.rows) if(['ITN-50','ITN-51'].includes(row['Itinerary ID'])) row.Date='2026-10-23';
  const plan=planDaySwaps(data);
  assert.equal(plan.swaps.length,0);
  assert.match(plan.blockers.join(' '),/confirmed|fixed or ticketed/);
});

test('a complete Madrid pair swaps both payloads, retaining calendar identities and Toledo backup on 24',async()=>{
  const data=await fixture();
  unlockFixture(data);
  for(const row of data.rows) row.Date=['ITN-50','ITN-51'].includes(row['Itinerary ID'])?'2026-10-24':row['Itinerary ID']==='ITN-65'?'2026-10-21':row.Date;
  const original=data.days.map(({day})=>structuredClone(day));
  const plan=planDaySwaps(data);
  assert.deepEqual(plan.blockers,[]);
  assert.equal(plan.swaps.length,1);
  applyDaySwaps(data.days,plan.swaps);
  const on21=data.days[0].day,on24=data.days[2].day;
  assert.equal(on21.title,original[2].title);
  assert.equal(on24.title,original[0].title);
  assert.equal(on21.date,original[0].date);
  assert.equal(on24.mapUrl,original[0].mapUrl);
  assert.equal(on24.dateNote,original[2].dateNote);
  assert.equal(on21.dateNote,undefined);
  assert.equal(on21.flexPair?.pairedDate,original[0].flexPair?.pairedDate);
});

test('a partial swap blocks both files',async()=>{
  const data=await fixture();
  unlockFixture(data);
  data.rows.find(row=>row['Itinerary ID']==='ITN-50').Date='2026-10-23';
  const plan=planDaySwaps(data);
  assert.equal(plan.swaps.length,0);
  assert.match(plan.blockers.join(' '),/incomplete/);
});

test('a ticketed item blocks an otherwise complete exchange',async()=>{
  const data=await fixture();
  unlockFixture(data);
  for(const row of data.rows) if(['ITN-50','ITN-51'].includes(row['Itinerary ID'])) row.Date='2026-10-23';
  else if(['ITN-52','ITN-53'].includes(row['Itinerary ID'])) row.Date='2026-10-21';
  data.days[0].day.items[0].ticketId='test-ticket';
  const plan=planDaySwaps(data);
  assert.equal(plan.swaps.length,0);
  assert.match(plan.blockers.join(' '),/ticketed/);
});
