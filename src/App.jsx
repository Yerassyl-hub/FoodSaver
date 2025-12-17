import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { MessagesPage } from './pages/MessagesPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('landing');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user from localStorage only once on mount
  useEffect(() => {
    const saved = localStorage.getItem('foodsaver_user');
    if (saved) {
      try {
        const userData = JSON.parse(saved);
        setUser(userData);
        const initialPage = userData.role === 'admin' ? 'admin' : 'dashboard';
        setPage(initialPage);
        window.location.hash = initialPage;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Handle hash routing
  useEffect(() => {
    if (!isInitialized) return;

    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      
      if (!user) {
        // Not logged in
        if (hash === 'login' || hash === '') {
          setPage('login');
        } else {
          setPage('landing');
        }
      } else {
        // Logged in
        if (hash === '' || hash === 'landing') {
          const defaultPage = user.role === 'admin' ? 'admin' : 'dashboard';
          setPage(defaultPage);
          window.location.hash = defaultPage;
        } else {
          setPage(hash);
        }
      }
    };
    
    // Initial hash check
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user, isInitialized]);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('foodsaver_user', JSON.stringify(u));
    setPage(u.role === 'admin' ? 'admin' : 'dashboard');
    window.location.hash = u.role === 'admin' ? 'admin' : 'dashboard';
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('foodsaver_user');
    setPage('landing');
    window.location.hash = 'landing';
  };

  const handleNavigate = (path) => {
    if (path === '/login') {
      setPage('login');
      window.location.hash = 'login';
    } else {
      window.location.hash = path;
    }
  };

  // Wait for initialization
  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not logged in and on landing route
  if (!user && page === 'landing') {
    return <LandingPage onNavigate={handleNavigate} onLogin={handleLogin} />;
  }

  // Show login page if not logged in
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

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

