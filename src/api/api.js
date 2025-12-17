import { DB_KEY, INITIAL_DATA, DEMO_AI_KEY, delay } from '../utils/constants';

const resolveImageQuery = (rawTitle) => {
  const normalized = String(rawTitle || '').trim().toLowerCase();
  if (!normalized) return '';
  if (normalized.includes('\u0445\u043b\u0435\u0431')) return 'bread loaf';
  if (normalized.includes('\u0431\u0443\u043b\u043e\u0447') || normalized.includes('\u0431\u0443\u043b\u043a')) return 'bread roll';
  return normalized;
};

const buildImageUrl = (rawTitle) => {
  const query = resolveImageQuery(rawTitle);
  if (!query) return '';
  
  // Используем прямые ссылки на изображения еды из Unsplash
  const normalized = query.toLowerCase();
  
  // Пицца
  if (normalized.includes('pizza') || normalized.includes('пицц')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&auto=format';
  }
  // Хлеб и выпечка
  if (normalized.includes('bread') || normalized.includes('хлеб') || normalized.includes('булоч')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop&auto=format';
  }
  // Салаты
  if (normalized.includes('salad') || normalized.includes('салат')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&auto=format';
  }
  // Десерты и торты
  if (normalized.includes('cake') || normalized.includes('торт') || normalized.includes('десерт') || normalized.includes('dessert')) {
    return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop&auto=format';
  }
  // Бургеры
  if (normalized.includes('burger') || normalized.includes('бургер')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop&auto=format';
  }
  // Паста
  if (normalized.includes('pasta') || normalized.includes('паста') || normalized.includes('макарон')) {
    return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop&auto=format';
  }
  // Суши
  if (normalized.includes('sushi') || normalized.includes('суши')) {
    return 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&auto=format';
  }
  // По умолчанию - общее изображение еды
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&auto=format';
};

