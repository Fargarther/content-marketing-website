import React, { useState, useEffect, useRef, useCallback } from 'react';
import { projects } from '../data/projects';
import './Carousel.css';

const Carousel = () => {
  const [rotation, setRotation] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const wheelRef = useRef(null);

  const itemCount = projects.length;
  const angleStep = 360 / itemCount;
  const radius = 250;

  const updateWheel = useCallback(() => {
    const items = wheelRef.current?.querySelectorAll('.carousel-item');
    const indicators = wheelRef.current?.parentElement?.querySelectorAll('.indicator-dot');
    
    if (!items) return;

    items.forEach((item, index) => {
      // Calculate angle (0° = right side)
      const angle = (index * angleStep - rotation) * (Math.PI / 180);
      
      // Position on circle
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      // Normalize x for effects (-1 to 1, where 1 is rightmost)
      const normalizedX = x / radius;
      
      // Opacity based on x position (right is clearest)
      let opacity = 0;
      if (x > 0) {
        // Right side - full visibility
        opacity = 0.3 + (x / radius) * 0.7; // 30% to 100%
      } else {
        // Left side - fading
        opacity = 0.1 + (1 + x / radius) * 0.2; // 10% to 30%
      }
      
      // Scale based on x position
      const scale = 0.5 + Math.max(0, normalizedX) * 0.5;
      
      // Blur left-side cards
      const blur = x < 0 ? Math.abs(x) / radius * 3 : 0;
      
      // Perspective rotation
      const rotateY = -normalizedX * 15;
      
      // Apply transforms
      item.style.transform = `
        translateX(${x * 0.7}px)
        translateY(${y * 0.5}px)
        scale(${scale})
        rotateY(${rotateY}deg)
      `;
      item.style.opacity = opacity;
      item.style.filter = `blur(${blur}px)`;
      item.style.zIndex = Math.round((x + radius) * 100);
      item.style.pointerEvents = x > radius * 0.5 ? 'auto' : 'none';
    });

    // Update indicators
    if (indicators) {
      const currentIndex = Math.round((-rotation % 360) / angleStep + itemCount) % itemCount;
      indicators.forEach((ind, i) => {
        ind.classList.toggle('active', i === currentIndex);
      });
    }
  }, [rotation, angleStep, itemCount, radius]);

  useEffect(() => {
    updateWheel();
  }, [rotation, updateWheel]);

  const rotateWheel = useCallback((direction) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setRotation(prev => prev + (direction * angleStep));
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  }, [angleStep, isTransitioning]);

  const goToSlide = (index) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setRotation(-index * angleStep);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  };


  // Mouse wheel control
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      if (isTransitioning) return;

      // Rotate counter-clockwise on upward scroll, clockwise on downward scroll
      if (e.deltaY > 0) {
        rotateWheel(1);  // Downward scroll = clockwise
      } else {
        rotateWheel(-1); // Upward scroll = counter-clockwise
      }
    };

    const container = wheelRef.current?.parentElement;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [rotateWheel, isTransitioning]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        rotateWheel(-1);
      } else if (e.key === 'ArrowRight') {
        rotateWheel(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rotateWheel]);

  // Touch controls
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      rotateWheel(diff > 0 ? 1 : -1);
    }
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const currentIndex = Math.round((-rotation % 360) / angleStep + itemCount) % itemCount;

  return (
    <div 
      className="carousel-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Project carousel"
      aria-roledescription="carousel"
    >
      <div className="wheel-guide" aria-hidden="true"></div>
      <div className="focus-area" aria-hidden="true"></div>
      
      <div className="carousel-wheel" ref={wheelRef}>
        {projects.map((project, index) => {
          const isActive = currentIndex === index;
          
          return (
            <div 
              key={project.id} 
              className="carousel-item"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${projects.length}`}
            >
              <div 
                className="carousel-card" 
                style={{ background: project.color }}
              >
                <span className="project-badge">{project.number}</span>
                <div className="card-content">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
                <a 
                  href={project.href}
                  className="card-action"
                  aria-label={`View ${project.title} project`}
                  tabIndex={isActive ? 0 : -1}
                >
                  View Project →
                </a>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="indicators" role="tablist">
        {projects.map((_, index) => (
          <button
            key={index}
            className={`indicator-dot ${currentIndex === index ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            role="tab"
            aria-selected={currentIndex === index}
            aria-label={`Go to slide ${index + 1}`}
            tabIndex={currentIndex === index ? 0 : -1}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;