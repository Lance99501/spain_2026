import {createJsonDataSource} from './data/source.js';
import {validateBootstrapData} from './data/validate.js';

const STATIC_DATA_ENDPOINT=new URL('../../data/generated/bootstrap.json',import.meta.url);

function configuredDataEndpoint(){
  if(typeof document==='undefined') return STATIC_DATA_ENDPOINT;

  const configured=document
    .querySelector('meta[name="spain-data-endpoint"]')
    ?.getAttribute('content')
    ?.trim();

  if(!configured) return STATIC_DATA_ENDPOINT;
  return new URL(configured,document.baseURI);
}

const dataSource=createJsonDataSource(configuredDataEndpoint());
let validatedPromise=null;

async function loadBootstrap({force=false}={}){
  if(force) validatedPromise=null;
  if(!validatedPromise){
    validatedPromise=dataSource
      .load({force})
      .then(validateBootstrapData)
      .catch(error=>{
        validatedPromise=null;
        throw error;
      });
  }
  return validatedPromise;
}

// Stable frontend contract.
// Today the endpoint is a generated static JSON file.
// Later it can point at Cloudflare Workers / ASP.NET Core by changing only
// <meta name="spain-data-endpoint">, while keeping the same DTO shape.
export const api={
  async getBootstrapData(options={}){ return loadBootstrap(options); },
  async getTripConfig(){ return (await loadBootstrap()).config; },
  async getPlaces(){ return (await loadBootstrap()).places; },
  async getHotels(){ return (await loadBootstrap()).hotels; },
  async getTickets(){ return (await loadBootstrap()).tickets; },
  async getItinerary(){ return (await loadBootstrap()).itinerary; },
  async getMapConfig(){ return (await loadBootstrap()).mapConfig; },
  async getTicketDriveFileIds(){ return (await loadBootstrap()).ticketDriveFileIds; },
  async refresh(){ return loadBootstrap({force:true}); }
};
