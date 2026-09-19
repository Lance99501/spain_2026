import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';

import {validateBootstrapData} from '../assets/js/data/validate.js';
import {dateInTripTimeZone,timeInTripTimeZone,tripTimeZoneAt} from '../assets/js/device-time.js';
import {resolveWeatherLocation} from '../assets/js/weather.js';

async function loadBootstrap(){
  const raw=await readFile(new URL('../data/generated/bootstrap.json',import.meta.url),'utf8');
  return validateBootstrapData(JSON.parse(raw));
}

const uniqueIds=(items,label)=>{
  const ids=items.map(item=>item.id);
  assert.ok(ids.every(Boolean),`${label} IDs must be non-empty`);
  assert.equal(new Set(ids).size,ids.length,`${label} IDs must be unique`);
  return new Set(ids);
};

test('generated bootstrap passes the production relation validator',async()=>{
  const data=await loadBootstrap();

  assert.equal(data.schemaVersion,1);
  assert.ok(data.places.length>0);
  assert.ok(data.itinerary.length>0);
  assert.ok(data.tickets.length>0);
});

test('all itinerary, hotel, ticket, and map relationships resolve',async()=>{
  const data=await loadBootstrap();
  const placeIds=uniqueIds(data.places,'place');
  const ticketIds=uniqueIds(data.tickets,'ticket');
  const mappedTicketIds=new Set(Object.keys(data.ticketDriveFileIds));
  uniqueIds(data.itinerary,'day');

  const itemIds=new Set();
  const referencedTicketIds=new Set();

  for(const hotel of data.hotels){
    assert.ok(placeIds.has(hotel.placeId),`hotel references unknown place ${hotel.placeId}`);
  }

  for(const ticket of data.tickets){
    for(const placeId of ticket.placeIds||[]){
      assert.ok(placeIds.has(placeId),`ticket ${ticket.id} references unknown place ${placeId}`);
    }
  }

  const unmappedTicketIds=[...ticketIds].filter(ticketId=>!mappedTicketIds.has(ticketId)).sort();
  assert.ok(
    unmappedTicketIds.every(ticketId=>ticketId==='tkt-casa-batllo'),
    `unexpected tickets without Drive mappings: ${unmappedTicketIds.join(', ')}`
  );

  for(const [ticketId,fileIds] of Object.entries(data.ticketDriveFileIds)){
    assert.ok(ticketIds.has(ticketId),`Drive mapping references unknown ticket ${ticketId}`);
    assert.ok(Array.isArray(fileIds)&&fileIds.length>0,`ticket ${ticketId} must map to at least one Drive file`);
    assert.equal(new Set(fileIds).size,fileIds.length,`ticket ${ticketId} contains duplicate Drive file IDs`);

    for(const fileId of fileIds){
      assert.match(fileId,/^[A-Za-z0-9_-]{10,}$/,`ticket ${ticketId} has an invalid Drive file ID`);
    }
  }

  for(const day of data.itinerary){
    for(const item of day.items){
      assert.ok(item.id,`day ${day.id} contains an item without an ID`);
      assert.ok(!itemIds.has(item.id),`duplicate itinerary item ID ${item.id}`);
      itemIds.add(item.id);

      const segments=[...(item.segments||[]),...(item.noteSegments||[])];
      for(const segment of segments){
        if(segment.placeId){
          assert.ok(placeIds.has(segment.placeId),`item ${item.id} references unknown place ${segment.placeId}`);
        }
      }

      if(item.ticketId){
        assert.ok(ticketIds.has(item.ticketId),`item ${item.id} references unknown ticket ${item.ticketId}`);
        referencedTicketIds.add(item.ticketId);
      }

      if(item.ticketAnchorPlaceId){
        assert.ok(
          item.segments.some(segment=>segment.placeId===item.ticketAnchorPlaceId),
          `item ${item.id} ticket anchor is not present in its visible segments`
        );
      }
    }
  }

  assert.deepEqual(
    [...referencedTicketIds].sort(),
    [...ticketIds].sort(),
    'every ticket should be reachable from the itinerary'
  );

  const routeCities=[
    ...data.mapConfig.mainRouteCities,
    ...data.mapConfig.sideRouteCities.flat()
  ];
  for(const city of routeCities){
    assert.ok(data.mapConfig.cityCenter[city],`map route city ${city} has no center`);
  }
  for(const day of data.itinerary){
    if(day.focusCity){
      assert.ok(data.mapConfig.cityCenter[day.focusCity],`day ${day.id} focusCity has no map/weather center`);
    }
  }
});

test('itinerary dates are unique, chronological, and within the configured trip',async()=>{
  const {config,itinerary}=await loadBootstrap();
  const dates=itinerary.map(day=>day.date);

  assert.equal(new Set(dates).size,dates.length,'itinerary dates must be unique');
  assert.deepEqual(dates,[...dates].sort(),'itinerary dates must be chronological');
  assert.equal(dates.at(0),config.departDate);
  assert.equal(dates.at(-1),config.endDate);
});

test('trip clock switches from Taipei to Spain at Barcelona arrival',async()=>{
  const {config}=await loadBootstrap();
  const beforeArrival=new Date('2026-10-09T11:24:00Z');
  const afterArrival=new Date('2026-10-09T11:26:00Z');

  assert.equal(tripTimeZoneAt(beforeArrival,config),'Asia/Taipei');
  assert.equal(dateInTripTimeZone(beforeArrival,config),'2026-10-09');
  assert.equal(timeInTripTimeZone(beforeArrival,config).text,'19:24');
  assert.equal(tripTimeZoneAt(afterArrival,config),'Europe/Madrid');
  assert.equal(dateInTripTimeZone(afterArrival,config),'2026-10-09');
  assert.equal(timeInTripTimeZone(afterArrival,config).text,'13:26');
});

test('Today weather follows each day focus city, including day trips',async()=>{
  const {itinerary,mapConfig}=await loadBootstrap();
  const expected=new Map([
    ['2026-10-08','Taipei'],
    ['2026-10-12','Sitges'],
    ['2026-10-16','Cordoba'],
    ['2026-10-22','Segovia']
  ]);

  for(const [date,key] of expected){
    const day=itinerary.find(entry=>entry.date===date);
    assert.equal(resolveWeatherLocation(day,mapConfig)?.key,key);
  }
  assert.ok(mapConfig.cityCenter.Toledo,'Toledo must be ready for a future focusCity assignment');
});

test('all currently locked tickets remain confirmed after the data refactor',async()=>{
  const {tickets}=await loadBootstrap();
  assert.ok(tickets.length>=12);
  assert.ok(tickets.every(ticket=>ticket.status==='confirmed'));
});

test('the service worker caches generated public data, not source modules or private Drive content',async()=>{
  const source=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  const cacheLists=['APP_SHELL','OPTIONAL_EXTERNAL'].map(name=>{
    const match=source.match(new RegExp(`const ${name}=\\[(.*?)\\];`,'s'));
    assert.ok(match,`${name} must remain statically inspectable`);
    return match[1];
  }).join('\n');

  assert.match(source,/const CACHE_VERSION='spain2026-\d{8}-v\d+';/);
  assert.match(cacheLists,/data\/generated\/bootstrap\.json/);
  assert.doesNotMatch(cacheLists,/data\/source\//);
  assert.doesNotMatch(cacheLists,/(?:drive|docs)\.google\.com|googleusercontent\.com/);
  assert.doesNotMatch(cacheLists,/qrcodejs/i);
});
