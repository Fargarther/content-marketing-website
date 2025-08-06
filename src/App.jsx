import React from 'react';
import HeroSection from './components/HeroSection';
import PrairieGrass from './components/PrairieGrass';
import NavBar from './components/NavBar';
import './App.css';

const App = () => {
  return (
    <div className="app">
      <main className="content">
        <HeroSection />
        <PrairieGrass />
      </main>
      <NavBar />
    </div>
  );
};

export default App;
