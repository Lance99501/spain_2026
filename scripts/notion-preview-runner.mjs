import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {normalizePreviewReport} from './notion-preview-normalize.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');

function parseArgs(argv){
  const args={scope:'All',json:'artifacts/notion-preview.json',summary:process.env.GITHUB_STEP_SUMMARY||''};
  for(let i=0;i<argv.length;i+=1){
    if(argv[i]==='--scope') args.scope=argv[++i]||args.scope;
    else if(argv[i]==='--json') args.json=argv[++i]||args.json;
    else if(argv[i]==='--summary') args.summary=argv[++i]||'';
  }
  return args;
}

function table(lines,headers,rows){
  lines.push(`| ${headers.join(' | ')} |`,`| ${headers.map(()=> '---').join(' | ')} |`);
  rows.forEach(row=>lines.push(`| ${row.map(value=>String(value??'').replace(/\|/g,'\\|').replace(/\n/g,' ')).join(' | ')} |`));
}

function summary(report){
  const removed=report.normalization?.equivalentStatusReviewsRemoved||0;
  const lines=['# Spain 2026 · Notion Publisher Preview','', '> Read-only preview. No GitHub/Notion data is modified.','',`Scope: **${report.scope}**`,`Generated: ${report.generatedAt}`,''];
  if(removed) lines.push(`- Planning status aliases normalized: **${removed}** review finding(s) removed because Notion \`Planned\` and GitHub \`pending\` represent the same planning lifecycle.`,'');
  if(report.itinerary){
    const x=report.itinerary;
    lines.push('## Itinerary','',`- Notion rows in trip window: **${x.total}**`,`- Locked (Confirmed / Fixed): **${x.locked}**`,`- Deterministic mappings: **${x.matched.explicit}**`,`- Existing source links: **${x.matched.linked}**`,`- Heuristic candidates: **${x.matched.heuristic}**`,`- Day-level candidates: **${x.matched.day}**`,`- Ambiguous / unmatched: **${x.matched.ambiguous+x.matched.unmatched}**`,`- Review findings: **${x.reviews.length}**`,'');
    if(x.reviews.length){table(lines,['Notion','ID','Date','Match','Review'],x.reviews.slice(0,40).map(r=>[r.name,r.sourceId||'—',r.date,r.match,r.message]));lines.push('');}
    if(x.suggestedLinks?.length){lines.push('### Suggested source links','','Suggestions only; Publish never guesses a target.','');table(lines,['Notion ID','GitHub item','Confidence'],x.suggestedLinks.slice(0,40).map(r=>[r.sourceId,r.itemId,`${r.score} (${r.reasons.join(', ')})`]));lines.push('');}
  }
  if(report.reservations){
    const x=report.reservations;
    lines.push('## Reservations & Tickets','',`- Notion reservations in trip window: **${x.total}**`,`- Confirmed reservations: **${x.confirmed}**`,`- Deterministic mappings: **${x.explicit}**`,`- Ignored by policy: **${x.ignored}**`,`- Ticket-like unmapped rows checked heuristically: **${x.ticketLike}**`,`- Review findings: **${x.reviews.length}**`,'');
    if(x.reviews.length){table(lines,['Reservation','ID','Date','Match','Review'],x.reviews.slice(0,40).map(r=>[r.name,r.sourceId||'—',r.date,r.match,r.message]));lines.push('');}
  }
  lines.push('## Safety gates','','- Confirmed / Fixed rows remain locked; planning aliases never weaken the Confirmed downgrade guard.','- Preview resolves deterministic mappings before heuristic matching.','- Hotel check-in/check-out dates remain protected.','- Cancelled historical reservations may be explicitly ignored only after an authorized replacement is recorded.','- Booking refs, amounts, currency, traveler names, PINs and internal notes are not requested or published.','');
  return lines.join('\n');
}

async function main(){
  const args=parseArgs(process.argv.slice(2));
  const jsonPath=resolve(root,args.json);
  const rawSummary=resolve(root,'artifacts/notion-preview-raw.md');
  await mkdir(dirname(jsonPath),{recursive:true});
  const child=spawnSync(process.execPath,[resolve(root,'scripts/notion-preview.mjs'),'--scope',args.scope,'--json',args.json,'--summary',rawSummary],{cwd:root,env:process.env,encoding:'utf8'});
  if(child.stdout) process.stdout.write(child.stdout);
  if(child.stderr) process.stderr.write(child.stderr);
  if(child.status!==0) process.exit(child.status??1);

  const raw=JSON.parse(await readFile(jsonPath,'utf8'));
  const report=normalizePreviewReport(raw);
  await writeFile(jsonPath,JSON.stringify(report,null,2)+'\n','utf8');
  const md=summary(report);
  console.log('\n'+md);
  if(args.summary) await writeFile(args.summary,md+'\n','utf8');
}

main().catch(error=>{console.error(`Notion preview runner failed: ${error.message}`);process.exitCode=1;});
