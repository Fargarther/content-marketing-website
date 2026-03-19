import React, { useRef, useEffect } from 'react';
import { spriteUrl } from '../sprites/grass';
import { sampleWindField } from '../utils/valueNoise1D';
import grassManifest from '../data/grassManifest.json';
import './PrairieGrass.css';

// Configuration constants for tuning organic motion
const BAND_WIDTH = 80;         // cohorts for de-sync
const SPATIAL_LAG = 0.002;
const LOCAL_SIN_AMP = 0.006;
const NOISE_AMP = 0.008;

// Chunking Configuration
// We divide the world into chunks of roughly 1 screen width (e.g., 1920px).
// This allows us to quickly query "which bucket of blades is visible?"
const CHUNK_SIZE = 2000;

// Performance tier detection
const isChromeBrowser = typeof navigator !== "undefined" && /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
const isFirefoxBrowser = typeof navigator !== "undefined" && /Firefox/.test(navigator.userAgent);
const PERF_TIER = isFirefoxBrowser ? "medium" : "high";
const DENSITY_MULT = 1;
const DPR_CAP = 1.5;

// Progressive rendering constants
const PLACEHOLDER_ALPHA = 0.55;

// Cached gradient for performance
let __phGrad = null;

// ---- passive sway tuning ----
const SWAY_SPEED = 0.65;
const PASSIVE_TAU = 0.16;
const MAX_RATE_DEG_PER_S = 28;
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
  const a = hash1((i * 57.0) + seed * 0.123);
  const b = hash1(((i + 1) * 57.0) + seed * 0.123);
  return lerp(a, b, smoothstep01(f));
}

function getPassiveSway(blade, tSec) {
  if (!blade._sway) {
    const seed = blade.seed ?? (blade._seed ??= Math.abs(Math.sin((blade.x || 0) * 12.92 + (blade.baseY || 0) * 0.173)) * 1000);
    const r = (m) => { const s = Math.sin(seed * m) * 43758.5453; return s - Math.floor(s); };
    const sign = r(31.7) < 0.5 ? -1 : 1;
    const size = Math.max(0.6, Math.min(1.8, blade.scale ?? 1));

    blade._sway = {
      seed,
      phase: (r(7.9) + 0.15) * Math.PI * 2,
      freq: 0.25 + r(11.3) * 0.40,
      bias: deg2rad(sign * (2 + r(19.1) * 4)),
      amp: deg2rad((4 + r(23.9) * 7) * (0.7 + size * 0.6)),
      wanderSpeed: 0.007 + r(5.5) * 0.013,
      wanderAmp: deg2rad(1 + r(13.1) * 2),
      size
    };
  }

  const sw = blade._sway;
  const s = Math.sin((tSec * SWAY_SPEED) * sw.freq + sw.phase);
  const slow = Math.sin(tSec * 0.07 + sw.seed) * deg2rad(0.8 * 0.5);
  const wn = valueNoise1D((tSec * SWAY_SPEED) * sw.wanderSpeed, sw.seed * 97.3) * 2 - 1;
  const dof = 0.7 + Math.min(1.5, sw.size * 0.8);
  const ampNow = ((sw.amp * (1 + 0.35 * wn) + sw.wanderAmp * wn) * dof * 0.5) + (blade.swayBoost || 0);

  return sw.bias + slow + s * ampNow;
}

const BREEZE_LEVELS = {
  subtle: 1.1,
  medium: 1.6,
  lively: 2.1
};

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

// Flat ridge sample for a straight grass baseline
function sampleRidgeY(normalizedX, groundHeight = 140) {
  const baseY = groundHeight * 0.78;
  return baseY;
}

