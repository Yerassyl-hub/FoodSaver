import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { api } from '../api/api';
import { CATEGORIES } from '../utils/constants';

export const CreatePostPage = ({ user, onBack }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [desc, setDesc] = useState('');
  const [title, setTitle] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const imageInputRef = useRef(null);
  const previewImageUrl = uploadedImageUrl || generatedImageUrl;

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get('title');
    const category = fd.get('category');
    const oldPrice = parseFloat(fd.get('oldPrice'));
    const newPrice = parseFloat(fd.get('newPrice'));
    const pickupTime = fd.get('pickupTime');
    const description = fd.get('description');

    const offerData = {
      title,
      category,
      oldPrice,
      newPrice,
      pickupTime: new Date(pickupTime).toISOString(),
      description,
      imageUrl: previewImageUrl || null
    };

    await api.createFoodOffer(offerData, user.id);
    onBack();
  };

  const handleAI = async () => {
    const title = document.getElementById('title').value;
    const cat = document.getElementById('cat').value;
    if (!title) {
      alert("Введите название блюда!");
      return;
    }
    
    setAiLoading(true);
    try {
      const generated = await api.generateAI(title, cat);
      setDesc(generated);
      if (generated.includes('Ошибка') || generated.includes('не найден')) {
        alert(generated);
      }
    } catch (error) {
      alert('Произошла ошибка при генерации описания. Попробуйте еще раз.');
      console.error('AI generation error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadedImageUrl('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearUploadedImage = () => {
    setUploadedImageUrl('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (uploadedImageUrl) {
      return;
    }

    if (!title || title.length < 2) {
      setGeneratedImageUrl('');
      return;
    }

    const timeOutId = setTimeout(() => {
      const url = api.getFoodImageUrl(title);
      if (!url) {
        setGeneratedImageUrl('');
        return;
      }
      
      const img = new Image();
      img.onload = () => setGeneratedImageUrl(url);
      img.onerror = () => setGeneratedImageUrl('');
      img.src = url;
    }, 1000);

    return () => clearTimeout(timeOutId);
  }, [title, uploadedImageUrl]);

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow mt-6">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-700"
      >
        <ArrowLeft size={16}/> Назад
      </button>
      <h2 className="text-2xl font-bold mb-6">Создать предложение</h2>
      
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="font-bold text-sm block mb-1">Название блюда</label>
          <input 
            id="title" 
            name="title" 
            required 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded" 
            placeholder="Например: Пицца Маргарита"
          />
          <div className="mt-3 space-y-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-600">Фото товара</label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="text-sm text-gray-500"
              />
              {uploadedImageUrl && (
                <button
                  type="button"
                  className="text-xs text-purple-600 hover:text-purple-800 underline self-start"
                  onClick={clearUploadedImage}
                >
                  Удалить загруженное фото
                </button>
              )}
            </div>

            {previewImageUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <ImageIcon size={16} className="text-[#8B4513]" />
                  <span>
                    {uploadedImageUrl
                      ? 'Изображение загружено вручную'
                      : 'Изображение сгенерировано автоматически'}
                  </span>
                </div>
                <img
                  src={previewImageUrl}
                  alt={title}
                  className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                  onError={(e) => {
                    e.target.onerror = null;
                    if (uploadedImageUrl) {
                      e.target.src = `https://via.placeholder.com/800x600/F5E6D3/8B4513?text=${encodeURIComponent(title)}`;
                    } else {
                      setGeneratedImageUrl('');
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label className="font-bold text-sm block mb-1">Категория</label>
          <select id="cat" name="category" className="w-full border p-2 rounded">
            {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-sm block mb-1">Обычная цена (₸)</label>
            <input 
              name="oldPrice" 
              type="number" 
              step="0.01"
              required 
              className="w-full border p-2 rounded" 
              placeholder="2500"
            />
          </div>
          <div>
            <label className="font-bold text-sm block mb-1">Цена со скидкой (₸)</label>
            <input 
              name="newPrice" 
              type="number" 
              step="0.01"
              required 
              className="w-full border p-2 rounded" 
              placeholder="1000"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-sm block mb-1">Забрать до</label>
          <input 
            name="pickupTime" 
            type="datetime-local" 
            required 
            min={getMinDateTime()}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="font-bold text-sm">Описание</label>
            <button 
              type="button" 
              onClick={handleAI} 
              className="text-purple-600 text-xs flex items-center gap-1 font-bold hover:text-purple-700"
            >
              {aiLoading ? (
                <Loader2 className="animate-spin" size={12}/>
              ) : (
                <Sparkles size={12}/>
              )} Сгенерировать AI
            </button>
          </div>
          <textarea 
            name="description" 
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
            className="w-full border p-2 rounded h-24"
            required
          />
        </div>

        <Button className="w-full justify-center">Опубликовать</Button>
      </form>
    </div>
  );
};

