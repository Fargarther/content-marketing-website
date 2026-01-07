import { useEffect, useRef, useState } from 'react';
import mailboxImg from '../assets/Mailbox.png';
import hingeImg from '../assets/Mailbox_hinge.png';
import './Mailbox.css';

export default function Mailbox({ trackRef }) {
  const containerRef = useRef(null);
  const hingeRef = useRef(null);
  const [groundHeight, setGroundHeight] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [rotation, setRotation] = useState(0);

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

  const handleMouseMove = (e) => {
    if (!hingeRef.current) return;

    const hingeRect = hingeRef.current.getBoundingClientRect();
    // Pivot point is at bottom-left of the hinge
    const pivotX = hingeRect.left;
    const pivotY = hingeRect.bottom;

    // Calculate angle from pivot to mouse
    const dx = e.clientX - pivotX;
    const dy = e.clientY - pivotY;
    let angle = Math.atan2(-dy, dx) * (180 / Math.PI);

    // Clamp rotation between 0 and 90 degrees
    angle = Math.max(0, Math.min(90, angle));

    setRotation(angle);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotation(0);
  };

  const style = {};
  if (Number.isFinite(groundHeight)) {
    style['--mailbox-ground-height'] = `${groundHeight}px`;
  }

  return (
    <div
      className={`mailbox-container ${isHovering ? 'is-hovering' : ''}`}
      ref={containerRef}
      style={style}
      onMouseEnter={() => setIsHovering(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img src={mailboxImg} alt="Mailbox" className="mailbox-image" />
      <img
        ref={hingeRef}
        src={hingeImg}
        alt=""
        className="mailbox-hinge"
        style={{ transform: `rotate(${rotation}deg)` }}
        aria-hidden="true"
      />
    </div>
  );
}
