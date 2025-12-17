import React, { useState, useEffect } from 'react';
import { MessageCircle, MapPin, Users } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { ChatModal } from '../components/ChatModal';
import { api } from '../api/api';

export const MessagesPage = ({ user }) => {
  const [chats, setChats] = useState([]);
  const [chatPost, setChatPost] = useState(null);

  const load = async () => {
    const offers = await api.getUserChats(user.name, user.role);
    const withLast = await Promise.all(
      offers.map(async (offer) => {
        const msgs = await api.getMessages(offer.id);
        const last = msgs[msgs.length - 1] || null;
        return { ...offer, _lastMessage: last };
      })
    );
    setChats(withLast);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
        <MessageCircle className="text-[#8B4513]" size={20} /> Сообщения
      </h2>
      <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
        Здесь отображаются все чаты по предложениям: у ресторана — запросы от разных клиентов, у клиента — переписка с разными ресторанами.
      </p>

      {chats.length === 0 ? (
        <div className="text-gray-500 text-center py-12 sm:py-16 text-sm sm:text-base">
          Пока нет чатов. Откройте карточку предложения и нажмите «Чат», чтобы начать переписку.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden divide-y">
          {chats.map((offer) => (
            <button
              key={offer.id}
              onClick={() => setChatPost(offer)}
              className="w-full text-left p-3 sm:p-4 hover:bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs bg-gray-100 px-2 py-1 rounded">
                    {offer.category}
                  </span>
                  <StatusBadge status={offer.status} />
                </div>
                <p className="font-bold text-sm sm:text-base mb-1 break-words">{offer.title}</p>
                {offer.restaurant && (
                  <p className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1 mt-1 break-words">
                    <MapPin size={12} /> {offer.restaurant.address}
                  </p>
                )}
                {offer.restaurant && (
                  <p className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1 break-words">
                    <Users size={12} /> {offer.restaurant.name}
                  </p>
                )}
                {offer._lastMessage && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2 break-words">
                    <span className="font-semibold text-[10px] sm:text-xs mr-1">
                      {offer._lastMessage.sender === user.role ? 'Вы:' : 'Собеседник:'}
                    </span>
                    {offer._lastMessage.text}
                  </p>
                )}
              </div>
              {offer._lastMessage && (
                <span className="text-[10px] sm:text-[11px] text-gray-400 whitespace-nowrap self-start sm:self-auto">
                  {offer._lastMessage.time}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {chatPost && (
        <ChatModal
          post={chatPost}
          currentUser={user}
          onClose={() => setChatPost(null)}
        />
      )}
    </div>
  );
};



