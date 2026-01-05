import React, { useEffect, useState, useCallback } from 'react';
import Home from './pages/Home';
import BulletinBoardPage from './pages/BulletinBoard';
import './App.css';

const App = () => {
  const [path, setPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((nextPath) => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname === nextPath) return;
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  }, []);

  return (
    <div className="app">
      {path === '/bulletin-board' ? (
        <BulletinBoardPage onNavigate={handleNavigate} />
      ) : (
        <Home onNavigate={handleNavigate} />
      )}
    </div>
  );
};

export default App;
