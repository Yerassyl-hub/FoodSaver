export const DB_KEY = 'foodsaver_v1';
export const DEMO_AI_KEY = 'AIzaSyCfWX8cr_omLxMCrN5-3FzIclX5_j32s2o';

export const CITIES = {
  'г. Алматы': ['Алматы', 'мкр. Думан'],
  'г. Астана': ['Астана', 'с. Ильинка'],
  'г. Шымкент': ['Шымкент', 'Ленгер'],
  'Акмолинская обл.': ['Кокшетау', 'Степногорск'],
  'Карагандинская обл.': ['Караганда', 'Темиртау'],
  'Жамбылская обл.': ['Тараз', 'Шу', 'Кордай'],
};

export const REGIONS = Object.keys(CITIES);
export const CATEGORIES = ['Все', 'Выпечка', 'Горячее', 'Салаты', 'Напитки', 'Десерты'];

export const INITIAL_DATA = {
  users: [
    { id: 1, email: 'client@test.com', pass: '123', name: 'Иван Петров', role: 'client' },
    { id: 2, email: 'cafe@test.com', pass: '123', name: 'Кафе "Уют"', role: 'business' },
    { id: 3, email: 'admin@test.com', pass: 'admin', name: 'Админ', role: 'admin' },
  ],
  restaurants: [
    { 
      id: 1, 
      userId: 2, 
      name: 'Кафе "Уют"', 
      address: 'Абая 10', 
      city: 'Алматы', 
      region: 'г. Алматы', 
      phone: '+7 777 123 4567',
      coords: { lat: 43.2220, lng: 76.8512 } // Координаты Алматы
    },
  ],
  foodOffers: [
    { 
      id: 1, 
      restaurantId: 1, 
      title: 'Пицца Маргарита', 
      category: 'Горячее', 
      oldPrice: 2500, 
      newPrice: 1000, 
      pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'available', 
      description: 'Свежая пицца, осталось 3 порции.',
      createdAt: new Date().toISOString(),
      coords: { lat: 43.2220, lng: 76.8512 } // Координаты ресторана
    },
  ],
  orders: [],
  messages: {}
};

export const delay = (ms) => new Promise(res => setTimeout(res, ms));


