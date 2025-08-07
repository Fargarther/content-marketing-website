import React from 'react';
import Carousel from './Carousel';

const HeroSection = () => {
  return (
    <main className="main-content">
      <div className="left-section">
        <Carousel />
      </div>
      
      <div className="right-section">
        <div className="headshot">AB</div>
        
        <div className="content-area">
          <div className="section-content">
            <h1>Alex Benson</h1>
            <p>Content Marketer & Digital Storyteller crafting meaningful connections</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default HeroSection;
