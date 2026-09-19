const DEFAULT_HOME_TIME_ZONE='Asia/Taipei';
const DEFAULT_TRIP_TIME_ZONE='Europe/Madrid';
const DEFAULT_TRIP_TIME_ZONE_START='2026-10-09T11:25:00Z';

function partsInTimeZone(date,timeZone){
  const formatter=new Intl.DateTimeFormat('en-CA',{
    timeZone,
    year:'numeric',
    month:'2-digit',
    day:'2-digit',
    hour:'2-digit',
    minute:'2-digit',
    hourCycle:'h23'
  });
  return Object.fromEntries(
    formatter.formatToParts(date)
      .filter(part=>part.type!=='literal')
      .map(part=>[part.type,part.value])
  );
}

export function tripTimeZoneAt(date=new Date(),config={}){
  const homeTimeZone=config.homeTimeZone||DEFAULT_HOME_TIME_ZONE;
  const tripTimeZone=config.tripTimeZone||DEFAULT_TRIP_TIME_ZONE;
  const startsAt=Date.parse(config.tripTimeZoneStartsAt||DEFAULT_TRIP_TIME_ZONE_START);
  return Number.isFinite(startsAt)&&date.getTime()<startsAt?homeTimeZone:tripTimeZone;
}

export function tripTimeZoneLabel(date=new Date(),config={}){
  const timeZone=tripTimeZoneAt(date,config);
  if(timeZone===(config.homeTimeZone||DEFAULT_HOME_TIME_ZONE)) return '台北時間';
  if(timeZone===(config.tripTimeZone||DEFAULT_TRIP_TIME_ZONE)) return '西班牙時間';
  return timeZone;
}

export function dateInTripTimeZone(date=new Date(),config={}){
  const {year,month,day}=partsInTimeZone(date,tripTimeZoneAt(date,config));
  return `${year}-${month}-${day}`;
}

export function timeInTripTimeZone(date=new Date(),config={}){
  const timeZone=tripTimeZoneAt(date,config);
  const {hour,minute}=partsInTimeZone(date,timeZone);
  return {
    text:`${hour}:${minute}`,
    minutes:Number(hour)*60+Number(minute),
    timeZone
  };
}
