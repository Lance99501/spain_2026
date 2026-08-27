// Spain 2026 static data model for GitHub Pages.
// The runtime uses stable IDs and explicit relationships; no attraction/ticket name matching is required.
// Future ASP.NET Core/API responses can keep the same DTO shapes.

export const tripConfig = {
  "departDate": "2026-10-08",
  "spainStartDate": "2026-10-09",
  "endDate": "2026-10-25",
  "ticketSessionMinutes": 5,
  "timeZone": "Europe/Madrid"
};

export const places = [
  {
    "id": "bcn-hotel-royal-passeig-de-gracia",
    "city": "Barcelona",
    "name": "Hotel Royal Passeig de Gracia",
    "type": "hotel",
    "status": "hotel",
    "lat": 41.3949,
    "lng": 2.1618,
    "address": "Passeig de Gràcia 84, Barcelona",
    "dates": "10/09–10/14",
    "unesco": false
  },
  {
    "id": "bcn-basilica-de-la-sagrada-familia",
    "city": "Barcelona",
    "name": "Basílica de la Sagrada Família",
    "type": "attraction",
    "status": "confirmed",
    "lat": 41.40363,
    "lng": 2.17436,
    "address": "Carrer de Mallorca 401, Barcelona",
    "dates": "10/10 09:15",
    "unesco": true
  },
  {
    "id": "bcn-recinte-modernista-de-sant-pau",
    "city": "Barcelona",
    "name": "Recinte Modernista de Sant Pau",
    "type": "attraction",
    "status": "pending",
    "lat": 41.41195,
    "lng": 2.17447,
    "address": "Carrer de Sant Antoni Maria Claret 167, Barcelona",
    "dates": "10/10 約 14:00",
    "unesco": true
  },
  {
    "id": "bcn-park-guell",
    "city": "Barcelona",
    "name": "Park Güell",
    "type": "attraction",
    "status": "confirmed",
    "lat": 41.41449,
    "lng": 2.15269,
    "address": "Barcelona",
    "dates": "10/11 09:30",
    "unesco": true
  },
  {
    "id": "bcn-casa-batllo",
    "city": "Barcelona",
    "name": "Casa Batlló",
    "type": "attraction",
    "status": "confirmed",
    "lat": 41.39164,
    "lng": 2.16485,
    "address": "Passeig de Gràcia 43, Barcelona",
    "dates": "10/11 15:45",
    "unesco": true
  },
  {
    "id": "bcn-mercat-de-la-boqueria",
    "city": "Barcelona",
    "name": "Mercat de la Boqueria",
    "type": "attraction",
    "status": "flex",
    "lat": 41.38174,
    "lng": 2.17159,
    "address": "La Rambla 91, Barcelona",
    "dates": "10/13 09:00",
    "unesco": false
  },
  {
    "id": "bcn-barcelona-cathedral",
    "city": "Barcelona",
    "name": "Barcelona Cathedral",
    "type": "attraction",
    "status": "flex",
    "lat": 41.38396,
    "lng": 2.1762,
    "address": "Pla de la Seu, Barcelona",
    "dates": "10/13",
    "unesco": false
  },
  {
    "id": "bcn-arc-de-triomf",
    "city": "Barcelona",
    "name": "Arc de Triomf",
    "type": "attraction",
    "status": "flex",
    "lat": 41.39105,
    "lng": 2.18065,
    "address": "Passeig de Lluís Companys, Barcelona",
    "dates": "10/13 14:00",
    "unesco": false
  },
  {
    "id": "bcn-parc-de-la-ciutadella",
    "city": "Barcelona",
    "name": "Parc de la Ciutadella",
    "type": "attraction",
    "status": "flex",
    "lat": 41.3881,
    "lng": 2.1873,
    "address": "Barcelona",
    "dates": "10/13",
    "unesco": false
  },
  {
    "id": "bcn-barceloneta-beach",
    "city": "Barcelona",
    "name": "Barceloneta Beach",
    "type": "attraction",
    "status": "flex",
    "lat": 41.3784,
    "lng": 2.1925,
    "address": "Barcelona",
    "dates": "10/13",
    "unesco": false
  },
  {
    "id": "bcn-barcelona-sants",
    "city": "Barcelona",
    "name": "Barcelona-Sants",
    "type": "transport",
    "status": "transport",
    "lat": 41.3791,
    "lng": 2.1401,
    "address": "Barcelona",
    "dates": "10/14 08:30",
    "unesco": false
  },
  {
    "id": "bcn-sitges-old-town",
    "city": "Barcelona",
    "name": "Sitges Old Town",
    "type": "attraction",
    "status": "flex",
    "lat": 41.2372,
    "lng": 1.8059,
    "address": "Sitges, Barcelona",
    "dates": "10/12",
    "unesco": false
  },
  {
    "id": "sev-abba-sevilla",
    "city": "Sevilla",
    "name": "abba Sevilla",
    "type": "hotel",
    "status": "hotel",
    "lat": 37.3931,
    "lng": -5.9913,
    "address": "Plaza de la Encarnación 19, Sevilla",
    "dates": "10/14–10/18",
    "unesco": false
  },
  {
    "id": "sev-setas-de-sevilla",
    "city": "Sevilla",
    "name": "Setas de Sevilla",
    "type": "attraction",
    "status": "flex",
    "lat": 37.39305,
    "lng": -5.99125,
    "address": "Plaza de la Encarnación, Sevilla",
    "dates": "10/14",
    "unesco": false
  },
  {
    "id": "sev-real-alcazar-de-sevilla",
    "city": "Sevilla",
    "name": "Real Alcázar de Sevilla",
    "type": "attraction",
    "status": "confirmed",
    "lat": 37.383,
    "lng": -5.9902,
    "address": "Patio de Banderas, Sevilla",
    "dates": "10/15 09:30",
    "unesco": true
  },
  {
    "id": "sev-catedral-de-sevilla-giralda",
    "city": "Sevilla",
    "name": "Catedral de Sevilla + Giralda",
    "type": "attraction",
    "status": "confirmed",
    "lat": 37.3861,
    "lng": -5.993,
    "address": "Avenida de la Constitución, Sevilla",
    "dates": "10/15 15:00",
    "unesco": true
  },
  {
    "id": "sev-plaza-de-espana",
    "city": "Sevilla",
    "name": "Plaza de España",
    "type": "attraction",
    "status": "flex",
    "lat": 37.3772,
    "lng": -5.9869,
    "address": "Plaza de España, Sevilla",
    "dates": "10/17",
    "unesco": false
  },
  {
    "id": "sev-torre-del-oro",
    "city": "Sevilla",
    "name": "Torre del Oro",
    "type": "attraction",
    "status": "flex",
    "lat": 37.3825,
    "lng": -5.9963,
    "address": "Paseo de Cristóbal Colón, Sevilla",
    "dates": "10/17",
    "unesco": false
  },
  {
    "id": "sev-mercado-de-triana",
    "city": "Sevilla",
    "name": "Mercado de Triana",
    "type": "attraction",
    "status": "flex",
    "lat": 37.3856,
    "lng": -6.0034,
    "address": "Plaza del Altozano, Sevilla",
    "dates": "10/17",
    "unesco": false
  },
  {
    "id": "sev-sevilla-santa-justa",
    "city": "Sevilla",
    "name": "Sevilla-Santa Justa",
    "type": "transport",
    "status": "transport",
    "lat": 37.3923,
    "lng": -5.975,
    "address": "Sevilla",
    "dates": "10/14 14:47",
    "unesco": false
  },
  {
    "id": "sev-sevilla-plaza-de-armas-bus-station",
    "city": "Sevilla",
    "name": "Sevilla Plaza de Armas Bus Station",
    "type": "transport",
    "status": "transport",
    "lat": 37.39172,
    "lng": -6.00389,
    "address": "Estación de Autobuses Plaza de Armas, Sevilla",
    "dates": "10/18 11:45",
    "unesco": false
  },
  {
    "id": "cor-mezquita-catedral-de-cordoba",
    "city": "Cordoba",
    "name": "Mezquita-Catedral de Córdoba",
    "type": "attraction",
    "status": "pending",
    "lat": 37.8789,
    "lng": -4.7794,
    "address": "Calle Cardenal Herrero 1, Córdoba",
    "dates": "10/16 約 10:00",
    "unesco": true
  },
  {
    "id": "cor-puente-romano-de-cordoba",
    "city": "Cordoba",
    "name": "Puente Romano de Córdoba",
    "type": "attraction",
    "status": "flex",
    "lat": 37.8766,
    "lng": -4.7789,
    "address": "Córdoba",
    "dates": "10/16",
    "unesco": true
  },
  {
    "id": "cor-cordoba-central",
    "city": "Cordoba",
    "name": "Córdoba Central",
    "type": "transport",
    "status": "transport",
    "lat": 37.88855,
    "lng": -4.78905,
    "address": "Glorieta de las Tres Culturas, Córdoba",
    "dates": "10/16 08:52",
    "unesco": false
  },
  {
    "id": "grx-hotel-navas",
    "city": "Granada",
    "name": "Hotel Navas",
    "type": "hotel",
    "status": "hotel",
    "lat": 37.17355,
    "lng": -3.59805,
    "address": "Calle Navas 24, Granada",
    "dates": "10/18–10/20",
    "unesco": false
  },
  {
    "id": "grx-alhambra",
    "city": "Granada",
    "name": "Alhambra",
    "type": "attraction",
    "status": "confirmed",
    "lat": 37.1761,
    "lng": -3.5881,
    "address": "Calle Real de la Alhambra, Granada",
    "dates": "10/19 09:30",
    "unesco": true
  },
  {
    "id": "grx-palacios-nazaries",
    "city": "Granada",
    "name": "Palacios Nazaríes",
    "type": "attraction",
    "status": "confirmed",
    "lat": 37.1765,
    "lng": -3.589,
    "address": "Alhambra, Granada",
    "dates": "10/19 11:30",
    "unesco": true
  },
  {
    "id": "grx-mirador-de-san-nicolas",
    "city": "Granada",
    "name": "Mirador de San Nicolás",
    "type": "attraction",
    "status": "flex",
    "lat": 37.181,
    "lng": -3.5924,
    "address": "Plaza Mirador de San Nicolás, Granada",
    "dates": "10/18 可選",
    "unesco": false
  },
  {
    "id": "grx-catedral-de-granada",
    "city": "Granada",
    "name": "Catedral de Granada",
    "type": "attraction",
    "status": "flex",
    "lat": 37.176,
    "lng": -3.5983,
    "address": "Plaza de las Pasiegas, Granada",
    "dates": "10/20 上午",
    "unesco": false
  },
  {
    "id": "grx-granada-bus-station",
    "city": "Granada",
    "name": "Granada Bus Station",
    "type": "transport",
    "status": "transport",
    "lat": 37.19953,
    "lng": -3.61359,
    "address": "Estación de Autobuses de Granada, Granada",
    "dates": "10/18 14:45",
    "unesco": false
  },
  {
    "id": "grx-granada-railway-station",
    "city": "Granada",
    "name": "Granada Railway Station",
    "type": "transport",
    "status": "transport",
    "lat": 37.184,
    "lng": -3.6096,
    "address": "Granada",
    "dates": "10/20 11:04",
    "unesco": false
  },
  {
    "id": "mad-hotel-acta-madfor",
    "city": "Madrid",
    "name": "Hotel Acta Madfor",
    "type": "hotel",
    "status": "hotel",
    "lat": 40.4229,
    "lng": -3.7219,
    "address": "Paseo de la Florida 13, Madrid",
    "dates": "10/20–10/25",
    "unesco": false
  },
  {
    "id": "mad-madrid-puerta-de-atocha",
    "city": "Madrid",
    "name": "Madrid-Puerta de Atocha",
    "type": "transport",
    "status": "transport",
    "lat": 40.4065,
    "lng": -3.6896,
    "address": "Madrid",
    "dates": "10/20 14:38",
    "unesco": false
  },
  {
    "id": "mad-puerta-del-sol",
    "city": "Madrid",
    "name": "Puerta del Sol",
    "type": "attraction",
    "status": "flex",
    "lat": 40.4169,
    "lng": -3.7035,
    "address": "Madrid",
    "dates": "10/20",
    "unesco": false
  },
  {
    "id": "mad-palacio-real-de-madrid",
    "city": "Madrid",
    "name": "Palacio Real de Madrid",
    "type": "attraction",
    "status": "pending",
    "lat": 40.4179,
    "lng": -3.7143,
    "address": "Calle de Bailén, Madrid",
    "dates": "10/21 10:00",
    "unesco": false
  },
  {
    "id": "mad-museo-del-prado",
    "city": "Madrid",
    "name": "Museo del Prado",
    "type": "attraction",
    "status": "pending",
    "lat": 40.4138,
    "lng": -3.6921,
    "address": "Calle de Ruiz de Alarcón 23, Madrid",
    "dates": "10/22 10:00",
    "unesco": true
  },
  {
    "id": "mad-parque-del-retiro",
    "city": "Madrid",
    "name": "Parque del Retiro",
    "type": "attraction",
    "status": "flex",
    "lat": 40.4153,
    "lng": -3.6845,
    "address": "Madrid",
    "dates": "10/22",
    "unesco": true
  },
  {
    "id": "mad-gran-via",
    "city": "Madrid",
    "name": "Gran Vía",
    "type": "attraction",
    "status": "flex",
    "lat": 40.42,
    "lng": -3.7058,
    "address": "Madrid",
    "dates": "10/20 · 10/24",
    "unesco": false
  },
  {
    "id": "mad-el-rastro",
    "city": "Madrid",
    "name": "El Rastro",
    "type": "attraction",
    "status": "flex",
    "lat": 40.4088,
    "lng": -3.7074,
    "address": "Madrid",
    "dates": "10/25 可選",
    "unesco": false
  },
  {
    "id": "mad-madrid-barajas-airport",
    "city": "Madrid",
    "name": "Madrid-Barajas Airport",
    "type": "transport",
    "status": "transport",
    "lat": 40.4983,
    "lng": -3.5676,
    "address": "Madrid",
    "dates": "10/25",
    "unesco": false
  },
  {
    "id": "seg-acueducto-de-segovia",
    "city": "Segovia",
    "name": "Acueducto de Segovia",
    "type": "attraction",
    "status": "pending",
    "lat": 40.948,
    "lng": -4.1187,
    "address": "Segovia",
    "dates": "10/23",
    "unesco": true
  },
  {
    "id": "seg-catedral-de-segovia",
    "city": "Segovia",
    "name": "Catedral de Segovia",
    "type": "attraction",
    "status": "flex",
    "lat": 40.9509,
    "lng": -4.125,
    "address": "Segovia",
    "dates": "10/23",
    "unesco": true
  },
  {
    "id": "seg-alcazar-de-segovia",
    "city": "Segovia",
    "name": "Alcázar de Segovia",
    "type": "attraction",
    "status": "pending",
    "lat": 40.9525,
    "lng": -4.1325,
    "address": "Segovia",
    "dates": "10/23",
    "unesco": true
  },
  {
    "id": "bcn-casa-vicens",
    "city": "Barcelona",
    "name": "Casa Vicens",
    "type": "attraction",
    "status": "flex",
    "unesco": true,
    "mapVisible": false
  },
  {
    "id": "bcn-casa-mila",
    "city": "Barcelona",
    "name": "Casa Milà",
    "type": "attraction",
    "status": "flex",
    "unesco": true,
    "mapVisible": false
  },
  {
    "id": "bcn-casa-amatller",
    "city": "Barcelona",
    "name": "Casa Amatller",
    "type": "attraction",
    "status": "flex",
    "unesco": false,
    "mapVisible": false
  },
  {
    "id": "grx-albaicin",
    "city": "Granada",
    "name": "Albaicín",
    "type": "attraction",
    "status": "flex",
    "unesco": true,
    "mapVisible": false
  }
];

