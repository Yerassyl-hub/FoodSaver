const FoodOffer = {
  async create(data, restaurantId) {
    return {
      id: Date.now(),
      restaurantId,
      ...data,
      status: 'pending_approval',
      createdAt: new Date().toISOString()
    };
  },

  async findById(id) {
    return db.foodOffers.find(f => f.id === id);
  },

  async findByRestaurant(restaurantId) {
    return db.foodOffers.filter(f => f.restaurantId === restaurantId);
  },

  async findAvailable() {
    return db.foodOffers.filter(f => f.status === 'available');
  },

  async updateStatus(id, status) {
    const offer = db.foodOffers.find(f => f.id === id);
    if (offer) {
      offer.status = status;
      return offer;
    }
    return null;
  }
};

const Order = {
  async create(data) {
    return {
      id: Date.now(),
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  },

  async findById(id) {
    return db.orders.find(o => o.id === id);
  },

  async findByClient(clientId) {
    return db.orders.filter(o => o.clientId === clientId);
  },

  async findByRestaurant(restaurantId) {
    return db.orders.filter(o => o.restaurantId === restaurantId);
  },

  async updateStatus(id, status) {
    const order = db.orders.find(o => o.id === id);
    if (order) {
      order.status = status;
      if (status === 'confirmed') order.confirmedAt = new Date().toISOString();
      if (status === 'completed') order.completedAt = new Date().toISOString();
      return order;
    }
    return null;
  }
};

const FoodOfferController = {
  async create(req, res) {
    const { title, category, oldPrice, newPrice, pickupTime, description } = req.body;
    const restaurant = await Restaurant.findByUserId(req.user.id);
    if (!restaurant) return res.status(404).json({ error: 'Ресторан не найден' });
    
    const offer = await FoodOffer.create({
      title,
      category,
      oldPrice,
      newPrice,
      pickupTime,
      description
    }, restaurant.id);
    
    res.status(201).json(offer);
  },

  async getAll(req, res) {
    const { category, city } = req.query;
    let offers = await FoodOffer.findAvailable();
    
    if (category) offers = offers.filter(o => o.category === category);
    if (city) {
      const restaurants = await Restaurant.findByCity(city);
      const restaurantIds = restaurants.map(r => r.id);
      offers = offers.filter(o => restaurantIds.includes(o.restaurantId));
    }
    
    res.json(offers);
  },

  async getById(req, res) {
    const offer = await FoodOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Предложение не найдено' });
    res.json(offer);
  }
};

const OrderController = {
  async create(req, res) {
    const { foodOfferId } = req.body;
    const offer = await FoodOffer.findById(foodOfferId);
    
    if (!offer) return res.status(404).json({ error: 'Предложение не найдено' });
    if (offer.status !== 'available') return res.status(400).json({ error: 'Предложение недоступно' });
    
    const restaurant = await Restaurant.findById(offer.restaurantId);
    const order = await Order.create({
      foodOfferId,
      clientId: req.user.id,
      restaurantId: restaurant.id
    });
    
    await FoodOffer.updateStatus(foodOfferId, 'reserved');
    res.status(201).json(order);
  },

  async confirm(req, res) {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });
    
    const restaurant = await Restaurant.findByUserId(req.user.id);
    if (order.restaurantId !== restaurant.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    
    await Order.updateStatus(req.params.id, 'confirmed');
    res.json({ success: true });
  },

  async complete(req, res) {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });
    
    const restaurant = await Restaurant.findByUserId(req.user.id);
    if (order.restaurantId !== restaurant.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    
    await Order.updateStatus(req.params.id, 'completed');
    await FoodOffer.updateStatus(order.foodOfferId, 'completed');
    res.json({ success: true });
  },

  async cancel(req, res) {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });
    
    const isClient = order.clientId === req.user.id;
    const restaurant = await Restaurant.findByUserId(req.user.id);
    const isBusiness = order.restaurantId === restaurant?.id;
    
    if (!isClient && !isBusiness) {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    
    await Order.updateStatus(req.params.id, 'cancelled');
    await FoodOffer.updateStatus(order.foodOfferId, 'available');
    res.json({ success: true });
  },

  async getMyOrders(req, res) {
    if (req.user.role === 'client') {
      const orders = await Order.findByClient(req.user.id);
      res.json(orders);
    } else if (req.user.role === 'business') {
      const restaurant = await Restaurant.findByUserId(req.user.id);
      if (!restaurant) return res.json([]);
      const orders = await Order.findByRestaurant(restaurant.id);
      res.json(orders);
    } else {
      res.json([]);
    }
  }
};


