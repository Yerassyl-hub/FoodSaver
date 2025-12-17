import React, { useState, useEffect } from 'react';
import { 
  Search, Package, Recycle, MapPin, Users, MessageCircle, 
  Loader2, Eye, History, Ban, CheckCircle, XCircle
} from 'lucide-react';
import { getUserLocation, getDistanceFromLatLonInKm, BASE_COORDS } from '../utils/geolocation';

// Assume these are available from context/hooks
// const { user } = useAuth();
// const { navigate } = useRouter();
// const api = { getPosts, getLocations, updatePostStatus };

// Status Badge Component
const StatusBadge = ({ status, isReservedByMe = false }) => {
  const badgeMap = {
    available: { c: 'bg-green-100 text-green-700', t: 'Доступно' },
    pending_approval: { c: 'bg-orange-100 text-orange-700', t: 'На модерации' },
    reserved: { c: 'bg-blue-100 text-blue-700', t: 'Забронировано' },
    rejected: { c: 'bg-red-100 text-red-700', t: 'Отклонен' },
    completed: { c: 'bg-gray-100 text-gray-600', t: 'Завершен' }
  };
  
  if (isReservedByMe) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500 text-white flex items-center gap-1">
        <CheckCircle size={10} /> Вы забрали
      </span>
    );
  }
  
  const badge = badgeMap[status] || badgeMap.available;
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${badge.c}`}>{badge.t}</span>;
};

// Chat Modal Component (simplified)
const ChatModal = ({ post, onClose, userRole }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    // await api.sendMessage(post.id, messageText, userRole);
    setMessageText('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md h-[600px] rounded-2xl shadow-2xl flex flex-col">
        <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold">{post.title}</h3>
            <p className="text-xs opacity-90">Лот #{post.id} • {post.category}</p>
          </div>
          <button onClick={onClose} className="hover:bg-emerald-700 p-1 rounded">
            <XCircle size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 mt-10 text-sm">Начните обсуждение...</p>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === userRole ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender === userRole ? 'bg-emerald-100 text-emerald-900' : 'bg-white border'}`}>
                <p>{msg.text}</p>
                <span className="text-[10px] opacity-50 block text-right mt-1">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2">
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1 border rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Напишите сообщение..."
          />
          <button className="bg-emerald-600 text-white p-2.5 rounded-full hover:bg-emerald-700">
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
};

