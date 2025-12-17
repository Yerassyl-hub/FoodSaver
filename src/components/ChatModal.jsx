import React, { useState, useEffect } from 'react';
import { XCircle, Send } from 'lucide-react';
import { api } from '../api/api';

export const ChatModal = ({ post, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const load = () => api.getMessages(post.id).then(setMessages);
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [post.id]);

  const send = async (e) => {
    e.preventDefault();
    if (!text) return;
    await api.sendMessage(post.id, text, currentUser.role);
    setMessages(await api.getMessages(post.id));
    setText('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white w-full max-w-md h-[90vh] sm:h-[500px] max-h-[600px] rounded-lg sm:rounded-xl flex flex-col shadow-2xl">
        <div className="p-3 sm:p-4 border-b flex justify-between items-center bg-[#8B4513] text-white rounded-t-lg sm:rounded-t-xl">
          <h3 className="font-bold text-sm sm:text-base break-words pr-2">{post.title}</h3>
          <button onClick={onClose} className="hover:opacity-80 flex-shrink-0">
            <XCircle size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 bg-gray-50">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-xs sm:text-sm">Напишите первое сообщение...</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === currentUser.role ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-2 sm:p-3 rounded-lg max-w-[85%] sm:max-w-[80%] text-xs sm:text-sm break-words ${m.sender === currentUser.role ? 'bg-amber-100' : 'bg-white border'}`}>
                {m.text} 
                <span className="text-[9px] sm:text-[10px] text-gray-400 block text-right mt-1">{m.time}</span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={send} className="p-2 sm:p-3 border-t flex gap-2">
          <input 
            className="flex-1 border p-2 sm:p-2.5 rounded-full outline-none text-xs sm:text-sm" 
            value={text} 
            onChange={e => setText(e.target.value)} 
            placeholder="Сообщение..." 
          />
          <button 
            type="submit"
            className="bg-[#8B4513] text-white p-2 sm:p-2.5 rounded-full hover:bg-[#654321] transition flex-shrink-0"
          >
            <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </form>
      </div>
    </div>
  );
};
