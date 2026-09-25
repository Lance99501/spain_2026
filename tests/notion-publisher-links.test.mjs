import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {test} from 'node:test';

async function readJson(url){return JSON.parse(await readFile(url,'utf8'));}

test('Notion publisher deterministic links resolve to existing GitHub targets',async()=>{
  const links=await readJson(new URL('../config/notion-links.json',import.meta.url));
  const tickets=await readJson(new URL('../data/source/tickets.json',import.meta.url));
  const hotels=await readJson(new URL('../data/source/hotels.json',import.meta.url));
  const dir=new URL('../data/source/itinerary/',import.meta.url);
  const files=(await readdir(dir)).filter(name=>name.endsWith('.json'));
  const days=await Promise.all(files.map(name=>readJson(new URL(name,dir))));
  assert.equal(links.schemaVersion,2);
  const dayIds=new Set(days.map(day=>day.id));
  const itemIds=new Set(days.flatMap(day=>day.items.map(item=>item.id)));
  const ticketIds=new Set(tickets.map(ticket=>ticket.id));
  const hotelIds=new Set(hotels.map(hotel=>hotel.placeId));
  const sourceIds=new Set();
  const targetKeys=new Set();
  for(const [pageId,link] of Object.entries(links.itinerary||{})){
    assert.match(pageId,/^[0-9a-f-]{36}$/i);
    assert.ok(link.sourceId,'itinerary mapping requires sourceId');
    assert.ok(!sourceIds.has(link.sourceId),`duplicate Notion sourceId ${link.sourceId}`);
    sourceIds.add(link.sourceId);
    if(link.targetType==='day') assert.ok(dayIds.has(link.targetId),`missing mapped day ${link.targetId}`);
    else if(link.targetType==='item'||link.targetType==='travelHint') assert.ok(itemIds.has(link.targetId),`missing mapped item ${link.targetId}`);
    else if(link.targetType==='hotel'){
      assert.ok(hotelIds.has(link.targetId),`missing mapped hotel ${link.targetId}`);
      assert.ok(['checkIn','checkOut'].includes(link.stayRole),`invalid hotel stayRole ${link.stayRole}`);
    }else assert.fail(`unsupported targetType ${link.targetType}`);
    const key=link.targetType==='hotel'?`${link.targetType}:${link.targetId}:${link.stayRole}`:`${link.targetType}:${link.targetId}`;
    assert.ok(!targetKeys.has(key),`duplicate publish target ${key}`);
    targetKeys.add(key);
  }
  for(const [pageId,link] of Object.entries(links.reservations||{})){
    assert.match(pageId,/^[0-9a-f-]{36}$/i);
    const modes=[Boolean(link.ignore),Boolean(link.hotelPlaceId),Boolean(link.ticketId)||Array.isArray(link.ticketIds)].filter(Boolean);
    assert.equal(modes.length,1,`reservation ${pageId} must have exactly one publish mode`);
    if(link.ignore){assert.ok(link.reason,'ignored reservation requires a reason');continue;}
    if(link.hotelPlaceId){assert.ok(hotelIds.has(link.hotelPlaceId),`missing mapped hotel ${link.hotelPlaceId}`);continue;}
    const ids=Array.isArray(link.ticketIds)?link.ticketIds:[link.ticketId];
    assert.ok(ids.length>0,`reservation ${pageId} requires at least one ticket`);
    assert.equal(new Set(ids).size,ids.length,`reservation ${pageId} has duplicate ticket IDs`);
    ids.forEach(id=>assert.ok(ticketIds.has(id),`missing mapped ticket ${id}`));
  }
});

test('locked itinerary and reservation lifecycle mappings stay explicit',async()=>{
  const links=await readJson(new URL('../config/notion-links.json',import.meta.url));
  assert.equal(Object.keys(links.itinerary).length,38);
  assert.equal(links.itinerary['3df91e9f-a395-8116-a27d-f181b478c638'].sourceId,'ITN-66');
  assert.equal(links.itinerary['3df91e9f-a395-8116-a27d-f181b478c638'].targetId,'item-2026-10-22-cathedral');
  assert.equal(links.itinerary['3b891e9f-a395-813a-9f28-f164dcaa046e'].sourceId,'ITN-16');
  assert.equal(links.itinerary['3b891e9f-a395-813a-9f28-f164dcaa046e'].targetId,'day-2026-10-22');
  assert.equal(links.reservations['3df91e9f-a395-812f-9527-eba16ddb35d9'].ticketId,'tkt-renfe-madrid-segovia');
  assert.equal(links.reservations['3df91e9f-a395-810a-9d06-f8b962f1a9c9'].ticketId,'tkt-renfe-segovia-madrid');
  assert.equal(Object.keys(links.reservations).length,22);
  assert.equal(links.reservations['3b891e9f-a395-8142-9f58-c50ddc4cb872'].ignore,true);
  assert.equal(links.reservations['3db91e9f-a395-81a2-83b2-cacdb93119a2'].hotelPlaceId,'sev-abba-sevilla');
});

