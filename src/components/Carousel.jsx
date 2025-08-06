import React, { useRef, useState } from 'react';

const Carousel = () => {
  const images = [
    'https://via.placeholder.com/160x100.png?text=Project+1',
    'https://via.placeholder.com/160x100.png?text=Project+2',
    'https://via.placeholder.com/160x100.png?text=Project+3',
    'https://via.placeholder.com/160x100.png?text=Project+4'
  ];
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef(null);

  const scrollToIndex = index => {
    const container = scrollRef.current;
    if (container) {
      const child = container.children[index];
      if (child) {
        child.scrollIntoView({ behavior: 'smooth', inline: 'nearest' });
      }
    }
  };

  const handlePrev = () => {
    const newIndex = Math.max(current - 1, 0);
    setCurrent(newIndex);
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(current + 1, images.length - 1);
    setCurrent(newIndex);
    scrollToIndex(newIndex);
  };

  return (
    <div className="carousel">
      <button onClick={handlePrev} aria-label="Previous" disabled={current === 0}>
        ‹
      </button>
      <div className="carousel-track" ref={scrollRef}>
        {images.map((src, idx) => (
          <img key={idx} src={src} alt={`Project ${idx + 1}`} className="carousel-item" />
        ))}
      </div>
      <button onClick={handleNext} aria-label="Next" disabled={current === images.length - 1}>
        ›
      </button>
    </div>
  );
};

export default Carousel;
