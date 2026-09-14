import {mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

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

function itemStatus(item,ticketById){
  if(item.transport?.status) return status(item.transport.status);
  if(item.ticketId&&ticketById.get(item.ticketId)?.status) return status(ticketById.get(item.ticketId).status);
  const note=normalize((item.noteSegments||[]).map(x=>x.text).join(' '));
  if(note.includes('已確認')) return 'confirmed';
  if(note.includes('待確認')||note.includes('待購票')) return 'pending';
  return null;
}

function itemStart(item){
  if(/^\d{2}:\d{2}$/.test(item.startTime||'')) return item.startTime;
  if(/^\d{2}:\d{2}$/.test(item.time||'')) return item.time;
  return '';
}

function table(lines,headers,rows){
  lines.push(`| ${headers.join(' | ')} |`,`| ${headers.map(()=> '---').join(' | ')} |`);
  rows.forEach(row=>lines.push(`| ${row.map(value=>String(value??'').replace(/\|/g,'\\|').replace(/\n/g,' ')).join(' | ')} |`));
}

function summary(report){
  const lines=['# Spain 2026 · Notion Publisher','',`Mode: **Publish**`,`Scope: **${report.scope}**`,`Generated: ${report.generatedAt}`,''];
  if(report.blockers.length){
    lines.push('## ⛔ Publish blocked','',`**${report.blockers.length}** safety issue(s) must be reviewed. No source JSON was written.`,'');
    table(lines,['Source','Notion','Target','Reason'],report.blockers.map(x=>[x.source,x.name||x.pageId,x.target||'—',x.message]));
    lines.push('');
  }else{
    lines.push('## Result','',`- Changes prepared: **${report.changes.length}**`,`- Warnings / skipped unmapped rows: **${report.warnings.length}**`,'');
    if(report.changes.length){
      table(lines,['Source','Target','Change'],report.changes.map(x=>[x.source,x.target,x.message]));
      lines.push('');
    }
  }
  if(report.warnings.length){
    lines.push('## Warnings','');
    table(lines,['Source','Notion','Reason'],report.warnings.slice(0,50).map(x=>[x.source,x.name||x.pageId,x.message]));
    lines.push('');
  }
  lines.push('## Safety gates','','- Only entries in `config/notion-links.json` may be written.','- GitHub `confirmed` can never be downgraded by this workflow.','- A date change on a linked item is blocked instead of moving it automatically.','- Time changes on Confirmed / Fixed / ticketed items are blocked for manual review.','- Reservation publishing may promote a mapped ticket to Confirmed, but never lower a Confirmed ticket.','- Unmapped Notion rows are skipped and reported; they are never guessed during Publish.','- Booking refs, amount, currency, traveler names and private reservation notes are never requested.','');
  return lines.join('\n');
}

async function writeReport(args,report){
  const output=resolve(root,args.json);
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify(report,null,2)+'\n','utf8');
  const md=summary(report);
  console.log(md);
  if(args.summary) await writeFile(args.summary,md+'\n','utf8');
}

function addChange(report,source,target,message){report.changes.push({source,target,message});}
function addBlock(report,source,row,target,message){report.blockers.push({source,pageId:row?.pageId,name:row?.Name||null,target,message});}
function addWarning(report,source,row,message){report.warnings.push({source,pageId:row?.pageId,name:row?.Name||null,message});}

