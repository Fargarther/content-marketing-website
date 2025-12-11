import React, { useEffect, useState } from "react";
import { navLinks } from "../data/navLinks";
import "./GroundNav.css";

// Generate a gently rolling ridge for the top of the ground band
const createRidgePath = (width, groundHeight = 180, viewportHeight = 800) => {
  const h = groundHeight;
  const baseY = h * 0.78;
  const amp = Math.min(h * 0.22, Math.max(30, (viewportHeight || 800) * 0.12));
  const pts = [];
  const segs = 48;

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const x = t * width;

    // Two-layer sine for soft hills (no sharp plateau)
    const yOffset =
      Math.sin(t * Math.PI * 2) * amp * 0.55 +
      Math.sin(t * Math.PI * 4 + 1.2) * amp * 0.18;

    // Gentle micro-noise
    const noise = (Math.sin(t * 19) + Math.sin(t * 37) * 0.6) * 2.2;

    const y = baseY - yOffset + noise;
    pts.push({ x, y });
  }

  const move = `M${pts[0].x},${pts[0].y}`;
  const curves = pts
    .slice(1)
    .map((p, i) => {
      const prev = pts[i];
      const dx = p.x - prev.x;
      return `C ${prev.x + dx / 3},${prev.y} ${prev.x + (2 * dx) / 3},${p.y} ${p.x},${p.y}`;
    })
    .join(" ");

  return `${move} ${curves} L ${width},${h} L 0,${h} Z`;
};

export default function GroundNav({ totalWidth, groundHeight, viewportHeight }) {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');
  const [pathWidth, setPathWidth] = useState(() => Math.max(totalWidth || window.innerWidth || 1200, 800));
  const [ridgePath, setRidgePath] = useState(() =>
    createRidgePath(
      Math.max(totalWidth || window.innerWidth || 1200, 800),
      groundHeight || 180,
      viewportHeight || window.innerHeight || 800
    )
  );

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#home');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update ridge path when width changes
  useEffect(() => {
    const width = Math.max(totalWidth || window.innerWidth || 1200, 800);
    setPathWidth(width);
    setRidgePath(createRidgePath(width, groundHeight || 180, viewportHeight || window.innerHeight || 800));
  }, [totalWidth, groundHeight, viewportHeight]);

  return (
    <div className="ground-nav">
      <svg
        className="ground-ridge"
        viewBox={`0 0 ${pathWidth} ${groundHeight || 180}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={ridgePath}
          fill="var(--ground-color)"
        />
      </svg>

      <div className="ground-inner">
        <nav aria-label="Main navigation">
          <ul className="nav-list">
            {navLinks.map((link, index) => {
              const isCurrent = link.href === currentHash;
              return (
                <li key={index}>
                  <a
                    href={link.href}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
