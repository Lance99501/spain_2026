import {mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildManagedItem,buildTravelHint,insertItemChronologically,isSafeAutoCreateRow,mappedStartTime,likelyDuplicateOnDay,mergeManagedItem,primaryClock,syncMappedPublicItem} from './notion-public-item.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');

function parseArgs(argv){
  const args={scope:'all',json:'artifacts/notion-publish.json',summary:process.env.GITHUB_STEP_SUMMARY||''};
  for(let i=0;i<argv.length;i+=1){
    if(argv[i]==='--scope') args.scope=String(argv[++i]||'all').toLowerCase();
    else if(argv[i]==='--json') args.json=argv[++i]||args.json;
    else if(argv[i]==='--summary') args.summary=argv[++i]||'';
  }
  if(!['all','itinerary','reservations'].includes(args.scope)) throw new Error(`Unsupported scope: ${args.scope}`);
  return args;
}

async function readJson(path){return JSON.parse(await readFile(path,'utf8'));}
function normalize(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function rich(list=[]){return list.map(part=>part?.plain_text||part?.text?.content||'').join('');}

function propValue(property){
  if(!property) return null;
  switch(property.type){
    case 'title': return rich(property.title);
    case 'rich_text': return rich(property.rich_text);
    case 'select': return property.select?.name||null;
    case 'status': return property.status?.name||null;
    case 'multi_select': return (property.multi_select||[]).map(option=>option.name);
    case 'checkbox': return Boolean(property.checkbox);
    case 'number': return property.number??null;
    case 'date': return property.date?{start:property.date.start,end:property.date.end||null}:null;
    case 'unique_id': return property.unique_id?.number==null?null:`${property.unique_id.prefix?`${property.unique_id.prefix}-`:''}${property.unique_id.number}`;
    default: return null;
  }
}

function pageRecord(page,names){const row={pageId:page.id,url:page.url,lastEditedTime:page.last_edited_time};for(const name of names) row[name]=propValue(page.properties?.[name]);return row;}

async function notionQuery({token,apiVersion,dataSourceId,propertyNames}){
  const rows=[];let cursor=null;
  do{
    const params=new URLSearchParams();propertyNames.forEach(name=>params.append('filter_properties[]',name));
    const body={page_size:100};if(cursor) body.start_cursor=cursor;
    const response=await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query?${params}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Notion-Version':apiVersion,'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!response.ok) throw new Error(`Notion query failed (${response.status}): ${(await response.text()).slice(0,600)}`);
    const payload=await response.json();rows.push(...(payload.results||[]).filter(item=>item.object==='page').map(page=>pageRecord(page,propertyNames)));cursor=payload.has_more?payload.next_cursor:null;
  }while(cursor);return rows;
}

function status(value){const v=normalize(value);if(v==='ticket pending') return 'pending';return v||null;}
function itemStatus(item,ticketById){if(item.transport?.status) return status(item.transport.status);if(item.ticketId&&ticketById.get(item.ticketId)?.status) return status(ticketById.get(item.ticketId).status);const note=normalize((item.noteSegments||[]).map(x=>x.text).join(' '));if(note.includes('已確認')) return 'confirmed';if(note.includes('待確認')||note.includes('待購票')) return 'pending';return null;}
function itemStart(item){if(/^\d{2}:\d{2}$/.test(item.startTime||'')) return item.startTime;if(/^\d{2}:\d{2}$/.test(item.time||'')) return item.time;return '';}
function ticketIdsFor(link){if(Array.isArray(link.ticketIds)) return link.ticketIds;return link.ticketId?[link.ticketId]:[];}
function table(lines,headers,rows){lines.push(`| ${headers.join(' | ')} |`,`| ${headers.map(()=> '---').join(' | ')} |`);rows.forEach(row=>lines.push(`| ${row.map(value=>String(value??'').replace(/\|/g,'\\|').replace(/\n/g,' ')).join(' | ')} |`));}