async function main(){
  const args=parseArgs(process.argv.slice(2));
  const token=process.env.NOTION_TOKEN?.trim();
  if(!token) throw new Error('NOTION_TOKEN is missing. Add it in GitHub Settings → Secrets and variables → Actions.');

  const cfg=await readJson(resolve(root,'config/notion-publisher.json'));
  const links=await readJson(resolve(root,'config/notion-links.json'));
  const trip=await readJson(resolve(root,'data/source/config.json'));
  const tickets=await readJson(resolve(root,'data/source/tickets.json'));
  const files=(await readdir(resolve(root,'data/source/itinerary'))).filter(name=>name.endsWith('.json')).sort();
  const days=await Promise.all(files.map(async name=>({name,day:await readJson(resolve(root,'data/source/itinerary',name))})));

  const ticketById=new Map(tickets.map(ticket=>[ticket.id,ticket]));
  const dayById=new Map(days.map(entry=>[entry.day.id,entry]));
  const itemById=new Map(days.flatMap(entry=>entry.day.items.map(item=>[item.id,{...entry,item}])));
  const inside=date=>typeof date==='string'&&date>=trip.departDate&&date<=trip.endDate;
  const report={generatedAt:new Date().toISOString(),scope:args.scope,mode:'publish',changes:[],warnings:[],blockers:[]};
  const changedDayFiles=new Set();
  let ticketsChanged=false;

  let itineraryRows=[];
  if(args.scope==='all'||args.scope==='itinerary'){
    itineraryRows=(await notionQuery({token,apiVersion:cfg.apiVersion,dataSourceId:cfg.dataSources.itinerary,propertyNames:cfg.properties.itinerary}))
      .map(row=>({...row,Date:row.Date?.start||null})).filter(row=>inside(row.Date));
    const rowByPage=new Map(itineraryRows.map(row=>[row.pageId,row]));

    for(const [pageId,link] of Object.entries(links.itinerary||{})){
      const row=rowByPage.get(pageId);
      if(!row){addWarning(report,'Itinerary',{pageId,Name:link.note},'Mapped Notion row was not returned in the trip window; skipped.');continue;}

      if(link.targetType==='day'){
        const entry=dayById.get(link.targetId);
        if(!entry){addBlock(report,'Itinerary',row,link.targetId,'Mapped day does not exist in GitHub.');continue;}
        if(row.Date!==entry.day.date){addBlock(report,'Itinerary',row,link.targetId,`Date mismatch: Notion=${row.Date}, GitHub=${entry.day.date}. Automatic day moves are disabled.`);continue;}
        const notionStatus=status(row.Status);
        if(entry.day.categories?.includes('confirmed')&&notionStatus!=='confirmed'){
          addBlock(report,'Itinerary',row,link.targetId,`Confirmed downgrade guard: Notion=${notionStatus||'unknown'} would lower a GitHub day containing confirmed data.`);
          continue;
        }
        if(link.sourceId&&entry.day.sourceItineraryId!==link.sourceId){
          entry.day.sourceItineraryId=link.sourceId;
          changedDayFiles.add(entry.name);
          addChange(report,'Itinerary',link.targetId,`Linked ${link.sourceId} to day.`);
        }
        continue;
      }

      if(link.targetType!=='item'){
        addBlock(report,'Itinerary',row,link.targetId,`Unsupported targetType: ${link.targetType}`);
        continue;
      }

      const entry=itemById.get(link.targetId);
      if(!entry){addBlock(report,'Itinerary',row,link.targetId,'Mapped item does not exist in GitHub.');continue;}
      if(row.Date!==entry.day.date){addBlock(report,'Itinerary',row,link.targetId,`Date mismatch: Notion=${row.Date}, GitHub=${entry.day.date}. Automatic item moves are disabled.`);continue;}

      const notionStatus=status(row.Status);
      const githubStatus=itemStatus(entry.item,ticketById);
      if(githubStatus==='confirmed'&&notionStatus!=='confirmed'){
        addBlock(report,'Itinerary',row,link.targetId,`Confirmed downgrade guard: Notion=${notionStatus||'unknown'}, GitHub=confirmed.`);
        continue;
      }

      const notionTime=row['Start Time'];
      const githubTime=itemStart(entry.item);
      if(/^\d{2}:\d{2}$/.test(notionTime||'')&&githubTime&&notionTime!==githubTime){
        const protectedTime=githubStatus==='confirmed'||row.Fixed===true||Boolean(entry.item.ticketId);
        if(protectedTime){
          addBlock(report,'Itinerary',row,link.targetId,`Protected time mismatch: Notion=${notionTime}, GitHub=${githubTime}. Confirmed / Fixed / ticketed times require manual verification.`);
          continue;
        }
        entry.item.time=notionTime;
        entry.item.startTime=notionTime;
        changedDayFiles.add(entry.name);
        addChange(report,'Itinerary',link.targetId,`Start time ${githubTime||'—'} → ${notionTime}.`);
      }

      if(entry.item.transport&&notionStatus==='confirmed'&&status(entry.item.transport.status)!=='confirmed'){
        entry.item.transport.status='confirmed';
        changedDayFiles.add(entry.name);
        addChange(report,'Itinerary',link.targetId,'Transport status promoted to confirmed.');
      }

      if(link.sourceId&&entry.item.sourceItineraryId!==link.sourceId){
        entry.item.sourceItineraryId=link.sourceId;
        changedDayFiles.add(entry.name);
        addChange(report,'Itinerary',link.targetId,`Linked ${link.sourceId} to item.`);
      }
    }

    for(const row of itineraryRows){
      const locked=status(row.Status)==='confirmed'||row.Fixed===true;
      if(locked&&!links.itinerary?.[row.pageId]) addWarning(report,'Itinerary',row,'Locked row is not explicitly mapped yet; Publish skipped it.');
    }
  }

  let reservationRows=[];
  if(args.scope==='all'||args.scope==='reservations'){
    reservationRows=(await notionQuery({token,apiVersion:cfg.apiVersion,dataSourceId:cfg.dataSources.reservations,propertyNames:cfg.properties.reservations}))
      .map(row=>({...row,Date:row.Date?.start||null})).filter(row=>inside(row.Date));
    const rowByPage=new Map(reservationRows.map(row=>[row.pageId,row]));

    for(const [pageId,link] of Object.entries(links.reservations||{})){
      const row=rowByPage.get(pageId);
      if(!row){addWarning(report,'Reservation',{pageId,Name:link.note},'Mapped Notion reservation was not returned in the trip window; skipped.');continue;}
      const ticket=ticketById.get(link.ticketId);
      if(!ticket){addBlock(report,'Reservation',row,link.ticketId,'Mapped ticket does not exist in GitHub.');continue;}

      const notionStatus=status(row.Status);
      const githubStatus=status(ticket.status);
      if(githubStatus==='confirmed'&&notionStatus!=='confirmed'){
        addBlock(report,'Reservation',row,link.ticketId,`Confirmed downgrade guard: Notion=${notionStatus||'unknown'}, GitHub=confirmed.`);
        continue;
      }
      if(notionStatus==='confirmed'&&githubStatus!=='confirmed'){
        ticket.status='confirmed';
        ticketsChanged=true;
        addChange(report,'Reservation',link.ticketId,`Ticket status ${githubStatus||'unknown'} → confirmed.`);
      }
    }

    for(const row of reservationRows){
      if(status(row.Status)==='confirmed'&&!links.reservations?.[row.pageId]) addWarning(report,'Reservation',row,'Confirmed reservation is not explicitly mapped yet; Publish skipped it.');
    }
  }

  if(report.blockers.length){
    await writeReport(args,report);
    process.exitCode=2;
    return;
  }

  for(const name of changedDayFiles){
    const entry=days.find(x=>x.name===name);
    await writeFile(resolve(root,'data/source/itinerary',name),JSON.stringify(entry.day,null,2)+'\n','utf8');
  }
  if(ticketsChanged) await writeFile(resolve(root,'data/source/tickets.json'),JSON.stringify(tickets,null,2)+'\n','utf8');

  if(changedDayFiles.size||ticketsChanged){
    const swPath=resolve(root,'service-worker.js');
    const sw=await readFile(swPath,'utf8');
    const pattern=/const CACHE_VERSION='spain2026-(\d{8})-v(\d+)'/;
    const match=sw.match(pattern);
    if(!match) throw new Error('Unable to locate service worker cache version.');
    const today=new Date().toISOString().slice(0,10).replaceAll('-','');
    const nextVersion=Number(match[2])+1;
    const next=sw.replace(pattern,`const CACHE_VERSION='spain2026-${today}-v${nextVersion}'`);
    await writeFile(swPath,next,'utf8');
    addChange(report,'PWA','service-worker.js',`Cache version bumped to spain2026-${today}-v${nextVersion}.`);
  }

  await writeReport(args,report);
}

main().catch(error=>{console.error(`Notion publisher failed: ${error.message}`);process.exitCode=1;});
