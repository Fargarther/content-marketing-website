import { useEffect, useRef, useState } from 'react';
import mailboxImg from '../assets/Mailbox.webp';
import hingeImg from '../assets/Mailbox_hinge.webp';
import './Mailbox.css';

export default function Mailbox({ trackRef }) {
  const containerRef = useRef(null);
  const hingeRef = useRef(null);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const rafRef = useRef(null);
  const [groundHeight, setGroundHeight] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

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
        containerRef.current.style.setProperty('--mailbox-scroll-offset', `${-scrollLeft}px`);
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

  const animateRotation = () => {
    rafRef.current = null;
    const current = rotationRef.current;
    const target = targetRotationRef.current;
    const next = current + (target - current) * 0.18;
    rotationRef.current = next;

    if (hingeRef.current) {
      hingeRef.current.style.transform = `rotate(${next}deg)`;
    }

    if (Math.abs(target - next) > 0.1) {
      rafRef.current = requestAnimationFrame(animateRotation);
    }
  };

  const scheduleRotation = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(animateRotation);
  };

  const handleMouseMove = (e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
    const xRatio = 1 - x / rect.width;
    const yRatio = 1 - y / rect.height;
    const influence = Math.min(1, xRatio * 0.7 + yRatio * 0.3);
    const angle = Math.max(0, Math.min(90, influence * 90));
    targetRotationRef.current = angle;
    scheduleRotation();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    targetRotationRef.current = 0;
    scheduleRotation();
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const style = {};
  if (Number.isFinite(groundHeight)) {
    style['--mailbox-ground-height'] = `${groundHeight}px`;
  }

  return (
    <div
      className={`mailbox-container ${isHovering ? 'is-hovering' : ''}`}
      ref={containerRef}
      style={style}
      onMouseEnter={() => {
        setIsHovering(true);
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img src={mailboxImg} alt="Mailbox" className="mailbox-image" />
      <img
        ref={hingeRef}
        src={hingeImg}
        alt=""
        className="mailbox-hinge"
        aria-hidden="true"
      />
    </div>
  );
}
