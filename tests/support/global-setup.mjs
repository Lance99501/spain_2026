import {startStaticServer,stopStaticServer} from './static-server.mjs';

export default async function globalSetup(){
  const server=await startStaticServer();
  return async()=>stopStaticServer(server);
}
