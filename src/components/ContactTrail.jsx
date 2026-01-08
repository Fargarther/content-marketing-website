import React, { useEffect, useRef } from 'react';
import './ContactTrail.css';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const buildPath = (width, height) => {
  const startX = 0;
  const startY = Math.round(height * 0.45);
  const c1x = Math.round(width * 0.28);
  const c1y = Math.round(height * 0.1);
  const c2x = Math.round(width * 0.62);
  const c2y = Math.round(height * 0.85);
  const endX = Math.round(width * 0.96);
  const endY = Math.round(height * 0.4);

  return `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
};

export default function ContactTrail({ trackRef }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const revealRef = useRef(null);
  const lengthRef = useRef(0);
  const layoutRef = useRef(null);
  const rafRef = useRef(null);

  const updateLayout = () => {
    if (typeof window === 'undefined') return;

    const viewportWidth = window.innerWidth || 1024;
    const isMobile = viewportWidth <= 768;
    const contactPanel = document.getElementById('contact');
    const panelLeft = contactPanel ? contactPanel.offsetLeft : viewportWidth * 3;

    const width = isMobile
      ? Math.round(clamp(viewportWidth * 0.7, 220, 320))
      : 520;
    const height = isMobile
      ? Math.round(clamp(viewportWidth * 0.45, 160, 240))
      : 260;

    const left = panelLeft + (isMobile ? 30 : 140);
    const top = isMobile ? 180 : 210;

    const startScroll = Math.max(0, panelLeft - viewportWidth * 0.6);
    const endScroll = panelLeft + width * 0.4;

    layoutRef.current = {
      width,
      height,
      left,
      top,
      startScroll,
      endScroll,
    };

    if (containerRef.current) {
      containerRef.current.style.setProperty('--contact-trail-left', `${left}px`);
      containerRef.current.style.setProperty('--contact-trail-top', `${top}px`);
      containerRef.current.style.setProperty('--contact-trail-width', `${width}px`);
      containerRef.current.style.setProperty('--contact-trail-height', `${height}px`);
    }

    const pathD = buildPath(width, height);
    if (pathRef.current) {
      pathRef.current.setAttribute('d', pathD);
    }
    if (revealRef.current) {
      revealRef.current.setAttribute('d', pathD);
    }
    if (svgRef.current) {
      svgRef.current.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    if (pathRef.current && revealRef.current) {
      const length = pathRef.current.getTotalLength();
      lengthRef.current = length;
      revealRef.current.style.strokeDasharray = `${length}`;
      revealRef.current.style.strokeDashoffset = `${length}`;
    }
  };

  const updateProgress = () => {
    const track = trackRef?.current;
    if (!track || !layoutRef.current || !revealRef.current) return;

    const scrollLeft = track.scrollLeft || 0;
    const { startScroll, endScroll } = layoutRef.current;
    const progress = clamp(
      (scrollLeft - startScroll) / Math.max(1, endScroll - startScroll),
      0,
      1
    );
    const length = lengthRef.current;

    if (containerRef.current) {
      containerRef.current.style.setProperty('--contact-trail-scroll-offset', `${-scrollLeft}px`);
    }

    if (length > 0) {
      revealRef.current.style.strokeDashoffset = `${length * (1 - progress)}`;
    }
  };

  useEffect(() => {
    updateLayout();
    updateProgress();

    const track = trackRef?.current;
    if (!track) return undefined;

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateProgress();
      });
    };

    const onResize = () => {
      updateLayout();
      updateProgress();
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [trackRef]);

  return (
    <div className="contact-trail" ref={containerRef}>
      <svg
        ref={svgRef}
        className="contact-trail-svg"
        viewBox="0 0 520 260"
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          <mask id="contact-trail-mask" maskUnits="userSpaceOnUse">
            <path
              ref={revealRef}
              className="contact-trail-reveal"
              d=""
            />
          </mask>
        </defs>
        <path
          ref={pathRef}
          className="contact-trail-dots"
          d=""
          mask="url(#contact-trail-mask)"
        />
      </svg>
    </div>
  );
}
