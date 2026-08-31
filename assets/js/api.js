import {
  tripConfig,
  places,
  hotels,
  tickets,
  itinerary,
  ticketDriveFileIds,
  mapConfig
} from '../../data/trip-data.js';

function assertUnique(items,key,label){
  const seen=new Set();
  for(const item of items){
    const value=item[key];
    if(!value) throw new Error(`${label} missing ${key}`);
    if(seen.has(value)) throw new Error(`Duplicate ${label} ${key}: ${value}`);
    seen.add(value);
  }
}

function validateRelations(data){
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
    for(const item of day.items){
      if(itemIds.has(item.id)) throw new Error(`Duplicate itinerary item id: ${item.id}`);
      itemIds.add(item.id);

      for(const segment of [...item.segments,...(item.noteSegments||[])]){
        if(segment.placeId && !placeIds.has(segment.placeId)){
          throw new Error(`Item ${item.id} references unknown place ${segment.placeId}`);
        }
      }

      if(item.ticketId && !ticketIds.has(item.ticketId)){
        throw new Error(`Item ${item.id} references unknown ticket ${item.ticketId}`);
      }

      if(item.ticketAnchorPlaceId && !placeIds.has(item.ticketAnchorPlaceId)){
        throw new Error(`Item ${item.id} references unknown ticket anchor ${item.ticketAnchorPlaceId}`);
      }
    }
  }

  return data;
}

// Frontend/backend boundary.
// Today: static GitHub Pages data.
// Future MVC/API: replace these methods with fetch('/api/...') and preserve the DTO shapes.
export const api = {
  async getTripConfig(){ return tripConfig; },
  async getPlaces(){ return places; },
  async getHotels(){ return hotels; },
  async getTickets(){ return tickets; },
  async getItinerary(){ return itinerary; },
  async getMapConfig(){ return mapConfig; },
  async getTicketDriveFileIds(){ return ticketDriveFileIds; },

  async getBootstrapData(){
    const [config,placeData,hotelData,ticketData,itineraryData,map,driveFileIds]=await Promise.all([
      this.getTripConfig(),
      this.getPlaces(),
      this.getHotels(),
      this.getTickets(),
      this.getItinerary(),
      this.getMapConfig(),
      this.getTicketDriveFileIds()
    ]);

    return validateRelations({
      config,
      places:placeData,
      hotels:hotelData,
      tickets:ticketData,
      itinerary:itineraryData,
      mapConfig:map,
      ticketDriveFileIds:driveFileIds
    });
  }
};
