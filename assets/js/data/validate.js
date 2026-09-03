function assertArray(value,label){
  if(!Array.isArray(value)) throw new Error(`${label} must be an array`);
}

function assertObject(value,label){
  if(!value||typeof value!=='object'||Array.isArray(value)){
    throw new Error(`${label} must be an object`);
  }
}

function assertUnique(items,key,label){
  const seen=new Set();
  for(const item of items){
    const value=item?.[key];
    if(!value) throw new Error(`${label} missing ${key}`);
    if(seen.has(value)) throw new Error(`Duplicate ${label} ${key}: ${value}`);
    seen.add(value);
  }
}

export function validateBootstrapData(data){
  assertObject(data,'bootstrap');
  if(data.schemaVersion!==1) throw new Error(`Unsupported bootstrap schemaVersion: ${data.schemaVersion}`);

  assertObject(data.config,'config');
  assertArray(data.places,'places');
  assertArray(data.hotels,'hotels');
  assertArray(data.tickets,'tickets');
  assertArray(data.itinerary,'itinerary');
  assertObject(data.ticketDriveFileIds,'ticketDriveFileIds');
  assertObject(data.mapConfig,'mapConfig');

  assertUnique(data.places,'id','place');
  assertUnique(data.tickets,'id','ticket');
  assertUnique(data.itinerary,'id','day');

  const placeIds=new Set(data.places.map(x=>x.id));
  const ticketIds=new Set(data.tickets.map(x=>x.id));
  const itemIds=new Set();

  for(const hotel of data.hotels){
    if(!placeIds.has(hotel.placeId)) throw new Error(`Unknown hotel placeId: ${hotel.placeId}`);
  }

  for(const ticket of data.tickets){
    for(const placeId of ticket.placeIds||[]){
      if(!placeIds.has(placeId)) throw new Error(`Ticket ${ticket.id} references unknown place ${placeId}`);
    }
  }

  for(const [ticketId,fileIds] of Object.entries(data.ticketDriveFileIds)){
    if(!ticketIds.has(ticketId)) throw new Error(`Drive mapping references unknown ticket ${ticketId}`);
    if(!Array.isArray(fileIds)||!fileIds.length){
      throw new Error(`Drive mapping ${ticketId} must contain at least one file ID`);
    }
    if(new Set(fileIds).size!==fileIds.length){
      throw new Error(`Drive mapping ${ticketId} contains duplicate file IDs`);
    }
    for(const fileId of fileIds){
      if(!/^[A-Za-z0-9_-]{10,}$/.test(fileId)){
        throw new Error(`Drive mapping ${ticketId} contains invalid file ID`);
      }
    }
  }

  for(const day of data.itinerary){
    if(!Array.isArray(day.items)) throw new Error(`Day ${day.id} items must be an array`);

    for(const item of day.items){
      if(!item.id) throw new Error(`Day ${day.id} contains an item without an ID`);
      if(itemIds.has(item.id)) throw new Error(`Duplicate itinerary item id: ${item.id}`);
      itemIds.add(item.id);

      for(const segment of [...(item.segments||[]),...(item.noteSegments||[])]){
        if(segment.placeId&&!placeIds.has(segment.placeId)){
          throw new Error(`Item ${item.id} references unknown place ${segment.placeId}`);
        }
      }

      if(item.ticketId&&!ticketIds.has(item.ticketId)){
        throw new Error(`Item ${item.id} references unknown ticket ${item.ticketId}`);
      }

      if(item.ticketAnchorPlaceId&&!placeIds.has(item.ticketAnchorPlaceId)){
        throw new Error(`Item ${item.id} references unknown ticket anchor ${item.ticketAnchorPlaceId}`);
      }
    }
  }

  return data;
}
