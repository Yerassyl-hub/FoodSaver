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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Модерация ({offers.length})</h2>
      {offers.length === 0 ? (
        <p className="text-gray-500">Нет предложений на проверке.</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          {offers.map(offer => (
            <div 
              key={offer.id} 
              className="p-4 border-b flex justify-between items-center hover:bg-gray-50 last:border-b-0"
            >
              <div>
                <p className="font-bold">
                  {offer.title} 
                  <span className="text-xs font-normal text-gray-500"> ({offer.category})</span>
                </p>
                <p className="text-xs text-gray-500">
                  {offer.restaurant?.name || 'Ресторан'} • {offer.oldPrice}₸ → {offer.newPrice}₸
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => decide(offer.id, 'available')} 
                  className="bg-amber-100 text-amber-800 p-2 rounded hover:bg-amber-200 transition"
                >
                  <CheckCircle size={20}/>
                </button>
                <button 
                  onClick={() => decide(offer.id, 'rejected')} 
                  className="bg-red-100 text-red-700 p-2 rounded hover:bg-red-200 transition"
                >
                  <XCircle size={20}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


