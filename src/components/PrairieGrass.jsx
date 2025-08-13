import React, { useRef, useEffect, useState } from 'react';
import { spriteUrl, getBladeSprites, getBudSprites, preloadSprites, spriteKeys } from '../sprites/grass';
import { sampleWindFieldSines } from '../utils/valueNoise1D';
import grassManifest from '../data/grassManifest.json';
import './PrairieGrass.css';

// Configuration constants for tuning organic motion
const BAND_WIDTH = 180;        // Cohort width in pixels (140-220 works well)
const SPATIAL_LAG = 0.002;     // Spatial phase offset in local time
const FIELD_A = 0.006;         // Primary space-time field amplitude
const FIELD_B = 0.004;         // Secondary space-time field amplitude
const LOCAL_SIN_AMP = 0.011;   // Per-blade sine wave amplitude
const NOISE_AMP = 0.0125;      // Local noise amplitude for variation

// Breeze intensity levels (scales amplitudes only, not desync)
const BREEZE_LEVELS = {
  subtle: 1.3,
  medium: 2.0,
  lively: 2.5
};

const PrairieGrass = ({ breeze = 'medium' } = {}) => {
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
      
      try {
        // Get all sprite names from manifest
        const bladeNames = grassManifest.blades.map(b => b.name);
        const budNames = grassManifest.buds.map(b => b.name);
        
        // Preload all sprites using the new system
        const allNames = [...bladeNames, ...budNames];
        const loadedImages = await preloadSprites(allNames);
        
        // Build cache with expected keys
        bladeNames.forEach(name => {
          const img = loadedImages[name];
          if (img) {
            imageCache[`blade_${name}`] = img;
          } else {
            // Create image from URL if preload failed
            const url = spriteUrl(name);
            if (url) {
              const fallbackImg = new Image();
              fallbackImg.src = url;
              imageCache[`blade_${name}`] = fallbackImg;
            }
          }
        });
        
        budNames.forEach(name => {
          const img = loadedImages[name];
          if (img) {
            imageCache[`bud_${name}`] = img;
          } else {
            // Create image from URL if preload failed
            const url = spriteUrl(name);
            if (url) {
              const fallbackImg = new Image();
              fallbackImg.src = url;
              imageCache[`bud_${name}`] = fallbackImg;
            }
          }
        });
        
        window.grassImageCache = imageCache;
        setImagesLoaded(true);
        
        // Log available sprites in development
        if (import.meta.env.DEV) {
          console.log('[PrairieGrass] Loaded sprites:', Object.keys(imageCache));
        }
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
            heightReact: heightReact,             // height reaction factor
            // Per-blade timing for natural desynchronized motion
            timeScale: 0.90 + Math.random() * 0.35,   // 0.90-1.25 speed variation
            phaseJitter: Math.random() * Math.PI * 2, // random phase offset
            cohort: Math.floor(x / BAND_WIDTH) % 3,  // soft banding for regional variation
            dampingVar: 0.87 + Math.random() * 0.04  // 0.87-0.91 damping variation
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
                heightReact: clusterHeightReact,
                // Per-blade timing
                timeScale: 0.90 + Math.random() * 0.35,
                phaseJitter: Math.random() * Math.PI * 2,
                cohort: Math.floor(clusterX / BAND_WIDTH) % 3,
                dampingVar: 0.87 + Math.random() * 0.04
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
                heightReact: baseHeightReact,
                // Per-blade timing
                timeScale: 0.90 + Math.random() * 0.35,
                phaseJitter: Math.random() * Math.PI * 2,
                cohort: Math.floor(baseX / BAND_WIDTH) % 3,
                dampingVar: 0.87 + Math.random() * 0.04
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

    // Base damping (individual blades will vary)
    const baseDamping = 0.89;
    const BREEZE = BREEZE_LEVELS[breeze] ?? BREEZE_LEVELS.medium;

    const drawFrame = () => {
      if (!isVisibleRef.current) {
        animationRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      ctx.clearRect(0, 0, W, H);
      
      // Faster animation tick for more fluid motion
      timeRef.current += 0.022;
      
      // Multi-frequency wind with ultra-low "breathing" swell
      const ultraLow = Math.sin(timeRef.current * 0.12) * 0.012 * BREEZE;
      const drift = -0.008 * Math.sin(timeRef.current * 0.05) * BREEZE;
      const windBase = ultraLow + drift +
                      Math.sin(timeRef.current) * 0.018 * BREEZE +
                      Math.sin(timeRef.current * 0.7) * 0.012 * BREEZE +
                      Math.sin(timeRef.current * 1.35) * 0.010 * BREEZE;

      // Skip offscreen blades for performance
      const viewportPadding = 100;
      const visibleBlades = bladesRef.current.filter(blade => 
        blade.x >= -viewportPadding && blade.x <= W + viewportPadding
      );
      
      const t = timeRef.current; // reuse for efficiency
      
      visibleBlades.forEach(blade => {
        // Apply wind to all blades, but less to seed heads
        const isSeedHead = !!blade.budImage;
        const seedReduction = isSeedHead ? 0.5 : 1.0; // Seed heads sway 50% as much
        
        if (true) {  // Apply to all blades now
          // Natural variation: low-frequency spatial/temporal noise per blade
          const nx = blade.x * 0.004 + blade.seed * 3.1;
          
          // Per-blade local time - each blade runs at its own speed and phase
          const tl = t * blade.timeScale + blade.phaseJitter + blade.x * SPATIAL_LAG;
          
          // Space-time wind field using sine-based implementation
          const cohortPhase = blade.cohort * 0.6;
          const seedPhase = blade.seed * 6.283;
          const field = sampleWindFieldSines(blade.x, t, cohortPhase, seedPhase) * BREEZE;
          
          // Local noise driven by per-blade time for desynchronized motion
          const localNoise =
            0.6 * Math.sin(nx + tl * 0.25 + blade.swayOffset * 0.55) +
            0.4 * Math.sin(nx * 1.7 - tl * 0.18 + blade.seed * 5.7);
          const noiseTerm = localNoise * NOISE_AMP * blade.variability;
          
          // Reduced horizontal gradient for subtlety
          const horiz = ((blade.x / W) - 0.5) * 0.01;
          
          // Use effective intensity (with gust boost) and your tuned base + noise
          const maxIntensity = 1.5;
          blade.swayBoost *= blade.decaySwayBoost; // per-blade decay
          const effectiveIntensity = Math.min(
            blade.swayIntensity * (1 + Math.max(0, blade.swayBoost)),
            maxIntensity
          );
          
          const windEffect = (
            windBase
            + field  // Add space-time field variation
            + Math.sin(tl + blade.swayOffset) * LOCAL_SIN_AMP * effectiveIntensity  // Use local time
            + horiz
            + noiseTerm
          ) * seedReduction;  // Apply reduction for seed heads
          
          // Per-blade gust decay and target angle
          blade.gustAngle *= blade.decayGustAngle; // per-blade decay
          
          // Much stronger passive sway for continuous motion
          const baseTarget = windEffect * 0.85;
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
        
        // Spring physics with per-blade stiffness and damping
        const accel = blade.stiffnessVar * (blade.targetAngle - blade.angle);
        blade.velocity += accel;
        // Use per-blade damping for more variation
        const damping = blade.dampingVar || baseDamping;
        blade.velocity *= damping;
        blade.angle += blade.velocity;
        
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
        // Apply gust to all blades, but less to seed heads
        const seedReduction = blade.budImage ? 0.5 : 1.0;

        const dx = blade.x - focusX;
        const weight = Math.exp(-(dx*dx) / (2 * sigma * sigma)); // 0..1

        // Per-blade randomizer so not all blades move equally
        const rand = 0.9 + (blade.seed * 0.2); // narrower range (0.9-1.1)

        // Height and variability scaling
        const scaleFactor = blade.heightReact * blade.variability;

        // Much softer gust that blends with natural sway (reduced for seed heads)
        blade.swayBoost += 0.18 * s * weight * rand * scaleFactor * seedReduction;
        blade.gustAngle += dir * 0.15 * weight * rand * scaleFactor * seedReduction;
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