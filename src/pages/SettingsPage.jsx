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
    <div className="p-6 max-w-lg">
      <h2 className="text-2xl font-bold mb-4">Настройки</h2>
      <label className="block text-sm font-bold mb-2">
        Google Gemini API Key (для ИИ)
      </label>
      <input 
        type="password" 
        value={key} 
        onChange={e => setKey(e.target.value)} 
        className="w-full border p-2 rounded mb-4"
        placeholder="Введите API ключ"
      />
      <Button onClick={save}>Сохранить ключ</Button>
      <p className="text-xs text-gray-500 mt-2">
        Получите ключ на{' '}
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#8B4513] hover:underline"
        >
          Google AI Studio
        </a>
        {' '}или{' '}
        <a 
          href="https://makersuite.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#8B4513] hover:underline"
        >
          MakerSuite
        </a>
      </p>
      <p className="text-xs text-amber-600 mt-2">
        ⚠️ Если API ключ не работает, генератор будет использовать простые шаблоны описаний.
      </p>
    </div>
  );
};


