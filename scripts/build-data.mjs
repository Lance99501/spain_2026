import {readdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {validateBootstrapData} from '../assets/js/data/validate.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sourceDir=resolve(root,'data/source');
const itineraryDir=resolve(sourceDir,'itinerary');
const outputFile=resolve(root,'data/generated/bootstrap.json');

async function readJson(path){
  return JSON.parse(await readFile(path,'utf8'));
}

async function loadItinerary(){
  const files=(await readdir(itineraryDir))
    .filter(name=>/^\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .sort();

  return Promise.all(files.map(name=>readJson(resolve(itineraryDir,name))));
}

async function build(){
  const [
    config,
    places,
    hotels,
    tickets,
    itinerary,
    ticketDriveFileIds,
    mapConfig
  ]=await Promise.all([
    readJson(resolve(sourceDir,'config.json')),
    readJson(resolve(sourceDir,'places.json')),
    readJson(resolve(sourceDir,'hotels.json')),
    readJson(resolve(sourceDir,'tickets.json')),
    loadItinerary(),
    readJson(resolve(sourceDir,'ticket-drive.json')),
    readJson(resolve(sourceDir,'map-config.json'))
  ]);

  return validateBootstrapData({
    schemaVersion:1,
    config,
    places,
    hotels,
    tickets,
    itinerary,
    ticketDriveFileIds,
    mapConfig
  });
}

const data=await build();
const output=JSON.stringify(data,null,2)+'\n';

if(process.argv.includes('--check')){
  let current='';
  try{current=await readFile(outputFile,'utf8');}catch{}
  if(current!==output){
    console.error('data/generated/bootstrap.json is stale. Run: npm run build:data');
    process.exitCode=1;
  }else{
    console.log('Generated bootstrap is up to date.');
  }
}else{
  await writeFile(outputFile,output,'utf8');
  console.log(`Wrote data/generated/bootstrap.json (${data.itinerary.length} days, ${data.tickets.length} tickets).`);
}
