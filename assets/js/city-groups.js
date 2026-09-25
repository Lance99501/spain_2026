export const MAIN_CITY_GROUPS=Object.freeze({
  Barcelona:Object.freeze(['Barcelona','Sitges']),
  Sevilla:Object.freeze(['Sevilla','Cordoba']),
  Granada:Object.freeze(['Granada']),
  Madrid:Object.freeze(['Madrid','Segovia','Toledo'])
});

export function mainCity(city){
  if(city==='Cordoba') return 'Sevilla';
  if(city==='Segovia'||city==='Toledo') return 'Madrid';
  if(city==='Sitges') return 'Barcelona';
  return city;
}
