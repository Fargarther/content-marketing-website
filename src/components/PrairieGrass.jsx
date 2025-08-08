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
          leanRange: [-0.25, 0.25], // Harsh angles for weathered look
          canHaveBud: false // Never on shortest blades
        },
        medium: { 
          probability: 0.35, // 35%
          scaleRange: [NONPOD_MIN + 0.15, NONPOD_MAX - 0.1], // 55-62% of H
          leanRange: [-0.28, 0.28], // Even harsher angles
          canHaveBud: true
        },
        tall: { 
          probability: 0.25, // 25%
          scaleRange: [NONPOD_MAX - 0.1, NONPOD_MAX], // 62-72% of H
          leanRange: [-0.3, 0.3], // Most aggressive angles
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
      
      // Create multiple layers for depth - moderately sparse grass
      const layers = [
        { density: 38, opacity: 0.6, zIndex: 0 }, // Back - moderately sparse
        { density: 30, opacity: 0.8, zIndex: 1 }, // Mid - moderately sparse
        { density: 24, opacity: 1.0, zIndex: 2 }  // Front - moderately sparse
      ];

      let totalBladesCreated = 0;
      let budBladesCreated = 0;

      // Store pod blade positions for clustering
      const podPositions = [];
      
      layers.forEach((layer) => {
        const count = Math.floor(width / layer.density);
        for (let i = 0; i < count; i++) {
          // Skip placing blade 15% of the time for natural gaps
          if (Math.random() < 0.15) continue;
          
          // Heavy jitter for irregular spacing
          const baseX = (i / count) * width;
          const x = baseX + (Math.random() - 0.5) * layer.density * 0.8;
          const bladeType = selectBladeType();
          
          // Determine if this blade should have a bud (reduced to ~10% overall)
          let hasBud = false;
          if (bladeType.canHaveBud) {
            const targetBudRatio = 0.1; // 1 in 10 blades
            const currentBudRatio = totalBladesCreated > 0 ? budBladesCreated / totalBladesCreated : 0;
            // Increase chance if we're below target ratio
            const budProbability = currentBudRatio < targetBudRatio ? 0.15 : 0.08;
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
          
          if (hasBud) {
            budBladesCreated++;
            podPositions.push(x); // Remember pod position for clustering
          }
          totalBladesCreated++;
          
          // Pod blades get less harsh lean
          const naturalLean = hasBud ? 
            (Math.random() - 0.5) * 0.3 : // ±0.15 radians for pods
            bladeType.leanRange[0] + Math.random() * (bladeType.leanRange[1] - bladeType.leanRange[0]);
          
          blades.push({
            x: x,
            baseY: H - 1, // Adjusted to ensure blades sit right at the bottom edge
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
          
          // Create pronounced tufts/clumps around seed pods
          if (hasBud) {
            const clusterCount = 4 + Math.floor(Math.random() * 4); // 4-7 blades for fuller tufts
            
            for (let j = 0; j < clusterCount; j++) {
              // Create concentric rings of blades around the pod
              const angle = (j / clusterCount) * Math.PI * 2; // Distribute around pod
              const distance = 5 + Math.random() * 20; // Distance from pod center (5-25px)
              const clusterX = x + Math.cos(angle) * distance;
              
              // Varied heights within tuft - some medium, some short
              const heightVariation = Math.random();
              let clusterScale;
              if (heightVariation < 0.3) {
                clusterScale = 0.25 + Math.random() * 0.15; // Very short (25-40%)
              } else if (heightVariation < 0.7) {
                clusterScale = 0.4 + Math.random() * 0.2; // Medium (40-60%)
              } else {
                clusterScale = 0.6 + Math.random() * 0.15; // Taller (60-75%)
              }
              
              // Blades lean outward from pod center slightly
              const outwardLean = Math.cos(angle) * 0.1; // Subtle outward lean
              const clusterLean = outwardLean + (Math.random() - 0.5) * 0.3;
              
              blades.push({
                x: clusterX,
                baseY: H - 1,  // Adjusted to ensure proper grounding
                scale: clusterScale,
                angle: 0,
                velocity: 0,
                targetAngle: 0,
                naturalLean: clusterLean,
                swayOffset: Math.random() * Math.PI * 2, // Different sway phase
                opacity: layer.opacity * (0.85 + Math.random() * 0.15), // Varied opacity
                zIndex: layer.zIndex,
                bladeImage: bladeImages[Math.floor(Math.random() * bladeImages.length)],
                budImage: null, // Cluster blades never have buds
                swayIntensity: 0.7 + Math.random() * 0.4, // Varied sway intensity
                bladeType: 'cluster'
              });
            }
            
            // Add a few very close, short blades for density at base
            const baseBladesCount = 2 + Math.floor(Math.random() * 2); // 2-3 base blades
            for (let k = 0; k < baseBladesCount; k++) {
              const baseAngle = Math.random() * Math.PI * 2;
              const baseDistance = 3 + Math.random() * 5; // Very close (3-8px)
              const baseX = x + Math.cos(baseAngle) * baseDistance;
              
              blades.push({
                x: baseX,
                baseY: H - 1,  // Adjusted to ensure proper grounding
                scale: 0.2 + Math.random() * 0.15, // Very short for base
                angle: 0,
                velocity: 0,
                targetAngle: 0,
                naturalLean: (Math.random() - 0.5) * 0.4, // Random harsh angles
                swayOffset: Math.random() * Math.PI * 2,
                opacity: layer.opacity * 0.8,
                zIndex: layer.zIndex + 0.1, // Slightly in front
                bladeImage: bladeImages[Math.floor(Math.random() * bladeImages.length)],
                budImage: null,
                swayIntensity: 0.6 + Math.random() * 0.3,
                bladeType: 'base'
              });
            }
          }
        }
      });

      // Sort blades - buds in back, then by height
      return blades.sort((a, b) => {
        // First sort by zIndex layer
        if (a.zIndex !== b.zIndex) {
          return a.zIndex - b.zIndex;
        }
        
        // Within same layer:
        // Put buds in back (draw first)
        if (a.budImage && !b.budImage) return -1;
        if (!a.budImage && b.budImage) return 1;
        
        // Then sort by height (taller in back)
        return b.scale - a.scale;
      });
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
          // Draw leaf blade - ensure it's anchored at the bottom
          const bladeH = Math.min(H * blade.scale, H * 0.98);
          const bladeAspect = blade.bladeImage.width / blade.bladeImage.height;
          const bladeW = Math.max(6, bladeH * bladeAspect);
          
          // IMPORTANT: Draw blade anchored at bottom with overlap into ground
          // Adding 3px overlap to ensure no floating
          ctx.drawImage(
            blade.bladeImage, 
            -bladeW / 2,     // center horizontally
            -bladeH + 3,     // draw from ground up with 3px overlap into ground
            bladeW, 
            bladeH
          );
          
          // Draw bud from baseline and make it taller than any leaf
          if (blade.budImage && blade.budImage.complete) {
            // Target: at least 1.78x the leaf OR ≥ 92% of canvas height (whichever is bigger)
            // but never clip top
            const targetBudH = Math.max(bladeH * 1.78, H * 0.92);
            const budH = Math.min(Math.round(targetBudH), Math.floor(H - 2)); // 2px safety
            const budAspect = blade.budImage.width / blade.budImage.height;
            const budW = Math.max(6, budH * budAspect);
            
            // baseline-anchored with overlap
            ctx.drawImage(
              blade.budImage,
              -budW / 2,      // center horizontally
              -budH + 3,      // bottom anchored with 3px overlap into ground
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
          // Draw leaf blade (static rendering) - ensure anchored at bottom
          const bladeH = Math.min(H * blade.scale, H * 0.98);
          const bladeAspect = blade.bladeImage.width / blade.bladeImage.height;
          const bladeW = Math.max(6, bladeH * bladeAspect);
          
          // Draw blade anchored at bottom with overlap
          ctx.drawImage(
            blade.bladeImage, 
            -bladeW / 2, 
            -bladeH + 3,  // 3px overlap into ground
            bladeW, 
            bladeH
          );
          
          // Draw bud (static rendering)
          if (blade.budImage && blade.budImage.complete) {
            // Force to minimum 92% of canvas height
            const targetBudH = Math.max(bladeH * 1.78, H * 0.92);
            const budH = Math.min(Math.round(targetBudH), Math.floor(H - 2));
            const budAspect = blade.budImage.width / blade.budImage.height;
            const budW = Math.max(6, budH * budAspect);
            
            // baseline-anchored with overlap
            ctx.drawImage(
              blade.budImage,
              -budW / 2,
              -budH + 3,  // 3px overlap into ground
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