export const hotels = [
  {
    "placeId": "bcn-hotel-royal-passeig-de-gracia",
    "room": "Superior Double or Twin Room"
  },
  {
    "placeId": "sev-abba-sevilla",
    "room": "Junior Suite"
  },
  {
    "placeId": "grx-hotel-navas",
    "room": "Standard Triple Room"
  },
  {
    "placeId": "mad-hotel-acta-madfor",
    "room": "Standard Triple Room"
  }
];

export const tickets = [
  {
    "id": "tkt-emirates-outbound",
    "label": "Emirates｜TPE → DXB → BCN",
    "kind": "flight",
    "type": "qr",
    "status": "confirmed"
  },
  {
    "id": "tkt-sagrada",
    "label": "聖家堂｜Sagrada Família",
    "kind": "attraction",
    "placeIds": [
      "bcn-basilica-de-la-sagrada-familia"
    ],
    "type": "qr",
    "status": "confirmed"
  },
  {
    "id": "tkt-park-guell",
    "label": "Park Güell",
    "kind": "attraction",
    "placeIds": [
      "bcn-park-guell"
    ],
    "type": "qr",
    "status": "confirmed"
  },
  {
    "id": "tkt-casa-batllo",
    "label": "Casa Batlló",
    "kind": "attraction",
    "placeIds": [
      "bcn-casa-batllo"
    ],
    "type": "qr",
    "status": "confirmed"
  },
  {
    "id": "tkt-ave-bcn-sevilla",
    "label": "AVE｜Barcelona → Sevilla",
    "kind": "train",
    "placeIds": [
      "bcn-barcelona-sants",
      "sev-sevilla-santa-justa"
    ],
    "type": "qr",
    "status": "confirmed"
  },
  {
    "id": "tkt-sevilla-alcazar",
    "label": "塞維亞王宮｜Real Alcázar",
    "kind": "attraction",
    "placeIds": [
      "sev-real-alcazar-de-sevilla"
    ],
    "type": "qr",
    "status": "confirmed"
  },
  {
    "id": "tkt-sevilla-catedral",
    "label": "塞維亞主教座堂＋吉拉達塔",
    "kind": "attraction",
    "placeIds": [
      "sev-catedral-de-sevilla-giralda"
    ],
    "type": "qr",
    "status": "confirmed"
  },
  {
    "id": "tkt-iryo-cordoba",
    "label": "iryo｜Sevilla → Córdoba",
    "kind": "train",
    "placeIds": [
      "sev-sevilla-santa-justa",
      "cor-cordoba-central"
    ],
    "type": "qr",
    "status": "confirmed"
  },
  {
    "id": "tkt-alsa-granada",
    "label": "ALSA｜Sevilla → Granada",
    "kind": "bus",
    "placeIds": [
      "sev-sevilla-plaza-de-armas-bus-station",
      "grx-granada-bus-station"
    ],
    "type": "qr",
    "status": "confirmed"
  },
  {
    "id": "tkt-alhambra",
    "label": "阿爾罕布拉宮｜Alhambra",
    "kind": "attraction",
    "placeIds": [
      "grx-alhambra",
      "grx-palacios-nazaries"
    ],
    "type": "qr",
    "status": "confirmed"
  },
  {
    "id": "tkt-alvia-madrid",
    "label": "ALVIA｜Granada → Madrid",
    "kind": "train",
    "placeIds": [
      "grx-granada-railway-station",
      "mad-madrid-puerta-de-atocha"
    ],
    "type": "qr",
    "status": "confirmed"
  },
  {
    "id": "tkt-emirates-return",
    "label": "Emirates｜Madrid → Dubai → Taipei",
    "kind": "flight",
    "type": "qr",
    "status": "confirmed"
  }
];

