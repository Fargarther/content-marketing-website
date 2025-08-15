import React, { useRef, useEffect } from 'react';
import { spriteUrl } from '../sprites/grass';
import { sampleWindField } from '../utils/valueNoise1D';
import grassManifest from '../data/grassManifest.json';
import './PrairieGrass.css';

// Configuration constants for tuning organic motion
const BAND_WIDTH = 80;         // cohorts for de-sync
// Reduced spatial lag to prevent jitter from large phase shifts
const SPATIAL_LAG = 0.002;
// Lower sine amplitude to calm the base oscillation
const LOCAL_SIN_AMP = 0.006;
// Lower noise amplitude for smoother motion
const NOISE_AMP = 0.008;

// Progressive rendering constants
const PLACEHOLDER_ALPHA = 0.55; // Opacity for vector fallback

// Cached gradient for performance
let __phGrad = null;

// ---- passive sway tuning ----
const SWAY_SPEED = 0.65;             // <1 slows everything (try 0.5..0.8)
const PASSIVE_TAU = 0.16;            // seconds; low-pass time constant (0.12..0.2)
const MAX_RATE_DEG_PER_S = 28;       // max passive angle change speed
const MAX_RATE = (Math.PI / 180) * MAX_RATE_DEG_PER_S;

// ---- math & noise helpers ----
const deg2rad = (d) => d * Math.PI / 180;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep01 = (t) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };

// Stable 0..1 hash
function hash1(n) { const s = Math.sin(n) * 43758.5453123; return s - Math.floor(s); }

// Continuous 1D value noise (0..1)
function valueNoise1D(x, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash1((i     * 57.0) + seed * 0.123);
  const b = hash1(((i+1) * 57.0) + seed * 0.123);
  return lerp(a, b, smoothstep01(f));
}

function getPassiveSway(blade, tSec) {
  if (!blade._sway) {
    const seed = blade.seed ?? (blade._seed ??= Math.abs(Math.sin((blade.x||0)*12.92 + (blade.baseY||0)*0.173)) * 1000);
    const r = (m) => { const s = Math.sin(seed * m) * 43758.5453; return s - Math.floor(s); };
    const sign = r(31.7) < 0.5 ? -1 : 1;
    const size = Math.max(0.6, Math.min(1.8, blade.scale ?? 1));

    blade._sway = {
      seed,
      phase: (r(7.9) + 0.15) * Math.PI * 2,
      // SLOWER base freq & wander than before:
      freq:  0.25 + r(11.3) * 0.40,           // 0.25..0.65 Hz
      bias:  deg2rad(sign * (2 + r(19.1) * 4)),    // ±2..6°
      amp:   deg2rad((4 + r(23.9) * 7) * (0.7 + size*0.6)), // 4..11° scaled by size
      wanderSpeed: 0.007 + r(5.5) * 0.013,    // 0.007..0.02
      wanderAmp:   deg2rad(1 + r(13.1) * 2),  // +1..3°
      size
    };
  }

  const sw = blade._sway;

  // Reduced sway distance by 90% total and slowed speed by 98% (keeping only 2% of original speed)
  // slow sinusoid (scaled by SWAY_SPEED and heavily reduced frequency)
  const s = Math.sin((tSec * SWAY_SPEED * 0.02) * sw.freq + sw.phase);
  // very slow drift (reduced amplitude by 90% and speed by 98%)
  const slow = Math.sin(tSec * 0.07 * 0.02 + sw.seed) * deg2rad(0.8 * 0.1);
  // continuous wander in [-1,1] (scaled by SWAY_SPEED and heavily reduced speed)
  const wn = valueNoise1D((tSec * SWAY_SPEED * 0.02) * sw.wanderSpeed, sw.seed * 97.3) * 2 - 1;

  // subtle DOF scaling by blade size
  const dof = 0.7 + Math.min(1.5, sw.size * 0.8);
  // Reduced amplitude by 90% total (keeping only 10%)
  const ampNow = ((sw.amp * (1 + 0.35 * wn) + sw.wanderAmp * wn) * dof * 0.1) + (blade.swayBoost || 0);

  return sw.bias + slow + s * ampNow; // radians
}

