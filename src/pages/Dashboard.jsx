import React, { useState, useEffect } from 'react';
import { Search, Clock, DollarSign, MapPin } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { ChatModal } from '../components/ChatModal';
import { api } from '../api/api';
import { CATEGORIES } from '../utils/constants';
import { getUserLocation, getDistanceFromLatLonInKm } from '../utils/geolocation';

const getCountdown = (pickupTime) => {
  const diff = new Date(pickupTime) - new Date();
  if (diff <= 0) return 'Забрать сейчас';
  const hours = Math.floor(diff / 36e5);
  const minutes = Math.floor((diff % 36e5) / 60000);
  return `${hours} ч ${minutes} мин`;
};

const getOfferImageUrl = (offer) => {
  if (!offer) return '';
  return offer.imageUrl || api.getFoodImageUrl(offer.title || 'food');
};

export const Dashboard = ({ user, setPage }) => {
  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filterCat, setFilterCat] = useState(CATEGORIES[0]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [chatOffer, setChatOffer] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    load();
    // Запрашиваем геолокацию при загрузке страницы
    getUserLocation().then(setUserLocation);
    
    // Автоматическое обновление списка товаров для клиентов (каждые 3 секунды)
    // Это позволяет видеть, когда товар забронирован другим пользователем
    if (user.role === 'client') {
      const interval = setInterval(() => {
        load();
      }, 3000); // Обновление каждые 3 секунды
      
      return () => clearInterval(interval);
    }
  }, [user.role]);

  const load = async () => {
    const offersData = await api.getFoodOffers();
    setOffers(offersData);
    if (user.role !== 'admin') {
      const ordersData = await api.getOrders(user.id, user.role);
      setOrders(ordersData);
    }
  };

  const handleAction = async (offer, action) => {
    if (action === 'order') {
      // Проверяем статус перед подтверждением
      if (offer.status !== 'available') {
        alert('Этот товар уже забронирован. Страница будет обновлена.');
        load();
        return;
      }
      
      if (confirm('Вы уверены, что хотите заказать это предложение?')) {
        try {
          // Дополнительная проверка перед отправкой
          const currentOffers = await api.getFoodOffers();
          const currentOffer = currentOffers.find(o => o.id === offer.id);
          
          if (!currentOffer || currentOffer.status !== 'available') {
            alert('К сожалению, этот товар уже забронирован другим пользователем. Страница будет обновлена.');
            load();
            return;
          }
          
          await api.createOrder(offer.id, user.id);
          // Немедленное обновление после успешного бронирования
          await load();
          alert('Товар успешно забронирован!');
        } catch (err) {
          // Обновляем список при ошибке, чтобы показать актуальный статус
          load();
          alert(err.message || 'Не удалось забронировать товар. Возможно, он уже занят.');
        }
      }
    } else if (action === 'cancel') {
      const order = orders.find(o => o.foodOfferId === offer.id);
      if (order && confirm('Отменить заказ?')) {
        await api.cancelOrder(order.id);
        load();
      }
    } else if (action === 'confirm') {
      const order = orders.find(o => o.foodOfferId === offer.id);
      if (order && confirm('Подтвердить заказ?')) {
        await api.confirmOrder(order.id);
        load();
      }
    } else if (action === 'complete') {
      const order = orders.find(o => o.foodOfferId === offer.id);
      if (order && confirm('Отметить как готово?')) {
        await api.completeOrder(order.id);
        load();
      }
    } else if (action === 'chat') {
      setChatOffer(offer);
    }
  };

  const filteredOffers = offers.filter(offer => {
    const titleMatch = offer.title.toLowerCase().includes(search.toLowerCase());
    if (!titleMatch) return false;

    const isAll = filterCat === CATEGORIES[0];
    if (!isAll && offer.category !== filterCat) return false;

    if (user.role === 'business') {
      const restaurant = offer.restaurant;
      if (!restaurant || restaurant.userId !== user.id) return false;

      if (activeTab === 'active') return offer.status === 'available';
      if (activeTab === 'moderation') return offer.status === 'pending_approval';
      if (activeTab === 'history') {
        return ['reserved', 'rejected', 'completed', 'expired'].includes(offer.status);
      }
    }

    if (user.role === 'client') {
      const isAvailable = offer.status === 'available';
      const myOrder = orders.find(o => o.foodOfferId === offer.id);
      if (!isAvailable && !myOrder) return false;
    }

    return true;
  });

  const featuredOffer = filteredOffers[0];
  const fallbackOffer = {
    id: 'fallback',
    title: 'Новый хлеб с корицей',
    oldPrice: 1200,
    newPrice: 700,
    pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    description: 'Добавьте свое описание и загрузите свежее фото.',
    category: CATEGORIES[1] || '',
  };
  const panelOffer = featuredOffer || fallbackOffer;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">All store dashboard</p>
          <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
          <p className="text-sm text-gray-500">
            {user.role === 'business' ? 'Ваши активные предложения' : 'Лучшие скидки рядом'}
          </p>
        </div>
        <div className="flex gap-3">
          {user.role === 'business' && (
            <>
              <Button variant={activeTab === 'active' ? 'primary' : 'secondary'} onClick={() => setActiveTab('active')}>
                Активные
              </Button>
              <Button variant={activeTab === 'moderation' ? 'primary' : 'secondary'} onClick={() => setActiveTab('moderation')}>
                На проверке
              </Button>
              <Button variant={activeTab === 'history' ? 'primary' : 'secondary'} onClick={() => setActiveTab('history')}>
                История
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            className="w-full rounded-2xl border border-gray-200 bg-white/60 px-12 py-3 text-sm text-gray-700 shadow-inner"
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                filterCat === cat
                  ? 'bg-[#8B4513] text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <section className="flex-1 space-y-4">
          {filteredOffers.length === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 text-center text-sm text-gray-500">
              Нет предложений. Создайте новое или обновите фильтры.
            </div>
          )}
          <div className="space-y-4">
            {filteredOffers.map(offer => {
              const restaurant = offer.restaurant;
              const myOrder = orders.find(o => o.foodOfferId === offer.id);
              const isExpired = new Date(offer.pickupTime) < new Date();
              const imageUrl = getOfferImageUrl(offer);
              
              // Расчет дистанции для каждого поста
              let distString = null;
              if (userLocation && offer.coords) {
                const km = getDistanceFromLatLonInKm(
                  userLocation.lat, 
                  userLocation.lng, 
                  offer.coords.lat, 
                  offer.coords.lng
                );
                if (km !== null) distString = `${km} км от вас`;
              }
              
              const isReserved = offer.status === 'reserved' && !myOrder;
              
              return (
                <div
                  key={offer.id}
                  className={`relative flex flex-col gap-4 rounded-3xl border p-4 shadow-sm transition ${
                    myOrder 
                      ? 'border-amber-300 bg-amber-50/30' 
                      : isReserved
                      ? 'border-red-200 bg-red-50/30 opacity-75'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  {/* Индикатор забронированного товара */}
                  {isReserved && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        🔒 Забронировано
                      </span>
                    </div>
                  )}
                  {/* ОТОБРАЖЕНИЕ ДИСТАНЦИИ */}
                  {distString && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="text-[10px] font-bold bg-white/90 backdrop-blur text-gray-700 px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        <MapPin size={12} className="text-emerald-600" />
                        {distString}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-20 w-28 overflow-hidden rounded-2xl bg-gray-100 flex items-center justify-center relative">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={offer.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://via.placeholder.com/800x600/F5E6D3/8B4513?text=${encodeURIComponent(offer.title)}`;
                            }}
                          />
                        ) : (
                          <div className="text-xs text-gray-400 text-center p-2">Нет фото</div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="rounded-full bg-gray-100 px-2 py-1">
                            {offer.category}
                          </span>
                          <StatusBadge status={isExpired && offer.status === 'available' ? 'expired' : offer.status} />
                          {isReserved && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                              Занят
                            </span>
                          )}
                        </div>
                        <h3 className={`text-lg font-semibold ${isReserved ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {offer.title}
                        </h3>
                        <p className="text-sm text-gray-500">{offer.description}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p className="text-xs uppercase tracking-wide">Забрать до</p>
                      <p className="text-base font-semibold text-gray-700">{new Date(offer.pickupTime).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
                      {restaurant && (
                        <p className="text-xs text-gray-400">{restaurant.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <DollarSign size={18} />
                      <div>
                        <p className="text-xs">Обычная</p>
                        <p className="text-sm line-through text-gray-400">{offer.oldPrice} ₸</p>
                      </div>
                      <div>
                        <p className="text-xs">Скидка</p>
                        <p className="text-lg font-bold text-[#8B4513]">{offer.newPrice} ₸</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-1 text-xs font-semibold text-[#8B4513]">
                      <Clock size={14} />
                      {getCountdown(offer.pickupTime)}
                    </div>
                  </div>

                  {/* Полный адрес для клиентов */}
                  {user.role === 'client' && offer.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <MapPin size={16} className="text-[#8B4513] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Адрес получения</p>
                        <p className="font-medium text-gray-800">{offer.address}</p>
                        {restaurant && restaurant.name && (
                          <p className="text-xs text-gray-500 mt-1">{restaurant.name}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {user.role === 'client' && (
                      <>
                        <Button variant="secondary" className="text-sm" onClick={() => handleAction(offer, 'chat')}>
                          Чат
                        </Button>
                        {myOrder ? (
                          <Button
                            variant="danger"
                            className="text-sm"
                            onClick={() => handleAction(offer, 'cancel')}
                            disabled={myOrder.status === 'completed'}
                          >
                            Отменить
                          </Button>
                        ) : (
                          <Button
                            className="text-sm"
                            onClick={() => handleAction(offer, 'order')}
                            disabled={offer.status !== 'available' || isExpired}
                            title={offer.status !== 'available' ? 'Товар уже забронирован' : isExpired ? 'Время истекло' : 'Забронировать товар'}
                          >
                            {offer.status === 'reserved' ? 'Забронировано' : 'Забронировать'}
                          </Button>
                        )}
                      </>
                    )}
                    {user.role === 'business' && (
                      <>
                        <Button variant="secondary" className="text-sm" onClick={() => handleAction(offer, 'chat')}>
                          Чат
                        </Button>
                        {myOrder && myOrder.status === 'pending' && (
                          <Button className="text-sm" onClick={() => handleAction(offer, 'confirm')}>
                            Подтвердить
                          </Button>
                        )}
                        {myOrder && myOrder.status === 'confirmed' && (
                          <Button className="text-sm" onClick={() => handleAction(offer, 'complete')}>
                            Готово
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="flex w-full max-w-[360px] flex-col gap-4">
          <div className="rounded-[32px] border border-gray-200 bg-[radial-gradient(circle_at_top,#FDF5E6_0%,#ffffff_60%)] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">New Offer</p>
              <Button variant="ghost" className="text-xs" onClick={() => setPage && setPage('create')}>
                Открыть
              </Button>
            </div>
            <h3 className="mt-2 text-2xl font-semibold text-gray-900">{panelOffer.title}</h3>
            <div className="mt-4 h-48 w-full overflow-hidden rounded-3xl bg-gray-100 flex items-center justify-center">
              {getOfferImageUrl(panelOffer) ? (
                <img
                  src={getOfferImageUrl(panelOffer)}
                  alt={panelOffer.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://via.placeholder.com/800x600/F5E6D3/8B4513?text=${encodeURIComponent(panelOffer.title)}`;
                  }}
                />
              ) : (
                <div className="text-sm text-gray-400 text-center p-4">Нет фото</div>
              )}
            </div>
            <div className="mt-4 grid gap-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Original price</span>
                <span className="line-through text-gray-400">{panelOffer.oldPrice} ₸</span>
              </div>
              <div className="flex items-center justify-between">
                <span>New price</span>
                <span className="text-[#8B4513] font-semibold">{panelOffer.newPrice} ₸</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Timer</span>
                <span className="text-[#8B4513] font-semibold">{getCountdown(panelOffer.pickupTime)}</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Description</p>
                <p className="text-sm text-gray-700">{panelOffer.description}</p>
              </div>
            </div>
            <Button
              className="mt-6 w-full justify-center bg-[#8B4513] text-white hover:bg-[#654321]"
              onClick={() => setPage && setPage('create')}
            >
              Create Offer
            </Button>
          </div>
        </aside>
      </div>

      {chatOffer && (
        <ChatModal
          post={chatOffer}
          currentUser={user}
          onClose={() => setChatOffer(null)}
        />
      )}
    </div>
  );
};
