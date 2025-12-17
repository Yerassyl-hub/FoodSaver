import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { MessagesPage } from './pages/MessagesPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    const saved = localStorage.getItem('foodsaver_user');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setPage(userData.role === 'admin' ? 'admin' : 'dashboard');
    }
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('foodsaver_user', JSON.stringify(u));
    setPage(u.role === 'admin' ? 'admin' : 'dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('foodsaver_user');
    setPage('dashboard');
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <Layout page={page} setPage={setPage} user={user} logout={handleLogout}>
      {page === 'dashboard' && <Dashboard user={user} setPage={setPage} />}
      {page === 'messages' && <MessagesPage user={user} />}
      {page === 'create' && <CreatePostPage user={user} onBack={() => setPage('dashboard')} />}
      {page === 'admin' && <AdminPage />}
      {page === 'settings' && <SettingsPage />}
    </Layout>
  );
}