export const EcoFlowDashboard = ({ user, api, onNavigate }) => {
  // State
  const [posts, setPosts] = useState([]);
  const [locations, setLocations] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все');
  const [region, setRegion] = useState('Весь Казахстан');
  const [tab, setTab] = useState('active');

  // Categories
  const CATEGORIES = ['Все', 'Еда', 'Одежда', 'Медицина', 'Отходы'];

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch posts and locations
        const [postsData, locationsData] = await Promise.all([
          api.getPosts(),
          api.getLocations()
        ]);
        setPosts(postsData);
        setLocations(locationsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [api]);

  // Get user location on mount
  useEffect(() => {
    getUserLocation().then(setUserLocation);
  }, []);

  // Filtering logic
  const filteredPosts = posts.filter(post => {
    // Role-based filtering
    if (user.role === 'donor') {
      // Donor sees only their own posts
      if (post.author !== user.name) return false;
      
      // Tab filtering
      if (tab === 'active') return post.status === 'available';
      if (tab === 'moderation') return post.status === 'pending_approval';
      if (tab === 'history') return ['reserved', 'rejected', 'completed'].includes(post.status);
    } else if (user.role === 'recipient') {
      // Recipient sees available posts OR posts reserved by themselves
      const isAvailable = post.status === 'available';
      const isMine = post.status === 'reserved' && post.reservedBy === user.name;
      if (!isAvailable && !isMine) return false;
      
      // Region filtering (unless 'All Kazakhstan')
      if (isAvailable && region !== 'Весь Казахстан' && post.region !== region) return false;
    }

    // Search filter
    if (search && !post.title.toLowerCase().includes(search.toLowerCase())) return false;

    // Category filter
    if (category !== 'Все' && post.category !== category) return false;

    return true;
  });

  // Handle actions
  const handleAction = async (post, action) => {
    if (action === 'chat') {
      setActiveChat(post);
    } else if (action === 'reserve') {
      if (confirm('Подтвердить бронирование?')) {
        try {
          await api.updatePostStatus(post.id, 'reserved', user.name);
          // Reload posts
          const updatedPosts = await api.getPosts();
          setPosts(updatedPosts);
        } catch (error) {
          alert('Ошибка при бронировании: ' + error.message);
        }
      }
    } else if (action === 'cancel') {
      if (confirm('Отменить бронирование?')) {
        try {
          await api.updatePostStatus(post.id, 'available');
          const updatedPosts = await api.getPosts();
          setPosts(updatedPosts);
        } catch (error) {
          alert('Ошибка при отмене: ' + error.message);
        }
      }
    }
  };

  // Calculate distance for a post
  const getDistance = (post) => {
    if (!userLocation || !post.coords) return null;
    return getDistanceFromLatLonInKm(
      userLocation.lat,
      userLocation.lng,
      post.coords.lat,
      post.coords.lng
    );
  };

  // Get icon based on category
  const getCategoryIcon = (category) => {
    if (category === 'Отходы') return Recycle;
    return Package;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {user.role === 'donor' ? 'Склад лотов' : 'Каталог ресурсов'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Сегодня {new Date().toLocaleDateString('ru-RU')}
          </p>
        </div>
        
        {user.role === 'recipient' && (
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border border-gray-200 p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs sm:text-sm w-full md:w-auto"
          >
            <option>Весь Казахстан</option>
            {Object.keys(locations).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs for Donor */}
      {user.role === 'donor' && (
        <div className="flex gap-1 bg-white p-1 rounded-lg sm:rounded-xl border border-gray-200 w-full sm:w-fit shadow-sm overflow-x-auto">
          {[
            { id: 'active', label: 'Активные', icon: Package },
            { id: 'moderation', label: 'На модерации', icon: Eye },
            { id: 'history', label: 'История', icon: History }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                tab === t.id
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <t.icon size={14} className="sm:w-4 sm:h-4" /> {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-3 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg sm:rounded-xl pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
            placeholder="Поиск по названию..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                category === cat
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Search className="text-gray-300" size={32} />
          </div>
          <p className="text-gray-500 font-medium">Ничего не найдено</p>
          <button
            onClick={() => {
              setSearch('');
              setCategory('Все');
              setRegion('Весь Казахстан');
            }}
            className="mt-2 text-emerald-600 text-sm hover:underline"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        /* Posts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPosts.map(post => {
            const isMine = post.reservedBy === user.name;
            const distance = getDistance(post);
            const CategoryIcon = getCategoryIcon(post.category);
            const isReservedByMe = user.role === 'recipient' && isMine;

            return (
              <div
                key={post.id}
                className={`bg-white border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group ${
                  isMine ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-gray-100'
                }`}
              >
                {/* Image/Icon Area */}
                <div
                  className={`h-32 sm:h-40 flex items-center justify-center relative overflow-hidden ${
                    post.category === 'Отходы'
                      ? 'bg-gray-100'
                      : post.category === 'Еда'
                      ? 'bg-orange-50'
                      : 'bg-blue-50'
                  }`}
                >
                  <CategoryIcon
                    size={40}
                    className={`sm:w-14 sm:h-14 ${
                      post.category === 'Отходы'
                        ? 'text-gray-400'
                        : post.category === 'Еда'
                        ? 'text-orange-300'
                        : 'text-blue-300'
                    } group-hover:scale-110 transition-transform duration-500`}
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={post.status} isReservedByMe={isReservedByMe} />
                  </div>

                  {/* Distance Badge */}
                  {distance !== null && (
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[10px] font-bold bg-white/90 backdrop-blur text-gray-700 px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        <MapPin size={12} className="text-emerald-600" />
                        {distance} км от вас
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 sm:p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl leading-snug mb-1.5 sm:mb-2 text-gray-800 break-words">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mb-3 sm:mb-4 leading-relaxed">
                    {post.description}
                  </p>
                  <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-50 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                    <p className="flex gap-2 items-center">
                      <MapPin size={14} className="sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{post.location}</span>
                    </p>
                    <p className="flex gap-2 items-center">
                      <Users size={14} className="sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{post.author}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-2 sm:gap-3">
                  {user.role === 'recipient' && (
                    <>
                      <button
                        onClick={() => handleAction(post, 'chat')}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
                      >
                        <MessageCircle size={14} className="sm:w-4 sm:h-4" /> Чат
                      </button>
                      {isMine ? (
                        <button
                          onClick={() => handleAction(post, 'cancel')}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                        >
                          <Ban size={14} className="sm:w-4 sm:h-4" /> Отмена
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(post, 'reserve')}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
                        >
                          Забрать
                        </button>
                      )}
                    </>
                  )}
                  {user.role === 'donor' && (
                    <button
                      onClick={() => handleAction(post, 'chat')}
                      className="col-span-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                      <MessageCircle size={14} className="sm:w-4 sm:h-4" /> Открыть чат
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chat Modal */}
      {activeChat && (
        <ChatModal
          post={activeChat}
          userRole={user.role}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
};

