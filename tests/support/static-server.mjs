import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));

const contentTypes={
  '.css':'text/css; charset=utf-8',
  '.html':'text/html; charset=utf-8',
  '.jpg':'image/jpeg',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.webmanifest':'application/manifest+json; charset=utf-8'
};

function resolveRequestPath(requestUrl){
  const pathname=decodeURIComponent(new URL(requestUrl,'http://localhost').pathname);
  const relativePath=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const filePath=resolve(root,relativePath);
  const rootPrefix=root.endsWith(sep)?root:`${root}${sep}`;

  return filePath.startsWith(rootPrefix)?filePath:null;
}

const handleRequest=async(request,response)=>{
  if(request.method!=='GET'&&request.method!=='HEAD'){
    response.writeHead(405,{'Allow':'GET, HEAD'});
    response.end();
    return;
  }

  const filePath=resolveRequestPath(request.url||'/');
  if(!filePath){
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try{
    const fileStat=await stat(filePath);
    if(!fileStat.isFile()) throw new Error('not-a-file');

    response.writeHead(200,{
      'Cache-Control':'no-store',
      'Content-Length':fileStat.size,
      'Content-Type':contentTypes[extname(filePath).toLowerCase()]||'application/octet-stream'
    });

    if(request.method==='HEAD'){
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  }catch{
    response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
    response.end('Not Found');
  }
};

export async function startStaticServer({
  host='127.0.0.1',
  port=Number(process.env.PORT||4173)
}={}){
  const server=createServer(handleRequest);

  await new Promise((resolveStart,rejectStart)=>{
    server.once('error',rejectStart);
    server.listen(port,host,()=>{
      server.off('error',rejectStart);
      resolveStart();
    });
  });

  return server;
}

export async function stopStaticServer(server){
  if(!server?.listening) return;

  const stopped=new Promise((resolveStop,rejectStop)=>{
    server.close(error=>error?rejectStop(error):resolveStop());
  });
  server.closeAllConnections?.();
  await stopped;
}

const isEntryPoint=process.argv[1]
  && resolve(process.argv[1])===fileURLToPath(import.meta.url);

if(isEntryPoint){
  const host='127.0.0.1';
  const port=Number(process.env.PORT||4173);
  const server=await startStaticServer({host,port});

  console.log(`Spain 2026 test server listening on http://${host}:${port}`);

  const shutdown=async()=>{
    await stopStaticServer(server);
    process.exit(0);
  };
  process.once('SIGINT',shutdown);
  process.once('SIGTERM',shutdown);
}
