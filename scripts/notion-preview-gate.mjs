import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

function parseArgs(argv){
  const args={report:'artifacts/notion-preview.json',githubOutput:process.env.GITHUB_OUTPUT||'',summary:process.env.GITHUB_STEP_SUMMARY||''};
  for(let i=0;i<argv.length;i+=1){
    if(argv[i]==='--report') args.report=argv[++i]||args.report;
    else if(argv[i]==='--github-output') args.githubOutput=argv[++i]||'';
    else if(argv[i]==='--summary') args.summary=argv[++i]||'';
  }
  return args;
}

function needsReview(message=''){
  const text=String(message);
  return text.startsWith('BLOCK:')
    || text.includes('Locked row needs explicit mapping before publish.')
    || text.includes('Confirmed reservation needs an explicit ticket mapping before publish.');
}

export function actionRequiredFindings(report){
  const findings=[];
  for(const review of report?.itinerary?.reviews||[]){
    if(needsReview(review?.message)) findings.push({source:'Itinerary',message:review.message});
  }
  for(const review of report?.reservations?.reviews||[]){
    if(needsReview(review?.message)||String(review?.message||'').startsWith('Status:')){
      findings.push({source:'Reservation',message:review.message});
    }
  }
  return findings;
}

async function append(path,text){
  if(!path) return;
  await writeFile(path,text,{encoding:'utf8',flag:'a'});
}

async function main(){
  const args=parseArgs(process.argv.slice(2));
  const report=JSON.parse(await readFile(resolve(args.report),'utf8'));
  const findings=actionRequiredFindings(report);
  const actionRequired=findings.length>0;

  await append(args.githubOutput,`action_required=${actionRequired?'true':'false'}\naction_required_count=${findings.length}\n`);
  await append(args.summary,`\n## Automatic Preview gate\n\n- Action required: **${actionRequired?'YES':'no'}**\n- Protected / confirmed findings: **${findings.length}**\n- Advisory differences on flexible or unmapped planning rows do not trigger notifications.\n- Publish remains manual.\n`);

  console.log(`Automatic Preview gate: ${findings.length} action-required finding(s).`);
}

const invoked=process.argv[1]&&resolve(process.argv[1])===resolve(fileURLToPath(import.meta.url));
if(invoked) main().catch(error=>{console.error(`Notion preview gate failed: ${error.message}`);process.exitCode=1;});
