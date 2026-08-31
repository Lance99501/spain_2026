const DRIVE_FILE_ID_PATTERN=/^[A-Za-z0-9_-]{10,}$/;

export function driveFileUrl(fileId){
  if(!DRIVE_FILE_ID_PATTERN.test(fileId||'')){
    throw new Error('invalid-drive-file-id');
  }
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
}

function createDriveLink(ticket,fileId,index,total){
  const link=document.createElement('a');
  link.className='ticket-drive-link';
  link.href=driveFileUrl(fileId);
  link.target='_blank';
  link.rel='noopener noreferrer';
  link.referrerPolicy='no-referrer';
  link.setAttribute(
    'aria-label',
    `在 Google Drive 開啟 ${ticket.label}${total>1?`，票券 ${index+1}`:''}`
  );

  const icon=document.createElement('span');
  icon.className='ticket-drive-icon';
  icon.setAttribute('aria-hidden','true');
  icon.textContent='▤';

  const copy=document.createElement('span');
  copy.className='ticket-drive-copy';

  const title=document.createElement('b');
  title.textContent=total>1?`票券 ${index+1}`:'開啟 PDF 票券';

  const hint=document.createElement('small');
  hint.textContent='Google Drive 會確認目前帳戶的存取權限';

  const arrow=document.createElement('span');
  arrow.className='ticket-drive-arrow';
  arrow.setAttribute('aria-hidden','true');
  arrow.textContent='↗';

  copy.append(title,hint);
  link.append(icon,copy,arrow);
  return link;
}

export function createTicketController({tickets,ticketDriveFileIds={}}){
  const ticketById=new Map(tickets.map(ticket=>[ticket.id,ticket]));

  const ticketModal=document.getElementById('ticketModal');
  const ticketClose=document.getElementById('ticketClose');
  const ticketModalTitle=document.getElementById('ticketModalTitle');
  const ticketModalSub=document.getElementById('ticketModalSub');
  const ticketResultTitle=document.getElementById('ticketResultTitle');
  const ticketDriveStatus=document.getElementById('ticketDriveStatus');
  const ticketDriveList=document.getElementById('ticketDriveList');

  let activeTicket=null;
  let returnFocusElement=null;

  function reset(){
    ticketDriveList?.replaceChildren();
    if(ticketDriveStatus){
      ticketDriveStatus.className='ticket-drive-status';
      ticketDriveStatus.textContent='';
    }
  }

  function render(){
    reset();
    if(!activeTicket) return;

    const fileIds=ticketDriveFileIds[activeTicket.id]||[];
    if(ticketModalTitle) ticketModalTitle.textContent='Google Drive 票券';
    if(ticketModalSub) ticketModalSub.textContent=activeTicket.label;
    if(ticketResultTitle) ticketResultTitle.textContent=activeTicket.label;

    if(!fileIds.length){
      if(ticketDriveStatus){
        ticketDriveStatus.classList.add('missing');
        ticketDriveStatus.textContent='此票券尚未同步到 Google Drive。';
      }
      return;
    }

    if(ticketDriveStatus){
      ticketDriveStatus.textContent=navigator.onLine===false
        ?'目前處於離線狀態；開啟票券需要網路或 Google Drive 的離線檔案。'
        :'檔案維持原有 Drive 權限；請使用已獲授權的 Google 帳戶開啟。';
    }

    fileIds.forEach((fileId,index)=>{
      ticketDriveList?.append(createDriveLink(activeTicket,fileId,index,fileIds.length));
    });
  }

  function open(ticketId){
    activeTicket=ticketById.get(ticketId)||null;
    if(!activeTicket){
      console.error('Unknown ticketId',ticketId);
      return;
    }

    returnFocusElement=document.activeElement instanceof HTMLElement?document.activeElement:null;
    render();
    ticketModal?.classList.add('open');
    ticketModal?.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';

    setTimeout(()=>{
      const firstLink=ticketDriveList?.querySelector('a[href]');
      (firstLink||ticketClose)?.focus();
    },0);
  }

  function close(){
    ticketModal?.classList.remove('open');
    ticketModal?.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    reset();

    if(returnFocusElement?.isConnected){
      returnFocusElement.focus();
    }
    returnFocusElement=null;
    activeTicket=null;
  }

  ticketClose?.addEventListener('click',close);
  ticketModal?.addEventListener('click',event=>{
    if(event.target===ticketModal) close();
  });

  document.addEventListener('keydown',event=>{
    if(!ticketModal?.classList.contains('open')) return;

    if(event.key==='Escape'){
      event.preventDefault();
      close();
      return;
    }

    if(event.key!=='Tab') return;

    const focusable=[...ticketModal.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )].filter(element=>element.offsetParent!==null);

    if(!focusable.length){
      event.preventDefault();
      return;
    }

    const first=focusable[0];
    const last=focusable[focusable.length-1];

    if(event.shiftKey&&document.activeElement===first){
      event.preventDefault();
      last.focus();
    }else if(!event.shiftKey&&document.activeElement===last){
      event.preventDefault();
      first.focus();
    }
  });

  return {open,close};
}
