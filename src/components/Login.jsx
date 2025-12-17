import React from 'react';
import { Button } from './Button';
import { api } from '../api/api';

export const Login = ({ onLogin }) => {
  const submit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const pass = e.target.pass.value;
    try {
      const user = await api.login(email, pass);
      onLogin(user);
    } catch(err) { 
      alert(err.message); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF5E6] p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-xl w-full max-w-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-center text-[#8B4513] mb-4 sm:mb-6">Вход FoodSaver</h1>
        <form onSubmit={submit} className="space-y-4">
          <input 
            name="email" 
            placeholder="Email" 
            required 
            className="w-full border p-2.5 sm:p-3 rounded-lg text-sm sm:text-base"
            type="email"
          />
          <input 
            name="pass" 
            type="password" 
            placeholder="Пароль" 
            required 
            className="w-full border p-2.5 sm:p-3 rounded-lg text-sm sm:text-base"
          />
          <Button className="w-full justify-center text-sm sm:text-base py-2.5 sm:py-3">Войти</Button>
        </form>
        <div className="mt-4 text-[10px] sm:text-xs text-gray-400 space-y-1">
          <p>Admin: admin@test.com / admin</p>
          <p>Business: cafe@test.com / 123</p>
          <p>Client: client@test.com / 123</p>
        </div>
      </div>
    </div>
  );
};


