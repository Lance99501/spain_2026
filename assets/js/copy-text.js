export async function copyText(text){
  if(!text) return false;
  if(navigator.clipboard?.writeText){
    try{await navigator.clipboard.writeText(text);return true;}catch{}
  }
  const input=document.createElement('textarea');
  input.value=text;
  input.style.position='fixed';
  input.style.opacity='0';
  document.body.appendChild(input);
  input.select();
  let copied=false;
  try{copied=document.execCommand('copy');}catch{}
  input.remove();
  return copied;
}

export async function copyFromButton(button){
  const original=button.textContent;
  const success=await copyText(button.dataset.copyText);
  button.textContent=success?'已複製':'複製失敗';
  window.setTimeout(()=>{if(button.isConnected) button.textContent=original;},1800);
}
