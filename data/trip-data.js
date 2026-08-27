// Static data provider for GitHub Pages.
// Future backend migration: keep this shape and replace assets/js/api.js with HTTP calls.

const googleSearch = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const googleDirections = (origin, destination, waypoints = [], mode = 'walking') => {
  const params = new URLSearchParams({api:'1', origin, destination, travelmode:mode});
  if (waypoints.length) params.set('waypoints', waypoints.join('|'));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

export const tripConfig = {
  departDate: '2026-10-08',
  spainStartDate: '2026-10-09',
  endDate: '2026-10-25',
  ticketSessionMinutes: 5
};

export const places = [
      // Barcelona
      {city:'Barcelona',name:'Hotel Royal Passeig de Gracia',type:'hotel',status:'hotel',lat:41.3949,lng:2.1618,address:'Passeig de Gràcia 84, Barcelona',dates:'10/09–10/14'},
      {city:'Barcelona',name:'Basílica de la Sagrada Família',type:'attraction',status:'confirmed',lat:41.40363,lng:2.17436,address:'Carrer de Mallorca 401, Barcelona',dates:'10/10 09:15'},
      {city:'Barcelona',name:'Recinte Modernista de Sant Pau',type:'attraction',status:'pending',lat:41.41195,lng:2.17447,address:'Carrer de Sant Antoni Maria Claret 167, Barcelona',dates:'10/10 約 14:00'},
      {city:'Barcelona',name:'Park Güell',type:'attraction',status:'confirmed',lat:41.41449,lng:2.15269,address:'Barcelona',dates:'10/11 09:30'},
      {city:'Barcelona',name:'Casa Batlló',type:'attraction',status:'confirmed',lat:41.39164,lng:2.16485,address:'Passeig de Gràcia 43, Barcelona',dates:'10/11 15:45'},
      {city:'Barcelona',name:'Mercat de la Boqueria',type:'attraction',status:'flex',lat:41.38174,lng:2.17159,address:'La Rambla 91, Barcelona',dates:'10/13 09:00'},
      {city:'Barcelona',name:'Barcelona Cathedral',type:'attraction',status:'flex',lat:41.38396,lng:2.17620,address:'Pla de la Seu, Barcelona',dates:'10/13'},
      {city:'Barcelona',name:'Arc de Triomf',type:'attraction',status:'flex',lat:41.39105,lng:2.18065,address:'Passeig de Lluís Companys, Barcelona',dates:'10/13 14:00'},
      {city:'Barcelona',name:'Parc de la Ciutadella',type:'attraction',status:'flex',lat:41.38810,lng:2.18730,address:'Barcelona',dates:'10/13'},
      {city:'Barcelona',name:'Barceloneta Beach',type:'attraction',status:'flex',lat:41.37840,lng:2.19250,address:'Barcelona',dates:'10/13'},
      {city:'Barcelona',name:'Barcelona-Sants',type:'transport',status:'transport',lat:41.37910,lng:2.14010,address:'Barcelona',dates:'10/14 08:30'},
      {city:'Barcelona',name:'Sitges Old Town',type:'attraction',status:'flex',lat:41.23720,lng:1.80590,address:'Sitges, Barcelona',dates:'10/12'},

      // Sevilla
      {city:'Sevilla',name:'abba Sevilla',type:'hotel',status:'hotel',lat:37.39310,lng:-5.99130,address:'Plaza de la Encarnación 19, Sevilla',dates:'10/14–10/18'},
      {city:'Sevilla',name:'Setas de Sevilla',type:'attraction',status:'flex',lat:37.39305,lng:-5.99125,address:'Plaza de la Encarnación, Sevilla',dates:'10/14'},
      {city:'Sevilla',name:'Real Alcázar de Sevilla',type:'attraction',status:'confirmed',lat:37.38300,lng:-5.99020,address:'Patio de Banderas, Sevilla',dates:'10/15 09:30'},
      {city:'Sevilla',name:'Catedral de Sevilla + Giralda',type:'attraction',status:'confirmed',lat:37.38610,lng:-5.99300,address:'Avenida de la Constitución, Sevilla',dates:'10/15 15:00'},
      {city:'Sevilla',name:'Plaza de España',type:'attraction',status:'flex',lat:37.37720,lng:-5.98690,address:'Plaza de España, Sevilla',dates:'10/17'},
      {city:'Sevilla',name:'Torre del Oro',type:'attraction',status:'flex',lat:37.38250,lng:-5.99630,address:'Paseo de Cristóbal Colón, Sevilla',dates:'10/17'},
      {city:'Sevilla',name:'Mercado de Triana',type:'attraction',status:'flex',lat:37.38560,lng:-6.00340,address:'Plaza del Altozano, Sevilla',dates:'10/17'},
      {city:'Sevilla',name:'Sevilla-Santa Justa',type:'transport',status:'transport',lat:37.39230,lng:-5.97500,address:'Sevilla',dates:'10/14 14:47'},
      {city:'Sevilla',name:'Sevilla Plaza de Armas Bus Station',type:'transport',status:'transport',lat:37.39172,lng:-6.00389,address:'Estación de Autobuses Plaza de Armas, Sevilla',dates:'10/18 11:45'},

      // Cordoba
      {city:'Cordoba',name:'Mezquita-Catedral de Córdoba',type:'attraction',status:'pending',lat:37.87890,lng:-4.77940,address:'Calle Cardenal Herrero 1, Córdoba',dates:'10/16 約 10:00'},
      {city:'Cordoba',name:'Puente Romano de Córdoba',type:'attraction',status:'flex',lat:37.87660,lng:-4.77890,address:'Córdoba',dates:'10/16'},
      {city:'Cordoba',name:'Córdoba Central',type:'transport',status:'transport',lat:37.88855,lng:-4.78905,address:'Glorieta de las Tres Culturas, Córdoba',dates:'10/16 08:52'},

      // Granada
      {city:'Granada',name:'Hotel Navas',type:'hotel',status:'hotel',lat:37.17355,lng:-3.59805,address:'Calle Navas 24, Granada',dates:'10/18–10/20'},
      {city:'Granada',name:'Alhambra',type:'attraction',status:'confirmed',lat:37.17610,lng:-3.58810,address:'Calle Real de la Alhambra, Granada',dates:'10/19 09:30'},
      {city:'Granada',name:'Palacios Nazaríes',type:'attraction',status:'confirmed',lat:37.17650,lng:-3.58900,address:'Alhambra, Granada',dates:'10/19 11:30'},
      {city:'Granada',name:'Mirador de San Nicolás',type:'attraction',status:'flex',lat:37.18100,lng:-3.59240,address:'Plaza Mirador de San Nicolás, Granada',dates:'10/18 可選'},
      {city:'Granada',name:'Catedral de Granada',type:'attraction',status:'flex',lat:37.17600,lng:-3.59830,address:'Plaza de las Pasiegas, Granada',dates:'10/20 上午'},
      {city:'Granada',name:'Granada Bus Station',type:'transport',status:'transport',lat:37.19953,lng:-3.61359,address:'Estación de Autobuses de Granada, Granada',dates:'10/18 14:45'},
      {city:'Granada',name:'Granada Railway Station',type:'transport',status:'transport',lat:37.18400,lng:-3.60960,address:'Granada',dates:'10/20 11:04'},

      // Madrid
      {city:'Madrid',name:'Hotel Acta Madfor',type:'hotel',status:'hotel',lat:40.42290,lng:-3.72190,address:'Paseo de la Florida 13, Madrid',dates:'10/20–10/25'},
      {city:'Madrid',name:'Madrid-Puerta de Atocha',type:'transport',status:'transport',lat:40.40650,lng:-3.68960,address:'Madrid',dates:'10/20 14:38'},
      {city:'Madrid',name:'Puerta del Sol',type:'attraction',status:'flex',lat:40.41690,lng:-3.70350,address:'Madrid',dates:'10/20'},
      {city:'Madrid',name:'Palacio Real de Madrid',type:'attraction',status:'pending',lat:40.41790,lng:-3.71430,address:'Calle de Bailén, Madrid',dates:'10/21 10:00'},
      {city:'Madrid',name:'Museo del Prado',type:'attraction',status:'pending',lat:40.41380,lng:-3.69210,address:'Calle de Ruiz de Alarcón 23, Madrid',dates:'10/22 10:00'},
      {city:'Madrid',name:'Parque del Retiro',type:'attraction',status:'flex',lat:40.41530,lng:-3.68450,address:'Madrid',dates:'10/22'},
      {city:'Madrid',name:'Gran Vía',type:'attraction',status:'flex',lat:40.42000,lng:-3.70580,address:'Madrid',dates:'10/20 · 10/24'},
      {city:'Madrid',name:'El Rastro',type:'attraction',status:'flex',lat:40.40880,lng:-3.70740,address:'Madrid',dates:'10/25 可選'},
      {city:'Madrid',name:'Madrid-Barajas Airport',type:'transport',status:'transport',lat:40.49830,lng:-3.56760,address:'Madrid',dates:'10/25'},

      // Segovia
      {city:'Segovia',name:'Acueducto de Segovia',type:'attraction',status:'pending',lat:40.94800,lng:-4.11870,address:'Segovia',dates:'10/23'},
      {city:'Segovia',name:'Catedral de Segovia',type:'attraction',status:'flex',lat:40.95090,lng:-4.12500,address:'Segovia',dates:'10/23'},
      {city:'Segovia',name:'Alcázar de Segovia',type:'attraction',status:'pending',lat:40.95250,lng:-4.13250,address:'Segovia',dates:'10/23'}
    ];

export const hotels = [
      {city:'Barcelona',name:'Hotel Royal Passeig de Gracia',address:'Passeig de Gràcia 84, Barcelona',room:'Superior Double or Twin Room'},
      {city:'Sevilla',name:'abba Sevilla',address:'Plaza de la Encarnación 19, Sevilla',room:'Junior Suite'},
      {city:'Granada',name:'Hotel Navas',address:'Calle Navas 24, Granada',room:'Standard Triple Room'},
      {city:'Madrid',name:'Hotel Acta Madfor',address:'Paseo de la Florida 13, 28008 Madrid',room:'Standard Triple Room'}
    ];

export const itinerary = [
      {date:'10/08',dow:'Thu',city:'Barcelona',title:'台灣出發｜前往 Barcelona',sub:'Emirates 夜班機 · TPE → DXB → BCN',cats:['confirmed','rest'],map:googleSearch('Taiwan Taoyuan International Airport'),items:[['23:50','TPE → DXB｜EK367','Emirates · 已確認'],['轉機','DXB → Barcelona BCN｜EK185','接續航段 · 10/09 13:25 抵達']],tags:['航班已確認','出發日','夜班機']},
      {date:'10/09',dow:'Fri',city:'Barcelona',title:'抵達巴塞隆納',sub:'先入住、散步、吃飯，適應節奏',cats:['rest'],map:googleSearch('Hotel Royal Passeig de Gracia Barcelona'),items:[['13:25','抵達 Barcelona Airport',''],['15:00+','Hotel Royal Passeig de Gracia 入住','Passeig de Gràcia / Eixample'],['17:00','格拉西亞大道散步＋晚餐','第一天不排主要景點']],tags:['休息優先']},
      {date:'10/10',dow:'Sat',city:'Barcelona',title:'聖家堂＋Sant Pau',sub:'現代主義東側線 · 中午慢走',cats:['confirmed','pending','rest'],map:googleDirections('Sagrada Família, Barcelona','Recinte Modernista de Sant Pau, Barcelona',['Avinguda de Gaudí, Barcelona'],'walking'),items:[['09:15','聖家堂＋誕生立面塔樓','已確認'],['11:30','Avinguda de Gaudí 慢走＋午餐＋咖啡',''],['14:00','Sant Pau 現代主義園區','目前待購票'],['之後','回飯店休息','Montjuïc 視體力加碼']],tags:['聖家堂已確認','Sant Pau 待購','保留休息'],note:'Sant Pau 後不硬走回飯店；白天只抓兩個主要室內點。'},
      {date:'10/11',dow:'Sun',city:'Barcelona',title:'Park Güell → Gràcia → Casa Batlló',sub:'上山靠車、下山靠腳',cats:['confirmed','flex'],map:googleDirections('Park Güell, Barcelona','Casa Batlló, Barcelona',['Casa Vicens, Barcelona','Casa Milà, Barcelona'],'walking'),items:[['09:30','Park Güell','已確認'],['11:30','Gràcia 午餐、咖啡、散步','Casa Vicens 外觀順路看'],['15:45','Casa Batlló · Blue APP + Dragon Rooftop','已確認'],['順路','Casa Milà / Casa Amatller 外觀','彈性']],tags:['Park Güell 已確認','Casa Batlló 已確認','外觀彈性']},
      {date:'10/12',dow:'Mon',city:'Barcelona',title:'Sitges 一日遊',sub:'舊城、海濱、海灘，度假模式',cats:['flex','rest'],map:googleSearch('Sitges Old Town Spain'),items:[['08:30','Barcelona → Sitges','火車班次接近出發再確認'],['白天','Old Town · 海濱步道 · 海灘 · 午餐 · 咖啡',''],['17:30','約回到 Barcelona','']],tags:['慢旅行','不塞景點']},
      {date:'10/13',dow:'Tue',city:'Barcelona',title:'老城 → Born → 凱旋門 → 海邊',sub:'Barcelona 最完整的一條單向散步線',cats:['flex','rest','pending'],map:googleDirections('Mercat de la Boqueria, Barcelona','Barceloneta Beach, Barcelona',['Barcelona Cathedral','Arc de Triomf, Barcelona','Parc de la Ciutadella, Barcelona'],'walking'),items:[['09:00','La Rambla + Boqueria 早餐','記得看 Joan Miró 地面馬賽克'],['10:00','Barri Gòtic 慢走','Plaça Reial → Sant Jaume → Temple d\'August → Pont del Bisbe → Cathedral'],['12:30','El Born 午餐＋散步','Santa Maria del Mar → Passeig del Born'],['14:00','Arc de Triomf → Parc de la Ciutadella',''],['15:15','Estació de França → Port Vell → Barceloneta',''],['17:30','回飯店休息＋整理行李',''],['19:30','Cruix 晚餐','待訂位']],tags:['單向散步','17:30 緩衝','Cruix 待訂'],note:'導遊提醒點是走到附近記得抬頭看，不是額外增加景點。'},
      {date:'10/14',dow:'Wed',city:'Sevilla',title:'Barcelona → Sevilla',sub:'AVE 03940 直達 · 抵達後只散步',cats:['confirmed','rest'],map:googleDirections('Barcelona Sants','Sevilla Santa Justa',[],'transit'),items:[['08:30','Barcelona-Sants → Sevilla-Santa Justa','Renfe AVE 03940 · 14:47 抵達 · 已固定'],['15:00+','abba Sevilla 入住','Plaza de la Encarnación'],['傍晚','Setas de Sevilla + Centro 初次散步','']],tags:['AVE 已確認','抵達日']},
      {date:'10/15',dow:'Thu',city:'Sevilla',title:'王宮與主教座堂經典日',sub:'一天兩個大型室內點就夠',cats:['confirmed','rest'],map:googleDirections('Real Alcázar de Sevilla','Catedral de Sevilla',[],'walking'),items:[['09:30','Real Alcázar de Sevilla','已確認 · 約至 12:00'],['12:00','Santa Cruz 午餐＋慢走',''],['15:00','Catedral de Sevilla + Giralda','已確認 · 約至 16:45']],tags:['王宮已確認','主教座堂已確認','晚上不趕場']},
      {date:'10/16',dow:'Fri',city:'Sevilla',title:'Córdoba 一日遊',sub:'以 Mezquita-Catedral 為核心',cats:['confirmed','pending','flex'],map:googleDirections('Mezquita-Catedral de Córdoba','Puente Romano de Córdoba',[],'walking'),items:[['08:11','Sevilla-Santa Justa → Córdoba','iryo 06097 Inicial · 08:52 抵達 · 已確認'],['約10:00','Mezquita-Catedral de Córdoba','待購票'],['之後','Judería · 午餐 · Puente Romano 河岸',''],['傍晚','Córdoba → Sevilla','回程交通待確認']],tags:['去程 iryo 已確認','回程交通待確認','Mezquita 待購票']},
      {date:'10/17',dow:'Sat',city:'Sevilla',title:'西班牙廣場、河岸與 Triana',sub:'用一整天感受塞維亞',cats:['flex'],map:googleDirections('Plaza de España, Sevilla','Mercado de Triana, Sevilla',['Torre del Oro, Sevilla'],'walking'),items:[['上午','Plaza de España + Parque de María Luisa',''],['中午','Río Guadalquivir + Torre del Oro',''],['下午','Triana 市場、陶瓷、Calle Betis、晚餐','']],tags:['散步主題日']},
      {date:'10/18',dow:'Sun',city:'Granada',title:'Sevilla → Granada',sub:'ALSA 直達已確認 · 抵達山城後放慢',cats:['confirmed','flex','rest'],map:googleDirections('Estación de Autobuses Plaza de Armas, Sevilla','Estación de Autobuses de Granada',[],'transit'),items:[['上午','Sevilla 市中心自由散步＋退房',''],['11:45','Sevilla Plaza de Armas → Granada Bus Station','ALSA 直達 · 14:45 抵達 · 已確認'],['14:00+','Hotel Navas 入住','抵達後前往市中心'],['午後','Centro → Carrera del Darro',''],['17:30','Albaicín + Mirador de San Nicolás','視抵達時間與體力決定']],tags:['ALSA 已確認','夕陽彈性','累就取消']},
      {date:'10/19',dow:'Mon',city:'Granada',title:'Alhambra 日',sub:'這天唯一的大型景點',cats:['confirmed','rest'],map:googleSearch('Alhambra Granada'),items:[['09:00','抵達 Alhambra 周邊',''],['09:30','Alhambra 行程開始','已確認'],['11:30','Palacios Nazaríes 指定入場','票面固定時間'],['傍晚','Calle Navas · Tapas + 輕鬆晚餐','']],tags:['Alhambra 已確認','11:30 不可移動','參觀後休息']},
      {date:'10/20',dow:'Tue',city:'Madrid',title:'Granada → Madrid',sub:'ALVIA 2087 Confort · 最新已購票狀態',cats:['confirmed','flex'],map:googleDirections('Granada Railway Station','Madrid Puerta de Atocha',[],'transit'),items:[['上午','Granada Cathedral / Capilla Real / Alcaicería','視出發時間縮短'],['11:04','Granada → Madrid-Puerta de Atocha','Renfe ALVIA 2087 Confort · 14:38 抵達 · 已購票'],['之後','Hotel Acta Madfor Check-in',''],['傍晚','Puerta del Sol → Plaza Mayor → Gran Vía','初次散步']],tags:['ALVIA 已確認','住宿已確認','傍晚散步'],note:'採最新 Reservation／Task 狀態，不沿用城市頁較舊的「待確認」。'},
      {date:'10/21',dow:'Wed',city:'Madrid',title:'馬德里王宮日',sub:'王宮是唯一大型固定點',cats:['pending','flex'],map:googleSearch('Palacio Real de Madrid'),items:[['10:00','Palacio Real + Catedral de la Almudena','目前待購票'],['下午','Madrid de los Austrias + La Latina','']],tags:['王宮待購','午後自由']},
      {date:'10/22',dow:'Thu',city:'Madrid',title:'Prado＋Retiro',sub:'上午美術館，下午重新回到戶外',cats:['pending','flex'],map:googleDirections('Museo del Prado, Madrid','Parque del Retiro, Madrid',['Puerta de Alcalá, Madrid'],'walking'),items:[['10:00','Museo del Prado','目前待購票'],['下午','Parque del Retiro → Puerta de Alcalá → Plaza de Cibeles','']],tags:['Prado 待購','戶外散步']},
      {date:'10/23',dow:'Fri',city:'Madrid',title:'Segovia 一日遊',sub:'水道橋 → 舊城 → 城堡',cats:['pending','flex'],map:googleDirections('Acueducto de Segovia','Alcázar de Segovia',['Catedral de Segovia'],'walking'),items:[['上午','Madrid ↔ Segovia','交通待確認'],['白天','Acueducto → Catedral → 午餐 → Alcázar',''],['傍晚','目標晚餐前回 Madrid','']],tags:['交通待確認','Alcázar 待確認','不趕回程']},
      {date:'10/24',dow:'Sat',city:'Madrid',title:'街區、購物與咖啡',sub:'真正的緩衝日，不因空白就塞滿',cats:['flex','rest'],map:googleDirections('Malasaña Madrid','Gran Vía Madrid',['Chueca Madrid'],'walking'),items:[['白天','Malasaña + Chueca + Gran Vía',''],['隨興','購物 · 咖啡 · 散步 · 最後一晚晚餐','']],tags:['緩衝日','完全彈性']},
      {date:'10/25',dow:'Sun',city:'Madrid',title:'最後一個上午＋返台',sub:'夜班機，上午比平常更輕',cats:['confirmed','flex','rest'],map:googleSearch('El Rastro Madrid'),items:[['09:00','El Rastro + La Latina','可選；先確認行李寄放與機場交通'],['12:00前','Hotel Acta Madfor Check-out',''],['之後','休息 · 領行李 · 前往 Madrid-Barajas Airport',''],['21:45','EK144 Madrid 起飛','已確認']],tags:['返程航班已確認','市集可選','預留機場緩衝']}
    ];

export const encryptedTickets = {"emirates-outbound":{"salt":"Gz71GtgfXdWdqcgtYttMDg==","iv":"nk8qbIsDHdYSyG45","ct":"0di963hz6dYgD9AEmw6F9sG9am1FF77i+iVO68R7brGTKTWV4wmHMv1k2DSP6HXy7hkqjFnD6yu2vCtI4fruZakpvO/sULj6RE7UxFDmQ3ddreLdOTE="},"sagrada":{"salt":"fJrevGLAcvi9GkUQW4yYRQ==","iv":"8moyVtmYNx7otI52","ct":"hxdaXEnttKMoMLb8vuHW7Bkfx8Qtm03Pxd+zE7zX87MZRZy05RJq2gV0YLBK+ZhPoxJjBJi3ZBL7z8nz87f0RAKfr1XURa//MDRtwQ=="},"park-guell":{"salt":"L43VXwotFO/m9Mje9ZBKMg==","iv":"6QOrIs2TQkix2jPV","ct":"UBI/we+Ifkn0PUyF4c9QL1P8rbNEunuWA8dliypVtX1X7Eqck+AhDHuGfOAP/TI29GQEVrg5ftM2hg6mmhZRSwnFoaXpG+aiYyvCDMyD4A=="},"casa-batllo":{"salt":"C5wKGvc8pFJ6xgf4/jOzhw==","iv":"vAbWyCDRKv8VhEge","ct":"PueNR3cZRT7NBIUG86jtDkvksCO7sgHFiG9I5XsFTw4IKeotDUWiWNlQmfZZmJMyGTNxJoz/fm4jP5h9NbJeqQZNOJ4y+ItB9B0MBYMJOlI="},"ave-bcn-sevilla":{"salt":"pqZOzrDEC/rf13q59nk6UQ==","iv":"+VEQM4DluyRoz/mZ","ct":"+PUdHgz5EfhHZGFh5BJ/i1RLhOjyMPYlBBNnWG81E+QdKgrwsPuLf9NIgxoa0Aj2zVoHaXLnjPa2iI0MJG/HtJXvPSQbOUn6AzsfMl7lxhmSbFYp"},"sevilla-alcazar":{"salt":"4/ctb22fYKDsyIsLZwWLwA==","iv":"yAVlVq2dQferREob","ct":"f2ylE4JdZIuzqTjO5kTSkIKuixjtNbefuv771w3slFy7ewiGaopV0v9St2+nP/WQ+HQOJ2EkoizH8OxxQqCT3oouzyN+dlIgwLy+bfDxdZY4IN5s"},"sevilla-catedral":{"salt":"QpF5uDmwUWzGpXi4CE+hIA==","iv":"s13OLBkODqiVhHYk","ct":"JDu7DNmxdDyHSmcqh5JJb5lz1+/35F3VOXABqfVfkjAqebUdomObQxycAfsIoCTu2stXiARhVjan9FACIqA3BRHfAX/xSp/mOGm/pwFowVMTz5Kmqg=="},"iryo-cordoba":{"salt":"pi5EujtVEOqrqc8Dfrcmnw==","iv":"xUSP1qxsRTu045dB","ct":"qGYZ0hu7t5kNxNR9Njv341U+eADI3K8jtyjXCQnGwND4JDyDXUVCVT29HIdE2+h5LnEiVr0NWS2Ix+HXoO5qFImzpd1R5uEG5qsRp2JW4lWP"},"alsa-granada":{"salt":"zZprcC9qf/ceqkW2rAcxWw==","iv":"8P1jh0oztckwKeIo","ct":"L4tWEjoybSu0jC0jYQwh80yPCSYzxxEI51xuHKei2bBjhS8NZCoMqKT+abNbnH8KCCcITnP7Pz7mxNQLoTWrs1eLRLxK4coj3uWeDOxrdV9F"},"alhambra":{"salt":"mRe04dLlpUKo63AOmEMr7A==","iv":"MdCP6zsw7tnoxKQs","ct":"OBx6bbgSgUV0sJgOaz85H6gepOXNIUFP9ZLRb57wNHC++QOjuTFVa1Yd4G6Wl3wMMkGSGLcKsA824QyptthWmWfcl92Oz/ppejhyf0I="},"alvia-madrid":{"salt":"CBadyyfRcY7cWcHrDYaEBQ==","iv":"Ne1Ey1SqQytO2qDI","ct":"Z/m7y9fypRzac60hVc8tAOc5YuAuONvNjad25eoAZvperI+x1HyI68SupGFvkuzJ0Z6r68ggWOcp3Q0mmWdbzysCdKJUGlxDFvfz9hPmK4Ic"},"emirates-return":{"salt":"mkwgIUZ4ul2Z6ClsCFZMng==","iv":"VIgV5drIQEFyjz46","ct":"5LGAAKadPn4Z6aEVWYeEe/q3e/10imMSYBK8VOO9TUQV/TAWRCmNcsb9LXHeOMambgM592Vqn0wjnZWIryTZWjeP5pLkgsen+w+k/Uw15DFyfX8y"}};

export const itemAnnotations = [
  {term:'Catedral de Sevilla + Giralda',heritage:true,ticketId:'sevilla-catedral',ticketLabel:'塞維亞主教座堂＋吉拉達塔'},
  {term:'Mezquita-Catedral de Córdoba',heritage:true},
  {term:'Real Alcázar de Sevilla',heritage:true,ticketId:'sevilla-alcazar',ticketLabel:'塞維亞王宮｜Real Alcázar'},
  {term:'Palacios Nazaríes',heritage:true,ticketId:'alhambra',ticketLabel:'阿爾罕布拉宮｜Palacios Nazaríes'},
  {term:'Parque del Retiro',heritage:true},
  {term:'Museo del Prado',heritage:true},
  {term:'Casa Batlló',heritage:true,ticketId:'casa-batllo',ticketLabel:'Casa Batlló'},
  {term:'Casa Vicens',heritage:true},
  {term:'Casa Milà',heritage:true},
  {term:'Park Güell',heritage:true,ticketId:'park-guell',ticketLabel:'Park Güell'},
  {term:'Sant Pau',heritage:true},
  {term:'聖家堂',heritage:true,ticketId:'sagrada',ticketLabel:'聖家堂｜Sagrada Família'},
  {term:'Albaicín',heritage:true},
  {term:'Alhambra',heritage:true,ticketId:'alhambra',ticketLabel:'阿爾罕布拉宮｜Alhambra'},
  {term:'Puente Romano',heritage:true},
  {term:'Acueducto',heritage:true,whenContains:'Acueducto → Catedral → 午餐 → Alcázar'},
  {term:'Catedral',heritage:true,whenContains:'Acueducto → Catedral → 午餐 → Alcázar'},
  {term:'Alcázar',heritage:true,whenContains:'Acueducto → Catedral → 午餐 → Alcázar'},

  {term:'Barcelona-Sants → Sevilla-Santa Justa',ticketId:'ave-bcn-sevilla',ticketLabel:'AVE｜Barcelona → Sevilla'},
  {term:'Sevilla-Santa Justa → Córdoba',ticketId:'iryo-cordoba',ticketLabel:'iryo｜Sevilla → Córdoba'},
  {term:'Sevilla Plaza de Armas → Granada Bus Station',ticketId:'alsa-granada',ticketLabel:'ALSA｜Sevilla → Granada'},
  {term:'Granada → Madrid-Puerta de Atocha',ticketId:'alvia-madrid',ticketLabel:'ALVIA｜Granada → Madrid'},
  {term:'TPE → DXB｜EK367',ticketId:'emirates-outbound',ticketLabel:'Emirates｜TPE → DXB → BCN'},
  {term:'DXB → Barcelona BCN｜EK185',ticketId:'emirates-outbound',ticketLabel:'Emirates｜TPE → DXB → BCN'},
  {term:'EK144 Madrid 起飛',ticketId:'emirates-return',ticketLabel:'Emirates｜Madrid → Dubai → Taipei'}
];

export const mapConfig = {
  cityCenter: {
    Barcelona:[41.3874,2.1686],
    Sevilla:[37.3891,-5.9845],
    Cordoba:[37.8882,-4.7794],
    Granada:[37.1773,-3.5986],
    Madrid:[40.4168,-3.7038],
    Segovia:[40.9429,-4.1088],
    Sitges:[41.2372,1.8059]
  },
  mainRouteCities:['Barcelona','Sevilla','Granada','Madrid'],
  sideRouteCities:[
    ['Barcelona','Sitges'],
    ['Sevilla','Cordoba'],
    ['Madrid','Segovia']
  ]
};
