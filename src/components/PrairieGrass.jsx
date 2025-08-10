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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap DPR for performance
      
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
      
      // Cap blade counts for ultra-wide screens
      const screenWidthFactor = Math.min(width / 1920, 1.5);
      
      // Create multiple layers for depth - moderately sparse grass
      const layers = [
        { density: Math.floor(38 * screenWidthFactor), opacity: 0.6, zIndex: 0 }, // Back - moderately sparse
        { density: Math.floor(30 * screenWidthFactor), opacity: 0.8, zIndex: 1 }, // Mid - moderately sparse
        { density: Math.floor(24 * screenWidthFactor), opacity: 1.0, zIndex: 2 }  // Front - moderately sparse
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
          
          // Reaction factor by height (0.9–1.35), pods reduced
          const normH = Math.min(1, Math.max(0, scale)); // 0..1
          let heightReact = 0.9 + 0.45 * normH;              // 0.9..1.35
          if (hasBud) heightReact *= 0.75;       // pods calmer
          
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
                      (bladeType === bladeTypes.medium ? 'medium' : 'tall'),
            // Per-blade variation for natural motion
            seed: Math.random(),                 // stable random for this blade
            variability: 0.85 + Math.random()*0.3,  // 0.85–1.15
            stiffnessVar: 0.08 + Math.random()*0.06, // per-blade spring (0.08–0.14)
            decayGustAngle: 0.90 + Math.random()*0.06, // 0.90–0.96
            decaySwayBoost: 0.92 + Math.random()*0.05, // 0.92–0.97
            gustAngle: 0,                        // additive gust channel
            swayBoost: 0,                        // additive intensity boost
            heightReact: heightReact              // height reaction factor
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
              
              // Reaction factor for cluster blades
              const clusterNormH = Math.min(1, Math.max(0, clusterScale));
              const clusterHeightReact = 0.9 + 0.45 * clusterNormH;
              
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
                bladeType: 'cluster',
                // Per-blade variation for natural motion
                seed: Math.random(),
                variability: 0.85 + Math.random()*0.3,
                stiffnessVar: 0.08 + Math.random()*0.06,
                decayGustAngle: 0.90 + Math.random()*0.06,
                decaySwayBoost: 0.92 + Math.random()*0.05,
                gustAngle: 0,
                swayBoost: 0,
                heightReact: clusterHeightReact
              });
            }
            
            // Add a few very close, short blades for density at base
            const baseBladesCount = 2 + Math.floor(Math.random() * 2); // 2-3 base blades
            for (let k = 0; k < baseBladesCount; k++) {
              const baseAngle = Math.random() * Math.PI * 2;
              const baseDistance = 3 + Math.random() * 5; // Very close (3-8px)
              const baseX = x + Math.cos(baseAngle) * baseDistance;
              
              const baseScale = 0.2 + Math.random() * 0.15;
              const baseNormH = Math.min(1, Math.max(0, baseScale));
              const baseHeightReact = 0.9 + 0.45 * baseNormH;
              
              blades.push({
                x: baseX,
                baseY: H - 1,  // Adjusted to ensure proper grounding
                scale: baseScale, // Very short for base
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
                bladeType: 'base',
                // Per-blade variation for natural motion
                seed: Math.random(),
                variability: 0.85 + Math.random()*0.3,
                stiffnessVar: 0.08 + Math.random()*0.06,
                decayGustAngle: 0.90 + Math.random()*0.06,
                decaySwayBoost: 0.92 + Math.random()*0.05,
                gustAngle: 0,
                swayBoost: 0,
                heightReact: baseHeightReact
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

    // Keep damping global
    const damping = 0.90;    // was 0.88 - slower response

    const drawFrame = () => {
      if (!isVisibleRef.current) {
        animationRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      ctx.clearRect(0, 0, W, H);
      
      timeRef.current += 0.015;
      // Stronger base sway + slow drift from right to left
      const drift = -0.006 * Math.sin(timeRef.current * 0.05); // slow oscillation, negative = right→left
      const windBase = drift +
                      Math.sin(timeRef.current) * 0.014 +
                      Math.sin(timeRef.current * 0.7) * 0.009 +
                      Math.sin(timeRef.current * 1.3) * 0.007;

      // Skip offscreen blades for performance
      const viewportPadding = 100;
      const visibleBlades = bladesRef.current.filter(blade => 
        blade.x >= -viewportPadding && blade.x <= W + viewportPadding
      );
      
      const t = timeRef.current; // reuse for efficiency
      
      visibleBlades.forEach(blade => {
        // Only apply wind and interaction to non-seed blades
        if (!blade.budImage) {
          // Natural variation: low-frequency spatial/temporal noise per blade
          const nx = blade.x * 0.004 + blade.seed * 3.1;
          const localNoise =
            0.6 * Math.sin(nx + t * 0.25 + blade.swayOffset*0.5) +
            0.4 * Math.sin(nx * 1.7 - t * 0.18 + blade.seed * 5.7);
          const noiseTerm = localNoise * 0.009 * blade.variability; // increased from 0.006
          
          // Subtle left→right gradient so motion travels across width
          const horiz = ((blade.x / W) - 0.5) * 0.010;
          
          // Use effective intensity (with gust boost) and your tuned base + noise
          const maxIntensity = 1.35;
          blade.swayBoost *= blade.decaySwayBoost; // per-blade decay
          const effectiveIntensity = Math.min(
            blade.swayIntensity * (1 + Math.max(0, blade.swayBoost)),
            maxIntensity
          );
          
          const windEffect =
            windBase
            + Math.sin(t + blade.swayOffset) * 0.01 * effectiveIntensity
            + horiz
            + noiseTerm;
          
          // Per-blade gust decay and target angle
          blade.gustAngle *= blade.decayGustAngle; // per-blade decay
          
          const baseTarget = windEffect * 0.50;     // strengthened for visible passive sway
          blade.targetAngle = baseTarget + blade.gustAngle;
          const px = pointerRef.current.x;
          const py = pointerRef.current.y;
          
          if (px !== null && py !== null) {
            const dx = blade.x - px;
            const dy = blade.baseY - py;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const influence = 120; // radius
            
            if (distance < influence) {
              const direction = dx > 0 ? 1 : -1;
              const factor = Math.pow((influence - distance) / influence, 2);
              
              // A bit stronger than last pass, scaled by heightReact & variability
              const hoverPush = 0.46 * factor * blade.scale * blade.heightReact * blade.variability;
              blade.targetAngle = direction * hoverPush + windEffect * 0.35;
            }
          }
        } else {
          // Seed pod blades remain static
          blade.targetAngle = 0;
        }
        
        // Spring physics with per-blade stiffness - only for non-seed blades
        if (!blade.budImage) {
          const accel = blade.stiffnessVar * (blade.targetAngle - blade.angle);
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
        // Rotate based on computed angle + natural lean
        ctx.rotate(blade.angle + blade.naturalLean);
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

    // Listen for carousel wind gust - simplified to use channels
    const handleCarouselGust = (e) => {
      const focusX = e.detail?.x ?? window.innerWidth / 2;
      const s = e.detail?.strength ?? 1;      // from Carousel
      const dir = e.detail?.direction ?? 1;   // +1 = right, -1 = left
      const radius = Math.min(320, window.innerWidth * 0.22); // wider, smoother
      const sigma = radius * 0.65; // slightly smoother falloff

      bladesRef.current.forEach(blade => {
        if (blade.budImage) return;

        const dx = blade.x - focusX;
        const weight = Math.exp(-(dx*dx) / (2 * sigma * sigma)); // 0..1

        // Per-blade randomizer so not all blades move equally
        const rand = 0.9 + (blade.seed * 0.2); // narrower range (0.9-1.1)

        // Height and variability scaling
        const scaleFactor = blade.heightReact * blade.variability;

        // Much softer gust that blends with natural sway
        blade.swayBoost += 0.18 * s * weight * rand * scaleFactor;  // was 0.30
        blade.gustAngle += dir * 0.15 * weight * rand * scaleFactor; // was 0.26
      });
    };
    
    window.addEventListener('carousel-gust', handleCarouselGust);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (observerRef.current && canvas) observerRef.current.unobserve(canvas);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('carousel-gust', handleCarouselGust);
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