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
      const H = 180; // Increased height to prevent seed head cutoff
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      
      return { W, H };
    };

    let { W, H } = updateCanvasSize();

    // Create grass instances with sprites
    const initializeGrass = (width) => {
      const blades = [];
      const bladeImages = grassManifest.blades.map(b => window.grassImageCache[`blade_${b.name}`]);
      const budImages = grassManifest.buds.map(b => window.grassImageCache[`bud_${b.name}`]);
      
      // Define blade type categories with distributions
      // Constrain heights so non-pod blades never match pod heights
      const NONPOD_MIN = 0.40, NONPOD_MAX = 0.72; // leaves max at ~72% of H
      const POD_LEAF_MIN = 0.35, POD_LEAF_MAX = 0.55; // pod leaves shorter
      
      const bladeTypes = {
        short: { 
          probability: 0.40, // 40%
          scaleRange: [NONPOD_MIN, NONPOD_MIN + 0.15], // 40-55% of H
          leanRange: [-0.05, 0.05],
          canHaveBud: false // Never on shortest blades
        },
        medium: { 
          probability: 0.35, // 35%
          scaleRange: [NONPOD_MIN + 0.15, NONPOD_MAX - 0.1], // 55-62% of H
          leanRange: [-0.08, 0.08],
          canHaveBud: true
        },
        tall: { 
          probability: 0.25, // 25%
          scaleRange: [NONPOD_MAX - 0.1, NONPOD_MAX], // 62-72% of H
          leanRange: [-0.1, 0.1],
          canHaveBud: true
        }
      };
      
      // Helper to select blade type based on probability
      const selectBladeType = () => {
        const rand = Math.random();
        if (rand < bladeTypes.short.probability) return bladeTypes.short;
        if (rand < bladeTypes.short.probability + bladeTypes.medium.probability) return bladeTypes.medium;
        return bladeTypes.tall;
      };
      
      // Create multiple layers for depth - increased density for sparser initial grass
      const layers = [
        { density: 20, opacity: 0.6, zIndex: 0 }, // Back - sparser
        { density: 16, opacity: 0.8, zIndex: 1 }, // Mid - sparser
        { density: 13, opacity: 1.0, zIndex: 2 }  // Front - sparser
      ];

      let totalBladesCreated = 0;
      let budBladesCreated = 0;

      layers.forEach((layer) => {
        const count = Math.floor(width / layer.density);
        for (let i = 0; i < count; i++) {
          const x = (i / count) * width + (Math.random() - 0.5) * layer.density;
          const bladeType = selectBladeType();
          
          // Determine if this blade should have a bud (maintain ~20% overall)
          let hasBud = false;
          if (bladeType.canHaveBud) {
            const targetBudRatio = 0.2; // 1 in 5 blades
            const currentBudRatio = totalBladesCreated > 0 ? budBladesCreated / totalBladesCreated : 0;
            // Increase chance if we're below target ratio
            const budProbability = currentBudRatio < targetBudRatio ? 0.3 : 0.15;
            hasBud = Math.random() < budProbability;
          }
          
          // Random scale within the blade type's range
          // If has bud, use shorter pod leaf range
          let scale;
          if (hasBud && bladeType.canHaveBud) {
            scale = POD_LEAF_MIN + Math.random() * (POD_LEAF_MAX - POD_LEAF_MIN);
          } else {
            scale = bladeType.scaleRange[0] + 
                   Math.random() * (bladeType.scaleRange[1] - bladeType.scaleRange[0]);
          }
          
          if (hasBud) budBladesCreated++;
          totalBladesCreated++;
          
          const baseJitter = (Math.random() - 0.5) * 6; // keep for subtle x jitter only
          const naturalLean = bladeType.leanRange[0] + 
                             Math.random() * (bladeType.leanRange[1] - bladeType.leanRange[0]);
          
          blades.push({
            x: x + baseJitter * 0.3, // apply jitter to x position only
            baseY: H, // lock to baseline so nothing floats above bottom
            scale,
            angle: 0,
            velocity: 0,
            targetAngle: 0,
            naturalLean,
            swayOffset: Math.random() * Math.PI * 2,
            opacity: layer.opacity,
            zIndex: layer.zIndex,
            bladeImage: bladeImages[Math.floor(Math.random() * bladeImages.length)],
            budImage: hasBud ? budImages[Math.floor(Math.random() * budImages.length)] : null,
            swayIntensity: 0.8 + Math.random() * 0.4,
            bladeType: bladeType === bladeTypes.short ? 'short' : 
                      (bladeType === bladeTypes.medium ? 'medium' : 'tall')
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
        // Only apply wind and interaction to non-seed blades
        if (!blade.budImage) {
          const windEffect = windBase + Math.sin(timeRef.current + blade.swayOffset) * 0.01 * blade.swayIntensity;
          
          // Mouse/touch interaction
          blade.targetAngle = windEffect * 0.5; // Apply wind effect as target
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
              blade.targetAngle = direction * 0.4 * factor * blade.scale + windEffect * 0.5;
            }
          }
        } else {
          // Seed pod blades remain static
          blade.targetAngle = 0;
        }
        
        // Spring physics - only for non-seed blades
        if (!blade.budImage) {
          const accel = stiffness * (blade.targetAngle - blade.angle);
          blade.velocity += accel;
          blade.velocity *= damping;
          blade.angle += blade.velocity;
        } else {
          // Keep seed blades static
          blade.angle = 0;
          blade.velocity = 0;
        }
        
        // Draw blade
        ctx.save();
        ctx.translate(blade.x, blade.baseY);
        // Only rotate non-seed blades with wind; seed blades only get natural lean
        if (!blade.budImage) {
          const windEffect = windBase + Math.sin(timeRef.current + blade.swayOffset) * 0.01 * blade.swayIntensity;
          ctx.rotate(blade.angle + blade.naturalLean + windEffect);
        } else {
          ctx.rotate(blade.naturalLean); // Seed blades only have static lean
        }
        ctx.globalAlpha = blade.opacity;
        
        if (blade.bladeImage && blade.bladeImage.complete) {
          // Draw leaf blade
          const bladeH = Math.min(H * blade.scale, H * 0.98);
          const bladeAspect = blade.bladeImage.width / blade.bladeImage.height;
          const bladeW = Math.max(6, bladeH * bladeAspect);
          
          // Draw blade (anchored bottom-center)
          ctx.drawImage(blade.bladeImage, -bladeW / 2, -bladeH, bladeW, bladeH);
          
          // Draw bud from baseline and make it taller than any leaf
          if (blade.budImage && blade.budImage.complete) {
            // Target: at least 1.78x the leaf OR ≥ 92% of canvas height (whichever is bigger)
            // but never clip top
            const targetBudH = Math.max(bladeH * 1.78, H * 0.92);
            const budH = Math.min(Math.round(targetBudH), Math.floor(H - 2)); // 2px safety
            const budAspect = blade.budImage.width / blade.budImage.height;
            const budW = Math.max(6, budH * budAspect);
            
            // baseline-anchored (so no floating)
            ctx.drawImage(
              blade.budImage,
              -budW / 2,   // center horizontally
              -budH,       // bottom anchored at baseline
              budW,
              budH
            );
          }
        } else {
          // Fallback rendering
          ctx.strokeStyle = '#6b7d5f';
          ctx.lineWidth = 2 * blade.scale;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const fallbackHeight = Math.min(H * blade.scale * 0.6, H * 0.98);
          ctx.lineTo(0, -fallbackHeight);
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
          // Draw leaf blade (static rendering)
          const bladeH = Math.min(H * blade.scale, H * 0.98);
          const bladeAspect = blade.bladeImage.width / blade.bladeImage.height;
          const bladeW = Math.max(6, bladeH * bladeAspect);
          
          // Draw blade (anchored bottom-center)
          ctx.drawImage(blade.bladeImage, -bladeW / 2, -bladeH, bladeW, bladeH);
          
          // Draw bud (static rendering)
          if (blade.budImage && blade.budImage.complete) {
            // Force to minimum 92% of canvas height
            const targetBudH = Math.max(bladeH * 1.78, H * 0.92);
            const budH = Math.min(Math.round(targetBudH), Math.floor(H - 2));
            const budAspect = blade.budImage.width / blade.budImage.height;
            const budW = Math.max(6, budH * budAspect);
            
            // baseline-anchored
            ctx.drawImage(
              blade.budImage,
              -budW / 2,
              -budH,
              budW,
              budH
            );
          }
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