function summary(report){
  const lines=['# Spain 2026 · Notion Publisher','',`Mode: **Publish**`,`Scope: **${report.scope}**`,`Generated: ${report.generatedAt}`,''];
  if(report.blockers.length){lines.push('## ⛔ Publish blocked','',`**${report.blockers.length}** safety issue(s) must be reviewed. No source JSON was written.`,'');table(lines,['Source','Notion','Target','Reason'],report.blockers.map(x=>[x.source,x.name||x.pageId,x.target||'—',x.message]));lines.push('');}
  else{lines.push('## Result','',`- Changes prepared: **${report.changes.length}**`,`- Warnings / skipped unmapped rows: **${report.warnings.length}**`,`- Ignored by policy: **${report.ignored.length}**`,'');if(report.changes.length){table(lines,['Source','Target','Change'],report.changes.map(x=>[x.source,x.target,x.message]));lines.push('');}}
  if(report.warnings.length){lines.push('## Warnings','');table(lines,['Source','Notion','Reason'],report.warnings.slice(0,50).map(x=>[x.source,x.name||x.pageId,x.message]));lines.push('');}
  if(report.ignored.length){lines.push('## Ignored by policy','');table(lines,['Source','Notion','Reason'],report.ignored.map(x=>[x.source,x.name||x.pageId,x.message]));lines.push('');}
  lines.push('## Safety gates','','- Explicit mappings remain authoritative; only public-safe Planned/Idea + Flexible/Idea items in configured low-risk types may be auto-created.','- Auto-created items use the same day/items timeline JSON shape and carry `sourceItineraryId` + `notionManaged` for later updates/cancellation.','- GitHub `confirmed` can never be downgraded by this workflow.','- A date change on a linked item/day/hotel stay is blocked instead of moving it automatically.','- Time changes on Confirmed / Fixed / ticketed items are blocked for manual review.','- One Notion Reservation may map to multiple GitHub ticket IDs, but Confirmed tickets can never be lowered.','- Hotel stays are linked by their existing confirmed check-in/check-out dates; Reservation details remain private.','- Explicit ignore rules keep private records such as insurance out of the public app.','- Unmapped high-risk/locked rows are skipped; likely duplicates are never auto-created and require explicit mapping.','- Booking refs, amount, currency, traveler names and private reservation notes are never requested.','');
  return lines.join('\n');
}

