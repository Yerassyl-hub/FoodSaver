import React, { useState } from 'react';
import { Button } from '../components/Button';
import { DEMO_AI_KEY } from '../utils/constants';

export const SettingsPage = () => {
  const [key, setKey] = useState(localStorage.getItem('ai_key') || DEMO_AI_KEY);
  
  const save = () => {
    localStorage.setItem('ai_key', key);
    alert('Сохранено!');
  };
  
  return (
    <div className="w-full max-w-lg">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Настройки</h2>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm sm:text-base font-bold mb-2">
            Google Gemini API Key (для ИИ)
          </label>
          <input 
            type="password" 
            value={key} 
            onChange={e => setKey(e.target.value)} 
            className="w-full border p-2.5 sm:p-3 rounded-lg text-sm sm:text-base mb-4"
            placeholder="Введите API ключ"
          />
        </div>
        <Button onClick={save} className="w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-3">Сохранить ключ</Button>
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-gray-500">
            Получите ключ на{' '}
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#8B4513] hover:underline break-all"
            >
              Google AI Studio
            </a>
            {' '}или{' '}
            <a 
              href="https://makersuite.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#8B4513] hover:underline break-all"
            >
              MakerSuite
            </a>
          </p>
          <p className="text-xs sm:text-sm text-amber-600">
            ⚠️ Если API ключ не работает, генератор будет использовать простые шаблоны описаний.
          </p>
        </div>
      </div>
    </div>
  );
};


