import React, { useState, useEffect } from 'react';
import './Carousel.css';

const Carousel = () => {
  const projects = [
    { id: 1, title: "Content Strategy", color: "#8B7355", description: "Strategic content planning" },
    { id: 2, title: "Blog Writing", color: "#556B2F", description: "Engaging blog posts" },
    { id: 3, title: "Social Media", color: "#8B7355", description: "Social media campaigns" },
    { id: 4, title: "Email Marketing", color: "#556B2F", description: "Email campaign design" },
    { id: 5, title: "Brand Voice", color: "#8B7355", description: "Brand personality development" }
  ];
  
  const [rotation, setRotation] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const itemCount = projects.length;
  const angleStep = 360 / itemCount;
  const radius = 250;

  useEffect(() => {
    let wheelTimeout;
    
    const handleWheel = (e) => {
      e.preventDefault();
      
      if (isTransitioning) return;
      
      clearTimeout(wheelTimeout);
      setIsTransitioning(true);
      
      // Rotate the wheel - both directions work
      if (e.deltaY > 0) {
        // Scrolling down - rotate forward
        setRotation(prev => prev + angleStep);
      } else if (e.deltaY < 0) {
        // Scrolling up - rotate backward
        setRotation(prev => prev - angleStep);
      }
      
      wheelTimeout = setTimeout(() => {
        setIsTransitioning(false);
      }, 600);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelTimeout);
    };
  }, [isTransitioning, angleStep]);

  const getItemStyle = (index) => {
    // Calculate angle for this card (0° = right side)
    const angle = (index * angleStep - rotation) * (Math.PI / 180);
    
    // Position on circle (2D)
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    // Normalize x position (-1 to 1, where 1 is rightmost)
    const normalizedX = x / radius;
    
    // Opacity based on horizontal position (right side is clearest)
    let opacity = 0;
    if (x > 0) {
      // Right side - full visibility
      opacity = 0.3 + (x / radius) * 0.7; // 30% to 100%
    } else {
      // Left side - fading
      opacity = 0.1 + (1 + x / radius) * 0.2; // 10% to 30%
    }
    
    // Scale based on how far right the card is
    const scale = 0.5 + Math.max(0, normalizedX) * 0.5; // 50% to 100% for right side
    
    // Blur cards on the left side
    const blur = x < 0 ? Math.abs(x) / radius * 3 : 0;
    
    // Z-index based on x position (rightmost cards on top)
    const zIndex = Math.round((x + radius) * 100);
    
    // Stack offset - cards overlap each other vertically
    const stackOffset = index * 8;
    
    // Only show cards in the visible range
    const isVisible = y > -radius * 1.2 && y < radius * 1.2;
    
    return {
      transform: `
        translateX(${x * 0.7}px)
        translateY(${y * 0.5 + stackOffset}px)
        scale(${scale})
        rotateY(${-normalizedX * 15}deg)
      `,
      opacity: isVisible ? opacity : 0,
      filter: `blur(${blur}px)`,
      zIndex: zIndex,
      transition: isTransitioning ? 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      pointerEvents: x > radius * 0.5 ? 'auto' : 'none',
      visibility: isVisible ? 'visible' : 'hidden'
    };
  };

  // Find the rightmost card
  const getCurrentIndex = () => {
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    return Math.round(normalizedRotation / angleStep) % itemCount;
  };

  const currentIndex = getCurrentIndex();

  return (
    <div className="carousel-clean-container">
      <div className="carousel-clean-wheel">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="carousel-clean-item"
            style={getItemStyle(index)}
          >
            <div 
              className="carousel-clean-card"
              style={{ backgroundColor: project.color }}
            >
              <div className="card-inner">
                <span className="project-badge">0{project.id}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <button className="card-action">View Project →</button>
              </div>
              <div className="card-shine"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Visual guide showing the wheel path */}
      <div className="wheel-guide"></div>
      
      {/* Just the indicators, no buttons or text */}
      <div className="carousel-indicators">
        {projects.map((_, index) => (
          <span
            key={index}
            className={`indicator-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => {
              const targetRotation = -index * angleStep;
              setRotation(targetRotation);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;