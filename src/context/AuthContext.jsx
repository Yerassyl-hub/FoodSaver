import React, { createContext, useState, useEffect } from 'react';
import { api } from '../api/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('foodsaver_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = async (email, pass) => {
    const userData = await api.login(email, pass);
    setUser(userData);
    localStorage.setItem('foodsaver_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('foodsaver_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
