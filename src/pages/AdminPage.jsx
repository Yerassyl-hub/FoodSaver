import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { api } from '../api/api';

export const AdminPage = () => {
  const [offers, setOffers] = useState([]);

  const load = () => api.getFoodOffers().then(all => 
    setOffers(all.filter(o => o.status === 'pending_approval'))
  );
  
  useEffect(() => {
    load();
    const t = setInterval(load, 1000);
    return () => clearInterval(t);
  }, []);

  const decide = async (id, status) => {
    await api.updateOfferStatus(id, status);
    load();
  };

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Модерация ({offers.length})</h2>
      {offers.length === 0 ? (
        <p className="text-gray-500 text-sm sm:text-base">Нет предложений на проверке.</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          {offers.map(offer => (
            <div 
              key={offer.id} 
              className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 hover:bg-gray-50 last:border-b-0 transition"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base break-words">
                  {offer.title} 
                  <span className="text-xs font-normal text-gray-500"> ({offer.category})</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-500 break-words">
                  {offer.restaurant?.name || 'Ресторан'} • {offer.oldPrice}₸ → {offer.newPrice}₸
                </p>
              </div>
              <div className="flex gap-2 self-start sm:self-auto">
                <button 
                  onClick={() => decide(offer.id, 'available')} 
                  className="bg-amber-100 text-amber-800 p-2 sm:p-2.5 rounded-lg hover:bg-amber-200 transition flex-shrink-0"
                  title="Одобрить"
                >
                  <CheckCircle size={18} className="sm:w-5 sm:h-5"/>
                </button>
                <button 
                  onClick={() => decide(offer.id, 'rejected')} 
                  className="bg-red-100 text-red-700 p-2 sm:p-2.5 rounded-lg hover:bg-red-200 transition flex-shrink-0"
                  title="Отклонить"
                >
                  <XCircle size={18} className="sm:w-5 sm:h-5"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


