import React, { useRef, useEffect, useState } from 'react';
import grassManifest from '../data/grassManifest.json';
import './PrairieGrass.css';

const PrairieGrass = () => {
  const canvasRef = useRef(null);
  const pointerRef = useRef({ x: null, y: null });
  const timeRef = useRef(0);
  const animationRef = useRef(null);
  const bladesRef = useRef([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const observerRef = useRef(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const loadImages = async () => {
      const imageCache = {};
      const loadPromises = [];

      // Load blade images
      grassManifest.blades.forEach(blade => {
        const url = `${grassManifest.path}blades/${blade.name}${grassManifest.densitySuffix}.${grassManifest.ext}`;
        const img = new Image();
        const promise = new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
        });
        img.src = url;
        imageCache[`blade_${blade.name}`] = img;
        loadPromises.push(promise);
      });

      // Load bud images
      grassManifest.buds.forEach(bud => {
        const url = `${grassManifest.path}buds/${bud.name}${grassManifest.densitySuffix}.${grassManifest.ext}`;
        const img = new Image();
        const promise = new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
        });
        img.src = url;
        imageCache[`bud_${bud.name}`] = img;
        loadPromises.push(promise);
      });

      try {
        await Promise.all(loadPromises);
        window.grassImageCache = imageCache;
        setImagesLoaded(true);
      } catch (err) {
        console.error('Failed to load grass images:', err);
        setImagesLoaded(true); // Continue with fallback rendering
      }
    };

    loadImages();
  }, []);

  useEffect(() => {
    if (!imagesLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const updateCanvasSize = () => {
      const W = window.innerWidth;
      const H = 150;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.scale(dpr, dpr);
      
      return { W, H };
    };

    let { W, H } = updateCanvasSize();

    // Create grass instances with sprites
    const initializeGrass = (width) => {
      const blades = [];
      const bladeImages = grassManifest.blades.map(b => window.grassImageCache[`blade_${b.name}`]);
      const budImages = grassManifest.buds.map(b => window.grassImageCache[`bud_${b.name}`]);
      
      // Create multiple layers for depth
      const layers = [
        { density: 15, scale: [0.4, 0.6], opacity: 0.6, zIndex: 0 }, // Back
        { density: 12, scale: [0.6, 0.8], opacity: 0.8, zIndex: 1 }, // Mid
        { density: 10, scale: [0.8, 1.0], opacity: 1.0, zIndex: 2 }  // Front
      ];

      layers.forEach((layer) => {
        const count = Math.floor(width / layer.density);
        for (let i = 0; i < count; i++) {
          const x = (i / count) * width + (Math.random() - 0.5) * layer.density;
          const scale = layer.scale[0] + Math.random() * (layer.scale[1] - layer.scale[0]);
          const hasBud = Math.random() > 0.7;
          
          blades.push({
            x,
            baseY: H,
            scale,
            angle: 0,
            velocity: 0,
            targetAngle: 0,
            naturalLean: (Math.random() - 0.5) * 0.05,
            swayOffset: Math.random() * Math.PI * 2,
            opacity: layer.opacity,
            zIndex: layer.zIndex,
            bladeImage: bladeImages[Math.floor(Math.random() * bladeImages.length)],
            budImage: hasBud ? budImages[Math.floor(Math.random() * budImages.length)] : null,
            swayIntensity: 0.8 + Math.random() * 0.4
          });
        }
      });

      return blades.sort((a, b) => a.zIndex - b.zIndex);
    };

    bladesRef.current = initializeGrass(W);

    const stiffness = 0.15;
    const damping = 0.88;

    const drawFrame = () => {
      if (!isVisibleRef.current) {
        animationRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      ctx.clearRect(0, 0, W, H);
      
      timeRef.current += 0.015;
      const windBase = Math.sin(timeRef.current) * 0.012 + 
                      Math.sin(timeRef.current * 0.7) * 0.008 +
                      Math.sin(timeRef.current * 1.3) * 0.005;

      bladesRef.current.forEach(blade => {
        const windEffect = windBase + Math.sin(timeRef.current + blade.swayOffset) * 0.01 * blade.swayIntensity;
        
        // Mouse/touch interaction
        blade.targetAngle = 0;
        const px = pointerRef.current.x;
        const py = pointerRef.current.y;
        
        if (px !== null && py !== null) {
          const dx = blade.x - px;
          const dy = blade.baseY - py;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const influence = 100;
          
          if (distance < influence) {
            const direction = dx > 0 ? 1 : -1;
            const factor = Math.pow((influence - distance) / influence, 2);
            blade.targetAngle = direction * 0.4 * factor * blade.scale;
          }
        }
        
        // Spring physics
        const accel = stiffness * (blade.targetAngle - blade.angle);
        blade.velocity += accel;
        blade.velocity *= damping;
        blade.angle += blade.velocity;
        
        // Draw blade
        ctx.save();
        ctx.translate(blade.x, blade.baseY);
        ctx.rotate(blade.angle + blade.naturalLean + windEffect);
        ctx.globalAlpha = blade.opacity;
        
        if (blade.bladeImage && blade.bladeImage.complete) {
          const height = blade.bladeImage.height * blade.scale;
          const width = blade.bladeImage.width * blade.scale;
          ctx.drawImage(blade.bladeImage, -width / 2, -height, width, height);
          
          if (blade.budImage && blade.budImage.complete) {
            const budHeight = blade.budImage.height * blade.scale * 0.8;
            const budWidth = blade.budImage.width * blade.scale * 0.8;
            ctx.drawImage(blade.budImage, -budWidth / 2, -height - budHeight * 0.7, budWidth, budHeight);
          }
        } else {
          // Fallback rendering
          ctx.strokeStyle = '#6b7d5f';
          ctx.lineWidth = 2 * blade.scale;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -60 * blade.scale);
          ctx.stroke();
        }
        
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(drawFrame);
    };

    // Set up IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );

    if (canvas) {
      observerRef.current.observe(canvas);
    }

    // Check for reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReduced) {
      animationRef.current = requestAnimationFrame(drawFrame);
    } else {
      // Draw static grass
      ctx.clearRect(0, 0, W, H);
      bladesRef.current.forEach(blade => {
        ctx.save();
        ctx.translate(blade.x, blade.baseY);
        ctx.rotate(blade.naturalLean);
        ctx.globalAlpha = blade.opacity;
        
        if (blade.bladeImage && blade.bladeImage.complete) {
          const height = blade.bladeImage.height * blade.scale;
          const width = blade.bladeImage.width * blade.scale;
          ctx.drawImage(blade.bladeImage, -width / 2, -height, width, height);
        }
        
        ctx.restore();
      });
    }

    const handleResize = () => {
      const newSize = updateCanvasSize();
      W = newSize.W;
      H = newSize.H;
      bladesRef.current = initializeGrass(W);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (observerRef.current && canvas) observerRef.current.unobserve(canvas);
      window.removeEventListener('resize', handleResize);
    };
  }, [imagesLoaded]);

  const handleMouseMove = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerRef.current.x = e.clientX - rect.left;
    pointerRef.current.y = e.clientY - rect.top;
  };

  const handleMouseLeave = () => {
    pointerRef.current.x = null;
    pointerRef.current.y = null;
  };

  const handleTouchMove = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    pointerRef.current.x = touch.clientX - rect.left;
    pointerRef.current.y = touch.clientY - rect.top;
  };

  const handleTouchEnd = () => {
    pointerRef.current.x = null;
    pointerRef.current.y = null;
  };

  return (
    <div className="prairie-grass-container">
      <canvas
        ref={canvasRef}
        className="prairie-grass"
        aria-hidden="true"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

export default PrairieGrass;