export const itinerary = [
  {
    "id": "day-2026-10-08",
    "date": "2026-10-08",
    "dateLabel": "10/08",
    "dow": "Thu",
    "city": "Barcelona",
    "title": "台灣出發｜前往 Barcelona",
    "sub": "Emirates 夜班機 · TPE → DXB → BCN",
    "categories": [
      "confirmed",
      "rest"
    ],
    "mapUrl": "https://www.google.com/maps/search/?api=1&query=Taiwan%20Taoyuan%20International%20Airport",
    "items": [
      {
        "id": "item-2026-10-08-01",
        "time": "23:50",
        "segments": [
          {
            "text": "TPE → DXB｜EK367"
          }
        ],
        "ticketId": "tkt-emirates-outbound",
        "noteSegments": [
          {
            "text": "Emirates · 已確認"
          }
        ]
      },
      {
        "id": "item-2026-10-08-02",
        "time": "轉機",
        "segments": [
          {
            "text": "DXB → Barcelona BCN｜EK185"
          }
        ],
        "ticketId": "tkt-emirates-outbound",
        "noteSegments": [
          {
            "text": "接續航段 · 10/09 13:25 抵達"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "航班已確認",
        "tone": "confirmed"
      },
      {
        "text": "出發日",
        "tone": "flex"
      },
      {
        "text": "夜班機",
        "tone": "flex"
      }
    ]
  },
  {
    "id": "day-2026-10-09",
    "date": "2026-10-09",
    "dateLabel": "10/09",
    "dow": "Fri",
    "city": "Barcelona",
    "title": "抵達巴塞隆納",
    "sub": "先入住、散步、吃飯，適應節奏",
    "categories": [
      "rest"
    ],
    "mapUrl": "https://www.google.com/maps/search/?api=1&query=Hotel%20Royal%20Passeig%20de%20Gracia%20Barcelona",
    "items": [
      {
        "id": "item-2026-10-09-01",
        "time": "13:25",
        "segments": [
          {
            "text": "抵達 Barcelona Airport"
          }
        ]
      },
      {
        "id": "item-2026-10-09-02",
        "time": "15:00+",
        "segments": [
          {
            "text": "Hotel Royal Passeig de Gracia 入住"
          }
        ],
        "noteSegments": [
          {
            "text": "Passeig de Gràcia / Eixample"
          }
        ]
      },
      {
        "id": "item-2026-10-09-03",
        "time": "17:00",
        "segments": [
          {
            "text": "格拉西亞大道散步＋晚餐"
          }
        ],
        "noteSegments": [
          {
            "text": "第一天不排主要景點"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "休息優先",
        "tone": "rest"
      }
    ]
  },
  {
    "id": "day-2026-10-10",
    "date": "2026-10-10",
    "dateLabel": "10/10",
    "dow": "Sat",
    "city": "Barcelona",
    "title": "聖家堂＋Sant Pau",
    "sub": "現代主義東側線 · 中午慢走",
    "categories": [
      "confirmed",
      "pending",
      "rest"
    ],
    "mapUrl": "https://www.google.com/maps/dir/?api=1&origin=Sagrada%20Fam%C3%ADlia%2C%20Barcelona&destination=Recinte%20Modernista%20de%20Sant%20Pau%2C%20Barcelona&travelmode=walking&waypoints=Avinguda%20de%20Gaud%C3%AD%2C%20Barcelona",
    "items": [
      {
        "id": "item-2026-10-10-01",
        "time": "09:15",
        "segments": [
          {
            "text": "聖家堂",
            "placeId": "bcn-basilica-de-la-sagrada-familia"
          },
          {
            "text": "＋誕生立面塔樓"
          }
        ],
        "ticketId": "tkt-sagrada",
        "ticketAnchorPlaceId": "bcn-basilica-de-la-sagrada-familia",
        "noteSegments": [
          {
            "text": "已確認"
          }
        ]
      },
      {
        "id": "item-2026-10-10-02",
        "time": "11:30",
        "segments": [
          {
            "text": "Avinguda de Gaudí 慢走＋午餐＋咖啡"
          }
        ]
      },
      {
        "id": "item-2026-10-10-03",
        "time": "14:00",
        "segments": [
          {
            "text": "Sant Pau",
            "placeId": "bcn-recinte-modernista-de-sant-pau"
          },
          {
            "text": " 現代主義園區"
          }
        ],
        "noteSegments": [
          {
            "text": "目前待購票"
          }
        ]
      },
      {
        "id": "item-2026-10-10-04",
        "time": "之後",
        "segments": [
          {
            "text": "回飯店休息"
          }
        ],
        "noteSegments": [
          {
            "text": "Montjuïc 視體力加碼"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "聖家堂已確認",
        "tone": "confirmed"
      },
      {
        "text": "Sant Pau 待購",
        "tone": "pending"
      },
      {
        "text": "保留休息",
        "tone": "rest"
      }
    ],
    "note": "Sant Pau 後不硬走回飯店；白天只抓兩個主要室內點。"
  },
  {
    "id": "day-2026-10-11",
    "date": "2026-10-11",
    "dateLabel": "10/11",
    "dow": "Sun",
    "city": "Barcelona",
    "title": "Park Güell → Gràcia → Casa Batlló",
    "sub": "上山靠車、下山靠腳",
    "categories": [
      "confirmed",
      "flex"
    ],
    "mapUrl": "https://www.google.com/maps/dir/?api=1&origin=Park%20G%C3%BCell%2C%20Barcelona&destination=Casa%20Batll%C3%B3%2C%20Barcelona&travelmode=walking&waypoints=Casa%20Vicens%2C%20Barcelona%7CCasa%20Mil%C3%A0%2C%20Barcelona",
    "items": [
      {
        "id": "item-2026-10-11-01",
        "time": "09:30",
        "segments": [
          {
            "text": "Park Güell",
            "placeId": "bcn-park-guell"
          }
        ],
        "ticketId": "tkt-park-guell",
        "ticketAnchorPlaceId": "bcn-park-guell",
        "noteSegments": [
          {
            "text": "已確認"
          }
        ]
      },
      {
        "id": "item-2026-10-11-02",
        "time": "11:30",
        "segments": [
          {
            "text": "Gràcia 午餐、咖啡、散步"
          }
        ],
        "noteSegments": [
          {
            "text": "Casa Vicens",
            "placeId": "bcn-casa-vicens"
          },
          {
            "text": " 外觀順路看"
          }
        ]
      },
      {
        "id": "item-2026-10-11-03",
        "time": "15:45",
        "segments": [
          {
            "text": "Casa Batlló",
            "placeId": "bcn-casa-batllo"
          },
          {
            "text": " · Blue APP + Dragon Rooftop"
          }
        ],
        "ticketId": "tkt-casa-batllo",
        "ticketAnchorPlaceId": "bcn-casa-batllo",
        "noteSegments": [
          {
            "text": "已確認"
          }
        ]
      },
      {
        "id": "item-2026-10-11-04",
        "time": "順路",
        "segments": [
          {
            "text": "Casa Milà",
            "placeId": "bcn-casa-mila"
          },
          {
            "text": " / "
          },
          {
            "text": "Casa Amatller",
            "placeId": "bcn-casa-amatller"
          },
          {
            "text": " 外觀"
          }
        ],
        "noteSegments": [
          {
            "text": "彈性"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "Park Güell 已確認",
        "tone": "confirmed"
      },
      {
        "text": "Casa Batlló 已確認",
        "tone": "confirmed"
      },
      {
        "text": "外觀彈性",
        "tone": "flex"
      }
    ]
  },
  {
    "id": "day-2026-10-12",
    "date": "2026-10-12",
    "dateLabel": "10/12",
    "dow": "Mon",
    "city": "Barcelona",
    "title": "Sitges 一日遊",
    "sub": "舊城、海濱、海灘，度假模式",
    "categories": [
      "flex",
      "rest"
    ],
    "mapUrl": "https://www.google.com/maps/search/?api=1&query=Sitges%20Old%20Town%20Spain",
    "items": [
      {
        "id": "item-2026-10-12-01",
        "time": "08:30",
        "segments": [
          {
            "text": "Barcelona → Sitges"
          }
        ],
        "noteSegments": [
          {
            "text": "火車班次接近出發再確認"
          }
        ]
      },
      {
        "id": "item-2026-10-12-02",
        "time": "白天",
        "segments": [
          {
            "text": "Old Town · 海濱步道 · 海灘 · 午餐 · 咖啡"
          }
        ]
      },
      {
        "id": "item-2026-10-12-03",
        "time": "17:30",
        "segments": [
          {
            "text": "約回到 Barcelona"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "慢旅行",
        "tone": "flex"
      },
      {
        "text": "不塞景點",
        "tone": "flex"
      }
    ]
  },
  {
    "id": "day-2026-10-13",
    "date": "2026-10-13",
    "dateLabel": "10/13",
    "dow": "Tue",
    "city": "Barcelona",
    "title": "老城 → Born → 凱旋門 → 海邊",
    "sub": "Barcelona 最完整的一條單向散步線",
    "categories": [
      "flex",
      "rest",
      "pending"
    ],
    "mapUrl": "https://www.google.com/maps/dir/?api=1&origin=Mercat%20de%20la%20Boqueria%2C%20Barcelona&destination=Barceloneta%20Beach%2C%20Barcelona&travelmode=walking&waypoints=Barcelona%20Cathedral%7CArc%20de%20Triomf%2C%20Barcelona%7CParc%20de%20la%20Ciutadella%2C%20Barcelona",
    "items": [
      {
        "id": "item-2026-10-13-01",
        "time": "09:00",
        "segments": [
          {
            "text": "La Rambla + Boqueria 早餐"
          }
        ],
        "noteSegments": [
          {
            "text": "記得看 Joan Miró 地面馬賽克"
          }
        ]
      },
      {
        "id": "item-2026-10-13-02",
        "time": "10:00",
        "segments": [
          {
            "text": "Barri Gòtic 慢走"
          }
        ],
        "noteSegments": [
          {
            "text": "Plaça Reial → Sant Jaume → Temple d'August → Pont del Bisbe → Cathedral"
          }
        ]
      },
      {
        "id": "item-2026-10-13-03",
        "time": "12:30",
        "segments": [
          {
            "text": "El Born 午餐＋散步"
          }
        ],
        "noteSegments": [
          {
            "text": "Santa Maria del Mar → Passeig del Born"
          }
        ]
      },
      {
        "id": "item-2026-10-13-04",
        "time": "14:00",
        "segments": [
          {
            "text": "Arc de Triomf → Parc de la Ciutadella"
          }
        ]
      },
      {
        "id": "item-2026-10-13-05",
        "time": "15:15",
        "segments": [
          {
            "text": "Estació de França → Port Vell → Barceloneta"
          }
        ]
      },
      {
        "id": "item-2026-10-13-06",
        "time": "17:30",
        "segments": [
          {
            "text": "回飯店休息＋整理行李"
          }
        ]
      },
      {
        "id": "item-2026-10-13-07",
        "time": "19:30",
        "segments": [
          {
            "text": "Cruix 晚餐"
          }
        ],
        "noteSegments": [
          {
            "text": "待訂位"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "單向散步",
        "tone": "flex"
      },
      {
        "text": "17:30 緩衝",
        "tone": "rest"
      },
      {
        "text": "Cruix 待訂",
        "tone": "pending"
      }
    ],
    "note": "導遊提醒點是走到附近記得抬頭看，不是額外增加景點。"
  },
  {
    "id": "day-2026-10-14",
    "date": "2026-10-14",
    "dateLabel": "10/14",
    "dow": "Wed",
    "city": "Sevilla",
    "title": "Barcelona → Sevilla",
    "sub": "AVE 03940 直達 · 抵達後只散步",
    "categories": [
      "confirmed",
      "rest"
    ],
    "mapUrl": "https://www.google.com/maps/dir/?api=1&origin=Barcelona%20Sants&destination=Sevilla%20Santa%20Justa&travelmode=transit",
    "items": [
      {
        "id": "item-2026-10-14-01",
        "time": "08:30",
        "segments": [
          {
            "text": "Barcelona-Sants",
            "placeId": "bcn-barcelona-sants"
          },
          {
            "text": " → "
          },
          {
            "text": "Sevilla-Santa Justa",
            "placeId": "sev-sevilla-santa-justa"
          }
        ],
        "ticketId": "tkt-ave-bcn-sevilla",
        "noteSegments": [
          {
            "text": "Renfe AVE 03940 · 14:47 抵達 · 已固定"
          }
        ]
      },
      {
        "id": "item-2026-10-14-02",
        "time": "15:00+",
        "segments": [
          {
            "text": "abba Sevilla 入住"
          }
        ],
        "noteSegments": [
          {
            "text": "Plaza de la Encarnación"
          }
        ]
      },
      {
        "id": "item-2026-10-14-03",
        "time": "傍晚",
        "segments": [
          {
            "text": "Setas de Sevilla + Centro 初次散步"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "AVE 已確認",
        "tone": "confirmed"
      },
      {
        "text": "抵達日",
        "tone": "flex"
      }
    ]
  },
  {
    "id": "day-2026-10-15",
    "date": "2026-10-15",
    "dateLabel": "10/15",
    "dow": "Thu",
    "city": "Sevilla",
    "title": "王宮與主教座堂經典日",
    "sub": "一天兩個大型室內點就夠",
    "categories": [
      "confirmed",
      "rest"
    ],
    "mapUrl": "https://www.google.com/maps/dir/?api=1&origin=Real%20Alc%C3%A1zar%20de%20Sevilla&destination=Catedral%20de%20Sevilla&travelmode=walking",
    "items": [
      {
        "id": "item-2026-10-15-01",
        "time": "09:30",
        "segments": [
          {
            "text": "Real Alcázar de Sevilla",
            "placeId": "sev-real-alcazar-de-sevilla"
          }
        ],
        "ticketId": "tkt-sevilla-alcazar",
        "ticketAnchorPlaceId": "sev-real-alcazar-de-sevilla",
        "noteSegments": [
          {
            "text": "已確認 · 約至 12:00"
          }
        ]
      },
      {
        "id": "item-2026-10-15-02",
        "time": "12:00",
        "segments": [
          {
            "text": "Santa Cruz 午餐＋慢走"
          }
        ]
      },
      {
        "id": "item-2026-10-15-03",
        "time": "15:00",
        "segments": [
          {
            "text": "Catedral de Sevilla + Giralda",
            "placeId": "sev-catedral-de-sevilla-giralda"
          }
        ],
        "ticketId": "tkt-sevilla-catedral",
        "ticketAnchorPlaceId": "sev-catedral-de-sevilla-giralda",
        "noteSegments": [
          {
            "text": "已確認 · 約至 16:45"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "王宮已確認",
        "tone": "confirmed"
      },
      {
        "text": "主教座堂已確認",
        "tone": "confirmed"
      },
      {
        "text": "晚上不趕場",
        "tone": "flex"
      }
    ]
  },
  {
    "id": "day-2026-10-16",
    "date": "2026-10-16",
    "dateLabel": "10/16",
    "dow": "Fri",
    "city": "Sevilla",
    "title": "Córdoba 一日遊",
    "sub": "以 Mezquita-Catedral 為核心",
    "categories": [
      "confirmed",
      "pending",
      "flex"
    ],
    "mapUrl": "https://www.google.com/maps/dir/?api=1&origin=Mezquita-Catedral%20de%20C%C3%B3rdoba&destination=Puente%20Romano%20de%20C%C3%B3rdoba&travelmode=walking",
    "items": [
      {
        "id": "item-2026-10-16-01",
        "time": "08:11",
        "segments": [
          {
            "text": "Sevilla-Santa Justa",
            "placeId": "sev-sevilla-santa-justa"
          },
          {
            "text": " → "
          },
          {
            "text": "Córdoba",
            "placeId": "cor-cordoba-central"
          }
        ],
        "ticketId": "tkt-iryo-cordoba",
        "noteSegments": [
          {
            "text": "iryo 06097 Inicial · 08:52 抵達 · 已確認"
          }
        ]
      },
      {
        "id": "item-2026-10-16-02",
        "time": "約10:00",
        "segments": [
          {
            "text": "Mezquita-Catedral de Córdoba",
            "placeId": "cor-mezquita-catedral-de-cordoba"
          }
        ],
        "noteSegments": [
          {
            "text": "待購票"
          }
        ]
      },
      {
        "id": "item-2026-10-16-03",
        "time": "之後",
        "segments": [
          {
            "text": "Judería · 午餐 · "
          },
          {
            "text": "Puente Romano",
            "placeId": "cor-puente-romano-de-cordoba"
          },
          {
            "text": " 河岸"
          }
        ]
      },
      {
        "id": "item-2026-10-16-04",
        "time": "傍晚",
        "segments": [
          {
            "text": "Córdoba → Sevilla"
          }
        ],
        "noteSegments": [
          {
            "text": "回程交通待確認"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "去程 iryo 已確認",
        "tone": "confirmed"
      },
      {
        "text": "回程交通待確認",
        "tone": "pending"
      },
      {
        "text": "Mezquita 待購票",
        "tone": "pending"
      }
    ]
  },
  {
    "id": "day-2026-10-17",
    "date": "2026-10-17",
    "dateLabel": "10/17",
    "dow": "Sat",
    "city": "Sevilla",
    "title": "西班牙廣場、河岸與 Triana",
    "sub": "用一整天感受塞維亞",
    "categories": [
      "flex"
    ],
    "mapUrl": "https://www.google.com/maps/dir/?api=1&origin=Plaza%20de%20Espa%C3%B1a%2C%20Sevilla&destination=Mercado%20de%20Triana%2C%20Sevilla&travelmode=walking&waypoints=Torre%20del%20Oro%2C%20Sevilla",
    "items": [
      {
        "id": "item-2026-10-17-01",
        "time": "上午",
        "segments": [
          {
            "text": "Plaza de España + Parque de María Luisa"
          }
        ]
      },
      {
        "id": "item-2026-10-17-02",
        "time": "中午",
        "segments": [
          {
            "text": "Río Guadalquivir + Torre del Oro"
          }
        ]
      },
      {
        "id": "item-2026-10-17-03",
        "time": "下午",
        "segments": [
          {
            "text": "Triana 市場、陶瓷、Calle Betis、晚餐"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "散步主題日",
        "tone": "flex"
      }
    ]
  },
  {
    "id": "day-2026-10-18",
    "date": "2026-10-18",
    "dateLabel": "10/18",
    "dow": "Sun",
    "city": "Granada",
    "title": "Sevilla → Granada",
    "sub": "ALSA 直達已確認 · 抵達山城後放慢",
    "categories": [
      "confirmed",
      "flex",
      "rest"
    ],
    "mapUrl": "https://www.google.com/maps/dir/?api=1&origin=Estaci%C3%B3n%20de%20Autobuses%20Plaza%20de%20Armas%2C%20Sevilla&destination=Estaci%C3%B3n%20de%20Autobuses%20de%20Granada&travelmode=transit",
    "items": [
      {
        "id": "item-2026-10-18-01",
        "time": "上午",
        "segments": [
          {
            "text": "Sevilla 市中心自由散步＋退房"
          }
        ]
      },
      {
        "id": "item-2026-10-18-02",
        "time": "11:45",
        "segments": [
          {
            "text": "Sevilla Plaza de Armas",
            "placeId": "sev-sevilla-plaza-de-armas-bus-station"
          },
          {
            "text": " → "
          },
          {
            "text": "Granada Bus Station",
            "placeId": "grx-granada-bus-station"
          }
        ],
        "ticketId": "tkt-alsa-granada",
        "noteSegments": [
          {
            "text": "ALSA 直達 · 14:45 抵達 · 已確認"
          }
        ]
      },
      {
        "id": "item-2026-10-18-03",
        "time": "14:00+",
        "segments": [
          {
            "text": "Hotel Navas 入住"
          }
        ],
        "noteSegments": [
          {
            "text": "抵達後前往市中心"
          }
        ]
      },
      {
        "id": "item-2026-10-18-04",
        "time": "午後",
        "segments": [
          {
            "text": "Centro → Carrera del Darro"
          }
        ]
      },
      {
        "id": "item-2026-10-18-05",
        "time": "17:30",
        "segments": [
          {
            "text": "Albaicín",
            "placeId": "grx-albaicin"
          },
          {
            "text": " + "
          },
          {
            "text": "Mirador de San Nicolás",
            "placeId": "grx-mirador-de-san-nicolas"
          }
        ],
        "noteSegments": [
          {
            "text": "視抵達時間與體力決定"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "ALSA 已確認",
        "tone": "confirmed"
      },
      {
        "text": "夕陽彈性",
        "tone": "flex"
      },
      {
        "text": "累就取消",
        "tone": "rest"
      }
    ]
  },
  {
    "id": "day-2026-10-19",
    "date": "2026-10-19",
    "dateLabel": "10/19",
    "dow": "Mon",
    "city": "Granada",
    "title": "Alhambra 日",
    "sub": "這天唯一的大型景點",
    "categories": [
      "confirmed",
      "rest"
    ],
    "mapUrl": "https://www.google.com/maps/search/?api=1&query=Alhambra%20Granada",
    "items": [
      {
        "id": "item-2026-10-19-01",
        "time": "09:00",
        "segments": [
          {
            "text": "抵達 Alhambra 周邊"
          }
        ]
      },
      {
        "id": "item-2026-10-19-02",
        "time": "09:30",
        "segments": [
          {
            "text": "Alhambra",
            "placeId": "grx-alhambra"
          },
          {
            "text": " 行程開始"
          }
        ],
        "ticketId": "tkt-alhambra",
        "ticketAnchorPlaceId": "grx-alhambra",
        "noteSegments": [
          {
            "text": "已確認"
          }
        ]
      },
      {
        "id": "item-2026-10-19-03",
        "time": "11:30",
        "segments": [
          {
            "text": "Palacios Nazaríes",
            "placeId": "grx-palacios-nazaries"
          },
          {
            "text": " 指定入場"
          }
        ],
        "ticketId": "tkt-alhambra",
        "ticketAnchorPlaceId": "grx-palacios-nazaries",
        "noteSegments": [
          {
            "text": "票面固定時間"
          }
        ]
      },
      {
        "id": "item-2026-10-19-04",
        "time": "傍晚",
        "segments": [
          {
            "text": "Calle Navas · Tapas + 輕鬆晚餐"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "Alhambra 已確認",
        "tone": "confirmed"
      },
      {
        "text": "11:30 不可移動",
        "tone": "confirmed"
      },
      {
        "text": "參觀後休息",
        "tone": "rest"
      }
    ]
  },
  {
    "id": "day-2026-10-20",
    "date": "2026-10-20",
    "dateLabel": "10/20",
    "dow": "Tue",
    "city": "Madrid",
    "title": "Granada → Madrid",
    "sub": "ALVIA 2087 Confort · 最新已購票狀態",
    "categories": [
      "confirmed",
      "flex"
    ],
    "mapUrl": "https://www.google.com/maps/dir/?api=1&origin=Granada%20Railway%20Station&destination=Madrid%20Puerta%20de%20Atocha&travelmode=transit",
    "items": [
      {
        "id": "item-2026-10-20-01",
        "time": "上午",
        "segments": [
          {
            "text": "Granada Cathedral / Capilla Real / Alcaicería"
          }
        ],
        "noteSegments": [
          {
            "text": "視出發時間縮短"
          }
        ]
      },
      {
        "id": "item-2026-10-20-02",
        "time": "11:04",
        "segments": [
          {
            "text": "Granada",
            "placeId": "grx-granada-railway-station"
          },
          {
            "text": " → "
          },
          {
            "text": "Madrid-Puerta de Atocha",
            "placeId": "mad-madrid-puerta-de-atocha"
          }
        ],
        "ticketId": "tkt-alvia-madrid",
        "noteSegments": [
          {
            "text": "Renfe ALVIA 2087 Confort · 14:38 抵達 · 已購票"
          }
        ]
      },
      {
        "id": "item-2026-10-20-03",
        "time": "之後",
        "segments": [
          {
            "text": "Hotel Acta Madfor Check-in"
          }
        ]
      },
      {
        "id": "item-2026-10-20-04",
        "time": "傍晚",
        "segments": [
          {
            "text": "Puerta del Sol → Plaza Mayor → Gran Vía"
          }
        ],
        "noteSegments": [
          {
            "text": "初次散步"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "ALVIA 已確認",
        "tone": "confirmed"
      },
      {
        "text": "住宿已確認",
        "tone": "confirmed"
      },
      {
        "text": "傍晚散步",
        "tone": "flex"
      }
    ],
    "note": "採最新 Reservation／Task 狀態，不沿用城市頁較舊的「待確認」。"
  },
  {
    "id": "day-2026-10-21",
    "date": "2026-10-21",
    "dateLabel": "10/21",
    "dow": "Wed",
    "city": "Madrid",
    "title": "馬德里王宮日",
    "sub": "王宮是唯一大型固定點",
    "categories": [
      "pending",
      "flex"
    ],
    "mapUrl": "https://www.google.com/maps/search/?api=1&query=Palacio%20Real%20de%20Madrid",
    "items": [
      {
        "id": "item-2026-10-21-01",
        "time": "10:00",
        "segments": [
          {
            "text": "Palacio Real + Catedral de la Almudena"
          }
        ],
        "noteSegments": [
          {
            "text": "目前待購票"
          }
        ]
      },
      {
        "id": "item-2026-10-21-02",
        "time": "下午",
        "segments": [
          {
            "text": "Madrid de los Austrias + La Latina"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "王宮待購",
        "tone": "pending"
      },
      {
        "text": "午後自由",
        "tone": "flex"
      }
    ]
  },
  {
    "id": "day-2026-10-22",
    "date": "2026-10-22",
    "dateLabel": "10/22",
    "dow": "Thu",
    "city": "Madrid",
    "title": "Prado＋Retiro",
    "sub": "上午美術館，下午重新回到戶外",
    "categories": [
      "pending",
      "flex"
    ],
    "mapUrl": "https://www.google.com/maps/dir/?api=1&origin=Museo%20del%20Prado%2C%20Madrid&destination=Parque%20del%20Retiro%2C%20Madrid&travelmode=walking&waypoints=Puerta%20de%20Alcal%C3%A1%2C%20Madrid",
    "items": [
      {
        "id": "item-2026-10-22-01",
        "time": "10:00",
        "segments": [
          {
            "text": "Museo del Prado",
            "placeId": "mad-museo-del-prado"
          }
        ],
        "noteSegments": [
          {
            "text": "目前待購票"
          }
        ]
      },
      {
        "id": "item-2026-10-22-02",
        "time": "下午",
        "segments": [
          {
            "text": "Parque del Retiro",
            "placeId": "mad-parque-del-retiro"
          },
          {
            "text": " → Puerta de Alcalá → Plaza de Cibeles"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "Prado 待購",
        "tone": "pending"
      },
      {
        "text": "戶外散步",
        "tone": "flex"
      }
    ]
  },
  {
    "id": "day-2026-10-23",
    "date": "2026-10-23",
    "dateLabel": "10/23",
    "dow": "Fri",
    "city": "Madrid",
    "title": "Segovia 一日遊",
    "sub": "水道橋 → 舊城 → 城堡",
    "categories": [
      "pending",
      "flex"
    ],
    "mapUrl": "https://www.google.com/maps/dir/?api=1&origin=Acueducto%20de%20Segovia&destination=Alc%C3%A1zar%20de%20Segovia&travelmode=walking&waypoints=Catedral%20de%20Segovia",
    "items": [
      {
        "id": "item-2026-10-23-01",
        "time": "上午",
        "segments": [
          {
            "text": "Madrid ↔ Segovia"
          }
        ],
        "noteSegments": [
          {
            "text": "交通待確認"
          }
        ]
      },
      {
        "id": "item-2026-10-23-02",
        "time": "白天",
        "segments": [
          {
            "text": "Acueducto",
            "placeId": "seg-acueducto-de-segovia"
          },
          {
            "text": " → "
          },
          {
            "text": "Catedral",
            "placeId": "seg-catedral-de-segovia"
          },
          {
            "text": " → 午餐 → "
          },
          {
            "text": "Alcázar",
            "placeId": "seg-alcazar-de-segovia"
          }
        ]
      },
      {
        "id": "item-2026-10-23-03",
        "time": "傍晚",
        "segments": [
          {
            "text": "目標晚餐前回 Madrid"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "交通待確認",
        "tone": "pending"
      },
      {
        "text": "Alcázar 待確認",
        "tone": "pending"
      },
      {
        "text": "不趕回程",
        "tone": "flex"
      }
    ]
  },
  {
    "id": "day-2026-10-24",
    "date": "2026-10-24",
    "dateLabel": "10/24",
    "dow": "Sat",
    "city": "Madrid",
    "title": "街區、購物與咖啡",
    "sub": "真正的緩衝日，不因空白就塞滿",
    "categories": [
      "flex",
      "rest"
    ],
    "mapUrl": "https://www.google.com/maps/dir/?api=1&origin=Malasa%C3%B1a%20Madrid&destination=Gran%20V%C3%ADa%20Madrid&travelmode=walking&waypoints=Chueca%20Madrid",
    "items": [
      {
        "id": "item-2026-10-24-01",
        "time": "白天",
        "segments": [
          {
            "text": "Malasaña + Chueca + Gran Vía"
          }
        ]
      },
      {
        "id": "item-2026-10-24-02",
        "time": "隨興",
        "segments": [
          {
            "text": "購物 · 咖啡 · 散步 · 最後一晚晚餐"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "緩衝日",
        "tone": "rest"
      },
      {
        "text": "完全彈性",
        "tone": "flex"
      }
    ]
  },
  {
    "id": "day-2026-10-25",
    "date": "2026-10-25",
    "dateLabel": "10/25",
    "dow": "Sun",
    "city": "Madrid",
    "title": "最後一個上午＋返台",
    "sub": "夜班機，上午比平常更輕",
    "categories": [
      "confirmed",
      "flex",
      "rest"
    ],
    "mapUrl": "https://www.google.com/maps/search/?api=1&query=El%20Rastro%20Madrid",
    "items": [
      {
        "id": "item-2026-10-25-01",
        "time": "09:00",
        "segments": [
          {
            "text": "El Rastro + La Latina"
          }
        ],
        "noteSegments": [
          {
            "text": "可選；先確認行李寄放與機場交通"
          }
        ]
      },
      {
        "id": "item-2026-10-25-02",
        "time": "12:00前",
        "segments": [
          {
            "text": "Hotel Acta Madfor Check-out"
          }
        ]
      },
      {
        "id": "item-2026-10-25-03",
        "time": "之後",
        "segments": [
          {
            "text": "休息 · 領行李 · 前往 Madrid-Barajas Airport"
          }
        ]
      },
      {
        "id": "item-2026-10-25-04",
        "time": "21:45",
        "segments": [
          {
            "text": "EK144 Madrid 起飛"
          }
        ],
        "ticketId": "tkt-emirates-return",
        "noteSegments": [
          {
            "text": "已確認"
          }
        ]
      }
    ],
    "tags": [
      {
        "text": "返程航班已確認",
        "tone": "confirmed"
      },
      {
        "text": "市集可選",
        "tone": "flex"
      },
      {
        "text": "預留機場緩衝",
        "tone": "rest"
      }
    ]
  }
];

export const encryptedTickets = {
  "tkt-emirates-outbound": {
    "salt": "Gz71GtgfXdWdqcgtYttMDg==",
    "iv": "nk8qbIsDHdYSyG45",
    "ct": "0di963hz6dYgD9AEmw6F9sG9am1FF77i+iVO68R7brGTKTWV4wmHMv1k2DSP6HXy7hkqjFnD6yu2vCtI4fruZakpvO/sULj6RE7UxFDmQ3ddreLdOTE="
  },
  "tkt-sagrada": {
    "salt": "fJrevGLAcvi9GkUQW4yYRQ==",
    "iv": "8moyVtmYNx7otI52",
    "ct": "hxdaXEnttKMoMLb8vuHW7Bkfx8Qtm03Pxd+zE7zX87MZRZy05RJq2gV0YLBK+ZhPoxJjBJi3ZBL7z8nz87f0RAKfr1XURa//MDRtwQ=="
  },
  "tkt-park-guell": {
    "salt": "L43VXwotFO/m9Mje9ZBKMg==",
    "iv": "6QOrIs2TQkix2jPV",
    "ct": "UBI/we+Ifkn0PUyF4c9QL1P8rbNEunuWA8dliypVtX1X7Eqck+AhDHuGfOAP/TI29GQEVrg5ftM2hg6mmhZRSwnFoaXpG+aiYyvCDMyD4A=="
  },
  "tkt-casa-batllo": {
    "salt": "C5wKGvc8pFJ6xgf4/jOzhw==",
    "iv": "vAbWyCDRKv8VhEge",
    "ct": "PueNR3cZRT7NBIUG86jtDkvksCO7sgHFiG9I5XsFTw4IKeotDUWiWNlQmfZZmJMyGTNxJoz/fm4jP5h9NbJeqQZNOJ4y+ItB9B0MBYMJOlI="
  },
  "tkt-ave-bcn-sevilla": {
    "salt": "pqZOzrDEC/rf13q59nk6UQ==",
    "iv": "+VEQM4DluyRoz/mZ",
    "ct": "+PUdHgz5EfhHZGFh5BJ/i1RLhOjyMPYlBBNnWG81E+QdKgrwsPuLf9NIgxoa0Aj2zVoHaXLnjPa2iI0MJG/HtJXvPSQbOUn6AzsfMl7lxhmSbFYp"
  },
  "tkt-sevilla-alcazar": {
    "salt": "4/ctb22fYKDsyIsLZwWLwA==",
    "iv": "yAVlVq2dQferREob",
    "ct": "f2ylE4JdZIuzqTjO5kTSkIKuixjtNbefuv771w3slFy7ewiGaopV0v9St2+nP/WQ+HQOJ2EkoizH8OxxQqCT3oouzyN+dlIgwLy+bfDxdZY4IN5s"
  },
  "tkt-sevilla-catedral": {
    "salt": "QpF5uDmwUWzGpXi4CE+hIA==",
    "iv": "s13OLBkODqiVhHYk",
    "ct": "JDu7DNmxdDyHSmcqh5JJb5lz1+/35F3VOXABqfVfkjAqebUdomObQxycAfsIoCTu2stXiARhVjan9FACIqA3BRHfAX/xSp/mOGm/pwFowVMTz5Kmqg=="
  },
  "tkt-iryo-cordoba": {
    "salt": "pi5EujtVEOqrqc8Dfrcmnw==",
    "iv": "xUSP1qxsRTu045dB",
    "ct": "qGYZ0hu7t5kNxNR9Njv341U+eADI3K8jtyjXCQnGwND4JDyDXUVCVT29HIdE2+h5LnEiVr0NWS2Ix+HXoO5qFImzpd1R5uEG5qsRp2JW4lWP"
  },
  "tkt-alsa-granada": {
    "salt": "zZprcC9qf/ceqkW2rAcxWw==",
    "iv": "8P1jh0oztckwKeIo",
    "ct": "L4tWEjoybSu0jC0jYQwh80yPCSYzxxEI51xuHKei2bBjhS8NZCoMqKT+abNbnH8KCCcITnP7Pz7mxNQLoTWrs1eLRLxK4coj3uWeDOxrdV9F"
  },
  "tkt-alhambra": {
    "salt": "mRe04dLlpUKo63AOmEMr7A==",
    "iv": "MdCP6zsw7tnoxKQs",
    "ct": "OBx6bbgSgUV0sJgOaz85H6gepOXNIUFP9ZLRb57wNHC++QOjuTFVa1Yd4G6Wl3wMMkGSGLcKsA824QyptthWmWfcl92Oz/ppejhyf0I="
  },
  "tkt-alvia-madrid": {
    "salt": "CBadyyfRcY7cWcHrDYaEBQ==",
    "iv": "Ne1Ey1SqQytO2qDI",
    "ct": "Z/m7y9fypRzac60hVc8tAOc5YuAuONvNjad25eoAZvperI+x1HyI68SupGFvkuzJ0Z6r68ggWOcp3Q0mmWdbzysCdKJUGlxDFvfz9hPmK4Ic"
  },
  "tkt-emirates-return": {
    "salt": "mkwgIUZ4ul2Z6ClsCFZMng==",
    "iv": "VIgV5drIQEFyjz46",
    "ct": "5LGAAKadPn4Z6aEVWYeEe/q3e/10imMSYBK8VOO9TUQV/TAWRCmNcsb9LXHeOMambgM592Vqn0wjnZWIryTZWjeP5pLkgsen+w+k/Uw15DFyfX8y"
  }
};

export const mapConfig = {
  "cityCenter": {
    "Barcelona": [
      41.3874,
      2.1686
    ],
    "Sevilla": [
      37.3891,
      -5.9845
    ],
    "Cordoba": [
      37.8882,
      -4.7794
    ],
    "Granada": [
      37.1773,
      -3.5986
    ],
    "Madrid": [
      40.4168,
      -3.7038
    ],
    "Segovia": [
      40.9429,
      -4.1088
    ],
    "Sitges": [
      41.2372,
      1.8059
    ]
  },
  "mainRouteCities": [
    "Barcelona",
    "Sevilla",
    "Granada",
    "Madrid"
  ],
  "sideRouteCities": [
    [
      "Barcelona",
      "Sitges"
    ],
    [
      "Sevilla",
      "Cordoba"
    ],
    [
      "Madrid",
      "Segovia"
    ]
  ]
};
