import React from 'react';
import {
  Leaf, BarChart3, Plus, ShieldCheck, Settings, LogOut, MessageCircle
} from 'lucide-react';
import { DB_KEY } from '../utils/constants';

export const Layout = ({ children, page, setPage, user, logout }) => {
  const handleResetDB = () => {
    if (confirm('Точно сбросить локальные данные и перезагрузить?')) {
      localStorage.removeItem(DB_KEY);
      window.location.reload();
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Обзор', icon: BarChart3, show: true },
    { id: 'messages', label: 'Сообщения', icon: MessageCircle, show: true },
    { id: 'create', label: 'Создать оффер', icon: Plus, show: user.role === 'business' },
    { id: 'admin', label: 'Админка', icon: ShieldCheck, show: user.role === 'admin' },
    { id: 'settings', label: 'Настройки', icon: Settings, show: true },
  ].filter(item => item.show);

  return (
    <div
      className="min-h-screen px-6 py-10"
      style={{ background: 'linear-gradient(135deg, #F5E6D3 0%, #fdfdfd 60%, #ffffff 100%)' }}
    >
      <div className="mx-auto flex min-h-[85vh] max-w-6xl overflow-hidden rounded-[40px] bg-white/90 shadow-[0_40px_100px_rgba(139,69,19,0.15)]">
        <aside className="flex w-56 flex-col gap-6 border-r border-[rgba(139,69,19,0.15)] bg-[#FDF5E6] p-6">
          <div className="rounded-2xl bg-white/70 px-4 py-3 text-[#8B4513] shadow-sm">
            <div className="flex items-center gap-2 font-bold">
              <Leaf size={20} />
              <span>FoodSaver</span>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#8B4513] text-white shadow-lg'
                      : 'text-gray-600 hover:text-[#8B4513]'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="space-y-3">
            <button
              onClick={handleResetDB}
              className="w-full rounded-2xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-200"
            >
              Очистить данные
            </button>
            <button
              onClick={logout}
              className="w-full rounded-2xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Выйти ({user.name})
            </button>
          </div>
        </aside>

        <main className="flex-1 px-8 py-6">
          <div className="flex h-full flex-col gap-6 rounded-[34px] bg-white p-4 shadow-xl">
            <div className="flex-1 rounded-[34px] bg-white p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
