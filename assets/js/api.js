import {
  tripConfig, places, hotels, itinerary, encryptedTickets, itemAnnotations, mapConfig
} from '../../data/trip-data.js';

// Frontend/backend boundary.
// Today: static GitHub Pages data.
// Future MVC/API: replace these methods with fetch('/api/...').
export const api = {
  async getTripConfig(){ return tripConfig; },
  async getPlaces(){ return places; },
  async getHotels(){ return hotels; },
  async getItinerary(){ return itinerary; },
  async getItemAnnotations(){ return itemAnnotations; },
  async getMapConfig(){ return mapConfig; },
  async getEncryptedTickets(){ return encryptedTickets; },

  async getBootstrapData(){
    const [config, placeData, hotelData, itineraryData, annotations, map, tickets] = await Promise.all([
      this.getTripConfig(), this.getPlaces(), this.getHotels(), this.getItinerary(),
      this.getItemAnnotations(), this.getMapConfig(), this.getEncryptedTickets()
    ]);
    return {
      config, places:placeData, hotels:hotelData, itinerary:itineraryData,
      annotations, mapConfig:map, encryptedTickets:tickets
    };
  }
};
