# 🗺️ Полная логика карты MapPicker - Руководство для реализации

Это полное руководство по реализации интерактивной карты с выбором местоположения, как в FoodSaver.

## 📋 Содержание

1. [Структура файлов](#структура-файлов)
2. [Утилиты геолокации](#утилиты-геолокации)
3. [Компонент MapPicker](#компонент-mappicker)
4. [Использование в форме](#использование-в-форме)
5. [API для геокодинга](#api-для-геокодинга)
6. [Важные детали](#важные-детали)

---

## 📁 Структура файлов

Создайте следующие файлы:

```
src/
  ├── utils/
  │   └── geolocation.js          # Утилиты для работы с координатами
  ├── components/
  │   └── MapPicker.jsx           # Основной компонент карты
  └── pages/
      └── CreatePostPage.jsx      # Пример использования
```

---

## 🔧 Утилиты геолокации

**Файл: `src/utils/geolocation.js`**

```javascript
// Координаты центра вашей страны/региона (измените под свою страну)
export const BASE_COORDS = { lat: 48.0, lng: 66.0 }; // Для Казахстана

// Функция перевода градусов в радианы
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Формула Haversine: Считает расстояние между двумя точками на карте (в км)
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Радиус Земли в км
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Дистанция в км
  
  return parseFloat(distance.toFixed(1)); // Округляем до 1 знака после запятой
}

// Получение геолокации пользователя (возвращает Promise)
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Геолокация недоступна, используем координаты по умолчанию", error);
          resolve(BASE_COORDS);
        }
      );
    } else {
      resolve(BASE_COORDS);
    }
  });
};
```

---

## 🗺️ Компонент MapPicker

**Файл: `src/components/MapPicker.jsx`**

```javascript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Search, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { BASE_COORDS } from '../utils/geolocation';

// ============================================
// ФУНКЦИИ ГЕОКОДИНГА (OpenStreetMap Nominatim)
// ============================================

// Получение адреса по координатам (обратный геокодинг)
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'YourAppName' // Замените на название вашего приложения
        }
      }
    );
    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      const parts = [];
      if (addr.road) parts.push(addr.road);
      if (addr.house_number) parts.push(addr.house_number);
      if (parts.length === 0 && addr.house) parts.push(addr.house);
      
      const city = addr.city || addr.town || addr.village || addr.municipality || '';
      const region = addr.state || addr.region || '';
      
      let address = parts.join(', ');
      if (city) address += (address ? ', ' : '') + city;
      if (region && region !== city) address += (address ? ', ' : '') + region;
      
      return address || data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Geocoding error:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

// Получение координат по адресу (геокодинг)
const geocode = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'YourAppName' // Замените на название вашего приложения
        }
      }
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

export const MapPicker = ({ onLocationSelect, initialCoords = null, initialAddress = null }) => {
  // Состояния
  const [coords, setCoords] = useState(initialCoords || BASE_COORDS);
  const [address, setAddress] = useState(initialAddress || '');
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [zoom, setZoom] = useState(5); // Начальный зум (5 = вся страна, 13 = город, 18 = улица)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapKey, setMapKey] = useState(0); // Для принудительного обновления iframe
  
  // Refs
  const mapContainerRef = useRef(null);
  const addressInputRef = useRef(null);
  const coordsRef = useRef(coords);

  // Синхронизируем ref с состоянием
  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  // Загружаем адрес при изменении координат
  useEffect(() => {
    if (coords && (!initialAddress || address === '')) {
      setIsLoadingAddress(true);
      reverseGeocode(coords.lat, coords.lng).then(addr => {
        setAddress(addr);
        setIsLoadingAddress(false);
      });
    }
  }, [coords]);

  // Инициализация при монтировании
  useEffect(() => {
    if (initialCoords) {
      setCoords(initialCoords);
      coordsRef.current = initialCoords;
    } else if (initialAddress) {
      setAddress(initialAddress);
      handleAddressSearch(initialAddress);
    } else {
      // Пытаемся получить текущее местоположение
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const newCoords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCoords(newCoords);
            coordsRef.current = newCoords;
            const addr = await reverseGeocode(newCoords.lat, newCoords.lng);
            setAddress(addr);
            if (onLocationSelect) {
              onLocationSelect({ coords: newCoords, address: addr });
            }
          },
          async () => {
            const addr = await reverseGeocode(BASE_COORDS.lat, BASE_COORDS.lng);
            setAddress(addr);
            if (onLocationSelect) {
              onLocationSelect({ coords: BASE_COORDS, address: addr });
            }
          }
        );
      } else {
        reverseGeocode(BASE_COORDS.lat, BASE_COORDS.lng).then(addr => {
          setAddress(addr);
        });
        if (onLocationSelect) {
          onLocationSelect({ coords: BASE_COORDS, address: '' });
        }
      }
    }
  }, []);

  // ============================================
  // РАСЧЕТ КООРДИНАТ ПРИ КЛИКЕ
  // ============================================
  
  // Улучшенный расчет координат при клике (с учетом проекции Меркатора)
  const calculateCoordsFromClick = useCallback((x, y, rect) => {
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    // Формула для расчета метров на пиксель в зависимости от зума
    const metersPerPixel = (156543.03392 * Math.cos(coordsRef.current.lat * Math.PI / 180)) / Math.pow(2, zoom);
    const latOffset = -(deltaY * metersPerPixel) / 111320; // 111320 метров в градусе широты
    const lngOffset = (deltaX * metersPerPixel) / (111320 * Math.cos(coordsRef.current.lat * Math.PI / 180));
    
    return {
      lat: coordsRef.current.lat + latOffset,
      lng: coordsRef.current.lng + lngOffset
    };
  }, [zoom]);

  // ============================================
  // ОБРАБОТЧИКИ СОБЫТИЙ
  // ============================================

  // Клик на карте для выбора точки
  const handleMapClick = async (e) => {
    if (!isSelecting || !mapContainerRef.current) return;
    
    // Проверяем, не кликнули ли на кнопку
    const target = e.target;
    const clickedButton = target.closest('button');
    const clickedInteractive = target.closest('[style*="z-index: 30"]');
    
    if (clickedButton || clickedInteractive) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newCoords = calculateCoordsFromClick(x, y, rect);
    
    setCoords(newCoords);
    coordsRef.current = newCoords;
    setIsLoadingAddress(true);
    const addr = await reverseGeocode(newCoords.lat, newCoords.lng);
    setAddress(addr);
    setIsLoadingAddress(false);
    
    if (onLocationSelect) {
      onLocationSelect({ coords: newCoords, address: addr });
    }
    setIsSelecting(false);
  };

  // Зум
  const handleZoomIn = () => {
    if (zoom < 18) {
      setZoom(prev => prev + 1);
      setMapKey(prev => prev + 1);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 4) {
      setZoom(prev => prev - 1);
      setMapKey(prev => prev + 1);
    }
  };

  // Зум колесиком мыши
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  }, [zoom]);

  // Навигация стрелками
  const moveMap = useCallback((direction) => {
    if (!mapContainerRef.current) return;
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const moveDistance = 0.3; // 30% от размера карты
    
    let deltaX = 0;
    let deltaY = 0;
    
    switch(direction) {
      case 'up': deltaY = -rect.height * moveDistance; break;
      case 'down': deltaY = rect.height * moveDistance; break;
      case 'left': deltaX = -rect.width * moveDistance; break;
      case 'right': deltaX = rect.width * moveDistance; break;
    }
    
    const metersPerPixel = (156543.03392 * Math.cos(coordsRef.current.lat * Math.PI / 180)) / Math.pow(2, zoom);
    const latOffset = -(deltaY * metersPerPixel) / 111320;
    const lngOffset = (deltaX * metersPerPixel) / (111320 * Math.cos(coordsRef.current.lat * Math.PI / 180));
    
    const newCoords = {
      lat: coordsRef.current.lat + latOffset,
      lng: coordsRef.current.lng + lngOffset
    };
    
    setCoords(newCoords);
    coordsRef.current = newCoords;
    setMapKey(prev => prev + 1);
    
    setIsLoadingAddress(true);
    reverseGeocode(newCoords.lat, newCoords.lng).then(addr => {
      setAddress(addr);
      setIsLoadingAddress(false);
      if (onLocationSelect) {
        onLocationSelect({ coords: newCoords, address: addr });
      }
    });
  }, [zoom, onLocationSelect]);

  // Перетаскивание карты
  const handleMouseDown = (e) => {
    if (!isSelecting && e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging && !isSelecting && mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const metersPerPixel = (156543.03392 * Math.cos(coordsRef.current.lat * Math.PI / 180)) / Math.pow(2, zoom);
      const latOffset = -(deltaY * metersPerPixel) / 111320;
      const lngOffset = (deltaX * metersPerPixel) / (111320 * Math.cos(coordsRef.current.lat * Math.PI / 180));
      
      const newCoords = {
        lat: coordsRef.current.lat + latOffset,
        lng: coordsRef.current.lng + lngOffset
      };
      
      setCoords(newCoords);
      coordsRef.current = newCoords;
      setMapKey(prev => prev + 1);
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isSelecting, dragStart, zoom]);

  const handleMouseUp = useCallback(async () => {
    if (isDragging) {
      setIsDragging(false);
      setIsLoadingAddress(true);
      const addr = await reverseGeocode(coordsRef.current.lat, coordsRef.current.lng);
      setAddress(addr);
      setIsLoadingAddress(false);
      if (onLocationSelect) {
        onLocationSelect({ coords: coordsRef.current, address: addr });
      }
    }
  }, [isDragging, onLocationSelect]);

  // Обработка событий мыши
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Обработка колесика мыши
  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (mapContainer) {
      mapContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        mapContainer.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);

  // Поиск адреса
  const handleAddressSearch = async (searchAddress) => {
    if (!searchAddress || searchAddress.trim() === '') return;
    
    setIsSearching(true);
    const result = await geocode(searchAddress);
    
    if (result) {
      setCoords({ lat: result.lat, lng: result.lng });
      coordsRef.current = { lat: result.lat, lng: result.lng };
      setAddress(result.address);
      if (zoom < 13) {
        setZoom(13);
      }
      setMapKey(prev => prev + 1);
      if (onLocationSelect) {
        onLocationSelect({ coords: { lat: result.lat, lng: result.lng }, address: result.address });
      }
    } else {
      alert('Адрес не найден. Попробуйте ввести более точный адрес.');
    }
    setIsSearching(false);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const searchAddress = addressInputRef.current?.value || address;
    if (searchAddress) {
      await handleAddressSearch(searchAddress);
    }
  };

  // Использование текущего местоположения
  const useCurrentLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCoords(newCoords);
          coordsRef.current = newCoords;
          setMapKey(prev => prev + 1);
          setIsLoadingAddress(true);
          const addr = await reverseGeocode(newCoords.lat, newCoords.lng);
          setAddress(addr);
          setIsLoadingAddress(false);
          if (onLocationSelect) {
            onLocationSelect({ coords: newCoords, address: addr });
          }
        },
        () => alert('Не удалось получить ваше местоположение')
      );
    }
  };

  // Показать всю страну
  const showAllCountry = async () => {
    const countryCenter = BASE_COORDS;
    setCoords(countryCenter);
    coordsRef.current = countryCenter;
    setZoom(5);
    setMapKey(prev => prev + 1);
    setIsLoadingAddress(true);
    const addr = await reverseGeocode(countryCenter.lat, countryCenter.lng);
    setAddress(addr);
    setIsLoadingAddress(false);
    if (onLocationSelect) {
      onLocationSelect({ coords: countryCenter, address: addr });
    }
  };

  // ============================================
  // ГЕНЕРАЦИЯ URL ДЛЯ КАРТЫ
  // ============================================

  // Вычисляем bbox (границы карты) для OpenStreetMap
  const getBbox = () => {
    // Для зума 5 показываем всю страну (измените под свою страну)
    if (zoom <= 5) {
      return '46.0,40.0,88.0,55.0'; // Границы Казахстана (измените!)
    }
    // Для более высокого зума используем расчет относительно центра
    const latRange = 360 / Math.pow(2, zoom + 8);
    const lngRange = latRange / Math.cos(coords.lat * Math.PI / 180);
    return `${coords.lng - lngRange},${coords.lat - latRange},${coords.lng + lngRange},${coords.lat + latRange}`;
  };

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${getBbox()}&layer=mapnik&marker=${coords.lat},${coords.lng}`;

  // ============================================
  // РЕНДЕР
  // ============================================

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="font-bold text-sm block">Адрес и местоположение</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsSelecting(!isSelecting)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isSelecting
                ? 'bg-[#8B4513] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelecting ? 'Отменить' : 'Выбрать на карте'}
          </button>
          <button
            type="button"
            onClick={showAllCountry}
            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1"
          >
            <RotateCcw size={12} />
            Вся страна
          </button>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1"
          >
            <Navigation size={12} />
            Мое место
          </button>
        </div>
      </div>
      
      {isSelecting && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-xs">
          <strong>Режим выбора:</strong> Кликните на карте ниже, чтобы установить адрес
        </div>
      )}

      {/* Поле ввода адреса */}
      <div>
        <label className="text-xs text-gray-600 mb-1.5 block font-medium">Адрес</label>
        <form onSubmit={handleAddressSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              ref={addressInputRef}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => {
                if (address && address.trim() !== '') {
                  handleAddressSearch(address);
                }
              }}
              placeholder="Введите адрес (например: Алматы, Абая 10)"
              className="w-full border-2 border-gray-200 pl-10 pr-3 py-2.5 rounded-lg text-sm focus:border-[#8B4513] focus:ring-1 focus:ring-[#8B4513] outline-none"
            />
            {isLoadingAddress && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B4513]"></div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddressSubmit}
            disabled={isSearching || isLoadingAddress}
            className="px-4 py-2.5 bg-[#8B4513] text-white rounded-lg hover:bg-[#654321] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isSearching ? '...' : 'Найти'}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-1.5">
          Введите адрес или выберите точку на карте. Используйте колесико мыши для зума.
        </p>
      </div>

      {/* Интерактивная карта */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        className={`w-full h-80 rounded-lg overflow-hidden border-2 relative ${
          isSelecting 
            ? 'border-[#8B4513] cursor-crosshair' 
            : isDragging
            ? 'border-[#8B4513] cursor-grabbing'
            : 'border-gray-200 cursor-grab'
        }`}
      >
        <iframe
          key={`${mapKey}-${zoom}`}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={mapUrl}
          className={isSelecting ? 'pointer-events-none opacity-50' : 'pointer-events-none'}
          title="Карта выбора местоположения"
        ></iframe>
        
        {/* Интерактивный маркер в центре */}
        <div 
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all ${
            isSelecting ? 'animate-pulse' : ''
          }`}
          style={{ pointerEvents: 'none' }}
        >
          <MapPin 
            className="text-[#8B4513] drop-shadow-lg" 
            size={36} 
            fill="currentColor" 
          />
        </div>

        {/* Кнопки управления зумом */}
        <div 
          className="absolute top-3 right-3 flex flex-col gap-2"
          style={{ zIndex: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 18}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-lg transition-colors disabled:opacity-50"
            title="Увеличить"
          >
            <ZoomIn size={20} className="text-gray-700" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 4}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-lg transition-colors disabled:opacity-50"
            title="Уменьшить"
          >
            <ZoomOut size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Кнопки навигации */}
        <div 
          className="absolute top-3 left-3 flex flex-col gap-1"
          style={{ zIndex: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => moveMap('up')}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-1.5 shadow-lg transition-colors"
            title="Вверх"
          >
            <ArrowUp size={16} className="text-gray-700" />
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => moveMap('left')}
              className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-1.5 shadow-lg transition-colors"
              title="Влево"
            >
              <ArrowLeft size={16} className="text-gray-700" />
            </button>
            <button
              type="button"
              onClick={() => moveMap('right')}
              className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-1.5 shadow-lg transition-colors"
              title="Вправо"
            >
              <ArrowRight size={16} className="text-gray-700" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => moveMap('down')}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-1.5 shadow-lg transition-colors"
            title="Вниз"
          >
            <ArrowDown size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Индикатор уровня зума и координат */}
        <div 
          className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 shadow-lg space-y-1"
          style={{ zIndex: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div>Масштаб: {zoom}</div>
          <div className="text-[10px] text-gray-500 font-mono">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </div>
        </div>

        {/* Overlay для кликов в режиме выбора */}
        {isSelecting && (
          <div 
            className="absolute inset-0 bg-transparent cursor-crosshair"
            onClick={handleMapClick}
            onMouseDown={(e) => {
              if (isSelecting) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            style={{ 
              pointerEvents: 'auto',
              zIndex: 25 // Между iframe (z-0) и кнопками (z-30)
            }}
          ></div>
        )}
      </div>

      {/* Информация о выбранном адресе */}
      {address && (
        <div className="bg-[#8B4513]/10 border border-[#8B4513]/20 text-[#8B4513] px-4 py-3 rounded-lg text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <strong className="block mb-1">Выбранный адрес:</strong>
              <p className="font-medium">{address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 📝 Использование в форме

**Файл: `src/pages/CreatePostPage.jsx` (пример)**

```javascript
import { MapPicker } from '../components/MapPicker';

export const CreatePostPage = ({ user, onBack }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    const offerData = {
      title: fd.get('title'),
      // ... другие поля
      coords: selectedLocation?.coords || null,
      address: selectedLocation?.address || null
    };

    await api.createFoodOffer(offerData, user.id);
    onBack();
  };

  return (
    <form onSubmit={submit}>
      {/* Другие поля формы */}
      
      <MapPicker 
        onLocationSelect={(location) => {
          setSelectedLocation(location);
        }}
      />
      
      <button type="submit">Создать</button>
    </form>
  );
};
```

---

## 🔑 Важные детали

### 1. **OpenStreetMap Nominatim API**
- Бесплатный, но требует указания `User-Agent` в заголовках
- Лимит: 1 запрос в секунду (для продакшена нужен собственный сервер)
- Замените `'YourAppName'` на название вашего приложения

### 2. **BASE_COORDS**
- Измените координаты центра под свою страну/регион
- Формат: `{ lat: широта, lng: долгота }`

### 3. **Границы страны в getBbox()**
- Для зума 5 измените границы под свою страну
- Формат: `'minLng,minLat,maxLng,maxLat'`

### 4. **Зависимости**
Установите:
```bash
npm install lucide-react
```

### 5. **Формулы расчета координат**
- `156543.03392` - константа для проекции Меркатора
- `111320` - метров в одном градусе широты
- Формула учитывает искажение на разных широтах

---

## ✅ Чеклист для реализации

- [ ] Создать `src/utils/geolocation.js`
- [ ] Создать `src/components/MapPicker.jsx`
- [ ] Установить `lucide-react`
- [ ] Изменить `BASE_COORDS` под свою страну
- [ ] Изменить границы в `getBbox()` под свою страну
- [ ] Заменить `'YourAppName'` в заголовках API
- [ ] Интегрировать в форму через `onLocationSelect`
- [ ] Протестировать все функции (клик, перетаскивание, зум, поиск)

---

**Готово! Теперь у вас есть полная логика карты! 🗺️**

