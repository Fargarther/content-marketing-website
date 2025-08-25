import React, { useState, useEffect, useRef, useCallback } from 'react';
import { projects } from '../data/projects';
import useCarouselWheel from '../hooks/useCarouselWheel';
import useCarouselSwipe from '../hooks/useCarouselSwipe';
import './Carousel.css';

const Carousel = () => {
  const [rotation, setRotation] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [counterKey, setCounterKey] = useState(0);
  const wheelRef = useRef(null);
  const containerRef = useRef(null);

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

  const triggerGust = useCallback((direction = 1) => {
    const wheel = wheelRef.current;
    const active = wheel?.querySelector('.carousel-item[style*="pointer-events: auto"]');
    let focusX = window.innerWidth / 2;
    if (active) {
      const r = active.getBoundingClientRect();
      focusX = r.left + r.width / 2;
    }
    window.dispatchEvent(new CustomEvent('carousel-gust', {
      detail: { 
        x: focusX, 
        strength: 1.8,  // Reduced for softer gust
        direction: direction 
      }
    }));
  }, []);

  const rotateWheel = useCallback((direction) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setRotation(prev => prev + (direction * angleStep));
    setCounterKey(prev => prev + 1); // Trigger tick animation
    
    // Store rotation direction for gust
    window.lastCarouselDirection = direction;
    
    // Trigger wind gust with focus position and direction
    setTimeout(() => triggerGust(direction), 100); // Small delay to let DOM update
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  }, [angleStep, isTransitioning, triggerGust]);

  const goToSlide = (index) => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    // Determine current index before we jump
    const currentIndex = Math.round((-rotation % 360) / angleStep + itemCount) % itemCount;

    // Compute shortest-path direction on the circle
    const rawDelta = ((index - currentIndex) % itemCount + itemCount) % itemCount; // 0..itemCount-1
    const altDelta = rawDelta - itemCount; // negative alternative
    const chosenDelta = Math.abs(rawDelta) <= Math.abs(altDelta) ? rawDelta : altDelta;
    const direction = chosenDelta >= 0 ? 1 : -1;

    setRotation(-index * angleStep);
    setCounterKey(prev => prev + 1);

    // Make it available for any legacy code using window.lastCarouselDirection
    window.lastCarouselDirection = direction;

    // Fire gust with explicit direction after DOM updates
    setTimeout(() => triggerGust(direction), 100);

    setTimeout(() => setIsTransitioning(false), 600);
  };


  // Use robust wheel control hook for one-card-per-gesture (any axis)
  useCarouselWheel({
    viewportRef: wheelRef,
    onNext: () => {
      if (!isTransitioning) {
        rotateWheel(1);
      }
    },
    onPrev: () => {
      if (!isTransitioning) {
        rotateWheel(-1);
      }
    },
    enabled: !isTransitioning,
    thresholdPx: 260,
    cooldownMs: 490, // Reduced by 30% from 700ms
    requireFullyInView: false // Allow scrolling even when partially visible
  });

  // Use swipe control hook for touch gestures (any axis)
  useCarouselSwipe({
    viewportRef: containerRef,
    onNext: () => {
      if (!isTransitioning) {
        rotateWheel(1);
      }
    },
    onPrev: () => {
      if (!isTransitioning) {
        rotateWheel(-1);
      }
    },
    enabled: !isTransitioning,
    thresholdPxTouch: 80,
    intentPx: 8,
    cooldownMs: 350 // Reduced by 30% from 500ms
  });

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

  // Touch controls are now handled by useCarouselSwipe hook

  const currentIndex = Math.round((-rotation % 360) / angleStep + itemCount) % itemCount;

  return (
    <div 
      ref={containerRef}
      className="carousel-container"
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
      
      {/* Vertical indicator rail */}
      <div className="indicator-rail" role="tablist">
        <div className="indicator-counter" key={counterKey}>
          <span className="current">{String(currentIndex + 1).padStart(2, '0')}</span>
          <span className="separator">/</span>
          <span className="total">{String(projects.length).padStart(2, '0')}</span>
        </div>
        <div className="indicator-track">
          {projects.map((_, index) => (
            <button
              key={index}
              className={`indicator-mark ${currentIndex === index ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              role="tab"
              aria-selected={currentIndex === index}
              aria-label={`Go to slide ${index + 1}`}
              tabIndex={currentIndex === index ? 0 : -1}
            />
          ))}
          <div 
            className="indicator-slider" 
            style={{ 
              transform: `translateY(${currentIndex * (100 / projects.length)}%)` 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Carousel;