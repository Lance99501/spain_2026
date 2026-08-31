export function dateInDeviceTimeZone(date=new Date()){
  const year=date.getFullYear();
  const month=String(date.getMonth()+1).padStart(2,'0');
  const day=String(date.getDate()).padStart(2,'0');

  return `${year}-${month}-${day}`;
}

export function timeInDeviceTimeZone(date=new Date()){
  const hour=date.getHours();
  const minute=date.getMinutes();

  return {
    text:`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,
    minutes:hour*60+minute
  };
}
