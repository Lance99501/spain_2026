import {mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {isSafeAutoCreateRow,primaryClock} from './notion-public-item.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');

function parseArgs(argv){
  const args={scope:'all',json:'artifacts/notion-preview.json',summary:process.env.GITHUB_STEP_SUMMARY||''};
  for(let i=0;i<argv.length;i+=1){
    if(argv[i]==='--scope') args.scope=String(argv[++i]||'all').toLowerCase();
    else if(argv[i]==='--json') args.json=argv[++i]||args.json;
    else if(argv[i]==='--summary') args.summary=argv[++i]||'';
  }
  if(!['all','itinerary','reservations'].includes(args.scope)) throw new Error(`Unsupported scope: ${args.scope}`);
  return args;
}

async function readJson(path){return JSON.parse(await readFile(path,'utf8'));}

function normalize(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/[→↔｜|/+·•–—:：,，.。()（）\[\]{}]/g,' ').replace(/\s+/g,' ').trim();
}

const STOPWORDS=new Set(['the','and','for','with','from','de','del','la','las','los','el','y','en','hotel','ticket','tickets','general','已確認','確認','行程','城市','移動','核心']);
function tokens(value){return [...new Set(normalize(value).split(' ').filter(token=>token.length>=3&&!STOPWORDS.has(token)))];}
function overlap(a,b){const aa=tokens(a);const bb=new Set(tokens(b));return aa.length&&bb.size?aa.filter(token=>bb.has(token)).length/aa.length:0;}
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

function pageRecord(page,names){
  const row={pageId:page.id,url:page.url,lastEditedTime:page.last_edited_time};
  for(const name of names) row[name]=propValue(page.properties?.[name]);
  return row;
}

