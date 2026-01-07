import React, { useEffect, useRef } from 'react';
import './BugTrail.css';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const DEFAULT_TEXT = 'Hungry?';

const buildPath = (width, baseHeight, endDrop, labelWidth, labelHeight, isMobile) => {
  const startX = Math.round(labelWidth - (isMobile ? 6 : 10));
  const startY = Math.round(labelHeight + (isMobile ? 8 : 12));

  // Simple, playful curve: Drop down, undulate slightly, then arc to sign
  // P1: Drop down from callout
  const p1x = Math.round(width * 0.15);
  const p1y = Math.round(baseHeight * 0.6);

  // P2: Bottom of first dip
  const p2x = Math.round(width * 0.35);
  const p2y = Math.round(baseHeight * 0.85);

  // P3: Peak of hop
  const p3x = Math.round(width * 0.65);
  const p3y = Math.round(baseHeight * 0.45);

  // End: Swoop down to sign top-left corner
  const endC1x = Math.round(width * 0.9);
  const endC1y = Math.round(baseHeight * 0.65 + endDrop * 0.5);

  const endX = Math.round(width * 1.02);
  const endY = Math.round(baseHeight * 0.76 + endDrop);

  return [
    `M ${startX} ${startY}`,
    `C ${p1x} ${p1y}, ${p2x} ${p2y}, ${p3x} ${p3y}`,
    `S ${endC1x} ${endC1y}, ${endX} ${endY}`
  ].join(' ');
};

