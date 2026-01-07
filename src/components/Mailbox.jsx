import { useEffect, useRef, useState } from 'react';
import mailboxImg from '../assets/Mailbox.png';
import hingeImg from '../assets/Mailbox_hinge.png';
import './Mailbox.css';

export default function Mailbox({ trackRef }) {
  const containerRef = useRef(null);
  const [groundHeight, setGroundHeight] = useState(null);
  const [flagUp, setFlagUp] = useState(false);

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

  const style = {};
  if (Number.isFinite(groundHeight)) {
    style['--mailbox-ground-height'] = `${groundHeight}px`;
  }

  return (
    <div
      className={`mailbox-container ${flagUp ? 'flag-up' : ''}`}
      ref={containerRef}
      style={style}
      onMouseEnter={() => setFlagUp(true)}
      onMouseLeave={() => setFlagUp(false)}
    >
      <img src={mailboxImg} alt="Mailbox" className="mailbox-image" />
      <img src={hingeImg} alt="" className="mailbox-hinge" aria-hidden="true" />
    </div>
  );
}