test('Madrid weather-flex rows have stable same-date mappings',async()=>{
  const links=await readJson(new URL('../config/notion-links.json',import.meta.url));
  const day21=await readJson(new URL('../data/source/itinerary/2026-10-21.json',import.meta.url));
  const day23=await readJson(new URL('../data/source/itinerary/2026-10-23.json',import.meta.url));
  const expected=[
    ['3b891e9f-a395-819d-9006-c0c55205093c','ITN-50','item-2026-10-21-01'],
    ['3b891e9f-a395-8131-98ac-c28f6bbaf78a','ITN-51','item-2026-10-21-02'],
    ['3b891e9f-a395-812f-a6b3-d1de50b584b3','ITN-52','item-2026-10-23-01'],
    ['3b891e9f-a395-81f3-ba97-cd14079b6b22','ITN-53','item-2026-10-23-02']
  ];
  for(const [pageId,sourceId,targetId] of expected){
    assert.equal(links.itinerary[pageId].sourceId,sourceId);
    assert.equal(links.itinerary[pageId].targetId,targetId);
  }
  assert.deepEqual(day21.items.map(item=>item.sourceItineraryId),['ITN-50','ITN-51']);
  assert.deepEqual(day23.items.map(item=>item.sourceItineraryId),['ITN-52','ITN-53']);
  assert.equal(day21.flexPair.id,'madrid-weather-21-23');
  assert.equal(day23.flexPair.id,'madrid-weather-21-23');
});

test('multi-ticket, shared-ticket, hotel, and ignore policies are encoded explicitly',async()=>{
  const links=await readJson(new URL('../config/notion-links.json',import.meta.url));
  assert.deepEqual(links.reservations['3b891e9f-a395-81ac-a9ce-e6a93afac79a'].ticketIds,['tkt-emirates-outbound','tkt-emirates-return']);
  assert.equal(links.reservations['3bf91e9f-a395-816f-9f10-cc2d1327764a'].ticketId,'tkt-alhambra');
  assert.equal(links.reservations['3b891e9f-a395-8162-bf8c-effccc4008e3'].hotelPlaceId,'bcn-hotel-royal-passeig-de-gracia');
  assert.equal(links.itinerary['3b891e9f-a395-8138-922d-c2b16c0155b3'].stayRole,'checkIn');
  assert.equal(links.itinerary['3b891e9f-a395-8176-a172-c3ef30071a7d'].stayRole,'checkOut');
  assert.equal(links.reservations['3cf91e9f-a395-8100-ae2c-c58a585ac333'].ignore,true);
});

test('confirmed Sevilla replacement override is public-safe and keeps the protected stay window',async()=>{
  const overrides=await readJson(new URL('../config/hotel-overrides.json',import.meta.url));
  assert.equal(overrides.schemaVersion,1);
  const replacement=overrides.overrides.find(x=>x.targetPlaceId==='sev-abba-sevilla');
  assert.ok(replacement);
  assert.equal(replacement.publicPlace.name,'Arroyo 3 Apartments');
  assert.deepEqual(replacement.expectedStay,{checkIn:'2026-10-14',checkOut:'2026-10-18'});
  const serialized=JSON.stringify(replacement).toLowerCase();
  for(const forbidden of ['booking ref','pincode','pin碼','payment','amount','traveler']) assert.ok(!serialized.includes(forbidden),`public hotel override leaked ${forbidden}`);
});

test('Córdoba mappings still point at confirmed data',async()=>{
  const links=await readJson(new URL('../config/notion-links.json',import.meta.url));
  const tickets=await readJson(new URL('../data/source/tickets.json',import.meta.url));
  const day=await readJson(new URL('../data/source/itinerary/2026-10-16.json',import.meta.url));
  assert.equal(links.itinerary['3b891e9f-a395-811f-88ce-ed6f747522dc'].targetId,'item-2026-10-16-02');
  assert.equal(links.itinerary['3b891e9f-a395-810d-a8ee-d175d0165570'].targetId,'day-2026-10-16');
  assert.equal(links.reservations['3db91e9f-a395-8105-8094-cc7cf8abd64d'].ticketId,'tkt-mezquita-cordoba');
  assert.equal(links.reservations['3db91e9f-a395-81f5-8576-ca42d8c71c00'].ticketId,'tkt-renfe-cordoba-sevilla');
  const mezquita=day.items.find(item=>item.id==='item-2026-10-16-02');
  const renfe=day.items.find(item=>item.id==='item-2026-10-16-04');
  assert.equal(mezquita?.ticketId,'tkt-mezquita-cordoba');
  assert.equal(renfe?.ticketId,'tkt-renfe-cordoba-sevilla');
  assert.equal(renfe?.transport?.status,'confirmed');
  assert.equal(tickets.find(ticket=>ticket.id==='tkt-mezquita-cordoba')?.status,'confirmed');
  assert.equal(tickets.find(ticket=>ticket.id==='tkt-renfe-cordoba-sevilla')?.status,'confirmed');
});