// Breeze intensity levels (scales amplitudes only, not desync)
const BREEZE_LEVELS = {
  subtle: 1.1,
  medium: 1.6,
  lively: 2.1
};

// Helper: Draw vector placeholder for blades without loaded sprites
function drawBladePlaceholder(ctx, blade) {
  const { x, baseY, angle = 0, naturalLean = 0, scale = 1, opacity = 1 } = blade;
  const h = 60 * scale;
  const lean = Math.max(-0.8, Math.min(0.8, (angle + naturalLean) * 0.9));

  if (!__phGrad) {
    __phGrad = ctx.createLinearGradient(0, 0, 0, 100);
    __phGrad.addColorStop(0, '#114d2b');
    __phGrad.addColorStop(1, '#1a6b3a');
  }

  ctx.save();
  ctx.globalAlpha = Math.min(1, opacity * PLACEHOLDER_ALPHA);
  ctx.fillStyle = __phGrad;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(
    x - h * 0.25 * (0.5 + lean), baseY - h * 0.55,
    x + h * 0.08 * lean, baseY - h
  );
  ctx.quadraticCurveTo(
    x + h * 0.16 * lean, baseY - h * 0.55,
    x, baseY
  );
  ctx.fill();
  ctx.restore();
}

const PrairieGrass = ({ breeze = 'medium' } = {}) => {
  const canvasRef = useRef(null);
  const pointerRef = useRef({ x: null, y: null });
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationRef = useRef(null);
  const bladesRef = useRef([]);
  const observerRef = useRef(null);
  const isVisibleRef = useRef(true);
  const spritesReadyCountRef = useRef(0);

  useEffect(() => {
    // Load images asynchronously without blocking render
    const loadImagesProgressive = () => {
      const imageCache = {};
      window.grassImageCache = imageCache; // Make available immediately
      
      // Get all sprite names from manifest
      const bladeNames = grassManifest.blades.map(b => b.name);
      const budNames = grassManifest.buds.map(b => b.name);
      
      // Load blade sprites with high priority
      bladeNames.forEach(name => {
        const url = spriteUrl(name);
        if (url) {
          const img = new Image();
          img.decoding = 'async';
          if ('fetchPriority' in img) img.fetchPriority = 'high';
          img.src = url; // Start request
          img.onload = () => {
            imageCache[`blade_${name}`] = img;
            spritesReadyCountRef.current++;
          };
          imageCache[`blade_${name}`] = img; // Add immediately (may not be complete)
        }
      });
      
      // Load bud sprites with normal priority
      budNames.forEach(name => {
        const url = spriteUrl(name);
        if (url) {
          const img = new Image();
          img.decoding = 'async';
          img.src = url; // Start request
          img.onload = () => {
            imageCache[`bud_${name}`] = img;
            spritesReadyCountRef.current++;
          };
          imageCache[`bud_${name}`] = img; // Add immediately (may not be complete)
        }
      });
      
      // Log progress in development
      if (import.meta.env.DEV) {
        const totalSprites = bladeNames.length + budNames.length;
        const checkProgress = setInterval(() => {
          const loaded = spritesReadyCountRef.current;
          console.log(`[PrairieGrass] Sprites loaded: ${loaded}/${totalSprites}`);
          if (loaded >= totalSprites) clearInterval(checkProgress);
        }, 1000);
      }
    };

    loadImagesProgressive();
  }, []);

  useEffect(() => {
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
      // Safely access image cache, use empty array if not ready
      const imageCache = window.grassImageCache || {};
      const bladeImages = grassManifest.blades.map(b => imageCache[`blade_${b.name}`] || null);
      const budImages = grassManifest.buds.map(b => imageCache[`bud_${b.name}`] || null);
      
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
            bladeImage: bladeImages.filter(img => img)[Math.floor(Math.random() * Math.max(1, bladeImages.filter(img => img).length))] || null,
            budImage: hasBud ? (budImages.filter(img => img)[Math.floor(Math.random() * Math.max(1, budImages.filter(img => img).length))] || null) : null,
            swayIntensity: 0.65 + Math.random() * 0.7,  // Widened by ~25% for more variation
            bladeType: bladeType === bladeTypes.short ? 'short' : 
                      (bladeType === bladeTypes.medium ? 'medium' : 'tall'),
            // Per-blade variation for natural motion
            seed: Math.random(),                 // stable random for this blade
            variability: 0.75 + Math.random()*0.5,  // Wider range 0.75–1.25
            // Reduce spring stiffness for smoother transitions
            stiffnessVar: 0.05 + Math.random()*0.05,     // 0.05–0.10
            // Increase damping so gust angles and sway boosts decay more
            decayGustAngle: 0.92 + Math.random()*0.05,   // 0.92–0.97
            decaySwayBoost: 0.93 + Math.random()*0.04,   // 0.93–0.97
            gustAngle: 0,                        // additive gust channel
            swayBoost: 0,                        // additive intensity boost
            heightReact: heightReact,             // height reaction factor
            // Per-blade timing for natural desynchronized motion
            timeScale: 0.65 + Math.random() * 1.2,   // Even wider (0.65-1.85) for max desync
            phaseJitter: Math.random() * Math.PI * 2, // random phase offset
            // Lower temporal jitter for calmer per-blade timing
            temporalJitter: 0.005 + Math.random() * 0.015, // 0.005–0.02
            cohort: Math.floor(x / BAND_WIDTH) % 3,  // soft banding for regional variation
            dampingVar: 0.85 + Math.random() * 0.07  // Broader damping (0.85-0.92)
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
                bladeImage: bladeImages.filter(img => img)[Math.floor(Math.random() * Math.max(1, bladeImages.filter(img => img).length))] || null,
                budImage: null, // Cluster blades never have buds
                swayIntensity: 0.55 + Math.random() * 0.7, // Wider variation for clusters
                bladeType: 'cluster',
                // Per-blade variation for natural motion
                seed: Math.random(),
                variability: 0.75 + Math.random()*0.5,
                stiffnessVar: 0.05 + Math.random()*0.05,
                decayGustAngle: 0.92 + Math.random()*0.05,
                decaySwayBoost: 0.93 + Math.random()*0.04,
                gustAngle: 0,
                swayBoost: 0,
                heightReact: clusterHeightReact,
                // Per-blade timing
                timeScale: 0.65 + Math.random() * 1.2, // Max desync
                phaseJitter: Math.random() * Math.PI * 2,
                temporalJitter: 0.005 + Math.random() * 0.015,
                cohort: Math.floor(clusterX / BAND_WIDTH) % 3,
                dampingVar: 0.85 + Math.random() * 0.07
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
                bladeImage: bladeImages.filter(img => img)[Math.floor(Math.random() * Math.max(1, bladeImages.filter(img => img).length))] || null,
                budImage: null,
                swayIntensity: 0.45 + Math.random() * 0.6, // Wider range for base blades
                bladeType: 'base',
                // Per-blade variation for natural motion
                seed: Math.random(),
                variability: 0.75 + Math.random()*0.5,
                stiffnessVar: 0.05 + Math.random()*0.05,
                decayGustAngle: 0.92 + Math.random()*0.05,
                decaySwayBoost: 0.93 + Math.random()*0.04,
                gustAngle: 0,
                swayBoost: 0,
                heightReact: baseHeightReact,
                // Per-blade timing
                timeScale: 0.65 + Math.random() * 1.2, // Max desync
                phaseJitter: Math.random() * Math.PI * 2,
                temporalJitter: 0.005 + Math.random() * 0.015,
                cohort: Math.floor(baseX / BAND_WIDTH) % 3,
                dampingVar: 0.85 + Math.random() * 0.07
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
    const baseDamping = 0.92;
    const BREEZE = BREEZE_LEVELS[breeze] ?? BREEZE_LEVELS.medium;

    const drawFrame = (ts) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = (ts - lastTimeRef.current) / 1000;
      lastTimeRef.current = ts;
      const cdt = Math.min(dt, 0.05);
      timeRef.current = (timeRef.current + cdt) % 1000000000;
      const t = timeRef.current;

      if (!isVisibleRef.current) {
        animationRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      ctx.clearRect(0, 0, W, H);

      const ultraLow = Math.sin(t * 0.12) * 0.009 * BREEZE;
      const drift = -0.005 * Math.sin(t * 0.05) * BREEZE;
      const windBase =
        ultraLow +
        drift +
        Math.sin(t) * 0.014 * BREEZE +
        Math.sin(t * 0.7) * 0.009 * BREEZE +
        Math.sin(t * 1.35) * 0.007 * BREEZE;

      const viewportPadding = 100;
      const visibleBlades = bladesRef.current.filter(
        (blade) => blade.x >= -viewportPadding && blade.x <= W + viewportPadding
      );

      visibleBlades.forEach((blade) => {
        const isSeedHead = !!blade.budImage;
        const seedReduction = isSeedHead ? 0.5 : 1.0;

        // Add temporal jitter to make each blade drift in its own time
        const tDrift = t + (blade.temporalJitter || 0) * t;
        const tl = tDrift * blade.timeScale + blade.phaseJitter + blade.x * SPATIAL_LAG;
        const cohortPhase = blade.cohort * 0.6;
        // Use value noise for more organic wind field
        const field = sampleWindField(blade.x, tDrift, cohortPhase) * BREEZE;

        // Three octaves of value noise for complex micro-variation
        const n1 = valueNoise1D(blade.x * 0.02 - tl * 0.35, blade.seed * 997);
        const n2 = valueNoise1D(blade.x * 0.05 + tl * 0.22, blade.seed * 1597);
        const n3 = valueNoise1D(blade.x * 0.08 - tl * 0.45, blade.seed * 2311);
        const localNoise = 0.5 * n1 + 0.35 * n2 + 0.15 * n3;
        const noiseTerm = localNoise * NOISE_AMP * blade.variability;

        const horiz = ((blade.x / W) - 0.5) * 0.01;

        blade.swayBoost *= blade.decaySwayBoost;
        const effectiveIntensity = Math.min(
          blade.swayIntensity * (1 + Math.max(0, blade.swayBoost)),
          1.5
        );

        const windEffect =
          (windBase + field + Math.sin(tl + blade.swayOffset) * LOCAL_SIN_AMP * effectiveIntensity + horiz + noiseTerm) *
          seedReduction;

        blade.gustAngle *= blade.decayGustAngle;
        const baseTarget = windEffect * 0.60;
        blade.targetAngle = baseTarget + blade.gustAngle;

        const px = pointerRef.current.x;
        const py = pointerRef.current.y;
        if (px !== null && py !== null) {
          const dx = blade.x - px;
          const dy = blade.baseY - py;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const influence = 120;
          if (distance < influence) {
            const direction = dx > 0 ? 1 : -1;
            const factor = Math.pow((influence - distance) / influence, 2);
            const hoverPush = 0.46 * factor * blade.scale * blade.heightReact * blade.variability;
            blade.targetAngle = direction * hoverPush + windEffect * 0.35;
          }
        }

        const accel = blade.stiffnessVar * (blade.targetAngle - blade.angle);
        blade.velocity += accel;
        const damping = blade.dampingVar || baseDamping;
        blade.velocity *= damping;
        blade.angle += blade.velocity;

        ctx.save();
        if (blade.bladeImage && blade.bladeImage.complete) {
          ctx.translate(blade.x, blade.baseY);
          
          // seconds clock
          const tNow = timeRef.current; // already in seconds
          
          // per-blade time step
          blade._tPrev ??= tNow;
          const dt = clamp(tNow - blade._tPrev, 0.0, 0.05); // clamp long stalls
          blade._tPrev = tNow;

          // raw passive (radians)
          const passiveRaw = getPassiveSway(blade, tNow);

          // 1) one-pole low-pass toward the target (tau = PASSIVE_TAU)
          const alpha = 1 - Math.exp(-dt / PASSIVE_TAU);
          blade._passiveLP ??= passiveRaw;
          const lpCandidate = blade._passiveLP + (passiveRaw - blade._passiveLP) * alpha;

          // 2) slew limit: cap max change per frame by MAX_RATE * dt
          const limit = MAX_RATE * dt;
          const delta = clamp(lpCandidate - blade._passiveLP, -limit, limit);
          blade._passiveLP += delta;

          // combine with your existing contributions
          const gust = blade.gustAngle || 0;
          const lean = blade.naturalLean || 0;
          const base = blade.angle || 0;

          ctx.rotate(base + lean + blade._passiveLP + gust);
          ctx.globalAlpha = blade.opacity;

          const bladeH = Math.min(H * blade.scale, H * 0.98);
          const bladeAspect = blade.bladeImage.width / blade.bladeImage.height;
          const bladeW = Math.max(6, bladeH * bladeAspect);
          ctx.drawImage(
            blade.bladeImage,
            -bladeW / 2,
            -bladeH + 3,
            bladeW,
            bladeH
          );

          if (blade.budImage && blade.budImage.complete) {
            const targetBudH = Math.max(bladeH * 1.78, H * 0.92);
            const budH = Math.min(Math.round(targetBudH), Math.floor(H - 2));
            const budAspect = blade.budImage.width / blade.budImage.height;
            const budW = Math.max(6, budH * budAspect);
            ctx.drawImage(
              blade.budImage,
              -budW / 2,
              -budH + 3,
              budW,
              budH
            );
          }
        } else {
          // seconds clock for placeholder blades
          const tNow = timeRef.current;
          
          // per-blade time step
          blade._tPrev ??= tNow;
          const dt = clamp(tNow - blade._tPrev, 0.0, 0.05);
          blade._tPrev = tNow;

          // raw passive (radians)
          const passiveRaw = getPassiveSway(blade, tNow);

          // 1) one-pole low-pass toward the target (tau = PASSIVE_TAU)
          const alpha = 1 - Math.exp(-dt / PASSIVE_TAU);
          blade._passiveLP ??= passiveRaw;
          const lpCandidate = blade._passiveLP + (passiveRaw - blade._passiveLP) * alpha;

          // 2) slew limit: cap max change per frame by MAX_RATE * dt
          const limit = MAX_RATE * dt;
          const delta = clamp(lpCandidate - blade._passiveLP, -limit, limit);
          blade._passiveLP += delta;

          const gust = blade.gustAngle || 0;
          const base = blade.angle || 0;
          drawBladePlaceholder(ctx, {
            ...blade,
            angle: base + blade._passiveLP + gust,
            naturalLean: blade.naturalLean,
          });
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
      // Draw static grass with a snapshot of passive sway
      ctx.clearRect(0, 0, W, H);
      const staticTime = 0; // Fixed time for static render
      bladesRef.current.forEach(blade => {
        ctx.save();
        ctx.translate(blade.x, blade.baseY);
        // Include passive sway even in static mode for visual interest
        const passive = getPassiveSway(blade, staticTime);
        // Initialize the low-pass filter for static mode
        blade._passiveLP = passive;
        ctx.rotate(blade.naturalLean + passive);
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
  }, [breeze]);

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