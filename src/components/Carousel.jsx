import React, { useState, useEffect, useRef, useCallback } from 'react';
import { projects } from '../data/projects';
import './Carousel.css';

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);
  const autoplayRef = useRef(null);

  const nextSlide = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % projects.length);
      setTimeout(() => setIsTransitioning(false), 550);
    }
  }, [isTransitioning]);

  const prevSlide = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => (prevIndex - 1 + projects.length) % projects.length);
      setTimeout(() => setIsTransitioning(false), 550);
    }
  }, [isTransitioning]);

  const goToSlide = (index) => {
    if (!isTransitioning && index !== currentIndex) {
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 550);
    }
  };

  useEffect(() => {
    if (!isPaused) {
      autoplayRef.current = setInterval(nextSlide, 6000);
    }
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [isPaused, nextSlide]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  const getCardStyle = (index) => {
    const diff = index - currentIndex;
    const totalProjects = projects.length;
    
    let adjustedDiff = diff;
    if (diff > totalProjects / 2) {
      adjustedDiff = diff - totalProjects;
    } else if (diff < -totalProjects / 2) {
      adjustedDiff = diff + totalProjects;
    }

    const isCurrent = adjustedDiff === 0;
    const isPrev = adjustedDiff === -1;
    const isNext = adjustedDiff === 1;
    const isFarBack = Math.abs(adjustedDiff) > 1;

    let transform = '';
    let opacity = 0;
    let filter = '';
    let zIndex = 0;

    if (isCurrent) {
      transform = 'translateX(0) scale(1) rotateY(0deg)';
      opacity = 1;
      filter = 'blur(0px)';
      zIndex = 30;
    } else if (isPrev) {
      transform = 'translateX(-120px) scale(0.85) rotateY(15deg)';
      opacity = 0.7;
      filter = 'blur(1px)';
      zIndex = 20;
    } else if (isNext) {
      transform = 'translateX(120px) scale(0.85) rotateY(-15deg)';
      opacity = 0.7;
      filter = 'blur(1px)';
      zIndex = 20;
    } else if (isFarBack) {
      const offset = adjustedDiff * 40;
      transform = `translateX(${offset}px) scale(0.7) rotateY(${adjustedDiff * 10}deg)`;
      opacity = 0.3;
      filter = 'blur(3px)';
      zIndex = 10 - Math.abs(adjustedDiff);
    }

    return {
      transform,
      opacity,
      filter,
      zIndex,
      transition: isTransitioning ? 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      pointerEvents: isCurrent ? 'auto' : 'none'
    };
  };

  return (
    <div 
      className="carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex="0"
      role="region"
      aria-label="Project carousel"
      aria-roledescription="carousel"
    >
      <div className="carousel-track">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="carousel-card"
            style={getCardStyle(index)}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${projects.length}`}
          >
            <img 
              src={project.preview} 
              alt={`${project.title} preview`}
              loading="lazy"
              className="card-preview"
            />
            <div className="card-content">
              <h3>{project.title}</h3>
              <p>{project.subtitle}</p>
              <a 
                href={project.href} 
                className="card-link"
                tabIndex={index === currentIndex ? 0 : -1}
                aria-label={`View ${project.title} project`}
              >
                View Project →
              </a>
            </div>
          </div>
        ))}
      </div>

      <button
        className="carousel-button prev"
        onClick={prevSlide}
        aria-label="Previous slide"
        tabIndex="0"
      >
        ‹
      </button>
      
      <button
        className="carousel-button next"
        onClick={nextSlide}
        aria-label="Next slide"
        tabIndex="0"
      >
        ›
      </button>

      <div className="carousel-dots" role="tablist">
        {projects.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`Go to slide ${index + 1}`}
            tabIndex={index === currentIndex ? 0 : -1}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;