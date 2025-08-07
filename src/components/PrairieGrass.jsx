import React, { useRef, useEffect } from 'react';

const PrairieGrass = () => {
  const canvasRef = useRef(null);
  const pointerRef = useRef({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = window.innerWidth;
    const H = 120;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const bladeCount = Math.floor(W / 15);
    const blades = [];
    for (let i = 0; i < bladeCount; i++) {
      const x = (i / (bladeCount - 1)) * W;
      const height = 50 + Math.random() * 50;
      blades.push({ x, height, angle: 0, velocity: 0 });
    }

    const stiffness = 0.1;
    const damping = 0.8;
    let animationId;

    const drawFrame = () => {
      ctx.clearRect(0, 0, W, H);
      blades.forEach(blade => {
        let targetAngle = 0;
        const px = pointerRef.current.x;
        const py = pointerRef.current.y;
        if (px !== null && py !== null) {
          const dx = blade.x - px;
          const distance = Math.abs(dx);
          const influence = 100;
          if (distance < influence) {
            const direction = dx > 0 ? 1 : -1;
            const factor = (influence - distance) / influence;
            const maxAngle = 0.7;
            targetAngle = direction * maxAngle * factor;
          }
        }
        const accel = stiffness * (targetAngle - blade.angle);
        blade.velocity += accel;
        blade.velocity *= (1 - damping);
        blade.angle += blade.velocity;
        ctx.save();
        ctx.translate(blade.x, H);
        ctx.rotate(blade.angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -blade.height);
        ctx.strokeStyle = '#556B2F';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });
      animationId = requestAnimationFrame(drawFrame);
    };

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      animationId = requestAnimationFrame(drawFrame);
    } else {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = '#556B2F';
      ctx.lineWidth = 2;
      blades.forEach(blade => {
        ctx.beginPath();
        ctx.moveTo(blade.x, H);
        ctx.lineTo(blade.x, H - blade.height);
        ctx.stroke();
      });
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  const handleMouseMove = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerRef.current.x = e.clientX - rect.left;
    pointerRef.current.y = e.clientY - rect.top;
  };

  const handleMouseLeave = () => {
    pointerRef.current.x = null;
    pointerRef.current.y = null;
  };

  return (
    <canvas
      ref={canvasRef}
      className="prairie-grass"
      aria-hidden="true"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
};

export default PrairieGrass;
