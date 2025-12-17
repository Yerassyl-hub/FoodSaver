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
    <div className="h-screen flex items-center justify-center bg-[#FDF5E6]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-80">
        <h1 className="text-2xl font-bold text-center text-[#8B4513] mb-6">Вход FoodSaver</h1>
        <form onSubmit={submit} className="space-y-4">
          <input 
            name="email" 
            placeholder="Email" 
            required 
            className="w-full border p-2 rounded"
            type="email"
          />
          <input 
            name="pass" 
            type="password" 
            placeholder="Пароль" 
            required 
            className="w-full border p-2 rounded"
          />
          <Button className="w-full justify-center">Войти</Button>
        </form>
        <div className="mt-4 text-xs text-gray-400">
          <p>Admin: admin@test.com / admin</p>
          <p>Business: cafe@test.com / 123</p>
          <p>Client: client@test.com / 123</p>
        </div>
      </div>
    </div>
  );
};


