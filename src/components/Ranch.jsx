import { useEffect, useRef, useState } from 'react';
import ranchImg from '../assets/ranch.svg';
import './Ranch.css';

export default function Ranch({ trackRef }) {
  const containerRef = useRef(null);
  const [groundHeight, setGroundHeight] = useState(null);

  // Sync ground height for vertical positioning
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ground = document.querySelector('.ground-nav');
    if (!ground) return;

    const update = () => {
      const nextHeight = Math.round(ground.getBoundingClientRect().height);
      if (nextHeight > 0) setGroundHeight(nextHeight);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Sync horizontal scroll position
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const track = trackRef?.current;
    if (!track) return;

    const update = () => {
      const scrollLeft = track.scrollLeft || 0;
      if (containerRef.current) {
        containerRef.current.style.setProperty('--ranch-scroll-offset', `${-scrollLeft}px`);
      }
    };

    update();
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      track.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [trackRef]);

  const style = {};
  if (Number.isFinite(groundHeight)) {
    style['--ranch-ground-height'] = `${groundHeight}px`;
  }

  return (
    <div
      className="ranch-container"
      ref={containerRef}
      style={style}
    >
      <img src={ranchImg} alt="Ranch" className="ranch-image" />
    </div>
  );
}
