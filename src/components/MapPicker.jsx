import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Search, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { BASE_COORDS } from '../utils/geolocation';

// Функция для получения адреса по координатам (обратный геокодинг)
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'FoodSaver App'
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

// Функция для получения координат по адресу (геокодинг)
const geocode = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'FoodSaver App'
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

export const MapPicker = ({ onLocationSelect, initialCoords = null, initialAddress = null }) => {
  const [coords, setCoords] = useState(initialCoords || BASE_COORDS);
  const [address, setAddress] = useState(initialAddress || '');
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [zoom, setZoom] = useState(5); // Начальный зум для показа всего Казахстана
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapKey, setMapKey] = useState(0); // Для принудительного обновления карты
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

  // Инициализация
  useEffect(() => {
    if (initialCoords) {
      setCoords(initialCoords);
      coordsRef.current = initialCoords;
    } else if (initialAddress) {
      setAddress(initialAddress);
      handleAddressSearch(initialAddress);
    } else {
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

  // Улучшенный расчет координат при клике
  const calculateCoordsFromClick = useCallback((x, y, rect) => {
    // Более точный расчет с учетом проекции Меркатора
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    // Используем более точную формулу для расчета смещения
    const metersPerPixel = (156543.03392 * Math.cos(coordsRef.current.lat * Math.PI / 180)) / Math.pow(2, zoom);
    const latOffset = -(deltaY * metersPerPixel) / 111320; // 111320 метров в градусе широты
    const lngOffset = (deltaX * metersPerPixel) / (111320 * Math.cos(coordsRef.current.lat * Math.PI / 180));
    
    return {
      lat: coordsRef.current.lat + latOffset,
      lng: coordsRef.current.lng + lngOffset
    };
  }, [zoom]);

  const handleMapClick = async (e) => {
    if (!isSelecting || !mapContainerRef.current) return;
    
    // Проверяем, не кликнули ли на кнопку или другой интерактивный элемент
    const target = e.target;
    const clickedButton = target.closest('button');
    const clickedInteractive = target.closest('[style*="z-index: 30"]') || target.closest('[class*="z-30"]');
    
    if (clickedButton || clickedInteractive) {
      return; // Игнорируем клики на кнопках
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

  const handleZoomIn = () => {
    if (zoom < 18) {
      setZoom(prev => prev + 1);
      setMapKey(prev => prev + 1);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 4) { // Минимальный зум для показа всей страны
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
      case 'up':
        deltaY = -rect.height * moveDistance;
        break;
      case 'down':
        deltaY = rect.height * moveDistance;
        break;
      case 'left':
        deltaX = -rect.width * moveDistance;
        break;
      case 'right':
        deltaX = rect.width * moveDistance;
        break;
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
    
    // Обновляем адрес асинхронно
    setIsLoadingAddress(true);
    reverseGeocode(newCoords.lat, newCoords.lng).then(addr => {
      setAddress(addr);
      setIsLoadingAddress(false);
      if (onLocationSelect) {
        onLocationSelect({ coords: newCoords, address: addr });
      }
    });
  }, [zoom, onLocationSelect]);

  // Обработка начала перетаскивания
  const handleMouseDown = (e) => {
    if (!isSelecting && e.button === 0) { // Только левая кнопка мыши
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
      e.preventDefault();
    }
  };

  // Обработка перетаскивания
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
      
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  }, [isDragging, isSelecting, dragStart, zoom]);

  // Обработка окончания перетаскивания
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

  const handleAddressSearch = async (searchAddress) => {
    if (!searchAddress || searchAddress.trim() === '') return;
    
    setIsSearching(true);
    const result = await geocode(searchAddress);
    
    if (result) {
      setCoords({ lat: result.lat, lng: result.lng });
      coordsRef.current = { lat: result.lat, lng: result.lng };
      setAddress(result.address);
      // Автоматически увеличиваем зум при поиске адреса для лучшей видимости
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

  // Функция для показа всего Казахстана
  const showAllKazakhstan = async () => {
    const kazakhstanCenter = BASE_COORDS;
    setCoords(kazakhstanCenter);
    coordsRef.current = kazakhstanCenter;
    setZoom(5); // Зум для показа всей страны
    setMapKey(prev => prev + 1);
    setIsLoadingAddress(true);
    const addr = await reverseGeocode(kazakhstanCenter.lat, kazakhstanCenter.lng);
    setAddress(addr);
    setIsLoadingAddress(false);
    if (onLocationSelect) {
      onLocationSelect({ coords: kazakhstanCenter, address: addr });
    }
  };

  // Вычисляем bbox для показа карты
  const getBbox = () => {
    // Для зума 5 показываем весь Казахстан (примерно 40-55°N, 46-88°E)
    if (zoom <= 5) {
      return '46.0,40.0,88.0,55.0'; // Границы всего Казахстана
    }
    // Для более высокого зума используем расчет относительно центра
    const latRange = 360 / Math.pow(2, zoom + 8);
    const lngRange = latRange / Math.cos(coords.lat * Math.PI / 180);
    return `${coords.lng - lngRange},${coords.lat - latRange},${coords.lng + lngRange},${coords.lat + latRange}`;
  };

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${getBbox()}&layer=mapnik&marker=${coords.lat},${coords.lng}`;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <label className="font-bold text-xs sm:text-sm block">Адрес и местоположение</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsSelecting(!isSelecting)}
            className={`text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              isSelecting
                ? 'bg-[#8B4513] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelecting ? 'Отменить' : 'Выбрать на карте'}
          </button>
          <button
            type="button"
            onClick={showAllKazakhstan}
            className="text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1 whitespace-nowrap"
            title="Показать весь Казахстан"
          >
            <RotateCcw size={12} />
            Весь Казахстан
          </button>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <Navigation size={12} />
            Мое место
          </button>
        </div>
      </div>
      
      {isSelecting && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs">
          <strong>Режим выбора:</strong> Кликните на карте ниже, чтобы установить адрес
        </div>
      )}

      {/* Поле ввода адреса */}
      <div>
        <label className="text-[10px] sm:text-xs text-gray-600 mb-1.5 block font-medium">Адрес</label>
        <form onSubmit={handleAddressSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 text-gray-400" size={14} />
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
              className="w-full border-2 border-gray-200 pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm focus:border-[#8B4513] focus:ring-1 focus:ring-[#8B4513] outline-none"
            />
            {isLoadingAddress && (
              <div className="absolute right-2.5 sm:right-3 top-2.5 sm:top-3">
                <div className="animate-spin rounded-full h-3.5 sm:h-4 w-3.5 sm:w-4 border-b-2 border-[#8B4513]"></div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddressSubmit}
            disabled={isSearching || isLoadingAddress}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#8B4513] text-white rounded-lg hover:bg-[#654321] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            {isSearching ? '...' : 'Найти'}
          </button>
        </form>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5">
          Введите адрес или выберите точку на карте. Используйте колесико мыши для зума.
        </p>
      </div>

      {/* Интерактивная карта */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        className={`w-full h-64 sm:h-80 rounded-lg overflow-hidden border-2 relative ${
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
        
        {/* Интерактивный маркер */}
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all ${
            isSelecting ? 'animate-pulse' : ''
          }`}
          style={{ pointerEvents: 'none' }}
        >
          <MapPin
            className="text-[#8B4513] drop-shadow-lg"
            size={28}
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
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Увеличить (или прокрутите колесико вверх)"
          >
            <ZoomIn size={20} className="text-gray-700" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 4}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Уменьшить (или прокрутите колесико вниз)"
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
          className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium text-gray-700 shadow-lg space-y-0.5 sm:space-y-1"
          style={{ zIndex: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div>Масштаб: {zoom}</div>
          <div className="text-[9px] sm:text-[10px] text-gray-500 font-mono">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </div>
        </div>

        {/* Overlay для кликов - должен быть поверх iframe, но под кнопками */}
        {isSelecting && (
          <div 
            className="absolute inset-0 bg-transparent cursor-crosshair"
            onClick={handleMapClick}
            onMouseDown={(e) => {
              // Предотвращаем перетаскивание в режиме выбора
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
        <div className="bg-[#8B4513]/10 border border-[#8B4513]/20 text-[#8B4513] px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="mt-0.5 shrink-0 sm:w-4 sm:h-4" />
            <div className="flex-1 min-w-0">
              <strong className="block mb-1">Выбранный адрес:</strong>
              <p className="font-medium break-words">{address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
