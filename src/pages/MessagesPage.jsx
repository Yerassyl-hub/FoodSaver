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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <MessageCircle className="text-[#8B4513]" /> Сообщения
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Здесь отображаются все чаты по предложениям: у ресторана — запросы от разных клиентов, у клиента — переписка с разными ресторанами.
      </p>

      {chats.length === 0 ? (
        <div className="text-gray-500 text-center py-16">
          Пока нет чатов. Откройте карточку предложения и нажмите «Чат», чтобы начать переписку.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden divide-y">
          {chats.map((offer) => (
            <button
              key={offer.id}
              onClick={() => setChatPost(offer)}
              className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-start gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {offer.category}
                  </span>
                  <StatusBadge status={offer.status} />
                </div>
                <p className="font-bold">{offer.title}</p>
                {offer.restaurant && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {offer.restaurant.address}
                  </p>
                )}
                {offer.restaurant && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Users size={12} /> {offer.restaurant.name}
                  </p>
                )}
                {offer._lastMessage && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                    <span className="font-semibold text-xs mr-1">
                      {offer._lastMessage.sender === user.role ? 'Вы:' : 'Собеседник:'}
                    </span>
                    {offer._lastMessage.text}
                  </p>
                )}
              </div>
              {offer._lastMessage && (
                <span className="text-[11px] text-gray-400 whitespace-nowrap mt-1">
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



