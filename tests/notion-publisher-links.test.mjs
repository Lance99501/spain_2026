import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {test} from 'node:test';

async function readJson(url){return JSON.parse(await readFile(url,'utf8'));}

test('Notion publisher links resolve to existing GitHub targets',async()=>{
  const links=await readJson(new URL('../config/notion-links.json',import.meta.url));
  const tickets=await readJson(new URL('../data/source/tickets.json',import.meta.url));
  const dir=new URL('../data/source/itinerary/',import.meta.url);
  const files=(await readdir(dir)).filter(name=>name.endsWith('.json'));
  const days=await Promise.all(files.map(name=>readJson(new URL(name,dir))));

  assert.equal(links.schemaVersion,1);

  const dayIds=new Set(days.map(day=>day.id));
  const itemIds=new Set(days.flatMap(day=>day.items.map(item=>item.id)));
  const ticketIds=new Set(tickets.map(ticket=>ticket.id));
  const sourceIds=new Set();
  const targetKeys=new Set();

  for(const [pageId,link] of Object.entries(links.itinerary||{})){
    assert.match(pageId,/^[0-9a-f-]{36}$/i);
    assert.ok(link.sourceId,'itinerary mapping requires sourceId');
    assert.ok(!sourceIds.has(link.sourceId),`duplicate Notion sourceId ${link.sourceId}`);
    sourceIds.add(link.sourceId);

    if(link.targetType==='day') assert.ok(dayIds.has(link.targetId),`missing mapped day ${link.targetId}`);
    else if(link.targetType==='item') assert.ok(itemIds.has(link.targetId),`missing mapped item ${link.targetId}`);
    else assert.fail(`unsupported targetType ${link.targetType}`);

    const key=`${link.targetType}:${link.targetId}`;
    assert.ok(!targetKeys.has(key),`duplicate publish target ${key}`);
    targetKeys.add(key);
  }

  for(const [pageId,link] of Object.entries(links.reservations||{})){
    assert.match(pageId,/^[0-9a-f-]{36}$/i);
    assert.ok(ticketIds.has(link.ticketId),`missing mapped ticket ${link.ticketId}`);
  }
});

test('initial Córdoba mappings point at confirmed data',async()=>{
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
