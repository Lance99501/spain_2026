export function createJsonDataSource(endpoint){
  let pending=null;

  async function load({force=false}={}){
    if(!force&&pending) return pending;

    pending=(async()=>{
      const response=await fetch(endpoint,{
        headers:{Accept:'application/json'}
      });

      if(!response.ok){
        throw new Error(`Data request failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    })();

    try{
      return await pending;
    }catch(error){
      pending=null;
      throw error;
    }
  }

  function clear(){
    pending=null;
  }

  return {load,clear,endpoint};
}
