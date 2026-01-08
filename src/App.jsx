import React, { useEffect, useState, useCallback } from 'react';
import Home from './pages/Home';
import BulletinBoardPage from './pages/BulletinBoard';
import Portfolio from './pages/Portfolio';
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

  let content = <Home onNavigate={handleNavigate} />;
  if (path === '/bulletin-board') {
    content = <BulletinBoardPage onNavigate={handleNavigate} />;
  } else if (path === '/portfolio') {
    content = <Portfolio onNavigate={handleNavigate} />;
  }

  return (
    <div className="app">
      {content}
    </div>
  );
};

export default App;
