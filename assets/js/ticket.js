function b64ToBytes(value){
  const bin=atob(value);
  return Uint8Array.from(bin,c=>c.charCodeAt(0));
}

async function decryptTicket(payload,password){
  const keyMaterial=await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key=await crypto.subtle.deriveKey(
    {name:'PBKDF2',salt:b64ToBytes(payload.salt),iterations:150000,hash:'SHA-256'},
    keyMaterial,
    {name:'AES-GCM',length:256},
    false,
    ['decrypt']
  );

  const plain=await crypto.subtle.decrypt(
    {name:'AES-GCM',iv:b64ToBytes(payload.iv)},
    key,
    b64ToBytes(payload.ct)
  );

  return new TextDecoder().decode(plain);
}

export function createTicketController({tickets,encryptedTickets,sessionMinutes=5}){
  const ticketById=new Map(tickets.map(ticket=>[ticket.id,ticket]));

  const ticketModal=document.getElementById('ticketModal');
  const ticketClose=document.getElementById('ticketClose');
  const ticketUnlockForm=document.getElementById('ticketUnlockForm');
  const ticketPassword=document.getElementById('ticketPassword');
  const ticketError=document.getElementById('ticketError');
  const ticketResult=document.getElementById('ticketResult');
  const ticketQr=document.getElementById('ticketQr');
  const ticketResultTitle=document.getElementById('ticketResultTitle');
  const ticketOpenLink=document.getElementById('ticketOpenLink');
  const ticketModalSub=document.getElementById('ticketModalSub');

  const SESSION_KEY='spain2026_ticket_unlock_v1';
  const SESSION_MS=sessionMinutes*60*1000;

  let activeTicket=null;

  function getSession(){
    try{
      const raw=sessionStorage.getItem(SESSION_KEY);
      if(!raw) return null;
      const value=JSON.parse(raw);

      if(!value?.password||!value?.expiresAt||Date.now()>=value.expiresAt){
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }

      return value;
    }catch{
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function saveSession(password){
    sessionStorage.setItem(SESSION_KEY,JSON.stringify({
      password,
      expiresAt:Date.now()+SESSION_MS
    }));
  }

  function clearSession(){
    sessionStorage.removeItem(SESSION_KEY);
  }

  function reset(){
    ticketUnlockForm?.reset();
    if(ticketUnlockForm) ticketUnlockForm.style.display='grid';
    if(ticketError) ticketError.textContent='';
    ticketResult?.classList.remove('show');
    if(ticketQr) ticketQr.innerHTML='';
    ticketOpenLink?.removeAttribute('href');
  }

  async function showResult(password){
    if(!activeTicket) throw new Error('ticket-not-selected');

    const payload=encryptedTickets[activeTicket.id];
    if(!payload) throw new Error('ticket-payload-not-found');

    const url=await decryptTicket(payload,password);

    if(ticketError) ticketError.textContent='';
    if(ticketUnlockForm) ticketUnlockForm.style.display='none';
    ticketResult?.classList.add('show');
    if(ticketResultTitle) ticketResultTitle.textContent=activeTicket.label;
    if(ticketOpenLink) ticketOpenLink.href=url;
    if(ticketQr) ticketQr.innerHTML='';

    if(window.QRCode&&ticketQr){
      new QRCode(ticketQr,{
        text:url,
        width:220,
        height:220,
        correctLevel:QRCode.CorrectLevel.M
      });
    }else if(ticketQr){
      ticketQr.textContent='QR 元件載入失敗，請使用下方連結。';
    }
  }

  async function open(ticketId){
    activeTicket=ticketById.get(ticketId)||null;
    if(!activeTicket){
      console.error('Unknown ticketId',ticketId);
      return;
    }

    reset();
    ticketModal?.classList.add('open');
    document.body.style.overflow='hidden';

    const session=getSession();
    if(session){
      if(ticketModalSub) ticketModalSub.textContent=activeTicket.label+`｜已解鎖，${sessionMinutes} 分鐘內免再輸入`;
      if(ticketUnlockForm) ticketUnlockForm.style.display='none';
      if(ticketError) ticketError.textContent='正在載入票券…';

      try{
        await showResult(session.password);
        return;
      }catch{
        clearSession();
        reset();
      }
    }

    if(ticketModalSub) ticketModalSub.textContent=activeTicket.label+'｜輸入老婆生日後顯示 QR Code';
    setTimeout(()=>ticketPassword?.focus(),80);
  }

  function close(){
    ticketModal?.classList.remove('open');
    document.body.style.overflow='';
    reset();
  }

  ticketClose?.addEventListener('click',close);
  ticketModal?.addEventListener('click',event=>{
    if(event.target===ticketModal) close();
  });

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&ticketModal?.classList.contains('open')) close();
  });

  ticketUnlockForm?.addEventListener('submit',async event=>{
    event.preventDefault();
    if(ticketError) ticketError.textContent='解鎖中…';

    try{
      const password=ticketPassword.value;
      await showResult(password);
      saveSession(password);

      if(ticketModalSub){
        ticketModalSub.textContent=activeTicket.label+`｜已解鎖，${sessionMinutes} 分鐘內免再輸入`;
      }
    }catch{
      clearSession();
      if(ticketError) ticketError.textContent='密碼錯誤，請再試一次。';
      ticketPassword?.select();
    }
  });

  return {open,close,clearSession};
}
