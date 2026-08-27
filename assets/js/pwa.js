function updateNetworkStatus(){
  const status=document.getElementById('pwaStatus');
  if(!status) return;

  const offline=!navigator.onLine;
  status.hidden=!offline;
  status.textContent=offline?'離線模式 · 已顯示快取行程':'';
}

export async function initPwa(){
  updateNetworkStatus();
  window.addEventListener('online',updateNetworkStatus);
  window.addEventListener('offline',updateNetworkStatus);

  if(!('serviceWorker' in navigator)) return;

  try{
    await navigator.serviceWorker.register('./service-worker.js',{
      scope:'./',
      updateViaCache:'none'
    });
  }catch(error){
    console.warn('PWA service worker registration failed',error);
  }
}
