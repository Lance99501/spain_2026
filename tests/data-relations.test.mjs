import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';

import {api} from '../assets/js/api.js';

const uniqueIds=(items,label)=>{
  const ids=items.map(item=>item.id);
  assert.ok(ids.every(Boolean),`${label} IDs must be non-empty`);
  assert.equal(new Set(ids).size,ids.length,`${label} IDs must be unique`);
  return new Set(ids);
};

test('bootstrap data passes the production relation validator',async()=>{
  const data=await api.getBootstrapData();

  assert.ok(data.places.length>0);
  assert.ok(data.itinerary.length>0);
  assert.ok(data.tickets.length>0);
});

test('all itinerary, hotel, ticket, and map relationships resolve',async()=>{
  const data=await api.getBootstrapData();
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

  assert.equal(mappedTicketIds.size,11,'exactly 11 tickets should have confirmed Drive mappings');
  assert.deepEqual(
    [...ticketIds].filter(ticketId=>!mappedTicketIds.has(ticketId)).sort(),
    ['tkt-casa-batllo'],
    'Casa Batllo should be the only ticket still waiting for a Drive file'
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

      const segments=[...item.segments,...(item.noteSegments||[])];
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
});

test('itinerary dates are unique, chronological, and within the configured trip',async()=>{
  const {config,itinerary}=await api.getBootstrapData();
  const dates=itinerary.map(day=>day.date);

  assert.equal(new Set(dates).size,dates.length,'itinerary dates must be unique');
  assert.deepEqual(dates,[...dates].sort(),'itinerary dates must be chronological');
  assert.equal(dates.at(0),config.departDate);
  assert.equal(dates.at(-1),config.endDate);
});

test('the service worker does not pre-cache private Google Drive ticket content',async()=>{
  const source=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  const cacheLists=['APP_SHELL','OPTIONAL_EXTERNAL'].map(name=>{
    const match=source.match(new RegExp(`const ${name}=\\[(.*?)\\];`,'s'));
    assert.ok(match,`${name} must remain statically inspectable`);
    return match[1];
  }).join('\n');

  assert.match(source,/const CACHE_VERSION='spain2026-\d{8}-v\d+';/);
  assert.doesNotMatch(cacheLists,/(?:drive|docs)\.google\.com|googleusercontent\.com/);
  assert.doesNotMatch(cacheLists,/qrcodejs/i);
});