export const api = {
  getFoodImageUrl(title) {
    return buildImageUrl(title);
  },

  loadDB: () => {
    const saved = localStorage.getItem(DB_KEY);
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  },

  saveDB: (data) => {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  },

  async login(email, password) {
    await delay(500);
    const db = this.loadDB();
    
    // Нормализуем email (убираем пробелы, приводим к нижнему регистру)
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedPassword = (password || '').trim();
    
    if (!normalizedEmail || !normalizedPassword) {
      throw new Error('Заполните все поля');
    }
    
    // Ищем пользователя
    const user = db.users.find(u => {
      const userEmail = (u.email || '').trim().toLowerCase();
      // Проверяем оба варианта: pass и password
      const userPass = String(u.pass || u.password || '').trim();
      const matches = userEmail === normalizedEmail && userPass === normalizedPassword;
      
      if (matches) {
        console.log('Login success:', { email: normalizedEmail, userId: u.id, role: u.role });
      }
      
      return matches;
    });
    
    if (!user) {
      console.error('Login failed:', { 
        email: normalizedEmail, 
        passwordLength: normalizedPassword.length,
        users: db.users.map(u => ({ 
          email: u.email, 
          pass: u.pass || u.password || 'none',
          role: u.role 
        })) 
      });
      throw new Error('Неверный логин или пароль');
    }
    
    return user;
  },

  async getFoodOffers() {
    await delay(500);
    const db = this.loadDB();
    return db.foodOffers.map(offer => {
      const restaurant = db.restaurants.find(r => r.id === offer.restaurantId);
      // Если у поста нет координат, используем координаты ресторана
      const coords = offer.coords || restaurant?.coords || null;
      // Если у поста нет адреса, используем адрес ресторана
      const address = offer.address || restaurant?.address || null;
      return { ...offer, restaurant, coords, address };
    });
  },

  async createFoodOffer(offerData, userId) {
    await delay(500);
    const db = this.loadDB();
    const restaurant = db.restaurants.find(r => r.userId === userId);
    if (!restaurant) throw new Error('Ресторан не найден');
    
    // Используем координаты ресторана, если они есть
    const coords = offerData.coords || restaurant.coords || null;
    const address = offerData.address || restaurant.address || null;
    
    const newOffer = {
      id: Date.now(),
      ...offerData,
      restaurantId: restaurant.id,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      coords,
      address
    };
    db.foodOffers.unshift(newOffer);
    this.saveDB(db);
  },

  async updateOfferStatus(offerId, newStatus) {
    await delay(300);
    const db = this.loadDB();
    const offer = db.foodOffers.find(f => f.id === offerId);
    if (offer) {
      offer.status = newStatus;
      this.saveDB(db);
    }
  },

  async createOrder(offerId, clientId) {
    await delay(500);
    const db = this.loadDB();
    
    // Атомарная проверка и обновление статуса
    const offer = db.foodOffers.find(f => f.id === offerId);
    if (!offer) throw new Error('Предложение не найдено');
    
    // Критическая проверка: если товар уже забронирован, выбрасываем ошибку
    if (offer.status !== 'available') {
      // Проверяем, не забронировал ли уже этот пользователь
      const existingOrder = db.orders.find(o => o.foodOfferId === offerId && o.clientId === clientId);
      if (existingOrder) {
        throw new Error('Вы уже забронировали этот товар');
      }
      throw new Error('К сожалению, этот товар уже забронирован другим пользователем. Обновите страницу.');
    }
    
    // Проверяем, нет ли уже заказа на этот товар (защита от race condition)
    const existingOrderForOffer = db.orders.find(o => o.foodOfferId === offerId && o.status !== 'cancelled');
    if (existingOrderForOffer) {
      throw new Error('Этот товар уже забронирован. Обновите страницу.');
    }
    
    // Атомарное создание заказа и обновление статуса
    const newOrder = {
      id: Date.now(),
      foodOfferId: offerId,
      clientId,
      restaurantId: offer.restaurantId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    db.orders.push(newOrder);
    offer.status = 'reserved';
    offer.reservedBy = clientId; // Сохраняем, кто забронировал
    offer.reservedAt = new Date().toISOString(); // Время бронирования
    this.saveDB(db);
    return newOrder;
  },

  async getOrders(userId, userRole) {
    await delay(300);
    const db = this.loadDB();
    if (userRole === 'client') {
      return db.orders.filter(o => o.clientId === userId);
    } else if (userRole === 'business') {
      const restaurant = db.restaurants.find(r => r.userId === userId);
      if (!restaurant) return [];
      return db.orders.filter(o => o.restaurantId === restaurant.id);
    }
    return [];
  },

  async confirmOrder(orderId) {
    await delay(300);
    const db = this.loadDB();
    const order = db.orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'confirmed';
      order.confirmedAt = new Date().toISOString();
      this.saveDB(db);
    }
  },

  async completeOrder(orderId) {
    await delay(300);
    const db = this.loadDB();
    const order = db.orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'completed';
      order.completedAt = new Date().toISOString();
      const offer = db.foodOffers.find(f => f.id === order.foodOfferId);
      if (offer) offer.status = 'completed';
      this.saveDB(db);
    }
  },

  async cancelOrder(orderId) {
    await delay(300);
    const db = this.loadDB();
    const order = db.orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'cancelled';
      const offer = db.foodOffers.find(f => f.id === order.foodOfferId);
      if (offer) offer.status = 'available';
      this.saveDB(db);
    }
  },

  async sendMessage(offerId, text, senderRole) {
    const db = this.loadDB();
    if (!db.messages[offerId]) db.messages[offerId] = [];
    
    db.messages[offerId].push({
      text,
      sender: senderRole,
      time: new Date().toLocaleTimeString().slice(0, 5)
    });
    this.saveDB(db);
  },

  async getMessages(offerId) {
    return this.loadDB().messages[offerId] || [];
  },

  async getUserChats(userName, userRole) {
    await delay(300);
    const db = this.loadDB();
    const result = [];
    const currentUser = db.users.find(u => u.name === userName);

    db.foodOffers.forEach(offer => {
      const msgs = db.messages[offer.id];
      if (!msgs || msgs.length === 0) return;

      const restaurant = db.restaurants.find(r => r.id === offer.restaurantId);
      if (!restaurant) return;

      if (userRole === 'business') {
        if (restaurant.userId === currentUser?.id) {
          result.push({ ...offer, restaurant });
        }
      } else if (userRole === 'client') {
        if (restaurant.userId !== currentUser?.id) {
          result.push({ ...offer, restaurant });
        }
      }
    });

    return result;
  },

  async generateAI(title, category) {
    const apiKey = localStorage.getItem('ai_key') || DEMO_AI_KEY;
    if (!apiKey || apiKey === DEMO_AI_KEY) {
      // Если используется демо-ключ или ключ не найден, используем простые шаблоны
      return this.generateSimpleDescription(title, category);
    }

    // Используем актуальные модели Gemini
    const models = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    
    for (const model of models) {
      try {
        const prompt = `Придумай короткое описание (1-2 фразы) для блюда "${title}" категории "${category}" в ресторане перед закрытием.`;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ 
              parts: [{ text: prompt }] 
            }] 
          })
        });

        if (response.status === 429) {
          return this.generateSimpleDescription(title, category) + " (лимит API превышен)";
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('AI API Error:', errorData);
          
          // Если это последняя модель, используем fallback
          if (models.indexOf(model) === models.length - 1) {
            if (response.status === 401 || response.status === 403) {
              return this.generateSimpleDescription(title, category) + "\n\n⚠️ Неверный API ключ. Получите новый ключ в настройках.";
            }
            if (response.status === 404) {
              return this.generateSimpleDescription(title, category) + "\n\n⚠️ Модель недоступна. Проверьте API ключ в настройках.";
            }
            return this.generateSimpleDescription(title, category) + `\n\n⚠️ Ошибка API: ${response.status}`;
          }
          // Пробуем следующую модель
          continue;
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          console.error('AI Response Error:', data);
          if (models.indexOf(model) === models.length - 1) {
            return this.generateSimpleDescription(title, category);
          }
          continue;
        }

        const text = data.candidates[0].content.parts[0].text;
        return text.trim();
      } catch (e) {
        console.error('AI Generation Error:', e);
        if (models.indexOf(model) === models.length - 1) {
          return this.generateSimpleDescription(title, category) + "\n\n⚠️ Ошибка подключения к AI сервису.";
        }
        // Пробуем следующую модель
        continue;
      }
    }
    
    return this.generateSimpleDescription(title, category);
  },

  generateSimpleDescription(title, category) {
    // Простые шаблоны описаний на основе категории
    const templates = {
      'Выпечка': [
        `Свежая ${title.toLowerCase()}. Выпечено сегодня, осталось ограниченное количество.`,
        `${title} - свежая выпечка, приготовленная сегодня утром.`,
        `Вкусная ${title.toLowerCase()}, осталось несколько порций.`
      ],
      'Горячее': [
        `${title} - горячее блюдо, приготовленное сегодня. Осталось ограниченное количество.`,
        `Свежеприготовленное ${title.toLowerCase()}, осталось несколько порций.`,
        `${title}, осталось ограниченное количество порций.`
      ],
      'Салаты': [
        `Свежий салат "${title.toLowerCase()}", приготовлен сегодня.`,
        `${title} - свежий салат, осталось несколько порций.`,
        `Вкусный салат "${title.toLowerCase()}", приготовлен сегодня утром.`
      ],
      'Напитки': [
        `${title} - свежий напиток, осталось ограниченное количество.`,
        `Охлажденный ${title.toLowerCase()}, осталось несколько порций.`,
        `${title}, осталось ограниченное количество.`
      ],
      'Десерты': [
        `Вкусный десерт "${title.toLowerCase()}", приготовлен сегодня.`,
        `${title} - свежий десерт, осталось несколько порций.`,
        `Сладкий ${title.toLowerCase()}, осталось ограниченное количество.`
      ]
    };

    const categoryTemplates = templates[category] || templates['Горячее'];
    const randomTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
    return randomTemplate;
  }
};