const PrairieGrass = ({ breeze = 'medium', spanCount = 1, scrollVelocityRef, trackRef, scrollStateRef, isPaused = false, onWheel } = {}) => {
  const backCanvasRef = useRef(null);
  const frontCanvasRef = useRef(null);
  const pointerRef = useRef({ x: null, y: null });
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationRef = useRef(null);
  const isPausedRef = useRef(isPaused);
  const startAnimationRef = useRef(null);
  const stopAnimationRef = useRef(null);

  // Ref holds the chunks: { index: [blades] }
  // We use an object or Map for sparse storage, though array is fine if continuous.
  // Using an object for flexibility.
  const chunksRef = useRef({});
  const totalWidthRef = useRef(0);

  const observerRef = useRef(null);
  const isVisibleRef = useRef(true);
  const pageVisibleRef = useRef(true);
  const spritesReadyCountRef = useRef(0);
  const groundColorRef = useRef('#c4b5a0');
  const groundHeightRef = useRef(140);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      if (stopAnimationRef.current) stopAnimationRef.current();
    } else if (startAnimationRef.current) {
      startAnimationRef.current();
    }
  }, [isPaused]);

  useEffect(() => {
    // Load images asynchronously
    const loadImagesProgressive = () => {
      const imageCache = window.grassImageCache || {};
      window.grassImageCache = imageCache;

      const bladeNames = grassManifest.blades.map(b => b.name);
      const budNames = grassManifest.buds.map(b => b.name);

      bladeNames.forEach(name => {
        const url = spriteUrl(name);
        if (url) {
          const img = new Image();
          img.decoding = 'async';
          if ('fetchPriority' in img) img.fetchPriority = 'high';
          img.src = url;
          img.onload = () => {
            imageCache[`blade_${name}`] = img;
            spritesReadyCountRef.current++;
          };
          imageCache[`blade_${name}`] = img;
        }
      });

      budNames.forEach(name => {
        const url = spriteUrl(name);
        if (url) {
          const img = new Image();
          img.decoding = 'async';
          img.src = url;
          img.onload = () => {
            imageCache[`bud_${name}`] = img;
            spritesReadyCountRef.current++;
          };
          imageCache[`bud_${name}`] = img;
        }
      });
    };

    loadImagesProgressive();
  }, []);

  useEffect(() => {
    const cssColor = getComputedStyle(document.documentElement).getPropertyValue('--ground-color');
    if (cssColor) groundColorRef.current = cssColor.trim() || groundColorRef.current;

    const cssHeight = getComputedStyle(document.documentElement).getPropertyValue('--ground-height');
    const parsedHeight = parseFloat(cssHeight);
    if (!Number.isNaN(parsedHeight)) groundHeightRef.current = parsedHeight;
  }, []);

  useEffect(() => {
    const backCanvas = backCanvasRef.current;
    const frontCanvas = frontCanvasRef.current;
    if (!backCanvas || !frontCanvas) return;

    const backCtx = backCanvas.getContext('2d');
    const frontCtx = frontCanvas.getContext('2d');
    if (!backCtx || !frontCtx) return;

    // Update Canvas to match Viewport, NOT World
    const updateCanvasSize = () => {
      const W = window.innerWidth; // Fixed viewport width
      const H = 260;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

      const sizeCanvas = (targetCanvas, targetCtx) => {
        targetCanvas.width = W * dpr;
        targetCanvas.height = H * dpr;
        targetCanvas.style.width = `${W}px`;
        targetCanvas.style.height = `${H}px`;
        targetCtx.setTransform(1, 0, 0, 1, 0, 0);
        targetCtx.scale(dpr, dpr);
      };

      sizeCanvas(backCanvas, backCtx);
      sizeCanvas(frontCanvas, frontCtx);

      // Total world width for blade generation
      const totalW = Math.max(window.innerWidth * spanCount, window.innerWidth);
      totalWidthRef.current = totalW;

      return { W, H, totalW };
    };

    let { W, H, totalW } = updateCanvasSize();

    // Create grass instances bucketed into chunks
    const initializeGrass = (worldWidth) => {
      const chunks = {};
      const imageCache = window.grassImageCache || {};
      const bladeImages = grassManifest.blades.map(b => imageCache[`blade_${b.name}`] || null);
      const budImages = grassManifest.buds.map(b => imageCache[`bud_${b.name}`] || null);
      const groundH = groundHeightRef.current || 140;
      const baseBaseline = groundH * 0.78;
      const riseScale = (H / groundH) * 0.75;
      const ridgeAt = (x) => sampleRidgeY(x / worldWidth, groundH);
      const baseYForX = (x) => {
        const ridgeY = ridgeAt(x);
        const rise = baseBaseline - ridgeY;
        const y = (H - 4) - rise * riseScale;
        return Math.max(0, Math.min(H - 1, y));
      };

      const NONPOD_MIN = 0.40, NONPOD_MAX = 0.72;
      const POD_LEAF_MIN = 0.35, POD_LEAF_MAX = 0.55;

      const bladeTypes = {
        short: { probability: 0.40, scaleRange: [NONPOD_MIN, NONPOD_MIN + 0.15], leanRange: [-0.25, 0.25], canHaveBud: false },
        medium: { probability: 0.35, scaleRange: [NONPOD_MIN + 0.15, NONPOD_MAX - 0.1], leanRange: [-0.28, 0.28], canHaveBud: true },
        tall: { probability: 0.25, scaleRange: [NONPOD_MAX - 0.1, NONPOD_MAX], leanRange: [-0.3, 0.3], canHaveBud: true }
      };

      const selectBladeType = () => {
        const rand = Math.random();
        if (rand < bladeTypes.short.probability) return bladeTypes.short;
        if (rand < bladeTypes.short.probability + bladeTypes.medium.probability) return bladeTypes.medium;
        return bladeTypes.tall;
      };

      const screenWidthFactor = Math.min(worldWidth / 1920, 1.5);
      // Note: Density logic relies on loop. Since we're iterating world width, apply density normally.

      const layers = [
        { density: 70 * DENSITY_MULT, opacity: 0.5, zIndex: 0, speedFactor: 0.6 }, // Was 45
        { density: 50 * DENSITY_MULT, opacity: 0.85, zIndex: 1, speedFactor: 1.0 }, // Was 30
        { density: 35 * DENSITY_MULT, opacity: 1.0, zIndex: 2, speedFactor: 1.4 }  // Was 18
      ];

      let totalBladesCreated = 0;
      let budBladesCreated = 0;

      layers.forEach((layer) => {
        // Just use base density per pixel roughly
        // If density is 45, it means 1 blade every 45px *on average*? No, density usually means blades per width unit?
        // Code used: count = width / density. So density is "pixels per blade".
        const count = Math.floor(worldWidth / layer.density);

        for (let i = 0; i < count; i++) {
          if (Math.random() < 0.15) continue;

          // x position
          const baseX = (i / count) * worldWidth;
          const x = baseX + (Math.random() - 0.5) * layer.density * 0.8;

          const bladeType = selectBladeType();
          let hasBud = false;
          if (bladeType.canHaveBud) {
            const targetBudRatio = 0.1;
            const currentBudRatio = totalBladesCreated > 0 ? budBladesCreated / totalBladesCreated : 0;
            const budProbability = currentBudRatio < targetBudRatio ? 0.15 : 0.08;
            hasBud = Math.random() < budProbability;
          }

          let scale;
          if (hasBud && bladeType.canHaveBud) {
            scale = POD_LEAF_MIN + Math.random() * (POD_LEAF_MAX - POD_LEAF_MIN);
          } else {
            scale = bladeType.scaleRange[0] + Math.random() * (bladeType.scaleRange[1] - bladeType.scaleRange[0]);
          }

          if (hasBud) budBladesCreated++;
          totalBladesCreated++;

          const naturalLean = hasBud ? (Math.random() - 0.5) * 0.3 : bladeType.leanRange[0] + Math.random() * (bladeType.leanRange[1] - bladeType.leanRange[0]);

          const normH = Math.min(1, Math.max(0, scale));
          let heightReact = 0.9 + 0.45 * normH;
          if (hasBud) heightReact *= 0.75;

          const blade = {
            x: x,
            baseY: baseYForX(x),
            scale,
            angle: 0,
            velocity: 0,
            targetAngle: 0,
            naturalLean,
            swayOffset: Math.random() * Math.PI * 2,
            opacity: layer.opacity,
            zIndex: layer.zIndex,
            speedFactor: layer.speedFactor, // Important for parallax culling
            bladeImage: bladeImages.filter(img => img)[Math.floor(Math.random() * Math.max(1, bladeImages.filter(img => img).length))] || null,
            budImage: hasBud ? (budImages.filter(img => img)[Math.floor(Math.random() * Math.max(1, budImages.filter(img => img).length))] || null) : null,
            swayIntensity: 0.65 + Math.random() * 0.7,
            bladeType: bladeType === bladeTypes.short ? 'short' : (bladeType === bladeTypes.medium ? 'medium' : 'tall'),
            seed: Math.random(),
            variability: 0.75 + Math.random() * 0.5,
            stiffnessVar: 0.05 + Math.random() * 0.05,
            decayGustAngle: 0.92 + Math.random() * 0.05,
            decaySwayBoost: 0.93 + Math.random() * 0.04,
            gustAngle: 0,
            swayBoost: 0,
            heightReact: heightReact,
            timeScale: 0.65 + Math.random() * 1.2,
            phaseJitter: Math.random() * Math.PI * 2,
            temporalJitter: 0.005 + Math.random() * 0.015,
            cohort: Math.floor(x / BAND_WIDTH) % 3,
            dampingVar: 0.85 + Math.random() * 0.07,
            // Pre-calculate chunk index for fast lookup
            // Note: We use original world X for chunking
            chunkIndex: Math.floor(x / CHUNK_SIZE)
          };

          // Add to chunk
          if (!chunks[blade.chunkIndex]) chunks[blade.chunkIndex] = [];
          chunks[blade.chunkIndex].push(blade);

          // ... (Omitting cluster generation for brevity/safety - complex logic duplication risk. 
          // If clusters are critical, we can add them, but for "Attempt 2" safety, simple blades first. 
          // Actually, clusters add richness. I'll include a simplified cluster logic.)

          if (hasBud) {
            const clusterCount = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < clusterCount; j++) {
              const angle = (j / clusterCount) * Math.PI * 2;
              const dist = 5 + Math.random() * 20;
              const cX = x + Math.cos(angle) * dist;
              // Add cluster blade
              const cBlade = { ...blade, x: cX, chunkIndex: Math.floor(cX / CHUNK_SIZE), budImage: null, bladeType: 'cluster', opacity: layer.opacity * 0.9 };
              if (!chunks[cBlade.chunkIndex]) chunks[cBlade.chunkIndex] = [];
              chunks[cBlade.chunkIndex].push(cBlade);
            }
          }
        }
      });

      // Sort each chunk by Z-index/height for painter's algorithm
      Object.values(chunks).forEach(chunk => {
        chunk.sort((a, b) => {
          if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
          if (a.budImage && !b.budImage) return -1;
          if (!a.budImage && b.budImage) return 1;
          return b.scale - a.scale;
        });
      });

      return chunks;
    };

    chunksRef.current = initializeGrass(totalW);

    const baseDamping = 0.92;
    const BREEZE = BREEZE_LEVELS[breeze] ?? BREEZE_LEVELS.medium;

    const drawFrame = (ts) => {
      // Frame throttle for non-Chrome
      if (PERF_TIER !== "high") {
        if (!drawFrame._lastDraw) drawFrame._lastDraw = 0;
        if (ts - drawFrame._lastDraw < 33) { animationRef.current = requestAnimationFrame(drawFrame); return; }
        drawFrame._lastDraw = ts;
      }
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = (ts - lastTimeRef.current) / 1000;
      lastTimeRef.current = ts;
      const cdt = Math.min(dt, 0.05);
      timeRef.current = (timeRef.current + cdt) % 1000000000;
      const t = timeRef.current; // seconds

      if (isPausedRef.current || !pageVisibleRef.current) {
        animationRef.current = null;
        return;
      }

      if (!isVisibleRef.current) {
        animationRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      backCtx.clearRect(0, 0, W, H);
      frontCtx.clearRect(0, 0, W, H);

      // Wind Math
      const ultraLow = Math.sin(t * 0.12) * 0.009 * BREEZE;
      const drift = -0.005 * Math.sin(t * 0.05) * BREEZE;
      const windBase = ultraLow + drift + Math.sin(t) * 0.014 * BREEZE + Math.sin(t * 0.7) * 0.009 * BREEZE;

      const scrollLeft = scrollStateRef?.current?.scrollLeft || 0;
      const viewportW = backCanvas.width / Math.min(window.devicePixelRatio || 1, 1.5);

      // Spatial Chunking Logic
      // Blades move by: drawX = blade.x - scroll * speedFactor.
      // We want visible blades where: -pad < drawX < viewportW + pad
      // -pad < blade.x - scroll * speed < viewportW + pad
      // scroll * speed - pad < blade.x < viewportW + pad + scroll * speed

      // Min speed is 0.6, Max is 1.4.
      // To be safe, we must cover the UNION of possible ranges.
      // Minimum possible X that could be visible (fastest parallax scrolling it on screen? No, slowest parallax leaving it behind?)

      // Left edge boundary (blade enters from right or leaves to left)
      // Smallest X needed: when scroll*0.6 is small. 
      // minX = scrollLeft * 0.6 - 200 (padding)
      // maxX = scrollLeft * 1.4 + viewportW + 200

      const safetyPad = 400;
      // We clip minX to 0 to avoid negative chunks
      const minWorldX = Math.max(0, scrollLeft * 0.6 - safetyPad);
      const maxWorldX = scrollLeft * 1.4 + viewportW + safetyPad;

      const startChunk = Math.floor(minWorldX / CHUNK_SIZE);
      const endChunk = Math.floor(maxWorldX / CHUNK_SIZE);

      // Mouse/Touch Ptr for Virtual Camera
      // Mouse events give viewport coordinates directly.
      const px = pointerRef.current.x;
      const py = pointerRef.current.y;

      // Scroll velocity for wind
      const sv = Math.min(Math.max((scrollVelocityRef?.current || 0), -100), 100);
      const scrollWind = sv * 0.0050;
      const totalBreeze = Math.min(1.8, BREEZE + Math.abs(scrollWind));

      // Loop only visible chunks
      for (let cI = startChunk; cI <= endChunk; cI++) {
        const chunk = chunksRef.current[cI];
        if (!chunk) continue;

        const len = chunk.length;
        for (let i = 0; i < len; i++) {
          const blade = chunk[i];

          // Calculate Screen Position
          const drawX = blade.x - (scrollLeft * blade.speedFactor);

          // Fine-grain cull (optional, but good for edges of chunks)
          if (drawX < -100 || drawX > viewportW + 100) continue;

          // --- Physics & Drawing (Same as before) ---
          const isSeedHead = !!blade.budImage;
          const seedReduction = isSeedHead ? 0.5 : 1.0;
          const tDrift = t + (blade.temporalJitter || 0) * t;
          const tl = tDrift * blade.timeScale + blade.phaseJitter + blade.x * SPATIAL_LAG;
          const cohortPhase = blade.cohort * 0.6;

          const field = sampleWindField(blade.x, tDrift, cohortPhase) * totalBreeze + scrollWind;
          const noiseTerm = (0.5 * valueNoise1D(blade.x * 0.02 - tl * 0.35, blade.seed * 997) +
            0.35 * valueNoise1D(blade.x * 0.05 + tl * 0.22, blade.seed * 1597)) * NOISE_AMP * blade.variability;

          const horiz = ((blade.x / totalWidthRef.current) - 0.5) * 0.01;

          blade.swayBoost *= blade.decaySwayBoost;
          const effectiveIntensity = Math.min(blade.swayIntensity * (1 + Math.max(0, blade.swayBoost)), 1.5);
          const windEffect = (windBase + field + Math.sin(tl + blade.swayOffset) * LOCAL_SIN_AMP * effectiveIntensity + horiz + noiseTerm) * seedReduction;

          blade.gustAngle *= blade.decayGustAngle;
          blade.targetAngle = (windEffect * 0.60) + blade.gustAngle;

          // Interaction (Screen Space)
          if (px !== null && py !== null) {
            const dx = drawX - px; // Both in viewport space
            const dy = blade.baseY - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              const dir = dx > 0 ? 1 : -1;
              const factor = Math.pow((120 - dist) / 120, 2);
              blade.targetAngle = dir * 0.46 * factor * blade.scale * blade.heightReact + windEffect * 0.35;
            }
          }

          const accel = blade.stiffnessVar * (blade.targetAngle - blade.angle);
          blade.velocity += accel;
          blade.velocity *= (blade.dampingVar || baseDamping);
          blade.angle += blade.velocity;

          // Draw
          const ctx = blade.zIndex === 2 ? frontCtx : backCtx;
          ctx.save();
          if (blade.bladeImage && blade.bladeImage.complete) {
            ctx.translate(drawX, blade.baseY);

            // Passive sway
            blade._tPrev ??= t;
            const dtPass = clamp(t - blade._tPrev, 0.0, 0.05);
            blade._tPrev = t;
            const passiveRaw = getPassiveSway(blade, t);
            const alpha = 1 - Math.exp(-dtPass / PASSIVE_TAU);
            blade._passiveLP ??= passiveRaw;
            const lpC = blade._passiveLP + (passiveRaw - blade._passiveLP) * alpha;
            const limit = MAX_RATE * dtPass;
            blade._passiveLP += clamp(lpC - blade._passiveLP, -limit, limit);

            ctx.rotate(blade.angle + blade.naturalLean + blade._passiveLP + (blade.gustAngle || 0));
            ctx.globalAlpha = blade.opacity;

            const maxBladeH = H * 1.05;
            const bladeH = Math.min(maxBladeH, H * blade.scale);
            const bladeAspect = blade.bladeImage.width / blade.bladeImage.height;
            const bladeW = Math.max(6, bladeH * bladeAspect);

            ctx.drawImage(blade.bladeImage, -bladeW / 2, -bladeH + 6, bladeW, bladeH);

            if (blade.budImage && blade.budImage.complete) {
              const budH = Math.min(Math.max(bladeH * 1.5, H * 0.7), H * 1.1);
              const budAspect = blade.budImage.width / blade.budImage.height;
              const budW = Math.max(6, budH * budAspect);
              ctx.drawImage(blade.budImage, -budW / 2, -budH + 6, budW, budH);
            }
          } else {
            // Placeholder
            const passiveRaw = getPassiveSway(blade, t);
            drawBladePlaceholder(ctx, { ...blade, x: drawX, angle: (blade.angle || 0) + passiveRaw });
          }
          ctx.restore();
        }
      }

      // Recolor
      [backCtx, frontCtx].forEach((ctx) => {
        ctx.save();
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = groundColorRef.current || '#c4b5a0';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      });

      if (!isPausedRef.current) {
        animationRef.current = requestAnimationFrame(drawFrame);
      } else {
        animationRef.current = null;
      }
    };

    // Observers & Events
    observerRef.current = new IntersectionObserver(entries => {
      entries.forEach(e => isVisibleRef.current = e.isIntersecting);
    }, { threshold: 0.1 });
    if (frontCanvas) observerRef.current.observe(frontCanvas);

    const handleResize = () => {
      const ns = updateCanvasSize();
      W = ns.W;
      H = ns.H;
      chunksRef.current = initializeGrass(ns.totalW);
    };

    // Gust Handler
    const handleCarouselGust = (e) => {
      const focusX = e.detail?.x ?? window.innerWidth / 2; // Screen space
      const s = e.detail?.strength ?? 1;
      const dir = e.detail?.direction ?? 1;

      // Gusts are local to screen, so we need to reverse-map to world X if we want to find blades?
      // Or just iterate visible chunks!
      const scrollLeft = trackRef?.current?.scrollLeft || 0;
      // ... Calculate visible chunks same as drawFrame ...
      // Simplified: Iterate ALL chunks? No, expensive. 
      // Iterate visible chunks for gust interaction.
      // For now, let's skip complex gust logic (it's rare) or just do it simple:
      // If gust happens, we might miss off-screen blades, which is fine!

      const safetyPad = 400;
      const minWorldX = Math.max(0, scrollLeft * 0.6 - safetyPad);
      const maxWorldX = scrollLeft * 1.4 + window.innerWidth + safetyPad;
      const startChunk = Math.floor(minWorldX / CHUNK_SIZE);
      const endChunk = Math.floor(maxWorldX / CHUNK_SIZE);

      for (let cI = startChunk; cI <= endChunk; cI++) {
        const chunk = chunksRef.current[cI];
        if (!chunk) continue;
        chunk.forEach(blade => {
          const drawX = blade.x - (scrollLeft * blade.speedFactor);
          const dx = drawX - focusX;
          // ... apply gust math ...
          const radius = 320;
          const sigma = radius * 0.65;
          const weight = Math.exp(-(dx * dx) / (2 * sigma * sigma));
          const rand = 0.9 + (blade.seed * 0.2);
          const scaleFactor = blade.heightReact * blade.variability;
          const seedReduction = blade.budImage ? 0.5 : 1.0;
          blade.swayBoost += 0.18 * s * weight * rand * scaleFactor * seedReduction;
          blade.gustAngle += dir * 0.15 * weight * rand * scaleFactor * seedReduction;
        });
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('carousel-gust', handleCarouselGust);

    // Start Loop
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stopAnimation = () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };

    const startAnimation = () => {
      if (isPausedRef.current) return;
      if (prefersReduced) {
        drawFrame(0);
        stopAnimation();
        return;
      }
      if (!pageVisibleRef.current) return;
      if (!animationRef.current) {
        lastTimeRef.current = 0;
        animationRef.current = requestAnimationFrame(drawFrame);
      }
    };

    startAnimationRef.current = startAnimation;
    stopAnimationRef.current = stopAnimation;

    pageVisibleRef.current = !document.hidden;
    if (!isPausedRef.current) {
      startAnimation();
    }

    const handleVisibility = () => {
      pageVisibleRef.current = !document.hidden;
      if (!pageVisibleRef.current) {
        stopAnimation();
        return;
      }
      if (!isPausedRef.current) startAnimation();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopAnimation();
      if (observerRef.current && frontCanvas) observerRef.current.unobserve(frontCanvas);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('carousel-gust', handleCarouselGust);
      document.removeEventListener('visibilitychange', handleVisibility);
      startAnimationRef.current = null;
      stopAnimationRef.current = null;
    };

  }, [breeze]); // Re-init on breeze change? Maybe overkill but safe.

  // Track pointer globally so foreground elements can stay clickable.
  useEffect(() => {
    const canvas = frontCanvasRef.current;
    if (!canvas) return;

    const updatePointer = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        pointerRef.current.x = null;
        pointerRef.current.y = null;
        return;
      }

      pointerRef.current.x = x;
      pointerRef.current.y = y;
    };

    const handleMouseMove = (e) => updatePointer(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    };
    const clearPointer = () => {
      pointerRef.current.x = null;
      pointerRef.current.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', clearPointer);
    window.addEventListener('touchcancel', clearPointer);
    window.addEventListener('blur', clearPointer);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', clearPointer);
      window.removeEventListener('touchcancel', clearPointer);
      window.removeEventListener('blur', clearPointer);
    };
  }, []);

  useEffect(() => {
    const canvas = frontCanvasRef.current;
    if (!canvas || !onWheel) return;

    const handle = (event) => onWheel(event);
    canvas.addEventListener('wheel', handle, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handle);
    };
  }, [onWheel]);

  return (
    <>
      <div className="prairie-grass-layer prairie-grass-layer-back">
        <canvas
          ref={backCanvasRef}
          className="prairie-grass prairie-grass-back"
          aria-hidden="true"
        />
      </div>
      <div className="prairie-grass-layer prairie-grass-layer-front">
        <canvas
          ref={frontCanvasRef}
          className="prairie-grass prairie-grass-front"
          aria-hidden="true"
        />
      </div>
    </>
  );
};

export default PrairieGrass;
