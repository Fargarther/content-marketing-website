import React, { useEffect, useRef, useCallback, useState } from 'react';
import GroundNav from '../components/GroundNav';
import PrairieGrass from '../components/PrairieGrass';
import Windmill from '../components/Windmill';
import Sky from '../components/Sky';
import { PANEL_COUNT, GROUND_VISUAL_HEIGHT } from '../config/worldConfig';
import './Home.css';

export default function Home() {
  const trackRef = useRef(null);
  const touchRef = useRef(null);
  const [totalWidth, setTotalWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth * PANEL_COUNT : 0
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const velocityRef = useRef(0);
  const animFrameRef = useRef(null);

  // Translate wheel movement into horizontal scroll on the track
  const handleWheel = useCallback((e) => {
    const track = trackRef.current;
    if (!track) return;
    if (track.scrollWidth <= track.clientWidth) return;
    if (e.ctrlKey) return; // let zoom gestures through
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta === 0) return;
    const max = track.scrollWidth - track.clientWidth;
    // Kick a simple inertial scroll
    velocityRef.current += delta * 0.35;

    const step = () => {
      const t = trackRef.current;
      if (!t) return;
      let next = t.scrollLeft + velocityRef.current;
      // clamp edges
      if (next < 0) {
        next = 0;
        velocityRef.current = 0;
      } else if (next > max) {
        next = max;
        velocityRef.current = 0;
      }
      t.scrollLeft = next;
      // apply friction
      velocityRef.current *= 0.88;
      if (Math.abs(velocityRef.current) > 0.2) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        velocityRef.current = 0;
        animFrameRef.current = null;
      }
    };

    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(step);
    }
    e.preventDefault();
  }, []);

  // Touch/pan: convert vertical or horizontal drags into horizontal scroll
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onTouchStart = (e) => {
      if (track.scrollWidth <= track.clientWidth) return;
      const t = e.touches[0];
      touchRef.current = { x: t.clientX, y: t.clientY };
    };

    const onTouchMove = (e) => {
      if (!touchRef.current || track.scrollWidth <= track.clientWidth) return;
      const t = e.touches[0];
      const dx = t.clientX - touchRef.current.x;
      const dy = t.clientY - touchRef.current.y;
      const primary = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
      track.scrollLeft -= primary;
      touchRef.current = { x: t.clientX, y: t.clientY };
      e.preventDefault();
    };

    const onTouchEnd = () => { touchRef.current = null; };

    track.addEventListener('touchstart', onTouchStart, { passive: false });
    track.addEventListener('touchmove', onTouchMove, { passive: false });
    track.addEventListener('touchend', onTouchEnd);
    track.addEventListener('touchcancel', onTouchEnd);

    return () => {
      track.removeEventListener('touchstart', onTouchStart);
      track.removeEventListener('touchmove', onTouchMove);
      track.removeEventListener('touchend', onTouchEnd);
      track.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // Track total width for synced ground/grass
  useEffect(() => {
    const update = () => {
      setTotalWidth(window.innerWidth * PANEL_COUNT);
      setViewportHeight(window.innerHeight || viewportHeight);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [viewportHeight]);

  // Scroll to the hashed section when nav updates
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      const target = document.getElementById(hash);
      if (target && trackRef.current) {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
    };

    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div
      className="horizontal-shell"
      style={{
        '--panel-count': PANEL_COUNT,
        '--ground-nav-height': `${GROUND_VISUAL_HEIGHT}px`,
        '--ground-height': `${GROUND_VISUAL_HEIGHT}px`,
      }}
    >
      <div className="scroll-track" ref={trackRef} onWheel={handleWheel}>
        <section className="panel hero-panel" id="home">
          <div className="panel-inner">
            <p className="eyebrow">Content Marketing Studio</p>
            <h1>
              Prairie Grass prototype.
            </h1>
          </div>
          {/* Windmill Fixed to first panel visually, or effectively part of the landscape */}
          <Windmill />
        </section>

        <section className="panel projects-panel" id="blog">
          <div className="panel-inner compact">
            <div className="section-header">
              <p className="eyebrow">Selected Work</p>
              <h2>In progress.</h2>
            </div>
          </div>
        </section>

        <section className="panel about-panel" id="about">
          <div className="panel-inner">
            <p className="eyebrow">About</p>
            <h2>Quiet space to tune the grass.</h2>
          </div>
        </section>

        <section className="panel contact-panel" id="contact">
          <div className="panel-inner">
            <p className="eyebrow">Contact</p>
            <h2>Reach out when ready.</h2>
            <a className="cta" href="mailto:hello@contentstudio.test">Email</a>
          </div>
        </section>

        <section className="panel spacer-panel" style={{ pointerEvents: 'none' }} />

      </div>

      <PrairieGrass spanCount={PANEL_COUNT} scrollVelocityRef={velocityRef} trackRef={trackRef} />

      {/* GroundNav moved outside to enforce z-index layering (Sky < Grass < Ground) */}
      <GroundNav
        totalWidth={totalWidth}
        groundHeight={GROUND_VISUAL_HEIGHT}
        viewportHeight={viewportHeight}
        trackRef={trackRef}
      />

      {/* Pass totalWidth to Sky to help it scale speeds if needed, though we hardcoded them */}
      <Sky scrollVelocityRef={velocityRef} trackRef={trackRef} />
    </div>
  );
}