export default function BugTrail({ trackRef, text = DEFAULT_TEXT }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const revealRef = useRef(null);
  const tailPathRef = useRef(null);
  const tailMaskRef = useRef(null);
  const bugRef = useRef(null);
  const bugRotateRef = useRef(null);
  const arrowRef = useRef(null);
  const lengthRef = useRef(0);
  const layoutRef = useRef(null);
  const rafRef = useRef(null);

  const updateLayout = () => {
    if (typeof window === 'undefined') return;

    const viewportWidth = window.innerWidth || 1024;
    const isMobile = viewportWidth <= 768;
    const signX = isMobile ? 1200 : 2550; // Tuned match
    const width = isMobile
      ? Math.round(clamp(viewportWidth * 0.9, 260, 360))
      : 1420;
    const baseHeight = isMobile
      ? Math.round(clamp(viewportWidth * 0.55, 200, 280))
      : 400;
    const endDrop = isMobile ? 140 : 180;
    const height = baseHeight + endDrop;
    const left = signX - width;
    const top = (isMobile ? 90 : 150) + 100;
    const labelWidth = Math.round(clamp(
      text.length * (isMobile ? 12 : 14),
      isMobile ? 90 : 110,
      isMobile ? 180 : 220
    ));
    const labelHeight = isMobile ? 26 : 32;
    const targetLeft = isMobile ? 16 : 40;
    const endScroll = signX - width - targetLeft;
    const scrollRange = viewportWidth * (isMobile ? 0.7 : 0.9);
    const startScroll = Math.max(0, endScroll - scrollRange);

    layoutRef.current = {
      width,
      height,
      left,
      top,
      labelWidth,
      labelHeight,
      startScroll,
      endScroll,
      endDrop,
      isMobile,
    };

    if (containerRef.current) {
      containerRef.current.style.setProperty('--trail-left', `${left}px`);
      containerRef.current.style.setProperty('--trail-top', `${top}px`);
      containerRef.current.style.setProperty('--trail-width', `${width}px`);
      containerRef.current.style.setProperty('--trail-height', `${height}px`);
      containerRef.current.style.setProperty('--trail-label-width', `${labelWidth}px`);
      containerRef.current.style.setProperty('--trail-label-height', `${labelHeight}px`);
    }

    const pathD = buildPath(width, baseHeight, endDrop, labelWidth, labelHeight, isMobile);
    if (pathRef.current) {
      pathRef.current.setAttribute('d', pathD);
    }
    if (revealRef.current) {
      revealRef.current.setAttribute('d', pathD);
    }
    if (tailPathRef.current) {
      tailPathRef.current.setAttribute('d', pathD);
    }
    if (tailMaskRef.current) {
      tailMaskRef.current.setAttribute('d', pathD);
    }
    if (svgRef.current) {
      svgRef.current.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    if (pathRef.current && revealRef.current) {
      const length = pathRef.current.getTotalLength();
      lengthRef.current = length;
      revealRef.current.style.strokeDasharray = `${length}`;
      revealRef.current.style.strokeDashoffset = `${length}`;
      if (tailMaskRef.current) {
        tailMaskRef.current.style.strokeDasharray = `0 ${length}`;
        tailMaskRef.current.style.strokeDashoffset = '0';
      }
    }
  };

  const updateProgress = () => {
    const track = trackRef?.current;
    if (!track || !layoutRef.current || !pathRef.current || !revealRef.current) return;

    const scrollLeft = track.scrollLeft || 0;
    const { startScroll, endScroll } = layoutRef.current;
    const progress = clamp(
      (scrollLeft - startScroll) / Math.max(1, endScroll - startScroll),
      0,
      1
    );
    const length = lengthRef.current;

    if (containerRef.current) {
      containerRef.current.style.setProperty('--trail-scroll-offset', `${-scrollLeft}px`);
      containerRef.current.style.setProperty('--trail-progress', progress.toFixed(3));
    }

    if (length > 0) {
      revealRef.current.style.strokeDashoffset = `${length * (1 - progress)}`;
    }

    if (tailMaskRef.current && length > 0) {
      const tailMax = length * 0.1;
      const tailLen = Math.min(length * progress, tailMax);
      if (tailLen <= 0.5) {
        tailMaskRef.current.style.strokeDasharray = `0 ${length}`;
        tailMaskRef.current.style.strokeDashoffset = '0';
      } else {
        const tailStart = Math.max(0, (length * progress) - tailLen);
        tailMaskRef.current.style.strokeDasharray = `${tailLen} ${length}`;
        tailMaskRef.current.style.strokeDashoffset = `${-tailStart}`;
      }
    }

    if (bugRef.current && bugRotateRef.current && length > 0) {
      const pos = pathRef.current.getPointAtLength(length * progress);
      const next = pathRef.current.getPointAtLength(Math.min(length, length * progress + 1));
      const angle = Math.atan2(next.y - pos.y, next.x - pos.x) * 180 / Math.PI;
      bugRef.current.setAttribute('transform', `translate(${pos.x} ${pos.y})`);
      bugRotateRef.current.setAttribute('transform', `rotate(${angle})`);
      bugRef.current.style.opacity = progress === 0 ? '0' : '1';
    }

    if (arrowRef.current && length > 0) {
      const endPos = pathRef.current.getPointAtLength(length);
      const prevPos = pathRef.current.getPointAtLength(Math.max(0, length - 1));
      const endAngle = Math.atan2(endPos.y - prevPos.y, endPos.x - prevPos.x) * 180 / Math.PI;
      const arrowRevealStart = 0.85;
      const arrowOpacity = clamp(
        (progress - arrowRevealStart) / (1 - arrowRevealStart),
        0,
        1
      );
      arrowRef.current.setAttribute('transform', `translate(${endPos.x} ${endPos.y}) rotate(${endAngle})`);
      arrowRef.current.style.opacity = `${arrowOpacity}`;
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
  }, [trackRef, text]);

  return (
    <div className="bug-trail" ref={containerRef}>
      <div className="bug-trail-label">{text}</div>
      <svg
        ref={svgRef}
        className="bug-trail-svg"
        viewBox="0 0 1400 620"
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          <mask id="bug-trail-mask" maskUnits="userSpaceOnUse">
            <path
              ref={revealRef}
              className="bug-trail-reveal"
              d=""
            />
          </mask>
          <mask id="bug-trail-tail-mask" maskUnits="userSpaceOnUse">
            <path
              ref={tailMaskRef}
              className="bug-trail-tail-reveal"
              d=""
            />
          </mask>
        </defs>
        <path
          ref={pathRef}
          className="bug-trail-dots"
          d=""
          mask="url(#bug-trail-mask)"
        />
        <path
          ref={tailPathRef}
          className="bug-trail-dots-tail"
          d=""
          mask="url(#bug-trail-tail-mask)"
        />
        <g ref={arrowRef} className="bug-trail-arrow">
          <path d="M -10 -5 L 0 0 L -10 5" />
        </g>
        <g ref={bugRef} className="bug-trail-bug">
          <g ref={bugRotateRef} className="bug-trail-bug-rot">
            <circle className="bug-body" cx="0" cy="0" r="6" />
            <circle className="bug-head" cx="8" cy="-3" r="3" />
            <line className="bug-antenna" x1="9" y1="-6" x2="14" y2="-12" />
            <line className="bug-antenna" x1="6" y1="-6" x2="10" y2="-12" />
          </g>
        </g>
      </svg>
    </div>
  );
}