async function notionQuery({token,apiVersion,dataSourceId,propertyNames}){
  const rows=[];
  let cursor=null;
  do{
    const params=new URLSearchParams();
    propertyNames.forEach(name=>params.append('filter_properties[]',name));
    const body={page_size:100};
    if(cursor) body.start_cursor=cursor;
    const response=await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query?${params}`,{
      method:'POST',
      headers:{Authorization:`Bearer ${token}`,'Notion-Version':apiVersion,'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    if(!response.ok) throw new Error(`Notion query failed (${response.status}): ${(await response.text()).slice(0,600)}`);
    const payload=await response.json();
    rows.push(...(payload.results||[]).filter(item=>item.object==='page').map(page=>pageRecord(page,propertyNames)));
    cursor=payload.has_more?payload.next_cursor:null;
  }while(cursor);
  return rows;
}

function status(value){
  const v=normalize(value);
  if(v==='ticket pending') return 'pending';
  return v||null;
}

function itemStart(item){
  if(/^\d{2}:\d{2}$/.test(item.startTime||'')) return item.startTime;
  if(/^\d{2}:\d{2}$/.test(item.time||'')) return item.time;
  return '';
}

function itemText(item,placeById){
  return [...(item.segments||[]),...(item.noteSegments||[])].flatMap(segment=>{
    const place=segment.placeId?placeById.get(segment.placeId):null;
    return [segment.text||'',place?.name||'',place?.displayName||'',place?.city||''];
  }).join(' ');
}

function itemStatus(item,ticketById){
  if(item.transport?.status) return status(item.transport.status);
  if(item.ticketId&&ticketById.get(item.ticketId)?.status) return status(ticketById.get(item.ticketId).status);
  const note=normalize((item.noteSegments||[]).map(x=>x.text).join(' '));
  if(note.includes('已確認')) return 'confirmed';
  if(note.includes('待確認')||note.includes('待購票')) return 'pending';
  return null;
}

function scoreRow(row,entry,placeById){
  let score=0;const reasons=[];
  if(row['Start Time']&&itemStart(entry.item)===row['Start Time']){score+=6;reasons.push('time');}
  const text=itemText(entry.item,placeById);
  const n=overlap(row.Name,text),l=overlap(row.Location,text);
  if(n>=.75){score+=4;reasons.push('name');}else if(n>=.4){score+=2;reasons.push('name~');}
  if(l>=.75){score+=4;reasons.push('location');}else if(l>=.4){score+=2;reasons.push('location~');}
  if(normalize(row.Type)==='transit'&&entry.item.transport){score+=2;reasons.push('transport');}
  if(normalize(row.Type)==='attraction'&&entry.item.ticketId){score+=1;reasons.push('ticket');}
  return {score,reasons};
}

function matchItinerary(row,current,placeById){
  const sourceId=row['Itinerary ID'];
  const linkedItem=sourceId?current.items.find(entry=>entry.item.sourceItineraryId===sourceId):null;
  if(linkedItem) return {kind:'linked',candidate:linkedItem,score:100,reasons:['sourceItineraryId']};
  const linkedDay=sourceId?current.days.find(day=>day.sourceItineraryId===sourceId):null;
  if(linkedDay) return {kind:'linked-day',candidate:{day:linkedDay},score:100,reasons:['sourceItineraryId']};
  if(row.Type==='Day trip'){
    const day=current.days.find(day=>day.date===row.Date);
    if(day) return {kind:'day',candidate:{day},score:90,reasons:['date','day-trip']};
  }
  const ranked=current.items.filter(entry=>entry.date===row.Date).map(candidate=>({...scoreRow(row,candidate,placeById),candidate})).sort((a,b)=>b.score-a.score);
  const first=ranked[0],second=ranked[1];
  if(!first||first.score<6) return {kind:'unmatched',candidate:null,score:first?.score||0,reasons:first?.reasons||[]};
  if(second&&first.score-second.score<2) return {kind:'ambiguous',candidate:first.candidate,score:first.score,reasons:first.reasons};
  return {kind:'heuristic',candidate:first.candidate,score:first.score,reasons:first.reasons};
}

function ticketKind(type){const v=normalize(type);return ['attraction','train','flight'].includes(v)?v:null;}
function ticketIdsFor(link){if(Array.isArray(link.ticketIds)) return link.ticketIds;return link.ticketId?[link.ticketId]:[];}

function matchReservation(row,{tickets,currentItems,placeById}){
  const kind=ticketKind(row.Type);
  if(!kind) return {kind:'not-ticket'};
  const ranked=tickets.filter(ticket=>ticket.kind===kind).map(ticket=>{
    let score=0;const reasons=[];
    const linked=currentItems.filter(entry=>entry.item.ticketId===ticket.id);
    if(row.Date&&linked.some(entry=>entry.date===row.Date)){score+=6;reasons.push('date');}
    const text=`${ticket.label} ${linked.map(entry=>itemText(entry.item,placeById)).join(' ')}`;
    const o=overlap(row.Name,text);
    if(o>=.75){score+=4;reasons.push('name');}else if(o>=.4){score+=2;reasons.push('name~');}
    const time=(row['Local Time']||'').match(/\d{2}:\d{2}/)?.[0];
    if(time&&linked.some(entry=>itemStart(entry.item)===time)){score+=3;reasons.push('time');}
    return {ticket,score,reasons};
  }).sort((a,b)=>b.score-a.score);
  const first=ranked[0],second=ranked[1];
  if(!first||first.score<7) return {kind:'unmatched',candidate:null,score:first?.score||0,reasons:first?.reasons||[]};
  if(second&&first.score-second.score<2) return {kind:'ambiguous',candidate:first.ticket,score:first.score,reasons:first.reasons};
  return {kind:'heuristic',candidate:first.ticket,score:first.score,reasons:first.reasons};
}

function table(lines,headers,rows){
  lines.push(`| ${headers.join(' | ')} |`,`| ${headers.map(()=> '---').join(' | ')} |`);
  rows.forEach(row=>lines.push(`| ${row.map(value=>String(value??'').replace(/\|/g,'\\|').replace(/\n/g,' ')).join(' | ')} |`));
}

function summary(report){
  const lines=['# Spain 2026 · Notion Publisher Preview','', '> Read-only preview. No GitHub/Notion data is modified.','',`Scope: **${report.scope}**`,`Generated: ${report.generatedAt}`,''];
  if(report.itinerary){
    const x=report.itinerary;
    lines.push('## Itinerary','',`- Notion rows in trip window: **${x.total}**`,`- Locked (Confirmed / Fixed): **${x.locked}**`,`- Deterministic mappings: **${x.matched.explicit}**`,`- Existing source links: **${x.matched.linked}**`,`- Heuristic candidates: **${x.matched.heuristic}**`,`- Day-level candidates: **${x.matched.day}**`,`- Ambiguous / unmatched: **${x.matched.ambiguous+x.matched.unmatched}**`,`- Safe auto-create candidates: **${x.autoCreateCandidates||0}**`,`- Review findings: **${x.reviews.length}**`,'');
    if(x.reviews.length){table(lines,['Notion','ID','Date','Match','Review'],x.reviews.slice(0,40).map(r=>[r.name,r.sourceId||'—',r.date,r.match,r.message]));lines.push('');}
    if(x.suggestedLinks.length){
      lines.push('### Suggested source links','','Suggestions only; nothing is written yet. Publish still requires a deterministic mapping.','');
      table(lines,['Notion ID','GitHub item','Confidence'],x.suggestedLinks.slice(0,40).map(r=>[r.sourceId,r.itemId,`${r.score} (${r.reasons.join(', ')})`]));lines.push('');
    }
  }
  if(report.reservations){
    const x=report.reservations;
    lines.push('## Reservations & Tickets','',`- Notion reservations in trip window: **${x.total}**`,`- Confirmed reservations: **${x.confirmed}**`,`- Deterministic mappings: **${x.explicit}**`,`- Ignored by policy: **${x.ignored}**`,`- Ticket-like unmapped rows checked heuristically: **${x.ticketLike}**`,`- Review findings: **${x.reviews.length}**`,'');
    if(x.reviews.length){table(lines,['Reservation','ID','Date','Match','Review'],x.reviews.slice(0,40).map(r=>[r.name,r.sourceId||'—',r.date,r.match,r.message]));lines.push('');}
  }
  lines.push('## Safety gates','','- Confirmed / Fixed rows are locked.','- Preview resolves `config/notion-links.json` before any heuristic matching.','- Preview never downgrades Confirmed data.','- Hotel check-in/check-out dates are compared against the locked stay windows.','- One Reservation may explicitly map to multiple flight tickets.','- Private records such as insurance can be explicitly ignored.','- Booking refs, amounts, currency, traveler names and internal reservation notes are not requested.','- Unmatched low-risk Planned/Idea + Flexible/Idea rows may be auto-created only under the configured type allowlist; heuristic matches are never auto-created.','');
  return lines.join('\n');
}

function reviewExplicitItinerary({row,link,itemById,dayById,hotelByPlaceId,ticketById}){
  const reviews=[];
  if(link.sourceId&&row['Itinerary ID']&&link.sourceId!==row['Itinerary ID']){
    reviews.push({match:link.targetId,message:`BLOCK: mapping source mismatch config=${link.sourceId}, Notion=${row['Itinerary ID']}.`});
    return reviews;
  }
  if(link.targetType==='hotel'){
    const hotel=hotelByPlaceId.get(link.targetId);
    if(!hotel){reviews.push({match:link.targetId,message:'BLOCK: mapped hotel stay does not exist.'});return reviews;}
    const expected=link.stayRole==='checkIn'?hotel.checkIn:link.stayRole==='checkOut'?hotel.checkOut:null;
    if(!expected) reviews.push({match:link.targetId,message:'BLOCK: hotel mapping needs stayRole=checkIn or checkOut.'});
    else if(row.Date!==expected) reviews.push({match:`hotel:${link.targetId}:${link.stayRole}`,message:`BLOCK: hotel date Notion=${row.Date}, GitHub=${expected}.`});
    return reviews;
  }
  if(link.targetType==='travelHint'){
    const entry=itemById.get(link.targetId);
    if(!entry){reviews.push({match:link.targetId,message:'BLOCK: mapped travel-hint item does not exist.'});return reviews;}
    if(row.Date!==entry.date) reviews.push({match:link.targetId,message:`BLOCK: travel-hint date Notion=${row.Date}, GitHub=${entry.date}.`});
    if(link.syncItemTime===true){
      const nt=primaryClock(row['Start Time']),gt=itemStart(entry.item);
      if(nt&&gt&&nt!==gt){
        const protectedTime=Boolean(entry.item.ticketId)||itemStatus(entry.item,ticketById)==='confirmed';
        reviews.push({match:link.targetId,message:`${protectedTime?'BLOCK: protected ':''}Travel hint Start Time Notion=${nt}, GitHub=${gt}`});
      }
    }
    return reviews;
  }
  if(link.targetType==='day'){
    const day=dayById.get(link.targetId);
    if(!day){reviews.push({match:link.targetId,message:'BLOCK: mapped day does not exist.'});return reviews;}
    if(row.Date!==day.date) reviews.push({match:link.targetId,message:`BLOCK: date Notion=${row.Date}, GitHub=${day.date}.`});
    if(day.categories?.includes('confirmed')&&status(row.Status)!=='confirmed') reviews.push({match:link.targetId,message:`BLOCK: Notion ${status(row.Status)||'unknown'} would downgrade a confirmed day.`});
    return reviews;
  }
  if(link.targetType!=='item'){reviews.push({match:link.targetId,message:`BLOCK: unsupported targetType ${link.targetType}.`});return reviews;}
  const entry=itemById.get(link.targetId);
  if(!entry){reviews.push({match:link.targetId,message:'BLOCK: mapped item does not exist.'});return reviews;}
  if(row.Date!==entry.date) reviews.push({match:link.targetId,message:`BLOCK: date Notion=${row.Date}, GitHub=${entry.date}.`});
  const notionStatus=status(row.Status),githubStatus=itemStatus(entry.item,ticketById);
  if(githubStatus==='confirmed'&&notionStatus!=='confirmed') reviews.push({match:link.targetId,message:`BLOCK: Notion ${notionStatus||'unknown'} would downgrade GitHub confirmed.`});
  else if(notionStatus&&githubStatus&&notionStatus!==githubStatus) reviews.push({match:link.targetId,message:`Status: Notion=${notionStatus}, GitHub=${githubStatus}`});
  const nt=row['Start Time'],gt=itemStart(entry.item);
  if(/^\d{2}:\d{2}$/.test(nt||'')&&gt&&nt!==gt){
    const protectedTime=githubStatus==='confirmed'||row.Fixed===true||Boolean(entry.item.ticketId);
    reviews.push({match:link.targetId,message:`${protectedTime?'BLOCK: protected ':' '}Start Time Notion=${nt}, GitHub=${gt}`.trim()});
  }
  return reviews;
}

async function main(){
  const args=parseArgs(process.argv.slice(2));
  const token=process.env.NOTION_TOKEN?.trim();
  if(!token) throw new Error('NOTION_TOKEN is missing. Add it in GitHub Settings → Secrets and variables → Actions.');

  const cfg=await readJson(resolve(root,'config/notion-publisher.json'));
  const links=await readJson(resolve(root,'config/notion-links.json'));
  const trip=await readJson(resolve(root,'data/source/config.json'));
  const places=await readJson(resolve(root,'data/source/places.json'));
  const tickets=await readJson(resolve(root,'data/source/tickets.json'));
  const hotels=await readJson(resolve(root,'data/source/hotels.json'));
  const files=(await readdir(resolve(root,'data/source/itinerary'))).filter(name=>name.endsWith('.json')).sort();
  const days=await Promise.all(files.map(name=>readJson(resolve(root,'data/source/itinerary',name))));

  const placeById=new Map(places.map(place=>[place.id,place]));
  const ticketById=new Map(tickets.map(ticket=>[ticket.id,ticket]));
  const hotelByPlaceId=new Map(hotels.map(hotel=>[hotel.placeId,hotel]));
  const currentItems=days.flatMap(day=>day.items.map(item=>({date:day.date,dayId:day.id,item})));
  const itemById=new Map(currentItems.map(entry=>[entry.item.id,entry]));
  const dayById=new Map(days.map(day=>[day.id,day]));
  const current={days,items:currentItems};
  const inside=date=>typeof date==='string'&&date>=trip.departDate&&date<=trip.endDate;
  const report={generatedAt:new Date().toISOString(),scope:args.scope,mode:'preview',notionApiVersion:cfg.apiVersion,tripWindow:{start:trip.departDate,end:trip.endDate}};

  if(args.scope==='all'||args.scope==='itinerary'){
    const rows=(await notionQuery({token,apiVersion:cfg.apiVersion,dataSourceId:cfg.dataSources.itinerary,propertyNames:cfg.properties.itinerary})).map(row=>({...row,Date:row.Date?.start||null})).filter(row=>inside(row.Date));
    const result={total:rows.length,locked:rows.filter(row=>status(row.Status)==='confirmed'||row.Fixed===true).length,matched:{explicit:0,linked:0,heuristic:0,day:0,ambiguous:0,unmatched:0},autoCreateCandidates:0,reviews:[],suggestedLinks:[]};

    for(const row of rows){
      const explicit=links.itinerary?.[row.pageId];
      if(explicit){
        result.matched.explicit+=1;
        for(const review of reviewExplicitItinerary({row,link:explicit,itemById,dayById,hotelByPlaceId,ticketById})){
          result.reviews.push({name:row.Name,sourceId:row['Itinerary ID'],date:row.Date,match:review.match,message:review.message});
        }
        continue;
      }

      const match=matchItinerary(row,current,placeById);
      if(match.kind==='linked-day'){result.matched.linked+=1;continue;}
      if(match.kind==='linked'){
        result.matched.linked+=1;
        const notionStatus=status(row.Status),githubStatus=itemStatus(match.candidate.item,ticketById);
        const nt=primaryClock(row['Start Time']),gt=itemStart(match.candidate.item);
        const protectedItem=notionStatus==='confirmed'||row.Fixed===true||Boolean(match.candidate.item.ticketId);
        if(protectedItem&&row.Date!==match.candidate.date) result.reviews.push({name:row.Name,sourceId:row['Itinerary ID'],date:row.Date,match:match.candidate.item.id,message:`BLOCK: protected linked date Notion=${row.Date}, GitHub=${match.candidate.date}.`});
        if(protectedItem&&nt&&gt&&nt!==gt) result.reviews.push({name:row.Name,sourceId:row['Itinerary ID'],date:row.Date,match:match.candidate.item.id,message:`BLOCK: protected linked Start Time Notion=${nt}, GitHub=${gt}.`});
        if(githubStatus==='confirmed'&&notionStatus!=='confirmed') result.reviews.push({name:row.Name,sourceId:row['Itinerary ID'],date:row.Date,match:match.candidate.item.id,message:`BLOCK: Notion ${notionStatus||'unknown'} would downgrade GitHub confirmed.`});
        continue;
      }
      if(result.matched[match.kind]!=null) result.matched[match.kind]+=1;
      const locked=status(row.Status)==='confirmed'||row.Fixed===true;
      if(match.kind==='unmatched'||match.kind==='ambiguous'){
        if(match.kind==='unmatched'&&isSafeAutoCreateRow(row,cfg.autoCreateItinerary)){
          result.autoCreateCandidates+=1;
          continue;
        }
        if(locked) result.reviews.push({name:row.Name,sourceId:row['Itinerary ID'],date:row.Date,match:match.kind,message:'Locked row needs explicit mapping before publish.'});
        continue;
      }
      if(match.kind==='heuristic'&&row['Itinerary ID']) result.suggestedLinks.push({sourceId:row['Itinerary ID'],itemId:match.candidate.item.id,score:match.score,reasons:match.reasons});
      if(match.kind==='day') continue;
      const notionStatus=status(row.Status),githubStatus=itemStatus(match.candidate.item,ticketById);
      if(notionStatus&&githubStatus&&notionStatus!==githubStatus){
        const downgrade=githubStatus==='confirmed'&&notionStatus!=='confirmed';
        result.reviews.push({name:row.Name,sourceId:row['Itinerary ID'],date:row.Date,match:match.candidate.item.id,message:downgrade?`BLOCK: Notion ${notionStatus} would downgrade GitHub confirmed.`:`Status: Notion=${notionStatus}, GitHub=${githubStatus}`});
      }
      const nt=row['Start Time'],gt=itemStart(match.candidate.item);
      if(/^\d{2}:\d{2}$/.test(nt||'')&&gt&&nt!==gt) result.reviews.push({name:row.Name,sourceId:row['Itinerary ID'],date:row.Date,match:match.candidate.item.id,message:`Start Time: Notion=${nt}, GitHub=${gt}`});
    }
    report.itinerary=result;
  }

  if(args.scope==='all'||args.scope==='reservations'){
    const rows=(await notionQuery({token,apiVersion:cfg.apiVersion,dataSourceId:cfg.dataSources.reservations,propertyNames:cfg.properties.reservations})).map(row=>({...row,Date:row.Date?.start||null})).filter(row=>inside(row.Date));
    const result={total:rows.length,confirmed:rows.filter(row=>status(row.Status)==='confirmed').length,explicit:0,ignored:0,ticketLike:0,reviews:[]};

    for(const row of rows){
      const explicit=links.reservations?.[row.pageId];
      if(explicit){
        result.explicit+=1;
        if(explicit.ignore){result.ignored+=1;continue;}

        const notionStatus=status(row.Status);
        if(explicit.hotelPlaceId){
          const hotel=hotelByPlaceId.get(explicit.hotelPlaceId);
          if(!hotel) result.reviews.push({name:row.Name,sourceId:row['Reservation ID'],date:row.Date,match:explicit.hotelPlaceId,message:'BLOCK: mapped hotel stay does not exist.'});
          else{
            if(notionStatus!=='confirmed') result.reviews.push({name:row.Name,sourceId:row['Reservation ID'],date:row.Date,match:explicit.hotelPlaceId,message:`BLOCK: Notion=${notionStatus||'unknown'} conflicts with locked hotel stay.`});
            if(row.Date&&row.Date!==hotel.checkIn) result.reviews.push({name:row.Name,sourceId:row['Reservation ID'],date:row.Date,match:explicit.hotelPlaceId,message:`BLOCK: hotel reservation date Notion=${row.Date}, GitHub=${hotel.checkIn}.`});
          }
          continue;
        }

        const ticketIds=ticketIdsFor(explicit);
        if(!ticketIds.length){
          result.reviews.push({name:row.Name,sourceId:row['Reservation ID'],date:row.Date,match:'—',message:'BLOCK: deterministic reservation mapping has no ticket/hotel target.'});
          continue;
        }
        for(const ticketId of ticketIds){
          const ticket=ticketById.get(ticketId);
          if(!ticket){result.reviews.push({name:row.Name,sourceId:row['Reservation ID'],date:row.Date,match:ticketId,message:'BLOCK: mapped ticket does not exist.'});continue;}
          const githubStatus=status(ticket.status);
          if(notionStatus==='confirmed'&&githubStatus!=='confirmed') result.reviews.push({name:row.Name,sourceId:row['Reservation ID'],date:row.Date,match:ticketId,message:`Status: Notion=confirmed, GitHub=${githubStatus||'unknown'}`});
          else if(notionStatus!=='confirmed'&&githubStatus==='confirmed') result.reviews.push({name:row.Name,sourceId:row['Reservation ID'],date:row.Date,match:ticketId,message:`BLOCK: Notion=${notionStatus||'unknown'} conflicts with GitHub confirmed; no downgrade allowed.`});
        }
        continue;
      }

      if(!ticketKind(row.Type)) continue;
      result.ticketLike+=1;
      const match=matchReservation(row,{tickets,currentItems,placeById});
      const notionStatus=status(row.Status);
      if(match.kind==='unmatched'||match.kind==='ambiguous'){
        if(notionStatus==='confirmed') result.reviews.push({name:row.Name,sourceId:row['Reservation ID'],date:row.Date,match:match.kind,message:'Confirmed reservation needs an explicit ticket mapping before publish.'});
        continue;
      }
      if(!match.candidate) continue;
      const githubStatus=status(match.candidate.status);
      if(notionStatus==='confirmed'&&githubStatus!=='confirmed') result.reviews.push({name:row.Name,sourceId:row['Reservation ID'],date:row.Date,match:match.candidate.id,message:`Status: Notion=confirmed, GitHub=${githubStatus||'unknown'}`});
      else if(notionStatus!=='confirmed'&&githubStatus==='confirmed') result.reviews.push({name:row.Name,sourceId:row['Reservation ID'],date:row.Date,match:match.candidate.id,message:`BLOCK: Notion=${notionStatus||'unknown'} conflicts with GitHub confirmed; no downgrade allowed.`});
    }
    report.reservations=result;
  }

  const output=resolve(root,args.json);
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify(report,null,2)+'\n','utf8');
  const md=summary(report);
  console.log(md);
  if(args.summary) await writeFile(args.summary,md+'\n','utf8');
}

main().catch(error=>{console.error(`Notion publisher preview failed: ${error.message}`);process.exitCode=1;});
