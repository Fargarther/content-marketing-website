import React from 'react';
import NavBar from '../components/NavBar';
import PrairieGrass from '../components/PrairieGrass';
import Carousel from '../components/Carousel';
import Headshot from '../components/Headshot';
import './Home.css';

const Home = () => {
  return (
    <>
      <header className="site-header">
        <div className="header-content">
          <h1 className="site-title">Strategic Content Solutions</h1>
          <p className="site-tagline">Elevating brands through thoughtful storytelling</p>
        </div>
      </header>

      <main className="main-content">
        <section className="hero-section">
          <div className="hero-grid">
            <div className="carousel-wrapper">
              <Carousel />
            </div>
            <div className="headshot-wrapper">
              <Headshot />
              <div className="bio-text">
                <h2>Welcome</h2>
                <p>Crafting compelling narratives that connect brands with their audiences through strategic content marketing.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PrairieGrass />
      <NavBar />
    </>
  );
};

export default Home;