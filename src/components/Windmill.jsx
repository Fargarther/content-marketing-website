import React, { useEffect, useRef, useState } from 'react';
import windmillBase from '../assets/windmill_base.png';
import windmillBlades from '../assets/windmill_blades.png';
import './Windmill.css';

export default function Windmill({ scrollStateRef } = {}) {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const bladesWrapRef = useRef(null);
  const hoverRafRef = useRef(null);
  const hoverAngleRef = useRef(0);
  const pointerRef = useRef({ x: null, y: null });
  const [groundHeight, setGroundHeight] = useState(null);
  const [baseTrim, setBaseTrim] = useState(null);
  const [hubPoint, setHubPoint] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ground = document.querySelector('.ground-nav');
    if (!ground) return;

    const update = () => {
      const nextHeight = Math.round(ground.getBoundingClientRect().height);
      if (nextHeight > 0) setGroundHeight(nextHeight);
    };

    update();

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update);
      observer.observe(ground);
    }

    window.addEventListener('resize', update);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [windmillBase]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.src = windmillBase;

    img.onload = () => {
      if (cancelled) return;
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) return;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, width, height);

      let bottom = height - 1;
      let found = false;
      for (let y = height - 1; y >= 0; y--) {
        const row = y * width * 4;
        for (let x = 0; x < width; x++) {
          if (data[row + (x * 4) + 3] !== 0) {
            bottom = y;
            found = true;
            break;
          }
        }
        if (found) break;
      }

      const margin = Math.max(0, height - 1 - bottom);
      const trimPercent = margin > 0 ? (margin / height) * 100 : 0;
      setBaseTrim(trimPercent);

      const rows = [];
      let maxWidth = 0;
      for (let y = 0; y < height; y++) {
        let minX = width;
        let maxX = -1;
        const row = y * width * 4;
        for (let x = 0; x < width; x++) {
          if (data[row + (x * 4) + 3] !== 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }
        if (maxX >= 0) {
          const rowWidth = maxX - minX + 1;
          maxWidth = Math.max(maxWidth, rowWidth);
          rows.push({ y, width: rowWidth, center: (minX + maxX) / 2 });
        }
      }

      if (rows.length > 0) {
        const towerThreshold = maxWidth * 0.35;
        const runLength = Math.max(8, Math.round(height * 0.012));
        let towerStart = -1;

        for (let i = 0; i <= rows.length - runLength; i++) {
          let isTower = true;
          for (let j = 0; j < runLength; j++) {
            if (rows[i + j].width > towerThreshold) {
              isTower = false;
              break;
            }
          }
          if (isTower) {
            towerStart = i;
            break;
          }
        }

        if (towerStart !== -1) {
          const towerSlice = rows.slice(towerStart, towerStart + runLength);
          const towerCenter = towerSlice.reduce((sum, row) => sum + row.center, 0) / towerSlice.length;
          const housingRows = rows.slice(0, towerStart).filter((row) => row.width > towerThreshold);

          if (housingRows.length > 0) {
            let sumY = 0;
            let sumW = 0;
            housingRows.forEach((row) => {
              sumY += row.y * row.width;
              sumW += row.width;
            });

            const housingCenterY = sumY / sumW;
            setHubPoint({
              x: (towerCenter / width) * 100,
              y: (housingCenterY / height) * 100,
            });
          }
        }
      }
    };

    return () => {
      cancelled = true;
    };
  }, [windmillBase]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMove = (event) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleLeave = () => {
      pointerRef.current = { x: null, y: null };
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseleave', handleLeave);

    const update = () => {
      const wrap = bladesWrapRef.current;
      if (wrap) {
        const rect = wrap.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const { x, y } = pointerRef.current;

        let targetAngle = 0;
        if (x !== null && y !== null) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.hypot(dx, dy);
          const radius = Math.max(rect.width, rect.height) * 0.55;

          if (distance <= radius) {
            const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
            targetAngle = angleDeg;
          }
        }

        const current = hoverAngleRef.current;
        const delta = ((targetAngle - current + 540) % 360) - 180;
        const nextAngle = current + delta * 0.12;
        hoverAngleRef.current = nextAngle;

        wrap.style.setProperty('--windmill-blades-hover-rot', `${nextAngle.toFixed(2)}deg`);
      }

      hoverRafRef.current = requestAnimationFrame(update);
    };

    hoverRafRef.current = requestAnimationFrame(update);
    return () => {
      if (hoverRafRef.current) cancelAnimationFrame(hoverRafRef.current);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !scrollStateRef) return;

    const update = () => {
      const scrollLeft = scrollStateRef?.current?.scrollLeft || 0;
      if (containerRef.current) {
        containerRef.current.style.setProperty('--windmill-scroll-offset', `${-scrollLeft}px`);
      }
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollStateRef]);

  const style = {};
  if (Number.isFinite(groundHeight)) {
    style['--windmill-ground-height'] = `${groundHeight}px`;
  }
  if (Number.isFinite(baseTrim)) {
    style['--windmill-base-trim'] = `${baseTrim}%`;
  }
  if (Number.isFinite(hubPoint?.x) && Number.isFinite(hubPoint?.y)) {
    style['--windmill-hub-x'] = `${hubPoint.x}%`;
    style['--windmill-hub-y'] = `${hubPoint.y}%`;
  }

  return (
    <div className="windmill" ref={containerRef} style={style} aria-hidden="true">
      <div className="windmill-assembly">
        <img className="windmill-base" src={windmillBase} alt="" draggable="false" />
        <div className="windmill-blades-wrap" ref={bladesWrapRef}>
          <img className="windmill-blades" src={windmillBlades} alt="" draggable="false" />
        </div>
      </div>
    </div>
  );
}
