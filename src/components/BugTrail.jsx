import React, { useEffect, useRef } from 'react';
import './BugTrail.css';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const DEFAULT_TEXT = 'Follow the bug trail to Recipes';

const buildPath = (width, baseHeight, endDrop, calloutWidth, calloutHeight, isMobile) => {
  const startX = Math.round(calloutWidth - (isMobile ? 8 : 12));
  const startY = Math.round(calloutHeight + (isMobile ? 8 : 14));

  // First curve: from callout down toward loop area
  const c1x = Math.round(width * 0.18);
  const c1y = Math.round(baseHeight * 0.85);
  const c2x = Math.round(width * 0.32);
  const c2y = Math.round(baseHeight * 0.62);
  const loopEntryX = Math.round(width * 0.42);
  const loopEntryY = Math.round(baseHeight * 0.58);

  // Loop: a proper loop-de-loop that crosses itself
  // The loop goes: right -> down -> left (crossing over) -> up -> right to exit
  const loopRadius = isMobile ? width * 0.08 : width * 0.06;
  const loopCenterX = loopEntryX + loopRadius * 1.2;
  const loopCenterY = loopEntryY + loopRadius * 0.8;

  // First half of loop: curve down and around to the left
  const loop1C1x = Math.round(loopEntryX + loopRadius * 1.8);
  const loop1C1y = Math.round(loopEntryY + loopRadius * 0.2);
  const loop1C2x = Math.round(loopCenterX + loopRadius * 1.6);
  const loop1C2y = Math.round(loopCenterY + loopRadius * 1.4);
  const loopBottomX = Math.round(loopCenterX);
  const loopBottomY = Math.round(loopCenterY + loopRadius * 1.8);

  // Second half of loop: curve up and cross over the entry path
  const loop2C1x = Math.round(loopCenterX - loopRadius * 1.6);
  const loop2C1y = Math.round(loopCenterY + loopRadius * 1.4);
  const loop2C2x = Math.round(loopEntryX - loopRadius * 0.6);
  const loop2C2y = Math.round(loopEntryY - loopRadius * 0.8);
  const loopExitX = Math.round(loopEntryX + loopRadius * 0.8);
  const loopExitY = Math.round(loopEntryY - loopRadius * 1.2);

  // Final curve: from loop exit to the sign
  const endC1x = Math.round(width * 0.58);
  const endC1y = Math.round(baseHeight * 0.52 + endDrop * 0.3);
  const endC2x = Math.round(width * 0.82);
  const endC2y = Math.round(baseHeight * 0.72 + endDrop * 0.85);
  const endX = Math.round(width * 0.98);
  const endY = Math.round(baseHeight * 0.76 + endDrop);

  return [
    `M ${startX} ${startY}`,
    `C ${c1x} ${c1y}, ${c2x} ${c2y}, ${loopEntryX} ${loopEntryY}`,
    `C ${loop1C1x} ${loop1C1y}, ${loop1C2x} ${loop1C2y}, ${loopBottomX} ${loopBottomY}`,
    `C ${loop2C1x} ${loop2C1y}, ${loop2C2x} ${loop2C2y}, ${loopExitX} ${loopExitY}`,
    `C ${endC1x} ${endC1y}, ${endC2x} ${endC2y}, ${endX} ${endY}`,
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
  const calloutRef = useRef(null);
  const lengthRef = useRef(0);
  const layoutRef = useRef(null);
  const rafRef = useRef(null);
  const visibleRef = useRef(false);

  const updateLayout = () => {
    if (typeof window === 'undefined') return;

    const viewportWidth = window.innerWidth || 1024;
    const isMobile = viewportWidth <= 768;
    const signX = isMobile ? 1200 : 2600;
    const width = isMobile
      ? Math.round(clamp(viewportWidth * 0.9, 260, 360))
      : 1400;
    const baseHeight = isMobile
      ? Math.round(clamp(viewportWidth * 0.55, 200, 280))
      : 420;
    const endDrop = isMobile ? 140 : 200;
    const height = baseHeight + endDrop;
    const left = signX - width;
    const top = isMobile ? 90 : 120;
    const calloutWidth = isMobile ? Math.round(width * 0.7) : 340;
    const calloutHeight = isMobile ? 74 : 96;
    const targetLeft = isMobile ? 16 : 40;
    const endScroll = signX - width - targetLeft;
    const scrollRange = viewportWidth * (isMobile ? 0.7 : 0.9);
    const startScroll = Math.max(0, endScroll - scrollRange);

    layoutRef.current = {
      width,
      height,
      left,
      top,
      calloutWidth,
      calloutHeight,
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
      containerRef.current.style.setProperty('--trail-callout-width', `${calloutWidth}px`);
      containerRef.current.style.setProperty('--trail-callout-height', `${calloutHeight}px`);
      containerRef.current.style.setProperty('--trail-text-steps', `${Math.max(12, text.length)}`);
      containerRef.current.style.setProperty('--trail-text-width', `${Math.max(12, text.length)}ch`);
    }

    const pathD = buildPath(width, baseHeight, endDrop, calloutWidth, calloutHeight, isMobile);
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

    if (bugRef.current && length > 0) {
      const pos = pathRef.current.getPointAtLength(length * progress);
      const next = pathRef.current.getPointAtLength(Math.min(length, length * progress + 1));
      const angle = Math.atan2(next.y - pos.y, next.x - pos.x) * 180 / Math.PI;
      bugRef.current.setAttribute('transform', `translate(${pos.x} ${pos.y}) rotate(${angle})`);
      bugRef.current.style.opacity = progress === 0 ? '0' : '1';
    }

    if (calloutRef.current) {
      const shouldShow = progress > 0.05;
      if (visibleRef.current !== shouldShow) {
        visibleRef.current = shouldShow;
        calloutRef.current.classList.toggle('is-visible', shouldShow);
      }
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
      <div className="bug-trail-callout" ref={calloutRef}>
        <span className="bug-trail-text">{text}</span>
      </div>
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
        <g ref={bugRef} className="bug-trail-bug">
          <circle className="bug-body" cx="0" cy="0" r="6" />
          <circle className="bug-head" cx="8" cy="-3" r="3" />
          <line className="bug-antenna" x1="9" y1="-6" x2="14" y2="-12" />
          <line className="bug-antenna" x1="6" y1="-6" x2="10" y2="-12" />
        </g>
      </svg>
    </div>
  );
}
