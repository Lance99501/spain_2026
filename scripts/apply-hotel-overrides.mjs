import {mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');

async function readJson(path){return JSON.parse(await readFile(path,'utf8'));}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}

async function main(){
  const scope=String(process.env.PUBLISH_SCOPE||'All').toLowerCase();
  if(scope==='itinerary'){
    console.log('Hotel replacement overrides skipped for Itinerary-only publish.');
    return;
  }

  const cfg=await readJson(resolve(root,'config/hotel-overrides.json'));
  if(cfg.schemaVersion!==1) throw new Error(`Unsupported hotel override schemaVersion: ${cfg.schemaVersion}`);

  const placesPath=resolve(root,'data/source/places.json');
  const hotelsPath=resolve(root,'data/source/hotels.json');
  const itineraryDir=resolve(root,'data/source/itinerary');
  const places=await readJson(placesPath);
  const hotels=await readJson(hotelsPath);
  const files=(await readdir(itineraryDir)).filter(name=>name.endsWith('.json')).sort();
  const days=await Promise.all(files.map(async name=>({name,day:await readJson(resolve(itineraryDir,name))})));

  const placeById=new Map(places.map(place=>[place.id,place]));
  const hotelById=new Map(hotels.map(hotel=>[hotel.placeId,hotel]));
  const itemById=new Map(days.flatMap(entry=>entry.day.items.map(item=>[item.id,{entry,item}])));
  const changedDayFiles=new Set();
  let placesChanged=false;
  let hotelsChanged=false;
  const changes=[];

  for(const override of cfg.overrides||[]){
    const place=placeById.get(override.targetPlaceId);
    const hotel=hotelById.get(override.targetPlaceId);
    if(!place||!hotel) throw new Error(`Hotel override target missing: ${override.targetPlaceId}`);
    if(place.type!=='hotel') throw new Error(`Hotel override target is not a hotel place: ${override.targetPlaceId}`);
    if(!(override.expectedCurrentNames||[]).includes(place.name)) throw new Error(`Unexpected current hotel name for ${override.targetPlaceId}: ${place.name}`);
    if(override.expectedStay){
      if(hotel.checkIn!==override.expectedStay.checkIn||hotel.checkOut!==override.expectedStay.checkOut){
        throw new Error(`Protected stay window mismatch for ${override.targetPlaceId}: ${hotel.checkIn}–${hotel.checkOut}`);
      }
    }

    for(const [key,value] of Object.entries(override.publicPlace||{})){
      if(!same(place[key],value)){place[key]=value;placesChanged=true;changes.push(`${override.targetPlaceId}.${key}`);}
    }
    for(const [key,value] of Object.entries(override.hotel||{})){
      if(!same(hotel[key],value)){hotel[key]=value;hotelsChanged=true;changes.push(`hotel:${override.targetPlaceId}.${key}`);}
    }

    for(const update of override.itineraryUpdates||[]){
      const found=itemById.get(update.itemId);
      if(!found) throw new Error(`Hotel override itinerary item missing: ${update.itemId}`);
      for(const key of ['time','segments','noteSegments']){
        if(Object.hasOwn(update,key)&&!same(found.item[key],update[key])){
          found.item[key]=update[key];
          changedDayFiles.add(found.entry.name);
          changes.push(`${update.itemId}.${key}`);
        }
      }
    }
  }

  if(placesChanged) await writeFile(placesPath,JSON.stringify(places,null,2)+'\n','utf8');
  if(hotelsChanged) await writeFile(hotelsPath,JSON.stringify(hotels,null,2)+'\n','utf8');
  for(const name of changedDayFiles){
    const entry=days.find(day=>day.name===name);
    await writeFile(resolve(itineraryDir,name),JSON.stringify(entry.day,null,2)+'\n','utf8');
  }

  if(changes.length){
    const swPath=resolve(root,'service-worker.js');
    const sw=await readFile(swPath,'utf8');
    const pattern=/const CACHE_VERSION='spain2026-(\d{8})-v(\d+)'/;
    const match=sw.match(pattern);
    if(!match) throw new Error('Unable to locate service worker cache version.');
    const today=new Date().toISOString().slice(0,10).replaceAll('-','');
    const nextVersion=Number(match[2])+1;
    await writeFile(swPath,sw.replace(pattern,`const CACHE_VERSION='spain2026-${today}-v${nextVersion}'`),'utf8');
    console.log(`Applied ${changes.length} public hotel replacement field update(s); cache → spain2026-${today}-v${nextVersion}.`);
  }else{
    console.log('Hotel replacement overrides already up to date.');
  }

  const summary=process.env.GITHUB_STEP_SUMMARY;
  if(summary){
    await mkdir(dirname(summary),{recursive:true});
    const text=changes.length
      ? `\n## Confirmed hotel replacement\n\n- Applied public-safe Arroyo 3 Apartments replacement data after guarded Reservation validation.\n- Updated fields: **${changes.length}**.\n- No booking reference, payment, PIN, traveler, or private notes were published.\n`
      : `\n## Confirmed hotel replacement\n\n- Public hotel replacement data is already up to date.\n`;
    await writeFile(summary,text,{encoding:'utf8',flag:'a'});
  }
}

main().catch(error=>{console.error(`Hotel replacement override failed: ${error.message}`);process.exitCode=1;});
