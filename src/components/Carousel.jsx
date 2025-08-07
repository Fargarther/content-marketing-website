import React, { useState, useEffect } from 'react';
import './Carousel.css';

const Carousel = () => {
  const projects = [
    { id: 1, title: "Content Strategy", color: "#8B7355", description: "Strategic planning" },
    { id: 2, title: "Blog Writing", color: "#556B2F", description: "Engaging posts" },
    { id: 3, title: "Social Media", color: "#8B7355", description: "Social campaigns" },
    { id: 4, title: "Email Marketing", color: "#556B2F", description: "Email design" },
    { id: 5, title: "Brand Voice", color: "#8B7355", description: "Brand development" }
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
      
      if (e.deltaY > 0) {
        setRotation(prev => prev + angleStep);
      } else if (e.deltaY < 0) {
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
    const angle = (index * angleStep - rotation) * (Math.PI / 180);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const normalizedX = x / radius;
    
    let opacity = 0;
    if (x > 0) {
      opacity = 0.3 + (x / radius) * 0.7;
    } else {
      opacity = 0.1 + (1 + x / radius) * 0.2;
    }
    
    const scale = 0.5 + Math.max(0, normalizedX) * 0.5;
    const blur = x < 0 ? Math.abs(x) / radius * 3 : 0;
    const zIndex = Math.round((x + radius) * 100);
    const stackOffset = index * 8;
    const rotateY = -normalizedX * 15;
    
    return {
      transform: `
        translateX(${x * 0.7}px)
        translateY(${y * 0.5 + stackOffset}px)
        scale(${scale})
        rotateY(${rotateY}deg)
      `,
      opacity: opacity,
      filter: `blur(${blur}px)`,
      zIndex: zIndex,
      transition: isTransitioning ? 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      pointerEvents: x > radius * 0.5 ? 'auto' : 'none'
    };
  };

  const getCurrentIndex = () => {
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    return Math.round(normalizedRotation / angleStep) % itemCount;
  };

  const currentIndex = getCurrentIndex();

  return (
    <div className="carousel-container">
      <div className="wheel-guide"></div>
      <div className="focus-area"></div>
      <div className="carousel-wheel">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="carousel-item"
            style={getItemStyle(index)}
          >
            <div 
              className="carousel-card"
              style={{ backgroundColor: project.color }}
            >
              <span className="project-badge">0{project.id}</span>
              <div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
              <button className="card-action">View Project →</button>
            </div>
          </div>
        ))}
      </div>
      <div className="indicators">
        {projects.map((_, index) => (
          <span
            key={index}
            className={`indicator-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => {
              setRotation(-index * angleStep);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;