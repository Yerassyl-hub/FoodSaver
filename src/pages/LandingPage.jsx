import React, { useState } from 'react';
import { Recycle, Package } from 'lucide-react';
import { api } from '../api/api';

const LandingPage = ({ onNavigate, onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    try {
      const user = await api.login(email, password);
      if (onLogin) {
        onLogin(user);
      } else if (onNavigate) {
        onNavigate('/dashboard', { user });
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err.message || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Left Side - Description & Image */}
      <div className="hidden lg:flex lg:w-1/2 text-white p-8 flex-col justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #8B4513 100%)' }}>
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl" style={{ backgroundColor: '#654321' }}></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl" style={{ backgroundColor: '#A0522D' }}></div>
        </div>
        
        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/25 p-3 rounded-xl backdrop-blur-md shadow-lg border border-white/20">
              <Recycle className="text-white" size={28} />
            </div>
            <div>
              <span className="text-3xl font-black tracking-tight block">FoodSaver</span>
              <span className="text-xs text-white/80 font-medium">Экологичная платформа</span>
            </div>
          </div>
          
          {/* Heading */}
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            Перераспределяем<br />
            <span className="text-white/90">ресурсы</span>
          </h1>
          
          {/* Description */}
          <p className="text-base leading-relaxed mb-6 text-white/90 font-light">
            Инновационная платформа для передачи излишков продуктов, вещей и материалов. 
            Соединяем бизнес, благотворительные фонды и перерабатывающие предприятия.
          </p>

          {/* Image with fallback */}
          <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
            {!imageError ? (
              <img 
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop" 
                alt="Уютное кафе" 
                className="w-full h-48 object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                <div className="text-center">
                  <Package className="text-white/60 mx-auto mb-2" size={48} />
                  <p className="text-white/60 text-xs">Изображение</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
            <div className="p-2 rounded-lg shadow-lg" style={{ backgroundColor: '#8B4513' }}>
              <Recycle className="text-white" size={24} />
            </div>
            <div>
              <span className="text-xl font-black text-gray-900 block">FoodSaver</span>
              <span className="text-xs text-gray-500">Экологичная платформа</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Добро пожаловать</h2>
              <p className="text-gray-500 text-sm">Войдите в систему управления ресурсами</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 py-2 rounded-lg text-xs">
                  <strong>Ошибка:</strong> {error}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 ml-1 tracking-wider">
                  Email адрес
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  className="w-full border-2 border-gray-200 bg-gray-50 p-3 rounded-lg outline-none transition-all duration-200 focus:bg-white focus:border-[#8B4513] focus:shadow-md focus:shadow-[#8B4513]/10 text-sm"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 ml-1 tracking-wider">
                  Пароль
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full border-2 border-gray-200 bg-gray-50 p-3 rounded-lg outline-none transition-all duration-200 focus:bg-white focus:border-[#8B4513] focus:shadow-md focus:shadow-[#8B4513]/10 text-sm"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white px-6 py-3 rounded-lg font-bold text-base shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ 
                  backgroundColor: '#8B4513',
                  boxShadow: '0 10px 25px -5px rgba(139, 69, 19, 0.4)'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#654321')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#8B4513')}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Вход...
                  </span>
                ) : (
                  'Войти в систему'
                )}
              </button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase text-center mb-3 tracking-wider">
                Тестовые аккаунты
              </p>
              <div className="space-y-1.5">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-2.5 rounded-lg flex justify-between items-center border border-gray-200 hover:border-[#8B4513]/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <span className="text-xs font-semibold text-gray-700">Администратор</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-600 bg-white px-1.5 py-0.5 rounded border">admin@test.com / admin</span>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-2.5 rounded-lg flex justify-between items-center border border-gray-200 hover:border-[#8B4513]/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-semibold text-gray-700">Донор</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-600 bg-white px-1.5 py-0.5 rounded border">cafe@test.com / 123</span>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-2.5 rounded-lg flex justify-between items-center border border-gray-200 hover:border-[#8B4513]/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-xs font-semibold text-gray-700">Клиент</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-600 bg-white px-1.5 py-0.5 rounded border">client@test.com / 123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
