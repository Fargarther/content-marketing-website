import React, { useEffect, useRef, useState } from "react";
import "./GroundNav.css";

export default function GroundNav() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // simple rock model
  const [rocks] = useState(() => {
    // create a few rocks with randomized sizes/positions
    const arr = [];
    for (let i = 0; i < 10; i++) {
      arr.push({
        x: 40 + i * 28 + Math.random() * 20,
        y: 20 + Math.random() * 30,
        vx: 0,
        vy: 0,
        r: 6 + Math.random() * 8,
        grab: false,
      });
    }
    return arr;
  });

  const pointer = useRef({ x: 0, y: 0, down: false, dragging: -1 });

  useEffect(() => {
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    let w = (cvs.width = cvs.clientWidth);
    let h = (cvs.height = cvs.clientHeight);

    const onResize = () => {
      w = cvs.width = cvs.clientWidth;
      h = cvs.height = cvs.clientHeight;
    };
    window.addEventListener("resize", onResize);

    const gravity = 0.35;      // feels nice in a short nav
    const bounce = 0.45;       // ground bounce
    const friction = 0.98;     // horizontal damping
    const wallBounce = 0.7;

    const step = () => {
      // physics
      for (let i = 0; i < rocks.length; i++) {
        const r = rocks[i];

        // dragging logic
        if (pointer.current.dragging === i) {
          r.x = pointer.current.x;
          r.y = pointer.current.y;
          r.vx = 0;
          r.vy = 0;
        } else {
          r.vy += gravity;
          r.x += r.vx;
          r.y += r.vy;
        }

        // walls
        if (r.x - r.r < 6) {
          r.x = 6 + r.r;
          r.vx = Math.abs(r.vx) * wallBounce;
        } else if (r.x + r.r > w - 6) {
          r.x = w - 6 - r.r;
          r.vx = -Math.abs(r.vx) * wallBounce;
        }

        // floor
        if (r.y + r.r > h - 6) {
          r.y = h - 6 - r.r;
          r.vy *= -bounce;
          r.vx *= friction;
        }

        // simple rock–rock separation (cheap)
        for (let j = i + 1; j < rocks.length; j++) {
          const s = rocks[j];
          const dx = s.x - r.x;
          const dy = s.y - r.y;
          const dist = Math.hypot(dx, dy);
          const min = s.r + r.r;
          if (dist > 0 && dist < min) {
            const pull = (min - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            r.x -= nx * pull;
            r.y -= ny * pull;
            s.x += nx * pull;
            s.y += ny * pull;
          }
        }
      }

      // draw
      ctx.clearRect(0, 0, w, h);
      // little pebbly texture shadow
      for (let i = 0; i < rocks.length; i++) {
        const r = rocks[i];
        ctx.beginPath();
        ctx.arc(r.x + 1, r.y + 1, r.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fill();
      }
      for (let i = 0; i < rocks.length; i++) {
        const r = rocks[i];
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.fillStyle = "#bba98d"; // rock color (tan/river stone)
        ctx.fill();
        // highlight
        ctx.beginPath();
        ctx.arc(r.x - r.r * 0.3, r.y - r.r * 0.3, r.r * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    // pointer events
    const ptFromEvent = (e) => {
      const rect = cvs.getBoundingClientRect();
      pointer.current.x = e.clientX - rect.left;
      pointer.current.y = e.clientY - rect.top;
    };

    const down = (e) => {
      ptFromEvent(e);
      pointer.current.down = true;
      // pick nearest rock under pointer
      let hit = -1, best = Infinity;
      for (let i = 0; i < rocks.length; i++) {
        const r = rocks[i];
        const d = Math.hypot(r.x - pointer.current.x, r.y - pointer.current.y);
        if (d <= r.r + 6 && d < best) { best = d; hit = i; }
      }
      pointer.current.dragging = hit;
    };
    const move = (e) => { ptFromEvent(e); };
    const up = () => {
      pointer.current.down = false;
      pointer.current.dragging = -1;
    };

    cvs.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      cvs.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [rocks]);

  return (
    <nav className="ground-nav">
      {/* Uneven top ridge that overlaps the grass */}
      <svg className="ground-ridge" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden>
        <path
          d="M0,60 C120,40 240,70 360,45 C480,20 600,65 720,40 C840,15 960,55 1080,30 C1140,20 1200,30 1200,30 L1200,0 L0,0 Z"
          fill="var(--ground-color)"
        />
      </svg>

      <div className="ground-inner">
        <a href="#home">Home</a>
        <a href="#blog">Blog</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>

        {/* Rocks canvas sits behind links */}
        <canvas ref={canvasRef} className="ground-rocks" />
      </div>
    </nav>
  );
}