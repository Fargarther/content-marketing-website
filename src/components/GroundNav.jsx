import React, { useEffect, useRef, useState, useCallback } from "react";
import { navLinks } from "../data/navLinks";
import { rocks as rockData, generatePebbleVertices, getRockColor } from "../data/rocks";
import "./GroundNav.css";

const ENABLE_ROCK_DRAG = true; // Enable gentle drag for front rocks only

export default function GroundNav() {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const rafRef = useRef(null);
  const [rockPositions, setRockPositions] = useState([]);
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');
  const parallaxOffset = useRef({ x: 0, y: 0 });
  const gustDecay = useRef([]);

  // Get Y position along the ridge path
  const getRidgeY = useCallback((normalizedX) => {
    const svg = svgRef.current;
    if (!svg) return 60;
    
    const path = svg.querySelector('path');
    if (!path) return 60;
    
    const pathLength = path.getTotalLength();
    const point = path.getPointAtLength(normalizedX * pathLength);
    
    // Transform from SVG viewBox (0-1200) to actual position
    const svgWidth = 1200;
    const actualWidth = window.innerWidth;
    const scale = actualWidth / svgWidth;
    
    // The ridge SVG is 80px tall, positioned at top: -48px
    // We want rocks to sit near the top of the ridge curve
    return -48 + (point.y * scale) - 10; // Offset up by 10px to sit on ridge
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#home');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Initialize rock positions
  useEffect(() => {
    const initRocks = () => {
      const width = window.innerWidth;
      const positions = rockData.map(rock => {
        const pixelX = rock.x * width;
        const ridgeY = getRidgeY(rock.x);
        
        // Add small random vertical offset
        const yOffset = (Math.random() - 0.5) * 8;
        
        return {
          ...rock,
          pixelX,
          pixelY: ridgeY + yOffset,
          vertices: generatePebbleVertices(rock.seed, rock.w, rock.h),
          color: getRockColor(rock.hue, rock.z)
        };
      });
      
      // Sort by layer (back to front)
      positions.sort((a, b) => a.z - b.z);
      setRockPositions(positions);
      
      // Initialize gust decay for each rock
      gustDecay.current = positions.map(() => ({ x: 0, y: 0, decay: 0 }));
    };

    initRocks();
    window.addEventListener('resize', initRocks);
    return () => window.removeEventListener('resize', initRocks);
  }, [getRidgeY]);

  // Draw rocks with parallax
  const drawRocks = useCallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    
    rockPositions.forEach((rock, index) => {
      const gust = gustDecay.current[index];
      
      // Apply parallax based on layer
      const parallaxMultiplier = rock.z === 0 ? 0.25 : rock.z === 1 ? 0.5 : 1.0;
      const offsetX = parallaxOffset.current.x * parallaxMultiplier + gust.x;
      const offsetY = gust.y;
      
      // Transform to canvas position
      const centerX = rock.pixelX + offsetX;
      const centerY = rock.pixelY + offsetY + 48; // Adjust for canvas position
      
      ctx.save();
      ctx.translate(centerX, centerY);
      
      // Create pebble path
      ctx.beginPath();
      rock.vertices.forEach((v, i) => {
        if (i === 0) {
          ctx.moveTo(v.x, v.y);
        } else {
          ctx.lineTo(v.x, v.y);
        }
      });
      ctx.closePath();
      
      // Layer-based opacity
      const opacity = rock.z === 0 ? 0.6 : rock.z === 1 ? 0.8 : 1.0;
      ctx.globalAlpha = opacity;
      
      // Fill with earth tone
      const { hue, saturation, lightness } = rock.color;
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fill();
      
      // Add subtle highlight
      const gradient = ctx.createRadialGradient(
        -rock.w * 0.2, -rock.h * 0.2, 0,
        0, 0, Math.max(rock.w, rock.h)
      );
      gradient.addColorStop(0, `hsla(${hue}, ${saturation - 10}%, ${lightness + 15}%, 0.3)`);
      gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add soft shadow
      ctx.globalAlpha = opacity * 0.3;
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness - 20}%)`;
      ctx.translate(1, 2);
      ctx.fill();
      
      ctx.restore();
    });
  }, [rockPositions]);

  // Animation loop
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    
    const ctx = cvs.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    
    const resize = () => {
      const w = cvs.clientWidth;
      const h = cvs.clientHeight;
      cvs.width = w * dpr;
      cvs.height = h * dpr;
      cvs.style.width = `${w}px`;
      cvs.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      return { w, h };
    };
    
    let { w, h } = resize();
    
    const animate = () => {
      // Update gust decay
      gustDecay.current.forEach(gust => {
        if (gust.decay > 0) {
          gust.decay *= 0.95;
          if (gust.decay < 0.01) {
            gust.x = 0;
            gust.y = 0;
            gust.decay = 0;
          } else {
            gust.x *= 0.98;
            gust.y *= 0.96;
          }
        }
      });
      
      drawRocks(ctx, w, h);
      rafRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Optional drag for front rocks only
    let draggingIndex = -1;
    
    const pickNearestFrontRock = (x, y) => {
      let best = Infinity, hit = -1;
      rockPositions.forEach((r, i) => {
        if (r.z !== 2) return; // front layer only
        const dx = (r.pixelX + 0) - x;
        const dy = (r.pixelY + 48) - y; // same offset used in draw
        const d = Math.hypot(dx, dy);
        if (d < 28 && d < best) { best = d; hit = i; } // ~touch radius
      });
      return hit;
    };
    
    const onPointerDown = (e) => {
      if (!ENABLE_ROCK_DRAG) return;
      const rect = cvs.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      draggingIndex = pickNearestFrontRock(x, y);
      if (draggingIndex !== -1) e.preventDefault();
    };
    
    const onPointerMove = (e) => {
      if (!ENABLE_ROCK_DRAG || draggingIndex === -1) return;
      const rect = cvs.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // constrain slightly so rocks stay near the ridge
      rockPositions[draggingIndex].pixelX = x;
      rockPositions[draggingIndex].pixelY = y - 48;
    };
    
    const onPointerUp = () => { draggingIndex = -1; };
    
    cvs.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    
    // Listen for carousel gust with positional effect
    const handleCarouselGust = (e) => {
      const focusX = e.detail?.x ?? window.innerWidth / 2;
      const radius = Math.max(180, window.innerWidth * 0.18);
      const sigma = radius / 2;
      
      rockPositions.forEach((rock, index) => {
        // Only affect mid and front layers
        if (rock.z === 0) return;
        
        const dx = rock.pixelX - focusX;
        const weight = Math.exp(-(dx * dx) / (2 * sigma * sigma));
        
        // Small nudge away from center
        gustDecay.current[index] = {
          x: (dx > 0 ? 1 : -1) * weight * 3,
          y: -weight * 2,
          decay: 1
        };
      });
    };
    
    window.addEventListener('carousel-gust', handleCarouselGust);
    window.addEventListener('resize', () => {
      ({ w, h } = resize());
    });
    
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('carousel-gust', handleCarouselGust);
      cvs.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [rockPositions, drawRocks]);

  return (
    <div className="ground-nav">
      {/* Enhanced uneven top ridge with more dramatic variations */}
      <svg 
        ref={svgRef}
        className="ground-ridge" 
        viewBox="0 0 1200 80" 
        preserveAspectRatio="none" 
        aria-hidden="true"
      >
        <path
          d="M0,55 
             C80,35 120,25 200,45 
             C280,65 320,20 400,35 
             C480,50 520,15 600,40 
             C680,65 720,25 800,30 
             C880,35 920,55 1000,25 
             C1080,10 1140,35 1200,40 
             L1200,80 L0,80 Z"
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

        {/* Rocks canvas sits behind links */}
        <canvas ref={canvasRef} className="ground-rocks" aria-hidden="true" />
      </div>
    </div>
  );
}