async function writeReport(args,report){const output=resolve(root,args.json);await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n','utf8');const md=summary(report);console.log(md);if(args.summary) await writeFile(args.summary,md+'\n','utf8');}
function addChange(report,source,target,message){report.changes.push({source,target,message});}
function addBlock(report,source,row,target,message){report.blockers.push({source,pageId:row?.pageId,name:row?.Name||null,target,message});}
function addWarning(report,source,row,message){report.warnings.push({source,pageId:row?.pageId,name:row?.Name||null,message});}
function addIgnored(report,source,row,message){report.ignored.push({source,pageId:row?.pageId,name:row?.Name||null,message});}

async function main(){
  const args=parseArgs(process.argv.slice(2));const token=process.env.NOTION_TOKEN?.trim();if(!token) throw new Error('NOTION_TOKEN is missing. Add it in GitHub Settings → Secrets and variables → Actions.');
  const cfg=await readJson(resolve(root,'config/notion-publisher.json'));const links=await readJson(resolve(root,'config/notion-links.json'));const trip=await readJson(resolve(root,'data/source/config.json'));const tickets=await readJson(resolve(root,'data/source/tickets.json'));const hotels=await readJson(resolve(root,'data/source/hotels.json'));
  const files=(await readdir(resolve(root,'data/source/itinerary'))).filter(name=>name.endsWith('.json')).sort();const days=await Promise.all(files.map(async name=>({name,day:await readJson(resolve(root,'data/source/itinerary',name))})));
  const ticketById=new Map(tickets.map(ticket=>[ticket.id,ticket]));const hotelByPlaceId=new Map(hotels.map(hotel=>[hotel.placeId,hotel]));const dayById=new Map(days.map(entry=>[entry.day.id,entry]));const dayByDate=new Map(days.map(entry=>[entry.day.date,entry]));const itemById=new Map(days.flatMap(entry=>entry.day.items.map(item=>[item.id,{...entry,item}])));const managedBySource=new Map(days.flatMap(entry=>entry.day.items.filter(item=>item.notionManaged===true&&item.sourceItineraryId).map(item=>[item.sourceItineraryId,{...entry,item}])));const inside=date=>typeof date==='string'&&date>=trip.departDate&&date<=trip.endDate;
  const report={generatedAt:new Date().toISOString(),scope:args.scope,mode:'publish',changes:[],warnings:[],ignored:[],blockers:[]};const changedDayFiles=new Set();let ticketsChanged=false;let hotelsChanged=false;

  let itineraryRows=[];
  if(args.scope==='all'||args.scope==='itinerary'){
    itineraryRows=(await notionQuery({token,apiVersion:cfg.apiVersion,dataSourceId:cfg.dataSources.itinerary,propertyNames:cfg.properties.itinerary})).map(row=>({...row,Date:row.Date?.start||null})).filter(row=>inside(row.Date));const rowByPage=new Map(itineraryRows.map(row=>[row.pageId,row]));
    for(const [pageId,link] of Object.entries(links.itinerary||{})){
      const row=rowByPage.get(pageId);if(!row){addWarning(report,'Itinerary',{pageId,Name:link.note},'Mapped Notion row was not returned in the trip window; skipped.');continue;}
      if(link.sourceId&&row['Itinerary ID']&&link.sourceId!==row['Itinerary ID']){addBlock(report,'Itinerary',row,link.targetId,`Mapping source mismatch: config=${link.sourceId}, Notion=${row['Itinerary ID']}.`);continue;}
      if(link.targetType==='hotel'){
        const hotel=hotelByPlaceId.get(link.targetId);if(!hotel){addBlock(report,'Itinerary',row,link.targetId,'Mapped hotel stay does not exist in GitHub.');continue;}
        if(!['checkIn','checkOut'].includes(link.stayRole)){addBlock(report,'Itinerary',row,link.targetId,'Hotel mapping must specify stayRole=checkIn or checkOut.');continue;}
        const expectedDate=link.stayRole==='checkIn'?hotel.checkIn:hotel.checkOut;if(row.Date!==expectedDate){addBlock(report,'Itinerary',row,link.targetId,`Protected hotel date mismatch: Notion=${row.Date}, GitHub=${expectedDate}.`);continue;}
        const sourceField=link.stayRole==='checkIn'?'sourceCheckInItineraryId':'sourceCheckOutItineraryId';if(link.sourceId&&hotel[sourceField]!==link.sourceId){hotel[sourceField]=link.sourceId;hotelsChanged=true;addChange(report,'Itinerary',`hotel:${link.targetId}:${link.stayRole}`,`Linked ${link.sourceId} to hotel ${link.stayRole}.`);}continue;
      }
      if(link.targetType==='travelHint'){
        const entry=itemById.get(link.targetId);if(!entry){addBlock(report,'Itinerary',row,link.targetId,'Mapped travel-hint item does not exist in GitHub.');continue;}if(row.Date!==entry.day.date){addBlock(report,'Itinerary',row,link.targetId,`Travel-hint date mismatch: Notion=${row.Date}, GitHub=${entry.day.date}.`);continue;}
        if(status(row.Status)==='cancelled'){
          if(entry.item.travelHint){delete entry.item.travelHint;changedDayFiles.add(entry.name);addChange(report,'Itinerary',link.targetId,`Removed cancelled travel hint ${link.sourceId||row['Itinerary ID']||''}.`);}
          continue;
        }
        const hint=buildTravelHint(row);
        if(!Object.keys(hint).length){addWarning(report,'Itinerary',row,'Mapped travel hint has no structured public fields; skipped.');continue;}
        let itemTimeChanged=false;
        if(link.syncItemTime===true){
          const nextTime=primaryClock(row['Start Time']);
          const currentTime=itemStart(entry.item);
          if(nextTime&&currentTime!==nextTime){
            if(Boolean(entry.item.ticketId)||itemStatus(entry.item,ticketById)==='confirmed'){
              addBlock(report,'Itinerary',row,link.targetId,`Protected travel-hint time mismatch: Notion=${nextTime}, GitHub=${currentTime||'—'}.`);
              continue;
            }
            entry.item.time=nextTime;entry.item.startTime=nextTime;itemTimeChanged=true;
          }
        }
        const hintChanged=JSON.stringify(entry.item.travelHint||{})!==JSON.stringify(hint);
        if(hintChanged) entry.item.travelHint=hint;
        if(hintChanged||itemTimeChanged){
          changedDayFiles.add(entry.name);
          addChange(report,'Itinerary',link.targetId,`${itemTimeChanged?'Updated mapped item time; ':''}${hintChanged?`Updated travel hint from ${link.sourceId||row['Itinerary ID']||'Notion'}.`:''}`.trim());
        }
        continue;
      }
      if(link.targetType==='day'){
        const entry=dayById.get(link.targetId);if(!entry){addBlock(report,'Itinerary',row,link.targetId,'Mapped day does not exist in GitHub.');continue;}if(row.Date!==entry.day.date){addBlock(report,'Itinerary',row,link.targetId,`Date mismatch: Notion=${row.Date}, GitHub=${entry.day.date}. Automatic day moves are disabled.`);continue;}
        const notionStatus=status(row.Status);if(entry.day.categories?.includes('confirmed')&&notionStatus!=='confirmed'){addBlock(report,'Itinerary',row,link.targetId,`Confirmed downgrade guard: Notion=${notionStatus||'unknown'} would lower a GitHub day containing confirmed data.`);continue;}
        if(link.sourceId&&entry.day.sourceItineraryId!==link.sourceId){entry.day.sourceItineraryId=link.sourceId;changedDayFiles.add(entry.name);addChange(report,'Itinerary',link.targetId,`Linked ${link.sourceId} to day.`);}continue;
      }
      if(link.targetType!=='item'){addBlock(report,'Itinerary',row,link.targetId,`Unsupported targetType: ${link.targetType}`);continue;}
      const entry=itemById.get(link.targetId);if(!entry){addBlock(report,'Itinerary',row,link.targetId,'Mapped item does not exist in GitHub.');continue;}if(row.Date!==entry.day.date){addBlock(report,'Itinerary',row,link.targetId,`Date mismatch: Notion=${row.Date}, GitHub=${entry.day.date}. Automatic item moves are disabled.`);continue;}
      if(Array.isArray(link.syncPublicFields)&&link.syncPublicFields.includes('City')&&normalize(row.City)!==normalize(entry.day.city)){addBlock(report,'Itinerary',row,link.targetId,`City mismatch: Notion=${row.City||'—'}, public day=${entry.day.city}.`);continue;}
      const notionStatus=status(row.Status),githubStatus=itemStatus(entry.item,ticketById);if(githubStatus==='confirmed'&&notionStatus!=='confirmed'){addBlock(report,'Itinerary',row,link.targetId,`Confirmed downgrade guard: Notion=${notionStatus||'unknown'}, GitHub=confirmed.`);continue;}
      const notionTime=mappedStartTime(row,link),githubTime=itemStart(entry.item);if(/^\d{2}:\d{2}$/.test(notionTime||'')&&githubTime&&notionTime!==githubTime){const protectedTime=githubStatus==='confirmed'||row.Fixed===true||Boolean(entry.item.ticketId);if(protectedTime){addBlock(report,'Itinerary',row,link.targetId,`Protected time mismatch: Notion=${notionTime}, GitHub=${githubTime}. Confirmed / Fixed / ticketed times require manual verification.`);continue;}if(!link.syncPublicFields?.includes('Start Time')){entry.item.time=notionTime;entry.item.startTime=notionTime;changedDayFiles.add(entry.name);addChange(report,'Itinerary',link.targetId,`Start time ${githubTime||'—'} → ${notionTime}.`);}}
      const publicSync=syncMappedPublicItem(entry.item,row,link);
      if(publicSync.error){addBlock(report,'Itinerary',row,link.targetId,`Public-field sync blocked: ${publicSync.error}`);continue;}
      const protectedPublicFields=publicSync.changed.filter(field=>['Name','Start Time','End Time','Area','Type','City'].includes(field));
      if(protectedPublicFields.length&&(githubStatus==='confirmed'||row.Fixed===true||Boolean(entry.item.ticketId))){addBlock(report,'Itinerary',row,link.targetId,`Protected public-field mismatch: ${protectedPublicFields.join(', ')}. Confirmed / Fixed / ticketed items require manual verification.`);continue;}
      if(publicSync.changed.length){const index=entry.day.items.indexOf(entry.item);entry.day.items[index]=publicSync.item;entry.item=publicSync.item;changedDayFiles.add(entry.name);addChange(report,'Itinerary',link.targetId,`Synced public fields: ${publicSync.changed.join(', ')}.`);}
      if(entry.item.transport&&notionStatus==='confirmed'&&status(entry.item.transport.status)!=='confirmed'){entry.item.transport.status='confirmed';changedDayFiles.add(entry.name);addChange(report,'Itinerary',link.targetId,'Transport status promoted to confirmed.');}
      if(link.sourceId&&entry.item.sourceItineraryId!==link.sourceId){entry.item.sourceItineraryId=link.sourceId;changedDayFiles.add(entry.name);addChange(report,'Itinerary',link.targetId,`Linked ${link.sourceId} to item.`);}
      const inlineHint=buildTravelHint(row);
      const ownsInlineHint=entry.item.travelHint?.sourceItineraryId===(link.sourceId||row['Itinerary ID']);
      if(Object.keys(inlineHint).length){
        if(JSON.stringify(entry.item.travelHint||{})!==JSON.stringify(inlineHint)){
          entry.item.travelHint=inlineHint;changedDayFiles.add(entry.name);addChange(report,'Itinerary',link.targetId,`Updated inline travel hint from ${link.sourceId||row['Itinerary ID']||'Notion'}.`);
        }
      }else if(ownsInlineHint){
        delete entry.item.travelHint;changedDayFiles.add(entry.name);addChange(report,'Itinerary',link.targetId,'Removed cleared inline travel hint.');
      }
    }
    const explicitPages=new Set(Object.keys(links.itinerary||{}));
    const explicitSourceIds=new Set(Object.values(links.itinerary||{}).map(link=>link.sourceId).filter(Boolean));
    for(const row of itineraryRows){
      const sourceId=row['Itinerary ID'];
      if(!sourceId||explicitPages.has(row.pageId)||explicitSourceIds.has(sourceId)) continue;
      const managed=managedBySource.get(sourceId);
      const notionStatus=status(row.Status);

      if(managed){
        if(notionStatus==='cancelled'){
          managed.day.items=managed.day.items.filter(item=>item!==managed.item);
          changedDayFiles.add(managed.name);
          managedBySource.delete(sourceId);
          addChange(report,'Itinerary',managed.item.id,`Removed cancelled Notion-managed item ${sourceId}.`);
          continue;
        }

        const target=dayByDate.get(row.Date);
        if(!target){addBlock(report,'Itinerary',row,managed.item.id,`Notion-managed item date ${row.Date} has no public itinerary day.`);continue;}
        if(normalize(target.day.city)!==normalize(row.City)){addBlock(report,'Itinerary',row,managed.item.id,`City mismatch for Notion-managed item: Notion=${row.City}, public day=${target.day.city}.`);continue;}

        const nextTime=primaryClock(row['Start Time']);
        const currentTime=itemStart(managed.item);
        const protectedItem=notionStatus==='confirmed'||row.Fixed===true||Boolean(managed.item.ticketId);
        if(protectedItem&&managed.day.date!==row.Date){addBlock(report,'Itinerary',row,managed.item.id,`Protected Notion-managed date mismatch: Notion=${row.Date}, GitHub=${managed.day.date}.`);continue;}
        if(protectedItem&&nextTime&&currentTime&&nextTime!==currentTime){addBlock(report,'Itinerary',row,managed.item.id,`Protected Notion-managed time mismatch: Notion=${nextTime}, GitHub=${currentTime}.`);continue;}

        if(managed.day.date!==row.Date){
          addBlock(report,'Itinerary',row,managed.item.id,`Date mismatch for Notion-managed item: Notion=${row.Date}, GitHub=${managed.day.date}. Automatic day moves are disabled.`);
          continue;
        }

        const nextItem=mergeManagedItem(managed.item,row);
        if(JSON.stringify(nextItem)!==JSON.stringify(managed.item)){
          const index=managed.day.items.indexOf(managed.item);
          managed.day.items.splice(index,1);
          insertItemChronologically(managed.day,nextItem);
          changedDayFiles.add(managed.name);
          managedBySource.set(sourceId,{...managed,item:nextItem});
          addChange(report,'Itinerary',nextItem.id,`Updated Notion-managed item ${sourceId}.`);
        }
        continue;
      }

      if(isSafeAutoCreateRow(row,cfg.autoCreateItinerary)){
        const target=dayByDate.get(row.Date);
        if(!target){addWarning(report,'Itinerary',row,'Safe auto-create skipped: no existing public day for this date.');continue;}
        if(normalize(target.day.city)!==normalize(row.City)){addWarning(report,'Itinerary',row,`Safe auto-create skipped: city mismatch Notion=${row.City}, public day=${target.day.city}.`);continue;}
        if(likelyDuplicateOnDay(target.day,row)){addWarning(report,'Itinerary',row,'Safe auto-create skipped: a likely duplicate already exists on the public day; add an explicit mapping if they are the same item.');continue;}
        const item=buildManagedItem(row);
        if(itemById.has(item.id)){addBlock(report,'Itinerary',row,item.id,'Safe auto-create generated a duplicate public item ID.');continue;}
        insertItemChronologically(target.day,item);
        changedDayFiles.add(target.name);
        itemById.set(item.id,{...target,item});
        managedBySource.set(sourceId,{...target,item});
        addChange(report,'Itinerary',item.id,`Auto-created public-safe flexible item from ${sourceId}.`);
        continue;
      }

      const locked=notionStatus==='confirmed'||row.Fixed===true;
      if(locked) addWarning(report,'Itinerary',row,'Locked row is not explicitly mapped yet; Publish skipped it.');
    }
  }

  let reservationRows=[];
  if(args.scope==='all'||args.scope==='reservations'){
    reservationRows=(await notionQuery({token,apiVersion:cfg.apiVersion,dataSourceId:cfg.dataSources.reservations,propertyNames:cfg.properties.reservations})).map(row=>({...row,Date:row.Date?.start||null})).filter(row=>inside(row.Date));const rowByPage=new Map(reservationRows.map(row=>[row.pageId,row]));
    for(const [pageId,link] of Object.entries(links.reservations||{})){
      const row=rowByPage.get(pageId);if(!row){addWarning(report,'Reservation',{pageId,Name:link.note},'Mapped Notion reservation was not returned in the trip window; skipped.');continue;}
      if(link.ignore){addIgnored(report,'Reservation',row,link.reason||'Explicitly excluded from public publishing.');continue;}
      const notionStatus=status(row.Status);
      if(link.hotelPlaceId){const hotel=hotelByPlaceId.get(link.hotelPlaceId);if(!hotel){addBlock(report,'Reservation',row,link.hotelPlaceId,'Mapped hotel stay does not exist in GitHub.');continue;}if(notionStatus!=='confirmed'){addBlock(report,'Reservation',row,link.hotelPlaceId,`Confirmed hotel downgrade guard: Notion=${notionStatus||'unknown'}, GitHub stay is locked.`);continue;}if(row.Date&&row.Date!==hotel.checkIn) addBlock(report,'Reservation',row,link.hotelPlaceId,`Hotel reservation date mismatch: Notion=${row.Date}, GitHub check-in=${hotel.checkIn}.`);continue;}
      const ticketIds=ticketIdsFor(link);if(!ticketIds.length){addBlock(report,'Reservation',row,'—','Reservation mapping must specify ticketId, ticketIds, hotelPlaceId, or ignore.');continue;}
      for(const ticketId of ticketIds){const ticket=ticketById.get(ticketId);if(!ticket){addBlock(report,'Reservation',row,ticketId,'Mapped ticket does not exist in GitHub.');continue;}const githubStatus=status(ticket.status);if(githubStatus==='confirmed'&&notionStatus!=='confirmed'){addBlock(report,'Reservation',row,ticketId,`Confirmed downgrade guard: Notion=${notionStatus||'unknown'}, GitHub=confirmed.`);continue;}if(notionStatus==='confirmed'&&githubStatus!=='confirmed'){ticket.status='confirmed';ticketsChanged=true;addChange(report,'Reservation',ticketId,`Ticket status ${githubStatus||'unknown'} → confirmed.`);}}
    }
    for(const row of reservationRows){if(status(row.Status)==='confirmed'&&!links.reservations?.[row.pageId]) addWarning(report,'Reservation',row,'Confirmed reservation is not explicitly mapped yet; Publish skipped it.');}
  }

  if(report.blockers.length){await writeReport(args,report);process.exitCode=2;return;}
  for(const name of changedDayFiles){const entry=days.find(x=>x.name===name);await writeFile(resolve(root,'data/source/itinerary',name),JSON.stringify(entry.day,null,2)+'\n','utf8');}
  if(ticketsChanged) await writeFile(resolve(root,'data/source/tickets.json'),JSON.stringify(tickets,null,2)+'\n','utf8');if(hotelsChanged) await writeFile(resolve(root,'data/source/hotels.json'),JSON.stringify(hotels,null,2)+'\n','utf8');
  if(changedDayFiles.size||ticketsChanged||hotelsChanged){const swPath=resolve(root,'service-worker.js');const sw=await readFile(swPath,'utf8');const pattern=/const CACHE_VERSION='spain2026-(\d{8})-v(\d+)'/;const match=sw.match(pattern);if(!match) throw new Error('Unable to locate service worker cache version.');const today=new Date().toISOString().slice(0,10).replaceAll('-','');const nextVersion=Number(match[2])+1;const next=sw.replace(pattern,`const CACHE_VERSION='spain2026-${today}-v${nextVersion}'`);await writeFile(swPath,next,'utf8');addChange(report,'PWA','service-worker.js',`Cache version bumped to spain2026-${today}-v${nextVersion}.`);}
  await writeReport(args,report);
}

main().catch(error=>{console.error(`Notion publisher failed: ${error.message}`);process.exitCode=1;});
