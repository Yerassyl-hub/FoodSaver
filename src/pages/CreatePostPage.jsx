import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { MapPicker } from '../components/MapPicker';
import { api } from '../api/api';
import { CATEGORIES } from '../utils/constants';

export const CreatePostPage = ({ user, onBack }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [desc, setDesc] = useState('');
  const [title, setTitle] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
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
      imageUrl: previewImageUrl || null,
      coords: selectedLocation?.coords || null,
      address: selectedLocation?.address || null
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
    <div className="max-w-2xl mx-auto w-full">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-gray-500 mb-4 sm:mb-6 hover:text-gray-700 text-sm sm:text-base"
      >
        <ArrowLeft size={16}/> Назад
      </button>
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Создать предложение</h2>
      
      <form onSubmit={submit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="font-bold text-sm block mb-1.5 sm:mb-2">Название блюда</label>
          <input 
            id="title" 
            name="title" 
            required 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2.5 sm:p-3 rounded-lg text-sm sm:text-base" 
            placeholder="Например: Пицца Маргарита"
          />
          <div className="mt-3 space-y-2 sm:space-y-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs sm:text-sm font-bold text-gray-600">Фото товара</label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="text-xs sm:text-sm text-gray-500"
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
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
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
                  className="w-full h-40 sm:h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
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
          <label className="font-bold text-sm block mb-1.5 sm:mb-2">Категория</label>
          <select id="cat" name="category" className="w-full border p-2.5 sm:p-3 rounded-lg text-sm sm:text-base">
            {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-sm block mb-1.5 sm:mb-2">Обычная цена (₸)</label>
            <input 
              name="oldPrice" 
              type="number" 
              step="0.01"
              required 
              className="w-full border p-2.5 sm:p-3 rounded-lg text-sm sm:text-base" 
              placeholder="2500"
            />
          </div>
          <div>
            <label className="font-bold text-sm block mb-1.5 sm:mb-2">Цена со скидкой (₸)</label>
            <input 
              name="newPrice" 
              type="number" 
              step="0.01"
              required 
              className="w-full border p-2.5 sm:p-3 rounded-lg text-sm sm:text-base" 
              placeholder="1000"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-sm block mb-1.5 sm:mb-2">Забрать до</label>
          <input 
            name="pickupTime" 
            type="datetime-local" 
            required 
            min={getMinDateTime()}
            className="w-full border p-2.5 sm:p-3 rounded-lg text-sm sm:text-base"
          />
        </div>

        <div>
          <MapPicker 
            onLocationSelect={setSelectedLocation}
            initialCoords={selectedLocation?.coords}
            initialAddress={selectedLocation?.address}
          />
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-1.5 sm:mb-2">
            <label className="font-bold text-sm">Описание</label>
            <button 
              type="button" 
              onClick={handleAI} 
              className="text-purple-600 text-xs flex items-center gap-1 font-bold hover:text-purple-700 self-start sm:self-auto"
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
            className="w-full border p-2.5 sm:p-3 rounded-lg h-24 sm:h-32 text-sm sm:text-base"
            required
          />
        </div>

        <Button className="w-full justify-center text-sm sm:text-base py-2.5 sm:py-3">Опубликовать</Button>
      </form>
    </div>
  );
};

