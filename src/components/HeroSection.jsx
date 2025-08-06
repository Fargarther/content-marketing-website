import React from 'react';
import Carousel from './Carousel';
import Headshot from './Headshot';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-text">
        <h1>Welcome to My Rustic Homepage</h1>
        <p>A short introduction or tagline goes here.</p>
      </div>
      <Carousel />
      <Headshot />
    </section>
  );
};

export default HeroSection;
